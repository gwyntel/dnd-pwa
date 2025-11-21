/**
 * localStorage wrapper for D&D PWA
 * Handles all data persistence with schema validation
 */

import { WORLD_TEMPLATES } from "../data/worlds.js"
import { showMigrationPopup, hideMigrationPopup } from "../components/MigrationPopup.js"

const STORAGE_KEY = "dnd_pwa_data"
const SCHEMA_VERSION = "1.1.0"

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
    maxRelationshipsTracked: 50,
    maxLocationsTracked: 10,
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
    // Canonical default world imported from WORLD_TEMPLATES[0]
    {
      ...WORLD_TEMPLATES[0],
      createdAt: new Date().toISOString(),
    },
  ],
  // Character templates moved to src/data/archetypes.js (BEGINNER_TEMPLATES)
  // Legacy characterTemplates field removed - modern code uses BEGINNER_TEMPLATES directly
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

    // Spell Slots (current/max)
    spellSlots: character.spellSlots || {
      1: { current: 0, max: 0 },
      2: { current: 0, max: 0 },
      3: { current: 0, max: 0 },
      4: { current: 0, max: 0 },
      5: { current: 0, max: 0 },
      6: { current: 0, max: 0 },
      7: { current: 0, max: 0 },
      8: { current: 0, max: 0 },
      9: { current: 0, max: 0 }
    },

    // Hit Dice (for short rest healing)
    hitDice: {
      current: character.hitDice?.current ?? character.level ?? 1,
      max: character.hitDice?.max ?? character.level ?? 1,
      dieType: character.hitDice?.dieType || 'd8' // Default to d8 if unknown
    },

    // Death Saves (for 0 HP state)
    deathSaves: character.deathSaves || {
      successes: 0,
      failures: 0,
      isStable: false
    },

    // Class-specific resources (Ki, Rage, Channel Divinity, etc.)
    classResources: Array.isArray(character.classResources)
      ? character.classResources
      : [],

    // XP & Leveling
    xp: character.xp || {
      current: 0,
      max: 300, // Level 1 -> 2
      history: []
    },

    // Prepared spells (for classes that prepare)
    preparedSpells: Array.isArray(character.preparedSpells)
      ? character.preparedSpells
      : character.spells || [], // Legacy fallback

    // Known spells (all spells the character knows)
    knownSpells: Array.isArray(character.knownSpells)
      ? character.knownSpells
      : character.spells || [], // Legacy fallback

    // Spellcasting metadata
    spellcasting:
      character.spellcasting && typeof character.spellcasting === "object"
        ? character.spellcasting
        : {
          ability: null, // 'int', 'wis', 'cha', etc.
          spellSaveDC: null,
          spellAttackBonus: null,
          isPreparationCaster: false, // Wizard/Cleric vs Sorcerer/Bard
          cantripsKnown: 0
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

    let data = JSON.parse(stored)
    let migrated = false

    // Migration Logic
    if (data.version !== SCHEMA_VERSION) {
      console.log(`Migrating data from ${data.version || "unknown"} to ${SCHEMA_VERSION}`)

      // Show popup if we are in a browser environment
      if (typeof document !== 'undefined') {
        showMigrationPopup()
      }

      // 1.1.0 Migration: World Schema Update
      if (!data.version || data.version < "1.1.0") {
        // Migrate Worlds
        if (Array.isArray(data.worlds)) {
          data.worlds = data.worlds.map(world => {
            // Find matching template
            const template = WORLD_TEMPLATES.find(t => t.id === world.id)
            if (template) {
              // Overwrite with new template data but preserve user fields
              return {
                ...template,
                createdAt: world.createdAt || new Date().toISOString(),
                // Preserve any other custom fields if they exist, but ensure systemPrompt is gone/overwritten
                // by template (which doesn't have it anymore)
              }
            }
            // For custom worlds, we can't do much but ensuring they don't break
            // We could try to parse systemPrompt into new fields but that's risky AI work
            // For now, we leave them as is, but maybe add empty fields to avoid crashes
            return {
              ...world,
              coreIntent: world.coreIntent || [],
              worldOverview: world.worldOverview || [],
              coreLocations: world.coreLocations || [],
              coreFactions: world.coreFactions || [],
            }
          })
        }

        // Migrate Games (update embedded world data)
        if (Array.isArray(data.games)) {
          data.games = data.games.map(game => {
            if (game.world) {
              const template = WORLD_TEMPLATES.find(t => t.id === game.world.id)
              if (template) {
                return {
                  ...game,
                  world: {
                    ...template,
                    createdAt: game.world.createdAt || new Date().toISOString()
                  }
                }
              }
            }
            return game
          })
        }

        // Migrate Characters: Add XP field if missing
        if (Array.isArray(data.characters)) {
          data.characters = data.characters.map(char => {
            if (!char.xp) {
              return {
                ...char,
                xp: {
                  current: 0,
                  max: 300, // Level 1 -> 2
                  history: []
                }
              }
            }
            return char
          })
        }

        migrated = true
      }

      data.version = SCHEMA_VERSION

      if (migrated) {
        saveData(data)
        if (typeof document !== 'undefined') {
          hideMigrationPopup()
        }
      }
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
          ...WORLD_TEMPLATES[0],
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

    // Runtime check: Ensure all characters have XP field (for existing saves)
    try {
      if (Array.isArray(data.characters)) {
        let needsSave = false
        data.characters = data.characters.map(char => {
          if (!char.xp) {
            needsSave = true
            return {
              ...char,
              xp: {
                current: 0,
                max: 300, // Level 1 -> 2
                history: []
              }
            }
          }
          return char
        })

        if (needsSave) {
          console.log("Initialized XP field for existing characters")
          saveData(data)
        }
      }
    } catch (e) {
      console.warn("Character XP initialization failed", e)
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
