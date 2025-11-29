# Project Brief: D&D PWA

**Mission:** Create an AI-powered progressive web application for single-player D&D-style text adventures, enabling users to experience dynamic tabletop roleplaying with an intelligent AI Dungeon Master that implements full D&D 5e mechanics.

## Core Requirements

1. **AI-Powered Dungeon Master**: Dynamic narrative generation using advanced LLMs through OpenRouter, creating engaging stories that respond to player actions

2. **Full D&D 5e Mechanics Implementation**: Complete support for character sheets, skill checks, saving throws, attacks, combat, spellcasting, and rest mechanics

3. **Progressive Web App**: Installable on any device with offline capabilities, responsive design for all screen sizes, and PWA best practices

4. **Character Management System**: Allow users to create, manage, and customize D&D 5e characters with AI assistance or manual entry

5. **World Building Tools**: Enable creation of custom campaign worlds with unique lore, system prompts, and settings that shape AI behavior

6. **Data Privacy**: All game data stored locally in browser, no server-side data storage, complete user control over their information

## Success Criteria

- **Functional Gameplay**: Users can create characters, start games, and experience coherent AI-driven adventures with proper D&D 5e mechanics
- **Technical Quality**: Responsive, performant application with clean architecture, proper error handling, and comprehensive testing
- **User Experience**: Intuitive interface suitable for both D&D beginners and veterans, with clear feedback for all actions
- **Data Integrity**: Reliable save/load system with migration support for backward compatibility
- **Cost Transparency**: Real-time token usage and cost tracking so users understand AI expenses
- **Accessibility**: Semantic HTML, keyboard navigation support, and screen reader compatibility

## Target Users

1. **D&D Enthusiasts**: Solo play when friends aren't available, campaign testing, creative storytelling
2. **RPG Beginners**: Learning D&D mechanics, guided character creation, risk-free experimentation
3. **Creative Writers**: Interactive story generation, character development, world-building exercises
4. **Casual Gamers**: Mobile-friendly RPG experience with quick sessions and infinite replayability

## Unique Selling Points

- **Hybrid AI Approach**: Combines structured D&D mechanics with creative AI storytelling
- **Full 5e Implementation**: More comprehensive mechanics than most AI RPG tools
- **Local-First**: Complete data ownership and privacy - nothing leaves the user's device
- **Multi-Provider**: Support for OpenRouter, OpenAI, LM Studio, and custom endpoints
- **Advanced Features**: Reasoning tokens, usage tracking, beautiful UI with multiple themes
- **PWA Architecture**: Works offline, installable, cross-platform compatibility

## Technical Stack

- **Frontend**: Vanilla JavaScript (ES6+), no external framework dependencies
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: Tailwind CSS with custom theming system (6 themes)
- **State Management**: Custom centralized Store pattern wrapping localStorage
- **AI Integration**: OpenRouter API with streaming support
- **Testing**: Vitest with jsdom for unit testing
- **Deployment**: Cloudflare Pages with edge optimization

## Development Principles

- **Modular Architecture**: Separation of concerns with specialized engines for different game mechanics
- **Functional Programming**: Pure functions where possible, explicit side effects
- **Component Composition**: React-like component pattern for UI elements
- **Comprehensive Testing**: Unit tests for critical logic, manual testing for gameplay
- **User-Centric Design**: Mobile-first responsive design with accessibility in mind
- **Performance First**: Debounced persistence, efficient rendering, optimized AI interactions
- **Documentation Driven**: Clear code comments, architectural documentation, and user guides

## Risk Factors

1. **AI API Costs**: Users may incur unexpected costs - mitigated by transparent usage tracking
2. **Local Data Loss**: Browser data can be cleared - mitigated by export/import functionality
3. **Browser Compatibility**: PWA features vary by browser - focus on progressive enhancement
4. **AI Consistency**: LLMs can be unpredictable - mitigated by structured prompting and tag system
5. **Complexity**: D&D 5e rules are extensive - prioritize core mechanics first, expand gradually
