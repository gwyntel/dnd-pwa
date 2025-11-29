# D&D PWA - Codebase Survey

## Project Overview
- **Name**: dnd-pwa
- **Type**: Progressive Web Application for single-player D&D 5e adventures
- **Tech Stack**: Vanilla JavaScript (ES6+), Vite, Tailwind CSS
- **AI Integration**: OpenRouter, OpenAI-compatible APIs, LM Studio
- **Architecture**: Modular engine-based system with centralized state
- **Testing**: Vitest with jsdom
- **Deployment**: Cloudflare Pages

## Project Structure

### Core Directories
- `/src/` - Main source code
  - `/components/` - UI components (React-like structure)
  - `/data/` - Static data (templates, monsters, items, tags, icons)
  - `/engine/` - Game logic (GameLoop, TagProcessor, CombatManager, etc.)
  - `/state/` - Centralized Store for state management
  - `/utils/` - Utility functions (storage, auth, dice, AI providers, migrations, prompts)
  - `/views/` - Page-level components

### Key Files
- `src/main.js` - Entry point, initializes router, store, auth
- `src/router.js` - Client-side routing with dynamic params
- `src/state/store.js` - Centralized state management (in-memory cache + localStorage)
- `index.html` - App shell
- `vite.config.js` - Build configuration
- `wrangler.toml` - Cloudflare Pages deployment

## Tech Stack Analysis

### Runtime & Framework
- **Runtime**: Vanilla JavaScript (ES6+, type="module")
- **Build Tool**: Vite v7.1.7
- **UI**: Component-based architecture (React patterns), Tailwind CSS v4.1.17
- **Testing**: Vitest v4.0.13 with jsdom
- **State Management**: Custom centralized Store pattern with debounced persistence

### Dependencies
- **UI**: class-variance-authority (0.7.1), clsx (2.1.1), lucide-react (0.553.0), tailwind-merge (3.3.1)
- **AI**: openai (4.104.0)
- **Development**: TypeScript (5.9.3), jsdom, tailwindcss-animate, terser

### Production Features
- **PWA**: Service worker, manifest, offline support
- **Responsive**: Mobile-first design
- **Local Storage**: All data stored client-side
- **Cross-Platform**: Desktop, tablet, mobile

## Major Features Discovered

### Core Gameplay Features (1-10)
1. **AI-Powered DM** - Dynamic narrative generation via OpenRouter
2. **Full D&D 5e Mechanics** - Character sheets, skills, saves, combat
3. **Dice Rolling System** - Advantage/disadvantage, automatic modifiers, batching
4. **Combat System** - Turn-based with initiative, enemy spawning, damage tracking
5. **Character Management** - Create/manage D&D 5e characters with full stats
6. **World Building** - Custom campaigns with lore, system prompts, settings
7. **Inventory System** - Items, equipment, gold with state management
8. **Spellcasting** - Spell slots, concentration, cantrips
9. **Rest Mechanics** - Short rest (hit dice), long rest (full recovery)
10. **Location Tracking** - History, fast travel, current location display

### Character Features (11-20)
11. **AI Character Generation** - Describe concept → AI creates complete sheet
12. **Template System** - Pre-built character templates (BEGINNER_TEMPLATES)
13. **Custom Characters** - Manual creation with full 5e stats
14. **Stat Management** - STR, DEX, CON, INT, WIS, CHA with automatic modifiers
15. **Skill Proficiencies** - Customizable skills with expertise
16. **Class Features** - Level progression, class resources (Ki, Channel Divinity)
17. **Racial Traits** - Race-based abilities and bonuses
18. **Backstory Generation** - AI-powered character backstories
19. **Equipment** - Weapons, armor, shields with AC calculation
20. **Condition Tracking** - Status effects (Blinded, Poisoned, etc.)

### World Features (21-30)
21. **World Templates** - 7 pre-built types (Classic Fantasy, Urban Noir, High Seas, etc.)
22. **AI World Generation** - Describe concept → AI creates complete setting
23. **Custom World Building** - Manual creation with system prompts
24. **Magic Level** - None, Low, Medium, High magic settings
25. **Tech Level** - Primitive to Sci-Fi technology scaling
26. **Tone Settings** - Dark, Lighthearted, Noir, Heroic atmosphere
27. **Faction Systems** - Built-in faction tracking and politics
28. **Starting Locations** - Customizable initial adventure locations
29. **World Items** - Custom items per world
30. **System Prompts** - Per-world AI instructions

### AI & Model Features (31-45)
31. **Model Selection** - 100+ AI models via OpenRouter
32. **Reasoning Tokens** - DeepSeek, OpenRouter-style, <think> tag support
33. **Temperature Control** - AI creativity adjustment (0.0-2.0)
34. **Multiple Providers** - OpenRouter, OpenAI, LM Studio, custom endpoints
35. **Streaming Responses** - Real-time token streaming
36. **Token Usage Tracking** - Prompt, completion, reasoning tokens
37. **Cost Calculation** - Real-time cost tracking per model pricing
38. **Context Management** - Message sanitization, ephemeral messages
39. **Structured Outputs** - JSON schema support for reliable parsing
40. **Caching** - Optional caching for repeated queries
41. **Hybrid Models** - Models that stream reasoning before content
42. **Model Metadata** - Detailed model information, context lengths
43. **Default Models** - Environment variable configuration
44. **Provider Switching** - Runtime provider changes
45. **Nitro Models** - Fast throughput optimization

### Advanced Features (46-60)
46. **Theme System** - 6 color themes (auto, light, dark, warm, cool, forest, midnight)
47. **Usage Tracking** - Real-time token usage and cost display
48. **Suggested Actions** - AI-powered action suggestions
49. **Data Export/Import** - Backup/restore games, characters, worlds
50. **Relationships** - NPC relationship tracking with values
51. **Quest Log** - Active quests and objectives
52. **Experience Tracking** - XP gain, level progression
53. **Death Saves** - 0 HP death saving throw mechanics
54. **Hit Dice** - Recovery mechanics with Constitution modifiers
55. **Inventory Management** - Add, remove, equip, unequip items
56. **Currency** - Gold piece tracking
57. **Combat HUD** - Turn order, enemy HP, current actor display
58. **Roll History** - Persistent dice roll display
59. **Combat Reminders** - AI prompts for active combat
60. **Character HUD** - Stats, HP, AC, spell slots, conditions

### UI/UX Features (61-70)
61. **Responsive Design** - Mobile-first responsive interface
62. **Loading States** - Spinner during AI processing
63. **Real-time Updates** - Live message appending during streaming
64. **Smart Scrolling** - Auto-scroll respects user manual scroll
65. **Action Bubbles** - Clickable suggested actions
66. **Modal System** - Level-up, migration popups
67. **Navigation** - Client-side routing with browser history
68. **Form Validation** - Character/game creation validation
69. **Error Handling** - User-friendly error messages
70. **Accessibility** - Semantic HTML, ARIA patterns

### Technical Features (71-80)
71. **Migrations** - Data migration system (backfill-monsters, inventory-v2)
72. **AI-Migrations** - AI-powered data migrations
73. **PWA Features** - Service worker, manifest, offline support
74. **Security** - PKCE OAuth, secure token storage
75. **Debounced Saves** - 300ms debounce prevents race conditions
76. **State Persistence** - Automatic localStorage with Store wrapper
77. **Code Splitting** - ES6 modules, lazy loading ready
78. **Testing** - Vitest setup with jsdom
79. **Environment Variables** - Vite env variable support
80. **Cloudflare Workers** - Edge deployment ready

### Data Management (81-85)
81. **Character Validation** - Schema validation for character data
82. **World Data** - Static world templates and customization
83. **Monster Database** - D&D 5e monsters with stats
84. **Item Database** - Weapons, armor, consumables with effects
85. **Spell Database** - D&D 5e spells with mechanics

## Architecture Patterns

### State Management Pattern
- **Centralized Store**: Singleton pattern with in-memory cache
- **Persistence**: Debounced localStorage saves (300ms default)
- **Reactivity**: Subscriber pattern for UI updates
- **Data Flow**: Unidirectional (actions → store → UI)
- **Key Methods**: `get()`, `update(updaterFn, options)`, `subscribe()`, `flush()`

### Modular Engine Design
- **Separation of Concerns**: Each engine handles specific game mechanics
- **Pure Functions**: Most engine functions are pure with explicit inputs/outputs
- **Event-Driven**: Tag system triggers game mechanics
- **Composability**: Engines can call each other (e.g., TagProcessor calls CombatManager)

### Tag System Architecture
- **Centralized Definitions**: All tags defined in `src/data/tags.js`
- **Regex Parsing**: Safe tag extraction with validation in TagParser
- **Real-time Processing**: Tags processed during AI streaming
- **Deferred Execution**: Roll batching system for follow-up narration
- **Whitespace Handling**: Automatic cleaning around ACTION tags

### AI Integration Pattern
- **Provider Abstraction**: `getProvider()` returns configured AI provider
- **Streaming Support**: Real-time token streaming with usage tracking
- **Reasoning Support**: Multiple reasoning formats (OpenRouter, DeepSeek, <think>)
- **Error Handling**: Graceful fallbacks and user-friendly errors
- **Context Management**: Message trimming, ephemeral messages

### Component Architecture
- **React-like Pattern**: Functional components returning HTML strings
- **Composition**: Components composed together in views
- **Props**: Data passed as function parameters
- **Side Effects**: Event listeners attached after DOM rendering
- **Re-rendering**: Manual DOM updates via innerHTML

### Authentication Pattern
- **PKCE OAuth**: Secure client-side flow without backend
- **Token Storage**: Session storage with localStorage fallback
- **Provider Agnostic**: Supports OpenRouter, custom OpenAI endpoints, LM Studio
- **Auto-login**: Environment variable support for seamless auth

## Key Data Structures

### Character Object
```javascript
{
  id: string,
  name: string,
  race: string,
  class: string,
  level: number,
  xp: number,
  stats: { str, dex, con, int, wis, cha },
  maxHP: number,
  armorClass: number,
  proficiencies: string[],
  knownSpells: string[],
  spellSlots: { [level]: { current, max } },
  classResources: [{ name, current, max, recoversOn }],
  hitDice: { current, max, dieType },
  inventory: [{ id, item, quantity, equipped }],
  background: string,
  systemPrompt: string
}
```

### Game Object
```javascript
{
  id: string,
  title: string,
  characterId: string,
  worldId: string,
  narrativeModel: string,
  currentHP: number,
  currentLocation: string,
  visitedLocations: string[],
  questLog: string[],
  inventory: [{ id, item, quantity, equipped }],
  currency: { gp: number },
  conditions: string[],
  relationships: { [npcName]: number },
  combat: {
    active: boolean,
    initiative: [{ type, name, initiative, enemyId }],
    enemies: [{ id, name, templateId, hp: { current, max }, stats }],
    currentTurnIndex: number,
    lastActor: string
  },
  restState: {
    lastShortRest: string,
    lastLongRest: string,
    shortRestsToday: number
  },
  concentration: { spellName, timestamp },
  suggestedActions: string[],
  messages: [{ id, role, content, timestamp, hidden, metadata }],
  cumulativeUsage: {
    promptTokens: number,
    completionTokens: number,
    reasoningTokens: number,
    totalTokens: number,
    totalCost: number
  },
  createdAt: string,
  lastPlayedAt: string,
  totalPlayTime: number
}
```

### World Object
```javascript
{
  id: string,
  name: string,
  description: string,
  systemPrompt: string,
  magicLevel: string,
  techLevel: string,
  tone: string,
  startingLocation: string,
  isDefault: boolean,
  items: [{ id, name, effects }]
}
```

### Message Object
```javascript
{
  id: string,
  role: 'system' | 'user' | 'assistant',
  content: string,
  timestamp: string,
  hidden: boolean,
  metadata: {
    diceRoll?: object,
    type?: string,
    key?: string,
    dc?: number,
    success?: boolean,
    rollResult?: boolean,
    ephemeral?: boolean,
    combatReminder?: boolean,
    reasoning?: string,
    reasoningTokens?: number,
    reasoningType?: 'openrouter' | 'deepseek' | 'think_tags',
    isError?: boolean,
    [key: string]: any
  }
}
```

## Critical Implementation Paths

### Game Flow
1. User authentication → Store initialization → Router setup
2. Character creation → Game creation → AI DM interaction
3. User input → Message appended → API call with streaming
4. AI response → Tag parsing → Real-time game mechanics
5. Roll batching → Follow-up narration → State persistence

### Combat Flow
1. COMBAT_START tag → CombatManager.startCombat()
2. Initiative rolls → Sorted turn order → CombatHUD update
3. ENEMY_SPAWN → Enemy creation → Initiative assignment
4. Damage application → HP tracking → Death checks
5. Turn advancement → AI narration → COMBAT_END

### Character Progression
1. XP_GAIN → XP accumulation → Level check
2. Level up → Ability score improvement → New features/spells
3. Spell acquisition → Known spells update → Slot calculation
4. Equipment changes → AC recalculation → Inventory update

### State Persistence
1. Store.update() called → Updater function mutates state
2. Debounced save triggered → localStorage serialization
3. Subscribers notified → UI components re-render
4. Immediate saves for critical operations (flush)

## Development Commands
- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm run deploy` - Deploy to Cloudflare Pages
- `npm test` - Run Vitest tests

## Security Considerations
- **PKCE OAuth**: Secure authentication without client secret
- **Token Storage**: Session storage with localStorage persistence
- **Content Sanitization**: TagParser sanitizes tag content
- **No XSS**: User content escaped before DOM insertion
- **Local Data**: No server-side data storage
- **CORS**: Proxy support for custom endpoints

## Performance Optimizations
- **Debounced Saves**: 300ms delay prevents excessive I/O
- **In-Memory Cache**: Store holds state in memory
- **Streaming**: Real-time AI responses without buffering
- **Roll Batching**: Collects multiple rolls before follow-up
- **Message Trimming**: Relationships and locations capped
- **Component Caching**: Reusable HTML generation

## Testing Strategy
- **Unit Tests**: TagParser.spec.js for tag parsing logic
- **Component Tests**: Could be added for UI components
- **Integration Tests**: Game loop integration tests needed
- **Manual Testing**: E2E testing via browser

## Future Considerations
- **IndexedDB**: For larger data storage needs
- **Web Workers**: Offload heavy computations
- **Service Worker Cache**: Offline AI responses
- **WebRTC**: Multiplayer potential
- **WebAssembly**: Performance-critical calculations
