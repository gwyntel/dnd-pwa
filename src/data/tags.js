/**
 * Tag Reference - Compressed game tag documentation
 * Used to minimize token usage in prompts while maintaining functionality
 */

export const DAMAGE_TYPES = [
  "acid", "bludgeoning", "cold", "fire", "force",
  "lightning", "necrotic", "piercing", "poison",
  "psychic", "radiant", "slashing", "thunder"
];

export const TAG_REFERENCE = {
  LOCATION: {
    pattern: "LOCATION[location_name]",
    examples: [
      "You enter the LOCATION[Tavern]",
      "Travel to LOCATION[Dark Forest Path]"
    ],
    required: true,
    note: "Emit for all location changes. Fast travel only to visited locations."
  },
  ROLL: {
    pattern: "ROLL[dice|type|DC] or ROLL[skill|name|DC] or ROLL[save|ability|DC] or ROLL[attack|weapon|AC] or ROLL[death]",
    examples: [
      "ROLL[skill|perception|15]",
      "ROLL[save|dex|14]",
      "ROLL[attack|longsword|13]",
      "ROLL[death]"
    ],
    required: true,
    note: "Semantic forms preferred. Add |advantage or |disadvantage as 4th parameter."
  },
  COMBAT_START: {
    pattern: "COMBAT_START[description]",
    examples: [
      "COMBAT_START[Two goblins leap from shadows!]",
      "COMBAT_START[Dire wolf attacks!]"
    ],
    required: true,
    note: "Auto-rolls initiative. Narrate enemy action if they win initiative, else wait for player."
  },
  COMBAT_CONTINUE: {
    pattern: "COMBAT_CONTINUE",
    examples: ["The goblin readies another attack. COMBAT_CONTINUE"],
    required: true,
    note: "MUST emit at end of EVERY combat message while combat ongoing. Omit only when combat ends."
  },
  COMBAT_END: {
    pattern: "COMBAT_END[outcome]",
    examples: ["COMBAT_END[Victory! The goblins flee.]"],
    required: false,
    note: "Explicit combat closure. Alternative: omit COMBAT_CONTINUE."
  },
  DAMAGE: {
    pattern: "DAMAGE[target|amount|type]",
    examples: [
      "Goblin arrow hits! DAMAGE[player|4|piercing]",
      "Fire burns you. DAMAGE[player|8|fire]",
      "Generic damage. DAMAGE[player|5]"
    ],
    required: true,
    note: "Type is optional but recommended. Valid types: acid, bludgeoning, cold, fire, force, lightning, necrotic, piercing, poison, psychic, radiant, slashing, thunder."
  },
  TEMP_HP: {
    pattern: "TEMP_HP[target|amount]",
    examples: [
      "Ancient ward activates. TEMP_HP[player|10]",
      "Aid spell grants vigor. TEMP_HP[player|5]"
    ],
    required: false,
    note: "Temporary HP doesn't stack. Use higher value if target already has temp HP."
  },
  APPLY_RESISTANCE: {
    pattern: "APPLY_RESISTANCE[target|type]",
    examples: [
      "Fire resistance granted. APPLY_RESISTANCE[player|fire]",
      "Spell protects from cold. APPLY_RESISTANCE[player|cold]"
    ],
    required: false
  },
  REMOVE_RESISTANCE: {
    pattern: "REMOVE_RESISTANCE[target|type]",
    examples: [
      "Resistance fades. REMOVE_RESISTANCE[player|fire]"
    ],
    required: false
  },
  APPLY_IMMUNITY: {
    pattern: "APPLY_IMMUNITY[target|type]",
    examples: [
      "Poison immunity granted. APPLY_IMMUNITY[player|poison]"
    ],
    required: false
  },
  REMOVE_IMMUNITY: {
    pattern: "REMOVE_IMMUNITY[target|type]",
    examples: [
      "Immunity fades. REMOVE_IMMUNITY[player|poison]"
    ],
    required: false
  },
  APPLY_VULNERABILITY: {
    pattern: "APPLY_VULNERABILITY[target|type]",
    examples: [
      "Curse makes you vulnerable to fire. APPLY_VULNERABILITY[player|fire]"
    ],
    required: false
  },
  REMOVE_VULNERABILITY: {
    pattern: "REMOVE_VULNERABILITY[target|type]",
    examples: [
      "Curse lifted. REMOVE_VULNERABILITY[player|fire]"
    ],
    required: false
  },
  HEAL: {
    pattern: "HEAL[target|amount]",
    examples: [
      "You drink potion. HEAL[player|10]",
      "Cleric heals you. HEAL[player|15]"
    ],
    required: true
  },
  INVENTORY_ADD: {
    pattern: "INVENTORY_ADD[Item Name|quantity]",
    examples: [
      "You find a sword. INVENTORY_ADD[Sword|1]",
      "She gives you potions. INVENTORY_ADD[Healing Potion|2]",
      "You craft arrows. INVENTORY_ADD[Arrows|10]"
    ],
    required: true,
    note: "Use for ALL gains: finding, receiving, buying, crafting, conjuring."
  },
  INVENTORY_REMOVE: {
    pattern: "INVENTORY_REMOVE[Item Name|quantity]",
    examples: [
      "You drink potion. INVENTORY_REMOVE[Healing Potion|1]",
      "Spell consumes diamond. INVENTORY_REMOVE[Diamond|1]",
      "You sell sword. INVENTORY_REMOVE[Rusty Longsword|1]"
    ],
    required: true,
    note: "Use for ALL losses: consuming, giving, selling, destroying. Critical for consumables."
  },
  INVENTORY_EQUIP: {
    pattern: "INVENTORY_EQUIP[Item Name]",
    examples: [
      "You draw blade. INVENTORY_EQUIP[Longsword]",
      "You don armor. INVENTORY_EQUIP[Chain Mail]"
    ],
    required: true
  },
  INVENTORY_UNEQUIP: {
    pattern: "INVENTORY_UNEQUIP[Item Name]",
    examples: [
      "You sheathe weapon. INVENTORY_UNEQUIP[Longsword]",
      "You remove armor. INVENTORY_UNEQUIP[Chain Mail]"
    ],
    required: true
  },
  GOLD_CHANGE: {
    pattern: "GOLD_CHANGE[+/-amount]",
    examples: [
      "Merchant pays you. GOLD_CHANGE[50]",
      "You pay for room. GOLD_CHANGE[-15]",
      "You find coins. GOLD_CHANGE[25]"
    ],
    required: true,
    note: "Use for ALL gold changes: payments, rewards, costs, finding, theft."
  },
  STATUS_ADD: {
    pattern: "STATUS_ADD[Condition Name]",
    examples: [
      "Venom takes effect. STATUS_ADD[Poisoned]",
      "Divine blessing. STATUS_ADD[Blessed]",
      "Spell paralyzes. STATUS_ADD[Paralyzed]"
    ],
    required: true
  },
  STATUS_REMOVE: {
    pattern: "STATUS_REMOVE[Condition Name]",
    examples: [
      "Antidote works. STATUS_REMOVE[Poisoned]",
      "Blessing fades. STATUS_REMOVE[Blessed]"
    ],
    required: true
  },
  RELATIONSHIP: {
    pattern: "RELATIONSHIP[entity:+/-delta]",
    examples: [
      "Mayor nods approvingly. RELATIONSHIP[Mayor_Thorne:+2]",
      "Guild angered. RELATIONSHIP[Thieves_Guild:-5]",
      "Villagers grateful. RELATIONSHIP[Greenhollow_Village:+3]"
    ],
    required: false,
    note: "Track reputation with people, factions, locations. Positive=good, negative=hostile."
  },
  ACTION: {
    pattern: "ACTION[action_text]",
    examples: [
      "ACTION[Attack the goblin]",
      "ACTION[Search for traps]",
      "ACTION[Talk to merchant]"
    ],
    required: false,
    note: "3-5 contextual suggestions. Only in non-roll turns. Never after ROLL in same message."
  },
  CAST_SPELL: {
    pattern: "CAST_SPELL[spell_id|spell_name|level] or CAST_SPELL[spell_name|level]",
    examples: [
      "You cast shield! CAST_SPELL[shield|Shield|1]",
      "Wizard casts fireball. CAST_SPELL[Fireball|3]",
      "You invoke mage armor. CAST_SPELL[mage-armor|Mage Armor|1]"
    ],
    required: true,
    note: "Auto-consumes spell slot. Include spell_id for automatic effect application. Cantrips use level 0."
  },
  CONCENTRATION_START: {
    pattern: "CONCENTRATION_START[spell_name]",
    examples: ["CONCENTRATION_START[Bless]"],
    required: false,
    note: "Marks concentration spell. Auto-ends previous concentration."
  },
  CONCENTRATION_END: {
    pattern: "CONCENTRATION_END[spell_name]",
    examples: ["You lose focus. CONCENTRATION_END[Bless]"],
    required: false
  },
  SHORT_REST: {
    pattern: "SHORT_REST[duration_minutes]",
    examples: ["SHORT_REST[60]"],
    required: true,
    note: "1 hour rest. Recover hit dice, short rest resources."
  },
  LONG_REST: {
    pattern: "LONG_REST[duration_hours]",
    examples: ["LONG_REST[8]"],
    required: true,
    note: "8 hour rest. Full HP, all spell slots, all resources."
  },
  XP_GAIN: {
    pattern: "XP_GAIN[amount|reason]",
    examples: ["XP_GAIN[50|Defeating the Goblins]", "XP_GAIN[100|Reaching the Crystal Cave]"],
    required: true,
    note: "Award XP for combat victories or milestones."
  },

  USE_ITEM: {
    pattern: "USE_ITEM[item_name]",
    examples: [
      "You drink potion. USE_ITEM[Healing Potion]",
      "You read scroll. USE_ITEM[Scroll of Fireball]"
    ],
    required: true,
    note: "Consumes item and applies its effects."
  },

  LEARN_SPELL: {
    pattern: "LEARN_SPELL[spell_name]",
    examples: ["LEARN_SPELL[Fireball]", "LEARN_SPELL[Identify]"],
    required: false,
    note: "Grant a new known spell (e.g. from a scroll)."
  },

  LEVEL_UP: {
    pattern: "LEVEL_UP[level]",
    examples: ["LEVEL_UP[2]"],
    required: false,
    note: "System tag triggered when XP threshold is met."
  },

  ENEMY_SPAWN: {
    pattern: "ENEMY_SPAWN[templateId|nameOverride]",
    examples: ["ENEMY_SPAWN[goblin]", "ENEMY_SPAWN[orc|Orc Chieftain]"],
    required: false,
    note: "Spawns an enemy into the combat tracker."
  },
};


