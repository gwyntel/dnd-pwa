import store from "../../state/store.js"
import { MONSTERS } from "../../data/monsters.js"

export function migrateMonsters() {
    const data = store.get()
    let updated = false

    if (!data.worlds) return

    const updatedWorlds = data.worlds.map(world => {
        if (!world.monsters || world.monsters.length === 0) {
            console.log(`Backfilling monsters for world: ${world.name}`)
            updated = true

            // Select a subset of standard monsters based on world feel (or just random/all for now)
            // For simplicity, we'll give them a mix of all standard monsters so they have something to play with.
            const standardMonsters = Object.values(MONSTERS)

            return {
                ...world,
                monsters: standardMonsters
            }
        }
        return world
    })

    if (updated) {
        store.update(data => {
            data.worlds = updatedWorlds
        })
        console.log("Monster migration complete.")
    }
}
