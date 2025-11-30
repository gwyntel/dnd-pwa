export const MONSTERS = {
    // Low Level (CR 0-1)
    goblin: {
        id: "goblin",
        name: "Goblin",
        type: "Humanoid (Goblinoid)",
        cr: "1/4",
        ac: 15,
        hp: 7,
        hitDice: "2d6",
        stats: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
        actions: [
            { name: "Scimitar", desc: "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) slashing damage." },
            { name: "Shortbow", desc: "Ranged Weapon Attack: +4 to hit, range 80/320 ft., one target. Hit: 5 (1d6 + 2) piercing damage." }
        ]
    },
    skeleton: {
        id: "skeleton",
        name: "Skeleton",
        type: "Undead",
        cr: "1/4",
        ac: 13,
        hp: 13,
        hitDice: "2d8+4",
        stats: { str: 10, dex: 14, con: 15, int: 6, wis: 8, cha: 5 },
        vulnerabilities: ["bludgeoning"],
        immunities: ["poison"],
        actions: [
            { name: "Shortsword", desc: "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage." },
            { name: "Shortbow", desc: "Ranged Weapon Attack: +4 to hit, range 80/320 ft., one target. Hit: 5 (1d6 + 2) piercing damage." }
        ]
    },
    zombie: {
        id: "zombie",
        name: "Zombie",
        type: "Undead",
        cr: "1/4",
        ac: 8,
        hp: 22,
        hitDice: "3d8+9",
        stats: { str: 13, dex: 6, con: 16, int: 3, wis: 6, cha: 5 },
        immunities: ["poison"],
        actions: [
            { name: "Slam", desc: "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 4 (1d6 + 1) bludgeoning damage." }
        ]
    },
    kobold: {
        id: "kobold",
        name: "Kobold",
        type: "Humanoid (Kobold)",
        cr: "1/8",
        ac: 12,
        hp: 5,
        hitDice: "2d6-2",
        stats: { str: 7, dex: 15, con: 9, int: 8, wis: 7, cha: 8 },
        actions: [
            { name: "Dagger", desc: "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 4 (1d4 + 2) piercing damage." },
            { name: "Sling", desc: "Ranged Weapon Attack: +4 to hit, range 30/120 ft., one target. Hit: 4 (1d4 + 2) bludgeoning damage." }
        ]
    },
    bandit: {
        id: "bandit",
        name: "Bandit",
        type: "Humanoid (Any Race)",
        cr: "1/8",
        ac: 12,
        hp: 11,
        hitDice: "2d8+2",
        stats: { str: 11, dex: 12, con: 12, int: 10, wis: 10, cha: 10 },
        actions: [
            { name: "Scimitar", desc: "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 4 (1d6 + 1) slashing damage." },
            { name: "Light Crossbow", desc: "Ranged Weapon Attack: +3 to hit, range 80/320 ft., one target. Hit: 5 (1d8 + 1) piercing damage." }
        ]
    },

    // Mid Level (CR 2-5)
    orc: {
        id: "orc",
        name: "Orc",
        type: "Humanoid (Orc)",
        cr: "1/2",
        ac: 13,
        hp: 15,
        hitDice: "2d8+6",
        stats: { str: 16, dex: 12, con: 16, int: 7, wis: 11, cha: 10 },
        actions: [
            { name: "Greataxe", desc: "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 9 (1d12 + 3) slashing damage." },
            { name: "Javelin", desc: "Melee or Ranged Weapon Attack: +5 to hit, reach 5 ft. or range 30/120 ft., one target. Hit: 6 (1d6 + 3) piercing damage." }
        ]
    },
    bugbear: {
        id: "bugbear",
        name: "Bugbear",
        type: "Humanoid (Goblinoid)",
        cr: "1",
        ac: 16,
        hp: 27,
        hitDice: "5d8+5",
        stats: { str: 15, dex: 14, con: 13, int: 8, wis: 11, cha: 9 },
        actions: [
            { name: "Morningstar", desc: "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 11 (2d8 + 2) piercing damage." },
            { name: "Javelin", desc: "Melee or Ranged Weapon Attack: +4 to hit, reach 5 ft. or range 30/120 ft., one target. Hit: 9 (2d6 + 2) piercing damage." }
        ]
    },
    gelatinous_cube: {
        id: "gelatinous_cube",
        name: "Gelatinous Cube",
        type: "Ooze",
        cr: "2",
        ac: 6,
        hp: 84,
        hitDice: "8d10+40",
        stats: { str: 14, dex: 3, con: 20, int: 1, wis: 6, cha: 1 },
        immunities: ["acid", "lightning", "slashing"],
        actions: [
            { name: "Pseudopod", desc: "Melee Weapon Attack: +4 to hit, reach 5 ft., one creature. Hit: 10 (3d6) acid damage." },
            { name: "Engulf", desc: "The cube moves up to its speed. While doing so, it can enter Large or smaller creatures' spaces. Whenever the cube enters a creature's space, the creature must make a DC 12 Dexterity saving throw." }
        ]
    },
    ogre: {
        id: "ogre",
        name: "Ogre",
        type: "Giant",
        cr: "2",
        ac: 11,
        hp: 59,
        hitDice: "7d10+21",
        stats: { str: 19, dex: 8, con: 16, int: 5, wis: 7, cha: 7 },
        actions: [
            { name: "Greatclub", desc: "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 13 (2d8 + 4) bludgeoning damage." },
            { name: "Javelin", desc: "Melee or Ranged Weapon Attack: +6 to hit, reach 5 ft. or range 30/120 ft., one target. Hit: 11 (2d6 + 4) piercing damage." }
        ]
    },

    // Boss (CR 5+)
    young_red_dragon: {
        id: "young_red_dragon",
        name: "Young Red Dragon",
        type: "Dragon",
        cr: "10",
        ac: 18,
        hp: 178,
        hitDice: "17d10+85",
        stats: { str: 23, dex: 10, con: 21, int: 14, wis: 11, cha: 19 },
        immunities: ["fire"],
        actions: [
            { name: "Multiattack", desc: "The dragon makes three attacks: one with its bite and two with its claws." },
            { name: "Bite", desc: "Melee Weapon Attack: +10 to hit, reach 10 ft., one target. Hit: 17 (2d10 + 6) piercing damage plus 3 (1d6) fire damage." },
            { name: "Claw", desc: "Melee Weapon Attack: +10 to hit, reach 5 ft., one target. Hit: 13 (2d6 + 6) slashing damage." },
            { name: "Fire Breath (Recharge 5-6)", desc: "The dragon exhales fire in a 30-foot cone. Each creature in that area must make a DC 17 Dexterity saving throw, taking 56 (16d6) fire damage on a failed save, or half as much damage on a successful one." }
        ]
    }
};
