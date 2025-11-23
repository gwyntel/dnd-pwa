/**
 * Game View
 * Main gameplay interface with chat and game state
 */

import { normalizeCharacter } from "../utils/storage.js"
import store from "../state/store.js"
import { navigateTo } from "../router.js"
import { getProvider } from "../utils/model-utils.js"
import { rollDice, rollAdvantage, rollDisadvantage, formatRoll, parseRollRequests } from "../utils/dice.js"
import { buildDiceProfile, rollSkillCheck, rollSavingThrow, rollAttack } from "../utils/dice5e.js"
import { getLocationIcon, getConditionIcon, Icons } from "../data/icons.js"
import { buildGameDMPrompt } from "../utils/prompts/game-dm-prompt.js"
import {
  stripTags,
  parseMarkdown,
  createBadgeToken,
  renderInlineBadgeHtml,
  insertInlineBadges,
  processGameTagsRealtime,
  processGameTags
} from "../engine/TagProcessor.js"
import { tagParser } from "../engine/TagParser.js"
import {
  startCombat as engineStartCombat,
  endCombat as engineEndCombat,
  getCurrentTurnDescription
} from "../engine/CombatManager.js"
import {
  buildApiMessages,
  sanitizeMessagesForModel,
  trimRelationships,
  trimVisitedLocations,
  createRollMetadata
} from "../engine/GameLoop.js"
import { castSpell, startConcentration, endConcentration } from "../engine/SpellcastingManager.js"
import { shortRest, longRest, spendHitDice } from "../engine/RestManager.js"
import { UsageDisplay } from "../components/UsageDisplay.js"
import { RollHistory } from "../components/RollHistory.js"
import { LocationHistory } from "../components/LocationHistory.js"
import { RelationshipList } from "../components/RelationshipList.js"
import { ChatMessage } from "../components/ChatMessage.js"
import { CharacterHUD } from "../components/CharacterHUD.js"
import { renderCombatHUD } from "../components/CombatHUD.js"
import { renderLevelUpModal, attachLevelUpHandlers, resetLevelUpState } from "../components/LevelUpModal.js"

let currentGameId = null
let isStreaming = false
let userScrolledUp = false // Track if user has manually scrolled away from bottom
let levelUpModalOpen = false

// Roll batching system - collects multiple rolls before triggering follow-up
let rollBatch = []
let rollSettlingTimer = null
let pendingRollBatch = null // Stores batch that was deferred due to streaming
const ROLL_SETTLING_DELAY_MS = 500 // Wait 500ms after last roll before triggering follow-up

// Helper to check if user is at/near bottom of messages container
function isScrolledToBottom(container, threshold = 100) {
  if (!container) return true
  const { scrollTop, scrollHeight, clientHeight } = container
  return scrollHeight - scrollTop - clientHeight < threshold
}

// Smart scroll that respects user's scroll position
function smartScrollToBottom(container) {
  if (!container) return

  // Only auto-scroll if user is already near bottom
  if (isScrolledToBottom(container)) {
    container.scrollTop = container.scrollHeight
    userScrolledUp = false
  } else {
    userScrolledUp = true
  }
}

export function renderGameList() {
  const app = document.getElementById("app")
  const data = store.get()

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
  const data = store.get()
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
    worldId,
    narrativeModel: model,
    currentHP: character.maxHP,
    currentLocation: "Unknown",
    visitedLocations: [],
    questLog: [],
    inventory: [...character.inventory],
    currency: { gp: 0 },
    conditions: [],
    relationships: {},
    combat: {
      active: false,
      initiative: [],
      lastActor: null, // Track who acted last for turn alternation
    },
    restState: {
      lastShortRest: null,
      lastLongRest: null,
      shortRestsToday: 0
    },
    concentration: null,
    suggestedActions: [],
    messages: [],
    createdAt: new Date().toISOString(),
    lastPlayedAt: new Date().toISOString(),
    totalPlayTime: 0,
  }

  await store.update((state) => {
    state.games.push(game)
  }, { immediate: true })

  navigateTo(`/game/${gameId}`)
}

export async function renderGame(state = {}) {
  const gameId = state.params?.id
  if (!gameId) {
    navigateTo("/")
    return
  }

  currentGameId = gameId
  const data = store.get()

  const game = data.games.find((g) => g.id === gameId)

  if (!game) {
    navigateTo("/")
    return
  }

  // Check if we have a default model in settings
  if (!data.settings.defaultNarrativeModel) {
    console.log("[v0] No default model set in game view, redirecting to model selector")
    sessionStorage.setItem("redirectAfterModelSelect", `/game/${gameId}`)
    navigateTo("/models")
    return
  }

  // Always use the model from settings (user may have switched models)
  if (game.narrativeModel !== data.settings.defaultNarrativeModel) {
    console.log(`[v0] Updating game model from ${game.narrativeModel} to settings model ${data.settings.defaultNarrativeModel}`)
    game.narrativeModel = data.settings.defaultNarrativeModel
    await store.update((state) => {
      const g = state.games.find((g) => g.id === game.id)
      if (g) g.narrativeModel = data.settings.defaultNarrativeModel
    }, { immediate: true })
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
          <!-- Enhanced game header with location icon and usage -->
          <div class="game-header">
            <div class="game-header-left">
              <h2>${game.title}</h2>
              <p class="text-secondary text-sm">
                ${getLocationIcon(game.currentLocation)} <strong>${game.currentLocation}</strong>
              </p>
            </div>
            <div id="usage-display" class="usage-display">
              ${UsageDisplay(game)}
            </div>
          </div>

          <div id="messages-container" class="messages-container">
            ${renderMessages(game.messages)}
          </div>
          
          <div class="input-container">
            ${game.suggestedActions && game.suggestedActions.length > 0
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
            ${game.currentHP === 0 ? `
              <button id="death-save-btn" class="btn btn-danger mt-2" style="width: 100%; background-color: var(--error-color, #f44336); color: white; font-weight: bold;" ${isStreaming ? 'disabled' : ''}>
                💀 Roll Death Save
              </button>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Character + Rolls below chat for fullscreen chat-first layout -->
      <div class="game-below-chat">
        <div class="card" id="character-card">
          ${CharacterHUD(game, character)}
        </div>

        <div class="card rest-controls">
          <h3>Rest</h3>
          <div class="flex gap-2">
            <button id="short-rest-btn" class="btn btn-secondary flex-1" ${isStreaming ? 'disabled' : ''}>
              💤 Short Rest
            </button>
            <button id="long-rest-btn" class="btn btn-secondary flex-1" ${isStreaming ? 'disabled' : ''}>
              🛏️ Long Rest
            </button>
          </div>
          ${character.hitDice && character.hitDice.current > 0 ? `
            <button id="spend-hit-dice-btn" class="btn btn-outline mt-2" style="width: 100%" ${isStreaming ? 'disabled' : ''}>
              🎲 Spend Hit Dice (${character.hitDice.current} available)
            </button>
          ` : ''}
        </div>

        <div class="card">
          <h3>Inventory</h3>
          ${Array.isArray(game.inventory) && game.inventory.length > 0
      ? `
            <ul class="inventory-list">
              ${game.inventory
        .map((it) => {
          const qty = typeof it.quantity === "number" ? it.quantity : 1
          const label = escapeHtml(it.item || "")
          const eq = it.equipped ? " (eq.)" : ""
          return `<li>${qty}x ${label}${eq}</li>`
        })
        .join("")}
            </ul>
          `
      : `<p class="text-secondary text-sm">No items in inventory.</p>`
    }
        </div>

        <div class="card">
          <h3 class="rolls-title">Recent Rolls</h3>
          <div id="roll-history-container" class="roll-history-container">
            ${RollHistory(game.messages)}
          </div>
        </div>

        <div class="card">
          <h3>Locations Visited</h3>
          <div id="location-history-container" class="location-history-container">
            ${LocationHistory(game)}
          </div>
        </div>

        <div class="card">
          <h3>Relationships</h3>
          <div id="relationships-container" class="relationships-container">
            ${RelationshipList(game)}
          </div>
        </div>
      </div>
    </div>

    ${levelUpModalOpen ? `
      <div class="modal-overlay" onclick="if(event.target === this) window.closeLevelUp()">
        <div class="modal-container">
          ${renderLevelUpModal(character, window.closeLevelUp)}
        </div>
      </div>
    ` : ''}
  `

  // Attach Level Up Handlers if modal is open
  if (levelUpModalOpen) {
    attachLevelUpHandlers(game, character, () => {
      renderGame({ params: { id: currentGameId } }) // Re-render on change
    })
  }



  // Window handlers for Level Up
  window.openLevelUpModal = () => {
    resetLevelUpState()
    levelUpModalOpen = true
    renderGame({ params: { id: currentGameId } })
  }

  window.closeLevelUp = () => {
    levelUpModalOpen = false
    renderGame({ params: { id: currentGameId } })
  }

  // Auto-scroll to bottom initially
  const messagesContainer = document.getElementById("messages-container")
  messagesContainer.scrollTop = messagesContainer.scrollHeight
  userScrolledUp = false

  // Track user scrolling to detect when they scroll away from bottom
  messagesContainer.addEventListener("scroll", () => {
    const isAtBottom = isScrolledToBottom(messagesContainer)
    userScrolledUp = !isAtBottom
  })

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

  // Setup location fast travel click handlers
  setupLocationFastTravel(game)

  // Rest button handlers - prefill input for AI narration
  document.getElementById('death-save-btn')?.addEventListener('click', () => {
    if (isStreaming) return
    const input = document.getElementById('player-input')
    if (input) {
      input.value = "I make a death saving throw."
      input.focus()
    }
  })

  document.getElementById('short-rest-btn')?.addEventListener('click', () => {
    if (isStreaming) return
    const input = document.getElementById('player-input')
    if (input) {
      input.value = "I take a short rest."
      input.focus()
    }
  })

  document.getElementById('long-rest-btn')?.addEventListener('click', () => {
    if (isStreaming) return
    const input = document.getElementById('player-input')
    if (input) {
      input.value = "I take a long rest."
      input.focus()
    }
  })

  document.getElementById('spend-hit-dice-btn')?.addEventListener('click', () => {
    if (isStreaming) return
    const input = document.getElementById('player-input')
    if (input) {
      input.value = "I spend a hit die to heal."
      input.focus()
    }
  })

  // If no messages, start the game
  if (game.messages.length === 0) {
    await startGame(game, character, data)
  }

  // Update last played timestamp
  game.lastPlayedAt = new Date().toISOString()
  await store.update((state) => {
    const g = state.games.find((g) => g.id === currentGameId)
    if (g) g.lastPlayedAt = game.lastPlayedAt
  })
}


function appendMessage(msg) {
  const messagesContainer = document.getElementById("messages-container")
  if (!messagesContainer) return

  const messageHTML = ChatMessage(msg)
  if (!messageHTML) return

  // Create a temporary container for the rendered message
  const div = document.createElement("div")
  div.innerHTML = messageHTML

  // Check if element with this msg.id already exists (for idempotency during streaming)
  const existingElement = document.querySelector(`[data-msg-id="${msg.id}"]`)

  if (existingElement) {
    // Replace the existing element with the newly rendered one
    existingElement.replaceWith(div.firstChild)
  } else {
    // Append all children from the temporary div
    while (div.firstChild) {
      messagesContainer.appendChild(div.firstChild)
    }
  }

  // Keep roll history in sync
  const rollHistoryContainer = document.getElementById("roll-history-container")
  if (rollHistoryContainer) {
    const data = store.get()
    const game = data.games.find((g) => g.id === currentGameId)
    if (game) {
      rollHistoryContainer.innerHTML = RollHistory(game.messages)
    }
  }
}

function renderMessages(messages) {
  if (messages.length === 0) {
    return '<div class="text-center text-secondary card-padded-lg">Starting your adventure...</div>'
  }
  return messages.map(ChatMessage).join("")
}

/**
 * Add a roll to the batch and start/reset the settling timer
 * @param {Object} rollData - { kind, label, roll }
 */
function addRollToBatch(rollData) {
  console.log("[dice][batch] Adding roll to batch:", rollData)
  rollBatch.push(rollData)

  // Clear existing timer and start new one
  if (rollSettlingTimer) {
    clearTimeout(rollSettlingTimer)
  }

  rollSettlingTimer = setTimeout(() => {
    processRollBatch()
  }, ROLL_SETTLING_DELAY_MS)
}

/**
 * Process all batched rolls and trigger follow-up narration
 */
async function processRollBatch() {
  if (rollBatch.length === 0) return

  console.log("[dice][batch] Processing roll batch:", rollBatch)

  const data = store.get()
  const game = data.games.find((g) => g.id === currentGameId)
  if (!game) return

  const rawCharacter = data.characters.find((c) => c.id === game.characterId)
  const character = rawCharacter ? normalizeCharacter(rawCharacter) : null
  if (!character) return

  // If streaming is active, defer this batch until streaming completes
  if (isStreaming) {
    console.log("[dice][batch] Deferring follow-up - streaming in progress")
    pendingRollBatch = [...rollBatch] // Save a copy of the current batch
    rollBatch = []
    return
  }

  // Build summary of all rolls
  const rollSummaries = rollBatch.map(({ kind, label, roll }) => {
    const outcome = roll.success === true
      ? "✓ Success"
      : roll.success === false
        ? "✗ Failure"
        : `Total: ${roll.total}`
    return `${kind} (${label}): ${roll.notation || "1d20"} = ${roll.total} (${outcome})`
  }).join(", ")

  console.log("[dice][batch] Sending follow-up for rolls:", rollSummaries)

  // Build follow-up prompt
  const followupPrompt = rollBatch.length === 1
    ? `The player just made a ${rollBatch[0].kind} roll for ${rollBatch[0].label}: ${rollBatch[0].roll.notation || "1d20"} = ${rollBatch[0].roll.total}. ${rollBatch[0].roll.success === true
      ? "The roll succeeded. Describe the positive outcome."
      : rollBatch[0].roll.success === false
        ? "The roll failed. Describe the consequences."
        : "Interpret this roll narratively."
    } Keep the response concise and continue the scene.`
    : `The player just made the following rolls: ${rollSummaries}. Narrate the outcomes briefly and continue the scene.`

  // Clear batch
  rollBatch = []

  // Create system message with roll results
  const rollSystemMessage = {
    id: `msg_${Date.now()}_roll_result`,
    role: "system",
    content: followupPrompt,
    timestamp: new Date().toISOString(),
    hidden: true, // Hidden from UI but visible to AI
    metadata: {
      rollResult: true,
      ephemeral: true
    }
  }

  // Add to game state so it's included in the API request
  game.messages.push(rollSystemMessage)

  // Optional: Append to UI if we wanted to show it (but it's hidden)
  // appendMessage(rollSystemMessage) 

  try {
    // Save state before sending to ensure message is persisted
    await store.update((state) => {
      const g = state.games.find((g) => g.id === currentGameId)
      if (g) {
        g.messages = game.messages
      }
    })

    await sendMessage(game, followupPrompt, data)
  } catch (e) {
    console.error("[dice][batch] Error during roll follow-up narration:", e)
  }
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
  console.log('[flow] ========== handlePlayerInput START ==========')
  const input = document.getElementById("player-input")
  const submitButton = document.querySelector('#chat-form button[type="submit"]')
  const text = input.value.trim()

  console.log('[flow] handlePlayerInput: user input', {
    text: text?.substring(0, 100),
    isStreaming
  })

  if (!text || isStreaming) {
    console.log('[flow] handlePlayerInput: ignoring (empty or streaming)')
    return
  }

  input.value = ""
  isStreaming = true
  input.disabled = true
  if (submitButton) {
    submitButton.disabled = true
    submitButton.textContent = "Sending..."
  }

  const data = store.get()
  const game = data.games.find((g) => g.id === currentGameId)

  console.log('[flow] handlePlayerInput: game state before user message', {
    gameId: game?.id,
    messageCount: game?.messages?.length
  })

  // Add user message
  const userMessage = {
    id: `msg_${Date.now()}`,
    role: "user",
    content: text,
    timestamp: new Date().toISOString(),
    hidden: false,
  }

  console.log('[flow] handlePlayerInput: adding user message', {
    id: userMessage.id,
    content: userMessage.content.substring(0, 50)
  })

  game.messages.push(userMessage)
  appendMessage(userMessage) // Append the user's message to the DOM

  game.suggestedActions = []

  console.log('[flow] handlePlayerInput: saving user message')
  await store.update((state) => {
    const g = state.games.find((g) => g.id === currentGameId)
    if (g) {
      g.messages = game.messages
      g.suggestedActions = game.suggestedActions
    }
  })

  const messagesContainer = document.getElementById("messages-container")
  if (messagesContainer) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight
  }

  updateInputContainer(game)

  // Send to LLM
  await sendMessage(game, text, data)
}

async function sendMessage(game, userText, data) {
  console.log('[flow] ========== sendMessage START ==========')
  console.log('[flow] sendMessage called', {
    gameId: game?.id,
    userText: userText?.substring(0, 100),
    currentMessageCount: game?.messages?.length
  })

  const gameRef = game // Use the passed-in game object
  if (!gameRef) {
    console.error("[v0] Game not found!")
    return
  }

  const rawCharacter = data.characters.find((c) => c.id === gameRef.characterId)
  const character = rawCharacter ? normalizeCharacter(rawCharacter) : null

  console.log('[flow] sendMessage: character loaded', {
    characterId: gameRef.characterId,
    characterName: character?.name
  })

  // Initialize cumulative usage if not present
  if (!gameRef.cumulativeUsage) {
    gameRef.cumulativeUsage = {
      promptTokens: 0,
      completionTokens: 0,
      reasoningTokens: 0,
      totalTokens: 0,
      totalCost: 0,
    }
  }

  // Reasoning panel configuration
  const reasoningPanelEnabled = !!data.settings?.reasoning?.displayPanel
  let lastReasoningText = ""
  let lastReasoningTokens = 0

  try {
    console.log('[flow] sendMessage: building API messages')

    // Get world for system prompt regeneration
    const world = data.worlds.find((w) => w.id === gameRef.worldId)

    const apiMessages = buildApiMessages(gameRef, character, world)

    console.log('[flow] sendMessage: API messages built', {
      count: apiMessages.length,
      roles: apiMessages.map(m => m.role)
    })

    const hasNonSystemMessage = apiMessages.some((m) => m.role === "user" || m.role === "assistant")

    if (!hasNonSystemMessage && apiMessages.length > 0) {
      console.error("[flow] [v0] Only system messages found, no user/assistant messages")
      throw new Error("Cannot send API request with only system messages")
    }

    if (apiMessages.length === 0) {
      console.error("[flow] [v0] No valid messages to send to API")
      throw new Error("Messages array cannot be empty - check the openrouter docs for chat completions please")
    }

    // Pass reasoning options to API if configured
    const reasoningOptions = {}
    if (data.settings.reasoning) {
      reasoningOptions.reasoningEnabled = data.settings.reasoning.enabled
      reasoningOptions.reasoningEffort = data.settings.reasoning.effort
      reasoningOptions.reasoningMaxTokens = data.settings.reasoning.maxTokens

      // Get model metadata to determine reasoning type
      const model = data.models?.find((m) => m.id === gameRef.narrativeModel)
      if (model) {
        reasoningOptions.modelSupportsReasoning = model.supportsReasoning
        reasoningOptions.reasoningType = model.reasoningType
      }
    }

    console.log('[flow] sendMessage: sending to API', {
      model: gameRef.narrativeModel,
      messageCount: apiMessages.length,
      reasoningOptions
    })

    // Get the configured provider and send the request
    const provider = await getProvider()
    const response = await provider.sendChatCompletion(apiMessages, gameRef.narrativeModel, reasoningOptions)

    console.log('[flow] sendMessage: API response received')

    let assistantMessage = ""
    let reasoningBuffer = ""
    let lastUsageData = null
    const assistantMsgId = `msg_${Date.now()}`
    const processedTags = new Set()
    // Reset rollTagState fresh for this sendMessage call
    // This ensures ACTION tags are only suppressed within the same streaming response,
    // not across multiple turns. Each new sendMessage (initial + follow-up narration) gets a fresh flag.
    const rollTagState = { found: false }
    // Explicitly set to false here to guarantee a clean start even if reused accidentally
    rollTagState.found = false

    gameRef.suggestedActions = []

    const assistantMsgIndex = gameRef.messages.length
    console.log('[flow] sendMessage: creating assistant message at index', assistantMsgIndex)

    gameRef.messages.push({
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      hidden: false,
      metadata: {},
    })

    console.log('[flow] sendMessage: starting stream processing')
    let insideThinkTag = false
    let thinkBuffer = ""
    let contentOutsideThink = ""

    for await (const chunk of provider.parseStreamingResponse(response)) {
      const choice = chunk.choices?.[0]
      // Use `delta?.content || ""` to ensure delta is not null/undefined for the logic below
      const delta = choice?.delta?.content || ""
      const reasoningDelta = choice?.delta?.reasoning

      // Capture usage data if present in any chunk
      if (chunk.usage) {
        lastUsageData = chunk.usage
      }

      // Handle OpenRouter-style reasoning deltas
      if (reasoningDelta) {
        reasoningBuffer += reasoningDelta
        lastReasoningText = reasoningBuffer

        // Update message metadata with streaming reasoning
        gameRef.messages[assistantMsgIndex].metadata.reasoning = reasoningBuffer
        gameRef.messages[assistantMsgIndex].metadata.reasoningType = 'openrouter'

        // Update reasoning display in real-time if panel is enabled
        if (reasoningPanelEnabled) {
          let streamingMsgElement = document.querySelector(`[data-msg-id="${assistantMsgId}"]`)

          if (!streamingMsgElement) {
            // Create the message element immediately when reasoning starts
            appendMessage(gameRef.messages[assistantMsgIndex])
            streamingMsgElement = document.querySelector(`[data-msg-id="${assistantMsgId}"]`)

            // Open the details element that was just created by appendMessage
            const reasoningDetails = streamingMsgElement?.querySelector(".reasoning-details")
            if (reasoningDetails) {
              reasoningDetails.open = true
            }
          }

          if (streamingMsgElement) {
            // Update existing reasoning body
            let reasoningBody = streamingMsgElement.querySelector(".reasoning-body")

            if (!reasoningBody) {
              // Create reasoning panel if it doesn't exist yet (fallback, shouldn't happen)
              const messageDiv = streamingMsgElement
              const reasoningPanel = document.createElement("div")
              reasoningPanel.className = "message-reasoning"
              reasoningPanel.innerHTML = `
                <details class="reasoning-details" open>
                  <summary class="reasoning-summary">
                    🧠 Reasoning
                    <span class="reasoning-tokens"></span>
                  </summary>
                  <div class="reasoning-body"></div>
                </details>
              `

              // Insert at the beginning of the message
              if (messageDiv.firstChild) {
                messageDiv.insertBefore(reasoningPanel, messageDiv.firstChild)
              } else {
                messageDiv.appendChild(reasoningPanel)
              }

              reasoningBody = reasoningPanel.querySelector(".reasoning-body")
            }

            if (reasoningBody) {
              reasoningBody.innerHTML = escapeHtml(reasoningBuffer).replace(/\n/g, "<br>")

              // Auto-scroll reasoning body to bottom as it streams
              reasoningBody.scrollTop = reasoningBody.scrollHeight
            }
          }
        }
      }

      // We process content (delta) even if it's an empty string,
      // because we need to handle tags and UI updates on every chunk.
      // The `if (delta)` check was too restrictive for hybrid models.
      // The `|| ""` above ensures `delta` is always a string.

      // Parse <think> tags in the delta for real-time reasoning extraction
      let processedDelta = delta
      let i = 0

      while (i < processedDelta.length) {
        if (!insideThinkTag) {
          // Look for opening <think> tag
          const thinkStart = processedDelta.indexOf('<think>', i)
          if (thinkStart !== -1) {
            // Add content before <think> to message
            const beforeThink = processedDelta.substring(i, thinkStart)
            contentOutsideThink += beforeThink
            assistantMessage += beforeThink

            // Enter think tag mode
            insideThinkTag = true
            i = thinkStart + 7 // Skip past '<think>'

            // Mark that we have reasoning and set type
            gameRef.messages[assistantMsgIndex].metadata.reasoningType = 'think_tags'
          } else {
            // No <think> tag found, add rest to message
            const remaining = processedDelta.substring(i)
            contentOutsideThink += remaining
            assistantMessage += remaining
            break
          }
        } else {
          // Look for closing </think> tag
          const thinkEnd = processedDelta.indexOf('</think>', i)
          if (thinkEnd !== -1) {
            // Add content to think buffer
            const thinkContent = processedDelta.substring(i, thinkEnd)
            thinkBuffer += thinkContent

            // Exit think tag mode
            insideThinkTag = false
            i = thinkEnd + 8 // Skip past '</think>'
          } else {
            // No closing tag yet, add rest to think buffer
            const remaining = processedDelta.substring(i)
            thinkBuffer += remaining
            break
          }
        }
      }

      // Update reasoning if we have think content
      if (thinkBuffer) {
        lastReasoningText = thinkBuffer
        gameRef.messages[assistantMsgIndex].metadata.reasoning = thinkBuffer

        // Update reasoning display in real-time if panel is enabled
        if (reasoningPanelEnabled) {
          let streamingMsgElement = document.querySelector(`[data-msg-id="${assistantMsgId}"]`)

          if (!streamingMsgElement) {
            // Create the message element immediately when reasoning starts
            appendMessage(gameRef.messages[assistantMsgIndex])
            streamingMsgElement = document.querySelector(`[data-msg-id="${assistantMsgId}"]`)

            // Open the details element
            const reasoningDetails = streamingMsgElement?.querySelector(".reasoning-details")
            if (reasoningDetails) {
              reasoningDetails.open = true
            }
          }

          if (streamingMsgElement) {
            let reasoningBody = streamingMsgElement.querySelector(".reasoning-body")

            if (!reasoningBody) {
              // Create reasoning panel
              const messageDiv = streamingMsgElement
              const reasoningPanel = document.createElement("div")
              reasoningPanel.className = "message-reasoning"
              reasoningPanel.innerHTML = `
                <details class="reasoning-details" open>
                  <summary class="reasoning-summary">
                    🧠 Reasoning
                    <span class="reasoning-tokens"></span>
                  </summary>
                  <div class="reasoning-body"></div>
                </details>
              `

              if (messageDiv.firstChild) {
                messageDiv.insertBefore(reasoningPanel, messageDiv.firstChild)
              } else {
                messageDiv.appendChild(reasoningPanel)
              }

              reasoningBody = reasoningPanel.querySelector(".reasoning-body")
            }

            if (reasoningBody) {
              reasoningBody.innerHTML = escapeHtml(thinkBuffer).replace(/\n/g, "<br>")
              reasoningBody.scrollTop = reasoningBody.scrollHeight
            }
          }
        }
      }

      // Update the stored content (without think tags)
      gameRef.messages[assistantMsgIndex].content = assistantMessage

      console.log('[flow] sendMessage: delta received', {
        deltaLength: delta.length,
        totalContentLength: assistantMessage.length,
        thinkBufferLength: thinkBuffer.length,
        insideThinkTag,
        messageId: assistantMsgId
      })

      // Find or create streaming message element only once per streaming session
      // Subsequent delta chunks should only update the existing element, not re-append
      let streamingMsgElement = document.querySelector(`[data-msg-id="${assistantMsgId}"]`)

      // This is a key part of the fix: if we have content OR reasoning, we need to ensure
      // the message element exists in the DOM.
      if ((delta || reasoningDelta) && !streamingMsgElement) {
        // First delta with content: append message to DOM
        appendMessage(gameRef.messages[assistantMsgIndex])
        streamingMsgElement = document.querySelector(`[data-msg-id="${assistantMsgId}"]`)
      }

      // Collapse reasoning panel when actual content (not think) starts arriving
      if (contentOutsideThink.trim() && reasoningPanelEnabled) {
        const reasoningDetails = streamingMsgElement?.querySelector(".reasoning-details")
        if (reasoningDetails && reasoningDetails.open) {
          reasoningDetails.open = false
        }
      }

      if (streamingMsgElement) {
        const contentElement = streamingMsgElement.querySelector(".message-content")
        if (contentElement) {
          const cleanContent = stripTags(assistantMessage)
          contentElement.innerHTML = insertInlineBadges(parseMarkdown(cleanContent))
        }
      }

      const newMessages = await processGameTagsRealtime(gameRef, character, assistantMessage, processedTags, {
        onRoll: addRollToBatch
      })
      if (newMessages.length > 0) {
        console.log('[flow] sendMessage: adding new system messages from realtime processing', {
          count: newMessages.length,
          ids: newMessages.map(m => m.id)
        })
        newMessages.forEach((msg) => {
          gameRef.messages.push(msg)
          appendMessage(msg)
        })
      }

      const messagesContainer = document.getElementById("messages-container")
      if (messagesContainer) {
        smartScrollToBottom(messagesContainer)
      }

      const gameHeader = document.querySelector(".game-header p")
      if (gameHeader) {
        gameHeader.textContent = `${getLocationIcon(gameRef.currentLocation)} ${gameRef.currentLocation}`
      }

      // Debounced save during streaming via Store
      await store.update((state) => {
        const g = state.games.find((g) => g.id === currentGameId)
        if (g) {
          Object.assign(g, gameRef)
        }

        // Save character changes (e.g., XP gains, learned spells, etc.)
        const char = state.characters.find((c) => c.id === gameRef.characterId)
        if (char && character) {
          // Update XP if changed
          if (character.xp) {
            char.xp = character.xp
          }
          // Update known spells if changed
          if (character.knownSpells) {
            char.knownSpells = character.knownSpells
          }
        }
      }, { debounceDelay: 100 })

      // Refresh CharacterHUD to show updated HP, XP, spell slots, etc.
      refreshCharacterHUD(gameRef, character)
    }


    console.log('[flow] sendMessage: stream complete, running final processGameCommands')
    await processGameTags(gameRef, character, assistantMessage, processedTags, data)


    // Update Combat HUD if combat state changed (e.g., enemies spawned)
    // Combat HUD is now part of the character card
    const characterCard = document.getElementById('character-card')
    if (characterCard) {
      console.log('[game.js] Updating Character Card (includes Combat HUD) after processGameTags', {
        combatActive: gameRef.combat.active,
        enemyCount: gameRef.combat.enemies?.length || 0
      })
      characterCard.innerHTML = CharacterHUD(gameRef, character)
    }

    // Note: <think> tag extraction is now handled during streaming, no post-processing needed
    gameRef.messages[assistantMsgIndex].content = assistantMessage

    console.log('[flow] sendMessage: final message state', {
      totalMessages: gameRef.messages.length,
      assistantMessageLength: assistantMessage.length,
      lastMessages: gameRef.messages.slice(-5).map(m => ({
        id: m.id,
        role: m.role,
        contentPreview: m.content?.substring(0, 50)
      }))
    })

    // Combat reminder system: If combat is still active after AI response, inject reminder
    if (gameRef.combat.active) {
      const { tags } = tagParser.parse(assistantMessage)
      const hasCombatEnd = tags.some(tag => tag.type === 'COMBAT_END')

      if (!hasCombatEnd) {
        // Combat is ongoing - add reminder message
        console.log('[combat] Adding combat reminder for AI')
        const reminderMsg = {
          id: `msg_${Date.now()}_combat_reminder`,
          role: "system",
          content: "⚔️ Combat is still active. Continue narrating combat actions or use COMBAT_END[reason] to end combat.",
          timestamp: new Date().toISOString(),
          hidden: true, // Hidden from UI but visible to AI
          metadata: {
            combatReminder: true,
            ephemeral: true // Mark for later cleanup
          },
        }
        gameRef.messages.push(reminderMsg)
      }
    }

    // Update final reasoning metadata with token count if we have usage data
    if (lastReasoningText) {
      gameRef.messages[assistantMsgIndex].metadata.reasoning = lastReasoningText

      // Update token count in the UI if panel exists
      if (lastUsageData) {
        const usage = provider.extractUsage({ usage: lastUsageData })
        if (usage.reasoningTokens > 0) {
          gameRef.messages[assistantMsgIndex].metadata.reasoningTokens = usage.reasoningTokens

          // Update the token count display in the reasoning summary
          const streamingMsgElement = document.querySelector(`[data-msg-id="${assistantMsgId}"]`)
          if (streamingMsgElement) {
            const tokenSpan = streamingMsgElement.querySelector(".reasoning-tokens")
            if (tokenSpan) {
              tokenSpan.textContent = `(${usage.reasoningTokens} tokens)`
            }
          }
        }
      }
    }

    // Update cumulative usage if we have usage data
    if (lastUsageData) {
      const usage = provider.extractUsage({ usage: lastUsageData })

      // Add to cumulative totals
      gameRef.cumulativeUsage.promptTokens += usage.promptTokens
      gameRef.cumulativeUsage.completionTokens += usage.completionTokens
      gameRef.cumulativeUsage.reasoningTokens += usage.reasoningTokens
      gameRef.cumulativeUsage.totalTokens += usage.totalTokens

      // Calculate and add cost
      // Ensure models are loaded in data
      if (!data.models || data.models.length === 0) {
        console.warn('[v0] Models not loaded, fetching to enable cost tracking...')
        try {
          data.models = await provider.fetchModels()
          await store.update((state) => {
            state.models = data.models
          })
        } catch (error) {
          console.error('[v0] Failed to fetch models for cost tracking:', error)
        }
      }

      const models = data.models || []
      const currentModel = models.find((m) => m.id === gameRef.narrativeModel)
      if (currentModel && currentModel.pricing) {
        const cost = provider.calculateCost(usage, currentModel.pricing)
        gameRef.cumulativeUsage.totalCost += cost
        console.log('[v0] Cost calculated:', {
          usage,
          pricing: currentModel.pricing,
          cost,
          cumulativeCost: gameRef.cumulativeUsage.totalCost
        })
      } else {
        console.warn('[v0] Cannot calculate cost - model not found or missing pricing:', {
          modelId: gameRef.narrativeModel,
          hasModels: models.length > 0,
          modelFound: !!currentModel,
          hasPricing: currentModel?.pricing ? true : false
        })
      }

      // Update the usage display in the header
      updateUsageDisplay(gameRef)
    }

    // Save immediately after streaming and post-processing completes
    // This ensures the message is persisted even if user exits quickly
    console.log('[flow] sendMessage: saving data', {
      gameId: gameRef.id,
      messageCount: gameRef.messages.length
    })
    await store.update((state) => {
      const g = state.games.find((g) => g.id === currentGameId)
      if (g) {
        Object.assign(g, gameRef)
      }

      // Save character changes (e.g., XP gains, learned spells, etc.)
      const char = state.characters.find((c) => c.id === gameRef.characterId)
      if (char && character) {
        // Update XP if changed
        if (character.xp) {
          char.xp = character.xp
        }
        // Update known spells if changed
        if (character.knownSpells) {
          char.knownSpells = character.knownSpells
        }
      }
    }, { immediate: true })
    updateInputContainer(gameRef)
    console.log('[flow] ========== sendMessage END (success) ==========')
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
    await store.update((state) => {
      const g = state.games.find((g) => g.id === currentGameId)
      if (g) {
        g.messages = gameRef.messages
      }
    })
  } finally {
    console.log('[flow] sendMessage: cleanup in finally block')
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

    // Check if there's a pending roll batch that was deferred during streaming
    if (pendingRollBatch && pendingRollBatch.length > 0) {
      console.log('[dice][batch] Processing deferred roll batch after streaming completed')
      rollBatch = pendingRollBatch
      pendingRollBatch = null

      // Process the deferred batch
      setTimeout(() => {
        processRollBatch()
      }, 100) // Small delay to ensure streaming cleanup is complete
    }

    console.log('[flow] ========== sendMessage END (finally) ==========')
  }
}




function buildSystemPrompt(character, game) {
  const data = store.get()
  const world = data.worlds.find((w) => w.id === game.worldId)
  const prompt = buildGameDMPrompt(character, game, world)

  // Log the system prompt for debugging
  console.log('========== SYSTEM PROMPT ==========')
  console.log(prompt)
  console.log('===================================')

  return prompt
}

function updateUsageDisplay(game) {
  const usageDisplay = document.getElementById("usage-display")
  if (usageDisplay) {
    usageDisplay.innerHTML = UsageDisplay(game)
  }
}

function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

function updateRollHistory(game) {
  const rollHistoryContainer = document.getElementById("roll-history-container")
  if (!rollHistoryContainer) return
  rollHistoryContainer.innerHTML = RollHistory(game.messages || [])
}

function updateLocationHistory(game) {
  const locationHistoryContainer = document.getElementById("location-history-container")
  if (!locationHistoryContainer) return
  locationHistoryContainer.innerHTML = LocationHistory(game)
  // Re-attach fast travel handlers after updating DOM
  setupLocationFastTravel(game)
}

function updatePlayerStats(game) {
  const data = store.get()
  const rawCharacter = data.characters.find((c) => c.id === game.characterId)
  const character = rawCharacter ? normalizeCharacter(rawCharacter) : null

  if (!character) return

  // Find the character card container and re-render using CharacterHUD
  const characterCard = document.getElementById("character-card")
  if (characterCard) {
    characterCard.innerHTML = CharacterHUD(game, character)
  }

  // Update inventory display - find the inventory card by searching for all cards with h3 "Inventory"
  const cards = document.querySelectorAll(".card")
  for (const card of cards) {
    const h3 = card.querySelector("h3")
    if (h3 && h3.textContent.trim() === "Inventory") {
      const inventoryHTML = Array.isArray(game.inventory) && game.inventory.length > 0
        ? `
          <h3>Inventory</h3>
          <ul class="inventory-list">
            ${game.inventory
          .map((it) => {
            const qty = typeof it.quantity === "number" ? it.quantity : 1
            const label = escapeHtml(it.item || "")
            const eq = it.equipped ? " (eq.)" : ""
            return `<li>${qty}x ${label}${eq}</li>`
          })
          .join("")}
          </ul>
        `
        : `
          <h3>Inventory</h3>
          <p class="text-secondary text-sm">No items in inventory.</p>
        `

      card.innerHTML = inventoryHTML
      break
    }
  }
}

function updateRelationshipsDisplay(game) {
  const relationshipsContainer = document.getElementById("relationships-container")
  if (!relationshipsContainer) return
  relationshipsContainer.innerHTML = RelationshipList(game)
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

function setupLocationFastTravel(game) {
  const container = document.getElementById("location-history-container")
  if (!container || !Array.isArray(game.visitedLocations)) return

  container.querySelectorAll(".location-chip").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault()
      const loc = e.currentTarget.getAttribute("data-location")
      if (!loc) return

      // Prefill the input with fast travel message
      const input = document.getElementById("player-input")
      if (input) {
        input.value = `Fast travel to ${loc}`
        input.focus()
      }
    })
  })
}

function updateInputContainer(game) {
  const inputContainer = document.querySelector(".input-container")
  if (!inputContainer) return

  inputContainer.innerHTML = `
    ${game.suggestedActions && game.suggestedActions.length > 0
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
    setupLocationFastTravel(game)
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

/**
 * Refresh the CharacterHUD without full re-render
 * @param {Object} game - The game object
 * @param {Object} character - The character object
 */
function refreshCharacterHUD(game, character) {
  const container = document.getElementById("character-card")
  if (container) {
    // Ensure we have the latest HP from game if available
    // Note: game.currentHP is the source of truth for HP in the HUD
    container.innerHTML = CharacterHUD(game, character)
  }
}
