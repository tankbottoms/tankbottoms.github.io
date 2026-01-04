import adapterVercel from '@sveltejs/adapter-vercel';
import adapterStatic from '@sveltejs/adapter-static';
import adapterNode from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import mdPreprocess from './remark.config.js';

const isGitHubPages = process.env.GITHUB_PAGES === 'true';
const isDocker = process.env.DOCKER === 'true';

/**
 * Select adapter based on build target:
 * - GITHUB_PAGES=true -> adapter-static (for GitHub Pages)
 * - DOCKER=true -> adapter-node (for Docker/VPS hosting)
 * - default -> adapter-vercel (for Vercel deployment)
 */
function getAdapter() {
	if (isGitHubPages) {
		return adapterStatic({
			pages: 'build',
			assets: 'build',
			fallback: '404.html',
			precompress: false,
			strict: true
		});
	}
	if (isDocker) {
		return adapterNode({
			out: 'build',
			precompress: true
		});
	}
	return adapterVercel({
		runtime: 'nodejs22.x'
	});
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [vitePreprocess(), mdPreprocess()],
	kit: {
		adapter: getAdapter(),
		paths: {
			base: ''
		}
	},
	extensions: ['.svelte', '.md']
};

export default config;
