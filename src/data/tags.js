/**
 * Tag Reference - Compressed game tag documentation
 * Used to minimize token usage in prompts while maintaining functionality
 */

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
    pattern: "DAMAGE[target|amount]",
    examples: [
      "Goblin arrow hits! DAMAGE[player|4]",
      "Fire burns you. DAMAGE[player|8]"
    ],
    required: true
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
    pattern: "CAST_SPELL[spell_name|level]",
    examples: [
      "You cast! CAST_SPELL[Magic Missile|1]",
      "Wizard casts CAST_SPELL[Fireball|3]"
    ],
    required: true,
    note: "Auto-consumes spell slot. Cantrips use level 0."
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
  HIT_DIE_ROLL: {
    pattern: "HIT_DIE_ROLL[count]",
    examples: ["HIT_DIE_ROLL[2]"],
    required: true,
    note: "Spend hit dice during short rest for healing."
  }
};

/**
 * Centralized Regex Patterns - Single Source of Truth
 * 
 * These patterns are used across:
 * - src/engine/TagProcessor.js (for UI rendering and badge creation)
 * - src/views/game.js (for game logic and state updates)
 * - src/utils/dice.js (for roll parsing)
 * 
 * IMPORTANT: When modifying tag formats, update these patterns only.
 * All code that parses tags imports from here to ensure consistency.
 */
export const REGEX = {
  // Location tags
  LOCATION: /LOCATION\[([^\]]+)\]/g,
  LOCATION_SINGLE: /LOCATION\[([^\]]+)\]/,

  // Combat tags
  COMBAT_START: /COMBAT_START\[([^\]]*)\]/g,
  COMBAT_START_SINGLE: /COMBAT_START\[([^\]]*)\]/,
  COMBAT_CONTINUE: /COMBAT_CONTINUE/g,
  COMBAT_END: /COMBAT_END\[([^\]]+)\]/g,
  COMBAT_END_SINGLE: /COMBAT_END\[([^\]]+)\]/,
  COMBAT_END_TEST: /COMBAT_END\[/,

  // Roll tags
  ROLL: /ROLL\[([^\]]+)\]/g,

  // HP modification tags
  DAMAGE: /DAMAGE\[(\w+)\|(\d+)\]/g,
  DAMAGE_SINGLE: /DAMAGE\[(\w+)\|(\d+)\]/,
  HEAL: /HEAL\[(\w+)\|(\d+)\]/g,
  HEAL_SINGLE: /HEAL\[(\w+)\|(\d+)\]/,

  // Inventory tags
  INVENTORY_ADD: /INVENTORY_ADD\[([^\]|]+)\|?(\d+)?\]/g,
  INVENTORY_REMOVE: /INVENTORY_REMOVE\[([^\]|]+)\|?(\d+)?\]/g,
  INVENTORY_EQUIP: /INVENTORY_EQUIP\[([^\]]+)\]/g,
  INVENTORY_UNEQUIP: /INVENTORY_UNEQUIP\[([^\]]+)\]/g,

  // Currency tags
  GOLD_CHANGE: /GOLD_CHANGE\[(-?\d+\.?\d*)\]/g,

  // Status effect tags
  STATUS_ADD: /STATUS_ADD\[([^\]]+)\]/g,
  STATUS_REMOVE: /STATUS_REMOVE\[([^\]]+)\]/g,

  // Relationship tags
  RELATIONSHIP: /RELATIONSHIP\[([^:]+):([+-]?\d+)\]/g,

  // Action suggestion tags
  ACTION: /ACTION\[([^\]]+)\]/g,
  ACTION_LINE: /^\s*ACTION\[[^\]]+\]\s*\n?/gm,

  // Spellcasting tags
  CAST_SPELL: /CAST_SPELL\[([^\]|]+)\|(\d+)\]/g,
  CONCENTRATION_START: /CONCENTRATION_START\[([^\]]+)\]/g,
  CONCENTRATION_END: /CONCENTRATION_END\[([^\]]+)\]/g,

  // Rest tags
  SHORT_REST: /SHORT_REST\[(\d+)\]/g,
  LONG_REST: /LONG_REST\[(\d+)\]/g,
  HIT_DIE_ROLL: /HIT_DIE_ROLL\[(\d+)\]/g,
  DEATH_SAVE: /DEATH_SAVE\[(\d+)\]/g,
};
