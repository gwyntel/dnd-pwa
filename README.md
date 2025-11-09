# D&D PWA

A progressive web app for single-player D&D-style text adventures powered by AI via OpenRouter.

## Features

### Current (v1.0)
- **OpenRouter Authentication**: PKCE OAuth flow for secure API access
- **Character Management**: Create custom D&D 5e characters or use templates
- **AI-Powered Gameplay**: Dynamic narrative generation using LLMs
- **Combat System**: Automatic combat detection and turn-based battles
- **Dice Rolling**: Built-in dice roller with D&D standard notation
- **Model Selection**: Choose from 100+ AI models on OpenRouter
- **Temperature Control**: Adjust AI creativity from focused (0) to creative (2)
- **Multiple Campaigns**: Manage multiple games with independent states
- **Data Management**: Export/import your games and characters
- **Dark/Light Theme**: Auto-detection or manual theme selection
- **PWA Support**: Install as a standalone app

### In Development
- **Suggested Actions**: AI-powered action suggestions (streaming fix in progress)
- **Worlds/Settings System**: Create reusable campaign settings and worlds

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- OpenRouter account (free at [openrouter.ai](https://openrouter.ai))

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/gwyntel/dnd-pwa.git
   cd dnd-pwa
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Run development server**
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Build for production**
   \`\`\`bash
   npm run build
   \`\`\`

### Deployment
Built for static hosting on Cloudflare Pages, but works on any static host:
- Vercel
- Netlify
- GitHub Pages
- Any CDN or static file server

## Usage

1. **Authenticate** with OpenRouter (OAuth or API key)
2. **Create a Character** using templates or custom stats
3. **Start a New Game** and select your character
4. **Play!** The AI DM will guide your adventure

### Tips
- **New to D&D?** Use character templates and the AI will explain rules as you play
- **Long press models** in the model selector to view details on OpenRouter
- **Adjust temperature** in settings to control AI creativity
- **Export your data** regularly to back up your adventures

## Project Structure

\`\`\`
dnd-pwa/
├── public/           # Static assets
├── src/
│   ├── utils/        # Helper functions (storage, API, auth)
│   ├── views/        # Page components
│   ├── main.js       # App entry point
│   ├── router.js     # Client-side routing
│   └── style.css     # Global styles
├── index.html        # App shell
└── package.json
\`\`\`

## Technology Stack

- **Framework**: Vanilla JavaScript (ES6+)
- **Build Tool**: Vite
- **Storage**: localStorage
- **AI Provider**: OpenRouter
- **Hosting**: Cloudflare Pages (static)

## Roadmap

### v1.1 - Enhanced Suggestions
- ✅ Fix streaming action bubbles display
- ⬜ Separate suggestion model (cheaper/faster)
- ⬜ Click-to-use action suggestions

### v1.2 - Worlds System
- ⬜ Create custom campaign settings
- ⬜ Template worlds (Fantasy, Sci-Fi, Horror, etc.)
- ⬜ AI-generated world descriptions
- ⬜ Reuse worlds across games

### v1.3 - Google Drive Sync
- ⬜ OAuth for Google Drive
- ⬜ Auto-sync game data
- ⬜ Conflict resolution

### v1.4 - Advanced Features
- ⬜ Custom system prompts per game
- ⬜ Character portrait uploads
- ⬜ Sound effects and ambient audio
- ⬜ Detailed game statistics

### v1.5 - Sharing & Community
- ⬜ Export/import individual characters
- ⬜ Share adventure templates
- ⬜ Community character library

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Acknowledgments

- OpenRouter for AI model access
- D&D 5e System Reference Document
- Community contributors

## Support

For issues or questions:
- Open an issue on GitHub
- Contact: [your-email]

---

Built with ❤️ for tabletop RPG enthusiasts
