/**
 * Core type definitions for Generous AI plugin
 */

/**
 * Plugin settings interface
 */
export interface GenerousAISettings {
	// Master password settings (never stored directly)
	masterPasswordHash: string;
	masterPasswordSalt: string;

	// Data integration settings
	googleTokens: EncryptedData | null;
	spotifyTokens: EncryptedData | null;
	ynabToken: EncryptedData | null;

	// AI backend settings
	claudeApiKey: EncryptedData | null;
	openaiApiKey: EncryptedData | null;
	preferredAIProvider: 'claude' | 'openai';

	// Feature toggles
	enableVirtueGuidance: boolean;
	virtueGuidanceTier: 1 | 2 | 3 | 4; // Tiers from implementation plan

	// Sync settings
	lastSyncTimestamp: number;
	syncIntervalMinutes: number;

	// Vault structure settings
	systemFolderPath: string; // Default: "_assistant"
	userFolderPath: string;   // Default: "Assistant"

	// UI preferences
	sidebarPosition: 'left' | 'right';
	showStatusBar: boolean;
}

/**
 * Encrypted data wrapper
 */
export interface EncryptedData {
	ciphertext: string;
	iv: string;
	salt: string;
}

/**
 * Data source connection status
 */
export interface DataSourceStatus {
	google: boolean;
	spotify: boolean;
	ynab: boolean;
	healthKit: boolean;
}

/**
 * Sync state for individual data sources
 */
export interface SyncState {
	google: {
		lastSync: number;
		nextSync: number;
		status: 'idle' | 'syncing' | 'error';
		errorMessage?: string;
	};
	spotify: {
		lastSync: number;
		nextSync: number;
		status: 'idle' | 'syncing' | 'error';
		errorMessage?: string;
	};
	ynab: {
		lastSync: number;
		nextSync: number;
		status: 'idle' | 'syncing' | 'error';
		errorMessage?: string;
	};
}

/**
 * Default settings
 */
export const DEFAULT_SETTINGS: GenerousAISettings = {
	masterPasswordHash: '',
	masterPasswordSalt: '',
	googleTokens: null,
	spotifyTokens: null,
	ynabToken: null,
	claudeApiKey: null,
	openaiApiKey: null,
	preferredAIProvider: 'claude',
	enableVirtueGuidance: false,
	virtueGuidanceTier: 1,
	lastSyncTimestamp: 0,
	syncIntervalMinutes: 60,
	systemFolderPath: '_assistant',
	userFolderPath: 'Assistant',
	sidebarPosition: 'right',
	showStatusBar: true,
};
