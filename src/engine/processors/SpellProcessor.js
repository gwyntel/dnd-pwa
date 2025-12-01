/**
 * SpellProcessor - Handles spellcasting and spell-related tags
 * Processes CAST_SPELL, LEARN_SPELL, CONCENTRATION_START, CONCENTRATION_END
 */

import { BaseProcessor } from './BaseProcessor.js'
import { tagParser } from '../TagParser.js'
import { castSpell, startConcentration, endConcentration } from '../SpellcastingManager.js'

export class SpellProcessor extends BaseProcessor {
    processRealtimeTags(text, processedTags, callbacks = {}) {
        const { tags } = tagParser.parse(text)
        const newMessages = []

        for (let i = 0; i < tags.length; i++) {
            const tag = tags[i]
            const tagKey = this.createTagKey(tag.type, tag.index)

            if (processedTags.has(tagKey)) continue

            let processed = false

            switch (tag.type) {
                case 'CAST_SPELL':
                    const [spell, level] = tag.content.split('|').map(s => s.trim())
                    const result = castSpell(this.game, this.character, spell, parseInt(level, 10) || 0)
                    if (result) processed = true
                    break

                case 'LEARN_SPELL':
                    const messages = this.processLearnSpell(tag.content)
                    newMessages.push(...messages)
                    processed = messages.length > 0
                    break

                case 'CONCENTRATION_START':
                    const startResult = startConcentration(this.game, this.sanitize(tag.content))
                    if (startResult) processed = true
                    break

                case 'CONCENTRATION_END':
                    const endResult = endConcentration(this.game)
                    if (endResult) processed = true
                    break
            }

            if (processed) {
                processedTags.add(tagKey)
            }
        }

        return newMessages
    }

    processLearnSpell(content) {
        const spellName = this.sanitize(content)
        if (!spellName || !this.character) return []

        this.ensureArray(this.character, 'knownSpells')

        const alreadyKnown = this.character.knownSpells.some(s =>
            s.name.toLowerCase() === spellName.toLowerCase()
        )

        if (alreadyKnown) return []

        this.character.knownSpells.push({
            name: spellName,
            level: 0,
            school: 'Unknown',
            source: 'learned'
        })

        return [
            this.createSystemMessage(
                `✨ **New Spell Learned!**\nYou have added **${spellName}** to your known spells.`
            )
        ]
    }
}
