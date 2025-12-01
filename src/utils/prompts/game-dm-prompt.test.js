import { describe, it, expect } from 'vitest'
import { buildGameDMPrompt } from './game-dm-prompt.js'
import { COMMON_SPELLS } from '../../data/spells.js'

// Mock data
const mockCharacter = {
    name: "TestChar",
    level: 1,
    race: "Human",
    class: "Fighter",
    maxHP: 10,
    armorClass: 10,
    speed: 30,
    proficiencyBonus: 2,
    stats: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
    skills: [],
    features: []
}

const mockGame = {
    currentHP: 10,
    currency: { gp: 0 },
    inventory: [],
    combat: { active: false }
}

const mockWorld = {
    name: "Test World",
    tone: "Generic",
    monsters: [
        { id: "goblin", name: "Goblin", cr: "1/4", type: "Humanoid" },
        { id: "dragon", name: "Red Dragon", cr: "10", type: "Dragon" }
    ],
    items: [
        { id: "sword", name: "Longsword", rarity: "common", category: "weapon" },
        { id: "potion", name: "Healing Potion", rarity: "common", category: "consumable" }
    ]
}

describe('game-dm-prompt', () => {
    it('should format monster list concisely', () => {
        const prompt = buildGameDMPrompt(mockCharacter, mockGame, mockWorld)
        expect(prompt).toContain('goblin (Goblin, CR 1/4, Humanoid)')
        expect(prompt).toContain('dragon (Red Dragon, CR 10, Dragon)')
        // Should NOT contain verbose instructions like "Use ENEMY_SPAWN[id] to spawn these creatures" if we change it, 
        // but for now we just check the format of the entries.
    })

    it('should format item list concisely', () => {
        const prompt = buildGameDMPrompt(mockCharacter, mockGame, mockWorld)
        expect(prompt).toContain('sword (Longsword, common, weapon)')
        expect(prompt).toContain('potion (Healing Potion, common, consumable)')
    })

    it('should include compressed spell list', () => {
        const prompt = buildGameDMPrompt(mockCharacter, mockGame, mockWorld)
        // Check for a few common spells
        expect(prompt).toContain('magic-missile (Magic Missile, Lvl 1, evocation)')
        expect(prompt).toContain('fire-bolt (Fire Bolt, Lvl 0, evocation)')
    })
})
