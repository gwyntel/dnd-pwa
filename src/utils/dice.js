/**
 * Dice rolling utilities
 *
 * Phase 1 goals:
 * - Provide a robust core for parsing and rolling dice while remaining fully backwards compatible.
 * - Keep existing exports and shapes used by the app:
 *   rollDice, rollAdvantage, rollDisadvantage, getModifier, formatRoll, parseRollRequests, checkSuccess.
 * - Add:
 *   - parseNotation(notation): parse "XdY+Z" into a structured object, throws on invalid input.
 *   - roll(input): core roller used internally; returns a normalized result with optional metadata.
 *   - Lightweight crit metadata for single-d20 rolls (nat 20 / nat 1), purely additive.
 *
 * Backward compatibility:
 * - Existing functions keep their signatures.
 * - rollDice / rollAdvantage / rollDisadvantage continue to return the shapes expected by game.js.
 * - formatRoll remains compatible; it only uses new metadata (crit) additively when present.
 */

/**
 * Parse standard dice notation into structured components.
 * Supports: "XdY", "XdY+Z", "XdY-Z"
 *
 * @param {string} notation
 * @returns {{ notation: string, count: number, sides: number, modifier: number }}
 * @throws {Error} on invalid notation
 */
export function parseNotation(notation) {
  if (typeof notation !== "string") {
    console.error("[dice] parseNotation called with non-string notation", { notation });
    throw new Error(`Invalid dice notation: ${notation}`);
  }

  const trimmed = notation.trim();

  // Guard against semantic keywords accidentally reaching numeric parser
  if (/^(skill|save|attack)$/i.test(trimmed)) {
    console.error("[dice] parseNotation received semantic keyword instead of numeric notation", { notation });
    throw new Error(`Invalid dice notation: ${notation}`);
  }

  const match = trimmed.match(/^(\d+)d(\d+)([+-]\d+)?$/i);

  if (!match) {
    console.error("[dice] parseNotation failed to match notation", { notation });
    throw new Error(`Invalid dice notation: ${notation}`);
  }

  const count = parseInt(match[1], 10);
  const sides = parseInt(match[2], 10);
  const modifier = match[3] ? parseInt(match[3], 10) : 0;

  if (!Number.isFinite(count) || !Number.isFinite(sides) || count <= 0 || sides <= 0) {
    throw new Error(`Invalid dice notation: ${notation}`);
  }

  return {
    notation: trimmed,
    count,
    sides,
    modifier,
  };
}

/**
 * Internal helper: generate a simple unique-ish id for a roll.
 * Not relied upon by existing callers; used for future extensibility.
 */
function createRollId() {
  return `roll-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Internal helper: detect crit metadata for a roll result.
 * - Only applies to single-die d20 rolls (count === 1 && sides === 20).
 * - Purely additive: callers interpret based on context; we do not assume attack/check/save.
 *
 * @param {{ count:number, sides:number, rolls:number[] }} result
 * @returns {{ isCrit: boolean, isNat20: boolean, isNat1: boolean } | undefined}
 */
function detectCrit(result) {
  if (!result || result.count !== 1 || result.sides !== 20 || !Array.isArray(result.rolls) || result.rolls.length !== 1) {
    return undefined;
  }

  const value = result.rolls[0];
  if (value === 20) {
    return {
      isCrit: true,
      isNat20: true,
      isNat1: false,
    };
  }

  if (value === 1) {
    return {
      isCrit: true,
      isNat20: false,
      isNat1: true,
    };
  }

  return {
    isCrit: false,
    isNat20: false,
    isNat1: false,
  };
}

/**
 * Core roll function.
 *
 * Input:
 * - string: treated as dice notation "XdY+Z"
 * - object:
 *   {
 *     count: number,
 *     sides: number,
 *     modifier?: number,
 *     advantage?: boolean,      // reserved for future use; Phase 1 keeps wrappers separate
 *     disadvantage?: boolean,   // reserved for future use
 *     label?: string,
 *     rollType?: string,        // e.g. "attack", "save", "check"
 *     notation?: string         // if provided, used for display; otherwise constructed
 *   }
 *
 * Output (normalized core result):
 * {
 *   id: string,
 *   notation: string,
 *   count: number,
 *   sides: number,
 *   rolls: number[],
 *   modifier: number,
 *   subtotal: number,
 *   total: number,
 *   // optional metadata (additive, not required by existing callers):
 *   advantage?: boolean,
 *   disadvantage?: boolean,
 *   rollType?: string,
 *   label?: string,
 *   isD20?: boolean,
 *   crit?: {
 *     isCrit: boolean,
 *     isNat20: boolean,
 *     isNat1: boolean
 *   }
 * }
 */
export function roll(input) {
  // Centralized logging for invalid inputs happens either here or in parseNotation.
  // Valid numeric inputs should not log in normal operation.
  let count;
  let sides;
  let modifier;
  let notation;
  let rollType;
  let label;
  let advantage = false;
  let disadvantage = false;

  if (typeof input === "string") {
    const parsed = parseNotation(input);
    ({ count, sides, modifier } = parsed);
    notation = parsed.notation;
  } else if (typeof input === "object" && input !== null) {
    count = Number(input.count);
    sides = Number(input.sides);
    modifier = Number(input.modifier || 0);
    if (!Number.isFinite(count) || !Number.isFinite(sides) || count <= 0 || sides <= 0) {
      throw new Error(`Invalid roll config: ${JSON.stringify(input)}`);
    }
    notation =
      typeof input.notation === "string" && input.notation.trim()
        ? input.notation.trim()
        : `${count}d${sides}${modifier !== 0 ? (modifier > 0 ? `+${modifier}` : `${modifier}`) : ""}`;
    rollType = input.rollType;
    label = input.label;
    advantage = !!input.advantage;
    disadvantage = !!input.disadvantage;
  } else {
    throw new Error(`Invalid roll input: ${input}`);
  }

  const rolls = [];
  let subtotal = 0;
  for (let i = 0; i < count; i++) {
    const value = Math.floor(Math.random() * sides) + 1;
    rolls.push(value);
    subtotal += value;
  }

  const total = subtotal + modifier;
  const isD20 = sides === 20;
  const crit = detectCrit({ count, sides, rolls });

  const result = {
    id: createRollId(),
    notation,
    count,
    sides,
    rolls,
    modifier,
    subtotal,
    total,
  };

  // Only attach additive metadata; nothing relies on these yet.
  if (advantage) {
    result.advantage = true;
  }
  if (disadvantage) {
    result.disadvantage = true;
  }
  if (rollType) {
    result.rollType = rollType;
  }
  if (label) {
    result.label = label;
  }
  if (isD20) {
    result.isD20 = true;
  }
  if (crit) {
    result.crit = crit;
  }

  return result;
}

/**
 * Roll dice based on notation (backwards compatible wrapper).
 * @param {string} notation - Dice notation (e.g., "1d20", "2d6+3", "1d20+5")
 * @returns {Object} Roll result with details (legacy shape)
 */
export function rollDice(notation) {
  const core = roll(notation);

  // Preserve legacy shape used across the app.
  const legacy = {
    notation: core.notation,
    rolls: core.rolls,
    modifier: core.modifier,
    subtotal: core.subtotal,
    total: core.total,
    count: core.count,
    sides: core.sides,
  };

  // Add crit metadata in a backward-compatible way (optional, additive).
  if (core.crit) {
    legacy.crit = core.crit;
  }

  return legacy;
}

/**
 * Roll with advantage (roll twice, take higher).
 * Backwards compatible: keeps the same structure and semantics.
 *
 * @param {string} notation - Dice notation
 * @returns {Object} Roll result
 */
export function rollAdvantage(notation) {
  const roll1 = rollDice(notation);
  const roll2 = rollDice(notation);

  const chosen = roll1.total >= roll2.total ? roll1 : roll2;
  const discarded = chosen === roll1 ? roll2 : roll1;

  return {
    ...chosen,
    advantage: true,
    chosenRoll: chosen,
    discardedRoll: discarded,
  };
}

/**
 * Roll with disadvantage (roll twice, take lower).
 * Backwards compatible: keeps the same structure and semantics.
 *
 * @param {string} notation - Dice notation
 * @returns {Object} Roll result
 */
export function rollDisadvantage(notation) {
  const roll1 = rollDice(notation);
  const roll2 = rollDice(notation);

  const chosen = roll1.total <= roll2.total ? roll1 : roll2;
  const discarded = chosen === roll1 ? roll2 : roll1;

  return {
    ...chosen,
    disadvantage: true,
    chosenRoll: chosen,
    discardedRoll: discarded,
  };
}

/**
 * Calculate ability modifier from stat
 * @param {number} stat - Ability score (3-20)
 * @returns {number} Modifier
 */
export function getModifier(stat) {
  return Math.floor((stat - 10) / 2);
}

/**
 * Format roll result for display.
 * Backwards compatible:
 * - Preserves existing formatting for legacy shapes.
 * - If crit metadata is present, appends a subtle hint.
 *
 * @param {Object} result - Roll result
 * @returns {string} Formatted string
 */
export function formatRoll(result) {
  if (!result || typeof result !== "object") {
    return "";
  }

  const formatCritSuffix = () => {
    const crit = result.crit || result.chosenRoll?.crit; // support metadata on nested rolls
    if (!crit || !crit.isCrit) return "";
    if (crit.isNat20) return " (Nat 20)";
    if (crit.isNat1) return " (Nat 1)";
    return "";
  };

  if (result.advantage && result.chosenRoll && result.discardedRoll) {
    const mod = result.modifier || 0;
    const modifierText = mod !== 0 ? (mod > 0 ? `+${mod}` : `${mod}`) : "";
    const critSuffix = formatCritSuffix();
    return (
      `🎲 Advantage: ` +
      `[${result.chosenRoll.rolls.join(", ")}] vs [${result.discardedRoll.rolls.join(", ")}] ` +
      `${modifierText ? `${modifierText} ` : ""}= **${result.total}**` +
      `${critSuffix}`
    );
  }

  if (result.disadvantage && result.chosenRoll && result.discardedRoll) {
    const mod = result.modifier || 0;
    const modifierText = mod !== 0 ? (mod > 0 ? `+${mod}` : `${mod}`) : "";
    const critSuffix = formatCritSuffix();
    return (
      `🎲 Disadvantage: ` +
      `[${result.chosenRoll.rolls.join(", ")}] vs [${result.discardedRoll.rolls.join(", ")}] ` +
      `${modifierText ? `${modifierText} ` : ""}= **${result.total}**` +
      `${critSuffix}`
    );
  }

  if (Array.isArray(result.rolls) && result.rolls.length === 1) {
    const base = result.rolls[0];
    const mod = result.modifier || 0;
    const modifierText = mod !== 0 ? ` ${mod > 0 ? "+" : ""}${mod}` : "";
    const critSuffix = formatCritSuffix();
    return `🎲 ${result.notation}: ${base}${modifierText} = **${result.total}**${critSuffix}`;
  }

  if (Array.isArray(result.rolls)) {
    const mod = result.modifier || 0;
    const modifierText = mod !== 0 ? ` ${mod > 0 ? "+" : ""}${mod}` : "";
    const critSuffix = formatCritSuffix();
    return `🎲 ${result.notation}: [${result.rolls.join(", ")}]${modifierText} = **${result.total}**${critSuffix}`;
  }

  // Fallback: in case of unexpected shape, avoid throwing.
  return "";
}

/**
 * Legacy parseRollRequests has been removed.
 * Modern flow uses semantic ROLL tags (skill/save/attack) handled directly in game.js.
 */

/**
 * Check if roll meets or exceeds DC
 * @param {number} total - Roll total
 * @param {number} dc - Difficulty Class
 * @returns {boolean} Success
 */
export function checkSuccess(total, dc) {
  return total >= dc;
}
