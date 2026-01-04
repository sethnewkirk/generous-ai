/**
 * Weave Manager
 * Main coordinator for The Weave knowledge graph
 */

import { Notice } from 'obsidian';
import GenerousAIPlugin from '../main';
import { EntityExtractor } from './entity-extractor';
import { GraphManager } from './graph-manager';
import { PatternDetector } from './pattern-detector';
import { ExtractionContext, EntitySource } from './types';
import { db } from '../database';

/**
 * The Weave Manager
 * Coordinates entity extraction, graph management, and pattern detection
 */
export class WeaveManager {
	private plugin: GenerousAIPlugin;
	private extractor: EntityExtractor | null = null;
	private graphManager: GraphManager;
	private patternDetector: PatternDetector;

	constructor(plugin: GenerousAIPlugin) {
		this.plugin = plugin;
		this.graphManager = new GraphManager();
		this.patternDetector = new PatternDetector(this.graphManager);
	}

	/**
	 * Initialize The Weave (requires API key)
	 */
	async initialize(): Promise<void> {
		// Get Claude API key
		const apiKey = await this.plugin.decryptSetting('claudeApiKey');

		if (!apiKey) {
			console.log('Claude API key not available - entity extraction disabled');
			return;
		}

		this.extractor = new EntityExtractor(apiKey);
		console.log('Weave initialized with entity extractor');
	}

	/**
	 * Process cached data to build The Weave
	 */
	async buildWeaveFromCachedData(
		progressCallback?: (message: string, progress: number, total: number) => void
	): Promise<void> {
		if (!this.extractor) {
			new Notice('Entity extraction not available - configure Claude API key');
			return;
		}

		new Notice('Building The Weave from your data...');

		// Get all cached data
		const allData = await db.cachedData.toArray();

		if (allData.length === 0) {
			new Notice('No data to process - sync your data sources first');
			return;
		}

		// Limit to recent data for initial build (e.g., last 100 items)
		const recentData = allData
			.sort((a, b) => b.lastUpdated - a.lastUpdated)
			.slice(0, 100);

		let processed = 0;
		let totalEntities = 0;
		let totalRelationships = 0;

		// Process in batches
		const batchSize = 10;
		for (let i = 0; i < recentData.length; i += batchSize) {
			const batch = recentData.slice(i, i + batchSize);

			// Build extraction contexts
			const contexts: ExtractionContext[] = batch.map((item) => ({
				dataSource: item.source as any,
				dataType: item.dataType,
				data: item.data,
			}));

			try {
				// Extract entities from batch
				const results = await this.extractor.extractBatch(
					contexts,
					(batchProgress, batchTotal) => {
						const overall = i + batchProgress;
						if (progressCallback) {
							progressCallback(
								'Extracting entities...',
								overall,
								recentData.length
							);
						}
					}
				);

				// Process extraction results
				for (let j = 0; j < results.length; j++) {
					const result = results[j];
					const item = batch[j];

					const source: EntitySource = {
						dataSource: item.source as any,
						dataType: item.dataType,
						dataId: item.externalId,
						extractedAt: Date.now(),
					};

					const stats = await this.graphManager.processExtractionResult(
						result,
						source
					);

					totalEntities += stats.entitiesAdded;
					totalRelationships += stats.relationshipsAdded;
				}

				processed += batch.length;

				if (progressCallback) {
					progressCallback('Processing...', processed, recentData.length);
				}
			} catch (error) {
				console.error('Batch extraction failed:', error);
			}
		}

		// Detect patterns
		if (progressCallback) {
			progressCallback('Detecting patterns...', recentData.length, recentData.length);
		}

		await this.detectAndSavePatterns();

		new Notice(
			`Weave built: ${totalEntities} entities, ${totalRelationships} relationships`
		);
	}

	/**
	 * Process new synced data
	 */
	async processNewData(
		dataSource: 'google' | 'spotify' | 'ynab',
		dataType: string,
		data: any,
		dataId: string
	): Promise<void> {
		if (!this.extractor) {
			return;
		}

		try {
			// Extract entities
			const context: ExtractionContext = {
				dataSource,
				dataType,
				data,
			};

			const result = await this.extractor.extract(context);

			// Add to graph
			const source: EntitySource = {
				dataSource,
				dataType,
				dataId,
				extractedAt: Date.now(),
			};

			await this.graphManager.processExtractionResult(result, source);
		} catch (error) {
			console.error('Failed to process new data:', error);
		}
	}

	/**
	 * Detect and save patterns
	 */
	async detectAndSavePatterns(): Promise<void> {
		try {
			const patterns = await this.patternDetector.detectPatterns();

			console.log(`Detected ${patterns.length} patterns`);

			// TODO: Save patterns to database
			// For now, just log them
			for (const pattern of patterns) {
				console.log(`Pattern: ${pattern.name} - ${pattern.description}`);
			}
		} catch (error) {
			console.error('Pattern detection failed:', error);
		}
	}

	/**
	 * Get Weave statistics
	 */
	async getStatistics() {
		return await this.graphManager.getStatistics();
	}

	/**
	 * Search entities
	 */
	async searchEntities(query: string, limit?: number) {
		return await this.graphManager.searchEntities(query, limit);
	}

	/**
	 * Get entity details with graph
	 */
	async getEntityGraph(entityId: number, depth?: number) {
		return await this.graphManager.getEntityGraph(entityId, depth);
	}

	/**
	 * Generate Weave overview markdown
	 */
	async generateWeaveOverview(): Promise<string> {
		const stats = await this.getStatistics();

		let markdown = `# The Weave: Your Life Map

*Last updated: ${new Date().toLocaleString()}*

## Overview

`;

		markdown += `- **Total Entities**: ${stats.totalEntities}\n`;
		markdown += `- **Total Relationships**: ${stats.totalRelationships}\n\n`;

		markdown += `## Entities by Type\n\n`;
		for (const [type, count] of Object.entries(stats.entitiesByType)) {
			markdown += `- **${type}**: ${count}\n`;
		}

		markdown += `\n## Most Prominent Entities\n\n`;
		for (const entity of stats.topEntities) {
			markdown += `- **${entity.name}** (${entity.occurrenceCount} occurrences)\n`;
		}

		markdown += `\n## Patterns Detected\n\n`;
		markdown += `*Pattern detection is running...*\n`;

		markdown += `\n---\n\n`;
		markdown += `*The Weave is your personal knowledge graph, built from your data.*\n`;

		return markdown;
	}

	/**
	 * Export Weave as JSON
	 */
	async exportWeave(): Promise<any> {
		const entities = await db.entities.toArray();
		const relationships = await db.relationships.toArray();

		return {
			version: '1.0',
			exportedAt: Date.now(),
			entities,
			relationships,
		};
	}
}
