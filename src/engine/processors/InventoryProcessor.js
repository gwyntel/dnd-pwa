/**
 * InventoryProcessor - Handles inventory, gold, and equipment management
 * Processes INVENTORY_*, GOLD_CHANGE, and USE_ITEM tags
 */

import { BaseProcessor } from './BaseProcessor.js'
import { tagParser } from '../TagParser.js'
import { resolveItem, calculateAC, handleEquipChange, useConsumable } from '../EquipmentManager.js'
import { generateItem } from '../ItemGenerator.js'
import { rollDice } from '../../utils/dice.js'
import { castSpell } from '../SpellcastingManager.js'
import store from '../../state/store.js'

export class InventoryProcessor extends BaseProcessor {
    /**
     * Process inventory-related tags in real-time
     * @param {string} text - Text containing tags
     * @param {Set} processedTags - Set of already processed tag keys
     * @param {Object} callbacks - Callbacks for side effects
     * @returns {Array} - Array of new system messages
     */
    processRealtimeTags(text, processedTags, callbacks = {}) {
        const { tags } = tagParser.parse(text)
        const newMessages = []

        for (let i = 0; i < tags.length; i++) {
            const tag = tags[i]
            const tagKey = this.createTagKey(tag.type, tag.index)

            if (processedTags.has(tagKey)) continue

            let processed = false

            switch (tag.type) {
                case 'INVENTORY_ADD': {
                    const [item, qty] = tag.content.split('|').map(s => s.trim())
                    const result = this.upsertItem(item, qty ? parseInt(qty, 10) : 1)
                    if (result) processed = true
                    break
                }

                case 'INVENTORY_REMOVE': {
                    const [item, qty] = tag.content.split('|').map(s => s.trim())
                    const result = this.upsertItem(item, -(qty ? parseInt(qty, 10) : 1))
                    if (result) processed = true
                    break
                }

                case 'INVENTORY_EQUIP': {
                    const result = this.upsertItem(tag.content, 0, { equip: true })
                    if (result) {
                        processed = true
                        // Handle generated tags from equipment effects
                        if (result.generatedTags && result.generatedTags.length > 0) {
                            const { tags: newTags } = tagParser.parse(result.generatedTags.join(' '))
                            tags.push(...newTags)
                        }
                    }
                    break
                }

                case 'INVENTORY_UNEQUIP': {
                    const result = this.upsertItem(tag.content, 0, { unequip: true })
                    if (result) {
                        processed = true
                        // Handle generated tags from equipment effects
                        if (result.generatedTags && result.generatedTags.length > 0) {
                            const { tags: newTags } = tagParser.parse(result.generatedTags.join(' '))
                            tags.push(...newTags)
                        }
                    }
                    break
                }

                case 'GOLD_CHANGE': {
                    const result = this.changeGold(tag.content)
                    if (result) processed = true
                    break
                }

                case 'USE_ITEM': {
                    const messages = this.processUseItem(tag.content, callbacks)
                    newMessages.push(...messages)
                    processed = true
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
     * Add, remove, equip, or unequip an item
     * @param {string} rawName - Item name (may include newlines)
     * @param {number} deltaQty - Quantity change (positive = add, negative = remove)
     * @param {Object} options - { equip, unequip }
     * @returns {Object|null} - Result object or null if failed
     */
    upsertItem(rawName, deltaQty, { equip, unequip } = {}) {
        this.ensureArray(this.game, 'inventory')

        const name = this.sanitize(rawName)
        if (!name) return null

        // Resolve item to ID if possible
        const itemId = name.toLowerCase().replace(/\s+/g, '_')
        const resolvedItem = resolveItem(name, this.world)

        // Generate item if it doesn't exist and we're adding it
        if (!resolvedItem && deltaQty > 0) {
            generateItem(itemId, this.world, this.game).catch(err =>
                console.error('Error generating item:', err)
            )
        }

        // Find existing item
        const findIndex = () => this.game.inventory.findIndex((it) => {
            if (it.id === itemId) return true
            if (it.id === name) return true
            // Legacy check
            return typeof it.item === 'string' && it.item.toLowerCase() === name.toLowerCase()
        })

        let idx = findIndex()
        const isNewItem = idx === -1

        if (isNewItem && deltaQty > 0) {
            // Add new item
            this.game.inventory.push({
                id: itemId,
                quantity: deltaQty,
                equipped: false,
                item: resolvedItem ? resolvedItem.name : name
            })
            idx = findIndex()
        }

        if (idx === -1) return null

        const item = this.game.inventory[idx]
        const oldQty = typeof item.quantity === 'number' ? item.quantity : 0
        const newQty = isNewItem ? item.quantity : Math.max(0, oldQty + deltaQty)
        item.quantity = newQty

        // Ensure ID is set (migration helper)
        if (!item.id) item.id = itemId

        // Handle equip/unequip
        let equipmentChanged = false
        if (equip === true && !item.equipped) {
            item.equipped = true
            equipmentChanged = true
        } else if (unequip === true && item.equipped) {
            item.equipped = false
            equipmentChanged = true
        }

        // Remove if quantity is 0
        if (item.quantity === 0) {
            this.game.inventory.splice(idx, 1)
        }

        let generatedTags = []

        // Recalculate AC and handle item effects if equipment changed
        if (equipmentChanged && this.character) {
            // Recalculate AC
            const newAC = calculateAC(this.character, this.game, this.world)
            if (newAC !== this.character.armorClass) {
                this.character.armorClass = newAC
                // Persist character update
                store.update(state => {
                    const c = state.characters.find(char => char.id === this.character.id)
                    if (c) c.armorClass = newAC
                })
            }

            // Handle equipment effects (resistances, etc.)
            const equipResult = handleEquipChange(this.game, this.character, this.world, itemId, item.equipped)
            if (equipResult.tags && equipResult.tags.length > 0) {
                generatedTags = equipResult.tags
            }
        }

        const displayName = resolvedItem ? resolvedItem.name : (item.item || name)
        return {
            name: displayName,
            oldQty,
            newQty,
            equipped: !!item.equipped,
            generatedTags
        }
    }

    /**
     * Change gold amount
     * @param {string|number} deltaRaw - Amount to change (can be negative)
     * @returns {Object|null} - { before, after, applied } or null if invalid
     */
    changeGold(deltaRaw) {
        const delta = Number.parseFloat(deltaRaw)
        if (Number.isNaN(delta) || delta === 0) return null

        this.ensureObject(this.game, 'currency', { gp: 0 })
        this.ensureNumber(this.game.currency, 'gp', 0)

        const before = this.game.currency.gp
        let after = before + delta
        if (after < 0) after = 0
        after = Math.round(after * 100) / 100

        this.game.currency.gp = after
        return { before, after, applied: after - before }
    }

    /**
     * Process USE_ITEM tag
     * @param {string} itemName - Name of item to use
     * @param {Object} callbacks - Callbacks for side effects
     * @returns {Array} - Array of system messages
     */
    processUseItem(itemName, callbacks) {
        const messages = []
        const name = this.sanitize(itemName)

        // Resolve item
        const resolved = resolveItem(name, this.world)
        const itemId = resolved ? resolved.id : name.toLowerCase().replace(/\s+/g, '_')

        const result = useConsumable(this.game, this.character, this.world, itemId)

        if (result.success) {
            // Process effect tags
            if (result.tags && result.tags.length > 0) {
                for (const effectTagStr of result.tags) {
                    const { tags: subTags } = tagParser.parse(effectTagStr)

                    for (const subTag of subTags) {
                        this.processItemEffectTag(subTag, callbacks)
                    }
                }
            }

            messages.push(this.createSystemMessage(
                `🥤 **Used ${result.item ? result.item.name : name}**\n${result.message}`
            ))
        } else {
            messages.push(this.createSystemMessage(
                `⚠️ **Could not use ${name}**: ${result.message}`
            ))
        }

        return messages
    }

    /**
     * Process a tag generated by item effects
     * @param {Object} tag - Parsed tag object
     * @param {Object} callbacks - Callbacks for side effects
     */
    processItemEffectTag(tag, callbacks) {
        switch (tag.type) {
            case 'HEAL': {
                const [target, amountStr] = tag.content.split('|').map(s => s.trim())

                // Handle dice notation or plain numbers
                let heal
                if (amountStr && amountStr.includes('d')) {
                    const rollResult = rollDice(amountStr)
                    heal = rollResult.total
                } else {
                    heal = parseInt(amountStr, 10)
                }

                if (!isNaN(heal)) {
                    this.game.currentHP = Math.min(this.character.maxHP, this.game.currentHP + heal)
                }
                break
            }

            case 'STATUS_ADD': {
                this.addStatus(tag.content)
                break
            }

            case 'STATUS_REMOVE': {
                this.removeStatus(tag.content)
                break
            }

            case 'CAST_SPELL': {
                const [spell, level] = tag.content.split('|').map(s => s.trim())
                castSpell(this.game, this.character, spell, parseInt(level, 10) || 0)
                break
            }
        }
    }

    /**
     * Add a status effect
     * @param {string} raw - Status name
     * @returns {boolean} - True if added, false if already exists
     */
    addStatus(raw) {
        this.ensureArray(this.game, 'conditions')
        const name = this.sanitize(raw)
        if (!name) return false

        const exists = this.game.conditions.some((c) => {
            if (typeof c === 'string') return c.toLowerCase() === name.toLowerCase()
            return c && typeof c.name === 'string' && c.name.toLowerCase() === name.toLowerCase()
        })

        if (!exists) {
            this.game.conditions.push({ name, addedAt: new Date().toISOString() })
            return true
        }
        return false
    }

    /**
     * Remove a status effect
     * @param {string} raw - Status name
     * @returns {boolean} - True if removed, false if not found
     */
    removeStatus(raw) {
        this.ensureArray(this.game, 'conditions')
        const name = this.sanitize(raw)
        if (!name) return false

        const idx = this.game.conditions.findIndex((c) => {
            if (typeof c === 'string') return c.toLowerCase() === name.toLowerCase()
            return c && typeof c.name === 'string' && c.name.toLowerCase() === name.toLowerCase()
        })

        if (idx !== -1) {
            this.game.conditions.splice(idx, 1)
            return true
        }
        return false
    }
}
