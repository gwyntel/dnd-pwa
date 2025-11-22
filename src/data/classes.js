/**
 * D&D 5e Class Progression Data
 * Defines what characters gain at each level up.
 */

export const XP_THRESHOLDS = {
    1: 0,
    2: 300,
    3: 900,
    4: 2700,
    5: 6500,
    6: 14000,
    7: 23000,
    8: 34000,
    9: 48000,
    10: 64000,
    11: 85000,
    12: 100000,
    13: 120000,
    14: 140000,
    15: 165000,
    16: 195000,
    17: 225000,
    18: 265000,
    19: 305000,
    20: 355000
}

export const CLASS_PROGRESSION = {
    Fighter: {
        hp_die: "1d10",
        2: { features: ["Action Surge (1/rest)"] },
        3: { features: ["Martial Archetype"] },
        4: { features: ["Ability Score Improvement"], asi: true },
        5: { features: ["Extra Attack"] },
        6: { features: ["Ability Score Improvement"], asi: true },
        7: { features: ["Martial Archetype Feature"] },
        8: { features: ["Ability Score Improvement"], asi: true },
        9: { features: ["Indomitable (1/rest)"] },
        10: { features: ["Martial Archetype Feature"] },
        11: { features: ["Extra Attack (2)"] },
        12: { features: ["Ability Score Improvement"], asi: true },
        13: { features: ["Indomitable (2/rest)"] },
        14: { features: ["Ability Score Improvement"], asi: true },
        15: { features: ["Martial Archetype Feature"] },
        16: { features: ["Ability Score Improvement"], asi: true },
        17: { features: ["Action Surge (2/rest)", "Indomitable (3/rest)"] },
        18: { features: ["Martial Archetype Feature"] },
        19: { features: ["Ability Score Improvement"], asi: true },
        20: { features: ["Extra Attack (3)"] }
    },
    Rogue: {
        hp_die: "1d8",
        2: { features: ["Cunning Action"] },
        3: { features: ["Roguish Archetype", "Sneak Attack (2d6)"] },
        4: { features: ["Ability Score Improvement"], asi: true },
        5: { features: ["Uncanny Dodge", "Sneak Attack (3d6)"] },
        6: { features: ["Expertise"] },
        7: { features: ["Evasion", "Sneak Attack (4d6)"] },
        8: { features: ["Ability Score Improvement"], asi: true },
        9: { features: ["Roguish Archetype Feature", "Sneak Attack (5d6)"] },
        10: { features: ["Ability Score Improvement"], asi: true },
        11: { features: ["Reliable Talent", "Sneak Attack (6d6)"] },
        12: { features: ["Ability Score Improvement"], asi: true },
        13: { features: ["Roguish Archetype Feature", "Sneak Attack (7d6)"] },
        14: { features: ["Blindsense"] },
        15: { features: ["Slippery Mind", "Sneak Attack (8d6)"] },
        16: { features: ["Ability Score Improvement"], asi: true },
        17: { features: ["Roguish Archetype Feature", "Sneak Attack (9d6)"] },
        18: { features: ["Elusive"] },
        19: { features: ["Ability Score Improvement", "Sneak Attack (10d6)"], asi: true },
        20: { features: ["Stroke of Luck"] }
    },
    Wizard: {
        hp_die: "1d6",
        2: {
            features: ["Arcane Tradition"],
            spell_slots: { 1: 3 },
            new_spells_known: 2
        },
        3: {
            features: ["2nd Level Spells"],
            spell_slots: { 1: 4, 2: 2 },
            new_spells_known: 2
        },
        4: {
            features: ["Ability Score Improvement"],
            spell_slots: { 1: 4, 2: 3 },
            new_spells_known: 2,
            asi: true
        },
        5: {
            features: ["3rd Level Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 2 },
            new_spells_known: 2
        },
        6: {
            features: ["Arcane Tradition Feature"],
            spell_slots: { 1: 4, 2: 3, 3: 3 },
            new_spells_known: 2
        },
        7: {
            features: ["4th Level Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 1 },
            new_spells_known: 2
        },
        8: {
            features: ["Ability Score Improvement"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 2 },
            new_spells_known: 2,
            asi: true
        },
        9: {
            features: ["5th Level Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
            new_spells_known: 2
        },
        10: {
            features: ["Arcane Tradition Feature"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
            new_spells_known: 2
        },
        11: {
            features: ["6th Level Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
            new_spells_known: 2
        },
        12: {
            features: ["Ability Score Improvement"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
            new_spells_known: 2,
            asi: true
        },
        13: {
            features: ["7th Level Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
            new_spells_known: 2
        },
        14: {
            features: ["Arcane Tradition Feature"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
            new_spells_known: 2
        },
        15: {
            features: ["8th Level Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
            new_spells_known: 2
        },
        16: {
            features: ["Ability Score Improvement"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
            new_spells_known: 2,
            asi: true
        },
        17: {
            features: ["9th Level Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 },
            new_spells_known: 2
        },
        18: {
            features: ["Spell Mastery"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 1, 7: 1, 8: 1, 9: 1 },
            new_spells_known: 2
        },
        19: {
            features: ["Ability Score Improvement"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 1, 8: 1, 9: 1 },
            new_spells_known: 2,
            asi: true
        },
        20: {
            features: ["Signature Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 },
            new_spells_known: 2
        }
    },
    Cleric: {
        hp_die: "1d8",
        2: {
            features: ["Channel Divinity (1/rest)", "Divine Domain Feature"],
            spell_slots: { 1: 3 }
        },
        3: {
            features: ["2nd Level Spells"],
            spell_slots: { 1: 4, 2: 2 }
        },
        4: {
            features: ["Ability Score Improvement"],
            spell_slots: { 1: 4, 2: 3 },
            asi: true
        },
        5: {
            features: ["Destroy Undead (CR 1/2)", "3rd Level Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 2 }
        },
        6: {
            features: ["Channel Divinity (2/rest)", "Divine Domain Feature"],
            spell_slots: { 1: 4, 2: 3, 3: 3 }
        },
        7: {
            features: ["4th Level Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 1 }
        },
        8: {
            features: ["Ability Score Improvement", "Destroy Undead (CR 1)", "Divine Domain Feature"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 2 },
            asi: true
        },
        9: {
            features: ["5th Level Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 }
        },
        10: {
            features: ["Divine Intervention"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 }
        },
        11: {
            features: ["Destroy Undead (CR 2)", "6th Level Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 }
        },
        12: {
            features: ["Ability Score Improvement"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
            asi: true
        },
        13: {
            features: ["7th Level Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 }
        },
        14: {
            features: ["Destroy Undead (CR 3)"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 }
        },
        15: {
            features: ["8th Level Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 }
        },
        16: {
            features: ["Ability Score Improvement"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
            asi: true
        },
        17: {
            features: ["Destroy Undead (CR 4)", "9th Level Spells", "Divine Domain Feature"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 }
        },
        18: {
            features: ["Channel Divinity (3/rest)"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 1, 7: 1, 8: 1, 9: 1 }
        },
        19: {
            features: ["Ability Score Improvement"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 1, 8: 1, 9: 1 },
            asi: true
        },
        20: {
            features: ["Divine Intervention Improvement"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 }
        }
    },
    Technomancer: {
        hp_die: "1d6",
        2: {
            features: ["Technomantic Protocol", "Tech Cantrips"],
            spell_slots: { 1: 2 },
            new_spells_known: 2
        },
        3: {
            features: ["Cybernetic Integration", "2nd Level Tech Spells"],
            spell_slots: { 1: 3, 2: 2 },
            new_spells_known: 2
        },
        4: {
            features: ["Ability Score Improvement"],
            spell_slots: { 1: 3, 2: 3 },
            new_spells_known: 2,
            asi: true
        },
        5: {
            features: ["Digital Override", "3rd Level Tech Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 2 },
            new_spells_known: 2
        },
        6: {
            features: ["Protocol Enhancement"],
            spell_slots: { 1: 4, 2: 3, 3: 3 },
            new_spells_known: 2
        },
        7: {
            features: ["4th Level Tech Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 1 },
            new_spells_known: 2
        },
        8: {
            features: ["Ability Score Improvement", "System Shock"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 2 },
            new_spells_known: 2,
            asi: true
        },
        9: {
            features: ["5th Level Tech Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
            new_spells_known: 2
        },
        10: {
            features: ["Neural Link", "Protocol Enhancement"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
            new_spells_known: 2
        },
        11: {
            features: ["6th Level Tech Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
            new_spells_known: 2
        },
        12: {
            features: ["Ability Score Improvement"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
            new_spells_known: 2,
            asi: true
        },
        13: {
            features: ["7th Level Tech Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
            new_spells_known: 2
        },
        14: {
            features: ["Reality Hack", "Protocol Enhancement"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
            new_spells_known: 2
        },
        15: {
            features: ["8th Level Tech Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
            new_spells_known: 2
        },
        16: {
            features: ["Ability Score Improvement"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
            new_spells_known: 2,
            asi: true
        },
        17: {
            features: ["9th Level Tech Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 },
            new_spells_known: 2
        },
        18: {
            features: ["Quantum Processing"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 1, 7: 1, 8: 1, 9: 1 },
            new_spells_known: 2
        },
        19: {
            features: ["Ability Score Improvement"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 1, 8: 1, 9: 1 },
            new_spells_known: 2,
            asi: true
        },
        20: {
            features: ["Singularity Core", "Master Technomancer"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 },
            new_spells_known: 2
        }
    },
    Barbarian: {
        hp_die: "1d12",
        2: { features: ["Reckless Attack", "Danger Sense"] },
        3: { features: ["Primal Path"] },
        4: { features: ["Ability Score Improvement"], asi: true },
        5: { features: ["Extra Attack", "Fast Movement"] },
        6: { features: ["Primal Path Feature"] },
        7: { features: ["Feral Instinct"] },
        8: { features: ["Ability Score Improvement"], asi: true },
        9: { features: ["Brutal Critical (1 die)"] },
        10: { features: ["Primal Path Feature"] },
        11: { features: ["Relentless Rage"] },
        12: { features: ["Ability Score Improvement"], asi: true },
        13: { features: ["Brutal Critical (2 dice)"] },
        14: { features: ["Primal Path Feature"] },
        15: { features: ["Persistent Rage"] },
        16: { features: ["Ability Score Improvement"], asi: true },
        17: { features: ["Brutal Critical (3 dice)"] },
        18: { features: ["Indomitable Might"] },
        19: { features: ["Ability Score Improvement"], asi: true },
        20: { features: ["Primal Champion"] }
    },
    Ranger: {
        hp_die: "1d10",
        2: {
            features: ["Fighting Style", "Spellcasting"],
            spell_slots: { 1: 2 }
        },
        3: {
            features: ["Ranger Archetype", "Primeval Awareness"],
            spell_slots: { 1: 3 }
        },
        4: {
            features: ["Ability Score Improvement"],
            spell_slots: { 1: 3 },
            asi: true
        },
        5: {
            features: ["Extra Attack", "2nd Level Spells"],
            spell_slots: { 1: 4, 2: 2 }
        },
        6: {
            features: ["Favored Enemy Improvement"],
            spell_slots: { 1: 4, 2: 2 }
        },
        7: {
            features: ["Ranger Archetype Feature"],
            spell_slots: { 1: 4, 2: 3 }
        },
        8: {
            features: ["Ability Score Improvement", "Land's Stride"],
            spell_slots: { 1: 4, 2: 3 },
            asi: true
        },
        9: {
            features: ["3rd Level Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 2 }
        },
        10: {
            features: ["Natural Explorer Improvement"],
            spell_slots: { 1: 4, 2: 3, 3: 2 }
        },
        11: {
            features: ["Ranger Archetype Feature"],
            spell_slots: { 1: 4, 2: 3, 3: 3 }
        },
        12: {
            features: ["Ability Score Improvement"],
            spell_slots: { 1: 4, 2: 3, 3: 3 },
            asi: true
        },
        13: {
            features: ["4th Level Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 1 }
        },
        14: {
            features: ["Favored Enemy Improvement", "Vanish"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 1 }
        },
        15: {
            features: ["Ranger Archetype Feature"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 2 }
        },
        16: {
            features: ["Ability Score Improvement"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 2 },
            asi: true
        },
        17: {
            features: ["5th Level Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 }
        },
        18: {
            features: ["Feral Senses"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 }
        },
        19: {
            features: ["Ability Score Improvement"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
            asi: true
        },
        20: {
            features: ["Foe Slayer"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 }
        }
    },
    Bard: {
        hp_die: "1d8",
        2: {
            features: ["Jack of All Trades", "Song of Rest"],
            spell_slots: { 1: 3 },
            new_spells_known: 1
        },
        3: {
            features: ["Bard College", "Expertise"],
            spell_slots: { 1: 4, 2: 2 },
            new_spells_known: 1
        },
        4: {
            features: ["Ability Score Improvement"],
            spell_slots: { 1: 4, 2: 3 },
            new_spells_known: 1,
            asi: true
        },
        5: {
            features: ["Bardic Inspiration (d8)", "Font of Inspiration", "3rd Level Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 2 },
            new_spells_known: 1
        },
        6: {
            features: ["Countercharm", "Bard College Feature"],
            spell_slots: { 1: 4, 2: 3, 3: 3 },
            new_spells_known: 1
        },
        7: {
            features: ["4th Level Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 1 },
            new_spells_known: 1
        },
        8: {
            features: ["Ability Score Improvement"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 2 },
            new_spells_known: 1,
            asi: true
        },
        9: {
            features: ["Song of Rest (d8)", "5th Level Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
            new_spells_known: 1
        },
        10: {
            features: ["Bardic Inspiration (d10)", "Expertise", "Magical Secrets"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
            new_spells_known: 1
        },
        11: {
            features: ["6th Level Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
            new_spells_known: 1
        },
        12: {
            features: ["Ability Score Improvement"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
            new_spells_known: 0,
            asi: true
        },
        13: {
            features: ["Song of Rest (d10)", "7th Level Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
            new_spells_known: 1
        },
        14: {
            features: ["Magical Secrets", "Bard College Feature"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
            new_spells_known: 2
        },
        15: {
            features: ["Bardic Inspiration (d12)", "8th Level Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
            new_spells_known: 1
        },
        16: {
            features: ["Ability Score Improvement"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
            new_spells_known: 0,
            asi: true
        },
        17: {
            features: ["Song of Rest (d12)", "9th Level Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 },
            new_spells_known: 1
        },
        18: {
            features: ["Magical Secrets"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 1, 7: 1, 8: 1, 9: 1 },
            new_spells_known: 2
        },
        19: {
            features: ["Ability Score Improvement"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 1, 8: 1, 9: 1 },
            new_spells_known: 0,
            asi: true
        },
        20: {
            features: ["Superior Inspiration"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 },
            new_spells_known: 0
        }
    },
    Druid: {
        hp_die: "1d8",
        2: {
            features: ["Wild Shape", "Druid Circle"],
            spell_slots: { 1: 3 }
        },
        3: {
            features: ["2nd Level Spells"],
            spell_slots: { 1: 4, 2: 2 }
        },
        4: {
            features: ["Ability Score Improvement", "Wild Shape Improvement"],
            spell_slots: { 1: 4, 2: 3 },
            asi: true
        },
        5: {
            features: ["3rd Level Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 2 }
        },
        6: {
            features: ["Druid Circle Feature"],
            spell_slots: { 1: 4, 2: 3, 3: 3 }
        },
        7: {
            features: ["4th Level Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 1 }
        },
        8: {
            features: ["Ability Score Improvement", "Wild Shape Improvement"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 2 },
            asi: true
        },
        9: {
            features: ["5th Level Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 }
        },
        10: {
            features: ["Druid Circle Feature"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 }
        },
        11: {
            features: ["6th Level Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 }
        },
        12: {
            features: ["Ability Score Improvement"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
            asi: true
        },
        13: {
            features: ["7th Level Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 }
        },
        14: {
            features: ["Druid Circle Feature"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 }
        },
        15: {
            features: ["8th Level Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 }
        },
        16: {
            features: ["Ability Score Improvement"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
            asi: true
        },
        17: {
            features: ["9th Level Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 }
        },
        18: {
            features: ["Timeless Body", "Beast Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 1, 7: 1, 8: 1, 9: 1 }
        },
        19: {
            features: ["Ability Score Improvement"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 1, 8: 1, 9: 1 },
            asi: true
        },
        20: {
            features: ["Archdruid"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 }
        }
    },
    Monk: {
        hp_die: "1d8",
        2: { features: ["Ki", "Unarmored Movement"] },
        3: { features: ["Monastic Tradition", "Deflect Missiles"] },
        4: { features: ["Ability Score Improvement", "Slow Fall"], asi: true },
        5: { features: ["Extra Attack", "Stunning Strike"] },
        6: { features: ["Ki-Empowered Strikes", "Monastic Tradition Feature"] },
        7: { features: ["Evasion", "Stillness of Mind"] },
        8: { features: ["Ability Score Improvement"], asi: true },
        9: { features: ["Unarmored Movement Improvement"] },
        10: { features: ["Purity of Body"] },
        11: { features: ["Monastic Tradition Feature"] },
        12: { features: ["Ability Score Improvement"], asi: true },
        13: { features: ["Tongue of the Sun and Moon"] },
        14: { features: ["Diamond Soul"] },
        15: { features: ["Timeless Body"] },
        16: { features: ["Ability Score Improvement"], asi: true },
        17: { features: ["Monastic Tradition Feature"] },
        18: { features: ["Empty Body"] },
        19: { features: ["Ability Score Improvement"], asi: true },
        20: { features: ["Perfect Self"] }
    },
    Paladin: {
        hp_die: "1d10",
        2: {
            features: ["Fighting Style", "Spellcasting", "Divine Smite"],
            spell_slots: { 1: 2 }
        },
        3: {
            features: ["Divine Health", "Sacred Oath"],
            spell_slots: { 1: 3 }
        },
        4: {
            features: ["Ability Score Improvement"],
            spell_slots: { 1: 3 },
            asi: true
        },
        5: {
            features: ["Extra Attack", "2nd Level Spells"],
            spell_slots: { 1: 4, 2: 2 }
        },
        6: {
            features: ["Aura of Protection"],
            spell_slots: { 1: 4, 2: 2 }
        },
        7: {
            features: ["Sacred Oath Feature"],
            spell_slots: { 1: 4, 2: 3 }
        },
        8: {
            features: ["Ability Score Improvement"],
            spell_slots: { 1: 4, 2: 3 },
            asi: true
        },
        9: {
            features: ["3rd Level Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 2 }
        },
        10: {
            features: ["Aura of Courage"],
            spell_slots: { 1: 4, 2: 3, 3: 2 }
        },
        11: {
            features: ["Improved Divine Smite"],
            spell_slots: { 1: 4, 2: 3, 3: 3 }
        },
        12: {
            features: ["Ability Score Improvement"],
            spell_slots: { 1: 4, 2: 3, 3: 3 },
            asi: true
        },
        13: {
            features: ["4th Level Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 1 }
        },
        14: {
            features: ["Cleansing Touch"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 1 }
        },
        15: {
            features: ["Sacred Oath Feature"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 2 }
        },
        16: {
            features: ["Ability Score Improvement"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 2 },
            asi: true
        },
        17: {
            features: ["5th Level Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 }
        },
        18: {
            features: ["Aura Improvements"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 }
        },
        19: {
            features: ["Ability Score Improvement"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
            asi: true
        },
        20: {
            features: ["Sacred Oath Feature"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 }
        }
    },
    Sorcerer: {
        hp_die: "1d6",
        2: {
            features: ["Font of Magic"],
            spell_slots: { 1: 3 },
            new_spells_known: 1
        },
        3: {
            features: ["Metamagic", "2nd Level Spells"],
            spell_slots: { 1: 4, 2: 2 },
            new_spells_known: 1
        },
        4: {
            features: ["Ability Score Improvement"],
            spell_slots: { 1: 4, 2: 3 },
            new_spells_known: 1,
            asi: true
        },
        5: {
            features: ["3rd Level Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 2 },
            new_spells_known: 1
        },
        6: {
            features: ["Sorcerous Origin Feature"],
            spell_slots: { 1: 4, 2: 3, 3: 3 },
            new_spells_known: 1
        },
        7: {
            features: ["4th Level Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 1 },
            new_spells_known: 1
        },
        8: {
            features: ["Ability Score Improvement"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 2 },
            new_spells_known: 1,
            asi: true
        },
        9: {
            features: ["5th Level Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
            new_spells_known: 1
        },
        10: {
            features: ["Metamagic"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
            new_spells_known: 1
        },
        11: {
            features: ["6th Level Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
            new_spells_known: 1
        },
        12: {
            features: ["Ability Score Improvement"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
            new_spells_known: 0,
            asi: true
        },
        13: {
            features: ["7th Level Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
            new_spells_known: 1
        },
        14: {
            features: ["Sorcerous Origin Feature"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
            new_spells_known: 0
        },
        15: {
            features: ["8th Level Spells"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
            new_spells_known: 1
        },
        16: {
            features: ["Ability Score Improvement"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
            new_spells_known: 0,
            asi: true
        },
        17: {
            features: ["9th Level Spells", "Metamagic"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 },
            new_spells_known: 1
        },
        18: {
            features: ["Sorcerous Origin Feature"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 1, 7: 1, 8: 1, 9: 1 },
            new_spells_known: 0
        },
        19: {
            features: ["Ability Score Improvement"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 1, 8: 1, 9: 1 },
            new_spells_known: 0,
            asi: true
        },
        20: {
            features: ["Sorcerous Restoration"],
            spell_slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 },
            new_spells_known: 0
        }
    },
    Warlock: {
        hp_die: "1d8",
        2: {
            features: ["Eldritch Invocations"],
            spell_slots: { 1: 2 },
            new_spells_known: 1
        },
        3: {
            features: ["Pact Boon", "2nd Level Spell Slots"],
            spell_slots: { 2: 2 },
            new_spells_known: 1
        },
        4: {
            features: ["Ability Score Improvement"],
            spell_slots: { 2: 2 },
            new_spells_known: 1,
            asi: true
        },
        5: {
            features: ["Eldritch Invocation", "3rd Level Spell Slots"],
            spell_slots: { 3: 2 },
            new_spells_known: 1
        },
        6: {
            features: ["Otherworldly Patron Feature"],
            spell_slots: { 3: 2 },
            new_spells_known: 1
        },
        7: {
            features: ["Eldritch Invocation", "4th Level Spell Slots"],
            spell_slots: { 4: 2 },
            new_spells_known: 1
        },
        8: {
            features: ["Ability Score Improvement"],
            spell_slots: { 4: 2 },
            new_spells_known: 1,
            asi: true
        },
        9: {
            features: ["Eldritch Invocation", "5th Level Spell Slots"],
            spell_slots: { 5: 2 },
            new_spells_known: 1
        },
        10: {
            features: ["Otherworldly Patron Feature"],
            spell_slots: { 5: 2 },
            new_spells_known: 1
        },
        11: {
            features: ["Mystic Arcanum (6th level)"],
            spell_slots: { 5: 3 },
            new_spells_known: 1
        },
        12: {
            features: ["Ability Score Improvement", "Eldritch Invocation"],
            spell_slots: { 5: 3 },
            new_spells_known: 0,
            asi: true
        },
        13: {
            features: ["Mystic Arcanum (7th level)"],
            spell_slots: { 5: 3 },
            new_spells_known: 1
        },
        14: {
            features: ["Otherworldly Patron Feature"],
            spell_slots: { 5: 3 },
            new_spells_known: 0
        },
        15: {
            features: ["Mystic Arcanum (8th level)", "Eldritch Invocation"],
            spell_slots: { 5: 3 },
            new_spells_known: 1
        },
        16: {
            features: ["Ability Score Improvement"],
            spell_slots: { 5: 3 },
            new_spells_known: 0,
            asi: true
        },
        17: {
            features: ["Mystic Arcanum (9th level)"],
            spell_slots: { 5: 4 },
            new_spells_known: 1
        },
        18: {
            features: ["Eldritch Invocation"],
            spell_slots: { 5: 4 },
            new_spells_known: 0
        },
        19: {
            features: ["Ability Score Improvement"],
            spell_slots: { 5: 4 },
            new_spells_known: 1,
            asi: true
        },
        20: {
            features: ["Eldritch Master"],
            spell_slots: { 5: 4 },
            new_spells_known: 0
        }
    }
}
