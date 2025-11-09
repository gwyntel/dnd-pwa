/**
 * Game View
 * Main gameplay interface with chat and game state
 */

import { loadData, saveData, debouncedSave, normalizeCharacter } from "../utils/storage.js"
import { navigateTo } from "../router.js"
import { sendChatCompletion, parseStreamingResponse } from "../utils/openrouter.js"
import { rollDice, rollAdvantage, rollDisadvantage, formatRoll, parseRollRequests } from "../utils/dice.js"

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
    <div class="card text-center" style="padding: 3rem;">
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
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Game Title *</label>
          <input type="text" id="game-title" required placeholder="Enter adventure title">
        </div>
        
        <div class="mb-3">
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Select Character *</label>
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
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">World Setting *</label>
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
          <p class="text-secondary mt-1" style="font-size: 0.875rem;">
            <a href="/worlds">Manage worlds</a>
          </p>
        </div>
        
        <div class="mb-3">
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Narrative Model</label>
          <select id="game-model">
            <option value="">Use default (${data.settings.defaultNarrativeModel || "not set"})</option>
          </select>
          <p class="text-secondary mt-1" style="font-size: 0.875rem;">
            <a href="/models">Change default model</a>
          </p>
        </div>
        
        <button type="submit" class="btn" style="width: 100%;">Start Adventure</button>
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
      <div class="game-sidebar">
        <div class="card">
          <h3>${character.name}</h3>
          <p class="text-secondary">Level ${character.level} ${character.race} ${character.class}</p>
          
          <div class="stat-bar mt-2">
            <div class="flex justify-between mb-1">
              <span>HP</span>
              <span>${game.currentHP}/${character.maxHP}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${(game.currentHP / character.maxHP) * 100}%"></div>
            </div>
          </div>
          
          <div class="mt-2">
            <strong>AC:</strong> ${character.armorClass}
          </div>
          
          <div class="stats-grid mt-2">
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
            <div class="combat-indicator mt-3">
              <strong>⚔️ IN COMBAT</strong>
              <p class="text-secondary" style="font-size: 0.875rem;">Round ${game.combat.round}</p>
            </div>
          `
              : ""
          }
        </div>
      </div>
      
      <div class="game-main">
        <div class="card" style="height: 100%; display: flex; flex-direction: column;">
          <div class="game-header">
            <h2>${game.title}</h2>
            <p class="text-secondary">${game.currentLocation}</p>
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
            <form id="chat-form" style="display: flex; gap: 0.5rem;">
              <input 
                type="text" 
                id="player-input" 
                placeholder="What do you do?" 
                style="flex: 1;"
                ${isStreaming ? "disabled" : ""}
              >
              <button type="submit" class="btn" ${isStreaming ? "disabled" : ""}>
                ${isStreaming ? "Sending..." : "Send"}
              </button>
            </form>
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
  if (msg.role === "user") {
    className += " message-user"
  } else if (msg.role === "assistant") {
    className += " message-assistant"
  } else if (msg.role === "system") {
    className += " message-system"
    if (msg.metadata?.diceRoll) className += " message-dice"
    else if (msg.metadata?.damage) className += " message-damage"
    else if (msg.metadata?.healing) className += " message-healing"
    else if (msg.metadata?.combatEvent) className += " message-combat"
  }

  const cleanContent = stripTags(msg.content || '')

  // Do not render empty assistant messages unless they have dice roll metadata
  if (msg.role === 'assistant' && !cleanContent.trim() && !msg.metadata?.diceRoll) {
    return ''
  }

  const messageHTML = `
    <div class="${className}" data-msg-id="${msg.id}">
      <div class="message-content">${parseMarkdown(cleanContent)}</div>
      ${msg.metadata?.diceRoll ? `<div class="dice-result">${formatRoll(msg.metadata.diceRoll)}</div>` : ""}
    </div>
  `
  return messageHTML
}

function appendMessage(msg) {
  const messagesContainer = document.getElementById("messages-container")
  if (!messagesContainer) return

  const messageHTML = renderSingleMessage(msg)
  if (!messageHTML) return // Don't append if the message is empty

  const div = document.createElement('div')
  div.innerHTML = messageHTML

  // Append the new message element(s) from the rendered HTML
  while (div.firstChild) {
    messagesContainer.appendChild(div.firstChild)
  }
}

function renderMessages(messages) {
  if (messages.length === 0) {
    return '<div class="text-center text-secondary" style="padding: 2rem;">Starting your adventure...</div>'
  }
  return messages.map(renderSingleMessage).join("")
}

function stripTags(text) {
  // Remove all game tags but keep the content inside when appropriate
  let cleaned = text

  // LOCATION tags - keep the label text
  cleaned = cleaned.replace(/LOCATION\[([^\]]+)\]/g, "$1")

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

  // Suggested actions
  cleaned = cleaned.replace(/\n*ACTION\[([^\]]+)\]\n*/g, "")

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
      const delta = chunk.choices?.[0]?.delta?.content
      if (delta) {
        assistantMessage += delta
        gameRef.messages[assistantMsgIndex].content = assistantMessage

        const streamingMsgElement = document.querySelector(`[data-msg-id="${assistantMsgId}"]`)

        if (!streamingMsgElement) {
          appendMessage(gameRef.messages[assistantMsgIndex])
        } else {
          const contentElement = streamingMsgElement.querySelector('.message-content')
          if (contentElement) {
            const cleanContent = stripTags(assistantMessage)
            contentElement.innerHTML = parseMarkdown(cleanContent)
          }
        }

        const newMessages = await processGameCommandsRealtime(gameRef, character, assistantMessage, processedTags)
        if (newMessages.length > 0) {
          newMessages.forEach(msg => {
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
          gameHeader.textContent = gameRef.currentLocation
        }

        debouncedSave(data, 100)
      }
    }

    await processGameCommands(gameRef, character, assistantMessage)
    gameRef.messages[assistantMsgIndex].content = assistantMessage
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
  const newMessages = [];
  let needsUIUpdate = false;

  // Helpers for inventory / currency / conditions

  const ensureInventory = () => {
    if (!Array.isArray(game.inventory)) {
      game.inventory = [];
    }
  };

  const ensureCurrency = () => {
    if (!game.currency || typeof game.currency.gp !== "number") {
      game.currency = { gp: 0 };
    }
  };

  const ensureConditions = () => {
    if (!Array.isArray(game.conditions)) {
      game.conditions = [];
    }
  };

  const upsertItem = (rawName, deltaQty, { equip, unequip } = {}) => {
    ensureInventory();
    const name = (rawName || "").trim();
    if (!name) return null;

    const findIndex = () =>
      game.inventory.findIndex(
        (it) => typeof it.item === "string" && it.item.toLowerCase() === name.toLowerCase(),
      );

    let idx = findIndex();
    if (idx === -1 && deltaQty > 0) {
      game.inventory.push({ item: name, quantity: deltaQty, equipped: false });
      idx = findIndex();
    }

    if (idx === -1) {
      return null;
    }

    const item = game.inventory[idx];
    const oldQty = typeof item.quantity === "number" ? item.quantity : 0;
    const newQty = Math.max(0, oldQty + deltaQty);

    item.quantity = newQty;

    if (equip === true) {
      item.equipped = true;
    } else if (unequip === true) {
      item.equipped = false;
    }

    if (item.quantity === 0) {
      game.inventory.splice(idx, 1);
    }

    return { name: item.item, oldQty, newQty, equipped: !!item.equipped };
  };

  const changeGold = (deltaRaw) => {
    const delta = Number.parseInt(deltaRaw, 10);
    if (Number.isNaN(delta) || delta === 0) return null;
    ensureCurrency();
    const before = game.currency.gp;
    let after = before + delta;
    if (after < 0) after = 0;
    game.currency.gp = after;
    return { before, after, applied: after - before };
  };

  const addStatus = (raw) => {
    ensureConditions();
    const name = (raw || "").trim();
    if (!name) return false;

    const exists = game.conditions.some((c) => {
      if (typeof c === "string") return c.toLowerCase() === name.toLowerCase();
      return c && typeof c.name === "string" && c.name.toLowerCase() === name.toLowerCase();
    });
    if (exists) return false;

    game.conditions.push({ name });
    return true;
  };

  const removeStatus = (raw) => {
    ensureConditions();
    const name = (raw || "").trim();
    if (!name) return false;

    const before = game.conditions.length;
    game.conditions = game.conditions.filter((c) => {
      if (typeof c === "string") return c.toLowerCase() !== name.toLowerCase();
      return !(c && typeof c.name === "string" && c.name.toLowerCase() === name.toLowerCase());
    });
    return game.conditions.length !== before;
  };

  // LOCATION updates
  const locationMatches = text.matchAll(/LOCATION\[([^\]]+)\]/g);
  for (const match of locationMatches) {
    const tagKey = `location_${match[0]}`;
    if (!processedTags.has(tagKey)) {
      game.currentLocation = match[1];
      processedTags.add(tagKey);
    }
  }

  // COMBAT_START
  const combatStartMatches = text.matchAll(/COMBAT_START\[([^\]]+)\]/g);
  for (const match of combatStartMatches) {
    const tagKey = `combat_start_${match[0]}`;
    if (!processedTags.has(tagKey)) {
      game.combat.active = true;
      game.combat.round = 1;

      newMessages.push({
        id: `msg_${Date.now()}_combat`,
        role: "system",
        content: `⚔️ Combat has begun! ${match[1]}`,
        timestamp: new Date().toISOString(),
        hidden: false,
        metadata: { combatEvent: "start" },
      });
      processedTags.add(tagKey);
    }
  }

  // COMBAT_END
  const combatEndMatches = text.matchAll(/COMBAT_END\[([^\]]+)\]/g);
  for (const match of combatEndMatches) {
    const tagKey = `combat_end_${match[0]}`;
    if (!processedTags.has(tagKey)) {
      game.combat.active = false;
      game.combat.round = 0;
      game.combat.initiative = [];

      newMessages.push({
        id: `msg_${Date.now()}_combat`,
        role: "system",
        content: `✓ Combat ended: ${match[1]}`,
        timestamp: new Date().toISOString(),
        hidden: false,
        metadata: { combatEvent: "end" },
      });
      processedTags.add(tagKey);
    }
  }

  // DAMAGE
  const damageMatches = text.matchAll(/DAMAGE\[(\w+)\|(\d+)\]/g);
  for (const match of damageMatches) {
    const tagKey = `damage_${match[0]}`;
    if (!processedTags.has(tagKey)) {
      const target = match[1];
      const amount = Number.parseInt(match[2], 10);

      if (target.toLowerCase() === "player") {
        const oldHP = game.currentHP;
        game.currentHP = Math.max(0, game.currentHP - amount);

        newMessages.push({
          id: `msg_${Date.now()}_damage`,
          role: "system",
          content: `💔 You take ${amount} damage! (${oldHP} → ${game.currentHP} HP)`,
          timestamp: new Date().toISOString(),
          hidden: false,
          metadata: { damage: amount },
        });
        processedTags.add(tagKey);
      }
    }
  }

  // HEAL
  const healMatches = text.matchAll(/HEAL\[(\w+)\|(\d+)\]/g);
  for (const match of healMatches) {
    const tagKey = `heal_${match[0]}`;
    if (!processedTags.has(tagKey)) {
      const target = match[1];
      const amount = Number.parseInt(match[2], 10);

      if (target.toLowerCase() === "player") {
        const oldHP = game.currentHP;
        game.currentHP = Math.min(character.maxHP, game.currentHP + amount);
        const actualHealing = game.currentHP - oldHP;

        newMessages.push({
          id: `msg_${Date.now()}_heal`,
          role: "system",
          content: `💚 You heal ${actualHealing} HP! (${oldHP} → ${game.currentHP} HP)`,
          timestamp: new Date().toISOString(),
          hidden: false,
          metadata: { healing: actualHealing },
        });
        processedTags.add(tagKey);
      }
    }
  }

  // ROLL
  const rollMatches = text.matchAll(/ROLL\[([^\]]+)\]/g);
  for (const match of rollMatches) {
    const tagKey = `roll_${match[0]}`;
    if (!processedTags.has(tagKey)) {
      const parts = match[1].split("|");
      const request = {
        notation: parts[0],
        type: parts[1] || "normal",
        dc: parts[2] ? Number.parseInt(parts[2], 10) : null,
      };

      let result;
      if (request.type === "advantage") {
        result = rollAdvantage(request.notation);
      } else if (request.type === "disadvantage") {
        result = rollDisadvantage(request.notation);
      } else {
        result = rollDice(request.notation);
      }

      newMessages.push({
        id: `msg_${Date.now()}_roll_${Math.random()}`,
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
        },
      });
      processedTags.add(tagKey);
    }
  }

  // INVENTORY_ADD[item|qty]
  const invAddMatches = text.matchAll(/INVENTORY_ADD\[([^\]|\|]+)\|?(\d+)?\]/g);
  for (const match of invAddMatches) {
    const tagKey = `inv_add_${match[0]}`;
    if (!processedTags.has(tagKey)) {
      const name = match[1];
      const qty = match[2] ? Number.parseInt(match[2], 10) : 1;
      const res = upsertItem(name, qty);
      if (res) {
        newMessages.push({
          id: `msg_${Date.now()}_inv_add`,
          role: "system",
          content: `📦 Gained ${qty} x ${res.name}.`,
          timestamp: new Date().toISOString(),
          hidden: false,
        });
      }
      processedTags.add(tagKey);
      needsUIUpdate = true;
    }
  }

  // INVENTORY_REMOVE[item|qty]
  const invRemoveMatches = text.matchAll(/INVENTORY_REMOVE\[([^\]|\|]+)\|?(\d+)?\]/g);
  for (const match of invRemoveMatches) {
    const tagKey = `inv_remove_${match[0]}`;
    if (!processedTags.has(tagKey)) {
      const name = match[1];
      const qty = match[2] ? Number.parseInt(match[2], 10) : 1;
      const res = upsertItem(name, -qty);
      if (res) {
        newMessages.push({
          id: `msg_${Date.now()}_inv_remove`,
          role: "system",
          content: `📦 Used/removed ${qty} x ${res.name}.`,
          timestamp: new Date().toISOString(),
          hidden: false,
        });
      }
      processedTags.add(tagKey);
      needsUIUpdate = true;
    }
  }

  // INVENTORY_EQUIP[item]
  const invEquipMatches = text.matchAll(/INVENTORY_EQUIP\[([^\]]+)\]/g);
  for (const match of invEquipMatches) {
    const tagKey = `inv_equip_${match[0]}`;
    if (!processedTags.has(tagKey)) {
      const res = upsertItem(match[1], 0, { equip: true });
      if (res) {
        newMessages.push({
          id: `msg_${Date.now()}_inv_equip`,
          role: "system",
          content: `🛡️ Equipped ${res.name}.`,
          timestamp: new Date().toISOString(),
          hidden: false,
        });
      }
      processedTags.add(tagKey);
      needsUIUpdate = true;
    }
  }

  // INVENTORY_UNEQUIP[item]
  const invUnequipMatches = text.matchAll(/INVENTORY_UNEQUIP\[([^\]]+)\]/g);
  for (const match of invUnequipMatches) {
    const tagKey = `inv_unequip_${match[0]}`;
    if (!processedTags.has(tagKey)) {
      const res = upsertItem(match[1], 0, { unequip: true });
      if (res) {
        newMessages.push({
          id: `msg_${Date.now()}_inv_unequip`,
          role: "system",
          content: `🛡️ Unequipped ${res.name}.`,
          timestamp: new Date().toISOString(),
          hidden: false,
        });
      }
      processedTags.add(tagKey);
      needsUIUpdate = true;
    }
  }

  // GOLD_CHANGE[delta]
  const goldMatches = text.matchAll(/GOLD_CHANGE\[(-?\d+)\]/g);
  for (const match of goldMatches) {
    const tagKey = `gold_${match[0]}`;
    if (!processedTags.has(tagKey)) {
      const res = changeGold(match[1]);
      if (res && res.applied !== 0) {
        const symbol = res.applied > 0 ? "+" : "";
        newMessages.push({
          id: `msg_${Date.now()}_gold`,
          role: "system",
          content: `💰 Gold: ${res.before} → ${res.after} (${symbol}${res.applied} gp)`,
          timestamp: new Date().toISOString(),
          hidden: false,
        });
      }
      processedTags.add(tagKey);
    }
  }

  // STATUS_ADD[name]
  const statusAddMatches = text.matchAll(/STATUS_ADD\[([^\]]+)\]/g);
  for (const match of statusAddMatches) {
    const tagKey = `status_add_${match[0]}`;
    if (!processedTags.has(tagKey)) {
      if (addStatus(match[1])) {
        newMessages.push({
          id: `msg_${Date.now()}_status_add`,
          role: "system",
          content: `⚠️ Status applied: ${match[1]}`,
          timestamp: new Date().toISOString(),
          hidden: false,
        });
      }
      processedTags.add(tagKey);
    }
  }

  // STATUS_REMOVE[name]
  const statusRemoveMatches = text.matchAll(/STATUS_REMOVE\[([^\]]+)\]/g);
  for (const match of statusRemoveMatches) {
    const tagKey = `status_remove_${match[0]}`;
    if (!processedTags.has(tagKey)) {
      if (removeStatus(match[1])) {
        newMessages.push({
          id: `msg_${Date.now()}_status_remove`,
          role: "system",
          content: `✅ Status removed: ${match[1]}`,
          timestamp: new Date().toISOString(),
          hidden: false,
        });
      }
      processedTags.add(tagKey);
    }
  }

  // ACTION suggestions
  const actionMatches = text.matchAll(/ACTION\[([^\]]+)\]/g);
  const newActions = [];
  for (const match of actionMatches) {
    const tagKey = `action_${match[0]}`;
    if (!processedTags.has(tagKey)) {
      newActions.push(match[1]);
      processedTags.add(tagKey);
    }
  }

  if (newActions.length > 0) {
    game.suggestedActions.push(...newActions);
    needsUIUpdate = true;
  }

  if (needsUIUpdate) {
    updateInputContainer(game);
  }

  return newMessages;
}

async function processGameCommands(game, character, text) {
  const data = loadData()

  // This is a fallback - most processing should happen in real-time
  // Parse location updates
  const locationMatch = text.match(/LOCATION\[([^\]]+)\]/)
  if (locationMatch) {
    game.currentLocation = locationMatch[1]
  }

  // Check for combat start
  const combatStartMatch = text.match(/COMBAT_START\[([^\]]+)\]/)
  if (combatStartMatch) {
    game.combat.active = true
    game.combat.round = 1

    // Add system message
    game.messages.push({
      id: `msg_${Date.now()}_combat`,
      role: "system",
      content: `⚔️ Combat has begun! ${combatStartMatch[1]}`,
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

    // Add system message
    game.messages.push({
      id: `msg_${Date.now()}_combat`,
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

  // Process roll requests - AI requests rolls, we perform them locally
  const rollRequests = parseRollRequests(text)
  if (rollRequests.length > 0) {
    for (const request of rollRequests) {
      let result

      // Handle advantage/disadvantage
      if (request.type === "advantage") {
        result = rollAdvantage(request.notation)
      } else if (request.type === "disadvantage") {
        result = rollDisadvantage(request.notation)
      } else {
        result = rollDice(request.notation)
      }

      // Add roll result as system message
      const rollMessage = {
        id: `msg_${Date.now()}_roll_${Math.random()}`,
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
        },
      }

      game.messages.push(rollMessage)

      // Send roll result back to AI for narrative continuation
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
  const modStr = (stat) => {
    const mod = Math.floor((stat - 10) / 2)
    return mod >= 0 ? `+${mod}` : `${mod}`
  }

  const data = loadData()
  const world = data.worlds.find((w) => w.id === game.worldId)
  const worldPrompt = world ? `**World Setting:**\n${world.systemPrompt}\n\n` : ""

  // Normalize currency
  const gold = game.currency && typeof game.currency.gp === "number" ? game.currency.gp : 0

  // Summarize key inventory (top 6 items by quantity / importance)
  const inventory = Array.isArray(game.inventory) ? game.inventory : []
  const inventorySummary = inventory
    .filter((it) => it && typeof it.item === "string")
    .slice(0, 6)
    .map((it) => {
      const qty = typeof it.quantity === "number" ? it.quantity : 1
      const equipped = it.equipped ? " (eq.)" : ""
      return `${qty}x ${it.item}${equipped}`
    })
    .join(", ")

  // Normalize conditions into names
  const conditions = Array.isArray(game.conditions) ? game.conditions : []
  const conditionNames = conditions
    .map((c) => {
      if (!c) return null
      if (typeof c === "string") return c
      if (typeof c.name === "string") return c.name
      return null
    })
    .filter(Boolean)

  const statusLineParts = []
  statusLineParts.push(`Gold: ${gold} gp`)
  if (inventorySummary) statusLineParts.push(`Key items: ${inventorySummary}`)
  if (conditionNames.length > 0) statusLineParts.push(`Active conditions: ${conditionNames.join(", ")}`)

  const statusLine =
    statusLineParts.length > 0 ? `\n\n**Current Resources & Status:** ${statusLineParts.join(" | ")}` : ""

  return `${worldPrompt}You are the Dungeon Master for a D&D 5e adventure. The player is:

**${character.name}** - Level ${character.level} ${character.race} ${character.class}
- HP: ${game.currentHP}/${character.maxHP}, AC: ${character.armorClass}, Speed: ${character.speed}ft
- Proficiency Bonus: +${character.proficiencyBonus}
- STR: ${character.stats.strength} (${modStr(character.stats.strength)}), DEX: ${character.stats.dexterity} (${modStr(character.stats.dexterity)}), CON: ${character.stats.constitution} (${modStr(character.stats.constitution)})
- INT: ${character.stats.intelligence} (${modStr(character.stats.intelligence)}), WIS: ${character.stats.wisdom} (${modStr(character.stats.wisdom)}), CHA: ${character.stats.charisma} (${modStr(character.stats.charisma)})
- Skills: ${character.skills.join(", ")}
- Features: ${character.features ? character.features.join(", ") : "None"}
${character.spells && character.spells.length > 0 ? `- Spells: ${character.spells.map((s) => s.name).join(", ")}` : ""}${statusLine}

**CRITICAL - Structured Output Tags (MUST USE EXACT FORMAT):**

You MUST use these tags in your narrative. The app parses them in real-time to update game state.

1. **LOCATION[location_name]** - Update current location
   - Format: LOCATION[Tavern] or LOCATION[Dark Forest Path]
   - Use when player moves to a new area
   - Example: "You enter the LOCATION[Rusty Dragon Inn]"

2. **ROLL[dice|type|DC]** - Request a dice roll from the app
   - Format: ROLL[1d20+3|normal|15]
   - dice: Standard notation (1d20+3, 2d6, etc.)
   - type: normal, advantage, or disadvantage
   - DC: Difficulty Class number (optional)
   - Example: "Make a Stealth check: ROLL[1d20+2|normal|12]"
   - The app will roll and show you the result

3. **COMBAT_START[description]** - Begin combat encounter
   - Format: COMBAT_START[Two goblins leap from the shadows!]
   - Use when enemies attack or player initiates combat
   - Example: "COMBAT_START[A dire wolf growls and attacks!]"

4. **COMBAT_END[outcome]** - End combat
   - Format: COMBAT_END[Victory! The goblins flee.]
   - Use when combat concludes
   - Example: "COMBAT_END[Defeated! The wolf collapses.]"

5. **DAMAGE[target|amount]** - Apply damage
   - Format: DAMAGE[player|5]
   - target: "player" (lowercase)
   - amount: number only
   - Example: "The goblin's arrow hits! DAMAGE[player|4]"

6. **HEAL[target|amount]** - Apply healing
   - Format: HEAL[player|8]
   - target: "player" (lowercase)
   - amount: number only
   - Example: "You drink the potion. HEAL[player|10]"

7. **ACTION[action_text]** - Suggest contextual actions
   - Format: ACTION[Search the room]
   - Provide 3-5 contextual action suggestions
   - Actions should be specific to the current situation
   - Examples: ACTION[Attack the goblin], ACTION[Search for traps], ACTION[Talk to the merchant]
   - Place all ACTION tags together in your response
   - These will appear as clickable buttons for the player

**Formatting Rules:**
- Use **bold** for emphasis: **important text**
- Use *italic* for thoughts: *I wonder what's inside*
- Use \`code\` for game terms: \`Sneak Attack\`
- Keep narratives 2-4 paragraphs
- Always include tags in your narrative text, not on separate lines

**Example Response:**
"You push open the creaking door and step into the LOCATION[Abandoned Chapel]. Dust motes dance in shafts of moonlight streaming through broken windows. In the center of the room, you spot a **glowing artifact** resting on an altar.

As you approach, you hear a low growl. A **skeletal guardian** rises from the shadows! COMBAT_START[Skeletal guardian attacks!]

Roll for initiative: ROLL[1d20+2|normal|0]

ACTION[Attack the skeleton]
ACTION[Grab the artifact and run]
ACTION[Try to reason with the guardian]
ACTION[Search for another exit]"

Current location: ${game.currentLocation}
${game.combat.active ? `Currently in combat (Round ${game.combat.round})` : ""}

Begin the adventure!`
}

function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
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
    <form id="chat-form" style="display: flex; gap: 0.5rem;">
      <input 
        type="text" 
        id="player-input" 
        placeholder="What do you do?" 
        style="flex: 1;"
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
}
