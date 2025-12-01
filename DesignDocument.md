# D&D PWA - Game Design Document

## Executive Summary

The D&D PWA is a modern, AI-powered single-player D&D 5e experience that combines the depth of traditional tabletop RPGs with the accessibility of a progressive web app. It features a highly modular architecture where an AI Dungeon Master generates narrative responses that are parsed by a sophisticated tag system to drive game mechanics, creating a seamless blend of storytelling and gameplay.

## Core Game Flow

### 1. Player Journey Overview

**Initial Setup (5-10 minutes):**
1. **Authentication**: Connect OpenRouter API key or use OAuth
2. **Character Creation**: Choose between AI-generated, template-based, or manual character creation
3. **World Selection**: Pick a world template or create a custom one with lore and settings
4. **Game Launch**: AI generates an opening scene based on character and world context

**Core Gameplay Loop (Continuous):**
1. **Player Action**: Player types what they want to do or clicks suggested action bubbles
2. **AI Processing**: AI generates narrative response with embedded game tags
3. **Tag Processing**: System parses tags and executes mechanics in real-time during AI streaming
4. **State Update**: Character stats, inventory, combat state, relationships update automatically
5. **Feedback**: Dice results, damage notifications, and UI updates appear immediately
6. **Next Turn**: Player can immediately input their next action

### 2. Tag-Driven Architecture

The game uses a sophisticated tag system where the AI embeds special markers in its responses that trigger game mechanics:

**Location & Exploration Tags:**
- `LOCATION[Tavern]` - Changes current location
- `ACTION[Search for traps]` - Provides player with clickable suggestions

**Dice Roll Tags:**
- `ROLL[skill|perception|15]` - Triggers skill check with DC 15
- `ROLL[attack|longsword|13]` - Makes attack roll vs AC 13
- `ROLL[save|dexterity|14|advantage]` - Saving throw with advantage

**Combat Tags:**
- `COMBAT_START[Goblin ambush!]` - Initializes combat system
- `ENEMY_SPAWN[goblin]` - Spawns enemy from template
- `DAMAGE[player|8|fire]` - Applies damage with type checking
- `COMBAT_END[Victory]` - Ends combat and grants rewards

**Spell & Magic Tags:**
- `CAST_SPELL[bless|Bless|1]` - Consumes spell slot and applies effects
- `CONCENTRATION_START[Bless]` - Tracks concentration spell
- `TEMP_HP[player|10]` - Grants temporary hit points

**Inventory & Resources:**
- `INVENTORY_ADD[Healing Potion|2]` - Adds items
- `INVENTORY_EQUIP[Longsword]` - Equips item (triggers passive effects)
- `GOLD_CHANGE[+50]` - Adds/removes currency

**Character Progression:**
- `XP_GAIN[100|Defeating the dragon]` - Awards experience points
- `STATUS_ADD[Poisoned]` - Applies conditions
- `RELATIONSHIP[Town Guard:+2]` - Tracks reputation changes

### 3. Combat System Flow

**Combat Initialization:**
1. AI emits `COMBAT_START[description]`
2. Player initiative automatically rolled (1d20 + DEX mod)
3. AI can spawn enemies with `ENEMY_SPAWN[goblin|Goblin Leader]`
4. Each enemy rolls initiative and is added to turn order
5. Initiative sorted by total, combat HUD displays turn order
6. First actor's turn begins

**Combat Turn Cycle:**
1. **Player Turn**: Player inputs action → AI narrates → tags processed
2. **Enemy Turns**: AI narrates enemy actions → automatic damage application
3. **Turn Advancement**: `advanceTurn()` moves to next actor in initiative
4. **Round Tracking**: When initiative wraps around, round counter increments
5. **Spell Effects**: Effect durations decrement each round, expire automatically
6. **Combat End**: AI emits `COMBAT_END[victory]` or all enemies defeated

**Combat State Management:**
- **Active Combat**: Combat HUD shows initiative order with current turn highlighted
- **Enemy Status**: HP bars, conditions, and status effects displayed in real-time
- **Damage Calculation**: MechanicsEngine applies resistances/vulnerabilities automatically
- **Death Tracking**: Dead enemies marked in initiative, turns skipped automatically

### 4. Character Management System

**Character Data Structure:**
```javascript
{
  id: "char_123",
  name: "Aragorn",
  race: "Human",
  class: "Fighter",
  level: 5,
  xp: 6500,
  stats: { str: 16, dex: 14, con: 15, int: 12, wis: 13, cha: 10 },
  proficiencies: ["Athletics", "Perception", "Survival"],
  inventory: [
    { item: "Longsword", quantity: 1, equipped: true },
    { item: "Chain Mail", quantity: 1, equipped: true }
  ],
  knownSpells: ["Cure Wounds", "Bless", "Shield of Faith"],
  spellSlots: { level1: { current: 2, max: 4 }, level2: { current: 2, max: 2 } }
}
```

**Character Creation Flow:**
1. **Template Selection**: Choose from BEGINNER_TEMPLATES (Fighter, Wizard, Rogue, etc.)
2. **AI Generation**: Describe concept → AI generates complete character sheet
3. **Manual Creation**: Fill form with validation and stat generation
4. **Validation**: `character-validation.js` ensures data integrity
5. **Normalization**: `normalizeCharacter()` adds missing fields and calculates derived stats

**Level Up System:**
1. XP thresholds trigger automatic level-up detection
2. Player allocates ability score improvements or selects feats
3. HP increases based on class hit die + CON modifier
4. New class features and proficiencies unlocked
5. Spell slots recalculated based on class progression

### 5. Spellcasting System

**Spell Slot Management:**
- **Visual Display**: Character HUD shows spell slots as filled/empty dots per level
- **Consumption**: `CAST_SPELL[spell|name|level]` tag automatically deducts appropriate slot
- **Rest Recovery**: Short rest recovers some slots (Warlock), long rest recovers all
- **Overcasting**: Higher-level spell slots can be used for lower-level spells

**Concentration Mechanics:**
- **Single Concentration**: Only one concentration spell active at a time
- **Concentration Checks**: DC 10 or half damage taken (whichever is higher) when damaged
- **Automatic Breaking**: New `CONCENTRATION_START` ends previous concentration
- **Visual Indicator**: Character HUD displays current concentration spell

**Spell Effects:**
- **Passive Items**: EquipmentManager handles items with `effects: ["APPLY_RESISTANCE[player|fire]"]`
- **Spell Buffs**: EffectsEngine processes spell-granted bonuses and conditions
- **Duration Tracking**: Spell effects have durations (1 minute = 10 rounds, 1 hour = 60 rounds)
- **Cleanup**: Effects automatically removed when duration expires or concentration breaks

### 6. Equipment & Items System

**Item Generation Strategy:**
1. **Seed Items**: ~25 essential items (weapons, armor, potions) pre-loaded in all worlds
2. **Static Database**: Full item database in `items.js` for reference
3. **Dynamic Generation**: Novel items trigger AI generation call
4. **World Persistence**: Generated items saved to world for future reuse

**Equipment Effects:**
- **AC Calculation**: EquipmentManager handles armor types, DEX limits, and stacking
- **Passive Effects**: Items can grant resistances, immunities, and bonuses via EffectsEngine
- **Weapon Properties**: Finesse, Light, Heavy, Two-Handed properties parsed and applied
- **Magic Items**: Special effects handled through tag generation

**Inventory Management:**
- **Add/Remove**: `INVENTORY_ADD[Item|quantity]` and `INVENTORY_REMOVE[Item|quantity]`
- **Equip/Unequip**: `INVENTORY_EQUIP[Sword]` triggers effect application/removal
- **Consumables**: Potions and scrolls consumed on use with automatic effect application

### 7. Rest & Recovery System

**Short Rest (1 hour):**
- Recover hit dice (half total, minimum 1)
- Spend hit dice for healing (1dX + CON mod per die)
- Recover class features (Warlock spell slots, Fighter Second Wind)
- Some spell effects end after 1 hour

**Long Rest (8 hours):**
- Recover all HP
- Recover all spell slots
- Recover all class resources (Ki points, Rage, Channel Divinity)
- Recover half spent hit dice
- Reset short rest ability uses
- Most temporary effects end

**Rest State Tracking:**
- `restState.lastShortRest` and `restState.lastLongRest` timestamps
- `shortRestsToday` counter for abilities usable once per short rest
- Rest button prefills chat input with "I take a [short/long] rest"

### 8. AI Integration & Streaming

**AI Provider Abstraction:**
- **Multi-Provider Support**: OpenRouter, OpenAI, LM Studio, custom endpoints
- **Model Flexibility**: 100+ models available through OpenRouter
- **Streaming First**: Real-time response processing with immediate feedback
- **Cost Tracking**: Real-time token usage and cost calculation

**Prompt Engineering:**
- **System Prompt**: Regenerated on every turn with current character stats and game state
- **Compressed Context**: Monster/item lists summarized to ID, name, and type only
- **Tag Education**: AI trained to emit specific tags for mechanics integration
- **Reasoning Display**: Optional reasoning panel shows AI's thought process

**Message Processing Flow:**
1. **Build Messages**: `buildApiMessages()` creates sanitized message history
2. **Context Trimming**: Relationships and locations capped to prevent context bloat
3. **Streaming**: AI response processed chunk-by-chunk as it arrives
4. **Tag Parsing**: Tags extracted and processed in real-time during streaming
5. **Roll Batching**: Multiple rolls collected and processed together after 500ms delay
6. **State Update**: Game state updated incrementally with debounced persistence

### 9. UI/UX Design

**Responsive Layout:**
- **Desktop**: Three-column layout (chat, character, side panels)
- **Mobile**: Single column with collapsible sections
- **Touch Friendly**: Large buttons, swipe gestures, mobile-optimized inputs

**Visual Feedback:**
- **Real-time Updates**: HP bars, spell slots, conditions update immediately
- **Dice Animations**: Roll results appear with satisfying visual feedback
- **Status Indicators**: Conditions, concentration, temporary effects clearly displayed
- **Combat HUD**: Initiative order visible with current turn highlighted

**Theme System:**
- **6 Built-in Themes**: Light, dark, high contrast options
- **CSS Variables**: Easy theming without framework dependencies
- **Accessibility**: WCAG compliant color contrasts and semantic HTML

**Interactive Elements:**
- **Suggested Actions**: ACTION[text] tags create clickable suggestion bubbles
- **Fast Travel**: Click visited locations to quickly return
- **Dice Tray**: Quick access to common rolls (perception, investigation, etc.)
- **Rest Buttons**: One-click rest initiation

### 10. State Management & Persistence

**Store Pattern:**
- **Centralized State**: Single source of truth for all application data
- **In-Memory Cache**: Fast reads/writes without localStorage blocking
- **Debounced Saves**: 300ms delay prevents excessive disk writes
- **Immediate Saves**: Critical updates save immediately (navigation, combat end)

**Data Structure:**
```javascript
{
  games: [/* All game sessions */],
  characters: [/* All created characters */],
  worlds: [/* All world templates */],
  settings: { /* User preferences */ },
  models: [/* Available AI models */]
}
```

**Migration System:**
- **Version Tracking**: Schema versioning ensures backward compatibility
- **Automatic Migrations**: Scripts run on app initialization
- **Data Validation**: Schema validation prevents corrupted state loading

### 11. Advanced Features

**Dynamic Content Generation:**
- **AI Backfilling**: Novel items/monsters trigger async generation
- **Placeholder System**: Generic stats used while generation completes
- **World Persistence**: Generated content saved to world for reuse

**Relationship System:**
- **Reputation Tracking**: Numeric values for NPCs, factions, and locations
- **Dynamic Reactions**: AI considers relationship values in narratives
- **Consequence Persistence**: Actions have lasting impact on game world

**Location Tracking:**
- **Visited Locations**: Array tracks exploration progress
- **Fast Travel**: Quick return to previously visited locations
- **Location Context**: AI remembers location details and history

**Roll History:**
- **Complete Log**: All dice rolls stored with context
- **Visual Display**: Recent rolls shown in collapsible panel
- **Statistical Tracking**: Success/failure rates could be analyzed

### 12. Technical Architecture

**Modular Engine System:**
- **TagProcessor**: Parses and executes game tags
- **CombatManager**: Handles initiative, turns, enemy management
- **SpellcastingManager**: Spell slots, concentration, effect tracking
- **RestManager**: Short/long rest mechanics
- **EquipmentManager**: AC calculation, item effects
- **EffectsEngine**: Passive and active effect processing
- **MechanicsEngine**: Damage calculation with resistances/vulnerabilities

**Component-Based UI:**
- **Pure Functions**: Components return HTML strings for maximum performance
- **Composable**: Complex views built from simple components
- **Event-Driven**: Event handlers attached after DOM rendering
- **No Framework**: Vanilla JavaScript for minimal bundle size

**Performance Optimizations:**
- **Debounced Persistence**: Reduces localStorage writes by ~97%
- **Context Compression**: Summarized lists reduce token usage
- **Streaming Processing**: Immediate feedback without waiting for full response
- **Selective Re-rendering**: Only affected UI components update

### 13. Known Limitations & Future Enhancements

**Current Gaps:**
- **Manual Controls**: Limited direct manipulation of spell slots, HP, resources
- **Spell Casting UI**: No clickable spell list for direct casting
- **Item Usage**: Consumables require AI interaction
- **Condition Management**: No manual condition application/removal

**Technical Debt:**
- **TagProcessor Complexity**: Large file handling multiple responsibilities
- **UI/Logic Coupling**: Some game logic still in view layer
- **Testing Coverage**: ~98% test pass rate, 2 tests need fixing

**Planned Enhancements:**
- **Advanced Combat**: Opportunity attacks, reactions, legendary actions
- **Inventory System**: Weight tracking, detailed item properties, magic item attunement
- **NPC System**: Dialogue trees, quest tracking, companion management
- **Map System**: Visual location representation, exploration tracking
- **Multiplayer**: WebRTC support for co-op gameplay

### 14. Game Balance & Design Philosophy

**AI-Driven Storytelling:**
- AI has narrative freedom while mechanics are strictly enforced
- Tags provide structured framework for consistent gameplay
- balance between player agency and AI creativity

**Mechanical Fidelity:**
- Full D&D 5e rules implementation for combat and spellcasting
- Precise mathematical calculations for damage and effects
- Consistent application of advantage/disadvantage

**Accessibility:**
- Mobile-first design for gaming on any device
- Progressive enhancement for different browser capabilities
- Clear visual feedback for all game actions

**Player Empowerment:**
- Multiple character creation options
- World customization and mod support
- Transparent mechanics with dice visualization

## Conclusion

The D&D PWA represents a unique fusion of traditional tabletop RPG mechanics with modern AI storytelling. Its tag-driven architecture provides a robust framework for integrating complex game rules with dynamic narrative generation, while maintaining the depth and strategic gameplay that D&D players expect. The modular design allows for easy expansion of features and mechanics, making it an ideal platform for both casual solo play and serious campaign development.
