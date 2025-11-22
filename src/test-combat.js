import { startCombat, spawnEnemy, applyDamage } from "./engine/CombatManager.js"
import { MONSTERS } from "./data/monsters.js"

// Mock Game State
const game = {
    combat: {
        active: false,
        enemies: [],
        initiative: [],
        round: 0
    },
    messages: []
}

const character = {
    name: "Hero",
    stats: { dex: 14 }
}

const world = {
    monsters: []
}

console.log("--- TEST START: Combat System ---")

// 1. Start Combat
console.log("\n1. Starting Combat...")
startCombat(game, character, world, "Ambush!")
if (game.combat.active) console.log("✅ Combat Active")
else console.error("❌ Combat Failed to Start")

// 2. Spawn Enemy (from Static DB)
console.log("\n2. Spawning Goblin...")
const goblin = spawnEnemy(game, world, "goblin")
if (game.combat.enemies.length === 1 && goblin.name === "Goblin") console.log("✅ Goblin Spawned")
else console.error("❌ Goblin Spawn Failed", game.combat.enemies)

// 3. Spawn Enemy (Generic Fallback)
console.log("\n3. Spawning Generic Enemy...")
const bandit = spawnEnemy(game, world, "unknown_monster", "Bandit Leader")
if (game.combat.enemies.length === 2 && bandit.name === "Bandit Leader") console.log("✅ Bandit Spawned")
else console.error("❌ Bandit Spawn Failed")

// 4. Apply Damage
console.log("\n4. Applying Damage...")
const msg1 = applyDamage(game, goblin.id, 5)
console.log("Result:", msg1)
if (goblin.hp.current === 2) console.log("✅ Damage Applied Correctly (7 -> 2)")
else console.error("❌ Damage Failed", goblin.hp)

// 5. Kill Enemy
console.log("\n5. Killing Goblin...")
const msg2 = applyDamage(game, goblin.id, 5)
console.log("Result:", msg2)
if (goblin.hp.current === 0 && goblin.conditions.includes("Dead")) console.log("✅ Goblin Died")
else console.error("❌ Death Logic Failed")

console.log("\n--- TEST END ---")
