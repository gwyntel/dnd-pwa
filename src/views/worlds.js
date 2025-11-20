/**
 * Worlds View
 * Manage campaign worlds with custom lore and system prompts
 */

import { getProvider } from "../utils/model-utils.js"
import { WORLD_TEMPLATES } from "../data/worlds.js"
import store from "../state/store.js"

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

async function generateWorldWithAI() {
  const idea = document.getElementById("world-idea").value.trim()
  const statusDiv = document.getElementById("generation-status")
  const submitBtn = document.querySelector("#ai-generation-form button[type='submit']")

  submitBtn.disabled = true
  submitBtn.textContent = "Generating..."
  statusDiv.style.display = "block"

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

    // JSON Schema for world generation (aligned with existing expectations)
    const worldSchema = {
      type: "object",
      additionalProperties: false,
      required: [
        "name",
        "briefDescription",
        "fullDescription",
        "tone",
        "magicLevel",
        "techLevel",
        "startingLocation",
        "coreIntent",
        "worldOverview",
        "coreLocations",
        "coreFactions",
      ],
      properties: {
        name: { type: "string" },
        briefDescription: { type: "string" },
        fullDescription: { type: "string" },
        tone: { type: "string" },
        magicLevel: {
          type: "string",
          enum: ["none", "low", "medium", "high"],
        },
        techLevel: {
          type: "string",
          enum: ["primitive", "medieval", "renaissance", "industrial", "modern", "sci-fi", "mixed"],
        },
        startingLocation: { type: "string" },
        coreIntent: { type: "array", items: { type: "string" } },
        worldOverview: { type: "array", items: { type: "string" } },
        coreLocations: { type: "array", items: { type: "string" } },
        coreFactions: { type: "array", items: { type: "string" } },
      },
    }

    const baseInstructions = `You are an expert TTRPG worldbuilding assistant for a D&D 5e-adjacent game system.

You MUST:
- Obey the provided JSON schema EXACTLY.
- Output ONLY a single valid JSON object. NO markdown, NO code fences, NO commentary.
- Design settings that are directly usable as AI DM system prompts, consistent with structured patterns:
  - Clearly state: genre, tech level, magic level, core tone.
  - Provide a strong "briefDescription" hook (1 sentence).
  - Provide a concise but rich "fullDescription" (2-4 paragraphs max).
  - Specify a clear "startingLocation" that works as a session-0 hub.
  - **coreIntent**: 3-5 bullet points on what the GM should prioritize (e.g., "Focus on political intrigue", "Make combat deadly").
  - **worldOverview**: 3-5 bullet points summarizing the setting's history, geography, or unique features.
  - **coreLocations**: 3-5 key locations with brief descriptions (e.g., "Ironhold: A dwarven fortress city").
  - **coreFactions**: 3-5 key factions with brief descriptions (e.g., "The Silver Hand: Monster hunters").

When using the user's idea:
- Respect their pitch and genre.
- If ambiguous, default to coherent, table-friendly choices:
  - Medieval/low-tech fantasy unless they request otherwise.
  - Magic level and tone that match their description.
- Ensure the result is:
  - Self-contained (works as a system prompt),
  - Concrete enough to guide an AI DM,
  - Not overloaded with novel-length lore.

User's world idea: "${idea}"

Respond ONLY with the JSON object.`

    const messages = [
      {
        role: "user",
        content: baseInstructions,
      },
    ]

    const requestOptions = supportsStructuredOutputs
      ? {
        jsonSchema: {
          name: "world",
          strict: true,
          schema: worldSchema,
        },
      }
      : {}

    const provider = await getProvider()
    const response = await provider.sendChatCompletion(messages, model, requestOptions)

    let fullResponse = ""

    for await (const chunk of provider.parseStreamingResponse(response)) {
      if (chunk.output_json) {
        // Some providers may return fully parsed JSON objects
        fullResponse = JSON.stringify(chunk.output_json)
      } else if (chunk.choices && chunk.choices[0]?.delta?.content) {
        fullResponse += chunk.choices[0].delta.content
      } else if (chunk.choices && chunk.choices[0]?.message?.content) {
        fullResponse += chunk.choices[0].message.content
      }
    }

    if (!fullResponse.trim()) {
      throw new Error("Empty response from model")
    }

    let generatedWorld
    try {
      generatedWorld = JSON.parse(fullResponse)
    } catch (err) {
      // Fallback for non-structured models that may wrap JSON in text
      const jsonMatch = fullResponse.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error(
          "Model response was not valid JSON. Try again or select a model with ✅ Structured Outputs support.",
        )
      }
      generatedWorld = JSON.parse(jsonMatch[0])
    }

    if (
      !generatedWorld ||
      typeof generatedWorld.name !== "string" ||
      typeof generatedWorld.briefDescription !== "string" ||
      !Array.isArray(generatedWorld.coreIntent)
    ) {
      throw new Error(
        "Generated world JSON is missing required fields. Ensure the model follows the expected schema.",
      )
    }

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
      systemPrompt: generatedWorld.systemPrompt,
      startingLocation: generatedWorld.startingLocation || "",
      coreIntent: generatedWorld.coreIntent || [],
      worldOverview: generatedWorld.worldOverview || [],
      coreLocations: generatedWorld.coreLocations || [],
      coreFactions: generatedWorld.coreFactions || [],
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
        
        <div class="flex gap-1">
          <button type="submit" class="btn">${isEditing ? "Update World" : "Create World"}</button>
          <button type="button" id="cancel-world-btn" class="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  `

  container.scrollIntoView({ behavior: "smooth" })

  // Event listeners
  document.getElementById("world-form").addEventListener("submit", (e) => {
    e.preventDefault()
    saveWorld(isEditing ? world.id : null)
  })

  document.getElementById("cancel-world-btn").addEventListener("click", () => {
    container.innerHTML = ""
    editingWorldId = null
  })
}

function saveWorld(existingWorldId = null) {
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
        createdAt: new Date().toISOString(),
        isDefault: false,
      }
      data.worlds.push(newWorld)
    }
  })

  editingWorldId = null
  renderWorlds()
}
