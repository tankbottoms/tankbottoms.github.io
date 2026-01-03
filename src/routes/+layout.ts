import { Buffer } from 'buffer';
import { browser } from '$app/environment';

if (browser) {
	(window as any).Buffer = Buffer;
}

export const prerender = true;

import { calculateReadingTime } from '$lib/utils/readingTime';

type PostMetadata = {
	title?: string;
	blurb?: string;
	date?: string;
	author?: string;
	headings?: Array<{ level: number; title: string }>;
	wordCount?: number;
	readingTime?: number;
	readingTimeText?: string;
	tags?: string[];
	research?: string[];
	napScore?: number;
	featured?: boolean;
};

type Post = {
	path: string;
	metadata: PostMetadata;
	component: any;
};

// Cache for reading stats to avoid recalculating
const readingStatsCache = new Map<string, { wordCount: number; readingTime: number; readingTimeText: string }>();

export async function load() {
	const posts: Post[] = [];

	try {
		// Load modules with eager metadata extraction for fast first paint
		const modules = import.meta.glob('../docs/posts/*.md', { eager: true });

		// First pass: Extract metadata only (fast)
		for (const path in modules) {
			const module: any = modules[path];
			const slug = path.replace('../docs/posts/', '').replace('.md', '');

			posts.push({
				path: slug,
				metadata: {
					...module.metadata,
					// Placeholder - will be enhanced in background
					wordCount: module.metadata?.wordCount || 0,
					readingTime: module.metadata?.readingTime || 0,
					readingTimeText: module.metadata?.readingTimeText || ''
				},
				component: module.default
			});
		}

		// Sort by date descending
		posts.sort((a, b) => {
			const dateA = a.metadata.date ? new Date(a.metadata.date).getTime() : 0;
			const dateB = b.metadata.date ? new Date(b.metadata.date).getTime() : 0;
			return dateB - dateA;
		});

		// Load reading stats in background (non-blocking)
		if (browser) {
			loadReadingStatsInBackground(posts);
		}
	} catch (error) {
		console.error('Error loading blog posts:', error);
	}

	return {
		posts
	};
}

/**
 * Load reading stats in background after initial paint
 * This enhances posts with word counts and reading times without blocking render
 */
async function loadReadingStatsInBackground(posts: Post[]): Promise<void> {
	// Wait for idle time
	const startEnhancement = () => {
		enhancePostsWithReadingStats(posts);
	};

	if ('requestIdleCallback' in window) {
		(window as any).requestIdleCallback(startEnhancement, { timeout: 3000 });
	} else {
		setTimeout(startEnhancement, 500);
	}
}

/**
 * Enhance posts with reading time statistics
 */
async function enhancePostsWithReadingStats(posts: Post[]): Promise<void> {
	try {
		const rawModules = import.meta.glob('../docs/posts/*.md', { query: '?raw', import: 'default' });

		// Process in batches to avoid blocking
		const batchSize = 10;
		const paths = Object.keys(rawModules);

		for (let i = 0; i < paths.length; i += batchSize) {
			const batch = paths.slice(i, i + batchSize);

			await Promise.all(
				batch.map(async (path) => {
					const slug = path.replace('../docs/posts/', '').replace('.md', '');

					// Check cache first
					if (readingStatsCache.has(slug)) {
						const cached = readingStatsCache.get(slug)!;
						const post = posts.find((p) => p.path === slug);
						if (post) {
							post.metadata.wordCount = cached.wordCount;
							post.metadata.readingTime = cached.readingTime;
							post.metadata.readingTimeText = cached.readingTimeText;
						}
						return;
					}

					try {
						const rawContent: any = await rawModules[path]();
						const stats = calculateReadingTime(rawContent as string);

						// Cache the result
						readingStatsCache.set(slug, stats);

						// Update the post
						const post = posts.find((p) => p.path === slug);
						if (post) {
							post.metadata.wordCount = stats.wordCount;
							post.metadata.readingTime = stats.readingTime;
							post.metadata.readingTimeText = stats.readingTimeText;
						}
					} catch (e) {
						console.debug(`Failed to load reading stats for ${slug}:`, e);
					}
				})
			);

			// Small delay between batches
			await new Promise((resolve) => setTimeout(resolve, 50));
		}
	} catch (error) {
		console.debug('Background reading stats enhancement failed:', error);
	}
}
