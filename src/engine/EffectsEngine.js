/**
 * Effects Engine
 * Unified system for resolving and applying effects from items, spells, and abilities.
 */

/**
 * Resolve and execute an effect string
 * @param {string} effectStr - e.g., "HEAL[player|2d4+2]", "+1 AC", "advantage on stealth"
 * @param {Object} context - { game, character, source }
 * @returns {Object} - { tags: [], modifiers: {}, description: "" }
 */
export function resolveEffect(effectStr, context) {
    const { game, character, source } = context

    if (!effectStr || typeof effectStr !== 'string') {
        return { tags: [], modifiers: {}, description: "" }
    }

    // Tag-based effects (immediate execution via TagProcessor)
    // Matches TAG[content]
    const tagPattern = /^([A-Z_]+)\[(.*?)\]$/
    const tagMatch = effectStr.match(tagPattern)
    if (tagMatch) {
        return {
            tags: [effectStr],
            modifiers: {},
            description: `Applied: ${effectStr}`
        }
    }

    // Passive modifiers (e.g., "+1 AC", "+1 to all saves")
    const modifierPattern = /^([+-]\d+)\s+(.+)$/
    const modMatch = effectStr.match(modifierPattern)
    if (modMatch) {
        const [_, valueStr, target] = modMatch
        const value = parseInt(valueStr, 10)

        // Normalize target keys
        let key = target.toLowerCase().trim()
        if (key === "ac" || key === "armor class") key = "AC"
        else if (key.includes("save")) key = "saves"
        else if (key.includes("hit") || key.includes("attack")) key = "toHit"
        else if (key.includes("damage")) key = "damage"

        return {
            tags: [],
            modifiers: { [key]: value },
            description: `${valueStr} to ${target}`
        }
    }

    // Advantage/Disadvantage
    if (effectStr.toLowerCase().includes("advantage") || effectStr.toLowerCase().includes("disadvantage")) {
        return {
            tags: [],
            modifiers: { conditionalEffect: effectStr },
            description: effectStr
        }
    }

    // Fallback for descriptive effects
    return {
        tags: [],
        modifiers: {},
        description: effectStr
    }
}

/**
 * Apply item effects when equipped/consumed
 * @param {Object} item - The item object
 * @param {Object} game - Game state
 * @param {Object} character - Character state
 * @returns {Object} - { tags: [] }
 */
export function applyItemEffects(item, game, character) {
    if (!item || !item.effects || !Array.isArray(item.effects)) return { tags: [] }

    const allTags = []
    const itemModifiers = {}

    for (const effectStr of item.effects) {
        const result = resolveEffect(effectStr, { game, character, source: item })

        // Collect tags to be processed
        if (result.tags && result.tags.length > 0) {
            allTags.push(...result.tags)
        }

        // Collect modifiers
        if (Object.keys(result.modifiers).length > 0) {
            Object.assign(itemModifiers, result.modifiers)
        }
    }

    // Store passive modifiers on character (for AC calculation, etc.)
    // We store them keyed by item ID so we can remove them later
    if (Object.keys(itemModifiers).length > 0) {
        if (!character.activeModifiers) character.activeModifiers = {}
        character.activeModifiers[item.id] = itemModifiers
    }

    return { tags: allTags }
}

/**
 * Remove item effects (e.g. when unequipped)
 * @param {Object} item - The item object
 * @param {Object} character - Character state
 */
export function removeItemEffects(item, character) {
    if (!item || !character.activeModifiers) return

    if (character.activeModifiers[item.id]) {
        delete character.activeModifiers[item.id]
    }
}
