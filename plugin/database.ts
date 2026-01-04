/**
 * IndexedDB database wrapper using Dexie.js
 * Used for fast queries on structured data, caching, and sync state
 */

import Dexie, { Table } from 'dexie';

/**
 * Sync state for individual data sources
 */
export interface SyncRecord {
	id?: number;
	source: 'google' | 'spotify' | 'ynab';
	lastSync: number;
	nextSync: number;
	status: 'idle' | 'syncing' | 'error';
	errorMessage?: string;
}

/**
 * Cached data from external sources
 */
export interface CachedData {
	id?: number;
	source: string;
	dataType: string; // e.g., 'email', 'calendar_event', 'track'
	externalId: string;
	data: any; // JSON data from the source
	lastUpdated: number;
	metadata?: any;
}

/**
 * Extracted entities from The Weave
 */
export interface Entity {
	id?: number;
	type: 'person' | 'organization' | 'place' | 'event' | 'project' | 'theme' | 'value' | 'goal';
	name: string;
	confidence: number; // 0-1
	attributes: any; // JSON attributes
	sources: string[]; // Array of source IDs
	createdAt: number;
	updatedAt: number;
}

/**
 * Relationships between entities
 */
export interface Relationship {
	id?: number;
	fromEntityId: number;
	toEntityId: number;
	type: string; // e.g., 'KNOWS', 'WORKS_WITH', 'DURING'
	confidence: number;
	attributes: any;
	sources: string[];
	createdAt: number;
	updatedAt: number;
}

/**
 * Conversation history
 */
export interface Conversation {
	id?: number;
	startedAt: number;
	endedAt?: number;
	title: string;
	filePath: string; // Path to the markdown file
	messageCount: number;
	topics: string[];
}

/**
 * Individual messages in conversations
 */
export interface Message {
	id?: number;
	conversationId: number;
	role: 'user' | 'assistant';
	content: string;
	timestamp: number;
}

/**
 * Main database class
 */
export class GenerousAIDatabase extends Dexie {
	// Tables
	syncRecords!: Table<SyncRecord>;
	cachedData!: Table<CachedData>;
	entities!: Table<Entity>;
	relationships!: Table<Relationship>;
	conversations!: Table<Conversation>;
	messages!: Table<Message>;

	constructor() {
		super('GenerousAI');

		// Define schema
		this.version(1).stores({
			syncRecords: '++id, source, lastSync, status',
			cachedData: '++id, source, dataType, externalId, lastUpdated',
			entities: '++id, type, name, confidence, createdAt',
			relationships: '++id, fromEntityId, toEntityId, type, confidence',
			conversations: '++id, startedAt, endedAt',
			messages: '++id, conversationId, timestamp, role',
		});
	}

	/**
	 * Get sync state for a data source
	 */
	async getSyncState(source: 'google' | 'spotify' | 'ynab'): Promise<SyncRecord | undefined> {
		return await this.syncRecords.where('source').equals(source).first();
	}

	/**
	 * Update sync state for a data source
	 */
	async updateSyncState(
		source: 'google' | 'spotify' | 'ynab',
		state: Partial<SyncRecord>
	): Promise<void> {
		const existing = await this.getSyncState(source);

		if (existing) {
			await this.syncRecords.update(existing.id!, state);
		} else {
			await this.syncRecords.add({
				source,
				lastSync: 0,
				nextSync: 0,
				status: 'idle',
				...state,
			});
		}
	}

	/**
	 * Cache data from external source
	 */
	async cacheData(
		source: string,
		dataType: string,
		externalId: string,
		data: any,
		metadata?: any
	): Promise<void> {
		const existing = await this.cachedData
			.where('[source+dataType+externalId]')
			.equals([source, dataType, externalId])
			.first();

		const record: CachedData = {
			source,
			dataType,
			externalId,
			data,
			lastUpdated: Date.now(),
			metadata,
		};

		if (existing) {
			await this.cachedData.update(existing.id!, record);
		} else {
			await this.cachedData.add(record);
		}
	}

	/**
	 * Get cached data by source and type
	 */
	async getCachedData(
		source: string,
		dataType: string,
		limit?: number
	): Promise<CachedData[]> {
		let query = this.cachedData
			.where('[source+dataType]')
			.equals([source, dataType])
			.reverse();

		if (limit) {
			query = query.limit(limit);
		}

		return await query.toArray();
	}

	/**
	 * Add or update an entity
	 */
	async upsertEntity(entity: Omit<Entity, 'id'>): Promise<number> {
		const existing = await this.entities
			.where('[type+name]')
			.equals([entity.type, entity.name])
			.first();

		if (existing) {
			await this.entities.update(existing.id!, {
				...entity,
				updatedAt: Date.now(),
			});
			return existing.id!;
		} else {
			return (await this.entities.add({
				...entity,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			})) as number;
		}
	}

	/**
	 * Get entities by type
	 */
	async getEntitiesByType(type: Entity['type'], limit?: number): Promise<Entity[]> {
		let query = this.entities.where('type').equals(type);

		if (limit) {
			query = query.limit(limit);
		}

		return await query.toArray();
	}

	/**
	 * Add a relationship between entities
	 */
	async addRelationship(relationship: Omit<Relationship, 'id'>): Promise<number> {
		return (await this.relationships.add({
			...relationship,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		})) as number;
	}

	/**
	 * Get relationships for an entity
	 */
	async getEntityRelationships(entityId: number): Promise<Relationship[]> {
		const outgoing = await this.relationships
			.where('fromEntityId')
			.equals(entityId)
			.toArray();

		const incoming = await this.relationships
			.where('toEntityId')
			.equals(entityId)
			.toArray();

		return [...outgoing, ...incoming];
	}

	/**
	 * Create a new conversation
	 */
	async createConversation(title: string, filePath: string): Promise<number> {
		return (await this.conversations.add({
			startedAt: Date.now(),
			title,
			filePath,
			messageCount: 0,
			topics: [],
		})) as number;
	}

	/**
	 * Add a message to a conversation
	 */
	async addMessage(
		conversationId: number,
		role: 'user' | 'assistant',
		content: string
	): Promise<void> {
		await this.messages.add({
			conversationId,
			role,
			content,
			timestamp: Date.now(),
		});

		// Update message count
		const conversation = await this.conversations.get(conversationId);
		if (conversation) {
			await this.conversations.update(conversationId, {
				messageCount: conversation.messageCount + 1,
				endedAt: Date.now(),
			});
		}
	}

	/**
	 * Get messages for a conversation
	 */
	async getConversationMessages(conversationId: number): Promise<Message[]> {
		return await this.messages
			.where('conversationId')
			.equals(conversationId)
			.sortBy('timestamp');
	}

	/**
	 * Get recent conversations
	 */
	async getRecentConversations(limit: number = 10): Promise<Conversation[]> {
		return await this.conversations.orderBy('startedAt').reverse().limit(limit).toArray();
	}
}

// Export singleton instance
export const db = new GenerousAIDatabase();
