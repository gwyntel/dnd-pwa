# D&D PWA Maintainability Audit

**Audit Date:** 2025-12-06  
**Auditor:** AI Code Audit  
**Commit:** `8f9e0b2` (feat: CORS detection and guidance in onboarding)

---

## Executive Summary

The D&D PWA codebase is in **good health** following the Phase 2 refactoring. The extraction of 8 specialized processors from `TagProcessor.js` significantly improved maintainability. Key areas needing attention:

| Priority | Area | Issue |
|----------|------|-------|
| 🔴 High | `game.js` | 1,655 lines, mixes UI/logic |
| 🔴 High | Test Coverage | Several core modules untested |
| 🟡 Medium | `CombatManager.js` | Complex state, no tests |
| 🟡 Medium | `RenderProcessor.js` | 21KB, no tests |
| 🟢 Low | Documentation | techContext.md outdated |

---

## Rating Scale

| Rating | Meaning | Contributor Experience |
|--------|---------|------------------------|
| ⭐⭐⭐⭐⭐ | Excellent | Easy to understand, modify, test |
| ⭐⭐⭐⭐ | Good | Minor friction, well-organized |
| ⭐⭐⭐ | Acceptable | Needs documentation or restructuring |
| ⭐⭐ | Needs Work | Hard to modify safely |
| ⭐ | Critical | High risk of introducing bugs |

---

## Engine Layer (`src/engine/`)

### Processors (`src/engine/processors/`)

| File | Rating | Lines | Tests | Notes |
|------|--------|-------|-------|-------|
| [BaseProcessor.js](file:///Users/gwyn/projects/dnd-pwa/src/engine/processors/BaseProcessor.js) | ⭐⭐⭐⭐⭐ | 67 | 20 ✅ | **Exemplary.** Clean utilities, 100% tested. |
| [NarrativeProcessor.js](file:///Users/gwyn/projects/dnd-pwa/src/engine/processors/NarrativeProcessor.js) | ⭐⭐⭐⭐⭐ | 102 | 15 ✅ | **Excellent.** Focused, well-tested. |
| [RestProcessor.js](file:///Users/gwyn/projects/dnd-pwa/src/engine/processors/RestProcessor.js) | ⭐⭐⭐⭐⭐ | 61 | 5 ✅ | **Clean.** Simple and correct. |
| [InventoryProcessor.js](file:///Users/gwyn/projects/dnd-pwa/src/engine/processors/InventoryProcessor.js) | ⭐⭐⭐⭐ | 356 | 25 ✅ | Large but well-organized. Handles equip/unequip edge cases. |
| [CombatProcessor.js](file:///Users/gwyn/projects/dnd-pwa/src/engine/processors/CombatProcessor.js) | ⭐⭐⭐⭐ | 330 | 17 (2🔴) | Good separation. **2 failing tests** (immunity/vulnerability). |
| [SpellProcessor.js](file:///Users/gwyn/projects/dnd-pwa/src/engine/processors/SpellProcessor.js) | ⭐⭐⭐ | 180 | 0 (🔴broken) | Test file has `window is not defined` error. Needs mocking. |
| [RollProcessor.js](file:///Users/gwyn/projects/dnd-pwa/src/engine/processors/RollProcessor.js) | ⭐⭐⭐ | 95 | 0 ❌ | **Needs tests.** Dice roll orchestration logic. |
| [RenderProcessor.js](file:///Users/gwyn/projects/dnd-pwa/src/engine/processors/RenderProcessor.js) | ⭐⭐⭐ | 614 | 0 ❌ | **Large.** HTML string generation. Should have snapshot tests. |

> **Recommendation:** Fix SpellProcessor tests, add tests for RollProcessor and RenderProcessor.

---

### Core Engines

| File | Rating | Lines | Tests | Notes |
|------|--------|-------|-------|-------|
| [TagProcessor.js](file:///Users/gwyn/projects/dnd-pwa/src/engine/TagProcessor.js) | ⭐⭐⭐ | ~170 | 0 ❌ | Orchestrates processors. Needs integration tests. |
| [TagParser.js](file:///Users/gwyn/projects/dnd-pwa/src/engine/TagParser.js) | ⭐⭐⭐⭐ | 187 | 7 ✅ | Core parsing logic tested. Could use more edge cases. |
| [MechanicsEngine.js](file:///Users/gwyn/projects/dnd-pwa/src/engine/MechanicsEngine.js) | ⭐⭐⭐⭐ | 157 | 11 ✅ | Good D&D 5e implementation. Damage types working. |
| [CombatManager.js](file:///Users/gwyn/projects/dnd-pwa/src/engine/CombatManager.js) | ⭐⭐⭐ | 448 | 0 ❌ | **Complex state management.** High risk area. |
| [SpellcastingManager.js](file:///Users/gwyn/projects/dnd-pwa/src/engine/SpellcastingManager.js) | ⭐⭐⭐⭐ | 293 | 0 ❌ | Good logic, needs tests. |
| [RestManager.js](file:///Users/gwyn/projects/dnd-pwa/src/engine/RestManager.js) | ⭐⭐⭐⭐ | 162 | 0 ❌ | Clean implementation. |
| [EquipmentManager.js](file:///Users/gwyn/projects/dnd-pwa/src/engine/EquipmentManager.js) | ⭐⭐⭐⭐ | 195 | 0 ❌ | AC calculation correct per 5e. |
| [EffectsEngine.js](file:///Users/gwyn/projects/dnd-pwa/src/engine/EffectsEngine.js) | ⭐⭐⭐⭐ | 130 | 0 ❌ | Simple effect resolution. |
| [SpellGenerator.js](file:///Users/gwyn/projects/dnd-pwa/src/engine/SpellGenerator.js) | ⭐⭐⭐ | 348 | 0 ❌ | AI-dependent. Needs mocked tests. |
| [ItemGenerator.js](file:///Users/gwyn/projects/dnd-pwa/src/engine/ItemGenerator.js) | ⭐⭐⭐ | 178 | 0 ❌ | AI-dependent. |
| [MonsterGenerator.js](file:///Users/gwyn/projects/dnd-pwa/src/engine/MonsterGenerator.js) | ⭐⭐⭐ | 167 | 0 ❌ | AI-dependent. |
| [GameLoop.js](file:///Users/gwyn/projects/dnd-pwa/src/engine/GameLoop.js) | ⭐⭐⭐ | 225 | 0 ❌ | Game state transitions. |

> **Recommendation:** Prioritize CombatManager tests - this is the highest risk untested module.

---

## Utility Layer (`src/utils/`)

| File | Rating | Lines | Tests | Notes |
|------|--------|-------|-------|-------|
| [dice.js](file:///Users/gwyn/projects/dnd-pwa/src/utils/dice.js) | ⭐⭐⭐⭐ | 337 | 0 ❌ | **Core utility.** Well-written but untested. |
| [dice5e.js](file:///Users/gwyn/projects/dnd-pwa/src/utils/dice5e.js) | ⭐⭐⭐⭐ | 608 | 0 ❌ | Comprehensive 5e implementation. Document with tests. |
| [ai-provider.js](file:///Users/gwyn/projects/dnd-pwa/src/utils/ai-provider.js) | ⭐⭐⭐ | 320 | 0 ❌ | Complex streaming. Needs mocked tests. |
| [storage.js](file:///Users/gwyn/projects/dnd-pwa/src/utils/storage.js) | ⭐⭐⭐⭐ | 420 | 0 ❌ | Simple API. |
| [auth.js](file:///Users/gwyn/projects/dnd-pwa/src/utils/auth.js) | ⭐⭐⭐ | 163 | 0 ❌ | Uses `window.location` - hard to test. |
| [cors-detector.js](file:///Users/gwyn/projects/dnd-pwa/src/utils/cors-detector.js) | ⭐⭐⭐⭐ | 108 | 0 ❌ | Clean detection logic. |
| [character-validation.js](file:///Users/gwyn/projects/dnd-pwa/src/utils/character-validation.js) | ⭐⭐⭐⭐ | 115 | 0 ❌ | Validation should be tested. |
| [game-dm-prompt.js](file:///Users/gwyn/projects/dnd-pwa/src/utils/prompts/game-dm-prompt.js) | ⭐⭐⭐⭐ | ~300 | 3 ✅ | Prompt generation tested. |

---

## View Layer (`src/views/`)

| File | Rating | Lines | Tests | Priority |
|------|--------|-------|-------|----------|
| [game.js](file:///Users/gwyn/projects/dnd-pwa/src/views/game.js) | ⭐⭐ | 1655 | 0 ❌ | 🔴 **HIGH.** Mixes UI, state, and business logic. Split into GameController, MessageRenderer, InputHandler. |
| [characters.js](file:///Users/gwyn/projects/dnd-pwa/src/views/characters.js) | ⭐⭐⭐ | 1217 | 0 ❌ | Large but organized by function. |
| [worlds.js](file:///Users/gwyn/projects/dnd-pwa/src/views/worlds.js) | ⭐⭐⭐ | 1147 | 0 ❌ | Similar structure to characters. |
| [home.js](file:///Users/gwyn/projects/dnd-pwa/src/views/home.js) | ⭐⭐⭐⭐ | 792 | 0 ❌ | Authentication flow clear. |
| [settings.js](file:///Users/gwyn/projects/dnd-pwa/src/views/settings.js) | ⭐⭐⭐⭐ | 898 | 0 ❌ | Well-organized sections. |
| [models.js](file:///Users/gwyn/projects/dnd-pwa/src/views/models.js) | ⭐⭐⭐⭐ | 385 | 0 ❌ | Clean model selection. |

> **Recommendation:** Phase 3 refactoring should split `game.js` into separate controllers (~400 lines each).

---

## Data Layer (`src/data/`)

| File | Rating | Lines | Notes |
|------|--------|-------|-------|
| [tags.js](file:///Users/gwyn/projects/dnd-pwa/src/data/tags.js) | ⭐⭐⭐⭐⭐ | 251 | **Excellent.** Central tag definitions, well-documented. |
| [items.js](file:///Users/gwyn/projects/dnd-pwa/src/data/items.js) | ⭐⭐⭐⭐⭐ | 205 | Clean item schema. |
| [monsters.js](file:///Users/gwyn/projects/dnd-pwa/src/data/monsters.js) | ⭐⭐⭐⭐ | 178 | Good template format. |
| [spells.js](file:///Users/gwyn/projects/dnd-pwa/src/data/spells.js) | ⭐⭐⭐⭐ | 108 | Common spells defined. |
| [classes.js](file:///Users/gwyn/projects/dnd-pwa/src/data/classes.js) | ⭐⭐⭐⭐ | 929 | Large but structured D&D data. |
| [worlds.js](file:///Users/gwyn/projects/dnd-pwa/src/data/worlds.js) | ⭐⭐⭐⭐ | 2053 | Template-heavy, well-organized. |
| [archetypes.js](file:///Users/gwyn/projects/dnd-pwa/src/data/archetypes.js) | ⭐⭐⭐⭐⭐ | 301 | Clean character templates. |
| [feats.js](file:///Users/gwyn/projects/dnd-pwa/src/data/feats.js) | ⭐⭐⭐⭐ | 504 | Comprehensive feat definitions. |

---

## Priority Action Items

### 🔴 Critical (Do First)

1. **Fix SpellProcessor.test.js** - Mock `window` object
2. **Fix 2 CombatProcessor tests** - Immunity/vulnerability logic
3. **Add CombatManager tests** - Highest risk untested module

### 🟡 Important (This Week)

4. **Add dice.js tests** - Core utility, affects all rolls
5. **Add RollProcessor tests** - Ensures roll handling works
6. **Add RenderProcessor snapshot tests** - Prevent UI regressions

### 🟢 Nice to Have (Ongoing)

7. Split `game.js` into controllers (Phase 3)
8. Add character-validation tests
9. Document `ai-provider.js` streaming behavior

---

## Metrics Summary

| Metric | Value |
|--------|-------|
| **Total Test Files** | 9 |
| **Tests Passing** | 103 |
| **Tests Failing** | 2 |
| **Broken Test Files** | 1 |
| **Untested Core Modules** | 12 |
| **Lines of Code (engine/)** | ~3,500 |
| **Lines of Code (views/)** | ~6,000 |
| **Lines of Code (utils/)** | ~2,500 |

---

## Conclusion

The codebase is maintainable and well-architected for its size. The Phase 2 processor extraction was successful. The main improvements needed are:

1. **Fix broken tests** (2 failing + 1 broken file)
2. **Test critical paths** (dice, combat, rolls)
3. **Refactor game.js** (Phase 3 priority)

A contributor joining the project would find the code readable, especially with the modular processor pattern. Adding tests will make contributions safer.
