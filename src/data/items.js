// ESSENTIAL SEED ITEMS (Option 3)
// Only includes common, mechanically-important items
// All magic items, special gear, and unique weapons are dynamically generated via ItemGenerator

export const ITEMS = {
    // --- COMMON WEAPONS ---
    // Simple Melee
    dagger: {
        id: "dagger",
        name: "Dagger",
        category: "weapon",
        weaponType: "simple_melee",
        damage: "1d4",
        damageType: "piercing",
        properties: ["finesse", "light", "thrown (range 20/60)"],
        weight: 1,
        value: 2,
        rarity: "common",
        description: "A simple stabbing weapon."
    },
    quarterstaff: {
        id: "quarterstaff",
        name: "Quarterstaff",
        category: "weapon",
        weaponType: "simple_melee",
        damage: "1d6",
        versatileDamage: "1d8",
        damageType: "bludgeoning",
        properties: ["versatile"],
        weight: 4,
        value: 2,
        rarity: "common",
        description: "A sturdy wooden staff."
    },

    // Simple Ranged
    shortbow: {
        id: "shortbow",
        name: "Shortbow",
        category: "weapon",
        weaponType: "simple_ranged",
        damage: "1d6",
        damageType: "piercing",
        properties: ["ammunition (range 80/320)", "two-handed"],
        weight: 2,
        value: 25,
        rarity: "common",
        description: "A basic bow for hunting."
    },

    // Martial Melee
    longsword: {
        id: "longsword",
        name: "Longsword",
        category: "weapon",
        weaponType: "martial_melee",
        damage: "1d8",
        versatileDamage: "1d10",
        damageType: "slashing",
        properties: ["versatile"],
        weight: 3,
        value: 15,
        rarity: "common",
        description: "A standard sword for knights and warriors."
    },
    greatsword: {
        id: "greatsword",
        name: "Greatsword",
        category: "weapon",
        weaponType: "martial_melee",
        damage: "2d6",
        damageType: "slashing",
        properties: ["heavy", "two-handed"],
        weight: 6,
        value: 50,
        rarity: "common",
        description: "A massive two-handed blade."
    },
    battleaxe: {
        id: "battleaxe",
        name: "Battleaxe",
        category: "weapon",
        weaponType: "martial_melee",
        damage: "1d8",
        versatileDamage: "1d10",
        damageType: "slashing",
        properties: ["versatile"],
        weight: 4,
        value: 10,
        rarity: "common",
        description: "A single-bladed axe for combat."
    },
    rapier: {
        id: "rapier",
        name: "Rapier",
        category: "weapon",
        weaponType: "martial_melee",
        damage: "1d8",
        damageType: "piercing",
        properties: ["finesse"],
        weight: 2,
        value: 25,
        rarity: "common",
        description: "A slender, elegant dueling sword."
    },

    // Martial Ranged
    longbow: {
        id: "longbow",
        name: "Longbow",
        category: "weapon",
        weaponType: "martial_ranged",
        damage: "1d8",
        damageType: "piercing",
        properties: ["ammunition (range 150/600)", "heavy", "two-handed"],
        weight: 2,
        value: 50,
        rarity: "common",
        description: "A powerful war bow."
    },

    // --- ARMOR ---
    // Light
    leather_armor: {
        id: "leather_armor",
        name: "Leather Armor",
        category: "armor",
        armorType: "light",
        baseAC: 11,
        properties: [],
        weight: 10,
        value: 10,
        rarity: "common",
        description: "Boiled leather vest and greaves."
    },
    studded_leather: {
        id: "studded_leather",
        name: "Studded Leather",
        category: "armor",
        armorType: "light",
        baseAC: 12,
        properties: [],
        weight: 13,
        value: 45,
        rarity: "common",
        description: "Leather armor reinforced with metal studs."
    },

    // Medium
    chain_shirt: {
        id: "chain_shirt",
        name: "Chain Shirt",
        category: "armor",
        armorType: "medium",
        baseAC: 13,
        properties: [],
        weight: 20,
        value: 50,
        rarity: "common",
        description: "A shirt made of interlocking metal rings."
    },
    scale_mail: {
        id: "scale_mail",
        name: "Scale Mail",
        category: "armor",
        armorType: "medium",
        baseAC: 14,
        properties: ["stealth_disadvantage"],
        weight: 45,
        value: 50,
        rarity: "common",
        description: "Armor made of overlapping metal scales."
    },

    // Heavy
    chain_mail: {
        id: "chain_mail",
        name: "Chain Mail",
        category: "armor",
        armorType: "heavy",
        baseAC: 16,
        properties: ["stealth_disadvantage"],
        strengthRequired: 13,
        weight: 55,
        value: 75,
        rarity: "common",
        description: "Full suit of interlocking metal rings."
    },
    plate: {
        id: "plate",
        name: "Plate",
        category: "armor",
        armorType: "heavy",
        baseAC: 18,
        properties: ["stealth_disadvantage"],
        strengthRequired: 15,
        weight: 65,
        value: 1500,
        rarity: "common",
        description: "Full plate armor, the pinnacle of protection."
    },

    // Shield
    shield: {
        id: "shield",
        name: "Shield",
        category: "armor",
        armorType: "shield",
        acBonus: 2,
        weight: 6,
        value: 10,
        rarity: "common",
        description: "A wooden or metal shield."
    },

    // --- CONSUMABLES ---
    healing_potion: {
        id: "healing_potion",
        name: "Potion of Healing",
        category: "consumable",
        consumable: true,
        effects: ["HEAL[player|2d4+2]"],
        weight: 0.5,
        value: 50,
        rarity: "common",
        description: "A red liquid that heals 2d4+2 hit points."
    },

    // --- UTILITY GEAR ---
    rope: {
        id: "rope",
        name: "Rope (50 ft)",
        category: "gear",
        weight: 10,
        value: 1,
        rarity: "common",
        description: "Hemp rope, 50 feet long."
    },
    torch: {
        id: "torch",
        name: "Torch",
        category: "gear",
        weight: 1,
        value: 1,
        rarity: "common",
        description: "A wooden stick with cloth wrapped around one end, soaked in oil."
    },
    rations: {
        id: "rations",
        name: "Rations (1 day)",
        category: "gear",
        weight: 2,
        value: 5,
        rarity: "common",
        description: "Dried food for one day."
    },
    bedroll: {
        id: "bedroll",
        name: "Bedroll",
        category: "gear",
        weight: 7,
        value: 1,
        rarity: "common",
        description: "A blanket and padding for sleeping on the ground."
    },
    thieves_tools: {
        id: "thieves_tools",
        name: "Thieves' Tools",
        category: "gear",
        weight: 1,
        value: 25,
        rarity: "common",
        description: "Lockpicks and other tools for disarming traps and picking locks."
    }
}
