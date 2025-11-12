/**
 * Settings view
 */

import { loadData, saveData, exportData, getStorageInfo, importData } from "../utils/storage.js"
import { logout } from "../utils/auth.js"
import { navigateTo } from "../router.js"
import { fetchModels } from "../utils/openrouter.js"

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
            <input type="checkbox" id="reasoning-enabled-check">
            <span class="form-check-label">Enable reasoning</span>
          </label>
        </div>
        
        <div class="mb-2">
          <label class="form-label text-sm">Effort level</label>
          <select id="reasoning-effort-select">
            <option value="">Auto (model default)</option>
            <option value="minimal">Minimal</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        
        <div class="mb-2">
          <label class="form-label text-sm">Summary verbosity</label>
          <select id="reasoning-summary-select">
            <option value="">Auto (model default)</option>
            <option value="concise">Concise</option>
            <option value="detailed">Detailed</option>
          </select>
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
            <input type="checkbox" id="auto-save-check" ${data.settings.autoSave ? "checked" : ""}>
            <span class="form-check-label">Auto-save game state</span>
          </label>
        </div>
        <div class="mb-2">
          <label class="form-check">
            <input type="checkbox" id="dice-animation-check" ${data.settings.diceAnimation ? "checked" : ""}>
            <span class="form-check-label">Dice roll animations</span>
          </label>
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

  // Reasoning settings handlers
  setupReasoningSettingsHandlers(data)
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
      console.log("[Reasoning] Fetching fresh model list from OpenRouter...")
      
      // Fetch models to get the latest metadata
      const fetchedModels = await fetchModels()
      console.log("[Reasoning] Fetched", fetchedModels.length, "models from OpenRouter")
      
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

  console.log("[Reasoning] Final model check - ID:", model.id, "Name:", model.name, "supportsReasoning:", model.supportsReasoning)

  if (model.supportsReasoning) {
    console.log("[Reasoning] ✅ Model supports reasoning tokens - showing settings card")
    cardEl.style.display = "block"
  } else {
    console.log("[Reasoning] ❌ Model does not support reasoning tokens - hiding settings card")
    cardEl.style.display = "none"
  }

  // Load saved reasoning settings
  const rs = data.settings.reasoning || {}
  console.log("[Reasoning] Current saved settings:", rs)

  const enabledCheck = document.getElementById("reasoning-enabled-check")
  const effortSelect = document.getElementById("reasoning-effort-select")
  const summarySelect = document.getElementById("reasoning-summary-select")

  if (!enabledCheck || !effortSelect || !summarySelect) return

  enabledCheck.checked = !!rs.enabled
  effortSelect.value = rs.effort || ""
  summarySelect.value = rs.summary || ""
}

function setupReasoningSettingsHandlers(data) {
  const cardEl = document.getElementById("reasoning-settings-card")
  if (!cardEl) return

  const enabledCheck = document.getElementById("reasoning-enabled-check")
  const effortSelect = document.getElementById("reasoning-effort-select")
  const summarySelect = document.getElementById("reasoning-summary-select")

  if (!enabledCheck || !effortSelect || !summarySelect) return

  const persist = () => {
    const reasoning = {
      enabled: enabledCheck.checked
    }

    // Only include effort/summary if enabled and values are set
    if (enabledCheck.checked) {
      if (effortSelect.value) reasoning.effort = effortSelect.value
      if (summarySelect.value) reasoning.summary = summarySelect.value
    }

    // Always save the reasoning object (even if just { enabled: false })
    // This ensures we preserve the user's choice to disable reasoning
    data.settings.reasoning = reasoning
    
    console.log("[Reasoning] Saved settings:", reasoning)
    saveData(data)
  }

  enabledCheck.addEventListener("change", persist)
  effortSelect.addEventListener("change", persist)
  summarySelect.addEventListener("change", persist)
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
