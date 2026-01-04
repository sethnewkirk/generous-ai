# The Generous AI Project - Implementation Plan

**Vision:** A personal AI assistant that learns about users through their data and gently guides them toward more virtuous lives, operating like a faithful British servant - **entirely within Obsidian**.

---

## Executive Summary

**Everything happens in Obsidian.** No separate app. The user lives in their vault, and our plugin does all the work.

This plan outlines a three-phase system:
1. **Data Collection & Integration** - Connect to data sources via an Obsidian "mega-plugin"
2. **The Weave** - Build a networked understanding through data analysis and creative Q&A
3. **The Modular Vault** - Dynamic markdown with context-aware modules tailored to the user

The AI operates on the "British servant" principle: observing discreetly, suggesting gently, never commanding, always dismissable.

---

## Obsidian-Native Architecture

**Everything is a plugin + vault structure.** No separate desktop app.

```
Obsidian Vault
+-- .obsidian/
|   +-- plugins/
|       +-- generous-ai/              # Our mega-plugin
|           +-- main.js               # Plugin code
|           +-- data.json             # Settings + encrypted tokens
|           +-- manifest.json
+-- _assistant/                       # System folder (can be hidden)
|   +-- weave/                        # Knowledge graph as JSON
|   +-- sync-state.json               # Last sync timestamps
|   +-- cache/                        # Extracted data cache
+-- Assistant/                        # User-facing content
|   +-- Dashboard.md
|   +-- Conversations/
|   +-- Modules/
+-- Daily Notes/
```

**Technology Stack:**
- Platform: Obsidian plugin (TypeScript)
- Primary Storage: Markdown files with frontmatter
- Index/Cache: IndexedDB via Dexie.js (fast queries, large data)
- Desktop-only: SQLite via better-sqlite3 (optional, for encrypted sensitive data)
- OAuth: Localhost HTTP server (desktop) / manual token entry (mobile)
- AI Backend: Cloud APIs (Claude) via direct fetch

---

## Phase 1: Data Collection & Onboarding

### Integration Priority (MVP)

| Service | Value | Approach |
|---------|-------|----------|
| Google (Gmail/Calendar/Drive) | High | OAuth 2.0, single auth for multiple APIs |
| Spotify | Medium | OAuth 2.0, excellent API |
| Plaid (Banking) | High | Plaid Link handles bank auth complexity |
| Apple Health | High | Requires companion iOS app or XML import |
| Local Files | High | Native file picker, no OAuth needed |

### Non-Technical User Onboarding Flow

```
1. Welcome: "Take control of your personal data"

2. Master Password Creation (encrypts everything locally)
   - "We cannot reset this - write it down"

3. Service Connection Wizard (one at a time)
   - Show friendly names: "Email" not "Gmail API"
   - Permission Preview: "We'll read, never send"
   - OAuth in system browser (not embedded)
   - Progress indicator during import

4. Initial Data Review
   - "Found: 12,847 emails, 423 calendar events"
   - User can exclude specific items/categories
```

---

## Phase 2: Building The Weave

### Knowledge Graph Architecture

**Database:** Kuzu (embedded graph DB, Cypher-compatible)

**Node Types:**
```
ENTITIES (Concrete)
  - Person (self, family, friends, colleagues)
  - Organization, Place, Event, Project

ABSTRACTIONS (Derived)
  - Theme (recurring patterns), Value, Goal
  - Skill, Role (parent, engineer, friend)

TEMPORAL
  - TimeSlice (life periods), Habit, Transition

META
  - Source (provenance), Confidence, Insight
```

**Relationship Types:**
- Interpersonal: KNOWS, FAMILY_OF, FRIEND_OF, WORKS_WITH
- Temporal: DURING, PRECEDED_BY, RECURRING_DURING
- Affective: FEELS_TOWARD, VALUES, CONFLICTS_WITH
- Causal: CAUSED_BY, LED_TO, ENABLED, BLOCKED

### LLM-Powered Extraction Pipeline

```
Raw Data → Entity Extraction (Claude Haiku for speed)
        → Relationship Inference
        → Pattern Detection
        → Insight Generation (Claude Sonnet)
        → User Validation (low-confidence items)
```

**Key Analysis Layers:**
1. **Layer 0:** Raw data (emails, messages, calendar)
2. **Layer 1:** Extracted entities with confidence scores
3. **Layer 2:** Relationships with temporal attributes
4. **Layer 3:** Patterns (habits, cycles, recurring themes)
5. **Layer 4:** Insights ("You spend 40% more time with colleagues than friends")
6. **Layer 5:** Virtue-aware recommendations

### The Q&A Process

**Philosophy:** Questions should astound - broad, deep, creative.

**Three-Tier Question Architecture:**
- **Tier 1 (Openers):** Specific, low-stakes ("What's the last thing you did just for fun?")
- **Tier 2 (Bridges):** Connect domains ("How is that different from five years ago?")
- **Tier 3 (Core):** Values, identity, meaning ("What would your life look like if you fully trusted yourself?")

**Question Categories:**
- Life goals and legacy
- Relationships and love (Gottman-influenced)
- Work and purpose
- Childhood and formation
- Fears and hopes
- Daily rhythms and habits
- Aesthetics and taste
- Spirituality and meaning (approach with genuine curiosity)
- Regrets and dreams
- The body and embodiment

**Adaptive Sequencing (OARS Framework):**
- High energy → Deepen ("Tell me more...")
- Moderate → Bridge to adjacent domain
- Low energy → Pivot to new Tier 1
- Resistance → Acknowledge, shift gently

**Session Structure:**
- Opening (5 min): 2-3 Tier 1 questions, establish safety
- Exploration (15-20 min): Mix Tier 2/3, follow the thread
- Integration (5-10 min): Reflect themes, meta-question ("What surprised you?")

---

## Phase 3: The Obsidian Vault

### Vault Architecture

```
vault/
├── _assistant/              # Hidden system folder
│   ├── config.md            # User preferences
│   ├── state.md             # Current state
│   └── weave/               # Knowledge graph exports
├── Assistant/               # User-facing
│   ├── Dashboard.md         # Main overview
│   ├── Conversations/       # Q&A sessions
│   ├── The Weave/           # User's life map
│   └── Modules/             # Active modules
│       ├── Books/
│       ├── Fitness/
│       ├── Finance/
│       └── Relationships/
└── Daily Notes/
    └── 2026-01-04.md        # With assistant sections
```

### Plugin Development

**Core Plugin Features:**
- Sidebar chat panel for Q&A
- Background sync with data sources
- Module installation/removal
- Dataview queries for dynamic content
- Templater integration for automated files

**UI Elements:**
- Custom sidebar view (chat interface)
- Status bar (sync status, "Ready")
- Commands (summarize note, ask about selection)
- Daily note sections with dynamic content

### Module System

**Module Definition (_module.md):**
```yaml
---
module-id: book-tracker
name: Book Tracker
enabled: true
requires: [dataview, templater]
integrations:
  goodreads:
    enabled: true
    user-id: "12345"
profile-activation: [reader, learner]
---
```

**Example Modules (Weave-Driven Activation):**

| User Profile | Activated Module | Features |
|--------------|------------------|----------|
| Reader | Book Tracker | Goodreads sync, reading goals, book notes |
| Fitness-focused | Workout Planner | Meal plans, workout logs, streak tracking |
| Frugal | Financial Review | Budget dashboards, spending patterns |
| Relational | Connection Keeper | Birthday reminders, check-in prompts |
| Creative | Project Studio | Idea capture, progress tracking |
| Spiritual | Examen Journal | Daily reflection prompts |

### Daily Note Integration

```markdown
# January 4, 2026

## Morning Briefing
<!-- ASSISTANT:briefing:start -->
Good morning! Here's your day:

**Weather:** 45°F, partly cloudy
**Calendar:** 3 meetings
**Habit streaks:** Reading (5), Exercise (3)

Today might be a good day for temperance - your schedule is packed.
<!-- ASSISTANT:briefing:end -->

## Notes
[Your content]

## Evening Review
<!-- ASSISTANT:examen:start -->
*Available after 6 PM*
<!-- ASSISTANT:examen:end -->
```

---

## The Virtue Framework

### The British Servant Model

**Core Principles:**
1. **Servant, not master** - Serve user's stated values, never impose
2. **Suggest, don't prescribe** - "You might consider..." not "You should..."
3. **Gradual, not dramatic** - Small habits, not transformations
4. **Observable, not hidden** - Transparent about what it notices
5. **Dismissable, always** - User can "fire" advice instantly
6. **Humble about limits** - Defer to humans for deep matters
7. **NEVER MENTION VIRTUE** - The AI never says "virtuous," "temperate," "prudent," etc. It just makes helpful, practical suggestions. The virtue framework is the internal compass, not the external language.

**The Jeeves Phrases (What the AI SAYS):**
- "You might enjoy some tea this evening"
- "This seems like a good day to take a walk"
- "You mentioned wanting more time with [person]"
- "Your calendar is quite full - perhaps save that decision for tomorrow?"

**What the AI NEVER SAYS:**
- "This would be a virtuous choice"
- "In the interest of temperance..."
- "The prudent path would be..."
- "For your spiritual growth..."

**Exception:** If the Weave identifies the user as explicitly religious (church attendance, prayer patterns, religious reading), the AI may engage with spiritual language when appropriate.

### Implementation Tiers

| Tier | Description | User Consent |
|------|-------------|--------------|
| 1 | Passive Observation | Default (no suggestions) |
| 2 | Reflective Prompts | Opt-in (Examen-style check-ins) |
| 3 | Gentle Suggestions | Explicit enable (max 1-2/day) |
| 4 | Accountability Partner | Advanced opt-in (goal tracking) |

### Virtue Detection Opportunities

| Pattern Detected | Virtue Opportunity | Sample Suggestion |
|------------------|-------------------|-------------------|
| Stress indicators | Temperance/Patience | "High-pressure moment. 5-min breathing?" |
| Social isolation | Charity/Community | "Haven't connected with [X] in a while" |
| Consumption spike | Temperance | "You mentioned moderating [X]..." |
| Comparison spiral | Humility | "Gratitude exercise might help" |
| Goal-action gap | Fortitude | "Small step toward [goal] today?" |

### What AI Should NOT Guide

- Relationship with God (deeply personal)
- Prayer life quality
- Vocational discernment
- Moral status (sin, grace, salvation)
- Complex ethical dilemmas
- Sacramental matters (confession, etc.)

---

## Implementation Phases

### Phase A: Foundation (Obsidian Plugin Core)
- [ ] Obsidian plugin scaffold (TypeScript, manifest.json, main.ts)
- [ ] Plugin settings tab with master password flow
- [ ] IndexedDB setup via Dexie.js for structured data
- [ ] Vault folder structure creation (_assistant/, Assistant/)
- [ ] Basic sidebar view (chat interface shell)
- [ ] Status bar component (sync status indicator)

### Phase B: Data Integration
- [ ] Google OAuth integration via localhost callback server (desktop)
- [ ] Manual token entry fallback (mobile)
- [ ] YNAB or CSV import for banking (Plaid requires server - deferred)
- [ ] Spotify integration
- [ ] Local file import via Obsidian file picker
- [ ] Background sync engine via setInterval

### Phase C: The Weave (Knowledge Graph)
- [ ] Kuzu graph database integration
- [ ] Entity extraction pipeline (Claude Haiku)
- [ ] Relationship inference
- [ ] Temporal modeling
- [ ] Basic pattern detection

### Phase D: The Q&A Experience
- [ ] Question bank by category
- [ ] Conversation logging to markdown
- [ ] Adaptive sequencing logic
- [ ] Session management (start/stop/resume)
- [ ] Integration with Weave (inform questions with data)

### Phase E: Module System
- [ ] Module definition schema
- [ ] Installation/removal logic
- [ ] Profile-based activation
- [ ] First modules: Books, Fitness, Finance, Relationships
- [ ] Dataview dashboard templates

### Phase F: Virtue Guidance
- [ ] Tiered suggestion system
- [ ] Pattern detection triggers
- [ ] British servant language templates
- [ ] User preference controls
- [ ] Examen integration for daily review

### Phase G: Polish & Expansion
- [ ] Mobile companion app (iOS for HealthKit)
- [ ] Additional integrations
- [ ] Advanced personalization
- [ ] Community module sharing

---

## Key Decisions (Confirmed)

1. **Platform:** Obsidian plugin only - no separate desktop app. Desktop-first development, mobile support later with graceful fallbacks (manual token entry instead of OAuth, IndexedDB instead of SQLite).

2. **LLM Backend:** Cloud APIs (Claude/OpenAI) for maximum capability

3. **Virtue Framework:** **CRITICAL** - The AI must NEVER be explicit about having virtuous ends in mind. It simply guides naturally toward better choices without virtue-speak. The user should feel they're receiving practical, comfortable suggestions - not moral instruction. The servant doesn't say "I'm guiding you toward temperance" - they just suggest "perhaps sir might prefer tea this evening." This rule relaxes ONLY if the user is explicitly religious (reflected in their Weave).

4. **Module Priority:** Build modules last after core infrastructure. First module: Fitness/Health (will require iOS companion app for HealthKit)

5. **Banking Integration:** Plaid requires server-side component, not feasible in pure Obsidian plugin. Use YNAB API (has public API) or CSV import as alternatives.

---

## Technical Recommendations Summary

| Component | Recommendation | Rationale |
|-----------|---------------|-----------|
| Platform | Obsidian Plugin (TypeScript) | User lives in vault, no context switching |
| Primary Storage | Markdown + YAML frontmatter | Native to Obsidian, human-readable |
| Index/Cache | IndexedDB via Dexie.js | Fast queries, large data, works on mobile |
| Sensitive Data | SQLite via better-sqlite3 | Desktop-only, optional encrypted storage |
| Graph DB | Kuzu (or JSON graph files) | Embedded, fast, Cypher-compatible |
| OAuth (Desktop) | Localhost HTTP server | Pattern used by obsidian-google-calendar |
| OAuth (Mobile) | Manual token entry | Fallback when localhost unavailable |
| LLM (extraction) | Claude Haiku | Fast, cheap, good at entity extraction |
| LLM (insight) | Claude Sonnet/Opus | Quality for virtue guidance |
| Companion Plugins | Dataview + Templater | Essential for dynamic content |
| Encryption | Web Crypto API + Argon2id | Browser-native, memory-hard KDF |

---

## Next Steps

1. Clarify open questions above
2. Begin Phase A: Foundation setup
3. Create initial Obsidian vault structure
4. Build first data integration (Google recommended)
5. Design initial Q&A question bank

---

*Plan generated: 2026-01-04*
*Project: Generous AI - The Digital Servant for Virtuous Living*
