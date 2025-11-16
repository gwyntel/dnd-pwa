/**
 * Home view - Dashboard with game list
 */

import { loadData, saveData } from "../utils/storage.js"
import { navigateTo } from "../router.js"
import { isAuthenticated, startAuth, setApiKey } from "../utils/auth.js"

export function renderHome() {
  const app = document.getElementById("app")
  const data = loadData()

  // Check authentication (provider-aware)
  const selectedProvider = data.settings?.provider || "openrouter"
  
  // LM Studio doesn't require authentication
  if (selectedProvider !== "lmstudio" && !isAuthenticated()) {
    app.innerHTML = renderAuthPrompt()
    setupAuthEventListeners()
    return
  }

  app.innerHTML = `
    <nav>
      <div class="container">
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/characters">Characters</a></li>
          <li><a href="/worlds">Worlds</a></li>
          <li><a href="/settings">Settings</a></li>
        </ul>
      </div>
    </nav>
    
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">Your Adventures</h1>
        <button id="new-game-btn" class="btn">+ New Game</button>
      </div>
      
      ${data.games.length === 0 ? renderEmptyState() : renderGameList(data.games, data.characters)}
    </div>
  `

  // Event listeners
  document.getElementById("new-game-btn")?.addEventListener("click", () => {
    navigateTo("/game/new")
  })

  // Game card click handlers
  document.querySelectorAll(".game-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (!e.target.closest(".delete-btn")) {
        const gameId = card.dataset.gameId
        navigateTo(`/game/${gameId}`)
      }
    })
  })

  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation()
      const gameId = btn.dataset.gameId
      deleteGame(gameId)
    })
  })
}

function renderAuthPrompt() {
  const data = loadData()
  const currentProvider = data.settings?.provider || "openrouter"
  
  return `
    <div class="container text-center mt-4">
      <h1>Welcome to D&D PWA</h1>
      <p class="text-secondary mb-4">Single-player text adventures powered by AI</p>
      
      <div class="card card-center">
        <h2>Choose Your AI Provider</h2>
        <p class="text-secondary mb-3">Select how you want to run the AI for your adventures</p>
        
        <div class="mb-3">
          <label class="form-label">Provider</label>
          <select id="provider-select" class="mb-2">
            <option value="openrouter" ${currentProvider === "openrouter" ? "selected" : ""}>OpenRouter (Cloud)</option>
            <option value="openai" ${currentProvider === "openai" ? "selected" : ""}>OpenAI-compatible API</option>
            <option value="lmstudio" ${currentProvider === "lmstudio" ? "selected" : ""}>LM Studio (Local)</option>
          </select>
        </div>
        
        <div id="provider-config">
          ${renderProviderConfig(currentProvider)}
        </div>
      </div>
      
      <div class="mt-4 text-secondary text-sm">
        <p>New to D&D? No problem! This app is beginner-friendly.</p>
        <p>The AI will guide you through the rules as you play.</p>
      </div>
    </div>
  `
}

function renderProviderConfig(provider) {
  if (provider === "openrouter") {
    return `
      <p class="text-secondary text-sm mb-2">Connect with OpenRouter to access hundreds of AI models</p>
      <button id="auth-btn" class="btn btn-block mb-2">Connect with OpenRouter OAuth</button>
      
      <div class="mt-3">
        <p class="text-secondary text-sm mb-1">Or enter your API key directly:</p>
        <input type="password" id="api-key-input" placeholder="sk-or-..." class="mb-2">
        <button id="api-key-btn" class="btn-secondary btn-block">Use API Key</button>
      </div>
    `
  } else if (provider === "openai") {
    return `
      <p class="text-secondary text-sm mb-2">Use any OpenAI-compatible API endpoint</p>
      
      <div class="mb-2">
        <label class="form-label text-left">API Base URL</label>
        <input type="text" id="openai-base-url" placeholder="https://api.openai.com/v1" class="mb-2">
      </div>
      
      <div class="mb-2">
        <label class="form-label text-left">API Key</label>
        <input type="password" id="openai-api-key" placeholder="sk-..." class="mb-2">
      </div>
      
      <button id="openai-save-btn" class="btn btn-block">Save and Continue</button>
    `
  } else if (provider === "lmstudio") {
    return `
      <p class="text-secondary text-sm mb-2">Run AI models locally on your computer</p>
      <div class="mb-2">
        <label class="form-label text-left">LM Studio Server URL</label>
        <input type="text" id="lmstudio-url" placeholder="http://localhost:1234/v1" value="http://localhost:1234/v1" class="mb-2">
      </div>
      <button id="lmstudio-save-btn" class="btn btn-block">Save and Continue</button>
      <div class="text-secondary text-xs mt-2" style="text-align: left;">
        <p class="mb-1"><strong>ℹ️ Before testing:</strong></p>
        <ol style="margin: 0; padding-left: 1.5rem;">
          <li>Make sure LM Studio is running with a model loaded</li>
          <li>Start the local server in LM Studio</li>
          <li>Enable CORS in LM Studio server settings</li>
        </ol>
      </div>
    `
  }
  
  return ""
}

function setupAuthEventListeners() {
  const data = loadData()
  
  // Provider selection change
  document.getElementById("provider-select")?.addEventListener("change", (e) => {
    const provider = e.target.value
    const configDiv = document.getElementById("provider-config")
    if (configDiv) {
      configDiv.innerHTML = renderProviderConfig(provider)
      setupAuthEventListeners() // Re-attach listeners for new config
    }
  })
  
  // OpenRouter OAuth
  document.getElementById("auth-btn")?.addEventListener("click", async () => {
    try {
      await startAuth()
    } catch (error) {
      alert("Authentication failed: " + error.message)
    }
  })
  
  // OpenRouter API key
  document.getElementById("api-key-btn")?.addEventListener("click", () => {
    const apiKeyInput = document.getElementById("api-key-input")
    const apiKey = apiKeyInput?.value.trim()
    
    if (!apiKey) {
      alert("Please enter an API key")
      return
    }
    
    if (!apiKey.startsWith("sk-or-")) {
      alert("Invalid OpenRouter API key format. Should start with 'sk-or-'")
      return
    }
    
    // Save provider selection
    data.settings = data.settings || {}
    data.settings.provider = "openrouter"
    saveData(data)
    
    // Set API key
    setApiKey(apiKey)
    
    // Reload page
    renderHome()
  })
  
  // OpenAI-compatible save
  document.getElementById("openai-save-btn")?.addEventListener("click", () => {
    const baseUrl = document.getElementById("openai-base-url")?.value.trim()
    const apiKey = document.getElementById("openai-api-key")?.value.trim()
    
    if (!baseUrl || !apiKey) {
      alert("Please enter both base URL and API key")
      return
    }
    
    // Save configuration
    data.settings = data.settings || {}
    data.settings.provider = "openai"
    data.settings.openaiBaseUrl = baseUrl
    data.settings.openaiApiKey = apiKey
    saveData(data)
    
    // Set as authenticated (using generic auth for OpenAI)
    setApiKey(apiKey)
    
    // Reload page
    renderHome()
  })
  
  // LM Studio save
  document.getElementById("lmstudio-save-btn")?.addEventListener("click", () => {
    const baseUrl = document.getElementById("lmstudio-url")?.value.trim()
    
    if (!baseUrl) {
      alert("Please enter LM Studio server URL")
      return
    }
    
    // Save configuration
    data.settings = data.settings || {}
    data.settings.provider = "lmstudio"
    data.settings.lmstudioBaseUrl = baseUrl
    saveData(data)
    
    // LM Studio doesn't need authentication, just reload
    renderHome()
  })
}

function renderEmptyState() {
  return `
    <div class="card text-center card-padded-xl">
      <h2>No Adventures Yet</h2>
      <p class="text-secondary mb-3">Create your first character and start a new game!</p>
      <div class="flex gap-2 justify-center">
        <a href="/characters/new" class="btn">Create Character</a>
        <a href="/game/new" class="btn-secondary">Quick Start</a>
      </div>
    </div>
  `
}

function renderGameList(games, characters) {
  const sortedGames = [...games].sort((a, b) => new Date(b.lastPlayedAt) - new Date(a.lastPlayedAt))

  return `
    <div class="grid grid-2">
      ${sortedGames
        .map((game) => {
          const character = characters.find((c) => c.id === game.characterId)
          const lastPlayed = new Date(game.lastPlayedAt)
          const now = new Date()
          const diffMs = now - lastPlayed
          const diffMins = Math.floor(diffMs / 60000)
          const diffHours = Math.floor(diffMs / 3600000)
          const diffDays = Math.floor(diffMs / 86400000)

          let timeAgo
          if (diffMins < 1) timeAgo = "Just now"
          else if (diffMins < 60) timeAgo = `${diffMins}m ago`
          else if (diffHours < 24) timeAgo = `${diffHours}h ago`
          else timeAgo = `${diffDays}d ago`

          return `
          <div class="card game-card card-clickable" data-game-id="${game.id}">
            <button class="btn-icon delete-btn" data-game-id="${game.id}" title="Delete">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
            <h3>${game.title}</h3>
            <p class="text-secondary">${character?.name || "Unknown"} - Level ${character?.level || 1} ${character?.class || ""}</p>
            <div class="card-meta-row">
              <span class="meta-label">
                HP: ${game.currentHP}/${character?.maxHP || 0}
              </span>
              <span class="meta-label">
                ${timeAgo}
              </span>
            </div>
            ${
              game.currentLocation
                ? `
              <p class="text-secondary mt-2 text-sm">
                📍 ${game.currentLocation}
              </p>
            `
                : ""
            }
          </div>
        `
        })
        .join("")}
    </div>
  `
}

function deleteGame(gameId) {
  if (!confirm("Are you sure you want to delete this adventure? This cannot be undone.")) {
    return
  }

  const data = loadData()
  data.games = data.games.filter((g) => g.id !== gameId)
  saveData(data)

  // Re-render
  renderHome()
}
