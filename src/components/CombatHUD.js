/**
 * CombatHUD Component
 * Displays active enemies and combat status
 */

export function renderCombatHUD(game) {
    if (!game.combat.active) return ""

    const enemies = game.combat.enemies || []
    if (enemies.length === 0) return ""

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
      
      <div class="w-full bg-surface-1 rounded-full h-2 mb-1 overflow-hidden">
        <div class="${hpColor} h-full transition-all duration-500" style="width: ${hpPercent}%"></div>
      </div>
      
      <div class="flex justify-between text-xs text-secondary">
        <span>HP: ${enemy.hp.current}/${enemy.hp.max}</span>
        <span>${enemy.conditions.join(", ")}</span>
      </div>
    </div>
  `
}
