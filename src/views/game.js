/**
 * Game View
 * Main gameplay interface with chat and game state
 */

import { loadData, saveData, debouncedSave, normalizeCharacter } from "../utils/storage.js"
import { navigateTo } from "../router.js"
import { sendChatCompletion, parseStreamingResponse } from "../utils/openrouter.js"
import { rollDice, rollAdvantage, rollDisadvantage, formatRoll, parseRollRequests } from "../utils/dice.js"
import { buildDiceProfile, rollSkillCheck, rollSavingThrow, rollAttack } from "../utils/dice5e.js"
import { getLocationIcon, getConditionIcon, Icons } from "../utils/ui-icons.js"
import { buildGameDMPrompt } from "../views/prompts/game-dm-prompt.js"

let currentGameId = null
let isStreaming = false

export function renderGameList() {
  const app = document.getElementById("app")
  const data = loadData()

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
      <div class="flex justify-between align-center mb-3">
        <h1>New Game</h1>
        <a href="/" class="btn-secondary">Cancel</a>
      </div>
      
      ${data.characters.length === 0 ? renderNoCharacters() : renderGameCreator(data)}
    </div>
  `

  // Event listeners
  document.getElementById("game-form")?.addEventListener("submit", (e) => {
    e.preventDefault()
    createGame()
  })
}

function renderNoCharacters() {
  return `
    <div class="card text-center card-padded-lg">
      <h2>No Characters Available</h2>
      <p class="text-secondary mb-3">You need to create a character before starting a game.</p>
      <a href="/characters/new" class="btn">Create Character</a>
    </div>
  `
}

function renderGameCreator(data) {
  return `
    <div class="card">
      <form id="game-form">
        <div class="mb-3">
          <label class="form-label">Game Title *</label>
          <input type="text" id="game-title" required placeholder="Enter adventure title">
        </div>
        
        <div class="mb-3">
          <label class="form-label">Select Character *</label>
          <select id="game-character" required>
            <option value="">Choose a character...</option>
            ${data.characters
              .map(
                (char) => `
              <option value="${char.id}">${char.name} - Level ${char.level} ${char.race} ${char.class}</option>
            `,
              )
              .join("")}
          </select>
        </div>
        
        <div class="mb-3">
          <label class="form-label">World Setting *</label>
          <select id="game-world" required>
            ${data.worlds
              .map(
                (world) => `
              <option value="${world.id}" ${world.isDefault ? "selected" : ""}>
                ${world.name}${world.isDefault ? " (Default)" : ""}
              </option>
            `,
              )
              .join("")}
          </select>
          <p class="text-secondary mt-1 text-sm">
            <a href="/worlds">Manage worlds</a>
          </p>
        </div>
        
        <div class="mb-3">
          <label class="form-label">Narrative Model</label>
          <select id="game-model">
            <option value="">Use default (${data.settings.defaultNarrativeModel || "not set"})</option>
          </select>
          <p class="text-secondary mt-1 text-sm">
            <a href="/models">Change default model</a>
          </p>
        </div>
        
        <button type="submit" class="btn btn-block">Start Adventure</button>
      </form>
    </div>
  `
}

async function createGame() {
  const data = loadData()
  const characterId = document.getElementById("game-character").value
  const title = document.getElementById("game-title").value.trim()
  const worldId = document.getElementById("game-world").value
  const model = document.getElementById("game-model").value || data.settings.defaultNarrativeModel

  if (!model) {
    alert("Please set a default narrative model in settings first.")
    return
  }

  const character = data.characters.find((c) => c.id === characterId)
  if (!character) {
    alert("Character not found.")
    return
  }

  const world = data.worlds.find((w) => w.id === worldId)
  if (!world) {
    alert("World not found.")
    return
  }

  const gameId = `game_${Date.now()}`
  const game = {
    id: gameId,
    title,
    characterId,
    worldId, // Added worldId to game
    narrativeModel: model,
    currentHP: character.maxHP,
    currentLocation: "Unknown",
    questLog: [],
    inventory: [...character.inventory],
    conditions: [],
    combat: {
      active: false,
      round: 0,
      initiative: [],
      currentTurnIndex: 0,
    },
    suggestedActions: [],
    messages: [],
    createdAt: new Date().toISOString(),
    lastPlayedAt: new Date().toISOString(),
    totalPlayTime: 0,
  }

  data.games.push(game)
  saveData(data)

  navigateTo(`/game/${gameId}`)
}

export async function renderGame(state = {}) {
  const gameId = state.params?.id
  if (!gameId) {
    navigateTo("/")
    return
  }

  currentGameId = gameId
  const data = loadData()

  if (!data.settings.defaultNarrativeModel) {
    console.log("[v0] No default model set in game view, redirecting to model selector")
    sessionStorage.setItem("redirectAfterModelSelect", `/game/${gameId}`)
    navigateTo("/models")
    return
  }

  const game = data.games.find((g) => g.id === gameId)

  if (!game) {
    navigateTo("/")
    return
  }

  const rawCharacter = data.characters.find((c) => c.id === game.characterId)
  const character = rawCharacter ? normalizeCharacter(rawCharacter) : null

  const app = document.getElementById("app")
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
    
    <div class="game-container">
      <div class="game-main">
        <div class="card game-main-card">
          <!-- Enhanced game header with location icon -->
          <div class="game-header">
            <h2>${game.title}</h2>
            <p class="text-secondary text-sm">
              ${getLocationIcon(game.currentLocation)} <strong>${game.currentLocation}</strong>
            </p>
          </div>

          <div id="messages-container" class="messages-container">
            ${renderMessages(game.messages)}
          </div>
          
          <div class="input-container">
            ${
              game.suggestedActions && game.suggestedActions.length > 0
                ? `
              <div class="suggested-actions">
                ${game.suggestedActions
                  .map(
                    (action) => `
                  <button class="action-bubble" data-action="${escapeHtml(action)}">
                    ${escapeHtml(action)}
                  </button>
                `,
                  )
                  .join("")}
              </div>
            `
                : ""
            }
            <form id="chat-form" class="chat-form">
              <input 
                type="text" 
                id="player-input" 
                class="chat-input"
                placeholder="What do you do?"
                ${isStreaming ? "disabled" : ""}
              >
              <button type="submit" class="btn" ${isStreaming ? "disabled" : ""}>
                ${isStreaming ? "Sending..." : "Send"}
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- Character + Rolls below chat for fullscreen chat-first layout -->
      <div class="game-below-chat">
        <div class="card">
          <h3>${character.name}</h3>
          <p class="text-secondary character-subtitle">Level ${character.level} ${character.race} ${character.class}</p>
          
          <div class="stat-bar mt-2">
            <div class="flex justify-between mb-1">
              <span style="font-weight: 500;">HP</span>
              <span>${game.currentHP}/${character.maxHP}</span>
            </div>
            <div class="progress-bar progress-bar-lg">
              <div
                class="progress-fill"
                style="width: ${(game.currentHP / character.maxHP) * 100}%; background-color: ${
                  game.currentHP > character.maxHP * 0.5
                    ? "var(--success-color, #4caf50)"
                    : game.currentHP > character.maxHP * 0.25
                    ? "var(--warning-color, #ff9800)"
                    : "var(--error-color, #f44336)"
                };"
              ></div>
            </div>
          </div>
          
          <div class="flex justify-between mb-3 key-stats">
            <div><strong>AC</strong><br>${character.armorClass}</div>
            <div><strong>PROF</strong><br>+${character.proficiencyBonus}</div>
            <div><strong>SPD</strong><br>${character.speed}ft</div>
          </div>
          
          <div class="stats-grid mt-3">
            <div class="stat-item">
              <span class="stat-label">STR</span>
              <span class="stat-value">${character.stats.strength}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">DEX</span>
              <span class="stat-value">${character.stats.dexterity}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">CON</span>
              <span class="stat-value">${character.stats.constitution}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">INT</span>
              <span class="stat-value">${character.stats.intelligence}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">WIS</span>
              <span class="stat-value">${character.stats.wisdom}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">CHA</span>
              <span class="stat-value">${character.stats.charisma}</span>
            </div>
          </div>

          ${
            game.combat.active
              ? `
            <div class="combat-indicator mt-2">
              <strong>⚔️ IN COMBAT</strong>
              <p class="text-secondary" style="font-size: 0.875rem; margin: 0.25rem 0 0; opacity: 0.9;">Round ${game.combat.round}</p>
            </div>
          `
              : ""
          }
        </div>

        <div class="card">
          <h3 class="rolls-title">Recent Rolls</h3>
          <div id="roll-history-container" class="roll-history-container">
            ${renderRollHistory(game.messages)}
          </div>
        </div>
      </div>
    </div>

  `

  // Auto-scroll to bottom
  const messagesContainer = document.getElementById("messages-container")
  messagesContainer.scrollTop = messagesContainer.scrollHeight

  // Form submission
  document.getElementById("chat-form")?.addEventListener("submit", async (e) => {
    e.preventDefault()
    await handlePlayerInput()
  })

  // Action bubble click handlers
  document.querySelectorAll(".action-bubble").forEach((bubble) => {
    bubble.addEventListener("click", (e) => {
      e.preventDefault()
      e.stopPropagation()
      const action = e.currentTarget.getAttribute("data-action")
      const input = document.getElementById("player-input")
      if (input && action) {
        input.value = action
        input.focus()
      }
    })
  })

  // If no messages, start the game
  if (game.messages.length === 0) {
    await startGame(game, character, data)
  }

  // Update last played timestamp
  game.lastPlayedAt = new Date().toISOString()
  saveData(data)
}

function renderSingleMessage(msg) {
  if (msg.hidden) return ""

  let className = "message"
  let iconPrefix = ""

  if (msg.role === "user") {
    className += " message-user"
    iconPrefix = "👤 "
  } else if (msg.role === "assistant") {
    className += " message-assistant"
    iconPrefix = "🎭 "
  } else if (msg.role === "system") {
    className += " message-system"

    if (msg.metadata?.diceRoll) {
      className += " message-dice"
      iconPrefix = Icons.DICE + " "
    } else if (msg.metadata?.damage) {
      className += " message-damage"
      iconPrefix = Icons.DAMAGE + " "
    } else if (msg.metadata?.healing) {
      className += " message-healing"
      iconPrefix = Icons.HEAL + " "
    } else if (msg.metadata?.combatEvent === "start") {
      className += " message-combat"
      iconPrefix = Icons.COMBAT + " "
    } else if (msg.metadata?.combatEvent === "end") {
      className += " message-combat"
      iconPrefix = "✓ "
    }
  }

  const cleanContent = stripTags(msg.content || "")

  // Do not render empty assistant messages unless they have dice roll metadata
  if (msg.role === "assistant" && !cleanContent.trim() && !msg.metadata?.diceRoll) {
    return ""
  }

  // Check if this message has reasoning content
  const hasReasoning = msg.role === "assistant" && msg.metadata?.reasoning
  const reasoning = hasReasoning ? msg.metadata.reasoning : ""
  const reasoningTokens = msg.metadata?.reasoningTokens || 0

  const messageHTML = `
    <div class="${className}" data-msg-id="${msg.id}">
      ${
        hasReasoning
          ? `
      <div class="message-reasoning">
        <details class="reasoning-details">
          <summary class="reasoning-summary">
            🧠 Reasoning
            ${
              reasoningTokens
                ? `<span class="reasoning-tokens">(${reasoningTokens} tokens)</span>`
                : ""
            }
          </summary>
          <div class="reasoning-body">
            ${escapeHtml(reasoning).replace(/\n/g, "<br>")}
          </div>
        </details>
      </div>
      `
          : ""
      }
      <div class="message-content">${iconPrefix}${parseMarkdown(cleanContent)}</div>
      ${msg.metadata?.diceRoll ? `<div class="dice-result">${formatRoll(msg.metadata.diceRoll)}</div>` : ""}
      ${msg.metadata?.rollId ? `<div class="dice-meta">id: ${msg.metadata.rollId} • ${msg.metadata.timestamp || ""}</div>` : ""}
    </div>
  `
  return messageHTML
}

function createRollMetadata(extra = {}) {
  const id = `roll_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const timestamp = new Date().toISOString()
  return { rollId: id, timestamp, ...extra }
}

function appendMessage(msg) {
  const messagesContainer = document.getElementById("messages-container")
  if (!messagesContainer) return

  const messageHTML = renderSingleMessage(msg)
  if (!messageHTML) return

  const div = document.createElement("div")
  div.innerHTML = messageHTML

  while (div.firstChild) {
    messagesContainer.appendChild(div.firstChild)
  }

  // Keep roll history in sync
  const rollHistoryContainer = document.getElementById("roll-history-container")
  if (rollHistoryContainer) {
    const data = loadData()
    const game = data.games.find((g) => g.id === currentGameId)
    if (game) {
      rollHistoryContainer.innerHTML = renderRollHistory(game.messages)
    }
  }
}

function renderRollHistory(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return '<div class="roll-history-empty text-secondary">No rolls yet.</div>'
  }

  // Take last 20 messages that have diceRoll metadata
  const rolls = messages.filter((m) => m?.metadata?.diceRoll).slice(-20)

  if (rolls.length === 0) {
    return '<div class="roll-history-empty text-secondary">No rolls yet.</div>'
  }

  return `
    <ul class="roll-history-list">
      ${rolls
        .map((m) => {
          const meta = m.metadata || {}
          const labelParts = []

          if (meta.type === "attack") {
            labelParts.push("Attack")
            if (meta.key) labelParts.push(meta.key)
            if (meta.targetAC) labelParts.push(`vs AC ${meta.targetAC}`)
            if (meta.success === true) labelParts.push("✓")
            if (meta.success === false) labelParts.push("✗")
          } else if (meta.type === "save") {
            labelParts.push("Save")
            if (meta.key) labelParts.push(meta.key.toUpperCase())
            if (meta.dc) labelParts.push(`DC ${meta.dc}`)
            if (meta.success === true) labelParts.push("✓")
            if (meta.success === false) labelParts.push("✗")
          } else if (meta.type === "skill") {
            labelParts.push("Skill")
            if (meta.key) labelParts.push(meta.key)
            if (meta.dc) labelParts.push(`DC ${meta.dc}`)
            if (meta.success === true) labelParts.push("✓")
            if (meta.success === false) labelParts.push("✗")
          } else {
            labelParts.push("Roll")
          }

          const label = labelParts.join(" ")

          const id = meta.rollId || ""
          const ts = meta.timestamp || ""
          const total =
            typeof meta.diceRoll?.total === "number"
              ? meta.diceRoll.total
              : (meta.diceRoll?.toHit?.total ?? meta.diceRoll?.damage?.total ?? "")

          return `
            <li class="roll-history-item">
              <div class="roll-history-main">
                <span class="roll-history-label-text">${label || "Roll"}</span>
                ${total !== "" ? `<span class="roll-history-total">${total}</span>` : ""}
              </div>
              <div class="roll-history-meta">
                ${id ? `<span class="roll-history-id">${id}</span>` : ""}
                ${ts ? `<span class="roll-history-ts">${ts}</span>` : ""}
                ${meta.source ? `<span class="roll-history-source">${meta.source}</span>` : ""}
              </div>
            </li>
          `
        })
        .join("")}
    </ul>
  `
}

function renderMessages(messages) {
  if (messages.length === 0) {
    return '<div class="text-center text-secondary card-padded-lg">Starting your adventure...</div>'
  }
  return messages.map(renderSingleMessage).join("")
}

function stripTags(text) {
  // Remove all game tags but keep the content inside when appropriate
  let cleaned = text

  cleaned = cleaned.replace(/LOCATION\[([^\]]+)\]/g, (match, location) => {
    const icon = getLocationIcon(location)
    return `${icon} ${location}` // Keep both icon AND location name
  })

  // ROLL tags - not shown in narrative
  cleaned = cleaned.replace(/ROLL\[([^\]]+)\]/g, "")

  // COMBAT tags - not shown directly
  cleaned = cleaned.replace(/COMBAT_START\[([^\]]+)\]/g, "")
  cleaned = cleaned.replace(/COMBAT_END\[([^\]]+)\]/g, "")

  // HP change tags
  cleaned = cleaned.replace(/DAMAGE\[([^\]]+)\]/g, "")
  cleaned = cleaned.replace(/HEAL\[([^\]]+)\]/g, "")

  // Inventory / currency / status tags
  cleaned = cleaned.replace(/INVENTORY_ADD\[([^\]]+)\]/g, "")
  cleaned = cleaned.replace(/INVENTORY_REMOVE\[([^\]]+)\]/g, "")
  cleaned = cleaned.replace(/INVENTORY_EQUIP\[([^\]]+)\]/g, "")
  cleaned = cleaned.replace(/INVENTORY_UNEQUIP\[([^\]]+)\]/g, "")
  cleaned = cleaned.replace(/GOLD_CHANGE\[([^\]]+)\]/g, "")
  cleaned = cleaned.replace(/STATUS_ADD\[([^\]]+)\]/g, "")
  cleaned = cleaned.replace(/STATUS_REMOVE\[([^\]]+)\]/g, "")

  // Suggested actions - strip ACTION[...] tags but keep surrounding text intact
  cleaned = cleaned.replace(/ACTION\[([^\]]+)\]/g, "")

  // Collapse excessive newlines
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n")

  return cleaned.trim()
}

function parseMarkdown(text) {
  // Escape HTML first
  let html = escapeHtml(text)

  // Bold: **text** or __text__
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
  html = html.replace(/__(.*?)__/g, "<strong>$1</strong>")

  // Italic: *text* or _text_
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>")
  html = html.replace(/_([^_]+)_/g, "<em>$1</em>")

  // Code: `text`
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>")

  // Line breaks
  html = html.replace(/\n/g, "<br>")

  return html
}

async function startGame(game, character, data) {
  const systemPrompt = buildSystemPrompt(character, game)

  const initialMessage = {
    role: "user",
    content:
      "Begin the adventure. Describe the opening scene and set the stage for the player. Use LOCATION[name] to set the starting location.",
  }

  game.messages.push({
    id: `msg_${Date.now()}_system`,
    role: "system",
    content: systemPrompt,
    timestamp: new Date().toISOString(),
    hidden: true,
  })

  game.messages.push({
    id: `msg_${Date.now()}`,
    ...initialMessage,
    timestamp: new Date().toISOString(),
    hidden: true,
  })

  // No need to save here, as the calling function will handle it.
  // We are passing the modified game object back up the call stack.

  await sendMessage(game, initialMessage.content, data)
}

async function handlePlayerInput() {
  const input = document.getElementById("player-input")
  const submitButton = document.querySelector('#chat-form button[type="submit"]')
  const text = input.value.trim()

  if (!text || isStreaming) return

  input.value = ""
  isStreaming = true
  input.disabled = true
  if (submitButton) {
    submitButton.disabled = true
    submitButton.textContent = "Sending..."
  }

  const data = loadData()
  const game = data.games.find((g) => g.id === currentGameId)

  // Add user message
  const userMessage = {
    id: `msg_${Date.now()}`,
    role: "user",
    content: text,
    timestamp: new Date().toISOString(),
    hidden: false,
  }

  game.messages.push(userMessage)
  appendMessage(userMessage) // Append the user's message to the DOM

  game.suggestedActions = []

  saveData(data)

  const messagesContainer = document.getElementById("messages-container")
  if (messagesContainer) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight
  }

  updateInputContainer(game)

  // Send to LLM
  await sendMessage(game, text, data)
}

async function sendMessage(game, userText, data) {
  const gameRef = game // Use the passed-in game object
  if (!gameRef) {
    console.error("[v0] Game not found!")
    return
  }

  const rawCharacter = data.characters.find((c) => c.id === gameRef.characterId)
  const character = rawCharacter ? normalizeCharacter(rawCharacter) : null

  // Reasoning panel configuration
  const reasoningPanelEnabled = !!data.settings?.reasoning?.displayPanel
  let lastReasoningText = ""
  let lastReasoningTokens = 0

  try {
    const apiMessages = gameRef.messages

    const hasNonSystemMessage = apiMessages.some((m) => m.role === "user" || m.role === "assistant")

    if (!hasNonSystemMessage && apiMessages.length > 0) {
      console.error("[v0] Only system messages found, no user/assistant messages")
      throw new Error("Cannot send API request with only system messages")
    }

    if (apiMessages.length === 0) {
      console.error("[v0] No valid messages to send to API")
      throw new Error("Messages array cannot be empty - check the openrouter docs for chat completions please")
    }

    const response = await sendChatCompletion(apiMessages, gameRef.narrativeModel)

    let assistantMessage = ""
    let reasoningBuffer = ""
    const assistantMsgId = `msg_${Date.now()}`
    const processedTags = new Set()

    gameRef.suggestedActions = []

    const assistantMsgIndex = gameRef.messages.length
    gameRef.messages.push({
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      hidden: false,
    })

    for await (const chunk of parseStreamingResponse(response)) {
      const choice = chunk.choices?.[0]
      const delta = choice?.delta?.content
      const reasoningDelta = choice?.delta?.reasoning

      if (reasoningDelta) {
        reasoningBuffer += reasoningDelta
        lastReasoningText = reasoningBuffer
      }

      if (delta) {
        assistantMessage += delta
        gameRef.messages[assistantMsgIndex].content = assistantMessage

        const streamingMsgElement = document.querySelector(`[data-msg-id="${assistantMsgId}"]`)

        if (!streamingMsgElement) {
          appendMessage(gameRef.messages[assistantMsgIndex])
        } else {
          const contentElement = streamingMsgElement.querySelector(".message-content")
          if (contentElement) {
            const cleanContent = stripTags(assistantMessage)
            contentElement.innerHTML = parseMarkdown(cleanContent)
          }
        }

        const newMessages = await processGameCommandsRealtime(gameRef, character, assistantMessage, processedTags)
        if (newMessages.length > 0) {
          newMessages.forEach((msg) => {
            gameRef.messages.push(msg)
            appendMessage(msg)
          })
        }

        const messagesContainer = document.getElementById("messages-container")
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight
        }

        const gameHeader = document.querySelector(".game-header p")
        if (gameHeader) {
          gameHeader.textContent = `${getLocationIcon(gameRef.currentLocation)} ${gameRef.currentLocation}`
        }

        debouncedSave(data, 100)
      }
    }

    await processGameCommands(gameRef, character, assistantMessage, processedTags)
    gameRef.messages[assistantMsgIndex].content = assistantMessage

    // Attach final reasoning metadata (if any)
    if (lastReasoningText) {
      gameRef.messages[assistantMsgIndex].metadata = {
        ...(gameRef.messages[assistantMsgIndex].metadata || {}),
        reasoning: lastReasoningText,
        reasoningTokens: lastReasoningTokens || undefined,
      }
    }

    saveData(data)
    updateInputContainer(gameRef)
  } catch (error) {
    console.error("[v0] Error sending message:", error)
    const errorMessage = error.message || "An unknown error occurred"
    const errorMsg = {
      id: `msg_${Date.now()}_error`,
      role: "system",
      content: `❌ Error: ${errorMessage}`,
      timestamp: new Date().toISOString(),
      hidden: false,
      metadata: { isError: true },
    }
    gameRef.messages.push(errorMsg)
    appendMessage(errorMsg)
    saveData(data)
  } finally {
    isStreaming = false
    const input = document.getElementById("player-input")
    const submitButton = document.querySelector('#chat-form button[type="submit"]')
    if (input) {
      input.disabled = false
      input.focus()
    }
    if (submitButton) {
      submitButton.disabled = false
      submitButton.textContent = "Send"
    }
  }
}

async function processGameCommandsRealtime(game, character, text, processedTags) {
  // Process tags as they stream in, but only once per tag
  const newMessages = []
  let needsUIUpdate = false

  // Precompute dice profile if we have a character
  const diceProfile = character ? buildDiceProfile(character) : null

  // Helpers for inventory / currency / conditions

  const ensureInventory = () => {
    if (!Array.isArray(game.inventory)) {
      game.inventory = []
    }
  }

  const ensureCurrency = () => {
    if (!game.currency || typeof game.currency.gp !== "number") {
      game.currency = { gp: 0 }
    }
  }

  const ensureConditions = () => {
    if (!Array.isArray(game.conditions)) {
      game.conditions = []
    }
  }

  const upsertItem = (rawName, deltaQty, { equip, unequip } = {}) => {
    ensureInventory()
    const name = (rawName || "").trim()
    if (!name) return null

    const findIndex = () =>
      game.inventory.findIndex((it) => typeof it.item === "string" && it.item.toLowerCase() === name.toLowerCase())

    let idx = findIndex()
    if (idx === -1 && deltaQty > 0) {
      game.inventory.push({ item: name, quantity: deltaQty, equipped: false })
      idx = findIndex()
    }

    if (idx === -1) {
      return null
    }

    const item = game.inventory[idx]
    const oldQty = typeof item.quantity === "number" ? item.quantity : 0
    const newQty = Math.max(0, oldQty + deltaQty)

    item.quantity = newQty

    if (equip === true) {
      item.equipped = true
    } else if (unequip === true) {
      item.equipped = false
    }

    if (item.quantity === 0) {
      game.inventory.splice(idx, 1)
    }

    return { name: item.item, oldQty, newQty, equipped: !!item.equipped }
  }

  const changeGold = (deltaRaw) => {
    const delta = Number.parseInt(deltaRaw, 10)
    if (Number.isNaN(delta) || delta === 0) return null
    ensureCurrency()
    const before = game.currency.gp
    let after = before + delta
    if (after < 0) after = 0
    game.currency.gp = after
    return { before, after, applied: after - before }
  }

  const addStatus = (raw) => {
    ensureConditions()
    const name = (raw || "").trim()
    if (!name) return false

    const exists = game.conditions.some((c) => {
      if (typeof c === "string") return c.toLowerCase() === name.toLowerCase()
      return c && typeof c.name === "string" && c.name.toLowerCase() === name.toLowerCase()
    })
    if (exists) return false

    game.conditions.push({ name })
    return true
  }

  const removeStatus = (raw) => {
    ensureConditions()
    const name = (raw || "").trim()
    if (!name) return false

    const before = game.conditions.length
    game.conditions = game.conditions.filter((c) => {
      if (typeof c === "string") return c.toLowerCase() !== name.toLowerCase()
      return !(c && typeof c.name === "string" && c.name.toLowerCase() === name.toLowerCase())
    })
    return game.conditions.length !== before
  }

  // LOCATION updates
  const locationMatches = text.matchAll(/LOCATION\[([^\]]+)\]/g)
  for (const match of locationMatches) {
    const tagKey = `location_${match[0]}`
    if (!processedTags.has(tagKey)) {
      game.currentLocation = match[1]
      processedTags.add(tagKey)
      // Icon will be added in UI
    }
  }

  // COMBAT_START with initiative
  const combatStartMatches = text.matchAll(/COMBAT_START\[([^\]]*)\]/g)
  for (const match of combatStartMatches) {
    const tagKey = `combat_start_${match[0]}`
    if (!processedTags.has(tagKey)) {
      game.combat.active = true
      game.combat.round = 1

      // Build initiative entries (player + optional hinted NPCs)
      const initiativeEntries = []

      if (character) {
        const profile = diceProfile || buildDiceProfile(character)
        const dexMod = profile.abilities?.dex ?? 0
        const initRoll = rollDice(`1d20${dexMod >= 0 ? `+${dexMod}` : dexMod}`)
        const meta = createRollMetadata({ sourceType: "initiative" })

        initiativeEntries.push({
          id: `init_player`,
          name: character.name || "Player",
          type: "player",
          roll: initRoll,
          total: initRoll.total,
          ...meta,
        })

        newMessages.push({
          id: `msg_${meta.rollId}_initiative_player`,
          role: "system",
          content: `⚔️ Initiative (You): ${formatRoll(initRoll)}`,
          timestamp: meta.timestamp,
          hidden: false,
          metadata: {
            diceRoll: initRoll,
            type: "initiative",
            actorType: "player",
            actorName: character.name || "Player",
            ...meta,
          },
        })
      }

      // Very light enemy initiative parsing from description (non-breaking best-effort).
      const desc = (match[1] || "").trim()
      const enemyNames = []
      const enemyMatch = desc.match(/(?:vs\.?\s+)?(.+?)$/i)
      if (enemyMatch && enemyMatch[1]) {
        const raw = enemyMatch[1]
        raw.split(/,|and/).forEach((chunk) => {
          const name = chunk.trim()
          if (name && name.length > 1) enemyNames.push(name)
        })
      }

      enemyNames.slice(0, 5).forEach((name, idx) => {
        const initRoll = rollDice("1d20")
        const meta = createRollMetadata({ sourceType: "initiative" })
        initiativeEntries.push({
          id: `init_npc_${idx}`,
          name,
          type: "npc",
          roll: initRoll,
          total: initRoll.total,
          ...meta,
        })
        newMessages.push({
          id: `msg_${meta.rollId}_initiative_npc_${idx}`,
          role: "system",
          content: `⚔️ Initiative (${name}): ${formatRoll(initRoll)}`,
          timestamp: meta.timestamp,
          hidden: false,
          metadata: {
            diceRoll: initRoll,
            type: "initiative",
            actorType: "npc",
            actorName: name,
            ...meta,
          },
        })
      })

      if (initiativeEntries.length > 0) {
        initiativeEntries.sort((a, b) => b.total - a.total)
        game.combat.initiative = initiativeEntries
        game.combat.currentTurnIndex = 0
      } else {
        game.combat.initiative = []
        game.combat.currentTurnIndex = 0
      }

      const startMeta = { combatEvent: "start" }
      newMessages.push({
        id: `msg_${Date.now()}_combat_start`,
        role: "system",
        content: `⚔️ Combat has begun! ${desc || ""}`.trim(),
        timestamp: new Date().toISOString(),
        hidden: false,
        metadata: startMeta,
      })

      processedTags.add(tagKey)
    }
  }

  // COMBAT_END
  const combatEndMatches = text.matchAll(/COMBAT_END\[([^\]]+)\]/g)
  for (const match of combatEndMatches) {
    const tagKey = `combat_end_${match[0]}`
    if (!processedTags.has(tagKey)) {
      game.combat.active = false
      game.combat.round = 0
      game.combat.initiative = []
      game.combat.currentTurnIndex = 0

      newMessages.push({
        id: `msg_${Date.now()}_combat_end`,
        role: "system",
        content: `✓ Combat ended: ${match[1]}`,
        timestamp: new Date().toISOString(),
        hidden: false,
        metadata: { combatEvent: "end" },
      })
      processedTags.add(tagKey)
    }
  }

  // DAMAGE
  const damageMatches = text.matchAll(/DAMAGE\[(\w+)\|(\d+)\]/g)
  for (const match of damageMatches) {
    const tagKey = `damage_${match[0]}`
    if (!processedTags.has(tagKey)) {
      const target = match[1]
      const amount = Number.parseInt(match[2], 10)

      if (target.toLowerCase() === "player") {
        const oldHP = game.currentHP
        game.currentHP = Math.max(0, game.currentHP - amount)

        newMessages.push({
          id: `msg_${Date.now()}_damage`,
          role: "system",
          content: `💔 You take ${amount} damage! (${oldHP} → ${game.currentHP} HP)`,
          timestamp: new Date().toISOString(),
          hidden: false,
          metadata: { damage: amount },
        })
        processedTags.add(tagKey)
      }
    }
  }

  // HEAL
  const healMatches = text.matchAll(/HEAL\[(\w+)\|(\d+)\]/g)
  for (const match of healMatches) {
    const tagKey = `heal_${match[0]}`
    if (!processedTags.has(tagKey)) {
      const target = match[1]
      const amount = Number.parseInt(match[2], 10)

      if (target.toLowerCase() === "player") {
        const oldHP = game.currentHP
        game.currentHP = Math.min(character.maxHP, game.currentHP + amount)
        const actualHealing = game.currentHP - oldHP

        newMessages.push({
          id: `msg_${Date.now()}_heal`,
          role: "system",
          content: `💚 You heal ${actualHealing} HP! (${oldHP} → ${game.currentHP} HP)`,
          timestamp: new Date().toISOString(),
          hidden: false,
          metadata: { healing: actualHealing },
        })
        processedTags.add(tagKey)
      }
    }
  }

  // ROLL (numeric + semantic)
  const rollMatches = text.matchAll(/ROLL\[([^\]]+)\]/g)
  for (const match of rollMatches) {
    const tagKey = `roll_${match[0]}`
    if (processedTags.has(tagKey)) continue

    const parts = match[1].split("|").map((p) => p.trim())
    const kind = (parts[0] || "").toLowerCase()

    console.debug("[dice][ROLL] Parsed tag", {
      raw: match[0],
      parts,
      kind,
      hasDiceProfile: !!diceProfile,
      hasCharacter: !!character,
    })

    // Shared helpers
    const parseDC = (raw) => {
      if (!raw) return null
      const m = raw.toString().toLowerCase().match(/(\d+)/)
      return m ? Number.parseInt(m[1], 10) : null
    }
    const parseAdv = (flagRaw) => {
      const flag = (flagRaw || "").toLowerCase()
      return {
        advantage: flag === "advantage" || flag === "adv",
        disadvantage: flag === "disadvantage" || flag === "dis",
      }
    }

    // Semantic: ROLL[skill|...], ROLL[save|...], ROLL[attack|...]
    if ((kind === "skill" || kind === "save" || kind === "attack") && diceProfile && character) {
      // Semantic handling for skill/save/attack rolls
      // If this fails, we will log and fall back to numeric handling.
      const key = parts[1] || ""
      const third = parts[2] || ""
      const adv = parseAdv(parts[3])

      try {
        if (kind === "skill") {
          console.debug("[dice][ROLL] Handling semantic skill roll", { key, dc: parseDC(third), adv, raw: match[0] })
          const dc = parseDC(third)
          const result = rollSkillCheck(character, key, { dc, ...adv })
          const meta = createRollMetadata({ sourceType: "skill" })
          newMessages.push({
            id: `msg_${meta.rollId}_roll_skill`,
            role: "system",
            content:
              `🎲 Skill (${key || "check"}): ` +
              `${formatRoll(result)}` +
              (dc != null ? ` vs DC ${dc} - ${result.success ? "✓ Success!" : "✗ Failure"}` : ""),
            timestamp: meta.timestamp,
            hidden: false,
            metadata: {
              diceRoll: result,
              type: "skill",
              key,
              dc,
              success: result.success,
              ...meta,
            },
          })
        } else if (kind === "save") {
          const dc = parseDC(third)
          console.debug("[dice][ROLL] Handling semantic save roll", { key, dc, adv, raw: match[0] })
          const result = rollSavingThrow(character, key, { dc, ...adv })
          const meta = createRollMetadata({ sourceType: "save" })
          newMessages.push({
            id: `msg_${meta.rollId}_roll_save`,
            role: "system",
            content:
              `🎲 Save (${(key || "").toUpperCase() || "save"}): ` +
              `${formatRoll(result)}` +
              (dc != null ? ` vs DC ${dc} - ${result.success ? "✓ Success!" : "✗ Failure"}` : ""),
            timestamp: meta.timestamp,
            hidden: false,
            metadata: {
              diceRoll: result,
              type: "save",
              key,
              dc,
              success: result.success,
              ...meta,
            },
          })
        } else if (kind === "attack") {
          const targetAC = parseDC(third)
          console.debug("[dice][ROLL] Handling semantic attack roll", { key, targetAC, adv, raw: match[0] })
          const attackResult = rollAttack(character, key, { targetAC, ...adv })
          const toHit = attackResult.toHit
          const dmg = attackResult.damage
          const label = attackResult.attack?.name || key || "Attack"
          const meta = createRollMetadata({ sourceType: "attack" })

          const segments = []
          segments.push(
            `🎲 Attack (${label}): ${formatRoll(toHit)}` +
              (targetAC != null ? ` vs AC ${targetAC} - ${toHit.success ? "✓ Hit" : "✗ Miss"}` : ""),
          )
          if (dmg) {
            segments.push(`💥 Damage: ${formatRoll(dmg)}`)
          }

          newMessages.push({
            id: `msg_${meta.rollId}_roll_attack`,
            role: "system",
            content: segments.join(" "),
            timestamp: meta.timestamp,
            hidden: false,
            metadata: {
              diceRoll: {
                attack: attackResult.attack,
                toHit,
                damage: dmg,
              },
              type: "attack",
              key,
              targetAC,
              success: toHit.success,
              ...meta,
            },
          })
        }

        processedTags.add(tagKey)
        continue // semantic handled, skip numeric fallback
      } catch (e) {
        console.warn("[dice][ROLL] Semantic ROLL tag failed, skipping legacy fallback for semantic tag", {
          raw: match[0],
          parts,
          kind,
          error: e?.message || String(e),
        })
        // Prevent invalid legacy calls like rollDice("skill")
        processedTags.add(tagKey)
        continue
      }
    }

    // Legacy numeric: ROLL[1d20+5|type|DC]
    const request = {
      notation: parts[0],
      type: parts[1] || "normal",
      dc: parts[2] ? Number.parseInt(parts[2], 10) : null,
    }

    console.debug("[dice][ROLL] Using legacy numeric ROLL handling", {
      raw: match[0],
      parts,
      request,
    })

    let result
    if (request.type === "advantage") {
      result = rollAdvantage(request.notation)
    } else if (request.type === "disadvantage") {
      result = rollDisadvantage(request.notation)
    } else {
      result = rollDice(request.notation)
    }

    const meta = createRollMetadata({ sourceType: "legacy" })
    newMessages.push({
      id: `msg_${meta.rollId}_roll_legacy`,
      role: "system",
      content:
        formatRoll(result) +
        (request.dc ? ` vs DC ${request.dc} - ${result.total >= request.dc ? "✓ Success!" : "✗ Failure"}` : ""),
      timestamp: meta.timestamp,
      hidden: false,
      metadata: {
        diceRoll: result,
        type: "roll",
        dc: request.dc,
        success: request.dc ? result.total >= request.dc : null,
        ...meta,
      },
    })
    processedTags.add(tagKey)
  }

  // INVENTORY_ADD[item|qty]
  const invAddMatches = text.matchAll(/INVENTORY_ADD\[([^\]||]+)\|?(\d+)?\]/g)
  for (const match of invAddMatches) {
    const tagKey = `inv_add_${match[0]}`
    if (!processedTags.has(tagKey)) {
      const name = match[1]
      const qty = match[2] ? Number.parseInt(match[2], 10) : 1
      const res = upsertItem(name, qty)
      if (res) {
        newMessages.push({
          id: `msg_${Date.now()}_inv_add`,
          role: "system",
          content: `📦 Gained ${qty} x ${res.name}.`,
          timestamp: new Date().toISOString(),
          hidden: false,
        })
      }
      processedTags.add(tagKey)
      needsUIUpdate = true
    }
  }

  // INVENTORY_REMOVE[item|qty]
  const invRemoveMatches = text.matchAll(/INVENTORY_REMOVE\[([^\]||]+)\|?(\d+)?\]/g)
  for (const match of invRemoveMatches) {
    const tagKey = `inv_remove_${match[0]}`
    if (!processedTags.has(tagKey)) {
      const name = match[1]
      const qty = match[2] ? Number.parseInt(match[2], 10) : 1
      const res = upsertItem(name, -qty)
      if (res) {
        newMessages.push({
          id: `msg_${Date.now()}_inv_remove`,
          role: "system",
          content: `📦 Used/removed ${qty} x ${res.name}.`,
          timestamp: new Date().toISOString(),
          hidden: false,
        })
      }
      processedTags.add(tagKey)
      needsUIUpdate = true
    }
  }

  // INVENTORY_EQUIP[item]
  const invEquipMatches = text.matchAll(/INVENTORY_EQUIP\[([^\]]+)\]/g)
  for (const match of invEquipMatches) {
    const tagKey = `inv_equip_${match[0]}`
    if (!processedTags.has(tagKey)) {
      const res = upsertItem(match[1], 0, { equip: true })
      if (res) {
        newMessages.push({
          id: `msg_${Date.now()}_inv_equip`,
          role: "system",
          content: `🛡️ Equipped ${res.name}.`,
          timestamp: new Date().toISOString(),
          hidden: false,
        })
      }
      processedTags.add(tagKey)
      needsUIUpdate = true
    }
  }

  // INVENTORY_UNEQUIP[item]
  const invUnequipMatches = text.matchAll(/INVENTORY_UNEQUIP\[([^\]]+)\]/g)
  for (const match of invUnequipMatches) {
    const tagKey = `inv_unequip_${match[0]}`
    if (!processedTags.has(tagKey)) {
      const res = upsertItem(match[1], 0, { unequip: true })
      if (res) {
        newMessages.push({
          id: `msg_${Date.now()}_inv_unequip`,
          role: "system",
          content: `🛡️ Unequipped ${res.name}.`,
          timestamp: new Date().toISOString(),
          hidden: false,
        })
      }
      processedTags.add(tagKey)
      needsUIUpdate = true
    }
  }

  // GOLD_CHANGE[delta]
  const goldMatches = text.matchAll(/GOLD_CHANGE\[(-?\d+)\]/g)
  for (const match of goldMatches) {
    const tagKey = `gold_${match[0]}`
    if (!processedTags.has(tagKey)) {
      const res = changeGold(match[1])
      if (res && res.applied !== 0) {
        const symbol = res.applied > 0 ? "+" : ""
        newMessages.push({
          id: `msg_${Date.now()}_gold`,
          role: "system",
          content: `💰 Gold: ${res.before} → ${res.after} (${symbol}${res.applied} gp)`,
          timestamp: new Date().toISOString(),
          hidden: false,
        })
      }
      processedTags.add(tagKey)
    }
  }

  // STATUS_ADD[name]
  const statusAddMatches = text.matchAll(/STATUS_ADD\[([^\]]+)\]/g)
  for (const match of statusAddMatches) {
    const tagKey = `status_add_${match[0]}`
    if (!processedTags.has(tagKey)) {
      if (addStatus(match[1])) {
        newMessages.push({
          id: `msg_${Date.now()}_status_add`,
          role: "system",
          content: `${getConditionIcon(match[1])} Status applied: ${match[1]}`,
          timestamp: new Date().toISOString(),
          hidden: false,
        })
      }
      processedTags.add(tagKey)
    }
  }

  // STATUS_REMOVE[name]
  const statusRemoveMatches = text.matchAll(/STATUS_REMOVE\[([^\]]+)\]/g)
  for (const match of statusRemoveMatches) {
    const tagKey = `status_remove_${match[0]}`
    if (!processedTags.has(tagKey)) {
      if (removeStatus(match[1])) {
        newMessages.push({
          id: `msg_${Date.now()}_status_remove`,
          role: "system",
          content: `✅ Status removed: ${match[1]}`,
          timestamp: new Date().toISOString(),
          hidden: false,
        })
      }
      processedTags.add(tagKey)
    }
  }

  // ACTION suggestions
  const actionMatches = text.matchAll(/ACTION\[([^\]]+)\]/g)
  const newActions = []
  for (const match of actionMatches) {
    const tagKey = `action_${match[0]}`
    if (!processedTags.has(tagKey)) {
      newActions.push(match[1])
      processedTags.add(tagKey)
    }
  }

  if (newActions.length > 0) {
    game.suggestedActions.push(...newActions)
    needsUIUpdate = true
  }

  if (needsUIUpdate) {
    updateInputContainer(game)
  }

  return newMessages
}

async function processGameCommands(game, character, text, processedTags = new Set()) {
  const data = loadData()

  // This is a fallback - most processing should happen in real-time
  // Parse location updates
  const locationMatch = text.match(/LOCATION\[([^\]]+)\]/)
  if (locationMatch) {
    game.currentLocation = locationMatch[1]
  }

  // Check for combat start (fallback - streaming handler should normally cover this)
  const combatStartMatch = text.match(/COMBAT_START\[([^\]]*)\]/)
  if (combatStartMatch) {
    game.combat.active = true
    game.combat.round = 1

    // If initiative not already set by streaming handler, roll basic player initiative.
    if (!Array.isArray(game.combat.initiative) || game.combat.initiative.length === 0) {
      if (character) {
        const diceProfile = buildDiceProfile(character)
        const dexMod = diceProfile.abilities?.dex ?? 0
        const initRoll = rollDice(`1d20${dexMod >= 0 ? `+${dexMod}` : dexMod}`)
        const meta = createRollMetadata({ sourceType: "initiative-fallback" })

        game.combat.initiative = [
          {
            id: "init_player",
            name: character.name || "Player",
            type: "player",
            roll: initRoll,
            total: initRoll.total,
            ...meta,
          },
        ]
        game.combat.currentTurnIndex = 0

        game.messages.push({
          id: `msg_${meta.rollId}_initiative_player_fb`,
          role: "system",
          content: `⚔️ Initiative (You): ${formatRoll(initRoll)}`,
          timestamp: meta.timestamp,
          hidden: false,
          metadata: {
            diceRoll: initRoll,
            type: "initiative",
            actorType: "player",
            actorName: character.name || "Player",
            ...meta,
          },
        })
      } else {
        game.combat.initiative = []
        game.combat.currentTurnIndex = 0
      }
    }

    game.messages.push({
      id: `msg_${Date.now()}_combat`,
      role: "system",
      content: `⚔️ Combat has begun! ${combatStartMatch[1] || ""}`.trim(),
      timestamp: new Date().toISOString(),
      hidden: false,
      metadata: { combatEvent: "start" },
    })
  }

  // Check for combat end
  const combatEndMatch = text.match(/COMBAT_END\[([^\]]+)\]/)
  if (combatEndMatch) {
    game.combat.active = false
    game.combat.round = 0
    game.combat.initiative = []
    game.combat.currentTurnIndex = 0

    game.messages.push({
      id: `msg_${Date.now()}_combat_end`,
      role: "system",
      content: `✓ Combat ended: ${combatEndMatch[1]}`,
      timestamp: new Date().toISOString(),
      hidden: false,
      metadata: { combatEvent: "end" },
    })
  }

  // Check for damage
  const damageMatch = text.match(/DAMAGE\[(\w+)\|(\d+)\]/)
  if (damageMatch) {
    const target = damageMatch[1]
    const amount = Number.parseInt(damageMatch[2])

    if (target.toLowerCase() === "player") {
      const oldHP = game.currentHP
      game.currentHP = Math.max(0, game.currentHP - amount)

      // Add system message
      game.messages.push({
        id: `msg_${Date.now()}_damage`,
        role: "system",
        content: `💔 You take ${amount} damage! (${oldHP} → ${game.currentHP} HP)`,
        timestamp: new Date().toISOString(),
        hidden: false,
        metadata: { damage: amount },
      })
    }
  }

  // Check for healing
  const healMatch = text.match(/HEAL\[(\w+)\|(\d+)\]/)
  if (healMatch) {
    const target = healMatch[1]
    const amount = Number.parseInt(healMatch[2])

    if (target.toLowerCase() === "player") {
      const oldHP = game.currentHP
      game.currentHP = Math.min(character.maxHP, game.currentHP + amount)
      const actualHealing = game.currentHP - oldHP

      // Add system message
      game.messages.push({
        id: `msg_${Date.now()}_heal`,
        role: "system",
        content: `💚 You heal ${actualHealing} HP! (${oldHP} → ${game.currentHP} HP)`,
        timestamp: new Date().toISOString(),
        hidden: false,
        metadata: { healing: actualHealing },
      })
    }
  }

  // Process roll requests - legacy numeric ROLL[...] only.
  // Semantic ROLL tags are handled in processGameCommandsRealtime during streaming.
  // Skip any rolls that were already processed during streaming (tracked in processedTags).
  const rollRequests = parseRollRequests(text).filter((request) => {
    const head = (request.notation || "").toLowerCase().trim()
    // Filter out semantic tags AND already-processed tags
    if (head === "skill" || head === "save" || head === "attack") return false
    
    // Check if this roll was already processed during streaming
    const tagKey = `roll_${request.fullMatch}`
    return !processedTags.has(tagKey)
  })

  if (rollRequests.length > 0) {
    for (const request of rollRequests) {
      let result

      if (request.type === "advantage") {
        result = rollAdvantage(request.notation)
      } else if (request.type === "disadvantage") {
        result = rollDisadvantage(request.notation)
      } else {
        result = rollDice(request.notation)
      }

      const meta = createRollMetadata({ sourceType: "legacy-fallback" })
      const rollMessage = {
        id: `msg_${meta.rollId}_roll_fallback`,
        role: "system",
        content:
          formatRoll(result) +
          (request.dc ? ` vs DC ${request.dc} - ${result.total >= request.dc ? "✓ Success!" : "✗ Failure"}` : ""),
        timestamp: new Date().toISOString(),
        hidden: false,
        metadata: {
          diceRoll: result,
          dc: request.dc,
          success: request.dc ? result.total >= request.dc : null,
          ...meta,
        },
      }

      game.messages.push(rollMessage)
      await sendRollResultToAI(game, result, request)
    }
  }

  saveData(data)
}

async function sendRollResultToAI(game, rollResult, request) {
  // Build a message with the roll result for AI context
  const resultText = `[Roll Result: ${rollResult.notation} = ${rollResult.total}${request.dc ? `, DC ${request.dc} - ${rollResult.total >= request.dc ? "SUCCESS" : "FAILURE"}` : ""}]`

  // This will be sent in the next message context automatically
  // The AI will see the roll result and continue the narrative
}

function buildSystemPrompt(character, game) {
  const data = loadData()
  const world = data.worlds.find((w) => w.id === game.worldId)
  return buildGameDMPrompt(character, game, world)
}

function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

function updateRollHistory(game) {
  const rollHistoryContainer = document.getElementById("roll-history-container")
  if (!rollHistoryContainer) return
  rollHistoryContainer.innerHTML = renderRollHistory(game.messages || [])
}

function setupRollHistoryToggle() {
  const toggle = document.getElementById("roll-history-toggle")
  const container = document.getElementById("roll-history-container")
  if (!toggle || !container) return

  toggle.addEventListener("click", (e) => {
    e.preventDefault()
    const visible = toggle.getAttribute("data-visible") === "1"
    if (visible) {
      container.style.display = "none"
      toggle.textContent = "Show Roll History"
      toggle.setAttribute("data-visible", "0")
    } else {
      container.style.display = "block"
      toggle.textContent = "Hide Roll History"
      toggle.setAttribute("data-visible", "1")
    }
  })
}

function updateInputContainer(game) {
  const inputContainer = document.querySelector(".input-container")
  if (!inputContainer) return

  inputContainer.innerHTML = `
    ${
      game.suggestedActions && game.suggestedActions.length > 0
        ? `
      <div class="suggested-actions">
        ${game.suggestedActions
          .map(
            (action) => `
          <button class="action-bubble" data-action="${escapeHtml(action)}">
            ${escapeHtml(action)}
          </button>
        `,
          )
          .join("")}
      </div>
    `
        : ""
    }
    <form id="chat-form" class="chat-form">
      <input 
        type="text" 
        id="player-input" 
        class="chat-input"
        placeholder="What do you do?"
        ${isStreaming ? "disabled" : ""}
      >
      <button type="submit" class="btn" ${isStreaming ? "disabled" : ""}>
        ${isStreaming ? "Sending..." : "Send"}
      </button>
    </form>
  `

  const chatForm = document.getElementById("chat-form")
  if (chatForm) {
    chatForm.addEventListener("submit", async (e) => {
      e.preventDefault()
      await handlePlayerInput()
    })
  }

  // Ensure roll history stays updated when suggested actions / input change
  if (game) {
    updateRollHistory(game)
  }

  document.querySelectorAll(".action-bubble").forEach((bubble) => {
    bubble.addEventListener("click", (e) => {
      e.preventDefault()
      e.stopPropagation()
      const action = e.currentTarget.getAttribute("data-action")
      const input = document.getElementById("player-input")
      if (input && action) {
        input.value = action
        input.focus()
      }
    })
  })

  setupRollHistoryToggle()
}

// Renamed function to avoid redeclaration
async function sendChatCompletionRequest(apiMessages, model) {
  try {
    const { getCleanModelId } = await import("../utils/model-utils.js")
    const cleanedModel = getCleanModelId(model)

    console.log("[v0] Using model:", cleanedModel, `${model.includes(":nitro") ? "(Nitro - fast throughput)" : ""}`)

    const response = await sendChatCompletion(apiMessages, cleanedModel)
    return response
  } catch (error) {
    console.error("[v0] Error in sendChatCompletion:", error)
    throw error
  }
}
