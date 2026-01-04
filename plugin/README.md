# Generous AI - Obsidian Plugin

A personal AI assistant that learns about you through your data and gently guides you toward living well.

## Vision

Generous AI acts as a "digital British servant" - observing discreetly, suggesting gently, never commanding, always dismissable. It builds a comprehensive understanding of your life through connected data sources and creative conversations, then uses this knowledge to help you live according to your values.

## Project Philosophy

The plugin follows the "British servant" principle (inspired by Jeeves from P.G. Wodehouse):
- **Observe discreetly** - Learn about you through your data
- **Suggest gently** - Offer helpful recommendations, never commands
- **Never mention virtue** - Guide toward better choices through practical suggestions, not moral instruction
- **Always dismissable** - You maintain complete control

## Current Status: Phase B Data Integration ✓

**Phase A (Foundation) - COMPLETE**
- ✅ Obsidian plugin scaffold with TypeScript
- ✅ Plugin settings tab with master password security
- ✅ Encrypted storage for API keys and sensitive data
- ✅ IndexedDB integration via Dexie.js for fast queries
- ✅ Vault folder structure creation
- ✅ Basic sidebar chat interface (UI shell)
- ✅ Status bar component
- ✅ Core commands (Open Dashboard, Open Sidebar, etc.)

**Phase B (Data Integration) - COMPLETE**
- ✅ Sync service architecture with base classes
- ✅ OAuth helper utilities for desktop and mobile
- ✅ Google integration (Gmail, Calendar, Drive)
- ✅ Spotify integration (listening history, top tracks)
- ✅ YNAB integration (budget transactions)
- ✅ Sync manager for coordinating all services
- ✅ Background sync engine with scheduling
- ✅ Token refresh and authentication management

## Features

### Security & Privacy

- **Master Password Protection**: All sensitive data is encrypted locally using AES-GCM
- **Web Crypto API**: Industry-standard encryption with PBKDF2 key derivation (600,000 iterations)
- **Local Storage**: Your data never leaves your device without your explicit consent
- **No Tracking**: No analytics, no telemetry, no cloud dependencies (except AI APIs you configure)

### Data Architecture

- **Markdown-First**: All user-facing content is stored as Markdown files in your vault
- **IndexedDB Cache**: Fast queries on structured data (entities, relationships, sync state)
- **Folder Structure**:
  - `_assistant/` - System folder (hidden, internal data)
  - `Assistant/` - User folder (your dashboard, conversations, modules)
  - `Assistant/The Weave/` - Your personal knowledge graph visualizations

### Current Capabilities

1. **Settings Management**
   - Master password creation and unlock
   - AI provider configuration (Claude/OpenAI)
   - Data source connections (Google, Spotify, YNAB)
   - Guidance level controls (4 tiers)

2. **Data Integration** ✨ NEW
   - **Google**: Gmail, Calendar, and Drive sync
   - **Spotify**: Recently played, top tracks, saved songs
   - **YNAB**: Budget transactions and categorization
   - OAuth token management with automatic refresh
   - Background sync engine with configurable intervals
   - Incremental sync support (delta updates)

3. **Vault Integration**
   - Automatic folder structure creation
   - Dashboard file with status overview
   - Command palette integration
   - Sidebar view for chat interface

4. **Database Layer**
   - Entity storage (people, places, events, etc.)
   - Relationship tracking
   - Conversation history
   - Sync state management
   - Cached external data for fast access

## Installation (Development)

1. Clone this repository
2. Navigate to the `plugin/` directory
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build the plugin:
   ```bash
   npm run build
   ```
5. Copy the following files to your vault's `.obsidian/plugins/generous-ai/` folder:
   - `main.js`
   - `manifest.json`
   - `styles.css` (if created)

6. Enable the plugin in Obsidian Settings → Community Plugins

## Commands

- **Open Sidebar**: Opens the Generous AI chat interface
- **Open Dashboard**: Opens your personal dashboard
- **Sync Data Sources Now**: Manually trigger a sync (when sources are connected)
- **View The Weave**: Opens your knowledge graph overview

## Architecture

### File Structure

```
plugin/
├── main.ts              # Main plugin class
├── settings.ts          # Settings tab UI
├── sidebar-view.ts      # Chat interface sidebar
├── database.ts          # IndexedDB wrapper (Dexie)
├── crypto.ts            # Encryption utilities
├── types.ts             # TypeScript type definitions
├── sync/                # Data integration services
│   ├── types.ts         # Sync-related types
│   ├── base-service.ts  # Base sync service class
│   ├── sync-manager.ts  # Sync coordinator
│   ├── oauth-helper.ts  # OAuth utilities
│   ├── google-service.ts   # Google integration
│   ├── spotify-service.ts  # Spotify integration
│   ├── ynab-service.ts     # YNAB integration
│   └── README.md        # Sync architecture docs
├── manifest.json        # Plugin metadata
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
└── esbuild.config.mjs   # Build configuration
```

### Technology Stack

- **Platform**: Obsidian Plugin API
- **Language**: TypeScript
- **Build Tool**: esbuild
- **Database**: IndexedDB via Dexie.js
- **Encryption**: Web Crypto API (AES-GCM, PBKDF2)
- **AI Backend**: Cloud APIs (Claude/OpenAI)

## Roadmap

### Phase B: Data Integration ✓ COMPLETE
- ✅ Google OAuth integration (Gmail, Calendar, Drive)
- ✅ Spotify API integration
- ✅ YNAB budget data import
- ✅ Background sync engine with scheduling
- ✅ Service-based sync architecture
- ⏳ Local file import (deferred to later phase)

### Phase C: The Weave (Knowledge Graph) - NEXT
- Kuzu graph database integration
- LLM-powered entity extraction
- Relationship inference
- Pattern detection
- Insight generation

### Phase D: Q&A Experience
- Creative question bank
- Adaptive conversation sequencing
- Session management
- Integration with The Weave

### Phase E: Module System
- Module definition schema
- Profile-based activation
- First modules:
  - Book Tracker (Goodreads sync)
  - Workout Planner
  - Financial Review
  - Connection Keeper

### Phase F: Virtue Guidance
- Tiered suggestion system
- Pattern detection triggers
- Daily examen integration
- Gentle, practical recommendations

### Phase G: Polish & Expansion
- Mobile companion app (iOS for HealthKit)
- Additional data integrations
- Advanced personalization
- Community module sharing

## Development

### Build Commands

```bash
# Development build with watch mode
npm run dev

# Production build
npm run build

# Version bump
npm version patch|minor|major
```

### Testing

Currently no automated tests. Manual testing recommended:
1. Load plugin in Obsidian
2. Create master password
3. Verify settings persistence
4. Test sidebar view
5. Check vault folder creation

## Privacy & Security Notes

- **Master password cannot be recovered** - Write it down in a safe place
- **API keys are encrypted** - Stored using your master password
- **Local-first architecture** - Data stays on your device
- **No telemetry** - We don't track usage or collect data

## Contributing

This is currently a private project. Contributions welcome once open-sourced.

## License

MIT License (to be confirmed)

## Credits

Created as part of the Generous AI project - helping people live well through thoughtful AI assistance.

---

*"The AI doesn't say 'I'm guiding you toward temperance' - it just suggests 'perhaps you might prefer tea this evening.'"*
