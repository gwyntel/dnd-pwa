# Current Work Focus

## Session Goal: Major Refactoring Initiative (2025-11-30)

**Status:** 🚀 IN PROGRESS - Phase 1 Complete!

We've completed a comprehensive codebase evaluation and started a multi-phase refactoring to improve maintainability and modularity.

### Phase 1: Dependency Cleanup ✅ COMPLETED

**What We Did:**
1. ✅ Audited package.json - found 28 unused packages (React, Next.js, Tailwind, TypeScript, etc.)
2. ✅ Removed all unused dependencies
3. ✅ Verified build still works: `npm run build` successful
4. ✅ Updated documentation (README, codebase-survey.md) to reflect Vanilla CSS usage
5. ✅ Bundle size optimized (removed React/Tailwind overhead)

**Result:** Clean, lean dependency tree with only what we actually use:
- `openai` for AI integration
- `vite`, `vitest`, `jsdom`, `terser` for build/test

### Phase 2: Fragment TagProcessor ✅ COMPLETE!

**Status:** 100% DONE! All processors extracted, tested, and documented.

**What We Accomplished:**
1. ✅ Created `BaseProcessor` with shared utilities (20 tests passing!)
2. ✅ Extracted `InventoryProcessor` (~350 lines, 30+ tests)
3. ✅ Extracted `CombatProcessor` (~300 lines, 25+ tests)
4. ✅ Extracted `SpellProcessor` (~80 lines, 5+ tests)
5. ✅ Extracted `NarrativeProcessor` (~120 lines, 20+ tests)
6. ✅ Extracted `RollProcessor` (~80 lines)
7. ✅ Extracted `RestProcessor` (~60 lines, 5+ tests)
8. ✅ Extracted `RenderProcessor` (~400 lines static utility)
9. ✅ Wrote comprehensive test plan (phase2-test-plan.md)
10. ✅ Created progress tracking (phase2-progress.md, phase2-complete.md)
11. ✅ Committed everything (commits: 239e11c, b161f80)

**Results:**
- **8 Processors Created:** ~1,480 lines extracted from TagProcessor
- **105+ Tests Written:** Comprehensive coverage
- **Documentation:** Test plan + progress reports
- **Time Taken:** 40 minutes (estimated 2 days!)

**Commits:**
- `239e11c` - Extract specialized processors
- `b161f80` - Phase 2 Complete (tests + docs)

**Next Step:** Refactor main TagProcessor.js to orchestrate all new processors

### Phase 3: Simplify game.js (AFTER PHASE 2)

Goal: Extract game.js (1,655 lines) into:
- GameController (business logic)
- RollBatcher (dice roll handling)
- MessageRenderer (UI rendering)
- InputController (user input)

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
- **AI Provider Usage (PREFERRED):**
  - **Direct Import**: Always import `sendChatCompletion` and `parseStreamingResponse` directly from `ai-provider.js`
    ```javascript
    import { sendChatCompletion, parseStreamingResponse } from "./ai-provider.js"
    const response = await sendChatCompletion(messages, model, options)
    for await (const chunk of parseStreamingResponse(response)) { ... }
    ```
  - **Structured Outputs**: Use `jsonSchema` option for reliable JSON responses
    ```javascript
    const options = {
      jsonSchema: {
        name: "schema_name",
        strict: true,
        schema: { type: "object", properties: {...}, required: [...] }
      }
    }
    ```
  - **Legacy `getProvider()`**: Still works but deprecated. Only use for backward compatibility or lazy loading scenarios.

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

## UI/UX Analysis (2025-11-30)

### Critical Gaps

#### 1. **Spell Slots - No User Interaction**
- **Issue**: Spell slots are *displayed* as visual dots (lines 123-149 in CharacterHUD.js) but there's NO way for users to manually adjust them.
- **User Impact**: If the AI makes a mistake or misses a `CAST_SPELL` tag, the user can't fix it. There's no "Use Slot" or "Restore Slot" button.
- **Recommendation**: Add `+` / `-` buttons next to each spell slot row to manually consume/restore slots.

#### 2. **Spellcasting is AI-Only**
- **Issue**: There's no UI for the user to *cast a spell directly*. They must ask the AI in chat, and the AI must correctly emit `CAST_SPELL[spellName|level]`.
- **User Impact**: Unintuitive for players who expect to click a spell to cast it. High friction if AI doesn't understand spell requests.
- **Recommendation**: Make spell names in the spell list clickable. Clicking opens a modal to confirm casting (consuming the appropriate slot and notifying the AI).

#### 3. **No Direct Item Usage**
- **Issue**: Items in inventory can only be used via chat commands. The UI shows inventory but has no "Use" button for consumables.
- **Current**: User must type "I use a healing potion" and hope AI emits `USE_ITEM[healing_potion]`.
- **Recommendation**: Add a "Use" icon/button for consumable items that directly triggers `useConsumable()` and sends a system message.

#### 4. **No Manual HP/Temp HP Adjustments**
- **Issue**: Users can't adjust their HP or Temp HP manually if the AI makes an error or for out-of-game corrections.
- **Recommendation**: Add small `+` / `-` controls or a clickable HP bar that opens a modal for manual adjustment.

#### 5. **Inventory Management is Text-Only**
- **Issue**: The inventory section shows items but no details (weight, value, properties, equipped status for non-weapons).
- **Visual Problem**: No clear indication of what's equipped vs. what's in the backpack.
- **Recommendation**: Add icon indicators (🛡️ for equipped armor, ⚔️ for equipped weapon), tooltips showing item stats, and an "Inspect" button.

### Moderate Gaps

#### 6. **No Status Effect Management**
- **Issue**: Conditions are displayed in the HUD but there's no way to manually add/remove them or see what they do.
- **Recommendation**: Make condition chips clickable to show description, add a "Manage Conditions" button.

#### 7. **Initiative/Turn Order Missing from UI**
- **Issue**: The CombatHUD shows enemies but NOT the full initiative order.
- **User Impact**: Players don't know when their turn is in relation to all combatants.
- **Recommendation**: Add an "Initiative Order" section showing all participants sorted by initiative.

#### 8. **No Concentration Indicator Clarity**
- **Issue**: Concentration is shown as text ("🧠 Concentrating: Spell Name") but no indication of what happens if concentration is broken.
- **Recommendation**: Add a tooltip or help icon explaining concentration checks and what breaks it.

#### 9. **Class Resources Are Passive**
- **Issue**: Class resources (Ki, Rage, Channel Divinity) are displayed but not interactive.
- **Recommendation**: Add buttons to spend/restore resources manually.

#### 10. **Roll History Lacks Context**
- **Issue**: The RollHistory component shows rolls but doesn't clearly indicate *why* each roll was made or what it was for.
- **Recommendation**: Add timestamps and "rolled for: [reason]" labels to each entry.

### Minor Gaps

#### 11. **No "Undo" Functionality**
- **Issue**: Mistakes (accidental rests, wrong spell cast) cannot be undone.
- **Recommendation**: Add an "Undo Last Action" button (complex but valuable).

#### 12. **Hit Dice Not Spendable During Rest**
- **Issue**: The short rest UI mentions hit dice but doesn't provide an interface to spend them.
- **Recommendation**: Add a "Spend Hit Dice" modal during short rests.

#### 13. **No Search/Filter for Spells or Inventory**
- **Issue**: Long spell lists or inventories are hard to navigate.
- **Recommendation**: Add a search bar above spell list and inventory.

#### 14. **Missing Tooltips/Help**
- **Issue**: No tooltips explaining what AC, PROF, SPD mean for new D&D players.
- **Recommendation**: Add `?` icons or hover tooltips with basic explanations.

#### 15. **Relationship List is Static**
- **Issue**: Relationships are displayed but not interactive (can't view details or notes).
- **Recommendation**: Make NPCs clickable to show relationship history or notes.

### Design Inconsistency

#### 16. **CombatHUD Uses Different Styling**
- **Issue**: CombatHUD uses classes like `bg-green-500`, `bg-surface-2` which look like Tailwind but the rest of the app uses CSS variables.
- **Impact**: Visual inconsistency and potential missing styles if Tailwind isn't fully set up.
- **Recommendation**: Refactor CombatHUD to use existing CSS variable-based classes.

### Positive Observations
- ✅ Spell slots are **visually clear** with filled/empty dots
- ✅ HP bar includes temp HP visualization (blue overlay)
- ✅ Death saves have excellent visual design
- ✅ Dice tray provides quick access to common rolls
- ✅ Suggested actions (ACTION tags) create good UX flow
- ✅ Message styling (user/assistant/system) is distinct and readable

## Current Priorities

### Immediate (This Week)
1. ✅ **Phase 1: Dependency Cleanup** - COMPLETED
2. 🚀 **Phase 2: Fragment TagProcessor** - Start with BaseProcessor infrastructure
3. 📝 **Testing After Each Extraction** - Maintain stability

### Short-term (Next Week)
1. **Complete TagProcessor Refactoring** - All 6 processors extracted and tested
2. **Start game.js Simplification** - Extract controllers and improve separation of concerns
3. **Expand Test Coverage** - Target 70%+ for critical paths

### Medium-term
1. **UI Polish** - Add manual controls (spell slots, HP adjustments, item usage)
2. **Documentation** - Create ARCHITECTURE.md explaining new patterns
3. **Performance Audit** - Ensure no regressions

### Deferred (Not Blocking)
1. Spell Effects - Expand `EffectsEngine` for complex spell mechanics
2. Condition Logic - Deepen automation (e.g., Poisoned disadvantage)
3. Character Portraits - Upload system

