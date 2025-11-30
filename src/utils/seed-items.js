import { ITEMS } from "../data/items.js"

/**
 * Seed a world's item list with essential items from the static database
 * Only adds items that don't already exist (preserves generated items)
 * @param {Object} world - World object to seed
 * @returns {Array} - Updated items array
 */
export function seedWorldItems(world) {
    if (!world) return []

    // Initialize items array if missing
    if (!world.items) world.items = []

    // Get existing item IDs to avoid duplicates
    const existingIds = new Set(world.items.map(i => i.id))

    // Get all seed items from static database
    const seedItems = Object.values(ITEMS)

    // Add seed items that don't already exist
    const addedItems = []
    for (const item of seedItems) {
        if (!existingIds.has(item.id)) {
            world.items.push({ ...item }) // Clone to avoid mutation
            addedItems.push(item.id)
        }
    }

    console.log(`[seedWorldItems] Seeded ${addedItems.length} items to world "${world.name}"`)
    return world.items
}

/**
 * Check if a world needs seeding (has empty or missing items array)
 * @param {Object} world - World object
 * @returns {boolean}
 */
export function worldNeedsSeeding(world) {
    return !world.items || world.items.length === 0
}
