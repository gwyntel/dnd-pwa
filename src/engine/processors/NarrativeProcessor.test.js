import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NarrativeProcessor } from './NarrativeProcessor.js'

vi.mock('../TagParser.js', () => ({
    tagParser: {
        parse: vi.fn(() => ({ tags: [] }))
    }
}))

describe('NarrativeProcessor', () => {
    let processor
    let game
    let character
    let data

    beforeEach(() => {
        game = {
            id: 'game1',
            worldId: 'world1',
            currentLocation: 'Tavern',
            visitedLocations: ['Tavern'],
            relationships: {},
            suggestedActions: [],
            questLog: []
        }

        character = {
            id: 'char1',
            name: 'Hero',
            level: 1,
            xp: { current: 0, max: 300, history: [] }
        }

        data = {
            worlds: [{ id: 'world1', name: 'Test World' }]
        }

        processor = new NarrativeProcessor(game, character, data)
    })

    describe('processLocation', () => {
        it('should update current location', () => {
            const result = processor.processLocation('Market Square')

            expect(result).toBe(true)
            expect(game.currentLocation).toBe('Market Square')
        })

        it('should add to visited locations', () => {
            processor.processLocation('Forest Path')

            expect(game.visitedLocations).toContain('Forest Path')
        })

        it('should not duplicate visited locations', () => {
            processor.processLocation('Tavern')
            processor.processLocation('Tavern')

            const count = game.visitedLocations.filter(l => l === 'Tavern').length
            expect(count).toBe(1)
        })

        it('should handle empty location', () => {
            const result = processor.processLocation('')

            expect(result).toBe(false)
        })
    })

    describe('processRelationship', () => {
        it('should add new relationship', () => {
            const result = processor.processRelationship('Shopkeeper|5')

            expect(result).toBe(true)
            expect(game.relationships.Shopkeeper).toBe(5)
        })

        it('should update existing relationship', () => {
            game.relationships.Guard = 3
            processor.processRelationship('Guard|2')

            expect(game.relationships.Guard).toBe(5)
        })

        it('should handle negative values', () => {
            processor.processRelationship('Villain|-10')

            expect(game.relationships.Villain).toBe(-10)
        })

        it('should reject invalid format', () => {
            const result = processor.processRelationship('NoValue')

            expect(result).toBe(false)
        })
    })

    describe('processAction', () => {
        it('should add suggested action', () => {
            const result = processor.processAction('Talk to the innkeeper')

            expect(result).toBe(true)
            expect(game.suggestedActions).toContain('Talk to the innkeeper')
        })

        it('should not add duplicate actions', () => {
            processor.processAction('Attack')
            const result = processor.processAction('Attack')

            expect(result).toBe(false)
            expect(game.suggestedActions.filter(a => a === 'Attack')).toHaveLength(1)
        })
    })

    describe('processXPGain', () => {
        it('should add XP to character', () => {
            processor.processXPGain('100|Defeated goblin')

            expect(character.xp.current).toBe(100)
            expect(character.xp.history).toHaveLength(1)
            expect(character.xp.history[0].reason).toBe('Defeated goblin')
        })

        it('should trigger level up message when XP threshold reached', () => {
            character.xp.current = 280
            const messages = processor.processXPGain('50|Quest completed')

            expect(character.xp.current).toBe(330)
            expect(messages).toHaveLength(1)
            expect(messages[0].content).toContain('LEVEL UP')
        })

        it('should handle missing reason parameter', () => {
            processor.processXPGain('50')

            expect(character.xp.history[0].reason).toBe('Unknown')
        })
    })

    describe('processQuestAdd', () => {
        it('should add quest to log', () => {
            const result = processor.processQuestAdd('Find the lost sword')

            expect(result).toBe(true)
            expect(game.questLog).toContain('Find the lost sword')
        })

        it('should not add duplicate quests', () => {
            processor.processQuestAdd('Rescue the princess')
            const result = processor.processQuestAdd('Rescue the princess')

            expect(result).toBe(false)
            expect(game.questLog).toHaveLength(1)
        })
    })
})
