# Dice Utilities Test Plan

This document outlines test cases and scenarios for the dice utilities to ensure correctness,
backward compatibility, and predictable behavior for the D&D PWA dice engine.

It now covers:
- Phase 1 core dice engine (parseNotation, roll, wrappers, crit metadata).
- Phase 2 character-aware semantics (dice5e.js, semantic ROLL tags in game.js).
- Phase 3 combat integration & provenance:
  - Initiative handling on COMBAT_START.
  - Semantic attack/save/skill flows with standardized metadata.
  - Dice Tray integration.
  - Roll history and provenance (rollId, timestamp, source).

## Core Goals

- Verify base dice rolling functions behave correctly and deterministically in shape (not value).
- Ensure backward compatibility for existing consumers of:
  - rollDice, rollAdvantage, rollDisadvantage
  - formatRoll, parseRollRequests, checkSuccess
- Validate new Phase 1 utilities:
  - parseNotation(notation)
  - roll(input)
  - Crit metadata for d20s
- Validate Phase 2 additions:
  - buildDiceProfile(character)
  - rollSkillCheck, rollSavingThrow, rollAttack
  - Semantic ROLL tags in game.js:
    - ROLL[skill|...], ROLL[save|...], ROLL[attack|...]

## Functions Under Test

Phase 1 (src/utils/dice.js):

- parseNotation(notation: string)
- roll(input: string | object)
- rollDice(notation: string)
- rollAdvantage(notation: string)
- rollDisadvantage(notation: string)
- formatRoll(result: object)
- parseRollRequests(text: string)
- checkSuccess(total: number, dc: number)

Phase 2 (src/utils/dice5e.js and game.js):

- buildDiceProfile(character)
- rollSkillCheck(character, skillKey, options?)
- rollSavingThrow(character, abilityKey, options?)
- rollAttack(character, attackIdOrWeaponKey, options?)
- Semantic ROLL tag handling in processGameCommandsRealtime (game.js)

Phase 3 (src/views/game.js):

- COMBAT_START / COMBAT_END handling with initiative state:
  - game.combat.active, round, initiative[], currentTurnIndex.
- Initiative rolls:
  - Player initiative from Dex mod via buildDiceProfile on COMBAT_START.
  - Optional NPC initiative (best-effort from COMBAT_START description).
- Semantic combat flows:
  - ROLL[attack|...|AC] → rollAttack + standardized metadata/messages.
  - ROLL[save|...|DC] → rollSavingThrow + standardized metadata/messages.
  - ROLL[skill|...|DC] → rollSkillCheck + standardized metadata/messages.
- Dice Tray:
  - Generic dice + adv/disadvantage.
  - Character-aware quick actions (skills, saves, attacks).
- Roll history:
  - Derived from messages with metadata.diceRoll (last 20).
  - Shows label, total, rollId, timestamp, source.
- Provenance invariants:
  - createRollMetadata used for all app-generated rolls (tray, tags, combat).

---

## 1. parseNotation

Valid:

- "1d20" -> { notation: "1d20", count: 1, sides: 20, modifier: 0 }
- "2d6+3" -> { notation: "2d6+3", count: 2, sides: 6, modifier: 3 }
- "3d8-2" -> { notation: "3d8-2", count: 3, sides: 8, modifier: -2 }
- " 1d4 " -> trims to "1d4"

Invalid (throws):

- Non-string: 5, null, undefined, {}, []
- Malformed:
  - "d20", "1d", "2", "1d0", "0d6"
  - "1d-6", "1d6++1", "1x6", ""

---

## 2. roll (core)

String input:

- roll("1d20"):
  - count=1, sides=20
  - rolls length 1, each 1–20
  - subtotal=sum(rolls), total=subtotal
  - notation="1d20", id is non-empty string

- roll("2d6+3"):
  - count=2, sides=6, modifier=3
  - rolls length 2, each 1–6
  - total=subtotal+3

Object input:

- roll({ count: 2, sides: 6, modifier: 1 }):
  - notation auto "2d6+1"
  - total=subtotal+1

- roll({ count: 2, sides: 6, modifier: 1, notation: "2d6+1 (fire)", label: "Fire", rollType: "custom" }):
  - uses explicit notation
  - label, rollType propagate additively

Invalid (throws "Invalid roll config"):

- Missing / non-positive count or sides
- Non-numeric count/sides

---

## 3. Crit Metadata (Phase 1)

Only for single-die d20 (count=1, sides=20):

- If roll=20:
  - crit = { isCrit: true, isNat20: true, isNat1: false }
- If roll=1:
  - crit = { isCrit: true, isNat20: false, isNat1: true }
- Otherwise:
  - crit = { isCrit: false, isNat20: false, isNat1: false }

For all other cases (non-d20 or multiple dice):

- crit is undefined.

Ensure:
- Crit metadata is additive and never required by existing callers.

---

## 4. rollDice (legacy wrapper)

- rollDice("2d6+3") returns:
  - { notation, rolls, modifier, subtotal, total, count, sides, [crit?] }
- Does not expose internal id.
- Behavior matches previous expectations:
  - totals computed correctly
  - throws on invalid notation same as before.

---

## 5. rollAdvantage / rollDisadvantage

Advantage:

- rollAdvantage("1d20+5"):
  - Performs two underlying rollDice calls.
  - Result:
    - advantage === true
    - chosenRoll, discardedRoll present
    - chosenRoll.total >= discardedRoll.total
    - total === chosenRoll.total

Disadvantage:

- Similar, but:
  - disadvantage === true
  - chosenRoll.total <= discardedRoll.total

Compatibility:

- Structures remain usable by existing formatRoll calls.

---

## 6. formatRoll

Test with deterministic inputs.

Single roll:

- { notation:"1d20", rolls:[10], modifier:0, total:10 }
  - "🎲 1d20: 10 = **10**"

With modifier:

- { notation:"1d20+5", rolls:[15], modifier:5, total:20 }
  - Includes "+5" and "**20**"

Multiple dice:

- { notation:"2d6+3", rolls:[2,4], modifier:3, subtotal:6, total:9 }
  - "🎲 2d6+3: [2, 4] +3 = **9**"

Advantage:

- advantage:true with chosenRoll/ discardedRoll present
  - "🎲 Advantage: [..] vs [..] +X = **Y**"

Disadvantage: analogous.

Crit suffix:

- If crit.isNat20: ends with " (Nat 20)"
- If crit.isNat1: ends with " (Nat 1)"
- If crit present but non-crit: no suffix
- Works both when crit is on root result or chosenRoll.

Invalid input:

- Non-object returns "" (no throw).

---

## 7. parseRollRequests

Input:
- "Make a roll: ROLL[1d20+5|normal|15] and another ROLL[2d6||]"

Output:
- [
  { notation:"1d20+5", type:"normal", dc:15, fullMatch:"ROLL[1d20+5|normal|15]" },
  { notation:"2d6", type:"normal", dc:null, fullMatch:"ROLL[2d6||]" }
]

Edge:

- ROLL[1d20+5] → type:"normal", dc:null
- Malformed entries are ignored or parsed permissively as in existing behavior.

---

## 8. checkSuccess

- checkSuccess(15, 10) === true
- checkSuccess(10, 10) === true
- checkSuccess(9, 10) === false

Thin wrapper for total >= dc.

---

## 9. buildDiceProfile (Phase 2)

Using normalized character (normalizeCharacter first).

Test with sample/template-like characters; expect:

- abilities:
  - Correct 5e modifiers from stats (fallback 10 → +0 for missing).
- saves:
  - Base = ability mod.
  - If savingThrows includes "strength", "Str", etc:
    - adds proficiencyBonus.
- skills:
  - Accepts:
    - array: ["Perception", "Stealth"]
    - string: "Perception, Stealth"
  - Keys lowercased.
  - Governing ability via SKILL_ABILITY_MAP.
  - Bonus = abilityMod + proficiencyBonus.
- attacks:
  - From equipped / weapon-like inventory items:
    - Generates id, name, ability guess, toHit (abilityMod + prof), damage from item.damage.
- spellcasting:
  - Heuristic:
    - Wizard/Artificer → INT, Cleric/Druid → WIS, Paladin/Sorcerer/Warlock/Bard → CHA
  - spellSaveDC = 8 + prof + mod
  - spellAttackBonus = prof + mod
  - Otherwise nulls.

Backward compatibility:

- Purely derived; no schema changes.

---

## 10. rollSkillCheck

Given character with known Perception bonus (from profile):

- rollSkillCheck(character, "perception", { dc:15 }):
  - Uses 1d20 + derived bonus.
  - Returns:
    - Core roll fields
    - type:"skill"
    - key:"perception"
    - dc:15
    - success: total >= 15
- Case-insensitive skillKey.
- If unknown skill:
  - Falls back to +0; no throw.

---

## 11. rollSavingThrow

- rollSavingThrow(character, "dex", { dc:14 }):
  - Maps to "dex" save bonus from profile.saves.
  - Uses 1d20 + bonus.
  - Returns:
    - type:"save"
    - key:"dex"
    - dc:14
    - success: total >= 14

- Accepts full names ("strength", "wisdom") as well as abbreviations.

Fallback:

- Unknown abilityKey → uses +0; no throw.

---

## 12. rollAttack

Case: character has equipped "Longsword" with damage "1d8+3":

- rollAttack(character, "longsword", { targetAC:13 }):
  - toHit:
    - 1d20 + inferred toHit (e.g. STR mod + prof)
  - damage:
    - If hit (or targetAC missing), rolls from "1d8+3".
  - Returns:
    - attack: { id, name, ability, toHit, damage }
    - toHit: SemanticRollResult with type:"attack", key:attack.id, targetAC, success
    - damage: SemanticRollResult|null

Fallbacks:

- Unknown attackIdOrName:
  - Uses basic STR attack:
    - attack.id = "basic_attack"
    - behaves sanely without throwing.

---

## 13. Semantic ROLL Tags in game.js

These are processed in processGameCommandsRealtime (streaming).

Test patterns:

1) Skill checks

- Input fragment:
  - "Perception check: ROLL[skill|perception|15]"
- Expected:
  - Calls rollSkillCheck with dc=15.
  - Adds system message:
    - Includes "🎲 perception" and formatted roll.
    - Includes "vs DC 15 - ✓ Success!" or "✗ Failure".
  - metadata:
    - { diceRoll, type:"skill", key:"perception", dc:15, success:boolean }

2) Saving throws

- "Dex save: ROLL[save|dex|14]"
- Expected:
  - Uses rollSavingThrow, similar metadata & content.

3) Attacks

- "Attack: ROLL[attack|longsword|13]"
- Expected:
  - Uses rollAttack.
  - Message content:
    - Attack roll vs AC (with Hit/Miss).
    - Damage line if hit.
  - metadata.diceRoll:
    - { attack, toHit, damage }

4) Advantage/disadvantage flag (optional 4th segment)

- ROLL[skill|stealth|15|advantage]
- ROLL[save|wisdom|14|disadvantage]
- ROLL[attack|longbow|15|advantage]

Expected:

- Correct advantage/disadvantage boolean passed into semantic helpers.
- No breaking changes if omitted.

5) Fallback behavior

- If semantic parsing fails (e.g. missing character, unknown key, internal error):
  - Logs warning.
  - Falls back to legacy numeric behavior if appropriate.
  - Never crashes; tag considered processed or gracefully ignored.

6) Legacy numeric ROLL still works

- ROLL[1d20+5|normal|15]
- ROLL[1d20+5|advantage|15]

Expected:

- Behaves exactly as before using rollDice / rollAdvantage / rollDisadvantage.
- Both in streaming (processGameCommandsRealtime) and fallback (processGameCommands via parseRollRequests).
- Metadata:
  - metadata.diceRoll present.
  - metadata.type === "roll".
  - metadata.dc and metadata.success populated when DC provided.

---

## 14. Initiative & Combat Integration (Phase 3)

1) COMBAT_START streaming behavior

- Given assistant text contains:
  - "COMBAT_START[Wolves leap from the brush!]"
- Expected:
  - processGameCommandsRealtime:
    - Sets game.combat.active === true.
    - Sets game.combat.round === 1.
    - Rolls initiative for player:
      - Uses buildDiceProfile(character).abilities.dex as Dex mod.
      - Uses rollDice("1d20+DexMod").
      - Pushes entry into game.combat.initiative:
        - { id:"init_player", name, type:"player", roll, total, rollId, timestamp, sourceType:"initiative" }
    - Optionally creates NPC entries (non-fatal if parsing fails).
    - Sorts initiative descending by total.
    - Sets game.combat.currentTurnIndex === 0.
    - Emits system messages:
      - "⚔️ Initiative (You): ..." with metadata:
        - { type:"initiative", actorType:"player", diceRoll, rollId, timestamp, sourceType:"initiative" }
      - "⚔️ Initiative (Enemy): ..." for NPCs with similar metadata.
      - "⚔️ Combat has begun! ..." with metadata.combatEvent === "start".
  - In fallback processGameCommands:
    - If initiative not set, rolls player initiative once using same Dex-based logic.

2) COMBAT_END streaming behavior

- Given assistant text contains:
  - "COMBAT_END[Victory!]"
- Expected:
  - processGameCommandsRealtime:
    - Sets game.combat.active === false.
    - Sets game.combat.round === 0.
    - Clears game.combat.initiative and resets currentTurnIndex to 0.
    - Adds system message:
      - id suffix "_combat_end"
      - metadata.combatEvent === "end".
  - Fallback path in processGameCommands mirrors this if streaming path missed it.

3) Stability

- Multiple COMBAT_START/END tags:
  - processedTags ensures each tag only handled once.
  - No duplicate initiative rolls for the same tag.
  - No crash if character or profile missing; initiative gracefully omitted.

## 15. UI / Metadata Integration

- renderSingleMessage:
  - When msg.metadata.diceRoll is:
    - Simple roll: formatRoll(diceRoll) renders correctly.
    - Semantic skill/save (SemanticRollResult): formatRoll still valid.
    - Attack object { attack, toHit, damage }:
      - Content string already includes hit/miss + damage.
  - When msg.metadata.rollId/timestamp present:
    - Renders provenance line ("id: ... • timestamp").

- renderRollHistory:
  - Only includes messages where metadata.diceRoll exists.
  - Uses last 20 such messages.
  - Label logic:
    - type:"attack" → "Attack [name] vs AC X ✓/✗"
    - type:"save"   → "Save [KEY] DC X ✓/✗"
    - type:"skill"  → "Skill [name] DC X ✓/✗"
    - type:"initiative" → "Roll" or "Attack" currently; ensure no crash and values present.
    - type:"roll" (legacy) → generic "Roll".
  - Metadata expectations for each entry:
    - rollId, timestamp present for all app-generated dice events (Dice Tray, semantic/legacy ROLL, initiative).
    - source/sourceType present where applicable (e.g. "dice-tray", "skill", "attack", "initiative").

Regression checks:

- Existing numeric ROLL and narrative flows remain valid.
- New Phase 3 messages (initiative, semantic rolls) render cleanly and are purely additive.

---

By validating these behaviors, we ensure:

- Phase 1: core dice engine is robust and stable.
- Phase 2: character-aware semantics (profile + helpers + tags) work correctly.
- Phase 3: combat integration (initiative, semantic attacks/saves, Dice Tray, history, provenance) is deterministic and trustworthy.
- Backward compatibility: all existing numeric ROLL and game flows remain unchanged while new features are purely additive.
