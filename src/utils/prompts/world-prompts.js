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
