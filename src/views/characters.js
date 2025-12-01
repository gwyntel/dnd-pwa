/**
 * Characters View
 * List, create, and manage characters
 */

import { navigateTo } from "../router.js"
import { sendChatCompletion, parseStreamingResponse } from "../utils/ai-provider.js"
import { isAuthenticated } from "../utils/auth.js"
import { BEGINNER_TEMPLATES } from "../data/archetypes.js"
import { IMPROVED_CHARACTER_LLM_SYSTEM_PROMPT } from "../utils/prompts/character-prompts.js"
import { validateHitDice } from "../utils/character-validation.js"
import { CLASS_PROGRESSION } from "../data/classes.js"
import { generateClassProgression } from "../utils/class-progression-generator.js"
import store from "../state/store.js"

export function renderCharacters() {
  const app = document.getElementById("app")
  const data = store.get()

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
        <h1 class="page-title">Your Characters</h1>
        <button id="new-character-btn" class="btn">+ New Character</button>
      </div>
      
      ${data.characters.length === 0 ? renderEmptyState() : renderCharacterList(data.characters)}
      ${data.characters.length > 0 ? renderTemplatesCta() : ""}
    </div>
  `

  // Event listeners
  document.getElementById("new-character-btn")?.addEventListener("click", () => {
    navigateTo("/characters/new")
  })

  // Character card click handlers
  document.querySelectorAll(".character-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (!e.target.closest(".delete-btn")) {
        const characterId = card.dataset.characterId
        navigateTo(`/characters/edit/${characterId}`)
      }
    })
  })

  // Delete button handlers
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation()
      const characterId = btn.dataset.characterId
      deleteCharacter(characterId)
    })
  })
}

function renderEmptyState() {
  return `
    <div class="card text-center card-padded-xl">
      <h2>No Characters Yet</h2>
      <p class="text-secondary mb-3">Create your first character to begin your adventure!</p>
      <div class="flex gap-2 justify-center flex-wrap">
        <a href="/characters/new" id="from-scratch-link" class="btn">Create with AI or From Scratch</a>
        <a href="/characters/templates" id="template-link" class="btn-secondary">Browse Templates</a>
      </div>
    </div>
  `
}

function renderTemplatesCta() {
  return `
    <div class="card mt-3">
      <div class="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h2 class="mt-0 mb-1">Start from a Template</h2>
          <p class="text-secondary text-sm mb-0">
            Quickly roll a new hero using beginner-friendly presets, even if you already have characters.
          </p>
        </div>
        <a href="/characters/templates" class="btn-secondary">Browse Templates</a>
      </div>
    </div>
  `
}

function renderCharacterList(characters) {
  return `
    <div class="grid grid-2">
      ${characters
      .map(
        (char) => `
        <div class="card character-card card-clickable" data-character-id="${char.id}">
          <button class="btn-icon delete-btn" data-character-id="${char.id}" title="Delete">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
          <h3>${escapeHtml(char.name)}</h3>
          <p class="text-secondary">Level ${char.level} ${char.race} ${char.class}</p>
          <div class="flex gap-2 mt-2 flex-wrap">
            <span class="badge">HP: ${char.maxHP}</span>
            <span class="badge">AC: ${char.armorClass}</span>
          </div>
          <div class="mt-2 text-sm">
            <div class="flex justify-between">
              <span>STR: ${char.stats.strength}</span>
              <span>DEX: ${char.stats.dexterity}</span>
              <span>CON: ${char.stats.constitution}</span>
            </div>
            <div class="flex justify-between mt-1">
              <span>INT: ${char.stats.intelligence}</span>
              <span>WIS: ${char.stats.wisdom}</span>
              <span>CHA: ${char.stats.charisma}</span>
            </div>
          </div>
          ${char.fromTemplate
            ? `<p class="text-secondary mt-2 text-xs">From template: ${char.fromTemplate}</p>`
            : ""
          }
        </div>
      `,
      )
      .join("")}
    </div>
  `
}

function deleteCharacter(characterId) {
  if (!confirm("Are you sure you want to delete this character? This cannot be undone.")) {
    return
  }

  store.update((data) => {
    data.characters = data.characters.filter((c) => c.id !== characterId)
  })

  // Re-render
  renderCharacters()
}

export function renderCharacterCreator(state = {}) {
  const app = document.getElementById("app")
  const data = store.get()
  const isEdit = state.params?.id
  const character = isEdit ? data.characters.find((c) => c.id === state.params.id) : null

  // Support starting from a template via /characters/new?template=template_id
  let initialTemplate = null
  if (!isEdit && !character) {
    const templateId = state.query?.template
    if (templateId) {
      const fromShared = BEGINNER_TEMPLATES.find((t) => t.id === templateId)
      const fromData = (data.characterTemplates || []).find((t) => t.id === templateId)
      const t = fromShared || fromData
      if (t) {
        initialTemplate = {
          name: t.name,
          race: t.race,
          class: t.class,
          level: t.level,
          stats: t.stats,
          maxHP: t.maxHP,
          armorClass: t.armorClass,
          proficiencyBonus: 2,
          speed: t.speed || 30,
          hitDice: t.hitDice || "1d10",
          savingThrows: [],
          skills: t.skills || [],
          proficiencies: { armor: [], weapons: [], tools: [] },
          features: t.keyAbilities || t.features || [],
          spells: [],
          inventory: t.inventory || [],
          backstory: t.backstory || "",
          fromTemplate: t.name,
        }
      }
    }
  }

  // Initialize form data
  const formData = character ||
    initialTemplate || {
    name: "",
    race: "Human",
    class: "Fighter",
    level: 1,
    stats: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    },
    maxHP: 10,
    armorClass: 10,
    proficiencyBonus: 2,
    speed: 30,
    hitDice: "1d10",
    savingThrows: [],
    skills: [],
    proficiencies: {
      armor: [],
      weapons: [],
      tools: [],
    },
    features: [],
    spells: [],
    inventory: [],
    backstory: "",
  }

  const creationMode = state.creationMode || null

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
      <div class="page-header" style="margin-top: 1.5rem;">
        <h1 class="page-title">${isEdit ? "Edit Character" : "Create Character"}</h1>
        <a href="/characters" class="btn-secondary">Cancel</a>
      </div>

      ${!isEdit
      ? `
        <div class="card mb-3">
          <h2 class="mt-0">Create with AI or From Scratch</h2>
          <p class="text-secondary text-sm mb-2">
            Describe your character or leave blank for a random hero. Edit everything before saving.
          </p>
          <label for="ai-random-prompt" class="form-label">
            Describe your character idea (optional)
          </label>
          <textarea
            id="ai-random-prompt"
            rows="3"
            class="mb-1"
            placeholder="e.g., A brave Human Fighter who protects others; level 1, simple and durable."
          ></textarea>
          <button id="ai-random-generate-btn" class="btn" type="button">
            🎲 Generate Character with AI
          </button>
          <p class="text-secondary text-xs mt-1">
            Leave the box empty for a fully random character.
          </p>
        </div>
      `
      : ""
    }
      
      ${""}
      
      <div class="card">
        <form id="character-form">
          <div class="mb-3">
            <label class="form-label">Character Name *</label>
            <input type="text" id="char-name" value="${escapeHtml(formData.name)}" required placeholder="Enter character name">
          </div>
          
          <div class="grid grid-2 mb-3">
            <div>
              <label class="form-label">Race *</label>
              <select id="char-race">
                ${[
      "Human",
      "Elf",
      "Dwarf",
      "Halfling",
      "Dragonborn",
      "Gnome",
      "Half-Elf",
      "Half-Orc",
      "Tiefling",
      "Custom",
    ]
      .map((race) => `<option value="${race}" ${formData.race === race ? "selected" : ""}>${race}</option>`)
      .join("")}
              </select>
              <input
                type="text"
                id="char-race-custom"
                class="mt-1"
                placeholder="Enter custom race"
                style="display: ${formData.race &&
      ![
        "Human",
        "Elf",
        "Dwarf",
        "Halfling",
        "Dragonborn",
        "Gnome",
        "Half-Elf",
        "Half-Orc",
        "Tiefling",
      ].includes(formData.race)
      ? "block"
      : "none"
    };"
                value="${formData.race &&
      ![
        "Human",
        "Elf",
        "Dwarf",
        "Halfling",
        "Dragonborn",
        "Gnome",
        "Half-Elf",
        "Half-Orc",
        "Tiefling",
      ].includes(formData.race)
      ? escapeHtml(formData.race)
      : ""
    }"
              >
            </div>
            <div>
              <label class="form-label">Class *</label>
              <select id="char-class">
                ${[
      "Fighter",
      "Wizard",
      "Rogue",
      "Cleric",
      "Barbarian",
      "Bard",
      "Druid",
      "Monk",
      "Paladin",
      "Ranger",
      "Sorcerer",
      "Warlock",
      "Custom",
    ]
      .map((cls) => `<option value="${cls}" ${formData.class === cls ? "selected" : ""}>${cls}</option>`)
      .join("")}
              </select>
              <input
                type="text"
                id="char-class-custom"
                class="mt-1"
                placeholder="Enter custom class"
                style="display: ${formData.class &&
      ![
        "Fighter",
        "Wizard",
        "Rogue",
        "Cleric",
        "Barbarian",
        "Bard",
        "Druid",
        "Monk",
        "Paladin",
        "Ranger",
        "Sorcerer",
        "Warlock",
      ].includes(formData.class)
      ? "block"
      : "none"
    };"
                value="${formData.class &&
      ![
        "Fighter",
        "Wizard",
        "Rogue",
        "Cleric",
        "Barbarian",
        "Bard",
        "Druid",
        "Monk",
        "Paladin",
        "Ranger",
        "Sorcerer",
        "Warlock",
      ].includes(formData.class)
      ? escapeHtml(formData.class)
      : ""
    }"
              >
            </div>
          </div>
          
          <div class="mb-3">
            <label class="form-label">Level</label>
            <input type="number" id="char-level" value="${formData.level}" min="1" max="20">
          </div>
          
          <h3 class="mb-2">Ability Scores</h3>
          <p class="text-secondary mb-2 text-sm">Standard range: 8-18. Higher is better.</p>
          <div class="grid grid-2 mb-3">
            ${Object.entries(formData.stats)
      .map(
        ([stat, value]) => `
              <div>
                <label class="form-label" style="text-transform: uppercase;">${stat
            .substring(0, 3)
            .toUpperCase()}: ${value}</label>
                <input type="range" id="stat-${stat}" min="3" max="20" value="${value}">
              </div>
            `,
      )
      .join("")}
          </div>
          
          <div class="grid grid-2 mb-3">
            <div>
              <label class="form-label">Max HP *</label>
              <input type="number" id="char-hp" value="${formData.maxHP}" min="1" required>
            </div>
            <div>
              <label class="form-label">Armor Class (AC) *</label>
              <input type="number" id="char-ac" value="${formData.armorClass}" min="1" required>
            </div>
          </div>
          
          <div class="grid grid-2 mb-3">
            <div>
              <label class="form-label">Speed (ft)</label>
              <input type="number" id="char-speed" value="${formData.speed}" min="0">
            </div>
            <div>
              <label class="form-label">Hit Dice</label>
              <select id="char-hitdice" title="Select your character's hit die (e.g., 1d8 for a Fighter, 1d6 for a Wizard)">
                <optgroup label="Standard Options">
                  ${["1d4", "1d6", "1d8", "1d10", "1d12"]
      .map(
        (dice) =>
          `<option value="${dice}" ${formData.hitDice === dice ? "selected" : ""}>${dice}</option>`,
      )
      .join("")}
                </optgroup>
                <optgroup label="Multiple Dice">
                  ${["2d4", "2d6", "2d8", "2d10", "2d12"]
      .map(
        (dice) =>
          `<option value="${dice}" ${formData.hitDice === dice ? "selected" : ""}>${dice}</option>`,
      )
      .join("")}
                </optgroup>
              </select>
              <small id="hitdice-validation" class="text-secondary text-xs mt-1" style="display: block;"></small>
            </div>
          </div>
          
          <div class="grid grid-2 mb-3">
            <div>
              <label class="form-label">Skills (comma-separated)</label>
              <input type="text" id="char-skills" value="${formData.skills.join(", ")}" placeholder="e.g., Athletics, Stealth, Perception">
            </div>
            <div>
              <label class="form-label">Features & Traits (comma-separated)</label>
              <input type="text" id="char-features" value="${formData.features.join(", ")}" placeholder="e.g., Second Wind, Sneak Attack">
            </div>
          </div>
          
          <div class="mb-3">
            <label class="form-label">Backstory (optional)</label>
            <textarea id="char-backstory" placeholder="Tell us about your character's history...">${escapeHtml(formData.backstory || "")}</textarea>
          </div>
          
          <button type="submit" class="btn btn-block">${isEdit ? "Save Changes" : "Create Character"}</button>
        </form>
      </div>
    </div>
  `

  // Update stat labels when sliders change
  Object.keys(formData.stats).forEach((stat) => {
    const slider = document.getElementById(`stat-${stat}`)
    slider?.addEventListener("input", (e) => {
      const label = e.target.previousElementSibling
      label.textContent = `${stat.substring(0, 3).toUpperCase()}: ${e.target.value}`
    })
  })

  // Toggle custom race/class inputs when "Custom" or a non-standard value is selected
  const raceSelect = document.getElementById("char-race")
  const raceCustomInput = document.getElementById("char-race-custom")
  const standardRaces = ["Human", "Elf", "Dwarf", "Halfling", "Dragonborn", "Gnome", "Half-Elf", "Half-Orc", "Tiefling"]

  const updateRaceCustomVisibility = () => {
    const value = raceSelect.value
    if (value === "Custom" || !standardRaces.includes(value)) {
      raceCustomInput.style.display = "block"
      if (!raceCustomInput.value && value !== "Custom") {
        raceCustomInput.value = value
      }
    } else {
      raceCustomInput.style.display = "none"
    }
  }
  raceSelect?.addEventListener("change", updateRaceCustomVisibility)
  updateRaceCustomVisibility()

  const classSelect = document.getElementById("char-class")
  const classCustomInput = document.getElementById("char-class-custom")
  const standardClasses = [
    "Fighter",
    "Wizard",
    "Rogue",
    "Cleric",
    "Barbarian",
    "Bard",
    "Druid",
    "Monk",
    "Paladin",
    "Ranger",
    "Sorcerer",
    "Warlock",
  ]

  const updateClassCustomVisibility = () => {
    const value = classSelect.value
    if (value === "Custom" || !standardClasses.includes(value)) {
      classCustomInput.style.display = "block"
      if (!classCustomInput.value && value !== "Custom") {
        classCustomInput.value = value
      }
    } else {
      classCustomInput.style.display = "none"
    }
  }
  classSelect?.addEventListener("change", updateClassCustomVisibility)
  updateClassCustomVisibility()

  // Form submission
  document.getElementById("character-form")?.addEventListener("submit", async (e) => {
    e.preventDefault()
    await saveCharacter(isEdit ? character.id : null)
  })

  // Template selection
  document.querySelectorAll(".template-card").forEach((card) => {
    card.addEventListener("click", () => {
      const templateId = card.dataset.templateId
      applyTemplate(templateId)
    })
  })

  // Note: Empty-state actions use <a href> links handled by the router.

  // If we're in AI random generation mode, wire the generate button
  if (!isEdit) {
    const generateBtn = document.getElementById("ai-random-generate-btn")
    if (generateBtn && !generateBtn.dataset.bound) {
      generateBtn.dataset.bound = "true"
      generateBtn.addEventListener("click", async (e) => {
        e.preventDefault()
        await generateRandomCharacterWithPrompt()
      })
    }
  }

  const hitDiceSelect = document.getElementById("char-hitdice")
  if (hitDiceSelect) {
    const validateAndShowFeedback = () => {
      const value = hitDiceSelect.value
      const validated = validateHitDice(value)
      const validationMsg = document.getElementById("hitdice-validation")

      if (validated !== value) {
        validationMsg.textContent = `⚠️ Invalid format "${value}" - using "${validated}" instead`
        validationMsg.style.color = "var(--warning-color, #ff9800)"
        hitDiceSelect.value = validated
      } else {
        validationMsg.textContent = "✓ Valid hit die"
        validationMsg.style.color = "var(--success-color, #4caf50)"
      }
    }

    hitDiceSelect.addEventListener("change", validateAndShowFeedback)
    validateAndShowFeedback()
  }
}

async function generateCharacterWithLLM(userPrompt = "") {
  const systemPrompt = IMPROVED_CHARACTER_LLM_SYSTEM_PROMPT
  const data = store.get()
  const model = data.settings?.defaultNarrativeModel || "openai/gpt-4o-mini"

  // Inspect cached model metadata (populated by Models view) to see if this model supports structured outputs.
  const models = data.models || []
  const selectedModelMeta = models.find((m) => m.id === model)
  const supportsStructuredOutputs = !!selectedModelMeta?.supportedParameters?.includes("structured_outputs")

  const messages = [
    {
      role: "user",
      content:
        (userPrompt && userPrompt.trim().length
          ? `Generate a D&D 5e character based on this idea:\n"${userPrompt.trim()}".`
          : "Generate a random, creative D&D 5e character.") +
        "\n\nRespond ONLY with a single JSON object in the format described in the system prompt.",
    },
  ]

  // JSON Schema for structured outputs (aligned with CHARACTER_LLM_SYSTEM_PROMPT shape)
  const characterSchema = {
    type: "object",
    additionalProperties: false,
    required: [
      "name",
      "race",
      "class",
      "level",
      "stats",
      "maxHP",
      "armorClass",
      "speed",
      "hitDice",
      "skills",
      "features",
      "backstory",
    ],
    properties: {
      name: { type: "string" },
      race: { type: "string" },
      class: { type: "string" },
      level: { type: "integer", minimum: 1, maximum: 20 },
      stats: {
        type: "object",
        additionalProperties: false,
        required: ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"],
        properties: {
          strength: { type: "integer", minimum: 1, maximum: 30 },
          dexterity: { type: "integer", minimum: 1, maximum: 30 },
          constitution: { type: "integer", minimum: 1, maximum: 30 },
          intelligence: { type: "integer", minimum: 1, maximum: 30 },
          wisdom: { type: "integer", minimum: 1, maximum: 30 },
          charisma: { type: "integer", minimum: 1, maximum: 30 },
        },
      },
      maxHP: { type: "integer", minimum: 1 },
      armorClass: { type: "integer", minimum: 1 },
      speed: { type: "integer", minimum: 0 },
      hitDice: { type: "string" },
      skills: {
        type: "array",
        items: { type: "string" },
      },
      features: {
        type: "array",
        items: { type: "string" },
      },
      backstory: { type: "string" },
    },
  }


  try {
    // Prefer structured outputs when supported; otherwise fall back to plain JSON-mode prompt instructions.
    const response = await sendChatCompletion(messages, model, {
      system: systemPrompt,
      temperature: 0.8,
      ...(supportsStructuredOutputs
        ? {
          jsonSchema: {
            name: "character",
            strict: true,
            schema: characterSchema,
          },
        }
        : {}),
    })

    let fullResponse = ""
    for await (const chunk of parseStreamingResponse(response)) {
      // For structured outputs, OpenRouter returns JSON chunks; fall back to .choices streaming if present.
      if (chunk.choices && chunk.choices[0]?.delta?.content) {
        fullResponse += chunk.choices[0].delta.content
      } else if (chunk.choices && chunk.choices[0]?.message?.content) {
        // Non-streamed-style final message in some implementations
        fullResponse += chunk.choices[0].message.content
      } else if (chunk.output_json) {
        // If the provider sends a fully parsed JSON object per chunk
        fullResponse = JSON.stringify(chunk.output_json)
      }
    }

    console.log("[AI Character] Raw JSON response:", fullResponse)

    let raw
    try {
      raw = JSON.parse(fullResponse)
    } catch (e) {
      console.warn("[AI Character] Response was not valid JSON, using fallback normalization if possible.", {
        fullResponse,
      })
      throw new Error("AI response was not valid JSON. Try again or choose a model that supports structured outputs.")
    }

    const parsed = normalizeJsonCharacter(raw)
    console.log("[AI Character] Parsed result:", parsed)

    if (!parsed || !parsed.name || !parsed.race || !parsed.class) {
      throw new Error(
        'AI response was missing required fields. Expected "name", "race", and "class" plus stats, HP, AC, etc.',
      )
    }

    return parsed
  } catch (error) {
    console.error("[AI Character] Error generating character:", error)
    throw error
  }
}

function applyTemplate(templateId) {
  // Look up from shared templates module (BEGINNER_TEMPLATES) or any stored templates in data
  const data = store.get()
  const templateFromShared = BEGINNER_TEMPLATES.find((t) => t.id === templateId)
  const templateFromData = (data.characterTemplates || []).find((t) => t.id === templateId)
  const template = templateFromShared || templateFromData

  if (!template) return

  // Fill form with template data
  document.getElementById("char-name").value = template.name || ""
  document.getElementById("char-race").value = template.race || "Human"
  document.getElementById("char-class").value = template.class || "Fighter"
  document.getElementById("char-level").value = template.level || 1
  document.getElementById("char-hp").value = template.maxHP || 10
  document.getElementById("char-ac").value = template.armorClass || 10
  document.getElementById("char-speed").value = template.speed || 30
  document.getElementById("char-hitdice").value = template.hitDice || "1d10"
  document.getElementById("char-skills").value = (template.skills || []).join(", ")
  document.getElementById("char-features").value = (template.features || []).join(", ")
  document.getElementById("char-backstory").value = template.backstory || ""

  // Update stats
  Object.entries(template.stats).forEach(([stat, value]) => {
    const slider = document.getElementById(`stat-${stat}`)
    if (slider) {
      slider.value = value
      slider.previousElementSibling.textContent = `${stat.substring(0, 3).toUpperCase()}: ${value}`
    }
  })

  // Scroll to form
  document.getElementById("character-form").scrollIntoView({ behavior: "smooth" })

  showMessage(`Loaded template: ${template.fromTemplate || template.name}`, "success")
}

async function saveCharacter(existingId = null) {
  const submitBtn = document.querySelector('button[type="submit"]')
  if (submitBtn) {
    submitBtn.disabled = true
    submitBtn.textContent = "Saving..."
  }

  try {
    const level = Number.parseInt(document.getElementById("char-level").value)
    const profBonus = Math.floor((level - 1) / 4) + 2

    const selectedRace = document.getElementById("char-race").value
    const customRace = (document.getElementById("char-race-custom")?.value || "").trim()
    const finalRace = selectedRace === "Custom" ? customRace || "Custom" : selectedRace

    const selectedClass = document.getElementById("char-class").value
    const customClass = (document.getElementById("char-class-custom")?.value || "").trim()
    const finalClass = selectedClass === "Custom" ? customClass || "Custom" : selectedClass

    // Check if we need to generate custom progression
    let customProgression = null
    if (!CLASS_PROGRESSION[finalClass]) {
      console.log(`[Character] Generating progression for custom class: ${finalClass}`)
      showMessage(`Generating class progression for ${finalClass}...`, "info")

      // Get existing custom progression if editing
      if (existingId) {
        const data = store.get()
        const existingChar = data.characters.find(c => c.id === existingId)
        if (existingChar && existingChar.class === finalClass && existingChar.customProgression) {
          customProgression = existingChar.customProgression
        }
      }

      // Generate if not found
      if (!customProgression) {
        const description = document.getElementById("char-backstory").value
        customProgression = await generateClassProgression(finalClass, description)
      }
    }

    await store.update((data) => {
      const character = {
        id: existingId || `char_${Date.now()}`,
        name: document.getElementById("char-name").value.trim(),
        race: finalRace,
        class: finalClass,
        level: level,
        stats: {
          strength: Number.parseInt(document.getElementById("stat-strength").value),
          dexterity: Number.parseInt(document.getElementById("stat-dexterity").value),
          constitution: Number.parseInt(document.getElementById("stat-constitution").value),
          intelligence: Number.parseInt(document.getElementById("stat-intelligence").value),
          wisdom: Number.parseInt(document.getElementById("stat-wisdom").value),
          charisma: Number.parseInt(document.getElementById("stat-charisma").value),
        },
        maxHP: Number.parseInt(document.getElementById("char-hp").value),
        armorClass: Number.parseInt(document.getElementById("char-ac").value),
        proficiencyBonus: profBonus,
        speed: Number.parseInt(document.getElementById("char-speed").value) || 30,
        hitDice: document.getElementById("char-hitdice").value.trim() || "1d10",
        savingThrows: existingId ? data.characters.find((c) => c.id === existingId).savingThrows : [],
        skills: document
          .getElementById("char-skills")
          .value.split(",")
          .map((s) => s.trim())
          .filter((s) => s),
        proficiencies: existingId
          ? data.characters.find((c) => c.id === existingId).proficiencies
          : { armor: [], weapons: [], tools: [] },
        features: document
          .getElementById("char-features")
          .value.split(",")
          .map((s) => s.trim())
          .filter((s) => s),
        spells: existingId ? data.characters.find((c) => c.id === existingId).spells : [],
        inventory: existingId ? data.characters.find((c) => c.id === existingId).inventory : [],
        backstory: document.getElementById("char-backstory").value.trim(),
        createdAt: existingId ? data.characters.find((c) => c.id === existingId).createdAt : new Date().toISOString(),
        fromTemplate: null,
        customProgression: customProgression // Save the generated progression
      }

      if (existingId) {
        // Update existing
        const index = data.characters.findIndex((c) => c.id === existingId)
        data.characters[index] = character
      } else {
        // Add new
        data.characters.push(character)
      }
    })

    // Show success and navigate
    showMessage(existingId ? "Character updated!" : "Character created!", "success")
    setTimeout(() => {
      navigateTo("/characters")
    }, 1000)
  } catch (error) {
    console.error("Failed to save character:", error)
    showMessage("Failed to save character: " + error.message, "error")
    if (submitBtn) {
      submitBtn.disabled = false
      submitBtn.textContent = existingId ? "Save Changes" : "Create Character"
    }
  }
}

function showMessage(text, type) {
  const message = document.createElement("div")
  message.className = `message message-${type}`
  message.textContent = text
  message.style.cssText =
    "position: fixed; top: 20px; right: 20px; z-index: 1000; padding: 1rem; border-radius: 8px; background: " +
    (type === "error" ? "var(--error-color)" : "var(--success-color)") +
    "; color: white; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"
  document.body.appendChild(message)

  setTimeout(() => {
    message.remove()
  }, 3000)
}

function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

function renderCreationOptions() {
  // Deprecated in this view: templates are now displayed on a dedicated Templates page.
  return ""

  // return `
  //   <div class="mb-3">
  //     <div style="display:flex; justify-content: space-between; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
  //       <h2 style="margin:0;">Suggested Beginner Templates</h2>
  //       <span class="text-secondary" style="font-size: 0.8rem;">
  //         Pick a ready-to-play archetype, then tweak anything you like.
  //       </span>
  //     </div>
  //     <div class="grid grid-3">
  //       ${templates
  //         .map(
  //           (t) => `
  //         <div class="card template-card" data-template-id="${t.id}" style="cursor:pointer; display:flex; flex-direction:column; justify-content:space-between;">
  //           <div>
  //             <div style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem;">
  //               <h3 style="margin:0;">${t.icon} ${escapeHtml(t.name)}</h3>
  //               <span class="badge" style="font-size:0.7rem; text-transform:capitalize;">${escapeHtml(
  //                 t.difficulty,
  //               )}</span>
  //             </div>
  //             <p class="text-secondary" style="margin:0.25rem 0 0.35rem 0; font-size:0.8rem;">
  //               Level ${t.level} ${escapeHtml(t.race)} ${escapeHtml(t.class)} • ${escapeHtml(t.role)}
  //             </p>
  //             <p class="text-secondary" style="margin:0 0 0.35rem 0; font-size:0.8rem;">
  //               ${escapeHtml(t.tagline)}
  //             </p>
  //             <p class="text-secondary" style="margin:0 0 0.35rem 0; font-size:0.75rem;">
  //               Best for: ${t.bestFor.map((b) => escapeHtml(b)).join(" • ")}
  //             </p>
  //             <div style="display:flex; gap:0.35rem; flex-wrap:wrap; font-size:0.75rem; margin-bottom:0.35rem;">
  //               <span class="badge">HP ${t.maxHP}</span>
  //               <span class="badge">AC ${t.armorClass}</span>
  //               <span class="badge">STR ${t.stats.strength}</span>
  //               <span class="badge">DEX ${t.stats.dexterity}</span>
  //               <span class="badge">CON ${t.stats.constitution}</span>
  //             </div>
  //           </div>
  //           <button class="btn" style="margin-top:0.5rem; width:100%;">Use This Character</button>
  //         </div>
  //       `,
  //         )
  //         .join("")}
  //     </div>
  //   </div>
  // `
}

async function handleGenerateRandomCharacterFlow() {
  if (!isAuthenticated()) {
    alert("Please authenticate to use AI character generation.")
    return
  }

  // If form is not visible yet, rely on the dedicated from-scratch route
  if (!document.getElementById("character-form")) {
    navigateTo("/characters/new/from-scratch")
    await new Promise((resolve) => setTimeout(resolve, 300))
  }

  const formEl = document.getElementById("character-form")
  if (!formEl) {
    alert("Unable to find character form after navigation.")
    return
  }

  // Inject or reuse prompt UI block above the form
  let promptContainer = document.getElementById("ai-random-prompt-container")
  if (!promptContainer) {
    promptContainer = document.createElement("div")
    promptContainer.id = "ai-random-prompt-container"
    promptContainer.className = "card mb-3"
    promptContainer.innerHTML = `
      <label class="form-label">
        Describe your character idea (optional)
      </label>
      <textarea id="ai-random-prompt"
        rows="3"
        class="mb-1"
        placeholder="e.g., A Tiefling rogue who escaped a cult and now hunts demons for coin; level 5, edgy but kind-hearted."></textarea>
      <div class="flex gap-1 flex-wrap">
        <button id="ai-random-generate-btn" class="btn">🎲 Generate Character with AI</button>
        <span class="text-secondary text-xs">
          The AI will fill in this form with a complete character sheet. You can edit before saving.
        </span>
      </div>
    `
    formEl.parentNode.insertBefore(promptContainer, formEl)
  }

  const generateBtn = document.getElementById("ai-random-generate-btn")
  if (!generateBtn) {
    alert("Unable to initialize AI generation button.")
    return
  }

  // Attach click handler once
  if (!generateBtn.dataset.bound) {
    generateBtn.dataset.bound = "true"
    generateBtn.addEventListener("click", async (e) => {
      e.preventDefault()
      await generateRandomCharacterWithPrompt()
    })
  }

  promptContainer.scrollIntoView({ behavior: "smooth" })
}

export async function generateRandomCharacter() {
  return generateRandomCharacterWithPrompt()
}

function normalizeJsonCharacter(raw) {
  if (!raw || typeof raw !== "object") {
    return null
  }

  const core = {
    name: String(raw.name || "").trim(),
    race: String(raw.race || "").trim(),
    class: String(raw.class || "").trim(),
    level: Number.isFinite(raw.level) ? raw.level : Number.parseInt(raw.level, 10),
  }

  // Normalize different incoming field names and shapes into our expected schema.
  const statsIn =
    // Preferred strict schema: object with named fields
    (raw.stats && !Array.isArray(raw.stats) && raw.stats) ||
    raw.abilityScores ||
    raw.abilities ||
    // If model returns an array like [str,dex,con,int,wis,cha], keep it only as fallback for non-strict mode
    (Array.isArray(raw.stats) && {
      strength: raw.stats[0],
      dexterity: raw.stats[1],
      constitution: raw.stats[2],
      intelligence: raw.stats[3],
      wisdom: raw.stats[4],
      charisma: raw.stats[5],
    }) || {
      strength: raw.strength,
      dexterity: raw.dexterity,
      constitution: raw.constitution,
      intelligence: raw.intelligence,
      wisdom: raw.wisdom,
      charisma: raw.charisma,
    }

  const num = (v, fallback) => {
    const n = typeof v === "number" ? v : Number.parseInt(v, 10)
    return Number.isFinite(n) ? n : fallback
  }

  const stats = {
    strength: num(statsIn.strength, 10),
    dexterity: num(statsIn.dexterity, 10),
    constitution: num(statsIn.constitution, 10),
    intelligence: num(statsIn.intelligence, 10),
    wisdom: num(statsIn.wisdom, 10),
    charisma: num(statsIn.charisma, 10),
  }

  const combat = raw.combat || {}
  const maxHP = num(raw.maxHP ?? raw.hp ?? combat.hit_points, 10)
  const armorClass = num(raw.armorClass ?? raw.ac ?? combat.armor_class, 10)
  const speed = num(raw.speed ?? combat.speed, 30)
  const hitDice =
    typeof (raw.hitDice || combat.hit_dice) === "string" ? (raw.hitDice || combat.hit_dice).trim() : "1d10"

  const csvToArray = (val) =>
    String(val || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

  const normalizeSkills = (val) => {
    if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean)
    return csvToArray(val)
  }

  const normalizeFeatures = (val) => {
    if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean)
    return csvToArray(val)
  }

  const skills = normalizeSkills(raw.skills)
  const features = normalizeFeatures(raw.features)
  const backstory = String(raw.backstory || "").trim()

  if (!core.name || !core.race || !core.class) {
    return {
      ...core,
      stats,
      maxHP,
      armorClass,
      speed,
      hitDice,
      skills,
      features,
      backstory,
    }
  }

  return {
    name: core.name,
    race: core.race,
    class: core.class,
    level: num(core.level, 1),
    stats,
    maxHP,
    armorClass,
    speed,
    hitDice,
    skills,
    features,
    backstory,
  }
}

async function generateRandomCharacterWithPrompt() {
  if (!isAuthenticated()) {
    alert("Please authenticate to use AI character generation.")
    return
  }

  const promptInput = document.getElementById("ai-random-prompt")
  const userPrompt = promptInput ? promptInput.value.trim() : ""

  // Show loading state (try both the inline button and the header button)
  const inlineBtn = document.getElementById("ai-random-generate-btn")
  const randomBtn = document.getElementById("random-btn")
  const btn = inlineBtn || randomBtn
  const originalText = btn?.textContent

  if (btn) {
    btn.disabled = true
    btn.textContent = "🎲 Generating..."
  }

  try {
    const character = await generateCharacterWithLLM(userPrompt)

    // Ensure we are on the creator form; if not, navigate and wait briefly
    if (!document.getElementById("character-form")) {
      navigateTo("/characters/new/from-scratch")
      await new Promise((resolve) => setTimeout(resolve, 300))
    }

    // Fill form with generated character data
    document.getElementById("char-name").value = character.name

    // Handle race: if it matches a standard option, select it; otherwise choose Custom and prefill custom field
    const standardRaces = [
      "Human",
      "Elf",
      "Dwarf",
      "Halfling",
      "Dragonborn",
      "Gnome",
      "Half-Elf",
      "Half-Orc",
      "Tiefling",
    ]
    const raceSelect = document.getElementById("char-race")
    const raceCustomInput = document.getElementById("char-race-custom")
    if (standardRaces.includes(character.race)) {
      raceSelect.value = character.race
      raceCustomInput.style.display = "none"
      raceCustomInput.value = ""
    } else {
      raceSelect.value = "Custom"
      raceCustomInput.style.display = "block"
      raceCustomInput.value = character.race || ""
    }

    // Handle class: if it matches a standard option, select it; otherwise choose Custom and prefill custom field
    const standardClasses = [
      "Fighter",
      "Wizard",
      "Rogue",
      "Cleric",
      "Barbarian",
      "Bard",
      "Druid",
      "Monk",
      "Paladin",
      "Ranger",
      "Sorcerer",
      "Warlock",
    ]
    const classSelect = document.getElementById("char-class")
    const classCustomInput = document.getElementById("char-class-custom")
    if (standardClasses.includes(character.class)) {
      classSelect.value = character.class
      classCustomInput.style.display = "none"
      classCustomInput.value = ""
    } else {
      classSelect.value = "Custom"
      classCustomInput.style.display = "block"
      classCustomInput.value = character.class || ""
    }

    document.getElementById("char-level").value = character.level
    document.getElementById("char-hp").value = character.maxHP
    document.getElementById("char-ac").value = character.armorClass
    document.getElementById("char-speed").value = character.speed
    document.getElementById("char-hitdice").value = character.hitDice
    document.getElementById("char-skills").value = character.skills.join(", ")
    document.getElementById("char-features").value = character.features.join(", ")
    document.getElementById("char-backstory").value = character.backstory

    // Update stats
    Object.entries(character.stats).forEach(([stat, value]) => {
      const slider = document.getElementById(`stat-${stat}`)
      if (slider) {
        slider.value = value
        slider.previousElementSibling.textContent = `${stat.substring(0, 3).toUpperCase()}: ${value}`
      }
    })

    // Scroll to form
    document.getElementById("character-form").scrollIntoView({ behavior: "smooth" })
    showMessage("Character generated! Review and customize as needed.", "success")
  } catch (error) {
    console.error("Error generating character:", error)
    showMessage("Failed to generate character: " + (error.message || "Unknown error"), "error")
  } finally {
    if (btn) {
      btn.disabled = false
      btn.textContent = originalText || "🎲 Generate Character with AI"
    }
  }
}
