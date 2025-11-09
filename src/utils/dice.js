/**
 * Dice rolling utility
 * Supports standard D&D notation (1d20, 2d6+3, etc.)
 */

/**
 * Roll dice based on notation
 * @param {string} notation - Dice notation (e.g., "1d20", "2d6+3", "1d20+5")
 * @returns {Object} Roll result with details
 */
export function rollDice(notation) {
  const match = notation.match(/(\d+)d(\d+)([+-]\d+)?/i);
  
  if (!match) {
    throw new Error(`Invalid dice notation: ${notation}`);
  }
  
  const count = parseInt(match[1]);
  const sides = parseInt(match[2]);
  const modifier = match[3] ? parseInt(match[3]) : 0;
  
  const rolls = [];
  let total = 0;
  
  for (let i = 0; i < count; i++) {
    const roll = Math.floor(Math.random() * sides) + 1;
    rolls.push(roll);
    total += roll;
  }
  
  const finalTotal = total + modifier;
  
  return {
    notation,
    rolls,
    modifier,
    subtotal: total,
    total: finalTotal,
    count,
    sides
  };
}

/**
 * Roll with advantage (roll twice, take higher)
 * @param {string} notation - Dice notation
 * @returns {Object} Roll result
 */
export function rollAdvantage(notation) {
  const roll1 = rollDice(notation);
  const roll2 = rollDice(notation);
  
  const chosen = roll1.total >= roll2.total ? roll1 : roll2;
  const discarded = roll1.total >= roll2.total ? roll2 : roll1;
  
  return {
    ...chosen,
    advantage: true,
    chosenRoll: chosen,
    discardedRoll: discarded
  };
}

/**
 * Roll with disadvantage (roll twice, take lower)
 * @param {string} notation - Dice notation
 * @returns {Object} Roll result
 */
export function rollDisadvantage(notation) {
  const roll1 = rollDice(notation);
  const roll2 = rollDice(notation);
  
  const chosen = roll1.total <= roll2.total ? roll1 : roll2;
  const discarded = roll1.total <= roll2.total ? roll2 : roll1;
  
  return {
    ...chosen,
    disadvantage: true,
    chosenRoll: chosen,
    discardedRoll: discarded
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
 * Format roll result for display
 * @param {Object} result - Roll result
 * @returns {string} Formatted string
 */
export function formatRoll(result) {
  if (result.advantage) {
    return `🎲 Advantage: [${result.chosenRoll.rolls.join(', ')}] vs [${result.discardedRoll.rolls.join(', ')}] ${result.modifier !== 0 ? (result.modifier > 0 ? '+' : '') + result.modifier : ''} = **${result.total}**`;
  }
  
  if (result.disadvantage) {
    return `🎲 Disadvantage: [${result.chosenRoll.rolls.join(', ')}] vs [${result.discardedRoll.rolls.join(', ')}] ${result.modifier !== 0 ? (result.modifier > 0 ? '+' : '') + result.modifier : ''} = **${result.total}**`;
  }
  
  if (result.rolls.length === 1) {
    return `🎲 ${result.notation}: ${result.rolls[0]}${result.modifier !== 0 ? ` ${result.modifier > 0 ? '+' : ''}${result.modifier}` : ''} = **${result.total}**`;
  }
  
  return `🎲 ${result.notation}: [${result.rolls.join(', ')}]${result.modifier !== 0 ? ` ${result.modifier > 0 ? '+' : ''}${result.modifier}` : ''} = **${result.total}**`;
}

/**
 * Parse roll request from LLM output
 * @param {string} text - Text containing ROLL[...] markers
 * @returns {Array} Array of roll requests
 */
export function parseRollRequests(text) {
  const regex = /ROLL\[([^\]]+)\]/g;
  const requests = [];
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    const parts = match[1].split('|');
    requests.push({
      notation: parts[0],
      type: parts[1] || 'normal',
      dc: parts[2] ? parseInt(parts[2]) : null,
      fullMatch: match[0]
    });
  }
  
  return requests;
}

/**
 * Check if roll meets or exceeds DC
 * @param {number} total - Roll total
 * @param {number} dc - Difficulty Class
 * @returns {boolean} Success
 */
export function checkSuccess(total, dc) {
  return total >= dc;
}
