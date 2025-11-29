# Cline's Day-to-Day Memory Bank Workflow for D&D PWA

**You are in Coding Mode.** Your memory reset—you remember nothing. This document is your entire brain. Read it completely before every session.

---

## Pre-Flight Ritual (MANDATORY)

Run these commands in exact order. **STOP if any step fails.**

```bash
# 1. Confirm working directory
pwd

# 2. Read Memory Bank context (ALL files)
cat .memory-bank/projectbrief.md
cat .memory-bank/productContext.md
cat .memory-bank/systemPatterns.md
cat .memory-bank/techContext.md
cat .memory-bank/activeContext.md
cat .memory-bank/progress.md

# 3. Read feature list (THE SINGLE SOURCE OF TRUTH)
cat .memory-bank/feature-list.json

# 4. Review recent git history
git log --oneline -20
git status

# 5. Start environment
./init.sh
```

**Health Check (Required):** Verify the app starts correctly:
```bash
# Option A: Simple HTTP check (always available)
curl -f http://localhost:5173 || echo "⚠️  App not responding"

# Option B: Browser check (if requested by user)
# I will launch browser ONLY if user requests verification
```

**Recovery Protocol:** If health check fails:
```bash
git log --oneline -10
git checkout [last-working-commit]
echo "Recovered from broken state in $(date)" >> .memory-bank/progress.md
./init.sh && # Re-run health check
```

---

## Session Constraints (UNBREAKABLE RULES)

1. **ONE FEATURE PER SESSION** - Implement exactly one `feature-list.json` item
2. **END-TO-END TESTING** - Verify features work as a real player would (method varies)
3. **NEVER EDIT FEATURE CRITERIA** - Only toggle `"passes": false` to `true`. Never modify `steps` or `description`.
4. **CLEAN HANDOFF REQUIRED** - Code must be production-ready: no major bugs, well-documented, mergeable.
5. **UPDATE PROGRESS LOG** - Append to `progress.md` at session end.
6. **REQUESTED BROWSER VERIFICATION** - Only use browser automation if user explicitly asks for it before final commit.

---

## D&D PWA-Specific Development Context

### Core Architecture Understanding
- **Store Pattern**: `src/state/store.js` - Single source of truth with localStorage persistence
- **Tag System**: AI generates semantic tags (`LOCATION[name]`, `ROLL[type|dc]`, etc.) for game mechanics
- **Multi-provider AI**: OpenRouter (primary), OpenAI-compatible, LM Studio local support
- **Real-time Streaming**: AI responses stream with real-time tag processing
- **D&D 5e Mechanics**: Full implementation of combat, spells, equipment, leveling, rests

### Key File Patterns
- **Views**: `src/views/*.js` - Page components (home, game, characters, worlds, etc.)
- **Engine**: `src/engine/*.js` - Game systems (CombatManager, SpellcastingManager, etc.)
- **Components**: `src/components/*.js` - Reusable UI components (CharacterHUD, CombatHUD, etc.)
- **Data**: `src/data/*.js` - D&D 5e databases (classes, spells, items, monsters, etc.)
- **Utils**: `src/utils/*.js` - Utilities (ai-provider, storage, dice, etc.)

### D&D Game State Structure
```javascript
// Character: { id, name, class, race, level, xp, maxHP, currentHP, stats, spellSlots, inventory, resources }
// Game: { id, title, characterId, worldId, messages, currentLocation, combat, relationships, cumulativeUsage }
// World: { id, name, description, coreIntent, systemPrompt }
```

---

## Work Phase

### 1. Select Feature
```bash
# Find highest priority feature with "passes": false
jq '.[] | select(.passes == false) | .id, .priority, .category, .description' .memory-bank/feature-list.json
```

### 2. Implement Feature
- Read `systemPatterns.md` for architectural guidance
- Read `techContext.md` for tech stack constraints
- Read `codebase-survey.md` for specific file patterns
- Implement **only** the selected feature
- Self-verify using available methods (curl, unit tests, manual checks)

### 3. Test Feature (Method Agnostic)

**Default Testing (No Browser Required):**
```bash
# Test API endpoints (if feature involves AI)
curl -X POST http://localhost:5173/api/chat -d '{"message":"test"}'

# Run test suite
npm test

# Check Vite dev server
curl -f http://localhost:5173

# Test PWA functionality
npm run build && npm run preview
```

**If User Requests Browser Verification (Pre-Commit Only):**
```javascript
// I will ONLY launch browser if user says:
// "Verify with browser" or "Show me it works" or "Test in browser"

<browser_action>
  <action>launch</action>
  <url>http://localhost:5173</url>
</browser_action>

// Execute specific steps from feature-list.json
// For D&D features: Create character, start game, test combat, spells, etc.

<browser_action>
  <action>screenshot</action>
</browser_action>

// Document screenshot path in progress.md

<browser_action>
  <action>close</action>
</browser_action>
```

**CRITICAL:** After browser verification, I must **CLOSE THE BROWSER** before:
- Running git commands
- Editing any files
- Writing to progress.md

---

## Browser Automation (Optional, By Request Only)

**When User Requests Verification:**

1. **Launch**: `<browser_action><action>launch</action><url>http://localhost:5173</url></browser_action>`
2. **Test**: Execute steps from feature-list.json
   - Character creation and AI generation
   - World selection and AI generation
   - Game creation and AI DM interaction
   - Combat mechanics and dice rolling
   - Spell casting and slot management
   - Equipment and inventory management
   - Leveling up and character progression
3. **Screenshot**: Capture proof
4. **Close**: `<browser_action><action>close</action></browser_action>` **MANDATORY before proceeding**
5. **Document**: Add screenshot path to progress.md

**Browser Constraints:**
- **One browser at a time** - Must close before using terminal or editing files
- **Fixed viewport**: 1200x800 pixels (optimized for D&D PWA)
- **Console logs captured** with screenshots
- **If stuck**: Close and re-launch

**If Browser Unavailable:** All features are still testable via:
- `curl` commands for API endpoints
- `npm test` or similar test suite
- Manual verification notes
- File content inspection

---

## Failure Mode Recovery

| Problem | Detection | Recovery Action |
|---------|-----------|-----------------|
| **App broken on session start** | Health check fails | `git checkout [last-working]`, document in progress.md |
| **Implemented wrong feature** | Feature ID mismatch | Revert commit, read feature-list.json again |
| **Tests pass but feature broken** | E2E test missing | Add verification, mark incomplete, redo |
| **Feature list corrupted** | JSON parse error | Restore from git, document issue |
| **Environment won't start** | init.sh fails | Check `techContext.md`, fix init.sh, commit fix |
| **Browser stuck** | No response | Close browser: `<browser_action><action>close</action></browser_action>` |
| **AI provider errors** | 402, 429, 502 codes | Check `techContext.md` provider config, test with LM Studio |
| **Store corruption** | localStorage errors | Check storage.js migration logic, restore from backup |

---

## D&D PWA-Specific Testing Strategies

### Character Features Testing
```bash
# Test character creation flow
curl -X POST http://localhost:5173/characters/new -d '{"template":"template_knight"}'

# Test AI character generation (requires working AI provider)
curl -X POST http://localhost:5173/characters/generate -d '{"class":"Rogue","race":"Halfling"}'
```

### Game System Testing
```bash
# Test game creation and AI DM
curl -X POST http://localhost:5173/game/new -d '{"characterId":"test","worldId":"test"}'

# Test message processing and tag extraction
npm test -- src/engine/TagParser.spec.js
```

### Combat System Testing
```bash
# Test combat initiation and initiative
# Verify combat HUD renders correctly
# Test dice roll processing
```

---

## Self-Check Before Ending Session

- [ ] Feature implemented matches exactly one feature-list.json entry?
- [ ] All test steps from feature's `steps` array verified (by curl, test suite, OR browser if requested)?
- [ ] **If browser was requested:** Screenshot captured, browser CLOSED, path documented?
- [ ] `progress.md` appended with session summary?
- [ ] `activeContext.md` updated with next focus?
- [ ] Code committed with descriptive message?
- [ ] Health check passes on final state?
- [ ] **No browser processes running** (if verification was done)?
- [ ] Store system integrity maintained?
- [ ] Tag system functionality preserved?

**If any unchecked, DO NOT END SESSION.** Complete the missing step.

---

## User Commands Quick Reference

| When User Says | Your Action |
|----------------|-------------|
| "Start work" | Run pre-flight ritual, implement top-priority feature |
| "Update memory bank" | Read ALL files, update any stale context |
| "Fix bugs" | Run health check, identify broken features, fix |
| "Add feature: X" | Add to feature-list.json, set priority |
| "What's next?" | Read activeContext.md, report next feature |
| "Project status?" | Summarize progress.md and feature-list.json |
| **"Verify with browser"** | **Launch browser, test current feature, close browser, then commit** |
| **"Show me it works"** | **Same as above - browser verification pre-commit** |
| "Test character creation" | Browser: Create Knight template, verify stats |
| "Test AI generation" | Browser: Generate custom character, verify response |
| "Test combat" | Browser: Start combat, test dice rolling |
| "Test spells" | Browser: Cast spells, verify slot management |

---

## Key D&D PWA Development Patterns

### Store Integration
```javascript
// Always use store pattern for state changes
await store.update((state) => {
  const g = state.games.find((g) => g.id === gameId)
  if (g) {
    // Update game state
  }
}, { debounceDelay: 300 })
```

### Tag System Integration
```javascript
// Add new tags in src/data/tags.js
export const REGEX = {
  NEW_TAG: /NEW_TAG\[([^\]]+)]/g
}

// Process tags in src/engine/TagProcessor.js
export function processGameTagsRealtime() {
  // Add tag processing logic
}
```

### AI Provider Integration
```javascript
// Use multi-provider pattern
import { aiProvider } from '../utils/ai-provider.js'
const response = await aiProvider.chatCompletion(messages, model)
```

### Component Patterns
```javascript
// Reusable components in src/components/
export function CharacterHUD(game, character) {
  return `
    <div class="character-card">
      <h3>${character.name}</h3>
      <!-- Character stats -->
    </div>
  `
}
```

---

**Remember: You are a reset instance. The Memory Bank is your only memory. Browser verification is OPTIONAL and only done when explicitly requested. When requested, always close browser before committing.**

**Key Principle for D&D PWA**: Game state lives in localStorage via the Store system; AI context is built dynamically from messages + system prompt. Streaming & tag parsing are real-time; no separate "apply changes" phase.
