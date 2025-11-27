/**
 * World Templates
 * Pre-made campaign settings for different genres and themes
 */

export const WORLD_TEMPLATES = [
  {
    id: "world_default_classic_fantasy",
    name: "Default: Classic Fantasy Realm",
    settingType: "classic-fantasy",
    sourceType: "default",
    briefDescription:
      "Beginner-friendly heroic fantasy with clear good vs evil, standard D&D-style races, and straightforward adventure hooks.",
    fullDescription:
      "A welcoming, classic fantasy realm designed for quick-start play. Cozy villages, nearby ruins, and local threats provide immediate reasons to adventure without overwhelming lore. Magic exists and is respected but feels special rather than mundane. Standard fantasy ancestries (humans, elves, dwarves, halflings, etc.) and familiar classes fit naturally. Technology is medieval: swords, bows, armor, ships, no firearms or modern industry unless the user explicitly adds them.",
    tone:
      "Heroic, hopeful, and beginner-friendly. Clear stakes, readable consequences, and a focus on fun, fairness, and collaboration.",
    magicLevel: "medium",
    techLevel: "medieval",
    startingLocation:
      "The riverside town of Greenhollow, with an inn, a market, a small temple, a town watch, and rumors of trouble in the nearby woods.",
    coreIntent: [
      "Make it EASY for new players and GMs.",
      "Keep tone heroic and inviting, with clear threats and clear ways to be awesome.",
      "Provide obvious adventure hooks without heavy lore dumps.",
      "Respect player agency and the game's mechanical constraints."
    ],
    worldOverview: [
      "Baseline: A classic medieval fantasy realm with magic, monsters, and ancient ruins.",
      "Magic exists, studied by wizards and guided by priests, but is not mundane consumer tech.",
      "Standard fantasy ancestries (humans, elves, dwarves, halflings, etc.) and classes fit smoothly.",
      "Medieval tech level: swords, bows, armor, sailing ships; no guns or modern industry unless the user/world explicitly permits them."
    ],
    coreLocations: [
      "Home Base — Greenhollow: Friendly riverside town and default starting hub.",
      "Whispering Woods: Goblins, wolves, fey lights, lost shrines, mysterious tracks.",
      "Old Watchtower: Bandits or a small cult; straightforward but dramatic dungeon site.",
      "Crystalford Mine: Miners missing, strange lights and sounds below."
    ],
    coreFactions: [
      "Town Watch (order and safety)",
      "Road Wardens (caravans and travel)",
      "A Hidden Cult or Shadowy Mage (slow-burn villain behind local troubles)"
    ],
    monsters: [
      {
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
      {
        id: "orc",
        name: "Orc",
        type: "Humanoid (Orc)",
        cr: "1/2",
        ac: 13,
        hp: 15,
        hitDice: "2d8+6",
        stats: { str: 16, dex: 12, con: 16, int: 7, wis: 11, cha: 10 },
        actions: [
          { name: "Greataxe", desc: "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 9 (1d12 + 3) slashing damage." }
        ]
      },
      {
        id: "skeleton",
        name: "Skeleton",
        type: "Undead",
        cr: "1/4",
        ac: 13,
        hp: 13,
        hitDice: "2d8+4",
        stats: { str: 10, dex: 14, con: 15, int: 6, wis: 8, cha: 5 },
        actions: [
          { name: "Shortsword", desc: "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage." }
        ]
      },
      {
        id: "wolf",
        name: "Wolf",
        type: "Beast",
        cr: "1/4",
        ac: 13,
        hp: 11,
        hitDice: "2d8+2",
        stats: { str: 12, dex: 15, con: 12, int: 3, wis: 12, cha: 6 },
        actions: [
          { name: "Bite", desc: "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 7 (2d4 + 2) piercing damage. If the target is a creature, it must succeed on a DC 11 Strength saving throw or be knocked prone." }
        ]
      },
      {
        id: "giant_spider",
        name: "Giant Spider",
        type: "Beast",
        cr: "1",
        ac: 14,
        hp: 26,
        hitDice: "4d10+4",
        stats: { str: 14, dex: 16, con: 12, int: 2, wis: 11, cha: 4 },
        actions: [
          { name: "Bite", desc: "Melee Weapon Attack: +5 to hit, reach 5 ft., one creature. Hit: 7 (1d8 + 3) piercing damage, and the target must make a DC 11 Constitution saving throw, taking 9 (2d8) poison damage on a failed save, or half as much damage on a successful one." },
          { name: "Web", desc: "Ranged Weapon Attack: +5 to hit, range 30/60 ft., one creature. The target is restrained by webbing. A creature can use its action to make a DC 12 Strength check, freeing itself or another creature within its reach on a success." }
        ]
      },
      {
        id: "bandit_captain",
        name: "Bandit Captain",
        type: "Humanoid (Any Race)",
        cr: "2",
        ac: 15,
        hp: 65,
        hitDice: "10d8+20",
        stats: { str: 15, dex: 16, con: 14, int: 14, wis: 11, cha: 14 },
        actions: [
          { name: "Multiattack", desc: "The captain makes three melee attacks: two with its scimitar and one with its dagger." },
          { name: "Scimitar", desc: "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) slashing damage." },
          { name: "Dagger", desc: "Melee or Ranged Weapon Attack: +5 to hit, reach 5 ft. or range 20/60 ft., one target. Hit: 5 (1d4 + 3) piercing damage." }
        ]
      },
      {
        id: "young_green_dragon",
        name: "Young Green Dragon",
        type: "Dragon",
        cr: "8",
        ac: 18,
        hp: 136,
        hitDice: "16d10+48",
        stats: { str: 19, dex: 12, con: 17, int: 16, wis: 13, cha: 15 },
        actions: [
          { name: "Multiattack", desc: "The dragon makes three attacks: one with its bite and two with its claws." },
          { name: "Bite", desc: "Melee Weapon Attack: +7 to hit, reach 10 ft., one target. Hit: 15 (2d10 + 4) piercing damage plus 7 (2d6) poison damage." },
          { name: "Claw", desc: "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 11 (2d6 + 4) slashing damage." },
          { name: "Poison Breath (Recharge 5-6)", desc: "The dragon exhales poisonous gas in a 30-foot cone. Each creature in that area must make a DC 14 Constitution saving throw, taking 42 (12d6) poison damage on a failed save, or half as much damage on a successful one." }
        ]
      }
    ],
    items: [
      // Weapons
      { id: "longsword", name: "Longsword", category: "weapon", weaponType: "martial_melee", damage: "1d8", versatileDamage: "1d10", damageType: "slashing", properties: ["versatile"], weight: 3, value: 15, rarity: "common" },
      { id: "shortbow", name: "Shortbow", category: "weapon", weaponType: "simple_ranged", damage: "1d6", damageType: "piercing", properties: ["ammunition (range 80/320)", "two-handed"], weight: 2, value: 25, rarity: "common" },
      { id: "battleaxe", name: "Battleaxe", category: "weapon", weaponType: "martial_melee", damage: "1d8", versatileDamage: "1d10", damageType: "slashing", properties: ["versatile"], weight: 4, value: 10, rarity: "common" },
      { id: "dagger", name: "Dagger", category: "weapon", weaponType: "simple_melee", damage: "1d4", damageType: "piercing", properties: ["finesse", "light", "thrown (range 20/60)"], weight: 1, value: 2, rarity: "common" },
      // Armor
      { id: "chain_shirt", name: "Chain Shirt", category: "armor", armorType: "medium", baseAC: 13, properties: [], weight: 20, value: 50, rarity: "common" },
      { id: "leather_armor", name: "Leather Armor", category: "armor", armorType: "light", baseAC: 11, properties: [], weight: 10, value: 10, rarity: "common" },
      { id: "shield", name: "Shield", category: "armor", armorType: "shield", acBonus: 2, weight: 6, value: 10, rarity: "common" },
      // Consumables
      { id: "healing_potion", name: "Potion of Healing", category: "consumable", consumable: true, effects: ["HEAL[player|2d4+2]"], weight: 0.5, value: 50, rarity: "common", description: "A red liquid that heals 2d4+2 hit points." },
      { id: "greater_healing_potion", name: "Potion of Greater Healing", category: "consumable", consumable: true, effects: ["HEAL[player|4d4+4]"], weight: 0.5, value: 150, rarity: "uncommon", description: "A potent red liquid that heals 4d4+4 hit points." },
      { id: "antitoxin", name: "Antitoxin", category: "consumable", consumable: true, effects: ["STATUS_ADD[Advantage on Poison Saves]"], weight: 0, value: 50, rarity: "common", description: "Advantage on saving throws against poison for 1 hour." },
      // Magic Items
      { id: "potion_of_climbing", name: "Potion of Climbing", category: "consumable", consumable: true, effects: ["STATUS_ADD[Climbing Speed]"], weight: 0.5, value: 50, rarity: "common", description: "Gives you a climbing speed equal to your walking speed for 1 hour." },
      { id: "bag_of_holding", name: "Bag of Holding", category: "magic_item", slot: "wondrous", effects: [], weight: 15, value: 4000, rarity: "uncommon", description: "This bag has an interior space considerably larger than its outside dimensions." },
      { id: "weapon_plus_one", name: "+1 Weapon", category: "weapon", weaponType: "any", effects: ["+1 to hit", "+1 damage"], toHitBonus: 1, damageBonus: 1, weight: 0, value: 500, rarity: "uncommon", description: "You have a +1 bonus to attack and damage rolls made with this magic weapon." },
      // Gear
      { id: "rope_50ft", name: "Rope (50 feet)", category: "gear", weight: 10, value: 1, rarity: "common", description: "Rope has 2 hit points and can be burst with a DC 17 Strength check." },
      { id: "torch", name: "Torch", category: "gear", weight: 1, value: 0.01, rarity: "common", description: "A torch burns for 1 hour, providing bright light in a 20-foot radius and dim light for an additional 20 feet." },
      { id: "adventurers_pack", name: "Adventurer's Pack", category: "gear", weight: 30, value: 10, rarity: "common", description: "Includes a backpack, bedroll, mess kit, tinderbox, 10 torches, 10 days of rations, and a waterskin." }
    ],
    isDefault: true,
  },
  {
    id: "template_urban_noir",
    name: "Urban Noir",
    settingType: "urban-noir",
    briefDescription: "City intrigue, thieves guilds, and political drama in a dark urban fantasy setting.",
    fullDescription:
      "The sprawling city of Shadowhaven never sleeps. In its maze of alleys and grand boulevards, nobles scheme in candlelit salons while thieves prowl the rooftops. Every faction has an agenda, every ally a secret, and trust is the rarest currency of all.",
    tone: "Dark, mysterious, morally grey with political intrigue",
    magicLevel: "low",
    techLevel: "renaissance",
    startingLocation: "The Lamplight District, where taverns glow warmly but danger lurks in every shadow",
    coreIntent: [
      "Focus on intrigue, secrets, and social maneuvering.",
      "Combat is deadly and often a fail state; stealth and talk are key.",
      "Moral ambiguity is central; no clear good guys."
    ],
    worldOverview: [
      "Renaissance-adjacent tech: rapiers, crossbows, early gunpowder, printing presses, carriages.",
      "Magic exists but is subtle, restricted, or illegal. Hedge mages, back-alley charms, sanctioned court wizards.",
      "Factions and neighborhoods define the city more than wilderness; politics, crime, and reputation matter."
    ],
    coreLocations: [
      "Lamplight District (taverns, informants)",
      "Noble Quarter (gilded halls, private corruption)",
      "Docks (smugglers, trade)",
      "Warrens (poverty, crime)",
      "Old Temple Row (forgotten gods, secrets)"
    ],
    coreFactions: [
      "The Silver Council: Noble houses ruling from gilded halls.",
      "The Black Hand: Chartered Thieves Guild balancing crime and 'order'.",
      "The Greycoats: Overworked city watch; individually honest or corrupt.",
      "The Veil: Spy network trading in secrets, blackmail, and whispers.",
      "The Burned: Fire-obsessed cult or movement, dangerous and unpredictable."
    ],
    monsters: [
      {
        id: "bandit",
        name: "Bandit",
        type: "Humanoid (Any Race)",
        cr: "1/8",
        ac: 12,
        hp: 11,
        hitDice: "2d8+2",
        stats: { str: 11, dex: 12, con: 12, int: 10, wis: 10, cha: 10 },
        actions: [
          { name: "Scimitar", desc: "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 4 (1d6 + 1) slashing damage." }
        ]
      },
      {
        id: "city_guard",
        name: "City Guard",
        type: "Humanoid (Any Race)",
        cr: "1/8",
        ac: 16,
        hp: 11,
        hitDice: "2d8+2",
        stats: { str: 13, dex: 12, con: 12, int: 10, wis: 11, cha: 10 },
        actions: [
          { name: "Spear", desc: "Melee or Ranged Weapon Attack: +3 to hit, reach 5 ft. or range 20/60 ft., one target. Hit: 4 (1d6 + 1) piercing damage, or 5 (1d8 + 1) piercing damage if used with two hands to make a melee attack." }
        ]
      },
      {
        id: "master_thief",
        name: "Master Thief",
        type: "Humanoid (Any Race)",
        cr: "2",
        ac: 16,
        hp: 44,
        hitDice: "8d8+8",
        stats: { str: 11, dex: 18, con: 12, int: 14, wis: 11, cha: 14 },
        actions: [
          { name: "Multiattack", desc: "The thief makes two attacks with its shortsword." },
          { name: "Shortsword", desc: "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 7 (1d6 + 4) piercing damage." },
          { name: "Hand Crossbow", desc: "Ranged Weapon Attack: +6 to hit, range 30/120 ft., one target. Hit: 7 (1d6 + 4) piercing damage." }
        ]
      },
      {
        id: "assassin",
        name: "Assassin",
        type: "Humanoid (Any Race)",
        cr: "8",
        ac: 15,
        hp: 78,
        hitDice: "12d8+24",
        stats: { str: 11, dex: 16, con: 14, int: 13, wis: 11, cha: 10 },
        actions: [
          { name: "Multiattack", desc: "The assassin makes two shortsword attacks." },
          { name: "Shortsword", desc: "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) piercing damage, and the target must make a DC 15 Constitution saving throw, taking 24 (7d6) poison damage on a failed save, or half as much damage on a successful one." },
          { name: "Light Crossbow", desc: "Ranged Weapon Attack: +6 to hit, range 80/320 ft., one target. Hit: 7 (1d8 + 3) piercing damage, and the target must make a DC 15 Constitution saving throw, taking 24 (7d6) poison damage on a failed save, or half as much damage on a successful one." }
        ]
      },
      {
        id: "corrupt_noble",
        name: "Corrupt Noble",
        type: "Humanoid (Any Race)",
        cr: "1/4",
        ac: 15,
        hp: 9,
        hitDice: "2d8",
        stats: { str: 11, dex: 12, con: 11, int: 12, wis: 14, cha: 16 },
        actions: [
          { name: "Rapier", desc: "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 5 (1d8 + 1) piercing damage." }
        ]
      },
      {
        id: "shadow_demon",
        name: "Shadow Demon",
        type: "Fiend (Demon)",
        cr: "4",
        ac: 13,
        hp: 66,
        hitDice: "12d8+12",
        stats: { str: 1, dex: 17, con: 12, int: 14, wis: 13, cha: 14 },
        actions: [
          { name: "Claws", desc: "Melee Weapon Attack: +5 to hit, reach 5 ft., one creature. Hit: 10 (2d6 + 3) psychic damage or, if the demon had advantage on the attack roll, 17 (4d6 + 3) psychic damage." }
        ]
      }
    ],
    items: [
      // Weapons
      { id: "dagger", name: "Dagger", category: "weapon", weaponType: "simple_melee", damage: "1d4", damageType: "piercing", properties: ["finesse", "light", "thrown (range 20/60)"], weight: 1, value: 2, rarity: "common" },
      { id: "rapier", name: "Rapier", category: "weapon", weaponType: "martial_melee", damage: "1d8", damageType: "piercing", properties: ["finesse"], weight: 2, value: 25, rarity: "common" },
      { id: "light_crossbow", name: "Light Crossbow", category: "weapon", weaponType: "simple_ranged", damage: "1d8", damageType: "piercing", properties: ["ammunition (range 80/320)", "loading", "two-handed"], weight: 5, value: 25, rarity: "common" },
      { id: "hand_crossbow", name: "Hand Crossbow", category: "weapon", weaponType: "martial_ranged", damage: "1d6", damageType: "piercing", properties: ["ammunition (range 30/120)", "light", "loading"], weight: 3, value: 75, rarity: "common", description: "A small crossbow that can be fired with one hand." },
      // Armor
      { id: "studded_leather", name: "Studded Leather", category: "armor", armorType: "light", baseAC: 12, properties: [], weight: 13, value: 45, rarity: "common" },
      { id: "fine_clothes", name: "Fine Clothes", category: "armor", armorType: "light", baseAC: 11, properties: [], weight: 6, value: 15, rarity: "common", description: "Elegant clothing that provides minimal protection but allows for social maneuvering." },
      // Consumables
      { id: "poison_vial", name: "Poison Vial (Basic)", category: "consumable", consumable: true, effects: ["DAMAGE[target|1d4|poison]"], weight: 0, value: 100, rarity: "common", description: "You can use the poison to coat one slashing or piercing weapon. A creature hit by the poisoned weapon must make a DC 10 Constitution saving throw or take 1d4 poison damage." },
      { id: "smoke_bomb", name: "Smoke Bomb", category: "consumable", consumable: true, effects: ["STATUS_ADD[Heavily Obscured Area]"], weight: 0.5, value: 25, rarity: "common", description: "Creates a 10-foot-radius sphere of smoke for 1 minute. The area is heavily obscured." },
      { id: "sleeping_draught", name: "Sleeping Draught", category: "consumable", consumable: true, effects: ["STATUS_ADD[Unconscious]"], weight: 0.5, value: 50, rarity: "uncommon", description: "A creature that drinks this potion must succeed on a DC 13 Constitution saving throw or fall unconscious for 1 hour." },
      // Magic Items
      { id: "cloak_of_protection", name: "Cloak of Protection", category: "magic_item", slot: "cloak", effects: ["+1 AC", "+1 to all saves"], acBonus: 1, saveBonus: 1, requiresAttunement: true, weight: 3, value: 3500, rarity: "uncommon", description: "You gain a +1 bonus to AC and saving throws while wearing this cloak." },
      { id: "ring_mind_shielding", name: "Ring of Mind Shielding", category: "magic_item", slot: "ring", effects: ["Immune to magic that reads thoughts"], requiresAttunement: true, weight: 0, value: 800, rarity: "uncommon", description: "You are immune to magic that allows other creatures to read your thoughts or determine if you are lying." },
      { id: "gloves_thievery", name: "Gloves of Thievery", category: "magic_item", slot: "hands", effects: ["+5 bonus to Sleight of Hand and lockpicking"], requiresAttunement: false, weight: 0, value: 500, rarity: "uncommon", description: "These gloves are invisible while worn and grant a +5 bonus to Dexterity (Sleight of Hand) checks and Dexterity checks made to pick locks." },
      // Gear
      { id: "thieves_tools", name: "Thieves' Tools", category: "gear", weight: 1, value: 25, rarity: "common", description: "This set of tools includes a small file, a set of lock picks, a small mirror mounted on a metal handle, a set of narrow-bladed scissors, and a pair of pliers." },
      { id: "disguise_kit", name: "Disguise Kit", category: "gear", weight: 3, value: 25, rarity: "common", description: "This pouch of cosmetics, hair dye, and small props lets you create disguises that change your physical appearance." },
      { id: "grappling_hook", name: "Grappling Hook", category: "gear", weight: 4, value: 2, rarity: "common", description: "A grappling hook can be attached to a rope. You can throw the grappling hook at an edge or ledge within 50 feet, making a DC 10 Dexterity (Acrobatics) check." }
    ]
  },
  {
    id: "template_high_seas",
    name: "High Seas Adventure",
    settingType: "high-seas",
    briefDescription: "Pirates, naval combat, and island hopping across a vast archipelago.",
    fullDescription:
      "The Shattered Isles stretch across an endless ocean - hundreds of islands connected by trade routes and pirate raids. Ancient treasures lie buried on forgotten atolls, sea monsters hunt in the deep, and every ship's crew has their own code. The sea is freedom, danger, and destiny.",
    tone: "Adventurous and swashbuckling with nautical flavor",
    magicLevel: "medium",
    techLevel: "renaissance",
    startingLocation: "Port Meridian, a bustling harbor city serving as the gateway to the Shattered Isles",
    coreIntent: [
      "Swashbuckling, adventurous, cinematic.",
      "Emphasize exploration, daring plans, boarding actions, treasure maps, and moral choices at sea.",
      "Allow both heroic pirates and principled navy officers."
    ],
    worldOverview: [
      "Age-of-sail tech: tall ships, cannons, cutlasses, flintlock pistols.",
      "Magic is real and often tied to the sea, storms, stars, and ancient ruins.",
      "The Shattered Isles are diverse: jungle islands, volcanic chains, haunted reefs, fog-shrouded atolls, frozen northern holds.",
      "Sea monsters (krakens, dragon turtles, sahuagin, sirens) and supernatural storms are credible threats."
    ],
    coreLocations: [
      "Port Meridian: Bustling harbor city and gateway.",
      "The Shattered Isles: Vast archipelago of diverse islands.",
      "Forgotten Atolls: Buried ancient treasures.",
      "The Deep: Home to sea monsters and mysteries."
    ],
    coreFactions: [
      "Merchant Navy: Trade powers, convoys, monopolies, private security.",
      "Free Captains: Pirate confederation with shifting codes and grudges.",
      "Storm Lords: Indigenous island leaders and shamans.",
      "Tidecaller Cult: Fanatics devoted to a sea deity."
    ],
    monsters: [
      {
        id: "pirate_deckhand",
        name: "Pirate Deckhand",
        type: "Humanoid (Any Race)",
        cr: "1/4",
        ac: 12,
        hp: 16,
        hitDice: "3d8+3",
        stats: { str: 13, dex: 12, con: 12, int: 10, wis: 10, cha: 10 },
        actions: [
          { name: "Scimitar", desc: "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 4 (1d6 + 1) slashing damage." },
          { name: "Light Crossbow", desc: "Ranged Weapon Attack: +3 to hit, range 80/320 ft., one target. Hit: 5 (1d8 + 1) piercing damage." }
        ]
      },
      {
        id: "pirate_captain",
        name: "Pirate Captain",
        type: "Humanoid (Any Race)",
        cr: "4",
        ac: 14,
        hp: 91,
        hitDice: "14d8+28",
        stats: { str: 16, dex: 14, con: 14, int: 12, wis: 11, cha: 16 },
        actions: [
          { name: "Multiattack", desc: "The captain makes two attacks with its cutlass or two with its flintlock pistol." },
          { name: "Cutlass", desc: "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) slashing damage." },
          { name: "Flintlock Pistol", desc: "Ranged Weapon Attack: +4 to hit, range 30/90 ft., one target. Hit: 7 (1d10 + 2) piercing damage." }
        ]
      },
      {
        id: "sahuagin_warrior",
        name: "Sahuagin Warrior",
        type: "Humanoid (Sahuagin)",
        cr: "1/2",
        ac: 12,
        hp: 22,
        hitDice: "4d8+4",
        stats: { str: 13, dex: 11, con: 12, int: 12, wis: 13, cha: 9 },
        actions: [
          { name: "Multiattack", desc: "The sahuagin makes two melee attacks: one with its bite and one with its claws or spear." },
          { name: "Bite", desc: "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 3 (1d4 + 1) piercing damage." },
          { name: "Claws", desc: "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 3 (1d4 + 1) slashing damage." },
          { name: "Spear", desc: "Melee or Ranged Weapon Attack: +3 to hit, reach 5 ft. or range 20/60 ft., one target. Hit: 4 (1d6 + 1) piercing damage, or 5 (1d8 + 1) piercing damage if used with two hands to make a melee attack." }
        ]
      },
      {
        id: "giant_crab",
        name: "Giant Crab",
        type: "Beast",
        cr: "1/8",
        ac: 15,
        hp: 13,
        hitDice: "3d8",
        stats: { str: 13, dex: 15, con: 11, int: 1, wis: 9, cha: 3 },
        actions: [
          { name: "Claw", desc: "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 4 (1d6 + 1) bludgeoning damage, and the target is grappled (escape DC 11). The crab has two claws, each of which can grapple only one target." }
        ]
      },
      {
        id: "sea_hag",
        name: "Sea Hag",
        type: "Fey",
        cr: "2",
        ac: 14,
        hp: 52,
        hitDice: "7d8+21",
        stats: { str: 16, dex: 13, con: 16, int: 12, wis: 12, cha: 13 },
        actions: [
          { name: "Claws", desc: "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 11 (2d8 + 2) slashing damage." },
          { name: "Death Glare", desc: "The hag targets one frightened creature she can see within 30 feet of her. If the target can see the hag, it must succeed on a DC 11 Wisdom saving throw or drop to 0 hit points." }
        ]
      },
      {
        id: "reef_shark",
        name: "Reef Shark",
        type: "Beast",
        cr: "1/2",
        ac: 12,
        hp: 22,
        hitDice: "4d8+4",
        stats: { str: 14, dex: 13, con: 13, int: 1, wis: 10, cha: 4 },
        actions: [
          { name: "Bite", desc: "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 6 (1d8 + 2) piercing damage." }
        ]
      }
    ],
    items: [
      // Weapons
      { id: "scimitar", name: "Scimitar", category: "weapon", weaponType: "martial_melee", damage: "1d6", damageType: "slashing", properties: ["finesse", "light"], weight: 3, value: 25, rarity: "common" },
      { id: "cutlass", name: "Cutlass", category: "weapon", weaponType: "martial_melee", damage: "1d8", damageType: "slashing", properties: ["finesse"], weight: 3, value: 30, rarity: "common", description: "A curved sword favored by pirates and sailors." },
      { id: "harpoon", name: "Harpoon", category: "weapon", weaponType: "martial_melee", damage: "1d8", damageType: "piercing", properties: ["thrown (range 20/60)"], weight: 6, value: 10, rarity: "common", description: "A barbed spear used for hunting sea creatures. On a hit, the harpoon lodges in the target." },
      { id: "flintlock_pistol", name: "Flintlock Pistol", category: "weapon", weaponType: "martial_ranged", damage: "1d10", damageType: "piercing", properties: ["ammunition (range 30/90)", "loading"], weight: 3, value: 250, rarity: "uncommon", description: "A single-shot firearm that requires gunpowder and a round lead ball." },
      // Armor
      { id: "leather_armor", name: "Leather Armor", category: "armor", armorType: "light", baseAC: 11, properties: [], weight: 10, value: 10, rarity: "common" },
      { id: "tricorn_hat", name: "Tricorn Hat", category: "armor", armorType: "light", baseAC: 10, acBonus: 1, properties: [], weight: 0.5, value: 5, rarity: "common", description: "A fashionable three-cornered hat that grants a +1 bonus to AC and advantage on Charisma (Persuasion) checks with sailors." },
      // Consumables
      { id: "rum", name: "Bottle of Rum", category: "consumable", consumable: true, effects: ["TEMP_HP[1d4]"], weight: 1, value: 5, rarity: "common", description: "A strong alcoholic beverage. Drinking it grants 1d4 temporary hit points for 1 hour but imposes disadvantage on Intelligence checks." },
      { id: "sea_biscuits", name: "Sea Biscuits (Hardtack)", category: "consumable", consumable: true, effects: [], weight: 2, value: 1, rarity: "common", description: "Preserved rations that last for months at sea. Sustains you for one day." },
      // Magic Items
      { id: "trident_fish_command", name: "Trident of Fish Command", category: "weapon", weaponType: "martial_melee", damage: "1d6", versatileDamage: "1d8", damageType: "piercing", properties: ["thrown (range 20/60)", "versatile"], effects: ["Command fish within 60 feet"], requiresAttunement: true, weight: 4, value: 800, rarity: "uncommon", description: "This trident is a magic weapon. It has 3 charges and regains 1d3 expended charges daily at dawn. While you carry it, you can use an action to expend 1 charge to cast dominate beast (save DC 15) from it on a beast that has an innate swimming speed." },
      { id: "cape_mountebank", name: "Cape of the Mountebank", category: "magic_item", slot: "cloak", effects: ["Cast Dimension Door once per day"], requiresAttunement: false, weight: 1, value: 6000, rarity: "rare", description: "This cape smells faintly of brimstone. While wearing it, you can use it to cast dimension door as an action. This property can't be used again until the next dawn." },
      { id: "necklace_adaptation", name: "Necklace of Adaptation", category: "magic_item", slot: "neck", effects: ["Breathe normally in any environment"], requiresAttunement: true, weight: 0, value: 1500, rarity: "uncommon", description: "While wearing this necklace, you can breathe normally in any environment, and you have advantage on saving throws against harmful gases and vapors." },
      // Gear
      { id: "spyglass", name: "Spyglass", category: "gear", weight: 1, value: 1000, rarity: "common", description: "Objects viewed through a spyglass are magnified to twice their size." },
      { id: "navigators_tools", name: "Navigator's Tools", category: "gear", weight: 2, value: 25, rarity: "common", description: "This set of instruments is used for navigation at sea. Proficiency with navigator's tools lets you chart a ship's course and follow navigation charts." },
      { id: "rope_50ft", name: "Rope (50 feet)", category: "gear", weight: 10, value: 1, rarity: "common", description: "Rope has 2 hit points and can be burst with a DC 17 Strength check." }
    ]
  },
  {
    id: "template_dungeon_crawler",
    name: "Dungeon Crawler",
    settingType: "dungeon-crawler",
    briefDescription: "Focus on underground exploration with less overworld - delve deep into ancient ruins.",
    fullDescription:
      "The world above has fallen to darkness. Survivors huddle in the Last Sanctuary, a fortress built at the entrance to the Endless Delve - a vast network of ancient dungeons, caves, and underground cities. All adventures begin with the question: how deep will you go?",
    tone: "Tense and atmospheric dungeon exploration",
    magicLevel: "high",
    techLevel: "mixed",
    startingLocation: "The Last Sanctuary, the only safe haven at the entrance to the Endless Delve",
    coreIntent: [
      "Tense, atmospheric exploration; not pure slaughter.",
      "Telegraph danger; let players opt into deeper risk.",
      "Victories feel earned when they extract alive with maps, loot, and scars."
    ],
    worldOverview: [
      "The surface is dangerous, fading, or politically unstable; the true frontier is below.",
      "The Endless Delve: layered dungeons, ruins, caverns, fungal forests, lost cities, aberrant domains.",
      "The deeper the level, the higher the threat and the greater the reward.",
      "Resource pressure: light, food, spells, hit points, conditions.",
      "Spatial awareness: chokepoints, verticality, secret doors, shortcuts."
    ],
    coreLocations: [
      "The Last Sanctuary: Fortified hub at the Delve's mouth (safe rest, gear, rumors).",
      "The Endless Delve: The main dungeon complex."
    ],
    coreFactions: [
      "Sanctuary Guard: Defenders of the last safe haven.",
      "Delver's Guild: Explorers and map-makers.",
      "Cult of the Deep: Worshippers of the things below."
    ],
    monsters: [
      {
        id: "gelatinous_cube",
        name: "Gelatinous Cube",
        type: "Ooze",
        cr: "2",
        ac: 6,
        hp: 84,
        hitDice: "8d10+40",
        stats: { str: 14, dex: 3, con: 20, int: 1, wis: 6, cha: 1 },
        actions: [
          { name: "Pseudopod", desc: "Melee Weapon Attack: +4 to hit, reach 5 ft., one creature. Hit: 10 (3d6) acid damage." },
          { name: "Engulf", desc: "The cube moves up to its speed. While doing so, it can enter Large or smaller creatures' spaces. Whenever the cube enters a creature's space, the creature must make a DC 12 Dexterity saving throw." }
        ]
      },
      {
        id: "ogre",
        name: "Ogre",
        type: "Giant",
        cr: "2",
        ac: 11,
        hp: 59,
        hitDice: "7d10+21",
        stats: { str: 19, dex: 8, con: 16, int: 5, wis: 7, cha: 7 },
        actions: [
          { name: "Greatclub", desc: "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 13 (2d8 + 4) bludgeoning damage." }
        ]
      },
      {
        id: "cave_spider",
        name: "Cave Spider",
        type: "Beast",
        cr: "1/2",
        ac: 13,
        hp: 18,
        hitDice: "4d8",
        stats: { str: 12, dex: 16, con: 10, int: 2, wis: 10, cha: 3 },
        actions: [
          { name: "Bite", desc: "Melee Weapon Attack: +5 to hit, reach 5 ft., one creature. Hit: 6 (1d6 + 3) piercing damage, and the target must make a DC 11 Constitution saving throw, taking 7 (2d6) poison damage on a failed save, or half as much damage on a successful one." },
          { name: "Web (Recharge 5-6)", desc: "Ranged Weapon Attack: +5 to hit, range 30/60 ft., one creature. The target is restrained by webbing." }
        ]
      },
      {
        id: "rust_monster",
        name: "Rust Monster",
        type: "Monstrosity",
        cr: "1/2",
        ac: 14,
        hp: 27,
        hitDice: "5d8+5",
        stats: { str: 13, dex: 12, con: 13, int: 2, wis: 13, cha: 6 },
        actions: [
          { name: "Bite", desc: "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 5 (1d8 + 1) piercing damage." },
          { name: "Antennae", desc: "The rust monster corrodes a nonmagical ferrous metal object it can see within 5 feet of it. If the object isn't being worn or carried, the touch destroys a 1-foot cube of it." }
        ]
      },
      {
        id: "mimic",
        name: "Mimic",
        type: "Monstrosity",
        cr: "2",
        ac: 12,
        hp: 58,
        hitDice: "9d8+18",
        stats: { str: 17, dex: 12, con: 15, int: 5, wis: 13, cha: 8 },
        actions: [
          { name: "Pseudopod", desc: "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) bludgeoning damage. If the mimic is in object form, the target is subjected to its Adhesive trait." },
          { name: "Bite", desc: "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) piercing damage plus 4 (1d8) acid damage." }
        ]
      },
      {
        id: "carrion_crawler",
        name: "Carrion Crawler",
        type: "Monstrosity",
        cr: "2",
        ac: 13,
        hp: 51,
        hitDice: "6d10+18",
        stats: { str: 14, dex: 13, con: 16, int: 1, wis: 12, cha: 5 },
        actions: [
          { name: "Multiattack", desc: "The carrion crawler makes two attacks: one with its tentacles and one with its bite." },
          { name: "Tentacles", desc: "Melee Weapon Attack: +8 to hit, reach 10 ft., one creature. Hit: 4 (1d4 + 2) poison damage, and the target must succeed on a DC 13 Constitution saving throw or be poisoned for 1 minute. Until this poison ends, the target is paralyzed." },
          { name: "Bite", desc: "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 7 (2d4 + 2) piercing damage." }
        ]
      },
      {
        id: "black_pudding",
        name: "Black Pudding",
        type: "Ooze",
        cr: "4",
        ac: 7,
        hp: 85,
        hitDice: "10d10+30",
        stats: { str: 16, dex: 5, con: 16, int: 1, wis: 6, cha: 1 },
        actions: [
          { name: "Pseudopod", desc: "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) bludgeoning damage plus 18 (4d8) acid damage. In addition, nonmagical armor worn by the target is partly dissolved and takes a permanent and cumulative −1 penalty to the AC it offers." }
        ]
      }
    ],
    items: [
      // Weapons
      { id: "longsword", name: "Longsword", category: "weapon", weaponType: "martial_melee", damage: "1d8", versatileDamage: "1d10", damageType: "slashing", properties: ["versatile"], weight: 3, value: 15, rarity: "common" },
      { id: "mace", name: "Mace", category: "weapon", weaponType: "simple_melee", damage: "1d6", damageType: "bludgeoning", properties: [], weight: 4, value: 5, rarity: "common" },
      { id: "light_crossbow", name: "Light Crossbow", category: "weapon", weaponType: "simple_ranged", damage: "1d8", damageType: "piercing", properties: ["ammunition (range 80/320)", "loading", "two-handed"], weight: 5, value: 25, rarity: "common" },
      // Armor
      { id: "chain_mail", name: "Chain Mail", category: "armor", armorType: "heavy", baseAC: 16, properties: ["stealth_disadvantage"], strengthRequired: 13, weight: 55, value: 75, rarity: "common" },
      { id: "shield", name: "Shield", category: "armor", armorType: "shield", acBonus: 2, weight: 6, value: 10, rarity: "common" },
      // Consumables
      { id: "healing_potion", name: "Potion of Healing", category: "consumable", consumable: true, effects: ["HEAL[player|2d4+2]"], weight: 0.5, value: 50, rarity: "common", description: "A red liquid that heals 2d4+2 hit points." },
      { id: "greater_healing_potion", name: "Potion of Greater Healing", category: "consumable", consumable: true, effects: ["HEAL[player|4d4+4]"], weight: 0.5, value: 150, rarity: "uncommon", description: "A potent red liquid that heals 4d4+4 hit points." },
      { id: "oil_flask", name: "Oil Flask", category: "consumable", consumable: true, effects: ["DAMAGE[1d6|fire]"], weight: 1, value: 1, rarity: "common", description: "You can throw this flask up to 20 feet, shattering it on impact. Make a ranged attack against a creature or object, treating the oil as an improvised weapon. On a hit, the target is covered in oil. If the target takes any fire damage before the oil dries (after 1 minute), the target takes an additional 5 fire damage." },
      { id: "alchemists_fire", name: "Alchemist's Fire", category: "consumable", consumable: true, effects: ["DAMAGE[1d4|fire]"], weight: 1, value: 50, rarity: "common", description: "This sticky, adhesive fluid ignites when exposed to air. As an action, you can throw this flask up to 20 feet, shattering it on impact. Make a ranged attack against a creature or object. On a hit, the target takes 1d4 fire damage at the start of each of its turns. A creature can end this damage by using its action to make a DC 10 Dexterity check to extinguish the flames." },
      // Magic Items
      { id: "everburning_torch", name: "Everburning Torch", category: "magic_item", slot: "wondrous", effects: ["Produces continual flame"], requiresAttunement: false, weight: 1, value: 100, rarity: "uncommon", description: "This torch produces a continual flame that requires no fuel or air and cannot be extinguished." },
      { id: "boots_striding", name: "Boots of Striding and Springing", category: "magic_item", slot: "feet", effects: ["Speed becomes 30 feet", "+10 feet to long/high jump"], requiresAttunement: true, weight: 1, value: 500, rarity: "uncommon", description: "While you wear these boots, your walking speed becomes 30 feet, unless your walking speed is higher, and your speed isn't reduced if you are encumbered or wearing heavy armor. In addition, you can jump three times the normal distance." },
      { id: "ring_of_protection", name: "Ring of Protection", category: "magic_item", slot: "ring", effects: ["+1 AC", "+1 to all saves"], acBonus: 1, saveBonus: 1, requiresAttunement: true, weight: 0, value: 3500, rarity: "rare", description: "You gain a +1 bonus to AC and saving throws while wearing this ring." },
      // Gear
      { id: "rope_50ft", name: "Rope (50 feet)", category: "gear", weight: 10, value: 1, rarity: "common", description: "Rope has 2 hit points and can be burst with a DC 17 Strength check." },
      { id: "pitons", name: "Pitons (10)", category: "gear", weight: 2.5, value: 0.5, rarity: "common", description: "A piton is a steel spike with an eye through which you can loop a rope." },
      { id: "chalk", name: "Chalk (10 pieces)", category: "gear", weight: 0, value: 0.01, rarity: "common", description: "Used to mark paths in dungeons and caves." },
      { id: "iron_rations", name: "Iron Rations (10 days)", category: "gear", weight: 10, value: 5, rarity: "common", description: "Preserved food that lasts for months. Each day's ration provides enough food for one Medium creature for one day." }
    ]
  },
  {
    id: "template_dark_fantasy",
    name: "Dark Fantasy",
    settingType: "dark-fantasy",
    briefDescription: "Grimdark horror elements with morally grey choices and dark themes.",
    fullDescription:
      "The Old Kingdom is dying. The sun grows dimmer each year, the dead don't stay buried, and the gods have gone silent. In this world of ash and shadow, there are no heroes - only survivors who make terrible choices to see another dawn.",
    tone: "Dark, gritty, morally complex with horror elements",
    magicLevel: "medium",
    techLevel: "medieval",
    startingLocation: "Ashenmoor, a walled town barely holding back the encroaching darkness",
    coreIntent: [
      "Grim, weighty, morally complex — but not edge-lord shock for its own sake.",
      "Victories are costly; survival and small mercies matter.",
      "Show horror elements (body horror, cosmic dread, tragedy) with care and consent."
    ],
    worldOverview: [
      "The sun wanes; harvests fail; undead and horrors slip into the world.",
      "Magic is potent but tainted; bargains, blood, and forbidden texts leave marks.",
      "Holy power may exist but feels distant, conditional, or compromised.",
      "Cities are paranoid; countryside is monster-haunted."
    ],
    coreLocations: [
      "Ashenmoor: Walled town holding back the darkness.",
      "The Old Kingdom: A dying land of ash and shadow."
    ],
    coreFactions: [
      "Fragmented Nobles: Clinging to power.",
      "Cults and Inquisitions: Heretical orders and desperate commoners.",
      "The Undead: Not a faction per se, but a constant organized threat."
    ],
    monsters: [
      {
        id: "zombie",
        name: "Zombie",
        type: "Undead",
        cr: "1/4",
        ac: 8,
        hp: 22,
        hitDice: "3d8+9",
        stats: { str: 13, dex: 6, con: 16, int: 3, wis: 6, cha: 5 },
        actions: [
          { name: "Slam", desc: "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 4 (1d6 + 1) bludgeoning damage." }
        ]
      },
      {
        id: "zombie_horde",
        name: "Zombie Horde",
        type: "Undead",
        cr: "2",
        ac: 8,
        hp: 59,
        hitDice: "7d8+28",
        stats: { str: 16, dex: 6, con: 18, int: 3, wis: 6, cha: 5 },
        actions: [
          { name: "Multiattack", desc: "The horde makes two slam attacks." },
          { name: "Slam", desc: "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) bludgeoning damage." }
        ]
      },
      {
        id: "cultist",
        name: "Cultist",
        type: "Humanoid (Any Race)",
        cr: "1/8",
        ac: 12,
        hp: 9,
        hitDice: "2d8",
        stats: { str: 11, dex: 12, con: 10, int: 10, wis: 11, cha: 10 },
        actions: [
          { name: "Scimitar", desc: "Melee Weapon Attack: +3 to hit, reach 5 ft., one creature. Hit: 4 (1d6 + 1) slashing damage." }
        ]
      },
      {
        id: "cult_fanatic",
        name: "Cult Fanatic",
        type: "Humanoid (Any Race)",
        cr: "2",
        ac: 13,
        hp: 33,
        hitDice: "6d8+6",
        stats: { str: 11, dex: 14, con: 12, int: 10, wis: 13, cha: 14 },
        actions: [
          { name: "Multiattack", desc: "The fanatic makes two melee attacks." },
          { name: "Dagger", desc: "Melee or Ranged Weapon Attack: +4 to hit, reach 5 ft. or range 20/60 ft., one creature. Hit: 4 (1d4 + 2) piercing damage." }
        ]
      },
      {
        id: "shadow_mastiff",
        name: "Shadow Mastiff",
        type: "Monstrosity",
        cr: "2",
        ac: 12,
        hp: 33,
        hitDice: "6d8+6",
        stats: { str: 16, dex: 14, con: 13, int: 5, wis: 12, cha: 5 },
        actions: [
          { name: "Bite", desc: "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) piercing damage. If the target is a creature, it must succeed on a DC 13 Strength saving throw or be knocked prone." }
        ]
      },
      {
        id: "wraith",
        name: "Wraith",
        type: "Undead",
        cr: "5",
        ac: 13,
        hp: 67,
        hitDice: "9d8+27",
        stats: { str: 6, dex: 16, con: 16, int: 12, wis: 14, cha: 15 },
        actions: [
          { name: "Life Drain", desc: "Melee Weapon Attack: +6 to hit, reach 5 ft., one creature. Hit: 21 (4d8 + 3) necrotic damage. The target must succeed on a DC 14 Constitution saving throw or its hit point maximum is reduced by an amount equal to the damage taken." }
        ]
      },
      {
        id: "necromancer",
        name: "Necromancer",
        type: "Humanoid (Any Race)",
        cr: "6",
        ac: 12,
        hp: 66,
        hitDice: "12d8+12",
        stats: { str: 9, dex: 14, con: 12, int: 17, wis: 12, cha: 11 },
        actions: [
          { name: "Withering Touch", desc: "Melee Spell Attack: +7 to hit, reach 5 ft., one creature. Hit: 5 (2d4) necrotic damage." }
        ]
      }
    ],
    items: [
      // Weapons
      { id: "silvered_dagger", name: "Silvered Dagger", category: "weapon", weaponType: "simple_melee", damage: "1d4", damageType: "piercing", properties: ["finesse", "light", "thrown (range 20/60)", "silvered"], weight: 1, value: 102, rarity: "common", description: "A dagger plated with silver, effective against lycanthropes and some undead." },
      { id: "mace", name: "Mace", category: "weapon", weaponType: "simple_melee", damage: "1d6", damageType: "bludgeoning", properties: [], weight: 4, value: 5, rarity: "common" },
      { id: "heavy_crossbow", name: "Heavy Crossbow", category: "weapon", weaponType: "martial_ranged", damage: "1d10", damageType: "piercing", properties: ["ammunition (range 100/400)", "heavy", "loading", "two-handed"], weight: 18, value: 50, rarity: "common" },
      // Armor
      { id: "hide_armor", name: "Hide Armor", category: "armor", armorType: "medium", baseAC: 12, properties: [], weight: 12, value: 10, rarity: "common" },
      { id: "tattered_cloak", name: "Tattered Cloak", category: "armor", armorType: "light", baseAC: 10, acBonus: 0, properties: [], weight: 2, value: 0, rarity: "common", description: "A worn cloak that offers no protection but helps blend into the shadows." },
      // Consumables
      { id: "holy_water", name: "Holy Water (Flask)", category: "consumable", consumable: true, effects: ["DAMAGE[2d6|radiant]"], weight: 1, value: 25, rarity: "common", description: "As an action, you can splash the contents of this flask onto a creature within 5 feet of you or throw it up to 20 feet, shattering it on impact. Make a ranged attack against a target creature, treating the holy water as an improvised weapon. If the target is a fiend or undead, it takes 2d6 radiant damage." },
      { id: "blessed_oil", name: "Blessed Oil", category: "consumable", consumable: true, effects: ["Weapon becomes magical for 1 hour"], weight: 1, value: 100, rarity: "uncommon", description: "You can apply this oil to a weapon. For 1 hour, the weapon is considered magical for the purpose of overcoming resistance and immunity to nonmagical attacks." },
      { id: "purgative_tonic", name: "Purgative Tonic", category: "consumable", consumable: true, effects: ["Cures disease and poison"], weight: 0.5, value: 50, rarity: "common", description: "A bitter brew that cures any non-magical disease or poison affecting the drinker." },
      // Magic Items
      { id: "amulet_protection_undead", name: "Amulet of Protection from Undead", category: "magic_item", slot: "neck", effects: ["Undead have disadvantage on attacks against you"], requiresAttunement: true, weight: 1, value: 2000, rarity: "rare", description: "While wearing this amulet, undead creatures have disadvantage on attack rolls against you." },
      { id: "cursed_sword", name: "Cursed Sword of Vengeance", category: "weapon", weaponType: "martial_melee", damage: "1d8", versatileDamage: "1d10", damageType: "slashing", properties: ["versatile", "cursed"], effects: ["+1 to hit and damage", "Must attack enemies"], toHitBonus: 1, damageBonus: 1, weight: 3, value: 100, rarity: "uncommon", description: "You gain a +1 bonus to attack and damage rolls made with this magic weapon. Curse: This sword is cursed and possessed by a vengeful spirit. Becoming attuned to it extends the curse to you. As long as you remain cursed, you are unwilling to part with the sword, keeping it on your person at all times." },
      { id: "lantern_revealing", name: "Lantern of Revealing", category: "magic_item", slot: "wondrous", effects: ["Reveals invisible creatures"], requiresAttunement: false, weight: 2, value: 5000, rarity: "rare", description: "While lit, this hooded lantern burns for 6 hours on 1 pint of oil, shedding bright light in a 30-foot radius and dim light for an additional 30 feet. Invisible creatures and objects are visible as long as they are in the lantern's bright light." },
      // Gear
      { id: "wooden_stakes", name: "Wooden Stakes (3)", category: "gear", weight: 1, value: 0.1, rarity: "common", description: "Sharpened wooden stakes, useful for dealing with vampires." },
      { id: "sacred_symbol", name: "Sacred Symbol", category: "gear", weight: 1, value: 5, rarity: "common", description: "A holy symbol dedicated to a god of light or life." },
      { id: "burial_shroud", name: "Burial Shroud", category: "gear", weight: 3, value: 1, rarity: "common", description: "A linen cloth used to wrap the dead." }
    ]
  },
  {
    id: "template_wilderness",
    name: "Wilderness Survival",
    settingType: "wilderness",
    briefDescription: "Monster-filled frontier where harsh nature and survival are constant challenges.",
    fullDescription:
      "Beyond the Last Wall lies the Untamed Wilds - an endless expanse of primordial forest, savage mountains, and monster-haunted plains. Civilization is a distant memory. Out here, only the prepared survive the night.",
    tone: "Survival-focused with naturalistic danger",
    magicLevel: "low",
    techLevel: "primitive",
    startingLocation: "Outpost Seven, a palisaded settlement on the edge of the Untamed Wilds",
    coreIntent: [
      "Harsh but awe-inspiring: beauty and danger intertwined.",
      "Survival horror meets exploration without constant hopelessness.",
      "Emphasize survival elements: food, water, shelter, weather, navigation."
    ],
    worldOverview: [
      "Sparse outposts (like Outpost Seven) cling to the edge of an endless wild.",
      "Between havens: days of difficult travel through trackless forests, bogs, cliffs, tundra.",
      "Predators and monsters hunt, migrate, defend territory; nature is an active force."
    ],
    coreLocations: [
      "Outpost Seven: Palisaded settlement on the edge.",
      "The Untamed Wilds: Primordial forest and savage mountains.",
      "The Last Wall: The border of civilization."
    ],
    coreFactions: [
      "Rangers of the Wall: Protectors of the frontier.",
      "Druidic Circles: Guardians of the wild.",
      "Beast Clans: Intelligent monster tribes."
    ],
    monsters: [
      {
        id: "dire_wolf",
        name: "Dire Wolf",
        type: "Beast",
        cr: "1",
        ac: 14,
        hp: 37,
        hitDice: "5d10+10",
        stats: { str: 17, dex: 15, con: 15, int: 3, wis: 12, cha: 7 },
        actions: [
          { name: "Bite", desc: "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) piercing damage. If the target is a creature, it must succeed on a DC 13 Strength saving throw or be knocked prone." }
        ]
      },
      {
        id: "brown_bear",
        name: "Brown Bear",
        type: "Beast",
        cr: "1",
        ac: 11,
        hp: 34,
        hitDice: "4d10+12",
        stats: { str: 19, dex: 10, con: 16, int: 2, wis: 13, cha: 7 },
        actions: [
          { name: "Multiattack", desc: "The bear makes two attacks: one with its bite and one with its claws." },
          { name: "Bite", desc: "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 8 (1d8 + 4) piercing damage." },
          { name: "Claws", desc: "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 11 (2d6 + 4) slashing damage." }
        ]
      },
      {
        id: "giant_boar",
        name: "Giant Boar",
        type: "Beast",
        cr: "2",
        ac: 12,
        hp: 42,
        hitDice: "5d10+15",
        stats: { str: 17, dex: 10, con: 16, int: 2, wis: 7, cha: 5 },
        actions: [
          { name: "Tusk", desc: "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) slashing damage. If the target is a creature, it must succeed on a DC 13 Strength saving throw or be knocked prone." },
          { name: "Charge", desc: "If the boar moves at least 20 feet straight toward a target and then hits it with a tusk attack on the same turn, the target takes an extra 7 (2d6) slashing damage." }
        ]
      },
      {
        id: "owlbear",
        name: "Owlbear",
        type: "Monstrosity",
        cr: "3",
        ac: 13,
        hp: 59,
        hitDice: "7d10+21",
        stats: { str: 20, dex: 12, con: 17, int: 3, wis: 12, cha: 7 },
        actions: [
          { name: "Multiattack", desc: "The owlbear makes two attacks: one with its beak and one with its claws." },
          { name: "Beak", desc: "Melee Weapon Attack: +7 to hit, reach 5 ft., one creature. Hit: 10 (1d10 + 5) piercing damage." },
          { name: "Claws", desc: "Melee Weapon Attack: +7 to hit, reach 5 ft., one creature. Hit: 14 (2d8 + 5) slashing damage." }
        ]
      },
      {
        id: "treant",
        name: "Treant",
        type: "Plant",
        cr: "9",
        ac: 16,
        hp: 138,
        hitDice: "12d12+60",
        stats: { str: 23, dex: 8, con: 21, int: 12, wis: 16, cha: 12 },
        actions: [
          { name: "Multiattack", desc: "The treant makes two slam attacks." },
          { name: "Slam", desc: "Melee Weapon Attack: +10 to hit, reach 5 ft., one target. Hit: 16 (3d6 + 6) bludgeoning damage." },
          { name: "Rock", desc: "Ranged Weapon Attack: +10 to hit, range 60/180 ft., one target. Hit: 28 (4d10 + 6) bludgeoning damage." }
        ]
      },
      {
        id: "winter_wolf",
        name: "Winter Wolf",
        type: "Monstrosity",
        cr: "3",
        ac: 13,
        hp: 75,
        hitDice: "10d10+20",
        stats: { str: 18, dex: 13, con: 14, int: 7, wis: 12, cha: 8 },
        actions: [
          { name: "Bite", desc: "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 11 (2d6 + 4) piercing damage plus 4 (1d8) cold damage. If the target is a creature, it must succeed on a DC 14 Strength saving throw or be knocked prone." },
          { name: "Cold Breath (Recharge 5-6)", desc: "The wolf exhales a blast of freezing wind in a 15-foot cone. Each creature in that area must make a DC 12 Dexterity saving throw, taking 18 (4d8) cold damage on a failed save, or half as much damage on a successful one." }
        ]
      }
    ],
    items: [
      // Weapons
      { id: "shortbow", name: "Shortbow", category: "weapon", weaponType: "simple_ranged", damage: "1d6", damageType: "piercing", properties: ["ammunition (range 80/320)", "two-handed"], weight: 2, value: 25, rarity: "common" },
      { id: "longbow", name: "Longbow", category: "weapon", weaponType: "martial_ranged", damage: "1d8", damageType: "piercing", properties: ["ammunition (range 150/600)", "heavy", "two-handed"], weight: 2, value: 50, rarity: "common" },
      { id: "spear", name: "Spear", category: "weapon", weaponType: "simple_melee", damage: "1d6", versatileDamage: "1d8", damageType: "piercing", properties: ["thrown (range 20/60)", "versatile"], weight: 3, value: 1, rarity: "common" },
      { id: "handaxe", name: "Handaxe", category: "weapon", weaponType: "simple_melee", damage: "1d6", damageType: "slashing", properties: ["light", "thrown (range 20/60)"], weight: 2, value: 5, rarity: "common" },
      // Armor
      { id: "hide_armor", name: "Hide Armor", category: "armor", armorType: "medium", baseAC: 12, properties: [], weight: 12, value: 10, rarity: "common" },
      { id: "fur_cloak", name: "Fur Cloak", category: "armor", armorType: "light", baseAC: 10, acBonus: 0, properties: [], weight: 3, value: 5, rarity: "common", description: "A thick fur cloak that protects against extreme cold." },
      // Consumables
      { id: "antitoxin", name: "Antitoxin", category: "consumable", consumable: true, effects: ["STATUS_ADD[Advantage on Poison Saves]"], weight: 0, value: 50, rarity: "common", description: "Advantage on saving throws against poison for 1 hour." },
      { id: "goodberry_pouch", name: "Pouch of Goodberries", category: "consumable", consumable: true, effects: ["HEAL[player|1]"], weight: 0, value: 10, rarity: "uncommon", description: "Contains 10 berries. Eating a berry restores 1 hit point and provides enough nourishment to sustain a creature for one day." },
      { id: "herbal_remedy", name: "Herbal Remedy", category: "consumable", consumable: true, effects: ["HEAL[player|1d4+1]"], weight: 0, value: 5, rarity: "common", description: "A poultice made from medicinal herbs. Heals 1d4+1 hit points." },
      { id: "trail_rations", name: "Trail Rations (10 days)", category: "consumable", consumable: true, effects: [], weight: 10, value: 5, rarity: "common", description: "Dried fruit, jerky, and hardtack." },
      // Magic Items
      { id: "boots_winterlands", name: "Boots of the Winterlands", category: "magic_item", slot: "feet", effects: ["Resistance to cold", "Ignore difficult terrain (ice/snow)"], requiresAttunement: true, weight: 1, value: 2500, rarity: "uncommon", description: "These furred boots protect you from the cold. You have resistance to cold damage, and you ignore difficult terrain created by ice or snow. You can tolerate temperatures as low as -50 degrees Fahrenheit." },
      { id: "cloak_elvenkind", name: "Cloak of Elvenkind", category: "magic_item", slot: "cloak", effects: ["Advantage on Stealth"], requiresAttunement: true, weight: 1, value: 2500, rarity: "uncommon", description: "While you wear this cloak with its hood up, Wisdom (Perception) checks made to see you have disadvantage, and you have advantage on Dexterity (Stealth) checks made to hide." },
      { id: "hunters_bow", name: "Hunter's Bow (+1)", category: "weapon", weaponType: "martial_ranged", damage: "1d8", damageType: "piercing", properties: ["ammunition (range 150/600)", "heavy", "two-handed"], effects: ["+1 to hit and damage"], toHitBonus: 1, damageBonus: 1, weight: 2, value: 1000, rarity: "uncommon", description: "A finely crafted bow that grants a +1 bonus to attack and damage rolls." },
      // Gear
      { id: "survival_kit", name: "Survival Kit", category: "gear", weight: 5, value: 10, rarity: "common", description: "Includes a knife, small saw, fishhooks, line, and flint and steel." },
      { id: "trap_kit", name: "Hunting Trap", category: "gear", weight: 25, value: 5, rarity: "common", description: "When you use your action to set it, this trap forms a saw-toothed steel ring that snaps shut when a creature steps on a pressure plate in the center." },
      { id: "waterskin", name: "Waterskin", category: "gear", weight: 5, value: 0.2, rarity: "common", description: "A container that can hold 4 pints of liquid." },
      { id: "bedroll", name: "Bedroll", category: "gear", weight: 7, value: 1, rarity: "common", description: "A sleeping bag for sleeping outdoors." }
    ]
  },
  {
    id: "template_planar",
    name: "Planar Adventure",
    settingType: "planar",
    briefDescription: "Travel between dimensions and planes with reality-bending adventures.",
    fullDescription:
      "The Material Plane is just the beginning. Beyond the veil lie infinite realities - the burning wastes of the Fire Plane, the crystalline cities of the Astral Sea, the nightmare realm of the Shadowfell. You are a planeswalker, and all of existence is your playground.",
    tone: "Surreal and fantastical with reality-bending elements",
    magicLevel: "high",
    techLevel: "mixed",
    startingLocation: "Sigil, the City of Doors - a planar hub where portals to all realities converge",
    coreIntent: [
      "High fantasy meets weird fiction; wondrous, dangerous, occasionally surreal.",
      "Avoid incoherent randomness: each scene should follow from the established rules of its plane.",
      "Each plane must feel mechanically and thematically distinct."
    ],
    worldOverview: [
      "The Material Plane is only one stop; countless planes exist with distinct laws, cultures, and dangers.",
      "Examples: Feywild, Shadowfell, Elemental Planes, Astral Sea, Mechanus, Far Realm.",
      "Portals, rituals, relics, and cosmic events enable movement."
    ],
    coreLocations: [
      "Sigil: The City of Doors, a planar hub.",
      "The Astral Sea: Crystalline cities and thought-space.",
      "Elemental Planes: Pure manifestations of fire, water, earth, air."
    ],
    coreFactions: [
      "Planar Trade Consortium: Interdimensional merchants.",
      "The Keepers of the Veil: Monitoring planar breaches.",
      "Githyanki Raiders: Astral pirates."
    ],
    monsters: [
      {
        id: "astral_drifter",
        name: "Astral Drifter",
        type: "Celestial",
        cr: "1/2",
        ac: 13,
        hp: 22,
        hitDice: "5d8",
        stats: { str: 12, dex: 16, con: 10, int: 14, wis: 14, cha: 11 },
        actions: [
          { name: "Psychic Blade", desc: "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) psychic damage." }
        ]
      },
      {
        id: "fire_mephit",
        name: "Fire Mephit",
        type: "Elemental",
        cr: "1/2",
        ac: 11,
        hp: 22,
        hitDice: "5d6+5",
        stats: { str: 7, dex: 13, con: 12, int: 9, wis: 11, cha: 12 },
        actions: [
          { name: "Claws", desc: "Melee Weapon Attack: +3 to hit, reach 5 ft., one creature. Hit: 3 (1d4 + 1) slashing damage plus 2 (1d4) fire damage." },
          { name: "Fire Breath (Recharge 6)", desc: "The mephit exhales a 15-foot cone of fire. Each creature in that area must make a DC 10 Dexterity saving throw, taking 7 (2d6) fire damage on a failed save, or half as much damage on a successful one." }
        ]
      },
      {
        id: "ice_mephit",
        name: "Ice Mephit",
        type: "Elemental",
        cr: "1/2",
        ac: 11,
        hp: 21,
        hitDice: "6d6",
        stats: { str: 7, dex: 13, con: 10, int: 9, wis: 11, cha: 12 },
        actions: [
          { name: "Claws", desc: "Melee Weapon Attack: +3 to hit, reach 5 ft., one creature. Hit: 3 (1d4 + 1) slashing damage plus 2 (1d4) cold damage." },
          { name: "Frost Breath (Recharge 6)", desc: "The mephit exhales a 15-foot cone of cold air. Each creature in that area must make a DC 10 Dexterity saving throw, taking 7 (2d6) cold damage on a failed save, or half as much damage on a successful one." }
        ]
      },
      {
        id: "githyanki_warrior",
        name: "Githyanki Warrior",
        type: "Humanoid (Gith)",
        cr: "3",
        ac: 17,
        hp: 49,
        hitDice: "9d8+9",
        stats: { str: 15, dex: 14, con: 12, int: 13, wis: 13, cha: 10 },
        actions: [
          { name: "Multiattack", desc: "The githyanki makes two greatsword attacks." },
          { name: "Greatsword", desc: "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 9 (2d6 + 2) slashing damage plus 7 (2d6) psychic damage." }
        ]
      },
      {
        id: "modron",
        name: "Modron (Quadrone)",
        type: "Construct",
        cr: "1",
        ac: 16,
        hp: 22,
        hitDice: "4d8+4",
        stats: { str: 12, dex: 14, con: 12, int: 10, wis: 10, cha: 11 },
        actions: [
          { name: "Multiattack", desc: "The modron makes two shortbow attacks." },
          { name: "Shortbow", desc: "Ranged Weapon Attack: +4 to hit, range 80/320 ft., one target. Hit: 5 (1d6 + 2) piercing damage." },
          { name: "Javelin", desc: "Melee or Ranged Weapon Attack: +3 to hit, reach 5 ft. or range 30/120 ft., one target. Hit: 4 (1d6 + 1) piercing damage." }
        ]
      },
      {
        id: "shadow_fiend",
        name: "Shadow Fiend",
        type: "Fiend",
        cr: "4",
        ac: 14,
        hp: 66,
        hitDice: "12d8+12",
        stats: { str: 14, dex: 18, con: 12, int: 14, wis: 13, cha: 14 },
        actions: [
          { name: "Multiattack", desc: "The fiend makes three attacks: one with its bite and two with its claws." },
          { name: "Bite", desc: "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 8 (1d8 + 4) piercing damage." },
          { name: "Claw", desc: "Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 7 (1d6 + 4) slashing damage." }
        ]
      },
      {
        id: "planar_scholar",
        name: "Planar Scholar",
        type: "Humanoid (Any Race)",
        cr: "1/2",
        ac: 11,
        hp: 27,
        hitDice: "5d8+5",
        stats: { str: 9, dex: 12, con: 12, int: 18, wis: 14, cha: 11 },
        actions: [
          { name: "Arcane Bolt", desc: "Ranged Spell Attack: +6 to hit, range 120 ft., one target. Hit: 11 (2d10) force damage." },
          { name: "Dagger", desc: "Melee or Ranged Weapon Attack: +3 to hit, reach 5 ft. or range 20/60 ft., one target. Hit: 3 (1d4 + 1) piercing damage." }
        ]
      }
    ],
    items: [
      // Weapons
      { id: "weapon_plus_one", name: "+1 Weapon", category: "weapon", weaponType: "any", effects: ["+1 to hit", "+1 damage"], toHitBonus: 1, damageBonus: 1, weight: 0, value: 500, rarity: "uncommon", description: "You have a +1 bonus to attack and damage rolls made with this magic weapon." },
      { id: "phasing_blade", name: "Phasing Blade", category: "weapon", weaponType: "martial_melee", damage: "1d8", versatileDamage: "1d10", damageType: "force", properties: ["versatile"], effects: ["Ignores nonmagical armor"], weight: 3, value: 2000, rarity: "rare", description: "This blade seems to flicker in and out of reality. It deals force damage instead of slashing damage and ignores AC bonuses from nonmagical armor and shields." },
      { id: "elemental_staff", name: "Staff of the Elements", category: "weapon", weaponType: "simple_melee", damage: "1d6", versatileDamage: "1d8", damageType: "bludgeoning", properties: ["versatile"], effects: ["Cast elemental cantrips"], requiresAttunement: true, weight: 4, value: 1500, rarity: "uncommon", description: "This staff has 3 charges. You can expend 1 charge to cast Burning Hands, Thunderwave, or Fog Cloud (DC 13)." },
      // Armor
      { id: "mage_armor_robes", name: "Robes of Mage Armor", category: "armor", armorType: "light", baseAC: 13, properties: [], weight: 3, value: 500, rarity: "uncommon", description: "These robes are enchanted with a permanent Mage Armor spell." },
      { id: "astral_plate", name: "Astral Plate", category: "armor", armorType: "heavy", baseAC: 18, properties: ["stealth_disadvantage"], strengthRequired: 15, weight: 65, value: 3000, rarity: "rare", description: "Plate armor forged from astral silver. It grants resistance to psychic damage." },
      // Consumables
      { id: "potion_plane_shift", name: "Potion of Plane Shift (Random)", category: "consumable", consumable: true, effects: ["Teleport to random plane"], weight: 0.5, value: 500, rarity: "rare", description: "Drinking this potion transports you to a random plane of existence. Use with caution!" },
      { id: "elemental_essence", name: "Elemental Essence", category: "consumable", consumable: true, effects: ["Resistance to element for 1 hour"], weight: 0.5, value: 100, rarity: "common", description: "When consumed, you gain resistance to one damage type (fire, cold, lightning, or acid) for 1 hour." },
      { id: "scroll_dimension_door", name: "Scroll of Dimension Door", category: "consumable", consumable: true, effects: ["Cast Dimension Door"], spellLevel: 4, weight: 0, value: 500, rarity: "uncommon", description: "A spell scroll containing the Dimension Door spell." },
      // Magic Items
      { id: "planar_compass", name: "Planar Compass", category: "magic_item", slot: "wondrous", effects: ["Points to portals"], requiresAttunement: true, weight: 1, value: 1000, rarity: "uncommon", description: "This compass points to the nearest portal or planar breach within 1 mile." },
      { id: "ring_of_protection", name: "Ring of Protection", category: "magic_item", slot: "ring", effects: ["+1 AC", "+1 to all saves"], acBonus: 1, saveBonus: 1, requiresAttunement: true, weight: 0, value: 3500, rarity: "rare", description: "You gain a +1 bonus to AC and saving throws while wearing this ring." },
      { id: "amulet_planes", name: "Amulet of the Planes", category: "magic_item", slot: "neck", effects: ["Cast Plane Shift (DC 15 Int check)"], requiresAttunement: true, weight: 1, value: 20000, rarity: "very_rare", description: "While wearing this amulet, you can use an action to name a location that you are familiar with on another plane of existence. Then make a DC 15 Intelligence check. On a successful check, you cast the plane shift spell. On a failure, you and each creature and object within 15 feet of you travel to a random destination." },
      { id: "portable_hole", name: "Portable Hole", category: "magic_item", slot: "wondrous", effects: ["Extra dimensional storage"], weight: 0, value: 4000, rarity: "rare", description: "This fine black cloth, soft as silk, is folded up to the dimensions of a handkerchief. It unfolds into a circular sheet 6 feet in diameter. You can use an action to unfold a portable hole and place it on or against a solid surface, where it creates an extradimensional hole 10 feet deep." },
      // Gear
      { id: "astral_chalk", name: "Astral Chalk", category: "gear", weight: 0, value: 10, rarity: "common", description: "Chalk that leaves glowing marks visible on the Ethereal Plane." },
      { id: "planar_map", name: "Planar Map", category: "gear", weight: 0, value: 50, rarity: "common", description: "A complex map showing known portals and planar conjunctions." },
      { id: "tuning_fork", name: "Tuning Fork", category: "gear", weight: 1, value: 250, rarity: "common", description: "A metal fork attuned to a specific plane of existence, required for the Plane Shift spell." }
    ]
  },
]
