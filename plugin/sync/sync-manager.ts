/**
 * Sync Manager
 * Coordinates all data sync services
 */

import { Notice } from 'obsidian';
import GenerousAIPlugin from '../main';
import { GoogleService } from './google-service';
import { SpotifyService } from './spotify-service';
import { YNABService } from './ynab-service';
import { BaseSyncService } from './base-service';
import { DataSource, SyncResult } from './types';
import { db } from '../database';

/**
 * Sync manager class
 */
export class SyncManager {
	private plugin: GenerousAIPlugin;
	private services: Map<DataSource, BaseSyncService>;
	private syncInterval: number | null = null;

	constructor(plugin: GenerousAIPlugin) {
		this.plugin = plugin;
		this.services = new Map();
	}

	/**
	 * Initialize services with credentials
	 */
	async initialize(): Promise<void> {
		// Get master password
		const masterPassword = this.plugin.getMasterPassword();
		if (!masterPassword) {
			console.log('Master password not unlocked - services not initialized');
			return;
		}

		try {
			// Initialize Google service if tokens exist
			if (this.plugin.settings.googleTokens) {
				await this.initializeGoogleService();
			}

			// Initialize Spotify service if tokens exist
			if (this.plugin.settings.spotifyTokens) {
				await this.initializeSpotifyService();
			}

			// Initialize YNAB service if token exists
			if (this.plugin.settings.ynabToken) {
				await this.initializeYNABService();
			}

			console.log('Sync services initialized');
		} catch (error) {
			console.error('Failed to initialize sync services:', error);
		}
	}

	/**
	 * Initialize Google service
	 */
	private async initializeGoogleService(): Promise<void> {
		// Decrypt Google tokens
		const tokensJson = await this.plugin.decryptSetting('googleTokens');
		if (!tokensJson) return;

		const tokens = JSON.parse(tokensJson);

		// Get Google client credentials (would need to be configured)
		// For now, using placeholder values
		const clientId = process.env.GOOGLE_CLIENT_ID || '';
		const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

		const googleService = new GoogleService(clientId, clientSecret);
		googleService.setTokens(tokens);

		this.services.set('google', googleService);
	}

	/**
	 * Initialize Spotify service
	 */
	private async initializeSpotifyService(): Promise<void> {
		// Decrypt Spotify tokens
		const tokensJson = await this.plugin.decryptSetting('spotifyTokens');
		if (!tokensJson) return;

		const tokens = JSON.parse(tokensJson);

		// Get Spotify client credentials (would need to be configured)
		const clientId = process.env.SPOTIFY_CLIENT_ID || '';
		const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || '';

		const spotifyService = new SpotifyService(clientId, clientSecret);
		spotifyService.setTokens(tokens);

		this.services.set('spotify', spotifyService);
	}

	/**
	 * Initialize YNAB service
	 */
	private async initializeYNABService(): Promise<void> {
		// Decrypt YNAB token
		const apiToken = await this.plugin.decryptSetting('ynabToken');
		if (!apiToken) return;

		const ynabService = new YNABService(apiToken);

		this.services.set('ynab', ynabService);
	}

	/**
	 * Get a specific service
	 */
	getService(source: DataSource): BaseSyncService | undefined {
		return this.services.get(source);
	}

	/**
	 * Check if a service is connected
	 */
	isServiceConnected(source: DataSource): boolean {
		const service = this.services.get(source);
		return service !== undefined && service.isAuthenticated();
	}

	/**
	 * Sync a specific service
	 */
	async syncService(source: DataSource): Promise<SyncResult | null> {
		const service = this.services.get(source);

		if (!service) {
			new Notice(`${source} service not configured`);
			return null;
		}

		if (!service.isAuthenticated()) {
			new Notice(`${source} not authenticated`);
			return null;
		}

		new Notice(`Syncing ${service.getDisplayName()}...`);

		const result = await service.sync();

		return result;
	}

	/**
	 * Sync all connected services
	 */
	async syncAll(): Promise<Map<DataSource, SyncResult>> {
		const results = new Map<DataSource, SyncResult>();

		for (const [source, service] of this.services) {
			if (!service.isAuthenticated()) {
				console.log(`Skipping ${source} - not authenticated`);
				continue;
			}

			new Notice(`Syncing ${service.getDisplayName()}...`);

			const result = await service.sync();
			results.set(source, result);

			// Small delay between services
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}

		// Update last sync timestamp in settings
		this.plugin.settings.lastSyncTimestamp = Date.now();
		await this.plugin.saveSettings();

		// Show summary
		const totalItems = Array.from(results.values()).reduce(
			(sum, r) => sum + r.itemsProcessed,
			0
		);
		const errorCount = Array.from(results.values()).reduce(
			(sum, r) => sum + r.errors.length,
			0
		);

		if (errorCount > 0) {
			new Notice(
				`Sync completed with errors: ${totalItems} items, ${errorCount} errors`
			);
		} else {
			new Notice(`Sync completed successfully: ${totalItems} items processed`);
		}

		return results;
	}

	/**
	 * Start automatic sync interval
	 */
	startSyncInterval(): void {
		if (this.syncInterval !== null) {
			this.stopSyncInterval();
		}

		const intervalMinutes = this.plugin.settings.syncIntervalMinutes;
		if (intervalMinutes <= 0) {
			return;
		}

		const intervalMs = intervalMinutes * 60 * 1000;

		this.syncInterval = window.setInterval(async () => {
			console.log('Running scheduled sync...');
			await this.syncAll();
		}, intervalMs);

		console.log(`Sync interval started: ${intervalMinutes} minutes`);
	}

	/**
	 * Stop automatic sync interval
	 */
	stopSyncInterval(): void {
		if (this.syncInterval !== null) {
			window.clearInterval(this.syncInterval);
			this.syncInterval = null;
			console.log('Sync interval stopped');
		}
	}

	/**
	 * Get sync status for all services
	 */
	async getSyncStatus(): Promise<
		Map<
			DataSource,
			{
				connected: boolean;
				lastSync: number;
				nextSync: number;
				status: string;
			}
		>
	> {
		const status = new Map();

		for (const source of ['google', 'spotify', 'ynab'] as DataSource[]) {
			const syncState = await db.getSyncState(source);
			const connected = this.isServiceConnected(source);

			status.set(source, {
				connected,
				lastSync: syncState?.lastSync || 0,
				nextSync: syncState?.nextSync || 0,
				status: syncState?.status || 'idle',
			});
		}

		return status;
	}

	/**
	 * Remove a service (disconnect)
	 */
	removeService(source: DataSource): void {
		this.services.delete(source);
	}

	/**
	 * Cleanup
	 */
	cleanup(): void {
		this.stopSyncInterval();
		this.services.clear();
	}
}
