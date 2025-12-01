/**
 * CombatManager - Handles combat state, initiative tracking, and turn management
 * Extracted from game.js to separate combat logic from UI concerns
 */

import { rollDice, formatRoll } from "../utils/dice.js"
import { buildDiceProfile } from "../utils/dice5e.js"
import { MONSTERS } from "../data/monsters.js"
import { generateMonster } from "./MonsterGenerator.js"

/**
 * Initialize combat state for a game
 * @param {Object} game - Game state object
 * @param {Object} character - Character object
 * @param {Object} world - World object (for monster manual)
 * @param {string} description - Combat start description
 * @returns {Array} - Array of system messages to add
 */
export function startCombat(game, character, world, description = "") {
  const messages = []

  // Validate game object
  if (!game || !game.combat) {
    console.error('[CombatManager] Invalid game object in startCombat:', game)
    return messages
  }

  game.combat.active = true
  game.combat.round = 1
  // Don't reset enemies array if it already has enemies! (from ENEMY_SPAWN tags)
  if (!Array.isArray(game.combat.enemies)) {
    game.combat.enemies = []
  }

  // Build initiative entries (player + optional hinted NPCs)
  // IMPORTANT: Preserve any existing initiative entries (from ENEMY_SPAWN tags)
  // BUT remove existing player initiative to force a re-roll on new combat start
  let initiativeEntries = Array.isArray(game.combat.initiative) ? [...game.combat.initiative] : []
  initiativeEntries = initiativeEntries.filter(entry => entry.type !== 'player')

  // Add player's initiative
  if (character) {
    try {
      // Robust stat access - handle both dexterity and dex naming conventions
      const dexValue = character?.stats?.dexterity || character?.stats?.dex || 10
      const dexMod = Math.floor((dexValue - 10) / 2)
      
      console.log('[CombatManager] Rolling player initiative:', {
        characterName: character.name,
        dexValue,
        dexMod
      })
      
      const initRoll = rollDice(`1d20${dexMod >= 0 ? `+${dexMod}` : dexMod}`)
      const meta = createRollMetadata({ sourceType: "initiative" })

      initiativeEntries.push({
        id: `init_player`,
        name: character.name || "Player",
        type: "player",
        roll: initRoll,
        total: initRoll.total,
        ...meta,
      })

      messages.push({
        id: `msg_${meta.rollId}_initiative_player`,
        role: "system",
        content: `⚔️ Initiative (You): ${formatRoll(initRoll)}`,
        timestamp: meta.timestamp,
        hidden: false,
        metadata: {
          diceRoll: initRoll,
          type: "initiative",
          actorType: "player",
          actorName: character.name || "Player",
          ...meta,
        },
      })
    } catch (error) {
      console.error('[CombatManager] Error rolling player initiative:', error, character)
      // Continue without player initiative rather than failing completely
      messages.push({
        id: `msg_${Date.now()}_init_error`,
        role: "system", 
        content: `⚠️ Error rolling initiative for ${character.name || 'Player'}`,
        timestamp: new Date().toISOString(),
        hidden: false,
        metadata: { 
          type: "error", 
          error: error.message,
          actorType: "player"
        }
      })
    }
  } else {
    console.error('[CombatManager] Character is null in startCombat')
  }

  // Add system messages for any enemy initiative rolls that already happened
  // (from ENEMY_SPAWN tags that ran before COMBAT_START)
  const enemyInitiatives = initiativeEntries.filter(entry => entry.type === 'npc')
  enemyInitiatives.forEach(enemyInit => {
    messages.push({
      id: `msg_${enemyInit.rollId || Date.now()}_initiative_${enemyInit.enemyId}`,
      role: "system",
      content: `⚔️ Initiative (${enemyInit.name}): ${formatRoll(enemyInit.roll)}`,
      timestamp: enemyInit.timestamp || new Date().toISOString(),
      hidden: false,
      metadata: {
        diceRoll: enemyInit.roll,
        type: "initiative",
        actorType: "npc",
        actorName: enemyInit.name,
        rollId: enemyInit.rollId
      },
    })
  })

  // Parse enemy names from description for legacy support or initial flavor
  // Note: Real spawning happens via ENEMY_SPAWN tags now, but we keep this for fallback
  const enemyNames = parseEnemyNames(description)

  // If we have names but no explicit spawns yet, we might want to spawn generic versions
  // For now, we'll just let them be "initiative placeholders" if they aren't spawned entities
  // OR we could try to auto-spawn them if they match known monsters.
  // Let's stick to the plan: ENEMY_SPAWN tag drives real spawning. 
  // But if the user says "Combat vs 3 Goblins", we might want to auto-spawn.
  // For this iteration, we will rely on the AI to emit ENEMY_SPAWN. 
  // If it doesn't, we fall back to the old "text-only" initiative.

  if (initiativeEntries.length > 0) {
    initiativeEntries.sort((a, b) => b.total - a.total)
    game.combat.initiative = initiativeEntries
    game.combat.currentTurnIndex = 0

    // Add turn order announcement
    const firstActor = initiativeEntries[0]
    const turnOrderMsg = firstActor.type === "player"
      ? "🎯 You go first! What do you do?"
      : `🎯 ${firstActor.name} goes first!`

    messages.push({
      id: `msg_${Date.now()}_turn_order`,
      role: "system",
      content: turnOrderMsg,
      timestamp: new Date().toISOString(),
      hidden: false,
      metadata: {
        turnOrder: true,
        firstActor: firstActor.type,
        firstActorName: firstActor.name,
        ephemeral: true
      },
    })
  } else {
    game.combat.initiative = []
    game.combat.currentTurnIndex = 0
  }

  messages.push({
    id: `msg_${Date.now()}_combat_start`,
    role: "system",
    content: `⚔️ Combat has begun! ${description || ""}`.trim(),
    timestamp: new Date().toISOString(),
    hidden: false,
    metadata: { combatEvent: "start" },
  })

  return messages
}

/**
 * Spawn an enemy into the combat
 * @param {Object} game - Game state
 * @param {Object} world - World state
 * @param {string} monsterId - ID of the monster template
 * @param {string} nameOverride - Optional name override
 * @returns {Object} - The spawned enemy object
 */
export function spawnEnemy(game, world, monsterId, nameOverride = null) {
  // Initialize combat structure if it doesn't exist
  if (!game.combat) {
    game.combat = { active: false, round: 0, enemies: [], initiative: [], currentTurnIndex: 0 }
  }
  if (!Array.isArray(game.combat.enemies)) {
    game.combat.enemies = []
  }
  if (!Array.isArray(game.combat.initiative)) {
    game.combat.initiative = []
  }

  // 1. Lookup in World Monster Manual
  let template = world?.monsters?.find(m => m.id === monsterId || m.name.toLowerCase() === monsterId.toLowerCase())

  // 2. Lookup in Static DB
  if (!template) {
    template = MONSTERS[monsterId] || Object.values(MONSTERS).find(m => m.name.toLowerCase() === monsterId.toLowerCase())
  }

  // 3. Fallback Generic & Generation
  if (!template) {
    // Trigger generation for novel monsters (if it looks like a specific ID)
    // Avoid generating for "generic" or simple names unless they seem unique
    if (monsterId !== "generic" && monsterId.length > 3) {
      generateMonster(monsterId, world, game).catch(err => console.error(err))
    }

    template = {
      id: monsterId, // Use the requested ID so we can link it later
      name: nameOverride || monsterId, // Use ID as name if no override
      hp: 10,
      ac: 10,
      stats: { dex: 10 },
      actions: [],
      needsGeneration: true // Mark as pending
    }
  }

  const name = nameOverride || template.name

  // Handle duplicates (e.g. Goblin 1, Goblin 2)
  const existingCount = game.combat.enemies.filter(e => e.templateId === template.id).length
  const uniqueName = existingCount > 0 ? `${name} ${existingCount + 1}` : name
  const uniqueId = `${template.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`

  // Roll HP (or use average)
  // For now, use average for simplicity and speed
  const hpMax = template.hp || 10

  const enemy = {
    id: uniqueId,
    templateId: template.id,
    name: uniqueName,
    hp: { current: hpMax, max: hpMax },
    ac: template.ac || 10,
    stats: template.stats || { dex: 10 },
    conditions: [],
    resistances: template.resistances || [],
    immunities: template.immunities || [],
    vulnerabilities: template.vulnerabilities || [],
    tempHP: 0
  }

  game.combat.enemies.push(enemy)

  // Roll Initiative for new enemy
  const dexMod = Math.floor(((enemy.stats.dex || 10) - 10) / 2)
  const initRoll = rollDice(`1d20${dexMod >= 0 ? `+${dexMod}` : dexMod}`)
  const meta = createRollMetadata({ sourceType: "initiative" })

  game.combat.initiative.push({
    id: `init_${uniqueId}`,
    name: uniqueName,
    type: "npc",
    enemyId: uniqueId, // Link to enemy object
    roll: initRoll,
    total: initRoll.total,
    ...meta,
  })

  // Re-sort initiative
  game.combat.initiative.sort((a, b) => b.total - a.total)

  console.log('[CombatManager] Enemy spawned:', {
    enemy,
    totalEnemies: game.combat.enemies.length,
    combatActive: game.combat.active,
    initiative: game.combat.initiative
  })

  return enemy
}

/**
 * Apply damage to an entity (Player or Enemy)
 * @param {Object} game - Game state
 * @param {string} targetId - Target ID or Name
 * @param {number} amount - Damage amount
 * @returns {string} - Result message
 */
export function applyDamage(game, targetId, amount) {
  // Check if target is player
  if (targetId.toLowerCase() === "player" || targetId.toLowerCase() === "you") {
    // Player damage logic is handled by CharacterManager usually, but we can return a message for TagProcessor to handle
    return null // Signal that it's player damage
  }

  // Find enemy
  const enemy = game.combat.enemies.find(e =>
    e.id === targetId ||
    e.name.toLowerCase() === targetId.toLowerCase() ||
    e.name.toLowerCase().includes(targetId.toLowerCase()) // Fuzzy match
  )

  if (!enemy) return `Could not find target: ${targetId}`

  enemy.hp.current -= amount
  const isDead = enemy.hp.current <= 0

  let status = `[HP: ${enemy.hp.current}/${enemy.hp.max}]`
  if (isDead) {
    enemy.hp.current = 0
    status = "[DEAD]"
    enemy.conditions.push("Dead")

    // Remove from initiative? Or keep as dead body?
    // Let's mark as dead in initiative
    const initEntry = game.combat.initiative.find(i => i.enemyId === enemy.id)
    if (initEntry) {
      initEntry.name = `${enemy.name} (Dead)`
    }
  }

  return `${enemy.name} takes ${amount} damage. ${status}`
}

/**
 * End combat and reset state
 * @param {Object} game - Game state object
 * @param {string} outcome - Combat end description
 * @returns {Object} - System message to add
 */
export function endCombat(game, outcome = "") {
  game.combat.active = false
  game.combat.round = 0
  game.combat.initiative = []
  game.combat.enemies = []
  game.combat.currentTurnIndex = 0

  return {
    id: `msg_${Date.now()}_combat_end`,
    role: "system",
    content: `✓ Combat ended: ${outcome}`,
    timestamp: new Date().toISOString(),
    hidden: false,
    metadata: { combatEvent: "end" },
  }
}

/**
 * Get current turn description for display
 * @param {Object} game - Game state object
 * @returns {string} - Turn description
 */
export function getCurrentTurnDescription(game) {
  if (!game.combat.active || !game.combat.initiative || game.combat.initiative.length === 0) {
    return ""
  }

  const currentIndex = game.combat.currentTurnIndex || 0
  const current = game.combat.initiative[currentIndex]

  if (!current) {
    return ""
  }

  const turnText = current.type === "player" ? "Your turn" : `${current.name}'s turn`
  return ` • ${turnText}`
}

/**
 * Advance to the next turn in combat
 * @param {Object} game - Game state object
 * @returns {Object|null} - Turn notification message if applicable
 */
export function advanceTurn(game) {
  if (!game.combat.active || !game.combat.initiative || game.combat.initiative.length === 0) {
    return null
  }

  // Skip dead enemies?
  let attempts = 0
  do {
    game.combat.currentTurnIndex = (game.combat.currentTurnIndex + 1) % game.combat.initiative.length

    // If we wrapped around, increment round
    if (game.combat.currentTurnIndex === 0) {
      game.combat.round = (game.combat.round || 1) + 1
    }

    attempts++
  } while (isCurrentActorDead(game) && attempts < game.combat.initiative.length)

  const current = game.combat.initiative[game.combat.currentTurnIndex]

  // Return a turn notification system message
  return {
    id: `msg_${Date.now()}_turn_change`,
    role: "system",
    content: current.type === "player" ? "👉 It's your turn!" : `👉 ${current.name}'s turn.`,
    timestamp: new Date().toISOString(),
    hidden: false,
    metadata: {
      turnChange: true,
      actor: current.name,
      ephemeral: true
    }
  }
}

function isCurrentActorDead(game) {
  const current = game.combat.initiative[game.combat.currentTurnIndex]
  if (!current) return false
  if (current.type === "player") return false // Player is never skipped automatically

  // Check if linked enemy is dead
  if (current.enemyId) {
    const enemy = game.combat.enemies.find(e => e.id === current.enemyId)
    return enemy && enemy.hp.current <= 0
  }

  return false
}

/**
 * Parse enemy names from combat description
 * @param {string} description - Combat start description
 * @returns {Array<string>} - Array of enemy names
 */
function parseEnemyNames(description) {
  const enemyNames = []
  const desc = (description || "").trim()
  const enemyMatch = desc.match(/(?:vs\.?\s+)?(.+?)$/i)

  if (enemyMatch && enemyMatch[1]) {
    const raw = enemyMatch[1]
    raw.split(/,|and/).forEach((chunk) => {
      const name = chunk.trim()
      if (name && name.length > 1) enemyNames.push(name)
    })
  }

  return enemyNames
}

/**
 * Create roll metadata for tracking
 * @param {Object} extra - Additional metadata fields
 * @returns {Object} - Metadata object with rollId and timestamp
 */
function createRollMetadata(extra = {}) {
  const id = `roll_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const timestamp = new Date().toISOString()
  return { rollId: id, timestamp, ...extra }
}
