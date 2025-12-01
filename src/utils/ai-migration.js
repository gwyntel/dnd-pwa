import store from "../state/store.js"
import { sendChatCompletion, parseStreamingResponse } from "./ai-provider.js"
import { showMigrationPopup, hideMigrationPopup } from "../components/MigrationPopup.js"
import { saveData } from "./storage.js"

/**
 * Run AI migration for legacy worlds
 * Extracts structured data from old systemPrompt fields
 */
export async function runPendingMigrations() {
    const data = store.get()
    if (!data.worlds) return

    // Find worlds that need migration
    // Criteria: Has systemPrompt AND (missing coreIntent OR coreIntent is empty)
    const worldsToMigrate = data.worlds.filter(w =>
        w.systemPrompt &&
        (!w.coreIntent || w.coreIntent.length === 0) &&
        w.sourceType !== 'template' // Don't migrate templates, they should be handled by ID match in storage.js
    )

    if (worldsToMigrate.length === 0) return

    console.log(`Found ${worldsToMigrate.length} worlds needing AI migration.`)

    showMigrationPopup()
    const popup = document.getElementById('migration-popup')
    if (popup) {
        const p = popup.querySelector('p')
        if (p) p.textContent = `Upgrading ${worldsToMigrate.length} worlds with AI...`
    }

    let updatedCount = 0

    for (const world of worldsToMigrate) {
        try {
            console.log(`Migrating world: ${world.name}...`)
            const structuredData = await extractWorldData(world.systemPrompt, world.name)

            // Update world in place
            world.coreIntent = structuredData.coreIntent
            world.worldOverview = structuredData.worldOverview
            world.coreLocations = structuredData.coreLocations
            world.coreFactions = structuredData.coreFactions

            // If startingLocation was missing, try to use the one from AI
            if (!world.startingLocation && structuredData.startingLocation) {
                world.startingLocation = structuredData.startingLocation
            }

            // We KEEP systemPrompt for now as a backup, or we could delete it.
            // The user said "ditching the legacy data" in the previous turn, but for safety
            // let's keep it in the object but UI ignores it. 
            // Actually, to be clean, let's delete it if migration was successful.
            delete world.systemPrompt

            updatedCount++
        } catch (error) {
            console.error(`Failed to migrate world ${world.name}:`, error)
            // Continue to next world
        }
    }

    if (updatedCount > 0) {
        store.update(d => {
            // The worlds are already mutated in the local 'worldsToMigrate' references 
            // which point to objects inside 'data.worlds' (if we got them from store.get() which returns state)
            // But store.get() usually returns a proxy or direct ref. 
            // To be safe and trigger listeners, we re-assign.
            d.worlds = [...data.worlds]
        })
        saveData(store.get())
        console.log(`Successfully migrated ${updatedCount} worlds.`)

        // Force a reload to ensure UI updates if it doesn't react automatically
        window.location.reload()
    }

    hideMigrationPopup()
}

async function extractWorldData(systemPrompt, worldName) {
    const data = store.get()
    const model = data.settings.defaultNarrativeModel

    const worldSchema = {
        type: "object",
        additionalProperties: false,
        required: [
            "coreIntent",
            "worldOverview",
            "coreLocations",
            "coreFactions",
            "startingLocation"
        ],
        properties: {
            startingLocation: { type: "string" },
            coreIntent: { type: "array", items: { type: "string" } },
            worldOverview: { type: "array", items: { type: "string" } },
            coreLocations: { type: "array", items: { type: "string" } },
            coreFactions: { type: "array", items: { type: "string" } },
        },
    }

    const prompt = `You are an expert D&D campaign manager.
I have a legacy world description ("System Prompt") that needs to be converted into a structured format.

World Name: ${worldName}

Legacy System Prompt:
"""
${systemPrompt}
"""

Please extract the following fields from the text above:
- **startingLocation**: The best starting hub mentioned or implied.
- **coreIntent**: 3-5 bullet points on the intended game style/GM focus.
- **worldOverview**: 3-5 bullet points summarizing the setting.
- **coreLocations**: 3-5 key locations mentioned.
- **coreFactions**: 3-5 key factions mentioned.

If information is missing, infer reasonable defaults that fit the tone of the text.

Output ONLY valid JSON satisfying the schema.`

    const messages = [{ role: "user", content: prompt }]

    // Reuse the logic from worlds.js for structured output
    // We assume the provider supports it or we parse JSON
    const models = data.models || []
    const selectedModelMeta = models.find((m) => m.id === model)
    const supportsStructuredOutputs = !!selectedModelMeta?.supportedParameters?.includes("structured_outputs")

    const requestOptions = supportsStructuredOutputs
        ? {
            jsonSchema: {
                name: "world_migration",
                strict: true,
                schema: worldSchema,
            },
        }
        : {}

    const response = await sendChatCompletion(messages, model, requestOptions)

    let fullResponse = ""
    for await (const chunk of parseStreamingResponse(response)) {
        if (chunk.output_json) fullResponse = JSON.stringify(chunk.output_json)
        else if (chunk.choices && chunk.choices[0]?.delta?.content) fullResponse += chunk.choices[0].delta.content
        else if (chunk.choices && chunk.choices[0]?.message?.content) fullResponse += chunk.choices[0].message.content
    }

    try {
        return JSON.parse(fullResponse)
    } catch (e) {
        // Fallback regex
        const match = fullResponse.match(/\{[\s\S]*\}/)
        if (match) return JSON.parse(match[0])
        throw new Error("Failed to parse JSON from AI response")
    }
}
