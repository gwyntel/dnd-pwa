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
    6: 14000
}

export const CLASS_PROGRESSION = {
    Fighter: {
        hp_die: "1d10",
        2: {
            features: ["Action Surge (One additional action per short rest)"],
        },
        3: {
            features: ["Martial Archetype (Choose Champion or Battle Master)"],
        },
        4: {
            features: ["Ability Score Improvement"],
            asi: true
        },
        5: {
            features: ["Extra Attack (Attack twice per action)"],
        }
    },
    Rogue: {
        hp_die: "1d8",
        2: {
            features: ["Cunning Action (Bonus action to Dash, Disengage, or Hide)"],
        },
        3: {
            features: ["Roguish Archetype (Choose Thief or Assassin)", "Sneak Attack (2d6)"],
        },
        4: {
            features: ["Ability Score Improvement"],
            asi: true
        },
        5: {
            features: ["Uncanny Dodge (Reaction to halve damage)", "Sneak Attack (3d6)"],
        }
    },
    Wizard: {
        hp_die: "1d6",
        2: {
            features: ["Arcane Tradition (Choose School of Evocation)"],
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
        }
    }
}
