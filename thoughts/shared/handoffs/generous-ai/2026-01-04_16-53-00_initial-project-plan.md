---
date: 2026-01-04T16:53:00-05:00
session_name: generous-ai
researcher: claude
git_commit: none
branch: main
repository: generous-ai
topic: "Generous AI Project - Initial Planning Complete"
tags: [planning, obsidian-plugin, knowledge-graph, virtue-ethics]
status: complete
last_updated: 2026-01-04
last_updated_by: claude
type: implementation_strategy
root_span_id:
turn_span_id:
---

# Handoff: Generous AI Project Plan Complete

## Task(s)

| Task | Status |
|------|--------|
| Read and understand Initial Prompt | Completed |
| Research data integration approaches | Completed |
| Research knowledge graph architecture (The Weave) | Completed |
| Research virtue ethics and AI moral guidance | Completed |
| Research Obsidian plugin architecture | Completed |
| Research creative Q&A design | Completed |
| Clarify user preferences (platform, LLM, virtue framework) | Completed |
| Pivot to Obsidian-only architecture (user rejected Tauri) | Completed |
| Research Obsidian-native OAuth/data patterns | Completed |
| Write comprehensive implementation plan | Completed |

**Current State:** Planning phase complete. Ready to begin Phase A: Foundation (Obsidian Plugin Core).

## Critical References

1. **User's Original Vision:** `/Users/seth/Documents/Achaean/Generous AI Project/Initial Prompt.md`
2. **Implementation Plan:** `/Users/seth/.claude/plans/abundant-conjuring-liskov.md`

## Recent changes

No code changes - this was a planning session. Created implementation plan file only.

## Learnings

### Architecture Decision: Obsidian-Only
User explicitly rejected separate Tauri desktop app. All functionality must live within Obsidian:
- OAuth IS possible via localhost HTTP server (reference: `obsidian-google-calendar` plugin)
- Data storage: Markdown + IndexedDB (Dexie.js) + optional SQLite (desktop only)
- Mobile limitations require fallbacks (manual token entry instead of OAuth)
- Banking/Plaid NOT feasible without server - use YNAB API or CSV import instead

### The British Servant Model
**CRITICAL CONSTRAINT:** The AI must NEVER mention virtue explicitly. Internal compass uses Christian virtue ethics (seven virtues, seven deadly sins), but external language is purely practical. Examples:
- Say: "You might enjoy some tea this evening"
- Never say: "In the interest of temperance..."

Exception: If user's Weave shows explicit religious practice, spiritual language is permitted.

### The Weave Architecture
Knowledge graph with layered analysis:
- Layer 0-2: Raw data, entities, relationships
- Layer 3-4: Patterns and insights
- Layer 5: Virtue-aware recommendations (internal only)

Recommended DB: Kuzu (embedded, Cypher-compatible)

### Q&A Design
Three-tier question architecture:
- Tier 1 (Openers): Low-stakes, specific
- Tier 2 (Bridges): Connect domains
- Tier 3 (Core): Values, identity, meaning

Uses OARS framework from motivational interviewing.

## Post-Mortem (Required for Artifact Index)

### What Worked
- Parallel research agents: Launched 5 agents simultaneously to research different domains (data integration, knowledge graphs, virtue ethics, Obsidian plugins, Q&A design) - gathered comprehensive information efficiently
- Early user clarification: Asked key questions about platform, LLM backend, virtue framework before detailed planning
- Iterative plan updates: When user rejected Tauri, quickly pivoted with additional research agents for Obsidian-only approach

### What Failed
- Initial architecture assumption: Assumed separate Tauri app + Obsidian vault was acceptable
  - Fixed by: Additional research into Obsidian-native OAuth patterns, rewrote plan sections
- Banking integration assumption: Assumed Plaid would work in browser context
  - Fixed by: Documented as limitation, proposed YNAB/CSV alternatives

### Key Decisions
1. **Platform:** Obsidian plugin only (no Tauri)
   - Alternatives: Tauri desktop app, Electron app, web app
   - Reason: User explicitly requested all activity happen in Obsidian

2. **LLM Backend:** Cloud APIs (Claude/OpenAI)
   - Alternatives: Local models (Ollama), hybrid
   - Reason: Maximum capability for virtue guidance and entity extraction

3. **Virtue Communication:** Never explicit
   - Alternatives: Explicit virtue language, gamified virtue tracking
   - Reason: User wants comfortable, non-preachy experience

## Artifacts

- `/Users/seth/.claude/plans/abundant-conjuring-liskov.md` - Complete implementation plan (407 lines)
- `/Users/seth/Documents/Achaean/Generous AI Project/Initial Prompt.md` - Original user vision document

## Action Items & Next Steps

### Immediate (Phase A: Foundation)
1. [ ] Create Obsidian plugin scaffold (TypeScript, manifest.json, main.ts)
2. [ ] Implement plugin settings tab with master password flow
3. [ ] Set up IndexedDB via Dexie.js for structured data
4. [ ] Create vault folder structure (_assistant/, Assistant/)
5. [ ] Build basic sidebar view (chat interface shell)
6. [ ] Add status bar component (sync status indicator)

### After Foundation
- Phase B: Data Integration (Google OAuth, Spotify, YNAB/CSV)
- Phase C: The Weave (Kuzu graph DB, entity extraction)
- Phase D: Q&A Experience (question bank, adaptive sequencing)
- Phase E: Module System (Books, Fitness, Finance modules)
- Phase F: Virtue Guidance (tiered suggestion system)
- Phase G: Polish (mobile companion, community sharing)

## Other Notes

### Reference Obsidian Plugins
Research identified these as good examples to study:
- `obsidian-google-calendar` - OAuth flow via localhost
- `obsidian-readwise` - Sync patterns
- `text-generator-plugin` - AI API integration

### User Preferences Captured
- Desktop-first, mobile later with graceful fallbacks
- First module to build: Fitness/Health (requires iOS companion for HealthKit)
- User may be religious - Weave should detect and adjust language accordingly

### Project Philosophy
The "British servant" metaphor (Jeeves from P.G. Wodehouse): Observe discreetly, suggest gently, never command, always dismissable. The servant doesn't say "I'm guiding you toward temperance" - they just suggest "perhaps sir might prefer tea this evening."
