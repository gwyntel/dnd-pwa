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
    <div class="flex items-center gap-3 mb-4" style="position: relative;">
      ${game.conditions && game.conditions.length > 0 ? `
        <div class="status-chips" style="position: absolute; top: 0; right: 0;">
          ${game.conditions.map(c => {
    const name = typeof c === "string" ? c : c.name
    return `<span class="status-chip text-xs">${getConditionIcon(name)} ${escapeHtml(name)}</span>`
  }).join("")}
        </div>
      ` : ''}
      <div class="avatar-container">
        <div class="avatar">${character.icon || '👤'}</div>
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="font-bold text-lg leading-tight truncate">${character.name}</h3>
            <div class="text-xs text-secondary truncate">Level ${character.level} ${character.race} ${character.class}</div>
          </div>
          
          <div class="flex flex-col items-end gap-2">
            ${renderLevelUpButton(character)}
          </div>
        </div>
      </div>
    </div>

    ${renderHPBar(character, game)}
    ${renderXPBar(character)}

    ${renderDeathSaves(game)}
    
    <div class="flex justify-between mb-3 mt-3 key-stats">
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
    ${renderSpellSlots(character)}
    ${renderSpellList(character)}
    ${renderConcentration(game)}
    ${renderClassResources(character)}
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

function renderSpellSlots(character) {
  const hasSpellSlots = Object.values(character.spellSlots || {})
    .some(slot => slot.max > 0)

  if (!hasSpellSlots) return ''

  return `
    <div class="spell-slots mt-3">
      <h4 style="font-size: 0.875rem; margin-bottom: 0.5rem;">Spell Slots</h4>
      <div class="spell-slots-grid">
        ${Object.entries(character.spellSlots)
      .filter(([_, slot]) => slot.max > 0)
      .map(([level, slot]) => `
            <div class="spell-slot-row">
              <span class="spell-slot-level">${level === '0' ? 'Cantrips' : `Level ${level}`}</span>
              <div class="spell-slot-dots">
                ${Array(slot.max).fill(0).map((_, i) => `
                  <span class="spell-slot-dot ${i < slot.current ? 'filled' : 'empty'}">●</span>
                `).join('')}
              </div>
              <span class="spell-slot-count">${slot.current}/${slot.max}</span>
            </div>
          `).join('')}
      </div>
    </div>
  `
}

function renderSpellList(character) {
  // Prefer prepared spells, fallback to known spells
  const spells = character.preparedSpells?.length > 0
    ? character.preparedSpells
    : character.knownSpells || []

  if (spells.length === 0) return ''

  // Group by level
  const spellsByLevel = spells.reduce((acc, spell) => {
    const level = spell.level || 0
    if (!acc[level]) acc[level] = []
    acc[level].push(spell)
    return acc
  }, {})

  return `
    <div class="spell-list mt-3">
      <h4 style="font-size: 0.875rem; margin-bottom: 0.5rem;">
        ${character.preparedSpells?.length > 0 ? 'Prepared Spells' : 'Known Spells'}
      </h4>
      <div class="spell-list-content">
        ${Object.entries(spellsByLevel)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([level, levelSpells]) => `
            <div class="spell-level-group mb-2">
              <div class="text-xs text-secondary uppercase font-bold mb-1">
                ${level === '0' ? 'Cantrips' : `Level ${level}`}
              </div>
              <div class="flex flex-wrap gap-1">
                ${levelSpells.map(spell => `
                  <span class="spell-chip" title="${spell.name}">
                    ${escapeHtml(spell.name)}
                  </span>
                `).join('')}
              </div>
            </div>
          `).join('')}
      </div>
    </div>
  `
}

function renderHitDice(character) {
  if (!character.hitDice || character.hitDice.max === 0) return ''

  return `
    <div class="hit-dice mt-2">
      <strong>Hit Dice:</strong> ${character.hitDice.current}/${character.hitDice.max} ${character.hitDice.dieType}
    </div>
  `
}

function renderConcentration(game) {
  if (!game.concentration) return ''

  return `
    <div class="concentration-indicator mt-2">
      <strong>🧠 Concentrating:</strong> ${escapeHtml(game.concentration.spellName)}
    </div>
  `
}

function renderClassResources(character) {
  if (!character.classResources || character.classResources.length === 0) return ''

  return `
    <div class="class-resources mt-2">
      <h4 style="font-size: 0.875rem; margin-bottom: 0.5rem;">Class Resources</h4>
      ${character.classResources.map(resource => `
        <div class="resource-row">
          <span>${escapeHtml(resource.name)}:</span>
          <span>${resource.current}/${resource.max}</span>
        </div>
      `).join('')}
    </div>
  `
}

function renderDeathSaves(game) {
  if (game.currentHP > 0) return ''

  const successes = game.deathSaves?.successes || 0
  const failures = game.deathSaves?.failures || 0

  return `
    <div class="death-saves-container">
      <div class="death-save-title">⚠️ Unconscious</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
        <div class="death-save-track">
          <div class="track-label" style="color: var(--success-color);">Successes</div>
          <div class="track-circles">
            ${[1, 2, 3].map(i => `
              <div class="death-save-circle success ${i <= successes ? 'filled' : ''}"></div>
            `).join('')}
          </div>
        </div>
        
        <div class="death-save-track">
          <div class="track-label" style="color: var(--error-color);">Failures</div>
          <div class="track-circles">
            ${[1, 2, 3].map(i => `
              <div class="death-save-circle failure ${i <= failures ? 'filled' : ''}"></div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `
}

function renderLevelUpButton(character) {
  if (!character.xp || character.xp.current < character.xp.max) return ''

  return `
    <button class="btn btn-sm btn-primary animate-pulse" onclick="window.openLevelUpModal()">
      ⬆️ Level Up!
    </button>
  `
}

function renderXPBar(character) {
  if (!character.xp) return ''

  const pct = Math.min(100, Math.max(0, (character.xp.current / character.xp.max) * 100))

  return `
    <div class="xp-bar-container mt-1" title="XP: ${character.xp.current} / ${character.xp.max}">
      <div class="xp-bar-fill" style="width: ${pct}%"></div>
    </div>
    <div class="text-xs text-right text-secondary" style="font-size: 0.7rem;">
      XP: ${character.xp.current} / ${character.xp.max}
    </div>
  `
}

function renderHPBar(character, game) {
  const currentHP = game.currentHP
  const maxHP = character.maxHP
  const pct = Math.min(100, Math.max(0, (currentHP / maxHP) * 100))

  let color = "var(--success-color, #4caf50)"
  if (currentHP <= maxHP * 0.25) color = "var(--error-color, #f44336)"
  else if (currentHP <= maxHP * 0.5) color = "var(--warning-color, #ff9800)"

  return `
    <div class="stat-bar mt-2">
      <div class="flex justify-between mb-1">
        <span style="font-weight: 500;">HP</span>
        <span>${currentHP}/${maxHP}</span>
      </div>
      <div class="progress-bar progress-bar-lg">
        <div
          class="progress-fill"
          style="width: ${pct}%; background-color: ${color};"
        ></div>
      </div>
    </div>
  `
}
