# System Architecture & Patterns - D&D PWA

## Core Architectural Patterns

### 1. Centralized State Management Pattern

#### Store Singleton Pattern
```javascript
// src/state/store.js - Singleton instance
class Store {
  constructor() {
    this._state = null
    this._listeners = new Set()
    this._isInitialized = false
  }

  async initialize() {
    this._state = await loadData()
    this._isInitialized = true
    this._notifyListeners()
  }

  async update(updaterFn, options = {}) {
    updaterFn(this._state)  // Direct mutation allowed
    await debouncedSave(this._state, options.debounceDelay)
    this._notifyListeners()
  }

  subscribe(listener) {
    this._listeners.add(listener)
    return () => this._listeners.delete(listener)
  }
}

const store = new Store()
export default store
```

**Benefits:**
- Single source of truth for all application state
- Reactive updates via subscription pattern
- Efficient localStorage persistence with debouncing
- Prevents race conditions in state updates

#### State Structure
```javascript
{
  version: "1.2.0",
  lastModified: "2025-11-28T...",
  settings: {
    provider: "openrouter",
    defaultNarrativeModel: "anthropic/claude-3-haiku",
    theme: "auto",
    temperature: 1.0
  },
  characters: [...],
  worlds: [...],
  games: [...]
}
```

### 2. Tag-Based AI Integration Pattern

#### Semantic Tag System
AI responses contain structured tags that trigger game mechanics:
```
AI Response: You encounter a goblin who attacks!
COMBAT_START[goblin ambush - 3 goblins]
ROLL[attack|shortsword|AC 15|advantage]
```

#### Real-Time Tag Processing
```javascript
// src/engine/TagProcessor.js
export async function processGameTagsRealtime(game, character, content, processedTags, options) {
  const { tags } = tagParser.parse(content)

  for (const tag of tags) {
    if (processedTags.has(tag.id)) continue

    switch (tag.type) {
      case 'LOCATION':
        game.currentLocation = tag.value
        break
      case 'ROLL':
        const rollResult = await executeRoll(tag.params)
        addRollToBatch(rollResult)
        break
      case 'COMBAT_START':
        await startCombat(game, tag.value)
        break
    }

    processedTags.add(tag.id)
  }
}
```

**Benefits:**
- Structured AI-game interaction
- Real-time state updates during streaming
- Extensible tag system for new mechanics
- Batch processing prevents AI spam

### 3. Component Composition Pattern

#### View-Component Separation
```
src/views/game.js      # Page-level logic and layout
src/components/        # Reusable UI components
├── CharacterHUD.js    # Character stats display
├── CombatHUD.js       # Combat interface
├── RollHistory.js     # Dice roll tracking
└── UsageDisplay.js    # AI usage metrics
```

#### Component API Pattern
```javascript
// src/components/CharacterHUD.js
export function CharacterHUD(game, character) {
  return `
    <div class="character-card">
      <h3>${character.name}</h3>
      <div class="stats-grid">
        <div>HP: ${game.currentHP}/${character.maxHP}</div>
        <div>AC: ${calculateAC(character)}</div>
      </div>
    </div>
  `
}
```

**Benefits:**
- Separation of concerns between views and components
- Reusable components across different views
- Consistent UI patterns and styling
- Easy testing and maintenance

### 4. Multi-Provider AI Abstraction Pattern

#### Provider Interface
```javascript
// src/utils/ai-provider.js
class AIProvider {
  async sendChatCompletion(messages, model, options) {
    // Provider-specific implementation
  }

  async parseStreamingResponse(response) {
    // Stream processing logic
  }

  extractUsage(response) {
    // Token counting logic
  }
}

// Concrete implementations
class OpenRouterProvider extends AIProvider { /* ... */ }
class OpenAIProvider extends AIProvider { /* ... */ }
class LMStudioProvider extends AIProvider { /* ... */ }
```

#### Provider Selection Logic
```javascript
// src/utils/model-utils.js
export async function getProvider() {
  const data = store.get()
  const providerName = data.settings?.provider || 'openrouter'

  switch (providerName) {
    case 'openrouter': return new OpenRouterProvider()
    case 'openai': return new OpenAIProvider()
    case 'lmstudio': return new LMStudioProvider()
  }
}
```

**Benefits:**
- Seamless provider switching
- Consistent API across providers
- Future-proof AI integration
- Error handling and fallbacks

### 5. Data Migration Pattern

#### Schema Versioning
```javascript
// src/utils/storage.js
const SCHEMA_VERSION = "1.2.0"

export async function loadData() {
  let data = JSON.parse(localStorage.getItem(STORAGE_KEY))

  if (data.version !== SCHEMA_VERSION) {
    console.log(`Migrating ${data.version} → ${SCHEMA_VERSION}`)

    // Show migration UI
    showMigrationPopup()

    // Apply migrations sequentially
    data = await applyMigrations(data, data.version, SCHEMA_VERSION)

    // Save migrated data
    saveData(data)
    hideMigrationPopup()
  }

  return data
}
```

#### Migration Functions
```javascript
async function applyMigrations(data, fromVersion, toVersion) {
  const migrations = [
    { version: "1.1.0", migrate: migrateTo_1_1_0 },
    { version: "1.2.0", migrate: migrateTo_1_2_0 }
  ]

  for (const migration of migrations) {
    if (semver.lt(fromVersion, migration.version)) {
      data = await migration.migrate(data)
      data.version = migration.version
    }
  }

  return data
}
```

**Benefits:**
- Non-destructive data updates
- User-transparent migrations
- Rollback capability via exports
- Version-controlled schema evolution

## Game Engine Patterns

### 1. Game Loop Pattern

#### Message Construction & Sanitization
```javascript
// src/engine/GameLoop.js
export function buildApiMessages(game, character, world) {
  const systemPrompt = buildGameDMPrompt(character, game, world)
  const messages = game.messages

  // Regenerate system prompt with current stats
  const systemMsgIndex = messages.findIndex(m => m.role === 'system')
  if (systemMsgIndex !== -1) {
    messages[systemMsgIndex] = {
      ...messages[systemMsgIndex],
      content: systemPrompt
    }
  }

  return sanitizeMessagesForModel(messages)
}
```

#### Streaming Response Processing
```javascript
// Real-time processing pipeline
for await (const chunk of provider.parseStreamingResponse(response)) {
  // 1. Extract content delta
  const delta = chunk.delta?.content || ""

  // 2. Update assistant message
  assistantMessage += delta
  game.messages[assistantMsgIndex].content = assistantMessage

  // 3. Process tags in real-time
  await processGameTagsRealtime(game, character, delta, processedTags)

  // 4. Update UI
  updateStreamingMessage(assistantMessage)
  smartScrollToBottom()
}
```

### 2. Combat State Machine Pattern

#### Combat States
```javascript
// src/engine/CombatManager.js
const COMBAT_STATES = {
  INACTIVE: 'inactive',
  INITIATIVE: 'initiative',
  ACTIVE: 'active',
  ENDED: 'ended'
}

export async function startCombat(game, description) {
  game.combat = {
    active: true,
    state: COMBAT_STATES.INITIATIVE,
    enemies: parseEnemies(description),
    initiative: [],
    currentTurnIndex: 0,
    lastActor: null
  }

  // Roll initiative
  game.combat.initiative = await rollInitiative(game, character)
  game.combat.state = COMBAT_STATES.ACTIVE
}
```

#### Turn Management
```javascript
export function getCurrentTurnDescription(game) {
  const current = game.combat.initiative[game.combat.currentTurnIndex]

  if (current.isPlayer) {
    return "It's your turn in combat."
  } else {
    return `It's ${current.name}'s turn (${current.enemyType}).`
  }
}
```

### 3. Resource Management Pattern

#### Spell Slot Tracking
```javascript
// src/engine/SpellcastingManager.js
export async function castSpell(game, character, spellId, level) {
  const spell = SPELLS.find(s => s.id === spellId)

  // Validate spell slot availability
  if (character.spellSlots[level].current <= 0) {
    throw new Error(`No ${level}rd level spell slots remaining`)
  }

  // Check concentration requirements
  if (spell.concentration && character.concentration) {
    throw new Error("Already concentrating on a spell")
  }

  // Consume spell slot
  character.spellSlots[level].current--
  game.spellSlots = character.spellSlots

  // Set concentration if needed
  if (spell.concentration) {
    character.concentration = {
      spell: spellId,
      level: level,
      duration: spell.duration
    }
  }
}
```

#### Rest Mechanics
```javascript
// src/engine/RestManager.js
export async function longRest(game, character) {
  // Restore all HP
  game.currentHP = character.maxHP

  // Restore all spell slots
  Object.keys(character.spellSlots).forEach(level => {
    character.spellSlots[level].current = character.spellSlots[level].max
  })

  // Restore hit dice (half max)
  character.hitDice.current = Math.floor(character.hitDice.max / 2)

  // Clear concentration
  character.concentration = null

  // Update rest timestamps
  game.restState.lastLongRest = new Date().toISOString()
  game.restState.shortRestsToday = 0
}
```

## UI Architecture Patterns

### 1. Smart Scroll Pattern

#### User Intent Detection
```javascript
// src/views/game.js
function isScrolledToBottom(container, threshold = 100) {
  const { scrollTop, scrollHeight, clientHeight } = container
  return scrollHeight - scrollTop - clientHeight < threshold
}

function smartScrollToBottom(container) {
  if (isScrolledToBottom(container)) {
    container.scrollTop = container.scrollHeight
    userScrolledUp = false
  } else {
    userScrolledUp = true // Respect user's manual scroll
  }
}
```

### 2. Debounced State Updates Pattern

#### Efficient Persistence
```javascript
// src/utils/storage.js
let saveTimeout = null
const MAX_SAVE_DELAY = 2000

export function debouncedSave(data, delay = 300) {
  clearTimeout(saveTimeout)

  saveTimeout = setTimeout(() => {
    saveData(data)
  }, delay)

  // Force save if too much time has passed
  if (Date.now() - lastSaveTime > MAX_SAVE_DELAY) {
    saveData(data)
  }
}
```

### 3. Component Lifecycle Pattern

#### View Initialization
```javascript
// src/views/game.js
export async function renderGame(state) {
  // 1. Data loading
  const game = store.get().games.find(g => g.id === state.params.id)

  // 2. Authentication checks
  if (!isAuthenticated()) { /* redirect */ }

  // 3. Model validation
  if (!game.narrativeModel) { /* redirect to settings */ }

  // 4. UI rendering
  app.innerHTML = buildGameUI(game, character)

  // 5. Event binding
  setupEventListeners(game)

  // 6. State synchronization
  updateGameState(game)
}
```

## Data Flow Patterns

### 1. Store-View Synchronization
```
User Action → View Handler → Store Update → Store Notify → View Re-render
     ↓              ↓              ↓              ↓              ↓
  Click Button → handleClick() → store.update() → _notifyListeners() → render()
```

### 2. AI Response Pipeline
```
AI Stream → Parse Chunk → Update Message → Process Tags → Update UI → Save State
     ↓              ↓              ↓              ↓              ↓              ↓
  SSE Chunk → parseDelta() → appendMessage() → processTags() → smartScroll() → debouncedSave()
```

### 3. Tag Processing Pipeline
```
Tag Detected → Validate Context → Execute Action → Update State → Trigger Follow-up
     ↓              ↓              ↓              ↓              ↓
  parseTag() → checkConditions() → executeRoll() → updateGame() → sendNarration()
```

## Error Handling Patterns

### 1. Graceful Degradation
```javascript
try {
  await aiProvider.sendMessage(messages, model)
} catch (error) {
  // Log error details
  console.error('AI request failed:', error)

  // Show user-friendly message
  showErrorMessage('AI service temporarily unavailable')

  // Allow retry or fallback
  offerRetryOption()
}
```

### 2. Data Recovery
```javascript
export async function loadData() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return validateAndNormalize(data)
  } catch (error) {
    console.warn('Data loading failed, using defaults:', error)
    return { ...DEFAULT_DATA }
  }
}
```

## Performance Patterns

### 1. Lazy Loading
```javascript
// Load heavy components only when needed
export async function loadCombatHUD() {
  if (!combatHUDLoaded) {
    const module = await import('./components/CombatHUD.js')
    combatHUDLoaded = true
    return module.renderCombatHUD
  }
  return cachedCombatHUD
}
```

### 2. Memoization
```javascript
// Cache expensive calculations
const statCache = new Map()

export function calculateAC(character) {
  const key = JSON.stringify(character.equipment)
  if (statCache.has(key)) {
    return statCache.get(key)
  }

  const ac = computeAC(character)
  statCache.set(key, ac)
  return ac
}
```

## Testing Patterns

### 1. Tag Parser Testing
```javascript
// src/engine/TagParser.spec.js
describe('TagParser', () => {
  it('parses LOCATION tags correctly', () => {
    const content = "You enter LOCATION[Dark Forest]"
    const result = tagParser.parse(content)

    expect(result.tags).toContainEqual({
      type: 'LOCATION',
      value: 'Dark Forest',
      id: expect.any(String)
    })
  })
})
```

### 2. Store Testing
```javascript
describe('Store', () => {
  it('persists data correctly', async () => {
    const store = new Store()
    await store.initialize()

    await store.update(state => {
      state.characters.push(testCharacter)
    })

    const saved = localStorage.getItem(STORAGE_KEY)
    expect(JSON.parse(saved).characters).toContain(testCharacter)
  })
})
```

These architectural patterns provide a solid foundation for the D&D PWA, enabling complex game mechanics, real-time AI integration, and maintainable code structure. The patterns are designed to scale with feature additions while maintaining performance and user experience standards.
