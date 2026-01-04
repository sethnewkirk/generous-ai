/**
 * Sidebar view for chat interface
 */

import { ItemView, WorkspaceLeaf } from 'obsidian';
import GenerousAIPlugin from './main';

export const VIEW_TYPE_GENEROUS_AI = 'generous-ai-sidebar';

export class GenerousAISidebarView extends ItemView {
	plugin: GenerousAIPlugin;

	constructor(leaf: WorkspaceLeaf, plugin: GenerousAIPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return VIEW_TYPE_GENEROUS_AI;
	}

	getDisplayText(): string {
		return 'Generous AI';
	}

	getIcon(): string {
		return 'bot';
	}

	async onOpen(): Promise<void> {
		const container = this.containerEl.children[1];
		container.empty();
		container.addClass('generous-ai-sidebar');

		// Header
		const header = container.createDiv({ cls: 'generous-ai-header' });
		header.createEl('h3', { text: 'Generous AI' });
		header.createEl('p', {
			text: 'Your personal assistant',
			cls: 'generous-ai-subtitle',
		});

		// Status section
		const statusSection = container.createDiv({ cls: 'generous-ai-status' });
		this.renderStatus(statusSection);

		// Chat container (placeholder for now)
		const chatContainer = container.createDiv({ cls: 'generous-ai-chat' });
		chatContainer.createEl('p', {
			text: 'Chat interface coming soon...',
			cls: 'generous-ai-placeholder',
		});

		// Input section (placeholder)
		const inputSection = container.createDiv({ cls: 'generous-ai-input-section' });
		const input = inputSection.createEl('textarea', {
			cls: 'generous-ai-input',
			attr: {
				placeholder: 'Type a message... (coming soon)',
				disabled: 'true',
			},
		});

		const sendButton = inputSection.createEl('button', {
			text: 'Send',
			cls: 'generous-ai-send-button',
			attr: { disabled: 'true' },
		});

		// Add basic styles
		this.addStyles();
	}

	async onClose(): Promise<void> {
		// Cleanup
	}

	/**
	 * Render status information
	 */
	private renderStatus(container: HTMLElement): void {
		container.empty();

		const statusList = container.createEl('ul', { cls: 'generous-ai-status-list' });

		// Master password status
		const passwordStatus = this.plugin.settings.masterPasswordHash
			? '✓ Set'
			: '✗ Not Set';
		statusList.createEl('li', { text: `Master Password: ${passwordStatus}` });

		// Data sources
		let connectedSources = 0;
		if (this.plugin.settings.googleTokens) connectedSources++;
		if (this.plugin.settings.spotifyTokens) connectedSources++;
		if (this.plugin.settings.ynabToken) connectedSources++;

		statusList.createEl('li', { text: `Connected Sources: ${connectedSources}` });

		// Last sync
		const lastSync = this.plugin.settings.lastSyncTimestamp
			? new Date(this.plugin.settings.lastSyncTimestamp).toLocaleString()
			: 'Never';
		statusList.createEl('li', { text: `Last Sync: ${lastSync}` });

		// Guidance status
		const guidanceStatus = this.plugin.settings.enableVirtueGuidance
			? `✓ Enabled (Tier ${this.plugin.settings.virtueGuidanceTier})`
			: '✗ Disabled';
		statusList.createEl('li', { text: `Guidance: ${guidanceStatus}` });
	}

	/**
	 * Add basic CSS styles
	 */
	private addStyles(): void {
		// Check if styles are already added
		if (document.getElementById('generous-ai-styles')) return;

		const style = document.createElement('style');
		style.id = 'generous-ai-styles';
		style.textContent = `
			.generous-ai-sidebar {
				padding: 1em;
				display: flex;
				flex-direction: column;
				height: 100%;
			}

			.generous-ai-header {
				margin-bottom: 1em;
				padding-bottom: 0.5em;
				border-bottom: 1px solid var(--background-modifier-border);
			}

			.generous-ai-header h3 {
				margin: 0 0 0.25em 0;
				font-size: 1.5em;
			}

			.generous-ai-subtitle {
				margin: 0;
				color: var(--text-muted);
				font-size: 0.9em;
			}

			.generous-ai-status {
				margin-bottom: 1em;
				padding: 0.75em;
				background: var(--background-secondary);
				border-radius: 4px;
			}

			.generous-ai-status-list {
				list-style: none;
				padding: 0;
				margin: 0;
			}

			.generous-ai-status-list li {
				padding: 0.25em 0;
				font-size: 0.9em;
			}

			.generous-ai-chat {
				flex: 1;
				overflow-y: auto;
				margin-bottom: 1em;
				padding: 1em;
				background: var(--background-primary);
				border-radius: 4px;
				border: 1px solid var(--background-modifier-border);
			}

			.generous-ai-placeholder {
				color: var(--text-muted);
				text-align: center;
				margin-top: 2em;
			}

			.generous-ai-input-section {
				display: flex;
				flex-direction: column;
				gap: 0.5em;
			}

			.generous-ai-input {
				min-height: 80px;
				padding: 0.5em;
				border: 1px solid var(--background-modifier-border);
				border-radius: 4px;
				background: var(--background-primary);
				color: var(--text-normal);
				resize: vertical;
				font-family: var(--font-text);
			}

			.generous-ai-send-button {
				align-self: flex-end;
				padding: 0.5em 1.5em;
				background: var(--interactive-accent);
				color: var(--text-on-accent);
				border: none;
				border-radius: 4px;
				cursor: pointer;
			}

			.generous-ai-send-button:hover:not(:disabled) {
				background: var(--interactive-accent-hover);
			}

			.generous-ai-send-button:disabled {
				opacity: 0.5;
				cursor: not-allowed;
			}
		`;

		document.head.appendChild(style);
	}

	/**
	 * Refresh the view
	 */
	refresh(): void {
		const statusContainer = this.containerEl.querySelector('.generous-ai-status');
		if (statusContainer instanceof HTMLElement) {
			this.renderStatus(statusContainer);
		}
	}
}
