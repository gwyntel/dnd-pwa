/**
 * World Generation Prompts
 * Split into sequential steps to prevent context window/token limit issues
 */

// ==========================================
// STEP 1: CORE SETTING
// ==========================================
export const WORLD_GEN_STEP_1_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "name",
    "briefDescription",
    "fullDescription",
    "tone",
    "magicLevel",
    "techLevel",
    "startingLocation",
    "coreIntent",
    "worldOverview"
  ],
  properties: {
    name: { type: "string" },
    briefDescription: { type: "string" },
    fullDescription: { type: "string" },
    tone: { type: "string" },
    magicLevel: {
      type: "string",
      enum: ["none", "low", "medium", "high"],
    },
    techLevel: {
      type: "string",
      enum: ["primitive", "medieval", "renaissance", "industrial", "modern", "sci-fi", "mixed"],
    },
    startingLocation: { type: "string" },
    coreIntent: { type: "array", items: { type: "string" } },
    worldOverview: { type: "array", items: { type: "string" } }
  },
}

export const WORLD_GEN_STEP_1_PROMPT = `You are an expert TTRPG worldbuilding assistant.
Step 1: Create the CORE SETTING based on the user's idea.

You MUST:
- Obey the JSON schema EXACTLY.
- Output ONLY valid JSON.
- **name**: Creative, thematic name.
- **briefDescription**: Strong hook (1 sentence).
- **fullDescription**: Concise but rich (2-3 paragraphs).
- **tone**: Atmosphere (e.g., "Dark and gritty").
- **startingLocation**: A clear session-0 hub.
- **coreIntent**: 3-5 GM priorities (e.g., "Focus on intrigue").
- **worldOverview**: 3-5 bullet points on history/geography.

User's Idea: "{{IDEA}}"
`

// ==========================================
// STEP 2: GEOGRAPHY & FACTIONS
// ==========================================
export const WORLD_GEN_STEP_2_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["coreLocations", "coreFactions"],
  properties: {
    coreLocations: { type: "array", items: { type: "string" } },
    coreFactions: { type: "array", items: { type: "string" } }
  }
}

export const WORLD_GEN_STEP_2_PROMPT = `Step 2: Generate KEY LOCATIONS and FACTIONS for the world "{{NAME}}".

Context:
- Description: {{DESCRIPTION}}
- Tone: {{TONE}}

You MUST:
- Obey the JSON schema EXACTLY.
- Output ONLY valid JSON.
- **coreLocations**: 3-5 distinctive locations with brief descriptions (e.g., "Ironhold: A dwarven fortress").
- **coreFactions**: 3-5 key groups with brief descriptions (e.g., "The Silver Hand: Monster hunters").
`

// ==========================================
// STEP 3: MONSTERS
// ==========================================
export const WORLD_GEN_STEP_3_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["monsters"],
  properties: {
    monsters: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "name", "type", "cr", "hp", "ac", "stats", "actions"],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          type: { type: "string" },
          cr: { type: "string" },
          hp: { type: "integer" },
          ac: { type: "integer" },
          stats: {
            type: "object",
            additionalProperties: false,
            required: ["str", "dex", "con", "int", "wis", "cha"],
            properties: {
              str: { type: "integer" },
              dex: { type: "integer" },
              con: { type: "integer" },
              int: { type: "integer" },
              wis: { type: "integer" },
              cha: { type: "integer" },
            },
          },
          resistances: { type: "array", items: { type: "string" } },
          immunities: { type: "array", items: { type: "string" } },
          vulnerabilities: { type: "array", items: { type: "string" } },
          actions: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "desc"],
              properties: {
                name: { type: "string" },
                desc: { type: "string" },
              },
            },
          },
        },
      },
    },
  }
}

export const WORLD_GEN_STEP_3_PROMPT = `Step 3: Generate THEMED MONSTERS for the world "{{NAME}}".

Context:
- Description: {{DESCRIPTION}}
- Magic Level: {{MAGIC_LEVEL}}

You MUST:
- Obey the JSON schema EXACTLY.
- Output ONLY valid JSON.
- Generate 10-15 monsters that fit the theme.
- **id**: Unique slug (e.g., "forest_goblin").
- **stats**: 5e compatible values.
- **resistances/immunities/vulnerabilities**: Optional arrays of damage types (e.g., ["fire", "bludgeoning"]).
- **actions**: At least 1 action per monster.
- Mix of CR 0-5+.
`

// ==========================================
// STEP 4: ITEMS
// ==========================================
export const WORLD_GEN_STEP_4_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["items"],
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "name", "category", "rarity", "value", "description"],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          category: { type: "string", enum: ["weapon", "armor", "consumable", "magic_item", "gear"] },
          rarity: { type: "string", enum: ["common", "uncommon", "rare", "very_rare", "legendary"] },
          value: { type: "integer" },
          description: { type: "string" },
          weight: { type: "number" },
          // Optional specific fields
          damage: { type: "string" },
          acBonus: { type: "integer" },
          effects: { type: "array", items: { type: "string" } }
        }
      }
    }
  }
}

export const WORLD_GEN_STEP_4_PROMPT = `Step 4: Generate THEMED ITEMS for the world "{{NAME}}".

Context:
- Description: {{DESCRIPTION}}
- Tech Level: {{TECH_LEVEL}}

You MUST:
- Obey the JSON schema EXACTLY.
- Output ONLY valid JSON.
- Generate 15-20 items (Weapons, Armor, Consumables, Magic Items).
- **id**: Unique slug (e.g., "obsidian_dagger").
- **value**: In gold pieces (gp).
- Ensure names and descriptions match the world's flavor.
`
