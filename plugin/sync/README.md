# Sync Services Architecture

This directory contains all data integration and sync functionality for the Generous AI plugin.

## Architecture Overview

The sync system follows a service-based architecture where each data source has its own service class that extends `BaseSyncService`.

### Core Components

1. **BaseSyncService** (`base-service.ts`)
   - Abstract base class for all sync services
   - Handles OAuth token management and refresh
   - Provides common sync orchestration logic
   - Implements caching and error handling

2. **SyncManager** (`sync-manager.ts`)
   - Coordinates all sync services
   - Manages service initialization and lifecycle
   - Handles background sync scheduling
   - Provides unified sync API

3. **OAuth Helper** (`oauth-helper.ts`)
   - Utility functions for OAuth flows
   - Supports desktop (localhost server) and mobile (manual) flows
   - Handles token exchange and refresh

## Data Sources

### Google Service (`google-service.ts`)

Syncs data from:
- **Gmail**: Emails from inbox and sent folders
- **Calendar**: Events (past 30 days, future 90 days)
- **Drive**: File metadata (recently modified)

**OAuth Scopes:**
- `gmail.readonly`
- `calendar.readonly`
- `drive.readonly`

**Data Cached:**
- Email metadata (from, to, subject, date, snippet)
- Calendar events (summary, start/end, attendees)
- Drive files (name, type, modified date, link)

### Spotify Service (`spotify-service.ts`)

Syncs data from:
- **Recently Played**: Last 50 tracks
- **Top Tracks**: Favorite songs (short/medium/long term)
- **Saved Tracks**: Liked songs library

**OAuth Scopes:**
- `user-read-recently-played`
- `user-top-read`
- `user-library-read`
- `playlist-read-private`

**Data Cached:**
- Track plays with timestamps
- Artist and album information
- Listening context (playlist, album, etc.)

### YNAB Service (`ynab-service.ts`)

Syncs data from:
- **Transactions**: All transactions from default budget
- **Budget metadata**: Budget details

**Authentication:** API Token (not OAuth)

**Data Cached:**
- Transaction details (date, amount, payee, category)
- Account information
- Budget categorization

## Usage

### Basic Sync

```typescript
// Plugin initialization
this.syncManager = new SyncManager(this);
await this.syncManager.initialize(); // After master password set

// Sync all services
await this.syncManager.syncAll();

// Sync specific service
await this.syncManager.syncService('google');
```

### Background Sync

```typescript
// Start automatic sync
this.syncManager.startSyncInterval(); // Uses plugin settings

// Stop automatic sync
this.syncManager.stopSyncInterval();
```

### Service Management

```typescript
// Check if service is connected
const isConnected = this.syncManager.isServiceConnected('spotify');

// Get specific service
const googleService = this.syncManager.getService('google');

// Remove service
this.syncManager.removeService('google');
```

## Adding a New Service

1. Create a new service file extending `BaseSyncService`
2. Implement required methods:
   - `performSync()`: Main sync logic
   - `fetchData()`: Retrieve data from API
   - `refreshTokens()`: Token refresh logic (if OAuth)

3. Add service to `SyncManager`:
   - Initialize in `initialize()` method
   - Add to `DataSource` type in `types.ts`

Example:

```typescript
export class NewService extends BaseSyncService {
	constructor(credentials: string) {
		super('new-service');
	}

	protected async refreshTokens(): Promise<void> {
		// Implement token refresh
	}

	protected async performSync(): Promise<Partial<SyncResult>> {
		// Implement sync logic
		const items = await this.fetchData();
		await this.cacheData(items);

		return {
			itemsProcessed: items.length,
			itemsAdded: items.length,
		};
	}

	protected async fetchData(since?: number): Promise<FetchedDataItem[]> {
		// Implement data fetching
	}
}
```

## Data Flow

1. **User Authenticates**: OAuth flow or API token entry
2. **Tokens Stored**: Encrypted with master password
3. **Service Initialized**: SyncManager creates service instance
4. **Sync Triggered**: Manual or automatic (interval)
5. **Data Fetched**: Service makes API requests
6. **Data Cached**: Items stored in IndexedDB via `db.cacheData()`
7. **Sync State Updated**: Status, timestamps, error messages

## Error Handling

- Token refresh failures → Service marked as unauthenticated
- API errors → Logged, shown to user via Notice
- Sync failures → Error state in database, user notified
- Partial failures → Continue syncing other services

## Security

- All tokens encrypted with master password (AES-GCM)
- No tokens logged or exposed in error messages
- Tokens stored only in plugin settings (encrypted)
- Master password never persisted

## Performance Considerations

- **Rate Limiting**: Small delays between service syncs
- **Batch Sizes**: Limited to 50-100 items per request
- **Incremental Sync**: Supports 'since' parameter for delta syncs
- **Caching**: All data cached to IndexedDB for fast access

## Future Enhancements

- [ ] Desktop OAuth localhost server implementation
- [ ] Retry logic with exponential backoff
- [ ] Sync progress reporting
- [ ] Per-service sync intervals
- [ ] Delta sync optimization
- [ ] Data deduplication
- [ ] Conflict resolution
