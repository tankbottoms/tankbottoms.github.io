import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import mdPreprocess from './remark.config.js';
import { readdirSync } from 'fs';
import { join } from 'path';

// Generate all blog post entries dynamically
function getAllBlogEntries() {
	const postsDir = join(process.cwd(), 'src/docs/posts');
	try {
		const files = readdirSync(postsDir);
		return files
			.filter(f => f.endsWith('.md'))
			.map(f => '/' + f.replace('.md', ''));
	} catch (e) {
		console.warn('Could not read posts directory:', e.message);
		return [];
	}
}

const blogEntries = getAllBlogEntries();
console.log(`Found ${blogEntries.length} blog posts for prerendering`);

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [vitePreprocess(), mdPreprocess()],
	kit: {
		// IMPORTANT: Output to .ipfs-build to avoid conflicts with Vercel's build/
		adapter: adapter({
			pages: '.ipfs-build',
			assets: '.ipfs-build',
			fallback: undefined, // No fallback - fully static prerendered pages
			precompress: false,
			strict: false // Allow some routes to fail gracefully
		}),
		paths: {
			// Use relative paths for IPFS compatibility
			// IPFS gateways serve at /ipfs/CID/ not at root /
			relative: true
		},
		prerender: {
			handleHttpError: 'warn',
			handleMissingId: 'warn',
			handleUnseenRoutes: 'ignore',
			// Explicitly list all routes for static IPFS build
			entries: [
				'/',
				'/about',
				'/team',
				'/schemes',
				'/legal',
				'/search',
				'/search-triples',
				'/icons',
				'/exhibits',
				...blogEntries
			]
		}
	},
	extensions: ['.svelte', '.md']
};

export default config;
