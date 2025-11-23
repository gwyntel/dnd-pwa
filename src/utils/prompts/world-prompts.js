/**
 * World Generation Prompts
 */

export const WORLD_GENERATION_SCHEMA = {
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
    "worldOverview",
    "coreLocations",
    "coreFactions",
    "monsters",
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
    worldOverview: { type: "array", items: { type: "string" } },
    coreLocations: { type: "array", items: { type: "string" } },
    coreFactions: { type: "array", items: { type: "string" } },
    monsters: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "name", "type", "cr", "hp", "ac", "stats"],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          type: { type: "string" },
          cr: { type: "string" },
          hp: { type: "integer" },
          ac: { type: "integer" },
          stats: {
            type: "object",
            properties: {
              str: { type: "integer" },
              dex: { type: "integer" },
              con: { type: "integer" },
              int: { type: "integer" },
              wis: { type: "integer" },
              cha: { type: "integer" },
            },
          },
          actions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                desc: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
}

export const WORLD_GENERATION_PROMPT = `You are an expert TTRPG worldbuilding assistant for a D&D 5e-adjacent game system.

You MUST:
- Obey the provided JSON schema EXACTLY.
- Output ONLY a single valid JSON object. NO markdown, NO code fences, NO commentary.
- Design settings that are directly usable as AI DM system prompts, consistent with structured patterns:
  - Clearly state: genre, tech level, magic level, core tone.
  - Provide a strong "briefDescription" hook (1 sentence).
  - Provide a concise but rich "fullDescription" (2-4 paragraphs max).
  - Specify a clear "startingLocation" that works as a session-0 hub.
  - **coreIntent**: 3-5 bullet points on what the GM should prioritize (e.g., "Focus on political intrigue", "Make combat deadly").
  - **worldOverview**: 3-5 bullet points summarizing the setting's history, geography, or unique features.
  - **coreLocations**: 3-5 key locations with brief descriptions (e.g., "Ironhold: A dwarven fortress city").
  - **coreFactions**: 3-5 key factions with brief descriptions (e.g., "The Silver Hand: Monster hunters").
  - **monsters**: IMPORTANT:
    - The "id" should be a unique slug (e.g., "forest_goblin").
    - Generate 10-15 themed monsters appropriate for this world.
    - Ensure stats are consistent with 5e SRD standards.
    - Include a mix of low-level (CR 0-2), mid-level (CR 3-5), and a boss (CR 5+).

When using the user's idea:
- Respect their pitch and genre.
- If ambiguous, default to coherent, table-friendly choices:
  - Medieval/low-tech fantasy unless they request otherwise.
  - Magic level and tone that match their description.
- Ensure the result is:
  - Self-contained (works as a system prompt),
  - Concrete enough to guide an AI DM,
  - Not overloaded with novel-length lore.

User's world idea: "{{IDEA}}"

Respond ONLY with the JSON object.`
