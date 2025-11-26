# Task: Implement Comprehensive Item & Equipment System

You are an expert AI coding agent. Build a complete item system with AI-generated world-specific loot, structured equipment properties, shared effects engine, dynamic AC calculation, and full mechanical integration.

Follow patterns in `.clinerules/CLINE.md` strictly. Use Vanilla JS.

---

## ARCHITECTURE OVERVIEW

### Core Philosophy
Items should work like monsters:
1. **Static Database** - `src/data/items.js` with core SRD items (fallback)
2. **World Generation** - AI generates themed items at world creation
3. **Shared Effects Engine** - Unified system for item/spell/ability effects
4. **Tag-Driven** - All effects execute through tags (no hidden state)

---

## 1. Data Layer - Item Database

### A. Create `src/data/items.js`
Static fallback database with ~40 SRD items.

```javascript
export const ITEMS = {
  longsword: {
    id: "longsword",
    name: "Longsword",
    category: "weapon",
    weaponType: "martial_melee",
    damage: "1d8",
    versatileDamage: "1d10", // for two-handed
    damageType: "slashing",
    properties: ["versatile"],
    weight: 3,
    value: 15,
    rarity: "common"
  },
  chain_mail: {
    id: "chain_mail",
    name: "Chain Mail",
    category: "armor",
    armorType: "heavy",
    baseAC: 16,
    properties: ["stealth_disadvantage"],
    strengthRequired: 13,
    weight: 55,
    value: 75,
    rarity: "common"
  },
  shield: {
    id: "shield",
    name: "Shield",
    category: "armor",
    armorType: "shield",
    acBonus: 2,
    weight: 6,
    value: 10,
    rarity: "common"
  },
  healing_potion: {
    id: "healing_potion",
    name: "Potion of Healing",
    category: "consumable",
    consumable: true,
    effects: ["HEAL[player|2d4+2]"],
    weight: 0.5,
    value: 50,
    rarity: "common"
  },
  scroll_of_fireball: {
    id: "scroll_of_fireball",
    name: "Scroll of Fireball",
    category: "consumable",
    consumable: true,
    spellLevel: 3,
    effects: ["CAST_SPELL[Fireball|3]"],
    weight: 0,
    value: 150,
    rarity: "uncommon"
  },
  ring_of_protection: {
    id: "ring_of_protection",
    name: "Ring of Protection",
    category: "magic_item",
    slot: "ring",
    effects: ["+1 AC", "+1 to all saves"],
    acBonus: 1,
    saveBonus: 1,
    requiresAttunement: true,
    weight: 0,
    value: 3500,
    rarity: "rare"
  }
}
```

### Coverage
- **Weapons** (20+): Longsword, Greatsword, Rapier, Dagger, Shortbow, Longbow, Heavy Crossbow, Quarterstaff, Mace, Warhammer, Spear, etc.
- **Armor** (10+): Leather, Studded Leather, Chain Mail, Plate, Shields
- **Consumables** (5+): Healing Potion, Greater Healing Potion, Potion of Climbing, Antitoxin, Alchemist's Fire
- **Magic Items** (5+): +1 Weapon, Ring of Protection, Cloak of Protection, Bag of Holding

---

## 2. World Generation Integration (themed loot)

### A. Update `src/utils/prompts/world-prompts.js`

Add `items` to schema (after `monsters`):

```javascript
items: {
  type: "array",
  items: {
    type: "object",
    required: ["id", "name", "category", "rarity"],
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      category: { type: "string", enum: ["weapon", "armor", "consumable", "magic_item", "gear"] },
      rarity: { type: "string", enum: ["common", "uncommon", "rare", "very_rare", "legendary"] },
      // Weapon fields
      weaponType: { type: "string" },
      damage: { type: "string" },
      versatileDamage: { type: "string" },
      damageType: { type: "string" },
      properties: { type: "array", items: { type: "string" } },
      // Armor fields
      armorType: { type: "string" },
      baseAC: { type: "integer" },
      acBonus: { type: "integer" },
      // Consumable fields
      consumable: { type: "boolean" },
      effects: { type: "array", items: { type: "string" } },
      // Common fields
      weight: { type: "number" },
      value: { type: "integer" },
      description: { type: "string" }
    }
  }
}
```

### B. Update Prompt Instructions

```javascript
- **items**: IMPORTANT:
    - Generate 15-20 themed items appropriate for the world.
    - Mix: ~8 weapons, ~5 armor pieces, ~5 consumables, ~2-3 magic items.
    - Example (sea world): Trident, Coral Armor, Potion of Water Breathing, Pearl of Power
    - Example (desert world): Scimitar, Sand Cloak, Potion of Endure Heat, Scarab of Protection
    - Ensure stats match 5e standards for weapons/armor.
    - Give each item a unique, thematic name.
```

### C. Update `src/views/worlds.js`

Ensure AI-generated `items` array is saved to world object (line ~395 where monsters are saved).

---

## 3. Effects Engine - Shared System

### Create `src/engine/EffectsEngine.js`

Unified effects system for items, spells, abilities, conditions.

```javascript
/**
 * Resolve and execute an effect string
 * @param {string} effectStr - e.g., "HEAL[player|2d4+2]", "+1 AC", "advantage on stealth"
 * @param {Object} context - { game, character, source }
 * @returns {Object} - { tags: [], modifiers: {}, description: "" }
 */
export function resolveEffect(effectStr, context) {
  const { game, character, source } = context
  
  // Tag-based effects (immediate execution)
  const tagPattern = /^([A-Z_]+)\[(.*?)\]$/
  const tagMatch = effectStr.match(tagPattern)
  if (tagMatch) {
    return {
      tags: [effectStr],
      modifiers: {},
      description: `Applied: ${effectStr}`
    }
  }
  
  // Passive modifiers (e.g., "+1 AC", "advantage on stealth")
  const modifierPattern = /^([+-]\d+)\s+(.+)$/
  const modMatch = effectStr.match(modifierPattern)
  if (modMatch) {
    const [_, value, target] = modMatch
    return {
      tags: [],
      modifiers: { [target]: parseInt(value) },
      description: `${value} to ${target}`
    }
  }
  
  // Advantage/Disadvantage
  if (effectStr.includes("advantage") || effectStr.includes("disadvantage")) {
    return {
      tags: [],
      modifiers: { conditionalEffect: effectStr },
      description: effectStr
    }
  }
  
  return {
    tags: [],
    modifiers: {},
    description: effectStr
  }
}

/**
 * Apply item effects when equipped/consumed
 */
export function applyItemEffects(item, game, character) {
  if (!item.effects || !Array.isArray(item.effects)) return { tags: [] }
  
  const allTags = []
  for (const effectStr of item.effects) {
    const result = resolveEffect(effectStr, { game, character, source: item })
    allTags.push(...result.tags)
    
    // Store passive modifiers on character (for AC calculation, etc.)
    if (Object.keys(result.modifiers).length > 0) {
      if (!character.activeModifiers) character.activeModifiers = {}
      character.activeModifiers[item.id] = result.modifiers
    }
  }
  
  return { tags: allTags }
}
```

---

## 4. Equipment Manager

### Create `src/engine/EquipmentManager.js`

```javascript
import { ITEMS } from '../data/items.js'
import { resolveEffect, applyItemEffects } from './EffectsEngine.js'

/**
 * Resolve item by name/ID from world loot or static DB
 */
export function resolveItem(itemIdentifier, world) {
  const normalized = (itemIdentifier || "").toLowerCase().trim()
  
  // 1. Check world.items first
  if (world?.items && Array.isArray(world.items)) {
    const worldItem = world.items.find(i => 
      i.id === normalized || i.name.toLowerCase() === normalized
    )
    if (worldItem) return worldItem
  }
  
  // 2. Check static ITEMS database
  if (ITEMS[normalized]) return ITEMS[normalized]
  
  // 3. Fuzzy match by name
  const staticMatch = Object.values(ITEMS).find(i => 
    i.name.toLowerCase() === normalized
  )
  if (staticMatch) return staticMatch
  
  // 4. Return null if not found
  return null
}

/**
 * Calculate AC from equipped armor/shields + effects
 */
export function calculateAC(character, game, world) {
  const inventory = Array.isArray(game.inventory) ? game.inventory : []
  
  let baseAC = 10 // Unarmored
  let dexMod = Math.floor((character.stats.dexterity - 10) / 2)
  let shieldBonus = 0
  let miscBonus = 0
  
  // Find equipped armor
  const equippedArmor = inventory.find(slot => {
    if (!slot.equipped) return false
    const item = resolveItem(slot.id, world)
    return item?.category === "armor" && item?.armorType !== "shield"
  })
  
  if (equippedArmor) {
    const armorData = resolveItem(equippedArmor.id, world)
    if (armorData) {
      baseAC = armorData.baseAC || 10
      
      // Heavy armor: no DEX
      // Medium armor: max +2 DEX
      // Light armor: full DEX
      if (armorData.armorType === "heavy") dexMod = 0
      else if (armorData.armorType === "medium") dexMod = Math.min(dexMod, 2)
    }
  }
  
  // Find equipped shield
  const equippedShield = inventory.find(slot => {
    if (!slot.equipped) return false
    const item = resolveItem(slot.id, world)
    return item?.armorType === "shield"
  })
  
  if (equippedShield) {
    const shieldData = resolveItem(equippedShield.id, world)
    if (shieldData?.acBonus) shieldBonus = shieldData.acBonus
  }
  
  // Apply active modifiers from magic items
  if (character.activeModifiers) {
    for (const [itemId, mods] of Object.entries(character.activeModifiers)) {
      if (mods.AC) miscBonus += mods.AC
      if (mods["Armor Class"]) miscBonus += mods["Armor Class"]
    }
  }
  
  return baseAC + dexMod + shieldBonus + miscBonus
}

/**
 * Get equipped weapon data
 */
export function getEquippedWeapons(game, world) {
  const inventory = Array.isArray(game.inventory) ? game.inventory : []
  
  return inventory
    .filter(slot => {
      if (!slot.equipped) return false
      const item = resolveItem(slot.id, world)
      return item?.category === "weapon"
    })
    .map(slot => resolveItem(slot.id, world))
    .filter(Boolean)
}

/**
 * Use a consumable item
 */
export function useConsumable(game, character, world, itemId) {
  const item = resolveItem(itemId, world)
  if (!item || !item.consumable) {
    return { success: false, message: "Item not consumable" }
  }
  
  // Apply effects
  const { tags } = applyItemEffects(item, game, character)
  
  // Remove from inventory
  const inventory = Array.isArray(game.inventory) ? game.inventory : []
  const idx = inventory.findIndex(slot => slot.id === itemId)
  if (idx !== -1) {
    inventory[idx].quantity = (inventory[idx].quantity || 1) - 1
    if (inventory[idx].quantity <= 0) {
      inventory.splice(idx, 1)
    }
  }
  
  return {
    success: true,
    message: `Used ${item.name}`,
    tags,
    item
  }
}
```

---

## 5. Tag System Updates

### A. Update `src/data/tags.js`

Add new tag:

```javascript
USE_ITEM: {
  pattern: "USE_ITEM[item_name]",
  examples: [
    "You drink potion. USE_ITEM[Healing Potion]",
    "You read scroll. USE_ITEM[Scroll of Fireball]"
  ],
  required: true,
  note: "Consumes item and applies its effects."
}
```

### B. Update `src/engine/TagProcessor.js`

Add `USE_ITEM` handler in `processGameTagsRealtime`:

```javascript
case 'USE_ITEM': {
  const itemName = tag.content.trim()
  const world = /* get world from context */
  const result = useConsumable(game, character, world, itemName)
  
  if (result.success) {
    // Process any tags from item effects
    for (const effectTag of result.tags || []) {
      // Parse and process each effect tag
      processedTags.push(effectTag)
    }
  }
  
  processed = true
  break
}
```

Update inventory handlers to use item IDs:
- `INVENTORY_ADD`: Resolve name to ID, store as `{ id, equipped, quantity }`
- `INVENTORY_REMOVE`: Accept ID or name
- `INVENTORY_EQUIP/UNEQUIP`: Accept ID or name

---

## 6. Update `dice5e.js` - Remove Guessing

### Modify `buildAttacks()` (lines 240-302)

```javascript
function buildAttacks(character, game, world) {
  const weapons = getEquippedWeapons(game, world)
  const prof = typeof character.proficiencyBonus === "number" ? character.proficiencyBonus : 0
  
  return weapons.map(weapon => {
    let ability = "str"
    let damage = weapon.damage
    
    // Finesse: choose STR or DEX
    if (weapon.properties?.includes("finesse")) {
      const strMod = Math.floor((character.stats.strength - 10) / 2)
      const dexMod = Math.floor((character.stats.dexterity - 10) / 2)
      ability = dexMod > strMod ? "dex" : "str"
    }
    
    // Ranged: use DEX
    if (weapon.weaponType?.includes("ranged")) {
      ability = "dex"
    }
    
    const abilityMod = Math.floor((character.stats[ability] - 10) / 2)
    
    return {
      id: weapon.id,
      name: weapon.name,
      ability,
      toHit: abilityMod + prof,
      damage,
      damageType: weapon.damageType,
      versatileDamage: weapon.versatileDamage,
      properties: weapon.properties || []
    }
  })
}
```

---

## 7. System Prompt Updates

### Update `src/utils/prompts/game-dm-prompt.js`

#### A. Add to `DND_MECHANICS_EXAMPLES` (line ~9):

```javascript
use_item: "You drink healing potion. USE_ITEM[healing_potion] (app resolves effects)",
use_scroll: "You cast from scroll. USE_ITEM[scroll_of_fireball] (app casts Fireball)",
```

#### B. Add to world prompt formatting (line ~93):

```javascript
world.items && world.items.length > 0 ? formatItemList(world.items) : null,
```

#### C. Add helper function (line ~310):

```javascript
function formatItemList(items) {
  if (!items || !Array.isArray(items) || items.length === 0) return ""
  
  const byCategory = items.reduce((acc, item) => {
    acc[item.category] = acc[item.category] || []
    acc[item.category].push(item)
    return acc
  }, {})
  
  const sections = Object.entries(byCategory).map(([cat, items]) => {
    const list = items.map(i => `${i.id} (${i.name}, ${i.rarity})`).join(', ')
    return `${cat}: ${list}`
  })
  
  return `**Available Items:**\nUse these themed items as loot rewards:\n${sections.join('\n')}`
}
```

---

## 8. Character Creation Updates

### Update `src/data/archetypes.js`

Change inventory from strings to IDs:

```javascript
inventory: [
  { id: "longsword", equipped: true, quantity: 1 },
  { id: "shield", equipped: true, quantity: 1 },
  { id: "chain_mail", equipped: true, quantity: 1 }
]
```

---

## 9. UI Updates

### A. Update `src/components/CharacterHUD.js`

Replace static AC display:

```javascript
import { calculateAC } from '../engine/EquipmentManager.js'

// In render function:
const displayAC = calculateAC(character, game, world)
```

### B. Update `src/views/game.js` - Inventory Display

Show item details on hover/click:

```javascript
${game.inventory.map(slot => {
  const item = resolveItem(slot.id, world)
  const name = item?.name || slot.id
  const qty = slot.quantity || 1
  const eq = slot.equipped ? " (equipped)" : ""
  
  return `
    <li class="inventory-item" data-item-id="${slot.id}">
      ${qty}x ${name}${eq}
      ${item ? renderItemTooltip(item) : ""}
    </li>
  `
})}
```

### C. Update `src/views/worlds.js` - World Editor Items View

Add an "Items" section to the world editor, mirroring the "Monsters" section.

#### Features
- **List View**: Display all items in `world.items` with name, category, and rarity.
- **Add Item**: Button to manually create a new item.
- **Edit Item**: Form to modify item properties (name, damage, AC, effects, etc.).
- **Remove Item**: Button to delete an item from the world.
- **AI Generation**: Ensure newly generated worlds populate this list automatically.

#### Implementation Details
- Create `renderItemsList(items)` helper function.
- Add "Items" tab or section below Monsters.
- Use similar card-based layout as monsters.
- Fields to edit: Name, ID, Category, Rarity, Value, Weight, Properties/Effects.



---

## 10. Migration Script

### Create `src/utils/migrations/convert-inventory-v2.js`

```javascript
import { ITEMS } from '../../data/items.js'

function slugify(name) {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
}

export function migrateInventoryV2() {
  const data = store.get()
  let updated = false
  
  // Characters
  data.characters.forEach(char => {
    if (Array.isArray(char.inventory)) {
      char.inventory = char.inventory.map(item => {
        // Already migrated
        if (item.id && !item.item) return item
        
        // Legacy string or { item: "name" } format
        const name = typeof item === 'string' ? item : item.item
        const id = slugify(name)
        
        return {
          id,
          equipped: item.equipped || false,
          quantity: item.quantity || 1
        }
      })
      updated = true
    }
  })
  
  // Games
  data.games.forEach(game => {
    if (Array.isArray(game.inventory)) {
      game.inventory = game.inventory.map(item => {
        if (item.id && !item.item) return item
        
        const name = typeof item === 'string' ? item : item.item
        const id = slugify(name)
        
        return {
          id,
          equipped: item.equipped || false,
          quantity: item.quantity || 1
        }
      })
      updated = true
    }
  })
  
  if (updated) {
    store.update(s => s)
    console.log("[Migration] Inventory converted to ID-based format")
  }
}
```

Call from `src/main.js` after store initialization.

---

## 11. Shared Game State Considerations

### Equipment State Flow
```
World Generation → world.items[] (themed loot pool)
             ↓
Player looting → INVENTORY_ADD[item_id]
             ↓
Game state → game.inventory[] ({ id, equipped, quantity })
             ↓
Equip/Use → EquipmentManager resolves item from world.items or ITEMS
             ↓
Effects → EffectsEngine applies modifiers/tags
             ↓
AC calculation → calculateAC() uses equipped items + modifiers
```

### Cross-System Integration
- **Combat**: Attacks use weapon data from EquipmentManager
- **Spells**: Can reference item effects (e.g., spell scrolls)
- **Conditions**: May grant/restrict item use (e.g., paralyzed can't drink potions)
- **Leveling**: May unlock proficiencies for item types

---

## Execution Rules

- **No Frameworks**: Vanilla JS
- **State Mutations**: All through `game` or `character` objects
- **Tag-Driven**: All effects execute via tags
- **World-Specific**: Items generated per-world, not global
- **SRD Compliant**: Use only OGL content

---

## Deliverables

1. **`src/data/items.js`** - Static item database (~40 items)
2. **`src/engine/EffectsEngine.js`** - Shared effects system
3. **`src/engine/EquipmentManager.js`** - Item resolution, AC calc, consumables
4. **`src/utils/prompts/world-prompts.js`** - Item generation schema
5. **`src/data/tags.js`** - `USE_ITEM` tag definition
6. **`src/engine/TagProcessor.js`** - `USE_ITEM` handler, inventory ID updates
7. **`src/utils/dice5e.js`** - Remove guessing, use EquipmentManager
8. **`src/utils/prompts/game-dm-prompt.js`** - `USE_ITEM` examples, item list formatting
9. **`src/data/archetypes.js`** - Convert to item IDs
10. **`src/components/CharacterHUD.js`** - Dynamic AC display
11. **`src/views/game.js`** - Item tooltips, detailed inventory display
12. **`src/utils/migrations/convert-inventory-v2.js`** - Migration script
13. **`src/main.js`** - Call migration on startup

---

## Testing Checklist

- [ ] Generate new world → has ~15-20 themed items in `world.items`
- [ ] Create character → inventory uses item IDs
- [ ] Equip armor → AC recalculates correctly  
- [ ] Equip shield → +2 AC
- [ ] Equip magic item (Ring of Protection) → +1 AC
- [ ] Attack with weapon → Uses correct damage dice from item data
- [ ] Use healing potion → `USE_ITEM[healing_potion]` heals player, removes from inventory
- [ ] Use scroll → `USE_ITEM[scroll_of_fireball]` casts spell
- [ ] Legacy saves migrate → old inventory converts to ID format
- [ ] AI DM receives item list → knows what loot to reward
