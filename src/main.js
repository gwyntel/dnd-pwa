/**
 * D&D PWA - Main Entry Point
 * Phase 1: Foundation with basic UI shell and authentication
 */

import "./style.css"
import { initRouter, registerRoute } from "./router.js"
import { renderHome } from "./views/home.js"
import { renderSettings } from "./views/settings.js"
import { renderModels } from "./views/models.js"
import { renderCharacters, renderCharacterCreator } from "./views/characters.js"
import { renderCharacterTemplatesView } from "./views/characterTemplatesView.js"
import { renderGameList, renderGame } from "./views/game.js"
import { renderWorlds } from "./views/worlds.js"
import { startAuth, handleAuthCallback, setApiKey, isAuthenticated, autoLogin } from "./utils/auth.js"
import { getDefaultModelFromEnv } from "./utils/model-utils.js"
import { loadData, saveData } from "./utils/storage.js"

/**
 * Initialize the application
 */
function init() {
  console.log("D&D PWA - Initializing...")

  // Try auto-login from environment variable
  autoLogin()

  // Apply saved theme and set default model if provided
  const data = loadData()

  // Set default model from environment variable if not already set
  const envDefaultModel = getDefaultModelFromEnv()
  if (envDefaultModel && !data.settings.defaultNarrativeModel) {
    console.log("[v0] Setting default model from environment variable:", envDefaultModel)
    data.settings.defaultNarrativeModel = envDefaultModel
    saveData(data)
  }

  applyTheme(data.settings.theme)

  // Register routes
  registerRoute("/", handleHome)
  registerRoute("/settings", renderSettings)
  registerRoute("/models", renderModels)
  registerRoute("/worlds", renderWorlds)
  registerRoute("/characters", renderCharacters)
  registerRoute("/characters/templates", renderCharacterTemplatesView)
  registerRoute("/characters/new", handleNewCharacter)
  registerRoute("/characters/edit/:id", renderCharacterCreator)
  registerRoute("/game/new", renderGameList)
  registerRoute("/game/:id", renderGame)
  registerRoute("/auth/callback", handleAuthCallbackRoute)

  // Initialize router
  initRouter()

  console.log("D&D PWA - Ready!")
}

/**
 * Handle home route
 */
function handleHome() {
  renderHome()

  // Add event listeners for auth buttons (if not authenticated)
  if (!isAuthenticated()) {
    const authBtn = document.getElementById("auth-btn")
    const apiKeyBtn = document.getElementById("api-key-btn")
    const apiKeyInput = document.getElementById("api-key-input")

    if (authBtn) {
      authBtn.addEventListener("click", async () => {
        try {
          await startAuth()
        } catch (error) {
          console.error("Auth error:", error)
          alert("Failed to start authentication: " + error.message)
        }
      })
    }

    if (apiKeyBtn && apiKeyInput) {
      apiKeyBtn.addEventListener("click", () => {
        const apiKey = apiKeyInput.value.trim()
        if (!apiKey) {
          alert("Please enter an API key")
          return
        }

        if (!apiKey.startsWith("sk-or-")) {
          alert('Invalid API key format. OpenRouter keys start with "sk-or-"')
          return
        }

        setApiKey(apiKey)
        alert("API key saved! Reloading...")
        window.location.reload()
      })

      // Allow Enter key to submit
      apiKeyInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          apiKeyBtn.click()
        }
      })
    }
  }
}

/**
 * Handle OAuth callback route
 */
async function handleAuthCallbackRoute() {
  const app = document.getElementById("app")

  app.innerHTML = `
    <div class="container text-center" style="padding-top: 4rem;">
      <div class="spinner"></div>
      <p class="mt-3">Completing authentication...</p>
    </div>
  `

  try {
    await handleAuthCallback()
    app.innerHTML = `
      <div class="container text-center" style="padding-top: 4rem;">
        <h1>✓ Authentication Successful</h1>
        <p class="text-secondary mb-3">Redirecting to home...</p>
      </div>
    `

    setTimeout(() => {
      window.location.href = "/"
    }, 1500)
  } catch (error) {
    console.error("Auth callback error:", error)
    app.innerHTML = `
      <div class="container text-center" style="padding-top: 4rem;">
        <h1>Authentication Failed</h1>
        <p class="text-secondary mb-3">${error.message}</p>
        <a href="/" class="btn">Return Home</a>
      </div>
    `
  }
}

/**
 * Apply theme to document
 */
function applyTheme(theme) {
  const root = document.documentElement

  if (theme === "auto") {
    root.removeAttribute("data-theme")
  } else {
    root.setAttribute("data-theme", theme)
  }
}

/**
 * Handle new character route - shows creation options
 */
function handleNewCharacter(state) {
  const data = loadData()
  if (!data.settings.defaultNarrativeModel) {
    console.log("[v0] No default model set, redirecting to model selector")
    window.location.hash = "#/models"
    return
  }

  renderCharacterCreator(state)
}

// Start the app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init)
} else {
  init()
}
