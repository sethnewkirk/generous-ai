/**
 * Google service integration
 * Handles Gmail, Calendar, and Drive
 */

import { BaseSyncService } from './base-service';
import { SyncResult, FetchedDataItem, OAuthConfig } from './types';
import { refreshOAuthTokens } from './oauth-helper';

/**
 * Google OAuth configuration
 */
export const GOOGLE_OAUTH_CONFIG: Partial<OAuthConfig> = {
	authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
	tokenUrl: 'https://oauth2.googleapis.com/token',
	scopes: [
		'https://www.googleapis.com/auth/gmail.readonly',
		'https://www.googleapis.com/auth/calendar.readonly',
		'https://www.googleapis.com/auth/drive.readonly',
	],
	redirectUri: 'http://localhost:8080/callback', // Will be dynamic in desktop flow
};

/**
 * Gmail message
 */
interface GmailMessage {
	id: string;
	threadId: string;
	snippet: string;
	internalDate: string;
	payload: {
		headers: Array<{ name: string; value: string }>;
		body?: { data?: string };
		parts?: Array<{ body?: { data?: string } }>;
	};
}

/**
 * Calendar event
 */
interface CalendarEvent {
	id: string;
	summary: string;
	description?: string;
	start: { dateTime?: string; date?: string };
	end: { dateTime?: string; date?: string };
	attendees?: Array<{ email: string; displayName?: string }>;
	organizer?: { email: string; displayName?: string };
}

/**
 * Google service
 */
export class GoogleService extends BaseSyncService {
	private clientId: string;
	private clientSecret: string;

	constructor(clientId: string, clientSecret: string) {
		super('google');
		this.clientId = clientId;
		this.clientSecret = clientSecret;
	}

	/**
	 * Refresh tokens using Google's refresh token flow
	 */
	protected async refreshTokens(): Promise<void> {
		if (!this.tokens?.refresh_token) {
			throw new Error('No refresh token available');
		}

		const config: OAuthConfig = {
			...GOOGLE_OAUTH_CONFIG,
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
	 * Perform sync for all Google services
	 */
	protected async performSync(): Promise<Partial<SyncResult>> {
		const result: Partial<SyncResult> = {
			itemsProcessed: 0,
			itemsAdded: 0,
			itemsUpdated: 0,
		};

		// Sync Gmail
		const gmailItems = await this.syncGmail();
		result.itemsProcessed! += gmailItems.length;
		result.itemsAdded! += gmailItems.length;

		// Sync Calendar
		const calendarItems = await this.syncCalendar();
		result.itemsProcessed! += calendarItems.length;
		result.itemsAdded! += calendarItems.length;

		// Sync Drive (basic metadata only)
		const driveItems = await this.syncDrive();
		result.itemsProcessed! += driveItems.length;
		result.itemsAdded! += driveItems.length;

		return result;
	}

	/**
	 * Fetch data from Google services
	 */
	protected async fetchData(since?: number): Promise<FetchedDataItem[]> {
		const items: FetchedDataItem[] = [];

		items.push(...(await this.syncGmail(since)));
		items.push(...(await this.syncCalendar(since)));
		items.push(...(await this.syncDrive(since)));

		return items;
	}

	/**
	 * Sync Gmail messages
	 */
	private async syncGmail(since?: number): Promise<FetchedDataItem[]> {
		const items: FetchedDataItem[] = [];

		// Build query
		let query = 'in:inbox OR in:sent';
		if (since) {
			const sinceDate = new Date(since);
			const afterDate = sinceDate.toISOString().split('T')[0].replace(/-/g, '/');
			query += ` after:${afterDate}`;
		}

		// List messages (get IDs)
		const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(
			query
		)}&maxResults=100`;

		const listResponse = await this.makeRequest(listUrl);
		const listData = await listResponse.json();

		if (!listData.messages || listData.messages.length === 0) {
			return items;
		}

		// Fetch full message details
		for (const msg of listData.messages.slice(0, 50)) {
			// Limit to 50 for now
			try {
				const msgUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`;
				const msgResponse = await this.makeRequest(msgUrl);
				const message: GmailMessage = await msgResponse.json();

				// Extract headers
				const headers = message.payload.headers;
				const from = headers.find((h) => h.name === 'From')?.value || '';
				const to = headers.find((h) => h.name === 'To')?.value || '';
				const subject = headers.find((h) => h.name === 'Subject')?.value || '';
				const date = headers.find((h) => h.name === 'Date')?.value || '';

				items.push({
					id: message.id,
					type: 'email',
					source: 'google',
					data: {
						id: message.id,
						threadId: message.threadId,
						from,
						to,
						subject,
						date,
						snippet: message.snippet,
						timestamp: parseInt(message.internalDate),
					},
					timestamp: parseInt(message.internalDate),
				});

				// Cache the item
				await this.cacheData([items[items.length - 1]]);
			} catch (error) {
				console.error(`Failed to fetch message ${msg.id}:`, error);
			}
		}

		return items;
	}

	/**
	 * Sync Google Calendar events
	 */
	private async syncCalendar(since?: number): Promise<FetchedDataItem[]> {
		const items: FetchedDataItem[] = [];

		// Get primary calendar events
		const now = new Date();
		const timeMin = since
			? new Date(since).toISOString()
			: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ago
		const timeMax = new Date(
			now.getTime() + 90 * 24 * 60 * 60 * 1000
		).toISOString(); // 90 days ahead

		const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
			timeMin
		)}&timeMax=${encodeURIComponent(timeMax)}&maxResults=100&singleEvents=true&orderBy=startTime`;

		const response = await this.makeRequest(url);
		const data = await response.json();

		if (!data.items || data.items.length === 0) {
			return items;
		}

		for (const event of data.items as CalendarEvent[]) {
			const startTime = event.start.dateTime || event.start.date || '';
			const endTime = event.end.dateTime || event.end.date || '';

			items.push({
				id: event.id,
				type: 'calendar_event',
				source: 'google',
				data: {
					id: event.id,
					summary: event.summary,
					description: event.description,
					start: startTime,
					end: endTime,
					attendees: event.attendees,
					organizer: event.organizer,
				},
				timestamp: new Date(startTime).getTime(),
			});

			// Cache the item
			await this.cacheData([items[items.length - 1]]);
		}

		return items;
	}

	/**
	 * Sync Google Drive files (metadata only)
	 */
	private async syncDrive(since?: number): Promise<FetchedDataItem[]> {
		const items: FetchedDataItem[] = [];

		// Build query for recently modified files
		let query = "trashed=false and 'me' in owners";
		if (since) {
			const sinceDate = new Date(since).toISOString();
			query += ` and modifiedTime > '${sinceDate}'`;
		}

		const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
			query
		)}&fields=files(id,name,mimeType,modifiedTime,owners,webViewLink)&orderBy=modifiedTime desc&pageSize=100`;

		const response = await this.makeRequest(url);
		const data = await response.json();

		if (!data.files || data.files.length === 0) {
			return items;
		}

		for (const file of data.files) {
			items.push({
				id: file.id,
				type: 'drive_file',
				source: 'google',
				data: {
					id: file.id,
					name: file.name,
					mimeType: file.mimeType,
					modifiedTime: file.modifiedTime,
					owners: file.owners,
					webViewLink: file.webViewLink,
				},
				timestamp: new Date(file.modifiedTime).getTime(),
			});

			// Cache the item
			await this.cacheData([items[items.length - 1]]);
		}

		return items;
	}
}
