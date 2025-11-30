import store from "../state/store.js"
import { seedWorldItems, worldNeedsSeeding } from "../utils/seed-items.js"

/**
 * Migration: Seed all worlds with essential items
 * Adds seed items to worlds that have empty/missing item lists
 * Preserves existing items (won't overwrite generated items)
 */
export function seedWorldsWithItems() {
    const data = store.get()
    if (!data.worlds || data.worlds.length === 0) return

    let seededCount = 0

    store.update(state => {
        state.worlds.forEach(world => {
            if (worldNeedsSeeding(world)) {
                seedWorldItems(world)
                seededCount++
            }
        })
    })

    if (seededCount > 0) {
        console.log(`[Migration] Seeded ${seededCount} worlds with essential items`)
    }
}
