/**
 * SpellcastingManager - Handles spell casting, slot management, and concentration
 */

import { rollDice } from "../utils/dice.js"
import store from "../state/store.js"
import { resolveEffect } from "./EffectsEngine.js"
import { COMMON_SPELLS } from '../data/spells.js'

/**
 * Cast a spell and consume spell slot
 * @param {Object} game - Game state
 * @param {Object} character - Character object
 * @param {string} spellName - Name of spell
 * @param {number} spellLevel - Level of spell (0 for cantrip)
 * @param {string} spellId - ID of spell (for looking up effects)
 * @returns {Object} - Result with success and messages
 */
export function castSpell(game, character, spellName, spellLevel, spellId = null) {
    const messages = []

    // Lookup spell data if ID provided
    const spellData = spellId ? COMMON_SPELLS[spellId] : null

    // Cantrips don't consume slots
    if (spellLevel === 0) {
        messages.push({
            id: `msg_${Date.now()}_cantrip`,
            role: "system",
            content: `✨ ${character.name} casts ${spellName} (Cantrip)`,
            timestamp: new Date().toISOString(),
            hidden: false,
            metadata: { spellCast: true, spellLevel: 0 }
        })

        // Apply cantrip effects if any
        if (spellData?.effects) {
            applySpellEffects(game, character, spellData, spellName)
        }

        return { success: true, messages }
    }

    // Check if character has spell slots
    const slots = character.spellSlots?.[spellLevel]
    if (!slots || slots.current <= 0) {
        messages.push({
            id: `msg_${Date.now()}_no_slots`,
            role: "system",
            content: `❌ No level ${spellLevel} spell slots remaining!`,
            timestamp: new Date().toISOString(),
            hidden: false,
            metadata: { spellFailed: true }
        })
        return { success: false, messages }
    }

    // Consume spell slot
    character.spellSlots[spellLevel].current -= 1

    messages.push({
        id: `msg_${Date.now()}_spell_cast`,
        role: "system",
        content: `✨ ${character.name} casts ${spellName}! (Level ${spellLevel} slot used: ${character.spellSlots[spellLevel].current}/${character.spellSlots[spellLevel].max} remaining)`,
        timestamp: new Date().toISOString(),
        hidden: false,
        metadata: {
            spellCast: true,
            spellLevel,
            spellName,
            slotsRemaining: character.spellSlots[spellLevel].current
        }
    })

    // Apply spell effects if any
    if (spellData?.effects) {
        const effectResult = applySpellEffects(game, character, spellData, spellName)
        if (effectResult.message) {
            messages.push({
                id: `msg_${Date.now()}_spell_effect`,
                role: "system",
                content: effectResult.message,
                timestamp: new Date().toISOString(),
                hidden: false,
                metadata: { spellEffect: true }
            })
        }
    }

    return { success: true, messages }
}

/**
 * Apply spell effects with duration tracking
 * @param {Object} game - Game state
 * @param {Object} character - Character object
 * @param {Object} spellData - Spell data from COMMON_SPELLS
 * @param {string} spellName - Display name of the spell
 * @returns {Object} - Result with tags and message
 */
function applySpellEffects(game, character, spellData, spellName) {
    if (!spellData.effects || !Array.isArray(spellData.effects)) {
        return { tags: [], message: '' }
    }

    // Initialize active spell effects tracker
    if (!game.activeSpellEffects) game.activeSpellEffects = []

    const allTags = []
    const allModifiers = {}

    // Process each effect
    for (const effectStr of spellData.effects) {
        const result = resolveEffect(effectStr, { game, character, source: spellData })

        if (result.tags && result.tags.length > 0) {
            allTags.push(...result.tags)
        }

        if (Object.keys(result.modifiers).length > 0) {
            Object.assign(allModifiers, result.modifiers)
        }
    }

    // Store effect with duration if applicable
    if (spellData.duration && spellData.durationType) {
        const effectId = `spell_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

        game.activeSpellEffects.push({
            id: effectId,
            spellName,
            spellId: spellData.id || null,
            effects: spellData.effects,
            modifiers: allModifiers,
            duration: spellData.duration,
            durationType: spellData.durationType,
            remainingDuration: spellData.duration,
            startedAt: new Date().toISOString()
        })

        // Apply modifiers to character
        if (Object.keys(allModifiers).length > 0) {
            if (!character.activeModifiers) character.activeModifiers = {}
            character.activeModifiers[effectId] = allModifiers
        }

        const durationText = spellData.durationType === 'rounds'
            ? `${spellData.duration} round${spellData.duration !== 1 ? 's' : ''}`
            : `${spellData.duration} hour${spellData.duration !== 1 ? 's' : ''}`

        return {
            tags: allTags,
            message: `🔮 ${spellName} effect active for ${durationText}`
        }
    }

    // Instant effects (no duration tracking)
    return {
        tags: allTags,
        message: ''
    }
}

/**
 * Advance turn/round and decrement spell effect durations
 * @param {Object} game - Game state
 * @param {Object} character - Character object
 * @param {string} advanceType - 'round' or 'hour'
 * @returns {Array} - Messages about expired effects
 */
export function advanceSpellEffectDurations(game, character, advanceType = 'round') {
    if (!game.activeSpellEffects || game.activeSpellEffects.length === 0) {
        return []
    }

    const messages = []
    const typeMap = { 'round': 'rounds', 'hour': 'hours' }
    const durationType = typeMap[advanceType] || 'rounds'

    // Decrement durations and collect expired effects
    const expiredEffectIds = []

    for (const effect of game.activeSpellEffects) {
        // Only decrement effects that match the advance type
        if (effect.durationType === durationType) {
            effect.remainingDuration -= 1

            if (effect.remainingDuration <= 0) {
                expiredEffectIds.push(effect.id)
                messages.push({
                    id: `msg_${Date.now()}_spell_expired_${effect.id}`,
                    role: "system",
                    content: `⏳ ${effect.spellName} effect has ended`,
                    timestamp: new Date().toISOString(),
                    hidden: false,
                    metadata: { spellExpired: true, spellName: effect.spellName }
                })
            }
        }
    }

    // Remove expired effects
    if (expiredEffectIds.length > 0) {
        cleanupExpiredSpellEffects(game, character, expiredEffectIds)
    }

    return messages
}

/**
 * Remove expired spell effects and their modifiers
 * @param {Object} game - Game state
 * @param {Object} character - Character object
 * @param {Array} effectIds - IDs of effects to remove
 */
function cleanupExpiredSpellEffects(game, character, effectIds) {
    if (!game.activeSpellEffects) return

    // Remove from activeSpellEffects
    game.activeSpellEffects = game.activeSpellEffects.filter(
        effect => !effectIds.includes(effect.id)
    )

    // Remove modifiers
    if (character.activeModifiers) {
        for (const id of effectIds) {
            delete character.activeModifiers[id]
        }
    }
}

/**
 * Start concentration on a spell (ends previous concentration)
 * @param {Object} game - Game state
 * @param {string} spellName - Name of concentration spell
 */
export function startConcentration(game, spellName) {
    if (game.concentration) {
        // End previous concentration
        return {
            ended: game.concentration.spellName,
            started: spellName,
            message: `Concentration on ${game.concentration.spellName} ends. Now concentrating on ${spellName}.`
        }
    }

    game.concentration = {
        spellName,
        startedAt: new Date().toISOString()
    }

    return {
        started: spellName,
        message: `Concentrating on ${spellName}.`
    }
}

/**
 * End concentration
 * @param {Object} game - Game state
 */
export function endConcentration(game) {
    if (!game.concentration) return null

    const spellName = game.concentration.spellName
    game.concentration = null

    return {
        ended: spellName,
        message: `Concentration on ${spellName} ended.`
    }
}

/**
 * Check if character can cast a spell
 * @param {Object} character - Character object
 * @param {number} spellLevel - Level of spell
 * @returns {boolean}
 */
export function canCastSpell(character, spellLevel) {
    if (spellLevel === 0) return true // Cantrips always available

    const slots = character.spellSlots?.[spellLevel]
    return slots && slots.current > 0
}
