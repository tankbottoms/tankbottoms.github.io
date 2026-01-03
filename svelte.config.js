import adapterVercel from '@sveltejs/adapter-vercel';
import adapterStatic from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import mdPreprocess from './remark.config.js';

const isGitHubPages = process.env.GITHUB_PAGES === 'true';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [vitePreprocess(), mdPreprocess()],
	kit: {
		adapter: isGitHubPages
			? adapterStatic({
					pages: 'build',
					assets: 'build',
					fallback: '404.html',
					precompress: false,
					strict: true
				})
			: adapterVercel({
					runtime: 'nodejs22.x'
				}),
		paths: {
			base: isGitHubPages ? '' : ''
		}
	},
	extensions: ['.svelte', '.md']
};

export default config;
