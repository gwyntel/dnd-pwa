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
      <div class="page-header" style="margin: 2rem 0 1.5rem;">
        <div>
          <h1 class="page-title">Starter Character Templates</h1>
          <p class="text-secondary text-sm" style="margin-top: 0.35rem;">
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

  // Wire up template interactions
  document.querySelectorAll("[data-template-id]").forEach((card) => {
    const btn = card.querySelector("button.use-template-btn")

    // Dedicated button click: use template
    if (btn && !btn.dataset.bound) {
      btn.dataset.bound = "true"
      btn.addEventListener("click", (e) => {
        e.stopPropagation()
        const id = card.getAttribute("data-template-id")
        if (!id) return
        navigateTo(`/characters/new?template=${encodeURIComponent(id)}`)
      })
    }

    // Clicking anywhere on the card (except the button) should also use the template
    if (!card.dataset.bound) {
      card.dataset.bound = "true"
      card.style.cursor = "pointer"
      card.addEventListener("click", (e) => {
        if (e.target.closest("button.use-template-btn")) return
        const id = card.getAttribute("data-template-id")
        if (!id) return
        navigateTo(`/characters/new?template=${encodeURIComponent(id)}`)
      })
    }
  })
}

function renderTemplateCard(t) {
  return `
    <div class="card template-card card-clickable" data-template-id="${escapeHtml(t.id)}">
      <div>
        <div class="flex align-center justify-between gap-1">
          <h3>${t.icon || "🎲"} ${escapeHtml(t.name)}</h3>
          <span class="badge text-xs" style="text-transform: capitalize;">${escapeHtml(
            t.difficulty || "beginner",
          )}</span>
        </div>
        <p class="text-secondary text-sm" style="margin:0.25rem 0 0.35rem 0;">
          Level ${t.level} ${escapeHtml(t.race)} ${escapeHtml(t.class)} • ${escapeHtml(t.role)}
        </p>
        <p class="text-secondary text-sm" style="margin:0 0 0.35rem 0;">
          ${escapeHtml(t.tagline)}
        </p>
        <p class="text-secondary text-xs" style="margin:0 0 0.35rem 0;">
          Best for: ${t.bestFor.map((b) => escapeHtml(b)).join(" • ")}
        </p>
        <div class="flex gap-1 flex-wrap text-xs" style="margin-bottom:0.35rem;">
          <span class="badge">HP ${t.maxHP}</span>
          <span class="badge">AC ${t.armorClass}</span>
          <span class="badge">STR ${t.stats.strength}</span>
          <span class="badge">DEX ${t.stats.dexterity}</span>
          <span class="badge">CON ${t.stats.constitution}</span>
        </div>
      </div>
      <button class="btn use-template-btn btn-block" style="margin-top:0.5rem;">Use This Character</button>
    </div>
  `
}
