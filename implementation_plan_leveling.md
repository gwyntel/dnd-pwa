# Implementation Plan: Level Up System & XP

This plan outlines the implementation of a beginner-friendly Level Up system for D&D 5e, designed for solo play.

## 🎯 Goals
1.  **XP Progression**: Allow characters to gain XP from combat and travel.
2.  **Level Up Wizard**: A step-by-step UI to guide players through leveling up.
3.  **5e Mechanics**: Implement core 5e progression (HP, Stats, Features, Spells).
4.  **Beginner Friendly**: Automate complex math and choices where possible.

---

## 1. XP & Leveling Mechanics (Strict 5e)

### Standard 5e XP Thresholds
We will use the official Player's Handbook XP table:
*   **Level 1 -> 2**: 300 XP
*   **Level 2 -> 3**: 900 XP (Total)
*   **Level 3 -> 4**: 2,700 XP (Total)
*   **Level 4 -> 5**: 6,500 XP (Total)
*   **Level 5 -> 6**: 14,000 XP (Total)

### AI Integration
The AI will award XP based on 5e guidelines (Easy/Medium/Hard encounters).
*   **Tag**: `XP_GAIN[amount|reason]`
*   **Example**: `XP_GAIN[50|Defeating the Goblin Scout]`
*   **Example**: `XP_GAIN[100|Discovering the Lost Shrine]`

---

## 2. Data Structure Updates

### Character Schema (`src/utils/storage.js`)
Add `xp` field to character normalization.

```javascript
xp: {
  current: 0,
  max: 300, // Initial threshold for Level 2
  history: [] // Log of XP gains for transparency
}
```

### Class Progression Data (`src/data/classes.js` - NEW)
Source of truth for 5e class progression.

```javascript
export const CLASS_PROGRESSION = {
  Fighter: {
    2: {
      features: ["Action Surge"],
      hp_die: "1d10"
    },
    3: {
      features: ["Martial Archetype"],
      hp_die: "1d10"
    }
  },
  // ... other classes
}
```

---

## 3. Tag System Updates

### New Tags (`src/data/tags.js`)
We need to explicitly define these so the AI knows how to use them.

1.  **XP_GAIN**: `XP_GAIN[amount|reason]`
    *   *Usage*: Awarded after combat or milestones.
2.  **LEARN_SPELL**: `LEARN_SPELL[spell_name]`
    *   *Usage*: Awarded when finding scrolls or ancient tomes.
3.  **LEVEL_UP**: `LEVEL_UP[level]` (System tag)
    *   *Usage*: Triggered by the engine when XP threshold is met.

### DM Prompt Updates (`src/utils/prompts/game-dm-prompt.js`)
Add a specific section on **Rewards & Progression**:
*   "Award XP for overcoming challenges using `XP_GAIN`."
*   "Use standard 5e XP values (e.g., 25 XP for a Goblin, 50 XP for an Orc)."
*   "You can reward specific spells using `LEARN_SPELL` if appropriate."

---

## 3. UI: The Level Up Wizard

A modal that appears when `xp.current >= xp.max`.

### Step 1: Celebration & Summary
*   "🎉 Level Up! You are now Level 2!"
*   Show new proficiency bonus if changed.

### Step 2: Health Increase
*   **Roll HP**: Button to roll Hit Die (e.g., 1d10 + CON).
*   **Take Average**: Option to take fixed value (e.g., 6 + CON).
*   *Beginner Tip*: Default to "Take Average" for safety, but allow rolling for fun.

### Step 3: Features (Informational)
*   List new class features gained.
*   "You gained **Action Surge**! You can now take one additional action on your turn."

### Step 4: Ability Score Improvement (Level 4, 8, etc.)
*   Only shows if `asi: true`.
*   UI to add +2 to one stat or +1 to two stats.

### Step 5: Spell Selection (Casters Only)
*   **Learn Spells**: Select `n` spells from a list of available spells for that class/level.
*   **AI Assistance**: "Recommended for you: Burning Hands, Shield".

---

## 4. Implementation Steps

1.  **Schema**: Update `normalizeCharacter` in `storage.js` to include XP.
2.  **Data**: Create `src/data/classes.js` with Level 2 & 3 data for MVP classes (Fighter, Rogue, Wizard, Cleric).
3.  **Tag Processing**: Implement `XP_GAIN` tag in `game.js`.
4.  **UI**: Create `LevelUpModal.js` component.
5.  **Integration**: Add "Level Up" button to HUD when eligible.

---

## 5. Answering User Questions

*   **Can AI add spells?** Yes, we can add a `LEARN_SPELL[spell_name]` tag for narrative rewards (finding a scroll).
*   **Should it?** For leveling, a UI is better to ensure rules compliance. For rewards, AI is great.
*   **How 5e does it**:
    *   **XP**: Kill monsters = XP. Roleplay = XP.
    *   **HP**: Increases every level.
    *   **Stats**: Increase every ~4 levels.
    *   **Features**: Specific to class table.
