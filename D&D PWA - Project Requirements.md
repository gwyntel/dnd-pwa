# D&D PWA - Project Requirements

## Overview
A progressive web app for single-player D&D-style text adventures powered by LLMs via OpenRouter. Static hosting on Cloudflare Pages, vanilla JavaScript, client-side only.

## Version 1.0 - Core Features

### Authentication
- **OpenRouter PKCE OAuth**
  - Client-side OAuth 2.0 flow
  - No backend required
  - Store access token in sessionStorage (cleared on tab close)
  - Refresh token handling
  - Handle token expiration gracefully

### Model Selection
- **OpenRouter Model Selector**
  - Fetch available models from OpenRouter API
  - Display model list with:
    - Name
    - Context window
    - Pricing (input/output tokens)
    - Reasoning token support indicator
    - Provider (Anthropic, OpenAI, etc.)
  - Filter/search functionality
  - Set default narrative model globally
  - Override model per game
  - Future: Separate suggestion model (v1.1+)

- **OpenRouter Integration**
  - All API calls include app attribution header:
    - `HTTP-Referer: https://github.com/gwyntel/dnd-pwa`
    - `X-Title: D&D PWA`
  - Track token usage per request:
    - Prompt tokens
    - Completion tokens
    - Reasoning tokens (when supported)
  - Display usage statistics in UI
  - Request streaming responses for better UX

### Character Management
- **Custom Character Creator**
  - D&D 5e standard attributes:
    - Name, Race, Class, Level
    - Six stats: STR, DEX, CON, INT, WIS, CHA
    - Max HP, AC (Armor Class)
    - Skills selection
    - Inventory system
    - Backstory (optional)
  - **Beginner-Friendly Features**
    - Pre-built character templates (Fighter, Wizard, Rogue, Cleric)
    - "Quick Start" button - random balanced character
    - Explanations for each stat/field
    - Suggested skill combinations by class
    - Starting equipment included
  - Save multiple characters
  - Reuse characters across games
  - Edit existing characters

### Game Management
- **Create New Game**
  - Select character (from saved characters)
  - Set game title
  - Choose narrative model
  - Generate initial scene via LLM

- **Game State Tracking**
  - Current HP (separate from character max)
  - Current location
  - Quest log (active/completed)
  - Inventory (can differ from character template)
  - Status conditions (poisoned, exhausted, etc.)
  - Combat state (when in combat)

- **Multiple Campaigns**
  - Create and manage multiple games
  - Each game maintains independent state
  - Last played timestamp
  - Total play time tracking

### Gameplay
- **Turn-based Text Adventure**
  - DM narration from LLM
  - Free-text player input
  - Streaming LLM responses for better UX
  - Conversation history display

- **Beginner-Friendly Design**
  - No D&D knowledge required
  - LLM explains game mechanics naturally
  - Optional tutorial/intro game
  - Tooltips for stats and terms
  - Clear visual feedback for all actions

- **Dice Rolling System**
  - Client-side random dice rolls
  - Support standard D&D notation (1d20, 2d6+3, etc.)
  - Advantage/Disadvantage (roll 2d20, take higher/lower)
  - Display roll results in chat
  - Visual dice animation (optional)
  - LLM requests rolls via structured output
  - App performs roll and injects result back to LLM

- **Combat System**
  - **LLM-Driven Combat Detection**
    - LLM determines when player initiates combat
    - LLM identifies when enemies engage
    - LLM outputs structured COMBAT_START signal
    - App transitions UI to combat mode automatically
  - Initiative tracking (automatic d20 rolls)
  - Turn order display
  - Enemy HP/AC tracking (LLM manages)
  - Combat round counter
  - Clear visual indicator when in combat
  - LLM outputs COMBAT_END when battle concludes

- **System Prompts**
  - Include character sheet in context
  - Include current game state
  - D&D 5e rules enforcement (simplified for beginners)
  - Structured output for:
    - Dice rolls: `ROLL[type|modifier|DC]`
    - Combat start: `COMBAT_START[enemies]`
    - Combat end: `COMBAT_END[outcome]`
    - Damage: `DAMAGE[target|amount]`
    - Healing: `HEAL[target|amount]`
  - Beginner-friendly explanations
  - Concise but atmospheric narration
  - Explain rolls and mechanics naturally

### Data Storage
- **localStorage**
  - Primary storage for all game data
  - Store complete game state (see schema below)
  - Auto-save on every state change (debounced 300ms)
  - Persist across sessions

- **Export/Import**
  - Export all data as JSON file
  - One-click download
  - Import from JSON file
  - Validate schema on import
  - Optional: Encrypt exports with user password

### UI/UX Requirements
- **Responsive Design**
  - Mobile-first approach
  - Works on phones, tablets, desktops
  - Touch-friendly controls
  - Readable text sizes

- **Beginner Onboarding**
  - Optional tutorial on first launch
  - "New to D&D?" intro explaining basic concepts
  - Tooltips for game terms (hover/tap on STR, AC, d20, etc.)
  - Example character templates (pre-built for quick start)
  - Suggested actions for first few turns

- **Dark/Light Theme**
  - Three options: Light, Dark, Auto (follow system)
  - Auto mode uses `prefers-color-scheme` media query
  - Respects system theme changes in real-time
  - Save preference in settings
  - Default to Auto (system preference)

- **Chat Interface**
  - Scrollable message history
  - DM messages styled differently from player
  - System messages (dice rolls) styled distinctly
  - Combat state clearly highlighted
  - Auto-scroll to latest message
  - Timestamps (optional display)
  - Loading indicator during LLM streaming

- **Navigation**
  - Home/Dashboard (list of games)
  - Character creator/list with templates
  - Settings page
  - In-game view
  - Model selector

### Error Handling
- **API Failures**
  - Display error messages clearly
  - Retry mechanism for transient failures
  - Graceful degradation
  - Don't lose player input on error

- **Data Validation**
  - Validate imported JSON
  - Handle corrupted localStorage
  - Migrate old schema versions

## Data Schema v1.0

```json
{
  "version": "1.0.0",
  "lastModified": "ISO-8601 timestamp",
  
  "settings": {
    "defaultNarrativeModel": "string",
    "theme": "auto|light|dark",
    "autoSave": true,
    "diceAnimation": true,
    "hasSeenTutorial": false
  },
  
  "characterTemplates": [
    {
      "id": "template_fighter",
      "name": "Brave Fighter",
      "description": "Strong warrior good at combat",
      "race": "Human",
      "class": "Fighter",
      "level": 1,
      "stats": { "strength": 16, "dexterity": 12, "constitution": 14, "intelligence": 10, "wisdom": 11, "charisma": 8 },
      "maxHP": 12,
      "armorClass": 16,
      "skills": ["Athletics", "Intimidation"],
      "inventory": [
        { "item": "Longsword", "equipped": true },
        { "item": "Chain Mail", "equipped": true },
        { "item": "Shield", "equipped": true }
      ]
    }
  ],
  
  "characters": [
    {
      "id": "uuid",
      "name": "string",
      "race": "string",
      "class": "string",
      "level": 1,
      "stats": {
        "strength": 10,
        "dexterity": 10,
        "constitution": 10,
        "intelligence": 10,
        "wisdom": 10,
        "charisma": 10
      },
      "maxHP": 10,
      "armorClass": 10,
      "skills": ["string"],
      "inventory": [
        {
          "item": "string",
          "equipped": false,
          "quantity": 1
        }
      ],
      "backstory": "string",
      "createdAt": "ISO-8601 timestamp",
      "fromTemplate": "template_id or null"
    }
  ],
  
  "games": [
    {
      "id": "uuid",
      "title": "string",
      "characterId": "uuid reference",
      "narrativeModel": "string",
      
      "currentHP": 10,
      "currentLocation": "string",
      "questLog": [
        {
          "title": "string",
          "description": "string",
          "status": "active|completed|failed"
        }
      ],
      "inventory": [],
      "conditions": ["string"],
      
      "combat": {
        "active": false,
        "round": 0,
        "initiative": [
          {
            "name": "string",
            "initiative": 0,
            "isPlayer": false,
            "hp": 0,
            "maxHp": 0,
            "ac": 0
          }
        ],
        "currentTurnIndex": 0
      },
      
      "messages": [
        {
          "id": "uuid",
          "role": "system|assistant|user",
          "content": "string",
          "timestamp": "ISO-8601 timestamp",
          "hidden": false,
          "metadata": {
            "diceRoll": { "notation": "1d20+2", "result": 15 },
            "combatEvent": "start|end|damage|heal"
          }
        }
      ],
      
      "createdAt": "ISO-8601 timestamp",
      "lastPlayedAt": "ISO-8601 timestamp",
      "totalPlayTime": 0
    }
  ]
}
```

## Technical Stack

### Core Technologies
- **Vanilla JavaScript** (ES6+)
- **HTML5** + **CSS3**
- **localStorage API**
- **Fetch API** for OpenRouter calls
- **File API** for export/import

### Build Tools
- **Vite** (dev server + build)
- **No framework dependencies**
- Static output for Cloudflare Pages

### PWA Features (v1.0)
- Service Worker for offline shell
- Web App Manifest
- Install prompt
- Note: Actual gameplay requires internet (LLM API)

### APIs Used
- **OpenRouter API** (https://openrouter.ai/api/v1)
  - Authentication: Bearer token
  - Streaming: Server-Sent Events
  - Model listing endpoint
  - Chat completions endpoint

## Future Versions

### v1.1 - Enhanced Suggestions
- Separate "suggestion model" (cheaper/faster)
- Display 3-5 suggested actions per turn
- Click to use suggestion

### v1.2 - Google Drive Sync
- OAuth for Google Drive
- Auto-sync to appDataFolder
- Conflict resolution
- Sync all games + characters

### v1.3 - Advanced Features
- Custom system prompts per game
- Character portrait uploads
- Sound effects / ambient audio
- Dice roll history
- Game statistics (monsters defeated, etc.)

### v1.4 - Sharing & Community
- Export individual characters (share with friends)
- Import community characters
- Adventure templates

## Non-Requirements (Out of Scope)
- ❌ Multiplayer support
- ❌ Backend server
- ❌ User accounts (account-less by design)
- ❌ Offline gameplay (requires LLM)
- ❌ Voice input/output
- ❌ Real-time collaboration
- ❌ Payment processing (users bring own OpenRouter key)

## Success Criteria
- ✅ Works on mobile and desktop browsers
- ✅ Installs as PWA
- ✅ Data persists across sessions
- ✅ Smooth LLM streaming experience
- ✅ Intuitive character creation
- ✅ Clean, readable chat interface
- ✅ Fast load times (<2s on 3G)
- ✅ Zero backend infrastructure costs

## Development Phases

**Phase 1: Foundation** (Week 1-2)
- Project setup (Vite)
- OpenRouter auth flow
- Basic UI shell
- localStorage wrapper

**Phase 2: Character & Data** (Week 2-3)
- Character creator
- Data schema implementation
- Export/import functionality
- Settings page

**Phase 3: Gameplay** (Week 3-5)
- Game creation flow
- Chat interface
- LLM integration (streaming)
- Dice rolling system
- Combat state machine

**Phase 4: Polish** (Week 5-6)
- Error handling
- Loading states
- Animations
- PWA manifest + service worker
- Testing & bug fixes

**Phase 5: Deploy**
- Cloudflare Pages setup
- Documentation
- Launch