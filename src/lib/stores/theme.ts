import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'light' | 'dark';

// Initialize with 'light' always, update on client side
export const theme = writable<Theme>('light');

// Only run on client side
if (browser) {
	// Get stored theme on initialization
	const stored = localStorage.getItem('theme') as Theme | null;
	if (stored) {
		theme.set(stored);
		document.documentElement.setAttribute('data-theme', stored);
	} else {
		document.documentElement.setAttribute('data-theme', 'light');
	}

	// Subscribe to changes
	theme.subscribe((value) => {
		localStorage.setItem('theme', value);
		document.documentElement.setAttribute('data-theme', value);
	});
}

export function toggleTheme() {
	theme.update((current) => (current === 'light' ? 'dark' : 'light'));
}
