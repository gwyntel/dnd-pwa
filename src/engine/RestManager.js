/**
 * RestManager - Handles short and long rest mechanics
 */

import { rollDice } from "../utils/dice.js"
import { buildDiceProfile } from "../utils/dice5e.js"

/**
 * Perform a short rest
 * @param {Object} game - Game state
 * @param {Object} character - Character object
 * @returns {Object} - Rest results
 */
export function shortRest(game, character) {
    const messages = []
    const profile = buildDiceProfile(character)

    // Update rest tracking
    if (!game.restState) {
        game.restState = { shortRestsToday: 0 }
    }
    game.restState.lastShortRest = new Date().toISOString()
    game.restState.shortRestsToday += 1

    // Recover short rest resources (Ki, Channel Divinity, etc.)
    if (character.classResources) {
        character.classResources.forEach(resource => {
            if (resource.recoversOn === 'short' || resource.recoversOn === 'both') {
                const recovered = resource.max - resource.current
                resource.current = resource.max
                if (recovered > 0) {
                    messages.push({
                        id: `msg_${Date.now()}_resource_${resource.name}`,
                        role: "system",
                        content: `♻️ ${resource.name} recovered (+${recovered})`,
                        timestamp: new Date().toISOString(),
                        hidden: false,
                        metadata: { restRecovery: true }
                    })
                }
            }
        })
    }

    messages.push({
        id: `msg_${Date.now()}_short_rest`,
        role: "system",
        content: `💤 Short rest completed. You can spend hit dice to recover HP.`,
        timestamp: new Date().toISOString(),
        hidden: false,
        metadata: { shortRest: true }
    })

    return {
        success: true,
        messages,
        canSpendHitDice: character.hitDice.current > 0
    }
}

/**
 * Spend hit dice during short rest
 * @param {Object} game - Game state
 * @param {Object} character - Character object
 * @param {number} count - Number of hit dice to spend
 * @returns {Object} - Healing results
 */
export function spendHitDice(game, character, count) {
    const messages = []
    const profile = buildDiceProfile(character)
    const conMod = profile.abilities.con

    if (character.hitDice.current < count) {
        return {
            success: false,
            message: `Not enough hit dice! (${character.hitDice.current} available)`
        }
    }

    let totalHealing = 0
    const rolls = []

    for (let i = 0; i < count; i++) {
        const roll = rollDice(`1${character.hitDice.dieType}+${conMod}`)
        rolls.push(roll.total)
        totalHealing += roll.total
    }

    // Apply healing
    const oldHP = game.currentHP
    game.currentHP = Math.min(game.currentHP + totalHealing, character.maxHP)
    const actualHealing = game.currentHP - oldHP

    // Spend hit dice
    character.hitDice.current -= count

    messages.push({
        id: `msg_${Date.now()}_hit_dice`,
        role: "system",
        content: `🎲 Spent ${count} hit ${count === 1 ? 'die' : 'dice'} (${rolls.join(', ')}): Healed ${actualHealing} HP. Hit dice remaining: ${character.hitDice.current}/${character.hitDice.max}`,
        timestamp: new Date().toISOString(),
        hidden: false,
        metadata: { hitDiceRoll: true, healing: actualHealing }
    })

    return {
        success: true,
        healing: actualHealing,
        messages
    }
}

/**
 * Perform a long rest
 * @param {Object} game - Game state
 * @param {Object} character - Character object
 * @returns {Object} - Rest results
 */
export function longRest(game, character) {
    const messages = []

    // Update rest tracking
    if (!game.restState) {
        game.restState = { shortRestsToday: 0 }
    }
    game.restState.lastLongRest = new Date().toISOString()
    game.restState.shortRestsToday = 0

    // Restore HP to full
    const hpRecovered = character.maxHP - game.currentHP
    game.currentHP = character.maxHP

    // Restore all spell slots
    let slotsRecovered = 0
    Object.keys(character.spellSlots || {}).forEach(level => {
        const slots = character.spellSlots[level]
        if (slots.max > 0) {
            const recovered = slots.max - slots.current
            slotsRecovered += recovered
            slots.current = slots.max
        }
    })

    // Restore hit dice (half of maximum, minimum 1)
    const hitDiceRecovered = Math.max(1, Math.floor(character.hitDice.max / 2))
    character.hitDice.current = Math.min(
        character.hitDice.current + hitDiceRecovered,
        character.hitDice.max
    )

    // Restore all class resources
    if (character.classResources) {
        character.classResources.forEach(resource => {
            resource.current = resource.max
        })
    }

    // End concentration
    if (game.concentration) {
        game.concentration = null
    }

    messages.push({
        id: `msg_${Date.now()}_long_rest`,
        role: "system",
        content: `🛏️ Long rest completed! Full HP restored (+${hpRecovered}), ${slotsRecovered} spell slots recovered, ${hitDiceRecovered} hit dice recovered. All resources refreshed.`,
        timestamp: new Date().toISOString(),
        hidden: false,
        metadata: { longRest: true }
    })

    return {
        success: true,
        messages,
        hpRecovered,
        slotsRecovered,
        hitDiceRecovered
    }
}
