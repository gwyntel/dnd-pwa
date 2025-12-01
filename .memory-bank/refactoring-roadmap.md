# Refactoring Roadmap: TagProcessor & game.js

**Status:** 📋 PLANNED  
**Last Updated:** 2025-11-30  
**Estimated Time:** 3-5 days focused work

## Phase 1: Dependency Cleanup ✅ COMPLETED

**Completed Actions:**
- ✅ Removed 28 unused packages (React, Next.js, Tailwind, TypeScript, etc.)
- ✅ Verified build still works: `npm run build` successful
- ✅ Bundle size optimized (removed React overhead)
- ✅ Updated documentation (README, codebase-survey.md)

**Actual Dependencies:**
```json
{
  "dependencies": {
    "openai": "^4.104.0"
  },
  "devDependencies": {
    "vite": "^7.1.7",
    "vitest": "^4.0.13",
    "jsdom": "^27.0.1",
    "terser": "^5.44.1"
  }
}
```

---

## Phase 2: Fragment TagProcessor (Est. 2 days)

### Current State
- **File:** `src/engine/TagProcessor.js`
- **Size:** 1,389 lines, 54KB
- **Functions:** 21 functions handling everything from inventory to combat to rendering

### Problem
TagProcessor is a "God Class" violating Single Responsibility Principle:
- Handles 10+ different concerns in one file
- Hard to test individual subsystems
- High risk of regression when making changes
- Difficult onboarding for new contributors

### Solution: Extract Specialized Processors

#### New File Structure
```
src/engine/
├── TagProcessor.js (coordinator, ~200 lines)
├── processors/
│   ├── InventoryProcessor.js (INVENTORY_*, GOLD_*, equipment)
│   ├── CombatProcessor.js (COMBAT_*, ENEMY_*, DAMAGE, HEAL)
│   ├── SpellProcessor.js (CAST_SPELL, LEARN_SPELL, concentration)
│   ├── ConditionProcessor.js (STATUS_ADD, STATUS_REMOVE, effects)
│   ├── NarrativeProcessor.js (LOCATION, ACTION, RELATIONSHIP)
│   └── RenderProcessor.js (badges, markdown, HTML escaping)
```

### Step-by-Step Migration Plan

#### Step 2.1: Create Infrastructure (30 min)
1. Create `src/engine/processors/` directory
2. Create `BaseProcessor.js` with shared utilities:
   ```javascript
   export class BaseProcessor {
     constructor(game, character, data) {
       this.game = game
       this.character = character
       this.data = data
     }
     
     // Shared helpers
     ensureArray(obj, key, defaultVal = []) { ... }
     ensureObject(obj, key, defaultVal = {}) { ... }
   }
   ```

#### Step 2.2: Extract InventoryProcessor (2-3 hours)
**Responsibility:** Inventory management, gold, equipment

**Functions to Move:**
- `upsertItem(rawName, deltaQty, { equip, unequip })`
- `changeGold(deltaRaw)`
- `ensureInventory()`
- `ensureCurrency()`

**Tags Handled:**
- `INVENTORY_ADD[item|quantity]`
- `INVENTORY_REMOVE[item|quantity]`
- `INVENTORY_EQUIP[item]`
- `INVENTORY_UNEQUIP[item]`
- `GOLD_CHANGE[amount]`

**New File:** `src/engine/processors/InventoryProcessor.js`
```javascript
import { BaseProcessor } from './BaseProcessor.js'
import { EquipmentManager } from '../EquipmentManager.js'

export class InventoryProcessor extends BaseProcessor {
  processRealtimeTags(text, processedTags, callbacks) {
    const newMessages = []
    
    // Process INVENTORY_ADD tags
    // Process INVENTORY_REMOVE tags
    // Process INVENTORY_EQUIP tags
    // Process INVENTORY_UNEQUIP tags
    // Process GOLD_CHANGE tags
    
    return newMessages
  }
  
  upsertItem(rawName, deltaQty, options) { ... }
  changeGold(deltaRaw) { ... }
  // ... other methods
}
```

**Testing Strategy:**
- Create `InventoryProcessor.test.js`
- Test adding/removing items
- Test gold changes
- Test equip/unequip logic

#### Step 2.3: Extract CombatProcessor (2-3 hours)
**Responsibility:** Combat flow, damage, enemies

**Functions to Move:**
- Combat tag processing logic
- Damage/heal application
- Enemy spawning

**Tags Handled:**
- `COMBAT_START[description]`
- `COMBAT_END`
- `ENEMY_SPAWN[name|hp|ac]`
- `DAMAGE[amount|type]`
- `HEAL[amount]`
- `TEMP_HP[amount]`

**New File:** `src/engine/processors/CombatProcessor.js`

#### Step 2.4: Extract SpellProcessor (1-2 hours)
**Responsibility:** Spellcasting, spell slots, concentration

**Tags Handled:**
- `CAST_SPELL[spellName|level]`
- `LEARN_SPELL[spellName]`
- Concentration checks

**New File:** `src/engine/processors/SpellProcessor.js`

#### Step 2.5: Extract ConditionProcessor (1 hour)
**Responsibility:** Status effects, conditions

**Tags Handled:**
- `STATUS_ADD[condition]`
- `STATUS_REMOVE[condition]`

**New File:** `src/engine/processors/ConditionProcessor.js`

#### Step 2.6: Extract NarrativeProcessor (1 hour)
**Responsibility:** Location tracking, relationships, actions

**Tags Handled:**
- `LOCATION[location_name]`
- `RELATIONSHIP[npc|value]`
- `ACTION[description]`
- `QUEST_ADD[quest]`

**New File:** `src/engine/processors/NarrativeProcessor.js`

#### Step 2.7: Extract RenderProcessor (1-2 hours)
**Responsibility:** Badge generation, markdown parsing, HTML escaping

**Functions to Move:**
- `stripTags(text)`
- `parseMarkdown(text)`
- `createBadgeForTag(tag)`
- `renderInlineBadgeHtml(type, data)`
- `insertInlineBadges(html)`
- `escapeHtml(text)`

**New File:** `src/engine/processors/RenderProcessor.js`

#### Step 2.8: Refactor Main TagProcessor (2 hours)
**New Responsibility:** Orchestrate all processors

```javascript
import { InventoryProcessor } from './processors/InventoryProcessor.js'
import { CombatProcessor } from './processors/CombatProcessor.js'
import { SpellProcessor } from './processors/SpellProcessor.js'
import { ConditionProcessor } from './processors/ConditionProcessor.js'
import { NarrativeProcessor } from './processors/NarrativeProcessor.js'
import { RenderProcessor } from './processors/RenderProcessor.js'

export const TagProcessor = {
  processGameTagsRealtime(game, character, text, processedTags, callbacks = {}) {
    const data = store.get()
    
    // Initialize processors
    const inventory = new InventoryProcessor(game, character, data)
    const combat = new CombatProcessor(game, character, data)
    const spell = new SpellProcessor(game, character, data)
    const condition = new ConditionProcessor(game, character, data)
    const narrative = new NarrativeProcessor(game, character, data)
    
    // Collect messages from all processors
    let allMessages = []
    allMessages.push(...inventory.processRealtimeTags(text, processedTags, callbacks))
    allMessages.push(...combat.processRealtimeTags(text, processedTags, callbacks))
    allMessages.push(...spell.processRealtimeTags(text, processedTags, callbacks))
    allMessages.push(...condition.processRealtimeTags(text, processedTags, callbacks))
    allMessages.push(...narrative.processRealtimeTags(text, processedTags, callbacks))
    
    return allMessages
  },
  
  // Delegate rendering methods
  stripTags: (text) => RenderProcessor.stripTags(text),
  parseMarkdown: (text) => RenderProcessor.parseMarkdown(text),
  // ... etc
}
```

#### Step 2.9: Integration Testing (1-2 hours)
- Run existing tests: `npm test`
- Manual gameplay testing
- Verify all tags still work
- Check for regressions

---

## Phase 3: Simplify game.js (Est. 2 days)

### Current State
- **File:** `src/views/game.js`
- **Size:** 1,655 lines, 56KB
- **Functions:** 30 functions mixing UI rendering and game logic

### Problem
Responsibilities are too mixed:
- HTML string generation (presentation)
- Event handlers (user interaction)
- Game state mutations (business logic)
- API calls (data fetching)
- Roll batching logic (game mechanics)

### Solution: Extract Logic Layers

#### New File Structure
```
src/views/
├── game.js (main view, ~400 lines)
├── game/
│   ├── GameController.js (business logic)
│   ├── RollBatcher.js (roll batching system)
│   ├── MessageRenderer.js (message HTML generation)
│   └── InputController.js (input handling, suggested actions)
src/components/
├── GameHeader.js (game title, nav buttons)
├── GameSidebar.js (stats, inventory, location)
└── GameMessages.js (message list rendering)
```

### Step-by-Step Migration Plan

#### Step 3.1: Extract RollBatcher (1 hour)
**Responsibility:** Batch dice rolls and trigger follow-up narration

**New File:** `src/views/game/RollBatcher.js`
```javascript
export class RollBatcher {
  constructor() {
    this.batch = []
    this.timer = null
    this.pendingBatch = null
  }
  
  addRoll(rollData) { ... }
  processBatch(onComplete) { ... }
  clear() { ... }
  isPending() { ... }
}
```

**Benefits:**
- Testable in isolation
- Can be reused in other views
- Clear API

#### Step 3.2: Extract MessageRenderer (1-2 hours)
**Responsibility:** Generate HTML for chat messages

**New File:** `src/views/game/MessageRenderer.js`
```javascript
import { ChatMessage } from '../../components/ChatMessage.js'

export class MessageRenderer {
  static renderMessages(messages) { ... }
  static appendMessage(msg) { ... }
  static smartScrollToBottom(container) { ... }
}
```

#### Step 3.3: Extract GameController (2-3 hours)
**Responsibility:** Core game flow logic

**New File:** `src/views/game/GameController.js`
```javascript
export class GameController {
  constructor(gameId) {
    this.gameId = gameId
    this.game = null
    this.character = null
    this.world = null
  }
  
  async initialize() { ... }
  async sendMessage(userText) { ... }
  buildSystemPrompt() { ... }
  handlePlayerInput(text) { ... }
  
  // Event handlers
  onRollTriggered(rollData) { ... }
  onLocationChanged(location) { ... }
  onInventoryUpdated() { ... }
}
```

#### Step 3.4: Extract InputController (1 hour)
**Responsibility:** Handle user input, suggested actions

**New File:** `src/views/game/InputController.js`

#### Step 3.5: Refactor main game.js (2-3 hours)
**New Responsibility:** Coordinate controllers and render UI

```javascript
import { GameController } from './game/GameController.js'
import { RollBatcher } from './game/RollBatcher.js'
import { MessageRenderer } from './game/MessageRenderer.js'
import { InputController } from './game/InputController.js'

// game.js becomes thin coordinator
export async function renderGame(state = {}) {
  const controller = new GameController(state.id)
  await controller.initialize()
  
  // Render UI with extracted components
  return `
    <div class="game-layout">
      ${GameHeader.render(controller.game)}
      ${GameSidebar.render(controller.character, controller.game)}
      ${GameMessages.render(controller.game.messages)}
      ${InputController.render(controller.game)}
    </div>
  `
}
```

#### Step 3.6: Component Extraction (2-3 hours)
Extract reusable UI components:
- `GameHeader.js` (already exists as CharacterHUD, but split further)
- `GameSidebar.js` (stats, inventory, conditions)
- `GameMessages.js` (message list with scroll handling)

#### Step 3.7: Integration Testing (1-2 hours)
- Manual gameplay testing
- Test all game flows (combat, resting, inventory)
- Verify streaming still works
- Test roll batching

---

## Phase 4: Testing & Documentation (Est. 1 day)

### Testing Strategy
1. **Unit Tests:**
   - Each processor has its own test file
   - GameController has comprehensive tests
   - RollBatcher tested in isolation

2. **Integration Tests:**
   - Tag processing end-to-end
   - Combat flow
   - Inventory management

3. **Manual Testing Checklist:**
   - [ ] Create new character
   - [ ] Start new game
   - [ ] Combat encounter (spawn enemy, attack, damage, victory)
   - [ ] Inventory (add item, equip, unequip, remove)
   - [ ] Spellcasting (cast spell, consume slot)
   - [ ] Resting (short rest, long rest)
   - [ ] Level up
   - [ ] Location changes
   - [ ] Relationship tracking

### Documentation Updates
1. Update `codebase-survey.md` with new architecture
2. Add JSDoc comments to all new files
3. Create `ARCHITECTURE.md` explaining the processor pattern
4. Update README with contributor guidelines

---

## Success Metrics

### Code Quality
- ✅ No file over 500 lines
- ✅ Each file has single responsibility
- ✅ Test coverage >60% for critical paths
- ✅ All existing functionality preserved

### Developer Experience
- ✅ Easy to find code (logical file organization)
- ✅ Easy to test (isolated concerns)
- ✅ Easy to extend (add new tags without touching existing code)

### Performance
- ✅ No regression in build size
- ✅ No regression in runtime performance
- ✅ Streaming and real-time processing still fast

---

## Risk Mitigation

### Before Starting
1. ✅ Create feature branch: `git checkout -b refactor/modular-architecture`
2. ✅ Ensure tests pass: `npm test`
3. ✅ Create backup: `git tag pre-refactor`

### During Refactoring
1. Commit after each processor extraction
2. Run tests after each change
3. Manual test critical paths

### Rollback Plan
If something goes wrong:
```bash
git reset --hard pre-refactor
```

---

## Timeline Estimate

| Phase | Task | Time | Cumulative |
|-------|------|------|------------|
| 1 | Dependency cleanup | ✅ DONE | 0.5 days |
| 2.1 | Create infrastructure | 30 min | 0.5 days |
| 2.2 | Extract InventoryProcessor | 3 hours | 0.75 days |
| 2.3 | Extract CombatProcessor | 3 hours | 1 day |
| 2.4 | Extract SpellProcessor | 2 hours | 1.25 days |
| 2.5 | Extract ConditionProcessor | 1 hour | 1.5 days |
| 2.6 | Extract NarrativeProcessor | 1 hour | 1.5 days |
| 2.7 | Extract RenderProcessor | 2 hours | 1.75 days |
| 2.8 | Refactor main TagProcessor | 2 hours | 2 days |
| 2.9 | Integration testing | 2 hours | 2.25 days |
| 3.1 | Extract RollBatcher | 1 hour | 2.5 days |
| 3.2 | Extract MessageRenderer | 2 hours | 2.75 days |
| 3.3 | Extract GameController | 3 hours | 3 days |
| 3.4 | Extract InputController | 1 hour | 3.25 days |
| 3.5 | Refactor main game.js | 3 hours | 3.5 days |
| 3.6 | Component extraction | 3 hours | 3.75 days |
| 3.7 | Integration testing | 2 hours | 4 days |
| 4 | Final testing & docs | 1 day | 5 days |

**Total: 5 days** (focused work, no interruptions)  
**Realistic: 5-7 days** (with breaks, debugging time)

---

## Next Steps

1. ✅ Complete Phase 1 (Dependency Cleanup) - DONE!
2. Create feature branch: `git checkout -b refactor/modular-architecture`
3. Start with Step 2.1: Create BaseProcessor infrastructure
4. Extract processors one at a time, testing after each
5. Tackle game.js after TagProcessor is solid

**Ready to start Phase 2?** The foundation is clean and ready! 🚀
