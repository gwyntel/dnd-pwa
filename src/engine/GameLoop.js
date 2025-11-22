/**
 * GameLoop - Handles message construction, sanitization, and API request coordination
 * Extracted from game.js to separate message handling logic from UI concerns
 */

import { buildGameDMPrompt } from '../utils/prompts/game-dm-prompt.js'

/**
 * Build the messages payload for the model
 * Preserves full stored history but returns sanitized version for API
 * CRITICAL: Regenerates system prompt on each call to ensure AI has current character stats
 * @param {Object} gameRef - Game state object
 * @param {Object} character - Character object (for building fresh system prompt)
 * @param {Object} world - World object (for building fresh system prompt)
 * @returns {Array} - Sanitized messages for API
 */
export function buildApiMessages(gameRef, character, world) {
  console.log('[flow] buildApiMessages called', {
    gameId: gameRef?.id,
    storedMessageCount: gameRef?.messages?.length || 0,
    characterName: character?.name,
    characterLevel: character?.level,
    characterMaxHP: character?.maxHP
  })

  // Apply relationship trimming before building API messages
  gameRef.relationships = trimRelationships(gameRef)

  // Apply visited locations trimming
  gameRef.visitedLocations = trimVisitedLocations(gameRef)

  const base = gameRef?.messages || []

  console.log('[flow] buildApiMessages: stored messages', {
    messages: base.map(m => ({
      id: m?.id,
      role: m?.role,
      contentPreview: m?.content?.substring(0, 50),
      timestamp: m?.timestamp
    }))
  })

  // Rebuild system prompt with current character stats
  // This ensures the AI always sees up-to-date HP, level, stats, etc.
  if (character && world) {
    const freshSystemPrompt = buildGameDMPrompt(character, gameRef, world)

    // Find and replace the first system message (should be the system prompt)
    const systemMsgIndex = base.findIndex(m => m?.role === 'system')
    if (systemMsgIndex !== -1) {
      console.log('[flow] buildApiMessages: regenerating system prompt with current stats')
      base[systemMsgIndex] = {
        ...base[systemMsgIndex],
        content: freshSystemPrompt
      }
    }
  }

  const sanitized = sanitizeMessagesForModel(base)

  console.log('[flow] buildApiMessages: returning sanitized messages', {
    count: sanitized.length,
    messages: sanitized.map(m => ({
      id: m?.id,
      role: m?.role,
      contentPreview: m?.content?.substring(0, 50)
    }))
  })

  return sanitized
}

/**
 * Sanitize messages for model consumption
 * Removes ephemeral messages and strips stale ACTION tags from old assistant messages
 * @param {Array} messages - Raw messages array
 * @returns {Array} - Sanitized messages
 */
export function sanitizeMessagesForModel(messages) {
  console.log('[flow] sanitizeMessagesForModel called', {
    messageCount: Array.isArray(messages) ? messages.length : 0,
    messages: messages?.map(m => ({ id: m?.id, role: m?.role, contentLength: m?.content?.length }))
  })

  if (!Array.isArray(messages)) {
    console.log('[flow] sanitizeMessagesForModel: messages not an array, returning empty')
    return []
  }

  const lastAssistantIndex = [...messages]
    .reverse()
    .findIndex((m) => m && m.role === "assistant")

  const cutoff =
    lastAssistantIndex === -1
      ? -1
      : messages.length - 1 - lastAssistantIndex

  console.log('[flow] sanitizeMessagesForModel: calculated cutoff', {
    lastAssistantIndex,
    cutoff,
    totalMessages: messages.length
  })

  // Filter out ephemeral system messages before the last assistant message
  return messages.filter((msg, index) => {
    if (msg?.metadata?.ephemeral && index < cutoff) {
      console.log('[flow] sanitizeMessagesForModel: removing ephemeral message', {
        index,
        id: msg?.id,
        content: msg?.content?.substring(0, 50)
      })
      return false
    }
    return true
  }).map((msg, index) => {
    // Keep system + user messages as-is
    if (!msg || msg.role === "system" || msg.role === "user") {
      console.log('[flow] sanitizeMessagesForModel: keeping system/user message', {
        index,
        id: msg?.id,
        role: msg?.role
      })
      return msg
    }

    // Keep the latest assistant message intact
    if (index === cutoff || cutoff === -1) {
      console.log('[flow] sanitizeMessagesForModel: keeping latest assistant message', {
        index,
        id: msg?.id,
        role: msg?.role,
        contentLength: msg?.content?.length
      })
      return msg
    }

    // For older assistant messages, strip ACTION tags only
    if (msg.role === "assistant" && typeof msg.content === "string") {
      const trimmed = msg.content.replace(/ACTION\[[^\]]*]/g, "")
      if (trimmed !== msg.content && trimmed.trim().length > 0) {
        console.log('[flow] sanitizeMessagesForModel: stripped ACTION tags from old assistant message', {
          index,
          id: msg?.id,
          originalLength: msg.content.length,
          trimmedLength: trimmed.length
        })
        return { ...msg, content: trimmed }
      }
    }

    console.log('[flow] sanitizeMessagesForModel: returning message unchanged', {
      index,
      id: msg?.id,
      role: msg?.role
    })
    return msg
  })
}

/**
 * Trim relationships to stay within the configured limit
 * Removes zero-value relationships and keeps only the most recent N relationships
 * @param {Object} game - The game object
 * @param {Object} settings - Optional settings object (if not provided, uses default cap)
 * @returns {Object} - The trimmed relationships object
 */
export function trimRelationships(game, settings = null) {
  const cap = settings?.maxRelationshipsTracked || 50

  const trimmedEntries = Object.entries(game.relationships || {})
    .filter(([_, value]) => value !== 0)
    .slice(-cap)

  const trimmedRelationships = {}
  for (const [key, value] of trimmedEntries) {
    trimmedRelationships[key] = value
  }

  return trimmedRelationships
}

/**
 * Trim visited locations to stay within the configured limit
 * Keeps only the most recent N locations in the array
 * @param {Object} game - The game object
 * @param {Object} settings - Optional settings object (if not provided, uses default cap)
 * @returns {Array} - The trimmed visited locations array
 */
export function trimVisitedLocations(game, settings = null) {
  const cap = settings?.maxLocationsTracked || 10

  const visitedLocations = Array.isArray(game.visitedLocations) ? game.visitedLocations : []
  const trimmedLocations = visitedLocations.slice(-cap)

  return trimmedLocations
}

/**
 * Create roll metadata for tracking
 * @param {Object} extra - Additional metadata fields
 * @returns {Object} - Metadata object with rollId and timestamp
 */
export function createRollMetadata(extra = {}) {
  const id = `roll_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const timestamp = new Date().toISOString()
  return { rollId: id, timestamp, ...extra }
}
