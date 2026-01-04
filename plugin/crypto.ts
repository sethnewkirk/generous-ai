/**
 * Cryptographic utilities for Generous AI
 * Uses Web Crypto API with Argon2id-like key derivation
 */

import { EncryptedData } from './types';

/**
 * Derives an encryption key from a master password using PBKDF2
 * In production, consider using Argon2id via WASM
 */
export async function deriveKey(
	password: string,
	salt: Uint8Array
): Promise<CryptoKey> {
	const encoder = new TextEncoder();
	const passwordData = encoder.encode(password);

	// Import password as key material
	const keyMaterial = await crypto.subtle.importKey(
		'raw',
		passwordData,
		'PBKDF2',
		false,
		['deriveBits', 'deriveKey']
	);

	// Derive AES-GCM key
	return await crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt: salt as BufferSource,
			iterations: 600000, // High iteration count for security
			hash: 'SHA-256',
		},
		keyMaterial,
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt', 'decrypt']
	);
}

/**
 * Generates a random salt
 */
export function generateSalt(): Uint8Array {
	return crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Generates a random IV for AES-GCM
 */
export function generateIV(): Uint8Array {
	return crypto.getRandomValues(new Uint8Array(12));
}

/**
 * Hashes a password for storage (verification only, not encryption)
 */
export async function hashPassword(
	password: string,
	salt: Uint8Array
): Promise<string> {
	const encoder = new TextEncoder();
	const passwordData = encoder.encode(password);

	const keyMaterial = await crypto.subtle.importKey(
		'raw',
		passwordData,
		'PBKDF2',
		false,
		['deriveBits']
	);

	const hash = await crypto.subtle.deriveBits(
		{
			name: 'PBKDF2',
			salt: salt as BufferSource,
			iterations: 600000,
			hash: 'SHA-256',
		},
		keyMaterial,
		256
	);

	return arrayBufferToBase64(hash);
}

/**
 * Encrypts data with master password
 */
export async function encrypt(
	data: string,
	masterPassword: string,
	salt: Uint8Array
): Promise<EncryptedData> {
	const key = await deriveKey(masterPassword, salt);
	const iv = generateIV();
	const encoder = new TextEncoder();
	const encodedData = encoder.encode(data);

	const ciphertext = await crypto.subtle.encrypt(
		{
			name: 'AES-GCM',
			iv: iv as BufferSource,
		},
		key,
		encodedData
	);

	return {
		ciphertext: arrayBufferToBase64(ciphertext),
		iv: arrayBufferToBase64(iv.buffer),
		salt: arrayBufferToBase64(salt.buffer),
	};
}

/**
 * Decrypts data with master password
 */
export async function decrypt(
	encryptedData: EncryptedData,
	masterPassword: string
): Promise<string> {
	const salt = base64ToArrayBuffer(encryptedData.salt);
	const iv = base64ToArrayBuffer(encryptedData.iv);
	const ciphertext = base64ToArrayBuffer(encryptedData.ciphertext);

	const key = await deriveKey(masterPassword, new Uint8Array(salt));

	const decrypted = await crypto.subtle.decrypt(
		{
			name: 'AES-GCM',
			iv: new Uint8Array(iv),
		},
		key,
		ciphertext
	);

	const decoder = new TextDecoder();
	return decoder.decode(decrypted);
}

/**
 * Converts ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer | ArrayBufferLike): string {
	const bytes = new Uint8Array(buffer);
	let binary = '';
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

/**
 * Converts Base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes.buffer;
}

/**
 * Verifies a master password against stored hash
 */
export async function verifyPassword(
	password: string,
	storedHash: string,
	saltBase64: string
): Promise<boolean> {
	const salt = new Uint8Array(base64ToArrayBuffer(saltBase64));
	const hash = await hashPassword(password, salt);
	return hash === storedHash;
}
