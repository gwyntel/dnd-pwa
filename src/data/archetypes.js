/**
 * Beginner-friendly character templates for the Characters flow.
 * Extracted from characters.js to keep the view lean.
 */

export const BEGINNER_TEMPLATES = [
  {
    id: "template_knight",
    name: "Brave Knight",
    tagline: "Master of sword and shield, protector of the innocent",
    class: "Fighter",
    race: "Human",
    level: 1,
    difficulty: "beginner",
    role: "Tank / Damage",
    bestFor: ["Combat", "Beginners", "Protecting Others"],
    icon: "⚔️",
    stats: { strength: 16, dexterity: 12, constitution: 14, intelligence: 8, wisdom: 10, charisma: 10 },
    maxHP: 12,
    armorClass: 16,
    skills: ["Athletics", "Intimidation"],
    inventory: [
      { item: "Longsword", equipped: true },
      { item: "Shield", equipped: true },
      { item: "Chain Mail", equipped: true },
      { item: "Adventurer's Pack", equipped: false }
    ],
    backstory: "You trained in the city guard and now seek adventure to prove your worth as a true warrior.",
    playstyleDesc: "Get close, draw aggro, and protect allies. Straightforward melee tank and damage dealer.",
    keyAbilities: ["Second Wind - Heal yourself once per rest", "Fighting Style - Defense or Dueling"],
    hitDice: { current: 1, max: 1, dieType: 'd10' },
    classResources: [
      { name: 'Second Wind', current: 1, max: 1, recoversOn: 'short' }
    ]
  },
  {
    id: "template_rogue",
    name: "Cunning Rogue",
    tagline: "Sneaky, clever, and deadly when unseen",
    class: "Rogue",
    race: "Halfling",
    level: 1,
    difficulty: "beginner",
    role: "Skirmisher / Skill Monkey",
    bestFor: ["Stealth", "Traps", "Clever Play"],
    icon: "🗡️",
    stats: { strength: 8, dexterity: 16, constitution: 12, intelligence: 12, wisdom: 10, charisma: 14 },
    maxHP: 9,
    armorClass: 14,
    skills: ["Stealth", "Sleight of Hand", "Perception", "Deception"],
    inventory: [
      { item: "Shortsword", equipped: true },
      { item: "Dagger", equipped: true },
      { item: "Leather Armor", equipped: true },
      { item: "Thieves' Tools", equipped: false }
    ],
    backstory: "You grew up on the streets, using quick wits and quicker hands to survive. Now you sell your talents to the highest bidder.",
    playstyleDesc: "Flank enemies, use Sneak Attack, and handle traps and locks.",
    keyAbilities: ["Sneak Attack", "Thieves' Cant"],
    hitDice: { current: 1, max: 1, dieType: 'd8' }
  },
  {
    id: "template_cleric",
    name: "Wise Cleric",
    tagline: "Shield of faith and steel, guardian of allies",
    class: "Cleric",
    race: "Dwarf",
    level: 1,
    difficulty: "beginner",
    role: "Support / Off-Tank",
    bestFor: ["Healing", "Team Support", "New Players"],
    icon: "⛨",
    stats: { strength: 12, dexterity: 10, constitution: 14, intelligence: 8, wisdom: 16, charisma: 10 },
    maxHP: 10,
    armorClass: 18,
    skills: ["Medicine", "Insight", "Religion"],
    inventory: [
      { item: "Mace", equipped: true },
      { item: "Shield", equipped: true },
      { item: "Chain Mail", equipped: true },
      { item: "Holy Symbol", equipped: false },
      { item: "Healer's Kit", equipped: false }
    ],
    backstory: "You served faithfully at your temple, called now to bring your deity's light to dark places.",
    playstyleDesc: "Heal allies, bless the party, and hold the line in armor.",
    keyAbilities: ["Spellcasting", "Channel Divinity / Turn Undead"],
    hitDice: { current: 1, max: 1, dieType: 'd8' },
    spellSlots: {
      1: { current: 2, max: 2 },
      2: { current: 0, max: 0 },
      3: { current: 0, max: 0 },
      4: { current: 0, max: 0 },
      5: { current: 0, max: 0 },
      6: { current: 0, max: 0 },
      7: { current: 0, max: 0 },
      8: { current: 0, max: 0 },
      9: { current: 0, max: 0 }
    },
    preparedSpells: [
      { id: 'cure-wounds', level: 1, name: 'Cure Wounds' },
      { id: 'bless', level: 1, name: 'Bless' },
      { id: 'sacred-flame', level: 0, name: 'Sacred Flame' },
      { id: 'thaumaturgy', level: 0, name: 'Thaumaturgy' }
    ],
    spellcasting: {
      ability: 'wis',
      spellSaveDC: 13,
      spellAttackBonus: 5,
      isPreparationCaster: true,
      cantripsKnown: 3
    }
  },
  {
    id: "template_wizard",
    name: "Mysterious Wizard",
    tagline: "Scholar of the arcane, master of reality's threads",
    class: "Wizard",
    race: "High Elf",
    level: 1,
    difficulty: "intermediate",
    role: "Controller / Blaster",
    bestFor: ["Tactical Play", "Creative Problem Solving"],
    icon: "📖",
    stats: { strength: 8, dexterity: 14, constitution: 12, intelligence: 16, wisdom: 12, charisma: 8 },
    maxHP: 7,
    armorClass: 12,
    skills: ["Arcana", "Investigation", "History"],
    inventory: [
      { item: "Quarterstaff", equipped: true },
      { item: "Spellbook", equipped: false },
      { item: "Component Pouch", equipped: false },
      { item: "Scholar's Pack", equipped: false }
    ],
    backstory: "You delved too deep into forbidden tomes, now driven to test your theories on the open road.",
    playstyleDesc: "Fragile but powerful caster. Control the battlefield and solve problems with spells.",
    keyAbilities: ["Spellcasting", "Arcane Recovery"],
    hitDice: { current: 1, max: 1, dieType: 'd6' },
    spellSlots: {
      1: { current: 2, max: 2 },
      2: { current: 0, max: 0 },
      3: { current: 0, max: 0 },
      4: { current: 0, max: 0 },
      5: { current: 0, max: 0 },
      6: { current: 0, max: 0 },
      7: { current: 0, max: 0 },
      8: { current: 0, max: 0 },
      9: { current: 0, max: 0 }
    },
    knownSpells: [
      { id: 'fire-bolt', level: 0, name: 'Fire Bolt' },
      { id: 'mage-hand', level: 0, name: 'Mage Hand' },
      { id: 'prestidigitation', level: 0, name: 'Prestidigitation' },
      { id: 'magic-missile', level: 1, name: 'Magic Missile' },
      { id: 'shield', level: 1, name: 'Shield' },
      { id: 'detect-magic', level: 1, name: 'Detect Magic' },
      { id: 'sleep', level: 1, name: 'Sleep' }
    ],
    preparedSpells: [
      { id: 'magic-missile', level: 1, name: 'Magic Missile' },
      { id: 'shield', level: 1, name: 'Shield' },
      { id: 'sleep', level: 1, name: 'Sleep' }
    ],
    spellcasting: {
      ability: 'int',
      spellSaveDC: 13,
      spellAttackBonus: 5,
      isPreparationCaster: true,
      cantripsKnown: 3
    },
    classResources: [
      { name: 'Arcane Recovery', current: 1, max: 1, recoversOn: 'long' }
    ]
  },
  {
    id: "template_ranger",
    name: "Wild Ranger",
    tagline: "Tracker, hunter, and master of the wilds",
    class: "Ranger",
    race: "Wood Elf",
    level: 1,
    difficulty: "intermediate",
    role: "Ranged / Scout",
    bestFor: ["Exploration", "Archery", "Nature Lovers"],
    icon: "🏹",
    stats: { strength: 12, dexterity: 16, constitution: 13, intelligence: 10, wisdom: 14, charisma: 8 },
    maxHP: 11,
    armorClass: 15,
    skills: ["Survival", "Nature", "Stealth", "Animal Handling"],
    inventory: [
      { item: "Longbow", equipped: true },
      { item: "Shortsword", equipped: true },
      { item: "Leather Armor", equipped: true },
      { item: "Explorer's Pack", equipped: false }
    ],
    backstory: "You have walked the deep forests since childhood, guiding travelers and hunting those who would harm the wild.",
    playstyleDesc: "Stay at range, support the party with scouting and tracking.",
    keyAbilities: ["Favored Enemy (or equivalent)", "Natural Explorer"]
  },
  {
    id: "template_bard",
    name: "Charming Bard",
    tagline: "Silver tongue, sharp wit, and inspiring song",
    class: "Bard",
    race: "Half-Elf",
    level: 1,
    difficulty: "intermediate",
    role: "Support / Face",
    bestFor: ["Roleplay", "Buffing Allies", "Social Encounters"],
    icon: "🎵",
    stats: { strength: 8, dexterity: 14, constitution: 12, intelligence: 10, wisdom: 10, charisma: 16 },
    maxHP: 9,
    armorClass: 14,
    skills: ["Persuasion", "Performance", "Deception", "Insight"],
    inventory: [
      { item: "Rapier", equipped: true },
      { item: "Lute", equipped: false },
      { item: "Leather Armor", equipped: true },
      { item: "Diplomat's Pack", equipped: false }
    ],
    backstory: "You left home to chase stories, fame, and forbidden verses—your songs hide half-truths and rumors.",
    playstyleDesc: "Control conversations, inspire allies, and provide utility.",
    keyAbilities: ["Bardic Inspiration", "Jack of All Trades"]
  },
  {
    id: "template_barbarian",
    name: "Tough Barbarian",
    tagline: "Raging warrior who refuses to fall",
    class: "Barbarian",
    race: "Half-Orc",
    level: 1,
    difficulty: "beginner",
    role: "Frontline / Damage",
    bestFor: ["Maximum Simplicity", "Hit Things Hard"],
    icon: "🪓",
    stats: { strength: 16, dexterity: 12, constitution: 16, intelligence: 8, wisdom: 10, charisma: 8 },
    maxHP: 15,
    armorClass: 14,
    skills: ["Athletics", "Intimidation", "Survival"],
    inventory: [
      { item: "Greataxe", equipped: true },
      { item: "Javelins", equipped: false },
      { item: "Hide Armor", equipped: true },
      { item: "Explorer's Pack", equipped: false }
    ],
    backstory: "You proved your might in brutal tribal trials, now seeking greater foes to test your rage.",
    playstyleDesc: "Point at enemy. Rage. Run forward. Hit.",
    keyAbilities: ["Rage", "Unarmored Defense"],
    hitDice: { current: 1, max: 1, dieType: 'd12' },
    classResources: [
      { name: 'Rage', current: 2, max: 2, recoversOn: 'long' }
    ]
  }
]
