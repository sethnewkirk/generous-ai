/**
 * Spotify service integration
 * Fetches listening history and saved tracks
 */

import { BaseSyncService } from './base-service';
import { SyncResult, FetchedDataItem, OAuthConfig } from './types';
import { refreshOAuthTokens } from './oauth-helper';

/**
 * Spotify OAuth configuration
 */
export const SPOTIFY_OAUTH_CONFIG: Partial<OAuthConfig> = {
	authUrl: 'https://accounts.spotify.com/authorize',
	tokenUrl: 'https://accounts.spotify.com/api/token',
	scopes: [
		'user-read-recently-played',
		'user-top-read',
		'user-library-read',
		'playlist-read-private',
	],
	redirectUri: 'http://localhost:8080/callback',
};

/**
 * Spotify track
 */
interface SpotifyTrack {
	id: string;
	name: string;
	artists: Array<{ name: string; id: string }>;
	album: { name: string; id: string };
	duration_ms: number;
	uri: string;
}

/**
 * Recently played item
 */
interface RecentlyPlayedItem {
	track: SpotifyTrack;
	played_at: string;
	context?: {
		type: string;
		uri: string;
	};
}

/**
 * Spotify service
 */
export class SpotifyService extends BaseSyncService {
	private clientId: string;
	private clientSecret: string;

	constructor(clientId: string, clientSecret: string) {
		super('spotify');
		this.clientId = clientId;
		this.clientSecret = clientSecret;
	}

	/**
	 * Refresh tokens using Spotify's refresh token flow
	 */
	protected async refreshTokens(): Promise<void> {
		if (!this.tokens?.refresh_token) {
			throw new Error('No refresh token available');
		}

		const config: OAuthConfig = {
			...SPOTIFY_OAUTH_CONFIG,
			clientId: this.clientId,
			clientSecret: this.clientSecret,
		} as OAuthConfig;

		const newTokens = await refreshOAuthTokens(
			this.tokens.refresh_token,
			config
		);

		this.setTokens(newTokens);
	}

	/**
	 * Perform sync for Spotify data
	 */
	protected async performSync(): Promise<Partial<SyncResult>> {
		const result: Partial<SyncResult> = {
			itemsProcessed: 0,
			itemsAdded: 0,
			itemsUpdated: 0,
		};

		// Sync recently played tracks
		const recentTracks = await this.syncRecentlyPlayed();
		result.itemsProcessed! += recentTracks.length;
		result.itemsAdded! += recentTracks.length;

		// Sync top tracks
		const topTracks = await this.syncTopTracks();
		result.itemsProcessed! += topTracks.length;
		result.itemsAdded! += topTracks.length;

		// Sync saved tracks
		const savedTracks = await this.syncSavedTracks();
		result.itemsProcessed! += savedTracks.length;
		result.itemsAdded! += savedTracks.length;

		return result;
	}

	/**
	 * Fetch data from Spotify
	 */
	protected async fetchData(since?: number): Promise<FetchedDataItem[]> {
		const items: FetchedDataItem[] = [];

		items.push(...(await this.syncRecentlyPlayed(since)));
		items.push(...(await this.syncTopTracks()));
		items.push(...(await this.syncSavedTracks(since)));

		return items;
	}

	/**
	 * Sync recently played tracks
	 */
	private async syncRecentlyPlayed(since?: number): Promise<FetchedDataItem[]> {
		const items: FetchedDataItem[] = [];

		let url = 'https://api.spotify.com/v1/me/player/recently-played?limit=50';

		if (since) {
			url += `&after=${since}`;
		}

		const response = await this.makeRequest(url);
		const data = await response.json();

		if (!data.items || data.items.length === 0) {
			return items;
		}

		for (const item of data.items as RecentlyPlayedItem[]) {
			const playedAt = new Date(item.played_at).getTime();

			items.push({
				id: `${item.track.id}-${playedAt}`,
				type: 'recently_played',
				source: 'spotify',
				data: {
					trackId: item.track.id,
					trackName: item.track.name,
					artists: item.track.artists.map((a) => a.name),
					album: item.track.album.name,
					playedAt: item.played_at,
					duration: item.track.duration_ms,
					context: item.context,
				},
				timestamp: playedAt,
			});

			// Cache the item
			await this.cacheData([items[items.length - 1]]);
		}

		return items;
	}

	/**
	 * Sync top tracks (user's favorite tracks)
	 */
	private async syncTopTracks(): Promise<FetchedDataItem[]> {
		const items: FetchedDataItem[] = [];

		// Get top tracks from different time ranges
		const timeRanges = ['short_term', 'medium_term', 'long_term'];

		for (const range of timeRanges) {
			const url = `https://api.spotify.com/v1/me/top/tracks?time_range=${range}&limit=20`;

			const response = await this.makeRequest(url);
			const data = await response.json();

			if (!data.items || data.items.length === 0) {
				continue;
			}

			for (const track of data.items as SpotifyTrack[]) {
				items.push({
					id: `${track.id}-top-${range}`,
					type: 'top_track',
					source: 'spotify',
					data: {
						trackId: track.id,
						trackName: track.name,
						artists: track.artists.map((a) => a.name),
						album: track.album.name,
						timeRange: range,
					},
					timestamp: Date.now(),
					metadata: { timeRange: range },
				});
			}
		}

		// Cache all items
		await this.cacheData(items);

		return items;
	}

	/**
	 * Sync saved tracks (liked songs)
	 */
	private async syncSavedTracks(since?: number): Promise<FetchedDataItem[]> {
		const items: FetchedDataItem[] = [];

		const url = 'https://api.spotify.com/v1/me/tracks?limit=50';

		const response = await this.makeRequest(url);
		const data = await response.json();

		if (!data.items || data.items.length === 0) {
			return items;
		}

		for (const item of data.items) {
			const addedAt = new Date(item.added_at).getTime();

			// Skip if before 'since' timestamp
			if (since && addedAt < since) {
				continue;
			}

			const track = item.track as SpotifyTrack;

			items.push({
				id: `saved-${track.id}`,
				type: 'saved_track',
				source: 'spotify',
				data: {
					trackId: track.id,
					trackName: track.name,
					artists: track.artists.map((a) => a.name),
					album: track.album.name,
					addedAt: item.added_at,
				},
				timestamp: addedAt,
			});

			// Cache the item
			await this.cacheData([items[items.length - 1]]);
		}

		return items;
	}
}
