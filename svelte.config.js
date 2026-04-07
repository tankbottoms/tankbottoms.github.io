import adapterCloudflare from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import mdPreprocess from './remark.config.js';

const isGitHubPages = process.env.GITHUB_PAGES === 'true';
const isDocker = process.env.DOCKER === 'true';
const isVercel = process.env.VERCEL === 'true';

/**
 * Select adapter based on build target:
 * - GITHUB_PAGES=true -> adapter-static (for GitHub Pages)
 * - DOCKER=true -> adapter-node (for Docker/VPS hosting)
 * - VERCEL=true -> adapter-vercel (for Vercel deployment)
 * - default -> adapter-cloudflare (primary deployment target)
 */
async function getAdapter() {
	if (isGitHubPages) {
		const { default: adapterStatic } = await import('@sveltejs/adapter-static');
		return adapterStatic({
			pages: 'build',
			assets: 'build',
			fallback: '404.html',
			precompress: false,
			strict: true
		});
	}
	if (isDocker) {
		const { default: adapterNode } = await import('@sveltejs/adapter-node');
		return adapterNode({
			out: 'build',
			precompress: true
		});
	}
	if (isVercel) {
		const { default: adapterVercel } = await import('@sveltejs/adapter-vercel');
		return adapterVercel({
			runtime: 'nodejs22.x'
		});
	}
	return adapterCloudflare();
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [vitePreprocess(), mdPreprocess()],
	kit: {
		adapter: await getAdapter(),
		paths: {
			base: ''
		}
	},
	extensions: ['.svelte', '.md']
};

export default config;
