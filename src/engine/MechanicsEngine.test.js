import { describe, it, expect, vi, beforeEach } from 'vitest'
import { applyDamageWithType, applyTempHP, checkConcentration } from './MechanicsEngine.js'
import * as dice5e from '../utils/dice5e.js'

// Mock dice5e
vi.mock('../utils/dice5e.js', () => ({
    roll: vi.fn(),
    rollSavingThrow: vi.fn()
}))

describe('MechanicsEngine', () => {
    describe('applyDamageWithType', () => {
        it('applies normal damage correctly', () => {
            const target = { hp: { current: 20, max: 20 }, resistances: [], vulnerabilities: [], immunities: [] }
            const result = applyDamageWithType(target, 10, 'slashing')
            expect(result.actualDamage).toBe(10)
            expect(result.message).toBe('')
        })

        it('applies resistance (half damage)', () => {
            const target = { hp: { current: 20, max: 20 }, resistances: ['fire'], vulnerabilities: [], immunities: [] }
            const result = applyDamageWithType(target, 10, 'fire')
            expect(result.actualDamage).toBe(5)
            expect(result.message).toContain('(Resisted)')
        })

        it('applies vulnerability (double damage)', () => {
            const target = { hp: { current: 20, max: 20 }, resistances: [], vulnerabilities: ['cold'], immunities: [] }
            const result = applyDamageWithType(target, 10, 'cold')
            expect(result.actualDamage).toBe(20)
            expect(result.message).toContain('(Vulnerable)')
        })

        it('applies immunity (zero damage)', () => {
            const target = { hp: { current: 20, max: 20 }, resistances: [], vulnerabilities: [], immunities: ['poison'] }
            const result = applyDamageWithType(target, 10, 'poison')
            expect(result.actualDamage).toBe(0)
            expect(result.message).toContain('(Immune)')
        })

        it('handles temp HP correctly', () => {
            const target = { hp: { current: 20, max: 20 }, tempHP: 5, resistances: [], vulnerabilities: [], immunities: [] }
            const result = applyDamageWithType(target, 8, 'slashing')
            // 8 damage. 5 absorbed by temp HP. 3 remaining.
            expect(result.tempHPRemoved).toBe(5)
            expect(result.actualDamage).toBe(3)
        })
    })

    describe('applyTempHP', () => {
        it('grants temp HP if current is 0', () => {
            const target = { tempHP: 0 }
            const result = applyTempHP(target, 10)
            expect(result.newTempHP).toBe(10)
        })

        it('replaces temp HP if new amount is higher', () => {
            const target = { tempHP: 5 }
            const result = applyTempHP(target, 10)
            expect(result.newTempHP).toBe(10)
        })

        it('keeps current temp HP if new amount is lower', () => {
            const target = { tempHP: 10 }
            const result = applyTempHP(target, 5)
            expect(result.newTempHP).toBe(10)
        })
    })

    describe('checkConcentration', () => {
        beforeEach(() => {
            vi.clearAllMocks()
        })

        it('calculates DC correctly (minimum 10)', () => {
            const character = {
                concentration: { spellName: 'Bless' },
                stats: { constitution: 10 }
            }

            // Mock roll failure
            dice5e.rollSavingThrow.mockReturnValue({ total: 5, rolls: [5] })

            const result = checkConcentration(character, 10) // DC should be 10
            expect(result.dc || result.saveDC).toBe(10)
            expect(result.concentrationBroken).toBe(true)
        })

        it('calculates DC correctly (damage/2)', () => {
            const character = {
                concentration: { spellName: 'Bless' },
                stats: { constitution: 10 }
            }

            // Mock roll failure
            dice5e.rollSavingThrow.mockReturnValue({ total: 5, rolls: [5] })

            const result = checkConcentration(character, 30) // DC should be 15
            expect(result.dc || result.saveDC).toBe(15)
        })

        it('passes check if roll is high enough', () => {
            const character = {
                concentration: { spellName: 'Bless' },
                stats: { constitution: 10 }
            }

            // Mock roll success
            dice5e.rollSavingThrow.mockReturnValue({ total: 15, rolls: [15] })

            const result = checkConcentration(character, 10) // DC 10
            expect(result.concentrationBroken).toBe(false)
        })
    })
})
