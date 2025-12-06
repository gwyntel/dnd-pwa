# Technical Context

## Development Environment

### Prerequisites
- **Node.js:** v18+ (current project uses modern ES6+ features)
- **npm:** v8+ (comes with Node.js)
- **Git:** For version control
- **Modern Browser:** Chrome, Firefox, Safari, Edge (latest versions)

### Setup Instructions
```bash
# 1. Clone repository
git clone <repository-url>
cd dnd-pwa

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env.local
# Edit .env.local with your OpenRouter API key if desired:
# VITE_OPENROUTER_API_KEY=sk-or-...

# 4. Start development server
npm run dev

# 5. Run tests
npm test

# 6. Build for production
npm run build

# 7. Deploy to Cloudflare Pages
npm run deploy
```

## Technology Stack

### Core Technologies
- **JavaScript Runtime:** Vanilla ES6+ (no frameworks or transpilation for production code)
- **Build Tool:** Vite 7.1.7 (fast development server, optimized production builds)
- **Package Manager:** npm (with package-lock.json for deterministic builds)
- **Testing Framework:** Vitest 4.0.13 with jsdom for DOM testing
- **Styling:** Vanilla CSS with CSS variables (no framework)
- **Version Control:** Git with conventional commits

### Key Dependencies
```json
{
  "dependencies": {
    "openai": "^4.104.0"
  },
  "devDependencies": {
    "jsdom": "^27.0.1",
    "terser": "^5.44.1",
    "vite": "^7.1.7",
    "vitest": "^4.0.13"
  }
}
```

> **Note:** React, Tailwind, and 28 other packages were removed during Phase 1 dependency cleanup (2025-11-30). The app now uses vanilla CSS with CSS variables for styling.

### Development Tools
- **Terser:** JavaScript minification for production
- **jsdom:** DOM simulation for testing

## Project Configuration Files

### vite.config.js
```javascript
{
  root: '.',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    sourcemap: true
  },
  server: {
    port: 5173,
    strictPort: true
  }
}
```

### wrangler.toml (Cloudflare Workers/Pages)
```toml
name = "dnd-pwa"
main = "worker.js"
compatibility_date = "2024-01-01"

[site]
bucket = "./dist"
```

### public/manifest.json (PWA)
- App name: "D&D PWA"
- Icons: 192x192, 512x512
- Theme colors: Support for multiple themes
- Display: Standalone (app-like experience)

### index.html
- App shell with navigation container
- Service worker registration
- Theme system initialization
- SEO meta tags

## Key Technical Decisions

### 1. No Build-Time Framework
**Decision:** Use vanilla JavaScript instead of React/Vue/Svelte

**Rationale:**
- **Performance:** No virtual DOM overhead
- **Bundle Size:** Smaller production builds
- **Learning Curve:** Easier for new contributors
- **Control:** Full control over rendering lifecycle
- **PWA Ready:** Simpler service worker implementation

**Trade-offs:**
- **UI Complexity:** Manual DOM management for complex interactions
- **Reusability:** Component pattern is home-grown
- **Ecosystem:** No access to framework-specific libraries

**Implementation:** React-like component pattern using pure functions that return HTML strings

### 2. localStorage for Data Persistence
**Decision:** Use localStorage instead of IndexedDB or server-side storage

**Rationale:**
- **Simplicity:** Simple key-value API, no complex queries
- **Privacy:** All data stays on user's device
- **Offline Support:** Works completely offline
- **Browser Support:** Universal browser support
- **Development Speed:** Faster to implement than IndexedDB

**Trade-offs:**
- **Storage Limits:** ~5-10MB per domain (can be issue for 1000+ message games)
- **Sync Issues:** No built-in sync between tabs/devices
- **Performance:** Synchronous API can block main thread
- **Data Structure:** No indexing or complex queries

**Mitigations:**
- **Debounced Saves:** Reduce write frequency (300ms delay)
- **Data Trimming:** Cap relationships (50) and locations (10)
- **Export/Import:** Manual backup/restore functionality
- **Future Migration:** Path to IndexedDB when localStorage becomes limiting

### 3. Modular Engine Architecture
**Decision:** Separate game mechanics into specialized engines

**Rationale:**
- **Separation of Concerns:** Each engine handles one aspect
- **Testability:** Engines can be tested in isolation
- **Maintainability:** Easier to understand and modify specific systems
- **Extensibility:** New mechanics can be added as new engines

**Engines:**
- `TagProcessor.js` - Tag parsing and execution
- `CombatManager.js` - Combat state and initiative
- `SpellcastingManager.js` - Spell slots and concentration
- `RestManager.js` - Short/long rest mechanics
- `EquipmentManager.js` - Items, AC calculation
- `EffectsEngine.js` - Item effect resolution
- `GameLoop.js` - Overall game flow orchestration

### 4. Tag-Driven Game Mechanics
**Decision:** Use text tags (ROLL[], COMBAT_START[], etc.) instead of function calls

**Rationale:**
- **AI Integration:** AI can generate tags naturally in text
- **Flexibility:** Easy to add new mechanics by adding new tags
- **Human Readable:** Tags are self-documenting
- **Debugging:** Easy to inspect AI responses for issues

**Trade-offs:**
- **Parsing Overhead:** Need to parse and validate tags
- **Type Safety:** No compile-time checking of tag formats
- **Error Handling:** Malformed tags must be handled gracefully

**Implementation:** Centralized tag definitions in `src/data/tags.js`, regex-based parsing in `TagParser.js`

### 5. Streaming-First AI Integration
**Decision:** Support real-time streaming for all AI interactions

**Rationale:**
- **User Experience:** Immediate feedback as AI generates response
- **Perceived Performance:** Faster than waiting for complete response
- **Real-time Mechanics:** Tags can be processed as they arrive
- **Cost Tracking:** Real-time usage and cost updates
- **Reasoning Display:** Show AI's thought process in real-time

**Complexities:**
- **Partial Tag Handling:** Tags may be split across chunks
- **State Management:** Need to handle incomplete state during streaming
- **Error Recovery:** Network interruptions during streaming
- **UI Updates:** Frequent re-renders during streaming

**Implementation:** Async generators for streaming, rollup buffer for tag parsing, debounced persistence

## Browser Compatibility

### Supported Browsers
- **Chrome:** 90+ (full feature support)
- **Firefox:** 88+ (full feature support)
- **Safari:** 14+ (full feature support, some PWA limitations)
- **Edge:** 90+ (full feature support)

### Progressive Enhancement
- **ES6+ Features:** Modern syntax with Vite handling compatibility
- **PWA Features:** Graceful degradation if service workers not supported
- **IndexedDB:** Plan for migration from localStorage
- **CSS Grid/Flexbox:** Fallbacks for older browsers (Tailwind provides)

### Known Limitations
- **Safari PWA:** Limited push notification support
- **iOS Safari:** Filesystem access restrictions for imports/exports
- **Firefox mobile:** Some PWA installation quirks

## Performance Characteristics

### Bundle Analysis
- **Vendor Bundle:** ~400KB (openai client, Tailwind, utilities)
- **App Bundle:** ~250KB (game logic, components, views)
- **Data Bundle:** ~150KB (monsters, items, spells, templates)
- **Total:** ~800KB uncompressed, ~200KB gzipped

### Loading Strategy
- **Critical Path:** Initial HTML + CSS + minimal JS for authentication
- **Lazy Loading:** D&D data loaded on-demand (character creation, world building)
- **Service Worker:** Caches static assets for offline use
- **Code Splitting:** Potential for route-based splitting (future enhancement)

### Runtime Performance
- **Memory Usage:** ~50-100MB during gameplay (localStorage data cached in memory)
- **CPU Usage:** Minimal except during AI streaming and complex combat calculations
- **Frame Rate:** 60fps target for UI interactions
- **AI Latency:** 2-5s median time to first token (depends on model)

## Security Model

### Client-Side Trust Model
- **Zero Trust:** All code runs client-side, assume users can modify anything
- **API Keys:** Stored in localStorage (user's device, their responsibility)
- **Data Integrity:** Schema validation on load to detect corruption
- **XSS Prevention:** 
  - TagParser sanitizes tag content
  - `escapeHtml()` utility used for all user content
  - Semantic HTML prevents injection

### AI Content Safety
- **Tag Validation:** Strict regex patterns for tag recognition
- **Content Filtering:** TagParser removes dangerous characters
- **Manual Review:** Users should review AI outputs before state changes
- **Privacy:** No data sent to AI except user prompts (local-first)

## Development Workflow

### Local Development
```bash
# Start development server
npm run dev

# Environment variables (optional)
# VITE_OPENROUTER_API_KEY=sk-or-...
# Creates .env.local automatically from .env.example
```

### Testing Strategy
```bash
# Run all tests
npm test

# Run specific test file
npm test -- TagParser.spec.js

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### Build Process
```bash
# Development build
npm run build -- --mode development

# Production build (with minification)
npm run build

# Preview production build
npm run preview
```

### Deployment
```bash
# Deploy to Cloudflare Pages
npm run deploy

# Requires wrangler CLI configured
# Creates production build automatically
```

## Troubleshooting

### Common Issues

**Issue:** `localStorage quota exceeded`
- **Cause:** Large game state (1000+ messages, many characters)
- **Solution:** Export and clear old games, increase trimming limits
- **Future Fix:** Migrate to IndexedDB

**Issue:** `CORS errors` with custom AI endpoints
- **Cause:** Cross-origin requests blocked
- **Solution:** Configure CORS on endpoint or use proxy
- **Built-in:** `utils/cors-detector.js` and `utils/proxy.js` available

**Issue:** `AI streaming interrupted`
- **Cause:** Network issues, provider errors, context limits
- **Solution:** Check console for errors, try different model, reduce message history
- **Recovery:** App automatically re-enables input for retry

**Issue:** `Character validation fails`
- **Cause:** Corrupted data from old version
- **Solution:** Run migration functions (`utils/migrations/`)
- **Prevention:** Schema versioning and validation on load

### Debug Mode
```javascript
// Enable debug logging in browser console
localStorage.setItem('debug', 'dnd-pwa:*')

// Disable
localStorage.removeItem('debug')
```

### Getting Help
1. Check browser console for errors
2. Verify API key is valid (`isAuthenticated()`)
3. Test with TAGParser.spec.js tests
4. Clear localStorage and retry (`localStorage.clear()`)
5. Check GitHub issues for similar problems

## Future Technical Roadmap

### v0.1.0 (Current Goals)
- Fix all critical bugs
- Complete unit test coverage for engines
- Performance optimization for mobile
- Better error messages and recovery

### v0.2.0 (Near Term)
- IndexedDB migration for larger data storage
- Service worker improvements for offline play
- Web Workers for background processing
- Enhanced input validation and sanitization

### v1.0.0 (Long Term)
- Multiplayer support (WebRTC)
- Advanced AI features (function calling, fine-tuning)
- Plugin system for custom mechanics
- Comprehensive accessibility improvements
