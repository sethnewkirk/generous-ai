# Generous AI Project

A personal AI assistant that learns about you through your data and gently guides you toward virtuous living - entirely within Obsidian.

## Project Vision

Generous AI is designed to help people live well by:
1. **Learning** about you through integrated data sources (email, calendar, music, finances, health)
2. **Understanding** your patterns through a personal knowledge graph ("The Weave")
3. **Guiding** you gently toward better choices through practical suggestions

## The British Servant Model

The AI acts like a faithful British servant (think Jeeves from P.G. Wodehouse):
- Observes discreetly
- Suggests gently
- Never commands
- Always dismissable
- **Never mentions virtue explicitly** - just makes helpful, practical suggestions

### Example Interactions

❌ **What the AI never says:**
- "This would be a virtuous choice"
- "In the interest of temperance..."
- "For your spiritual growth..."

✅ **What the AI says instead:**
- "You might enjoy some tea this evening"
- "You haven't connected with [person] in a while"
- "Your calendar is quite full - perhaps save that decision for tomorrow?"

## Project Structure

```
generous-ai/
├── plugin/              # Obsidian plugin source code
│   ├── main.ts
│   ├── settings.ts
│   ├── sidebar-view.ts
│   ├── database.ts
│   └── ...
├── docs/                # Project documentation
│   └── initial-prompt.md
├── thoughts/            # Planning and handoff documents
│   └── shared/
│       ├── plans/
│       └── handoffs/
└── README.md           # This file
```

## Current Status

**Phase A: Foundation - COMPLETE** ✅

The Obsidian plugin now has:
- Plugin scaffold with TypeScript
- Settings tab with master password encryption
- IndexedDB integration for fast queries
- Vault folder structure
- Basic sidebar chat interface
- Status bar and commands

See [plugin/README.md](plugin/README.md) for detailed plugin documentation.

## Implementation Phases

1. **Phase A: Foundation** ✅ - Obsidian plugin core (COMPLETE)
2. **Phase B: Data Integration** - Connect to Google, Spotify, YNAB, etc.
3. **Phase C: The Weave** - Knowledge graph with entity extraction
4. **Phase D: Q&A Experience** - Creative conversations to understand the user
5. **Phase E: Module System** - Dynamic features based on user profile
6. **Phase F: Virtue Guidance** - Gentle, tiered suggestion system
7. **Phase G: Polish** - Mobile companion, advanced features

## Architecture Overview

### Platform
- **Everything in Obsidian** - No separate desktop app
- Desktop-first, mobile later with graceful fallbacks
- Plugin written in TypeScript

### Data Storage
- **Markdown files** - All user-facing content
- **IndexedDB** - Structured data cache (via Dexie.js)
- **SQLite** - Optional encrypted storage (desktop only)
- **Graph DB** - Kuzu for knowledge graph (planned)

### Security
- **Master password** - AES-GCM encryption for sensitive data
- **Local-first** - Data never leaves device without explicit consent
- **Web Crypto API** - Industry-standard encryption

### AI Backend
- **Cloud APIs** - Claude (Anthropic) or OpenAI
- **Two-tier approach**:
  - Claude Haiku for fast entity extraction
  - Claude Sonnet/Opus for quality insights and guidance

## The Weave: Knowledge Graph Architecture

The Weave is a layered knowledge graph that builds understanding:

- **Layer 0-2**: Raw data, entities, relationships
- **Layer 3-4**: Patterns and insights
- **Layer 5**: Virtue-aware recommendations (internal only, never mentioned to user)

### Node Types
- **Entities**: Person, Organization, Place, Event, Project
- **Abstractions**: Theme, Value, Goal, Skill, Role
- **Temporal**: TimeSlice, Habit, Transition
- **Meta**: Source, Confidence, Insight

### Relationship Types
- Interpersonal: KNOWS, FAMILY_OF, WORKS_WITH
- Temporal: DURING, PRECEDED_BY, RECURRING_DURING
- Affective: FEELS_TOWARD, VALUES, CONFLICTS_WITH
- Causal: CAUSED_BY, LED_TO, ENABLED, BLOCKED

## The Q&A Process

Creative questions to build understanding, organized in three tiers:

- **Tier 1 (Openers)**: Low-stakes, specific ("What's the last thing you did just for fun?")
- **Tier 2 (Bridges)**: Connect domains ("How is that different from five years ago?")
- **Tier 3 (Core)**: Values, identity, meaning ("What would your life look like if you fully trusted yourself?")

Questions cover:
- Life goals and legacy
- Relationships and love
- Work and purpose
- Childhood and formation
- Fears and hopes
- Daily rhythms
- Aesthetics and taste
- Spirituality (approached with curiosity, not assumption)

## The Module System

Modules activate based on user profile detected in The Weave:

| User Profile | Module | Features |
|-------------|---------|----------|
| Reader | Book Tracker | Goodreads sync, reading goals |
| Fitness-focused | Workout Planner | Meal plans, workout logs, streaks |
| Frugal | Financial Review | Budget dashboards, spending patterns |
| Relational | Connection Keeper | Birthday reminders, check-in prompts |
| Creative | Project Studio | Idea capture, progress tracking |
| Spiritual | Examen Journal | Daily reflection prompts |

## Virtue Framework

The AI uses Christian virtue ethics (seven virtues, seven deadly sins) as its internal compass, but **never mentions this to the user**.

### Guidance Tiers (User Controls)

1. **Tier 1**: Passive observation (no suggestions)
2. **Tier 2**: Reflective prompts (Examen-style check-ins)
3. **Tier 3**: Gentle suggestions (1-2 per day)
4. **Tier 4**: Accountability partner (goal tracking)

### What AI Should NOT Guide

- Relationship with God (deeply personal)
- Prayer life quality
- Vocational discernment
- Moral status (sin, grace, salvation)
- Complex ethical dilemmas
- Sacramental matters

## Data Integrations (Planned)

### Phase B
- **Google**: OAuth for Gmail, Calendar, Drive
- **Spotify**: Music listening history
- **YNAB**: Budget and transaction data (alternative to Plaid)
- **Local Files**: Direct import via Obsidian file picker

### Future Phases
- **Apple Health**: iOS companion app for HealthKit
- **Strava/Fitbit**: Fitness tracking
- **Goodreads**: Reading history
- **Additional services** as requested

## Development Setup

See [plugin/README.md](plugin/README.md) for plugin development instructions.

Quick start:
```bash
cd plugin
npm install
npm run build
```

## Philosophy & Principles

1. **Servant, not master** - Serve user's values, never impose
2. **Suggest, don't prescribe** - "You might consider..." not "You should..."
3. **Gradual, not dramatic** - Small habits, not transformations
4. **Observable, not hidden** - Transparent about what it notices
5. **Dismissable, always** - User can ignore advice instantly
6. **Humble about limits** - Defer to humans for deep matters
7. **Privacy-first** - Local storage, user consent, no tracking

## Documentation

- [Initial Prompt](docs/initial-prompt.md) - Original project vision
- [Implementation Plan](thoughts/shared/plans/2026-01-04_generous-ai-implementation-plan.md) - Detailed technical plan
- [Plugin README](plugin/README.md) - Plugin-specific documentation

## License

MIT License (to be confirmed)

## Acknowledgments

Built with:
- [Obsidian](https://obsidian.md) - The markdown-based knowledge base
- [Claude](https://anthropic.com) - AI assistance from Anthropic
- Inspired by P.G. Wodehouse's Jeeves character

---

*"The servant doesn't say 'I'm guiding you toward temperance' - they just suggest 'perhaps sir might prefer tea this evening.'"*
