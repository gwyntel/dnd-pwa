# Task: Implement Complete Enemy & Combat System

You are an expert AI coding agent. Your goal is to implement a fully mechanical **Enemy System** into the existing D&D PWA codebase. Currently, enemies are just text names in the initiative list. We need them to be real entities with HP, AC, and stats that the engine can track and manipulate.

Follow the patterns in `.clinerules/CLINE.md` strictly. Use Vanilla JS.

## 1. Data Layer: Monster Database
Create `src/data/monsters.js`.
*   Export a `MONSTERS` object (dictionary) keyed by ID (e.g., `goblin`, `orc`).
*   Each entry must have: `name`, `type`, `cr`, `ac`, `hp` (average), `hitDice`, `stats` (str, dex, etc.), `actions` (array of objects).
*   **Seed Data**: Add at least 10 diverse monsters covering different CRs and types:
    *   **Low Level**: Goblin, Skeleton, Zombie, Kobold, Bandit.
    *   **Mid Level**: Orc, Bugbear, Gelatinous Cube, Ogre.
    *   **Boss**: Young Red Dragon or similar boss-type.
    *   Ensure accurate 5e SRD stats.

## 2. World Generation Integration (The "Monster Manual")
Instead of generating monsters on-the-fly (which causes lag), we will generate a "Monster Manual" for each world at creation time.

### A. Verify `src/utils/prompts/world-prompts.js`
*   Verify `WORLD_GENERATION_SCHEMA` includes a `monsters` array (this was recently added).
*   **Schema for Monster**: `{ id, name, type, cr, hp, ac, stats, actions }`.
*   **Prompt Instruction**: Ensure the prompt instructs the AI to generate ~10-15 themed monsters.

### B. Update `src/views/worlds.js`
*   Ensure `generateWorldWithAI` correctly parses and saves the `monsters` array into the world object.

### C. Migration Script
*   Create `src/utils/migrations/backfill-monsters.js`.
*   Iterate through all existing worlds.
*   If `world.monsters` is missing, add a default set of "Standard Monsters" (copied from the static DB) so they at least have something.

## 3. Engine Layer: Enemy Class & State
We need a way to instantiate these monsters into the game state.

### A. Schema Definition
In `src/engine/CombatManager.js` (or a new `src/engine/EnemyFactory.js` if you prefer separation), define the structure for an **Active Enemy**.
*   **Structure**:
    ```javascript
    {
      id: "unique_id", // e.g., "goblin_1"
      templateId: "goblin",
      name: "Goblin 1",
      hp: { current: 7, max: 7 },
      ac: 15,
      stats: { ... }, // Copied from template
      conditions: []
    }
    ```

### B. Update `CombatManager.js`
Refactor `src/engine/CombatManager.js` to manage these entities.
1.  **State**: Update `startCombat` to initialize `game.combat.enemies = []`.
    *   **Signature Change**: `startCombat(game, character, world, description)` - we need `world` to access `world.monsters`.
2.  **Spawn Logic**: Add `spawnEnemy(game, world, monsterId, nameOverride)`:
    *   **Lookup Priority**:
        1.  Check `world.monsters` (The "Monster Manual").
        2.  Check `MONSTERS` (Static DB).
        3.  Fallback: Create a generic enemy with that name.
    *   Create the Active Enemy object.
    *   Push to `game.combat.enemies`.
    *   Add to `game.combat.initiative`.
3.  **Damage Logic**: Add `applyDamage(game, targetId, amount)`:
    *   Find enemy by ID (or fuzzy match name).
    *   Reduce `hp.current`.
    *   Check for death (`hp.current <= 0`).
    *   Return result string (e.g., "Goblin 1 takes 5 damage [HP: 2/7]").
4.  **Death Logic**: Handle enemy removal or marking as dead when HP hits 0.

## 4. Tag Integration: `TagProcessor.js`
Update `src/engine/TagProcessor.js` to drive this system via tags.
1.  **`COMBAT_START`**: Enhance to support spawning. (e.g., if the tag includes monster IDs, spawn them).
2.  **New Tag: `ENEMY_SPAWN`**:
    *   Format: `ENEMY_SPAWN[templateId|count]` or `ENEMY_SPAWN[templateId|nameOverride]`.
    *   Action: Calls `CombatManager.spawnEnemy`.
3.  **Update `DAMAGE` Tag**:
    *   Currently `DAMAGE[target|amount]`.
    *   Update logic: Check if `target` matches an active enemy. If so, call `CombatManager.applyDamage`.
    *   If target is "Player" or "You", keep existing logic.

## 5. UI Layer: Combat Visualization
The user needs to see these enemies.
1.  **Update `src/views/game.js`**:
    *   Find where the chat is rendered.
    *   We need a **Combat HUD**.
    *   Create a new component `src/components/CombatHUD.js`.
    *   It should render `game.combat.enemies` as a list of cards/bars showing: Name, HP Bar (green/red), AC, and current Conditions.
    *   Inject this HUD into the game view when `game.combat.active` is true.
    *   **Consistency**: The UI should match the existing application's design language and aesthetics (simple, clean, dark mode compatible).

## 6. System Prompt Updates
The AI needs to know how to use these new tools.
1.  **Update `src/utils/prompts/game-dm-prompt.js`**:
    *   Add `ENEMY_SPAWN` and updated `DAMAGE` examples to `DND_MECHANICS_EXAMPLES`.
    *   Example: `spawn_enemy: "You encounter 3 Goblins. ENEMY_SPAWN[goblin|3] COMBAT_START[Ambush!]"`
    *   Example: `enemy_damage: "You hit the Goblin! DAMAGE[goblin_1|6]"`
    *   Ensure the prompt explicitly instructs the AI to use `ENEMY_SPAWN` when introducing new hostile NPCs.

## 7. Testing
*   Create `src/engine/CombatManager.spec.js` using Vitest (if set up) or just a manual test script in `src/test-combat.js` that:
    1.  Starts combat.
    2.  Spawns a Goblin.
    3.  Deals damage to it.
    4.  Verifies HP update.
    5.  Kills it.

## Execution Rules
*   **No Frameworks**: Use `document.createElement`, `innerHTML`, etc.
*   **State**: Always mutate `game` state passed into functions.
*   **Tags**: Ensure the Regex in `src/data/tags.js` supports the new tags.

**Deliverables**:
1. `src/data/monsters.js`
2. Modified `src/engine/CombatManager.js`
3. Modified `src/engine/TagProcessor.js`
4. Modified `src/data/tags.js`
5. `src/components/CombatHUD.js`
6. Modified `src/views/game.js` to include the HUD.
7. `src/utils/migrations/backfill-monsters.js`
