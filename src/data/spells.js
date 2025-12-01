/**
 * Common Spells Database
 * Spell definitions with effects and durations
 */
export const COMMON_SPELLS = {
    // Cantrips
    'fire-bolt': {
        id: 'fire-bolt',
        level: 0,
        school: 'evocation',
        name: 'Fire Bolt',
        effects: ['DAMAGE[target|1d10|fire]']
    },
    'mage-hand': {
        id: 'mage-hand',
        level: 0,
        school: 'conjuration',
        name: 'Mage Hand',
        duration: 1,
        durationType: 'minutes'
    },
    'light': {
        id: 'light',
        level: 0,
        school: 'evocation',
        name: 'Light',
        duration: 1,
        durationType: 'hours'
    },
    'prestidigitation': {
        id: 'prestidigitation',
        level: 0,
        school: 'transmutation',
        name: 'Prestidigitation',
        duration: 1,
        durationType: 'hours'
    },
    'ray-of-frost': {
        id: 'ray-of-frost',
        level: 0,
        school: 'evocation',
        name: 'Ray of Frost',
        effects: ['DAMAGE[target|1d8|cold]']
    },
    'sacred-flame': {
        id: 'sacred-flame',
        level: 0,
        school: 'evocation',
        name: 'Sacred Flame',
        effects: ['DAMAGE[target|1d8|radiant]']
    },
    'thaumaturgy': {
        id: 'thaumaturgy',
        level: 0,
        school: 'transmutation',
        name: 'Thaumaturgy',
        duration: 1,
        durationType: 'minutes'
    },
    'vicious-mockery': {
        id: 'vicious-mockery',
        level: 0,
        school: 'enchantment',
        name: 'Vicious Mockery',
        effects: ['DAMAGE[target|1d4|psychic]']
    },

    // 1st Level
    'magic-missile': {
        id: 'magic-missile',
        level: 1,
        school: 'evocation',
        name: 'Magic Missile',
        concentration: false,
        effects: ['DAMAGE[target|1d4+1|force]'] // Per dart, AI handles multiple darts
    },
    'shield': {
        id: 'shield',
        level: 1,
        school: 'abjuration',
        name: 'Shield',
        concentration: false,
        effects: ['+5 AC'],
        duration: 1,
        durationType: 'rounds'
    },
    'bless': {
        id: 'bless',
        level: 1,
        school: 'enchantment',
        name: 'Bless',
        concentration: true,
        effects: ['+1d4 to attack rolls', '+1d4 to saves'],
        duration: 1,
        durationType: 'minutes'
    },
    'cure-wounds': {
        id: 'cure-wounds',
        level: 1,
        school: 'evocation',
        name: 'Cure Wounds',
        concentration: false,
        effects: ['HEAL[player|1d8+spellcasting_mod]']
    },
    'healing-word': {
        id: 'healing-word',
        level: 1,
        school: 'evocation',
        name: 'Healing Word',
        concentration: false,
        effects: ['HEAL[player|1d4+spellcasting_mod]']
    },
    'detect-magic': {
        id: 'detect-magic',
        level: 1,
        school: 'divination',
        name: 'Detect Magic',
        concentration: true,
        duration: 10,
        durationType: 'minutes'
    },
    'identify': {
        id: 'identify',
        level: 1,
        school: 'divination',
        name: 'Identify',
        concentration: false
    },
    'mage-armor': {
        id: 'mage-armor',
        level: 1,
        school: 'abjuration',
        name: 'Mage Armor',
        concentration: false,
        effects: ['+3 AC'],
        duration: 8,
        durationType: 'hours'
    },
    'thunderwave': {
        id: 'thunderwave',
        level: 1,
        school: 'evocation',
        name: 'Thunderwave',
        concentration: false,
        effects: ['DAMAGE[target|2d8|thunder]']
    },
    'sleep': {
        id: 'sleep',
        level: 1,
        school: 'enchantment',
        name: 'Sleep',
        concentration: false,
        duration: 1,
        durationType: 'minutes'
    },
}
