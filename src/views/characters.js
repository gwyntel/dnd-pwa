/**
 * Characters View
 * List, create, and manage characters
 */

import { loadData, saveData } from "../utils/storage.js"
import { navigateTo } from "../router.js"
import { sendChatCompletion, parseStreamingResponse } from "../utils/openrouter.js"
import { isAuthenticated } from "../utils/auth.js"

export function renderCharacters() {
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
      <!-- Added gap and proper flex properties to prevent title/button overlap -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; margin-top: 2rem; gap: 1rem; flex-wrap: wrap;">
        <h1 style="margin: 0;">Your Characters</h1>
        <button id="new-character-btn" class="btn">+ New Character</button>
      </div>
      
      ${data.characters.length === 0 ? renderEmptyState() : renderCharacterList(data.characters)}
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
    <div class="card text-center" style="padding: 3rem;">
      <h2>No Characters Yet</h2>
      <p class="text-secondary mb-3">Create your first character to begin your adventure!</p>
      <div class="flex gap-2 justify-center" style="flex-wrap: wrap;">
        <a href="/characters/new" id="from-scratch-link" class="btn">Create with AI or From Scratch</a>
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
        <div class="card character-card" data-character-id="${char.id}" style="cursor: pointer; position: relative;">
          <button class="delete-btn" data-character-id="${char.id}" style="position: absolute; top: 1rem; right: 1rem; padding: 0.5rem; background: var(--error-color); border-radius: 6px; border: none; color: white; cursor: pointer;">✕</button>
          <h3>${escapeHtml(char.name)}</h3>
          <p class="text-secondary">Level ${char.level} ${char.race} ${char.class}</p>
          <div class="flex gap-2 mt-2" style="flex-wrap: wrap;">
            <span class="badge">HP: ${char.maxHP}</span>
            <span class="badge">AC: ${char.armorClass}</span>
          </div>
          <div class="mt-2" style="font-size: 0.875rem;">
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
          ${char.fromTemplate ? `<p class="text-secondary mt-2" style="font-size: 0.75rem;">From template: ${char.fromTemplate}</p>` : ""}
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

  const data = loadData()
  data.characters = data.characters.filter((c) => c.id !== characterId)
  saveData(data)

  // Re-render
  renderCharacters()
}

export function renderCharacterCreator(state = {}) {
  const app = document.getElementById("app")
  const data = loadData()
  const isEdit = state.params?.id
  const character = isEdit ? data.characters.find((c) => c.id === state.params.id) : null

  // Initialize form data
  const formData = character || {
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
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; margin-top: 1.5rem;">
        <h1>${isEdit ? "Edit Character" : "Create Character"}</h1>
        <a href="/characters" class="btn-secondary">Cancel</a>
      </div>

      ${
        !isEdit
          ? `
        <div class="card" style="margin-bottom: 1.5rem;">
          <h2 style="margin-top: 0;">Quick Start or AI-Assisted Character</h2>
          <p class="text-secondary" style="font-size: 0.9rem; margin-bottom: 0.75rem;">
            Start with an AI-generated hero, pick a beginner-friendly template, or build completely from scratch.
          </p>
          <label for="ai-random-prompt" style="display:block; margin-bottom:0.35rem; font-weight:500;">
            Describe your character idea (optional)
          </label>
          <textarea
            id="ai-random-prompt"
            rows="3"
            placeholder="e.g., A brave Human Fighter who protects others; level 1, simple and durable."
            style="width:100%; margin-bottom:0.5rem;"
          ></textarea>
          <button id="ai-random-generate-btn" class="btn" type="button">
            🎲 Generate Character with AI
          </button>
          <p class="text-secondary" style="font-size: 0.8rem; margin-top: 0.5rem;">
            Leave the box empty for a fully random character.
          </p>
        </div>
      `
          : ""
      }
      
      ${!isEdit && !creationMode ? renderCreationOptions(data.characterTemplates) : ""}
      
      <div class="card">
        <form id="character-form">
          <div class="mb-3">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Character Name *</label>
            <input type="text" id="char-name" value="${escapeHtml(formData.name)}" required placeholder="Enter character name">
          </div>
          
          <div class="grid grid-2 mb-3">
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Race *</label>
              <select id="char-race">
                ${["Human", "Elf", "Dwarf", "Halfling", "Dragonborn", "Gnome", "Half-Elf", "Half-Orc", "Tiefling", "Custom"]
                  .map((race) => `<option value="${race}" ${formData.race === race ? "selected" : ""}>${race}</option>`)
                  .join("")}
              </select>
              <input
                type="text"
                id="char-race-custom"
                placeholder="Enter custom race"
                style="margin-top: 0.35rem; width: 100%; display: ${
                  formData.race &&
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
                value="${
                  formData.race &&
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
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Class *</label>
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
                placeholder="Enter custom class"
                style="margin-top: 0.35rem; width: 100%; display: ${
                  formData.class &&
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
                value="${
                  formData.class &&
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
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Level</label>
            <input type="number" id="char-level" value="${formData.level}" min="1" max="20">
          </div>
          
          <h3 class="mb-2">Ability Scores</h3>
          <p class="text-secondary mb-2" style="font-size: 0.875rem;">Standard range: 8-18. Higher is better.</p>
          <div class="grid grid-2 mb-3">
            ${Object.entries(formData.stats)
              .map(
                ([stat, value]) => `
              <div>
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; text-transform: uppercase;">${stat.substring(0, 3)}: ${value}</label>
                <input type="range" id="stat-${stat}" min="3" max="20" value="${value}" style="width: 100%;">
              </div>
            `,
              )
              .join("")}
          </div>
          
          <div class="grid grid-2 mb-3">
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Max HP *</label>
              <input type="number" id="char-hp" value="${formData.maxHP}" min="1" required>
            </div>
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Armor Class (AC) *</label>
              <input type="number" id="char-ac" value="${formData.armorClass}" min="1" required>
            </div>
          </div>
          
          <div class="grid grid-2 mb-3">
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Speed (ft)</label>
              <input type="number" id="char-speed" value="${formData.speed}" min="0">
            </div>
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Hit Dice</label>
              <select id="char-hitdice">
                ${["1d4", "1d6", "1d8", "1d10", "1d12", "2d4", "2d6", "2d8", "2d10", "2d12"]
                  .map(
                    (dice) => `<option value="${dice}" ${formData.hitDice === dice ? "selected" : ""}>${dice}</option>`,
                  )
                  .join("")}
              </select>
            </div>
          </div>
          
          <div class="mb-3">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Skills (comma-separated)</label>
            <input type="text" id="char-skills" value="${formData.skills.join(", ")}" placeholder="e.g., Athletics, Stealth, Perception">
          </div>
          
          <div class="mb-3">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Features & Traits (comma-separated)</label>
            <input type="text" id="char-features" value="${formData.features.join(", ")}" placeholder="e.g., Second Wind, Sneak Attack">
          </div>
          
          <div class="mb-3">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Backstory (optional)</label>
            <textarea id="char-backstory" placeholder="Tell us about your character's history...">${escapeHtml(formData.backstory || "")}</textarea>
          </div>
          
          <button type="submit" class="btn" style="width: 100%;">${isEdit ? "Save Changes" : "Create Character"}</button>
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
  const standardRaces = ["Human","Elf","Dwarf","Halfling","Dragonborn","Gnome","Half-Elf","Half-Orc","Tiefling"]

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
  document.getElementById("character-form")?.addEventListener("submit", (e) => {
    e.preventDefault()
    saveCharacter(isEdit ? character.id : null)
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
}

async function generateCharacterWithLLM(userPrompt = "") {
  const systemPrompt = `You are a D&D 5e character generator.

Your job:
- Take the user's idea (if provided) and generate a complete, valid D&D 5e character.
- Always return a single JSON object that matches the schema below.
- Do NOT include markdown, comments, code fences, or any extra text. Return ONLY raw JSON.
- If you invent a custom race or class name, you MUST still fill all fields; it will be treated as a custom option in the UI.

JSON SCHEMA (MUST follow exactly):

{
  "name": string,                         // Character name
  "race": string,                         // Prefer one of:
                                          // "Human","Elf","Dwarf","Halfling","Dragonborn",
                                          // "Gnome","Half-Elf","Half-Orc","Tiefling"
                                          // BUT you MAY output a custom race name if strongly implied.
  "class": string,                        // Prefer one of:
                                          // "Fighter","Wizard","Rogue","Cleric","Barbarian",
                                          // "Bard","Druid","Monk","Paladin","Ranger",
                                          // "Sorcerer","Warlock"
                                          // BUT you MAY output a custom class name if strongly implied.
  "level": number,                        // 1-20. Prefer 1-10 unless the user specifies otherwise.
  "stats": {
    "strength": number,                   // 3-20
    "dexterity": number,                  // 3-20
    "constitution": number,               // 3-20
    "intelligence": number,               // 3-20
    "wisdom": number,                     // 3-20
    "charisma": number                    // 3-20
  },
  "maxHP": number,                        // Consistent with class + level + CON
  "armorClass": number,                   // Typically 10-20
  "speed": number,                        // Typically 25-35
  "hitDice": string,                      // ONE of:
                                          // "1d4","1d6","1d8","1d10","1d12",
                                          // "2d4","2d6","2d8","2d10","2d12"
  "skills": string[],                     // MUST be an array with at least 3 entries.
                                          // Use 5e skills or close variants, e.g.:
                                          // "Athletics","Acrobatics","Sleight of Hand","Stealth",
                                          // "Arcana","History","Investigation","Nature","Religion",
                                          // "Animal Handling","Insight","Medicine","Perception",
                                          // "Survival","Deception","Intimidation","Performance","Persuasion"
  "features": string[],                   // MUST be an array with at least 2 entries.
                                          // Use concrete feature-like entries, e.g.:
                                          // "Darkvision","Second Wind","Sneak Attack","Rage",
                                          // "Lay on Hands","Divine Sense","Spellcasting","Cunning Action"
  "backstory": string                     // 2-5 sentences of flavorful background
}

Rules:
- Always include ALL top-level fields shown above.
- Always include the full "stats" object with all six abilities.
- "skills" MUST be a non-empty array (ideally 3-8 items) describing proficiencies or specialties.
- "features" MUST be a non-empty array (ideally 2-8 items) describing class/race/unique traits.
- "hitDice" MUST be one of the listed dice strings.
- Chosen values MUST be internally consistent (race/class/level/stats/HP/AC/speed/hitDice/story).
- If the user prompt includes specifics (race, class, level, abilities, theme, tone, or constraints), you MUST respect them.
- Output MUST be valid JSON: double quotes for keys/strings, no trailing commas, no comments, no extra text.`

  try {
    const messages = [
      {
        role: "user",
        content:
          (userPrompt && userPrompt.trim().length
            ? `Generate a D&D 5e character based on this idea:\n"${userPrompt.trim()}".`
            : "Generate a random, creative D&D 5e character.") +
          "\n\nRespond ONLY with JSON matching the specified schema.",
      },
    ]

    // Get the default model or use a good default
    const data = loadData()
    const model = data.settings?.defaultNarrativeModel || "openai/gpt-4o-mini"

    const response = await sendChatCompletion(messages, model, {
      system: systemPrompt,
      temperature: 0.8,
    })

    let fullResponse = ""
    for await (const chunk of parseStreamingResponse(response)) {
      if (chunk.choices && chunk.choices[0]?.delta?.content) {
        fullResponse += chunk.choices[0].delta.content
      }
    }

    // Parse the JSON response
    const jsonMatch = fullResponse.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Invalid response format from LLM")
    }

    let characterData
    try {
      characterData = JSON.parse(jsonMatch[0])
    } catch (e) {
      console.error("Failed to parse LLM JSON:", e, fullResponse)
      throw new Error("Invalid JSON from AI. Please try again.")
    }

    // Basic shape validation with safer defaults instead of hard failure
    if (!characterData || typeof characterData !== "object") {
      throw new Error("AI response missing character data.")
    }

    // Ensure nested structures exist
    characterData.stats = characterData.stats || {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    }
    characterData.skills = Array.isArray(characterData.skills) ? characterData.skills : []
    characterData.features = Array.isArray(characterData.features) ? characterData.features : []

    // Fill critical fields with fallbacks if missing
    characterData.name = characterData.name || "AI Generated Hero"
    characterData.race =
      characterData.race || "Human"
    characterData.class =
      characterData.class || "Fighter"
    characterData.level =
      typeof characterData.level === "number" && characterData.level >= 1 && characterData.level <= 20
        ? characterData.level
        : 1
    characterData.maxHP = characterData.maxHP || 10
    characterData.armorClass = characterData.armorClass || 10
    characterData.speed = characterData.speed || 30
    characterData.hitDice = characterData.hitDice || "1d10"
    characterData.backstory = characterData.backstory || ""

    return characterData
  } catch (error) {
    console.error("Error calling LLM for character generation:", error)
    throw error
  }
}

function applyTemplate(templateId) {
  // First try: built-in suggested templates defined in renderCreationOptions
  const builtInTemplates = {
    template_knight: {
      id: "template_knight",
      name: "Brave Knight",
      race: "Human",
      class: "Fighter",
      level: 1,
      stats: {
        strength: 16,
        dexterity: 12,
        constitution: 14,
        intelligence: 8,
        wisdom: 10,
        charisma: 10,
      },
      maxHP: 12,
      armorClass: 16,
      speed: 30,
      hitDice: "1d10",
      skills: ["Athletics", "Intimidation"],
      features: ["Second Wind", "Fighting Style"],
      backstory:
        "You trained in the city guard and now seek adventure to prove your worth as a true warrior.",
      fromTemplate: "Brave Knight",
    },
    template_rogue: {
      id: "template_rogue",
      name: "Cunning Rogue",
      race: "Halfling",
      class: "Rogue",
      level: 1,
      stats: {
        strength: 8,
        dexterity: 16,
        constitution: 12,
        intelligence: 12,
        wisdom: 10,
        charisma: 14,
      },
      maxHP: 9,
      armorClass: 14,
      speed: 30,
      hitDice: "1d8",
      skills: ["Stealth", "Sleight of Hand", "Perception", "Deception"],
      features: ["Sneak Attack", "Thieves' Cant"],
      backstory:
        "You grew up on the streets, using quick wits and quicker hands to survive. Now you sell your talents to the highest bidder.",
      fromTemplate: "Cunning Rogue",
    },
    template_cleric: {
      id: "template_cleric",
      name: "Wise Cleric",
      race: "Dwarf",
      class: "Cleric",
      level: 1,
      stats: {
        strength: 12,
        dexterity: 10,
        constitution: 14,
        intelligence: 8,
        wisdom: 16,
        charisma: 10,
      },
      maxHP: 10,
      armorClass: 18,
      speed: 25,
      hitDice: "1d8",
      skills: ["Medicine", "Insight", "Religion"],
      features: ["Spellcasting", "Channel Divinity"],
      backstory:
        "You served faithfully at your temple, called now to bring your deity's light to dark places.",
      fromTemplate: "Wise Cleric",
    },
    template_wizard: {
      id: "template_wizard",
      name: "Mysterious Wizard",
      race: "High Elf",
      class: "Wizard",
      level: 1,
      stats: {
        strength: 8,
        dexterity: 14,
        constitution: 12,
        intelligence: 16,
        wisdom: 12,
        charisma: 8,
      },
      maxHP: 7,
      armorClass: 12,
      speed: 30,
      hitDice: "1d6",
      skills: ["Arcana", "Investigation", "History"],
      features: ["Spellcasting", "Arcane Recovery"],
      backstory:
        "You delved too deep into forbidden tomes, now driven to test your theories on the open road.",
      fromTemplate: "Mysterious Wizard",
    },
    template_ranger: {
      id: "template_ranger",
      name: "Wild Ranger",
      race: "Wood Elf",
      class: "Ranger",
      level: 1,
      stats: {
        strength: 12,
        dexterity: 16,
        constitution: 13,
        intelligence: 10,
        wisdom: 14,
        charisma: 8,
      },
      maxHP: 11,
      armorClass: 15,
      speed: 35,
      hitDice: "1d10",
      skills: ["Survival", "Nature", "Stealth", "Animal Handling"],
      features: ["Favored Enemy", "Natural Explorer"],
      backstory:
        "You have walked the deep forests since childhood, guiding travelers and hunting those who would harm the wild.",
      fromTemplate: "Wild Ranger",
    },
    template_bard: {
      id: "template_bard",
      name: "Charming Bard",
      race: "Half-Elf",
      class: "Bard",
      level: 1,
      stats: {
        strength: 8,
        dexterity: 14,
        constitution: 12,
        intelligence: 10,
        wisdom: 10,
        charisma: 16,
      },
      maxHP: 9,
      armorClass: 14,
      speed: 30,
      hitDice: "1d8",
      skills: ["Persuasion", "Performance", "Deception", "Insight"],
      features: ["Bardic Inspiration", "Jack of All Trades"],
      backstory:
        "You left home to chase stories, fame, and forbidden verses—your songs hide half-truths and rumors.",
      fromTemplate: "Charming Bard",
    },
    template_barbarian: {
      id: "template_barbarian",
      name: "Tough Barbarian",
      race: "Half-Orc",
      class: "Barbarian",
      level: 1,
      stats: {
        strength: 16,
        dexterity: 12,
        constitution: 16,
        intelligence: 8,
        wisdom: 10,
        charisma: 8,
      },
      maxHP: 15,
      armorClass: 14,
      speed: 30,
      hitDice: "1d12",
      skills: ["Athletics", "Intimidation", "Survival"],
      features: ["Rage", "Unarmored Defense"],
      backstory:
        "You proved your might in brutal tribal trials, now seeking greater foes to test your rage.",
      fromTemplate: "Tough Barbarian",
    },
  }

  const data = loadData()
  const templateFromBuiltIns = builtInTemplates[templateId]
  const template =
    templateFromBuiltIns ||
    (data.characterTemplates || []).find((t) => t.id === templateId)

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

function saveCharacter(existingId = null) {
  const data = loadData()

  const level = Number.parseInt(document.getElementById("char-level").value)
  const profBonus = Math.floor((level - 1) / 4) + 2

  const selectedRace = document.getElementById("char-race").value
  const customRace = (document.getElementById("char-race-custom")?.value || "").trim()
  const finalRace =
    selectedRace === "Custom"
      ? customRace || "Custom"
      : selectedRace

  const selectedClass = document.getElementById("char-class").value
  const customClass = (document.getElementById("char-class-custom")?.value || "").trim()
  const finalClass =
    selectedClass === "Custom"
      ? customClass || "Custom"
      : selectedClass

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
  }

  if (existingId) {
    // Update existing
    const index = data.characters.findIndex((c) => c.id === existingId)
    data.characters[index] = character
  } else {
    // Add new
    data.characters.push(character)
  }

  saveData(data)

  // Show success and navigate
  showMessage(existingId ? "Character updated!" : "Character created!", "success")
  setTimeout(() => {
    navigateTo("/characters")
  }, 1000)
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

function renderCreationOptions(existingTemplates = []) {
  const templates = [
    {
      id: "template_knight",
      name: "Brave Knight",
      tagline: "Master of sword and shield, protector of the innocent",
      class: "Fighter",
      race: "Human",
      level: 1,
      difficulty: "beginner",
      role: "Tank / Damage",
      bestFor: ["Combat", "Beginners", "Protecting Others"],
      icon: "⚔️",
      stats: { strength: 16, dexterity: 12, constitution: 14, intelligence: 8, wisdom: 10, charisma: 10 },
      maxHP: 12,
      armorClass: 16,
      skills: ["Athletics", "Intimidation"],
      inventory: [
        { item: "Longsword", equipped: true },
        { item: "Shield", equipped: true },
        { item: "Chain Mail", equipped: true },
        { item: "Adventurer's Pack", equipped: false },
      ],
      backstory:
        "You trained in the city guard and now seek adventure to prove your worth as a true warrior.",
      playstyleDesc:
        "Get close, draw aggro, and protect allies. Straightforward melee tank and damage dealer.",
      keyAbilities: ["Second Wind - Heal yourself once per rest", "Fighting Style - Defense or Dueling"],
    },
    {
      id: "template_rogue",
      name: "Cunning Rogue",
      tagline: "Sneaky, clever, and deadly when unseen",
      class: "Rogue",
      race: "Halfling",
      level: 1,
      difficulty: "beginner",
      role: "Skirmisher / Skill Monkey",
      bestFor: ["Stealth", "Traps", "Clever Play"],
      icon: "🗡️",
      stats: { strength: 8, dexterity: 16, constitution: 12, intelligence: 12, wisdom: 10, charisma: 14 },
      maxHP: 9,
      armorClass: 14,
      skills: ["Stealth", "Sleight of Hand", "Perception", "Deception"],
      inventory: [
        { item: "Shortsword", equipped: true },
        { item: "Dagger", equipped: true },
        { item: "Leather Armor", equipped: true },
        { item: "Thieves' Tools", equipped: false },
      ],
      backstory:
        "You grew up on the streets, using quick wits and quicker hands to survive. Now you sell your talents to the highest bidder.",
      playstyleDesc:
        "Flank enemies, use Sneak Attack, and handle traps and locks. Great for players who enjoy outsmarting opponents.",
      keyAbilities: ["Sneak Attack", "Thieves' Cant"],
    },
    {
      id: "template_cleric",
      name: "Wise Cleric",
      tagline: "Shield of faith and steel, guardian of allies",
      class: "Cleric",
      race: "Dwarf",
      level: 1,
      difficulty: "beginner",
      role: "Support / Off-Tank",
      bestFor: ["Healing", "Team Support", "New Players"],
      icon: "⛨",
      stats: { strength: 12, dexterity: 10, constitution: 14, intelligence: 8, wisdom: 16, charisma: 10 },
      maxHP: 10,
      armorClass: 18,
      skills: ["Medicine", "Insight", "Religion"],
      inventory: [
        { item: "Mace", equipped: true },
        { item: "Shield", equipped: true },
        { item: "Chain Mail", equipped: true },
        { item: "Holy Symbol", equipped: false },
        { item: "Healer's Kit", equipped: false },
      ],
      backstory:
        "You served faithfully at your temple, called now to bring your deity's light to dark places.",
      playstyleDesc:
        "Heal allies, bless the party, and hold the line in armor. Very forgiving and impactful.",
      keyAbilities: ["Spellcasting", "Channel Divinity / Turn Undead"],
    },
    {
      id: "template_wizard",
      name: "Mysterious Wizard",
      tagline: "Scholar of the arcane, master of reality's threads",
      class: "Wizard",
      race: "High Elf",
      level: 1,
      difficulty: "intermediate",
      role: "Controller / Blaster",
      bestFor: ["Tactical Play", "Creative Problem Solving"],
      icon: "📖",
      stats: { strength: 8, dexterity: 14, constitution: 12, intelligence: 16, wisdom: 12, charisma: 8 },
      maxHP: 7,
      armorClass: 12,
      skills: ["Arcana", "Investigation", "History"],
      inventory: [
        { item: "Quarterstaff", equipped: true },
        { item: "Spellbook", equipped: false },
        { item: "Component Pouch", equipped: false },
        { item: "Scholar's Pack", equipped: false },
      ],
      backstory:
        "You delved too deep into forbidden tomes, now driven to test your theories on the open road.",
      playstyleDesc:
        "Fragile but powerful caster. Control the battlefield and solve problems with spells.",
      keyAbilities: ["Spellcasting", "Arcane Recovery"],
    },
    {
      id: "template_ranger",
      name: "Wild Ranger",
      tagline: "Tracker, hunter, and master of the wilds",
      class: "Ranger",
      race: "Wood Elf",
      level: 1,
      difficulty: "intermediate",
      role: "Ranged / Scout",
      bestFor: ["Exploration", "Archery", "Nature Lovers"],
      icon: "🏹",
      stats: { strength: 12, dexterity: 16, constitution: 13, intelligence: 10, wisdom: 14, charisma: 8 },
      maxHP: 11,
      armorClass: 15,
      skills: ["Survival", "Nature", "Stealth", "Animal Handling"],
      inventory: [
        { item: "Longbow", equipped: true },
        { item: "Shortsword", equipped: true },
        { item: "Leather Armor", equipped: true },
        { item: "Explorer's Pack", equipped: false },
      ],
      backstory:
        "You have walked the deep forests since childhood, guiding travelers and hunting those who would harm the wild.",
      playstyleDesc:
        "Stay at range, support the party with scouting and tracking, and pick off enemies with precision.",
      keyAbilities: ["Favored Enemy (or equivalent)", "Natural Explorer"],
    },
    {
      id: "template_bard",
      name: "Charming Bard",
      tagline: "Silver tongue, sharp wit, and inspiring song",
      class: "Bard",
      race: "Half-Elf",
      level: 1,
      difficulty: "intermediate",
      role: "Support / Face",
      bestFor: ["Roleplay", "Buffing Allies", "Social Encounters"],
      icon: "🎵",
      stats: { strength: 8, dexterity: 14, constitution: 12, intelligence: 10, wisdom: 10, charisma: 16 },
      maxHP: 9,
      armorClass: 14,
      skills: ["Persuasion", "Performance", "Deception", "Insight"],
      inventory: [
        { item: "Rapier", equipped: true },
        { item: "Lute", equipped: false },
        { item: "Leather Armor", equipped: true },
        { item: "Diplomat's Pack", equipped: false },
      ],
      backstory:
        "You left home to chase stories, fame, and forbidden verses—your songs hide half-truths and rumors.",
      playstyleDesc:
        "Control conversations, inspire allies, and provide utility. Great for players who love talking and scheming.",
      keyAbilities: ["Bardic Inspiration", "Jack of All Trades"],
    },
    {
      id: "template_barbarian",
      name: "Tough Barbarian",
      tagline: "Raging warrior who refuses to fall",
      class: "Barbarian",
      race: "Half-Orc",
      level: 1,
      difficulty: "beginner",
      role: "Frontline / Damage",
      bestFor: ["Maximum Simplicity", "Hit Things Hard"],
      icon: "🪓",
      stats: { strength: 16, dexterity: 12, constitution: 16, intelligence: 8, wisdom: 10, charisma: 8 },
      maxHP: 15,
      armorClass: 14,
      skills: ["Athletics", "Intimidation", "Survival"],
      inventory: [
        { item: "Greataxe", equipped: true },
        { item: "Javelins", equipped: false },
        { item: "Hide Armor", equipped: true },
        { item: "Explorer's Pack", equipped: false },
      ],
      backstory:
        "You proved your might in brutal tribal trials, now seeking greater foes to test your rage.",
      playstyleDesc:
        "Point at enemy. Rage. Run forward. Hit. Very hard to kill; ideal for new players.",
      keyAbilities: ["Rage", "Unarmored Defense"],
    },
  ]

  return `
    <div class="mb-3">
      <div style="display:flex; justify-content: space-between; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
        <h2 style="margin:0;">Suggested Beginner Templates</h2>
        <span class="text-secondary" style="font-size: 0.8rem;">
          Pick a ready-to-play archetype, then tweak anything you like.
        </span>
      </div>
      <div class="grid grid-3">
        ${templates
          .map(
            (t) => `
          <div class="card template-card" data-template-id="${t.id}" style="cursor:pointer; display:flex; flex-direction:column; justify-content:space-between;">
            <div>
              <div style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem;">
                <h3 style="margin:0;">${t.icon} ${escapeHtml(t.name)}</h3>
                <span class="badge" style="font-size:0.7rem; text-transform:capitalize;">${escapeHtml(
                  t.difficulty,
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
            <button class="btn" style="margin-top:0.5rem; width:100%;">Use This Character</button>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
  `
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
    promptContainer.className = "card"
    promptContainer.style.marginBottom = "1rem"
    promptContainer.innerHTML = `
      <label style="display:block; margin-bottom:0.35rem; font-weight:500;">
        Describe your character idea (optional)
      </label>
      <textarea id="ai-random-prompt"
        rows="3"
        placeholder="e.g., A Tiefling rogue who escaped a cult and now hunts demons for coin; level 5, edgy but kind-hearted."
        style="width:100%; margin-bottom:0.5rem;"></textarea>
      <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
        <button id="ai-random-generate-btn" class="btn">🎲 Generate Character with AI</button>
        <span class="text-secondary" style="font-size:0.8rem;">
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
    document.getElementById("char-race").value = character.race
    document.getElementById("char-class").value = character.class
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
