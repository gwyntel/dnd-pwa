/**
 * Settings view
 */

import { loadData, saveData, exportData, getStorageInfo, importData } from "../utils/storage.js"
import { logout } from "../utils/auth.js"
import { navigateTo } from "../router.js"

export function renderSettings() {
  const app = document.getElementById("app")
  const data = loadData()
  const storageInfo = getStorageInfo()
  
  // Get current model's max completion tokens
  const currentModel = (data.models || []).find(m => m.id === data.settings.defaultNarrativeModel)
  const maxTokensLimit = currentModel?.maxCompletionTokens || 128000

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
        <button id="select-model-btn" class="btn-secondary">
          ${data.settings.defaultNarrativeModel || "Select Model"}
        </button>
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
        <h2>Max Tokens</h2>
        <p class="text-secondary mb-2">Maximum number of tokens to generate (leave blank for model default)</p>
        <input 
          type="number" 
          id="max-tokens-input" 
          min="1" 
          max="${maxTokensLimit}" 
          placeholder="Model default"
          value="${data.settings.maxTokens || ""}"
        >
        <p class="text-secondary text-xs mt-1">
          ${currentModel ? `Model limit: ${maxTokensLimit.toLocaleString()} tokens. ` : ""}Higher values allow longer responses but may cost more.
        </p>
      </div>
      
      ${currentModel?.supportsReasoning ? `
      <div class="card mb-3" id="reasoning-settings">
        <h2>Reasoning Settings</h2>
        <p class="text-secondary mb-2">Configure reasoning/thinking tokens for models that support it</p>
        
        <div class="mb-2">
          <label class="form-check">
            <input type="checkbox" id="reasoning-enabled-check" ${data.settings.reasoning?.enabled ? "checked" : ""}>
            <span class="form-check-label">Enable Reasoning</span>
          </label>
          <p class="text-secondary text-xs mt-1">Allow the model to show its reasoning process</p>
        </div>
        
        <div id="reasoning-options" style="display: ${data.settings.reasoning?.enabled ? "block" : "none"}">
          <div class="mb-2">
            <label for="reasoning-mode-select" class="text-sm font-weight-500">Reasoning Mode:</label>
            <select id="reasoning-mode-select" class="mt-1">
              <option value="effort" ${!data.settings.reasoning?.mode || data.settings.reasoning?.mode === "effort" ? "selected" : ""}>Effort Level</option>
              <option value="max_tokens" ${data.settings.reasoning?.mode === "max_tokens" ? "selected" : ""}>Max Tokens</option>
            </select>
          </div>
          
          <div id="reasoning-effort-container" style="display: ${!data.settings.reasoning?.mode || data.settings.reasoning?.mode === "effort" ? "block" : "none"}">
            <label for="reasoning-effort-select" class="text-sm font-weight-500">Effort Level:</label>
            <select id="reasoning-effort-select" class="mt-1">
              <option value="low" ${data.settings.reasoning?.effort === "low" ? "selected" : ""}>Low (~20% of max tokens)</option>
              <option value="medium" ${!data.settings.reasoning?.effort || data.settings.reasoning?.effort === "medium" ? "selected" : ""}>Medium (~50% of max tokens)</option>
              <option value="high" ${data.settings.reasoning?.effort === "high" ? "selected" : ""}>High (~80% of max tokens)</option>
            </select>
            <p class="text-secondary text-xs mt-1">Higher effort allows more detailed reasoning but costs more tokens</p>
          </div>
          
          <div id="reasoning-max-tokens-container" style="display: ${data.settings.reasoning?.mode === "max_tokens" ? "block" : "none"}">
            <label for="reasoning-max-tokens-input" class="text-sm font-weight-500">Max Reasoning Tokens:</label>
            <input 
              type="number" 
              id="reasoning-max-tokens-input" 
              min="100" 
              max="32000" 
              placeholder="2000"
              value="${data.settings.reasoning?.maxTokens || ""}"
              class="mt-1"
            >
            <p class="text-secondary text-xs mt-1">Specific token limit for reasoning (100-32000)</p>
          </div>
          
          <div class="mb-2 mt-2">
            <label class="form-check">
              <input type="checkbox" id="reasoning-exclude-check" ${data.settings.reasoning?.exclude ? "checked" : ""}>
              <span class="form-check-label">Hide Reasoning from Response</span>
            </label>
            <p class="text-secondary text-xs mt-1">Model will still use reasoning internally but won't show it</p>
          </div>
        </div>
      </div>
      ` : ""}
      
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

  document.getElementById("max-tokens-input").addEventListener("change", (e) => {
    const value = e.target.value.trim()
    const numValue = value ? Number.parseInt(value, 10) : null
    
    // Validate against model's max completion tokens
    if (numValue && currentModel?.maxCompletionTokens && numValue > currentModel.maxCompletionTokens) {
      showMessage(`Max tokens limited to ${currentModel.maxCompletionTokens.toLocaleString()} for this model`, "error")
      e.target.value = currentModel.maxCompletionTokens
      data.settings.maxTokens = currentModel.maxCompletionTokens
    } else {
      data.settings.maxTokens = numValue
    }
    
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

  // Reasoning settings event listeners (only if reasoning settings exist)
  if (currentModel?.supportsReasoning) {
    // Initialize reasoning settings if not present
    if (!data.settings.reasoning) {
      data.settings.reasoning = {
        enabled: false,
        mode: "effort",
        effort: "medium",
        maxTokens: null,
        exclude: false
      }
    }

    document.getElementById("reasoning-enabled-check").addEventListener("change", (e) => {
      data.settings.reasoning.enabled = e.target.checked
      document.getElementById("reasoning-options").style.display = e.target.checked ? "block" : "none"
      saveData(data)
    })

    document.getElementById("reasoning-mode-select").addEventListener("change", (e) => {
      data.settings.reasoning.mode = e.target.value
      document.getElementById("reasoning-effort-container").style.display = e.target.value === "effort" ? "block" : "none"
      document.getElementById("reasoning-max-tokens-container").style.display = e.target.value === "max_tokens" ? "block" : "none"
      saveData(data)
    })

    document.getElementById("reasoning-effort-select").addEventListener("change", (e) => {
      data.settings.reasoning.effort = e.target.value
      saveData(data)
    })

    document.getElementById("reasoning-max-tokens-input").addEventListener("change", (e) => {
      const value = e.target.value.trim()
      const numValue = value ? Number.parseInt(value, 10) : null
      
      if (numValue && (numValue < 100 || numValue > 32000)) {
        showMessage("Reasoning tokens must be between 100 and 32000", "error")
        e.target.value = Math.max(100, Math.min(32000, numValue || 2000))
        data.settings.reasoning.maxTokens = Number.parseInt(e.target.value, 10)
      } else {
        data.settings.reasoning.maxTokens = numValue
      }
      
      saveData(data)
    })

    document.getElementById("reasoning-exclude-check").addEventListener("change", (e) => {
      data.settings.reasoning.exclude = e.target.checked
      saveData(data)
    })
  }
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
