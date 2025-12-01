/**
 * RenderProcessor - Handles rendering of badges, markdown, and HTML
 * Processes text for display, converts tags to badges, and formats markdown
 */

import { getLocationIcon, getConditionIcon } from '../../data/icons.js'
import { tagParser } from '../TagParser.js'

export class RenderProcessor {
    /**
     * Strip game tags from text and replace with inline badge tokens
     * @param {string} text - Text with game tags
     * @returns {string} - Text with tags replaced by badge tokens
     */
    static stripTags(text) {
        const { cleanText, tags } = tagParser.parse(text)
        let result = text

        for (const tag of tags) {
            const badgeToken = RenderProcessor.createBadgeForTag(tag)
            result = result.replace(tag.raw, badgeToken)
        }

        // Clean up whitespace artifacts
        result = result.replace(/ +\n/g, "\n")  // Remove trailing spaces before newlines
        result = result.replace(/\n +/g, "\n")  // Remove leading spaces after newlines
        result = result.replace(/  +/g, " ")    // Collapse multiple spaces
        result = result.replace(/\n{2,}/g, "\n") // Collapse multiple newlines
        result = result.split("\n").map(line => line.trim()).join("\n")
        result = result.replace(/\n{2,}/g, "\n")

        return result.trim()
    }

    /**
     * Create a badge token for a given tag
     * @param {Object} tag - Parsed tag object
     * @returns {string} - Badge token string
     */
    static createBadgeForTag(tag) {
        switch (tag.type) {
            case 'LOCATION':
                return RenderProcessor.createBadgeToken('location', { name: tag.content.trim() })

            case 'ROLL': {
                const parts = tag.content.split('|').map(p => p.trim())
                const kind = (parts[0] || '').toLowerCase()
                if (['skill', 'save', 'attack'].includes(kind)) {
                    return RenderProcessor.createBadgeToken('roll', {
                        kind,
                        key: parts[1] || '',
                        dc: parts[2] ? parseInt(parts[2], 10) : null,
                        targetAC: parts[2] ? parseInt(parts[2], 10) : null
                    })
                }
                return RenderProcessor.createBadgeToken('roll', { notation: parts[0] || '' })
            }

            case 'COMBAT_START':
                return RenderProcessor.createBadgeToken('combat', { action: 'start', desc: tag.content.trim() })
            case 'COMBAT_CONTINUE':
                return '' // Silent tag
            case 'COMBAT_END':
                return RenderProcessor.createBadgeToken('combat', { action: 'end', desc: tag.content.trim() })

            case 'DAMAGE': {
                const [target, amount, type] = tag.content.split('|').map(s => s.trim())
                return RenderProcessor.createBadgeToken('damage', { target: target || '', amount: parseInt(amount, 10), type })
            }

            case 'TEMP_HP': {
                const [target, amount] = tag.content.split('|').map(s => s.trim())
                return RenderProcessor.createBadgeToken('temp_hp', { target: target || '', amount: parseInt(amount, 10) })
            }

            case 'APPLY_RESISTANCE': {
                const [target, type] = tag.content.split('|').map(s => s.trim())
                return RenderProcessor.createBadgeToken('resistance_add', { target: target || '', type })
            }

            case 'REMOVE_RESISTANCE': {
                const [target, type] = tag.content.split('|').map(s => s.trim())
                return RenderProcessor.createBadgeToken('resistance_remove', { target: target || '', type })
            }

            case 'APPLY_IMMUNITY': {
                const [target, type] = tag.content.split('|').map(s => s.trim())
                return RenderProcessor.createBadgeToken('immunity_add', { target: target || '', type })
            }

            case 'REMOVE_IMMUNITY': {
                const [target, type] = tag.content.split('|').map(s => s.trim())
                return RenderProcessor.createBadgeToken('immunity_remove', { target: target || '', type })
            }

            case 'APPLY_VULNERABILITY': {
                const [target, type] = tag.content.split('|').map(s => s.trim())
                return RenderProcessor.createBadgeToken('vulnerability_add', { target: target || '', type })
            }

            case 'REMOVE_VULNERABILITY': {
                const [target, type] = tag.content.split('|').map(s => s.trim())
                return RenderProcessor.createBadgeToken('vulnerability_remove', { target: target || '', type })
            }

            case 'HEAL': {
                const [target, amount] = tag.content.split('|').map(s => s.trim())
                return RenderProcessor.createBadgeToken('heal', { target: target || '', amount: parseInt(amount, 10) })
            }

            case 'INVENTORY_ADD': {
                const [item, qty] = tag.content.split('|').map(s => s.trim())
                return RenderProcessor.createBadgeToken('inventory_add', { item: item || '', qty: qty ? parseInt(qty, 10) : 1 })
            }

            case 'INVENTORY_REMOVE': {
                const [item, qty] = tag.content.split('|').map(s => s.trim())
                return RenderProcessor.createBadgeToken('inventory_remove', { item: item || '', qty: qty ? parseInt(qty, 10) : 1 })
            }

            case 'INVENTORY_EQUIP':
                return RenderProcessor.createBadgeToken('inventory_equip', { item: tag.content.trim() })
            case 'INVENTORY_UNEQUIP':
                return RenderProcessor.createBadgeToken('inventory_unequip', { item: tag.content.trim() })
            case 'GOLD_CHANGE':
                return RenderProcessor.createBadgeToken('gold', { delta: parseFloat(tag.content) })
            case 'STATUS_ADD':
                return RenderProcessor.createBadgeToken('status_add', { name: tag.content.trim() })
            case 'STATUS_REMOVE':
                return RenderProcessor.createBadgeToken('status_remove', { name: tag.content.trim() })

            case 'RELATIONSHIP': {
                const [entity, delta] = tag.content.split('|').map(s => s.trim())
                return RenderProcessor.createBadgeToken('relationship', { entity: entity || '', delta: parseInt(delta, 10) })
            }

            case 'CAST_SPELL': {
                const [spell, level] = tag.content.split('|').map(s => s.trim())
                return RenderProcessor.createBadgeToken('cast_spell', { spell: spell || '', level: parseInt(level, 10) })
            }

            case 'SHORT_REST':
                return RenderProcessor.createBadgeToken('short_rest', { duration: parseInt(tag.content, 10) })
            case 'LONG_REST':
                return RenderProcessor.createBadgeToken('long_rest', { duration: parseInt(tag.content, 10) })
            case 'CONCENTRATION_START':
                return RenderProcessor.createBadgeToken('concentration_start', { spell: tag.content.trim() })
            case 'CONCENTRATION_END':
                return RenderProcessor.createBadgeToken('concentration_end', { spell: tag.content.trim() })
            case 'HIT_DIE_ROLL':
                return RenderProcessor.createBadgeToken('hit_die_roll', { count: parseInt(tag.content, 10) })
            case 'ACTION':
                return '' // Action tags are removed completely
            case 'XP_GAIN': {
                const [amount, reason] = tag.content.split('|').map(s => s.trim())
                return RenderProcessor.createBadgeToken('xp_gain', { amount: parseInt(amount, 10), reason: reason || '' })
            }

            case 'LEARN_SPELL':
                return RenderProcessor.createBadgeToken('learn_spell', { spell: tag.content.trim() })

            case 'ENEMY_SPAWN': {
                const [templateId, nameOverride] = tag.content.split('|').map(s => s.trim())
                return RenderProcessor.createBadgeToken('enemy_spawn', { name: nameOverride || templateId })
            }

            case 'USE_ITEM':
                return RenderProcessor.createBadgeToken('use_item', { item: tag.content.trim() })

            default:
                return tag.raw
        }
    }

    /**
     * Parse markdown formatting in text
     * @param {string} text - Text with markdown
     * @returns {string} - HTML string
     */
    static parseMarkdown(text) {
        let html = RenderProcessor.escapeHtml(text)

        // Protect badge tokens from markdown parsing
        const badgeTokens = []
        html = html.replace(/@@BADGE\|[^|]+\|.+?@@/g, (match) => {
            badgeTokens.push(match)
            return `§BADGE${badgeTokens.length - 1}§`
        })

        html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        html = html.replace(/__(.*?)__/g, "<strong>$1</strong>")
        html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>")
        html = html.replace(/_([^_]+)_/g, "<em>$1</em>")
        html = html.replace(/`([^`]+)`/g, "<code>$1</code>")
        html = html.replace(/\n/g, "<br>")
        html = html.replace(/(<br>\s*){2,}/g, "<br>")

        // Restore badge tokens
        badgeTokens.forEach((token, index) => {
            html = html.split(`§BADGE${index}§`).join(token)
        })

        return html
    }

    /**
     * Create a unique badge token for later rendering
     * @param {string} type - Badge type
     * @param {Object} data - Badge data
     * @returns {string} - Badge token
     */
    static createBadgeToken(type, data) {
        const encoded = encodeURIComponent(JSON.stringify(data || {}))
        return `@@BADGE|${type}|${encoded}@@`
    }

    /**
     * Parse a badge token back into type and payload
     * @param {string} token - Badge token
     * @returns {Object|null} - {type, payload} or null
     */
    static parseBadgeToken(token) {
        const match = token.match(/^@@BADGE\|([^|]+)\|(.+)@@$/)
        if (!match) return null

        try {
            const type = match[1]
            const payload = JSON.parse(decodeURIComponent(match[2]))
            return { type, payload }
        } catch (e) {
            console.error('Failed to parse badge token:', token, e)
            return null
        }
    }

    /**
     * Insert inline badges into HTML by replacing badge tokens
     * @param {string} html - HTML with badge tokens
     * @returns {string} - HTML with rendered badges
     */
    static insertInlineBadges(html) {
        return html.replace(/@@BADGE\|([^|]+)\|(.+?)@@/g, (match, type, encodedData) => {
            try {
                const data = JSON.parse(decodeURIComponent(encodedData))
                return RenderProcessor.renderInlineBadgeHtml(type, data)
            } catch (e) {
                console.error('Failed to render badge:', match, e)
                return match
            }
        })
    }

    /**
     * Render inline badge HTML for a given type and data
     * @param {string} type - Badge type
     * @param {Object} data - Badge data
     * @returns {string} - HTML string for badge
     */
    static renderInlineBadgeHtml(type, data) {
        const badgeData = data || {}
        const escape = (t) => RenderProcessor.escapeHtml(String(t || ""))

        switch (type) {
            case "location": {
                const name = badgeData.name || ""
                const icon = getLocationIcon(name) || "🗺️"
                return `<span class="inline-badge location" data-tag-type="location">${icon} ${escape(name)}</span>`
            }

            case "inventory_add": {
                const qty = badgeData.qty ?? 1
                const item = badgeData.item || ""
                return `<span class="inline-badge inventory" data-tag-type="inventory">📦 Added: ${escape(qty)}x ${escape(item)}</span>`
            }

            case "inventory_remove": {
                const qty = badgeData.qty ?? 1
                const item = badgeData.item || ""
                return `<span class="inline-badge inventory" data-tag-type="inventory">📦 -${escape(qty)} ${escape(item)}</span>`
            }

            case "inventory_equip": {
                const item = badgeData.item || ""
                return `<span class="inline-badge inventory" data-tag-type="inventory">🛡️ Equip: ${escape(item)}</span>`
            }

            case "inventory_unequip": {
                const item = badgeData.item || ""
                return `<span class="inline-badge inventory" data-tag-type="inventory">🛡️ Unequipped ${escape(item)}</span>`
            }

            case "gold": {
                const delta = badgeData.delta ?? 0
                const sign = delta >= 0 ? "+" : ""
                return `<span class="inline-badge gold" data-tag-type="gold">💰 ${sign}${delta} GP</span>`
            }

            case "status_add": {
                const name = badgeData.name || ""
                const icon = getConditionIcon(name) || "🔴"
                return `<span class="inline-badge status" data-tag-type="status">${icon} ${escape(name)}</span>`
            }

            case "status_remove": {
                const name = badgeData.name || ""
                return `<span class="inline-badge status-remove" data-tag-type="status">✅ Removed: ${escape(name)}</span>`
            }

            case "cast_spell": {
                const spell = badgeData.spell || ""
                const level = badgeData.level ?? 0
                return `<span class="inline-badge spell" data-tag-type="spell">✨ Cast: ${escape(spell)} (Lv ${level})</span>`
            }

            case "learn_spell": {
                const spell = badgeData.spell || ""
                return `<span class="inline-badge spell" data-tag-type="spell">📖 Learned: ${escape(spell)}</span>`
            }

            case "xp_gain": {
                const amount = badgeData.amount ?? 0
                return `<span class="inline-badge xp" data-tag-type="xp">⭐ +${amount} XP</span>`
            }

            case "short_rest":
                return `<span class="inline-badge rest" data-tag-type="rest">😴 Short Rest</span>`

            case "long_rest":
                return `<span class="inline-badge rest" data-tag-type="rest">🛌 Long Rest</span>`

            case "enemy_spawn": {
                const name = badgeData.name || ""
                return `<span class="inline-badge combat" data-tag-type="combat">⚔️ ${escape(name)} appears!</span>`
            }

            case "use_item": {
                const item = badgeData.item || ""
                return `<span class="inline-badge item" data-tag-type="item">🧪 Used: ${escape(item)}</span>`
            }

            case "combat": {
                const action = badgeData.action || ""
                const desc = badgeData.desc || ""
                if (action === 'start') {
                    return `<span class="inline-badge combat-start" data-tag-type="combat">⚔️ Combat Started${desc ? ': ' + escape(desc) : ''}</span>`
                } else if (action === 'end') {
                    return `<span class="inline-badge combat-end" data-tag-type="combat">✅ Combat Ended</span>`
                }
                return ""
            }

            default:
                return `<span class="inline-badge" data-tag-type="${escape(type)}">${escape(JSON.stringify(badgeData))}</span>`
        }
    }

    /**
     * Escape HTML special characters
     * @param {string} text - Text to escape
     * @returns {string} - Escaped HTML
     */
    static escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }
        return text.replace(/[&<>"']/g, m => map[m])
    }

    /**
     * Capitalize first letter of string
     * @param {string} str - String to capitalize
     * @returns {string} - Capitalized string
     */
    static capitalize(str) {
        if (!str) return ''
        return str.charAt(0).toUpperCase() + str.slice(1)
    }
}
