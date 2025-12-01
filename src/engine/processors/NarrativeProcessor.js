/**
 * NarrativeProcessor - Handles narrative and progression tags
 * Processes LOCATION, RELATIONSHIP, ACTION, XP_GAIN, and related tags
 */

import { BaseProcessor } from './BaseProcessor.js'
import { tagParser } from '../TagParser.js'

export class NarrativeProcessor extends BaseProcessor {
    processRealtimeTags(text, processedTags, callbacks = {}) {
        const { tags } = tagParser.parse(text)
        const newMessages = []

        for (let i = 0; i < tags.length; i++) {
            const tag = tags[i]
            const tagKey = this.createTagKey(tag.type, tag.index)

            if (processedTags.has(tagKey)) continue

            let processed = false

            switch (tag.type) {
                case 'LOCATION':
                    processed = this.processLocation(tag.content)
                    break

                case 'RELATIONSHIP':
                    processed = this.processRelationship(tag.content)
                    break

                case 'ACTION':
                    processed = this.processAction(tag.content)
                    break

                case 'XP_GAIN':
                    const messages = this.processXPGain(tag.content)
                    newMessages.push(...messages)
                    processed = messages.length > 0
                    break

                case 'QUEST_ADD':
                    processed = this.processQuestAdd(tag.content)
                    break
            }

            if (processed) {
                processedTags.add(tagKey)
            }
        }

        return newMessages
    }

    processLocation(content) {
        const loc = this.sanitize(content)
        if (!loc) return false

        this.game.currentLocation = loc
        this.ensureArray(this.game, 'visitedLocations')
        if (!this.game.visitedLocations.includes(loc)) {
            this.game.visitedLocations.push(loc)
        }
        return true
    }

    processRelationship(content) {
        const [entity, delta] = content.split('|').map(s => s.trim())
        const val = parseInt(delta, 10)

        if (!entity || isNaN(val)) return false

        this.ensureObject(this.game, 'relationships')
        this.game.relationships[entity] = (this.game.relationships[entity] || 0) + val
        return true
    }

    processAction(content) {
        this.ensureArray(this.game, 'suggestedActions')
        const action = this.sanitize(content)

        if (!action || this.game.suggestedActions.includes(action)) return false

        this.game.suggestedActions.push(action)
        return true
    }

    processXPGain(content) {
        const [amount, reason] = content.split('|').map(s => s.trim())
        const xp = parseInt(amount, 10)

        if (isNaN(xp) || !this.character || !this.character.xp) return []

        this.character.xp.current += xp
        this.character.xp.history.push({
            amount: xp,
            reason: reason || 'Unknown',
            date: new Date().toISOString()
        })

        // Check for Level Up
        if (this.character.xp.current >= this.character.xp.max) {
            return [
                this.createSystemMessage(
                    `🎉 **LEVEL UP AVAILABLE!**\nYou have reached **${this.character.xp.current} XP**! Open your character sheet to level up.`
                )
            ]
        }

        return []
    }

    processQuestAdd(content) {
        this.ensureArray(this.game, 'questLog')
        const quest = this.sanitize(content)

        if (!quest || this.game.questLog.includes(quest)) return false

        this.game.questLog.push(quest)
        return true
    }
}
