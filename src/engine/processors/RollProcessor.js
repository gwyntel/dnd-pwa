/**
 * RollProcessor - Handles dice roll tags
 * Processes ROLL tag for skills, saves, attacks, and general rolls
 */

import { BaseProcessor } from './BaseProcessor.js'
import { tagParser } from '../TagParser.js'
import { rollDice } from '../../utils/dice.js'
import { buildDiceProfile, rollSkillCheck, rollSavingThrow, rollAttack } from '../../utils/dice5e.js'

export class RollProcessor extends BaseProcessor {
    processRealtimeTags(text, processedTags, callbacks = {}) {
        const { tags } = tagParser.parse(text)

        for (let i = 0; i < tags.length; i++) {
            const tag = tags[i]
            if (tag.type !== 'ROLL') continue

            const tagKey = this.createTagKey(tag.type, tag.index)
            if (processedTags.has(tagKey)) continue

            if (!this.character) continue

            const parts = tag.content.split('|').map(s => s.trim())
            const kind = (parts[0] || '').toLowerCase()

            let rollData = null

            if (kind === 'skill') {
                const skill = parts[1]
                const dc = parts[2] ? parseInt(parts[2], 10) : null
                const roll = rollSkillCheck(this.character, skill, { dc })
                rollData = { kind: 'Skill Check', label: skill, roll }
            } else if (kind === 'save') {
                const ability = parts[1]
                const dc = parts[2] ? parseInt(parts[2], 10) : null
                const roll = rollSavingThrow(this.character, ability, { dc })
                rollData = { kind: 'Saving Throw', label: ability, roll }
            } else if (kind === 'attack') {
                const weapon = parts[1]
                const ac = parts[2] ? parseInt(parts[2], 10) : null
                const rollResult = rollAttack(this.character, weapon, { targetAC: ac }, this.world)

                // Handle composite attack result (toHit + damage)
                if (rollResult.toHit) {
                    // 1. Process Attack Roll
                    if (callbacks.onRoll) {
                        callbacks.onRoll({ kind: 'Attack', label: weapon, roll: rollResult.toHit })
                    }

                    // 2. Process Damage Roll
                    if (rollResult.damage && callbacks.onRoll) {
                        callbacks.onRoll({ kind: 'Damage', label: `${weapon} Damage`, roll: rollResult.damage })
                    }

                    processedTags.add(tagKey)
                    continue
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
                processedTags.add(tagKey)
            }
        }

        return [] // Rolls don't generate system messages directly
    }
}
