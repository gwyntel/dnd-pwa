# Copilot Instructions for dnd-pwa

## Project Overview
A solo D&D 5e adventure PWA powered by OpenRouter AI. Vanilla JS (ES6+), no frameworks. Players create characters, build worlds, start games, and interact with an AI Dungeon Master that understands D&D mechanics, renders dynamic narrative, and processes dice rolls via a tag-based command system.

## Core Architecture

### Data Model & Storage
- **Centralized Store** (`src/state/store.js`): In-memory state cache wrapping `localStorage`
  - Single source of truth for all app state
  - Methods: `store.get()`, `store.update(updaterFn)`, `store.getGame(id)`, `store.getCharacter(id)`
  - Debounced persistence (default 300ms) prevents excessive writes during streaming
  - Immediate save option: `store.update(..., { immediate: true })`
  - Used by all views: `game.js`, `characters.js`, `worlds.js`
- **Low-level storage** (`src/utils/storage.js`): localStorage wrapper used internally by Store
  - Handles serialization/deserialization
  - Provides `normalizeCharacter()` for backward compatibility
  - Store wraps but doesn't replace this layer
- **Data schema** stored in `localStorage` key `"data"`:
  - `characters[]` — Created character sheets with full D&D 5e stats
  - `worlds[]` — Campaign worlds with system prompts (guides AI behavior)
  - `games[]` — Active/completed adventures; each game stores messages, state, cumulative usage
  - `settings` — User preferences (model selection, theme, reasoning tokens)
  - `models[]` — Cached OpenRouter model metadata (fetched on-demand, includes pricing & reasoning support)
- **No persistence backend**; all state local to browser
- Normalization via `normalizeCharacter()` handles legacy character formats

### Game Loop & Message Flow (`src/engine/GameLoop.js` and `src/views/game.js`)
1. Player sends text input → `handlePlayerInput()` adds user message to `game.messages` (in `game.js`).
2. `GameLoop.sendMessage()` (formerly in `game.js`) constructs API request:
   - Sanitizes messages via `GameLoop.sanitizeMessagesForModel()`.
   - Builds system prompt + message history.
   - Calls OpenRouter chat completion (streaming).
3. **Real-time streaming** processes chunks via `GameLoop.sendMessage()`:
   - Extracts `<think>` tags for reasoning display.
   - Delegates game tag parsing and side effects to `TagProcessor.processGameCommandsRealtime()`.
   - Updates UI immediately; no post-processing lag.
4. `TagProcessor.processGameCommands()` (formerly in `game.js`) extracts and applies tag semantics:
   - `LOCATION[name]` — Updates `game.currentLocation`, adds to `visitedLocations`.
   - `ROLL[type|key|dc|flag]` — Semantic rolls (skill, save, attack) with D&D modifiers.
   - `COMBAT_START[desc]`, `COMBAT_CONTINUE`, `COMBAT_END[outcome]` — Combat state management via `CombatManager.startCombat()`/`endCombat()`.
   - `DAMAGE[target|amount]`, `HEAL[target|amount]` — HP adjustments.
   - `INVENTORY_*`, `STATUS_ADD/REMOVE`, `RELATIONSHIP[npc|value]` — State updates.
   - `ACTION[...]` — Suggested player choices (displayed as quick-action bubbles).

### Tag System & Roll Batching
- **Tags drive game mechanics**: AI generates tags in narrative; system parses and executes
- **Roll batching** (`ROLL_SETTLING_DELAY_MS = 500ms`): Collects multiple rolls in a message, then triggers a single follow-up narration (avoids spam)
- **Deferred batch**: If streaming is active when a batch completes, batch is queued and processed after streaming ends

### AI Integration (`src/utils/openrouter.js`)
- **OpenRouter API** provides 100+ model access with standardized interface
- **Reasoning support detection** (`detectReasoningType()`):
  - `"effort"` models (OpenAI o1/o3/gpt-5, Grok): use `reasoning.effort` ("low"/"medium"/"high")
  - `"max_tokens"` models (Anthropic Claude, Gemini, DeepSeek): use `reasoning.max_tokens`
  - **Hybrid models** (DeepSeek, etc.): streaming refactored to handle reasoning-only chunks; message element created in DOM when either reasoning or content arrives
- **Structured outputs** via JSON schema (if model supports `"structured_outputs"` in `supportedParameters`)
- **Streaming**: SSE parser yields chunks; client handles errors mid-stream with legible messages
- **Error handling**: HTTP status codes mapped to user-friendly messages (402=credits, 429=rate limit, 502=provider down, etc.)

### Character & World Generation
- **AI-generated characters** (`generateCharacterWithLLM()`):
  - System prompt: `CHARACTER_LLM_SYSTEM_PROMPT` enforces strict JSON schema output
  - Optionally uses structured outputs if model supports it
  - Normalizes response via `normalizeJsonCharacter()` to handle various AI formats
- **AI-generated worlds** (`generateWorldWithAI()`):
  - Similar structured output pattern; generates world metadata + system prompt
  - System prompt becomes the world's guide for all adventures within it
- **Templates**: Shared templates in `BEGINNER_TEMPLATES` (characters, now in `src/data/archetypes.js`) and `WORLD_TEMPLATES` (worlds, now in `src/data/worlds.js`) seed quick-start options

### Combat & State Management
- **Initiative tracking**: `game.combat.initiative[]` sorted by total; `game.combat.currentTurnIndex` tracks active turn
- **Relationship tracking**: `game.relationships{}` object; trimmed to `maxRelationshipsTracked` (default 50) keeping most-recent entries
- **Location history**: `game.visitedLocations[]` trimmed to `maxLocationsTracked` (default 10)
- **Cumulative usage**: `game.cumulativeUsage` tracks tokens + cost across all turns in a game

### Dice System (`src/utils/dice.js` & `dice5e.js`)
- **Notation parsing**: `parseNotation("1d20+5")` → `{count, sides, modifier}`
- **Core roll**: `roll(input)` returns `{notation, rolls[], subtotal, total, crit?}`
- **Advantage/disadvantage**: `rollAdvantage()`, `rollDisadvantage()` return both rolls + chosen
- **D&D 5e helpers**: `rollSkillCheck()`, `rollSavingThrow()`, `rollAttack()` apply character modifiers
- **Crit detection**: Metadata for Nat 20 / Nat 1 on d20; purely additive, not assumed by callers

## Developer Workflows

### Local Development
- `npm run dev` — Vite dev server (hot reload)
- `npm run build` — Production bundle
- **Browser dev tools**: Inspect `localStorage` key `"data"` to debug game state; console logs prefixed with `[flow]`, `[dice]`, `[combat]` for trace
- **Manual testing**: No automated tests; full e2e via browser

### Adding Features
- **New game tags**: Add regex + parsing logic in `processGameCommandsRealtime()` + `processGameCommands()` (game.js); document in `src/data/tags.js`
- **New dice mechanics**: Extend `dice5e.js` with skill/save/attack wrappers
- **New world types**: Add template to `WORLD_TEMPLATES` in `src/data/worlds.js`
- **New character templates**: Add to `BEGINNER_TEMPLATES` in `src/data/archetypes.js`

## Key Architectural Decisions

### Why Real-Time Streaming Tags?
- Narrative updates appear instantly without waiting for full response
- Combat state, location, HP changes reflect mid-sentence (feels reactive)
- Deferred roll batches prevent cascading AI requests

### Why Vanilla JS?
- PWA-first: single-file deployable, minimal footprint, works offline
- No build complexity for routing, state, templating
- Direct DOM control for streaming UI updates

### Why Proxy Pattern?
- `src/utils/proxy.js` provides abstraction; future backends can be swapped
- Currently OpenRouter-direct; Cloudflare Workers pattern available

## Project-Specific Conventions

### Message Sanitization
`sanitizeMessagesForModel()` removes stale `ACTION[...]` suggestions from old assistant messages to save context tokens, but **preserves all canonical game tags** (LOCATION, ROLL, DAMAGE, etc.) so AI can reason about past state. The `stripTags` function in `TagProcessor.js` also cleans up whitespace from `ACTION` tags to prevent empty lines in the output.

### HTML Escaping & Markdown Parsing
- `escapeHtml()` → prevents XSS in user names, item names, etc.
- `parseMarkdown()` → **bold** `**text**`, *italic* `*text*`, `code` inline; game tags stripped during `stripTags()` before rendering
- Location icons via `getLocationIcon()` (heuristic matching on location name)

### Error Recovery
- Streaming errors mid-completion are caught and logged but don't break UI
- Validation errors in character creation show inline feedback (e.g., hit dice format)
- Model availability fallback: if game's model no longer exists, auto-switch to default model

## File Structure Overview
```
src/
  data/
    archetypes.js — Character templates (BEGINNER_TEMPLATES)
    worlds.js — World templates (WORLD_TEMPLATES)
    tags.js — Game tag reference documentation (TAG_REFERENCE)
    icons.js — UI icons and emoji utilities
  engine/
    GameLoop.js — Game loop and AI streaming logic
    TagProcessor.js — Game tag parsing and execution
    CombatManager.js — Combat state and initiative tracking
  state/
    store.js — Centralized state management (in-memory cache + localStorage)
  utils/
    auth.js — PKCE OAuth flow
    storage.js — localStorage interface + normalization
    dice.js — Core dice parsing & rolling
    dice5e.js — D&D 5e skill/save/attack mechanics
    openrouter.js — OpenRouter API client
    model-utils.js — Model metadata & provider selection
    proxy.js — Proxy abstraction (unused in current deployment)
  views/
    game.js — Main gameplay UI and event handling
    characters.js — Character CRUD + AI generation
    worlds.js — World CRUD + AI generation
    prompts/
      game-dm-prompt.js — Builds system prompt for game turns
  router.js — Client-side navigation
  main.js — App initialization
```

## Common Tasks

**Add a new game tag:**
1. Document format in `src/data/tags.js` (TAG_REFERENCE)
2. Add regex + logic to `processGameCommandsRealtime()` in game.js
3. Add corresponding side effect (state mutation)
4. Test via console: `rollDice()` or manual tag in AI response

**Support new reasoning model:**
1. Model auto-detected by `detectReasoningType()` in openrouter.js
2. If needed, add model name pattern to detection logic
3. Reasoning tokens extracted from usage data during streaming

**Customize AI behavior per world:**
Edit the `systemPrompt` field in that world's record (worlds.js template or custom world form). System prompt is prepended to every message in that game.

---
**Key Principle**: Game state lives in `localStorage`; AI context is built dynamically from messages + system prompt. Streaming & tag parsing are real-time; no separate "apply changes" phase.

**Maintenance Note**: As code changes are made, this file and .clinerules/CLINE.md should be updated to reflect new patterns, architectural shifts, or developer workflows so future AI agents remain aligned with the evolving codebase.
