import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CombatProcessor } from './CombatProcessor.js'

// Mock dependencies
vi.mock('../MechanicsEngine.js', () => ({
    applyDamageWithType: vi.fn((target, amount) => ({
        actualDamage: amount,
        tempHPRemoved: 0,
        message: ''
    })),
    applyTempHP: vi.fn((target, amount) => ({
        newTempHP: amount,
        message: `Gained ${amount} temp HP`
    })),
    checkConcentration: vi.fn(() => ({ concentrationBroken: false }))
}))

vi.mock('../SpellcastingManager.js', () => ({
    endConcentration: vi.fn()
}))

vi.mock('../TagParser.js', () => ({
    tagParser: {
        parse: vi.fn((text) => ({ tags: [] }))
    }
}))

vi.mock('../../utils/dice.js', () => ({
    rollDice: vi.fn((notation) => ({ total: 10, notation, rolls: [10] }))
}))

vi.mock('../../state/store.js', () => ({
    default: { update: vi.fn() }
}))

describe('CombatProcessor', () => {
    let processor
    let game
    let character
    let data

    beforeEach(() => {
        game = {
            id: 'game1',
            worldId: 'world1',
            currentHP: 25,
            combat: {
                active: true,
                enemies: [
                    { id: 'goblin1', name: 'Goblin', hp: { current: 7, max: 7 }, conditions: [] }
                ]
            }
        }

        character = {
            id: 'char1',
            name: 'Hero',
            maxHP: 30,
            armorClass: 15
        }

        data = {
            worlds: [{ id: 'world1', name: 'Test World' }]
        }

        processor = new CombatProcessor(game, character, data)
    })

    describe('processDamage', () => {
        it('should apply damage to player', () => {
            const messages = processor.processDamage('player|5|slashing', {})

            expect(game.currentHP).toBe(20)
            expect(messages).toHaveLength(1)
            expect(messages[0].content).toContain('damage')
        })

        it('should handle dice notation for damage', () => {
            const messages = processor.processDamage('player|2d6|fire', {})

            expect(messages).toHaveLength(1)
        })

        it('should not go below 0 HP', () => {
            processor.processDamage('player|100|bludgeoning', {})

            expect(game.currentHP).toBe(0)
        })

        it('should apply damage to enemy', () => {
            const messages = processor.processDamage('goblin|5|slashing', {})

            const goblin = game.combat.enemies[0]
            expect(goblin.hp.current).toBe(2)
            expect(messages).toHaveLength(1)
        })

        it('should mark enemy as dead at 0 HP', () => {
            processor.processDamage('goblin|7|piercing', {})

            const goblin = game.combat.enemies[0]
            expect(goblin.hp.current).toBe(0)
            expect(goblin.conditions).toContain('Dead')
        })
    })

    describe('processHeal', () => {
        it('should heal player', () => {
            const messages = processor.processHeal('player|10')

            expect(game.currentHP).toBe(30) // Capped at maxHP
            expect(messages).toHaveLength(1)
            expect(messages[0].content).toContain('Healed')
        })

        it('should handle dice notation for healing', () => {
            game.currentHP = 10
            processor.processHeal('player|2d4+2')

            expect(game.currentHP).toBeGreaterThan(10)
        })

        it('should not exceed max HP', () => {
            game.currentHP = 28
            processor.processHeal('player|5')

            expect(game.currentHP).toBe(30)
        })
    })

    describe('processTempHP', () => {
        it('should give temporary HP', () => {
            const messages = processor.processTempHP('player|5')

            expect(character.tempHP).toBe(5)
            expect(messages).toHaveLength(1)
        })
    })

    describe('applyDefenseModifier', () => {
        it('should apply resistance', () => {
            const messages = processor.applyDefenseModifier('player|fire', 'resistance', true)

            expect(character.resistances).toContain('fire')
            expect(messages).toHaveLength(1)
            expect(messages[0].content).toContain('Resistance Gained')
        })

        it('should remove resistance', () => {
            character.resistances = ['fire']
            const messages = processor.applyDefenseModifier('player|fire', 'resistance', false)

            expect(character.resistances).not.toContain('fire')
            expect(messages[0].content).toContain('Resistance Lost')
        })

        it('should apply immunity', () => {
            const messages = processor.applyDefenseModifier('player|poison', 'immunity', true)

            expect(character.immunities).toContain('poison')
        })

        it('should apply vulnerability', () => {
            const messages = processor.applyDefenseModifier('player|cold', 'vulnerability', true)

            expect(character.vulnerabilities).toContain('cold')
        })
    })

    describe('resolveTarget', () => {
        it('should resolve player target', () => {
            const { targetObj, isPlayer } = processor.resolveTarget('player')

            expect(targetObj).toBe(character)
            expect(isPlayer).toBe(true)
        })

        it('should resolve "you" as player', () => {
            const { targetObj, isPlayer } = processor.resolveTarget('you')

            expect(isPlayer).toBe(true)
        })

        it('should resolve enemy by name', () => {
            const { targetObj, isPlayer } = processor.resolveTarget('Goblin')

            expect(targetObj).toBe(game.combat.enemies[0])
            expect(isPlayer).toBe(false)
        })

        it('should return null for unknown target', () => {
            const { targetObj } = processor.resolveTarget('Dragon')

            expect(targetObj).toBeNull()
        })
    })
})
