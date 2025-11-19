/**
 * ChatMessage Component
 * Renders individual chat messages with formatting, reasoning, and dice rolls
 */

import { stripTags, parseMarkdown, insertInlineBadges } from "../engine/TagProcessor.js"
import { formatRoll } from "../utils/dice.js"
import { Icons } from "../data/icons.js"

function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

export function ChatMessage(msg) {
  if (msg.hidden) return ""

  let className = "message"
  let iconPrefix = ""

  if (msg.role === "user") {
    className += " message-user"
    iconPrefix = "👤 "
  } else if (msg.role === "assistant") {
    className += " message-assistant"
    iconPrefix = "🎭 "
  } else if (msg.role === "system") {
    className += " message-system"

    if (msg.metadata?.diceRoll) {
      className += " message-dice"
      iconPrefix = Icons.DICE + " "
    } else if (msg.metadata?.damage) {
      className += " message-damage"
      iconPrefix = Icons.DAMAGE + " "
    } else if (msg.metadata?.healing) {
      className += " message-healing"
      iconPrefix = Icons.HEAL + " "
    } else if (msg.metadata?.combatEvent === "start") {
      className += " message-combat"
      iconPrefix = Icons.COMBAT + " "
    } else if (msg.metadata?.combatEvent === "end") {
      className += " message-combat"
      iconPrefix = "✓ "
    }
  }

  const cleanContent = stripTags(msg.content || "")

  // Do not render empty assistant messages unless they have dice roll metadata or reasoning
  if (msg.role === "assistant" && !cleanContent.trim() && !msg.metadata?.diceRoll && !msg.metadata?.reasoning) {
    return ""
  }

  // Check if this message has reasoning content
  const hasReasoning = msg.role === "assistant" && msg.metadata?.reasoning
  const reasoning = hasReasoning ? msg.metadata.reasoning : ""
  const reasoningTokens = msg.metadata?.reasoningTokens || 0

  const messageHTML = `
    <div class="${className}" data-msg-id="${msg.id}">
      ${
        hasReasoning
          ? `
      <div class="message-reasoning">
        <details class="reasoning-details">
          <summary class="reasoning-summary">
            🧠 Reasoning
            ${
              reasoningTokens
                ? `<span class="reasoning-tokens">(${reasoningTokens} tokens)</span>`
                : ""
            }
          </summary>
          <div class="reasoning-body">
            ${escapeHtml(reasoning).replace(/\n/g, "<br>")}
          </div>
        </details>
      </div>
      `
          : ""
      }
      <div class="message-content">${iconPrefix}${insertInlineBadges(parseMarkdown(cleanContent))}</div>
      ${msg.metadata?.diceRoll ? `<div class="dice-result">${formatRoll(msg.metadata.diceRoll)}</div>` : ""}
      ${msg.metadata?.rollId ? `<div class="dice-meta">id: ${msg.metadata.rollId} • ${msg.metadata.timestamp || ""}</div>` : ""}
    </div>
  `
  return messageHTML
}
