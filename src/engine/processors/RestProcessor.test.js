import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RestProcessor } from './RestProcessor.js'

vi.mock('../RestManager.js', () => ({
    shortRest: vi.fn(() => ({ role: 'system', content: 'Short rest completed' })),
    longRest: vi.fn(() => ({ role: 'system', content: 'Long rest completed' })),
    spendHitDice: vi.fn(() => ({ role: 'system', content: 'Spent 1 hit die' }))
}))

vi.mock('../TagParser.js', () => ({
    tagParser: {
        parse: vi.fn(() => ({ tags: [] }))
    }
}))

const { tagParser } = await import('../TagParser.js')

describe('RestProcessor', () => {
    let processor
    let game
    let character
    let data

    beforeEach(() => {
        game = {
            id: 'game1',
            worldId: 'world1'
        }

        character = {
            id: 'char1',
            name: 'Fighter',
            maxHP: 30
        }

        data = {
            worlds: [{ id: 'world1', name: 'Test World' }]
        }

        processor = new RestProcessor(game, character, data)
    })

    describe('processRealtimeTags', () => {
        it('should process SHORT_REST tag', () => {
            tagParser.parse.mockReturnValueOnce({
                tags: [{ type: 'SHORT_REST', content: '60', index: 0 }]
            })

            const messages = processor.processRealtimeTags('SHORT_REST[60]', new Set())

            expect(messages).toHaveLength(1)
        })

        it('should process LONG_REST tag', () => {
            tagParser.parse.mockReturnValueOnce({
                tags: [{ type: 'LONG_REST', content: '8', index: 0 }]
            })

            const messages = processor.processRealtimeTags('LONG_REST[8]', new Set())

            expect(messages).toHaveLength(1)
        })

        it('should process HIT_DIE_ROLL tag', () => {
            tagParser.parse.mockReturnValueOnce({
                tags: [{ type: 'HIT_DIE_ROLL', content: '2', index: 0 }]
            })

            const messages = processor.processRealtimeTags('HIT_DIE_ROLL[2]', new Set())

            expect(messages).toHaveLength(1)
        })

        it('should use default duration for SHORT_REST', async () => {
            const { shortRest } = await import('../RestManager.js')
            
            tagParser.parse.mockReturnValueOnce({
                tags: [{ type: 'SHORT_REST', content: '', index: 0 }]
            })

            processor.processRealtimeTags('SHORT_REST[]', new Set())

            expect(shortRest).toHaveBeenCalledWith(game, character, 60)
        })

        it('should not process already processed tags', () => {
            tagParser.parse.mockReturnValueOnce({
                tags: [{ type: 'SHORT_REST', content: '60', index: 0 }]
            })

            const processedTags = new Set(['SHORT_REST_0'])
            const messages = processor.processRealtimeTags('SHORT_REST[60]', processedTags)

            expect(messages).toHaveLength(0)
        })
    })
})
