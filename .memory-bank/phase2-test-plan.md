# Phase 2 Testing Plan

**Date:** 2025-11-30  
**Target:** Modular Tag Processor Architecture  
**Status:** Ready for Testing

## Overview

We've refactored TagProcessor from a 1,389-line "God Class" into 8 specialized processors. This test plan ensures nothing broke during the extraction.

---

## Test Strategy

### 1. **Unit Tests** (Automated)
Each processor has independent unit tests to verify isolated functionality.

### 2. **Integration Tests** (Automated)  
Verify processors work together through the main TagProcessor.

### 3. **Manual Gameplay Tests** (Manual)
Real-world gameplay scenarios to catch edge cases.

---

## 1. Unit Tests (Run via `npm test`)

### ✅ BaseProcessor.test.js
**Coverage:** Shared utilities for all processors

| Test | What It Validates |
|------|-------------------|
| Constructor | Initializes game, character, data, world |
| ensureArray | Creates missing arrays, preserves existing |
| ensureObject | Creates missing objects, replaces null |
| ensureNumber | Creates missing numbers with defaults |
| sanitize | Trims whitespace, removes newlines |
| createTagKey | Generates unique tag tracking keys |
| createSystemMessage | Creates properly formatted system messages |

**Expected:** 20/20 tests passing ✅

---

### ✅ InventoryProcessor.test.js
**Coverage:** Inventory, gold, equipment, item usage

| Test Category | Scenarios |
|---------------|-----------|
| **upsertItem** | - Add new item to empty inventory<br>- Increase quantity of existing item<br>- Decrease quantity with negative delta<br>- Remove item when quantity reaches 0<br>- Equip/unequip items<br>- Handle invalid/empty names<br>- Sanitize names with newlines |
| **changeGold** | - Add gold<br>- Subtract gold<br>- Not go below 0<br>- Round to 2 decimals<br>- Handle string numbers<br>- Reject invalid input<br>- Initialize currency if missing |
| **addStatus** | - Add new status<br>- Not duplicate existing status<br>- Handle legacy string conditions |
| **removeStatus** | - Remove existing status<br>- Return false if not found<br>- Handle legacy conditions |
| **processRealtime Tags** | - Process INVENTORY_ADD<br>- Process GOLD_CHANGE<br>- Skip already processed tags |

**Expected:** 30+ tests passing ✅

---

### ✅ CombatProcessor.test.js
**Coverage:** Damage, healing, temp HP, defense modifiers

| Test Category | Scenarios |
|---------------|-----------|
| **processDamage** | - Apply damage to player<br>- Handle dice notation<br>- Not go below 0 HP<br>- Apply damage to enemy<br>- Mark enemy as dead at 0 HP |
| **processHeal** | - Heal player<br>- Handle dice notation<br>- Not exceed max HP |
| **processTempHP** | - Give temporary HP |
| **applyDefenseModifier** | - Apply resistance<br>- Remove resistance<br>- Apply immunity<br>- Apply vulnerability |
| **resolveTarget** | - Resolve "player" and "you"<br>- Resolve enemy by name<br>- Return null for unknown |

**Expected:** 25+ tests passing ✅

---

### ✅ NarrativeProcessor.test.js
**Coverage:** Location, relationships, XP, quests, actions

| Test Category | Scenarios |
|---------------|-----------|
| **processLocation** | - Update current location<br>- Add to visited locations<br>- Not duplicate locations<br>- Handle empty location |
| **processRelationship** | - Add new relationship<br>- Update existing<br>- Handle negative values<br>- Reject invalid format |
| **processAction** | - Add suggested action<br>- Not duplicate actions |
| **processXPGain** | - Add XP to character<br>- Trigger level up message<br>- Handle missing reason |
| **processQuestAdd** | - Add quest to log<br>- Not duplicate quests |

**Expected:** 20+ tests passing ✅

---

### ✅ SpellProcessor.test.js
**Coverage:** Spellcasting, learning spells, concentration

| Test Category | Scenarios |
|---------------|-----------|
| **processLearnSpell** | - Learn new spell< br>- Not learn duplicate<br>- Case-insensitive names<br>- Handle empty names<br>- Set default properties |

**Expected:** 5+ tests passing ✅

---

### ✅ RestProcessor.test.js
**Coverage:** Short rest, long rest, hit dice

| Test Category | Scenarios |
|---------------|-----------|
| **processRealtimeTags** | - Process SHORT_REST<br>- Process LONG_REST<br>- Process HIT_DIE_ROLL<br>- Use default duration<br>- Skip processed tags |

**Expected:** 5+ tests passing ✅

---

### 🔄 RenderProcessor.test.js (TODO after integration)
**Coverage:** Badge rendering, markdown parsing

| Test Category | Scenarios |
|---------------|-----------|
| **stripTags** | - Replace tags with badge tokens<br>- Clean up whitespace<br>- Handle multiple tags |
| **parseMarkdown** | - Bold, italic, code formatting<br>- Preserve badge tokens<br>- Convert newlines to BR |
| **createBadgeToken** | - Encode JSON data<br>- Generate unique tokens |
| **renderInlineBadgeHtml** | - Render all badge types<br>- Escape HTML properly |

**Expected:** 20+ tests

---

## 2. Integration Tests

### Test: Main TagProcessor Orchestration
**File:** `TagProcessor.test.js` (to be created)

```javascript
describe('TagProcessor Integration', () => {
  it('should process combined inventory and combat tags', () => {
    const text = 'INVENTORY_ADD[Sword|1] DAMAGE[player|10|slashing]'
    // Verify both processors are called
    // Verify state is correctly updated
  })

  it('should handle tag chains (equip → AC change)', () => {
    const text = 'INVENTORY_EQUIP[Leather Armor]'
    // Verify AC is recalculated by InventoryProcessor
  })

  it('should process tags from item effects', () => {
    const text = 'USE_ITEM[Healing Potion]'
    // Verify HEAL tag from item effects is processed
  })
})
```

**Expected:** 10+ integration tests passing

---

## 3. Manual Gameplay Testing

### Test Session 1: Character & Inventory
**Duration:** 10 minutes  
**Objective:** Verify inventory and equipment systems

1. **Start New Game**
   - Create test character "Test Warrior"
   - Verify character sheet displays correctly

2. **Inventory Management**
   - Ask AI: "I find a sword"
   - Expected: `INVENTORY_ADD[Sword|1]` → Sword appears in inventory
   - Ask AI: "I equip the sword"
   - Expected: `INVENTORY_EQUIP[Sword]` → Sword shows as equipped
   - Ask AI: "I pick up 50 gold pieces"
   - Expected: `GOLD_CHANGE[50]` → Gold displayed: 50 GP

3. **Equipment Effects**
   - Ask AI: "I find leather armor and put it on"
   - Expected: AC updates from base to new value
   - Verify CharacterHUD shows new AC

**Pass Criteria:** All inventory operations persist, AC updates automatically

---

### Test Session 2: Combat Flow
**Duration:** 15 minutes  
**Objective:** Verify combat mechanics

1. **Initiate Combat**
   - Ask AI: "I attack the goblin"
   - Expected: `ENEMY_SPAWN[goblin]` + `COMBAT_START[]`
   - Verify CombatHUD appears
   - Verify initiative rolls occur

2. **Damage & Healing**
   - Ask AI to have goblin attack
   - Expected: `DAMAGE[player|5|slashing]` → HP decreases
   - Verify HP bar updates in real-time
   - Ask AI: "I drink a healing potion"
   - Expected: `USE_ITEM[healing_potion]` → HP increases

3. **Advanced Combat**
   - Ask AI: "I cast Shield spell"
   - Expected: `CAST_SPELL[Shield|1]` → Spell slot consumed
   - Verify spell slot dots update
   - Ask AI to apply fire damage
   - Expected: Damage calculation respects resistances

**Pass Criteria:** Combat flows smoothly, all tags processed, UI updates in real-time

---

### Test Session 3: Narrative & Progression
**Duration:** 10 minutes  
**Objective:** Verify narrative systems

1. **Location Tracking**
   - Ask AI: "I travel to the forest"
   - Expected: `LOCATION[Forest]` → Location badge appears
   - Verify location history shows "Forest"
   - Verify fast travel shows "Forest" option

2. **Relationships**
   - Ask AI: "I help the shopkeeper"
   - Expected: `RELATIONSHIP[Shopkeeper|5]` → Relationship tracked
   - Verify relationships display updates

3. **XP & Leveling**
   - Ask AI: "I defeat the goblin"
   - Expected: `XP_GAIN[50|Defeated goblin]` → XP increases
   - If at threshold, verify level up modal appears

**Pass Criteria:** All narrative tags update game state correctly

---

### Test Session 4: Spells & Rest
**Duration:** 10 minutes  
**Objective:** Verify spell and rest mechanics

1. **Spellcasting**
   - Create a wizard character
   - Ask AI: "I cast Magic Missile at level 1"
   - Expected: `CAST_SPELL[Magic Missile|1]` → Slot consumed
   - Verify spell slot UI updates immediately

2. **Concentration**
   - Ask AI: "I cast Bless" (concentration spell)
   - Expected: `CONCENTRATION_START[Bless]` → Concentration indicator shows
   - Take damage
   - Verify concentration check occurs

3. **Resting**
   - Ask AI: "I take a short rest"
   - Expected: `SHORT_REST[60]` → Resources partially restored
   - Verify hit dice can be spent
   - Ask AI: "I take a long rest"
   - Expected: `LONG_REST[8]` → HP and slots fully restored

**Pass Criteria:** Spell slots, concentration, and rest mechanics work correctly

---

## 4. Edge Case Testing

### Test: Rapid Tag Processing
- Send message with 20+ tags
- Verify all tags are processed
- Verify no race conditions

### Test: Duplicate Tag Handling
- Send`INVENTORY_ADD[Sword|1] INVENTORY_ADD[Sword|1]`
- Verify quantity is 2, not duplicated

### Test: Invalid Tag Content
- Send `DAMAGE[|NaN|]`
- Verify graceful error handling
- No crashes or UI freezes

### Test: Missing Data
- Character without knownSpells array
- Verify ensureArray creates array
- No crashes

---

## 5. Performance Testing

### Metrics to Monitor

| Metric | Baseline | Target | Actual |
|--------|----------|--------|--------|
| Tag processing time | <10ms | <10ms | ___ |
| Message render time | <50ms | <50ms | ___ |
| Build bundle size | 472KB | <500KB | ___ |
| Test suite runtime | - | <5s | ___ |

**How to Test:**
```javascript
console.time('Tag Processing')
processGameTagsRealtime(game, character, text, new Set(), {})
console.timeEnd('Tag Processing')
```

---

## 6. Regression Testing Checklist

| Feature | Status | Notes |
|---------|--------|-------|
| ✅ Character creation | | |
| ✅ World selection | | |
| ✅ Game start flow | | |
| ✅ Chat streaming | | |
| ✅ Dice rolling | | |
| ✅ Roll history display | | |
| ✅ Inventory display | | |
| ✅ Equipment AC calculation | | |
| ✅ Combat HUD | | |
| ✅ Spell slot display | | |
| ✅ HP/Temp HP display | | |
| ✅ Conditions display | | |
| ✅ Location tracking | | |
| ✅ Suggested actions | | |
| ✅ Level up modal | | |
| ✅ Save/load games | | |
| ✅ Theme switching | | |
| ✅ Model selection | | |

---

## 7. Test Execution Plan

### Phase 1: Automated Tests (5 min)
```bash
npm test
```
- All unit tests must pass
- No console errors
- Code coverage >70% for processors

### Phase 2: Build Verification (2 min)
```bash
npm run build
```
- Build completes successfully
- No build warnings
- Bundle size acceptable

### Phase 3: Manual Testing (45 min)
- Execute all 4 test sessions
- Document any issues
- Verify all pass criteria

### Phase 4: Performance Check (5 min)
- Run performance metrics
- Compare to baseline
- No significant regressions

### Phase 5: Sign-Off (3 min)
- Review test results
- Document any known issues
- Decide: merge or iterate

---

## 8. Success Criteria

### Must Pass (Blocking)
- ✅ All automated tests passing
- ✅ Build completes without errors
- ✅ No crashes during manual testing
- ✅ All core gameplay flows work

### Should Pass (Non-Blocking)
- ⚠️ Performance metrics within targets
- ⚠️ Code coverage >70%
- ⚠️ No new console warnings

### Nice to Have
- 💡 Improved performance over baseline
- 💡 New edge cases covered by tests
- 💡 Documentation updated

---

## 9. Known Issues & Limitations

### Current Known Issues
1. **ENEMY_SPAWN** tag still needs migration to TagProcessor
2. **processGameTags** (non-realtime) not yet refactored
3. RenderProcessor tests not yet written

### Planned Follow-Up
1. Complete TagProcessor refactoring
2. Add RenderProcessor tests
3. Add comprehensive integration tests
4. Performance optimization if needed

---

## 10. Test Report Template

```markdown
# Test Execution Report - Phase 2

**Date:** ___________
**Tester:** ___________
**Duration:** ___________

## Automated Tests
- Unit Tests: ___/105 passing
- Build Status: ✅ / ❌
- Console Errors: ___

## Manual Tests
- Test Session 1 (Inventory): ✅ / ❌
- Test Session 2 (Combat): ✅ / ❌
- Test Session 3 (Narrative): ✅ / ❌
- Test Session 4 (Spells): ✅ / ❌

## Performance
- Tag Processing: ___ms (target: <10ms)
- Bundle Size: ___KB (target: <500KB)

## Issues Found
1. ___________
2. ___________

## Recommendation
- [ ] Merge to main
- [ ] Iterate and retest
- [ ] Rollback

**Notes:**
___________
```

---

## Next Steps After Testing

1. **If All Tests Pass:**
   - Merge refactor/modular-architecture to main
   - Create GitHub release tag
   - Update documentation
   - Start Phase 3 (game.js refactoring)

2. **If Tests Fail:**
   - Document failures
   - Fix issues
   - Re-run test plan
   - Repeat until passing

3. **Performance Issues:**
   - Profile slow processors
   - Optimize hot paths
   - Consider caching strategies

---

**Ready to test?** Run `npm test` to begin! 🧪
