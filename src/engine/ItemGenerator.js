import { sendChatCompletion } from "../utils/ai-provider.js"
import store from "../state/store.js"
import { handleEquipChange, resolveItem } from "./EquipmentManager.js"
import { tagParser } from "./TagParser.js"

/**
 * Generate item details for a novel item
 * @param {string} itemName - Name of the item
 * @param {Object} world - World context
 * @param {Object} game - Game context
 */
export async function generateItem(itemName, world, game) {
    console.log(`[ItemGenerator] Generating details for: ${itemName}`)

    // 1. Check if already exists or generating
    if (resolveItem(itemName, world)) return

    // 2. Mark as generating (placeholder)
    const placeholderId = itemName.toLowerCase().replace(/[^a-z0-9]+/g, '_')

    // Add placeholder to world items to prevent duplicate generation
    await store.update(state => {
        const w = state.worlds.find(w => w.id === world.id)
        if (w) {
            if (!w.items) w.items = []
            // Check again inside update to be safe
            if (!w.items.find(i => i.id === placeholderId)) {
                w.items.push({
                    id: placeholderId,
                    name: itemName,
                    category: "gear", // Default until generated
                    description: "Identifying...",
                    needsGeneration: true
                })
            }
        }
    })

    // 3. Call AI
    const prompt = `
    Generate a D&D 5e item definition for "${itemName}".
    
    Context:
    - World: ${world.name}
    - Description: ${world.briefDescription}
    
    Output JSON ONLY matching this schema:
    {
      "id": "${placeholderId}",
      "name": "${itemName}",
      "category": "weapon|armor|consumable|magic_item|gear",
      "rarity": "common|uncommon|rare|very_rare|legendary",
      "value": 10,
      "description": "Flavor text",
      "weight": 1,
      "effects": ["TAG[param]"], // Optional: APPLY_RESISTANCE, HEAL, etc.
      "damage": "1d8", // If weapon
      "damageType": "slashing", // If weapon
      "acBonus": 1, // If armor/shield
      "properties": [] // e.g. "light", "finesse"
    }
    
    For "Potion of Fire Resistance", effects should be ["APPLY_RESISTANCE[player|fire]"].
    For "+1 Longsword", effects should be ["+1 to hit", "+1 damage"].
  `

    try {
        const messages = [{ role: "system", content: prompt }]
        const data = store.get()
        // Use default model or first available
        const model = data.settings.defaultNarrativeModel || (data.models[0]?.id)

        // Non-streaming call
        const completion = await sendChatCompletion(messages, model, {
            temperature: 0.7,
            responseFormat: { type: "json_object" }
        })

        let jsonStr = ""
        for await (const chunk of completion) {
            jsonStr += chunk.choices[0]?.delta?.content || ""
        }

        const itemData = JSON.parse(jsonStr)
        console.log(`[ItemGenerator] Generated:`, itemData)

        // 4. Update World
        await store.update(state => {
            const w = state.worlds.find(w => w.id === world.id)
            if (w) {
                const idx = w.items.findIndex(i => i.id === placeholderId)
                if (idx !== -1) {
                    w.items[idx] = { ...itemData, needsGeneration: false }
                } else {
                    w.items.push(itemData)
                }
            }
        })

        // 5. Apply effects if equipped
        // We need to re-fetch game/character from store to get latest state
        const freshState = store.get()
        const freshGame = freshState.games.find(g => g.id === game.id)
        const freshChar = freshState.characters.find(c => c.id === freshGame.characterId)

        if (freshGame && freshChar) {
            const inventoryItem = freshGame.inventory.find(i => i.id === placeholderId || i.item === itemName)
            if (inventoryItem && inventoryItem.equipped) {
                console.log(`[ItemGenerator] Re-applying effects for equipped item: ${itemName}`)
                const result = handleEquipChange(freshGame, freshChar, world, placeholderId, true)

                // If tags generated, we need to process them
                // This is tricky because we are async. We should probably push a system message.
                if (result.tags && result.tags.length > 0) {
                    // We can't easily inject tags into the stream since it's over.
                    // But we can push a system message to the chat.
                    const { tags } = tagParser.parse(result.tags.join(' '))

                    // We need to manually process these tags or add a message that TagProcessor picks up?
                    // Actually, TagProcessor.processGameTagsRealtime is for streaming.
                    // We can manually add a system message with the tags and let the *next* turn handle it?
                    // No, we want immediate effect.

                    // Let's just create a system message describing the identification
                    const msg = {
                        id: `msg_${Date.now()}_item_id`,
                        role: "system",
                        content: `✨ **Item Identified**: ${itemData.name}\n${itemData.description}\n*Effects applied.*`,
                        timestamp: new Date().toISOString()
                    }

                    // We also need to actually apply the effects to the character state (which handleEquipChange does NOT do, it just returns tags)
                    // Wait, handleEquipChange calls applyItemEffects which DOES modify character.activeModifiers
                    // So the state IS updated. We just need to persist it.

                    await store.update(state => {
                        const g = state.games.find(g => g.id === game.id)
                        const c = state.characters.find(c => c.id === freshChar.id)
                        if (g) g.messages.push(msg)
                        if (c) {
                            // Copy over the modifiers
                            c.activeModifiers = freshChar.activeModifiers
                        }
                    })
                }
            }
        }

    } catch (err) {
        console.error(`[ItemGenerator] Failed to generate item:`, err)
    }
}
