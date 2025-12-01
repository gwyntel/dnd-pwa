/**
 * BaseProcessor - Shared utilities for all tag processors
 * Provides common helper methods and state management
 */

export class BaseProcessor {
    constructor(game, character, data) {
        this.game = game
        this.character = character
        this.data = data
        this.world = data.worlds ? data.worlds.find(w => w.id === game.worldId) || null : null
    }

    /**
     * Ensure an array exists on an object
     * @param {Object} obj - Target object
     * @param {string} key - Property key
     * @param {Array} defaultVal - Default value
     */
    ensureArray(obj, key, defaultVal = []) {
        if (!Array.isArray(obj[key])) {
            obj[key] = defaultVal
        }
    }

    /**
     * Ensure an object exists on an object
     * @param {Object} obj - Target object
     * @param {string} key - Property key
     * @param {Object} defaultVal - Default value
     */
    ensureObject(obj, key, defaultVal = {}) {
        if (!obj[key] || typeof obj[key] !== 'object') {
            obj[key] = defaultVal
        }
    }

    /**
     * Ensure a number exists on an object
     * @param {Object} obj - Target object
     * @param {string} key - Property key
     * @param {number} defaultVal - Default value
     */
    ensureNumber(obj, key, defaultVal = 0) {
        if (typeof obj[key] !== 'number') {
            obj[key] = defaultVal
        }
    }

    /**
     * Sanitize and trim text content
     * @param {string} text - Text to sanitize
     * @returns {string} - Cleaned text
     */
    sanitize(text) {
        return (text || '').replace(/[\r\n]+/g, ' ').trim()
    }

    /**
     * Create a unique tag key for tracking processed tags
     * @param {string} type - Tag type
     * @param {number} index - Tag index
     * @returns {string} - Unique key
     */
    createTagKey(type, index) {
        return `${type}_${index}`
    }

    /**
     * Create a system message
     * @param {string} content - Message content
     * @param {Object} metadata - Optional metadata
     * @returns {Object} - Message object
     */
    createSystemMessage(content, metadata = {}) {
        return {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            role: 'system',
            content,
            timestamp: new Date().toISOString(),
            hidden: false,
            metadata
        }
    }
}
