import { ITEMS } from '../data/items.js'
import { resolveEffect, applyItemEffects, removeItemEffects } from './EffectsEngine.js'

/**
 * Handle equipment change (equip/unequip) and return tags to process
 * @param {Object} game - Game state
 * @param {Object} character - Character state
 * @param {Object} world - World state
 * @param {string} itemId - ID of item
 * @param {boolean} isEquipping - True if equipping, false if unequipping
 * @returns {Object} - { tags: [] }
 */
export function handleEquipChange(game, character, world, itemId, isEquipping) {
    const item = resolveItem(itemId, world)
    if (!item) return { tags: [] }

    if (isEquipping) {
        return applyItemEffects(item, game, character)
    } else {
        return removeItemEffects(item, character)
    }
}

/**
 * Resolve item by name/ID from world loot or static DB
 * @param {string} itemIdentifier - ID or name of the item
 * @param {Object} world - World object containing generated items
 * @returns {Object|null} - The item object or null
 */
export function resolveItem(itemIdentifier, world) {
    const normalized = (itemIdentifier || "").toLowerCase().trim()
    if (!normalized) return null

    // 1. Check world.items first (generated loot)
    if (world?.items && Array.isArray(world.items)) {
        const worldItem = world.items.find(i =>
            i.id === normalized || i.name.toLowerCase() === normalized
        )
        if (worldItem) return worldItem
    }

    // 2. Check static ITEMS database
    if (ITEMS[normalized]) return ITEMS[normalized]

    // 3. Fuzzy match by name in static DB
    const staticMatch = Object.values(ITEMS).find(i =>
        i.name.toLowerCase() === normalized
    )
    if (staticMatch) return staticMatch

    // 4. Return null if not found
    return null
}

/**
 * Calculate AC from equipped armor/shields + effects
 * @param {Object} character - Character state
 * @param {Object} game - Game state
 * @param {Object} world - World state
 * @returns {number} - Calculated Armor Class
 */
export function calculateAC(character, game, world) {
    const inventory = Array.isArray(game.inventory) ? game.inventory : (character.inventory || [])

    let baseAC = 10 // Unarmored
    let dexMod = Math.floor((character.stats.dexterity - 10) / 2)
    let shieldBonus = 0
    let miscBonus = 0
    let hasArmor = false

    // Find equipped armor
    const equippedArmorSlot = inventory.find(slot => {
        if (!slot.equipped) return false
        const item = resolveItem(slot.id, world)
        return item?.category === "armor" && item?.armorType !== "shield"
    })

    if (equippedArmorSlot) {
        const armorData = resolveItem(equippedArmorSlot.id, world)
        if (armorData) {
            hasArmor = true
            baseAC = armorData.baseAC || 10

            // Heavy armor: no DEX
            // Medium armor: max +2 DEX
            // Light armor: full DEX
            if (armorData.armorType === "heavy") {
                dexMod = 0
            } else if (armorData.armorType === "medium") {
                dexMod = Math.min(dexMod, 2)
            }
            // Light armor uses full dexMod (already set)
        }
    }

    // Unarmored Defense (Barbarian/Monk) - only if no armor
    if (!hasArmor) {
        const cls = (character.class || "").toLowerCase()

        // Barbarian: 10 + Dex + Con
        if (cls.includes("barbarian")) {
            const conMod = Math.floor((character.stats.constitution - 10) / 2)
            baseAC = 10 + dexMod + conMod
            dexMod = 0 // Already included in base calculation
        }
        // Monk: 10 + Dex + Wis (not implementing monk yet, but placeholder)
        else if (cls.includes("monk")) {
            const wisMod = Math.floor((character.stats.wisdom - 10) / 2)
            baseAC = 10 + dexMod + wisMod
            dexMod = 0
        }
    }

    // Find equipped shield
    const equippedShieldSlot = inventory.find(slot => {
        if (!slot.equipped) return false
        const item = resolveItem(slot.id, world)
        return item?.armorType === "shield"
    })

    if (equippedShieldSlot) {
        const shieldData = resolveItem(equippedShieldSlot.id, world)
        if (shieldData?.acBonus) {
            shieldBonus = shieldData.acBonus
        } else {
            shieldBonus = 2 // Default shield bonus
        }
    }

    // Apply active modifiers from magic items
    if (character.activeModifiers) {
        for (const [itemId, mods] of Object.entries(character.activeModifiers)) {
            if (mods.AC) miscBonus += mods.AC
            if (mods["Armor Class"]) miscBonus += mods["Armor Class"]
        }
    }

    return baseAC + dexMod + shieldBonus + miscBonus
}

/**
 * Get equipped weapon data
 * @param {Object} game - Game state
 * @param {Object} world - World state
 * @returns {Array} - List of resolved weapon objects
 */
export function getEquippedWeapons(game, world) {
    const inventory = Array.isArray(game.inventory) ? game.inventory : []

    return inventory
        .filter(slot => {
            if (!slot.equipped) return false
            const item = resolveItem(slot.id, world)
            return item?.category === "weapon"
        })
        .map(slot => resolveItem(slot.id, world))
        .filter(Boolean)
}

/**
 * Use a consumable item
 * @param {Object} game - Game state
 * @param {Object} character - Character state
 * @param {Object} world - World state
 * @param {string} itemId - ID of item to use
 * @returns {Object} - Result object { success, message, tags, item }
 */
export function useConsumable(game, character, world, itemId) {
    const item = resolveItem(itemId, world)

    if (!item) {
        return { success: false, message: "Item not found" }
    }

    if (!item.consumable) {
        return { success: false, message: "Item is not consumable" }
    }

    // Apply effects
    const { tags } = applyItemEffects(item, game, character)

    // Remove from inventory
    const inventory = Array.isArray(game.inventory) ? game.inventory : []
    const idx = inventory.findIndex(slot => slot.id === itemId)

    if (idx !== -1) {
        inventory[idx].quantity = (inventory[idx].quantity || 1) - 1
        if (inventory[idx].quantity <= 0) {
            inventory.splice(idx, 1)
        }
    } else {
        // Fallback for string-based inventory (legacy)
        const strIdx = inventory.findIndex(slot => slot.item === itemId || slot === itemId)
        if (strIdx !== -1) {
            // Handle legacy removal if needed, but we prefer ID based
            // For now assume migration has run
        }
    }

    return {
        success: true,
        message: `Used ${item.name}`,
        tags,
        item
    }
}
