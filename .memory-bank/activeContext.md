# Current Work Focus

## Session Goal: Context Optimization & Schema Analysis

**Status:** ✅ COMPLETED

The focus was on optimizing the AI context injection to solve the "monster manual dump" problem. We implemented a strategy to compress monster and item lists in the system prompt and added a compressed spell list to support the `LEARN_SPELL` tag.

## What Was Accomplished

1. **Context Optimization**
   - Updated `game-dm-prompt.js` to use compressed formats for lists.
   - **Monsters:** `id (Name, CR, Type)` instead of full stat blocks.
   - **Items:** `id (Name, Rarity, Type)` for ALL items (seed + custom).
   - **Spells:** Added `formatSpellList()` to output `id (Name, Level, School)` from `COMMON_SPELLS`.

2. **Verification**
   - Created `src/utils/prompts/game-dm-prompt.test.js` to verify prompt formatting.
   - Verified that the system prompt size is significantly reduced while maintaining AI awareness of available content.

## Next Steps

### Immediate
1. **Monitor Context Usage** - Verify token savings in real gameplay.
2. **User Feedback** - Ensure AI still correctly identifies and uses items/monsters.

### Short-term
1. **Spell Effects** - Expand `EffectsEngine` to handle more complex spell effects beyond simple tags.
2. **Condition Logic** - Deepen condition mechanics (e.g., Poisoned disadvantage automation).

## Active Decisions & Considerations

### Architecture Decisions
- **Mechanics Engine:** Dedicated engine for rule enforcement, separating logic from `TagProcessor`.
- **Passive Effects:** Items use `EffectsEngine` to generate tags on equip/unequip, ensuring consistency with the tag-based system.
- **System Messages:** The engine generates system messages for all mechanic triggers, ensuring the AI stays informed of the game state.

### Technical Preferences
- **Vanilla JS:** Continuing with no-framework approach.
- **Tag-Driven:** All state changes are driven by tags, maintaining a single flow of control.

## Learnings & Insights

### What Worked Well
- **Context Compression:** Summarizing lists (ID, Name, Type) is a highly effective way to reduce token usage while keeping the AI "aware" of the world. The AI can then use tags to interact with these entities, relying on the engine for the heavy lifting (stats, mechanics).
- **System Prompt Regeneration:** Regenerating the system prompt every turn ensures the AI always has the latest state, but requires careful management of prompt size to avoid blowing the context window.

### Challenges Encountered
- **Legacy Data:** Migration scripts were essential for adding new fields to existing entities.

## Game Review Findings (2025-11-30)

### Design Gaps & Technical Debt
1. **TagProcessor Complexity**: `TagProcessor.js` is a "God Class" (1300+ lines) handling inventory, combat, spells, and effects. It violates the Single Responsibility Principle and is becoming hard to maintain.
   - *Recommendation*: Refactor into smaller, specialized processors (e.g., `InventoryProcessor`, `CombatProcessor`) orchestrated by a main `TagDispatcher`.
2. **UI/Logic Mixing**: `src/views/game.js` mixes UI rendering (HTML string generation) with complex event handling and game logic.
   - *Recommendation*: Move complex logic to the Engine layer or specialized hooks/controllers.
3. **AI Migration Mutability**: `src/utils/ai-migration.js` modifies state objects in place before calling `store.update`. While functional due to the current store implementation, it risks subtle bugs if the store implementation changes to use immutable proxies.

### Good Design Practices
1. **Centralized Store**: The `Store` class (`src/state/store.js`) effectively manages state with in-memory caching and debounced persistence, preventing performance bottlenecks.
2. **Modular Engines**: The extraction of `CombatManager`, `MechanicsEngine`, and `SpellcastingManager` keeps core logic separate from the UI.
3. **Robust Initialization**: `init.sh` and `main.js` provide a solid, self-healing startup process with migrations.

### Neat Things
1. **Roll Batching**: The system in `game.js` that aggregates multiple dice rolls into a single AI follow-up is a clever UX pattern that reduces API chatter and improves narrative flow.
2. **Real-time Tag Processing**: The ability to execute game mechanics (like damage or location changes) *while* the AI is still streaming the description creates a highly responsive feel.
3. **Lazy Content Generation**: The "Seed + Backfill" strategy for items and monsters allows the world to feel infinite without a massive initial database.

## Mechanics Consistency Analysis (2025-11-30)

### Compliance with D&D 5e Rules
- **Combat**: Initiative and turn order are standard. Missing "Surprise" mechanics and detailed tie-breaking.
- **Damage**: Resistance/Vulnerability/Immunity are correctly calculated (half/double/zero). Critical hits correctly double dice only.
- **Resting**: Short/Long rest resource recovery is accurate. Long rest correctly resets spell slots and half hit dice.
- **Spellcasting**: Slot consumption is correct. Concentration checks are triggered by damage (DC calculation is correct).
- **Equipment**: AC calculation respects armor types and DEX limits. Finesse/Ranged weapons use correct ability scores.

### Identified Gaps & Inconsistencies
1. **CombatManager vs MechanicsEngine**: `CombatManager.applyDamage` is a legacy function that bypasses resistance/immunity logic. It should be deprecated in favor of `MechanicsEngine.applyDamageWithType`.
2. **Weapon Properties**: `Heavy`, `Two-Handed`, and `Versatile` properties are parsed but not mechanically enforced (e.g., small creatures don't get disadvantage with heavy weapons).
3. **AC Stacking**: "Natural Armor" (e.g., Draconic Resilience) and spell-based AC (e.g., *Mage Armor*) are not explicitly handled in `calculateAC`.
4. **Range Increments**: Ranged attacks do not automatically apply disadvantage for long range (requires AI or user to manually add disadvantage).

## Current Priorities

1. **Monitor Stability**
2. **Expand Spell Mechanics**
3. **Enhance UI Feedback**
4. **Refactor TagProcessor** (New)
5. **Unify Damage Logic** (New - Deprecate CombatManager.applyDamage)
