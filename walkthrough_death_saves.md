# Walkthrough: Death Saves & Unconscious State

## Overview
I have implemented D&D 5e Death Saving Throw mechanics. Now, when your character reaches 0 HP, the game enters a special "Unconscious" state.

## Features
1.  **Unconscious State**:
    *   Triggered automatically when HP reaches 0.
    *   Disables normal Rest buttons.
    *   Shows a "Roll Death Save" button.
    *   Displays a "UNCONSCIOUS" banner and trackers for Successes/Failures.

2.  **Death Saving Throws**:
    *   Click "Roll Death Save" to roll a d20.
    *   **10+**: Success.
    *   **<10**: Failure.
    *   **1**: Critical Failure (2 Failures).
    *   **20**: Critical Success (Regain 1 HP, become conscious).
    *   **3 Successes**: Stabilized (Failures reset).
    *   **3 Failures**: Character Death.

3.  **Recovery**:
    *   If you receive healing (via potion or spell), you automatically wake up and the death save state is reset.

## How to Test
1.  **Trigger Unconscious**:
    *   Open the chat.
    *   Type: `I take 100 damage.` (or enough to drop you to 0).
    *   Verify the UI shows the "UNCONSCIOUS" banner and the "Roll Death Save" button appears.

2.  **Roll Death Saves**:
    *   Click "Roll Death Save".
    *   Observe the roll result in chat and the trackers updating in the character sheet.
    *   Repeat until you stabilize or die.

3.  **Test Healing**:
    *   Reset (refresh or heal).
    *   Drop to 0 HP again.
    *   Type: `I drink a healing potion.`
    *   Verify you regain HP and the Unconscious UI disappears.

## Technical Details
- **Tags**: Uses `ROLL[death]` to trigger the logic.
- **State**: `game.deathSaves` tracks `{ successes, failures, isStable }`.
- **Prompt**: The AI DM is instructed to recognize 0 HP and prompt for death saves.
