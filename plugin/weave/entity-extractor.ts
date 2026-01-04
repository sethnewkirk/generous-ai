/**
 * Entity Extractor
 * Uses LLM (Claude) to extract entities and relationships from synced data
 */

import { Notice } from 'obsidian';
import {
	EntityType,
	RelationshipType,
	ExtractionResult,
	ExtractionContext,
	ConfidenceLevel,
} from './types';

/**
 * Entity extraction service using Claude
 */
export class EntityExtractor {
	private apiKey: string;
	private model: string;

	constructor(apiKey: string, model: string = 'claude-haiku-3-5-20241022') {
		this.apiKey = apiKey;
		this.model = model;
	}

	/**
	 * Extract entities and relationships from data
	 */
	async extract(context: ExtractionContext): Promise<ExtractionResult> {
		const prompt = this.buildExtractionPrompt(context);

		try {
			const response = await this.callClaude(prompt);
			return this.parseExtractionResponse(response);
		} catch (error) {
			console.error('Entity extraction failed:', error);
			throw error;
		}
	}

	/**
	 * Build extraction prompt for Claude
	 */
	private buildExtractionPrompt(context: ExtractionContext): string {
		const { dataSource, dataType, data, userName } = context;

		let dataDescription = '';
		let specificInstructions = '';

		// Build data-specific prompts
		switch (dataSource) {
			case 'google':
				dataDescription = this.buildGooglePrompt(dataType, data);
				break;
			case 'spotify':
				dataDescription = this.buildSpotifyPrompt(dataType, data);
				break;
			case 'ynab':
				dataDescription = this.buildYNABPrompt(dataType, data);
				break;
		}

		return `You are an AI assistant extracting structured information from personal data to build a knowledge graph about someone's life.

${userName ? `User's name: ${userName}` : 'User name unknown'}

Extract entities and relationships from the following data:

${dataDescription}

Extract:
1. **Entities**: People, organizations, places, events, projects, themes, values, goals, interests, etc.
2. **Relationships**: How entities relate to each other

Return ONLY a JSON object with this structure:
{
  "entities": [
    {
      "type": "person|organization|place|event|project|theme|value|goal|skill|role|habit|interest|product|book|music",
      "name": "Entity name",
      "aliases": ["Optional alternate names"],
      "attributes": {"key": "value"},
      "confidence": 0.0-1.0
    }
  ],
  "relationships": [
    {
      "from": "Entity name 1",
      "to": "Entity name 2",
      "type": "RELATIONSHIP_TYPE",
      "attributes": {"key": "value"},
      "confidence": 0.0-1.0
    }
  ]
}

${specificInstructions}

Important:
- Use HIGH confidence (0.8-1.0) for explicitly stated facts
- Use MEDIUM confidence (0.5-0.7) for reasonable inferences
- Use LOW confidence (0.3-0.4) for uncertain guesses
- Only extract meaningful, non-trivial entities
- Focus on entities that reveal something about the user's life, relationships, or interests

Return ONLY the JSON object, no explanation.`;
	}

	/**
	 * Build prompt for Google data
	 */
	private buildGooglePrompt(dataType: string, data: any): string {
		if (dataType === 'email') {
			return `Email:
From: ${data.from}
To: ${data.to}
Subject: ${data.subject}
Date: ${data.date}
Snippet: ${data.snippet}`;
		} else if (dataType === 'calendar_event') {
			const attendees = data.attendees
				? data.attendees.map((a: any) => a.email || a.displayName).join(', ')
				: 'None';
			return `Calendar Event:
Summary: ${data.summary}
Description: ${data.description || 'None'}
Start: ${data.start}
End: ${data.end}
Attendees: ${attendees}
Organizer: ${data.organizer?.email || 'Unknown'}`;
		} else if (dataType === 'drive_file') {
			return `Google Drive File:
Name: ${data.name}
Type: ${data.mimeType}
Modified: ${data.modifiedTime}
Owners: ${data.owners?.map((o: any) => o.displayName || o.emailAddress).join(', ')}`;
		}
		return JSON.stringify(data);
	}

	/**
	 * Build prompt for Spotify data
	 */
	private buildSpotifyPrompt(dataType: string, data: any): string {
		if (dataType === 'recently_played') {
			return `Recently Played Track:
Track: ${data.trackName}
Artists: ${data.artists.join(', ')}
Album: ${data.album}
Played At: ${data.playedAt}
Context: ${data.context?.type || 'Unknown'}`;
		} else if (dataType === 'top_track') {
			return `Top Track (${data.timeRange}):
Track: ${data.trackName}
Artists: ${data.artists.join(', ')}
Album: ${data.album}`;
		} else if (dataType === 'saved_track') {
			return `Saved Track:
Track: ${data.trackName}
Artists: ${data.artists.join(', ')}
Album: ${data.album}
Added: ${data.addedAt}`;
		}
		return JSON.stringify(data);
	}

	/**
	 * Build prompt for YNAB data
	 */
	private buildYNABPrompt(dataType: string, data: any): string {
		if (dataType === 'transaction') {
			return `Budget Transaction:
Date: ${data.date}
Amount: $${data.amount.toFixed(2)}
Payee: ${data.payeeName || 'Unknown'}
Category: ${data.categoryName || 'Uncategorized'}
Account: ${data.accountName}
Memo: ${data.memo || 'None'}`;
		}
		return JSON.stringify(data);
	}

	/**
	 * Call Claude API
	 */
	private async callClaude(prompt: string): Promise<string> {
		const response = await fetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': this.apiKey,
				'anthropic-version': '2023-06-01',
			},
			body: JSON.stringify({
				model: this.model,
				max_tokens: 2048,
				messages: [
					{
						role: 'user',
						content: prompt,
					},
				],
			}),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Claude API error: ${error}`);
		}

		const data = await response.json();
		return data.content[0].text;
	}

	/**
	 * Parse Claude's response into extraction result
	 */
	private parseExtractionResponse(response: string): ExtractionResult {
		try {
			// Try to extract JSON from response (in case Claude adds explanation)
			const jsonMatch = response.match(/\{[\s\S]*\}/);
			if (!jsonMatch) {
				throw new Error('No JSON found in response');
			}

			const parsed = JSON.parse(jsonMatch[0]);

			// Validate and normalize the response
			return {
				entities: (parsed.entities || []).map((e: any) => ({
					type: e.type as EntityType,
					name: e.name,
					aliases: e.aliases || [],
					attributes: e.attributes || {},
					confidence: Math.max(0, Math.min(1, e.confidence || 0.5)),
				})),
				relationships: (parsed.relationships || []).map((r: any) => ({
					from: r.from,
					to: r.to,
					type: r.type as RelationshipType,
					attributes: r.attributes || {},
					confidence: Math.max(0, Math.min(1, r.confidence || 0.5)),
				})),
				patterns: parsed.patterns || [],
			};
		} catch (error) {
			console.error('Failed to parse extraction response:', error);
			console.error('Response:', response);
			return {
				entities: [],
				relationships: [],
			};
		}
	}

	/**
	 * Batch extract from multiple data items
	 */
	async extractBatch(
		contexts: ExtractionContext[],
		progressCallback?: (progress: number, total: number) => void
	): Promise<ExtractionResult[]> {
		const results: ExtractionResult[] = [];

		for (let i = 0; i < contexts.length; i++) {
			try {
				const result = await this.extract(contexts[i]);
				results.push(result);

				if (progressCallback) {
					progressCallback(i + 1, contexts.length);
				}

				// Small delay to avoid rate limiting
				await new Promise((resolve) => setTimeout(resolve, 500));
			} catch (error) {
				console.error(`Failed to extract from item ${i}:`, error);
				results.push({ entities: [], relationships: [] });
			}
		}

		return results;
	}
}
