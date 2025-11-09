/**
 * Worlds View
 * Manage campaign worlds with custom lore and system prompts
 */

import { loadData, saveData } from "../utils/storage.js"

let editingWorldId = null

export function renderWorlds() {
  const app = document.getElementById("app")
  const data = loadData()

  app.innerHTML = `
    <nav>
      <div class="container">
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/characters">Characters</a></li>
          <li><a href="/settings">Settings</a></li>
        </ul>
      </div>
    </nav>
    
    <div class="container">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; margin-top: 1rem;">
        <h1>Worlds</h1>
        <button id="create-world-btn" class="btn">Create World</button>
      </div>
      
      <div id="world-form-container"></div>
      
      <div class="worlds-grid">
        ${data.worlds.map((world) => renderWorldCard(world)).join("")}
      </div>
    </div>
  `

  // Event listeners
  document.getElementById("create-world-btn").addEventListener("click", () => {
    editingWorldId = null
    renderWorldForm()
  })

  // Edit buttons
  document.querySelectorAll(".edit-world-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      editingWorldId = e.target.dataset.worldId
      renderWorldForm(data.worlds.find((w) => w.id === editingWorldId))
    })
  })

  // Delete buttons
  document.querySelectorAll(".delete-world-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const worldId = e.target.dataset.worldId
      const world = data.worlds.find((w) => w.id === worldId)

      if (world.isDefault) {
        alert("Cannot delete the default world.")
        return
      }

      // Check if any games use this world
      const gamesUsingWorld = data.games.filter((g) => g.worldId === worldId)
      if (gamesUsingWorld.length > 0) {
        if (!confirm(`This world is used by ${gamesUsingWorld.length} adventure(s). Delete anyway?`)) {
          return
        }
      }

      if (confirm(`Delete world "${world.name}"?`)) {
        data.worlds = data.worlds.filter((w) => w.id !== worldId)
        saveData(data)
        renderWorlds()
      }
    })
  })
}

function renderWorldCard(world) {
  return `
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
        <div>
          <h3>${world.name} ${world.isDefault ? '<span class="badge">Default</span>' : ""}</h3>
          <p class="text-secondary" style="font-size: 0.875rem;">${world.description}</p>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn-icon edit-world-btn" data-world-id="${world.id}" title="Edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          ${
            !world.isDefault
              ? `
            <button class="btn-icon delete-world-btn" data-world-id="${world.id}" title="Delete">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          `
              : ""
          }
        </div>
      </div>
      
      <div style="background: var(--card-bg-secondary); padding: 1rem; border-radius: 0.5rem; margin-top: 1rem;">
        <strong style="font-size: 0.875rem;">System Prompt:</strong>
        <p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.5rem; white-space: pre-wrap;">${world.systemPrompt}</p>
      </div>
    </div>
  `
}

function renderWorldForm(world = null) {
  const container = document.getElementById("world-form-container")

  const isEditing = world !== null
  const formData = world || {
    name: "",
    description: "",
    systemPrompt: "",
  }

  container.innerHTML = `
    <div class="card" style="margin-bottom: 2rem; border: 2px solid var(--primary);">
      <h2>${isEditing ? "Edit World" : "Create New World"}</h2>
      
      <form id="world-form">
        <div class="mb-3">
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">World Name *</label>
          <input type="text" id="world-name" required placeholder="e.g., Forgotten Realms" value="${formData.name}">
        </div>
        
        <div class="mb-3">
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Description *</label>
          <input type="text" id="world-description" required placeholder="Brief description of the world" value="${formData.description}">
        </div>
        
        <div class="mb-3">
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">System Prompt *</label>
          <textarea 
            id="world-system-prompt" 
            required 
            rows="8"
            placeholder="Describe the world's lore, rules, tone, magic system, technology level, major factions, etc. This will be prepended to all AI interactions for adventures in this world."
            style="resize: vertical;"
          >${formData.systemPrompt}</textarea>
          <p class="text-secondary mt-1" style="font-size: 0.875rem;">
            This prompt sets the context for all adventures in this world. Be specific about the setting, tone, and rules.
          </p>
        </div>
        
        <div style="display: flex; gap: 0.5rem;">
          <button type="submit" class="btn">${isEditing ? "Update World" : "Create World"}</button>
          <button type="button" id="cancel-world-btn" class="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  `

  // Scroll to form
  container.scrollIntoView({ behavior: "smooth" })

  // Event listeners
  document.getElementById("world-form").addEventListener("submit", (e) => {
    e.preventDefault()
    saveWorld()
  })

  document.getElementById("cancel-world-btn").addEventListener("click", () => {
    container.innerHTML = ""
    editingWorldId = null
  })
}

function saveWorld() {
  const data = loadData()
  const name = document.getElementById("world-name").value.trim()
  const description = document.getElementById("world-description").value.trim()
  const systemPrompt = document.getElementById("world-system-prompt").value.trim()

  if (!name || !description || !systemPrompt) {
    alert("Please fill in all fields.")
    return
  }

  if (editingWorldId) {
    // Update existing world
    const world = data.worlds.find((w) => w.id === editingWorldId)
    if (world) {
      world.name = name
      world.description = description
      world.systemPrompt = systemPrompt
    }
  } else {
    // Create new world
    const newWorld = {
      id: `world_${Date.now()}`,
      name,
      description,
      systemPrompt,
      createdAt: new Date().toISOString(),
      isDefault: false,
    }
    data.worlds.push(newWorld)
  }

  saveData(data)
  editingWorldId = null
  renderWorlds()
}
