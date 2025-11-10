/**
 * Icon and Emoji Utility
 * Provides consistent emoji/icon usage throughout the app
 */

export const Icons = {
  // Navigation
  HOME: "🏠",
  BACK: "←",
  CLOSE: "✕",
  MENU: "☰",

  // Characters & Creation
  CHARACTER: "🧙",
  CREATE: "✎",
  DUPLICATE: "📋",
  DELETE: "🗑️",
  TEMPLATE: "📄",

  // Combat & Gameplay
  COMBAT: "⚔️",
  SWORD: "🗡️",
  SHIELD: "🛡️",
  ARMOR: "🛡️",
  DAMAGE: "💔",
  HEAL: "💚",
  POTION: "🧪",
  BOOK: "📖",

  // Location & Navigation
  LOCATION: "📍",
  TOWN: "🏘️",
  DUNGEON: "🏚️",
  FOREST: "🌲",
  CAVE: "⛰️",
  CASTLE: "🏰",
  TAVERN: "🍺",
  SHRINE: "⛩️",

  // Items & Inventory
  INVENTORY: "🎒",
  ITEM: "📦",
  GOLD: "💰",
  WEAPON: "⚔️",
  LOOT: "✨",

  // Status & Conditions
  BUFF: "⬆️",
  DEBUFF: "⬇️",
  POISON: "☠️",
  BLESSED: "✨",
  CURSED: "💀",
  CONFUSED: "😵",
  CHARMED: "💕",
  FRIGHTENED: "😨",
  STUNNED: "⭐",
  PARALYZED: "🔒",
  EXHAUSTED: "😫",

  // Dice & Rolls
  DICE: "🎲",
  SUCCESS: "✓",
  FAILURE: "✗",

  // World & Social
  NPC: "👤",
  PARTY: "👥",
  QUEST: "📜",
  REWARD: "🏆",

  // General
  SETTINGS: "⚙️",
  INFO: "ℹ️",
  WARNING: "⚠️",
  ERROR: "❌",
  LOADING: "⏳",
  SAVE: "💾",
  EXPORT: "📤",
  IMPORT: "📥",
  TRASH: "🗑️",
}

/**
 * Get icon for a status/condition
 */
export function getConditionIcon(conditionName) {
  const normalized = (conditionName || "").toLowerCase()

  const iconMap = {
    poisoned: Icons.POISON,
    blessed: Icons.BLESSED,
    cursed: Icons.CURSED,
    confused: Icons.CONFUSED,
    charmed: Icons.CHARMED,
    frightened: Icons.FRIGHTENED,
    stunned: Icons.STUNNED,
    paralyzed: Icons.PARALYZED,
    exhausted: Icons.EXHAUSTED,
    invisible: "👻",
    prone: "⬇️",
    restrained: "🔗",
    petrified: "🪨",
  }

  for (const [key, icon] of Object.entries(iconMap)) {
    if (normalized.includes(key)) return icon
  }

  return Icons.BUFF // default
}

/**
 * Get icon for a location type
 */
export function getLocationIcon(locationName) {
  const normalized = (locationName || "").toLowerCase()

  const iconMap = {
    inn: Icons.TAVERN,
    tavern: Icons.TAVERN,
    bar: "🍷",
    dungeon: Icons.DUNGEON,
    cave: Icons.CAVE,
    forest: Icons.FOREST,
    town: Icons.TOWN,
    village: Icons.TOWN,
    castle: Icons.CASTLE,
    fort: "🏯",
    shrine: Icons.SHRINE,
    temple: Icons.SHRINE,
    church: "⛪",
    crypt: "⚱️",
    tomb: "🪦",
    mine: "⛏️",
    ruins: "🏛️",
    tower: "🗼",
  }

  for (const [key, icon] of Object.entries(iconMap)) {
    if (normalized.includes(key)) return icon
  }

  return Icons.LOCATION // default
}

/**
 * Get icon for item type/name
 */
export function getItemIcon(itemName) {
  const normalized = (itemName || "").toLowerCase()

  const iconMap = {
    sword: Icons.SWORD,
    longsword: Icons.SWORD,
    shortsword: Icons.SWORD,
    axe: "🪓",
    bow: "🏹",
    staff: "🏑",
    wand: "✨",
    dagger: "🔪",
    hammer: "🔨",
    shield: Icons.SHIELD,
    armor: Icons.ARMOR,
    leather: Icons.ARMOR,
    chain: Icons.ARMOR,
    plate: Icons.ARMOR,
    gold: Icons.GOLD,
    potion: Icons.POTION,
    healing: "🧪",
    map: "🗺️",
    scroll: "📜",
    key: "🔑",
    lock: "🔒",
    rope: "🪢",
    torch: "🔦",
    lantern: "🏮",
    book: Icons.BOOK,
    scroll: "📜",
  }

  for (const [key, icon] of Object.entries(iconMap)) {
    if (normalized.includes(key)) return icon
  }

  return Icons.ITEM // default
}
