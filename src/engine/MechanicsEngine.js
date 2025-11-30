/**
 * MechanicsEngine - Core D&D 5e Rules Enforcement
 * Handles damage calculations, resistance/immunity, temp HP, and critical hits.
 */

import { rollSavingThrow } from "../utils/dice5e.js"

/**
 * Apply damage with type and resistance consideration
 * @param {Object} target - Character or enemy object
 * @param {number} amount - Base damage amount
 * @param {string} damageType - "slashing", "fire", "cold", etc. or null for generic
 * @param {Object} context - { world, game }
 * @returns {Object} - { actualDamage, resisted, immune, vulnerable, message }
 */
export function applyDamageWithType(target, amount, damageType, context) {
    const defenses = {
        resistances: target.resistances || [],
        immunities: target.immunities || [],
        vulnerabilities: target.vulnerabilities || []
    }

    const { finalDamage, modifier } = calculateDamageAfterResistance(amount, damageType, defenses)

    let actualDamage = finalDamage
    let tempHPRemoved = 0

    // Apply to temp HP first
    if (target.tempHP > 0) {
        tempHPRemoved = Math.min(target.tempHP, actualDamage)
        actualDamage -= tempHPRemoved
    }

    // Construct message parts
    const parts = []
    if (modifier === "immune") parts.push("Immune")
    else if (modifier === "resisted") parts.push("Resisted")
    else if (modifier === "vulnerable") parts.push("Vulnerable")

    if (tempHPRemoved > 0) {
        parts.push(`${tempHPRemoved} absorbed by temp HP`)
    }

    const message = parts.length > 0
        ? `(${parts.join(", ")})`
        : ""

    return {
        actualDamage,
        tempHPRemoved,
        resisted: modifier === "resisted",
        immune: modifier === "immune",
        vulnerable: modifier === "vulnerable",
        message
    }
}

/**
 * Apply temporary HP (doesn't stack)
 * @param {Object} target - Character or enemy object
 * @param {number} amount - Temp HP to grant
 * @returns {Object} - { newTempHP, message }
 */
export function applyTempHP(target, amount) {
    const currentTemp = target.tempHP || 0

    if (amount > currentTemp) {
        return {
            newTempHP: amount,
            message: `Gained ${amount} Temporary HP (replaced ${currentTemp})`
        }
    }

    return {
        newTempHP: currentTemp,
        message: `Existing Temporary HP (${currentTemp}) is higher than new amount (${amount})`
    }
}

/**
 * Handle critical hit - double damage dice (not modifiers)
 * @param {Object} attack - Attack object with damage notation
 * @param {Object} rollResult - The d20 attack roll result
 * @returns {Object} - { isCrit, damageNotation, message }
 */
export function applyCriticalHit(attack, rollResult) {
    const isCrit = rollResult.rolls && rollResult.rolls[0] === 20

    if (!isCrit || !attack.damage) {
        return { isCrit: false, damageNotation: attack.damage, message: "" }
    }

    const damageNotation = doubleDamageDice(attack.damage)

    return {
        isCrit: true,
        damageNotation,
        message: "Critical Hit! Damage dice doubled."
    }
}

/**
 * Check concentration when damaged
 * @param {Object} character - Character object
 * @param {number} damage - Damage taken
 * @param {Object} context - { game, onRoll callback }
 * @returns {Object} - { saveDC, saveResult, concentrationBroken, message }
 */
export function checkConcentration(character, damage, context = {}) {
    // DC = 10 or half damage, whichever is higher
    const saveDC = Math.max(10, Math.floor(damage / 2))

    // Roll CON save
    const saveResult = rollSavingThrow(character, 'con', { dc: saveDC })
    const passed = saveResult.total >= saveDC

    let message = `Concentration Check DC ${saveDC}: Rolled ${saveResult.total} (${passed ? "Success" : "Failure"})`

    if (context.onRoll) {
        context.onRoll({
            kind: 'Saving Throw',
            label: 'Concentration (Constitution)',
            roll: saveResult
        })
    }

    return {
        saveDC,
        saveResult,
        concentrationBroken: !passed,
        message
    }
}

/**
 * Calculate damage after resistance/immunity/vulnerability
 * @param {number} damage - Base damage
 * @param {string} type - Damage type
 * @param {Object} defenses - { resistances: [], immunities: [], vulnerabilities: [] }
 * @returns {Object} - { finalDamage, modifier: "resisted"|"immune"|"vulnerable"|null }
 */
export function calculateDamageAfterResistance(damage, type, defenses) {
    if (!type) return { finalDamage: damage, modifier: null }

    const resistances = defenses.resistances || []
    const immunities = defenses.immunities || []
    const vulnerabilities = defenses.vulnerabilities || []

    // Normalize type
    const t = type.toLowerCase()

    if (immunities.includes(t)) {
        return { finalDamage: 0, modifier: "immune" }
    }

    if (vulnerabilities.includes(t)) {
        return { finalDamage: damage * 2, modifier: "vulnerable" }
    }

    if (resistances.includes(t)) {
        return { finalDamage: Math.floor(damage / 2), modifier: "resisted" }
    }

    return { finalDamage: damage, modifier: null }
}

/**
 * Double damage dice for critical hits (not modifiers)
 * "1d8+3" -> "2d8+3"
 * "2d6+5" -> "4d6+5"
 */
function doubleDamageDice(notation) {
    if (!notation) return notation
    return notation.replace(/(\d+)d(\d+)/g, (match, count, sides) => {
        return `${parseInt(count) * 2}d${sides}`
    })
}
