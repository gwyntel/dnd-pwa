# DND-PWA Codebase Survey Results

## Project Overview
**D&D PWA** - A solo D&D 5e adventure game powered by OpenRouter AI. Built with vanilla JS ES6+ and Vite, designed as a Progressive Web App for offline play.

## Tech Stack Discovered
- **Runtime**: Node.js with Vite 7.1.7
- **Framework**: Vanilla JavaScript ES6+ (React 19.2.0 in dependencies but not used)
- **Styling**: Tailwind CSS 4.1.17 with custom utilities
- **Testing**: Vitest 4.0.13 with jsdom
- **TypeScript**: 5.9.3 (configured but mostly JS files)
- **AI Providers**: OpenRouter (primary), OpenAI-compatible, LM Studio (local)
- **Build**: Vite with PWA manifest support
- **Storage**: localStorage with comprehensive migration system

## Core Architecture Patterns

### 1. Centralized State Management
- **Store Pattern**: `src/state/store.js` provides single source of truth
- **localStorage**: All game state persisted with debounced saves
- **Subscription**: Reactive updates via `store.subscribe(listener)`
- **Migration**: Automated schema migrations with user notifications

### 2. Component Architecture
```
src/
├── components/    # 8 UI components (HUDs, modals, displays)
├── views/         # 8 page views with routing
├── engine/        # 6 game systems (combat, spells, equipment, etc.)
├── state/         # Centralized store with localStorage
├── data/          # 9 D&D 5e databases (classes, spells, items, etc.)
└── utils/         # 20+ utilities (AI, dice, storage, etc.)
```

### 3. AI Integration System
- **Multi-provider**: OpenRouter, OpenAI-compatible, LM Studio
- **Real-time streaming**: SSE with reasoning extraction
- **Tag system**: Game mechanics embedded in AI responses
- **Error handling**: Provider-specific error mapping

### 4. Game Engine Architecture
- **Tag-based commands**: AI generates semantic tags for mechanics
- **Real-time processing**: Streaming tag extraction and application
- **Batch processing**: Dice rolls and effects grouped for performance
- **State synchronization**: Store updates via debounced persistence

## Key Data Models

### Character Model
```javascript
{
  id, name, class, race, level, xp, maxHP, currentHP,
  stats: { str, dex, con, int, wis, cha },
  spellSlots: { 1: {current, max}, ...9: {current, max} },
  inventory: [{ id, name, quantity, equipped }],
  classResources: [{ name, current, max, recoversOn }],
  preparedSpells, knownSpells, spellcasting: { ability, saveDC }
}
```

### Game Model
```javascript
{
  id, title, characterId, worldId, narrativeModel,
  messages: [{ id, role, content, timestamp, metadata }],
  currentLocation, visitedLocations: [],
  combat: { active, enemies, initiative, currentTurnIndex },
  relationships: { npcName: relationshipValue },
  cumulativeUsage: { promptTokens, completionTokens, cost }
}
```

### World Model
```javascript
{
  id, name, description, coreIntent: [],
  worldOverview: [], coreLocations: [], coreFactions: [],
  systemPrompt, isDefault
}
```

## Core Systems Identified

### 1. Character System (`src/views/characters.js`)
- Character creation with AI generation
- 7 beginner templates (Knight, Rogue, Cleric, Wizard, Ranger, Bard, Barbarian)
- Full D&D 5e mechanics: hit dice, spell slots, equipment, resources
- Level progression with features and feats

### 2. World System (`src/views/worlds.js`)
- AI-generated campaign worlds
- System prompts for different campaign styles
- Template-based quick start options

### 3. Game System (`src/views/game.js`)
- Real-time AI DM with streaming responses
- Tag-based command processing
- Combat, spellcasting, inventory management
- Roll history and location tracking

### 4. Combat System (`src/engine/CombatManager.js`)
- Initiative tracking and turn management
- Enemy spawning with HP tracking
- Condition management and combat state

### 5. Spell System (`src/engine/SpellcastingManager.js`)
- Full 9-level spell slot management
- Concentration mechanics
- Preparation vs. known spell casters
- Cantrips and spell effects

### 6. Equipment System (`src/engine/EquipmentManager.js`)
- Item database with 100+ weapons, armor, consumables
- AC calculation with DEX modifiers and magic bonuses
- Equipped status and passive effects

### 7. Dice System (`src/utils/dice.js`, `src/utils/dice5e.js`)
- D&D 5e notation parsing ("1d20+5")
- Advantage/disadvantage mechanics
- Skill checks, saving throws, attack rolls
- Automated modifier application

### 8. Rest System (`src/engine/RestManager.js`)
- Short rest: hit dice healing
- Long rest: full recovery
- Class resource restoration

## Game Mechanics Engine

### Tag System (`src/data/tags.js`)
AI generates structured tags in responses:
- `LOCATION[name]` - Update current location
- `ROLL[type|key|dc|flag]` - Dice roll requests
- `COMBAT_START/END[desc]` - Combat state management
- `DAMAGE/HEAL[target|amount]` - HP adjustments
- `CAST_SPELL[spell|level]` - Spell casting
- `XP_GAIN[amount|reason]` - Experience progression
- `ACTION[choice]` - Player action suggestions

### Real-time Processing (`src/engine/TagProcessor.js`)
- Streaming tag extraction during AI responses
- Batch processing for dice rolls
- Immediate state updates and UI reflection
- Roll batching to prevent AI spam

## User Experience Features

### 1. Multi-provider Authentication
- OpenRouter OAuth flow
- OpenAI-compatible API endpoints
- LM Studio local server support
- CORS handling for different providers

### 2. Progressive Web App
- Offline capability with manifest.json
- Installable on mobile/desktop
- Responsive design with Tailwind CSS

### 3. Advanced UI Components
- Real-time reasoning display with token counts
- Combat HUD with initiative tracking
- Roll history with filtering
- Location fast-travel system
- Relationship tracking

### 4. Data Persistence
- Automatic save with debouncing
- Export/import backup functionality
- Schema migration system
- Error recovery and data validation

## Development Patterns

### 1. Error Handling
- Provider-specific error mapping
- Streaming error recovery
- Data validation and normalization
- User-friendly error messages

### 2. Performance Optimization
- Debounced localStorage saves
- Message sanitization for AI context
- Relationship/location trimming
- Component lazy loading

### 3. Testing Strategy
- Vitest with jsdom for unit tests
- TagParser has dedicated test file
- Manual E2E testing via browser

### 4. Code Organization
- Pure functions with clear separation
- Async/await patterns consistently used
- Comprehensive logging with prefixes
- Modular imports and exports

## Key Files and Their Roles

### Entry Points
- `src/main.js` - Application initialization and routing
- `index.html` - PWA manifest and Vite entry point

### Core Systems
- `src/state/store.js` - Centralized state management
- `src/utils/storage.js` - localStorage with migrations
- `src/utils/ai-provider.js` - Multi-provider AI integration

### Game Engine
- `src/engine/GameLoop.js` - AI message processing
- `src/engine/TagProcessor.js` - Real-time tag extraction
- `src/engine/CombatManager.js` - Turn-based combat
- `src/engine/SpellcastingManager.js` - Magic system

### Data Layer
- `src/data/` - 9 databases (classes, spells, items, monsters, etc.)
- `src/utils/prompts/` - AI system prompts

### UI Layer
- `src/views/` - 8 main page components
- `src/components/` - 8 reusable UI components

## Development Commands
- `npm run dev` - Start Vite dev server
- `npm run build` - Production build
- `npm test` - Run Vitest suite
- `npm run deploy` - Deploy to Cloudflare Pages

## Next Development Priorities
Based on codebase analysis:
1. Enhanced combat automation
2. Expanded spell database
3. Multi-character party support
4. Advanced AI reasoning improvements
5. Mobile-optimized controls
6. Performance monitoring

## Notes for Future Development
- Store system provides excellent scalability for features
- Tag system allows rich AI-game interaction
- Multi-provider support future-proofs AI integration
- PWA architecture enables offline gameplay
- Component separation supports incremental development
