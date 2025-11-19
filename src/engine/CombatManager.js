/**
 * CombatManager - Handles combat state, initiative tracking, and turn management
 * Extracted from game.js to separate combat logic from UI concerns
 */

import { rollDice, formatRoll } from "../utils/dice.js"
import { buildDiceProfile } from "../utils/dice5e.js"

/**
 * Initialize combat state for a game
 * @param {Object} game - Game state object
 * @param {Object} character - Character object
 * @param {string} description - Combat start description
 * @returns {Array} - Array of system messages to add
 */
export function startCombat(game, character, description = "") {
  const messages = []
  
  game.combat.active = true
  game.combat.round = 1

  // Build initiative entries (player + optional hinted NPCs)
  const initiativeEntries = []

  if (character) {
    const profile = buildDiceProfile(character)
    const dexMod = profile.abilities?.dex ?? 0
    const initRoll = rollDice(`1d20${dexMod >= 0 ? `+${dexMod}` : dexMod}`)
    const meta = createRollMetadata({ sourceType: "initiative" })

    initiativeEntries.push({
      id: `init_player`,
      name: character.name || "Player",
      type: "player",
      roll: initRoll,
      total: initRoll.total,
      ...meta,
    })

    messages.push({
      id: `msg_${meta.rollId}_initiative_player`,
      role: "system",
      content: `⚔️ Initiative (You): ${formatRoll(initRoll)}`,
      timestamp: meta.timestamp,
      hidden: false,
      metadata: {
        diceRoll: initRoll,
        type: "initiative",
        actorType: "player",
        actorName: character.name || "Player",
        ...meta,
      },
    })
  }

  // Parse enemy names from description
  const enemyNames = parseEnemyNames(description)

  enemyNames.slice(0, 5).forEach((name, idx) => {
    const initRoll = rollDice("1d20")
    const meta = createRollMetadata({ sourceType: "initiative" })
    initiativeEntries.push({
      id: `init_npc_${idx}`,
      name,
      type: "npc",
      roll: initRoll,
      total: initRoll.total,
      ...meta,
    })
    messages.push({
      id: `msg_${meta.rollId}_initiative_npc_${idx}`,
      role: "system",
      content: `⚔️ Initiative (${name}): ${formatRoll(initRoll)}`,
      timestamp: meta.timestamp,
      hidden: false,
      metadata: {
        diceRoll: initRoll,
        type: "initiative",
        actorType: "npc",
        actorName: name,
        ...meta,
      },
    })
  })

  if (initiativeEntries.length > 0) {
    initiativeEntries.sort((a, b) => b.total - a.total)
    game.combat.initiative = initiativeEntries
    game.combat.currentTurnIndex = 0
    
    // Add turn order announcement
    const firstActor = initiativeEntries[0]
    const turnOrderMsg = firstActor.type === "player"
      ? "🎯 You go first! What do you do?"
      : `🎯 ${firstActor.name} goes first!`
    
    messages.push({
      id: `msg_${Date.now()}_turn_order`,
      role: "system",
      content: turnOrderMsg,
      timestamp: new Date().toISOString(),
      hidden: false,
      metadata: { 
        turnOrder: true,
        firstActor: firstActor.type,
        firstActorName: firstActor.name,
        ephemeral: true
      },
    })
  } else {
    game.combat.initiative = []
    game.combat.currentTurnIndex = 0
  }

  messages.push({
    id: `msg_${Date.now()}_combat_start`,
    role: "system",
    content: `⚔️ Combat has begun! ${description || ""}`.trim(),
    timestamp: new Date().toISOString(),
    hidden: false,
    metadata: { combatEvent: "start" },
  })

  return messages
}

/**
 * End combat and reset state
 * @param {Object} game - Game state object
 * @param {string} outcome - Combat end description
 * @returns {Object} - System message to add
 */
export function endCombat(game, outcome = "") {
  game.combat.active = false
  game.combat.round = 0
  game.combat.initiative = []
  game.combat.currentTurnIndex = 0

  return {
    id: `msg_${Date.now()}_combat_end`,
    role: "system",
    content: `✓ Combat ended: ${outcome}`,
    timestamp: new Date().toISOString(),
    hidden: false,
    metadata: { combatEvent: "end" },
  }
}

/**
 * Get current turn description for display
 * @param {Object} game - Game state object
 * @returns {string} - Turn description
 */
export function getCurrentTurnDescription(game) {
  if (!game.combat.active || !game.combat.initiative || game.combat.initiative.length === 0) {
    return ""
  }
  
  const currentIndex = game.combat.currentTurnIndex || 0
  const current = game.combat.initiative[currentIndex]
  
  if (!current) {
    return ""
  }
  
  const turnText = current.type === "player" ? "Your turn" : `${current.name}'s turn`
  return ` • ${turnText}`
}

/**
 * Advance to the next turn in combat
 * @param {Object} game - Game state object
 */
export function advanceTurn(game) {
  if (!game.combat.active || !game.combat.initiative || game.combat.initiative.length === 0) {
    return
  }
  
  game.combat.currentTurnIndex = (game.combat.currentTurnIndex + 1) % game.combat.initiative.length
  
  // If we wrapped around, increment round
  if (game.combat.currentTurnIndex === 0) {
    game.combat.round = (game.combat.round || 1) + 1
  }
}

/**
 * Parse enemy names from combat description
 * @param {string} description - Combat start description
 * @returns {Array<string>} - Array of enemy names
 */
function parseEnemyNames(description) {
  const enemyNames = []
  const desc = (description || "").trim()
  const enemyMatch = desc.match(/(?:vs\.?\s+)?(.+?)$/i)
  
  if (enemyMatch && enemyMatch[1]) {
    const raw = enemyMatch[1]
    raw.split(/,|and/).forEach((chunk) => {
      const name = chunk.trim()
      if (name && name.length > 1) enemyNames.push(name)
    })
  }
  
  return enemyNames
}

/**
 * Create roll metadata for tracking
 * @param {Object} extra - Additional metadata fields
 * @returns {Object} - Metadata object with rollId and timestamp
 */
function createRollMetadata(extra = {}) {
  const id = `roll_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const timestamp = new Date().toISOString()
  return { rollId: id, timestamp, ...extra }
}
