/**
 * Character Templates View
 * Dedicated page to browse and start from beginner-friendly templates.
 */

import { loadData } from "../utils/storage.js"
import { navigateTo } from "../router.js"
import { BEGINNER_TEMPLATES } from "./characterTemplates.js"

function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

export function renderCharacterTemplatesView() {
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
      <div style="display:flex; justify-content: space-between; align-items: center; gap: 1rem; margin: 2rem 0 1.5rem;">
        <div>
          <h1 style="margin:0;">Starter Character Templates</h1>
          <p class="text-secondary" style="margin:0.35rem 0 0; font-size:0.9rem;">
            Pick a beginner-friendly archetype, then customize every detail on the create page.
          </p>
        </div>
        <a href="/characters/new" class="btn-secondary">Create with AI / From Scratch</a>
      </div>

      <div class="grid grid-3">
        ${BEGINNER_TEMPLATES.map((t) => renderTemplateCard(t)).join("")}
      </div>
    </div>
  `

  // Wire up "Use This Character" buttons
  document.querySelectorAll("[data-template-id]").forEach((card) => {
    const btn = card.querySelector("button.use-template-btn")
    if (!btn) return
    btn.addEventListener("click", (e) => {
      e.stopPropagation()
      const id = card.getAttribute("data-template-id")
      if (!id) return
      // Navigate to creator, then apply template via query/route state convention.
      navigateTo(`/characters/new?template=${encodeURIComponent(id)}`)
    })
  })
}

function renderTemplateCard(t) {
  return `
    <div class="card" data-template-id="${escapeHtml(t.id)}" style="cursor:default; display:flex; flex-direction:column; justify-content:space-between;">
      <div>
        <div style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem;">
          <h3 style="margin:0;">${t.icon || "🎲"} ${escapeHtml(t.name)}</h3>
          <span class="badge" style="font-size:0.7rem; text-transform:capitalize;">${escapeHtml(
            t.difficulty || "beginner",
          )}</span>
        </div>
        <p class="text-secondary" style="margin:0.25rem 0 0.35rem 0; font-size:0.8rem;">
          Level ${t.level} ${escapeHtml(t.race)} ${escapeHtml(t.class)} • ${escapeHtml(t.role)}
        </p>
        <p class="text-secondary" style="margin:0 0 0.35rem 0; font-size:0.8rem;">
          ${escapeHtml(t.tagline)}
        </p>
        <p class="text-secondary" style="margin:0 0 0.35rem 0; font-size:0.75rem;">
          Best for: ${t.bestFor.map((b) => escapeHtml(b)).join(" • ")}
        </p>
        <div style="display:flex; gap:0.35rem; flex-wrap:wrap; font-size:0.75rem; margin-bottom:0.35rem;">
          <span class="badge">HP ${t.maxHP}</span>
          <span class="badge">AC ${t.armorClass}</span>
          <span class="badge">STR ${t.stats.strength}</span>
          <span class="badge">DEX ${t.stats.dexterity}</span>
          <span class="badge">CON ${t.stats.constitution}</span>
        </div>
      </div>
      <button class="btn use-template-btn" style="margin-top:0.5rem; width:100%;">Use This Character</button>
    </div>
  `
}
