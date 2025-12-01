import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SpellProcessor } from './SpellProcessor.js'

vi.mock('../SpellcastingManager.js', () => ({
    castSpell: vi.fn(() => true),
    startConcentration: vi.fn(() => true),
    endConcentration: vi.fn(() => true)
}))

vi.mock('../TagParser.js', () => ({
    tagParser: {
        parse: vi.fn(() => ({ tags: [] }))
    }
}))

describe('SpellProcessor', () => {
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
            name: 'Wizard',
            knownSpells: []
        }

        data = {
            worlds: [{ id: 'world1', name: 'Test World' }]
        }

        processor = new SpellProcessor(game, character, data)
    })

    describe('processLearnSpell', () => {
        it('should learn new spell', () => {
            const messages = processor.processLearnSpell('Fireball')

            expect(messages).toHaveLength(1)
            expect(messages[0].content).toContain('Fireball')
            expect(character.knownSpells).toHaveLength(1)
            expect(character.knownSpells[0].name).toBe('Fireball')
        })

        it('should not learn duplicate spell', () => {
            character.knownSpells = [{ name: 'Magic Missile', level: 1, school: 'Evocation' }]
            const messages = processor.processLearnSpell('Magic Missile')

            expect(messages).toHaveLength(0)
            expect(character.knownSpells).toHaveLength(1)
        })

        it('should handle case-insensitive spell names', () => {
            character.knownSpells = [{ name: 'Shield', level: 1, school: 'Abjuration' }]
            const messages = processor.processLearnSpell('shield')

            expect(messages).toHaveLength(0)
        })

        it('should handle empty spell name', () => {
            const messages = processor.processLearnSpell('')

            expect(messages).toHaveLength(0)
        })

        it('should set default properties for learned spell', () => {
            processor.processLearnSpell('Cure Wounds')

            const spell = character.knownSpells[0]
            expect(spell.level).toBe(0)
            expect(spell.school).toBe('Unknown')
            expect(spell.source).toBe('learned')
        })
    })
})
