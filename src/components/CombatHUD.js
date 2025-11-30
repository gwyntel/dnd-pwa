/**
 * CombatHUD Component
 * Displays active enemies and combat status
 */

export function renderCombatHUD(game) {
  console.log('[CombatHUD] Rendering', {
    active: game.combat.active,
    enemyCount: game.combat.enemies?.length || 0,
    enemies: game.combat.enemies
  })

  if (!game.combat.active) {
    console.log('[CombatHUD] Combat not active, hiding HUD')
    return ""
  }

  const enemies = game.combat.enemies || []
  if (enemies.length === 0) {
    console.log('[CombatHUD] No enemies, hiding HUD')
    return ""
  }

  return `
    <div class="combat-hud card card-padded-sm mb-3">
      <div class="flex justify-between items-center mb-2">
        <h3 class="text-sm uppercase tracking-wider text-secondary m-0">Combat Tracker</h3>
        <span class="badge badge-red">Round ${game.combat.round || 1}</span>
      </div>
      
      <div class="combat-enemies grid gap-2">
        ${enemies.map(enemy => renderEnemyCard(enemy)).join("")}
      </div>
    </div>
  `
}

function renderEnemyCard(enemy) {
  const isDead = enemy.hp.current <= 0
  const hpPercent = Math.max(0, Math.min(100, (enemy.hp.current / enemy.hp.max) * 100))

  let hpColor = "bg-green-500"
  if (hpPercent < 50) hpColor = "bg-yellow-500"
  if (hpPercent < 20) hpColor = "bg-red-500"
  if (isDead) hpColor = "bg-gray-500"

  return `
    <div class="enemy-card p-2 border rounded ${isDead ? 'opacity-50 grayscale' : 'bg-surface-2'}">
      <div class="flex justify-between items-center mb-1">
        <strong class="${isDead ? 'line-through text-secondary' : ''}">${enemy.name}</strong>
        <span class="text-xs text-secondary">AC ${enemy.ac}</span>
      </div>
      
      <div class="w-full bg-surface-1 rounded-full h-2 mb-1 overflow-hidden relative">
        <div class="${hpColor} h-full transition-all duration-500" style="width: ${hpPercent}%"></div>
        ${enemy.tempHP > 0 ? `
          <div class="bg-blue-400 h-full absolute top-0 left-0 opacity-50" style="width: ${Math.min(100, (enemy.tempHP / enemy.hp.max) * 100)}%"></div>
        ` : ''}
      </div>
      
      <div class="flex justify-between text-xs text-secondary">
        <span>HP: ${enemy.hp.current}/${enemy.hp.max} ${enemy.tempHP > 0 ? `(+${enemy.tempHP})` : ''}</span>
        <span>${enemy.conditions.join(", ")}</span>
      </div>

      ${(enemy.resistances?.length || enemy.immunities?.length || enemy.vulnerabilities?.length) ? `
        <div class="text-[10px] mt-1 flex flex-wrap gap-1">
          ${(enemy.immunities || []).map(i => `<span class="text-green-400" title="Immune">🛡️${i.slice(0, 3)}</span>`).join('')}
          ${(enemy.resistances || []).map(r => `<span class="text-blue-400" title="Resistant">🛡️${r.slice(0, 3)}</span>`).join('')}
          ${(enemy.vulnerabilities || []).map(v => `<span class="text-red-400" title="Vulnerable">💔${v.slice(0, 3)}</span>`).join('')}
        </div>
      ` : ''}
    </div>
  `
}
