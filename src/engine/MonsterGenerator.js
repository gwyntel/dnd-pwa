import { sendChatCompletion } from "../utils/ai-provider.js"
import store from "../state/store.js"

/**
 * Generate monster details for a novel enemy
 * @param {string} monsterName - Name of the monster (e.g. "Void Spider")
 * @param {Object} world - World context
 * @param {Object} game - Game context
 */
export async function generateMonster(monsterName, world, game) {
    console.log(`[MonsterGenerator] Generating details for: ${monsterName}`)

    // 1. Check if already exists or generating
    // We assume the caller (CombatManager) already checked the DB and found nothing.

    const placeholderId = monsterName.toLowerCase().replace(/[^a-z0-9]+/g, '_')

    // Add placeholder to world monsters to prevent duplicate generation
    await store.update(state => {
        const w = state.worlds.find(w => w.id === world.id)
        if (w) {
            if (!w.monsters) w.monsters = []
            if (!w.monsters.find(m => m.id === placeholderId)) {
                w.monsters.push({
                    id: placeholderId,
                    name: monsterName,
                    type: "Unknown",
                    cr: "0",
                    hp: 10,
                    ac: 10,
                    stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
                    actions: [],
                    needsGeneration: true
                })
            }
        }
    })

    // 2. Call AI
    const prompt = `
    Generate a D&D 5e monster definition for "${monsterName}".
    
    Context:
    - World: ${world.name}
    - Description: ${world.briefDescription}
    
    Output JSON ONLY matching this schema:
    {
      "id": "${placeholderId}",
      "name": "${monsterName}",
      "type": "Aberration|Beast|Celestial|Construct|Dragon|Elemental|Fey|Fiend|Giant|Humanoid|Monstrosity|Ooze|Plant|Undead",
      "cr": "1/4", // Challenge Rating string
      "ac": 12,
      "hp": 20,
      "hitDice": "3d8+6",
      "stats": { "str": 10, "dex": 10, "con": 10, "int": 10, "wis": 10, "cha": 10 },
      "resistances": ["fire"], // Optional
      "immunities": ["poison"], // Optional
      "vulnerabilities": ["cold"], // Optional
      "actions": [
        { "name": "Attack Name", "desc": "Attack description..." }
      ]
    }
    
    Ensure stats are appropriate for a standard encounter unless the name implies a boss.
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

        const monsterData = JSON.parse(jsonStr)
        console.log(`[MonsterGenerator] Generated:`, monsterData)

        // 3. Update World
        await store.update(state => {
            const w = state.worlds.find(w => w.id === world.id)
            if (w) {
                const idx = w.monsters.findIndex(m => m.id === placeholderId)
                if (idx !== -1) {
                    w.monsters[idx] = { ...monsterData, needsGeneration: false }
                } else {
                    w.monsters.push(monsterData)
                }
            }
        })

        // 4. Update Active Combatants
        // If we have active enemies with this templateId, update their stats live!
        await store.update(state => {
            const g = state.games.find(g => g.id === game.id)
            if (g && g.combat && g.combat.enemies) {
                let updatedCount = 0
                g.combat.enemies.forEach(enemy => {
                    if (enemy.templateId === placeholderId) {
                        // Update stats if they haven't taken damage yet? 
                        // Or just update max HP and scale current?
                        // Let's update max HP and AC. If current HP was untouched (equal to old max), update it too.

                        const oldMax = enemy.hp.max
                        const newMax = monsterData.hp

                        enemy.hp.max = newMax
                        enemy.ac = monsterData.ac
                        enemy.stats = monsterData.stats
                        enemy.resistances = monsterData.resistances || []
                        enemy.immunities = monsterData.immunities || []
                        enemy.vulnerabilities = monsterData.vulnerabilities || []

                        // If full health, keep full health. Otherwise maintain damage taken?
                        // Or just heal to new max?
                        // Safest: If current == oldMax, set to newMax. Else, add difference?
                        if (enemy.hp.current === oldMax) {
                            enemy.hp.current = newMax
                        } else {
                            // Maintain absolute damage taken
                            const damageTaken = oldMax - enemy.hp.current
                            enemy.hp.current = Math.max(1, newMax - damageTaken)
                        }

                        updatedCount++
                    }
                })

                if (updatedCount > 0) {
                    g.messages.push({
                        id: `msg_${Date.now()}_monster_update`,
                        role: "system",
                        content: `✨ **Monster Identified**: ${monsterData.name}\nType: ${monsterData.type} (CR ${monsterData.cr})`,
                        timestamp: new Date().toISOString()
                    })
                }
            }
        })

    } catch (err) {
        console.error(`[MonsterGenerator] Failed to generate monster:`, err)
    }
}
