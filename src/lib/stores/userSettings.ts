import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface VisitInfo {
	count: number;
	firstVisited: string;  // ISO date string
	lastVisited: string;   // ISO date string
}

interface ReferrerInfo {
	path: string;           // Full path including search params
	scrollPosition: number; // Scroll Y position when leaving
}

interface UserSettings {
	severityFilter: number | null;
	scrollPositions: Record<string, number>;
	lastVisitedPost: string | null;
	visitHistory: Record<string, VisitInfo>;
	referrer: ReferrerInfo | null;  // Track where user came from for back navigation
}

const STORAGE_KEY = 'whiskers-blog-settings';

const defaultSettings: UserSettings = {
	severityFilter: null,
	scrollPositions: {},
	lastVisitedPost: null,
	visitHistory: {},
	referrer: null
};

function loadSettings(): UserSettings {
	if (!browser) return defaultSettings;

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			return { ...defaultSettings, ...JSON.parse(stored) };
		}
	} catch (e) {
		console.warn('Failed to load user settings:', e);
	}
	return defaultSettings;
}

function saveSettings(settings: UserSettings): void {
	if (!browser) return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
	} catch (e) {
		console.warn('Failed to save user settings:', e);
	}
}

function createUserSettingsStore() {
	const { subscribe, set, update } = writable<UserSettings>(loadSettings());

	return {
		subscribe,

		setSeverityFilter(level: number | null) {
			update(settings => {
				const newSettings = { ...settings, severityFilter: level };
				saveSettings(newSettings);
				return newSettings;
			});
		},

		setScrollPosition(path: string, position: number) {
			update(settings => {
				const newSettings = {
					...settings,
					scrollPositions: {
						...settings.scrollPositions,
						[path]: position
					}
				};
				saveSettings(newSettings);
				return newSettings;
			});
		},

		getScrollPosition(path: string): number {
			let position = 0;
			subscribe(settings => {
				position = settings.scrollPositions[path] || 0;
			})();
			return position;
		},

		setLastVisitedPost(path: string | null) {
			update(settings => {
				const newSettings = { ...settings, lastVisitedPost: path };
				saveSettings(newSettings);
				return newSettings;
			});
		},

		clearScrollPositions() {
			update(settings => {
				const newSettings = { ...settings, scrollPositions: {} };
				saveSettings(newSettings);
				return newSettings;
			});
		},

		recordVisit(path: string) {
			update(settings => {
				const existing = settings.visitHistory[path];
				const now = new Date().toISOString();
				const newSettings = {
					...settings,
					visitHistory: {
						...settings.visitHistory,
						[path]: {
							count: (existing?.count || 0) + 1,
							firstVisited: existing?.firstVisited || now,
							lastVisited: now
						}
					}
				};
				saveSettings(newSettings);
				return newSettings;
			});
		},

		getVisitInfo(path: string): VisitInfo | null {
			let info: VisitInfo | null = null;
			subscribe(settings => {
				info = settings.visitHistory[path] || null;
			})();
			return info;
		},

		getAllVisitHistory(): Record<string, VisitInfo> {
			let history: Record<string, VisitInfo> = {};
			subscribe(settings => {
				history = settings.visitHistory;
			})();
			return history;
		},

		setReferrer(path: string, scrollPosition: number = 0) {
			update(settings => {
				const newSettings = {
					...settings,
					referrer: { path, scrollPosition }
				};
				saveSettings(newSettings);
				return newSettings;
			});
		},

		getReferrer(): ReferrerInfo | null {
			let referrer: ReferrerInfo | null = null;
			subscribe(settings => {
				referrer = settings.referrer;
			})();
			return referrer;
		},

		clearReferrer() {
			update(settings => {
				const newSettings = { ...settings, referrer: null };
				saveSettings(newSettings);
				return newSettings;
			});
		},

		reset() {
			set(defaultSettings);
			saveSettings(defaultSettings);
		}
	};
}

export const userSettings = createUserSettingsStore();
export type { VisitInfo, ReferrerInfo };
