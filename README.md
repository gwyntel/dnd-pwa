# D&D PWA

A progressive web app for single-player D&D-style text adventures powered by LLMs via OpenRouter.

## Features (Phase 1 - Foundation)

✅ **Project Setup**
- Vite-based vanilla JavaScript project
- Mobile-first responsive design
- Dark/Light/Auto theme support
- PWA manifest

✅ **Authentication**
- OpenRouter PKCE OAuth flow
- Direct API key input option
- Session-based token storage

✅ **Data Management**
- localStorage wrapper with schema validation
- Export/Import functionality
- Auto-save support
- Storage usage tracking

✅ **Basic UI Shell**
- Home/Dashboard view
- Settings page
- Client-side routing
- Responsive navigation

## Getting Started

### Prerequisites
- Node.js 20.19+ or 22.12+
- OpenRouter account (for API access)

### Installation

1. Clone the repository:
```bash
cd dnd-pwa
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory, ready for deployment to Cloudflare Pages or any static hosting service.

## Project Structure

```
dnd-pwa/
├── public/
│   └── manifest.json          # PWA manifest
├── src/
│   ├── utils/
│   │   ├── auth.js           # OpenRouter OAuth & API key handling
│   │   ├── storage.js        # localStorage wrapper
│   │   └── openrouter.js     # OpenRouter API integration
│   ├── views/
│   │   ├── home.js           # Home/Dashboard view
│   │   └── settings.js       # Settings page
│   ├── router.js             # Client-side routing
│   ├── style.css             # Global styles with theming
│   └── main.js               # Application entry point
├── index.html
└── package.json
```

## Phase 1 Completion Status

- [x] Project setup with Vite
- [x] OpenRouter authentication flow
- [x] Basic UI shell with routing
- [x] localStorage wrapper with data schema
- [x] Theme system (light/dark/auto)
- [x] Settings page
- [x] Export/Import functionality

## Next Steps (Phase 2)

- [ ] Character creator with templates
- [ ] Character list view
- [ ] Model selector UI
- [ ] Character data CRUD operations

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Authentication Options

**Option 1: OAuth (Recommended)**
1. Click "Connect with OpenRouter"
2. Authorize the application
3. You'll be redirected back with access token

**Option 2: Direct API Key**
1. Get your API key from [OpenRouter](https://openrouter.ai/keys)
2. Enter it in the "Use API Key" field
3. Key is stored in sessionStorage (cleared on tab close)

## Tech Stack

- **Vanilla JavaScript** (ES6+)
- **Vite** - Build tool and dev server
- **CSS Variables** - Theming system
- **localStorage** - Data persistence
- **sessionStorage** - Auth token storage
- **OpenRouter API** - LLM integration

## License

MIT

## Contributing

This is a personal project, but suggestions and feedback are welcome!

## Acknowledgments

- Built for the D&D community
- Powered by [OpenRouter](https://openrouter.ai)
