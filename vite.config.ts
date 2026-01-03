import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	build: {
		rollupOptions: {
			output: {
				manualChunks: (id) => {
					// Vendor chunks for large dependencies
					if (id.includes('node_modules')) {
						// Svelte core
						if (id.includes('svelte')) {
							return 'vendor-svelte';
						}
						// PDF/document processing
						if (id.includes('pdfjs') || id.includes('pdf-lib') || id.includes('docx') || id.includes('file-saver')) {
							return 'vendor-documents';
						}
						// Markdown processing
						if (id.includes('remark') || id.includes('rehype') || id.includes('unified') || id.includes('mdast') || id.includes('hast') || id.includes('micromark')) {
							return 'vendor-markdown';
						}
						// Syntax highlighting
						if (id.includes('prism') || id.includes('shiki')) {
							return 'vendor-syntax';
						}
						// Other large dependencies
						if (id.includes('gray-matter') || id.includes('yaml') || id.includes('js-yaml')) {
							return 'vendor-yaml';
						}
					}
				}
			}
		},
		// Increase chunk size warning limit for content-heavy blog posts
		chunkSizeWarningLimit: 1000
	}
});
