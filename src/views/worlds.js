/**
 * Worlds View
 * Manage campaign worlds with custom lore and system prompts
 */

import { loadData, saveData } from "../utils/storage.js"
import { getProvider } from "../utils/model-utils.js"

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
    systemPrompt: `You are running adventures in an Urban Noir fantasy setting centered on the city of Shadowhaven — a dense metropolis of stone, smoke, and secrets.

WORLD & GENRE:
- Renaissance-adjacent tech: rapiers, crossbows, early gunpowder, printing presses, carriages; no modern firearms or electronics.
- Magic exists but is subtle, restricted, or illegal. Hedge mages, back-alley charms, sanctioned court wizards.
- Factions and neighborhoods define the city more than wilderness; politics, crime, and reputation matter.

KEY FACTIONS & ELEMENTS:
- The Silver Council: Noble houses ruling from gilded halls; public order hides private corruption.
- The Black Hand: Chartered Thieves Guild balancing crime and “order” in the underworld.
- The Greycoats: Overworked city watch; individually honest or corrupt as fits the scene.
- The Veil: Spy network trading in secrets, blackmail, and whispers.
- The Burned: Fire-obsessed cult or movement, dangerous and unpredictable.
- Districts: Lamplight District (taverns, informants), Noble Quarter, Docks, Warrens, Old Temple Row.
Use these as flexible tools, not rigid canon.

TONE:
- Noir: moral ambiguity, hard choices, compromises. Information is power.
- Keep it grounded: small details (rain on cobblestones, flickering lamps, hushed threats) sell the mood.
- Do not force grimdark torture porn; imply more than you show; keep it playable.

AI DM GUIDELINES:
- Always follow global system/dice/tag rules; do not invent incompatible mechanics.
- Emphasize investigations, intrigue, favors, heists, and dilemmas over random monster fights.
- Present 2–3 clear actionable leads (e.g., “follow the courier”, “bribe the clerk”, “stake out the warehouse”).
- Make consequences legible: reputations shift, factions react, laws matter.
- Preserve player agency: never decide their betrayals or compromises; offer pressures, not forced outcomes.
- Tie clues together logically; reward clever deductions rather than opaque mystery walls.

Use this prompt to frame Shadowhaven as a living, breathing city of intrigue where every choice leaves a mark.`,
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
    systemPrompt: `You are running adventures in a High Seas setting centered on the Shattered Isles — a vast archipelago of ports, coves, and uncharted waters.

WORLD & GENRE:
- Age-of-sail tech: tall ships, cannons, cutlasses, flintlock pistols; no modern engines or radio.
- Magic is real and often tied to the sea, storms, stars, and ancient ruins.
- The Shattered Isles are diverse: jungle islands, volcanic chains, haunted reefs, fog-shrouded atolls, frozen northern holds.
- Sea monsters (krakens, dragon turtles, sahuagin, sirens) and supernatural storms are credible threats.

KEY FACTIONS:
- Merchant Navy: Trade powers, convoys, monopolies, private security.
- Free Captains: Pirate confederation with shifting codes and grudges.
- Storm Lords: Indigenous island leaders and shamans, guardians of local seas and spirits.
- Tidecaller Cult: Fanatics devoted to a sea deity; can be ally, threat, or both.
Use factions to create choices at sea, not just random encounters.

TONE:
- Swashbuckling, adventurous, cinematic.
- Emphasize exploration, daring plans, boarding actions, treasure maps, and moral choices at sea.
- Allow both heroic pirates and principled navy officers; do not assume pure villainy unless players lean into it.

AI DM GUIDELINES:
- Follow global system/dice/tag rules consistently.
- Present strong hooks: a mysterious chart, a rival captain, a cursed island, a blockade, a storm deadline.
- Offer 2–3 concrete options: e.g., “sneak in at night”, “parley under truce flag”, “ram through and board”.
- Make ship position, wind, and weather matter in description without drowning players in simulation.
- Make consequences sea-tangible: damaged rigging, angry factions, lost cargo, new allies.

Use this to keep all island and naval adventures grounded in a coherent, magical age-of-sail fantasy.`,
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
    systemPrompt: `You are running a Dungeon Crawler campaign focused on the Endless Delve — a sprawling underworld megastructure beneath a fragile surface world.

WORLD & STRUCTURE:
- The surface is dangerous, fading, or politically unstable; the true frontier is below.
- The Endless Delve: layered dungeons, ruins, caverns, fungal forests, lost cities, aberrant domains.
- The deeper the level, the higher the threat and the greater the reward.

ANCHOR:
- The Last Sanctuary: fortified hub at the Delve’s mouth.
  - Safe rest, gear, rumors, quest givers, faction reps.
  - Treat it as a stable base loop between expeditions.

MECHANICAL FOCUS:
- Resource pressure: light, food, spells, hit points, conditions.
- Spatial awareness: chokepoints, verticality, secret doors, shortcuts.
- Monsters as ecosystems: patrols, lairs, reactions; not static bags of XP.

TONE:
- Tense, atmospheric exploration; not pure slaughter.
- Telegraph danger; let players opt into deeper risk.
- Victories feel earned when they extract alive with maps, loot, and scars.

AI DM GUIDELINES:
- Follow global system/dice/tag rules; clearly call for and resolve checks and saves.
- Present clear navigation choices: “left to the dripping corridor”, “right toward faint chanting”, “back to Sanctuary”.
- Use 2–3 sharp options per beat; avoid infinite branching noise.
- Track consequences across delves: cleared routes, awakened threats, evolving factions.
- Never force a TPK via hidden no-win traps; foreshadow major threats.

Use this to run tightly looped, satisfying delve-return cycles with mounting stakes.`,
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
    systemPrompt: `You are running a Dark Fantasy setting in the dying Old Kingdom — a world of curses, plagues, and fallen oaths.

WORLD & MAGIC:
- The sun wanes; harvests fail; undead and horrors slip into the world.
- Magic is potent but tainted; bargains, blood, and forbidden texts leave marks.
- Holy power may exist but feels distant, conditional, or compromised.
- Cities are paranoid; countryside is monster-haunted.

TONE:
- Grim, weighty, morally complex — but not edge-lord shock for its own sake.
- Victories are costly; survival and small mercies matter.
- Show horror elements (body horror, cosmic dread, tragedy) with care and consent; allow fade-to-black.

FACTIONS & THEMES:
- Fragmented nobles clinging to power.
- Cults, inquisitions, heretical orders, desperate commoners.
- Themes: corruption, sacrifice, faith vs nihilism, what it costs to protect others.

AI DM GUIDELINES:
- Always follow global system/dice/tag rules; communicate DCs and effects clearly.
- Present agonizing but meaningful choices, not rigged no-wins.
- Offer 2–3 options that highlight cost vs consequence (“save the village OR stop the ritual in time”).
- Preserve player agency: never dictate that PCs “go insane” or “turn evil” without player buy-in; instead, offer tempting power and narrative consequences.
- Highlight fleeting hope: bonds, oaths, minor miracles; let light exist so darkness has contrast.

Use this to anchor a coherent dark fantasy tone that challenges players without stripping control.`,
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
    systemPrompt: `You are running a Wilderness Survival setting beyond the Last Wall — an Untamed Wild of primordial forests, peaks, and monsters.

WORLD:
- Sparse outposts (like Outpost Seven) cling to the edge of an endless wild.
- Between havens: days of difficult travel through trackless forests, bogs, cliffs, tundra.
- Predators and monsters hunt, migrate, defend territory; nature is an active force.

MECHANICAL FOCUS:
- Emphasize survival elements: food, water, shelter, weather, navigation.
- Do not micromanage every ration roll, but make these factors matter at key moments.
- Travel choices (route, pace, caution) should influence encounters and risk.

TONE:
- Harsh but awe-inspiring: beauty and danger intertwined.
- “Survival horror meets exploration” without constant hopelessness.

AI DM GUIDELINES:
- Follow global system/dice/tag rules; clearly call for checks (Survival, Perception, etc.) and explain effects.
- Present 2–3 clear options when traveling or camping: safer vs faster, exposed vs concealed, help vs ignore a signal fire.
- Telegraph big threats (tracks, distant roars, stormfronts) so players can choose their risk.
- Make friendly or neutral NPCs rare but significant; allies and safe spots matter.
- Reward preparation, caution, and creative use of terrain and resources.

Use this to keep the frontier coherent: every journey is a choice to challenge the Wild on the players’ terms.`,
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
    systemPrompt: `You are running a Planar Adventure campaign where travel between planes is central to play.

FRAME:
- The Material Plane is only one stop; countless planes exist with distinct laws, cultures, and dangers.
- Examples: Feywild, Shadowfell, Elemental Planes, Astral Sea, Mechanus, Far Realm, plus original planes.
- Portals, rituals, relics, and cosmic events enable movement; routes and keys are precious information.

DESIGN PRINCIPLES:
- Each plane must feel mechanically and thematically distinct:
  - Change gravity, time, magic behavior, social norms, hazards.
  - Telegraphed clearly so players can reason about them.
- Reuse some anchors (planar hubs, guides, factions) so the campaign stays navigable.

TONE:
- High fantasy meets weird fiction; wondrous, dangerous, occasionally surreal.
- Avoid incoherent randomness: each scene should follow from the established rules of its plane.

AI DM GUIDELINES:
- Follow global system/dice/tag rules; adapt descriptions and consequences to each plane’s logic.
- When entering a new plane, briefly state:
  - How the environment works (gravity, air, magic quirks),
  - Who/what is dominant here,
  - One or two immediate hooks.
- Present 2–3 concrete options that interact with planar traits, not just “fight or ignore”.
- Preserve player agency: portals, bargains, and cosmic forces may constrain, but do not fully script their path.
- Let planar factions (inevitables, archfey, fiends, modrons, etc.) have consistent goals that players can understand and leverage.

Use this to keep planar travel wild yet structured, always grounded in understandable rules per plane.`,
    startingLocation: "Sigil, the City of Doors - a planar hub where portals to all realities converge",
  },
]

export function renderWorlds() {
  const app = document.getElementById("app")
  const data = loadData()

  if (!data.worlds || data.worlds.length === 0) {
    // Seed with the canonical default world.
    // Must remain in sync with DEFAULT_DATA.worlds[0] in src/utils/storage.js.
    data.worlds = [
      {
        ...JSON.parse(
          JSON.stringify({
            id: "world_default_classic_fantasy",
            name: "Default: Classic Fantasy Realm",
            settingType: "classic-fantasy",
            sourceType: "default",
            briefDescription:
              "Beginner-friendly heroic fantasy with clear good vs evil, standard D&D-style races, and straightforward adventure hooks.",
            fullDescription:
              "A welcoming, classic fantasy realm designed for quick-start play. Cozy villages, nearby ruins, and local threats provide immediate reasons to adventure without overwhelming lore. Magic exists and is respected but feels special rather than mundane. Standard fantasy ancestries (humans, elves, dwarves, halflings, etc.) and familiar classes fit naturally. Technology is medieval: swords, bows, armor, ships, no firearms or modern industry unless the user explicitly adds them.",
            tone:
              "Heroic, hopeful, and beginner-friendly. Clear stakes, readable consequences, and a focus on fun, fairness, and collaboration.",
            magicLevel: "medium",
            techLevel: "medieval",
            startingLocation:
              "The riverside town of Greenhollow, with an inn, a market, a small temple, a town watch, and rumors of trouble in the nearby woods.",
            systemPrompt: `You are running adventures in the Default Classic Fantasy Realm — a streamlined, beginner-friendly high fantasy setting.

CORE INTENT:
- Make it EASY for new players and GMs.
- Keep tone heroic and inviting, with clear threats and clear ways to be awesome.
- Provide obvious adventure hooks without heavy lore dumps.
- Respect player agency and the game's mechanical constraints.

WORLD OVERVIEW:
- Baseline: A classic medieval fantasy realm with magic, monsters, and ancient ruins.
  - Magic exists, studied by wizards and guided by priests, but is not mundane consumer tech.
  - Standard fantasy ancestries (humans, elves, dwarves, halflings, etc.) and classes fit smoothly.
  - Medieval tech level: swords, bows, armor, sailing ships; no guns or modern industry unless the user/world explicitly permits them.
- Home Base — Greenhollow:
  - Friendly riverside town and default starting hub.
  - Key NPCs (examples, adapt as needed):
    - Mayor Elira Thorne: Capable but overstretched; values practical heroes.
    - Captain Bram: Town watch leader, honest and blunt.
    - Sister Maelin: Temple priest and healer; a natural quest-giver.
    - Old Tamsin: Retired adventurer who shares rumors, maps, and gentle guidance.
- Nearby Hooks:
  - Whispering Woods: Goblins, wolves, fey lights, lost shrines, mysterious tracks.
  - Old Watchtower: Bandits or a small cult; straightforward but dramatic dungeon site.
  - Crystalford Mine: Miners missing, strange lights and sounds below.
- Factions (keep simple and readable):
  - Town Watch (order and safety),
  - Road Wardens (caravans and travel),
  - A Hidden Cult or Shadowy Mage (slow-burn villain behind local troubles).

TONE & GENRE:
- Heroic fantasy with room for wonder, suspense, and light drama.
- Default to clear good vs evil. Moral nuance is allowed, but do not force grimdark by default.
- Maintain a welcoming tone suitable for new or cautious groups.

AI DM BEHAVIOR GUIDELINES:
- Always follow the global system + tool rules, tag formats, and dice/roll semantics.
- Present 2–3 clear, meaningful options instead of long unfocused lists.
- When rules or mechanics are involved, explain outcomes and difficulties in plain language.
- Never remove player agency: offer consequences and choices, do not decide for them.
- Use safety tools lightly but explicitly when appropriate (tone checks, content checks).
- When uncertain, choose the path that keeps play fun, fair, comprehensible, and grounded in this realm.

Use this as the default world context whenever a game uses the default world and no custom world overrides it.`,
            createdAt: new Date().toISOString(),
            isDefault: true,
          }),
        ),
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
    <div class="card card-clickable">
      <div class="flex justify-between items-start mb-1">
        <div class="flex-1">
          <h3>${world.name} ${world.isDefault ? '<span class="badge">Default</span>' : ""}</h3>
          <p class="text-secondary text-sm">${world.briefDescription}</p>
          ${
            gamesUsingWorld > 0
              ? `<p class="text-secondary text-xs mt-1">Used in ${gamesUsingWorld} game${
                  gamesUsingWorld > 1 ? "s" : ""
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
      
      <div class="mt-1 system-prompt-box">
        <strong class="text-sm">System Prompt:</strong>
        <p class="text-secondary text-sm system-prompt-content">${world.systemPrompt}</p>
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

    const baseInstructions = `You are an expert TTRPG worldbuilding assistant for a D&D 5e-adjacent game system.

You MUST:
- Obey the provided JSON schema EXACTLY.
- Output ONLY a single valid JSON object. NO markdown, NO code fences, NO commentary.
- Design settings that are directly usable as AI DM system prompts, consistent with structured patterns:
  - Clearly state: genre, tech level, magic level, core tone.
  - Provide a strong \"briefDescription\" hook (1 sentence).
  - Provide a concise but rich \"fullDescription\" (2-4 paragraphs max).
  - Specify a clear \"startingLocation\" that works as a session-0 hub.
  - Write a \"systemPrompt\" that:
    - Begins with \"You are running adventures in ...\" or similar.
    - Summarizes key lore anchors (regions/cities/factions/terrain) without excessive bloat.
    - Clearly states tech/magic constraints (e.g., no modern guns unless user idea demands it).
    - Defines a coherent tone (heroic, noir, grim, etc.) and content boundaries.
    - Includes concrete AI DM guidelines:
      - Always follow the platform's global system/tool/tag/dice rules (no custom mechanics that conflict).
      - Present 2–3 clear, meaningful options instead of sprawling lists.
      - Keep player agency: never dictate character thoughts, choices, or irreversible corruption without consent.
      - Make consequences legible and grounded in the setting's logic.
      - Respect the table's content preferences: describe violence, horror, and mature themes in a way that fits the requested tone without assuming restrictions.

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
          <label class="form-label">System Prompt *</label>
          <textarea 
            id="world-system-prompt" 
            required 
            rows="10"
            placeholder="Describe the world's lore, rules, tone, magic system, technology level, major factions, etc. This will guide the AI DM during adventures in this world."
            style="resize: vertical;"
          >${formData.systemPrompt}</textarea>
          <p class="text-secondary mt-1 text-sm">
            This is the most important field - it sets the context for all adventures in this world.
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
