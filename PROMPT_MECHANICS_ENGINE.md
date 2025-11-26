# Task: Implement D&D 5e Mechanical Rules Engine

You are an expert D&D 5e systems programmer. Implement automated enforcement of core 5e mechanical rules to achieve game completeness and reduce AI burden.

Follow patterns in `.clinerules/CLINE.md` strictly. Use Vanilla JS.

---

## Overview

**Problem**: The AI can narrate 5e mechanics, but the engine doesn't enforce them. This leads to:
- Inconsistent rulings (AI forgets resistance)
- Invalid combinations (stacking advantage)
- Missing iconic features (critical hits don't double dice)
- Player confusion (temp HP not tracked)

**Solution**: Build a **Mechanics Engine** that validates and applies 5e rules automatically.

---

## Phase 1: Core Mechanics (This Task)

Implement the three most critical systems:
1. **Damage Types & Resistance/Immunity/Vulnerability**
2. **Critical Hits/Failures**
3. **Temporary HP**

---

## 1. Mechanics Engine - Core System

### Create `src/engine/MechanicsEngine.js`

```javascript
/**
 * Apply damage with type and resistance consideration
 * @param {Object} target - Character or enemy object
 * @param {number} amount - Base damage amount
 * @param {string} damageType - "slashing", "fire", "cold", etc. or null for generic
 * @param {Object} context - { world, game }
 * @returns {Object} - { actualDamage, resisted, immune, vulnerable, message }
 */
export function applyDamageWithType(target, amount, damageType, context) {
  // Implementation
}

/**
 * Apply temporary HP (doesn't stack)
 * @param {Object} target - Character or enemy object
 * @param {number} amount - Temp HP to grant
 * @returns {Object} - { newTempHP, message }
 */
export function applyTempHP(target, amount) {
  // Implementation
}

/**
 * Handle critical hit - double damage dice (not modifiers)
 * @param {Object} attack - Attack object with damage notation
 * @param {Object} rollResult - The d20 attack roll result
 * @returns {Object} - { isCrit, damageNotation, message }
 */
export function applyCriticalHit(attack, rollResult) {
  // Implementation
}

/**
 * Check concentration when damaged
 * @param {Object} character - Character object
 * @param {number} damage - Damage taken
 * @param {Object} context - { game, onRoll callback }
 * @returns {Object} - { saveDC, saveResult, concentrationBroken, message }
 */
export function checkConcentration(character, damage, context) {
  // DC = 10 or half damage, whichever is higher
  // Roll CON save
  // Break concentration if failed
}

/**
 * Calculate damage after resistance/immunity/vulnerability
 * @param {number} damage - Base damage
 * @param {string} type - Damage type
 * @param {Object} defenses - { resistances: [], immunities: [], vulnerabilities: [] }
 * @returns {Object} - { finalDamage, modifier: "resisted"|"immune"|"vulnerable"|null }
 */
export function calculateDamageAfterResistance(damage, type, defenses) {
  if (!type) return { finalDamage: damage, modifier: null }
  
  const resistances = defenses.resistances || []
  const immunities = defenses.immunities || []
  const vulnerabilities = defenses.vulnerabilities || []
  
  if (immunities.includes(type)) {
    return { finalDamage: 0, modifier: "immune" }
  }
  
  if (resistances.includes(type)) {
    return { finalDamage: Math.floor(damage / 2), modifier: "resisted" }
  }
  
  if (vulnerabilities.includes(type)) {
    return { finalDamage: damage * 2, modifier: "vulnerable" }
  }
  
  return { finalDamage: damage, modifier: null }
}
```

---

## 2. Character Schema Updates

### Update `src/utils/storage.js` - `normalizeCharacter()`

Add fields:
```javascript
{
  // Temporary HP (separate from regular HP)
  tempHP: character.tempHP || 0,
  
  // Damage resistances/immunities/vulnerabilities
  resistances: Array.isArray(character.resistances) ? character.resistances : [],
  immunities: Array.isArray(character.immunities) ? character.immunities : [],
  vulnerabilities: Array.isArray(character.vulnerabilities) ? character.vulnerabilities : [],
  
  // Attunement slots (max 3)
  attunedItems: Array.isArray(character.attunedItems) ? character.attunedItems : [],
  
  // Action economy (per turn)
  actionEconomy: character.actionEconomy || {
    action: { used: false },
    bonusAction: { used: false },
    reaction: { used: false }
  }
}
```

---

## 3. Enemy Schema Updates

### Update `src/engine/CombatManager.js` - `spawnEnemy()`

Add to enemy object:
```javascript
{
  tempHP: 0,
  resistances: template.resistances || [],
  immunities: template.immunities || [],
  vulnerabilities: template.vulnerabilities || []
}
```

---

## 4. Tag System Updates

### A. Update `src/data/tags.js`

#### Modify Existing:
```javascript
DAMAGE: {
  pattern: "DAMAGE[target|amount|type]",
  examples: [
    "Goblin hits! DAMAGE[player|6|slashing]",
    "Fireball explodes! DAMAGE[player|28|fire]",
    "Acid splash! DAMAGE[goblin_1|10|acid]"
  ],
  required: true,
  note: "Type is optional but recommended. Generic damage (no type) bypasses resistance."
}
```

#### Add New:
```javascript
TEMP_HP: {
  pattern: "TEMP_HP[target|amount]",
  examples: [
    "Ancient ward activates. TEMP_HP[player|10]",
    "Aid spell grants vigor. TEMP_HP[player|5]"
  ],
  required: false,
  note: "Temporary HP doesn't stack. Use higher value if target already has temp HP."
},

APPLY_RESISTANCE: {
  pattern: "APPLY_RESISTANCE[target|type]",
  examples: [
    "Fire resistance granted. APPLY_RESISTANCE[player|fire]",
    "Spell protects from cold. APPLY_RESISTANCE[player|cold]"
  ],
  required: false
},

REMOVE_RESISTANCE: {
  pattern: "REMOVE_RESISTANCE[target|type]",
  examples: [
    "Resistance fades. REMOVE_RESISTANCE[player|fire]"
  ],
  required: false
}
```

### B. Update `src/engine/TagProcessor.js`

#### Modify `DAMAGE` handler:
```javascript
case 'DAMAGE': {
  const [target, amountStr, damageType] = tag.content.split('|').map(s => s.trim())
  const amount = parseInt(amountStr, 10)
  
  if (target.toLowerCase() === 'player') {
    // Apply to player with mechanics engine
    const targetObj = {
      ...character,
      resistances: character.resistances || [],
      immunities: character.immunities || [],
      vulnerabilities: character.vulnerabilities || []
    }
    
    const result = applyDamageWithType(targetObj, amount, damageType || null, { world, game })
    
    // Apply to temp HP first
    if (character.tempHP > 0) {
      const tempHPDamage = Math.min(character.tempHP, result.actualDamage)
      character.tempHP -= tempHPDamage
      result.actualDamage -= tempHPDamage
      
      if result.actualDamage <= 0) {
        // All absorbed by temp HP
        processed = true
        break
      }
    }
    
    // Apply remaining to real HP
    const newHP = Math.max(0, game.currentHP - result.actualDamage)
    game.currentHP = newHP
    
    // Check concentration if concentrating
    if (game.concentration && result.actualDamage > 0) {
      const concResult = checkConcentration(character, result.actualDamage, { game, onRoll: callbacks.onRoll })
      if (concResult.concentrationBroken) {
        // Emit message about broken concentration
      }
    }
    
    // Log damage message
    console.log(result.message)
    
  } else {
    // Apply to enemy
    const enemy = applyDamage(game, target, amount) // Use existing CombatManager function
  }
  
  processed = true
  break
}
```

#### Add `TEMP_HP` handler:
```javascript
case 'TEMP_HP': {
  const [target, amountStr] = tag.content.split('|').map(s => s.trim())
  const amount = parseInt(amountStr, 10)
  
  if (target.toLowerCase() === 'player') {
    const result = applyTempHP(character, amount)
    character.tempHP = result.newTempHP
    console.log(result.message)
  } else {
    // Apply to enemy
    const enemy = game.combat.enemies.find(e => e.id === target || e.name.toLowerCase() === target.toLowerCase())
    if (enemy) {
      const result = applyTempHP(enemy, amount)
      enemy.tempHP = result.newTempHP
    }
  }
  
  processed = true
  break
}
```

#### Add `APPLY_RESISTANCE` / `REMOVE_RESISTANCE` handlers:
```javascript
case 'APPLY_RESISTANCE': {
  const [target, type] = tag.content.split('|').map(s => s.trim())
  
  if (target.toLowerCase() === 'player') {
    if (!character.resistances.includes(type)) {
      character.resistances.push(type)
    }
  }
  
  processed = true
  break
}

case 'REMOVE_RESISTANCE': {
  const [target, type] = tag.content.split('|').map(s => s.trim())
  
  if (target.toLowerCase() === 'player') {
    const idx = character.resistances.indexOf(type)
    if (idx !== -1) character.resistances.splice(idx, 1)
  }
  
  processed = true
  break
}
```

---

## 5. Critical Hit Implementation

### Update `src/utils/dice5e.js` - `rollAttack()`

```javascript
export function rollAttack(character, attackIdOrName, options = {}) {
  // ... existing code ...
  
  const toHitCore = roll({ /* ... */ })
  
  // Check for critical hit (natural 20)
  const isCrit = toHitCore.rolls && toHitCore.rolls[0] === 20
  
  let damageResult = null
  if (hit !== false && attack.damage) {
    let damageNotation = attack.damage.trim()
    
    // Apply critical hit: double damage dice
    if (isCrit) {
      damageNotation = doubleDamageDice(damageNotation)
    }
    
    const damageCore = roll({
      ...parseDamageNotation(damageNotation),
      rollType: "attack",
      label: `${attack.name} damage${isCrit ? " (CRIT!)" : ""}`
    })
    
    damageResult = {
      ...damageCore,
      type: "attack",
      key: `${attack.id || attack.name}_damage`,
      isCrit
    }
  }
  
  return { attack, toHit: { ...toHitCore, isCrit }, damage: damageResult }
}

/**
 * Double damage dice for critical hits (not modifiers)
 * "1d8+3" -> "2d8+3"
 * "2d6+5" -> "4d6+5"
 */
function doubleDamageDice(notation) {
  return notation.replace(/(\d+)d(\d+)/g, (match, count, sides) => {
    return `${parseInt(count) * 2}d${sides}`
  })
}
```

---

## 6. Monster Data Updates

### Update `src/data/monsters.js`

Add resistances/immunities to templates:

```javascript
export const MONSTERS = {
  goblin: {
    // ... existing fields ...
    resistances: [],
    immunities: [],
    vulnerabilities: []
  },
  fire_elemental: {
    id: "fire_elemental",
    name: "Fire Elemental",
    type: "Elemental",
    cr: "5",
    ac: 13,
    hp: 102,
    resistances: ["bludgeoning", "piercing", "slashing"],
    immunities: ["fire", "poison"],
    vulnerabilities: ["cold"],
    // ... actions ...
  }
}
```

---

## 7. UI Updates

### A. Update `src/components/CharacterHUD.js`

Display temp HP and resistances:

```javascript
export function CharacterHUD(game, character) {
  const tempHPDisplay = character.tempHP > 0 
    ? ` (+${character.tempHP} temp)` 
    : ""
  
  const resistancesDisplay = character.resistances && character.resistances.length > 0
    ? `<div class="resistances text-xs text-secondary mt-1">
         Resistances: ${character.resistances.join(", ")}
       </div>`
    : ""
  
  return `
    <div>
      <div class="hp-bar">
        HP: ${game.currentHP}/${character.maxHP}${tempHPDisplay}
      </div>
      ${resistancesDisplay}
      ...
    </div>
  `
}
```

### B. Update `src/components/CombatHUD.js`

Show enemy resistances/temp HP:

```javascript
export function CombatHUD(game) {
  const enemies = game.combat.enemies || []
  
  return `
    <div class="combat-hud">
      ${enemies.map(enemy => `
        <div class="enemy-card">
          <strong>${enemy.name}</strong>
          <div>HP: ${enemy.hp.current}/${enemy.hp.max}${enemy.tempHP > 0 ? ` (+${enemy.tempHP} temp)` : ""}</div>
          <div>AC: ${enemy.ac}</div>
          ${enemy.immunities && enemy.immunities.length > 0 ? `<div class="text-xs">Immune: ${enemy.immunities.join(", ")}</div>` : ""}
          ${enemy.resistances && enemy.resistances.length > 0 ? `<div class="text-xs">Resist: ${enemy.resistances.join(", ")}</div>` : ""}
        </div>
      `).join("")}
    </div>
  `
}
```

---

## 8. System Prompt Updates

### Update `src/utils/prompts/game-dm-prompt.js`

Add to `DND_MECHANICS_EXAMPLES`:

```javascript
damage_with_type: "Goblin strikes! ROLL[attack|scimitar|15] → Hit! DAMAGE[player|6|slashing]",
fire_damage: "Dragon breathes fire! ROLL[save|dex|17] → Fail! DAMAGE[player|56|fire]",
temp_hp_spell: "You cast Aid. TEMP_HP[player|5] Each ally gains 5 temporary HP.",
resistance_spell: "You cast Protection from Energy. APPLY_RESISTANCE[player|fire]",
critical_hit: "Natural 20! Critical hit! Damage dice doubled automatically."
```

Add section:

```markdown
**DAMAGE TYPES (IMPORTANT):**
Always specify damage type when applicable:
- Physical: slashing, piercing, bludgeoning
- Energy: fire, cold, lightning, thunder, acid
- Magical: force, radiant, necrotic, psychic, poison

Format: DAMAGE[target|amount|type]
Example: "The skeleton slashes you. DAMAGE[player|7|slashing]"

If the target resists the damage type, the engine will automatically halve it.
If immune, damage is reduced to 0.
If vulnerable, damage is doubled.

**TEMPORARY HP:**
Temporary HP is granted by spells like Aid, Armor of Agathys, Inspiring Leader.
Use TEMP_HP[target|amount] tag.
Temp HP absorbs damage before real HP.
Temp HP does NOT stack - if target already has temp HP, use the higher value.

**CRITICAL HITS:**
Natural 20 on attack rolls = critical hit.
Engine automatically doubles damage dice (not modifiers).
You don't need to calculate this - just narrate "Critical hit!" 
Example: "Natural 20! Critical hit! The longsword cleaves deep."
```

---

## 9. World Generation Updates

### Update `src/utils/prompts/world-prompts.js`

Add resistances to monster schema:

```javascript
monsters: {
  type: "array",
  items: {
    properties: {
      // ... existing fields ...
      resistances: { type: "array", items: { type: "string" } },
      immunities: { type: "array", items: { type: "string" } },
      vulnerabilities: { type: "array", items: { type: "string" } }
    }
  }
}
```

Update prompt instructions:

```markdown
- **monsters**: 
  - Include resistances/immunities where thematic.
  - Example: Fire Elemental should have fire immunity, cold vulnerability.
  - Example: Skeleton should resist piercing, vulnerable to bludgeoning.
```

---

## 10. Migration Script

### Create `src/utils/migrations/add-mechanics-fields.js`

```javascript
import store from "../../state/store.js"

export function migrateMechanicsFields() {
  const data = store.get()
  let modified = false
  
  // Update characters
  data.characters.forEach(char => {
    if (typeof char.tempHP === 'undefined') {
      char.tempHP = 0
      modified = true
    }
    if (!Array.isArray(char.resistances)) {
      char.resistances = []
      modified = true
    }
    if (!Array.isArray(char.immunities)) {
      char.immunities = []
      modified = true  
    }
    if (!Array.isArray(char.vulnerabilities)) {
      char.vulnerabilities = []
      modified = true
    }
    if (!Array.isArray(char.attunedItems)) {
      char.attunedItems = []
      modified = true
    }
  })
  
  if (modified) {
    console.log("[Migration] Added mechanics fields to characters")
    store.update(s => s)
  }
}
```

Call from `src/main.js` after store initialization.

---

## Testing Checklist

### Damage Types & Resistance
- [ ] Player with fire resistance takes half fire damage
- [ ] Fire elemental is immune to fire damage (takes 0)
- [ ] Player vulnerable to radiant takes double radiant damage
- [ ] Generic damage (no type) bypasses all resistances

### Temporary HP
- [ ] Temp HP is displayed separately: "HP: 25/30 (+5 temp)"
- [ ] Damage reduces temp HP first
- [ ] New temp HP doesn't stack (uses higher value)
- [ ] Temp HP persists between turns but not rests

### Critical Hits
- [ ] Natural 20 on attack doubles damage dice
- [ ] Longsword 1d8+3 crit becomes 2d8+3 (not 2d8+6)
- [ ] Greatsword 2d6+4 crit becomes 4d6+4
- [ ] Critical damage shows "CRIT!" label

### Concentration
- [ ] Taking damage while concentrating triggers CON save
- [ ] DC = max(10, damage/2)
- [ ] Passing save maintains concentration
- [ ] Failing save breaks concentration and removes spell

### UI Display
- [ ] Character HUD shows resistances
- [ ] Enemy cards show immune/resist
- [ ] Damage messages indicate "resisted" or "immune"

---

## Execution Rules

- **No Frameworks**: Vanilla JS
- **State Mutations**: All through `game` or `character` objects
- **Tag-Driven**: Effects execute via tags, engine enforces rules
- **SRD Compliant**: Use only OGL 5e content

---

## Deliverables

1. **`src/engine/MechanicsEngine.js`** - Core rule validation
2. **Modified `src/utils/storage.js`** - Character schema updates
3. **Modified `src/engine/CombatManager.js`** - Enemy schema updates
4. **Modified `src/data/tags.js`** - New tag definitions
5. **Modified `src/engine/TagProcessor.js`** - Tag handlers with mechanics
6. **Modified `src/utils/dice5e.js`** - Critical hit logic
7. **Modified `src/data/monsters.js`** - Add resistances to templates
8. **Modified `src/components/CharacterHUD.js`** - Display temp HP/resistances
9. **Modified `src/components/CombatHUD.js`** - Display enemy defenses
10. **Modified `src/utils/prompts/game-dm-prompt.js`** - Damage type examples
11. **Modified `src/utils/prompts/world-prompts.js`** - Monster resistance schema
12. **`src/utils/migrations/add-mechanics-fields.js`** - Migration script
13. **Modified `src/main.js`** - Call migration

