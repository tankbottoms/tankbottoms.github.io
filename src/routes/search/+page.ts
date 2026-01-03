export const prerender = false;

import { calculateReadingTime } from '$lib/utils/readingTime';

type ContentMetadata = {
	title?: string;
	blurb?: string;
	date?: string;
	author?: string;
	wordCount?: number;
	readingTime?: number;
	readingTimeText?: string;
	tags?: string[];
	schemes?: string[];
	team?: string[];
};

type ContentItem = {
	path: string;
	type: 'post' | 'research';
	metadata: ContentMetadata;
	component: any;
};

export async function load({ url, parent }) {
	const searchQuery = url.searchParams.get('q') || '';
	const searchSource = url.searchParams.get('source') || '';
	const allContent: ContentItem[] = [];

	try {
		// Get cached post data from parent layout (already loaded with metadata)
		const { posts } = await parent();

		// Convert posts to search format
		for (const post of posts) {
			allContent.push({
				path: `/${post.path}`,
				type: 'post',
				metadata: post.metadata,
				component: post.component
			});
		}

		// Load research documents (if any exist)
		const researchModules = import.meta.glob('../../docs/research/*.md');
		for (const path in researchModules) {
			const module: any = await researchModules[path]();
			const slug = path.replace('../../docs/research/', '').replace('.md', '');

			allContent.push({
				path: `/research/${slug}`,
				type: 'research',
				metadata: module.metadata || {},
				component: module.default
			});
		}

		// Sort by date descending
		allContent.sort((a, b) => {
			const dateA = a.metadata.date ? new Date(a.metadata.date).getTime() : 0;
			const dateB = b.metadata.date ? new Date(b.metadata.date).getTime() : 0;
			return dateB - dateA;
		});
	} catch (error) {
		console.error('Error loading content for search:', error);
	}

	return {
		allContent,
		searchQuery,
		searchSource
	};
}
