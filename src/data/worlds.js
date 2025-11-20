/**
 * World Templates
 * Pre-made campaign settings for different genres and themes
 */

export const WORLD_TEMPLATES = [
  {
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
    coreIntent: [
      "Make it EASY for new players and GMs.",
      "Keep tone heroic and inviting, with clear threats and clear ways to be awesome.",
      "Provide obvious adventure hooks without heavy lore dumps.",
      "Respect player agency and the game's mechanical constraints."
    ],
    worldOverview: [
      "Baseline: A classic medieval fantasy realm with magic, monsters, and ancient ruins.",
      "Magic exists, studied by wizards and guided by priests, but is not mundane consumer tech.",
      "Standard fantasy ancestries (humans, elves, dwarves, halflings, etc.) and classes fit smoothly.",
      "Medieval tech level: swords, bows, armor, sailing ships; no guns or modern industry unless the user/world explicitly permits them."
    ],
    coreLocations: [
      "Home Base — Greenhollow: Friendly riverside town and default starting hub.",
      "Whispering Woods: Goblins, wolves, fey lights, lost shrines, mysterious tracks.",
      "Old Watchtower: Bandits or a small cult; straightforward but dramatic dungeon site.",
      "Crystalford Mine: Miners missing, strange lights and sounds below."
    ],
    coreFactions: [
      "Town Watch (order and safety)",
      "Road Wardens (caravans and travel)",
      "A Hidden Cult or Shadowy Mage (slow-burn villain behind local troubles)"
    ],
    isDefault: true,
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
    startingLocation: "The Lamplight District, where taverns glow warmly but danger lurks in every shadow",
    coreIntent: [
      "Focus on intrigue, secrets, and social maneuvering.",
      "Combat is deadly and often a fail state; stealth and talk are key.",
      "Moral ambiguity is central; no clear good guys."
    ],
    worldOverview: [
      "Renaissance-adjacent tech: rapiers, crossbows, early gunpowder, printing presses, carriages.",
      "Magic exists but is subtle, restricted, or illegal. Hedge mages, back-alley charms, sanctioned court wizards.",
      "Factions and neighborhoods define the city more than wilderness; politics, crime, and reputation matter."
    ],
    coreLocations: [
      "Lamplight District (taverns, informants)",
      "Noble Quarter (gilded halls, private corruption)",
      "Docks (smugglers, trade)",
      "Warrens (poverty, crime)",
      "Old Temple Row (forgotten gods, secrets)"
    ],
    coreFactions: [
      "The Silver Council: Noble houses ruling from gilded halls.",
      "The Black Hand: Chartered Thieves Guild balancing crime and 'order'.",
      "The Greycoats: Overworked city watch; individually honest or corrupt.",
      "The Veil: Spy network trading in secrets, blackmail, and whispers.",
      "The Burned: Fire-obsessed cult or movement, dangerous and unpredictable."
    ]
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
    startingLocation: "Port Meridian, a bustling harbor city serving as the gateway to the Shattered Isles",
    coreIntent: [
      "Swashbuckling, adventurous, cinematic.",
      "Emphasize exploration, daring plans, boarding actions, treasure maps, and moral choices at sea.",
      "Allow both heroic pirates and principled navy officers."
    ],
    worldOverview: [
      "Age-of-sail tech: tall ships, cannons, cutlasses, flintlock pistols.",
      "Magic is real and often tied to the sea, storms, stars, and ancient ruins.",
      "The Shattered Isles are diverse: jungle islands, volcanic chains, haunted reefs, fog-shrouded atolls, frozen northern holds.",
      "Sea monsters (krakens, dragon turtles, sahuagin, sirens) and supernatural storms are credible threats."
    ],
    coreLocations: [
      "Port Meridian: Bustling harbor city and gateway.",
      "The Shattered Isles: Vast archipelago of diverse islands.",
      "Forgotten Atolls: Buried ancient treasures.",
      "The Deep: Home to sea monsters and mysteries."
    ],
    coreFactions: [
      "Merchant Navy: Trade powers, convoys, monopolies, private security.",
      "Free Captains: Pirate confederation with shifting codes and grudges.",
      "Storm Lords: Indigenous island leaders and shamans.",
      "Tidecaller Cult: Fanatics devoted to a sea deity."
    ]
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
    startingLocation: "The Last Sanctuary, the only safe haven at the entrance to the Endless Delve",
    coreIntent: [
      "Tense, atmospheric exploration; not pure slaughter.",
      "Telegraph danger; let players opt into deeper risk.",
      "Victories feel earned when they extract alive with maps, loot, and scars."
    ],
    worldOverview: [
      "The surface is dangerous, fading, or politically unstable; the true frontier is below.",
      "The Endless Delve: layered dungeons, ruins, caverns, fungal forests, lost cities, aberrant domains.",
      "The deeper the level, the higher the threat and the greater the reward.",
      "Resource pressure: light, food, spells, hit points, conditions.",
      "Spatial awareness: chokepoints, verticality, secret doors, shortcuts."
    ],
    coreLocations: [
      "The Last Sanctuary: Fortified hub at the Delve's mouth (safe rest, gear, rumors).",
      "The Endless Delve: The main dungeon complex."
    ],
    coreFactions: [
      "Sanctuary Guard: Defenders of the last safe haven.",
      "Delver's Guild: Explorers and map-makers.",
      "Cult of the Deep: Worshippers of the things below."
    ]
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
    startingLocation: "Ashenmoor, a walled town barely holding back the encroaching darkness",
    coreIntent: [
      "Grim, weighty, morally complex — but not edge-lord shock for its own sake.",
      "Victories are costly; survival and small mercies matter.",
      "Show horror elements (body horror, cosmic dread, tragedy) with care and consent."
    ],
    worldOverview: [
      "The sun wanes; harvests fail; undead and horrors slip into the world.",
      "Magic is potent but tainted; bargains, blood, and forbidden texts leave marks.",
      "Holy power may exist but feels distant, conditional, or compromised.",
      "Cities are paranoid; countryside is monster-haunted."
    ],
    coreLocations: [
      "Ashenmoor: Walled town holding back the darkness.",
      "The Old Kingdom: A dying land of ash and shadow."
    ],
    coreFactions: [
      "Fragmented Nobles: Clinging to power.",
      "Cults and Inquisitions: Heretical orders and desperate commoners.",
      "The Undead: Not a faction per se, but a constant organized threat."
    ]
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
    startingLocation: "Outpost Seven, a palisaded settlement on the edge of the Untamed Wilds",
    coreIntent: [
      "Harsh but awe-inspiring: beauty and danger intertwined.",
      "Survival horror meets exploration without constant hopelessness.",
      "Emphasize survival elements: food, water, shelter, weather, navigation."
    ],
    worldOverview: [
      "Sparse outposts (like Outpost Seven) cling to the edge of an endless wild.",
      "Between havens: days of difficult travel through trackless forests, bogs, cliffs, tundra.",
      "Predators and monsters hunt, migrate, defend territory; nature is an active force."
    ],
    coreLocations: [
      "Outpost Seven: Palisaded settlement on the edge.",
      "The Untamed Wilds: Primordial forest and savage mountains.",
      "The Last Wall: The border of civilization."
    ],
    coreFactions: [
      "Rangers of the Wall: Protectors of the frontier.",
      "Druidic Circles: Guardians of the wild.",
      "Beast Clans: Intelligent monster tribes."
    ]
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
    startingLocation: "Sigil, the City of Doors - a planar hub where portals to all realities converge",
    coreIntent: [
      "High fantasy meets weird fiction; wondrous, dangerous, occasionally surreal.",
      "Avoid incoherent randomness: each scene should follow from the established rules of its plane.",
      "Each plane must feel mechanically and thematically distinct."
    ],
    worldOverview: [
      "The Material Plane is only one stop; countless planes exist with distinct laws, cultures, and dangers.",
      "Examples: Feywild, Shadowfell, Elemental Planes, Astral Sea, Mechanus, Far Realm.",
      "Portals, rituals, relics, and cosmic events enable movement."
    ],
    coreLocations: [
      "Sigil: The City of Doors, a planar hub.",
      "The Astral Sea: Crystalline cities and thought-space.",
      "Elemental Planes: Pure manifestations of fire, water, earth, air."
    ],
    coreFactions: [
      "Planar Trade Consortium: Interdimensional merchants.",
      "The Keepers of the Veil: Monitoring planar breaches.",
      "Githyanki Raiders: Astral pirates."
    ]
  },
]
