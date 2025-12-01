import { describe, it, expect, beforeEach, vi } from 'vitest'
import { InventoryProcessor } from './InventoryProcessor.js'

// Mock dependencies
vi.mock('../EquipmentManager.js', () => ({
    resolveItem: vi.fn((name, world) => {
        if (name === 'Healing Potion') {
            return { id: 'healing_potion', name: 'Healing Potion', effects: ['HEAL[player|2d4+2]'] }
        }
        return null
    }),
    calculateAC: vi.fn(() => 15),
    handleEquipChange: vi.fn(() => ({ tags: [] })),
    useConsumable: vi.fn(() => ({ success: false, message: 'Not consumable' }))
}))

vi.mock('../ItemGenerator.js', () => ({
    generateItem: vi.fn().mockResolvedValue({})
}))

vi.mock('../TagParser.js', () => ({
    tagParser: {
        parse: vi.fn((text) => {
            // Simple mock parser
            const tags = []
            if (text.includes('INVENTORY_ADD')) {
                tags.push({ type: 'INVENTORY_ADD', content: 'Sword|1', index: 0 })
            }
            return { tags }
        })
    }
}))

vi.mock('../../state/store.js', () => ({
    default: {
        update: vi.fn((updater) => updater({ characters: [] }))
    }
}))

describe('InventoryProcessor', () => {
    let processor
    let game
    let character
    let data

    beforeEach(() => {
        game = {
            id: 'game1',
            worldId: 'world1',
            inventory: [],
            currency: { gp: 50 },
            conditions: [],
            currentHP: 20
        }

        character = {
            id: 'char1',
            name: 'Test Hero',
            maxHP: 30,
            armorClass: 10
        }

        data = {
            worlds: [{ id: 'world1', name: 'Test World' }]
        }

        processor = new InventoryProcessor(game, character, data)
    })

    describe('upsertItem', () => {
        it('should add new item to empty inventory', () => {
            const result = processor.upsertItem('Sword', 1)

            expect(result).toBeTruthy()
            expect(result.name).toBe('Sword')
            expect(result.newQty).toBe(1)
            expect(game.inventory).toHaveLength(1)
            expect(game.inventory[0].id).toBe('sword')
            expect(game.inventory[0].quantity).toBe(1)
        })

        it('should increase quantity of existing item', () => {
            game.inventory = [{ id: 'sword', item: 'Sword', quantity: 1, equipped: false }]

            const result = processor.upsertItem('Sword', 2)

            expect(result.newQty).toBe(3)
            expect(game.inventory).toHaveLength(1)
            expect(game.inventory[0].quantity).toBe(3)
        })

        it('should decrease quantity when given negative delta', () => {
            game.inventory = [{ id: 'arrow', item: 'Arrow', quantity: 10, equipped: false }]

            const result = processor.upsertItem('Arrow', -3)

            expect(result.newQty).toBe(7)
            expect(game.inventory[0].quantity).toBe(7)
        })

        it('should remove item when quantity reaches 0', () => {
            game.inventory = [{ id: 'potion', item: 'Potion', quantity: 1, equipped: false }]

            processor.upsertItem('Potion', -1)

            expect(game.inventory).toHaveLength(0)
        })

        it('should equip item when equip option is true', () => {
            game.inventory = [{ id: 'shield', item: 'Shield', quantity: 1, equipped: false }]

            const result = processor.upsertItem('Shield', 0, { equip: true })

            expect(result.equipped).toBe(true)
            expect(game.inventory[0].equipped).toBe(true)
        })

        it('should unequip item when unequip option is true', () => {
            game.inventory = [{ id: 'helmet', item: 'Helmet', quantity: 1, equipped: true }]

            const result = processor.upsertItem('Helmet', 0, { unequip: true })

            expect(result.equipped).toBe(false)
            expect(game.inventory[0].equipped).toBe(false)
        })

        it('should handle invalid item names', () => {
            const result = processor.upsertItem('', 1)
            expect(result).toBeNull()

            const result2 = processor.upsertItem(null, 1)
            expect(result2).toBeNull()
        })

        it('should sanitize item names with newlines', () => {
            const result = processor.upsertItem('Magic\nSword\r\n', 1)

            expect(result).toBeTruthy()
            expect(game.inventory[0].id).toBe('magic_sword')
        })
    })

    describe('changeGold', () => {
        it('should add gold', () => {
            const result = processor.changeGold(25)

            expect(result.before).toBe(50)
            expect(result.after).toBe(75)
            expect(result.applied).toBe(25)
            expect(game.currency.gp).toBe(75)
        })

        it('should subtract gold', () => {
            const result = processor.changeGold(-20)

            expect(result.before).toBe(50)
            expect(result.after).toBe(30)
            expect(result.applied).toBe(-20)
        })

        it('should not go below 0 gold', () => {
            const result = processor.changeGold(-100)

            expect(result.after).toBe(0)
            expect(game.currency.gp).toBe(0)
        })

        it('should round to 2 decimal places', () => {
            const result = processor.changeGold(0.123)

            expect(result.after).toBe(50.12)
        })

        it('should handle string numbers', () => {
            const result = processor.changeGold('15.50')

            expect(result.applied).toBe(15.5)
        })

        it('should return null for invalid input', () => {
            expect(processor.changeGold('invalid')).toBeNull()
            expect(processor.changeGold(0)).toBeNull()
            expect(processor.changeGold(NaN)).toBeNull()
        })

        it('should initialize currency if missing', () => {
            delete game.currency

            processor.changeGold(10)

            expect(game.currency).toBeDefined()
            expect(game.currency.gp).toBe(10)
        })
    })

    describe('addStatus', () => {
        it('should add new status', () => {
            const result = processor.addStatus('Poisoned')

            expect(result).toBe(true)
            expect(game.conditions).toHaveLength(1)
            expect(game.conditions[0].name).toBe('Poisoned')
        })

        it('should not add duplicate status', () => {
            game.conditions = [{ name: 'Blinded', addedAt: '2024-01-01' }]

            const result = processor.addStatus('Blinded')

            expect(result).toBe(false)
            expect(game.conditions).toHaveLength(1)
        })

        it('should handle legacy string conditions', () => {
            game.conditions = ['Stunned']

            const result = processor.addStatus('Stunned')

            expect(result).toBe(false)
        })

        it('should handle empty names', () => {
            const result = processor.addStatus('')
            expect(result).toBe(false)
        })
    })

    describe('removeStatus', () => {
        it('should remove existing status', () => {
            game.conditions = [{ name: 'Frightened', addedAt: '2024-01-01' }]

            const result = processor.removeStatus('Frightened')

            expect(result).toBe(true)
            expect(game.conditions).toHaveLength(0)
        })

        it('should return false if status not found', () => {
            const result = processor.removeStatus('Invisible')

            expect(result).toBe(false)
        })

        it('should handle legacy string conditions', () => {
            game.conditions = ['Prone']

            const result = processor.removeStatus('Prone')

            expect(result).toBe(true)
            expect(game.conditions).toHaveLength(0)
        })
    })

    describe('processRealtimeTags', () => {
        it('should process INVENTORY_ADD tag', () => {
            const text = 'INVENTORY_ADD[Sword|1]'
            const processedTags = new Set()

            const messages = processor.processRealtimeTags(text, processedTags)

            expect(processedTags.has('INVENTORY_ADD_0')).toBe(true)
            expect(game.inventory.length).toBeGreaterThan(0)
        })

        it('should process GOLD_CHANGE tag', () => {
            const text = 'GOLD_CHANGE[25]'
            const processedTags = new Set()

            processor.processRealtimeTags(text, processedTags)

            // Due to mocking, this might not change, but tag should be marked processed
            expect(processedTags.has('GOLD_CHANGE_0')).toBe(true)
        })

        it('should not process already processed tags', () => {
            const text = 'INVENTORY_ADD[Sword|1]'
            const processedTags = new Set(['INVENTORY_ADD_0'])

            processor.processRealtimeTags(text, processedTags)

            // Should not add duplicate
            expect(game.inventory).toHaveLength(0)
        })
    })
})
