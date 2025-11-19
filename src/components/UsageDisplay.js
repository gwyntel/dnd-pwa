/**
 * UsageDisplay Component
 * Renders cumulative token usage and cost statistics
 */

import store from "../state/store.js"

export function UsageDisplay(game) {
  if (!game.cumulativeUsage || game.cumulativeUsage.totalTokens === 0) {
    return ""
  }

  const usage = game.cumulativeUsage
  const hasCost = usage.totalCost > 0

  // Get model context length to calculate percentage
  const data = store.get()
  const models = data.models || []
  const currentModel = models.find((m) => m.id === game.narrativeModel)
  
  // Prioritize user-configured context length for OpenAI and LM Studio
  let contextLength = currentModel?.contextLength || 8192 // Default fallback
  if (data.settings.provider === "openai" && data.settings.providers?.openai?.contextLength) {
    contextLength = data.settings.providers.openai.contextLength
  } else if (data.settings.provider === "lmstudio" && data.settings.providers?.lmstudio?.contextLength) {
    contextLength = data.settings.providers.lmstudio.contextLength
  }
  
  const contextPercent = ((usage.totalTokens / contextLength) * 100).toFixed(1)

  return `
    <div class="usage-stats">
      <div class="usage-stat">
        <span class="usage-stat-label">Context</span>
        <span class="usage-stat-value">${contextPercent}%</span>
      </div>
      ${
        hasCost
          ? `
      <div class="usage-stat usage-cost-stat">
        <span class="usage-stat-label">Cost</span>
        <span class="usage-stat-value">$${usage.totalCost.toFixed(4)}</span>
      </div>
      `
          : ""
      }
    </div>
  `
}
