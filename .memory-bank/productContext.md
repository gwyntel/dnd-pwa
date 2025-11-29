# Product Context: D&D PWA

## Current State

**Current Version:** v0.0.0 (Pre-release)  
**Status:** Functional prototype with core gameplay implemented  
**Release Readiness:** 75% - Core systems working, needs polish and additional features

## User Experience Goals

### Primary User Journey
1. **Authentication** → OpenRouter OAuth or API key (30 seconds)
2. **Character Creation** → Choose template or create custom/AJ generation (2-5 minutes)
3. **World Selection** → Pick from templates or create custom world (1-2 minutes)
4. **Game Start** → AI generates opening scene with location, quest, NPCs (immediate)
5. **Core Gameplay Loop** → Player input → AI response with rolls/tags → State updates (continuous)

### Key Interaction Patterns
- **Conversational**: Chat-based interface with AI DM
- **Action-Driven**: ACTION[action] tags provide clickable suggestions
- **Real-time Feedback**: Dice rolls display immediately, results trigger follow-up narration
- **Persistent State**: All progress autosaves with debounced persistence
- **Visual Clarity**: Character HUD shows HP, AC, spell slots, conditions at a glance

### Accessibility Requirements
- Semantic HTML structure for screen readers
- Keyboard navigation support (Tab, Enter, Arrow keys)
- High contrast themes (light, dark, plus custom themes)
- Large touch targets for mobile (minimum 44x44px)
- Clear focus indicators on all interactive elements
- ARIA labels for dynamic content updates

## Success Metrics

### User Engagement
- **Session Length:** Target 30+ minutes average
- **Return Rate:** 70% of users return within 7 days
- **Character Creation:** 85% of users create at least one character
- **Game Completion:** Track completion % for starter adventures

### Technical Performance
- **Page Load:** < 2 seconds time to interactive on 3G
- **AI Response:** < 5 seconds median time to first token
- **Frame Rate:** 60fps during UI interactions
- **Bundle Size:** < 1MB initial JS payload
- **Memory Usage:** < 100MB average during gameplay

### Feature Adoption
- **Combat Usage:** 80% of games enter combat at least once
- **Spellcasting:** 40% of spellcaster characters use spells regularly
- **Multi-Character:** 30% of users create 3+ characters
- **World Building:** 25% of users create custom worlds

## Known Issues & Limitations

### Current Bugs
1. **Combat State Sync**: Sometimes initiative order doesn't update immediately after enemy spawn
2. **Memory Leak**: Event listeners may accumulate during long sessions (6+ hours)
3. **Mobile Scrolling**: Auto-scroll can be jumpy on some Android browsers
4. **Theme Flash**: Occasional flash of unstyled content on theme change

### Performance Issues
1. **Initial Load**: Large D&D data (monsters, items, spells) loads synchronously
2. **Storage Size**: Games with 1000+ messages can cause localStorage quota issues
3. **Rendering**: Long message lists (100+) cause slowdowns on mobile
4. **AI Context**: Large combat encounters can exceed context limits

### UX Limitations
1. **Tutorial**: No onboarding flow for new users
2. **Undo**: No way to undo actions or roll back state
3. **Search**: No search functionality in game history
4. **Shortcuts**: No keyboard shortcuts for power users
5. **Mobile UI**: Some complex modals are cramped on small screens

## Recent User Feedback

*(Gathered from early alpha testers - Session 1-10)*

### Positive Feedback
- "The AI DM feels surprisingly natural and adapts well to my choices"
- "Character creation is intuitive, especially the templates"
- "I love how it handles dice rolls and combat automatically"
- "The cost tracking helps me manage my OpenRouter usage"

### Constructive Criticism
- "I wish I could edit my character after creation"
- "Sometimes the AI forgets established facts from earlier in the session"
- "The inventory system is basic - I'd like more detailed equipment"
- "Combat can feel slow with lots of enemies"
- "I'd like more guidance on what I can do in a given situation"

## Upcoming Priorities (Next 3 Releases)

### v0.1.0 - Polish & Bugfixes (Priority 1 Features)
- Fix combat state synchronization issues
- Improve mobile UI/UX for small screens
- Add better error handling and user feedback
- Optimize initial load performance

### v0.2.0 - Enhanced Gameplay (Priority 2 Features)
- Character editing and respeccing
- Improved inventory management with item details
- Combat AI improvements for faster encounters
- Suggested actions enhancement with context awareness

### v0.3.0 - Advanced Features (Priority 3 Features)
- Export/import for individual games (not just full backup)
- Quest/journal system improvements
- Character sheet printing/PDF export
- Advanced world building tools

## Competitive Analysis

### Direct Competitors
1. **AI Dungeon**: More open-ended but lacks structured D&D mechanics
2. **Voyis**: D&D-focused but less feature-complete and web-only
3. **Call of the Dungeon**: Similar concept but mobile-only and less flexible

### Differentiators
- **Full 5e Rules**: More comprehensive than most competitors
- **Local-First Privacy**: No server-side data unlike most AI games
- **Model Freedom**: OpenRouter allows access to 100+ models vs locked-in
- **PWA Architecture**: True cross-platform vs web-only or mobile-only
- **Cost Transparency**: Real usage tracking vs hidden costs

## Product Evolution Strategy

### Phase 1: Core Mechanics (Current - 75% Complete)
✅ Authentication, character creation, basic gameplay, combat, spellcasting, rest mechanics, AI integration  
❌ Polish, advanced inventory, full rule implementation, mobile optimization

### Phase 2: Enhanced Gameplay (v0.2.0 - v0.4.0)
- Character progression beyond basic leveling
- Advanced combat mechanics (opportunity attacks, reactions, conditions)
- Better inventory with item interactions
- NPC relationship depth and dialogue trees

### Phase 3: Community & Social (v0.5.0+)
- Adventure sharing/export
- Community-submitted world templates
- Character build sharing
- Optional cloud sync (still privacy-focused)

### Phase 4: Advanced AI (v1.0+)
- Multi-modal support (character art, maps)
- Voice narration support
- Custom fine-tuned models for D&D
- Advanced world simulation

## Accessibility & Inclusion

### Current Accessibility Features
- 6 color themes including high contrast options
- Semantic HTML structure
- Keyboard navigation for core flows
- Clear visual hierarchy and focus indicators
- Screen reader friendly labels

### Planned Improvements
- Full keyboard shortcuts for power users
- Reduced motion option for animations
- Larger text size options
- Screen reader optimization for dynamic content
- Color-blind friendly palettes

### Language Support
- Current: English only
- Future: Spanish, French, German, Japanese (priority based on user demand)

## Business Model Considerations

### Current Model
- **Free & Open Source**: MIT license, no monetization
- **User-Paid AI**: Users pay OpenRouter directly for AI usage
- **Self-Hosted**: Users can deploy their own instances

### Future Options
- **Premium Features**: Advanced analytics, cloud sync, priority support
- **Content Marketplace**: Premium adventure modules, character art packs
- **Enterprise**: Self-hosted corporate team building version
- **Donations**: Patreon/GitHub Sponsors for development funding
