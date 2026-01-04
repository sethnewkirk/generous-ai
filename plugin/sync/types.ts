/**
 * Type definitions for sync services
 */

/**
 * OAuth token response
 */
export interface OAuthTokens {
	access_token: string;
	refresh_token?: string;
	expires_in?: number;
	token_type: string;
	scope?: string;
	expires_at?: number; // Calculated timestamp when token expires
}

/**
 * OAuth configuration
 */
export interface OAuthConfig {
	clientId: string;
	clientSecret?: string;
	authUrl: string;
	tokenUrl: string;
	scopes: string[];
	redirectUri: string;
}

/**
 * Sync result for a single service
 */
export interface SyncResult {
	success: boolean;
	itemsProcessed: number;
	itemsAdded: number;
	itemsUpdated: number;
	errors: string[];
	lastSyncTimestamp: number;
}

/**
 * Sync status
 */
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

/**
 * Data source type
 */
export type DataSource = 'google' | 'spotify' | 'ynab';

/**
 * Fetched data item
 */
export interface FetchedDataItem {
	id: string;
	type: string;
	source: DataSource;
	data: any;
	timestamp: number;
	metadata?: any;
}

/**
 * Sync progress callback
 */
export type SyncProgressCallback = (progress: {
	source: DataSource;
	status: SyncStatus;
	message: string;
	itemsProcessed?: number;
	totalItems?: number;
}) => void;
