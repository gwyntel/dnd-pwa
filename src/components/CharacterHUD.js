/**
 * CharacterHUD Component
 * Renders character stats, HP, inventory, and status effects
 */

import { getConditionIcon } from "../data/icons.js"

function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

export function CharacterHUD(game, character) {
  return `
    <div class="character-header">
      <div class="character-header-left">
        <h3>${character.name}</h3>
        <p class="text-secondary character-subtitle">Level ${character.level} ${character.race} ${character.class}</p>
      </div>
      ${
        game.conditions && game.conditions.length > 0
          ? `
        <div class="character-header-right">
          <div class="status-chips">
            ${game.conditions
              .map((c) => {
                const name = typeof c === "string" ? c : c.name
                return `<span class="status-chip">${getConditionIcon(name)} ${escapeHtml(name)}</span>`
              })
              .join("")}
          </div>
        </div>
        `
          : ""
      }
    </div>
    
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
      <div><strong>Gold</strong><br>${game.currency?.gp ?? 0} gp</div>
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

    ${renderCombatIndicator(game)}
  `
}

function renderCombatIndicator(game) {
  if (!game.combat.active) {
    return ""
  }

  const turnDescription = renderCurrentTurn(game)

  return `
    <div class="combat-indicator mt-2">
      <strong>⚔️ IN COMBAT</strong>
      <p class="text-secondary" style="font-size: 0.875rem; margin: 0.25rem 0 0; opacity: 0.9;">
        ${turnDescription}
      </p>
    </div>
  `
}

function renderCurrentTurn(game) {
  if (!game.combat.active || !game.combat.initiative || game.combat.initiative.length === 0) {
    return ""
  }
  
  const currentIndex = game.combat.currentTurnIndex || 0
  const current = game.combat.initiative[currentIndex]
  
  if (!current) {
    return ""
  }
  
  const turnText = current.type === "player" ? "Your turn" : `${current.name}'s turn`
  return ` • ${turnText}`
}
