export const ITEMS = {
    // --- WEAPONS ---
    // Simple Melee
    club: {
        id: "club",
        name: "Club",
        category: "weapon",
        weaponType: "simple_melee",
        damage: "1d4",
        damageType: "bludgeoning",
        properties: ["light"],
        weight: 2,
        value: 1, // 1 sp = 0.1 gp, simplified to 1
        rarity: "common"
    },
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
        rarity: "common"
    },
    greatclub: {
        id: "greatclub",
        name: "Greatclub",
        category: "weapon",
        weaponType: "simple_melee",
        damage: "1d8",
        damageType: "bludgeoning",
        properties: ["two-handed"],
        weight: 10,
        value: 2,
        rarity: "common"
    },
    handaxe: {
        id: "handaxe",
        name: "Handaxe",
        category: "weapon",
        weaponType: "simple_melee",
        damage: "1d6",
        damageType: "slashing",
        properties: ["light", "thrown (range 20/60)"],
        weight: 2,
        value: 5,
        rarity: "common"
    },
    javelin: {
        id: "javelin",
        name: "Javelin",
        category: "weapon",
        weaponType: "simple_melee",
        damage: "1d6",
        damageType: "piercing",
        properties: ["thrown (range 30/120)"],
        weight: 2,
        value: 5, // 5 sp
        rarity: "common"
    },
    light_hammer: {
        id: "light_hammer",
        name: "Light Hammer",
        category: "weapon",
        weaponType: "simple_melee",
        damage: "1d4",
        damageType: "bludgeoning",
        properties: ["light", "thrown (range 20/60)"],
        weight: 2,
        value: 2,
        rarity: "common"
    },
    mace: {
        id: "mace",
        name: "Mace",
        category: "weapon",
        weaponType: "simple_melee",
        damage: "1d6",
        damageType: "bludgeoning",
        properties: [],
        weight: 4,
        value: 5,
        rarity: "common"
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
        value: 2, // 2 sp
        rarity: "common"
    },
    spear: {
        id: "spear",
        name: "Spear",
        category: "weapon",
        weaponType: "simple_melee",
        damage: "1d6",
        versatileDamage: "1d8",
        damageType: "piercing",
        properties: ["thrown (range 20/60)", "versatile"],
        weight: 3,
        value: 1,
        rarity: "common"
    },

    // Simple Ranged
    light_crossbow: {
        id: "light_crossbow",
        name: "Light Crossbow",
        category: "weapon",
        weaponType: "simple_ranged",
        damage: "1d8",
        damageType: "piercing",
        properties: ["ammunition (range 80/320)", "loading", "two-handed"],
        weight: 5,
        value: 25,
        rarity: "common"
    },
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
        rarity: "common"
    },

    // Martial Melee
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
        rarity: "common"
    },
    greataxe: {
        id: "greataxe",
        name: "Greataxe",
        category: "weapon",
        weaponType: "martial_melee",
        damage: "1d12",
        damageType: "slashing",
        properties: ["heavy", "two-handed"],
        weight: 7,
        value: 30,
        rarity: "common"
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
        rarity: "common"
    },
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
        rarity: "common"
    },
    maul: {
        id: "maul",
        name: "Maul",
        category: "weapon",
        weaponType: "martial_melee",
        damage: "2d6",
        damageType: "bludgeoning",
        properties: ["heavy", "two-handed"],
        weight: 10,
        value: 10,
        rarity: "common"
    },
    morningstar: {
        id: "morningstar",
        name: "Morningstar",
        category: "weapon",
        weaponType: "martial_melee",
        damage: "1d8",
        damageType: "piercing",
        properties: [],
        weight: 4,
        value: 15,
        rarity: "common"
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
        rarity: "common"
    },
    scimitar: {
        id: "scimitar",
        name: "Scimitar",
        category: "weapon",
        weaponType: "martial_melee",
        damage: "1d6",
        damageType: "slashing",
        properties: ["finesse", "light"],
        weight: 3,
        value: 25,
        rarity: "common"
    },
    shortsword: {
        id: "shortsword",
        name: "Shortsword",
        category: "weapon",
        weaponType: "martial_melee",
        damage: "1d6",
        damageType: "piercing",
        properties: ["finesse", "light"],
        weight: 2,
        value: 10,
        rarity: "common"
    },
    trident: {
        id: "trident",
        name: "Trident",
        category: "weapon",
        weaponType: "martial_melee",
        damage: "1d6",
        versatileDamage: "1d8",
        damageType: "piercing",
        properties: ["thrown (range 20/60)", "versatile"],
        weight: 4,
        value: 5,
        rarity: "common"
    },
    warhammer: {
        id: "warhammer",
        name: "Warhammer",
        category: "weapon",
        weaponType: "martial_melee",
        damage: "1d8",
        versatileDamage: "1d10",
        damageType: "bludgeoning",
        properties: ["versatile"],
        weight: 2,
        value: 15,
        rarity: "common"
    },

    // Martial Ranged
    heavy_crossbow: {
        id: "heavy_crossbow",
        name: "Heavy Crossbow",
        category: "weapon",
        weaponType: "martial_ranged",
        damage: "1d10",
        damageType: "piercing",
        properties: ["ammunition (range 100/400)", "heavy", "loading", "two-handed"],
        weight: 18,
        value: 50,
        rarity: "common"
    },
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
        rarity: "common"
    },

    // --- ARMOR ---
    // Light
    padded_armor: {
        id: "padded_armor",
        name: "Padded Armor",
        category: "armor",
        armorType: "light",
        baseAC: 11,
        properties: ["stealth_disadvantage"],
        weight: 8,
        value: 5,
        rarity: "common"
    },
    leather_armor: {
        id: "leather_armor",
        name: "Leather Armor",
        category: "armor",
        armorType: "light",
        baseAC: 11,
        properties: [],
        weight: 10,
        value: 10,
        rarity: "common"
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
        rarity: "common"
    },

    // Medium
    hide_armor: {
        id: "hide_armor",
        name: "Hide Armor",
        category: "armor",
        armorType: "medium",
        baseAC: 12,
        properties: [],
        weight: 12,
        value: 10,
        rarity: "common"
    },
    chain_shirt: {
        id: "chain_shirt",
        name: "Chain Shirt",
        category: "armor",
        armorType: "medium",
        baseAC: 13,
        properties: [],
        weight: 20,
        value: 50,
        rarity: "common"
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
        rarity: "common"
    },
    breastplate: {
        id: "breastplate",
        name: "Breastplate",
        category: "armor",
        armorType: "medium",
        baseAC: 14,
        properties: [],
        weight: 20,
        value: 400,
        rarity: "common"
    },
    half_plate: {
        id: "half_plate",
        name: "Half Plate",
        category: "armor",
        armorType: "medium",
        baseAC: 15,
        properties: ["stealth_disadvantage"],
        weight: 40,
        value: 750,
        rarity: "common"
    },

    // Heavy
    ring_mail: {
        id: "ring_mail",
        name: "Ring Mail",
        category: "armor",
        armorType: "heavy",
        baseAC: 14,
        properties: ["stealth_disadvantage"],
        weight: 40,
        value: 30,
        rarity: "common"
    },
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
        rarity: "common"
    },
    splint: {
        id: "splint",
        name: "Splint",
        category: "armor",
        armorType: "heavy",
        baseAC: 17,
        properties: ["stealth_disadvantage"],
        strengthRequired: 15,
        weight: 60,
        value: 200,
        rarity: "common"
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
        rarity: "common"
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
        rarity: "common"
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
    greater_healing_potion: {
        id: "greater_healing_potion",
        name: "Potion of Greater Healing",
        category: "consumable",
        consumable: true,
        effects: ["HEAL[player|4d4+4]"],
        weight: 0.5,
        value: 150,
        rarity: "uncommon",
        description: "A potent red liquid that heals 4d4+4 hit points."
    },
    potion_of_climbing: {
        id: "potion_of_climbing",
        name: "Potion of Climbing",
        category: "consumable",
        consumable: true,
        effects: ["STATUS_ADD[Climbing Speed]"],
        weight: 0.5,
        value: 50,
        rarity: "common",
        description: "Gives you a climbing speed equal to your walking speed for 1 hour."
    },
    antitoxin: {
        id: "antitoxin",
        name: "Antitoxin",
        category: "consumable",
        consumable: true,
        effects: ["STATUS_ADD[Advantage on Poison Saves]"],
        weight: 0,
        value: 50,
        rarity: "common",
        description: "Advantage on saving throws against poison for 1 hour."
    },
    scroll_of_fireball: {
        id: "scroll_of_fireball",
        name: "Scroll of Fireball",
        category: "consumable",
        consumable: true,
        spellLevel: 3,
        effects: ["CAST_SPELL[Fireball|3]"],
        weight: 0,
        value: 150,
        rarity: "uncommon",
        description: "A spell scroll containing the Fireball spell."
    },

    // --- MAGIC ITEMS ---
    ring_of_protection: {
        id: "ring_of_protection",
        name: "Ring of Protection",
        category: "magic_item",
        slot: "ring",
        effects: ["+1 AC", "+1 to all saves"],
        acBonus: 1,
        saveBonus: 1,
        requiresAttunement: true,
        weight: 0,
        value: 3500,
        rarity: "rare",
        description: "You gain a +1 bonus to AC and saving throws while wearing this ring."
    },
    ring_of_fire_resistance: {
        id: "ring_of_fire_resistance",
        name: "Ring of Fire Resistance",
        category: "magic_item",
        slot: "ring",
        effects: ["APPLY_RESISTANCE[player|fire]"],
        requiresAttunement: true,
        weight: 0,
        value: 4000,
        rarity: "rare",
        description: "You have resistance to fire damage while wearing this ring."
    },
    cloak_of_protection: {
        id: "cloak_of_protection",
        name: "Cloak of Protection",
        category: "magic_item",
        slot: "cloak",
        effects: ["+1 AC", "+1 to all saves"],
        acBonus: 1,
        saveBonus: 1,
        requiresAttunement: true,
        weight: 3,
        value: 3500,
        rarity: "uncommon",
        description: "You gain a +1 bonus to AC and saving throws while wearing this cloak."
    },
    bag_of_holding: {
        id: "bag_of_holding",
        name: "Bag of Holding",
        category: "magic_item",
        slot: "wondrous",
        effects: [],
        weight: 15,
        value: 4000,
        rarity: "uncommon",
        description: "This bag has an interior space considerably larger than its outside dimensions."
    },
    weapon_plus_one: {
        id: "weapon_plus_one",
        name: "+1 Weapon",
        category: "weapon",
        weaponType: "any",
        effects: ["+1 to hit", "+1 damage"],
        toHitBonus: 1,
        damageBonus: 1,
        weight: 0, // Variable
        value: 500,
        rarity: "uncommon",
        description: "You have a +1 bonus to attack and damage rolls made with this magic weapon."
    }
}
