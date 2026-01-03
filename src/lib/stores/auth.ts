import { writable, get } from 'svelte/store';

// Site password
const SITE_PASSWORD = 'iqif-pahe-mpmq-poln';

// Session duration: 30 days in milliseconds
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000;

const STORAGE_KEY = 'whiskers-auth';

interface AuthState {
	isAuthenticated: boolean;
	sessionExpiry: number | null;
}

interface StoredAuth {
	sessionExpiry: number | null;
}

const defaultState: AuthState = {
	isAuthenticated: false,
	sessionExpiry: null
};

function isBrowser(): boolean {
	return typeof window !== 'undefined';
}

function loadStoredAuth(): StoredAuth | null {
	if (!isBrowser()) return null;

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			return JSON.parse(stored);
		}
	} catch (e) {
		console.warn('Failed to load auth state:', e);
	}
	return null;
}

function saveStoredAuth(data: StoredAuth): void {
	if (!isBrowser()) return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	} catch (e) {
		console.warn('Failed to save auth state:', e);
	}
}

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>(defaultState);

	return {
		subscribe,

		// Initialize from localStorage
		initialize(): AuthState {
			const stored = loadStoredAuth();
			const now = Date.now();

			if (stored && stored.sessionExpiry && stored.sessionExpiry > now) {
				const state: AuthState = {
					isAuthenticated: true,
					sessionExpiry: stored.sessionExpiry
				};
				set(state);
				return state;
			}

			set(defaultState);
			return defaultState;
		},

		verifyPassword(password: string): boolean {
			return password === SITE_PASSWORD;
		},

		// Authenticate with password and create session
		authenticate() {
			const now = Date.now();
			const expiry = now + SESSION_DURATION;

			const stored: StoredAuth = {
				sessionExpiry: expiry
			};
			saveStoredAuth(stored);

			set({
				isAuthenticated: true,
				sessionExpiry: expiry
			});
		},

		// Clear all auth state
		logout() {
			if (isBrowser()) {
				localStorage.removeItem(STORAGE_KEY);
			}
			set(defaultState);
		}
	};
}

export const auth = createAuthStore();
export { SITE_PASSWORD };
