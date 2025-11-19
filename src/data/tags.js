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
    pattern: "ROLL[dice|type|DC] or ROLL[skill|name|DC] or ROLL[save|ability|DC] or ROLL[attack|weapon|AC]",
    examples: [
      "ROLL[skill|perception|15]",
      "ROLL[save|dex|14]",
      "ROLL[attack|longsword|13]",
      "ROLL[skill|stealth|15|advantage]"
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
  }
};
