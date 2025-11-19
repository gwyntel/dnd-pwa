/**
 * RelationshipList Component
 * Renders NPC relationships with sentiment indicators
 */

function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

export function RelationshipList(game) {
  const relationships = game.relationships && typeof game.relationships === 'object' ? game.relationships : {}
  const entries = Object.entries(relationships)

  if (entries.length === 0) {
    return '<p class="text-secondary text-sm">No relationships tracked yet.</p>'
  }

  return `
    <ul class="relationship-list">
      ${entries
        .map(([entity, value]) => {
          const numValue = typeof value === 'number' ? value : 0
          const sentiment = numValue > 0 ? 'positive' : numValue < 0 ? 'negative' : 'neutral'
          const icon = numValue > 0 ? '😊' : numValue < 0 ? '😠' : '😐'
          return `
            <li class="relationship-item relationship-${sentiment}">
              <span class="relationship-entity">${icon} ${escapeHtml(entity)}</span>
              <span class="relationship-value">${numValue > 0 ? '+' : ''}${numValue}</span>
            </li>
          `
        })
        .join("")}
    </ul>
  `
}
