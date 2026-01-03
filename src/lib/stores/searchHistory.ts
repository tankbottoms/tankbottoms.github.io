import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'search_history';
const MAX_HISTORY = 15;

export interface SearchEntry {
	term: string;
	source?: 'associate' | 'scheme' | 'manual';
	color?: string;
	timestamp: number;
}

// Load initial search history from localStorage
function loadSearchHistory(): SearchEntry[] {
	if (browser) {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const parsed = JSON.parse(stored);
				// Handle legacy format (array of strings)
				if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
					return parsed.map((term: string) => ({
						term,
						source: 'manual' as const,
						timestamp: Date.now()
					}));
				}
				return parsed;
			}
			return [];
		} catch (error) {
			console.error('Failed to load search history:', error);
			return [];
		}
	}
	return [];
}

// Create the store
function createSearchHistoryStore() {
	const { subscribe, set, update } = writable<SearchEntry[]>(loadSearchHistory());

	return {
		subscribe,
		addSearch: (term: string, source: 'associate' | 'scheme' | 'manual' = 'manual', color?: string) => {
			// Trim and validate
			const cleanTerm = term.trim();
			if (!cleanTerm) return;

			update((history) => {
				// Remove the term if it already exists
				const filtered = history.filter((entry) => entry.term !== cleanTerm);
				// Create new entry
				const newEntry: SearchEntry = {
					term: cleanTerm,
					source,
					color,
					timestamp: Date.now()
				};
				// Add to the beginning
				const newHistory = [newEntry, ...filtered].slice(0, MAX_HISTORY);

				// Save to localStorage
				if (browser) {
					try {
						localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
					} catch (error) {
						console.error('Failed to save search history:', error);
					}
				}

				return newHistory;
			});
		},
		clear: () => {
			set([]);
			if (browser) {
				try {
					localStorage.removeItem(STORAGE_KEY);
				} catch (error) {
					console.error('Failed to clear search history:', error);
				}
			}
		}
	};
}

export const searchHistory = createSearchHistoryStore();
