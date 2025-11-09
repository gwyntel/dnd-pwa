/**
 * Worlds View
 * Manage campaign worlds with custom lore and system prompts
 */

import { loadData, saveData } from "../utils/storage.js"
import { sendChatCompletion, parseStreamingResponse } from "../utils/openrouter.js"

let editingWorldId = null

const WORLD_TEMPLATES = [
  {
    id: "template_classic_fantasy",
    name: "Classic Fantasy",
    settingType: "classic-fantasy",
    briefDescription: "Villages, dragons, and medieval kingdoms in a traditional high fantasy world.",
    fullDescription:
      "A timeless realm of sword and sorcery where brave heroes venture forth from cozy villages to face ancient dragons, explore mysterious dungeons, and navigate the politics of medieval kingdoms. Magic is studied in towers, clerics pray to benevolent gods, and evil lurks in forgotten places.",
    tone: "Heroic and adventurous with clear good vs evil",
    magicLevel: "medium",
    techLevel: "medieval",
    systemPrompt: `This is a classic high fantasy world inspired by traditional D&D settings. Medieval kingdoms rule the land, with castles, villages, and bustling market towns. Magic is real but not commonplace - wizards study in towers, clerics serve their gods, and magical items are rare treasures. 

Dragons are ancient and powerful beings. Dungeons hide forgotten treasures and dangers. The world has a clear sense of good vs evil - heroes are called to protect the innocent from dark forces like undead, demons, and evil wizards.

Common races include humans, elves, dwarves, halflings, and occasionally half-orcs or tieflings. Technology is medieval - swords, bows, plate armor, but no gunpowder. Travel is by foot, horse, or ship.

Tone: Heroic adventure with moments of wonder. Players should feel like classic fantasy heroes on an epic quest.`,
    startingLocation: "The village of Greenhollow, a peaceful farming community on the edge of the Whispering Woods",
  },
  {
    id: "template_urban_noir",
    name: "Urban Noir",
    settingType: "urban-noir",
    briefDescription: "City intrigue, thieves guilds, and political drama in a dark urban fantasy setting.",
    fullDescription:
      "The sprawling city of Shadowhaven never sleeps. In its maze of alleys and grand boulevards, nobles scheme in candlelit salons while thieves prowl the rooftops. Every faction has an agenda, every ally a secret, and trust is the rarest currency of all.",
    tone: "Dark, mysterious, morally grey with political intrigue",
    magicLevel: "low",
    techLevel: "renaissance",
    systemPrompt: `This is an urban fantasy noir setting centered on the city of Shadowhaven - a sprawling metropolis of stone and shadow where intrigue runs deeper than the sewers.

Magic exists but is subtle and often illegal. Street mages sell charms in back alleys, while the noble houses employ court wizards who wield magic with aristocratic discretion. Technology is renaissance-era: rapiers, crossbows, early gunpowder, printing presses.

The city is ruled by a council of noble houses, each with their own agenda. The Thieves Guild operates openly under a charter. The City Watch is overworked and underpaid. Corruption is everywhere.

Key factions: The Silver Council (nobles), The Black Hand (thieves guild), The Greycoats (city watch), The Veil (spy network), The Burned (fire cultists).

Tone: Noir detective stories meet fantasy. Morally grey situations, political intrigue, shadowy deals. Information is power. Trust no one. The mystery is as important as the action. Think Dishonored or Dragon Age's city of Kirkwall.`,
    startingLocation: "The Lamplight District, where taverns glow warmly but danger lurks in every shadow",
  },
  {
    id: "template_high_seas",
    name: "High Seas Adventure",
    settingType: "high-seas",
    briefDescription: "Pirates, naval combat, and island hopping across a vast archipelago.",
    fullDescription:
      "The Shattered Isles stretch across an endless ocean - hundreds of islands connected by trade routes and pirate raids. Ancient treasures lie buried on forgotten atolls, sea monsters hunt in the deep, and every ship's crew has their own code. The sea is freedom, danger, and destiny.",
    tone: "Adventurous and swashbuckling with nautical flavor",
    magicLevel: "medium",
    techLevel: "renaissance",
    systemPrompt: `This is a high seas adventure setting centered on the Shattered Isles - an archipelago of hundreds of islands connected by dangerous waters.

Ships are the primary means of travel. Naval combat, boarding actions, and ship-to-ship battles are common. Technology is age of sail: cannons, cutlasses, flintlock pistols, tall ships.

The islands vary wildly: jungle paradises, volcanic rocks, frozen northern isles, mysterious fog-shrouded atolls. Ancient civilizations left ruins and treasures. Sea monsters (krakens, dragon turtles, sahuagin) haunt the waters.

Key factions: The Merchant Navy (trade monopoly), The Free Captains (pirate alliance), The Storm Lords (island natives), The Tidecaller Cult (worships the sea goddess).

Magic is tied to the sea - weather control, water breathing, divination. Sailors are superstitious. Certain islands have unique magical properties.

Tone: Swashbuckling adventure! Think Pirates of the Caribbean meets D&D. Freedom, exploration, treasure hunting, and naval combat. Every island should feel unique. The sea is both beautiful and deadly.`,
    startingLocation: "Port Meridian, a bustling harbor city serving as the gateway to the Shattered Isles",
  },
  {
    id: "template_dungeon_crawler",
    name: "Dungeon Crawler",
    settingType: "dungeon-crawler",
    briefDescription: "Focus on underground exploration with less overworld - delve deep into ancient ruins.",
    fullDescription:
      "The world above has fallen to darkness. Survivors huddle in the Last Sanctuary, a fortress built at the entrance to the Endless Delve - a vast network of ancient dungeons, caves, and underground cities. All adventures begin with the question: how deep will you go?",
    tone: "Tense and atmospheric dungeon exploration",
    magicLevel: "high",
    techLevel: "mixed",
    systemPrompt: `This is a dungeon crawler setting focused on underground exploration. The surface world is dangerous and mostly abandoned - the real story happens in the depths.

The Endless Delve is a massive underground complex of interconnected dungeons, ancient ruins, natural caverns, and forgotten cities. Each level goes deeper. The deeper you go, the more dangerous and rewarding it becomes.

Base Camp: The Last Sanctuary, a fortified town built at the entrance to the Delve. This is the only safe place - a hub where adventurers rest, trade, and prepare for the next expedition.

Magic is common in the depths - ancient wards, magical traps, enchanted creatures. Technology is mixed - adventurers use whatever works. Magical light sources are essential.

Dungeon ecology: Each level has its own ecosystem. Monsters don't just wait in rooms - they patrol, hunt, and have territorial behaviors. Resources are scarce - food, water, light must be managed.

Tone: Tense atmospheric exploration. Resource management matters. Every delve is a risk vs reward calculation. Map the unknown. Survive the depths. Return to tell the tale. Think Dark Souls meets traditional dungeon crawling.`,
    startingLocation: "The Last Sanctuary, the only safe haven at the entrance to the Endless Delve",
  },
  {
    id: "template_dark_fantasy",
    name: "Dark Fantasy",
    settingType: "dark-fantasy",
    briefDescription: "Grimdark horror elements with morally grey choices and dark themes.",
    fullDescription:
      "The Old Kingdom is dying. The sun grows dimmer each year, the dead don't stay buried, and the gods have gone silent. In this world of ash and shadow, there are no heroes - only survivors who make terrible choices to see another dawn.",
    tone: "Dark, gritty, morally complex with horror elements",
    magicLevel: "medium",
    techLevel: "medieval",
    systemPrompt: `This is a dark fantasy setting inspired by grimdark literature, Dark Souls, and Berserk. The world is dying, hope is scarce, and every victory comes at a cost.

The Old Kingdom once prospered, but now it's fragmented into cursed lands, plague-ridden cities, and monster-infested wilds. The sun is fading - days grow shorter each year. Undead rise spontaneously. Demons slip through cracks in reality. The gods abandoned humanity long ago... or something worse.

Magic is powerful but corrupting. Every spell has a price - sanity, humanity, or worse. Magical items are often cursed. Power comes with consequences.

There is no clear good vs evil. NPCs have complex motivations. The "villains" may have sympathetic reasons. Heroes can fall to darkness. Choices are morally grey - sometimes you choose the lesser evil.

Tone: Grim, visceral, psychological. Horror elements are common - body horror, cosmic dread, psychological terror. Combat is brutal and dangerous. Death is always possible. But small moments of human connection and kindness shine brighter in the darkness. Not grimdark for edginess sake - darkness that makes the light matter.`,
    startingLocation: "Ashenmoor, a walled town barely holding back the encroaching darkness",
  },
  {
    id: "template_wilderness",
    name: "Wilderness Survival",
    settingType: "wilderness",
    briefDescription: "Monster-filled frontier where harsh nature and survival are constant challenges.",
    fullDescription:
      "Beyond the Last Wall lies the Untamed Wilds - an endless expanse of primordial forest, savage mountains, and monster-haunted plains. Civilization is a distant memory. Out here, only the prepared survive the night.",
    tone: "Survival-focused with naturalistic danger",
    magicLevel: "low",
    techLevel: "primitive",
    systemPrompt: `This is a wilderness survival setting focused on exploration and survival in a monster-filled frontier.

The world is mostly untamed wilderness - vast forests, mountains, swamps, and plains. Civilization exists only in small frontier outposts and isolated settlements. Between these safe points lies days or weeks of dangerous travel through wild lands.

Survival is key: Players must track rations, find clean water, make shelter, start fires, and avoid exposure. Weather matters. Seasons matter. Getting lost is a real danger.

The wilderness is actively hostile: Dire wolves, owlbears, giant spiders, dragons, and worse. Monsters aren't waiting in dungeons - they hunt, migrate, and have territories. Nature itself can be deadly - poisonous plants, dangerous terrain, natural disasters.

Technology is primitive - stone age to early bronze age. Bows, spears, simple tools. Finding metal is valuable. Magic is primal and shamanistic - nature spirits, animal totems, elemental forces.

Few NPCs: Most encounters are with nature and monsters. When you do meet other survivors, they're desperate, territorial, or need help. Every friendly NPC matters.

Tone: Survival horror meets exploration. The world is beautiful but deadly. Every journey is an expedition. Every night survived is a victory. Think Far Cry Primal meets Monster Hunter. Respect the wild or die to it.`,
    startingLocation: "Outpost Seven, a palisaded settlement on the edge of the Untamed Wilds",
  },
  {
    id: "template_planar",
    name: "Planar Adventure",
    settingType: "planar",
    briefDescription: "Travel between dimensions and planes with reality-bending adventures.",
    fullDescription:
      "The Material Plane is just the beginning. Beyond the veil lie infinite realities - the burning wastes of the Fire Plane, the crystalline cities of the Astral Sea, the nightmare realm of the Shadowfell. You are a planeswalker, and all of existence is your playground.",
    tone: "Surreal and fantastical with reality-bending elements",
    magicLevel: "high",
    techLevel: "mixed",
    systemPrompt: `This is a planar adventure setting where travel between different planes of existence is central to the story.

The Multiverse: Countless planes exist - some well-known (Elemental Planes, Feywild, Shadowfell, Upper/Lower Planes), others unique and strange. Each plane has its own rules, inhabitants, and dangers.

Planeshift is possible through: Portals (permanent or temporary), magical items, rituals, or natural phenomena. Finding reliable portal routes is valuable information.

Each plane should feel truly alien:
- Feywild: Whimsical but dangerous, time works differently, emotions amplified
- Shadowfell: Dark mirror of reality, life-draining, full of undead and despair
- Elemental Fire: Everything burns, fire-based life, volcanic landscapes
- Astral Sea: Weightless silver void, psychic phenomena, githyanki raiders
- Mechanus: Clockwork plane of absolute law and order
- The Far Realm: Reality breaks down, cosmic horror, madness-inducing

Create unique planes: The Living Library, The Singing Desert, The Infinite Staircase, The Clockwork Kingdom, The Dreaming Garden.

Planar travelers: Not everyone can planeshift. NPCs from different planes have wildly different perspectives and goals.

Tone: High fantasy meets science fantasy. Reality is malleable. Magic is everywhere. Each plane adventure feels completely different from the last. Think Planescape meets Doctor Who. Embrace the weird and wonderful.`,
    startingLocation: "Sigil, the City of Doors - a planar hub where portals to all realities converge",
  },
]

export function renderWorlds() {
  const app = document.getElementById("app")
  const data = loadData()

  if (!data.worlds || data.worlds.length === 0) {
    data.worlds = [
      {
        id: "world_default_classic_fantasy",
        name: "Default: Classic Fantasy Realm",
        settingType: "classic-fantasy",
        sourceType: "default",
        briefDescription: "Beginner-friendly heroic fantasy with clear good vs evil and straightforward adventure hooks.",
        fullDescription:
          "A welcoming, classic fantasy realm designed for quick-start play. Cozy villages, ancient ruins, and nearby threats give you immediate reasons to adventure without overwhelming lore. Magic exists but feels special. Heroes protect the innocent, explore ruins, and uncover secrets step by step.",
        tone: "Heroic, hopeful, beginner-friendly; emphasizes clarity, fun, and easy decision-making.",
        magicLevel: "medium",
        techLevel: "medieval",
        startingLocation:
          "The riverside town of Greenhollow, with an inn, a market, a small temple, a town watch, and rumors of trouble in the nearby woods.",
        systemPrompt: `You are running adventures in the Default Classic Fantasy Realm — a streamlined, beginner-friendly high fantasy setting.

CORE GOALS:
- Make it EASY for new players and DMs.
- Keep stakes clear and tone heroic with room for light drama.
- Offer obvious hooks, simple factions, and readable consequences.
- Avoid overwhelming lore; suggest, don't drown in details.

WORLD OVERVIEW:
- Greenhollow: Friendly riverside town, ideal home base. Key NPCs:
  - Mayor Elira Thorne: Kind but slightly overwhelmed, wants practical heroes.
  - Captain Bram: Town watch leader, honest and direct.
  - Sister Maelin: Temple priest, healer and quest-giver.
  - Old Tamsin: Retired adventurer, local rumors and map fragments.
- Nearby Locations:
  - Whispering Woods: Goblins, wolves, fey lights, lost shrines.
  - Old Watchtower: Bandits or cultists; simple but dramatic dungeon.
  - Crystalford Mine: Miners missing, strange magic or monsters below.
- Factions:
  - Town Watch (order and safety),
  - Road Wardens (travelers and caravans),
  - Hidden Cult or Dark Mage (slow-burn villain).
  Keep them simple and readable.

MAGIC & TONE:
- Magic exists and is understood but not mundane.
- Standard fantasy races and classes fit easily.
- Moral compass leans towards clear good vs evil, but allow nuance if players seek it.

DM/AI GUIDELINES:
- Give 2–3 clear options instead of 10 vague ones.
- Explain rules, abilities, and consequences in plain language.
- Offer gentle safety tools: check in, tone check, content check.
- Encourage teamwork, heroism, and creative problem solving.
- When in doubt, choose the option that keeps things fun, fair, and flowing.

Use this prompt to ground scenes, NPCs, quests, and descriptions so that new players feel confident and excited from the first session.`,
        createdAt: new Date().toISOString(),
        isDefault: true,
      },
    ]
    saveData(data)
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
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; margin-top: 1.5rem;">
        <h1>Worlds</h1>
        <button id="create-world-btn" class="btn">+ New World</button>
      </div>
      
      <div id="world-form-container"></div>
      
      <div class="worlds-grid">
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
      const data = loadData()
      renderWorldForm(data.worlds.find((w) => w.id === editingWorldId))
    })
  })

  // Delete buttons
  document.querySelectorAll(".delete-world-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault()
      e.stopPropagation()
      const worldId = e.target.closest("button").dataset.worldId
      const data = loadData()
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
        data.worlds = data.worlds.filter((w) => w.id !== worldId)
        saveData(data)
        renderWorlds()
      }
    })
  })
}

function renderWorldCard(world, games) {
  const gamesUsingWorld = games.filter((g) => g.worldId === world.id).length

  return `
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
        <div style="flex: 1;">
          <h3>${world.name} ${world.isDefault ? '<span class="badge">Default</span>' : ""}</h3>
          <p class="text-secondary" style="font-size: 0.875rem;">${world.briefDescription}</p>
          ${gamesUsingWorld > 0 ? `<p class="text-secondary" style="font-size: 0.75rem; margin-top: 0.5rem;">Used in ${gamesUsingWorld} game${gamesUsingWorld > 1 ? "s" : ""}</p>` : ""}
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn-icon edit-world-btn" data-world-id="${world.id}" title="Edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          ${
            !world.isDefault
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
      
      <div style="background: var(--card-bg-secondary); padding: 1rem; border-radius: 0.5rem; margin-top: 1rem;">
        <strong style="font-size: 0.875rem;">System Prompt:</strong>
        <p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.5rem; white-space: pre-wrap; max-height: 150px; overflow-y: auto;">${world.systemPrompt}</p>
      </div>
    </div>
  `
}

function renderWorldCreationOptions() {
  const container = document.getElementById("world-form-container")

  container.innerHTML = `
    <div class="card" style="margin-bottom: 2rem; border: 2px solid var(--primary);">
      <h2>Create New World</h2>
      <p class="text-secondary mb-3">Choose how you'd like to create your world:</p>
      
      <div style="display: grid; gap: 1rem;">
        <button id="option-template" class="btn" style="text-align: left; padding: 1rem;">
          <strong>📚 Use a Template</strong><br>
          <span style="font-size: 0.875rem; font-weight: normal;">Start with a pre-made setting (Classic Fantasy, Urban Noir, etc.)</span>
        </button>
        
        <button id="option-ai" class="btn-secondary" style="text-align: left; padding: 1rem;">
          <strong>✨ Generate with AI</strong><br>
          <span style="font-size: 0.875rem; font-weight: normal;">Describe your world idea and let AI create the details</span>
        </button>
        
        <button id="option-custom" class="btn-secondary" style="text-align: left; padding: 1rem;">
          <strong>✏️ Custom (Manual Entry)</strong><br>
          <span style="font-size: 0.875rem; font-weight: normal;">Build your world from scratch with full control</span>
        </button>
      </div>
      
      <button id="cancel-options-btn" class="btn-secondary mt-3" style="width: 100%;">Cancel</button>
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
    <div class="card" style="margin-bottom: 2rem; border: 2px solid var(--primary);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h2>Choose a Template</h2>
        <button id="back-to-options" class="btn-secondary">← Back</button>
      </div>
      
      <div style="display: grid; gap: 1rem;">
        ${WORLD_TEMPLATES.map(
          (template) => `
          <div class="card" style="cursor: pointer; border: 2px solid var(--border); transition: border-color 0.2s;" 
               data-template-id="${template.id}"
               onmouseover="this.style.borderColor='var(--primary)'"
               onmouseout="this.style.borderColor='var(--border)'">
            <h3>${template.name}</h3>
            <p class="text-secondary" style="font-size: 0.875rem; margin-bottom: 0.5rem;">${template.briefDescription}</p>
            <p style="font-size: 0.875rem; margin-bottom: 0.5rem;">${template.fullDescription}</p>
            <div style="display: flex; gap: 1rem; font-size: 0.75rem; color: var(--text-secondary);">
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
    <div class="card" style="margin-bottom: 2rem; border: 2px solid var(--primary);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h2>Generate World with AI</h2>
        <button id="back-to-options" class="btn-secondary">← Back</button>
      </div>
      
      <form id="ai-generation-form">
        <div class="mb-3">
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Describe your world idea *</label>
          <textarea 
            id="world-idea" 
            required 
            rows="4"
            placeholder="e.g., A steampunk city built on the back of a giant turtle&#10;Post-apocalyptic wasteland where magic returned after nuclear war&#10;Underwater kingdom of merfolk and sea monsters"
          ></textarea>
          <p class="text-secondary mt-1" style="font-size: 0.875rem;">
            Be as creative as you want! The AI will generate a complete world setting based on your description.
          </p>
        </div>
        
        <div style="display: flex; gap: 0.5rem;">
          <button type="submit" class="btn">Generate World</button>
          <button type="button" id="cancel-ai-btn" class="btn-secondary">Cancel</button>
        </div>
      </form>
      
      <div id="generation-status" style="margin-top: 1rem; display: none;">
        <p class="text-secondary">✨ Generating your world...</p>
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
    const data = loadData()
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
        "systemPrompt",
        "startingLocation",
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
        systemPrompt: { type: "string" },
        startingLocation: { type: "string" },
      },
    }

    const baseInstructions = `You are a creative world builder for D&D campaigns. Based on the following description, create a detailed world setting.

User's world idea: "${idea}"

Respond ONLY with a single JSON object representing the world, following the specified schema. Do not include markdown, code fences, or commentary.`

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

    const response = await sendChatCompletion(messages, model, requestOptions)

    let fullResponse = ""

    for await (const chunk of parseStreamingResponse(response)) {
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
      typeof generatedWorld.systemPrompt !== "string"
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
    systemPrompt: "",
    startingLocation: "",
  }

  let headerText = "Create New World"
  if (isEditing) headerText = "Edit World"
  else if (isTemplate) headerText = `Using Template: ${formData.name}`
  else if (isAIGenerated) headerText = "Review AI Generated World"

  container.innerHTML = `
    <div class="card" style="margin-bottom: 2rem; border: 2px solid var(--primary);">
      <h2>${headerText}</h2>
      ${isAIGenerated ? '<p class="text-secondary mb-3">Review and edit the generated world before saving.</p>' : ""}
      
      <form id="world-form">
        <div class="mb-3">
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">World Name *</label>
          <input type="text" id="world-name" required placeholder="e.g., Forgotten Realms" value="${formData.name}">
        </div>
        
        <div class="mb-3">
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Brief Description *</label>
          <input type="text" id="world-description" required placeholder="One sentence summary" value="${formData.briefDescription}">
        </div>
        
        <div class="mb-3">
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Full Description (Optional)</label>
          <textarea 
            id="world-full-description" 
            rows="3"
            placeholder="2-3 paragraph detailed description"
          >${formData.fullDescription || ""}</textarea>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
          <div>
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Magic Level</label>
            <select id="world-magic-level">
              <option value="none" ${formData.magicLevel === "none" ? "selected" : ""}>None</option>
              <option value="low" ${formData.magicLevel === "low" ? "selected" : ""}>Low</option>
              <option value="medium" ${formData.magicLevel === "medium" ? "selected" : ""}>Medium</option>
              <option value="high" ${formData.magicLevel === "high" ? "selected" : ""}>High</option>
            </select>
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Tech Level</label>
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
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Tone (Optional)</label>
          <input type="text" id="world-tone" placeholder="e.g., Dark and gritty, Lighthearted adventure" value="${formData.tone || ""}">
        </div>
        
        <div class="mb-3">
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Starting Location (Optional)</label>
          <input type="text" id="world-starting-location" placeholder="e.g., The bustling port city of Meridian" value="${formData.startingLocation || ""}">
        </div>
        
        <div class="mb-3">
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">System Prompt *</label>
          <textarea 
            id="world-system-prompt" 
            required 
            rows="10"
            placeholder="Describe the world's lore, rules, tone, magic system, technology level, major factions, etc. This will guide the AI DM during adventures in this world."
            style="resize: vertical;"
          >${formData.systemPrompt}</textarea>
          <p class="text-secondary mt-1" style="font-size: 0.875rem;">
            This is the most important field - it sets the context for all adventures in this world.
          </p>
        </div>
        
        <div style="display: flex; gap: 0.5rem;">
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
  const data = loadData()
  const name = document.getElementById("world-name").value.trim()
  const briefDescription = document.getElementById("world-description").value.trim()
  const fullDescription = document.getElementById("world-full-description").value.trim()
  const magicLevel = document.getElementById("world-magic-level").value
  const techLevel = document.getElementById("world-tech-level").value
  const tone = document.getElementById("world-tone").value.trim()
  const startingLocation = document.getElementById("world-starting-location").value.trim()
  const systemPrompt = document.getElementById("world-system-prompt").value.trim()

  if (!name || !briefDescription || !systemPrompt) {
    alert("Please fill in all required fields.")
    return
  }

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
      world.systemPrompt = systemPrompt
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
      systemPrompt,
      createdAt: new Date().toISOString(),
      isDefault: false,
    }
    data.worlds.push(newWorld)
  }

  saveData(data)
  editingWorldId = null
  renderWorlds()
}
