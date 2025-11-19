/**
 * LocationHistory Component
 * Renders visited locations as clickable chips
 */

import { getLocationIcon } from "../data/icons.js"

function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

export function LocationHistory(game) {
  if (!Array.isArray(game.visitedLocations) || game.visitedLocations.length === 0) {
    return '<p class="text-secondary text-sm">No locations recorded yet.</p>'
  }

  return `
    <div class="location-chips">
      ${game.visitedLocations
        .map((loc) => {
          const icon = getLocationIcon(loc)
          const safe = escapeHtml(loc)
          return `<button class="location-chip" data-location="${safe}">${icon} ${safe}</button>`
        })
        .join("")}
    </div>
  `
}
