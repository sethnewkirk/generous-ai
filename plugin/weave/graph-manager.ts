/**
 * Graph Manager
 * Manages The Weave knowledge graph operations
 */

import { db } from '../database';
import {
	WeaveEntity,
	WeaveRelationship,
	EntityType,
	RelationshipType,
	EntitySource,
	ExtractionResult,
} from './types';

/**
 * The Weave Graph Manager
 */
export class GraphManager {
	/**
	 * Add or update an entity in the graph
	 */
	async upsertEntity(
		type: EntityType,
		name: string,
		attributes: Record<string, any>,
		source: EntitySource,
		confidence: number
	): Promise<number> {
		// Check if entity already exists (by type and name, case-insensitive)
		const existing = await this.findEntityByName(type, name);

		if (existing) {
			// Update existing entity
			const updatedAttributes = {
				...existing.attributes,
				...attributes,
			};

			const updatedSources = [...existing.sources];
			// Add source if not already present
			if (
				!updatedSources.some(
					(s) =>
						s.dataSource === source.dataSource &&
						s.dataType === source.dataType &&
						s.dataId === source.dataId
				)
			) {
				updatedSources.push(source);
			}

			await db.entities.update(existing.id!, {
				attributes: updatedAttributes,
				sources: updatedSources,
				lastSeen: Date.now(),
				occurrenceCount: existing.occurrenceCount + 1,
				// Update confidence if new confidence is higher
				confidence: Math.max(existing.confidence, confidence),
			});

			return existing.id!;
		} else {
			// Create new entity
			return (await db.entities.add({
				type,
				name: this.normalizeName(name),
				confidence,
				attributes,
				sources: [source],
				createdAt: Date.now(),
				updatedAt: Date.now(),
			})) as number;
		}
	}

	/**
	 * Add or update a relationship in the graph
	 */
	async upsertRelationship(
		fromEntityId: number,
		toEntityId: number,
		type: RelationshipType,
		attributes: Record<string, any>,
		source: EntitySource,
		confidence: number
	): Promise<number> {
		// Check if relationship already exists
		const existing = await this.findRelationship(fromEntityId, toEntityId, type);

		if (existing) {
			// Update existing relationship
			const updatedAttributes = {
				...existing.attributes,
				...attributes,
			};

			const updatedSources = [...existing.sources];
			if (
				!updatedSources.some(
					(s) =>
						s.dataSource === source.dataSource &&
						s.dataType === source.dataType &&
						s.dataId === source.dataId
				)
			) {
				updatedSources.push(source);
			}

			await db.relationships.update(existing.id!, {
				attributes: updatedAttributes,
				sources: updatedSources,
				updatedAt: Date.now(),
				confidence: Math.max(existing.confidence, confidence),
			});

			return existing.id!;
		} else {
			// Create new relationship
			return (await db.relationships.add({
				fromEntityId,
				toEntityId,
				type,
				confidence,
				attributes,
				sources: [source],
				createdAt: Date.now(),
				updatedAt: Date.now(),
			})) as number;
		}
	}

	/**
	 * Process extraction result and add to graph
	 */
	async processExtractionResult(
		result: ExtractionResult,
		source: EntitySource
	): Promise<{
		entitiesAdded: number;
		relationshipsAdded: number;
	}> {
		const entityMap = new Map<string, number>(); // name -> entity ID

		// First pass: Add all entities
		for (const entity of result.entities) {
			try {
				const entityId = await this.upsertEntity(
					entity.type,
					entity.name,
					entity.attributes || {},
					source,
					entity.confidence
				);

				entityMap.set(entity.name.toLowerCase(), entityId);

				// Also map aliases
				if (entity.aliases) {
					for (const alias of entity.aliases) {
						entityMap.set(alias.toLowerCase(), entityId);
					}
				}
			} catch (error) {
				console.error(`Failed to upsert entity ${entity.name}:`, error);
			}
		}

		// Second pass: Add all relationships
		let relationshipsAdded = 0;
		for (const rel of result.relationships) {
			try {
				const fromId = entityMap.get(rel.from.toLowerCase());
				const toId = entityMap.get(rel.to.toLowerCase());

				if (fromId && toId) {
					await this.upsertRelationship(
						fromId,
						toId,
						rel.type,
						rel.attributes || {},
						source,
						rel.confidence
					);
					relationshipsAdded++;
				} else {
					console.warn(
						`Could not find entities for relationship: ${rel.from} -> ${rel.to}`
					);
				}
			} catch (error) {
				console.error(`Failed to add relationship:`, error);
			}
		}

		return {
			entitiesAdded: entityMap.size,
			relationshipsAdded,
		};
	}

	/**
	 * Find entity by name (case-insensitive)
	 */
	private async findEntityByName(
		type: EntityType,
		name: string
	): Promise<any | undefined> {
		const normalizedName = this.normalizeName(name);

		const entities = await db.entities.where('type').equals(type).toArray();

		return entities.find(
			(e) =>
				this.normalizeName(e.name) === normalizedName ||
				e.aliases?.some((a: string) => this.normalizeName(a) === normalizedName)
		);
	}

	/**
	 * Find relationship between two entities
	 */
	private async findRelationship(
		fromId: number,
		toId: number,
		type: RelationshipType
	): Promise<any | undefined> {
		const relationships = await db.relationships
			.where('fromEntityId')
			.equals(fromId)
			.toArray();

		return relationships.find((r) => r.toEntityId === toId && r.type === type);
	}

	/**
	 * Normalize entity name for comparison
	 */
	private normalizeName(name: string): string {
		return name.trim().toLowerCase();
	}

	/**
	 * Get entity by ID
	 */
	async getEntity(id: number): Promise<any | undefined> {
		return await db.entities.get(id);
	}

	/**
	 * Get all entities of a type
	 */
	async getEntitiesByType(
		type: EntityType,
		limit?: number
	): Promise<any[]> {
		return await db.getEntitiesByType(type, limit);
	}

	/**
	 * Get relationships for an entity
	 */
	async getEntityRelationships(entityId: number): Promise<any[]> {
		return await db.getEntityRelationships(entityId);
	}

	/**
	 * Search entities by name
	 */
	async searchEntities(query: string, limit: number = 10): Promise<any[]> {
		const normalizedQuery = query.toLowerCase();

		const allEntities = await db.entities.toArray();

		const matches = allEntities.filter(
			(e) =>
				e.name.toLowerCase().includes(normalizedQuery) ||
				e.aliases?.some((a: string) => a.toLowerCase().includes(normalizedQuery))
		);

		return matches.slice(0, limit);
	}

	/**
	 * Get entity graph (entity + connected entities)
	 */
	async getEntityGraph(
		entityId: number,
		depth: number = 1
	): Promise<{
		entities: any[];
		relationships: any[];
	}> {
		const entities = new Map<number, any>();
		const relationships: any[] = [];
		const visited = new Set<number>();

		await this.traverseGraph(entityId, depth, entities, relationships, visited);

		return {
			entities: Array.from(entities.values()),
			relationships,
		};
	}

	/**
	 * Traverse graph recursively
	 */
	private async traverseGraph(
		entityId: number,
		depth: number,
		entities: Map<number, any>,
		relationships: any[],
		visited: Set<number>
	): Promise<void> {
		if (depth === 0 || visited.has(entityId)) {
			return;
		}

		visited.add(entityId);

		const entity = await this.getEntity(entityId);
		if (entity) {
			entities.set(entityId, entity);
		}

		const rels = await this.getEntityRelationships(entityId);

		for (const rel of rels) {
			relationships.push(rel);

			// Traverse connected entities
			const connectedId =
				rel.fromEntityId === entityId ? rel.toEntityId : rel.fromEntityId;

			if (!visited.has(connectedId)) {
				await this.traverseGraph(
					connectedId,
					depth - 1,
					entities,
					relationships,
					visited
				);
			}
		}
	}

	/**
	 * Get statistics about The Weave
	 */
	async getStatistics(): Promise<{
		totalEntities: number;
		totalRelationships: number;
		entitiesByType: Record<EntityType, number>;
		topEntities: Array<{ id: number; name: string; occurrenceCount: number }>;
	}> {
		const allEntities = await db.entities.toArray();
		const allRelationships = await db.relationships.toArray();

		const entitiesByType: any = {};
		for (const entity of allEntities) {
			entitiesByType[entity.type] = (entitiesByType[entity.type] || 0) + 1;
		}

		const topEntities = allEntities
			.sort((a, b) => (b.occurrenceCount || 0) - (a.occurrenceCount || 0))
			.slice(0, 10)
			.map((e) => ({
				id: e.id!,
				name: e.name,
				occurrenceCount: e.occurrenceCount || 0,
			}));

		return {
			totalEntities: allEntities.length,
			totalRelationships: allRelationships.length,
			entitiesByType,
			topEntities,
		};
	}

	/**
	 * Merge duplicate entities
	 */
	async mergeEntities(keepId: number, mergeId: number): Promise<void> {
		const keepEntity = await this.getEntity(keepId);
		const mergeEntity = await this.getEntity(mergeId);

		if (!keepEntity || !mergeEntity) {
			throw new Error('One or both entities not found');
		}

		// Merge attributes
		const mergedAttributes = {
			...mergeEntity.attributes,
			...keepEntity.attributes,
		};

		// Merge sources
		const mergedSources = [...keepEntity.sources, ...mergeEntity.sources];

		// Merge aliases
		const mergedAliases = [
			...(keepEntity.aliases || []),
			...(mergeEntity.aliases || []),
			mergeEntity.name,
		].filter((v, i, a) => a.indexOf(v) === i); // Deduplicate

		// Update keep entity
		await db.entities.update(keepId, {
			attributes: mergedAttributes,
			sources: mergedSources,
			aliases: mergedAliases,
			occurrenceCount:
				(keepEntity.occurrenceCount || 0) + (mergeEntity.occurrenceCount || 0),
		});

		// Update all relationships pointing to mergeEntity
		const relationships = await db.relationships.toArray();
		for (const rel of relationships) {
			if (rel.fromEntityId === mergeId) {
				await db.relationships.update(rel.id!, { fromEntityId: keepId });
			}
			if (rel.toEntityId === mergeId) {
				await db.relationships.update(rel.id!, { toEntityId: keepId });
			}
		}

		// Delete merged entity
		await db.entities.delete(mergeId);
	}
}
