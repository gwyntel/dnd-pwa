import { describe, it, expect, beforeEach } from 'vitest'
import { BaseProcessor } from './BaseProcessor.js'

describe('BaseProcessor', () => {
    let processor
    let game
    let character
    let data

    beforeEach(() => {
        game = { id: 'game1', worldId: 'world1' }
        character = { id: 'char1', name: 'Test Character' }
        data = {
            worlds: [{ id: 'world1', name: 'Test World' }]
        }
        processor = new BaseProcessor(game, character, data)
    })

    describe('constructor', () => {
        it('should initialize with game, character, and data', () => {
            expect(processor.game).toBe(game)
            expect(processor.character).toBe(character)
            expect(processor.data).toBe(data)
        })

        it('should find and set world from data', () => {
            expect(processor.world).toEqual({ id: 'world1', name: 'Test World' })
        })

        it('should set world to null if not found', () => {
            const noWorldData = { worlds: [] }
            const p = new BaseProcessor(game, character, noWorldData)
            expect(p.world).toBeNull()
        })
    })

    describe('ensureArray', () => {
        it('should create array if missing', () => {
            const obj = {}
            processor.ensureArray(obj, 'items')
            expect(obj.items).toEqual([])
        })

        it('should not overwrite existing array', () => {
            const obj = { items: [1, 2, 3] }
            processor.ensureArray(obj, 'items')
            expect(obj.items).toEqual([1, 2, 3])
        })

        it('should use custom default value', () => {
            const obj = {}
            processor.ensureArray(obj, 'items', ['default'])
            expect(obj.items).toEqual(['default'])
        })
    })

    describe('ensureObject', () => {
        it('should create object if missing', () => {
            const obj = {}
            processor.ensureObject(obj, 'stats')
            expect(obj.stats).toEqual({})
        })

        it('should not overwrite existing object', () => {
            const obj = { stats: { hp: 10 } }
            processor.ensureObject(obj, 'stats')
            expect(obj.stats).toEqual({ hp: 10 })
        })

        it('should replace null with object', () => {
            const obj = { stats: null }
            processor.ensureObject(obj, 'stats')
            expect(obj.stats).toEqual({})
        })
    })

    describe('ensureNumber', () => {
        it('should create number if missing', () => {
            const obj = {}
            processor.ensureNumber(obj, 'gold')
            expect(obj.gold).toBe(0)
        })

        it('should not overwrite existing number', () => {
            const obj = { gold: 50 }
            processor.ensureNumber(obj, 'gold')
            expect(obj.gold).toBe(50)
        })

        it('should use custom default value', () => {
            const obj = {}
            processor.ensureNumber(obj, 'gold', 100)
            expect(obj.gold).toBe(100)
        })
    })

    describe('sanitize', () => {
        it('should trim whitespace', () => {
            expect(processor.sanitize('  hello  ')).toBe('hello')
        })

        it('should replace newlines with spaces', () => {
            expect(processor.sanitize('hello\nworld\r\ntest')).toBe('hello world test')
        })

        it('should handle empty strings', () => {
            expect(processor.sanitize('')).toBe('')
        })

        it('should handle null/undefined', () => {
            expect(processor.sanitize(null)).toBe('')
            expect(processor.sanitize(undefined)).toBe('')
        })
    })

    describe('createTagKey', () => {
        it('should create unique key from type and index', () => {
            expect(processor.createTagKey('INVENTORY_ADD', 0)).toBe('INVENTORY_ADD_0')
            expect(processor.createTagKey('DAMAGE', 5)).toBe('DAMAGE_5')
        })
    })

    describe('createSystemMessage', () => {
        it('should create system message with content', () => {
            const msg = processor.createSystemMessage('Test message')
            expect(msg.role).toBe('system')
            expect(msg.content).toBe('Test message')
            expect(msg.hidden).toBe(false)
            expect(msg.id).toMatch(/^msg_/)
            expect(msg.timestamp).toBeTruthy()
        })

        it('should include metadata if provided', () => {
            const msg = processor.createSystemMessage('Test', { type: 'combat' })
            expect(msg.metadata).toEqual({ type: 'combat' })
        })

        it('should generate unique IDs', () => {
            const msg1 = processor.createSystemMessage('Test 1')
            const msg2 = processor.createSystemMessage('Test 2')
            expect(msg1.id).not.toBe(msg2.id)
        })
    })
})
