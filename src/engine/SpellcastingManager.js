/**
 * SpellcastingManager - Handles spell casting, slot management, and concentration
 */

import { rollDice } from "../utils/dice.js"
import store from "../state/store.js"

/**
 * Cast a spell and consume spell slot
 * @param {Object} game - Game state
 * @param {Object} character - Character object
 * @param {string} spellName - Name of spell
 * @param {number} spellLevel - Level of spell (0 for cantrip)
 * @returns {Object} - Result with success and messages
 */
export function castSpell(game, character, spellName, spellLevel) {
    const messages = []

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

    return { success: true, messages }
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
