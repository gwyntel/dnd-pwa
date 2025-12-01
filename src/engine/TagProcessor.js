/**
 * TagProcessor - Orchestrates specialized tag processors
 * Refactored from 1,389-line monolith to modular architecture
 */

import { InventoryProcessor } from './processors/InventoryProcessor.js'
import { CombatProcessor } from './processors/CombatProcessor.js'
import { SpellProcessor } from './processors/SpellProcessor.js'
import { NarrativeProcessor } from './processors/NarrativeProcessor.js'
import { RollProcessor } from './processors/RollProcessor.js'
import { RestProcessor } from './processors/RestProcessor.js'
import { RenderProcessor } from './processors/RenderProcessor.js'
import { tagParser } from './TagParser.js'
import { startCombat, endCombat, spawnEnemy } from './CombatManager.js'
import { formatRoll } from '../utils/dice.js'
import store from '../state/store.js'


// Re-export rendering functions for backward compatibility
export const stripTags = RenderProcessor.stripTags
export const parseMarkdown = RenderProcessor.parseMarkdown
export const createBadgeToken = RenderProcessor.createBadgeToken
export const renderInlineBadgeHtml = RenderProcessor.renderInlineBadgeHtml
export const parseBadgeToken = RenderProcessor.parseBadgeToken
export const insertInlineBadges = RenderProcessor.insertInlineBadges
export const escapeHtml = RenderProcessor.escapeHtml
export const capitalize = RenderProcessor.capitalize

/**
 * Process game tags in real-time as they stream in
 * @param {Object} game - Game state object
 * @param {Object} character - Character object
 * @param {string} text - Text to process
 * @param {Set} processedTags - Set of processed tag keys
 * @param {Object} callbacks - Callbacks for side effects (onRoll, etc.)
 * @returns {Promise<Array>} - Array of new messages
 */
export async function processGameTagsRealtime(game, character, text, processedTags, callbacks = {}) {
  const data = store.get()
  const allMessages = []

  // Initialize all processors
  const inventory = new InventoryProcessor(game, character, data)
  const combat = new CombatProcessor(game, character, data)
  const spell = new SpellProcessor(game, character, data)
  const narrative = new NarrativeProcessor(game, character, data)
  const roll = new RollProcessor(game, character, data)
  const rest = new RestProcessor(game, character, data)

  // Process tags with each processor
  // Order matters: some processors may generate tags for others
  allMessages.push(...inventory.processRealtimeTags(text, processedTags, callbacks))
  allMessages.push(...combat.processRealtimeTags(text, processedTags, callbacks))
  allMessages.push(...spell.processRealtimeTags(text, processedTags, callbacks))
  allMessages.push(...narrative.processRealtimeTags(text, processedTags, callbacks))
  allMessages.push(...rest.processRealtimeTags(text, processedTags, callbacks))

  // Roll processor doesn't return messages, just triggers callbacks
  roll.processRealtimeTags(text, processedTags, callbacks)

  return allMessages
}

/**
 * Process game tags that require full message context (non-realtime)
 * These tags need access to world data or are handled differently
 * @param {Object} game - Game state object
 * @param {Object} character - Character object
 * @param {string} text - Text to process
 * @param {Set} processedTags - Set of processed tag keys
 * @param {Object} data - Store data
 */
export function processGameTags(game, character, text, processedTags, data) {
  const { tags } = tagParser.parse(text)

  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i]
    const tagKey = `${tag.type}_${tag.index}`

    if (processedTags.has(tagKey)) continue

    let processed = false

    switch (tag.type) {
      case 'COMBAT_START': {
        const world = data.worlds ? data.worlds.find(w => w.id === game.worldId) : null
        const result = startCombat(game, character, world, tag.content.trim())
        if (result) {
          if (Array.isArray(result)) {
            game.messages.push(...result)
          } else {
            game.messages.push(result)
          }
          processed = true
        }
        break
      }

      case 'COMBAT_END': {
        const result = endCombat(game, tag.content.trim())
        if (result) {
          game.messages.push(result)
          processed = true
        }
        break
      }

      case 'ENEMY_SPAWN': {
        const world = data.worlds ? data.worlds.find(w => w.id === game.worldId) : null
        const [templateId, nameOverride] = tag.content.split('|').map(s => s.trim())
        const enemy = spawnEnemy(game, world, templateId, nameOverride)
        if (enemy) {
          processed = true
          // If combat is already active, announce initiative for this late-spawned enemy
          if (game.combat.active) {
            const initEntry = game.combat.initiative.find(i => i.enemyId === enemy.id)
            if (initEntry) {
              // We need formatRoll here, but let's avoid adding an import if we can.
              // Actually, we should just import it.
              // For now, let's just use the total.
              game.messages.push({
                id: `msg_${Date.now()}_init_${enemy.id}`,
                role: "system",
                content: `⚔️ Initiative (${enemy.name}): ${formatRoll(initEntry.roll)}`,
                timestamp: new Date().toISOString(),
                hidden: false,
                metadata: {
                  diceRoll: initEntry.roll,
                  type: "initiative",
                  actorType: "npc",
                  actorName: enemy.name
                }
              })
            }
          }
        }
        break
      }

      case 'COMBAT_CONTINUE': {
        // Silent tag - just mark as processed
        processed = true
        break
      }

      case 'LEVEL_UP': {
        // Handled by UI modal, just mark as processed
        processed = true
        break
      }
    }

    if (processed) {
      processedTags.add(tagKey)
    }
  }
}
