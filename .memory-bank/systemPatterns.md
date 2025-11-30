# System Architecture & Patterns

## Architectural Overview

The D&D PWA follows a **modular engine-based architecture** with clear separation between game logic, UI components, and data management. The system is designed around a centralized Store pattern that manages all application state with automatic persistence.

### Core Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer (Views)                      │
│  Home  Characters  Worlds  Game  Settings  Models           │
└─────────────────────────────────────────────────────────────┘
                                   │
┌─────────────────────────────────────────────────────────────┐
│                    Component Layer                           │
│  CharacterHUD  CombatHUD  ChatMessage  RollHistory  etc.     │
└─────────────────────────────────────────────────────────────┘
                                   │
┌─────────────────────────────────────────────────────────────┐
│                    Engine Layer                              │
│  GameLoop  TagProcessor  CombatManager  Spellcasting        │
│  RestManager  EquipmentManager  EffectsEngine  TagParser     │
│  MechanicsEngine (New)                                      │
└─────────────────────────────────────────────────────────────┘
                                   │
┌─────────────────────────────────────────────────────────────┐
│                    State Layer                               │
│                     Store (Centralized)                      │
│              In-Memory Cache + Debounced localStorage        │
└─────────────────────────────────────────────────────────────┘
                                   │
┌─────────────────────────────────────────────────────────────┐
│                   Utility Layer                              │
│  Auth  AI-Provider  Dice  Storage  Model-Utils  Prompts      │
└─────────────────────────────────────────────────────────────┘
```

## Design Patterns

### 1. Centralized Store Pattern (State Management)

**Location:** `src/state/store.js`

```javascript
// Singleton store with in-memory caching and automatic persistence
class Store {
  constructor() {
    this._state = null          // In-memory cache
    this._listeners = new Set() // Reactivity system
    this._isInitialized = false
  }
  
  get() { /* Return current state */ }
  
  update(updaterFn, options) {
    // 1. Call updater function with state reference
    // 2. Notify all listeners
    // 3. Debounced save to localStorage
  }
  
  subscribe(listener) { /* Subscribe to changes */ }
}
```

**Key Principles:**
- **Single Source of Truth:** All state flows through the Store
- **In-Memory Cache:** Fast reads/writes without I/O blocking
- **Debounced Persistence:** 300ms delay prevents excessive disk writes
- **Subscriber Pattern:** UI components react to state changes automatically
- **Immediate Saves:** Critical operations use `immediate: true` flag

**Usage Example:**
```javascript
import store from './state/store.js'

// Read state
const data = store.get()

// Update state
await store.update(state => {
  state.games.push(newGame)
  state.characters.push(newCharacter)
})

// Subscribe to changes
const unsubscribe = store.subscribe(newState => {
  // Re-render UI
})
```

### 2. Tag-Driven Game Mechanics

**Location:** `src/engine/TagProcessor.js`, `src/data/tags.js`

The game uses a **tag-based instruction system** where the AI generates special tags that trigger game mechanics:

```javascript
// AI Response: "You are in a dark forest. ROLL[skill|perception|15]"
//                Location set    ↓        Skill check triggered ↓

// Location change
LOCATION[Dark Forest Path]           → Updates game.currentLocation

// Dice rolls
ROLL[1d20+5|normal|0]               → Executes dice roll
ROLL[skill|stealth|12|advantage]    → Skill check with advantage

// Combat
COMBAT_START[Goblin ambush!]        → Initialize combat system
ENEMY_SPAWN[goblin]                 → Spawn enemy from template
COMBAT_END[Victory]                 → End combat, grant rewards

// Damage & Healing (MechanicsEngine)
DAMAGE[player|10|fire]              → Apply damage (checks resistance)
HEAL[player|5]                      → Restore HP
TEMP_HP[player|10]                  → Grant temporary HP

// Status & Effects
APPLY_RESISTANCE[player|fire]       → Grant resistance
REMOVE_RESISTANCE[player|fire]      → Remove resistance
APPLY_IMMUNITY[player|poison]       → Grant immunity
APPLY_VULNERABILITY[player|cold]    → Grant vulnerability

// Items & Currency
INVENTORY_ADD[Potion of Healing|1]  → Add item
INVENTORY_EQUIP[Ring of Fire Res]   → Equip item (triggers passive effects)
GOLD_CHANGE[25]                     → Add/remove gold
```

**Processing Flow:**
1. AI generates text with embedded tags
2. `TagParser.parse()` extracts tags safely (prevents XSS)
3. `TagProcessor.processGameTagsRealtime()` executes mechanics during streaming
4. `TagProcessor.processGameTags()` final processing after streaming completes
5. State updates trigger UI re-renders

**Benefits:**
- **AI-Guided:** AI controls game flow through natural language + tags
- **Extensible:** New mechanics can be added by creating new tag types
- **Safe:** TagParser sanitizes content to prevent injection attacks
- **Real-time:** Mechanics execute during streaming for immediate feedback

### 3. Mechanics Engine & Passive Effects

**Location:** `src/engine/MechanicsEngine.js`, `src/engine/EffectsEngine.js`

A centralized engine enforces D&D 5e rules, ensuring mathematical correctness regardless of AI narration.

- **MechanicsEngine:** Handles damage calculations (resistance/vulnerability), temp HP rules, and concentration checks.
- **EffectsEngine:** Manages passive effects from items. When an item is equipped via `INVENTORY_EQUIP`, the engine:
    1. Looks up the item's effects (e.g., `APPLY_RESISTANCE[player|fire]`).
    2. Generates corresponding tags to apply the effect.
    3. When unequipped, generates inverse tags (e.g., `REMOVE_RESISTANCE`) to clean up.

### 4. Dynamic Content Generation (Backfilling)

**Location:** `src/engine/ItemGenerator.js`, `src/engine/MonsterGenerator.js`

Handles the "Lazy Loading" of game content using AI. When the game encounters a reference to an entity (Item or Monster) that doesn't exist in the static database:

1.  **Detection**: `TagProcessor` or `CombatManager` identifies a missing ID.
2.  **Placeholder**: A placeholder entity is immediately created to prevent blocking the game loop.
3.  **Generation**: An async AI request is triggered to generate the entity's stats based on its name and world context.
4.  **Update**: Once generated, the store is updated, and the entity's stats are applied live (e.g., updating a combatant's HP/AC or an item's effects).

### 5. Roll Batching System

**Location:** `src/views/game.js` (processRollBatch)

When multiple dice rolls occur in a single AI response, they're collected and processed together:

```javascript
// Batching mechanism
let rollBatch = []
let rollSettlingTimer = null
const ROLL_SETTLING_DELAY_MS = 500

// Add roll to batch
function addRollToBatch(rollData) {
  rollBatch.push(rollData)
  clearTimeout(rollSettlingTimer)
  rollSettlingTimer = setTimeout(processRollBatch, ROLL_SETTLING_DELAY_MS)
}

// Process all rolls at once
async function processRollBatch() {
  // 1. Display roll result messages
  // 2. Send follow-up prompt to AI with roll summaries
  // 3. AI narrates the outcomes
}
```

**Why This Pattern:**
- **Better UX:** Single follow-up narration instead of fragmented responses
- **Reduced API Calls:** One AI call for all roll outcomes
- **Cohesive Storytelling:** AI can interpret multiple rolls contextually
- **Performance:** Debouncing prevents excessive AI requests

### 4. Component-Based UI Architecture

**Location:** `src/components/`, `src/views/`

Each UI element is a **pure function** that returns HTML strings:

```javascript
// Component signature
function ComponentName(props) {
  return `
    <div class="component-class">
      <h3>${escapeHtml(props.title)}</h3>
      <p>${escapeHtml(props.content)}</p>
    </div>
  `
}

// Usage in views
const characterHTML = CharacterHUD(game, character)
const combatHTML = CombatHUD(game)
```

**Component Types:**
- **Presentational:** CharacterHUD, RollHistory, UsageDisplay
- **Interactive:** ChatMessage with event handlers
- **Composite:** Game view composes multiple components

**Benefits:**
- **Reusable:** Components used across multiple views
- **Testable:** Pure functions are easy to test
- **Composable:** Build complex UIs from simple pieces
- **Performant:** No virtual DOM overhead, direct DOM updates

### 5. Provider Pattern for AI Integration

**Location:** `src/utils/ai-provider.js`, `src/utils/model-utils.js`

Abstracts AI provider differences behind a common interface:

```javascript
// Provider interface
interface AIProvider {
  fetchModels() -> Promise<Model[]>
  sendChatCompletion(messages, model, options) -> Promise<Response>
  parseStreamingResponse(response) -> AsyncGenerator<Chunk>
  extractUsage(response) -> UsageData
  calculateCost(usage, pricing) -> number
}

// Usage
const provider = await getProvider() // Returns OpenRouter, OpenAI, or LM Studio provider
const response = await provider.sendChatCompletion(messages, model, options)
```

**Supported Providers:**
- **OpenRouter:** Primary provider with 100+ models
- **OpenAI:** Direct OpenAI API access
- **LM Studio:** Local model hosting
- **Custom:** Any OpenAI-compatible endpoint

**Benefits:**
- **Swap Providers:** Change AI provider without changing game code
- **Feature Detection:** Providers can expose capabilities (reasoning, function calling)
- **Cost Tracking:** Uniform cost calculation across providers
- **Testing:** Mock providers for offline development

### 6. Debounced Persistence Pattern

**Location:** `src/state/store.js`, `src/utils/storage.js`

Prevents race conditions and excessive I/O by debouncing saves:

```javascript
// In storage.js
let saveTimeout = null
const DEBOUNCE_DELAY = 300

export function debouncedSave(data, delay = DEBOUNCE_DELAY) {
  clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    saveData(data) // Actual localStorage write
  }, delay)
}

// In store.js
async update(updaterFn, options = {}) {
  const { immediate = false, debounceDelay = 300 } = options
  
  updaterFn(this._state) // Mutate in-memory state
  
  if (immediate) {
    saveData(this._state) // Save now for critical updates
  } else {
    debouncedSave(this._state, debounceDelay) // Debounced for normal updates
  }
  
  this._notifyListeners() // Update UI
}
```

**Usage Rules:**
- **Normal Updates:** Use debounced save (300ms default)
- **Critical Updates:** Use `immediate: true` (navigation, combat state, character death)
- **Streaming:** Use shorter debounce (100ms) for responsive UI during AI streaming

**Benefits:**
- **Performance:** Reduces localStorage writes from 100+ per second to ~3 during streaming
- **Race Condition Prevention:** Batches rapid state changes
- **UI Responsiveness:** In-memory updates are immediate, persistence is async
- **Data Safety:** Critical operations save immediately to prevent data loss

## Critical Implementation Paths

### 1. Authentication Flow

```
User visits app
    ↓
Check authentication state (isAuthenticated())
    ↓
If not authenticated:
  - Show provider selection (OpenRouter, OpenAI, LM Studio)
  - For OpenRouter: PKCE OAuth flow
  - For API: Direct key input
  - For LM Studio: Local URL configuration
    ↓
Store token in sessionStorage + localStorage (for auto-login)
    ↓
Initialize Store and load existing data
    ↓
Redirect to home view
```

**Key Files:**
- `src/utils/auth.js` - PKCE OAuth implementation
- `src/views/home.js` - Authentication UI
- `src/main.js` - Auto-login and initialization

### 2. Character Creation Flow

```
Select creation method:
  ├─ Template → Pick from BEGINNER_TEMPLATES
  ├─ AI Generation → Describe concept → AI generates full sheet
  └─ Manual → Fill form with validation
    ↓
Normalize character data structure
    ↓
Save to store.characters array
    ↓
Redirect to character view
```

**Key Files:**
- `src/views/characters.js` - Character creation views
- `src/data/archetypes.js` - Template definitions
- `src/utils/character-validation.js` - Data validation
- `src/utils/prompts/character-prompts.js` - AI generation prompts

### 3. Game Session Flow (Critical Loop)

```
Player inputs action
    ↓
Append message to game.messages
    ↓
Build API messages (system prompt + history + context trimming)
    ↓
Send to AI provider with streaming
    ↓
<strong>During Streaming:</strong>
  ├─ Parse AI response chunk by chunk
  ├─ Process tags in real-time (ROLL → roll, LOCATION → update location)
  ├─ Execute game mechanics immediately
  ├─ Append to assistant message
  ├─ Update UI live
  └─ Debounced state persistence
    ↓
<strong>After Streaming:</strong>
  ├─ Final tag processing (COMBAT_START, ENEMY_SPAWN, etc.)
  ├─ Roll batch processing if rolls accumulated
  ├─ Send follow-up prompts to AI for roll narration
  ├─ Save final state (immediate persistence)
  └─ Update all UI components
    ↓
Enable input for next player action
```

**Key Files:**
- `src/views/game.js` - Main game loop and UI
- `src/engine/TagProcessor.js` - Real-time tag processing
- `src/engine/GameLoop.js` - Game state management
- `src/utils/ai-provider.js` - AI streaming abstraction

### 4. Combat Flow

```
COMBAT_START tag detected
    ↓
CombatManager.startCombat() called
    ↓
Roll player initiative (1d20 + DEX mod)
    ↓
For each enemy mentioned in description:
  ├─ Spawn enemy from template (ENEMY_SPAWN tag)
  ├─ Roll enemy initiative
  └─ Add to initiative order
    ↓
Sort all combatants by initiative total (descending)
    ↓
Set game.combat.active = true
    ↓
Update CombatHUD with turn order and enemy HP bars
    ↓
AI narrates combat start and signals first actor's turn

During Combat:
- Player actions → TagProcessor handles combat tags
- Enemy turns → AI narrates enemy actions
- Damage application → applyDamage() updates HP
- Death checks → Remove from initiative if HP ≤ 0
- Turn advancement → advanceTurn() cycles currentTurnIndex
- AI reminder → If combat still active after player action, system message reminds AI

COMBAT_END tag detected
    ↓
CombatManager.endCombat() called
    ↓
Set game.combat.active = false
    ↓
Clear combat.initiative and combat.enemies
    ↓
Grant rewards (XP, items, gold)
    ↓
AI narrates victory/defeat and continues story
```

**Key Files:**
- `src/engine/CombatManager.js` - Combat state management
- `src/components/CombatHUD.js` - Combat UI rendering
- `src/data/monsters.js` - Enemy templates

### 5. Dice Roll Flow

```
AI response contains ROLL[1d20+5|normal|0] tag
    ↓
TagProcessor processes tag during streaming
    ↓
rollDice('1d20+5') called from dice.js
    ↓
If roll requires character context:
  ├─ buildDiceProfile(character) creates profile
  ├─ Apply proficiency bonuses
  └─ Apply advantage/disadvantage
    ↓
Execute roll (random number generation)
    ↓
Format result with formatRoll()
    ↓
Add to rollBatch for follow-up processing
    ↓
Display roll result in UI immediately

After 500ms settling period:
  ├─ Process all batched rolls together
  ├─ Send roll summaries to AI for narration
  └─ AI describes outcomes and continues story
```

**Key Files:**
- `src/utils/dice.js` - Core dice rolling logic
- `src/utils/dice5e.js` - D&D 5e specific roll profiles
- `src/views/game.js` - Roll batching implementation

## Performance Considerations

### 1. State Persistence Optimization
- **Problem:** AI streaming can trigger 100+ state updates per second
- **Solution:** Debounced saves (300ms) batch updates, immediate saves for critical operations
- **Result:** Reduces localStorage writes by ~97% during gameplay

### 2. Memory Management
- **Problem:** Long sessions accumulate event listeners and DOM elements
- **Solution:** Cleanup on component unmount, message trimming for relationships/locations
- **Result:** Stable memory usage even during 6+ hour sessions

### 3. AI Context Optimization
- **Problem:** Large games exceed AI context limits
