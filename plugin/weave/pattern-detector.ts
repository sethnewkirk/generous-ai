/**
 * Pattern Detector
 * Analyzes The Weave to detect patterns, routines, and insights
 */

import { db } from '../database';
import { WeavePattern, WeaveInsight } from './types';
import { GraphManager } from './graph-manager';

/**
 * Pattern detection service
 */
export class PatternDetector {
	private graphManager: GraphManager;

	constructor(graphManager: GraphManager) {
		this.graphManager = graphManager;
	}

	/**
	 * Detect all patterns in The Weave
	 */
	async detectPatterns(): Promise<WeavePattern[]> {
		const patterns: WeavePattern[] = [];

		// Detect different pattern types
		patterns.push(...(await this.detectRoutines()));
		patterns.push(...(await this.detectTrends()));
		patterns.push(...(await this.detectClusters()));

		return patterns;
	}

	/**
	 * Detect routines (recurring patterns)
	 */
	private async detectRoutines(): Promise<WeavePattern[]> {
		const patterns: WeavePattern[] = [];

		// Analyze temporal data from different sources
		const cachedData = await db.cachedData.toArray();

		// Group by data type and analyze frequency
		const dataByType = new Map<string, any[]>();
		for (const item of cachedData) {
			const key = `${item.source}-${item.dataType}`;
			if (!dataByType.has(key)) {
				dataByType.set(key, []);
			}
			dataByType.get(key)!.push(item);
		}

		// Detect email routines (frequent correspondents)
		const emailData = cachedData.filter(
			(d) => d.source === 'google' && d.dataType === 'email'
		);
		if (emailData.length > 0) {
			const emailPatterns = await this.detectEmailRoutines(emailData);
			patterns.push(...emailPatterns);
		}

		// Detect calendar routines (recurring events)
		const calendarData = cachedData.filter(
			(d) => d.source === 'google' && d.dataType === 'calendar_event'
		);
		if (calendarData.length > 0) {
			const calendarPatterns = await this.detectCalendarRoutines(calendarData);
			patterns.push(...calendarPatterns);
		}

		// Detect music listening routines
		const spotifyData = cachedData.filter((d) => d.source === 'spotify');
		if (spotifyData.length > 0) {
			const musicPatterns = await this.detectMusicRoutines(spotifyData);
			patterns.push(...musicPatterns);
		}

		// Detect spending routines
		const ynabData = cachedData.filter((d) => d.source === 'ynab');
		if (ynabData.length > 0) {
			const spendingPatterns = await this.detectSpendingRoutines(ynabData);
			patterns.push(...spendingPatterns);
		}

		return patterns;
	}

	/**
	 * Detect email communication routines
	 */
	private async detectEmailRoutines(emailData: any[]): Promise<WeavePattern[]> {
		const patterns: WeavePattern[] = [];

		// Count frequency of correspondents
		const correspondents = new Map<string, number>();
		for (const email of emailData) {
			const from = email.data.from || '';
			const to = email.data.to || '';

			// Extract email addresses
			const fromEmail = from.match(/<(.+?)>/)?.[1] || from;
			const toEmail = to.match(/<(.+?)>/)?.[1] || to;

			correspondents.set(fromEmail, (correspondents.get(fromEmail) || 0) + 1);
			correspondents.set(toEmail, (correspondents.get(toEmail) || 0) + 1);
		}

		// Find frequent correspondents (threshold: 5+ emails)
		for (const [email, count] of correspondents) {
			if (count >= 5) {
				// Find entity for this email
				const entities = await this.graphManager.searchEntities(email, 1);

				patterns.push({
					id: 0, // Will be set when saved
					type: 'routine',
					name: `Frequent correspondence with ${email}`,
					description: `Exchanges ${count} emails with ${email}`,
					confidence: Math.min(0.9, count / 20),
					entities: entities.map((e) => e.id),
					relationships: [],
					significance: count / emailData.length,
					detectedAt: Date.now(),
					metadata: { count, email },
				});
			}
		}

		return patterns;
	}

	/**
	 * Detect calendar event routines
	 */
	private async detectCalendarRoutines(
		calendarData: any[]
	): Promise<WeavePattern[]> {
		const patterns: WeavePattern[] = [];

		// Group events by title (normalized)
		const eventGroups = new Map<string, any[]>();
		for (const event of calendarData) {
			const title = (event.data.summary || '').toLowerCase().trim();
			if (!eventGroups.has(title)) {
				eventGroups.set(title, []);
			}
			eventGroups.get(title)!.push(event);
		}

		// Find recurring events (3+ occurrences)
		for (const [title, events] of eventGroups) {
			if (events.length >= 3 && title) {
				// Analyze timing to determine frequency
				const timestamps = events.map((e) =>
					new Date(e.data.start).getTime()
				);
				timestamps.sort((a, b) => a - b);

				const intervals = [];
				for (let i = 1; i < timestamps.length; i++) {
					intervals.push(timestamps[i] - timestamps[i - 1]);
				}

				const avgInterval =
					intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
				const frequency = this.determineFrequency(avgInterval);

				patterns.push({
					id: 0,
					type: 'routine',
					name: `Recurring event: ${title}`,
					description: `${title} occurs ${frequency} (${events.length} times)`,
					confidence: Math.min(0.9, events.length / 10),
					entities: [],
					relationships: [],
					temporal: {
						frequency,
						startDate: timestamps[0],
						endDate: timestamps[timestamps.length - 1],
					},
					significance: events.length / calendarData.length,
					detectedAt: Date.now(),
					metadata: { count: events.length, title },
				});
			}
		}

		return patterns;
	}

	/**
	 * Detect music listening routines
	 */
	private async detectMusicRoutines(
		spotifyData: any[]
	): Promise<WeavePattern[]> {
		const patterns: WeavePattern[] = [];

		// Count artist listens
		const artistCounts = new Map<string, number>();
		for (const track of spotifyData) {
			const artists = track.data.artists || [];
			for (const artist of artists) {
				artistCounts.set(artist, (artistCounts.get(artist) || 0) + 1);
			}
		}

		// Find favorite artists (5+ listens)
		for (const [artist, count] of artistCounts) {
			if (count >= 5) {
				const entities = await this.graphManager.searchEntities(artist, 1);

				patterns.push({
					id: 0,
					type: 'routine',
					name: `Frequent listener of ${artist}`,
					description: `Listened to ${artist} ${count} times`,
					confidence: Math.min(0.9, count / 20),
					entities: entities.map((e) => e.id),
					relationships: [],
					significance: count / spotifyData.length,
					detectedAt: Date.now(),
					metadata: { count, artist },
				});
			}
		}

		return patterns;
	}

	/**
	 * Detect spending routines
	 */
	private async detectSpendingRoutines(
		ynabData: any[]
	): Promise<WeavePattern[]> {
		const patterns: WeavePattern[] = [];

		// Count spending by payee
		const payeeCounts = new Map<string, { count: number; total: number }>();
		for (const transaction of ynabData) {
			const payee = transaction.data.payeeName || 'Unknown';
			const amount = Math.abs(transaction.data.amount);

			if (!payeeCounts.has(payee)) {
				payeeCounts.set(payee, { count: 0, total: 0 });
			}

			const stats = payeeCounts.get(payee)!;
			stats.count++;
			stats.total += amount;
		}

		// Find frequent payees (3+ transactions)
		for (const [payee, stats] of payeeCounts) {
			if (stats.count >= 3) {
				const entities = await this.graphManager.searchEntities(payee, 1);

				patterns.push({
					id: 0,
					type: 'routine',
					name: `Regular spending at ${payee}`,
					description: `${stats.count} transactions totaling $${stats.total.toFixed(
						2
					)}`,
					confidence: Math.min(0.9, stats.count / 10),
					entities: entities.map((e) => e.id),
					relationships: [],
					significance: stats.count / ynabData.length,
					detectedAt: Date.now(),
					metadata: { count: stats.count, total: stats.total, payee },
				});
			}
		}

		return patterns;
	}

	/**
	 * Detect trends (increasing or decreasing patterns)
	 */
	private async detectTrends(): Promise<WeavePattern[]> {
		// TODO: Implement trend detection
		// - Increasing/decreasing communication with certain people
		// - Changes in music taste over time
		// - Spending trends by category
		return [];
	}

	/**
	 * Detect clusters (groups of related entities)
	 */
	private async detectClusters(): Promise<WeavePattern[]> {
		const patterns: WeavePattern[] = [];

		// Find groups of people who frequently appear together
		const relationships = await db.relationships.toArray();

		// Build adjacency map
		const adjacency = new Map<number, Set<number>>();
		for (const rel of relationships) {
			if (!adjacency.has(rel.fromEntityId)) {
				adjacency.set(rel.fromEntityId, new Set());
			}
			if (!adjacency.has(rel.toEntityId)) {
				adjacency.set(rel.toEntityId, new Set());
			}

			adjacency.get(rel.fromEntityId)!.add(rel.toEntityId);
			adjacency.get(rel.toEntityId)!.add(rel.fromEntityId);
		}

		// Find clusters (simple approach: entities with 3+ connections)
		for (const [entityId, connections] of adjacency) {
			if (connections.size >= 3) {
				const entity = await this.graphManager.getEntity(entityId);

				patterns.push({
					id: 0,
					type: 'cluster',
					name: `${entity.name}'s network`,
					description: `Connected to ${connections.size} other entities`,
					confidence: 0.7,
					entities: [entityId, ...Array.from(connections)],
					relationships: relationships
						.filter(
							(r) => r.fromEntityId === entityId || r.toEntityId === entityId
						)
						.map((r) => r.id!),
					significance: connections.size / adjacency.size,
					detectedAt: Date.now(),
					metadata: { connectionCount: connections.size },
				});
			}
		}

		return patterns;
	}

	/**
	 * Determine frequency from average interval
	 */
	private determineFrequency(
		intervalMs: number
	): 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly' {
		const day = 24 * 60 * 60 * 1000;
		const week = 7 * day;
		const month = 30 * day;
		const year = 365 * day;

		if (intervalMs < 2 * day) return 'daily';
		if (intervalMs < 10 * day) return 'weekly';
		if (intervalMs < 45 * day) return 'monthly';
		if (intervalMs < 400 * day) return 'yearly';
		return 'once';
	}
}
