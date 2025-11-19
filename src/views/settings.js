/**
 * Settings view
 */

import { loadData, saveData, exportData, getStorageInfo, importData } from "../utils/storage.js"
import { logout } from "../utils/auth.js"
import { navigateTo } from "../router.js"
import { getProvider, getCurrentProvider } from "../utils/model-utils.js"

export function renderSettings() {
  const app = document.getElementById("app")
  const data = loadData()
  const storageInfo = getStorageInfo()

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
        <h1 class="page-title">Settings</h1>
      </div>
      
      <div class="card mb-3">
        <h2>Theme</h2>
        <p class="text-secondary mb-2">Choose your preferred color scheme</p>
        <select id="theme-select">
          <option value="auto" ${data.settings.theme === "auto" ? "selected" : ""}>Auto (System)</option>
          <option value="light" ${data.settings.theme === "light" ? "selected" : ""}>Light</option>
          <option value="dark" ${data.settings.theme === "dark" ? "selected" : ""}>Dark</option>
          <option value="warm" ${data.settings.theme === "warm" ? "selected" : ""}>Warm</option>
          <option value="cool" ${data.settings.theme === "cool" ? "selected" : ""}>Cool</option>
          <option value="forest" ${data.settings.theme === "forest" ? "selected" : ""}>Forest</option>
          <option value="midnight" ${data.settings.theme === "midnight" ? "selected" : ""}>Midnight</option>
        </select>
      </div>
      
      <div class="card mb-3">
        <h2>API Provider</h2>
        <p class="text-secondary mb-2">Choose your AI model provider</p>
        <select id="provider-select">
          <option value="openrouter" ${data.settings.provider === "openrouter" ? "selected" : ""}>OpenRouter</option>
          <option value="openai" ${data.settings.provider === "openai" ? "selected" : ""}>OpenAI-Compatible</option>
          <option value="lmstudio" ${data.settings.provider === "lmstudio" ? "selected" : ""}>LM Studio (Local)</option>
        </select>
        
        <!-- OpenRouter config (API key handled by auth.js) -->
        <div id="provider-config-openrouter" class="mt-3" style="display: none;">
          <p class="text-xs text-secondary">
            OpenRouter API key is managed through the authentication system.
          </p>
        </div>
        
        <!-- OpenAI-Compatible config -->
        <div id="provider-config-openai" class="mt-3" style="display: none;">
          <div class="mb-2">
            <label class="form-label text-sm">Base URL</label>
            <input 
              type="text" 
              id="openai-base-url" 
              placeholder="https://api.openai.com/v1"
              value="${data.settings.providers?.openai?.baseUrl || "https://api.openai.com/v1"}"
            >
            <p class="text-xs text-secondary mt-1">
              API endpoint (e.g., https://api.openai.com/v1)
            </p>
          </div>
          <div class="mb-2">
            <label class="form-label text-sm">API Key</label>
            <input 
              type="password" 
              id="openai-api-key" 
              placeholder="sk-..."
              value="${data.settings.providers?.openai?.apiKey || ""}"
            >
            <p class="text-xs text-secondary mt-1">
              Your OpenAI-compatible API key
            </p>
          </div>
          <div class="mb-2">
            <label class="form-label text-sm">Context Length (tokens)</label>
            <input 
              type="number" 
              id="openai-context-length" 
              placeholder="8192"
              min="2048"
              max="200000"
              step="1024"
              value="${data.settings.providers?.openai?.contextLength || ""}"
            >
            <p class="text-xs text-secondary mt-1">
              Maximum context length for your model (e.g., 8192, 32768, 128000). Check your model's documentation.
            </p>
          </div>
          <div class="mb-2">
            <label class="form-check">
              <span class="form-check-label">Use backend proxy (bypasses CORS restrictions)</span>
              <input type="checkbox" id="openai-proxy-check" ${data.settings.useProxy ? "checked" : ""}>
            </label>
            <p class="text-xs text-secondary mt-1">
              Enable this if you encounter CORS errors. The proxy routes API requests through your Cloudflare Worker instead of directly from the browser.
            </p>
          </div>
          <button id="test-openai-btn" class="btn-secondary btn-sm mt-2">Test Connection</button>
        </div>
        
        <!-- LM Studio config -->
        <div id="provider-config-lmstudio" class="mt-3" style="display: none;">
          <div class="mb-2">
            <label class="form-label text-sm">Base URL</label>
            <input 
              type="text" 
              id="lmstudio-base-url" 
              placeholder="http://localhost:1234/v1"
              value="${data.settings.providers?.lmstudio?.baseUrl || "http://localhost:1234/v1"}"
            >
            <p class="text-xs text-secondary mt-1">
              LM Studio server URL (default: http://localhost:1234/v1)
            </p>
          </div>
          <div class="mb-2">
            <label class="form-label text-sm">Context Length (tokens)</label>
            <input 
              type="number" 
              id="lmstudio-context-length" 
              placeholder="8192"
              min="2048"
              max="200000"
              step="1024"
              value="${data.settings.providers?.lmstudio?.contextLength || ""}"
            >
            <p class="text-xs text-secondary mt-1">
              Maximum context length for your model (e.g., 8192, 32768, 128000). Check your model's documentation.
            </p>
          </div>
          <button id="test-lmstudio-btn" class="btn-secondary btn-sm mt-2">Test Connection</button>
          <div class="text-xs text-secondary mt-2" style="text-align: left;">
            <p class="mb-1"><strong>ℹ️ Before testing:</strong></p>
            <ol style="margin: 0 0 0.5rem 0; padding-left: 1.5rem;">
              <li>Make sure LM Studio is running with a model loaded</li>
              <li>Start the local server in LM Studio</li>
              <li>Enable CORS in LM Studio server settings</li>
            </ol>
          </div>
        </div>
      </div>
      
      <div class="card mb-3">
        <h2>Default Model</h2>
        <p class="text-secondary mb-2">Choose your default narrative model</p>
        <button id="select-model-btn" class="btn-secondary" style="width: 100%;">
          ${data.settings.defaultNarrativeModel || "Select Model"}
        </button>
      </div>
      
      <div class="card mb-3" id="reasoning-settings-card" style="display: none;">
        <h2>Reasoning Tokens</h2>
        <p class="text-secondary mb-2">
          Configure reasoning tokens for supported models. Reasoning tokens may improve quality but increase cost.
        </p>
        
        <div class="mb-2">
          <label class="form-check">
            <span class="form-check-label">Enable reasoning</span>
            <input type="checkbox" id="reasoning-enabled-check">
          </label>
        </div>
        
        <div class="mb-2" id="reasoning-effort-container" style="display: none;">
          <label class="form-label text-sm">Effort level</label>
          <select id="reasoning-effort-select">
            <option value="">Auto (model default)</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <p class="text-xs text-secondary mt-1">
            Controls how much reasoning the model performs (OpenAI, Grok models)
          </p>
        </div>
        
        <div class="mb-2" id="reasoning-max-tokens-container" style="display: none;">
          <label class="form-label text-sm">Max reasoning tokens</label>
          <input type="number" id="reasoning-max-tokens-input" min="1024" max="32000" step="1024" placeholder="Auto (model default)">
          <p class="text-xs text-secondary mt-1">
            Maximum tokens allocated for reasoning (Anthropic, Gemini, DeepSeek models)
          </p>
        </div>

        <div class="mb-2">
          <label class="form-check">
            <span class="form-check-label">
              Show 🧠 reasoning panel above the game input when available
            </span>
            <input type="checkbox" id="reasoning-display-check">
          </label>
        </div>
        
        <p class="text-xs text-secondary">
          These options are only applied when the selected model supports reasoning tokens via OpenRouter.
        </p>
      </div>
      
      <div class="card mb-3">
        <h2>Temperature</h2>
        <p class="text-secondary mb-2">Control randomness of AI responses (0 = focused, 2 = creative)</p>
        <div class="flex align-center gap-2">
          <input 
            type="range" 
            id="temperature-slider" 
            min="0" 
            max="2" 
            step="0.1" 
            value="${data.settings.temperature || 1.0}"
          >
          <span id="temperature-value" class="text-sm" style="min-width: 3rem; font-weight: 500;">${(
            data.settings.temperature || 1.0
          ).toFixed(1)}</span>
        </div>
      </div>
      
      <div class="card mb-3">
        <h2>Preferences</h2>
        <div class="mb-2">
          <label class="form-check">
            <span class="form-check-label">Auto-save game state</span>
            <input type="checkbox" id="auto-save-check" ${data.settings.autoSave ? "checked" : ""}>
          </label>
        </div>
        <div class="mb-2">
          <label class="form-check">
            <span class="form-check-label">Dice roll animations</span>
            <input type="checkbox" id="dice-animation-check" ${data.settings.diceAnimation ? "checked" : ""}>
          </label>
        </div>
        
        <div class="mb-2">
          <label class="form-label text-sm">Maximum NPC Relationships Tracked</label>
          <div class="flex align-center gap-2">
            <input 
              type="range" 
              id="max-relationships-slider" 
              min="10" 
              max="100" 
              step="10" 
              value="${data.settings.maxRelationshipsTracked || 50}"
            >
            <span id="max-relationships-value" class="text-sm" style="min-width: 3rem; font-weight: 500;">${data.settings.maxRelationshipsTracked || 50}</span>
          </div>
          <p class="text-xs text-secondary mt-1">
            Removes relationships at 0 value and older relationships when limit is reached
          </p>
        </div>
        
        <div class="mb-2">
          <label class="form-label text-sm">Maximum Locations Tracked</label>
          <div class="flex align-center gap-2">
            <input 
              type="range" 
              id="max-locations-slider" 
              min="5" 
              max="50" 
              step="5" 
              value="${data.settings.maxLocationsTracked || 10}"
            >
            <span id="max-locations-value" class="text-sm" style="min-width: 3rem; font-weight: 500;">${data.settings.maxLocationsTracked || 10}</span>
          </div>
          <p class="text-xs text-secondary mt-1">
            Keeps only the most recent locations in memory (older locations are automatically removed)
          </p>
        </div>
      </div>
      
      <div class="card mb-3">
        <h2>Data Management</h2>
        <p class="text-secondary mb-2">
          Storage used: ${storageInfo.kb} KB<br>
          Characters: ${storageInfo.characterCount}<br>
          Games: ${storageInfo.gameCount}
        </p>
        <div class="flex gap-2">
          <button id="export-btn" class="btn-secondary">Export Data</button>
          <button id="import-btn" class="btn-secondary">Import Data</button>
          <input type="file" id="import-file" accept=".json" class="hidden">
        </div>
      </div>
      
      <div class="card mb-3">
        <h2>Account</h2>
        <button id="logout-btn" class="btn-secondary">Logout</button>
      </div>
      
      <div class="card">
        <h2>About</h2>
        <p class="text-secondary">
          D&D PWA v1.0.0<br>
          A single-player text adventure powered by AI<br>
          <a href="https://github.com/gwyntel/dnd-pwa" target="_blank">GitHub</a>
        </p>
      </div>
    </div>
  `

  // Apply current theme
  applyTheme(data.settings.theme)

  // Initialize reasoning settings based on selected model
  initializeReasoningSettings(data).catch(console.error)

  // Event listeners
  document.getElementById("theme-select").addEventListener("change", (e) => {
    data.settings.theme = e.target.value
    saveData(data)
    applyTheme(e.target.value)
  })

  document.getElementById("temperature-slider").addEventListener("input", (e) => {
    const value = Number.parseFloat(e.target.value)
    document.getElementById("temperature-value").textContent = value.toFixed(1)
    data.settings.temperature = value
    saveData(data)
  })

  document.getElementById("auto-save-check").addEventListener("change", (e) => {
    data.settings.autoSave = e.target.checked
    saveData(data)
  })

  document.getElementById("dice-animation-check").addEventListener("change", (e) => {
    data.settings.diceAnimation = e.target.checked
    saveData(data)
  })

   document.getElementById("max-relationships-slider").addEventListener("input", (e) => {
    const value = Number.parseInt(e.target.value)
    document.getElementById("max-relationships-value").textContent = value
    data.settings.maxRelationshipsTracked = value
    saveData(data)
 })

  document.getElementById("max-locations-slider").addEventListener("input", (e) => {
    const value = Number.parseInt(e.target.value)
    document.getElementById("max-locations-value").textContent = value
    data.settings.maxLocationsTracked = value
    saveData(data)
  })

  document.getElementById("export-btn").addEventListener("click", () => {
    try {
      exportData(data)
      showMessage("Data exported successfully!", "success")
    } catch (error) {
      showMessage("Failed to export data: " + error.message, "error")
    }
  })

  document.getElementById("import-btn").addEventListener("click", () => {
    document.getElementById("import-file").click()
  })

  document.getElementById("import-file").addEventListener("change", async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const importedData = await importData(file)
      saveData(importedData)
      showMessage("Data imported successfully!", "success")
      setTimeout(() => {
        navigateTo("/")
      }, 1500)
    } catch (error) {
      showMessage("Failed to import data: " + error.message, "error")
    }
  })

  document.getElementById("logout-btn").addEventListener("click", () => {
    if (confirm("Are you sure you want to logout? Your games will be saved locally.")) {
      logout()
      navigateTo("/")
    }
  })

  document.getElementById("select-model-btn").addEventListener("click", () => {
    navigateTo("/models")
  })

  // Provider selection and configuration handlers
  setupProviderHandlers(data)

  // Reasoning settings handlers
  setupReasoningSettingsHandlers(data)
}

/**
 * Setup provider selection and configuration handlers
 */
function setupProviderHandlers(data) {
  const providerSelect = document.getElementById("provider-select")
  
  // Show/hide provider-specific configuration based on selection
  const updateProviderConfig = () => {
    const selectedProvider = providerSelect.value
    
    // Hide all provider configs
    document.getElementById("provider-config-openrouter").style.display = "none"
    document.getElementById("provider-config-openai").style.display = "none"
    document.getElementById("provider-config-lmstudio").style.display = "none"
    
    // Show the selected provider config
    const configElement = document.getElementById(`provider-config-${selectedProvider}`)
    if (configElement) {
      configElement.style.display = "block"
    }
  }
  
  // Initialize provider config display
  updateProviderConfig()
  
  // Handle provider selection change
  providerSelect.addEventListener("change", (e) => {
    const oldProvider = data.settings.provider
    const newProvider = e.target.value
    
    data.settings.provider = newProvider
    saveData(data)
    updateProviderConfig()
    
    // Clear selected model when switching providers
    if (oldProvider !== newProvider) {
      data.settings.defaultNarrativeModel = null
      saveData(data)
      document.getElementById("select-model-btn").textContent = "Select Model"
      showMessage(`Switched to ${newProvider}. Please select a model.`, "success")
    }
  })
  
  // OpenAI configuration handlers
  const openaiBaseUrl = document.getElementById("openai-base-url")
  const openaiApiKey = document.getElementById("openai-api-key")
  const openaiContextLength = document.getElementById("openai-context-length")
  const testOpenAIBtn = document.getElementById("test-openai-btn")
  
  if (openaiBaseUrl) {
    openaiBaseUrl.addEventListener("change", (e) => {
      if (!data.settings.providers) data.settings.providers = {}
      if (!data.settings.providers.openai) data.settings.providers.openai = {}
      data.settings.providers.openai.baseUrl = e.target.value
      saveData(data)
    })
  }
  
  if (openaiApiKey) {
    openaiApiKey.addEventListener("change", (e) => {
      if (!data.settings.providers) data.settings.providers = {}
      if (!data.settings.providers.openai) data.settings.providers.openai = {}
      data.settings.providers.openai.apiKey = e.target.value
      saveData(data)
    })
  }
  
  if (openaiContextLength) {
    openaiContextLength.addEventListener("change", (e) => {
      if (!data.settings.providers) data.settings.providers = {}
      if (!data.settings.providers.openai) data.settings.providers.openai = {}
      const value = e.target.value ? parseInt(e.target.value, 10) : null
      data.settings.providers.openai.contextLength = value
      saveData(data)
    })
  }
  
  // OpenAI proxy checkbox handler
  const openaiProxyCheck = document.getElementById("openai-proxy-check")
  if (openaiProxyCheck) {
    openaiProxyCheck.addEventListener("change", (e) => {
      data.settings.useProxy = e.target.checked
      saveData(data)
      const status = e.target.checked ? "enabled" : "disabled"
      showMessage(`Backend proxy ${status}`, "success")
    })
  }
  
  if (testOpenAIBtn) {
    testOpenAIBtn.addEventListener("click", async () => {
      testOpenAIBtn.disabled = true
      testOpenAIBtn.textContent = "Testing..."
      
      try {
        const provider = await getProvider()
        const success = await provider.testConnection()
        
        if (success) {
          showMessage("✓ OpenAI connection successful!", "success")
        } else {
          showMessage("✗ OpenAI connection failed. Check your settings.", "error")
        }
      } catch (error) {
        showMessage(`✗ Connection error: ${error.message}`, "error")
      } finally {
        testOpenAIBtn.disabled = false
        testOpenAIBtn.textContent = "Test Connection"
      }
    })
  }
  
  // LM Studio configuration handlers
  const lmstudioBaseUrl = document.getElementById("lmstudio-base-url")
  const lmstudioContextLength = document.getElementById("lmstudio-context-length")
  const testLMStudioBtn = document.getElementById("test-lmstudio-btn")
  
  if (lmstudioBaseUrl) {
    lmstudioBaseUrl.addEventListener("change", (e) => {
      if (!data.settings.providers) data.settings.providers = {}
      if (!data.settings.providers.lmstudio) data.settings.providers.lmstudio = {}
      data.settings.providers.lmstudio.baseUrl = e.target.value
      saveData(data)
    })
  }
  
  if (lmstudioContextLength) {
    lmstudioContextLength.addEventListener("change", (e) => {
      if (!data.settings.providers) data.settings.providers = {}
      if (!data.settings.providers.lmstudio) data.settings.providers.lmstudio = {}
      const value = e.target.value ? parseInt(e.target.value, 10) : null
      data.settings.providers.lmstudio.contextLength = value
      saveData(data)
    })
  }
  
  if (testLMStudioBtn) {
    testLMStudioBtn.addEventListener("click", async () => {
      testLMStudioBtn.disabled = true
      testLMStudioBtn.textContent = "Testing..."
      
      try {
        const provider = await getProvider()
        const success = await provider.testConnection()
        
        if (success) {
          showMessage("✓ LM Studio connection successful!", "success")
        } else {
          showMessage("✗ LM Studio connection failed. Is LM Studio running?", "error")
        }
      } catch (error) {
        showMessage(`✗ Connection error: ${error.message}`, "error")
      } finally {
        testLMStudioBtn.disabled = false
        testLMStudioBtn.textContent = "Test Connection"
      }
    })
  }
}

async function initializeReasoningSettings(data) {
  const cardEl = document.getElementById("reasoning-settings-card")
  if (!cardEl) return

  const selectedId = data.settings.defaultNarrativeModel

  console.log("[Reasoning] Initializing reasoning settings for model:", selectedId)

  if (!selectedId) {
    cardEl.style.display = "none"
    return
  }

  // First, try to find the model in cached data.models
  let model = null
  if (data.models && Array.isArray(data.models)) {
    console.log("[Reasoning] Checking cached models, count:", data.models.length)
    model = data.models.find((m) => m.id === selectedId)
    if (model) {
      console.log("[Reasoning] Found model in cache:", model.id, "supportsReasoning:", model.supportsReasoning)
    } else {
      console.log("[Reasoning] Model not found in cache")
    }
  } else {
    console.log("[Reasoning] No cached models available")
  }

  // If not found in cached models, fetch models to get the latest metadata
  if (!model) {
    try {
      console.log("[Reasoning] Fetching fresh model list from provider...")
      
      // Fetch models to get the latest metadata from current provider
      const provider = await getProvider()
      const fetchedModels = await provider.fetchModels()
      console.log("[Reasoning] Fetched", fetchedModels.length, "models from provider")
      
      // Update data with fetched models
      data.models = fetchedModels
      saveData(data)
      
      model = fetchedModels.find((m) => m.id === selectedId)
      if (model) {
        console.log("[Reasoning] Found model after fetch:", model.id, "supportsReasoning:", model.supportsReasoning)
      } else {
        console.log("[Reasoning] Model still not found after fetch")
      }
    } catch (error) {
      console.error("[Reasoning] Error fetching models for reasoning check:", error)
      cardEl.style.display = "none"
      return
    }
  }

  if (!model) {
    console.log("[Reasoning] Model not found in OpenRouter API")
    cardEl.style.display = "none"
    return
  }

  console.log("[Reasoning] Final model check - ID:", model.id, "Name:", model.name, "supportsReasoning:", model.supportsReasoning, "reasoningType:", model.reasoningType)

  if (model.supportsReasoning) {
    console.log("[Reasoning] ✅ Model supports reasoning tokens - showing settings card")
    cardEl.style.display = "block"
    
    // Show/hide appropriate controls based on reasoning type
    const effortContainer = document.getElementById("reasoning-effort-container")
    const maxTokensContainer = document.getElementById("reasoning-max-tokens-container")
    
    if (model.reasoningType === "effort") {
      console.log("[Reasoning] Model uses effort-based reasoning")
      effortContainer.style.display = "block"
      maxTokensContainer.style.display = "none"
    } else if (model.reasoningType === "max_tokens") {
      console.log("[Reasoning] Model uses max_tokens-based reasoning")
      effortContainer.style.display = "none"
      maxTokensContainer.style.display = "block"
    } else {
      console.log("[Reasoning] Unknown reasoning type, showing both options")
      effortContainer.style.display = "block"
      maxTokensContainer.style.display = "block"
    }
  } else {
    console.log("[Reasoning] ❌ Model does not support reasoning tokens - hiding settings card")
    cardEl.style.display = "none"
    return
  }

  // Load saved reasoning settings
  const rs = data.settings.reasoning || {}
  console.log("[Reasoning] Current saved settings:", rs)

  const enabledCheck = document.getElementById("reasoning-enabled-check")
  const effortSelect = document.getElementById("reasoning-effort-select")
  const maxTokensInput = document.getElementById("reasoning-max-tokens-input")
  const displayCheck = document.getElementById("reasoning-display-check")

  if (!enabledCheck || !effortSelect || !maxTokensInput || !displayCheck) return

  enabledCheck.checked = !!rs.enabled
  effortSelect.value = rs.effort || ""
  if (rs.maxTokens) {
    maxTokensInput.value = rs.maxTokens
  }
  displayCheck.checked = !!rs.displayPanel
}

function setupReasoningSettingsHandlers(data) {
  const cardEl = document.getElementById("reasoning-settings-card")
  if (!cardEl) return

  const enabledCheck = document.getElementById("reasoning-enabled-check")
  const effortSelect = document.getElementById("reasoning-effort-select")
  const maxTokensInput = document.getElementById("reasoning-max-tokens-input")
  const displayCheck = document.getElementById("reasoning-display-check")

  if (!enabledCheck || !effortSelect || !maxTokensInput || !displayCheck) return

  const persist = () => {
    const reasoning = {
      enabled: enabledCheck.checked,
      displayPanel: displayCheck.checked,
    }

    // Only include effort/maxTokens if enabled and values are set
    if (enabledCheck.checked) {
      if (effortSelect.value) reasoning.effort = effortSelect.value
      if (maxTokensInput.value) reasoning.maxTokens = Number(maxTokensInput.value)
    }

    // Always save the reasoning object (even if just { enabled: false })
    // This ensures we preserve the user's choice to disable reasoning
    data.settings.reasoning = reasoning
    
    console.log("[Reasoning] Saved settings:", reasoning)
    saveData(data)
  }

  enabledCheck.addEventListener("change", persist)
  effortSelect.addEventListener("change", persist)
  maxTokensInput.addEventListener("change", persist)
  displayCheck.addEventListener("change", persist)
}

function applyTheme(theme) {
  const root = document.documentElement

  if (theme === "auto") {
    root.removeAttribute("data-theme")
  } else {
    root.setAttribute("data-theme", theme)
  }
}

function showMessage(text, type) {
  const container = document.querySelector(".container")
  const message = document.createElement("div")
  message.className = `message message-${type}`
  message.textContent = text
  container.insertBefore(message, container.firstChild)

  setTimeout(() => {
    message.remove()
  }, 3000)
}
