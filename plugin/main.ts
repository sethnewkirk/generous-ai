/**
 * Generous AI - Main Plugin File
 * A personal AI assistant that learns about you and gently guides you toward living well
 */

import { Plugin, Notice, TFile, WorkspaceLeaf } from 'obsidian';
import { GenerousAISettings, DEFAULT_SETTINGS, EncryptedData } from './types';
import { GenerousAISettingTab } from './settings';
import { encrypt, decrypt, generateSalt } from './crypto';
import { GenerousAISidebarView, VIEW_TYPE_GENEROUS_AI } from './sidebar-view';
import { SyncManager } from './sync/sync-manager';

export default class GenerousAIPlugin extends Plugin {
	settings: GenerousAISettings;
	private masterPassword: string | null = null;
	private statusBarItem: HTMLElement | null = null;
	syncManager: SyncManager;

	async onload() {
		console.log('Loading Generous AI plugin');

		// Load settings
		await this.loadSettings();

		// Initialize sync manager
		this.syncManager = new SyncManager(this);

		// Register sidebar view
		this.registerView(
			VIEW_TYPE_GENEROUS_AI,
			(leaf) => new GenerousAISidebarView(leaf, this)
		);

		// Add settings tab
		this.addSettingTab(new GenerousAISettingTab(this.app, this));

		// Create status bar item
		if (this.settings.showStatusBar) {
			this.statusBarItem = this.addStatusBarItem();
			this.updateStatusBar();
		}

		// Create vault structure if it doesn't exist
		await this.ensureVaultStructure();

		// Register commands
		this.registerCommands();

		console.log('Generous AI plugin loaded');
	}

	onunload() {
		console.log('Unloading Generous AI plugin');

		// Close all sidebar views
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_GENEROUS_AI);

		// Cleanup sync manager
		if (this.syncManager) {
			this.syncManager.cleanup();
		}

		// Clear master password from memory
		this.clearMasterPassword();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	/**
	 * Set master password for this session (in memory only)
	 */
	async setMasterPassword(password: string) {
		this.masterPassword = password;

		// Initialize sync services now that we have the password
		await this.syncManager.initialize();

		// Start sync interval if configured
		if (this.settings.syncIntervalMinutes > 0) {
			this.syncManager.startSyncInterval();
		}
	}

	/**
	 * Clear master password from memory
	 */
	clearMasterPassword() {
		this.masterPassword = null;
	}

	/**
	 * Get master password (returns null if not set)
	 */
	getMasterPassword(): string | null {
		return this.masterPassword;
	}

	/**
	 * Encrypt and save a setting value
	 */
	async encryptAndSaveSetting(
		key: keyof GenerousAISettings,
		value: string
	): Promise<void> {
		if (!this.masterPassword) {
			new Notice('Master password not unlocked');
			throw new Error('Master password required for encryption');
		}

		const salt = generateSalt();
		const encrypted = await encrypt(value, this.masterPassword, salt);

		// Type assertion since we know these keys accept EncryptedData
		(this.settings as any)[key] = encrypted;
		await this.saveSettings();
	}

	/**
	 * Decrypt a setting value
	 */
	async decryptSetting(key: keyof GenerousAISettings): Promise<string | null> {
		if (!this.masterPassword) {
			new Notice('Master password not unlocked');
			return null;
		}

		const encrypted = (this.settings as any)[key] as EncryptedData | null;
		if (!encrypted) return null;

		try {
			return await decrypt(encrypted, this.masterPassword);
		} catch (error) {
			console.error('Decryption failed:', error);
			new Notice('Failed to decrypt setting - password may be incorrect');
			return null;
		}
	}

	/**
	 * Ensure vault folder structure exists
	 */
	async ensureVaultStructure(): Promise<void> {
		const folders = [
			this.settings.systemFolderPath,
			`${this.settings.systemFolderPath}/weave`,
			`${this.settings.systemFolderPath}/cache`,
			this.settings.userFolderPath,
			`${this.settings.userFolderPath}/Conversations`,
			`${this.settings.userFolderPath}/Modules`,
			`${this.settings.userFolderPath}/The Weave`,
		];

		for (const folder of folders) {
			const folderExists = this.app.vault.getAbstractFileByPath(folder);
			if (!folderExists) {
				try {
					await this.app.vault.createFolder(folder);
					console.log(`Created folder: ${folder}`);
				} catch (error) {
					// Folder might already exist
					console.log(`Folder may already exist: ${folder}`);
				}
			}
		}

		// Create initial dashboard file if it doesn't exist
		await this.ensureDashboard();
	}

	/**
	 * Create dashboard file if it doesn't exist
	 */
	async ensureDashboard(): Promise<void> {
		const dashboardPath = `${this.settings.userFolderPath}/Dashboard.md`;
		const existingDashboard = this.app.vault.getAbstractFileByPath(dashboardPath);

		if (!existingDashboard) {
			const dashboardContent = `# Generous AI Dashboard

Welcome to your personal assistant!

## Status

- Master Password: ${this.settings.masterPasswordHash ? '✓ Set' : '✗ Not Set'}
- Data Sources Connected: 0
- Last Sync: Never

## Quick Links

- [[The Weave/Overview|Your Life Map]]
- [[Conversations/|Past Conversations]]
- [[Modules/|Active Modules]]

## Today

*Your daily briefing will appear here*

---

*Generous AI is your faithful companion for living well*
`;

			await this.app.vault.create(dashboardPath, dashboardContent);
			console.log('Created dashboard file');
		}
	}

	/**
	 * Register plugin commands
	 */
	registerCommands(): void {
		// Command: Open Sidebar
		this.addCommand({
			id: 'open-sidebar',
			name: 'Open Sidebar',
			callback: () => {
				this.activateSidebar();
			},
		});

		// Command: Open Dashboard
		this.addCommand({
			id: 'open-dashboard',
			name: 'Open Dashboard',
			callback: () => {
				const dashboardPath = `${this.settings.userFolderPath}/Dashboard.md`;
				const dashboard = this.app.vault.getAbstractFileByPath(dashboardPath);
				if (dashboard instanceof TFile) {
					this.app.workspace.getLeaf().openFile(dashboard);
				}
			},
		});

		// Command: Start Conversation
		this.addCommand({
			id: 'start-conversation',
			name: 'Start Conversation',
			callback: () => {
				new Notice('Conversation feature coming soon');
				// TODO: Implement conversation interface
			},
		});

		// Command: Sync Now
		this.addCommand({
			id: 'sync-now',
			name: 'Sync Data Sources Now',
			callback: async () => {
				await this.syncDataSources();
			},
		});

		// Command: View The Weave
		this.addCommand({
			id: 'view-weave',
			name: 'View The Weave',
			callback: () => {
				const weavePath = `${this.settings.userFolderPath}/The Weave/Overview.md`;
				const weave = this.app.vault.getAbstractFileByPath(weavePath);
				if (weave instanceof TFile) {
					this.app.workspace.getLeaf().openFile(weave);
				} else {
					new Notice('The Weave has not been built yet');
				}
			},
		});
	}

	/**
	 * Update status bar display
	 */
	updateStatusBar(): void {
		if (!this.settings.showStatusBar) {
			if (this.statusBarItem) {
				this.statusBarItem.remove();
				this.statusBarItem = null;
			}
			return;
		}

		if (!this.statusBarItem) {
			this.statusBarItem = this.addStatusBarItem();
		}

		// Show sync status or ready status
		this.statusBarItem.setText('Generous AI: Ready');
	}

	/**
	 * Sync all connected data sources
	 */
	async syncDataSources(): Promise<void> {
		console.log('Starting data source sync...');

		if (this.statusBarItem) {
			this.statusBarItem.setText('Generous AI: Syncing...');
		}

		try {
			await this.syncManager.syncAll();
		} catch (error) {
			console.error('Sync failed:', error);
			new Notice('Sync failed - check console for details');
		} finally {
			this.updateStatusBar();
		}
	}

	/**
	 * Activate the sidebar view
	 */
	async activateSidebar(): Promise<void> {
		const { workspace } = this.app;

		// Check if sidebar already exists
		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_GENEROUS_AI);

		if (leaves.length > 0) {
			// Sidebar already exists, reveal it
			leaf = leaves[0];
		} else {
			// Create new sidebar
			const sidebarPosition = this.settings.sidebarPosition;
			leaf = sidebarPosition === 'left'
				? workspace.getLeftLeaf(false)
				: workspace.getRightLeaf(false);

			if (leaf) {
				await leaf.setViewState({
					type: VIEW_TYPE_GENEROUS_AI,
					active: true,
				});
			}
		}

		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}
}
