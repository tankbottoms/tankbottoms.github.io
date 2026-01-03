import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'site_statistics';

interface PostStatistics {
	thumbsUp: number;
	thumbsDown: number;
	hasVoted?: 'up' | 'down'; // Track if user has voted
}

interface SiteStatistics {
	totalViews: number;
	posts: Record<string, PostStatistics>;
}

// Load initial statistics from localStorage
function loadStatistics(): SiteStatistics {
	if (browser) {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			return stored
				? JSON.parse(stored)
				: {
						totalViews: 0,
						posts: {}
					};
		} catch (error) {
			console.error('Failed to load statistics:', error);
			return {
				totalViews: 0,
				posts: {}
			};
		}
	}
	return {
		totalViews: 0,
		posts: {}
	};
}

// Save statistics to localStorage
function saveStatistics(stats: SiteStatistics) {
	if (browser) {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
		} catch (error) {
			console.error('Failed to save statistics:', error);
		}
	}
}

// Create the store
function createStatisticsStore() {
	const { subscribe, set, update } = writable<SiteStatistics>(loadStatistics());

	return {
		subscribe,
		incrementViews: () => {
			update((stats) => {
				const newStats = {
					...stats,
					totalViews: stats.totalViews + 1
				};
				saveStatistics(newStats);
				return newStats;
			});
		},
		thumbsUp: (postSlug: string) => {
			update((stats) => {
				const post = stats.posts[postSlug] || { thumbsUp: 0, thumbsDown: 0 };

				// If user already voted down, remove that vote
				if (post.hasVoted === 'down') {
					post.thumbsDown = Math.max(0, post.thumbsDown - 1);
				}

				// Toggle thumbs up
				if (post.hasVoted === 'up') {
					post.thumbsUp = Math.max(0, post.thumbsUp - 1);
					post.hasVoted = undefined;
				} else {
					post.thumbsUp += 1;
					post.hasVoted = 'up';
				}

				const newStats = {
					...stats,
					posts: {
						...stats.posts,
						[postSlug]: post
					}
				};
				saveStatistics(newStats);
				return newStats;
			});
		},
		thumbsDown: (postSlug: string) => {
			update((stats) => {
				const post = stats.posts[postSlug] || { thumbsUp: 0, thumbsDown: 0 };

				// If user already voted up, remove that vote
				if (post.hasVoted === 'up') {
					post.thumbsUp = Math.max(0, post.thumbsUp - 1);
				}

				// Toggle thumbs down
				if (post.hasVoted === 'down') {
					post.thumbsDown = Math.max(0, post.thumbsDown - 1);
					post.hasVoted = undefined;
				} else {
					post.thumbsDown += 1;
					post.hasVoted = 'down';
				}

				const newStats = {
					...stats,
					posts: {
						...stats.posts,
						[postSlug]: post
					}
				};
				saveStatistics(newStats);
				return newStats;
			});
		},
		getPostStats: (postSlug: string): PostStatistics => {
			const stats = loadStatistics();
			return stats.posts[postSlug] || { thumbsUp: 0, thumbsDown: 0 };
		},
		clear: () => {
			set({
				totalViews: 0,
				posts: {}
			});
			if (browser) {
				try {
					localStorage.removeItem(STORAGE_KEY);
				} catch (error) {
					console.error('Failed to clear statistics:', error);
				}
			}
		}
	};
}

export const statistics = createStatisticsStore();
