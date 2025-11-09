/**
 * Game View
 * Main gameplay interface with chat and game state
 */

import { loadData, saveData, debouncedSave } from '../utils/storage.js';
import { navigateTo } from '../router.js';
import { sendChatCompletion, parseStreamingResponse } from '../utils/openrouter.js';
import { rollDice, rollAdvantage, rollDisadvantage, formatRoll, parseRollRequests } from '../utils/dice.js';

let currentGameId = null;
let isStreaming = false;

export function renderGameList() {
  const app = document.getElementById('app');
  const data = loadData();
  
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
      <div class="flex justify-between align-center mb-3">
        <h1>New Game</h1>
        <a href="/" class="btn-secondary">Cancel</a>
      </div>
      
      ${data.characters.length === 0 ? renderNoCharacters() : renderGameCreator(data)}
    </div>
  `;
  
  // Event listeners
  document.getElementById('game-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    createGame();
  });
}

function renderNoCharacters() {
  return `
    <div class="card text-center" style="padding: 3rem;">
      <h2>No Characters Available</h2>
      <p class="text-secondary mb-3">You need to create a character before starting a game.</p>
      <a href="/characters/new" class="btn">Create Character</a>
    </div>
  `;
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
            ${data.characters.map(char => `
              <option value="${char.id}">${char.name} - Level ${char.level} ${char.race} ${char.class}</option>
            `).join('')}
          </select>
        </div>
        
        <div class="mb-3">
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Narrative Model</label>
          <select id="game-model">
            <option value="">Use default (${data.settings.defaultNarrativeModel || 'not set'})</option>
          </select>
          <p class="text-secondary mt-1" style="font-size: 0.875rem;">
            <a href="/models">Change default model</a>
          </p>
        </div>
        
        <button type="submit" class="btn" style="width: 100%;">Start Adventure</button>
      </form>
    </div>
  `;
}

async function createGame() {
  const data = loadData();
  const characterId = document.getElementById('game-character').value;
  const title = document.getElementById('game-title').value.trim();
  const model = document.getElementById('game-model').value || data.settings.defaultNarrativeModel;
  
  if (!model) {
    alert('Please set a default narrative model in settings first.');
    return;
  }
  
  const character = data.characters.find(c => c.id === characterId);
  if (!character) {
    alert('Character not found.');
    return;
  }
  
  const gameId = `game_${Date.now()}`;
  const game = {
    id: gameId,
    title,
    characterId,
    narrativeModel: model,
    currentHP: character.maxHP,
    currentLocation: 'Unknown',
    questLog: [],
    inventory: [...character.inventory],
    conditions: [],
    combat: {
      active: false,
      round: 0,
      initiative: [],
      currentTurnIndex: 0
    },
    messages: [],
    createdAt: new Date().toISOString(),
    lastPlayedAt: new Date().toISOString(),
    totalPlayTime: 0
  };
  
  data.games.push(game);
  saveData(data);
  
  navigateTo(`/game/${gameId}`);
}

export async function renderGame(state = {}) {
  const gameId = state.params?.id;
  if (!gameId) {
    navigateTo('/');
    return;
  }
  
  currentGameId = gameId;
  const data = loadData();
  const game = data.games.find(g => g.id === gameId);
  
  if (!game) {
    navigateTo('/');
    return;
  }
  
  const character = data.characters.find(c => c.id === game.characterId);
  
  const app = document.getElementById('app');
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
          
          ${game.combat.active ? `
            <div class="combat-indicator mt-3">
              <strong>⚔️ IN COMBAT</strong>
              <p class="text-secondary" style="font-size: 0.875rem;">Round ${game.combat.round}</p>
            </div>
          ` : ''}
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
            <form id="chat-form" style="display: flex; gap: 0.5rem;">
              <input 
                type="text" 
                id="player-input" 
                placeholder="What do you do?" 
                style="flex: 1;"
                ${isStreaming ? 'disabled' : ''}
              >
              <button type="submit" class="btn" ${isStreaming ? 'disabled' : ''}>
                ${isStreaming ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Auto-scroll to bottom
  const messagesContainer = document.getElementById('messages-container');
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  // Form submission
  document.getElementById('chat-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handlePlayerInput();
  });
  
  // If no messages, start the game
  if (game.messages.length === 0) {
    await startGame(game, character);
  }
  
  // Update last played timestamp
  game.lastPlayedAt = new Date().toISOString();
  saveData(data);
}

function renderMessages(messages) {
  if (messages.length === 0) {
    return '<div class="text-center text-secondary" style="padding: 2rem;">Starting your adventure...</div>';
  }
  
  return messages.map(msg => {
    if (msg.hidden) return '';
    
    let className = 'message';
    if (msg.role === 'user') className += ' message-user';
    else if (msg.role === 'assistant') className += ' message-assistant';
    else className += ' message-system';
    
    return `
      <div class="${className}">
        <div class="message-content">${escapeHtml(msg.content).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>
        ${msg.metadata?.diceRoll ? `<div class="dice-result">${formatRoll(msg.metadata.diceRoll)}</div>` : ''}
      </div>
    `;
  }).join('');
}

async function startGame(game, character) {
  const data = loadData();
  const systemPrompt = buildSystemPrompt(character, game);
  
  const initialMessage = {
    role: 'system',
    content: systemPrompt
  };
  
  game.messages.push({
    id: `msg_${Date.now()}`,
    ...initialMessage,
    timestamp: new Date().toISOString(),
    hidden: true
  });
  
  saveData(data);
  
  // Request initial scene
  await sendMessage(game, 'Begin the adventure. Describe the opening scene and set the stage for the player. Use LOCATION[name] to set the starting location.');
}

async function handlePlayerInput() {
  const input = document.getElementById('player-input');
  const text = input.value.trim();
  
  if (!text || isStreaming) return;
  
  input.value = '';
  input.disabled = true;
  
  const data = loadData();
  const game = data.games.find(g => g.id === currentGameId);
  
  // Add user message
  const userMessage = {
    id: `msg_${Date.now()}`,
    role: 'user',
    content: text,
    timestamp: new Date().toISOString(),
    hidden: false
  };
  
  game.messages.push(userMessage);
  saveData(data);
  
  // Re-render to show user message
  await renderGame({ params: { id: currentGameId } });
  
  // Send to LLM
  await sendMessage(game, text);
}

async function sendMessage(game, userText) {
  isStreaming = true;
  const data = loadData();
  const character = data.characters.find(c => c.id === game.characterId);
  
  try {
    // Build messages for API
    const messages = game.messages
      .filter(m => !m.hidden || m.role === 'system')
      .map(m => ({ role: m.role, content: m.content }));
    
    // Add current user message if not already in history
    if (userText && !messages.find(m => m.role === 'user' && m.content === userText)) {
      messages.push({ role: 'user', content: userText });
    }
    
    const response = await sendChatCompletion(messages, game.narrativeModel);
    
    let assistantMessage = '';
    const assistantMsgId = `msg_${Date.now()}`;
    
    // Create placeholder message
    game.messages.push({
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      hidden: false
    });
    
    // Stream response
    for await (const chunk of parseStreamingResponse(response)) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        assistantMessage += delta;
        
        // Update message in game
        const msgIndex = game.messages.findIndex(m => m.id === assistantMsgId);
        game.messages[msgIndex].content = assistantMessage;
        
        // Update UI
        const messagesContainer = document.getElementById('messages-container');
        if (messagesContainer) {
          messagesContainer.innerHTML = renderMessages(game.messages);
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        debouncedSave(data, 100);
      }
    }
    
    // Process special commands in response
    await processGameCommands(game, character, assistantMessage);
    
    saveData(data);
    
  } catch (error) {
    console.error('Error sending message:', error);
    alert('Failed to send message: ' + error.message);
  } finally {
    isStreaming = false;
    const input = document.getElementById('player-input');
    if (input) {
      input.disabled = false;
      input.focus();
    }
  }
}

async function processGameCommands(game, character, text) {
  const data = loadData();
  
  // Parse location updates
  const locationMatch = text.match(/LOCATION\[([^\]]+)\]/);
  if (locationMatch) {
    game.currentLocation = locationMatch[1];
  }
  
  // Check for combat start
  const combatStartMatch = text.match(/COMBAT_START\[([^\]]+)\]/);
  if (combatStartMatch) {
    game.combat.active = true;
    game.combat.round = 1;
    
    // Add system message
    game.messages.push({
      id: `msg_${Date.now()}_combat`,
      role: 'system',
      content: `⚔️ Combat has begun! ${combatStartMatch[1]}`,
      timestamp: new Date().toISOString(),
      hidden: false,
      metadata: { combatEvent: 'start' }
    });
  }
  
  // Check for combat end
  const combatEndMatch = text.match(/COMBAT_END\[([^\]]+)\]/);
  if (combatEndMatch) {
    game.combat.active = false;
    game.combat.round = 0;
    game.combat.initiative = [];
    
    // Add system message
    game.messages.push({
      id: `msg_${Date.now()}_combat`,
      role: 'system',
      content: `✓ Combat ended: ${combatEndMatch[1]}`,
      timestamp: new Date().toISOString(),
      hidden: false,
      metadata: { combatEvent: 'end' }
    });
  }
  
  // Check for damage
  const damageMatch = text.match(/DAMAGE\[(\w+)\|(\d+)\]/);
  if (damageMatch) {
    const target = damageMatch[1];
    const amount = parseInt(damageMatch[2]);
    
    if (target.toLowerCase() === 'player') {
      const oldHP = game.currentHP;
      game.currentHP = Math.max(0, game.currentHP - amount);
      
      // Add system message
      game.messages.push({
        id: `msg_${Date.now()}_damage`,
        role: 'system',
        content: `💔 You take ${amount} damage! (${oldHP} → ${game.currentHP} HP)`,
        timestamp: new Date().toISOString(),
        hidden: false,
        metadata: { damage: amount }
      });
    }
  }
  
  // Check for healing
  const healMatch = text.match(/HEAL\[(\w+)\|(\d+)\]/);
  if (healMatch) {
    const target = healMatch[1];
    const amount = parseInt(healMatch[2]);
    
    if (target.toLowerCase() === 'player') {
      const oldHP = game.currentHP;
      game.currentHP = Math.min(character.maxHP, game.currentHP + amount);
      const actualHealing = game.currentHP - oldHP;
      
      // Add system message
      game.messages.push({
        id: `msg_${Date.now()}_heal`,
        role: 'system',
        content: `💚 You heal ${actualHealing} HP! (${oldHP} → ${game.currentHP} HP)`,
        timestamp: new Date().toISOString(),
        hidden: false,
        metadata: { healing: actualHealing }
      });
    }
  }
  
  // Process roll requests - AI requests rolls, we perform them locally
  const rollRequests = parseRollRequests(text);
  if (rollRequests.length > 0) {
    for (const request of rollRequests) {
      let result;
      
      // Handle advantage/disadvantage
      if (request.type === 'advantage') {
        result = rollAdvantage(request.notation);
      } else if (request.type === 'disadvantage') {
        result = rollDisadvantage(request.notation);
      } else {
        result = rollDice(request.notation);
      }
      
      // Add roll result as system message
      const rollMessage = {
        id: `msg_${Date.now()}_roll_${Math.random()}`,
        role: 'system',
        content: formatRoll(result) + (request.dc ? ` vs DC ${request.dc} - ${result.total >= request.dc ? '✓ Success!' : '✗ Failure'}` : ''),
        timestamp: new Date().toISOString(),
        hidden: false,
        metadata: { 
          diceRoll: result,
          dc: request.dc,
          success: request.dc ? result.total >= request.dc : null
        }
      };
      
      game.messages.push(rollMessage);
      
      // Send roll result back to AI for narrative continuation
      await sendRollResultToAI(game, result, request);
    }
  }
  
  saveData(data);
}

async function sendRollResultToAI(game, rollResult, request) {
  // Build a message with the roll result for AI context
  const resultText = `[Roll Result: ${rollResult.notation} = ${rollResult.total}${request.dc ? `, DC ${request.dc} - ${rollResult.total >= request.dc ? 'SUCCESS' : 'FAILURE'}` : ''}]`;
  
  // This will be sent in the next message context automatically
  // The AI will see the roll result and continue the narrative
}

function buildSystemPrompt(character, game) {
  const modStr = (stat) => {
    const mod = Math.floor((stat - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };
  
  return `You are the Dungeon Master for a D&D 5e adventure. The player is:

**${character.name}** - Level ${character.level} ${character.race} ${character.class}
- HP: ${game.currentHP}/${character.maxHP}, AC: ${character.armorClass}, Speed: ${character.speed}ft
- Proficiency Bonus: +${character.proficiencyBonus}
- STR: ${character.stats.strength} (${modStr(character.stats.strength)}), DEX: ${character.stats.dexterity} (${modStr(character.stats.dexterity)}), CON: ${character.stats.constitution} (${modStr(character.stats.constitution)})
- INT: ${character.stats.intelligence} (${modStr(character.stats.intelligence)}), WIS: ${character.stats.wisdom} (${modStr(character.stats.wisdom)}), CHA: ${character.stats.charisma} (${modStr(character.stats.charisma)})
- Skills: ${character.skills.join(', ')}
- Features: ${character.features.join(', ')}
${character.spells.length > 0 ? `- Spells: ${character.spells.map(s => s.name).join(', ')}` : ''}

**IMPORTANT - Structured Output Tags:**
- LOCATION[name] - Update current location (e.g., LOCATION[Dark Forest])
- ROLL[notation|type|DC] - Request a dice roll (e.g., ROLL[1d20+3|normal|15] or ROLL[1d20+2|advantage|12])
  - Types: normal, advantage, disadvantage
  - The app will perform the roll and show you the result
- COMBAT_START[description] - Start combat (e.g., COMBAT_START[Two goblins attack!])
- COMBAT_END[outcome] - End combat (e.g., COMBAT_END[Victory!])
- DAMAGE[target|amount] - Apply damage (e.g., DAMAGE[player|5])
- HEAL[target|amount] - Apply healing (e.g., HEAL[player|8])

**Guidelines:**
1. Create engaging, atmospheric narratives (2-4 paragraphs max)
2. When player actions require checks, use ROLL tags - the app handles the dice
3. Always tag location changes with LOCATION
4. Tag combat start/end, damage, and healing
5. After requesting a roll, wait for the result before continuing
6. Explain mechanics naturally for beginners
7. Present meaningful choices
8. Maintain story consistency

Current location: ${game.currentLocation}
${game.combat.active ? `Currently in combat (Round ${game.combat.round})` : ''}

Begin the adventure!`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
