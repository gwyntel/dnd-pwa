/**
 * SpellProcessor - Handles spellcasting and spell-related tags
 * Processes CAST_SPELL, LEARN_SPELL, CONCENTRATION_START, CONCENTRATION_END
 */

import { BaseProcessor } from './BaseProcessor.js'
import { tagParser } from '../TagParser.js'
import { castSpell, startConcentration, endConcentration } from '../SpellcastingManager.js'

export class SpellProcessor extends BaseProcessor {
    processRealtimeTags(text, processedTags, callbacks = {}) {
        console.log('[SpellProcessor] processRealtimeTags called with text:', text)
        const { tags } = tagParser.parse(text)
        console.log('[SpellProcessor] Parsed tags:', tags)
        const newMessages = []

        for (let i = 0; i < tags.length; i++) {
            const tag = tags[i]
            const tagKey = this.createTagKey(tag.type, tag.index)

            if (processedTags.has(tagKey)) continue

            let processed = false

            switch (tag.type) {
                case 'CAST_SPELL':
                    console.log('[SpellProcessor] CAST_SPELL tag detected:', tag)
                    // Format: CAST_SPELL[spellId|spellName|level] or CAST_SPELL[spellName|level]
                    const parts = tag.content.split('|').map(s => s.trim())
                    let spellId = null
                    let spellName = parts[0]
                    let spellLevel = 0

                    if (parts.length === 3) {
                        // New format with ID
                        spellId = parts[0]
                        spellName = parts[1]
                        spellLevel = parseInt(parts[2], 10) || 0
                    } else if (parts.length === 2) {
                        // Legacy format (name|level)
                        spellName = parts[0]
                        spellLevel = parseInt(parts[1], 10) || 0
                        // Try to infer ID from name
                        spellId = spellName.toLowerCase().replace(/\s+/g, '-')
                    }

                    console.log('[SpellProcessor] Parsed spell:', { spellId, spellName, spellLevel })
                    console.log('[SpellProcessor] Calling castSpell with:', { game: this.game, character: this.character })

                    const result = castSpell(this.game, this.character, spellName, spellLevel, spellId)

                    console.log('[SpellProcessor] castSpell result:', result)

                    if (result.success) {
                        newMessages.push(...result.messages)
                        processed = true
                    }
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
