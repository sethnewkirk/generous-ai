/**
 * Base sync service class
 * All data integration services extend this
 */

import { Notice } from 'obsidian';
import { db } from '../database';
import { OAuthTokens, SyncResult, DataSource, FetchedDataItem } from './types';

export abstract class BaseSyncService {
	protected serviceName: DataSource;
	protected tokens: OAuthTokens | null = null;

	constructor(serviceName: DataSource) {
		this.serviceName = serviceName;
	}

	/**
	 * Set OAuth tokens for this service
	 */
	setTokens(tokens: OAuthTokens): void {
		this.tokens = tokens;

		// Calculate expires_at if not present
		if (tokens.expires_in && !tokens.expires_at) {
			this.tokens.expires_at = Date.now() + tokens.expires_in * 1000;
		}
	}

	/**
	 * Get current tokens
	 */
	getTokens(): OAuthTokens | null {
		return this.tokens;
	}

	/**
	 * Check if tokens are expired
	 */
	isTokenExpired(): boolean {
		if (!this.tokens || !this.tokens.expires_at) {
			return false; // No expiry info, assume valid
		}

		// Add 5 minute buffer
		return Date.now() >= this.tokens.expires_at - 5 * 60 * 1000;
	}

	/**
	 * Check if service is authenticated
	 */
	isAuthenticated(): boolean {
		return this.tokens !== null && !this.isTokenExpired();
	}

	/**
	 * Refresh OAuth tokens if needed
	 * Should be implemented by services that support refresh tokens
	 */
	async refreshTokensIfNeeded(): Promise<boolean> {
		if (!this.isTokenExpired()) {
			return true;
		}

		if (!this.tokens?.refresh_token) {
			return false; // No refresh token available
		}

		try {
			await this.refreshTokens();
			return true;
		} catch (error) {
			console.error(`Failed to refresh tokens for ${this.serviceName}:`, error);
			return false;
		}
	}

	/**
	 * Refresh OAuth tokens
	 * Must be implemented by services that support refresh
	 */
	protected async refreshTokens(): Promise<void> {
		throw new Error('refreshTokens not implemented');
	}

	/**
	 * Perform full sync for this service
	 */
	async sync(): Promise<SyncResult> {
		const result: SyncResult = {
			success: false,
			itemsProcessed: 0,
			itemsAdded: 0,
			itemsUpdated: 0,
			errors: [],
			lastSyncTimestamp: Date.now(),
		};

		try {
			// Check authentication
			if (!this.isAuthenticated()) {
				throw new Error(`Not authenticated with ${this.serviceName}`);
			}

			// Refresh tokens if needed
			const refreshed = await this.refreshTokensIfNeeded();
			if (!refreshed) {
				throw new Error('Failed to refresh tokens');
			}

			// Update sync status
			await db.updateSyncState(this.serviceName, {
				status: 'syncing',
				lastSync: Date.now(),
			});

			// Perform the actual sync (implemented by subclasses)
			const syncResult = await this.performSync();

			// Update result
			Object.assign(result, syncResult);
			result.success = true;

			// Update sync status
			await db.updateSyncState(this.serviceName, {
				status: 'idle',
				lastSync: Date.now(),
				nextSync: Date.now() + 60 * 60 * 1000, // 1 hour from now
			});

			new Notice(`${this.serviceName} sync completed: ${result.itemsProcessed} items`);
		} catch (error) {
			console.error(`Sync failed for ${this.serviceName}:`, error);
			const errorMessage = error instanceof Error ? error.message : String(error);
			result.errors.push(errorMessage);

			await db.updateSyncState(this.serviceName, {
				status: 'error',
				errorMessage: errorMessage,
			});

			new Notice(`${this.serviceName} sync failed: ${errorMessage}`);
		}

		return result;
	}

	/**
	 * Perform the actual sync operation
	 * Must be implemented by subclasses
	 */
	protected abstract performSync(): Promise<Partial<SyncResult>>;

	/**
	 * Fetch data from the service
	 * Must be implemented by subclasses
	 */
	protected abstract fetchData(since?: number): Promise<FetchedDataItem[]>;

	/**
	 * Cache fetched data to database
	 */
	protected async cacheData(items: FetchedDataItem[]): Promise<void> {
		for (const item of items) {
			await db.cacheData(
				item.source,
				item.type,
				item.id,
				item.data,
				item.metadata
			);
		}
	}

	/**
	 * Make authenticated API request
	 */
	protected async makeRequest(
		url: string,
		options: RequestInit = {}
	): Promise<Response> {
		if (!this.tokens) {
			throw new Error('Not authenticated');
		}

		const headers = new Headers(options.headers);
		headers.set('Authorization', `Bearer ${this.tokens.access_token}`);

		const response = await fetch(url, {
			...options,
			headers,
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`API request failed (${response.status}): ${errorText}`
			);
		}

		return response;
	}

	/**
	 * Get service display name
	 */
	getDisplayName(): string {
		const names: Record<DataSource, string> = {
			google: 'Google',
			spotify: 'Spotify',
			ynab: 'YNAB',
		};
		return names[this.serviceName];
	}
}
