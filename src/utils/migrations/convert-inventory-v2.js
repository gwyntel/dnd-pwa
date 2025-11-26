
import store from "../../state/store.js"
import { resolveItem } from "../../engine/EquipmentManager.js"

/**
 * Migrate inventory from V1 (string/simple object) to V2 (ID-based object)
 * 
 * V1: { item: "Longsword", equipped: true }
 * V2: { id: "longsword", name: "Longsword", equipped: true, quantity: 1, ... }
 */
export function migrateInventoryV2() {
    const data = store.get()
    let modified = false

    if (!data.games || !Array.isArray(data.games)) return

    data.games.forEach(game => {
        if (!game.inventory || !Array.isArray(game.inventory)) return

        const world = data.worlds ? data.worlds.find(w => w.id === game.worldId) : null

        game.inventory.forEach(slot => {
            // Skip if already migrated (has id)
            if (slot.id) return

            const name = slot.item || slot.name
            if (!name) return

            // Try to resolve item
            const resolved = resolveItem(name, world)

            if (resolved) {
                slot.id = resolved.id
                slot.name = resolved.name // Ensure name matches canonical name
                // Keep existing quantity/equipped status
                if (typeof slot.quantity !== 'number') slot.quantity = 1

                // Add other metadata if missing? 
                // No, we rely on resolveItem at runtime for static data.
                // But we should store the ID.
            } else {
                // Fallback ID generation for unknown items
                slot.id = name.toLowerCase().replace(/\s+/g, '_')
                slot.name = name
                if (typeof slot.quantity !== 'number') slot.quantity = 1
            }

            modified = true
        })
    })

    if (modified) {
        console.log("Migrated inventory to V2")
        store.update(d => {
            d.games = data.games
        })
    }
}
