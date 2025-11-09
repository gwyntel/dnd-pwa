/**
 * Character Templates View
 * Browse and select character templates
 */

import { loadData } from "../utils/storage.js"
import { navigateTo } from "../router.js"

export function renderTemplates() {
  const app = document.getElementById("app")
  const data = loadData()
  const templates = data.characterTemplates || []

  app.innerHTML = `
    <nav>
      <div class="container">
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/characters">Characters</a></li>
          <li><a href="/settings">Settings</a></li>
        </ul>
      </div>
    </nav>
    
    <div class="container">
      <div class="flex justify-between align-center mb-3">
        <h1>Character Templates</h1>
        <a href="/characters" class="btn-secondary">Back</a>
      </div>
      
      ${templates.length === 0 ? renderNoTemplates() : renderTemplateList(templates)}
    </div>
  `

  // Add click handlers to template cards
  document.querySelectorAll(".template-card").forEach((card) => {
    card.addEventListener("click", () => {
      const templateId = card.dataset.templateId
      selectTemplate(templateId)
    })
  })
}

function renderNoTemplates() {
  return `
    <div class="card text-center" style="padding: 3rem;">
      <h2>No Templates Available</h2>
      <p class="text-secondary mb-3">There are no character templates available yet.</p>
      <a href="/characters/new/from-scratch" class="btn">Create from Scratch</a>
    </div>
  `
}

function renderTemplateList(templates) {
  return `
    <div class="grid grid-2">
      ${templates
        .map(
          (template) => `
        <div class="card template-card" data-template-id="${template.id}" style="cursor: pointer;">
          <h3>${escapeHtml(template.name)}</h3>
          <p class="text-secondary mb-2">${escapeHtml(template.description)}</p>
          <div class="flex gap-2 mt-2" style="flex-wrap: wrap;">
            <span class="badge">Level ${template.level}</span>
            <span class="badge">${template.class}</span>
            <span class="badge">${template.race}</span>
          </div>
          <div class="mt-3" style="font-size: 0.875rem;">
            <div class="flex justify-between">
              <span>STR: ${template.stats.strength}</span>
              <span>DEX: ${template.stats.dexterity}</span>
              <span>CON: ${template.stats.constitution}</span>
            </div>
            <div class="flex justify-between mt-1">
              <span>INT: ${template.stats.intelligence}</span>
              <span>WIS: ${template.stats.wisdom}</span>
              <span>CHA: ${template.stats.charisma}</span>
            </div>
          </div>
          <p style="margin-top: 1rem; font-size: 0.875rem; color: var(--info-color);">Click to use this template →</p>
        </div>
      `,
        )
        .join("")}
    </div>
  `
}

function selectTemplate(templateId) {
  const data = loadData()
  const template = data.characterTemplates.find((t) => t.id === templateId)

  if (!template) {
    alert("Template not found")
    return
  }

  // Store the template ID in session storage so we can apply it on the creation page
  sessionStorage.setItem("selectedTemplate", templateId)

  // Navigate to character creation with the template flag
  navigateTo("/characters/new", { creationMode: "template" })
}

function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}
