/**
 * Settings tab for Generous AI plugin
 */

import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import GenerousAIPlugin from './main';
import { generateSalt, hashPassword, verifyPassword } from './crypto';

export class GenerousAISettingTab extends PluginSettingTab {
	plugin: GenerousAIPlugin;
	private masterPasswordUnlocked = false;

	constructor(app: App, plugin: GenerousAIPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		// Header
		containerEl.createEl('h1', { text: 'Generous AI Settings' });
		containerEl.createEl('p', {
			text: 'Your personal AI assistant that learns about you and helps you live well.',
			cls: 'setting-item-description',
		});

		// Master Password Section
		this.displayMasterPasswordSection(containerEl);

		// Only show other settings if master password is set and unlocked
		if (this.plugin.settings.masterPasswordHash && this.masterPasswordUnlocked) {
			this.displayAIBackendSection(containerEl);
			this.displayDataIntegrationSection(containerEl);
			this.displayVirtueGuidanceSection(containerEl);
			this.displayVaultStructureSection(containerEl);
			this.displaySyncSection(containerEl);
		} else if (this.plugin.settings.masterPasswordHash && !this.masterPasswordUnlocked) {
			containerEl.createEl('p', {
				text: 'Please unlock with your master password to access additional settings.',
				cls: 'mod-warning',
			});
		}
	}

	private displayMasterPasswordSection(containerEl: HTMLElement): void {
		containerEl.createEl('h2', { text: 'Security' });

		if (!this.plugin.settings.masterPasswordHash) {
			// Master password not set - show creation form
			containerEl.createEl('p', {
				text: 'Create a master password to encrypt your data. This password cannot be recovered if lost - write it down in a safe place.',
				cls: 'mod-warning',
			});

			let password1 = '';
			let password2 = '';

			new Setting(containerEl)
				.setName('Master password')
				.setDesc('Choose a strong password (minimum 12 characters)')
				.addText((text) =>
					text
						.setPlaceholder('Enter password')
						.setValue('')
						.onChange((value) => {
							password1 = value;
						})
				)
				.then((setting) => {
					// Make it a password field
					const inputEl = setting.controlEl.querySelector('input');
					if (inputEl) inputEl.type = 'password';
				});

			new Setting(containerEl)
				.setName('Confirm password')
				.setDesc('Re-enter your password')
				.addText((text) =>
					text
						.setPlaceholder('Confirm password')
						.setValue('')
						.onChange((value) => {
							password2 = value;
						})
				)
				.then((setting) => {
					const inputEl = setting.controlEl.querySelector('input');
					if (inputEl) inputEl.type = 'password';
				});

			new Setting(containerEl).addButton((button) =>
				button
					.setButtonText('Create Master Password')
					.setCta()
					.onClick(async () => {
						if (password1.length < 12) {
							new Notice('Password must be at least 12 characters');
							return;
						}
						if (password1 !== password2) {
							new Notice('Passwords do not match');
							return;
						}

						// Create password hash
						const salt = generateSalt();
						const hash = await hashPassword(password1, salt);

						// Save to settings
						this.plugin.settings.masterPasswordHash = hash;
						this.plugin.settings.masterPasswordSalt = this.arrayBufferToBase64(salt);
						await this.plugin.saveSettings();

						// Store in memory for this session
						this.plugin.setMasterPassword(password1);
						this.masterPasswordUnlocked = true;

						new Notice('Master password created successfully');
						this.display(); // Refresh display
					})
			);
		} else {
			// Master password exists - show unlock form
			if (!this.masterPasswordUnlocked) {
				containerEl.createEl('p', {
					text: 'Enter your master password to unlock encrypted settings.',
				});

				let passwordInput = '';

				new Setting(containerEl)
					.setName('Master password')
					.setDesc('Enter your master password')
					.addText((text) =>
						text
							.setPlaceholder('Password')
							.setValue('')
							.onChange((value) => {
								passwordInput = value;
							})
					)
					.then((setting) => {
						const inputEl = setting.controlEl.querySelector('input');
						if (inputEl) inputEl.type = 'password';
					})
					.addButton((button) =>
						button
							.setButtonText('Unlock')
							.setCta()
							.onClick(async () => {
								const isValid = await verifyPassword(
									passwordInput,
									this.plugin.settings.masterPasswordHash,
									this.plugin.settings.masterPasswordSalt
								);

								if (isValid) {
									this.plugin.setMasterPassword(passwordInput);
									this.masterPasswordUnlocked = true;
									new Notice('Settings unlocked');
									this.display(); // Refresh display
								} else {
									new Notice('Incorrect password');
								}
							})
					);
			} else {
				new Setting(containerEl)
					.setName('Master password')
					.setDesc('Master password is set and unlocked for this session')
					.addButton((button) =>
						button
							.setButtonText('Lock Settings')
							.onClick(() => {
								this.plugin.clearMasterPassword();
								this.masterPasswordUnlocked = false;
								new Notice('Settings locked');
								this.display();
							})
					);
			}
		}
	}

	private displayAIBackendSection(containerEl: HTMLElement): void {
		containerEl.createEl('h2', { text: 'AI Backend' });

		new Setting(containerEl)
			.setName('Preferred AI provider')
			.setDesc('Choose which AI service to use')
			.addDropdown((dropdown) =>
				dropdown
					.addOption('claude', 'Claude (Anthropic)')
					.addOption('openai', 'OpenAI')
					.setValue(this.plugin.settings.preferredAIProvider)
					.onChange(async (value) => {
						this.plugin.settings.preferredAIProvider = value as 'claude' | 'openai';
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Claude API Key')
			.setDesc('Your Anthropic API key (encrypted)')
			.addText((text) =>
				text
					.setPlaceholder('sk-ant-...')
					.setValue(this.plugin.settings.claudeApiKey ? '••••••••' : '')
					.onChange(async (value) => {
						if (value && value !== '••••••••') {
							await this.plugin.encryptAndSaveSetting('claudeApiKey', value);
						}
					})
			);

		new Setting(containerEl)
			.setName('OpenAI API Key')
			.setDesc('Your OpenAI API key (encrypted)')
			.addText((text) =>
				text
					.setPlaceholder('sk-...')
					.setValue(this.plugin.settings.openaiApiKey ? '••••••••' : '')
					.onChange(async (value) => {
						if (value && value !== '••••••••') {
							await this.plugin.encryptAndSaveSetting('openaiApiKey', value);
						}
					})
			);
	}

	private displayDataIntegrationSection(containerEl: HTMLElement): void {
		containerEl.createEl('h2', { text: 'Data Integration' });
		containerEl.createEl('p', {
			text: 'Connect your data sources to build your personal knowledge graph.',
		});

		new Setting(containerEl)
			.setName('Google Account')
			.setDesc('Connect Gmail, Calendar, and Drive')
			.addButton((button) =>
				button
					.setButtonText(this.plugin.settings.googleTokens ? 'Reconnect' : 'Connect')
					.onClick(async () => {
						new Notice('Google OAuth integration coming soon');
						// TODO: Implement OAuth flow
					})
			);

		new Setting(containerEl)
			.setName('Spotify')
			.setDesc('Sync your listening history')
			.addButton((button) =>
				button
					.setButtonText(this.plugin.settings.spotifyTokens ? 'Reconnect' : 'Connect')
					.onClick(async () => {
						new Notice('Spotify integration coming soon');
						// TODO: Implement OAuth flow
					})
			);

		new Setting(containerEl)
			.setName('YNAB (You Need A Budget)')
			.setDesc('Connect your budget data')
			.addButton((button) =>
				button
					.setButtonText(this.plugin.settings.ynabToken ? 'Reconnect' : 'Connect')
					.onClick(async () => {
						new Notice('YNAB integration coming soon');
						// TODO: Implement token entry
					})
			);
	}

	private displayVirtueGuidanceSection(containerEl: HTMLElement): void {
		containerEl.createEl('h2', { text: 'Gentle Guidance' });
		containerEl.createEl('p', {
			text: 'Let your assistant offer suggestions to help you live well. All suggestions are dismissable.',
		});

		new Setting(containerEl)
			.setName('Enable guidance')
			.setDesc('Allow your assistant to make gentle suggestions')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableVirtueGuidance)
					.onChange(async (value) => {
						this.plugin.settings.enableVirtueGuidance = value;
						await this.plugin.saveSettings();
						this.display(); // Refresh to show/hide tier setting
					})
			);

		if (this.plugin.settings.enableVirtueGuidance) {
			new Setting(containerEl)
				.setName('Guidance level')
				.setDesc(
					'Tier 1: Passive observation only\n' +
					'Tier 2: Reflective prompts\n' +
					'Tier 3: Gentle suggestions (1-2/day)\n' +
					'Tier 4: Accountability partner'
				)
				.addDropdown((dropdown) =>
					dropdown
						.addOption('1', 'Tier 1 - Passive')
						.addOption('2', 'Tier 2 - Reflective')
						.addOption('3', 'Tier 3 - Suggestive')
						.addOption('4', 'Tier 4 - Accountability')
						.setValue(String(this.plugin.settings.virtueGuidanceTier))
						.onChange(async (value) => {
							this.plugin.settings.virtueGuidanceTier = parseInt(value) as 1 | 2 | 3 | 4;
							await this.plugin.saveSettings();
						})
				);
		}
	}

	private displayVaultStructureSection(containerEl: HTMLElement): void {
		containerEl.createEl('h2', { text: 'Vault Structure' });

		new Setting(containerEl)
			.setName('System folder')
			.setDesc('Hidden folder for internal data (default: _assistant)')
			.addText((text) =>
				text
					.setValue(this.plugin.settings.systemFolderPath)
					.onChange(async (value) => {
						this.plugin.settings.systemFolderPath = value || '_assistant';
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('User folder')
			.setDesc('Visible folder for your assistant content (default: Assistant)')
			.addText((text) =>
				text
					.setValue(this.plugin.settings.userFolderPath)
					.onChange(async (value) => {
						this.plugin.settings.userFolderPath = value || 'Assistant';
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Sidebar position')
			.setDesc('Where to show the assistant sidebar')
			.addDropdown((dropdown) =>
				dropdown
					.addOption('left', 'Left')
					.addOption('right', 'Right')
					.setValue(this.plugin.settings.sidebarPosition)
					.onChange(async (value) => {
						this.plugin.settings.sidebarPosition = value as 'left' | 'right';
						await this.plugin.saveSettings();
					})
			);
	}

	private displaySyncSection(containerEl: HTMLElement): void {
		containerEl.createEl('h2', { text: 'Sync Settings' });

		new Setting(containerEl)
			.setName('Sync interval')
			.setDesc('How often to sync with data sources (minutes)')
			.addText((text) =>
				text
					.setValue(String(this.plugin.settings.syncIntervalMinutes))
					.onChange(async (value) => {
						const interval = parseInt(value);
						if (!isNaN(interval) && interval > 0) {
							this.plugin.settings.syncIntervalMinutes = interval;
							await this.plugin.saveSettings();
						}
					})
			);

		new Setting(containerEl)
			.setName('Show status bar')
			.setDesc('Display sync status in the status bar')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showStatusBar)
					.onChange(async (value) => {
						this.plugin.settings.showStatusBar = value;
						await this.plugin.saveSettings();
						this.plugin.updateStatusBar();
					})
			);

		if (this.plugin.settings.lastSyncTimestamp > 0) {
			const lastSync = new Date(this.plugin.settings.lastSyncTimestamp);
			containerEl.createEl('p', {
				text: `Last sync: ${lastSync.toLocaleString()}`,
				cls: 'setting-item-description',
			});
		}
	}

	private arrayBufferToBase64(buffer: Uint8Array): string {
		let binary = '';
		for (let i = 0; i < buffer.byteLength; i++) {
			binary += String.fromCharCode(buffer[i]);
		}
		return btoa(binary);
	}
}
