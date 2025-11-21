/**
 * Model Selector View
 * Browse and select models from the configured provider
 */

import store from "../state/store.js"
import { navigateTo } from "../router.js"
import { isNitroModel, getProvider } from "../utils/model-utils.js"

let allModels = []
let filteredModels = []
let currentFilter = "all"
let currentSort = "name"
let searchQuery = ""

export async function renderModels() {
  const app = document.getElementById("app")
  const data = store.get()

  // Show loading state
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
      <h1>Select Model</h1>
      <div class="text-center card-padded-xl">
        <div class="spinner"></div>
        <p class="text-secondary mt-3">Loading models...</p>
      </div>
    </div>
  `

  try {
    // Fetch models from the configured provider
    const provider = await getProvider()
    allModels = await provider.fetchModels()
    filteredModels = [...allModels]

    // Render the model selector UI
    renderModelSelector(data)
  } catch (error) {
    console.error("Error loading models:", error)
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
        <h1>Select Model</h1>
        <div class="card">
          <p class="text-error">Failed to load models: ${error.message}</p>
          <button id="retry-btn" class="btn-secondary mt-2">Retry</button>
          <a href="/settings" class="btn-secondary mt-2">Back to Settings</a>
        </div>
      </div>
    `

    document.getElementById("retry-btn")?.addEventListener("click", () => {
      renderModels()
    })
  }
}

function renderModelSelector(data) {
  const app = document.getElementById("app")

  // Persist fetched models so other views (characters/worlds) can inspect supportedParameters.
  store.update((state) => {
    state.models = allModels
  })

  // Get fresh state after update
  const currentState = store.get()
  const currentModel = currentState.settings.defaultNarrativeModel

  // Get unique providers for filter
  const providers = [...new Set(allModels.map((m) => m.provider))].sort()

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
        <h1 class="page-title">Select Model</h1>
        <a href="/settings" class="btn-secondary">Back</a>
      </div>
      
      <div class="card mb-3">
        <p class="text-center mb-3">
          <strong>Stuck?</strong> Check the best roleplay models on OpenRouter: 
          <a href="https://openrouter.ai/rankings?category=roleplay#categories" target="_blank" rel="noopener noreferrer">
            Roleplay Rankings
          </a>
        </p>
        <div class="mb-2">
          <input 
            type="text" 
            id="search-input" 
            placeholder="Search models..." 
            value="${searchQuery}"
          >
        </div>
        
        <div class="flex gap-2 mb-2 flex-wrap">
          <select id="provider-filter" class="provider-filter">
            <option value="all">All Providers</option>
            ${providers.map((p) => `<option value="${p}" ${currentFilter === p ? "selected" : ""}>${p}</option>`).join("")}
          </select>
          
          <select id="sort-select" class="sort-select">
            <option value="name" ${currentSort === "name" ? "selected" : ""}>Sort by Name</option>
            <option value="price-low" ${currentSort === "price-low" ? "selected" : ""}>Price: Low to High</option>
            <option value="price-high" ${currentSort === "price-high" ? "selected" : ""}>Price: High to Low</option>
            <option value="context" ${currentSort === "context" ? "selected" : ""}>Context Length</option>
          </select>
        </div>
        
        <p class="text-secondary text-sm">
          Showing ${filteredModels.length} of ${allModels.length} models
          <br>
          <span class="text-xs" style="opacity: 0.8;">Tap and hold a model to view it on OpenRouter</span>
        </p>
      </div>
      
      <div id="models-list">
        ${renderModelsList(currentModel)}
      </div>
    </div>
  `

  // Event listeners
  document.getElementById("search-input").addEventListener("input", (e) => {
    searchQuery = e.target.value
    applyFiltersAndSort()
    updateModelsList(currentModel)
  })

  document.getElementById("provider-filter").addEventListener("change", (e) => {
    currentFilter = e.target.value
    applyFiltersAndSort()
    updateModelsList(currentModel)
  })

  document.getElementById("sort-select").addEventListener("change", (e) => {
    currentSort = e.target.value
    applyFiltersAndSort()
    updateModelsList(currentModel)
  })

  document.querySelectorAll(".model-card").forEach((card) => {
    let pressTimer = null

    const startPress = () => {
      pressTimer = setTimeout(() => {
        // Long press detected - open OpenRouter page
        const modelId = card.dataset.modelId
        window.open(`https://openrouter.ai/${modelId}`, "_blank")
        pressTimer = null
      }, 500) // 500ms for long press
    }

    const cancelPress = () => {
      if (pressTimer) {
        clearTimeout(pressTimer)
        pressTimer = null
      }
    }

    const handleClick = () => {
      if (!pressTimer) return // Was a long press, not a click
      cancelPress()
      const modelId = card.dataset.modelId
      selectModel(modelId)
    }

    // Touch events
    card.addEventListener("touchstart", startPress)
    card.addEventListener("touchend", handleClick)
    card.addEventListener("touchcancel", cancelPress)
    card.addEventListener("touchmove", cancelPress)

    // Mouse events (for desktop)
    card.addEventListener("mousedown", startPress)
    card.addEventListener("mouseup", handleClick)
    card.addEventListener("mouseleave", cancelPress)
  })
}

function renderModelsList(currentModel) {
  if (filteredModels.length === 0) {
    return `
      <div class="card text-center">
        <p class="text-secondary">No models found matching your criteria.</p>
      </div>
    `
  }

  return filteredModels
    .map((model) => {
      const isSelected = model.id === currentModel
      const promptPrice = Number.parseFloat(model.pricing.prompt) * 1000000 // Convert to per-million
      const completionPrice = Number.parseFloat(model.pricing.completion) * 1000000
      const supportsStructured =
        Array.isArray(model.supportedParameters) && model.supportedParameters.includes("structured_outputs")

      const reasoningFeature = model.supportsReasoning ? "✅ Reasoning Tokens" : ""
      return `
      <div class="model-card ${isSelected ? "selected" : ""}" data-model-id="${model.id}">
        <div class="model-header">
          <h3 class="model-name">${escapeHtml(model.name)}</h3>
          ${isSelected ? '<span class="badge-selected">✓ Selected</span>' : ""}
        </div>
        <p class="model-id">${escapeHtml(model.id)}</p>
        <div class="model-details">
          <div class="model-detail">
            <span class="detail-label">Features:</span>
            <span class="detail-value">
              ${supportsStructured ? "✅ Structured Outputs" : "—"}
              ${reasoningFeature ? ` ${reasoningFeature}` : ""}
              ${isNitroModel(model.id) ? " ⚡ Nitro" : ""}
            </span>
          </div>
          <div class="model-detail">
            <span class="detail-label">Provider:</span>
            <span class="detail-value">${escapeHtml(model.provider)}</span>
          </div>
          <div class="model-detail">
            <span class="detail-label">Context:</span>
            <span class="detail-value">${formatNumber(model.contextLength)} tokens</span>
          </div>
          <div class="model-detail">
            <span class="detail-label">Pricing:</span>
            <span class="detail-value">
              $${promptPrice.toFixed(2)} / $${completionPrice.toFixed(2)} per 1M tokens
            </span>
          </div>
        </div>
      </div>
    `
    })
    .join("")
}

function updateModelsList(currentModel = null) {
  // If no currentModel provided, load from storage to get latest selection
  if (currentModel === null) {
    const data = store.get()
    currentModel = data.settings.defaultNarrativeModel
  }

  const listContainer = document.getElementById("models-list")
  listContainer.innerHTML = renderModelsList(currentModel)

  document.querySelectorAll(".model-card").forEach((card) => {
    let pressTimer = null

    const startPress = () => {
      pressTimer = setTimeout(() => {
        const modelId = card.dataset.modelId
        window.open(`https://openrouter.ai/${modelId}`, "_blank")
        pressTimer = null
      }, 500)
    }

    const cancelPress = () => {
      if (pressTimer) {
        clearTimeout(pressTimer)
        pressTimer = null
      }
    }

    const handleClick = () => {
      if (!pressTimer) return
      cancelPress()
      const modelId = card.dataset.modelId
      selectModel(modelId)
    }

    card.addEventListener("touchstart", startPress)
    card.addEventListener("touchend", handleClick)
    card.addEventListener("touchcancel", cancelPress)
    card.addEventListener("touchmove", cancelPress)

    card.addEventListener("mousedown", startPress)
    card.addEventListener("mouseup", handleClick)
    card.addEventListener("mouseleave", cancelPress)
  })

  // Update count
  const card = document.querySelector(".card.mb-3")
  if (card) {
    const info = card.querySelector(".text-secondary")
    if (info) {
      info.innerHTML = `Showing ${filteredModels.length} of ${allModels.length} models<br><span class="text-xs" style="opacity: 0.8;">Tap and hold a model to view it on OpenRouter</span>`
    }
  }
}

function applyFiltersAndSort() {
  // Start with all models
  filteredModels = [...allModels]

  // Apply search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase()
    filteredModels = filteredModels.filter(
      (model) =>
        model.name.toLowerCase().includes(query) ||
        model.id.toLowerCase().includes(query) ||
        model.provider.toLowerCase().includes(query),
    )
  }

  // Apply provider filter
  if (currentFilter !== "all") {
    filteredModels = filteredModels.filter((model) => model.provider === currentFilter)
  }

  // Apply sorting
  switch (currentSort) {
    case "name":
      filteredModels.sort((a, b) => a.name.localeCompare(b.name))
      break
    case "price-low":
      filteredModels.sort((a, b) => {
        const aPrice = Number.parseFloat(a.pricing.prompt) + Number.parseFloat(a.pricing.completion)
        const bPrice = Number.parseFloat(b.pricing.prompt) + Number.parseFloat(b.pricing.completion)
        return aPrice - bPrice
      })
      break
    case "price-high":
      filteredModels.sort((a, b) => {
        const aPrice = Number.parseFloat(a.pricing.prompt) + Number.parseFloat(a.pricing.completion)
        const bPrice = Number.parseFloat(b.pricing.prompt) + Number.parseFloat(b.pricing.completion)
        return bPrice - aPrice
      })
      break
    case "context":
      filteredModels.sort((a, b) => b.contextLength - a.contextLength)
      break
  }
}

async function selectModel(modelId) {
  await store.update((state) => {
    state.settings.defaultNarrativeModel = modelId
  }, { immediate: true })

  // Update the UI immediately to reflect the selection
  updateModelsList(modelId)

  showMessage("Model selected successfully!", "success")

  const redirectTarget = sessionStorage.getItem("redirectAfterModelSelect")
  sessionStorage.removeItem("redirectAfterModelSelect")

  setTimeout(() => {
    if (redirectTarget) {
      navigateTo(redirectTarget)
    } else {
      navigateTo("/settings")
    }
  }, 1000)
}

function showMessage(text, type) {
  const container = document.querySelector(".container")
  const existing = container.querySelector(".message")
  if (existing) existing.remove()

  const message = document.createElement("div")
  message.className = `message message-${type}`
  message.textContent = text
  message.style.cssText =
    "position: fixed; top: 20px; right: 20px; z-index: 1000; padding: 1rem; border-radius: 8px; background: var(--accent-color); color: white; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"
  document.body.appendChild(message)

  setTimeout(() => {
    message.remove()
  }, 3000)
}

function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

function formatNumber(num) {
  return num.toLocaleString()
}
