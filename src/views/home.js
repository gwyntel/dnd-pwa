/**
 * Home view - Dashboard with game list
 * Includes unified onboarding wizard for first-time setup
 */

import { saveData } from "../utils/storage.js"
import { navigateTo } from "../router.js"
import { isAuthenticated, startAuth, setApiKey } from "../utils/auth.js"
import { fetchModels } from "../utils/ai-provider.js"
import { detectCorsIssue, getCorsGuidance } from "../utils/cors-detector.js"
import { isProxyEnabled } from "../utils/proxy.js"
import store from "../state/store.js"

// Wizard state - tracks setup progress
let setupStep = 1 // 1: provider, 2: credentials (merged into 1), 3: model
let allModels = []
let filteredModels = []
let searchQuery = ""
let currentFilter = "all"
let currentSort = "name"

export function renderHome() {
  const app = document.getElementById("app")
  const data = store.get()

  // Check if first-time setup is needed
  const selectedProvider = data.settings?.provider || "openrouter"
  const hasModel = !!data.settings?.defaultNarrativeModel
  const isAuth = selectedProvider === "lmstudio" || isAuthenticated()

  // First-time user or user needs to complete setup
  if (!isAuth) {
    // Not authenticated - show provider/credentials step
    setupStep = 1
    app.innerHTML = renderSetupWizard(1)
    setupWizardListeners()
    return
  }

  // Authenticated but no model selected and setupComplete flag not set
  // This means they just finished auth and need to pick a model
  if (!hasModel && !data.settings?.setupComplete) {
    setupStep = 2
    renderModelStep()
    return
  }

  // Normal authenticated home view
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
      
      ${!data.games || data.games.length === 0 ? renderEmptyState() : renderGameList(data.games, data.characters)}
    </div>
  `

  // Event listeners using event delegation to prevent duplicate handlers
  const appContainer = document.getElementById("app")

  // Remove any existing delegated listener before adding a new one
  if (appContainer._homeClickHandler) {
    appContainer.removeEventListener("click", appContainer._homeClickHandler)
  }

  appContainer._homeClickHandler = (e) => {
    // New game button
    if (e.target.closest("#new-game-btn")) {
      navigateTo("/game/new")
      return
    }

    // Delete button
    const deleteBtn = e.target.closest(".btn-delete-game")
    if (deleteBtn) {
      e.stopPropagation()
      const gameId = deleteBtn.dataset.gameId
      deleteGame(gameId)
      return
    }

    // Game card click (but not delete button)
    const gameCard = e.target.closest(".game-card")
    if (gameCard) {
      if (!gameCard.closest(".btn-delete-game")) {
        const gameId = gameCard.dataset.gameId
        navigateTo(`/game/${gameId}`)
      }
    }
  }

  appContainer.addEventListener("click", appContainer._homeClickHandler)
}

// ============================================
// Setup Wizard Functions
// ============================================

function renderStepIndicator(currentStep) {
  const steps = [
    { num: 1, label: 'Connect' },
    { num: 2, label: 'Model' }
  ]
  return `
    <div class="setup-steps">
      ${steps.map((step, i) => `
        <div class="step ${step.num <= currentStep ? 'active' : ''} ${step.num === currentStep ? 'current' : ''}">
          <span class="step-number">${step.num}</span>
          <span class="step-label">${step.label}</span>
        </div>
        ${i < steps.length - 1 ? '<div class="step-divider">→</div>' : ''}
      `).join('')}
    </div>
  `
}

function renderSetupWizard(step) {
  const data = store.get()
  const currentProvider = data.settings?.provider || "openrouter"

  return `
    <div class="container text-center mt-4">
      <h1>Welcome to D&D PWA</h1>
      <p class="text-secondary mb-4">Single-player text adventures powered by AI</p>
      
      ${renderStepIndicator(step)}
      
      <div class="card card-center mt-3">
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
        <button id="api-key-btn" class="btn-secondary btn-block">Continue →</button>
      </div>
      
      <div class="text-secondary text-xs mt-3" style="text-align: left;">
        <p><strong>💡 Tip:</strong> Free models are available, but require a one-time $10 USD credit purchase to prevent abuse. After that, you can use free models at no additional cost!</p>
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
      
      <button id="openai-save-btn" class="btn btn-block">Continue →</button>
    `
  } else if (provider === "lmstudio") {
    return `
      <p class="text-secondary text-sm mb-2">Run AI models locally on your computer</p>
      <div class="mb-2">
        <label class="form-label text-left">LM Studio Server URL</label>
        <input type="text" id="lmstudio-url" placeholder="http://localhost:1234/v1" value="http://localhost:1234/v1" class="mb-2">
      </div>
      <div class="mb-2">
        <label class="form-label text-left">Context Length (tokens)</label>
        <input type="number" id="lmstudio-context-length" placeholder="8192" min="2048" max="200000" step="1024" class="mb-2">
        <p class="text-xs text-secondary" style="margin-top: 0.25rem;">Optional: Set your model's context length (e.g., 8192, 32768, 128000)</p>
      </div>
      <button id="lmstudio-save-btn" class="btn btn-block">Continue →</button>
      <div class="text-secondary text-xs mt-2" style="text-align: left;">
        <p class="mb-1"><strong>ℹ️ Before continuing:</strong></p>
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


function setupWizardListeners() {
  const data = store.get()

  // Provider selection change
  document.getElementById("provider-select")?.addEventListener("change", (e) => {
    const provider = e.target.value
    const configDiv = document.getElementById("provider-config")
    if (configDiv) {
      configDiv.innerHTML = renderProviderConfig(provider)
      setupWizardListeners() // Re-attach listeners for new config
    }
  })

  // OpenRouter OAuth
  document.getElementById("auth-btn")?.addEventListener("click", async () => {
    try {
      await startAuth()
      // OAuth will redirect, then come back - renderHome will transition to model step
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

    // Transition to model step (not renderHome!)
    renderModelStep()
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
    if (!data.settings.providers) data.settings.providers = {}
    if (!data.settings.providers.openai) data.settings.providers.openai = {}
    data.settings.providers.openai.baseUrl = baseUrl
    data.settings.providers.openai.apiKey = apiKey
    saveData(data)

    // Set as authenticated
    setApiKey(apiKey)

    // Transition to model step
    renderModelStep()
  })

  // LM Studio save
  document.getElementById("lmstudio-save-btn")?.addEventListener("click", () => {
    const baseUrl = document.getElementById("lmstudio-url")?.value.trim()
    const contextLength = document.getElementById("lmstudio-context-length")?.value.trim()

    if (!baseUrl) {
      alert("Please enter LM Studio server URL")
      return
    }

    // Save configuration
    data.settings = data.settings || {}
    data.settings.provider = "lmstudio"
    data.settings.lmstudioBaseUrl = baseUrl

    // Save context length if provided
    if (!data.settings.providers) data.settings.providers = {}
    if (!data.settings.providers.lmstudio) data.settings.providers.lmstudio = {}
    data.settings.providers.lmstudio.baseUrl = baseUrl
    data.settings.providers.lmstudio.contextLength = contextLength ? parseInt(contextLength, 10) : null

    saveData(data)

    // Transition to model step
    renderModelStep()
  })
}

// ============================================
// Model Selection Step
// ============================================

async function renderModelStep() {
  const app = document.getElementById("app")
  const data = store.get()
  const provider = data.settings?.provider || "openrouter"

  // Show loading state
  app.innerHTML = `
    <div class="container text-center mt-4">
      <h1>Welcome to D&D PWA</h1>
      <p class="text-secondary mb-4">Single-player text adventures powered by AI</p>
      
      ${renderStepIndicator(2)}
      
      <div class="card card-center mt-3">
        <h2>Select AI Model</h2>
        <div class="text-center py-4">
          <div class="spinner"></div>
          <p class="text-secondary mt-3">Loading available models...</p>
        </div>
      </div>
    </div>
  `

  try {
    // Fetch models from provider
    allModels = await fetchModels()
    filteredModels = [...allModels]

    // Sort by name by default
    applyFiltersAndSort()

    // Render model selector
    renderModelSelector()
  } catch (error) {
    console.error("Error loading models:", error)

    // Detect CORS issues and provide guidance
    const corsDetection = detectCorsIssue(error)
    const proxyEnabled = isProxyEnabled()

    let errorMessage = error.message
    let errorGuidance = ''

    if (corsDetection.isCors) {
      errorMessage = corsDetection.message
      errorGuidance = getCorsGuidance(proxyEnabled)
    }

    app.innerHTML = `
      <div class="container text-center mt-4">
        <h1>Welcome to D&D PWA</h1>
        <p class="text-secondary mb-4">Single-player text adventures powered by AI</p>
        
        ${renderStepIndicator(2)}
        
        <div class="card card-center mt-3">
          <h2>Select AI Model</h2>
          <p class="text-error mb-2">${errorMessage}</p>
          
          ${corsDetection.isCors ? `
            <div class="text-secondary text-sm mb-3" style="text-align: left; padding: 0.75rem; background-color: var(--bg-secondary); border-left: 3px solid var(--warning-color); border-radius: 4px;">
              <p class="mb-2"><strong>💡 CORS Issue Detected</strong></p>
              <p class="mb-2">${errorGuidance}</p>
              ${!proxyEnabled ? `
                <p class="mb-1"><strong>How to fix:</strong></p>
                <ol style="margin: 0; padding-left: 1.5rem; font-size: 0.85rem;">
                  <li>Skip model selection for now</li>
                  <li>Go to Settings after setup</li>
                  <li>Enable "Use backend proxy"</li>
                  <li>Return to model selection</li>
                </ol>
              ` : `
                <p><strong>Note:</strong> Proxy is enabled but still failing. Check your Cloudflare Worker configuration.</p>
              `}
            </div>
          ` : ''}
          
          ${provider === "openai" || provider === "lmstudio" ? `
            <div class="mb-3">
              <p class="text-secondary text-sm mb-2">You can enter a model ID manually:</p>
              <input type="text" id="custom-model-input" placeholder="e.g., gpt-4o, deepseek-chat, llama-3.1-8b" class="mb-2">
              <button id="custom-model-btn" class="btn btn-block">Use This Model</button>
            </div>
          ` : ''}
          
          ${!corsDetection.isCors ? `
            <button id="retry-models-btn" class="btn-secondary btn-block">Retry Loading</button>
          ` : ''}
          <button id="skip-model-btn" class="btn btn-block mt-2">Skip and Set Model Later</button>
        </div>
      </div>
    `

    setupModelErrorListeners()
  }
}

function renderModelSelector() {
  const app = document.getElementById("app")
  const data = store.get()
  const provider = data.settings?.provider || "openrouter"
  const currentModel = data.settings?.defaultNarrativeModel

  // Get unique providers for filter (only relevant for OpenRouter)
  const providers = [...new Set(allModels.map((m) => m.provider || 'Unknown'))].sort()

  app.innerHTML = `
    <div class="container text-center mt-4">
      <h1>Welcome to D&D PWA</h1>
      <p class="text-secondary mb-4">Single-player text adventures powered by AI</p>
      
      ${renderStepIndicator(2)}
      
      <div class="card mt-3" style="text-align: left;">
        <h2 style="text-align: center;">Select AI Model</h2>
        
        ${provider === "openrouter" ? `
          <p class="text-center text-secondary text-sm mb-3">
            <strong>Stuck?</strong> Check the 
            <a href="https://openrouter.ai/rankings?category=roleplay#categories" target="_blank" rel="noopener noreferrer">
              Roleplay Rankings
            </a> for best models!
          </p>
        ` : ''}
        
        <div class="mb-2">
          <input 
            type="text" 
            id="model-search-input" 
            placeholder="Search models..." 
            value="${searchQuery}"
          >
        </div>
        
        <div class="flex gap-2 mb-2 flex-wrap">
          ${provider === "openrouter" && providers.length > 1 ? `
            <select id="provider-filter" class="provider-filter">
              <option value="all">All Providers</option>
              ${providers.map((p) => `<option value="${p}" ${currentFilter === p ? "selected" : ""}>${p}</option>`).join("")}
            </select>
          ` : ''}
          
          <select id="sort-select" class="sort-select">
            <option value="name" ${currentSort === "name" ? "selected" : ""}>Sort by Name</option>
            ${provider === "openrouter" ? `
              <option value="price-low" ${currentSort === "price-low" ? "selected" : ""}>Price: Low to High</option>
              <option value="price-high" ${currentSort === "price-high" ? "selected" : ""}>Price: High to Low</option>
            ` : ''}
            <option value="context" ${currentSort === "context" ? "selected" : ""}>Context Length</option>
          </select>
        </div>
        
        <p class="text-secondary text-sm mb-2">
          Showing ${filteredModels.length} of ${allModels.length} models
        </p>
        
        <div id="models-list" class="models-list-compact">
          ${renderModelCards(currentModel)}
        </div>
        
        ${provider === "openai" || provider === "lmstudio" ? `
          <div class="mt-3 pt-3" style="border-top: 1px solid var(--border-color);">
            <p class="text-secondary text-sm mb-2">Or enter a custom model ID:</p>
            <div class="flex gap-2">
              <input type="text" id="custom-model-input" placeholder="e.g., gpt-4o, llama-3.1-8b" style="flex: 1;">
              <button id="custom-model-btn" class="btn">Use</button>
            </div>
          </div>
        ` : ''}
      </div>
      
      <button id="skip-model-btn" class="btn-secondary mt-3">Skip for Now</button>
    </div>
  `

  setupModelListeners()
}

function renderModelCards(currentModel) {
  if (filteredModels.length === 0) {
    return `
      <div class="text-center py-3">
        <p class="text-secondary">No models found matching your search.</p>
      </div>
    `
  }

  const data = store.get()
  const provider = data.settings?.provider || "openrouter"

  return filteredModels.slice(0, 50).map((model) => {
    const isSelected = model.id === currentModel
    const hasReasoning = model.supportsReasoning
    const supportsStructured = Array.isArray(model.supportedParameters) && model.supportedParameters.includes("structured_outputs")

    // Pricing info (OpenRouter only)
    let pricingInfo = ''
    if (provider === "openrouter" && model.pricing) {
      const promptPrice = Number.parseFloat(model.pricing.prompt) * 1000000
      const completionPrice = Number.parseFloat(model.pricing.completion) * 1000000
      pricingInfo = `$${promptPrice.toFixed(2)}/$${completionPrice.toFixed(2)} per 1M`
    }

    return `
      <div class="model-card-compact ${isSelected ? 'selected' : ''}" data-model-id="${model.id}">
        <div class="model-card-header">
          <strong>${escapeHtml(model.name || model.id)}</strong>
          ${isSelected ? '<span class="badge-selected">✓</span>' : ''}
        </div>
        <div class="model-card-meta">
          <span>${model.contextLength ? formatNumber(model.contextLength) + ' ctx' : ''}</span>
          ${pricingInfo ? `<span>${pricingInfo}</span>` : ''}
          ${supportsStructured ? '<span title="Supports structured outputs">📋</span>' : ''}
          ${hasReasoning ? '<span title="Reasoning model">🧠</span>' : ''}
        </div>
      </div>
    `
  }).join("")
}

function applyFiltersAndSort() {
  // Start with all models
  filteredModels = [...allModels]

  // Apply search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase()
    filteredModels = filteredModels.filter(
      (model) =>
        (model.name || '').toLowerCase().includes(query) ||
        model.id.toLowerCase().includes(query) ||
        (model.provider || '').toLowerCase().includes(query),
    )
  }

  // Apply provider filter
  if (currentFilter !== "all") {
    filteredModels = filteredModels.filter((model) => model.provider === currentFilter)
  }

  // Apply sorting
  switch (currentSort) {
    case "name":
      filteredModels.sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id))
      break
    case "price-low":
      filteredModels.sort((a, b) => {
        const aPrice = Number.parseFloat(a.pricing?.prompt || 0) + Number.parseFloat(a.pricing?.completion || 0)
        const bPrice = Number.parseFloat(b.pricing?.prompt || 0) + Number.parseFloat(b.pricing?.completion || 0)
        return aPrice - bPrice
      })
      break
    case "price-high":
      filteredModels.sort((a, b) => {
        const aPrice = Number.parseFloat(a.pricing?.prompt || 0) + Number.parseFloat(a.pricing?.completion || 0)
        const bPrice = Number.parseFloat(b.pricing?.prompt || 0) + Number.parseFloat(b.pricing?.completion || 0)
        return bPrice - aPrice
      })
      break
    case "context":
      filteredModels.sort((a, b) => (b.contextLength || 0) - (a.contextLength || 0))
      break
  }
}

function setupModelListeners() {
  const data = store.get()

  // Search input
  document.getElementById("model-search-input")?.addEventListener("input", (e) => {
    searchQuery = e.target.value
    applyFiltersAndSort()
    updateModelsList()
  })

  // Provider filter (OpenRouter)
  document.getElementById("provider-filter")?.addEventListener("change", (e) => {
    currentFilter = e.target.value
    applyFiltersAndSort()
    updateModelsList()
  })

  // Sort select
  document.getElementById("sort-select")?.addEventListener("change", (e) => {
    currentSort = e.target.value
    applyFiltersAndSort()
    updateModelsList()
  })

  // Model card clicks
  attachModelCardListeners()

  // Custom model input
  document.getElementById("custom-model-btn")?.addEventListener("click", () => {
    const customModel = document.getElementById("custom-model-input")?.value.trim()
    if (customModel) {
      selectModel(customModel)
    } else {
      alert("Please enter a model ID")
    }
  })

  // Skip button
  document.getElementById("skip-model-btn")?.addEventListener("click", () => {
    // Mark setup as complete even without model
    store.update(state => {
      state.settings.setupComplete = true
    })
    renderHome()
  })
}

function attachModelCardListeners() {
  document.querySelectorAll(".model-card-compact").forEach((card) => {
    card.addEventListener("click", () => {
      const modelId = card.dataset.modelId
      selectModel(modelId)
    })
  })
}

function updateModelsList() {
  const data = store.get()
  const currentModel = data.settings?.defaultNarrativeModel

  const listContainer = document.getElementById("models-list")
  if (listContainer) {
    listContainer.innerHTML = renderModelCards(currentModel)
    attachModelCardListeners()
  }

  // Update count
  const countEl = document.querySelector(".text-secondary.text-sm.mb-2")
  if (countEl) {
    countEl.textContent = `Showing ${filteredModels.length} of ${allModels.length} models`
  }
}

function selectModel(modelId) {
  // Save model and mark setup complete
  store.update(state => {
    state.settings.defaultNarrativeModel = modelId
    state.settings.setupComplete = true
    // Also persist models for other views
    state.models = allModels
  })

  // Show success and redirect to home
  const app = document.getElementById("app")
  app.innerHTML = `
    <div class="container text-center mt-4">
      <h1>🎉 All Set!</h1>
      <p class="text-secondary mb-3">Model selected: <strong>${modelId}</strong></p>
      <p class="text-secondary">Redirecting to your adventures...</p>
    </div>
  `

  setTimeout(() => {
    renderHome()
  }, 1500)
}

function setupModelErrorListeners() {
  document.getElementById("retry-models-btn")?.addEventListener("click", () => {
    renderModelStep()
  })

  document.getElementById("custom-model-btn")?.addEventListener("click", () => {
    const customModel = document.getElementById("custom-model-input")?.value.trim()
    if (customModel) {
      selectModel(customModel)
    } else {
      alert("Please enter a model ID")
    }
  })

  document.getElementById("skip-model-btn")?.addEventListener("click", () => {
    store.update(state => {
      state.settings.setupComplete = true
    })
    renderHome()
  })
}

// ============================================
// Utility Functions
// ============================================

function escapeHtml(text) {
  if (!text) return ''
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

function formatNumber(num) {
  if (!num) return ''
  return num.toLocaleString()
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
            <button class="btn-icon btn-delete-game" data-game-id="${game.id}" title="Delete">
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
            ${game.currentLocation
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

async function deleteGame(gameId) {
  if (!confirm("Are you sure you want to delete this adventure? This cannot be undone.")) {
    return
  }

  await store.update(state => {
    state.games = state.games.filter((g) => g.id !== gameId)
  }, { immediate: true })

  // Re-render
  renderHome()
}
