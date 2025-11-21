/**
 * Common Spells Database
 * Minimal spell definitions - AI handles full descriptions
 */
export const COMMON_SPELLS = {
    // Cantrips
    'fire-bolt': { level: 0, school: 'evocation', name: 'Fire Bolt' },
    'mage-hand': { level: 0, school: 'conjuration', name: 'Mage Hand' },
    'light': { level: 0, school: 'evocation', name: 'Light' },
    'prestidigitation': { level: 0, school: 'transmutation', name: 'Prestidigitation' },
    'ray-of-frost': { level: 0, school: 'evocation', name: 'Ray of Frost' },
    'sacred-flame': { level: 0, school: 'evocation', name: 'Sacred Flame' },
    'thaumaturgy': { level: 0, school: 'transmutation', name: 'Thaumaturgy' },
    'vicious-mockery': { level: 0, school: 'enchantment', name: 'Vicious Mockery' },

    // 1st Level
    'magic-missile': { level: 1, school: 'evocation', name: 'Magic Missile', concentration: false },
    'shield': { level: 1, school: 'abjuration', name: 'Shield', concentration: false },
    'bless': { level: 1, school: 'enchantment', name: 'Bless', concentration: true },
    'cure-wounds': { level: 1, school: 'evocation', name: 'Cure Wounds', concentration: false },
    'healing-word': { level: 1, school: 'evocation', name: 'Healing Word', concentration: false },
    'detect-magic': { level: 1, school: 'divination', name: 'Detect Magic', concentration: true },
    'identify': { level: 1, school: 'divination', name: 'Identify', concentration: false },
    'mage-armor': { level: 1, school: 'abjuration', name: 'Mage Armor', concentration: false },
    'thunderwave': { level: 1, school: 'evocation', name: 'Thunderwave', concentration: false },
    'sleep': { level: 1, school: 'enchantment', name: 'Sleep', concentration: false },
}
