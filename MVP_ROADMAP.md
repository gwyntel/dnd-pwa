# D&D 5e MVP Roadmap & Gap Analysis

This document outlines the missing mechanics, polish opportunities, and priority features to reach a "Well Playable MVP" state for the D&D PWA.

## ✅ Completed Features
- **Death Saves & Unconscious State**: Implemented with UI, trackers, and AI integration.
- **Spellcasting System**: Slots, consumption, and concentration tracking.
- **Resting System**: Short/Long rests, hit die spending, resource recovery.

## 1. Critical Missing Mechanics (MVP Priorities)
These are core D&D 5e rules that are currently missing and break the "game loop" if not present.

### 🆙 Leveling Up System
*   **Current State**: Characters are static. No way to increase HP, stats, or gain features.
*   **Requirement**:
    *   **Level Up UI**: A modal to process a level up.
    *   **HP Increase**: Roll hit die or take average.
    *   **Stat Increase**: ASI (Ability Score Improvement) logic.
    *   **Feature Unlocks**: Simple text entry for new features/spells.
*   **Implementation**: A "Level Up" button in the character sheet that opens a wizard.

### ⚔️ Combat State & Enemy Tracking
*   **Current State**: AI narrates damage, but engine doesn't know if enemies are alive or dead.
*   **Requirement**:
    *   **Enemy State**: Simple tracking of "Goblin 1 (HP: 7/7)", "Orc (HP: 15/15)".
    *   **Damage Application**: When AI says "Goblin takes 5 damage", engine updates Goblin HP.
    *   **Death Handling**: Visual indicator when an enemy dies.
*   **AI Integration**: AI must use tags like `ENEMY_DAMAGE[Goblin 1|5]` and `ENEMY_DEATH[Goblin 1]`.

---

## 2. Solo Play Enhancements (New Priority)
Features specifically designed to make the solo experience viable and fun.

### 🔮 Oracle & GM Emulator
*   **Concept**: Tools to replace the DM's improvisation.
*   **Features**:
    *   **Fate Button**: Ask "Is the door locked?" -> Returns "Yes/No" (weighted).
    *   **Plot Twist Generator**: Random event injection.
    *   **Scene Setter**: Random prompts for new locations.

### 🛡️ Sidekick System
*   **Concept**: Simplified companion to balance action economy.
*   **Features**:
    *   **Control**: Player controls sidekick in combat.
    *   **Sheet**: Simplified stats (Tasha's Cauldron rules).

### 🦸 Heroic Resilience (Solo Buffs)
*   **Concept**: Mechanics to prevent death spirals in 1vMany combat.
*   **Features**:
    *   **Healing Surges**: Bonus action to spend Hit Dice.
    *   **Luck Points**: 3/day rerolls.

---

## 3. High Value Polish (The "Should Haves")
These features significantly improve the playability and "feel" of the game.

### 📊 Visual Initiative Tracker
*   **Current State**: Text list in chat at start of combat.
*   **Improvement**: A persistent "Turn Order" bar (top or side) showing who goes next. Highlights current actor.
*   **Why**: Combat is confusing without knowing who is next.

### 📱 Mobile UI Refinements
*   **Current State**: Functional but some touch targets are small; scrolling can be finicky.
*   **Improvement**:
    *   **Sticky Footer**: Ensure input and main actions are always accessible.
    *   **Touch-Friendly Rolls**: Larger tap areas for dice rolls.
    *   **Collapsible Menus**: Better sidebar management on mobile.
*   **Why**: PWA implies mobile-first usage.

### ✨ Spell Details & Upcasting
*   **Current State**: Spells are just names. Casting is fixed level.
*   **Improvement**:
    *   **Tooltips**: Tap a spell to see range, damage, save type.
    *   **Upcasting**: When clicking "Cast", ask "What level?" if higher slots are available.
*   **Why**: Essential for casters to make informed decisions.

---

## 4. Future Expansion (Nice to Haves)
Features that add depth but aren't strictly required for MVP.

### 💰 Shop & Economy UI
*   **Current State**: Narrative only ("I buy a sword").
*   **Idea**: A "Shop" view where you can drag-and-drop items and gold automatically deducts.

### 📜 Quest Log & Journal
*   **Current State**: Chat history only.
*   **Idea**: A structured list of "Active Quests" and "NPCs Met" updated by AI tags (`QUEST_START`, `NPC_MET`).

### 🎭 Feats & Active Features
*   **Current State**: Text descriptions.
*   **Idea**: "Activatable" features. E.g., click "Rage" -> adds damage bonus to next hits, resists damage. Click "Sneak Attack" -> adds dice to next roll.

---

## 5. Immediate Action Plan (Recommendation)

1.  **Implement Level Up System** (Critical for progression)
2.  **Add Visual Initiative Tracker** (Huge QoL for combat)
3.  **Implement Solo Play "Oracle" Tools** (Unique value prop)
4.  **Polish Mobile UI** (Critical for UX)

