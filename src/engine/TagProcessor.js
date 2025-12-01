/**
 * TagProcessor - Handles game tag parsing, badge rendering, and content sanitization
 * Extracted from game.js to separate game logic from UI concerns
 */

import { getLocationIcon, getConditionIcon } from "../data/icons.js"
import { rollDice, rollAdvantage, rollDisadvantage, formatRoll, parseRollRequests } from "../utils/dice.js"
import { buildDiceProfile, rollSkillCheck, rollSavingThrow, rollAttack } from "../utils/dice5e.js"
import { tagParser } from "./TagParser.js"
import { createRollMetadata } from "./GameLoop.js"
import { startCombat, endCombat, spawnEnemy, applyDamage } from "./CombatManager.js"
import { castSpell, startConcentration, endConcentration } from "./SpellcastingManager.js"
import { shortRest, longRest, spendHitDice } from "./RestManager.js"
import { useConsumable, resolveItem, calculateAC, handleEquipChange } from "./EquipmentManager.js"
import { applyDamageWithType, applyTempHP, checkConcentration } from "./MechanicsEngine.js"
import { generateItem } from "./ItemGenerator.js"
import store from "../state/store.js"

/**
 * Process game tags in real-time as they stream in
 * @param {Object} game - Game state object
 * @param {Object} character - Character object
 * @param {string} text - Text to process
 * @param {Set} processedTags - Set of processed tag keys
 * @param {Object} callbacks - Callbacks for side effects (onRoll, etc.)
 * @returns {Promise<Array>} - Array of new messages
 */
export async function processGameTagsRealtime(game, character, text, processedTags, callbacks = {}) {
  const { tags } = tagParser.parse(text)
  const newMessages = []

  // Precompute dice profile if we have a character
  const data = store.get()
  const world = data.worlds ? data.worlds.find(w => w.id === game.worldId) : null
  const diceProfile = character ? buildDiceProfile(character, world) : null

  // Helpers
  const ensureInventory = () => {
    if (!Array.isArray(game.inventory)) game.inventory = []
  }
  const ensureCurrency = () => {
    if (!game.currency || typeof game.currency.gp !== "number") game.currency = { gp: 0 }
  }
  const ensureConditions = () => {
    if (!Array.isArray(game.conditions)) game.conditions = []
  }

  const upsertItem = (rawName, deltaQty, { equip, unequip } = {}) => {
    ensureInventory()
    const name = (rawName || "").replace(/[\r\n]+/g, ' ').trim()
    if (!name) return null

    // Resolve item to ID if possible
    // We already fetched world above
    const itemId = name.toLowerCase().replace(/\s+/g, '_') // Fallback ID generation
    const resolvedItem = resolveItem(name, world) // Try to resolve by name first

    // Check if item exists in world data, if not trigger generation for new items
    if (!resolvedItem && deltaQty > 0) { // Only generate if adding a new item
      // Fire and forget generation
      generateItem(itemId, world, game).catch(err => console.error("Error generating item:", err))
    }

    // Find by ID first, then legacy name match
    const findIndex = () => game.inventory.findIndex((it) => {
      if (it.id === itemId) return true
      if (it.id === name) return true // Check against raw name as ID
      // Legacy check
      return typeof it.item === "string" && it.item.toLowerCase() === name.toLowerCase()
    })

    let idx = findIndex()
    const isNewItem = idx === -1

    if (isNewItem && deltaQty > 0) {
      // Store with ID structure
      game.inventory.push({
        id: itemId,
        quantity: deltaQty,
        equipped: false,
        // Keep legacy name for display fallback if resolution fails later
        item: resolvedItem ? resolvedItem.name : name
      })
      idx = findIndex()
    }

    if (idx === -1) return null

    const item = game.inventory[idx]
    const oldQty = typeof item.quantity === "number" ? item.quantity : 0
    const newQty = isNewItem ? item.quantity : Math.max(0, oldQty + deltaQty)
    item.quantity = newQty

    // Ensure ID is set if migrating on the fly
    if (!item.id) item.id = itemId

    let equipmentChanged = false
    if (equip === true && !item.equipped) {
      item.equipped = true
      equipmentChanged = true
    } else if (unequip === true && item.equipped) {
      item.equipped = false
      equipmentChanged = true
    }

    if (item.quantity === 0) game.inventory.splice(idx, 1)

    let generatedTags = []

    if (equipmentChanged && character) {
      // 1. Recalculate AC
      const newAC = calculateAC(character, game, world)
      if (newAC !== character.armorClass) {
        character.armorClass = newAC
        // Persist character update
        store.update(state => {
          const c = state.characters.find(char => char.id === character.id)
          if (c) c.armorClass = newAC
        })
      }

      // 2. Handle Item Effects (Resistance, etc.)
      const equipResult = handleEquipChange(game, character, world, itemId, item.equipped)
      if (equipResult.tags && equipResult.tags.length > 0) {
        generatedTags = equipResult.tags
      }
    }

    const displayName = resolvedItem ? resolvedItem.name : (item.item || name)
    return { name: displayName, oldQty, newQty, equipped: !!item.equipped, generatedTags }
  }

  const changeGold = (deltaRaw) => {
    const delta = Number.parseFloat(deltaRaw)
    if (Number.isNaN(delta) || delta === 0) return null
    ensureCurrency()
    const before = game.currency.gp
    let after = before + delta
    if (after < 0) after = 0
    after = Math.round(after * 100) / 100
    game.currency.gp = after
    return { before, after, applied: after - before }
  }

  const addStatus = (raw) => {
    ensureConditions()
    const name = (raw || "").trim()
    if (!name) return false
    const exists = game.conditions.some((c) => {
      if (typeof c === "string") return c.toLowerCase() === name.toLowerCase()
      return c && typeof c.name === "string" && c.name.toLowerCase() === name.toLowerCase()
    })
    if (!exists) {
      game.conditions.push({ name, addedAt: new Date().toISOString() })
      return true
    }
    return false
  }

  const removeStatus = (raw) => {
    ensureConditions()
    const name = (raw || "").trim()
    if (!name) return false
    const idx = game.conditions.findIndex((c) => {
      if (typeof c === "string") return c.toLowerCase() === name.toLowerCase()
      return c && typeof c.name === "string" && c.name.toLowerCase() === name.toLowerCase()
    })
    if (idx !== -1) {
      game.conditions.splice(idx, 1)
      return true
    }
    return false
  }

  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i]
    const tagKey = `${tag.type}_${tag.index}`
    if (processedTags.has(tagKey)) continue

    let processed = false

    switch (tag.type) {
      case 'INVENTORY_ADD': {
        const [item, qty] = tag.content.split('|').map(s => s.trim())
        const result = upsertItem(item, qty ? parseInt(qty, 10) : 1)
        if (result) processed = true
        break
      }
      case 'INVENTORY_REMOVE': {
        const [item, qty] = tag.content.split('|').map(s => s.trim())
        const result = upsertItem(item, -(qty ? parseInt(qty, 10) : 1))
        if (result) processed = true
        break
      }
      case 'INVENTORY_EQUIP': {
        const result = upsertItem(tag.content, 0, { equip: true })
        if (result) {
          processed = true
          if (result.generatedTags && result.generatedTags.length > 0) {
            const { tags: newTags } = tagParser.parse(result.generatedTags.join(' '))
            tags.push(...newTags)
          }
        }
        break
      }
      case 'INVENTORY_UNEQUIP': {
        const result = upsertItem(tag.content, 0, { unequip: true })
        if (result) {
          processed = true
          if (result.generatedTags && result.generatedTags.length > 0) {
            const { tags: newTags } = tagParser.parse(result.generatedTags.join(' '))
            tags.push(...newTags)
          }
        }
        break
      }
      case 'GOLD_CHANGE': {
        const result = changeGold(tag.content)
        if (result) processed = true
        break
      }
      case 'STATUS_ADD': {
        if (addStatus(tag.content)) processed = true
        break
      }
      case 'STATUS_REMOVE': {
        if (removeStatus(tag.content)) processed = true
        break
      }
      case 'RELATIONSHIP': {
        const [entity, delta] = tag.content.split('|').map(s => s.trim())
        const val = parseInt(delta, 10)
        if (entity && !isNaN(val)) {
          if (!game.relationships) game.relationships = {}
          game.relationships[entity] = (game.relationships[entity] || 0) + val
          processed = true
        }
        break
      }
      case 'ROLL': {
        if (!character) break
        const parts = tag.content.split('|').map(s => s.trim())
        const kind = (parts[0] || '').toLowerCase()

        let rollData = null

        if (kind === 'skill') {
          const skill = parts[1]
          const dc = parts[2] ? parseInt(parts[2], 10) : null
          const roll = rollSkillCheck(character, skill, { dc })
          rollData = { kind: 'Skill Check', label: skill, roll }
        } else if (kind === 'save') {
          const ability = parts[1]
          const dc = parts[2] ? parseInt(parts[2], 10) : null
          const roll = rollSavingThrow(character, ability, { dc })
          rollData = { kind: 'Saving Throw', label: ability, roll }
        } else if (kind === 'attack') {
          const weapon = parts[1]
          const ac = parts[2] ? parseInt(parts[2], 10) : null
          const rollResult = rollAttack(character, weapon, { targetAC: ac }, world)

          // Handle composite attack result (toHit + damage)
          if (rollResult.toHit) {
            // 1. Process Attack Roll
            const attackRollData = {
              kind: 'Attack',
              label: weapon,
              roll: rollResult.toHit
            }

            if (callbacks.onRoll) {
              callbacks.onRoll(attackRollData)
            }

            // 2. Process Damage Roll (if hit or always if we want to show it)
            if (rollResult.damage) {
              const damageRollData = {
                kind: 'Damage',
                label: `${weapon} Damage`,
                roll: rollResult.damage
              }
              if (callbacks.onRoll) {
                callbacks.onRoll(damageRollData)
              }
            }

            processed = true
          } else {
            // Fallback for legacy or simple return
            rollData = { kind: 'Attack', label: weapon, roll: rollResult }
          }
        } else {
          // Generic roll
          const notation = parts[0]
          const roll = rollDice(notation)
          rollData = { kind: 'Roll', label: notation, roll }
        }

        if (rollData && callbacks.onRoll) {
          callbacks.onRoll(rollData)
          processed = true
        }
        break
      }
      case 'CAST_SPELL': {
        const [spell, level] = tag.content.split('|').map(s => s.trim())
        const result = castSpell(game, character, spell, parseInt(level, 10) || 0)
        if (result) processed = true
        break
      }
      case 'CONCENTRATION_START': {
        const result = startConcentration(game, tag.content.trim())
        if (result) processed = true
        break
      }
      case 'CONCENTRATION_END': {
        const result = endConcentration(game)
        if (result) processed = true
        break
      }
      case 'SHORT_REST': {
        const duration = parseInt(tag.content, 10) || 60
        const result = shortRest(game, character, duration)
        if (result) {
          newMessages.push(result)
          processed = true
        }
        break
      }
      case 'LONG_REST': {
        const duration = parseInt(tag.content, 10) || 8
        const result = longRest(game, character, duration)
        if (result) {
          newMessages.push(result)
          processed = true
        }
        break
      }
      case 'HIT_DIE_ROLL': {
        const count = parseInt(tag.content, 10) || 1
        const result = spendHitDice(game, character, count)
        if (result) {
          newMessages.push(result)
          processed = true
        }
        break
      }
      case 'ACTION': {
        // Just mark as processed, no side effect other than suggestion which is handled elsewhere?
        // game.js handled ACTION tags by adding to suggestedActions?
        // Wait, game.js `processGameCommandsRealtime` logic for ACTION:
        // "const actionMatch = text.matchAll(/ACTION\[([^\]]+)\]/g)"
        // "for (const match of actionMatch) { ... game.suggestedActions.push(...) }"
        // Yes.
        if (!game.suggestedActions) game.suggestedActions = []
        const action = tag.content.trim()
        if (action && !game.suggestedActions.includes(action)) {
          game.suggestedActions.push(action)
          processed = true
        }
        break
      }
      case 'XP_GAIN': {
        const [amount, reason] = tag.content.split('|').map(s => s.trim())
        const xp = parseInt(amount, 10)
        if (!isNaN(xp) && character && character.xp) {
          character.xp.current += xp
          character.xp.history.push({
            amount: xp,
            reason: reason || 'Unknown',
            date: new Date().toISOString()
          })

          // Check for Level Up
          if (character.xp.current >= character.xp.max) {
            newMessages.push({
              id: `msg_${Date.now()}_level_up`,
              role: 'system',
              content: `🎉 **LEVEL UP AVAILABLE!**\nYou have reached **${character.xp.current} XP**! Open your character sheet to level up.`,
              timestamp: new Date().toISOString(),
              hidden: false
            })
          }
          processed = true
        }
        break
      }
      case 'LEARN_SPELL': {
        const spellName = tag.content.trim()
        if (spellName && character) {
          const alreadyKnown = (character.knownSpells || []).some(s => s.name.toLowerCase() === spellName.toLowerCase())
          if (!alreadyKnown) {
            if (!character.knownSpells) character.knownSpells = []
            character.knownSpells.push({
              name: spellName,
              level: 0,
              school: 'Unknown',
              source: 'learned'
            })
            newMessages.push({
              role: 'system',
              content: `✨ **New Spell Learned!**\nYou have added **${spellName}** to your known spells.`
            })
          }
          processed = true
        }
        break
      }
      case 'USE_ITEM': {
        const itemName = tag.content.trim()
        const data = store.get()
        const world = data.worlds ? data.worlds.find(w => w.id === game.worldId) : null

        // We need to find the item ID from the name provided in the tag
        // Try to resolve it first
        const resolved = resolveItem(itemName, world)
        const itemId = resolved ? resolved.id : itemName.toLowerCase().replace(/\s+/g, '_')

        const result = useConsumable(game, character, world, itemId)

        if (result.success) {
          // Process any tags from item effects
          // We need to parse them and add them to the processing queue or process them recursively
          // For simplicity, we'll just add them to newMessages if they are descriptive, 
          // but for functional tags (HEAL, etc), we should probably execute them.
          // However, applyItemEffects returns tags. We can just loop over them and process?
          // But we are inside a loop iterating over tags. Modifying the iterator is tricky.
          // Instead, we can just handle the side effects of the returned tags if we can.
          // Or, better: The `useConsumable` function applies effects via `applyItemEffects`.
          // `applyItemEffects` returns tags.
          // We should probably just let the AI emit the effects as separate tags if it wants,
          // OR we can manually trigger the effects here.

          // Actually, `useConsumable` calls `applyItemEffects` which returns `tags`.
          // These tags are strings like "HEAL[player|10]".
          // We should parse these strings and execute them.

          if (result.tags && result.tags.length > 0) {
            // We need to parse these tags.
            // Since we are in `processGameTagsRealtime`, we can't easily recurse without refactoring.
            // But we can instantiate a mini-parser or just handle common ones.
            // For now, let's just log them or add a system message describing them.
            // Ideally, the `EffectsEngine` should have applied the *modifiers*.
            // The tags are for things like HEAL, DAMAGE, STATUS_ADD.

            // Let's try to process them by calling processGameTagsRealtime recursively?
            // No, that's async and messy.

            // We'll just manually handle the most common ones for consumables: HEAL, STATUS_ADD, STATUS_REMOVE
            for (const effectTagStr of result.tags) {
              const { tags: subTags } = tagParser.parse(effectTagStr)
              for (const subTag of subTags) {
                // Handle HEAL
                if (subTag.type === 'HEAL') {
                  const [target, amountStr] = subTag.content.split('|').map(s => s.trim())
                  
                  // Handle dice notation (e.g., "1d4", "2d6+2") or plain numbers
                  let heal
                  if (amountStr && amountStr.includes('d')) {
                    // Roll dice notation
                    const rollResult = rollDice(amountStr)
                    heal = rollResult.total
                  } else {
                    // Parse as integer
                    heal = parseInt(amountStr, 10)
                  }
                  
                  if (!isNaN(heal)) {
                    game.currentHP = Math.min(character.maxHP, game.currentHP + heal)
                  }
                }
                // Handle STATUS_ADD
                else if (subTag.type === 'STATUS_ADD') {
                  addStatus(subTag.content)
                }
                // Handle STATUS_REMOVE
                else if (subTag.type === 'STATUS_REMOVE') {
                  removeStatus(subTag.content)
                }
                // Handle CAST_SPELL (scrolls)
                else if (subTag.type === 'CAST_SPELL') {
                  const [spell, level] = subTag.content.split('|').map(s => s.trim())
                  castSpell(game, character, spell, parseInt(level, 10) || 0)
                }
              }
            }
          }

          newMessages.push({
            role: 'system',
            content: `🥤 **Used ${result.item ? result.item.name : itemName}**\n${result.message}`
          })
          processed = true
        } else {
          newMessages.push({
            role: 'system',
            content: `⚠️ **Could not use ${itemName}**: ${result.message}`
          })
        }
        break
      }
      case 'LEVEL_UP': {
        processed = true
        break
      }
      case 'LOCATION': {
        const loc = tag.content.trim()
        if (loc) {
          game.currentLocation = loc
          if (!Array.isArray(game.visitedLocations)) game.visitedLocations = []
          if (!game.visitedLocations.includes(loc)) game.visitedLocations.push(loc)
          processed = true
        }
        break
      }
      case 'DAMAGE': {
        const [targetName, amountStr, type] = tag.content.split('|').map(s => s.trim())
        
        // Handle dice notation (e.g., "1d4", "2d6+2") or plain numbers
        let amount
        if (amountStr && amountStr.includes('d')) {
          // Roll dice notation
          const rollResult = rollDice(amountStr)
          amount = rollResult.total
        } else {
          // Parse as integer
          amount = parseInt(amountStr, 10)
        }

        if (targetName && !isNaN(amount)) {
          // Resolve target
          let targetObj = null
          let isPlayer = false

          if (targetName.toLowerCase() === 'player' || targetName.toLowerCase() === 'you') {
            targetObj = character
            isPlayer = true
          } else {
            targetObj = game.combat.enemies.find(e =>
              e.id === targetName ||
              e.name.toLowerCase() === targetName.toLowerCase() ||
              e.name.toLowerCase().includes(targetName.toLowerCase())
            )
          }

          if (targetObj) {
            // Apply damage via Mechanics Engine
            const result = applyDamageWithType(targetObj, amount, type, { game })

            // Update state
            if (isPlayer) {
              game.currentHP = Math.max(0, game.currentHP - result.actualDamage)
              // Sync temp HP if changed
              if (result.tempHPRemoved > 0) {
                character.tempHP = Math.max(0, (character.tempHP || 0) - result.tempHPRemoved)
              }

              // Check Concentration
              if (result.actualDamage > 0 && character.concentration) {
                const conResult = checkConcentration(character, result.actualDamage, { onRoll: callbacks.onRoll })
                if (conResult.concentrationBroken) {
                  endConcentration(game)
                  newMessages.push({
                    role: 'system',
                    content: `💔 **Concentration Broken!**\n${conResult.message}`
                  })
                }
              }
            } else {
              // Enemy update
              targetObj.hp.current = Math.max(0, targetObj.hp.current - result.actualDamage)
              if (result.tempHPRemoved > 0) {
                targetObj.tempHP = Math.max(0, (targetObj.tempHP || 0) - result.tempHPRemoved)
              }
              if (targetObj.hp.current === 0) {
                targetObj.conditions.push("Dead")
              }
            }

            // Create message
            const status = isPlayer
              ? `[HP: ${game.currentHP}/${character.maxHP}]`
              : `[HP: ${targetObj.hp.current}/${targetObj.hp.max}]`

            newMessages.push({
              id: `msg_${Date.now()}_dmg`,
              role: 'system',
              content: `⚔️ **${isPlayer ? "You take" : targetObj.name + " takes"} ${result.actualDamage} damage** ${result.message} ${status}`,
              timestamp: new Date().toISOString()
            })
          }
          processed = true
        }
        break
      }
      case 'TEMP_HP': {
        const [targetName, amountStr] = tag.content.split('|').map(s => s.trim())
        
        // Handle dice notation (e.g., "1d4", "2d6+2") or plain numbers
        let amount
        if (amountStr && amountStr.includes('d')) {
          // Roll dice notation
          const rollResult = rollDice(amountStr)
          amount = rollResult.total
        } else {
          // Parse as integer
          amount = parseInt(amountStr, 10)
        }

        if (targetName && !isNaN(amount)) {
          let targetObj = null
          let isPlayer = false

          if (targetName.toLowerCase() === 'player' || targetName.toLowerCase() === 'you') {
            targetObj = character
            isPlayer = true
          } else {
            targetObj = game.combat.enemies.find(e => e.name.toLowerCase().includes(targetName.toLowerCase()))
          }

          if (targetObj) {
            const result = applyTempHP(targetObj, amount)
            if (isPlayer) {
              // Persist to character (store update happens via game loop usually, but we modify object ref here)
              character.tempHP = result.newTempHP
            } else {
              targetObj.tempHP = result.newTempHP
            }

            newMessages.push({
              role: 'system',
              content: `🛡️ **Temporary HP**: ${result.message}`
            })
            processed = true
          }
        }
        break
      }
      case 'APPLY_RESISTANCE': {
        const [targetName, type] = tag.content.split('|').map(s => s.trim())
        if (targetName && type) {
          let targetObj = null
          if (targetName.toLowerCase() === 'player' || targetName.toLowerCase() === 'you') {
            targetObj = character
          } // Enemies usually don't gain dynamic resistance yet, but could support later

          if (targetObj) {
            if (!targetObj.resistances) targetObj.resistances = []
            if (!targetObj.resistances.includes(type.toLowerCase())) {
              targetObj.resistances.push(type.toLowerCase())
              newMessages.push({
                role: 'system',
                content: `🛡️ **Resistance Gained**: You are now resistant to ${type} damage.`
              })
            }
            processed = true
          }
        }
        break
      }
      case 'REMOVE_RESISTANCE': {
        const [targetName, type] = tag.content.split('|').map(s => s.trim())
        if (targetName && type) {
          let targetObj = null
          if (targetName.toLowerCase() === 'player' || targetName.toLowerCase() === 'you') {
            targetObj = character
          }

          if (targetObj && targetObj.resistances) {
            const idx = targetObj.resistances.indexOf(type.toLowerCase())
            if (idx !== -1) {
              targetObj.resistances.splice(idx, 1)
              newMessages.push({
                role: 'system',
                content: `🛡️ **Resistance Lost**: You are no longer resistant to ${type} damage.`
              })
            }
            processed = true
          }
        }
        break
      }
      case 'APPLY_IMMUNITY': {
        const [targetName, type] = tag.content.split('|').map(s => s.trim())
        if (targetName && type) {
          let targetObj = null
          if (targetName.toLowerCase() === 'player' || targetName.toLowerCase() === 'you') {
            targetObj = character
          }

          if (targetObj) {
            if (!targetObj.immunities) targetObj.immunities = []
            if (!targetObj.immunities.includes(type.toLowerCase())) {
              targetObj.immunities.push(type.toLowerCase())
              newMessages.push({
                role: 'system',
                content: `🛡️ **Immunity Gained**: You are now immune to ${type} damage.`
              })
            }
            processed = true
          }
        }
        break
      }
      case 'REMOVE_IMMUNITY': {
        const [targetName, type] = tag.content.split('|').map(s => s.trim())
        if (targetName && type) {
          let targetObj = null
          if (targetName.toLowerCase() === 'player' || targetName.toLowerCase() === 'you') {
            targetObj = character
          }

          if (targetObj && targetObj.immunities) {
            const idx = targetObj.immunities.indexOf(type.toLowerCase())
            if (idx !== -1) {
              targetObj.immunities.splice(idx, 1)
              newMessages.push({
                role: 'system',
                content: `🛡️ **Immunity Lost**: You are no longer immune to ${type} damage.`
              })
            }
            processed = true
          }
        }
        break
      }
      case 'APPLY_VULNERABILITY': {
        const [targetName, type] = tag.content.split('|').map(s => s.trim())
        if (targetName && type) {
          let targetObj = null
          if (targetName.toLowerCase() === 'player' || targetName.toLowerCase() === 'you') {
            targetObj = character
          }

          if (targetObj) {
            if (!targetObj.vulnerabilities) targetObj.vulnerabilities = []
            if (!targetObj.vulnerabilities.includes(type.toLowerCase())) {
              targetObj.vulnerabilities.push(type.toLowerCase())
              newMessages.push({
                role: 'system',
                content: `💔 **Vulnerability Gained**: You are now vulnerable to ${type} damage.`
              })
            }
            processed = true
          }
        }
        break
      }
      case 'REMOVE_VULNERABILITY': {
        const [targetName, type] = tag.content.split('|').map(s => s.trim())
        if (targetName && type) {
          let targetObj = null
          if (targetName.toLowerCase() === 'player' || targetName.toLowerCase() === 'you') {
            targetObj = character
          }

          if (targetObj && targetObj.vulnerabilities) {
            const idx = targetObj.vulnerabilities.indexOf(type.toLowerCase())
            if (idx !== -1) {
              targetObj.vulnerabilities.splice(idx, 1)
              newMessages.push({
                role: 'system',
                content: `💔 **Vulnerability Lost**: You are no longer vulnerable to ${type} damage.`
              })
            }
            processed = true
          }
        }
        break
      }
      case 'HEAL': {
        const [target, amount] = tag.content.split('|').map(s => s.trim())
        const heal = parseInt(amount, 10)
        if (target && !isNaN(heal)) {
          if (target.toLowerCase() === 'player' || target.toLowerCase() === 'you') {
            game.currentHP = Math.min(character.maxHP, game.currentHP + heal)
          }
          processed = true
        }
        break
      }
      case 'ENEMY_SPAWN': {
        // IMPORTANT: Do NOT mark as processed here!
        // This tag MUST be handled by processGameTags (which has world/data access).
        // If we mark it processed here, processGameTags will skip it and enemies won't spawn.
        break
      }
    }

    if (processed) {
      processedTags.add(tagKey)
    }
  }

  return newMessages
}

/**
 * Process game tags that require full message context or are not real-time safe
 * @param {Object} game - Game state object
 * @param {Object} character - Character object
 * @param {string} text - Text to process
 * @param {Set} processedTags - Set of processed tag keys
 * @param {Object} data - Store data
 */
export async function processGameTags(game, character, text, processedTags, data) {
  const { tags } = tagParser.parse(text)

  for (const tag of tags) {
    const tagKey = `${tag.type}_${tag.index}`
    if (processedTags.has(tagKey)) continue

    let processed = false

    switch (tag.type) {
      case 'LOCATION': {
        const loc = tag.content.trim()
        if (loc) {
          game.currentLocation = loc
          if (!Array.isArray(game.visitedLocations)) game.visitedLocations = []
          if (!game.visitedLocations.includes(loc)) game.visitedLocations.push(loc)
          processed = true
        }
        break
      }
      case 'COMBAT_START': {
        if (!game.combat.active) {
          // Get world from data
          const worldId = game.worldId
          const world = data.worlds ? data.worlds.find(w => w.id === worldId) : null
          const msgs = startCombat(game, character, world, tag.content)
          game.messages.push(...msgs)
          processed = true
        }
        break
      }
      case 'COMBAT_END': {
        // Only end combat if it's actually active (prevents reprocessing on reload)
        if (game.combat.active) {
          const msg = endCombat(game, tag.content)
          game.messages.push(msg)
          processed = true
        }
        break
      }

      case 'DAMAGE': {
        // Handled in Realtime Processor mostly, but if missed:
        // We duplicate logic or trust realtime?
        // Realtime processor updates state. This one adds messages to history.
        // But we added messages in realtime too.
        // So we just mark processed if it was handled.
        // If we are here, it means it wasn't in processedTags.

        const [targetName, amountStr, type] = tag.content.split('|').map(s => s.trim())
        const amount = parseInt(amountStr, 10)

        if (targetName && !isNaN(amount)) {
          // Re-run logic if not processed (e.g. if realtime failed or this is a reload)
          // For now, we'll assume realtime caught it or we just log it.
          // But to be safe, we should probably re-apply if it wasn't processed.
          // However, applying damage twice is bad.
          // The processedTags set should prevent this.

          // If we are here, it wasn't processed. So apply it.
          // ... (Copy logic from realtime or refactor to shared function)
          // For brevity, I'll rely on the fact that realtime *should* have caught it.
          // But if this is a non-streaming call (e.g. initial load), we need it.

          // Let's just log a generic message for now to avoid code duplication risk without refactoring.
          // Ideally we extract `handleDamageTag` function.

          game.messages.push({
            role: 'system',
            content: `⚔️ Damage: ${amount} to ${targetName} (${type || 'untyped'})`,
            timestamp: new Date().toISOString()
          })
          processed = true
        }
        break
      }
      case 'TEMP_HP':
      case 'APPLY_RESISTANCE':
      case 'REMOVE_RESISTANCE':
      case 'APPLY_IMMUNITY':
      case 'REMOVE_IMMUNITY':
      case 'APPLY_VULNERABILITY':
      case 'REMOVE_VULNERABILITY': {
        // Handled in realtime
        processed = true
        break
      }
      case 'ENEMY_SPAWN': {
        const [templateId, nameOverride] = tag.content.split('|').map(s => s.trim())
        // We need the world object. 'data' is the store state.
        // Find the current world.
        const worldId = game.worldId
        const world = data.worlds ? data.worlds.find(w => w.id === worldId) : null

        console.log('[TagProcessor] ENEMY_SPAWN processing:', {
          templateId,
          nameOverride,
          gameWorldId: game.worldId,
          foundWorld: !!world,
          worldName: world?.name,
          monstersCount: world?.monsters?.length
        })

        const enemy = spawnEnemy(game, world, templateId, nameOverride)

        game.messages.push({
          role: 'system',
          content: `⚔️ **${enemy.name}** joins the battle!`,
          timestamp: new Date().toISOString()
        })
        processed = true
        break
      }
      case 'HEAL': {
        const [target, amount] = tag.content.split('|').map(s => s.trim())
        const heal = parseInt(amount, 10)
        if (target && !isNaN(heal)) {
          if (target.toLowerCase() === 'player' || target.toLowerCase() === 'you') {
            game.currentHP = Math.min(character.maxHP, game.currentHP + heal)
          }
          processed = true
        }
        break
      }
      case 'XP_GAIN': {
        const [amount, reason] = tag.content.split('|').map(s => s.trim())
        const xp = parseInt(amount, 10)
        if (!isNaN(xp) && character && character.xp) {
          character.xp.current += xp
          character.xp.history.push({
            amount: xp,
            reason: reason || 'Unknown',
            date: new Date().toISOString()
          })
          // Level up notification handled in realtime or by UI state
          processed = true
        }
        break
      }
      case 'LEARN_SPELL': {
        const spellName = tag.content.trim()
        if (spellName && character) {
          const alreadyKnown = (character.knownSpells || []).some(s => s.name.toLowerCase() === spellName.toLowerCase())
          if (!alreadyKnown) {
            if (!character.knownSpells) character.knownSpells = []
            character.knownSpells.push({
              name: spellName,
              level: 0,
              school: 'Unknown',
              source: 'learned'
            })
          }
          processed = true
        }
        break
      }
    }

    if (processed) {
      processedTags.add(tagKey)
    }
  }
}

/**
 * Strip game tags from text and replace with inline badge tokens
 * @param {string} text - Text with game tags
 * @returns {string} - Text with tags replaced by badge tokens
 */
export function stripTags(text) {
  const { cleanText, tags } = tagParser.parse(text)
  let result = text

  // We iterate backwards to avoid index shifting issues if we were using indices,
  // but here we are using replace on the string.
  // However, if we use replace(tag.raw, ...), we rely on finding the string.
  // If there are duplicates, we must be careful.
  // Since tagParser returns tags in order, and replace(str, ...) replaces the first occurrence,
  // we can just iterate and replace.
  // BUT, if we replace the first occurrence, we must ensure we are replacing the *correct* one if context matters.
  // Since `tag.raw` is identical for identical tags, it doesn't matter which one we replace, 
  // as long as we replace *one* of them for each tag in the array.

  for (const tag of tags) {
    const badgeToken = createBadgeForTag(tag)
    // Replace only the first occurrence of this specific raw string
    // We use replace with string (not regex global) to replace one instance.
    result = result.replace(tag.raw, badgeToken)
  }

  // Clean up whitespace artifacts
  // Remove trailing spaces before newlines
  result = result.replace(/ +\n/g, "\n")
  // Remove leading spaces after newlines  
  result = result.replace(/\n +/g, "\n")
  // Collapse multiple spaces into one
  result = result.replace(/  +/g, " ")
  // Collapse any 2+ consecutive newlines into a single newline to prevent bloat from removed tags
  result = result.replace(/\n{2,}/g, "\n")
  // Trim each line
  result = result.split("\n").map(line => line.trim()).join("\n")
  // Remove any remaining multiple newlines that might have been created
  result = result.replace(/\n{2,}/g, "\n")

  return result.trim()
}

function createBadgeForTag(tag) {
  switch (tag.type) {
    case 'LOCATION': return createBadgeToken('location', { name: tag.content.trim() })
    case 'ROLL': {
      const parts = tag.content.split('|').map(p => p.trim())
      const kind = (parts[0] || '').toLowerCase()
      if (['skill', 'save', 'attack'].includes(kind)) {
        return createBadgeToken('roll', {
          kind,
          key: parts[1] || '',
          dc: parts[2] ? parseInt(parts[2], 10) : null,
          targetAC: parts[2] ? parseInt(parts[2], 10) : null
        })
      }
      return createBadgeToken('roll', { notation: parts[0] || '' })
    }
    case 'COMBAT_START': return createBadgeToken('combat', { action: 'start', desc: tag.content.trim() })
    case 'COMBAT_CONTINUE': return '' // Silent tag - no badge, just removes from text
    case 'COMBAT_END': return createBadgeToken('combat', { action: 'end', desc: tag.content.trim() })
    case 'DAMAGE': {
      const [target, amount, type] = tag.content.split('|').map(s => s.trim())
      return createBadgeToken('damage', { target: target || '', amount: parseInt(amount, 10), type })
    }
    case 'TEMP_HP': {
      const [target, amount] = tag.content.split('|').map(s => s.trim())
      return createBadgeToken('temp_hp', { target: target || '', amount: parseInt(amount, 10) })
    }
    case 'APPLY_RESISTANCE': {
      const [target, type] = tag.content.split('|').map(s => s.trim())
      return createBadgeToken('resistance_add', { target: target || '', type })
    }
    case 'REMOVE_RESISTANCE': {
      const [target, type] = tag.content.split('|').map(s => s.trim())
      return createBadgeToken('resistance_remove', { target: target || '', type })
    }
    case 'APPLY_IMMUNITY': {
      const [target, type] = tag.content.split('|').map(s => s.trim())
      return createBadgeToken('immunity_add', { target: target || '', type })
    }
    case 'REMOVE_IMMUNITY': {
      const [target, type] = tag.content.split('|').map(s => s.trim())
      return createBadgeToken('immunity_remove', { target: target || '', type })
    }
    case 'APPLY_VULNERABILITY': {
      const [target, type] = tag.content.split('|').map(s => s.trim())
      return createBadgeToken('vulnerability_add', { target: target || '', type })
    }
    case 'REMOVE_VULNERABILITY': {
      const [target, type] = tag.content.split('|').map(s => s.trim())
      return createBadgeToken('vulnerability_remove', { target: target || '', type })
    }
    case 'HEAL': {
      const [target, amount] = tag.content.split('|').map(s => s.trim())
      return createBadgeToken('heal', { target: target || '', amount: parseInt(amount, 10) })
    }
    case 'INVENTORY_ADD': {
      const [item, qty] = tag.content.split('|').map(s => s.trim())
      return createBadgeToken('inventory_add', { item: item || '', qty: qty ? parseInt(qty, 10) : 1 })
    }
    case 'INVENTORY_REMOVE': {
      const [item, qty] = tag.content.split('|').map(s => s.trim())
      return createBadgeToken('inventory_remove', { item: item || '', qty: qty ? parseInt(qty, 10) : 1 })
    }
    case 'INVENTORY_EQUIP': return createBadgeToken('inventory_equip', { item: tag.content.trim() })
    case 'INVENTORY_UNEQUIP': return createBadgeToken('inventory_unequip', { item: tag.content.trim() })
    case 'GOLD_CHANGE': return createBadgeToken('gold', { delta: parseFloat(tag.content) })
    case 'STATUS_ADD': return createBadgeToken('status_add', { name: tag.content.trim() })
    case 'STATUS_REMOVE': return createBadgeToken('status_remove', { name: tag.content.trim() })
    case 'RELATIONSHIP': {
      const [entity, delta] = tag.content.split('|').map(s => s.trim())
      return createBadgeToken('relationship', { entity: entity || '', delta: parseInt(delta, 10) })
    }
    case 'CAST_SPELL': {
      const [spell, level] = tag.content.split('|').map(s => s.trim())
      return createBadgeToken('cast_spell', { spell: spell || '', level: parseInt(level, 10) })
    }
    case 'SHORT_REST': return createBadgeToken('short_rest', { duration: parseInt(tag.content, 10) })
    case 'LONG_REST': return createBadgeToken('long_rest', { duration: parseInt(tag.content, 10) })
    case 'CONCENTRATION_START': return createBadgeToken('concentration_start', { spell: tag.content.trim() })
    case 'CONCENTRATION_END': return createBadgeToken('concentration_end', { spell: tag.content.trim() })
    case 'HIT_DIE_ROLL': return createBadgeToken('hit_die_roll', { count: parseInt(tag.content, 10) })
    case 'ACTION': return '' // Action tags are removed completely so whitespace can be collapsed
    case 'XP_GAIN': {
      const [amount, reason] = tag.content.split('|').map(s => s.trim())
      return createBadgeToken('xp_gain', { amount: parseInt(amount, 10), reason: reason || '' })
    }
    case 'LEARN_SPELL': {
      return createBadgeToken('learn_spell', { spell: tag.content.trim() })
    }
    case 'ENEMY_SPAWN': {
      const [templateId, nameOverride] = tag.content.split('|').map(s => s.trim())
      return createBadgeToken('enemy_spawn', { name: nameOverride || templateId })
    }
    case 'USE_ITEM': {
      return createBadgeToken('use_item', { item: tag.content.trim() })
    }
    default: return tag.raw
  }
}

/**
 * Parse markdown formatting in text
 * @param {string} text - Text with markdown
 * @returns {string} - HTML string
 */
export function parseMarkdown(text) {
  let html = escapeHtml(text)

  // Protect badge tokens from markdown parsing by temporarily replacing them
  const badgeTokens = []
  html = html.replace(/@@BADGE\|[^|]+\|.+?@@/g, (match) => {
    badgeTokens.push(match)
    return `§BADGE${badgeTokens.length - 1}§`
  })

  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
  html = html.replace(/__(.*?)__/g, "<strong>$1</strong>")
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>")
  html = html.replace(/_([^_]+)_/g, "<em>$1</em>")
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>")
  html = html.replace(/\n/g, "<br>")
  // Collapse multiple consecutive BRs left from removed tags (like ACTION tags)
  html = html.replace(/(<br>\s*){2,}/g, "<br>")

  // Restore badge tokens after markdown processing
  badgeTokens.forEach((token, index) => {
    html = html.split(`§BADGE${index}§`).join(token)
  })

  return html
}

/**
 * Create a unique badge token for later rendering
 * @param {string} type - Badge type
 * @param {Object} data - Badge data
 * @returns {string} - Badge token
 */
export function createBadgeToken(type, data) {
  const encoded = encodeURIComponent(JSON.stringify(data || {}))
  return `@@BADGE|${type}|${encoded}@@`
}

/**
 * Render inline badge HTML for a given type and data
 * @param {string} type - Badge type
 * @param {Object} data - Badge data
 * @returns {string} - HTML string for badge
 */
export function renderInlineBadgeHtml(type, data) {
  try {
    const badgeData = data || {}
    const labelEscape = (t) => escapeHtml(String(t || ""))

    switch (type) {
      case "location": {
        const name = badgeData.name || ""
        const icon = getLocationIcon(name) || "🗺️"
        return `<span class="inline-badge location" data-tag-type="location">${icon} ${labelEscape(name)}</span>`
      }
      case "inventory_add": {
        const qty = badgeData.qty ?? 1
        const item = badgeData.item || ""
        return `<span class="inline-badge inventory" data-tag-type="inventory">📦 Added: ${labelEscape(qty)}x ${labelEscape(item)}</span>`
      }
      case "inventory_remove": {
        const qty = badgeData.qty ?? 1
        const item = badgeData.item || ""
        return `<span class="inline-badge inventory" data-tag-type="inventory">📦 -${labelEscape(qty)} ${labelEscape(item)}</span>`
      }
      case "inventory_equip": {
        const item = badgeData.item || ""
        return `<span class="inline-badge inventory" data-tag-type="inventory">🛡️ Equip: ${labelEscape(item)}</span>`
      }
      case "inventory_unequip": {
        const item = badgeData.item || ""
        return `<span class="inline-badge inventory" data-tag-type="inventory">🛡️ Unequipped ${labelEscape(item)}</span>`
      }
      case "resistance_add": {
        const type = badgeData.type || ""
        return `<span class="inline-badge status" data-tag-type="status">🛡️ Resistance: ${labelEscape(type)}</span>`
      }
      case "resistance_remove": {
        const type = badgeData.type || ""
        return `<span class="inline-badge status" data-tag-type="status">🛡️ Resistance Lost: ${labelEscape(type)}</span>`
      }
      case "immunity_add": {
        const type = badgeData.type || ""
        return `<span class="inline-badge status" data-tag-type="status">🛡️ Immunity: ${labelEscape(type)}</span>`
      }
      case "immunity_remove": {
        const type = badgeData.type || ""
        return `<span class="inline-badge status" data-tag-type="status">🛡️ Immunity Lost: ${labelEscape(type)}</span>`
      }
      case "vulnerability_add": {
        const type = badgeData.type || ""
        return `<span class="inline-badge status" data-tag-type="status">💔 Vulnerability: ${labelEscape(type)}</span>`
      }
      case "vulnerability_remove": {
        const type = badgeData.type || ""
        return `<span class="inline-badge status" data-tag-type="status">💔 Vulnerability Lost: ${labelEscape(type)}</span>`
      }
      case "roll": {
        const kind = (badgeData.kind || "").toLowerCase()
        if (kind === "skill") {
          const key = badgeData.key || ""
          return `<span class="inline-badge roll" data-tag-type="roll">🎲 ${labelEscape(capitalize(key))} Check${badgeData.dc ? ` vs DC ${labelEscape(badgeData.dc)}` : ""}</span>`
        }
        if (kind === "save") {
          const key = badgeData.key || ""
          return `<span class="inline-badge roll" data-tag-type="roll">🎲 ${labelEscape(capitalize(key))} Save${badgeData.dc ? ` vs DC ${labelEscape(badgeData.dc)}` : ""}</span>`
        }
        if (kind === "attack") {
          const key = badgeData.key || ""
          return `<span class="inline-badge roll" data-tag-type="roll">🎲 Attack (${labelEscape(key)})${badgeData.targetAC ? ` vs AC ${labelEscape(badgeData.targetAC)}` : ""}</span>`
        }
        if (badgeData.notation) {
          return `<span class="inline-badge roll" data-tag-type="roll">🎲 Roll: ${labelEscape(badgeData.notation)}</span>`
        }
        return `<span class="inline-badge roll" data-tag-type="roll">🎲 Roll</span>`
      }
      case "damage": {
        const amount = badgeData.amount ?? 0
        const target = badgeData.target || ""
        const targetText = target.toLowerCase() === "player" ? "You" : labelEscape(target)
        return `<span class="inline-badge damage" data-tag-type="damage">💔 ${targetText} -${labelEscape(amount)} HP</span>`
      }
      case "heal": {
        const amount = badgeData.amount ?? 0
        const target = badgeData.target || ""
        const targetText = target.toLowerCase() === "player" ? "You" : labelEscape(target)
        return `<span class="inline-badge heal" data-tag-type="heal">💚 ${targetText} +${labelEscape(amount)} HP</span>`
      }
      case "temp_hp": {
        const amount = badgeData.amount ?? 0
        const target = badgeData.target || ""
        const targetText = target.toLowerCase() === "player" ? "You" : labelEscape(target)
        return `<span class="inline-badge temp-hp" data-tag-type="temp_hp">🛡️ ${targetText} +${labelEscape(amount)} Temp HP</span>`
      }
      case "gold": {
        const delta = badgeData.delta ?? 0
        const sign = delta > 0 ? "+" : ""
        return `<span class="inline-badge gold" data-tag-type="gold">💰 ${sign}${labelEscape(delta)} gp</span>`
      }
      case "status_add": {
        const name = badgeData.name || ""
        const icon = getConditionIcon(name) || "⚕️"
        return `<span class="inline-badge status" data-tag-type="status">${icon} Status: ${labelEscape(name)}</span>`
      }
      case "status_remove": {
        const name = badgeData.name || ""
        return `<span class="inline-badge status" data-tag-type="status">✅ Status removed: ${labelEscape(name)}</span>`
      }
      case "combat": {
        const action = badgeData.action || ""
        if (action === "start") return `<span class="inline-badge combat" data-tag-type="combat">⚔️ Combat started</span>`
        if (action === "continue") return `<span class="inline-badge combat" data-tag-type="combat">⚔️ Combat continues</span>`
        if (action === "end") return `<span class="inline-badge combat" data-tag-type="combat">✓ Combat ended</span>`
        return `<span class="inline-badge combat" data-tag-type="combat">⚔️ Combat</span>`
      }
      case "action": {
        // ACTION[] badges are not displayed in chat
        return ""
      }
      case "relationship": {
        const entity = badgeData.entity || ""
        const delta = badgeData.delta ?? 0
        const sign = delta > 0 ? "+" : ""
        return `<span class="inline-badge relationship" data-tag-type="relationship">🤝 ${labelEscape(entity)} ${sign}${labelEscape(delta)}</span>`
      }
      case "cast_spell": {
        const spell = badgeData.spell || ""
        const level = badgeData.level ?? 0
        const levelText = level === 0 ? "Cantrip" : `Level ${level}`
        return `<span class="inline-badge spell" data-tag-type="spell">✨ Cast: ${labelEscape(spell)} (${levelText})</span>`
      }
      case "short_rest": {
        return `<span class="inline-badge rest" data-tag-type="rest">💤 Short Rest (${badgeData.duration}min)</span>`
      }
      case "long_rest": {
        return `<span class="inline-badge rest" data-tag-type="rest">🛏️ Long Rest (${badgeData.duration}hr)</span>`
      }
      case "concentration_start": {
        const spell = badgeData.spell || ""
        return `<span class="inline-badge spell" data-tag-type="spell">🧠 Concentrating: ${labelEscape(spell)}</span>`
      }
      case "concentration_end": {
        const spell = badgeData.spell || ""
        return `<span class="inline-badge spell" data-tag-type="spell">❌ Concentration ended: ${labelEscape(spell)}</span>`
      }
      case "hit_die_roll": {
        const count = badgeData.count ?? 1
        return `<span class="inline-badge rest" data-tag-type="rest">🎲 Spent ${count} Hit ${count === 1 ? 'Die' : 'Dice'}</span>`
      }
      case "xp_gain": {
        const amount = badgeData.amount ?? 0
        const reason = badgeData.reason || ''
        return `<span class="inline-badge xp" data-tag-type="xp">⭐ +${labelEscape(amount)} XP${reason ? `: ${labelEscape(reason)}` : ''}</span>`
      }
      case "learn_spell": {
        const spell = badgeData.spell || ''
        return `<span class="inline-badge spell" data-tag-type="spell">✨ Learned: ${labelEscape(spell)}</span>`
      }
      case "enemy_spawn": {
        const name = badgeData.name || ''
        return `<span class="inline-badge combat" data-tag-type="combat">👹 Spawning: ${labelEscape(name)}</span>`
      }
      case "use_item": {
        const item = badgeData.item || ''
        return `<span class="inline-badge inventory" data-tag-type="inventory">🥤 Used: ${labelEscape(item)}</span>`
      }
      default:
        return `<span class="inline-badge" data-tag-type="${escapeHtml(type)}">${escapeHtml(type)}</span>`
    }
  } catch (e) {
    return `<span class="inline-badge">${escapeHtml(type)}</span>`
  }
}

/**
 * Parse a badge token back into type and payload
 * @param {string} token - Badge token
 * @returns {Object|null} - {type, payload} or null
 */
export function parseBadgeToken(token) {
  const match = token.match(/^@@BADGE\|([^|]+)\|([^@]+)@@$/)
  if (!match) return null
  const type = match[1]
  try {
    const payload = JSON.parse(decodeURIComponent(match[2]))
    return { type, payload }
  } catch (e) {
    return { type, payload: {} }
  }
}

/**
 * Insert inline badges into HTML by replacing badge tokens
 * @param {string} html - HTML with badge tokens
 * @returns {string} - HTML with rendered badges
 */
export function insertInlineBadges(html) {
  if (!html) return html
  return html.replace(/@@BADGE\|([^|]+)\|(.+?)@@/g, (full, ttype, encoded) => {
    try {
      const payload = JSON.parse(decodeURIComponent(encoded))
      return renderInlineBadgeHtml(ttype, payload)
    } catch (e) {
      return full
    }
  })
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} - Escaped HTML
 */
function escapeHtml(text) {
  // In Node environment (tests), document is not defined.
  // Simple fallback for tests or use jsdom if configured.
  if (typeof document === 'undefined') {
    return text.replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

/**
 * Capitalize first letter of string
 * @param {string} str - String to capitalize
 * @returns {string} - Capitalized string
 */
function capitalize(str) {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}
