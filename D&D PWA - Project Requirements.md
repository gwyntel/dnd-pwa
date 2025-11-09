# D&D PWA - Project Requirements

Last Updated: 2025-11-09

This document describes the functional and technical requirements for the D&D PWA, aligned with the actual implemented schema and game engine behavior as of v1.0.

## 1. Overview

The D&D PWA is a lightweight, offline-capable web app that lets a player:

- Create and store characters.
- Define worlds/settings.
- Start and continue solo adventures.
- Use AI (via OpenRouter) as a Dungeon Master.
- Persist games (characters, worlds, messages, state) in localStorage.
- Use structured tags in AI responses to drive mechanics like HP, location, inventory, gold, conditions, and suggested actions.

Tech stack:

- Vanilla JS + HTML + CSS, bundled with Vite.
- localStorage persistence with a simple schema and version marker.
- OpenRouter API for chat completions (streaming).
- No backend; everything runs client-side.

This document focuses on the implemented v1.0 behavior (MUST), with some forward-looking notes (SHOULD/FUTURE).

---

## 2. Data Schema v1.0 (Implemented)

All data is stored under a single key in localStorage:

- Key: `dnd_pwa_data`
- Version: `1.0.0`

Top-level structure:

```ts
interface DndPwaDataV1 {
  version: "1.0.0"
  lastModified: string // ISO timestamp
  settings: Settings
  worlds: World[]
  characterTemplates: CharacterTemplate[]
  characters: Character[]
  games: Game[]
}
```

### 2.1 Settings

Implemented in `src/utils/storage.js`:

```ts
interface Settings {
  defaultNarrativeModel: string | null
  theme: "light" | "dark" | "auto"
  autoSave: boolean
  diceAnimation: boolean
  hasSeenTutorial: boolean
  temperature: number // 0–2, default 1.0
}
```

Notes:

- defaultNarrativeModel is required for starting games; enforced in UI.
- Temperature exists in settings and is applied by the OpenRouter utility (see openrouter.js) as needed.

### 2.2 Worlds

Implemented in `storage.js` and used in `views/worlds.js`, `views/game.js`:

```ts
interface World {
  id: string
  name: string
  description: string
  systemPrompt: string
  createdAt: string
  isDefault?: boolean
}
```

Notes:

- At least one default world is created by DEFAULT_DATA.
- World selection is required when starting a game.
- world.systemPrompt is prepended in buildSystemPrompt.

### 2.3 Character Templates

Used to help users quickly create characters.

```ts
interface CharacterTemplate {
  id: string
  name: string
  description: string
  race: string
  class: string
  level: number
  stats: AbilityScores
  maxHP: number
  armorClass: number
  proficiencyBonus: number
  speed: number
  hitDice: string
  savingThrows: string[]
  skills: string[]
  proficiencies: {
    armor: string[]
    weapons: string[]
    tools: string[]
  }
  features: string[]
  spells: TemplateSpell[]
  inventory: TemplateItem[]
  backstory: string
}
```

Where:

```ts
interface AbilityScores {
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
}

interface TemplateSpell {
  name: string
  level: number
  damage?: string
  healing?: string
}

interface TemplateItem {
  item: string
  quantity: number
  equipped?: boolean
  damage?: string
}
```

Notes:

- These are pre-populated; they are examples aligned with 5e-style classes.
- Templates are not strictly coupled to runtime mechanics; they seed real Characters.

### 2.4 Characters

Implemented in `views/characters.js` and normalized in `storage.js` via `normalizeCharacter`.

```ts
interface Character {
  id: string
  name: string
  race: string
  class: string
  level: number

  stats: AbilityScores
  maxHP: number
  armorClass: number
  proficiencyBonus: number
  speed: number
  hitDice: string

  savingThrows: string[]
  skills: string[]
  proficiencies?: {
    armor?: string[]
    weapons?: string[]
    tools?: string[]
  }

  features?: string[]
  spells?: CharacterSpell[]

  inventory: CharacterItem[]

  backstory?: string
  createdAt: string
  fromTemplate?: string

  // v1.0 extended fields (implemented, backward compatible)
  currency?: {
    gp: number // simple gold; default 0 via normalizeCharacter
  }

  resources?: Resource[] // reserved for future; default []
  spellcasting?: Record<string, unknown> // reserved/minimal; default {}
}
```

Where:

```ts
interface CharacterSpell {
  name: string
  level: number
  damage?: string
  healing?: string
}

interface CharacterItem {
  item: string
  quantity: number
  equipped?: boolean
  damage?: string
}

interface Resource {
  // FUTURE (not currently used in UI):
  // name: string
  // max: number
  // current: number
}
```

Notes:

- `normalizeCharacter(character)` ensures `currency.gp`, `resources`, and `spellcasting` exist with safe defaults without breaking older saves.
- Characters are read-only snapshots for a given game; mutable state (HP, gold, etc.) lives on Game.

### 2.5 Games

Implemented in `views/game.js`. Tracks a single-character adventure instance.

```ts
interface Game {
  id: string
  title: string
  characterId: string
  worldId: string
  narrativeModel: string

  currentHP: number
  currentLocation: string

  questLog: string[] // currently unused, reserved
  inventory: GameItem[]
  conditions: Array<string | ConditionObject>

  combat: {
    active: boolean
    round: number
    initiative: any[]        // placeholder for future turn order
    currentTurnIndex: number // placeholder
  }

  suggestedActions: string[]

  messages: GameMessage[]

  createdAt: string
  lastPlayedAt: string
  totalPlayTime: number

  // v1.0: currency is implied via tags, stored directly on game object if present
  // currency?: { gp: number }
}
```

Where:

```ts
interface GameItem {
  item: string
  quantity: number
  equipped?: boolean
  damage?: string
}

interface ConditionObject {
  name: string
  // FUTURE: durationRounds?: number
  // FUTURE: source?: string
}

interface GameMessage {
  id: string
  role: "system" | "user" | "assistant"
  content: string
  timestamp: string
  hidden?: boolean
  metadata?: {
    diceRoll?: unknown
    damage?: number
    healing?: number
    combatEvent?: "start" | "end"
    isError?: boolean
  }
}
```

Notes:

- `conditions` supports:
  - legacy string entries: "Poisoned"
  - normalized objects: `{ name: "Blessed" }`
- Real-time engine (`processGameCommandsRealtime`) treats both string and object forms and normalizes on updates.

---

## 3. Structured Tag Protocol (Implemented)

The AI DM must follow a strict tag format. Tags are embedded inline in narrative content; the app:

- Parses them during streaming (`processGameCommandsRealtime`) for immediate state updates.
- Strips tags from rendered text via `stripTags`.
- Adds system messages to show mechanical changes (HP, gold, inventory, status, etc.).
- Uses a `processedTags` set to avoid double-processing streaming chunks.

All tags use this general pattern:

- `TAG_NAME[...payload...]`

Whitespace inside the brackets is allowed in names but must not break the pattern.

### 3.1 Location

`LOCATION[location_name]`

- Updates `game.currentLocation`.
- Example:
  - `"You step into the LOCATION[Rusty Dragon Inn], the smell of ale thick in the air."`

### 3.2 Rolls

`ROLL[dice|type|DC]`

- Requests a dice roll; resolved client-side.
- Parsed fields:
  - `dice`: notation (e.g. `1d20+3`).
  - `type`: `normal` | `advantage` | `disadvantage` (optional, defaults to `normal`).
  - `DC`: number (optional).
- Example:
  - `ROLL[1d20+2|normal|12]`
- The app:
  - Rolls and posts a system message with total and success/failure.
  - Result is also available to the AI in subsequent context.

### 3.3 Combat Start / End

- `COMBAT_START[description]`
  - Sets `game.combat.active = true`, `round = 1`.
  - Emits system message "⚔️ Combat has begun! ...".

- `COMBAT_END[outcome]`
  - Sets `active = false`, `round = 0`, clears initiative.
  - Emits system message "✓ Combat ended: ...".

Example:

- `COMBAT_START[Two goblins leap from the shadows!]`
- `COMBAT_END[The goblins lie defeated.]`

### 3.4 HP Changes

- `DAMAGE[target|amount]`
- `HEAL[target|amount]`

Rules:

- `target`: currently supports `"player"` (case-insensitive).
- `amount`: positive integer.

Behavior:

- For `DAMAGE[player|5]`:
  - `game.currentHP = max(0, currentHP - 5)`
  - System message: `💔 You take 5 damage! (old → new HP)`

- For `HEAL[player|8]`:
  - `game.currentHP = min(character.maxHP, currentHP + 8)`
  - System message: `💚 You heal X HP! (old → new HP)`

Future:

- Support for named NPC/enemy HP can be added in v1.5+.

### 3.5 Suggested Actions

`ACTION[action_text]`

- Provides suggested actions rendered as clickable buttons.
- Behavior:
  - Collected into `game.suggestedActions`.
  - UI displays them above input.
- Example:
  - `ACTION[Draw your sword]`
  - `ACTION[Ask the innkeeper for rumors]`
  - `ACTION[Inspect the mysterious sigil]`

Guidance:

- Provide 3–5 situation-specific, concise actions.
- Place all ACTION tags near the end of the response.

### 3.6 Inventory Management (Implemented v1.0)

These tags operate on `game.inventory` (session-level inventory):

1. `INVENTORY_ADD[item|quantity]`

- Adds items or increases quantity.
- `quantity` optional; default 1.
- Case-insensitive item name match.
- If item does not exist and quantity > 0, it is created.
- Emits system message:
  - `📦 Gained {qty} x {item}.`

Examples:

- `INVENTORY_ADD[Healing Potion|1]`
- `INVENTORY_ADD[Gold Ring]` (implies 1)

2. `INVENTORY_REMOVE[item|quantity]`

- Decreases quantity; removes item at 0.
- `quantity` optional; default 1.
- Emits system message:
  - `📦 Used/removed {qty} x {item}.`

3. `INVENTORY_EQUIP[item]`

- Marks matching item `equipped = true` (no quantity change).
- Emits:
  - `🛡️ Equipped {item}.`

4. `INVENTORY_UNEQUIP[item]`

- Marks matching item `equipped = false`.
- Emits:
  - `🛡️ Unequipped {item}.`

Notes:

- Matching is case-insensitive by item name.
- No negative quantities; clamped to zero and removed cleanly.
- These operate on the game’s inventory snapshot, not on the base character sheet.

### 3.7 Gold / Currency (Implemented v1.0)

`GOLD_CHANGE[delta]`

- Adjusts `game.currency.gp` (created if missing).
- `delta`: integer, can be negative or positive.
- Behavior:
  - Applies delta; clamps at 0 (no negative gold).
  - Emits:
    - `💰 Gold: {before} → {after} (+/-X gp)` if change applied.

Example:

- `GOLD_CHANGE[+10]`
- `GOLD_CHANGE[-5]`

Notes:

- For v1.0, gold is tracked per-game on `game.currency.gp` (or effectively on the running game state via tags).
- `buildSystemPrompt` summarizes gold for the model.
- Future versions may sync character-level currency explicitly; for now, treat game gold as authoritative within a session.

### 3.8 Conditions / Status (Implemented v1.0)

The engine uses `game.conditions` to track status effects.

Tags:

1. `STATUS_ADD[name]`

- Normalizes conditions to `{ name }` objects.
- Avoids duplicates (case-insensitive).
- Emits:
  - `⚠️ Status applied: {name}`

2. `STATUS_REMOVE[name]`

- Removes status entries matching `name` (string or object form).
- Emits:
  - `✅ Status removed: {name}`

Examples:

- `STATUS_ADD[Poisoned]`
- `STATUS_ADD[Blessed]`
- `STATUS_REMOVE[Poisoned]`

Notes:

- Legacy string entries are supported; new operations migrate to object form on update.
- `buildSystemPrompt` includes active conditions summary.

---

## 4. Prompt Construction Behavior

`buildSystemPrompt(character, game)` (in `views/game.js`):

- Includes:
  - World system prompt from selected `world`.
  - Character identity and stats.
  - Current HP / AC / speed / proficiency bonus.
  - Skills, features, spells.
  - Current Resources & Status line:
    - Gold (from `game.currency.gp` or 0).
    - Key items: up to 6 items from `game.inventory`, with quantities and `(eq.)` if equipped.
    - Active conditions: names from `game.conditions`.
- Followed by:
  - Detailed instructions for tag usage (LOCATION, ROLL, COMBAT_*, DAMAGE, HEAL, ACTION).
- This prompt is:
  - Added as a hidden system message at game start.
  - Implicitly updated in context through messages and state, while real-time tag parsing keeps `game` in sync.

Note: As of v1.0, the human-readable prompt text explicitly documents the original tag set. The engine also supports INVENTORY_*, GOLD_CHANGE, STATUS_* tags; adding those docs to the prompt is a small SHOULD-level improvement.

---

## 5. Compatibility and Import/Export

- `exportData`:
  - Exports the entire `DndPwaDataV1` blob as JSON.
- `importData`:
  - Validates minimal structure: `version`, `settings`, `characters`, `games`.
  - Additional fields (like `currency`, `resources`, `spellcasting`, `conditions`) are tolerated.
- `loadData`:
  - Logs a warning on version mismatch (future migrations TBD).
  - For v1.0, no destructive migrations are performed.
- `normalizeCharacter`:
  - Ensures newly used fields exist without breaking older saves.

All new features (currency, inventory tags, statuses) are additive and backward compatible.

---

## 6. MUST vs SHOULD Summary

MUST (implemented in v1.0):

- Persist data in the documented schema (settings, worlds, characters, games).
- Use `buildSystemPrompt` to:
  - Describe character and world.
  - Instruct model on tag protocol.
  - Provide concise current status (HP, inventory summary, gold, conditions).
- Support structured tags in AI output:
  - LOCATION, ROLL, COMBAT_START, COMBAT_END, DAMAGE, HEAL, ACTION.
  - INVENTORY_ADD, INVENTORY_REMOVE, INVENTORY_EQUIP, INVENTORY_UNEQUIP.
  - GOLD_CHANGE.
  - STATUS_ADD, STATUS_REMOVE.
- Apply tags in real-time:
  - Update `game` state.
  - Generate clear system messages for mechanical changes.
  - Keep rendered narrative free of tag syntax.

SHOULD / FUTURE (not fully implemented, reserved):

- Document and expose `resources[]` and `spellcasting` with real UI.
- Expand HP/conditions to support multiple actors, enemies, and named targets.
- Use `game.currency` vs `character.currency` more explicitly and provide UI for showing/editing gold.
- Add initiative and multi-combatant support.
- Track token/usage metrics per message and aggregate per game.
- Strengthen import validation and introduce schema migrations for future versions.

This document now reflects the actual v1.0 behavior of the codebase and the extended structured tag protocol currently supported by `src/views/game.js`.
