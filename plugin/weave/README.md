# The Weave: Knowledge Graph System

The Weave is the knowledge graph at the heart of Generous AI. It builds a comprehensive understanding of the user's life by extracting entities and relationships from their synced data, detecting patterns, and generating insights.

## Architecture

The Weave consists of several interconnected components:

### 1. Entity Extractor (`entity-extractor.ts`)

Uses Claude (Haiku model) to extract structured information from raw data.

**Features:**
- LLM-powered entity extraction
- Supports Google, Spotify, and YNAB data
- Batch processing with progress tracking
- Confidence scoring for extracted entities
- Relationship detection

**Entity Types Extracted:**
- **People**: Contacts, colleagues, friends
- **Organizations**: Companies, groups
- **Places**: Locations, addresses
- **Events**: Meetings, occasions
- **Projects**: Work projects, initiatives
- **Themes**: Recurring topics
- **Interests**: Music, books, hobbies
- **And more**: Skills, roles, habits, goals, values

**Relationship Types Detected:**
- Interpersonal: KNOWS, FRIEND_OF, WORKS_WITH
- Temporal: DURING, PRECEDED_BY, RECURRING_DURING
- Affective: VALUES, INTERESTED_IN, ASPIRES_TO
- Activity: ATTENDED, CREATED, LISTENS_TO, READS
- Organizational: MEMBER_OF, WORKS_AT, PART_OF

### 2. Graph Manager (`graph-manager.ts`)

Manages the knowledge graph CRUD operations and querying.

**Capabilities:**
- Entity and relationship upsert (merge duplicates)
- Graph traversal (get connected entities)
- Entity search by name
- Statistics and analytics
- Entity merging (deduplicate)
- Export graph to JSON

**Key Features:**
- **Case-insensitive matching**: Entities with different capitalizations are merged
- **Source tracking**: Every entity tracks which data sources contributed to it
- **Occurrence counting**: Tracks how often entities appear
- **Confidence aggregation**: Higher-confidence extractions override lower ones
- **Alias support**: Entities can have multiple names

### 3. Pattern Detector (`pattern-detector.ts`)

Analyzes The Weave to identify meaningful patterns in user behavior.

**Pattern Types:**

**Routines:**
- Frequent correspondents (5+ emails)
- Recurring calendar events (3+ occurrences)
- Regular music listening (5+ plays of same artist)
- Spending patterns (3+ transactions at same payee)

**Trends:**
- Changes in communication frequency
- Shifts in music taste
- Spending category trends
- *More to be implemented*

**Clusters:**
- Groups of highly connected entities
- Social/professional networks
- *More sophisticated clustering coming*

**Pattern Attributes:**
- Confidence level (0-1)
- Significance score (importance/relevance)
- Temporal information (frequency, dates)
- Associated entities and relationships

### 4. Weave Manager (`weave-manager.ts`)

Main coordinator that ties everything together.

**Core Functionality:**
- Initializes entity extractor with Claude API key
- Orchestrates batch processing of cached data
- Manages extraction → graph update pipeline
- Pattern detection and insight generation
- Generates markdown overviews
- Provides query interface for the graph

**Public API:**
```typescript
// Build from cached data
await weaveManager.buildWeaveFromCachedData();

// Process new synced data
await weaveManager.processNewData(source, type, data, id);

// Get statistics
const stats = await weaveManager.getStatistics();

// Search entities
const results = await weaveManager.searchEntities('query');

// Get entity graph
const graph = await weaveManager.getEntityGraph(entityId, depth);

// Generate overview
const markdown = await weaveManager.generateWeaveOverview();
```

## Data Flow

1. **Data Sync**: External data synced via sync services → cached in IndexedDB
2. **Extraction**: WeaveManager processes cached data in batches
3. **LLM Analysis**: EntityExtractor sends data to Claude for structure extraction
4. **Graph Update**: GraphManager adds/merges entities and relationships
5. **Pattern Detection**: PatternDetector analyzes graph for routines and trends
6. **Insight Generation**: Patterns converted to actionable insights (future)
7. **Visualization**: Markdown overview generated for user viewing

## Entity Source Tracking

Every entity and relationship tracks its sources:

```typescript
{
  dataSource: 'google' | 'spotify' | 'ynab' | 'manual' | 'inferred',
  dataType: 'email' | 'calendar_event' | 'recently_played' | ...,
  dataId: 'external-id',
  extractedAt: timestamp,
  context?: 'additional info'
}
```

This enables:
- **Provenance tracking**: Know where each fact came from
- **Confidence aggregation**: Multiple sources increase confidence
- **Incremental updates**: Re-extraction doesn't duplicate
- **Debugging**: Trace back to source data

## Confidence Scoring

Extracted entities have confidence levels:

- **HIGH (0.8-1.0)**: Explicitly stated facts
- **MEDIUM (0.5-0.7)**: Reasonable inferences
- **LOW (0.3-0.4)**: Uncertain guesses

When entities are merged, the highest confidence wins.

## Performance

**Initial Build:**
- Processes up to 100 recent data items
- Batch size: 10 items at a time
- Delay between batches: 500ms (rate limiting)
- Estimated time: 5-10 minutes for 100 items

**Incremental Updates:**
- Process new data as it's synced
- Immediate entity extraction
- No batch delays for single items

## Usage

### Building The Weave

```typescript
// From command palette: "Build The Weave from Data"
// Or programmatically:
await plugin.buildWeave();
```

### Viewing The Weave

```typescript
// From command palette: "View The Weave"
// Or programmatically:
await plugin.viewWeave();
```

This opens `Assistant/The Weave/Overview.md` with:
- Entity counts by type
- Top entities by occurrence
- Detected patterns
- Last updated timestamp

### Querying The Weave

```typescript
// Search for entities
const people = await plugin.weaveManager.searchEntities('john');

// Get entity details with connections
const graph = await plugin.weaveManager.getEntityGraph(entityId, 2); // depth=2

// Get statistics
const stats = await plugin.weaveManager.getStatistics();
```

## Database Schema

**Entities Table:**
- id, type, name, aliases[], confidence
- attributes (JSON), sources[]
- firstSeen, lastSeen, occurrenceCount
- createdAt, updatedAt

**Relationships Table:**
- id, fromEntityId, toEntityId, type
- confidence, strength, attributes (JSON)
- sources[], createdAt, updatedAt

**Patterns Table:**
- id, type, name, description
- confidence, significance
- entities[], relationships[], temporal
- detectedAt, metadata

**Insights Table:** *(Future use)*
- id, type, content, confidence
- relevance, basedOn
- createdAt, dismissed, dismissedAt

## Future Enhancements

### Short Term
- [ ] Save detected patterns to database
- [ ] Generate insights from patterns
- [ ] Entity disambiguation (better duplicate detection)
- [ ] More sophisticated clustering algorithms
- [ ] Trend detection implementation

### Medium Term
- [ ] Graph visualization (D3.js or similar)
- [ ] Interactive entity exploration
- [ ] Timeline view of relationships
- [ ] Strength calculation for relationships
- [ ] Temporal pattern analysis

### Long Term
- [ ] Kuzu graph database integration
- [ ] Advanced query language (Cypher-like)
- [ ] Real-time pattern detection
- [ ] Predictive insights
- [ ] Cross-domain correlation analysis

## Notes

- The Weave never stores raw data content - only extracted entities
- All personal data stays local - only metadata sent to Claude for extraction
- Entities are stored separately from source data for privacy
- The graph can be exported and backed up independently
