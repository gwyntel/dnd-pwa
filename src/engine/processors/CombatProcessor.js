/**
 * CombatProcessor - Handles combat-related tags
 * Processes DAMAGE, TEMP_HP, HEAL, and defense modifiers (resistance/immunity/vulnerability)
 */

import { BaseProcessor } from './BaseProcessor.js'
import { tagParser } from '../TagParser.js'
import { rollDice } from '../../utils/dice.js'
import { applyDamageWithType, applyTempHP, checkConcentration } from '../MechanicsEngine.js'
import { endConcentration } from '../SpellcastingManager.js'
import store from '../../state/store.js'

export class CombatProcessor extends BaseProcessor {
    /**
     * Process combat-related tags in real-time
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
            let messages = []

            switch (tag.type) {
                case 'DAMAGE':
                    messages = this.processDamage(tag.content, callbacks)
                    processed = messages.length > 0
                    break

                case 'HEAL':
                    messages = this.processHeal(tag.content)
                    processed = messages.length > 0
                    break

                case 'TEMP_HP':
                    messages = this.processTempHP(tag.content)
                    processed = messages.length > 0
                    break

                case 'APPLY_RESISTANCE':
                    messages = this.applyDefenseModifier(tag.content, 'resistance', true)
                    processed = messages.length > 0
                    break

                case 'REMOVE_RESISTANCE':
                    messages = this.applyDefenseModifier(tag.content, 'resistance', false)
                    processed = messages.length > 0
                    break

                case 'APPLY_IMMUNITY':
                    messages = this.applyDefenseModifier(tag.content, 'immunity', true)
                    processed = messages.length > 0
                    break

                case 'REMOVE_IMMUNITY':
                    messages = this.applyDefenseModifier(tag.content, 'immunity', false)
                    processed = messages.length > 0
                    break

                case 'APPLY_VULNERABILITY':
                    messages = this.applyDefenseModifier(tag.content, 'vulnerability', true)
                    processed = messages.length > 0
                    break

                case 'REMOVE_VULNERABILITY':
                    messages = this.applyDefenseModifier(tag.content, 'vulnerability', false)
                    processed = messages.length > 0
                    break
            }

            if (processed) {
                processedTags.add(tagKey)
                newMessages.push(...messages)
            }
        }

        return newMessages
    }

    /**
     * Process DAMAGE tag
     * @param {string} content - Tag content: "target|amount|type"
     * @param {Object} callbacks - Callbacks for side effects
     * @returns {Array} - System messages
     */
    processDamage(content, callbacks) {
        const [targetName, amountStr, type] = content.split('|').map(s => s.trim())

        // Handle dice notation or plain numbers
        let amount
        if (amountStr && amountStr.includes('d')) {
            const rollResult = rollDice(amountStr)
            amount = rollResult.total
        } else {
            amount = parseInt(amountStr, 10)
        }

        if (!targetName || isNaN(amount)) return []

        // Resolve target
        const { targetObj, isPlayer } = this.resolveTarget(targetName)
        if (!targetObj) return []

        // Apply damage via Mechanics Engine
        const result = applyDamageWithType(targetObj, amount, type, { game: this.game })

        // Update state
        if (isPlayer) {
            this.game.currentHP = Math.max(0, this.game.currentHP - result.actualDamage)

            // Sync temp HP if changed
            if (result.tempHPRemoved > 0) {
                this.character.tempHP = Math.max(0, (this.character.tempHP || 0) - result.tempHPRemoved)
            }

            // Check Concentration
            if (result.actualDamage > 0 && this.character.concentration) {
                const conResult = checkConcentration(this.character, result.actualDamage, {
                    onRoll: callbacks.onRoll
                })

                if (conResult.concentrationBroken) {
                    endConcentration(this.game)
                    return [
                        this.createDamageMessage(isPlayer, targetObj, result),
                        this.createSystemMessage(`💔 **Concentration Broken!**\n${conResult.message}`)
                    ]
                }
            }
        } else {
            // Enemy update
            targetObj.hp.current = Math.max(0, targetObj.hp.current - result.actualDamage)
            if (result.tempHPRemoved > 0) {
                targetObj.tempHP = Math.max(0, (targetObj.tempHP || 0) - result.tempHPRemoved)
            }
            if (targetObj.hp.current === 0) {
                this.ensureArray(targetObj, 'conditions')
                targetObj.conditions.push("Dead")
            }
        }

        return [this.createDamageMessage(isPlayer, targetObj, result)]
    }

    /**
     * Process HEAL tag
     * @param {string} content - Tag content: "target|amount"
     * @returns {Array} - System messages
     */
    processHeal(content) {
        const [target, amountStr] = content.split('|').map(s => s.trim())

        // Handle dice notation or plain numbers
        let amount
        if (amountStr && amountStr.includes('d')) {
            const rollResult = rollDice(amountStr)
            amount = rollResult.total
        } else {
            amount = parseInt(amountStr, 10)
        }

        if (!target || isNaN(amount)) return []

        const { targetObj, isPlayer } = this.resolveTarget(target)
        if (!targetObj || !isPlayer) return [] // Only heal player for now

        const before = this.game.currentHP
        this.game.currentHP = Math.min(this.character.maxHP, this.game.currentHP + amount)
        const actualHeal = this.game.currentHP - before

        return [
            this.createSystemMessage(
                `💚 **Healed ${actualHeal} HP** [HP: ${this.game.currentHP}/${this.character.maxHP}]`
            )
        ]
    }

    /**
     * Process TEMP_HP tag
     * @param {string} content - Tag content: "target|amount"
     * @returns {Array} - System messages
     */
    processTempHP(content) {
        const [targetName, amountStr] = content.split('|').map(s => s.trim())

        // Handle dice notation or plain numbers
        let amount
        if (amountStr && amountStr.includes('d')) {
            const rollResult = rollDice(amountStr)
            amount = rollResult.total
        } else {
            amount = parseInt(amountStr, 10)
        }

        if (!targetName || isNaN(amount)) return []

        const { targetObj, isPlayer } = this.resolveTarget(targetName)
        if (!targetObj) return []

        const result = applyTempHP(targetObj, amount)

        if (isPlayer) {
            // Persist to character
            this.character.tempHP = result.newTempHP
            // Explicitly persist to store to ensure UI updates
            store.update(state => {
                const c = state.characters.find(char => char.id === this.character.id)
                if (c) c.tempHP = result.newTempHP
            })
        } else {
            targetObj.tempHP = result.newTempHP
        }

        return [this.createSystemMessage(`🛡️ **Temporary HP**: ${result.message}`)]
    }

    /**
     * Apply or remove defense modifier (resistance, immunity, vulnerability)
     * @param {string} content - Tag content: "target|damageType"
     * @param {string} modifierType - 'resistance', 'immunity', or 'vulnerability'
     * @param {boolean} apply - True to apply, false to remove
     * @returns {Array} - System messages
     */
    applyDefenseModifier(content, modifierType, apply) {
        const [targetName, damageType] = content.split('|').map(s => s.trim())
        if (!targetName || !damageType) return []

        const { targetObj, isPlayer } = this.resolveTarget(targetName)
        if (!targetObj || !isPlayer) return [] // Only apply to player for now

        const property = `${modifierType}s` // resistances, immunities, vulnerabilities
        this.ensureArray(targetObj, property)

        const lowerType = damageType.toLowerCase()
        const exists = targetObj[property].includes(lowerType)

        if (apply && !exists) {
            targetObj[property].push(lowerType)
            const icon = modifierType === 'vulnerability' ? '💔' : '🛡️'
            const action = modifierType === 'vulnerability' ? 'Vulnerability Gained' :
                modifierType === 'immunity' ? 'Immunity Gained' : 'Resistance Gained'
            return [this.createSystemMessage(`${icon} **${action}**: You are now ${modifierType} to ${damageType} damage.`)]
        } else if (!apply && exists) {
            const idx = targetObj[property].indexOf(lowerType)
            targetObj[property].splice(idx, 1)
            const icon = modifierType === 'vulnerability' ? '💔' : '🛡️'
            const action = modifierType === 'vulnerability' ? 'Vulnerability Lost' :
                modifierType === 'immunity' ? 'Immunity Lost' : 'Resistance Lost'
            return [this.createSystemMessage(`${icon} **${action}**: You are no longer ${modifierType} to ${damageType} damage.`)]
        }

        return []
    }

    /**
     * Resolve target name to target object
     * @param {string} targetName - Target name or "player"/"you"
     * @returns {Object} - { targetObj, isPlayer }
     */
    resolveTarget(targetName) {
        const name = targetName.toLowerCase()

        if (name === 'player' || name === 'you') {
            return { targetObj: this.character, isPlayer: true }
        }

        // Find enemy
        const enemy = this.game.combat?.enemies?.find(e =>
            e.id === targetName ||
            e.name.toLowerCase() === name ||
            e.name.toLowerCase().includes(name)
        )

        return { targetObj: enemy || null, isPlayer: false }
    }

    /**
     * Create damage message
     * @param {boolean} isPlayer - Is target the player
     * @param {Object} targetObj - Target object
     * @param {Object} result - Damage result from MechanicsEngine
     * @returns {Object} - System message
     */
    createDamageMessage(isPlayer, targetObj, result) {
        const status = isPlayer
            ? `[HP: ${this.game.currentHP}/${this.character.maxHP}]`
            : `[HP: ${targetObj.hp.current}/${targetObj.hp.max}]`

        const subject = isPlayer ? "You take" : `${targetObj.name} takes`

        return this.createSystemMessage(
            `⚔️ **${subject} ${result.actualDamage} damage** ${result.message} ${status}`
        )
    }
}
