/**
 * OAuth helper utilities
 * Supports both desktop (localhost server) and mobile (manual token entry)
 */

import { Notice, Platform } from 'obsidian';
import { OAuthConfig, OAuthTokens } from './types';

/**
 * Start OAuth flow
 * Desktop: Opens browser and starts localhost server
 * Mobile: Returns authorization URL for manual flow
 */
export async function startOAuthFlow(
	config: OAuthConfig
): Promise<OAuthTokens | string> {
	if (Platform.isDesktopApp) {
		return await startDesktopOAuthFlow(config);
	} else {
		return getAuthorizationUrl(config);
	}
}

/**
 * Desktop OAuth flow using localhost callback server
 */
async function startDesktopOAuthFlow(config: OAuthConfig): Promise<OAuthTokens> {
	// This would require a localhost HTTP server
	// For Phase B, we'll implement a simplified version
	// that opens the browser and asks user to paste the callback URL

	const authUrl = getAuthorizationUrl(config);

	// Open browser
	window.open(authUrl, '_blank');

	new Notice(
		'Please authorize in your browser, then paste the callback URL when prompted'
	);

	// For now, we'll throw an error indicating this needs implementation
	// In a real implementation, we would:
	// 1. Start a localhost server on a random port
	// 2. Update redirect URI to http://localhost:PORT
	// 3. Wait for the callback
	// 4. Extract the code and exchange for tokens
	// 5. Shut down the server

	throw new Error(
		'Desktop OAuth flow requires localhost server - use manual token entry for now'
	);
}

/**
 * Generate authorization URL
 */
function getAuthorizationUrl(config: OAuthConfig): string {
	const params = new URLSearchParams({
		client_id: config.clientId,
		redirect_uri: config.redirectUri,
		response_type: 'code',
		scope: config.scopes.join(' '),
		access_type: 'offline', // Request refresh token
		prompt: 'consent', // Force consent screen to get refresh token
	});

	return `${config.authUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
	code: string,
	config: OAuthConfig
): Promise<OAuthTokens> {
	const params = new URLSearchParams({
		code,
		client_id: config.clientId,
		redirect_uri: config.redirectUri,
		grant_type: 'authorization_code',
	});

	if (config.clientSecret) {
		params.set('client_secret', config.clientSecret);
	}

	const response = await fetch(config.tokenUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: params.toString(),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Token exchange failed: ${errorText}`);
	}

	const tokens: OAuthTokens = await response.json();

	// Calculate expires_at
	if (tokens.expires_in) {
		tokens.expires_at = Date.now() + tokens.expires_in * 1000;
	}

	return tokens;
}

/**
 * Refresh OAuth tokens
 */
export async function refreshOAuthTokens(
	refreshToken: string,
	config: OAuthConfig
): Promise<OAuthTokens> {
	const params = new URLSearchParams({
		refresh_token: refreshToken,
		client_id: config.clientId,
		grant_type: 'refresh_token',
	});

	if (config.clientSecret) {
		params.set('client_secret', config.clientSecret);
	}

	const response = await fetch(config.tokenUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: params.toString(),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Token refresh failed: ${errorText}`);
	}

	const tokens: OAuthTokens = await response.json();

	// Some providers don't return a new refresh token
	if (!tokens.refresh_token) {
		tokens.refresh_token = refreshToken;
	}

	// Calculate expires_at
	if (tokens.expires_in) {
		tokens.expires_at = Date.now() + tokens.expires_in * 1000;
	}

	return tokens;
}

/**
 * Validate tokens by making a test request
 */
export async function validateTokens(
	tokens: OAuthTokens,
	testUrl: string
): Promise<boolean> {
	try {
		const response = await fetch(testUrl, {
			headers: {
				Authorization: `Bearer ${tokens.access_token}`,
			},
		});

		return response.ok;
	} catch (error) {
		return false;
	}
}

/**
 * Parse callback URL to extract authorization code
 */
export function parseCallbackUrl(callbackUrl: string): string {
	const url = new URL(callbackUrl);
	const code = url.searchParams.get('code');

	if (!code) {
		const error = url.searchParams.get('error');
		const errorDesc = url.searchParams.get('error_description');
		throw new Error(
			`OAuth error: ${error || 'unknown'} - ${errorDesc || 'no description'}`
		);
	}

	return code;
}
