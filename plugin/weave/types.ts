/**
 * The Weave: Knowledge Graph Types
 * Types for entities, relationships, and graph operations
 */

/**
 * Entity types in The Weave
 */
export type EntityType =
	| 'person'
	| 'organization'
	| 'place'
	| 'event'
	| 'project'
	| 'theme'
	| 'value'
	| 'goal'
	| 'skill'
	| 'role'
	| 'habit'
	| 'interest'
	| 'product'
	| 'book'
	| 'music';

/**
 * Relationship types in The Weave
 */
export type RelationshipType =
	// Interpersonal
	| 'KNOWS'
	| 'FAMILY_OF'
	| 'FRIEND_OF'
	| 'WORKS_WITH'
	| 'REPORTS_TO'
	| 'MENTORS'
	// Temporal
	| 'DURING'
	| 'PRECEDED_BY'
	| 'FOLLOWED_BY'
	| 'RECURRING_DURING'
	// Affective
	| 'FEELS_TOWARD'
	| 'VALUES'
	| 'INTERESTED_IN'
	| 'DISLIKES'
	| 'ASPIRES_TO'
	// Causal
	| 'CAUSED_BY'
	| 'LED_TO'
	| 'ENABLED'
	| 'BLOCKED'
	// Activity
	| 'ATTENDED'
	| 'CREATED'
	| 'PARTICIPATED_IN'
	| 'OWNS'
	| 'USES'
	| 'READS'
	| 'LISTENS_TO'
	// Organizational
	| 'MEMBER_OF'
	| 'WORKS_AT'
	| 'PART_OF'
	| 'LOCATED_AT';

/**
 * Confidence level for extracted information
 */
export enum ConfidenceLevel {
	LOW = 0.3,
	MEDIUM = 0.6,
	HIGH = 0.9,
}

/**
 * Entity in The Weave
 */
export interface WeaveEntity {
	id: number;
	type: EntityType;
	name: string;
	aliases?: string[];
	confidence: number;
	attributes: Record<string, any>;
	sources: EntitySource[];
	firstSeen: number;
	lastSeen: number;
	occurrenceCount: number;
	metadata?: Record<string, any>;
}

/**
 * Relationship in The Weave
 */
export interface WeaveRelationship {
	id: number;
	fromEntityId: number;
	toEntityId: number;
	type: RelationshipType;
	confidence: number;
	strength?: number; // 0-1, indicates how strong/important the relationship is
	attributes: Record<string, any>;
	sources: EntitySource[];
	firstSeen: number;
	lastSeen: number;
	temporal?: TemporalInfo;
}

/**
 * Source information for entities and relationships
 */
export interface EntitySource {
	dataSource: 'google' | 'spotify' | 'ynab' | 'manual' | 'inferred';
	dataType: string; // e.g., 'email', 'calendar_event', 'recently_played'
	dataId: string;
	extractedAt: number;
	context?: string;
}

/**
 * Temporal information for relationships
 */
export interface TemporalInfo {
	startDate?: number;
	endDate?: number;
	duration?: number;
	frequency?: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';
	pattern?: string;
}

/**
 * Pattern detected in The Weave
 */
export interface WeavePattern {
	id: number;
	type: 'routine' | 'trend' | 'cycle' | 'anomaly' | 'cluster';
	name: string;
	description: string;
	confidence: number;
	entities: number[]; // Entity IDs involved
	relationships: number[]; // Relationship IDs involved
	temporal?: TemporalInfo;
	significance: number; // How important/interesting this pattern is
	detectedAt: number;
	metadata?: Record<string, any>;
}

/**
 * Insight generated from The Weave
 */
export interface WeaveInsight {
	id: number;
	type: 'observation' | 'suggestion' | 'question' | 'warning';
	content: string;
	confidence: number;
	relevance: number; // How relevant/timely this insight is
	basedOn: {
		entities: number[];
		relationships: number[];
		patterns: number[];
	};
	createdAt: number;
	dismissed?: boolean;
	dismissedAt?: number;
	metadata?: Record<string, any>;
}

/**
 * Extraction result from LLM
 */
export interface ExtractionResult {
	entities: Array<{
		type: EntityType;
		name: string;
		aliases?: string[];
		attributes?: Record<string, any>;
		confidence: number;
	}>;
	relationships: Array<{
		from: string; // Entity name
		to: string; // Entity name
		type: RelationshipType;
		attributes?: Record<string, any>;
		confidence: number;
	}>;
	patterns?: Array<{
		type: string;
		description: string;
	}>;
}

/**
 * LLM extraction prompt context
 */
export interface ExtractionContext {
	dataSource: 'google' | 'spotify' | 'ynab';
	dataType: string;
	data: any;
	userName?: string; // User's own name for context
}
