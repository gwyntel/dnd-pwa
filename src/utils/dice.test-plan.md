Planned tests for src/utils/dice.js (Phase 1 core engine)

Note: These are unit-testable behaviors; adapt to your preferred test runner.

1. parseNotation(notation)

- Valid:
  - "1d20" -> { notation: "1d20", count: 1, sides: 20, modifier: 0 }
  - "2d6+3" -> { count: 2, sides: 6, modifier: 3 }
  - "3d8-2" -> { count: 3, sides: 8, modifier: -2 }
  - Whitespace: "  1d4+1 " -> same as "1d4+1"
- Invalid (should throw "Invalid dice notation"):
  - Non-string: parseNotation(5), parseNotation(null)
  - Missing parts: "d20", "2d", "2", "1d0", "0d6"
  - Garbage: "", "abc", "1d-6", "1d6++1"

2. roll(input) with notation string

- roll("1d20"):
  - returns object with:
    - id: string (non-empty)
    - notation: "1d20"
    - count: 1
    - sides: 20
    - rolls: length 1, each in [1, 20]
    - subtotal: sum(rolls)
    - total: subtotal
- roll("2d6+3"):
  - count: 2, sides: 6, modifier: 3
  - rolls: length 2, each in [1, 6]
  - subtotal: sum(rolls)
  - total: subtotal + 3
- Invalid:
  - roll("bad") throws same as parseNotation.

3. roll(input) with config object

- Basic:
  - roll({ count: 2, sides: 6, modifier: 1 }):
    - notation: "2d6+1"
    - rolls length 2, each [1..6]
    - total = subtotal + 1
- With explicit notation:
  - roll({ count: 2, sides: 6, modifier: 1, notation: "2d6+1 (fire)" }):
    - notation preserved
- With metadata:
  - roll({ count: 1, sides: 20, rollType: "attack", label: "Longsword" }):
    - rollType and label echoed
- Invalid:
  - Missing/invalid count/sides (0, negative, NaN) throws "Invalid roll config".

4. Crit detection behavior (via roll)

Note: randomness should be stubbed/mocked in real tests.

- For single d20:
  - When forced roll is 20:
    - result.crit = { isCrit: true, isNat20: true, isNat1: false }
  - When forced roll is 1:
    - result.crit = { isCrit: true, isNat20: false, isNat1: true }
  - For any other value:
    - crit = { isCrit: false, isNat20: false, isNat1: false }
- For non-single-d20:
  - count !== 1 or sides !== 20:
    - result.crit is undefined.

5. rollDice (backward-compatible wrapper)

- Shape:
  - rollDice("2d6+3") returns:
    - { notation, rolls, modifier, subtotal, total, count, sides, [crit?] }
  - No id, no extra metadata required.
- Totals:
  - total = subtotal + modifier.
- Invalid:
  - rollDice("bad") throws (unchanged from old behavior).

6. rollAdvantage

- Structure:
  - result.advantage === true
  - result.chosenRoll and result.discardedRoll exist.
  - Both nested rolls have legacy shape (notation, rolls, total, etc.).
- Semantics:
  - chosenRoll.total >= discardedRoll.total.
  - result.total === chosenRoll.total.
- Backward compatibility:
  - Works with formatRoll as before (no reliance on new metadata).

7. rollDisadvantage

- Structure:
  - result.disadvantage === true
  - chosenRoll / discardedRoll exist.
- Semantics:
  - chosenRoll.total <= discardedRoll.total.
  - result.total === chosenRoll.total.
- Backward compatibility:
  - Works with formatRoll as before.

8. formatRoll

Use deterministic inputs (no randomness).

- Advantage:
  - Input:
    {
      advantage: true,
      chosenRoll: { rolls: [15], modifier: 2, total: 17 },
      discardedRoll: { rolls: [7], modifier: 2, total: 9 },
      modifier: 2,
      total: 17
    }
  - Output should start with:
    "🎲 Advantage: [15] vs [7] +2 = **17**"
- Disadvantage:
  - Analogous structure; yields "🎲 Disadvantage: ..."
- Single roll:
  - { notation: "1d20", rolls: [10], modifier: 0, total: 10 }
    -> "🎲 1d20: 10 = **10**"
- Multiple rolls:
  - { notation: "2d6+3", rolls: [2,4], modifier: 3, subtotal: 6, total: 9 }
    -> "🎲 2d6+3: [2, 4] +3 = **9**"
- Crit suffix (additive only):
  - With crit on simple roll:
    { notation: "1d20", rolls: [20], modifier: 0, total: 20, crit: { isCrit: true, isNat20: true, isNat1: false } }
    -> ends with " (Nat 20)"
  - With crit on chosenRoll in advantage:
    chosenRoll.crit.isNat20 -> suffix "(Nat 20)" appended.

9. parseRollRequests

- Input: "Attack! ROLL[1d20+5|advantage|15] Damage: ROLL[2d6+3]"
  - Produces:
    - [
        { notation: "1d20+5", type: "advantage", dc: 15, fullMatch: "ROLL[1d20+5|advantage|15]" },
        { notation: "2d6+3", type: "normal", dc: null, fullMatch: "ROLL[2d6+3]" }
      ]
- Malformed / extra segments:
  - "ROLL[1d20+5|||15]" -> type "", dc NaN -> treated as:
    - notation: "1d20+5"
    - type: "normal"
    - dc: null
  - This matches existing permissive behavior.

10. checkSuccess

- Basic:
  - checkSuccess(10, 10) === true
  - checkSuccess(9, 10) === false
  - Thin wrapper for total >= dc.

Notes on compatibility verification

- game.js expectations (per usage scan) are satisfied:
  - rollDice returns legacy shape.
  - rollAdvantage / rollDisadvantage expose:
    - advantage/disadvantage flag
    - chosenRoll / discardedRoll with .rolls and .total
  - formatRoll consumes only these known fields; new crit metadata is additive.
  - parseRollRequests and checkSuccess APIs unchanged.
