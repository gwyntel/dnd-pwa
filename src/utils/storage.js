/**
 * localStorage wrapper for D&D PWA
 * Handles all data persistence with schema validation
 */

const STORAGE_KEY = "dnd_pwa_data"
const SCHEMA_VERSION = "1.0.0"

// Default data structure
const DEFAULT_DATA = {
  version: SCHEMA_VERSION,
  lastModified: new Date().toISOString(),
  settings: {
    defaultNarrativeModel:
      (typeof import.meta !== "undefined" &&
        import.meta.env &&
        (import.meta.env.VITE_DEFAULT_NARRATIVE_MODEL || import.meta.env.DEFAULT_NARRATIVE_MODEL)) ||
      null,
    theme: "auto",
    autoSave: true,
    diceAnimation: true,
    hasSeenTutorial: false,
    temperature: 1.0,
    // Provider configuration
    provider: "openrouter", // "openrouter" | "openai" | "lmstudio"
    providers: {
      openrouter: {
        // API key handled by auth.js
      },
      openai: {
        baseUrl: "https://api.openai.com/v1",
        apiKey: "",
      },
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
      },
    },
  },
  worlds: [
    // Canonical default world used when no worlds exist yet.
    // This MUST stay in sync with the default created in src/views/worlds.js.
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
      systemPrompt: `You are running adventures in the Default Classic Fantasy Realm — a streamlined, beginner-friendly high fantasy setting.

CORE INTENT:
- Make it EASY for new players and GMs.
- Keep tone heroic and inviting, with clear threats and clear ways to be awesome.
- Provide obvious adventure hooks without heavy lore dumps.
- Respect player agency and the game's mechanical constraints.

WORLD OVERVIEW:
- Baseline: A classic medieval fantasy realm with magic, monsters, and ancient ruins.
  - Magic exists, studied by wizards and guided by priests, but is not mundane consumer tech.
  - Standard fantasy ancestries (humans, elves, dwarves, halflings, etc.) and classes fit smoothly.
  - Medieval tech level: swords, bows, armor, sailing ships; no guns or modern industry unless the user/world explicitly permits them.
- Home Base — Greenhollow:
  - Friendly riverside town and default starting hub.
  - Key NPCs (examples, adapt as needed):
    - Mayor Elira Thorne: Capable but overstretched; values practical heroes.
    - Captain Bram: Town watch leader, honest and blunt.
    - Sister Maelin: Temple priest and healer; a natural quest-giver.
    - Old Tamsin: Retired adventurer who shares rumors, maps, and gentle guidance.
- Nearby Hooks:
  - Whispering Woods: Goblins, wolves, fey lights, lost shrines, mysterious tracks.
  - Old Watchtower: Bandits or a small cult; straightforward but dramatic dungeon site.
  - Crystalford Mine: Miners missing, strange lights and sounds below.
- Factions (keep simple and readable):
  - Town Watch (order and safety),
  - Road Wardens (caravans and travel),
  - A Hidden Cult or Shadowy Mage (slow-burn villain behind local troubles).

TONE & GENRE:
- Heroic fantasy with room for wonder, suspense, and light drama.
- Default to clear good vs evil. Moral nuance is allowed, but do not force grimdark by default.
- Maintain a welcoming tone suitable for new or cautious groups.

AI DM BEHAVIOR GUIDELINES:
- Always follow the global system + tool rules, tag formats, and dice/roll semantics.
- Present 2–3 clear, meaningful options instead of long unfocused lists.
- When rules or mechanics are involved, explain outcomes and difficulties in plain language.
- Never remove player agency: offer consequences and choices, do not decide for them.
- Respect the table's tone preferences while maintaining narrative coherence and mechanical clarity.
- When uncertain, choose the path that keeps play fun, fair, comprehensible, and grounded in this realm.

Use this as the default world context whenever a game uses the default world and no custom world overrides it.`,
      createdAt: new Date().toISOString(),
      isDefault: true,
    },
  ],
  characterTemplates: [
    {
      id: "template_fighter",
      name: "Brave Fighter",
      description: "Strong warrior good at melee combat. High HP and armor.",
      race: "Human",
      class: "Fighter",
      level: 1,
      stats: {
        strength: 16,
        dexterity: 12,
        constitution: 14,
        intelligence: 10,
        wisdom: 11,
        charisma: 8,
      },
      maxHP: 12,
      armorClass: 16,
      proficiencyBonus: 2,
      speed: 30,
      hitDice: "1d10",
      savingThrows: ["strength", "constitution"],
      skills: ["Athletics", "Intimidation"],
      proficiencies: {
        armor: ["Light Armor", "Medium Armor", "Heavy Armor", "Shields"],
        weapons: ["Simple Weapons", "Martial Weapons"],
        tools: [],
      },
      features: ["Second Wind", "Fighting Style: Defense"],
      spells: [],
      inventory: [
        { item: "Longsword", equipped: true, quantity: 1, damage: "1d8+3" },
        { item: "Chain Mail", equipped: true, quantity: 1 },
        { item: "Shield", equipped: true, quantity: 1 },
        { item: "Healing Potion", equipped: false, quantity: 2 },
        { item: "Backpack", equipped: false, quantity: 1 },
        { item: "Bedroll", equipped: false, quantity: 1 },
        { item: "Rations (days)", equipped: false, quantity: 10 },
      ],
      backstory: "A brave warrior trained in the art of combat, seeking glory and honor on the battlefield.",
    },
    {
      id: "template_wizard",
      name: "Wise Wizard",
      description: "Powerful spellcaster with high intelligence. Low HP but devastating magic.",
      race: "Elf",
      class: "Wizard",
      level: 1,
      stats: {
        strength: 8,
        dexterity: 14,
        constitution: 12,
        intelligence: 16,
        wisdom: 13,
        charisma: 10,
      },
      maxHP: 8,
      armorClass: 12,
      proficiencyBonus: 2,
      speed: 30,
      hitDice: "1d6",
      savingThrows: ["intelligence", "wisdom"],
      skills: ["Arcana", "Investigation", "History"],
      proficiencies: {
        armor: [],
        weapons: ["Daggers", "Darts", "Slings", "Quarterstaffs", "Light Crossbows"],
        tools: [],
      },
      features: ["Arcane Recovery", "Spellcasting"],
      spells: [
        { name: "Fire Bolt", level: 0, damage: "1d10" },
        { name: "Mage Hand", level: 0 },
        { name: "Magic Missile", level: 1, damage: "3d4+3" },
        { name: "Shield", level: 1 },
        { name: "Detect Magic", level: 1 },
      ],
      inventory: [
        { item: "Quarterstaff", equipped: true, quantity: 1, damage: "1d6" },
        { item: "Spellbook", equipped: false, quantity: 1 },
        { item: "Robes", equipped: true, quantity: 1 },
        { item: "Component Pouch", equipped: false, quantity: 1 },
        { item: "Backpack", equipped: false, quantity: 1 },
        { item: "Ink and Quill", equipped: false, quantity: 1 },
      ],
      backstory:
        "A scholarly elf who has spent years studying the arcane arts in ancient libraries, now seeking practical experience.",
    },
    {
      id: "template_rogue",
      name: "Cunning Rogue",
      description: "Stealthy and agile. Excels at sneaking and dealing critical strikes.",
      race: "Halfling",
      class: "Rogue",
      level: 1,
      stats: {
        strength: 10,
        dexterity: 16,
        constitution: 12,
        intelligence: 13,
        wisdom: 11,
        charisma: 14,
      },
      maxHP: 10,
      armorClass: 14,
      proficiencyBonus: 2,
      speed: 25,
      hitDice: "1d8",
      savingThrows: ["dexterity", "intelligence"],
      skills: ["Stealth", "Sleight of Hand", "Deception", "Acrobatics"],
      proficiencies: {
        armor: ["Light Armor"],
        weapons: ["Simple Weapons", "Hand Crossbows", "Longswords", "Rapiers", "Shortswords"],
        tools: ["Thieves' Tools"],
      },
      features: ["Sneak Attack (1d6)", "Thieves' Cant", "Expertise"],
      spells: [],
      inventory: [
        { item: "Shortsword", equipped: true, quantity: 1, damage: "1d6+3" },
        { item: "Dagger", equipped: true, quantity: 2, damage: "1d4+3" },
        { item: "Leather Armor", equipped: true, quantity: 1 },
        { item: "Thieves' Tools", equipped: false, quantity: 1 },
        { item: "Backpack", equipped: false, quantity: 1 },
        { item: "Crowbar", equipped: false, quantity: 1 },
        { item: "Dark Cloak", equipped: false, quantity: 1 },
      ],
      backstory: "A nimble halfling who grew up on the streets, learning to survive by wit and stealth.",
    },
    {
      id: "template_cleric",
      name: "Holy Cleric",
      description: "Divine healer and support. Can heal allies and turn undead.",
      race: "Dwarf",
      class: "Cleric",
      level: 1,
      stats: {
        strength: 14,
        dexterity: 10,
        constitution: 14,
        intelligence: 11,
        wisdom: 16,
        charisma: 12,
      },
      maxHP: 11,
      armorClass: 15,
      proficiencyBonus: 2,
      speed: 25,
      hitDice: "1d8",
      savingThrows: ["wisdom", "charisma"],
      skills: ["Medicine", "Religion", "Insight"],
      proficiencies: {
        armor: ["Light Armor", "Medium Armor", "Shields"],
        weapons: ["Simple Weapons"],
        tools: [],
      },
      features: ["Divine Domain: Life", "Channel Divinity", "Spellcasting"],
      spells: [
        { name: "Sacred Flame", level: 0, damage: "1d8" },
        { name: "Guidance", level: 0 },
        { name: "Cure Wounds", level: 1, healing: "1d8+3" },
        { name: "Bless", level: 1 },
        { name: "Shield of Faith", level: 1 },
      ],
      inventory: [
        { item: "Mace", equipped: true, quantity: 1, damage: "1d6+2" },
        { item: "Scale Mail", equipped: true, quantity: 1 },
        { item: "Shield", equipped: true, quantity: 1 },
        { item: "Holy Symbol", equipped: false, quantity: 1 },
        { item: "Backpack", equipped: false, quantity: 1 },
        { item: "Prayer Book", equipped: false, quantity: 1 },
        { item: "Healing Potion", equipped: false, quantity: 2 },
      ],
      backstory:
        "A devoted dwarf cleric who serves their deity with unwavering faith, dedicated to healing the wounded and protecting the innocent.",
    },
  ],
  characters: [],
  games: [],
}

/**
 * Ensure a character object has all required default fields
 * without mutating unexpected shapes from older saves.
 */
export function normalizeCharacter(character) {
  return {
    ...character,
    // Currency: simple gp field for now (MUST)
    currency: {
      gp: character.currency && typeof character.currency.gp === "number" ? character.currency.gp : 0,
    },
    // Future-friendly resources array (SHOULD - optional usage)
    resources: Array.isArray(character.resources) ? character.resources : [],
    // Future-friendly spellcasting object (SHOULD - optional usage)
    spellcasting:
      character.spellcasting && typeof character.spellcasting === "object"
        ? character.spellcasting
        : {
            // kept intentionally minimal; real structure can evolve in v1.5+
          },
  }
}

/**
 * Load data from localStorage
 * @returns {Object} The stored data or default data if none exists
 */
export function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return { ...DEFAULT_DATA }
    }

    const data = JSON.parse(stored)

    // Validate schema version
    if (data.version !== SCHEMA_VERSION) {
      console.warn(`Schema version mismatch. Expected ${SCHEMA_VERSION}, got ${data.version}`)
      // TODO: Implement migration logic in future versions
    }

    // Ensure we always have at least one robust default world.
    try {
      if (!Array.isArray(data.worlds)) {
        data.worlds = []
      }

      const hasCanonicalDefault = data.worlds.some(
        (w) => w && (w.isDefault || w.id === "world_default_classic_fantasy"),
      )

      if (!hasCanonicalDefault) {
        // Look for an older weak default and upgrade it in-memory.
        const legacy = data.worlds.find(
          (w) =>
            w &&
            (w.id === "world_default" ||
              w.name === "Generic Fantasy" ||
              w.name === "Default World"),
        )

        const canonicalDefault = {
          ...DEFAULT_DATA.worlds[0],
          createdAt: (legacy && legacy.createdAt) || new Date().toISOString(),
        }

        if (legacy) {
          const idx = data.worlds.indexOf(legacy)
          if (idx !== -1) {
            data.worlds[idx] = canonicalDefault
          } else {
            data.worlds.push(canonicalDefault)
          }
        } else {
          data.worlds.push(canonicalDefault)
        }
      }
    } catch (e) {
      console.warn("Worlds normalization failed; using stored worlds as-is.", e)
    }

    return data
  } catch (error) {
    console.error("Error loading data from localStorage:", error)
    return { ...DEFAULT_DATA }
  }
}

/**
 * Save data to localStorage
 * @param {Object} data - The data to save
 */
export function saveData(data) {
  try {
    data.lastModified = new Date().toISOString()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error("Error saving data to localStorage:", error)
    throw error
  }
}

/**
 * Debounced save function to prevent excessive writes
 */
let saveTimeout = null
export function debouncedSave(data, delay = 300) {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }

  saveTimeout = setTimeout(() => {
    saveData(data)
  }, delay)
}

/**
 * Export data as JSON file
 * @param {Object} data - The data to export
 * @param {string} filename - Optional filename
 */
export function exportData(data, filename = `dnd-pwa-backup-${Date.now()}.json`) {
  try {
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()

    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Error exporting data:", error)
    throw error
  }
}

/**
 * Import data from JSON file
 * @param {File} file - The file to import
 * @returns {Promise<Object>} The imported data
 */
export function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)

        // Basic validation
        if (!data.version || !data.settings || !data.characters || !data.games) {
          throw new Error("Invalid data format")
        }

        resolve(data)
      } catch (error) {
        reject(new Error("Failed to parse import file: " + error.message))
      }
    }

    reader.onerror = () => {
      reject(new Error("Failed to read file"))
    }

    reader.readAsText(file)
  })
}

/**
 * Clear all data (with confirmation)
 */
export function clearAllData() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch (error) {
    console.error("Error clearing data:", error)
    return false
  }
}

/**
 * Get storage usage info
 * @returns {Object} Storage usage information
 */
export function getStorageInfo() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    const bytes = data ? new Blob([data]).size : 0
    const kb = (bytes / 1024).toFixed(2)

    return {
      bytes,
      kb,
      characterCount: loadData().characters.length,
      gameCount: loadData().games.length,
    }
  } catch (error) {
    console.error("Error getting storage info:", error)
    return { bytes: 0, kb: "0", characterCount: 0, gameCount: 0 }
  }
}
