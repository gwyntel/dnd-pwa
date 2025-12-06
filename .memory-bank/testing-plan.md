# D&D PWA Comprehensive Testing Plan

**Created:** 2025-12-06  
**Purpose:** Document all test coverage and gaps for the D&D PWA

---

## Current Test Inventory

### Existing Tests (9 files, 103 tests)

| File | Tests | Status |
|------|-------|--------|
| [BaseProcessor.test.js](file:///Users/gwyn/projects/dnd-pwa/src/engine/processors/BaseProcessor.test.js) | 20 | ✅ All pass |
| [NarrativeProcessor.test.js](file:///Users/gwyn/projects/dnd-pwa/src/engine/processors/NarrativeProcessor.test.js) | 15 | ✅ All pass |
| [InventoryProcessor.test.js](file:///Users/gwyn/projects/dnd-pwa/src/engine/processors/InventoryProcessor.test.js) | 25 | ✅ All pass |
| [CombatProcessor.test.js](file:///Users/gwyn/projects/dnd-pwa/src/engine/processors/CombatProcessor.test.js) | 17 | 🔴 2 failing |
| [RestProcessor.test.js](file:///Users/gwyn/projects/dnd-pwa/src/engine/processors/RestProcessor.test.js) | 5 | ✅ All pass |
| [SpellProcessor.test.js](file:///Users/gwyn/projects/dnd-pwa/src/engine/processors/SpellProcessor.test.js) | 0 | 🔴 Broken (window) |
| [TagParser.spec.js](file:///Users/gwyn/projects/dnd-pwa/src/engine/TagParser.spec.js) | 7 | ✅ All pass |
| [MechanicsEngine.test.js](file:///Users/gwyn/projects/dnd-pwa/src/engine/MechanicsEngine.test.js) | 11 | ✅ All pass |
| [game-dm-prompt.test.js](file:///Users/gwyn/projects/dnd-pwa/src/utils/prompts/game-dm-prompt.test.js) | 3 | ✅ All pass |

---

## Failing Tests to Fix

### 1. CombatProcessor - Immunity/Vulnerability

**File:** `src/engine/processors/CombatProcessor.test.js`

**Failing:**
- `should apply immunity`
- `should apply vulnerability`

**Investigation:**
```bash
npm test -- src/engine/processors/CombatProcessor.test.js
```

**Likely Issue:** The immunity/vulnerability logic in MechanicsEngine or tag processing has a mismatch with test expectations.

---

### 2. SpellProcessor - Window Not Defined

**File:** `src/engine/processors/SpellProcessor.test.js`

**Error:**
```
ReferenceError: window is not defined
❯ src/utils/auth.js:8:22
```

**Root Cause:** SpellProcessor imports something that eventually imports `auth.js`, which uses `window.location.origin` at module load time.

**Fix Options:**
1. Mock `window` in test setup:
```javascript
// At top of SpellProcessor.test.js
globalThis.window = { location: { origin: 'http://localhost:5173' } }
```

2. Lazy-load `window` usage in `auth.js`:
```javascript
// Change from:
const CALLBACK_URL = window.location.origin + "/auth/callback"
// To:
const getCallbackUrl = () => window.location.origin + "/auth/callback"
```

---

## Test Coverage Gaps

### 🔴 Critical Priority (Core Functionality)

#### 1. `dice.js` - Dice Rolling Core

**Why Critical:** Every roll in the game depends on this.

**Test Cases Needed:**
```
✅ Basic roll parsing (1d20, 2d6+3, etc.)
✅ Roll with modifiers
✅ Advantage/disadvantage rolling
✅ Critical hit detection
✅ Edge cases (0 dice, negative modifiers)
✅ formatRoll() output
```

**New File:** `src/utils/dice.test.js`

---

#### 2. `CombatManager.js` - Combat State Machine

**Why Critical:** Combat is core gameplay, complex state transitions.

**Test Cases Needed:**
```
✅ startCombat() initializes state correctly
✅ rollInitiative() orders combatants properly
✅ Initiative tie-breaking
✅ advanceTurn() cycles correctly
✅ getNextActor() returns correct entity
✅ spawnEnemy() adds to initiative
✅ applyDamage() reduces HP correctly
✅ Enemy death removes from initiative
✅ endCombat() cleans up state
✅ Player death handling
```

**New File:** `src/engine/CombatManager.test.js`

---

#### 3. `RollProcessor.js` - Roll Orchestration

**Why Critical:** Coordinates all dice rolls with game state.

**Test Cases Needed:**
```
✅ processRoll() handles basic rolls
✅ processSkillCheck() applies proficiency
✅ processSavingThrow() uses correct ability
✅ processAttackRoll() includes attack bonus
✅ Advantage/disadvantage application
✅ Roll metadata includes context
```

**New File:** `src/engine/processors/RollProcessor.test.js`

---

### 🟡 Important Priority

#### 4. `dice5e.js` - D&D 5e Specifics

**Test Cases:**
```
✅ buildDiceProfile() for each class
✅ Proficiency calculation by level
✅ Ability score modifiers
✅ Attack roll building
✅ Damage roll building
✅ Saving throw DC calculations
```

**New File:** `src/utils/dice5e.test.js`

---

#### 5. `SpellcastingManager.js`

**Test Cases:**
```
✅ hasSpellSlot() checks correctly
✅ consumeSpellSlot() decrements slot
✅ canCastSpell() validates requirements
✅ Concentration tracking
✅ Cantrip handling (no slot needed)
✅ Spell slot recovery on rest
```

**New File:** `src/engine/SpellcastingManager.test.js`

---

#### 6. `RenderProcessor.js`

**Test Cases:** Snapshot tests for HTML output
```
✅ renderRollResult() format
✅ renderCombatMessage() format
✅ renderSystemMessage() format
✅ renderDamageReport() format
```

**New File:** `src/engine/processors/RenderProcessor.test.js`

---

#### 7. `character-validation.js`

**Test Cases:**
```
✅ validateCharacter() accepts valid data
✅ Rejects missing required fields
✅ Normalizes stats format
✅ Handles legacy data migration
```

**New File:** `src/utils/character-validation.test.js`

---

### 🟢 Nice to Have

| Module | Test Priority | Notes |
|--------|---------------|-------|
| `EquipmentManager.js` | Low | AC calculation, equip/unequip |
| `RestManager.js` | Low | Short/long rest logic |
| `EffectsEngine.js` | Low | Effect application |
| `GameLoop.js` | Low | State transitions |
| `storage.js` | Medium | localStorage wrapper |
| `ai-provider.js` | Medium | Need mocked responses |

---

## Testing Commands

```bash
# Run all tests
npm test

# Run with coverage report
npm test -- --coverage

# Run specific test file
npm test -- src/engine/CombatManager.test.js

# Watch mode for development
npm test -- --watch

# Run only failing tests
npm test -- --reporter=verbose
```

---

## Test File Template

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('ModuleName', () => {
  beforeEach(() => {
    // Reset state before each test
  })

  describe('functionName', () => {
    it('should handle normal case', () => {
      // Arrange
      const input = { /* test data */ }
      
      // Act
      const result = functionName(input)
      
      // Assert
      expect(result).toEqual(expected)
    })

    it('should handle edge case', () => {
      // ...
    })
  })
})
```

---

## Mocking Guidelines

### Mocking Store
```javascript
vi.mock('../state/store.js', () => ({
  default: {
    get: vi.fn(() => ({ games: [], characters: [] })),
    update: vi.fn()
  }
}))
```

### Mocking Window
```javascript
// For modules using window.location
globalThis.window = {
  location: { origin: 'http://localhost:5173' }
}
```

### Mocking AI Provider
```javascript
vi.mock('../utils/ai-provider.js', () => ({
  sendChatCompletion: vi.fn(() => Promise.resolve({
    choices: [{ message: { content: 'Mocked response' } }]
  }))
}))
```

---

## E2E Testing Recommendations

For full end-to-end testing, consider:

1. **Playwright/Puppeteer** for browser automation
2. **Test scenarios:**
   - Create character → Start game → Send message → Verify AI response
   - Combat flow: Start → Roll initiative → Attack → End combat
   - Inventory: Pick up item → Equip → Verify AC change
   - Spellcasting: Cast spell → Verify slot consumed → Rest → Verify recovery

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Test files | 9 | 20+ |
| Passing tests | 101 | 200+ |
| Failing tests | 2 | 0 |
| Broken test files | 1 | 0 |
| Engine coverage | ~40% | 80% |
| Utils coverage | ~5% | 60% |
| Views coverage | 0% | 20% |
