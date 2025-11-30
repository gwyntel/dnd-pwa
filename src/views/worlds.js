/**
 * Worlds View
 * Manage campaign worlds with custom lore and system prompts
 */

import { getProvider } from "../utils/model-utils.js"
import { WORLD_TEMPLATES } from "../data/worlds.js"
import store from "../state/store.js"
import { seedWorldItems, worldNeedsSeeding } from "../utils/seed-items.js"

let editingWorldId = null

export function renderWorlds() {
  const app = document.getElementById("app")
  const data = store.get()

  if (!data.worlds || data.worlds.length === 0) {
    // Seed with the canonical default world from WORLD_TEMPLATES[0]
    store.update((data) => {
      data.worlds = [
        {
          ...WORLD_TEMPLATES[0],
          createdAt: new Date().toISOString(),
        },
      ]
    })
  }

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
      <div class="page-header">
        <h1 class="page-title">Worlds</h1>
        <button id="create-world-btn" class="btn">+ New World</button>
      </div>
      
      <div id="world-form-container"></div>
      
      <div class="grid grid-2">
        ${data.worlds.map((world) => renderWorldCard(world, data.games)).join("")}
      </div>
    </div>
  `

  // Event listeners
  document.getElementById("create-world-btn").addEventListener("click", () => {
    editingWorldId = null
    renderWorldCreationOptions()
  })

  // Edit buttons
  document.querySelectorAll(".edit-world-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault()
      e.stopPropagation()
      editingWorldId = e.target.closest("button").dataset.worldId
      const data = store.get()
      renderWorldForm(data.worlds.find((w) => w.id === editingWorldId))
    })
  })

  // Delete buttons
  document.querySelectorAll(".delete-world-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault()
      e.stopPropagation()
      const worldId = e.target.closest("button").dataset.worldId
      const data = store.get()
      const world = data.worlds.find((w) => w.id === worldId)

      if (world.isDefault) {
        alert("Cannot delete the default world.")
        return
      }

      // Check if any games use this world
      const gamesUsingWorld = data.games.filter((g) => g.worldId === worldId)
      if (gamesUsingWorld.length > 0) {
        if (!confirm(`This world is used by ${gamesUsingWorld.length} adventure(s). Delete anyway?`)) {
          return
        }
      }

      if (confirm(`Delete world "${world.name}"?`)) {
        store.update((data) => {
          data.worlds = data.worlds.filter((w) => w.id !== worldId)
        })
        renderWorlds()
      }
    })
  })
}

function renderWorldCard(world, games) {
  const gamesUsingWorld = games.filter((g) => g.worldId === world.id).length

  return `
    <div class="card card-clickable">
      <div class="flex justify-between items-start mb-1">
        <div class="flex-1">
          <h3>${world.name} ${world.isDefault ? '<span class="badge">Default</span>' : ""}</h3>
          <p class="text-secondary text-sm">${world.briefDescription}</p>
          ${gamesUsingWorld > 0
      ? `<p class="text-secondary text-xs mt-1">Used in ${gamesUsingWorld} game${gamesUsingWorld > 1 ? "s" : ""
      }</p>`
      : ""
    }
        </div>
        <div class="flex gap-1">
          <button class="btn-icon edit-world-btn" data-world-id="${world.id}" title="Edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          ${!world.isDefault
      ? `
            <button class="btn-icon delete-world-btn" data-world-id="${world.id}" title="Delete">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          `
      : ""
    }
        </div>
      </div>
      
      <div class="mt-1 system-prompt-box">
        ${world.coreIntent
      ? `<strong class="text-sm">Core Intent:</strong>
               <ul class="text-secondary text-sm pl-3 mt-0 mb-1">
                 ${(Array.isArray(world.coreIntent) ? world.coreIntent : [])
        .slice(0, 3)
        .map((i) => `<li>${i}</li>`)
        .join("")}
               </ul>`
      : ""
    }
        ${world.worldOverview
      ? `<strong class="text-sm">Overview:</strong>
               <p class="text-secondary text-sm mt-0 mb-1">${Array.isArray(world.worldOverview) ? world.worldOverview[0] : "No overview available."
      }</p>`
      : ""
    }
      </div>
    </div>
  `
}

function renderWorldCreationOptions() {
  const container = document.getElementById("world-form-container")

  container.innerHTML = `
    <div class="card card-accent mb-3">
      <h2>Create New World</h2>
      <p class="text-secondary mb-3">Choose how you'd like to create your world:</p>
      
      <div class="grid grid-3 gap-3">
        <button id="option-template" class="btn text-left card-padded-md">
          <strong>📚 Use a Template</strong><br>
          <span class="text-sm">Start with a pre-made setting (Classic Fantasy, Urban Noir, etc.)</span>
        </button>
        
        <button id="option-ai" class="btn-secondary text-left card-padded-md">
          <strong>✨ Generate with AI</strong><br>
          <span class="text-sm">Describe your world idea and let AI create the details</span>
        </button>
        
        <button id="option-custom" class="btn-secondary text-left card-padded-md">
          <strong>✏️ Custom (Manual Entry)</strong><br>
          <span class="text-sm">Build your world from scratch with full control</span>
        </button>
      </div>
      
      <button id="cancel-options-btn" class="btn-secondary mt-3 btn-block">Cancel</button>
    </div>
  `

  container.scrollIntoView({ behavior: "smooth" })

  document.getElementById("option-template").addEventListener("click", () => renderTemplateSelection())
  document.getElementById("option-ai").addEventListener("click", () => renderAIGenerator())
  document.getElementById("option-custom").addEventListener("click", () => renderWorldForm())
  document.getElementById("cancel-options-btn").addEventListener("click", () => {
    container.innerHTML = ""
    editingWorldId = null
  })
}

function renderTemplateSelection() {
  const container = document.getElementById("world-form-container")

  container.innerHTML = `
    <div class="card card-accent mb-3">
      <div class="page-header mb-2">
        <h2>Choose a Template</h2>
        <button id="back-to-options" class="btn-secondary">← Back</button>
      </div>
      
      <div class="grid gap-2">
        ${WORLD_TEMPLATES.map(
    (template) => `
          <div class="card template-card" data-template-id="${template.id}">
            <h3>${template.name}</h3>
            <p class="text-secondary text-sm mb-1">${template.briefDescription}</p>
            <p class="text-sm mb-1">${template.fullDescription}</p>
            <div class="flex gap-2 text-xs text-secondary">
              <span>Magic: ${template.magicLevel}</span>
              <span>Tech: ${template.techLevel}</span>
              <span>Tone: ${template.tone}</span>
            </div>
          </div>
        `,
  ).join("")}
      </div>
    </div>
  `

  container.scrollIntoView({ behavior: "smooth" })

  document.getElementById("back-to-options").addEventListener("click", () => renderWorldCreationOptions())

  document.querySelectorAll("[data-template-id]").forEach((card) => {
    card.addEventListener("click", () => {
      const templateId = card.dataset.templateId
      const template = WORLD_TEMPLATES.find((t) => t.id === templateId)
      renderWorldForm(template, true)
    })
  })
}

function renderAIGenerator() {
  const container = document.getElementById("world-form-container")

  container.innerHTML = `
    <div class="card card-primary mb-3">
      <div class="flex justify-between items-center mb-2">
        <h2>Generate World with AI</h2>
        <button id="back-to-options" class="btn-secondary">← Back</button>
      </div>
      
      <form id="ai-generation-form">
        <div class="mb-3">
          <label class="form-label">Describe your world idea *</label>
          <textarea 
            id="world-idea" 
            required 
            rows="4"
            placeholder="e.g., A steampunk city built on the back of a giant turtle&#10;Post-apocalyptic wasteland where magic returned after nuclear war&#10;Underwater kingdom of merfolk and sea monsters"
          ></textarea>
          <p class="text-secondary mt-1 text-sm">
            Be as creative as you want! The AI will generate a complete world setting based on your description.
          </p>
        </div>
        
        <div class="flex gap-1">
          <button type="submit" class="btn">Generate World</button>
          <button type="button" id="cancel-ai-btn" class="btn-secondary">Cancel</button>
        </div>
      </form>
      
      <div id="generation-status" class="mt-1 hidden">
        <p class="text-secondary text-sm">✨ Generating your world...</p>
      </div>
    </div>
  `

  container.scrollIntoView({ behavior: "smooth" })

  document.getElementById("back-to-options").addEventListener("click", () => renderWorldCreationOptions())
  document.getElementById("cancel-ai-btn").addEventListener("click", () => renderWorldCreationOptions())

  document.getElementById("ai-generation-form").addEventListener("submit", async (e) => {
    e.preventDefault()
    await generateWorldWithAI()
  })
}

import {
  WORLD_GEN_STEP_1_SCHEMA, WORLD_GEN_STEP_1_PROMPT,
  WORLD_GEN_STEP_2_SCHEMA, WORLD_GEN_STEP_2_PROMPT,
  WORLD_GEN_STEP_3_SCHEMA, WORLD_GEN_STEP_3_PROMPT,
  WORLD_GEN_STEP_4_SCHEMA, WORLD_GEN_STEP_4_PROMPT
} from "../utils/prompts/world-prompts.js"

// ... (existing code)

async function generateWorldWithAI() {
  const idea = document.getElementById("world-idea").value.trim()
  const statusDiv = document.getElementById("generation-status")
  const submitBtn = document.querySelector("#ai-generation-form button[type='submit']")

  submitBtn.disabled = true
  statusDiv.style.display = "block"

  const updateStatus = (msg) => {
    statusDiv.innerHTML = `<p class="text-secondary text-sm">${msg}</p>`
  }

  try {
    const data = store.get()
    const model = data.settings.defaultNarrativeModel

    if (!model) {
      throw new Error("Please set a default narrative model in settings first.")
    }

    // Inspect cached model metadata to see if this model supports structured outputs.
    const models = data.models || []
    const selectedModelMeta = models.find((m) => m.id === model)
    const supportsStructuredOutputs = !!selectedModelMeta?.supportedParameters?.includes("structured_outputs")
    const provider = await getProvider()

    // Helper to run a single generation step with retries
    const generateStep = async (stepName, promptTemplate, schema, context = {}, retries = 3) => {
      let lastError;

      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          updateStatus(attempt > 1 ? `${stepName} (Attempt ${attempt}/${retries})` : stepName)

          let prompt = promptTemplate
          // Replace all context variables in the prompt
          Object.entries(context).forEach(([key, value]) => {
            prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value)
          })

          const messages = [{ role: "user", content: prompt }]

          const requestOptions = supportsStructuredOutputs
            ? {
              jsonSchema: {
                name: "world_gen_step",
                strict: true,
                schema: schema,
              },
            }
            : {}

          console.log(`[WorldGen] Starting ${stepName} (Attempt ${attempt})...`)
          const response = await provider.sendChatCompletion(messages, model, requestOptions)

          let fullResponse = ""
          for await (const chunk of provider.parseStreamingResponse(response)) {
            if (chunk.output_json) {
              fullResponse = JSON.stringify(chunk.output_json)
            } else if (chunk.choices && chunk.choices[0]?.delta?.content) {
              fullResponse += chunk.choices[0].delta.content
            } else if (chunk.choices && chunk.choices[0]?.message?.content) {
              fullResponse += chunk.choices[0].message.content
            }
          }

          if (!fullResponse.trim()) throw new Error(`Empty response from model during ${stepName}`)

          let result
          try {
            result = JSON.parse(fullResponse)
          } catch (err) {
            const jsonMatch = fullResponse.match(/\{[\s\S]*\}/)
            if (!jsonMatch) throw new Error(`Model response was not valid JSON during ${stepName}`)
            result = JSON.parse(jsonMatch[0])
          }

          return result
        } catch (error) {
          console.warn(`[WorldGen] Attempt ${attempt} failed for ${stepName}:`, error)
          lastError = error
          // Wait briefly before retrying
          if (attempt < retries) await new Promise(r => setTimeout(r, 1000))
        }
      }

      throw lastError || new Error(`Failed to generate ${stepName} after ${retries} attempts`)
    }

    // ==========================================
    // STEP 1: CORE SETTING
    // ==========================================
    const step1Data = await generateStep(
      "✨ Step 1/4: Dreaming up the world...",
      WORLD_GEN_STEP_1_PROMPT,
      WORLD_GEN_STEP_1_SCHEMA,
      { IDEA: idea }
    )

    // ==========================================
    // STEP 2: GEOGRAPHY & FACTIONS
    // ==========================================
    const step2Data = await generateStep(
      "🏰 Step 2/4: Building cities and factions...",
      WORLD_GEN_STEP_2_PROMPT,
      WORLD_GEN_STEP_2_SCHEMA,
      {
        NAME: step1Data.name,
        DESCRIPTION: step1Data.briefDescription,
        TONE: step1Data.tone
      }
    )

    // ==========================================
    // STEP 3: MONSTERS
    // ==========================================
    const step3Data = await generateStep(
      "🐉 Step 3/4: Summoning monsters...",
      WORLD_GEN_STEP_3_PROMPT,
      WORLD_GEN_STEP_3_SCHEMA,
      {
        NAME: step1Data.name,
        DESCRIPTION: step1Data.briefDescription,
        MAGIC_LEVEL: step1Data.magicLevel
      }
    )

    // ==========================================
    // STEP 4: ITEMS
    // ==========================================
    const step4Data = await generateStep(
      "⚔️ Step 4/4: Forging items...",
      WORLD_GEN_STEP_4_PROMPT,
      WORLD_GEN_STEP_4_SCHEMA,
      {
        NAME: step1Data.name,
        DESCRIPTION: step1Data.briefDescription,
        TECH_LEVEL: step1Data.techLevel
      }
    )

    // Combine all data
    const generatedWorld = {
      ...step1Data,
      ...step2Data,
      ...step3Data,
      ...step4Data
    }

    console.log("✅ AI generated world successfully:", {
      name: generatedWorld.name,
      monsterCount: generatedWorld.monsters?.length || 0,
      itemCount: generatedWorld.items?.length || 0,
    })

    const worldTemplate = {
      id: `world_ai_${Date.now()}`,
      name: generatedWorld.name,
      settingType: "custom",
      sourceType: "ai-generated",
      generationPrompt: idea,
      briefDescription: generatedWorld.briefDescription,
      fullDescription: generatedWorld.fullDescription || "",
      tone: generatedWorld.tone || "",
      magicLevel: generatedWorld.magicLevel || "medium",
      techLevel: generatedWorld.techLevel || "medieval",
      startingLocation: generatedWorld.startingLocation || "",
      coreIntent: generatedWorld.coreIntent || [],
      worldOverview: generatedWorld.worldOverview || [],
      coreLocations: generatedWorld.coreLocations || [],
      coreFactions: generatedWorld.coreFactions || [],
      monsters: generatedWorld.monsters || [],
      items: generatedWorld.items || [],
    }

    renderWorldForm(worldTemplate, false, true)
  } catch (error) {
    console.error("Error generating world:", error)
    alert("Failed to generate world: " + (error.message || "Unknown error"))
  } finally {
    submitBtn.disabled = false
    submitBtn.textContent = "Generate World"
    statusDiv.style.display = "none"
  }
}

function renderWorldForm(world = null, isTemplate = false, isAIGenerated = false) {
  const container = document.getElementById("world-form-container")

  const isEditing = world !== null && !isTemplate && !isAIGenerated
  const formData = world || {
    name: "",
    briefDescription: "",
    fullDescription: "",
    tone: "",
    magicLevel: "medium",
    techLevel: "medieval",
    startingLocation: "",
    coreIntent: [],
    worldOverview: [],
    coreLocations: [],
    coreFactions: [],
  }

  let headerText = "Create New World"
  if (isEditing) headerText = "Edit World"
  else if (isTemplate) headerText = `Using Template: ${formData.name}`
  else if (isAIGenerated) headerText = "Review AI Generated World"

  container.innerHTML = `
    <div class="card card-accent mb-3">
      <h2>${headerText}</h2>
      ${isAIGenerated ? '<p class="text-secondary mb-3">Review and edit the generated world before saving.</p>' : ""}
      
      <form id="world-form">
        <div class="mb-3">
          <label class="form-label">World Name *</label>
          <input type="text" id="world-name" required placeholder="e.g., Forgotten Realms" value="${formData.name}">
        </div>
        
        <div class="mb-3">
          <label class="form-label">Brief Description *</label>
          <input type="text" id="world-description" required placeholder="One sentence summary" value="${formData.briefDescription}">
        </div>
        
        <div class="mb-3">
          <label class="form-label">Full Description (Optional)</label>
          <textarea 
            id="world-full-description" 
            rows="3"
            placeholder="2-3 paragraph detailed description"
          >${formData.fullDescription || ""}</textarea>
        </div>
        
        <div class="grid" style="grid-template-columns: 1fr 1fr; margin-bottom: 1rem;">
          <div>
            <label class="form-label">Magic Level</label>
            <select id="world-magic-level">
              <option value="none" ${formData.magicLevel === "none" ? "selected" : ""}>None</option>
              <option value="low" ${formData.magicLevel === "low" ? "selected" : ""}>Low</option>
              <option value="medium" ${formData.magicLevel === "medium" ? "selected" : ""}>Medium</option>
              <option value="high" ${formData.magicLevel === "high" ? "selected" : ""}>High</option>
            </select>
          </div>
          
          <div>
            <label class="form-label">Tech Level</label>
            <select id="world-tech-level">
              <option value="primitive" ${formData.techLevel === "primitive" ? "selected" : ""}>Primitive</option>
              <option value="medieval" ${formData.techLevel === "medieval" ? "selected" : ""}>Medieval</option>
              <option value="renaissance" ${formData.techLevel === "renaissance" ? "selected" : ""}>Renaissance</option>
              <option value="industrial" ${formData.techLevel === "industrial" ? "selected" : ""}>Industrial</option>
              <option value="modern" ${formData.techLevel === "modern" ? "selected" : ""}>Modern</option>
              <option value="sci-fi" ${formData.techLevel === "sci-fi" ? "selected" : ""}>Sci-Fi</option>
              <option value="mixed" ${formData.techLevel === "mixed" ? "selected" : ""}>Mixed</option>
            </select>
          </div>
        </div>
        
        <div class="mb-3">
          <label class="form-label">Tone (Optional)</label>
          <input type="text" id="world-tone" placeholder="e.g., Dark and gritty, Lighthearted adventure" value="${formData.tone || ""}">
        </div>
        
        <div class="mb-3">
          <label class="form-label">Starting Location (Optional)</label>
          <input type="text" id="world-starting-location" placeholder="e.g., The bustling port city of Meridian" value="${formData.startingLocation || ""}">
        </div>
        
        <div class="mb-3">
          <label class="form-label">Core Intent (GM Guidelines) *</label>
          <textarea 
            id="world-core-intent" 
            required 
            rows="4"
            placeholder="One item per line. E.g.:&#10;Make combat deadly&#10;Focus on political intrigue"
          >${(Array.isArray(formData.coreIntent) ? formData.coreIntent : []).join('\n')}</textarea>
        </div>

        <div class="mb-3">
          <label class="form-label">World Overview *</label>
          <textarea 
            id="world-overview" 
            required 
            rows="4"
            placeholder="One item per line. E.g.:&#10;The kingdom is at war&#10;Magic is fading"
          >${(Array.isArray(formData.worldOverview) ? formData.worldOverview : []).join('\n')}</textarea>
        </div>

        <div class="mb-3">
          <label class="form-label">Key Locations *</label>
          <textarea 
            id="world-locations" 
            required 
            rows="4"
            placeholder="One item per line. E.g.:&#10;Ironhold: A dwarven fortress&#10;The Whispering Woods"
          >${(Array.isArray(formData.coreLocations) ? formData.coreLocations : []).join('\n')}</textarea>
        </div>

        <div class="mb-3">
          <label class="form-label">Key Factions *</label>
          <textarea 
            id="world-factions" 
            required 
            rows="4"
            placeholder="One item per line. E.g.:&#10;The Silver Hand: Monster hunters&#10;The Thieves Guild"
          >${(Array.isArray(formData.coreFactions) ? formData.coreFactions : []).join('\n')}</textarea>
        </div>

        <div class="mb-3">
          <div class="flex justify-between align-center mb-2">
            <label class="form-label m-0">Monsters - Optional</label>
            <button type="button" id="add-monster-btn" class="btn btn-secondary">+ Add Monster</button>
          </div>
          <div id="monsters-list" class="grid gap-2">
            ${renderMonstersList(formData.monsters || [])}
          </div>
          <p class="text-secondary mt-1 text-sm">
            Add monsters that will be available in this world. Leave empty to use defaults.
          </p>
        </div>

        <div class="mb-3">
          <div class="flex justify-between align-center mb-2">
            <label class="form-label m-0">Items - Optional</label>
            <button type="button" id="add-item-btn" class="btn btn-secondary">+ Add Item</button>
          </div>
          <div id="items-list" class="grid gap-2">
            ${renderItemsList(formData.items || [])}
          </div>
          <p class="text-secondary mt-1 text-sm">
            Add themed items (weapons, armor, magic items) for this world.
          </p>
        </div>
        
        <div class="flex gap-1">
          <button type="submit" class="btn">${isEditing ? "Update World" : "Create World"}</button>
          <button type="button" id="cancel-world-btn" class="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  `

  container.scrollIntoView({ behavior: "smooth" })

  // Store monsters in memory for manipulation
  // Store monsters and items in memory for manipulation
  let currentMonsters = [...(formData.monsters || [])]
  let currentItems = [...(formData.items || [])]

  // Render monster list helper
  function updateMonstersList() {
    document.getElementById("monsters-list").innerHTML = renderMonstersList(currentMonsters)
    attachMonsterCardHandlers()
  }

  // Attach handlers to monster cards
  function attachMonsterCardHandlers() {
    document.querySelectorAll(".remove-monster-btn").forEach((btn, idx) => {
      btn.addEventListener("click", () => {
        currentMonsters.splice(idx, 1)
        updateMonstersList()
      })
    })

    document.querySelectorAll(".edit-monster-btn").forEach((btn, idx) => {
      btn.addEventListener("click", () => {
        editMonster(idx)
      })
    })
  }

  // Edit monster inline
  function editMonster(idx) {
    const monster = currentMonsters[idx]
    const card = document.querySelectorAll(".monster-card")[idx]

    card.innerHTML = `
      <div class="p-2 bg-surface-2 rounded">
        <div class="grid grid-2 gap-2 mb-2">
          <div>
            <label class="form-label text-xs">Name</label>
            <input type="text" id="edit-name-${idx}" placeholder="e.g., Goblin" value="${monster.name || ''}" class="text-sm">
          </div>
          <div>
            <label class="form-label text-xs">ID</label>
            <input type="text" id="edit-id-${idx}" placeholder="e.g., goblin)" value="${monster.id || ''}" class="text-sm">
          </div>
        </div>
        <div class="grid grid-3 gap-2 mb-2">
          <div>
            <label class="form-label text-xs">Type</label>
            <input type="text" id="edit-type-${idx}" placeholder="e.g., Humanoid" value="${monster.type || ''}" class="text-sm">
          </div>
          <div>
            <label class="form-label text-xs">CR (Challenge Rating)</label>
            <input type="text" id="edit-cr-${idx}" placeholder="e.g., 1/4" value="${monster.cr || ''}" class="text-sm">
          </div>
          <div>
            <label class="form-label text-xs">HP (Hit Points)</label>
            <input type="number" id="edit-hp-${idx}" placeholder="10" value="${monster.hp || 10}" class="text-sm">
          </div>
        </div>
        <div class="grid grid-2 gap-2 mb-2">
          <div>
            <label class="form-label text-xs">AC (Armor Class)</label>
            <input type="number" id="edit-ac-${idx}" placeholder="10" value="${monster.ac || 10}" class="text-sm">
          </div>
          <div>
            <label class="form-label text-xs">Stats (comma-separated)</label>
            <input type="text" id="edit-stats-${idx}" placeholder="str:10,dex:14,con:10,int:10,wis:8,cha:8" value="${formatStats(monster.stats)}" class="text-sm">
          </div>
        </div>
        <div class="flex gap-2">
          <button type="button" class="btn-secondary flex-1" onclick="window.saveMonsterEdit(${idx})">Save</button>
          <button type="button" class="btn-secondary flex-1" onclick="window.cancelMonsterEdit()">Cancel</button>
        </div>
      </div>
    `
  }

  // Save edited monster
  window.saveMonsterEdit = (idx) => {
    const monster = currentMonsters[idx]
    monster.name = document.getElementById(`edit-name-${idx}`).value.trim()
    monster.id = document.getElementById(`edit-id-${idx}`).value.trim() || monster.name.toLowerCase().replace(/\s+/g, '_')
    monster.type = document.getElementById(`edit-type-${idx}`).value.trim()
    monster.cr = document.getElementById(`edit-cr-${idx}`).value.trim()
    monster.hp = parseInt(document.getElementById(`edit-hp-${idx}`).value) || 10
    monster.ac = parseInt(document.getElementById(`edit-ac-${idx}`).value) || 10

    const statsStr = document.getElementById(`edit-stats-${idx}`).value.trim()
    monster.stats = parseStats(statsStr)

    updateMonstersList()
  }

  window.cancelMonsterEdit = () => {
    updateMonstersList()
  }

  // Add monster button
  document.getElementById("add-monster-btn").addEventListener("click", () => {
    const newMonster = {
      id: `monster_${Date.now()}`,
      name: "New Monster",
      type: "Humanoid",
      cr: "1",
      hp: 10,
      ac: 10,
      stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      actions: []
    }
    currentMonsters.push(newMonster)
    updateMonstersList()
  })

  // Render items list helper
  function updateItemsList() {
    document.getElementById("items-list").innerHTML = renderItemsList(currentItems)
    attachItemCardHandlers()
  }

  // Attach handlers to item cards
  function attachItemCardHandlers() {
    document.querySelectorAll(".remove-item-btn").forEach((btn, idx) => {
      btn.addEventListener("click", () => {
        currentItems.splice(idx, 1)
        updateItemsList()
      })
    })

    document.querySelectorAll(".edit-item-btn").forEach((btn, idx) => {
      btn.addEventListener("click", () => {
        editItem(idx)
      })
    })
  }

  // Edit item inline
  function editItem(idx) {
    const item = currentItems[idx]
    const card = document.querySelectorAll(".item-card")[idx]

    card.innerHTML = `
      <div class="p-2 bg-surface-2 rounded">
        <div class="grid grid-2 gap-2 mb-2">
          <div>
            <label class="form-label text-xs">Name</label>
            <input type="text" id="edit-item-name-${idx}" value="${item.name || ''}" class="text-sm">
          </div>
          <div>
            <label class="form-label text-xs">ID</label>
            <input type="text" id="edit-item-id-${idx}" value="${item.id || ''}" class="text-sm">
          </div>
        </div>
        <div class="grid grid-3 gap-2 mb-2">
          <div>
            <label class="form-label text-xs">Category</label>
            <select id="edit-item-category-${idx}" class="text-sm">
              <option value="weapon" ${item.category === 'weapon' ? 'selected' : ''}>Weapon</option>
              <option value="armor" ${item.category === 'armor' ? 'selected' : ''}>Armor</option>
              <option value="consumable" ${item.category === 'consumable' ? 'selected' : ''}>Consumable</option>
              <option value="magic_item" ${item.category === 'magic_item' ? 'selected' : ''}>Magic Item</option>
              <option value="gear" ${item.category === 'gear' ? 'selected' : ''}>Gear</option>
            </select>
          </div>
          <div>
            <label class="form-label text-xs">Rarity</label>
            <select id="edit-item-rarity-${idx}" class="text-sm">
              <option value="common" ${item.rarity === 'common' ? 'selected' : ''}>Common</option>
              <option value="uncommon" ${item.rarity === 'uncommon' ? 'selected' : ''}>Uncommon</option>
              <option value="rare" ${item.rarity === 'rare' ? 'selected' : ''}>Rare</option>
              <option value="very_rare" ${item.rarity === 'very_rare' ? 'selected' : ''}>Very Rare</option>
              <option value="legendary" ${item.rarity === 'legendary' ? 'selected' : ''}>Legendary</option>
            </select>
          </div>
          <div>
            <label class="form-label text-xs">Value (gp)</label>
            <input type="number" id="edit-item-value-${idx}" value="${item.value || 0}" class="text-sm">
          </div>
        </div>
        <div class="mb-2">
          <label class="form-label text-xs">Description</label>
          <input type="text" id="edit-item-desc-${idx}" value="${item.description || ''}" class="text-sm">
        </div>
        <div class="flex gap-2">
          <button type="button" class="btn-secondary flex-1" onclick="window.saveItemEdit(${idx})">Save</button>
          <button type="button" class="btn-secondary flex-1" onclick="window.cancelItemEdit()">Cancel</button>
        </div>
      </div>
    `
  }

  window.saveItemEdit = (idx) => {
    const item = currentItems[idx]
    item.name = document.getElementById(`edit-item-name-${idx}`).value.trim()
    item.id = document.getElementById(`edit-item-id-${idx}`).value.trim() || item.name.toLowerCase().replace(/\s+/g, '_')
    item.category = document.getElementById(`edit-item-category-${idx}`).value
    item.rarity = document.getElementById(`edit-item-rarity-${idx}`).value
    item.value = parseInt(document.getElementById(`edit-item-value-${idx}`).value) || 0
    item.description = document.getElementById(`edit-item-desc-${idx}`).value.trim()
    updateItemsList()
  }

  window.cancelItemEdit = () => {
    updateItemsList()
  }

  document.getElementById("add-item-btn").addEventListener("click", () => {
    const newItem = {
      id: `item_${Date.now()}`,
      name: "New Item",
      category: "gear",
      rarity: "common",
      value: 10,
      weight: 1,
      description: ""
    }
    currentItems.push(newItem)
    updateItemsList()
  })

  // Initial attach
  attachMonsterCardHandlers()
  attachItemCardHandlers()

  document.getElementById("world-form").addEventListener("submit", (e) => {
    e.preventDefault()
    saveWorld(isEditing ? world.id : null, currentMonsters, currentItems)
  })

  document.getElementById("cancel-world-btn").addEventListener("click", () => {
    container.innerHTML = ""
    editingWorldId = null
  })
}

function saveWorld(existingWorldId = null, monsters = [], items = []) {
  const name = document.getElementById("world-name").value.trim()
  const briefDescription = document.getElementById("world-description").value.trim()
  const fullDescription = document.getElementById("world-full-description").value.trim()
  const magicLevel = document.getElementById("world-magic-level").value
  const techLevel = document.getElementById("world-tech-level").value
  const tone = document.getElementById("world-tone").value.trim()
  const startingLocation = document.getElementById("world-starting-location").value.trim()

  // Parse lists
  const coreIntent = document.getElementById("world-core-intent").value.trim().split('\n').filter(l => l.trim())
  const worldOverview = document.getElementById("world-overview").value.trim().split('\n').filter(l => l.trim())
  const coreLocations = document.getElementById("world-locations").value.trim().split('\n').filter(l => l.trim())
  const coreFactions = document.getElementById("world-factions").value.trim().split('\n').filter(l => l.trim())

  // Monsters and items are passed as parameters from the form

  if (!name || !briefDescription) {
    alert("Please fill in all required fields.")
    return
  }

  store.update((data) => {
    if (existingWorldId || editingWorldId) {
      // Update existing world
      const worldId = existingWorldId || editingWorldId
      const world = data.worlds.find((w) => w.id === worldId)
      if (world) {
        world.name = name
        world.briefDescription = briefDescription
        world.fullDescription = fullDescription
        world.tone = tone
        world.magicLevel = magicLevel
        world.techLevel = techLevel
        world.startingLocation = startingLocation
        world.coreIntent = coreIntent
        world.worldOverview = worldOverview
        world.coreLocations = coreLocations
        world.coreFactions = coreFactions
        world.coreFactions = coreFactions
        world.monsters = monsters
        world.items = items
        // Remove legacy field if present
        delete world.systemPrompt
      }
    } else {
      // Create new world
      const newWorld = {
        id: `world_${Date.now()}`,
        name,
        settingType: "custom",
        sourceType: "custom",
        briefDescription,
        fullDescription,
        tone,
        magicLevel,
        techLevel,
        startingLocation,
        coreIntent,
        worldOverview,
        coreLocations,
        coreFactions,
        coreFactions,
        monsters,
        items,
        createdAt: new Date().toISOString(),
        isDefault: false,
      }

      // Seed with essential items if empty
      if (worldNeedsSeeding(newWorld)) {
        seedWorldItems(newWorld)
      }

      data.worlds.push(newWorld)
    }
  })

  editingWorldId = null
  renderWorlds()
}

// Helper functions for monster management
function renderMonstersList(monsters) {
  if (!monsters || monsters.length === 0) {
    return '<p class="text-secondary text-sm">No monsters added yet. Click "+ Add Monster" to get started.</p>'
  }

  return monsters.map((monster, idx) => `
    <div class="monster-card card card-padded-sm bg-surface-1">
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <strong>${monster.name || 'Unnamed'}</strong>
          <span class="text-secondary text-sm ml-2">(CR ${monster.cr || '?'})</span>
          <div class="text-sm text-secondary mt-1">
            ${monster.type || 'Unknown'} • HP: ${monster.hp || '?'} • AC: ${monster.ac || '?'}
          </div>
        </div>
        <div class="flex gap-1">
          <button type="button" class="btn-icon edit-monster-btn" title="Edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button type="button" class="btn-icon remove-monster-btn" title="Remove">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `).join('')
}

function formatStats(stats) {
  if (!stats || typeof stats !== 'object') return ''
  return Object.entries(stats).map(([key, val]) => `${key}:${val}`).join(',')
}

function parseStats(statsStr) {
  if (!statsStr) return { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }

  const stats = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
  statsStr.split(',').forEach(pair => {
    const [key, val] = pair.split(':').map(s => s.trim())
    if (key && val) {
      stats[key.toLowerCase()] = parseInt(val) || 10
    }
  })
  return stats
}

function renderItemsList(items) {
  if (!items || items.length === 0) {
    return '<p class="text-secondary text-sm">No items added yet. Click "+ Add Item" to get started.</p>'
  }

  return items.map((item, idx) => `
    <div class="item-card card card-padded-sm bg-surface-1">
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <strong>${item.name || 'Unnamed'}</strong>
          <span class="text-secondary text-sm ml-2">(${item.rarity || 'common'})</span>
          <div class="text-sm text-secondary mt-1">
            ${item.category || 'gear'} • ${item.value || 0} gp
          </div>
        </div>
        <div class="flex gap-1">
          <button type="button" class="btn-icon edit-item-btn" title="Edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button type="button" class="btn-icon remove-item-btn" title="Remove">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `).join('')
}

