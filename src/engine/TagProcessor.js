/**
 * TagProcessor - Handles game tag parsing, badge rendering, and content sanitization
 * Extracted from game.js to separate game logic from UI concerns
 */

import { getLocationIcon, getConditionIcon } from "../utils/ui-icons.js"
import { rollDice, rollAdvantage, rollDisadvantage } from "../utils/dice.js"
import { buildDiceProfile, rollSkillCheck, rollSavingThrow, rollAttack } from "../utils/dice5e.js"

/**
 * Strip game tags from text and replace with inline badge tokens
 * @param {string} text - Text with game tags
 * @returns {string} - Text with tags replaced by badge tokens
 */
export function stripTags(text) {
  let cleaned = text

  cleaned = cleaned.replace(/LOCATION\[([^\]]+)\]/g, (match, location) => 
    createBadgeToken('location', { name: location.trim() }))

  cleaned = cleaned.replace(/ROLL\[([^\]]+)\]/g, (match, inner) => {
    const parts = inner.split('|').map(p => p.trim())
    const kind = (parts[0] || '').toLowerCase()
    if (kind === 'skill' || kind === 'save' || kind === 'attack') {
      return createBadgeToken('roll', { 
        kind, 
        key: parts[1] || '', 
        dc: parts[2] ? Number.parseInt(parts[2], 10) : null, 
        targetAC: parts[2] ? Number.parseInt(parts[2], 10) : null 
      })
    }
    return createBadgeToken('roll', { notation: parts[0] || '' })
  })

  cleaned = cleaned.replace(/COMBAT_START\[([^\]]+)\]/g, (m, d) => 
    createBadgeToken('combat', { action: 'start', desc: (d || '').trim() }))
  cleaned = cleaned.replace(/COMBAT_CONTINUE/g, () => 
    createBadgeToken('combat', { action: 'continue' }))
  cleaned = cleaned.replace(/COMBAT_END\[([^\]]+)\]/g, (m, d) => 
    createBadgeToken('combat', { action: 'end', desc: (d || '').trim() }))

  cleaned = cleaned.replace(/DAMAGE\[(\w+)\|(\d+)\]/g, (m, target, amount) => 
    createBadgeToken('damage', { target: (target || '').trim(), amount: Number.parseInt(amount, 10) }))
  cleaned = cleaned.replace(/HEAL\[(\w+)\|(\d+)\]/g, (m, target, amount) => 
    createBadgeToken('heal', { target: (target || '').trim(), amount: Number.parseInt(amount, 10) }))

  cleaned = cleaned.replace(/INVENTORY_ADD\[([^\]|]+)\|?(\d+)?\]/g, (m, item, qty) => 
    createBadgeToken('inventory_add', { item: (item || '').trim(), qty: qty ? Number.parseInt(qty, 10) : 1 }))
  cleaned = cleaned.replace(/INVENTORY_REMOVE\[([^\]|]+)\|?(\d+)?\]/g, (m, item, qty) => 
    createBadgeToken('inventory_remove', { item: (item || '').trim(), qty: qty ? Number.parseInt(qty, 10) : 1 }))
  cleaned = cleaned.replace(/INVENTORY_EQUIP\[([^\]]+)\]/g, (m, item) => 
    createBadgeToken('inventory_equip', { item: (item || '').trim() }))
  cleaned = cleaned.replace(/INVENTORY_UNEQUIP\[([^\]]+)\]/g, (m, item) => 
    createBadgeToken('inventory_unequip', { item: (item || '').trim() }))
  cleaned = cleaned.replace(/GOLD_CHANGE\[(-?\d+\.?\d*)\]/g, (m, delta) => 
    createBadgeToken('gold', { delta: Number.parseFloat(delta) }))
  cleaned = cleaned.replace(/STATUS_ADD\[([^\]]+)\]/g, (m, name) => 
    createBadgeToken('status_add', { name: (name || '').trim() }))
  cleaned = cleaned.replace(/STATUS_REMOVE\[([^\]]+)\]/g, (m, name) => 
    createBadgeToken('status_remove', { name: (name || '').trim() }))

  cleaned = cleaned.replace(/RELATIONSHIP\[([^:]+):([+-]?\d+)\]/g, (m, entity, delta) => 
    createBadgeToken('relationship', { entity: (entity || '').trim(), delta: Number.parseInt(delta, 10) }))

  cleaned = cleaned.replace(/ACTION\[([^\]]+)\]/g, (m, action) => 
    createBadgeToken('action', { action: (action || '').trim() }))

  // Clean up whitespace artifacts
  cleaned = cleaned.replace(/ +\n/g, "\n")
  cleaned = cleaned.replace(/\n +/g, "\n")
  cleaned = cleaned.replace(/  +/g, " ")
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n")
  cleaned = cleaned.split("\n").map(line => line.trim()).join("\n")

  return cleaned.trim()
}

/**
 * Parse markdown formatting in text
 * @param {string} text - Text with markdown
 * @returns {string} - HTML string
 */
export function parseMarkdown(text) {
  let html = escapeHtml(text)

  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
  html = html.replace(/__(.*?)__/g, "<strong>$1</strong>")
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>")
  html = html.replace(/_([^_]+)_/g, "<em>$1</em>")
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>")
  html = html.replace(/\n/g, "<br>")

  return html
}

/**
 * Create a unique badge token for later rendering
 * @param {string} type - Badge type
 * @param {Object} data - Badge data
 * @returns {string} - Badge token
 */
export function createBadgeToken(type, data) {
  const encoded = encodeURIComponent(JSON.stringify(data || {}))
  return `@@BADGE|${type}|${encoded}@@`
}

/**
 * Render inline badge HTML for a given type and data
 * @param {string} type - Badge type
 * @param {Object} data - Badge data
 * @returns {string} - HTML string for badge
 */
export function renderInlineBadgeHtml(type, data) {
  try {
    const badgeData = data || {}
    const labelEscape = (t) => escapeHtml(String(t || ""))
    
    switch (type) {
      case "location": {
        const name = badgeData.name || ""
        const icon = getLocationIcon(name) || "🗺️"
        return `<span class="inline-badge location" data-tag-type="location">${icon} New Location: ${labelEscape(name)}</span>`
      }
      case "inventory_add": {
        const qty = badgeData.qty ?? 1
        const item = badgeData.item || ""
        return `<span class="inline-badge inventory" data-tag-type="inventory">📦 +${labelEscape(qty)} ${labelEscape(item)}</span>`
      }
      case "inventory_remove": {
        const qty = badgeData.qty ?? 1
        const item = badgeData.item || ""
        return `<span class="inline-badge inventory" data-tag-type="inventory">📦 -${labelEscape(qty)} ${labelEscape(item)}</span>`
      }
      case "inventory_equip": {
        const item = badgeData.item || ""
        return `<span class="inline-badge inventory" data-tag-type="inventory">🛡️ Equipped ${labelEscape(item)}</span>`
      }
      case "inventory_unequip": {
        const item = badgeData.item || ""
        return `<span class="inline-badge inventory" data-tag-type="inventory">🛡️ Unequipped ${labelEscape(item)}</span>`
      }
      case "roll": {
        const kind = (badgeData.kind || "").toLowerCase()
        if (kind === "skill") {
          const key = badgeData.key || ""
          return `<span class="inline-badge roll" data-tag-type="roll">🎲 ${labelEscape(capitalize(key))} Check${badgeData.dc ? ` vs DC ${labelEscape(badgeData.dc)}` : ""}</span>`
        }
        if (kind === "save") {
          const key = badgeData.key || ""
          return `<span class="inline-badge roll" data-tag-type="roll">🎲 ${labelEscape(capitalize(key))} Save${badgeData.dc ? ` vs DC ${labelEscape(badgeData.dc)}` : ""}</span>`
        }
        if (kind === "attack") {
          const key = badgeData.key || ""
          return `<span class="inline-badge roll" data-tag-type="roll">🎲 Attack (${labelEscape(key)})${badgeData.targetAC ? ` vs AC ${labelEscape(badgeData.targetAC)}` : ""}</span>`
        }
        if (badgeData.notation) {
          return `<span class="inline-badge roll" data-tag-type="roll">🎲 Roll: ${labelEscape(badgeData.notation)}</span>`
        }
        return `<span class="inline-badge roll" data-tag-type="roll">🎲 Roll</span>`
      }
      case "damage": {
        const amount = badgeData.amount ?? 0
        const target = badgeData.target || ""
        const targetText = target.toLowerCase() === "player" ? "You" : labelEscape(target)
        return `<span class="inline-badge damage" data-tag-type="damage">💔 ${targetText} -${labelEscape(amount)} HP</span>`
      }
      case "heal": {
        const amount = badgeData.amount ?? 0
        const target = badgeData.target || ""
        const targetText = target.toLowerCase() === "player" ? "You" : labelEscape(target)
        return `<span class="inline-badge heal" data-tag-type="heal">💚 ${targetText} +${labelEscape(amount)} HP</span>`
      }
      case "gold": {
        const delta = badgeData.delta ?? 0
        const sign = delta > 0 ? "+" : ""
        return `<span class="inline-badge gold" data-tag-type="gold">💰 ${sign}${labelEscape(delta)} gp</span>`
      }
      case "status_add": {
        const name = badgeData.name || ""
        const icon = getConditionIcon(name) || "⚕️"
        return `<span class="inline-badge status" data-tag-type="status">${icon} Status: ${labelEscape(name)}</span>`
      }
      case "status_remove": {
        const name = badgeData.name || ""
        return `<span class="inline-badge status" data-tag-type="status">✅ Status removed: ${labelEscape(name)}</span>`
      }
      case "combat": {
        const action = badgeData.action || ""
        if (action === "start") return `<span class="inline-badge combat" data-tag-type="combat">⚔️ Combat started</span>`
        if (action === "continue") return `<span class="inline-badge combat" data-tag-type="combat">⚔️ Combat continues</span>`
        if (action === "end") return `<span class="inline-badge combat" data-tag-type="combat">✓ Combat ended</span>`
        return `<span class="inline-badge combat" data-tag-type="combat">⚔️ Combat</span>`
      }
      case "action": {
        const action = badgeData.action || ""
        return `<span class="inline-badge action" data-tag-type="action">💡 ${labelEscape(action)}</span>`
      }
      case "relationship": {
        const entity = badgeData.entity || ""
        const delta = badgeData.delta ?? 0
        const sign = delta > 0 ? "+" : ""
        return `<span class="inline-badge relationship" data-tag-type="relationship">🤝 ${labelEscape(entity)} ${sign}${labelEscape(delta)}</span>`
      }
      default:
        return `<span class="inline-badge" data-tag-type="${escapeHtml(type)}">${escapeHtml(type)}</span>`
    }
  } catch (e) {
    return `<span class="inline-badge">${escapeHtml(type)}</span>`
  }
}

/**
 * Parse a badge token back into type and payload
 * @param {string} token - Badge token
 * @returns {Object|null} - {type, payload} or null
 */
export function parseBadgeToken(token) {
  const match = token.match(/^@@BADGE\|([^|]+)\|([^@]+)@@$/)
  if (!match) return null
  const type = match[1]
  try {
    const payload = JSON.parse(decodeURIComponent(match[2]))
    return { type, payload }
  } catch (e) {
    return { type, payload: {} }
  }
}

/**
 * Insert inline badges into HTML by replacing badge tokens
 * @param {string} html - HTML with badge tokens
 * @returns {string} - HTML with rendered badges
 */
export function insertInlineBadges(html) {
  if (!html) return html
  return html.replace(/@@BADGE\|([^|]+)\|([^@]+)@@/g, (full, ttype, encoded) => {
    try {
      const payload = JSON.parse(decodeURIComponent(encoded))
      return renderInlineBadgeHtml(ttype, payload)
    } catch (e) {
      return full
    }
  })
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} - Escaped HTML
 */
function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

/**
 * Capitalize first letter of string
 * @param {string} str - String to capitalize
 * @returns {string} - Capitalized string
 */
function capitalize(str) {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}
