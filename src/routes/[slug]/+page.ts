export const prerender = true;

import { error } from '@sveltejs/kit';
import { calculateReadingTime } from '$lib/utils/readingTime';

// Generate entries for prerendering all blog posts
export async function entries() {
	const modules = import.meta.glob('../../docs/posts/*.md');
	const entries = [];

	for (const path of Object.keys(modules)) {
		const slug = path.replace('../../docs/posts/', '').replace('.md', '');
		entries.push({ slug });
	}

	return entries;
}

export async function load({ params }) {
	const { slug } = params;

	// Ignore common browser requests that aren't blog posts
	const ignoredPaths = [
		'favicon.ico',
		'apple-touch-icon.png',
		'apple-touch-icon-precomposed.png',
		'robots.txt',
		'sitemap.xml'
	];

	if (ignoredPaths.includes(slug)) {
		error(404, 'Not found');
	}

	try {
		const post = await import(`../../docs/posts/${slug}.md`);

		// Load raw content for word count calculation
		let wordCount = 0;
		let readingTime = 0;
		let readingTimeText = '';

		try {
			const rawContent = await import(`../../docs/posts/${slug}.md?raw`);
			const readingStats = calculateReadingTime(rawContent.default);
			wordCount = readingStats.wordCount;
			readingTime = readingStats.readingTime;
			readingTimeText = readingStats.readingTimeText;
		} catch (err) {
			console.error('Could not calculate reading time:', err);
		}

		return {
			component: post.default,
			metadata: {
				...post.metadata,
				wordCount,
				readingTime,
				readingTimeText
			}
		};
	} catch (err) {
		error(404, `Blog post not found: ${slug}`);
	}
}
