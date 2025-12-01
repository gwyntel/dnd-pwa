/**
 * RestProcessor - Handles rest-related tags
 * Processes SHORT_REST, LONG_REST, HIT_DIE_ROLL
 */

import { BaseProcessor } from './BaseProcessor.js'
import { tagParser } from '../TagParser.js'
import { shortRest, longRest, spendHitDice } from '../RestManager.js'

export class RestProcessor extends BaseProcessor {
    processRealtimeTags(text, processedTags, callbacks = {}) {
        const { tags } = tagParser.parse(text)
        const newMessages = []

        for (let i = 0; i < tags.length; i++) {
            const tag = tags[i]
            const tagKey = this.createTagKey(tag.type, tag.index)

            if (processedTags.has(tagKey)) continue

            let processed = false
            let message = null

            switch (tag.type) {
                case 'SHORT_REST':
                    const duration = parseInt(tag.content, 10) || 60
                    message = shortRest(this.game, this.character, duration)
                    if (message) {
                        newMessages.push(message)
                        processed = true
                    }
                    break

                case 'LONG_REST':
                    const longDuration = parseInt(tag.content, 10) || 8
                    message = longRest(this.game, this.character, longDuration)
                    if (message) {
                        newMessages.push(message)
                        processed = true
                    }
                    break

                case 'HIT_DIE_ROLL':
                    const count = parseInt(tag.content, 10) || 1
                    message = spendHitDice(this.game, this.character, count)
                    if (message) {
                        newMessages.push(message)
                        processed = true
                    }
                    break
            }

            if (processed) {
                processedTags.add(tagKey)
            }
        }

        return newMessages
    }
}
