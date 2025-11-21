# Implementation Plan: Death Saves & Unconscious State

## Goal
Implement D&D 5e Death Saving Throw mechanics. When a player reaches 0 HP, they should fall unconscious and must make death saves to survive.

## User Review Required
> [!IMPORTANT]
> **AI Behavior Change**: The AI will be instructed to STOP normal narration when HP is 0 and focus strictly on the life-or-death struggle. This changes the flow of combat significantly.

## Proposed Changes

### Data Schema
#### [MODIFY] [storage.js](file:///Users/gwyn/projects/dnd-pwa/src/utils/storage.js)
- Add `deathSaves` object to character structure:
  ```javascript
  deathSaves: {
    successes: 0,
    failures: 0,
    isStable: false
  }
  ```

### Game Engine
#### [MODIFY] [game.js](file:///Users/gwyn/projects/dnd-pwa/src/views/game.js)
- **Damage Handler**: When HP <= 0:
  - Clamp HP to 0.
  - Set `deathSaves` state.
  - Trigger "Unconscious" UI state.
- **Healing Handler**: When HP > 0 (from 0):
  - Reset `deathSaves`.
  - Remove "Unconscious" state.
- **Tag Processor**: Add `DEATH_SAVE` tag handling.
  - Logic: 
    - Roll d20.
    - 10+ = Success.
    - <10 = Failure.
    - 1 = 2 Failures.
    - 20 = Regain 1 HP (become conscious).
    - 3 Successes = Stable (reset failures).
    - 3 Failures = Dead (Game Over state?).

### UI Components
#### [MODIFY] [CharacterHUD.js](file:///Users/gwyn/projects/dnd-pwa/src/components/CharacterHUD.js)
- Add "Unconscious" visual indicator (red overlay or status badge).
- Display Death Save trackers (3 Success circles, 3 Failure crosses).
- Add "Roll Death Save" button when unconscious (replaces other actions).

### AI Integration
#### [MODIFY] [game-dm-prompt.js](file:///Users/gwyn/projects/dnd-pwa/src/utils/prompts/game-dm-prompt.js)
- Add `DEATH_SAVE` to tag reference.
- Add instruction: "If player HP is 0, they are UNCONSCIOUS. Do not allow actions. Ask for DEATH_SAVE."

## Verification Plan

### Automated Tests
- Verify HP clamping at 0.
- Verify Death Save logic (1, 10, 20, <10).
- Verify stabilization logic.

### Manual Verification
- **Scenario 1**: Take damage to 0 HP. Verify UI changes.
- **Scenario 2**: Roll Death Saves. Verify tracking.
- **Scenario 3**: Heal from 0 HP. Verify return to normal state.
- **Scenario 4**: Die (3 failures). Verify "Dead" state (narrative).
