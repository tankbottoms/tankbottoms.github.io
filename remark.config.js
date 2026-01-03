import { remark } from 'remark';
import matter from 'gray-matter';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import rehypeRaw from 'rehype-raw';
import { visit } from 'unist-util-visit';
import { SKIP } from 'unist-util-visit';

const newline = '\n';

// Plugin to escape curly braces in code blocks for Svelte
function escapeCodeBlocks() {
	return (tree) => {
		visit(tree, 'element', (node) => {
			// Only process <code> elements
			if (node.tagName === 'code') {
				visit(node, 'text', (textNode) => {
					// Escape curly braces to prevent Svelte from parsing them
					textNode.value = textNode.value
						.replace(/\{/g, '&#123;')
						.replace(/\}/g, '&#125;');
				});
				return SKIP; // Don't visit children again
			}
		});
	};
}

// Plugin to convert internal links to relative paths for IPFS compatibility
// Converts href="/slug" to href="./slug" for links to other blog posts
function relativeLinksPlugin() {
	return (tree) => {
		visit(tree, 'element', (node) => {
			if (node.tagName === 'a' && node.properties?.href) {
				const href = node.properties.href;
				// Convert internal absolute paths to relative
				// Match patterns like /20110118-smyth-fbi-302-interview or /schemes
				if (typeof href === 'string' && href.startsWith('/') && !href.startsWith('//')) {
					// Don't convert external protocol-relative URLs or anchors
					if (!href.startsWith('/ipfs/') && !href.startsWith('/ipns/')) {
						node.properties.href = '.' + href;
					}
				}
			}
		});
	};
}

// Plugin to extract headings
function headingsPlugin() {
	return (tree, file) => {
		const headings = [];
		visit(tree, 'heading', (node) => {
			let title = '';
			visit(node, 'text', (textNode) => {
				title += textNode.value;
			});
			headings.push({
				level: node.depth,
				title: title
			});
		});
		if (!file.data.fm) {
			file.data.fm = {};
		}
		file.data.fm.headings = headings;
	};
}

// Plugin to add Mr. Whiskers icon near special mentions (disabled for now)
// This plugin was previously used for name highlighting but is not needed for the cat blog
function whiskersHeadPlugin() {
	// No-op plugin - returns tree unchanged
	return (tree) => tree;
}

const mdPreprocess = () => ({
	markup: async ({ content, filename }) => {
		if (!filename.endsWith('.md')) {
			return {
				code: content
			};
		}

		let { content: _content, data: frontMatterData } = matter(content);
		content = _content;

		const vFile = await remark()
			.use(headingsPlugin)
			.use(remarkParse)
			.use(remarkGfm)
			.use(remarkFrontmatter)
			.use(remarkRehype, { allowDangerousHtml: true })
			.use(rehypeRaw)
			.use(whiskersHeadPlugin)
			.use(relativeLinksPlugin)
			.use(escapeCodeBlocks)
			.use((opts) => {
				const id = filename.split('/').pop().replace(/[^a-zA-Z0-9]/g, '-');
				return rehypeSlug({ prefix: `${id}-`, ...(opts ?? {}) });
			})
			.use(rehypeAutolinkHeadings)
			.use(rehypeStringify)
			.process(content);

		const { fm: metadata = {} } = vFile.data;

		for (const k in frontMatterData) {
			metadata[k] = metadata[k] ?? frontMatterData[k];
		}

		const stringified =
			metadata && JSON.stringify(metadata).replace(/<(\/\?script|\/?style)/g, '<"+"$1');

		const fm =
			metadata &&
			`export const metadata = ${stringified};${newline}` +
			`	const { ${Object.keys(metadata).join(', ')} } = metadata;`;

		const insertModule = `<script context="module">${newline}	${fm}${newline}</script>`;

		const resultCode = `${insertModule}${newline}${vFile.value}`;

		return {
			code: resultCode
		};
	}
});

export default mdPreprocess;
