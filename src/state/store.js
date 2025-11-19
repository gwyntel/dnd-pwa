/**
 * Centralized State Management Store
 * Single source of truth for application state
 * Wraps the existing storage utility to prevent race conditions and excessive disk I/O
 */

import { loadData, saveData, debouncedSave as storageDebouncedSave } from "../utils/storage.js"

class Store {
  constructor() {
    this._state = null
    this._listeners = new Set()
    this._isInitialized = false
  }

  /**
   * Initialize the store by loading data once from localStorage
   * Should be called during app startup
   */
  initialize() {
    if (this._isInitialized) {
      console.warn("[Store] Already initialized")
      return
    }

    console.log("[Store] Initializing store from localStorage")
    this._state = loadData()
    this._isInitialized = true
    console.log("[Store] Store initialized", {
      characters: this._state.characters?.length || 0,
      games: this._state.games?.length || 0,
      worlds: this._state.worlds?.length || 0,
    })
  }

  /**
   * Ensure store is initialized before operations
   * @private
   */
  _ensureInitialized() {
    if (!this._isInitialized) {
      throw new Error("[Store] Store not initialized. Call initialize() first.")
    }
  }

  /**
   * Get the current in-memory state
   * @returns {Object} The current state
   */
  get() {
    this._ensureInitialized()
    return this._state
  }

  /**
   * Get a specific game by ID
   * @param {string} id - Game ID
   * @returns {Object|null} The game object or null if not found
   */
  getGame(id) {
    this._ensureInitialized()
    if (!id) return null
    return this._state.games?.find((g) => g.id === id) || null
  }

  /**
   * Get a specific character by ID
   * @param {string} id - Character ID
   * @returns {Object|null} The character object or null if not found
   */
  getCharacter(id) {
    this._ensureInitialized()
    if (!id) return null
    return this._state.characters?.find((c) => c.id === id) || null
  }

  /**
   * Get a specific world by ID
   * @param {string} id - World ID
   * @returns {Object|null} The world object or null if not found
   */
  getWorld(id) {
    this._ensureInitialized()
    if (!id) return null
    return this._state.worlds?.find((w) => w.id === id) || null
  }

  /**
   * Get settings
   * @returns {Object} The settings object
   */
  getSettings() {
    this._ensureInitialized()
    return this._state.settings || {}
  }

  /**
   * Update the state using an updater function
   * The updater function receives the current state and can mutate it directly
   * Changes are automatically persisted to localStorage with debouncing
   * 
   * @param {Function} updaterFn - Function that mutates the state
   * @param {Object} options - Options for the update
   * @param {boolean} options.immediate - If true, save immediately without debouncing
   * @param {number} options.debounceDelay - Custom debounce delay in ms (default: 300)
   * @returns {Promise<void>}
   */
  async update(updaterFn, options = {}) {
    this._ensureInitialized()

    if (typeof updaterFn !== "function") {
      throw new Error("[Store] updaterFn must be a function")
    }

    console.log("[Store] Updating state")

    // Call the updater function with the current state
    // The function can mutate the state directly
    try {
      updaterFn(this._state)
    } catch (error) {
      console.error("[Store] Error in updater function:", error)
      throw error
    }

    // Persist changes to localStorage
    const { immediate = false, debounceDelay = 300 } = options

    if (immediate) {
      console.log("[Store] Saving immediately")
      saveData(this._state)
    } else {
      console.log("[Store] Debounced save scheduled")
      storageDebouncedSave(this._state, debounceDelay)
    }

    // Notify all subscribers of the state change
    this._notifyListeners()
  }

  /**
   * Subscribe to state changes
   * The listener function will be called whenever the state is updated
   * 
   * @param {Function} listener - Function to call on state changes
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    if (typeof listener !== "function") {
      throw new Error("[Store] Listener must be a function")
    }

    this._listeners.add(listener)
    console.log("[Store] Listener subscribed. Total listeners:", this._listeners.size)

    // Return unsubscribe function
    return () => {
      this._listeners.delete(listener)
      console.log("[Store] Listener unsubscribed. Total listeners:", this._listeners.size)
    }
  }

  /**
   * Notify all subscribers of state changes
   * @private
   */
  _notifyListeners() {
    console.log("[Store] Notifying", this._listeners.size, "listener(s)")
    this._listeners.forEach((listener) => {
      try {
        listener(this._state)
      } catch (error) {
        console.error("[Store] Error in listener:", error)
      }
    })
  }

  /**
   * Force an immediate save to localStorage
   * Useful for critical operations like before navigation
   */
  flush() {
    this._ensureInitialized()
    console.log("[Store] Flushing state to localStorage")
    saveData(this._state)
  }

  /**
   * Reload state from localStorage
   * Use with caution - this will overwrite any unsaved in-memory changes
   */
  reload() {
    console.log("[Store] Reloading state from localStorage")
    this._state = loadData()
    this._isInitialized = true
    this._notifyListeners()
  }

  /**
   * Get store statistics
   * @returns {Object} Store statistics
   */
  getStats() {
    this._ensureInitialized()
    return {
      initialized: this._isInitialized,
      listeners: this._listeners.size,
      characters: this._state.characters?.length || 0,
      games: this._state.games?.length || 0,
      worlds: this._state.worlds?.length || 0,
      version: this._state.version,
      lastModified: this._state.lastModified,
    }
  }
}

// Create and export a singleton instance
const store = new Store()

export default store

// Also export the Store class for testing purposes
export { Store }
