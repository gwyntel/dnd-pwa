# Cline Instructions for dnd-pwa

## Project Overview
A solo D&D 5e adventure PWA powered by OpenRouter AI. Vanilla JS (ES6+), no frameworks. Players create characters, build worlds, start games, and interact with an AI Dungeon Master that understands D&D mechanics, renders dynamic narrative, and processes dice rolls via a tag-based command system.

## Core Architecture

### Data Model & Storage
- **Centralized Store** (`src/state/store.js`): In-memory state cache wrapping `localStorage`
  - Single source of truth for all app state
  - Methods: `store.get()`, `store.update(updaterFn)`, `store.getGame(id)`, `store.getCharacter(id)`, `store.getWorld(id)`, `store.getSettings()`
  - Debounced persistence (default 300ms) prevents excessive writes during streaming
  - Immediate save option: `store.update(..., { immediate: true })`
  - Subscription system for reactive UI updates: `store.subscribe(listener)`
  - Used by all views and controllers
- **Low-level storage** (`src/utils/storage.js`): localStorage wrapper used internally by Store
  - Handles serialization/deserialization and data migration
  - Provides `normalizeCharacter()` for backward compatibility
- **Data schema** stored in `localStorage` key `"data"`:
  - `characters[]` — Created character sheets with full D&D 5e stats (including spell slots, hit dice, XP progress, custom progressions, feats)
  - `worlds[]` — Campaign worlds with system prompts (guides AI behavior)
  - `games[]` — Active/completed adventures; each game stores messages, state, cumulative usage, combat data, relationship tracking
  - `settings` — User preferences (AI provider selection, model settings, UI theme, reasoning tokens)
  - `models[]` — Cached AI model metadata (fetched on-demand, includes pricing & reasoning support)
- **Migration system** (`src/utils/ai-migration.js`): Handles breaking changes to data schema + `MigrationPopup` component for user feedback
- **No persistence backend**; all state local to browser with export/import capability
- Normalization via `normalizeCharacter()` and migration scripts handle version upgrades + supports character.customProgression for AI-generated classes

### Game Loop & Message Flow (`src/views/game.js` and `src/engine/GameLoop.js`)
1. Player sends text input → `handlePlayerInput()` adds user message to `game.messages` (in `game.js`).
2. `sendMessage()` (in `game.js`) constructs API request:
   - Sanitizes messages via `GameLoop.buildApiMessages()` → `GameLoop.sanitizeMessagesForModel()`.
   - Builds system prompt + message history.
   - Calls OpenRouter chat completion (streaming).
3. **Real-time streaming** processes chunks via `sendMessage()`:
   - Extracts `<think>` tags for reasoning display.
   - Delegates game tag parsing and side effects to `TagProcessor.processGameTagsRealtime()`.
   - Updates UI immediately; no post-processing lag.
4. `TagProcessor.processGameTags()` extracts and applies tag semantics:
   - `LOCATION[name]` — Updates `game.currentLocation`, adds to `visitedLocations`.
   - `ROLL[type|key|dc|flag]` — Semantic rolls (skill, save, attack) with D&D modifiers.
   - `COMBAT_START[desc]`, `COMBAT_CONTINUE`, `COMBAT_END[outcome]` — Combat state management via `CombatManager.startCombat()`/`endCombat()`.
   - `DAMAGE[target|amount]`, `HEAL[target|amount]` — HP adjustments.
   - `INVENTORY_*`, `STATUS_ADD/REMOVE`, `RELATIONSHIP[npc|value]` — State updates.
   - `CAST_SPELL[spell|level]`, `XP_GAIN[amount|reason]`, `LEVEL_UP[level]` — Advanced mechanics.
   - `ACTION[...]` — Suggested player choices (displayed as quick-action bubbles).

### Tag System & Roll Batching
- **Tags drive game mechanics**: AI generates tags in narrative; system parses and executes
- **Centralized regex patterns** (`src/data/tags.js`): All tag regex exported as `REGEX` object; single source of truth imported by `TagProcessor.js`, `game.js`, `dice.js`
- **Tag Parser** (`src/engine/TagParser.js`): Low-level tag extraction and sanitization utility
- **Tag Processor** (`src/engine/TagProcessor.js`): Contains `processGameTagsRealtime()` and `processGameTags()` functions
- **Roll batching** (`ROLL_SETTLING_DELAY_MS = 500ms`): Collects multiple rolls in a message, then triggers a single follow-up narration (avoids spam)
- **Deferred batch**: If streaming is active when a batch completes, batch is queued and processed after streaming ends

### AI Integration (`src/utils/openrouter.js` legacy, now `src/utils/ai-provider.js`)
- **OpenRouter API** provides 100+ model access with standardized interface
- **Reasoning support detection** (`detectReasoningType()`):
  - `"effort"` models (OpenAI o1/o3/gpt-5, Grok): use `reasoning.effort` ("low"/"medium"/"high")
  - `"max_tokens"` models (Anthropic Claude, Gemini, DeepSeek): use `reasoning.max_tokens`
  - **Hybrid models** (DeepSeek, etc.): streaming refactored to handle reasoning-only chunks; message element created in DOM when either reasoning or content arrives
- **Structured outputs** via JSON schema (if model supports `"structured_outputs"` in `supportedParameters`)
- **Streaming**: SSE parser yields chunks; client handles errors mid-stream with legible messages
- **Error handling**: HTTP status codes mapped to user-friendly messages (402=credits, 429=rate limit, 502=provider down, etc.)

### AI Multi-Provider Support (`src/utils/ai-provider.js`)
- **Unified interface** for OpenAI, OpenRouter, and LM Studio
- **Provider configuration** via settings: `data.settings.provider` ("openrouter" | "openai" | "lmstudio")
- **Authentication**: OAuth for OpenRouter, API keys for OpenAI, none for local LM Studio
- **CORS handling**: Proxy support for OpenAI to avoid CORS issues
- **Structured outputs**: JSON schema support when provider allows
- **Error normalization**: Provider-specific errors mapped to user-friendly messages
- **Model caching**: Available models fetched and cached with pricing/metadata

### Levelling System (`src/components/LevelUpModal.js` & `src/data/classes.js`)
- **Class progression data** in `CLASS_PROGRESSION` with features + spell slots per level
- **AI-generated custom class progressions** (`src/utils/class-progression-generator.js`): Generates full 1-20 level progression for custom/homebrew classes using structured output
- **XP thresholds** define when level-ups occur (currently simplified to predetermined levels)
- **Custom class support**: `character.customProgression` stores AI-generated class data with hp_die, features, ASI flags, spell slots
- **Feat selection**: Available during Ability Score Improvement; uses `FEATS` array from `src/data/feats.js`
- **Level-up wizard**: Multi-step modal for HP, features, ASI (Ability Score Improvement), feats, spells
- **Hit point calculation**: Classes get hit dice (e.g., "1d10") + CON modifier on level-up
- **Spell slot progression**: Stored in `character.spellSlots[level].current/max`
- **Feature tracking**: `character.features[]` array accumulates over levels; `character.feats[]` tracks chosen feats

### Spellcasting (`src/engine/SpellcastingManager.js` & `src/data/spells.js`)
- **Spell slot tracking**: `character.spellSlots{}` with current/max per level (1-9)
- **Concentration**: `game.concentration.spellName` tracks active concentration spells
- **Spell database**: `COMMON_SPELLS{}` with spell definitions (level, school, concentration)
- **Spell usage**: `castSpell()` manages slot consumption, launches spell effects
- **Level 0 (Cantrips)**: Unlimited casting, no slot consumption
- **Concentration mechanics**: Only one concentration spell active, ends on damage/long rest

### Rest Mechanics (`src/engine/RestManager.js`)
- **Short rest**: Spend hit dice, recover HP (`1[hitDieType] + CON mod` per hit die)
- **Long rest**: Full HP recovery, spell slot refresh, hit die recovery (half max, min +1)
- **Hit dice**: `character.hitDice.current/max` tracks available healing dice
- **Rest tracking**: `game.restState` prevents spam rests (short rest timer)
- **Class resources**: `character.classResources[]` recover on short/long rests as applicable
- **Concentration breaks**: Long rest ends all concentration spells

### Character & World Generation
- **AI-generated characters** (`generateCharacterWithLLM()`):
  - System prompt: `CHARACTER_LLM_SYSTEM_PROMPT` enforces strict JSON schema output
  - Optionally uses structured outputs if model supports it
  - Normalizes response via `normalizeJsonCharacter()` to handle various AI formats
- **AI-generated worlds** (`generateWorldWithAI()`):
  - Similar structured output pattern; generates world metadata + system prompt
  - System prompt becomes the world's guide for all adventures within it
- **Templates**: Shared templates in `BEGINNER_TEMPLATES` (characters, now in `src/data/archetypes.js`) and `WORLD_TEMPLATES` (worlds, now in `src/data/worlds.js`) seed quick-start options
  - **Single source of truth**: Templates are imported and spread into `storage.js` DEFAULT_DATA; no duplication
  - `WORLD_TEMPLATES[0]` is the canonical default world; `storage.js` and `worlds.js` import it
  - Character templates removed from `storage.js`; modern code uses `BEGINNER_TEMPLATES` directly

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
- **New game tags**: Add regex + parsing logic in `TagProcessor.processGameTagsRealtime()` + `.processGameTags()`; document in `src/data/tags.js`
- **New spellcasting mechanics**: Extend `SpellcastingManager.js` and `src/data/spells.js`
- **New combat mechanics**: Modify `CombatManager.js` for initiative/turn management
- **New class features**: Update `CLASS_PROGRESSION` in `src/data/classes.js`
- **New dice mechanics**: Extend `dice5e.js` with skill/save/attack wrappers
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
  components/
    UsageDisplay.js — Token usage and cost display
    RollHistory.js — Recent dice rolls panel
    LocationHistory.js — Visited locations chips
    RelationshipList.js — NPC relationship tracker
    ChatMessage.js — Individual message rendering with reasoning support
    CharacterHUD.js — Character stats display (placeholder for future use)
    LevelUpModal.js — Level-up wizard component
    MigrationPopup.js — Data migration notifications
  data/
    archetypes.js — Character templates (BEGINNER_TEMPLATES)
    worlds.js — World templates (WORLD_TEMPLATES)
    tags.js — Game tag reference documentation (TAG_REFERENCE)
    icons.js — UI icons and emoji utilities
    classes.js — D&D 5e class progression data (XP thresholds, features, spell slots)
    spells.js — Common spells database definitions
    feats.js — Standard OGL D&D 5e feats database (FEATS array)
 engine/
    GameLoop.js — Game loop and AI streaming logic
    TagParser.js — Low-level tag extraction and sanitization utility
    TagParser.spec.js — Tests for TagParser utility
    TagProcessor.js — Game tag parsing and execution
    CombatManager.js — Combat state and initiative tracking
    SpellcastingManager.js — Spell casting and slot management
    RestManager.js — Short/long rest mechanics
  state/
    store.js — Centralized state management (in-memory cache + localStorage)
  utils/
    auth.js — PKCE OAuth flow
    storage.js — localStorage interface + normalization
    dice.js — Core dice parsing & rolling
    dice5e.js — D&D 5e skill/save/attack mechanics
    openrouter.js — OpenRouter API client (legacy, replaced by ai-provider.js)
    ai-provider.js — Unified AI provider interface (OpenRouter, OpenAI, LM Studio)
    model-utils.js — Model metadata and provider selection
    proxy.js — Proxy abstraction (unused in current deployment)
    ai-migration.js — Data schema migration scripts
    cors-detector.js — CORS detection utilities
    character-validation.js — Character creation validation
    class-progression-generator.js — AI-powered custom class progression generator
    ui-templates.js — UI template utilities
    prompts/
      character-prompts.js — Character generation prompts
      game-dm-prompt.js — Builds system prompt for game turns
      world-prompts.js — World generation prompts
 views/
    game.js — Main gameplay UI and event handling
    characters.js — Character CRUD + AI generation
    worlds.js — World CRUD + AI generation
    characterTemplatesView.js — Character template browser
    home.js — Home/welcome page
    models.js — Model selection and configuration
    settings.js — User preferences and settings management
  router.js — Client-side navigation
  main.js — App initialization
```

## Common Tasks

**Add a new game tag:**
1. Add regex to `REGEX` export in `src/data/tags.js`
2. Document format in `TAG_REFERENCE` (same file)
3. Add parsing logic to `processGameTagsRealtime()` and/or `processGameTags()` in `TagProcessor.js`
4. Add corresponding side effect (state mutation)
5. Test via console: `rollDice()` or manual tag in AI response

**Support new reasoning model:**
1. Model auto-detected by `detectReasoningType()` in openrouter.js
2. If needed, add model name pattern to detection logic
3. Reasoning tokens extracted from usage data during streaming

**Customize AI behavior per world:**
Edit the `systemPrompt` field in that world's record (worlds.js template or custom world form). System prompt is prepended to every message in that game.

---
**Key Principle**: Game state lives in `localStorage`; AI context is built dynamically from messages + system prompt. Streaming & tag parsing are real-time; no separate "apply changes" phase.

**Maintenance Note**: As code changes are made, this file and .github/copilot-instructions.md should be updated to reflect new patterns, architectural shifts, or developer workflows so future AI agents remain aligned with the evolving codebase.
