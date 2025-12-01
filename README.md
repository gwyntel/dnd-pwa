# D&D PWA - AI-Powered Dungeons & Dragons Adventures

A progressive web application for single-player D&D-style text adventures powered by AI via OpenRouter. Experience the thrill of tabletop roleplaying with an intelligent AI Dungeon Master that creates dynamic, engaging narratives with full D&D 5e mechanics.

## 🎮 Features

### Core Gameplay
- **AI-Powered Dungeon Master**: Dynamic narrative generation using advanced LLMs through OpenRouter
- **Full D&D 5e Mechanics**: Complete character sheets, skill checks, saving throws, attacks, and combat
- **Dice Rolling System**: Built-in dice roller with advantage/disadvantage, automatic modifier calculation
- **Combat System**: Turn-based combat with initiative tracking, damage calculation, and tactical gameplay
- **Character Management**: Create and manage multiple D&D 5e characters with detailed stat sheets
- **World Building**: Create custom campaign worlds with unique lore, system prompts, and settings

### Character Creation & Management
- **AI-Generated Characters**: Describe your character concept and let AI create complete character sheets
- **Template System**: Pre-built character templates for beginners and quick starts
- **Custom Character Sheets**: Manual character creation with full D&D 5e stats, skills, and features
- **Stat Management**: Complete ability scores (STR, DEX, CON, INT, WIS, CHA) with modifiers
- **Inventory System**: Track items, equipment, and gold with automatic state management

### World & Campaign Features
- **World Templates**: 7 pre-built world types (Classic Fantasy, Urban Noir, High Seas, etc.)
- **AI World Generation**: Describe your world concept and let AI create complete settings
- **Custom World Building**: Manual creation of unique campaign worlds with system prompts
- **Location Tracking**: Automatic location history and fast travel to visited locations
- **Campaign Management**: Multiple independent games with separate states and progress

### Advanced Features
- **Model Selection**: Choose from 100+ AI models on OpenRouter with detailed information
- **Reasoning Tokens**: Advanced reasoning capabilities with configurable effort and verbosity. Now supports hybrid models (DeepSeek, etc.) that stream reasoning before content.
- **Temperature Control**: Adjust AI creativity from focused (0) to creative (2)
- **Multiple Themes**: 6 different color themes (auto, light, dark, warm, cool, forest, midnight)
- **Usage Tracking**: Real-time token usage, cost calculation, and context length monitoring
- **Suggested Actions**: AI-powered action suggestions for smoother gameplay
- **Data Export/Import**: Backup and restore your games, characters, and worlds

### Technical Features
- **Progressive Web App**: Works offline, installable on any device
- **Responsive Design**: Mobile-first responsive interface for all screen sizes
- **Local Storage**: All data stored locally in your browser
- **Cross-Platform**: Works on desktop, tablet, and mobile devices
- **Offline Capable**: Basic functionality available without internet connection

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- OpenRouter account (free at [openrouter.ai](https://openrouter.ai))
- Internet connection for AI interactions

### Installation
1. **Clone the repository**
   ```bash
   git clone https://github.com/gwyntel/dnd-pwa.git
   cd dnd-pwa
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

### Quick Start Guide
1. **Authenticate** with OpenRouter using OAuth or API key
2. **Create a Character** using templates, AI generation, or manual creation
3. **Select or Create a World** with custom lore and settings
4. **Start a New Game** and begin your adventure
5. **Play!** Interact with the AI DM through text commands

## ⚙️ Customization Options

### Character Customization
- **Races**: Human, Elf, Dwarf, Halfling, Dragonborn, Gnome, Half-Elf, Half-Orc, Tiefling, and custom races
- **Classes**: Fighter, Wizard, Rogue, Cleric, Barbarian, Bard, Druid, Monk, Paladin, Ranger, Sorcerer, Warlock, and custom classes
- **Stats**: Full 6 ability scores with adjustable modifiers
- **Skills**: Customizable skill proficiencies and expertise
- **Features**: Class features, racial traits, and custom abilities
- **Backstory**: Detailed character background and personality

### World Customization
- **Magic Level**: None, Low, Medium, or High magic settings
- **Tech Level**: Primitive, Medieval, Renaissance, Industrial, Modern, Sci-Fi, or Mixed technology
- **Tone**: Dark, Lighthearted, Noir, Heroic, or custom atmospheric settings
- **System Prompts**: Custom AI instructions for unique world behavior
- **Starting Locations**: Customizable initial adventure locations
- **Faction Systems**: Built-in faction tracking and political systems

### Game Settings
- **Theme Selection**: Choose from 6 different visual themes
- **Temperature**: Adjust AI creativity (0.0 to 2.0)
- **Model Selection**: Default model preference for all interactions
- **Reasoning Tokens**: Enable advanced reasoning with configurable settings
- **Auto-Save**: Automatic game state preservation
- **Dice Animations**: Visual feedback for dice rolls
- **Fast Travel**: Quick movement between visited locations

### Advanced Configuration
- **Environment Variables**: Default model configuration via `.env`
- **Custom System Prompts**: Per-world and per-game AI instructions
- **Dice Notation**: Full D&D dice notation support (1d20, 2d6+3, etc.)
- **Combat Options**: Initiative tracking, turn order, and tactical combat

## 🎯 Intended Use

### For D&D Enthusiasts
- Solo D&D 5e sessions when friends aren't available
- Practice and learning D&D mechanics and rules
- Creative storytelling and character development
- Campaign testing and world-building exercises

### For RPG Beginners
- Introduction to D&D 5e concepts and mechanics
- Guided adventures with AI assistance
- Character creation guidance and templates
- Risk-free experimentation with different playstyles

### For Creative Writers
- Interactive story generation and plot development
- Character development and narrative testing
- World-building and lore creation
- Creative writing practice and inspiration

### For Gamers
- Mobile-friendly RPG experience
- Quick sessions during breaks or travel
- Customizable difficulty and pacing
- Infinite replayability with AI-generated content

## 🛠️ Technical Architecture

### Frontend
- **Framework**: Vanilla JavaScript (ES6+) with no external dependencies
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: CSS with custom theming and responsive design
- **Routing**: Client-side routing with history management
- **State Management**: Centralized Store (`src/state/store.js`) wrapping localStorage with in-memory caching and debounced persistence
- **UI Components**: Extracted UI rendering logic into reusable components (`src/components/`) for better maintainability and separation of concerns

### AI Integration
- **Provider**: OpenRouter API for model access
- **Authentication**: PKCE OAuth flow for secure API access
- **Models**: 100+ supported models with detailed metadata
- **Streaming**: Real-time response streaming for smooth interaction
- **Structured Outputs**: JSON schema support for reliable parsing

### Game Engine Architecture

**Processor Pattern**: The game uses a sophisticated modular architecture with 6 specialized processors that handle different aspects of gameplay:

- **CombatProcessor** (`src/engine/processors/CombatProcessor.js`): Handles DAMAGE, HEAL, TEMP_HP, and defense modifiers (resistance, immunity, vulnerability)
- **InventoryProcessor** (`src/engine/processors/InventoryProcessor.js`): Manages INVENTORY_*, GOLD_CHANGE, and USE_ITEM tags
- **NarrativeProcessor** (`src/engine/processors/NarrativeProcessor.js`): Processes LOCATION, RELATIONSHIP, ACTION, and XP_GAIN
- **RestProcessor** (`src/engine/processors/RestProcessor.js`): Handles SHORT_REST, LONG_REST, and HIT_DIE_ROLL
- **SpellProcessor** (`src/engine/processors/SpellProcessor.js`): Manages CAST_SPELL, LEARN_SPELL, and CONCENTRATION tags
- **BaseProcessor** (`src/engine/processors/BaseProcessor.js`): Provides shared utilities and state management for all processors

**Tag-Driven Architecture**: The game uses a sophisticated tag system where the AI embeds special markers that trigger game mechanics:

- **20+ Tag Types**: LOCATION, ROLL, COMBAT_*, DAMAGE, HEAL, TEMP_HP, INVENTORY_*, GOLD_CHANGE, STATUS_*, RELATIONSHIP, ACTION, CAST_SPELL, CONCENTRATION_*, XP_GAIN, USE_ITEM, LEARN_SPELL, LEVEL_UP, ENEMY_SPAWN
- **Real-Time Processing**: Tags are parsed and executed during AI streaming for immediate feedback
- **Automatic State Updates**: Character stats, inventory, combat state, and relationships update automatically based on tags
- **Roll Batching**: Multiple rolls collected over 500ms and processed together for better narrative flow

**Core Engines**:
- **MechanicsEngine** (`src/engine/MechanicsEngine.js`): Handles damage calculations with resistance/immunity/vulnerability, temp HP rules, and concentration checks
- **EffectsEngine** (`src/engine/EffectsEngine.js`): Manages passive effects from items and spells
- **CombatManager** (`src/engine/CombatManager.js`): Manages initiative, turn order, enemy spawning, and combat state
- **SpellcastingManager** (`src/engine/SpellcastingManager.js`): Handles spell slots, concentration, and spell effect durations
- **EquipmentManager** (`src/engine/EquipmentManager.js`): Calculates AC and manages item effects
- **ItemGenerator** (`src/engine/ItemGenerator.js`) & **MonsterGenerator** (`src/engine/MonsterGenerator.js`): Dynamic content generation for novel items/monsters
- **GameLoop** (`src/engine/GameLoop.js`): Message construction, sanitization, and API request coordination

**State Management**: 
- **Centralized Store** (`src/state/store.js`): Single source of truth wrapping localStorage with in-memory caching
- **Debounced Persistence**: 300ms delay prevents excessive writes (reduces localStorage operations by ~97%)
- **Immediate Saves**: Critical operations save immediately (navigation, combat state changes)
- **Migration System**: Automatic schema updates ensure backward compatibility

**Dice System**: Full D&D 5e dice mechanics in `src/utils/dice.js` and `src/utils/dice5e.js`:
- Advantage/disadvantage support
- Automatic modifier calculation from character stats
- Complex dice expressions (1d20+5, 2d6+3, etc.)
- Roll batching for multiple rolls in quick succession

**Data Management**:
- **Compressed Context**: Monster, item, and spell lists summarized (ID, Name, Type) to reduce token usage
- **Single Source of Truth**: Templates centralized in `src/data/` and imported into storage initialization
- **Template System**: `WORLD_TEMPLATES` in `src/data/worlds.js` and `BEGINNER_TEMPLATES` in `src/data/archetypes.js`

**Tag Processing** (`src/engine/TagParser.js`):
- **Real-Time Parsing**: Tags extracted during AI streaming
- **Nested Support**: Handles complex tags like `STATUS_ADD[Blinded|For ROLL[1d4] turns]`
- **XSS Protection**: Automatic sanitization of tag content
- **Pattern Validation**: Strict regex patterns ensure tag format compliance

**Testing**: Comprehensive test coverage with 106/108 tests passing:
- Processor tests with 20-30 tests each
- Unit tests for core mechanics
- Edge case coverage for complex interactions

### Security & Privacy
- **Local Storage**: All personal data stored locally in browser
- **Secure Authentication**: OAuth PKCE flow for API access
- **No Data Sharing**: Game data never sent to external servers
- **Privacy First**: Complete data control with export/import options

## 📋 Usage Examples

### Starting a New Adventure
```
1. Create character using AI: "A cunning halfling rogue with a mysterious past"
2. Select "Classic Fantasy" world template
3. Start game: "I enter the tavern and look around"
4. AI responds with scene and ROLL[skill|perception|15]
5. System shows perception check result
6. Continue with discovered information
```

### Combat Example
```
1. AI: "LOCATION[Dark Forest Path] A goblin jumps out! COMBAT_START[Goblin attacks!]"
2. AI: "Roll for initiative: ROLL[1d20+2|normal|0]"
3. System: "Initiative roll: 1d20+2 = 16"
4. AI: "You go first! ACTION[Attack the goblin] ACTION[Dash away] ACTION[Look for help]"
```

### Skill Checks
```
1. Player: "I try to pick the lock on the chest"
2. AI: "ROLL[skill|thieves-tools|13|advantage]" (if has proficiency and advantage)
3. System: "Thieves tools check: 2d20kh1+5 = 17 vs DC 13 - ✓ Success!"
4. AI: "The lock clicks open, revealing gold and a scroll..."
```

## 🚧 Roadmap

### Short-term (v1.1-v1.2)
- Enhanced action suggestions with better context awareness 
- Improved world system with reusable campaign settings
- Better mobile touch controls and gesture support
- Character portrait uploads

### Medium-term (v1.3-v1.4)
- Google Drive sync for cross-device access
- Detailed game statistics and analytics

### Relationship Management Features
- Add a "pin relationship" feature for important NPCs (exempt from cap)
- Sort by relationship value instead of recency (keep high-value NPCs)
- Compress relationship format: {npc: "blacksmith", v: 5} saves tokens vs. full words

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Setup
```bash
# Clone and install
git clone https://github.com/gwyntel/dnd-pwa.git
cd dnd-pwa
npm install

# Development server
npm run dev

# Build for production
npm run build
```

### Code Structure
```
dnd-pwa/
├── public/           # Static assets and manifest
├── src/
│   ├── data/         # Static data (templates, tags, icons)
│   ├── engine/       # Game logic (GameLoop, TagProcessor, CombatManager)
│   ├── state/        # Centralized Store (in-memory cache + localStorage)
│   ├── utils/        # Helper functions (storage, auth, dice, API)
│   ├── views/        # Page components (characters, game, settings, etc.)
│   ├── prompts/      # AI system prompts
│   ├── main.js       # App entry point and initialization
│   ├── router.js     # Client-side routing system
│   └── style.css     # Global styles and themes
├── index.html        # App shell and entry point
└── package.json      # Dependencies and scripts
```

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **OpenRouter** for AI model access and API infrastructure
- **D&D 5e System Reference Document** for mechanics inspiration
- **Community contributors** for feedback and improvements
- **AI model providers** for the technology enabling this experience

## 📞 Support

For issues or questions:
- Open an issue on GitHub
- Check the documentation in `/docs/`
- Join the community discussions

---

*Dedicated to my in-laws, which love DND. Made by Gwyneth, Claude 4.5, Qwen Code, GPT-5.1, and Gemini 3 Pro.*
