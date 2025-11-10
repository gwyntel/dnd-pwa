/**
 * Home view - Dashboard with game list
 */

import { loadData, saveData } from "../utils/storage.js"
import { navigateTo } from "../router.js"
import { isAuthenticated } from "../utils/auth.js"

export function renderHome() {
  const app = document.getElementById("app")
  const data = loadData()

  // Check authentication
  if (!isAuthenticated()) {
    app.innerHTML = renderAuthPrompt()
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
  return `
    <div class="container text-center mt-4">
      <h1>Welcome to D&D PWA</h1>
      <p class="text-secondary mb-4">Single-player text adventures powered by AI</p>
      
      <div class="card card-center">
        <h2>Get Started</h2>
        <p>To begin your adventure, you'll need to authenticate with OpenRouter.</p>
        
        <div class="mt-3">
          <button id="auth-btn" class="btn">Connect with OpenRouter</button>
        </div>
        
        <div class="mt-3">
          <p class="text-secondary text-sm">Or enter your API key directly:</p>
          <input type="password" id="api-key-input" placeholder="sk-or-..." class="mt-2">
          <button id="api-key-btn" class="btn-secondary mt-2">Use API Key</button>
        </div>
      </div>
      
      <div class="mt-4 text-secondary text-sm">
        <p>New to D&D? No problem! This app is beginner-friendly.</p>
        <p>The AI will guide you through the rules as you play.</p>
      </div>
    </div>
  `
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
