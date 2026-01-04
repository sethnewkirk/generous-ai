/**
 * YNAB (You Need A Budget) service integration
 * Uses API token authentication (not OAuth)
 */

import { BaseSyncService } from './base-service';
import { SyncResult, FetchedDataItem, OAuthTokens } from './types';

/**
 * YNAB transaction
 */
interface YNABTransaction {
	id: string;
	date: string;
	amount: number;
	memo: string | null;
	cleared: string;
	approved: boolean;
	payee_id: string | null;
	payee_name: string | null;
	category_id: string | null;
	category_name: string | null;
	account_id: string;
	account_name: string;
}

/**
 * YNAB budget
 */
interface YNABBudget {
	id: string;
	name: string;
	last_modified_on: string;
	first_month: string;
	last_month: string;
	currency_format: {
		iso_code: string;
		example_format: string;
	};
}

/**
 * YNAB service
 * Note: YNAB uses API tokens, not OAuth
 */
export class YNABService extends BaseSyncService {
	private apiToken: string;
	private budgetId: string | null = null;

	constructor(apiToken: string) {
		super('ynab');
		this.apiToken = apiToken;

		// YNAB uses API tokens, not OAuth, but we store it in the same format
		this.setTokens({
			access_token: apiToken,
			token_type: 'Bearer',
		});
	}

	/**
	 * Set the budget ID to sync
	 */
	setBudgetId(budgetId: string): void {
		this.budgetId = budgetId;
	}

	/**
	 * YNAB tokens don't expire, so refresh is not needed
	 */
	protected async refreshTokens(): Promise<void> {
		// No refresh needed for API tokens
		return;
	}

	/**
	 * Check if authenticated
	 */
	isAuthenticated(): boolean {
		return this.apiToken !== null && this.apiToken.length > 0;
	}

	/**
	 * Perform sync for YNAB data
	 */
	protected async performSync(): Promise<Partial<SyncResult>> {
		const result: Partial<SyncResult> = {
			itemsProcessed: 0,
			itemsAdded: 0,
			itemsUpdated: 0,
		};

		// Get budget ID if not set
		if (!this.budgetId) {
			await this.fetchAndSetDefaultBudget();
		}

		if (!this.budgetId) {
			throw new Error('No budget available');
		}

		// Sync transactions
		const transactions = await this.syncTransactions();
		result.itemsProcessed! += transactions.length;
		result.itemsAdded! += transactions.length;

		return result;
	}

	/**
	 * Fetch data from YNAB
	 */
	protected async fetchData(since?: number): Promise<FetchedDataItem[]> {
		if (!this.budgetId) {
			await this.fetchAndSetDefaultBudget();
		}

		return await this.syncTransactions(since);
	}

	/**
	 * Fetch budgets and set the default (first) one
	 */
	private async fetchAndSetDefaultBudget(): Promise<void> {
		const response = await this.makeYNABRequest(
			'https://api.ynab.com/v1/budgets'
		);
		const data = await response.json();

		if (data.data?.budgets && data.data.budgets.length > 0) {
			const budget = data.data.budgets[0] as YNABBudget;
			this.budgetId = budget.id;
		}
	}

	/**
	 * Sync transactions from YNAB
	 */
	private async syncTransactions(since?: number): Promise<FetchedDataItem[]> {
		if (!this.budgetId) {
			throw new Error('No budget ID set');
		}

		const items: FetchedDataItem[] = [];

		// Build URL with optional since date
		let url = `https://api.ynab.com/v1/budgets/${this.budgetId}/transactions`;

		if (since) {
			const sinceDate = new Date(since).toISOString().split('T')[0];
			url += `?since_date=${sinceDate}`;
		}

		const response = await this.makeYNABRequest(url);
		const data = await response.json();

		if (!data.data?.transactions || data.data.transactions.length === 0) {
			return items;
		}

		for (const transaction of data.data.transactions as YNABTransaction[]) {
			const date = new Date(transaction.date).getTime();

			items.push({
				id: transaction.id,
				type: 'transaction',
				source: 'ynab',
				data: {
					id: transaction.id,
					date: transaction.date,
					amount: transaction.amount / 1000, // YNAB stores in milliunits
					memo: transaction.memo,
					cleared: transaction.cleared,
					approved: transaction.approved,
					payeeName: transaction.payee_name,
					categoryName: transaction.category_name,
					accountName: transaction.account_name,
				},
				timestamp: date,
			});

			// Cache the item
			await this.cacheData([items[items.length - 1]]);
		}

		return items;
	}

	/**
	 * Make authenticated request to YNAB API
	 */
	private async makeYNABRequest(url: string): Promise<Response> {
		const response = await fetch(url, {
			headers: {
				Authorization: `Bearer ${this.apiToken}`,
			},
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`YNAB API request failed (${response.status}): ${errorText}`
			);
		}

		return response;
	}

	/**
	 * Get available budgets
	 */
	async getBudgets(): Promise<YNABBudget[]> {
		const response = await this.makeYNABRequest(
			'https://api.ynab.com/v1/budgets'
		);
		const data = await response.json();

		return data.data?.budgets || [];
	}
}
