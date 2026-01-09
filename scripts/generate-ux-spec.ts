#!/usr/bin/env bun
/**
 * UX Specification Generator
 *
 * Parses CSS files to extract design tokens and generates:
 * - /ux-spec route with interactive documentation
 * - docs/UX_SPECIFICATION.md markdown version
 *
 * Usage: bun run generate:ux-spec
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';

// Configuration
const CONFIG = {
	cssFiles: ['src/app.css'],
	outputPath: 'src/routes/ux-spec/+page.svelte',
	markdownPath: 'docs/UX_SPECIFICATION.md',
	projectName: 'Mr. Whiskers Blog'
};

// Color categorization patterns
const COLOR_CATEGORIES = {
	core: ['bg', 'text', 'border', 'link', 'shadow', 'hover', 'code'],
	scheme: ['timeline', 'featured', 'chart'],
	semantic: ['highlight', 'warning', 'danger', 'info', 'success', 'primary']
};

interface CSSVariable {
	name: string;
	value: string;
	category: string;
}

interface ParsedCSS {
	lightMode: CSSVariable[];
	darkMode: CSSVariable[];
	fonts: CSSVariable[];
}

/**
 * Parse CSS files and extract variables
 */
function parseCSS(): ParsedCSS {
	const result: ParsedCSS = {
		lightMode: [],
		darkMode: [],
		fonts: []
	};

	for (const file of CONFIG.cssFiles) {
		const filePath = join(process.cwd(), file);
		if (!existsSync(filePath)) {
			console.warn(`Warning: CSS file not found: ${file}`);
			continue;
		}

		const content = readFileSync(filePath, 'utf-8');

		// Extract standalone :root variables (fonts)
		const standaloneRootMatch = content.match(/:root\s*\{([^}]+)\}/);
		if (standaloneRootMatch) {
			const vars = extractVariables(standaloneRootMatch[1]);
			result.fonts.push(...vars.filter((v) => v.name.includes('font')));
		}

		// Extract :root variables combined with light theme
		const rootMatch = content.match(/:root\s*,\s*\[data-theme=['"]light['"]\]\s*\{([^}]+)\}/);
		if (rootMatch) {
			const vars = extractVariables(rootMatch[1]);
			result.lightMode.push(...vars.filter((v) => v.name.includes('color')));
			result.fonts.push(...vars.filter((v) => v.name.includes('font')));
		}

		// Fallback: :root only for colors
		if (result.lightMode.length === 0 && standaloneRootMatch) {
			const vars = extractVariables(standaloneRootMatch[1]);
			result.lightMode.push(...vars.filter((v) => v.name.includes('color')));
		}

		// Extract dark mode variables
		const darkMatch = content.match(/\[data-theme=['"]dark['"]\]\s*\{([^}]+)\}/);
		if (darkMatch) {
			const vars = extractVariables(darkMatch[1]);
			result.darkMode.push(...vars.filter((v) => v.name.includes('color')));
		}
	}

	// Categorize variables
	result.lightMode = result.lightMode.map(categorizeVariable);
	result.darkMode = result.darkMode.map(categorizeVariable);

	return result;
}

/**
 * Extract CSS variables from a block
 */
function extractVariables(block: string): CSSVariable[] {
	const variables: CSSVariable[] = [];
	const regex = /--([\w-]+):\s*([^;]+);/g;
	let match;

	while ((match = regex.exec(block)) !== null) {
		variables.push({
			name: `--${match[1]}`,
			value: match[2].trim(),
			category: 'unknown'
		});
	}

	return variables;
}

/**
 * Categorize a variable based on its name
 */
function categorizeVariable(variable: CSSVariable): CSSVariable {
	const name = variable.name.toLowerCase();

	for (const [category, patterns] of Object.entries(COLOR_CATEGORIES)) {
		if (patterns.some((p) => name.includes(p))) {
			return { ...variable, category };
		}
	}

	return { ...variable, category: 'other' };
}

/**
 * Generate the Svelte page content
 */
function generateSveltePage(css: ParsedCSS): string {
	const coreColors = css.lightMode.filter((v) => v.category === 'core');
	const schemeColors = css.lightMode.filter((v) => v.category === 'scheme');

	// Pre-generate export content
	const markdownContent = generateMarkdownExport(css);
	const textContent = generateTextExport(css);

	return `<script lang="ts">
	import { base } from '$app/paths';

	// Export functions
	function exportPdf() {
		window.print();
	}

	function exportMarkdown() {
		const content = ${JSON.stringify(markdownContent)};
		downloadFile(content, 'ux-specification.md', 'text/markdown');
	}

	function exportText() {
		const content = ${JSON.stringify(textContent)};
		downloadFile(content, 'ux-specification.txt', 'text/plain');
	}

	function downloadFile(content: string, filename: string, type: string) {
		const blob = new Blob([content], { type });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}
<\/script>

<svelte:head>
	<title>UX Specification | ${CONFIG.projectName}</title>
	<meta name="description" content="Design system documentation for ${CONFIG.projectName}" />
</svelte:head>

<div class="ux-spec-page">
	<header class="spec-header">
		<div class="header-content">
			<a href="{base}/" class="back-link"><i class="fat fa-arrow-left"></i> Back to Timeline</a>
			<h1>UX Specification</h1>
			<p class="subtitle">Design system documentation for ${CONFIG.projectName}</p>
		</div>
		<div class="export-icons">
			<button onclick={exportPdf} aria-label="Download PDF" title="Download PDF">
				<i class="fat fa-file-pdf"></i>
			</button>
			<button onclick={exportMarkdown} aria-label="Download Markdown" title="Download Markdown">
				<i class="fat fa-file-code"></i>
			</button>
			<button onclick={exportText} aria-label="Download Plain Text" title="Download Plain Text">
				<i class="fat fa-file-lines"></i>
			</button>
		</div>
	</header>

	<!-- Design Principles -->
	<section class="spec-section">
		<h2><i class="fat fa-compass-drafting"></i> Design Principles</h2>
		<div class="principles-grid">
			<div class="principle-card">
				<h3>Terminal Aesthetic</h3>
				<p>Monospace typography, sharp corners, hard offset shadows. Clean, developer-friendly visual language with minimal decoration.</p>
			</div>
			<div class="principle-card">
				<h3>Information Density</h3>
				<p>Compact layouts that prioritize content. Timeline-based navigation with sticky markers for context. Badges and ratings inline with content.</p>
			</div>
			<div class="principle-card">
				<h3>Consistent Spacing</h3>
				<p>8px base grid. Uniform padding (1rem cards, 0.75rem compact). Gap-based layouts with flex/grid. No arbitrary spacing values.</p>
			</div>
		</div>
	</section>

	<!-- Color Palette -->
	<section class="spec-section">
		<h2><i class="fat fa-palette"></i> Color Palette</h2>

		<h3>Core Colors</h3>
		<p class="section-desc">Foundation colors for backgrounds, text, borders, and interactive elements.</p>
		<div class="color-grid core-colors">
${coreColors
	.map(
		(c) => `			<div class="color-swatch">
				<div class="swatch" style="background: var(${c.name});"></div>
				<code>${c.name}</code>
				<span class="value">${c.value}</span>
			</div>`
	)
	.join('\n')}
		</div>

		<h3>Scheme Colors</h3>
		<p class="section-desc">Domain-specific colors for timeline, charts, and featured content.</p>
		<div class="color-grid scheme-colors">
${schemeColors
	.map(
		(c) => `			<div class="color-swatch">
				<div class="swatch" style="background: var(${c.name});"></div>
				<code>${c.name}</code>
				<span class="value">${c.value}</span>
			</div>`
	)
	.join('\n')}
		</div>

		<h3>Semantic Colors</h3>
		<p class="section-desc">Highlight colors for warnings, errors, info, and success states.</p>
		<div class="semantic-colors">
			<div class="highlight-box highlight-warning">
				<strong>Warning</strong> - Caution or attention needed
			</div>
			<div class="highlight-box highlight-danger">
				<strong>Danger</strong> - Errors or critical issues
			</div>
			<div class="highlight-box highlight-info">
				<strong>Info</strong> - Informational content
			</div>
			<div class="highlight-box highlight-success">
				<strong>Success</strong> - Positive outcomes
			</div>
		</div>
	</section>

	<!-- Typography -->
	<section class="spec-section">
		<h2><i class="fat fa-font"></i> Typography</h2>

		<div class="typography-examples">
			<div class="type-example">
				<span class="type-label">H1 - Serif</span>
				<h1 class="demo-h1">Mr. Whiskers Blog</h1>
				<code>font-family: var(--font-serif); font-size: 2rem;</code>
			</div>
			<div class="type-example">
				<span class="type-label">H2 - Monospace</span>
				<h2 class="demo-h2">Section Heading</h2>
				<code>font-family: var(--font-mono); font-size: 1.5rem;</code>
			</div>
			<div class="type-example">
				<span class="type-label">H3 - Monospace</span>
				<h3 class="demo-h3">Subsection</h3>
				<code>font-family: var(--font-mono); font-size: 1.25rem;</code>
			</div>
			<div class="type-example">
				<span class="type-label">Body - Monospace</span>
				<p class="demo-body">Body text uses monospace for the terminal aesthetic. Line height 1.6 for readability.</p>
				<code>font-family: var(--font-mono); font-size: 14px; line-height: 1.6;</code>
			</div>
			<div class="type-example">
				<span class="type-label">Code - Monospace</span>
				<code class="demo-code">const whiskers = 'distinguished';</code>
				<code>background: var(--color-code-bg); padding: 0.2rem 0.4rem;</code>
			</div>
		</div>

		<h3>Font Stacks</h3>
		<div class="font-stacks">
${css.fonts
	.map(
		(f) => `			<div class="font-stack">
				<code>${f.name}</code>
				<span>${f.value}</span>
			</div>`
	)
	.join('\n')}
		</div>
	</section>

	<!-- Box Types -->
	<section class="spec-section">
		<h2><i class="fat fa-square"></i> Box Types</h2>

		<div class="box-examples">
			<div class="box-example">
				<h3>Section Box</h3>
				<p>Default content container with uniform border and offset shadow on hover.</p>
				<div class="example-box section-box">
					<p>Content goes here. Uniform 1px border, background secondary.</p>
				</div>
				<div class="code-block">
					<pre><code>background: var(--color-bg-secondary);
border: 1px solid var(--color-border);
box-shadow: 2px 2px 0px var(--color-shadow); /* on hover */</code></pre>
				</div>
			</div>

			<div class="box-example">
				<h3>Filter Box</h3>
				<p>Shaded background for controls and filters. No shadow.</p>
				<div class="example-box filter-box">
					<span class="filter-label">Filter by nap-worthiness:</span>
					<span class="filter-pill">All</span>
					<span class="filter-pill active">3+</span>
					<span class="filter-pill">5</span>
				</div>
				<div class="code-block">
					<pre><code>background: var(--color-bg-secondary);
border: 1px solid var(--color-border);
padding: 0.75rem;</code></pre>
				</div>
			</div>

			<div class="box-example">
				<h3>Stats Card</h3>
				<p>Metric display with colored accent on value/icon.</p>
				<div class="example-box stats-card">
					<i class="fat fa-bed stat-icon"></i>
					<span class="stat-number">14,392</span>
					<span class="stat-label">Hours Napped</span>
				</div>
				<div class="code-block">
					<pre><code>.stat-icon, .stat-number &lbrace; color: #9c27b0; &rbrace;
text-align: center;
padding: 1.5rem 1rem;</code></pre>
				</div>
			</div>

			<div class="box-example">
				<h3>Timeline Entry</h3>
				<p>Event cards with badge-only color indication.</p>
				<div class="example-box timeline-entry">
					<div class="entry-header">
						<span class="entry-dot"></span>
						<span class="entry-day">15</span>
						<span class="entry-title">Nap Research Breakthrough</span>
					</div>
					<p class="entry-blurb">Discovered optimal sunbeam angle for maximum warmth.</p>
					<div class="entry-badges">
						<span class="badge" style="background-color: #9c27b020; border-color: #9c27b0; color: #9c27b0;">
							<i class="fat fa-bed"></i> naps
						</span>
					</div>
				</div>
				<div class="code-block">
					<pre><code>border-left: 1px solid var(--color-timeline);
.badge &lbrace; background-color: $&lbrace;color&rbrace;20; border-color: $&lbrace;color&rbrace;; &rbrace;</code></pre>
				</div>
			</div>

			<div class="box-example">
				<h3>Featured Entry</h3>
				<p>Highlighted timeline entries with prominent border and shadow.</p>
				<div class="example-box featured-entry">
					<div class="entry-header">
						<span class="entry-dot featured"></span>
						<span class="entry-day">01</span>
						<span class="entry-title">Comprehensive Lasagna Analysis</span>
					</div>
					<p class="entry-blurb">A scientific treatise on the superiority of lasagna.</p>
				</div>
				<div class="code-block">
					<pre><code>border: 1px solid var(--color-featured-border);
box-shadow: 3px 3px 0px var(--color-shadow);
transform: scale(1.02);</code></pre>
				</div>
			</div>
		</div>
	</section>

	<!-- Badges -->
	<section class="spec-section">
		<h2><i class="fat fa-tag"></i> Badges</h2>

		<h3>Category Badges</h3>
		<p class="section-desc">Colored inline tags for research categories.</p>
		<div class="badge-grid">
			<span class="badge" style="background-color: #9c27b020; border-color: #9c27b0; color: #9c27b0;">
				<i class="fat fa-bed"></i> naps
			</span>
			<span class="badge" style="background-color: #ff980020; border-color: #ff9800; color: #ff9800;">
				<i class="fat fa-wand-magic-sparkles"></i> toys
			</span>
			<span class="badge" style="background-color: #f4433620; border-color: #f44336; color: #f44336;">
				<i class="fat fa-glass-water"></i> knock
			</span>
			<span class="badge" style="background-color: #607d8b20; border-color: #607d8b; color: #607d8b;">
				<i class="fat fa-calendar-xmark"></i> mondays
			</span>
			<span class="badge" style="background-color: #ff572220; border-color: #ff5722; color: #ff5722;">
				<i class="fat fa-utensils"></i> lasagna
			</span>
			<span class="badge" style="background-color: #e91e6320; border-color: #e91e63; color: #e91e63;">
				<i class="fat fa-heart"></i> owner
			</span>
			<span class="badge" style="background-color: #79554820; border-color: #795548; color: #795548;">
				<i class="fat fa-face-angry"></i> peeves
			</span>
			<span class="badge" style="background-color: #ffc10720; border-color: #ffc107; color: #ffc107;">
				<i class="fat fa-sun"></i> sunbeams
			</span>
		</div>

		<h3>Status Badges</h3>
		<p class="section-desc">Form and status indicators.</p>
		<div class="badge-grid">
			<span class="status-badge featured"><i class="fat fa-star"></i> Featured</span>
			<span class="status-badge new">New</span>
			<span class="status-badge updated">Updated</span>
		</div>
	</section>

	<!-- Tables -->
	<section class="spec-section">
		<h2><i class="fat fa-table"></i> Tables</h2>
		<p class="section-desc">Data tables with header styling and zebra striping.</p>

		<table class="example-table">
			<thead>
				<tr>
					<th>Category</th>
					<th>Entries</th>
					<th>Avg. Nap Score</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><span class="badge" style="background-color: #9c27b020; border-color: #9c27b0; color: #9c27b0;"><i class="fat fa-bed"></i> naps</span></td>
					<td>8</td>
					<td>4.5</td>
					<td><i class="fat fa-eye action-icon"></i> <i class="fat fa-filter action-icon"></i></td>
				</tr>
				<tr>
					<td><span class="badge" style="background-color: #ff572220; border-color: #ff5722; color: #ff5722;"><i class="fat fa-utensils"></i> lasagna</span></td>
					<td>3</td>
					<td>5.0</td>
					<td><i class="fat fa-eye action-icon"></i> <i class="fat fa-filter action-icon"></i></td>
				</tr>
				<tr>
					<td><span class="badge" style="background-color: #f4433620; border-color: #f44336; color: #f44336;"><i class="fat fa-glass-water"></i> knock</span></td>
					<td>5</td>
					<td>3.8</td>
					<td><i class="fat fa-eye action-icon"></i> <i class="fat fa-filter action-icon"></i></td>
				</tr>
			</tbody>
		</table>
	</section>

	<!-- Icons -->
	<section class="spec-section">
		<h2><i class="fat fa-icons"></i> Icons</h2>
		<p class="section-desc">Font Awesome Thin (fat) icons used throughout the application.</p>

		<div class="icon-grid">
			<div class="icon-item"><i class="fat fa-cat"></i><span>fa-cat</span></div>
			<div class="icon-item"><i class="fat fa-bed"></i><span>fa-bed</span></div>
			<div class="icon-item"><i class="fat fa-utensils"></i><span>fa-utensils</span></div>
			<div class="icon-item"><i class="fat fa-glass-water"></i><span>fa-glass-water</span></div>
			<div class="icon-item"><i class="fat fa-sun"></i><span>fa-sun</span></div>
			<div class="icon-item"><i class="fat fa-heart"></i><span>fa-heart</span></div>
			<div class="icon-item"><i class="fat fa-star"></i><span>fa-star</span></div>
			<div class="icon-item"><i class="fat fa-trophy"></i><span>fa-trophy</span></div>
			<div class="icon-item"><i class="fat fa-calendar-xmark"></i><span>fa-calendar-xmark</span></div>
			<div class="icon-item"><i class="fat fa-wand-magic-sparkles"></i><span>fa-wand-magic-sparkles</span></div>
			<div class="icon-item"><i class="fat fa-face-angry"></i><span>fa-face-angry</span></div>
			<div class="icon-item"><i class="fat fa-box"></i><span>fa-box</span></div>
			<div class="icon-item"><i class="fat fa-music"></i><span>fa-music</span></div>
			<div class="icon-item"><i class="fat fa-cookie-bite"></i><span>fa-cookie-bite</span></div>
			<div class="icon-item"><i class="fat fa-arrow-left"></i><span>fa-arrow-left</span></div>
			<div class="icon-item"><i class="fat fa-search"></i><span>fa-search</span></div>
			<div class="icon-item"><i class="fat fa-filter"></i><span>fa-filter</span></div>
			<div class="icon-item"><i class="fat fa-eye"></i><span>fa-eye</span></div>
			<div class="icon-item"><i class="fat fa-file-pdf"></i><span>fa-file-pdf</span></div>
			<div class="icon-item"><i class="fat fa-file-lines"></i><span>fa-file-lines</span></div>
		</div>

		<h3>Icon Sizes</h3>
		<div class="icon-sizes">
			<span><i class="fat fa-cat fa-xs"></i> xs</span>
			<span><i class="fat fa-cat fa-sm"></i> sm</span>
			<span><i class="fat fa-cat"></i> default</span>
			<span><i class="fat fa-cat fa-lg"></i> lg</span>
			<span><i class="fat fa-cat fa-xl"></i> xl</span>
			<span><i class="fat fa-cat fa-2x"></i> 2x</span>
		</div>
	</section>

	<!-- Terminology -->
	<section class="spec-section">
		<h2><i class="fat fa-book"></i> Terminology</h2>

		<dl class="terminology-list">
			<dt>Nap Score</dt>
			<dd>1-5 rating displayed as cat icons indicating content's nap-worthiness (relaxation value).</dd>

			<dt>Research Category</dt>
			<dd>Classification tag for blog entries (naps, toys, knock-over, mondays, lasagna, owner, peeves, sunbeams).</dd>

			<dt>Featured Entry</dt>
			<dd>Highlighted timeline item with prominent border and shadow, denoting important research findings.</dd>

			<dt>Timeline Marker</dt>
			<dd>Sticky year/month indicators that provide temporal context while scrolling.</dd>

			<dt>Terminal UI</dt>
			<dd>Design aesthetic emphasizing monospace fonts, sharp corners, and developer-friendly visual language.</dd>

			<dt>Offset Shadow</dt>
			<dd>Hard-edged drop shadow offset 2-3px right and down, creating a layered paper effect.</dd>
		</dl>
	</section>

	<footer class="spec-footer">
		<p>Generated: ${new Date().toISOString().split('T')[0]}</p>
		<p>Run <code>bun run generate:ux-spec</code> to regenerate this specification.</p>
	</footer>
</div>

<style>
	.ux-spec-page {
		max-width: 900px;
		margin: 0 auto;
		padding: 2rem 0;
	}

	/* Header */
	.spec-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 3rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid var(--color-border);
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: 0.8rem;
		margin-bottom: 0.5rem;
	}

	.back-link:hover {
		color: var(--color-text);
	}

	h1 {
		font-family: var(--font-serif);
		font-size: 2.5rem;
		margin: 0 0 0.5rem 0;
		color: var(--color-text);
	}

	.subtitle {
		color: var(--color-text-muted);
		margin: 0;
		font-size: 0.9rem;
	}

	.export-icons {
		display: flex;
		gap: 1.5rem;
		align-items: center;
	}

	.export-icons button {
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 0;
		color: var(--color-text-muted);
		font-size: 1.5rem;
		transition: color 0.2s;
		display: flex;
		align-items: center;
	}

	.export-icons button:hover {
		color: #9c27b0;
	}

	/* Sections */
	.spec-section {
		margin-bottom: 3rem;
		padding: 1.5rem;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
	}

	.spec-section h2 {
		font-family: var(--font-mono);
		font-size: 1.25rem;
		margin: 0 0 1rem 0;
		color: var(--color-text);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.spec-section h2 i {
		color: #9c27b0;
	}

	.spec-section h3 {
		font-family: var(--font-mono);
		font-size: 1rem;
		margin: 1.5rem 0 0.75rem 0;
		color: var(--color-text);
	}

	.section-desc {
		color: var(--color-text-muted);
		font-size: 0.85rem;
		margin: 0 0 1rem 0;
	}

	/* Design Principles */
	.principles-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}

	.principle-card {
		padding: 1rem;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
	}

	.principle-card:hover {
		border-color: var(--color-border-dark);
		box-shadow: 2px 2px 0px var(--color-shadow);
	}

	.principle-card h3 {
		font-family: var(--font-mono);
		font-size: 0.9rem;
		margin: 0 0 0.5rem 0;
		color: #9c27b0;
	}

	.principle-card p {
		font-size: 0.8rem;
		color: var(--color-text-muted);
		margin: 0;
		line-height: 1.5;
	}

	/* Color Palette */
	.color-grid {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 0.75rem;
	}

	.color-swatch {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.swatch {
		width: 100%;
		height: 50px;
		border: 1px solid var(--color-border);
	}

	.color-swatch code {
		font-size: 0.65rem;
		word-break: break-all;
		background: transparent;
		padding: 0;
	}

	.color-swatch .value {
		font-size: 0.6rem;
		color: var(--color-text-muted);
	}

	.semantic-colors {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
	}

	.highlight-box {
		padding: 0.75rem 1rem;
		border-left: 4px solid;
		font-size: 0.85rem;
	}

	/* Typography */
	.typography-examples {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.type-example {
		padding: 1rem;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
	}

	.type-label {
		display: block;
		font-size: 0.7rem;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.5rem;
	}

	.demo-h1 {
		font-family: var(--font-serif);
		font-size: 2rem;
		margin: 0 0 0.5rem 0;
	}

	.demo-h2 {
		font-family: var(--font-mono);
		font-size: 1.5rem;
		margin: 0 0 0.5rem 0;
	}

	.demo-h3 {
		font-family: var(--font-mono);
		font-size: 1.25rem;
		margin: 0 0 0.5rem 0;
	}

	.demo-body {
		margin: 0 0 0.5rem 0;
	}

	.demo-code {
		display: inline-block;
		margin-bottom: 0.5rem;
	}

	.type-example > code {
		font-size: 0.7rem;
		color: var(--color-text-muted);
		background: transparent;
		padding: 0;
	}

	.font-stacks {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.font-stack {
		display: flex;
		gap: 1rem;
		align-items: baseline;
		padding: 0.5rem;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
	}

	.font-stack code {
		font-size: 0.75rem;
		min-width: 120px;
	}

	.font-stack span {
		font-size: 0.7rem;
		color: var(--color-text-muted);
	}

	/* Box Examples */
	.box-examples {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.box-example h3 {
		margin-top: 0;
	}

	.box-example > p {
		font-size: 0.85rem;
		color: var(--color-text-muted);
		margin: 0 0 1rem 0;
	}

	.example-box {
		margin-bottom: 1rem;
	}

	.section-box {
		padding: 1rem;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		transition: all 0.2s;
	}

	.section-box:hover {
		border-color: var(--color-border-dark);
		box-shadow: 2px 2px 0px var(--color-shadow);
	}

	.section-box p {
		margin: 0;
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	.filter-box {
		padding: 0.75rem 1rem;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.filter-box .filter-label {
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	.filter-pill {
		font-size: 0.7rem;
		padding: 0.2rem 0.5rem;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		cursor: pointer;
	}

	.filter-pill.active {
		background: #9c27b020;
		border-color: #9c27b0;
		color: #9c27b0;
	}

	.stats-card {
		padding: 1.5rem 1rem;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		text-align: center;
		max-width: 150px;
	}

	.stats-card:hover {
		border-color: var(--color-border-dark);
		box-shadow: 2px 2px 0px var(--color-shadow);
	}

	.stat-icon {
		display: block;
		font-size: 1.75rem;
		color: #9c27b0;
		margin-bottom: 0.75rem;
	}

	.stat-number {
		display: block;
		font-family: var(--font-mono);
		font-size: 1.5rem;
		font-weight: 700;
		color: #9c27b0;
		margin-bottom: 0.25rem;
	}

	.stat-label {
		font-size: 0.7rem;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.timeline-entry, .featured-entry {
		padding: 0.75rem;
		background: var(--color-bg);
		border-left: 1px solid var(--color-timeline);
		margin-left: 1rem;
	}

	.featured-entry {
		border: 1px solid var(--color-featured-border);
		box-shadow: 3px 3px 0px var(--color-shadow);
		border-left-width: 1px;
		margin-left: 0;
	}

	.entry-header {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		position: relative;
	}

	.entry-dot {
		position: absolute;
		left: -1.25rem;
		top: 4px;
		width: 6px;
		height: 6px;
		background-color: var(--color-border-dark);
	}

	.entry-dot.featured {
		background-color: var(--color-text);
	}

	.entry-day {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		color: var(--color-text-muted);
		min-width: 1.25rem;
	}

	.entry-title {
		font-weight: 600;
		font-size: 0.85rem;
	}

	.entry-blurb {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		margin: 0.35rem 0;
	}

	.entry-badges {
		display: flex;
		gap: 0.35rem;
	}

	.code-block {
		background: #1a1a1a;
		padding: 0.75rem;
		overflow-x: auto;
	}

	.code-block pre {
		margin: 0;
		background: transparent;
		border: none;
		padding: 0;
	}

	.code-block code {
		font-size: 0.75rem;
		color: #e5e5e5;
		background: transparent;
	}

	/* Badges */
	.badge-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.7rem;
		padding: 0.2rem 0.5rem;
		border: 1px solid;
		font-family: var(--font-mono);
	}

	.badge i {
		font-size: 0.75rem;
	}

	.status-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.7rem;
		padding: 0.2rem 0.5rem;
		border: 1px solid var(--color-border);
		font-family: var(--font-mono);
		background: var(--color-bg);
	}

	.status-badge.featured {
		background: #9c27b020;
		border-color: #9c27b0;
		color: #9c27b0;
	}

	.status-badge.new {
		background: #4caf5020;
		border-color: #4caf50;
		color: #4caf50;
	}

	.status-badge.updated {
		background: #2196f320;
		border-color: #2196f3;
		color: #2196f3;
	}

	/* Tables */
	.example-table {
		width: 100%;
		border-collapse: collapse;
		margin: 1rem 0;
		font-size: 0.85rem;
	}

	.example-table th {
		background: var(--color-hover-bg);
		font-weight: 600;
		text-align: left;
		padding: 0.75rem;
		border: 1px solid var(--color-border);
	}

	.example-table td {
		padding: 0.75rem;
		border: 1px solid var(--color-border);
	}

	.example-table tr:nth-child(even) {
		background: var(--color-hover-bg);
	}

	.action-icon {
		color: var(--color-text-muted);
		cursor: pointer;
		margin-right: 0.5rem;
	}

	.action-icon:hover {
		color: #9c27b0;
	}

	/* Icons */
	.icon-grid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 1rem;
	}

	.icon-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
	}

	.icon-item:hover {
		border-color: var(--color-border-dark);
	}

	.icon-item i {
		font-size: 1.5rem;
		color: var(--color-text-muted);
	}

	.icon-item:hover i {
		color: #9c27b0;
	}

	.icon-item span {
		font-size: 0.65rem;
		color: var(--color-text-muted);
		font-family: var(--font-mono);
	}

	.icon-sizes {
		display: flex;
		align-items: center;
		gap: 2rem;
		padding: 1rem;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		margin-top: 1rem;
	}

	.icon-sizes span {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.icon-sizes i {
		color: var(--color-text);
	}

	/* Terminology */
	.terminology-list {
		margin: 0;
	}

	.terminology-list dt {
		font-family: var(--font-mono);
		font-weight: 600;
		color: #9c27b0;
		margin-top: 1rem;
	}

	.terminology-list dt:first-child {
		margin-top: 0;
	}

	.terminology-list dd {
		margin: 0.25rem 0 0 0;
		font-size: 0.9rem;
		color: var(--color-text-muted);
		line-height: 1.5;
	}

	/* Footer */
	.spec-footer {
		margin-top: 3rem;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border);
		text-align: center;
	}

	.spec-footer p {
		margin: 0.25rem 0;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.spec-footer code {
		font-size: 0.7rem;
	}

	/* Print styles */
	@media print {
		.export-icons,
		.back-link {
			display: none;
		}

		.ux-spec-page {
			max-width: 100%;
			padding: 0;
		}

		.spec-section {
			break-inside: avoid;
			box-shadow: none;
		}

		.spec-header {
			border-bottom: 2px solid #000;
		}
	}

	/* Responsive */
	@media (max-width: 768px) {
		.spec-header {
			flex-direction: column;
			gap: 1rem;
		}

		.principles-grid {
			grid-template-columns: 1fr;
		}

		.color-grid {
			grid-template-columns: repeat(3, 1fr);
		}

		.semantic-colors {
			grid-template-columns: 1fr;
		}

		.icon-grid {
			grid-template-columns: repeat(4, 1fr);
		}

		.icon-sizes {
			flex-wrap: wrap;
			gap: 1rem;
		}
	}

	@media (max-width: 480px) {
		.color-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.icon-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}
</style>
`;
}

/**
 * Generate markdown export content
 */
function generateMarkdownExport(css: ParsedCSS): string {
	const coreColors = css.lightMode.filter((v) => v.category === 'core');
	const schemeColors = css.lightMode.filter((v) => v.category === 'scheme');

	return `# UX Specification - ${CONFIG.projectName}

Generated: ${new Date().toISOString().split('T')[0]}

## Design Principles

### Terminal Aesthetic
Monospace typography, sharp corners, hard offset shadows. Clean, developer-friendly visual language with minimal decoration.

### Information Density
Compact layouts that prioritize content. Timeline-based navigation with sticky markers for context. Badges and ratings inline with content.

### Consistent Spacing
8px base grid. Uniform padding (1rem cards, 0.75rem compact). Gap-based layouts with flex/grid. No arbitrary spacing values.

## Color Palette

### Core Colors

| Variable | Value |
|----------|-------|
${coreColors.map((c) => `| \`${c.name}\` | ${c.value} |`).join('\n')}

### Scheme Colors

| Variable | Value |
|----------|-------|
${schemeColors.map((c) => `| \`${c.name}\` | ${c.value} |`).join('\n')}

## Typography

### Font Stacks

${css.fonts.map((f) => `- **${f.name}**: ${f.value}`).join('\n')}

### Sizes

- H1: 2rem (serif)
- H2: 1.5rem (mono)
- H3: 1.25rem (mono)
- Body: 14px (mono)
- Code: 0.9em (mono)

## Box Types

### Section Box
Default content container with uniform border and offset shadow on hover.
- \`background: var(--color-bg-secondary)\`
- \`border: 1px solid var(--color-border)\`
- \`box-shadow: 2px 2px 0px var(--color-shadow)\` (on hover)

### Filter Box
Shaded background for controls and filters. No shadow.
- \`background: var(--color-bg-secondary)\`
- \`border: 1px solid var(--color-border)\`
- \`padding: 0.75rem\`

### Stats Card
Metric display with colored accent on value/icon.
- \`.stat-icon, .stat-number { color: #9c27b0; }\`
- \`text-align: center\`
- \`padding: 1.5rem 1rem\`

### Timeline Entry
Event cards with badge-only color indication.
- \`border-left: 1px solid var(--color-timeline)\`
- \`.badge { background-color: {color}20; border-color: {color}; }\`

### Featured Entry
Highlighted timeline items with prominent border and shadow.
- \`border: 1px solid var(--color-featured-border)\`
- \`box-shadow: 3px 3px 0px var(--color-shadow)\`
- \`transform: scale(1.02)\`

## Badges

### Category Badges
Colored inline tags for research categories:
- naps (purple #9c27b0)
- toys (orange #ff9800)
- knock (red #f44336)
- mondays (blue-grey #607d8b)
- lasagna (deep orange #ff5722)
- owner (pink #e91e63)
- peeves (brown #795548)
- sunbeams (amber #ffc107)

### Status Badges
- Featured: purple background
- New: green background
- Updated: blue background

## Icons

Font Awesome Thin (fat) icons:
- fa-cat, fa-bed, fa-utensils, fa-glass-water, fa-sun
- fa-heart, fa-star, fa-trophy, fa-calendar-xmark
- fa-wand-magic-sparkles, fa-face-angry, fa-box
- fa-music, fa-cookie-bite, fa-arrow-left, fa-search

## Terminology

- **Nap Score**: 1-5 rating displayed as cat icons indicating content's nap-worthiness
- **Research Category**: Classification tag for blog entries
- **Featured Entry**: Highlighted timeline item with prominent border and shadow
- **Timeline Marker**: Sticky year/month indicators for temporal context
- **Terminal UI**: Design aesthetic emphasizing monospace fonts and sharp corners
- **Offset Shadow**: Hard-edged drop shadow offset 2-3px right and down
`;
}

/**
 * Generate plain text export content
 */
function generateTextExport(css: ParsedCSS): string {
	const coreColors = css.lightMode.filter((v) => v.category === 'core');

	return `UX SPECIFICATION - ${CONFIG.projectName}
${'='.repeat(50)}
Generated: ${new Date().toISOString().split('T')[0]}

DESIGN PRINCIPLES
-----------------

Terminal Aesthetic
  Monospace typography, sharp corners, hard offset shadows.
  Clean, developer-friendly visual language.

Information Density
  Compact layouts prioritizing content.
  Timeline navigation with sticky markers.

Consistent Spacing
  8px base grid. Uniform padding.
  Gap-based flex/grid layouts.

COLOR PALETTE
-------------

Core Colors:
${coreColors.map((c) => `  ${c.name}: ${c.value}`).join('\n')}

TYPOGRAPHY
----------

Font Stacks:
${css.fonts.map((f) => `  ${f.name}: ${f.value}`).join('\n')}

Sizes:
  H1: 2rem (serif)
  H2: 1.5rem (mono)
  H3: 1.25rem (mono)
  Body: 14px (mono)

BOX TYPES
---------

Section Box: Default container with border and hover shadow
Filter Box: Shaded background for controls, no shadow
Stats Card: Metric display with colored accent
Timeline Entry: Event cards with badge-only color
Featured Entry: Highlighted items with border and shadow

BADGES
------

Category Badges: naps, toys, knock, mondays, lasagna, owner, peeves, sunbeams
Status Badges: Featured, New, Updated

ICONS
-----

Font Awesome Thin (fat) class
Common: fa-cat, fa-bed, fa-utensils, fa-sun, fa-heart, fa-star

TERMINOLOGY
-----------

Nap Score: 1-5 rating as cat icons
Research Category: Classification tags
Featured Entry: Highlighted timeline item
Timeline Marker: Sticky year/month indicators
Terminal UI: Monospace + sharp corners aesthetic
Offset Shadow: Hard-edged 2-3px drop shadow
`;
}

/**
 * Generate the markdown documentation file
 */
function generateMarkdownFile(css: ParsedCSS): void {
	const markdownDir = dirname(join(process.cwd(), CONFIG.markdownPath));
	if (!existsSync(markdownDir)) {
		mkdirSync(markdownDir, { recursive: true });
	}

	const content = generateMarkdownExport(css);
	writeFileSync(join(process.cwd(), CONFIG.markdownPath), content);
	console.log(`Generated: ${CONFIG.markdownPath}`);
}

/**
 * Main function
 */
function main() {
	console.log('Generating UX Specification...\n');

	// Parse CSS
	const css = parseCSS();
	console.log(`Parsed ${css.lightMode.length} light mode colors`);
	console.log(`Parsed ${css.darkMode.length} dark mode colors`);
	console.log(`Parsed ${css.fonts.length} font variables`);

	// Ensure output directory exists
	const outputDir = dirname(join(process.cwd(), CONFIG.outputPath));
	if (!existsSync(outputDir)) {
		mkdirSync(outputDir, { recursive: true });
	}

	// Generate Svelte page
	const pageContent = generateSveltePage(css);
	writeFileSync(join(process.cwd(), CONFIG.outputPath), pageContent);
	console.log(`\nGenerated: ${CONFIG.outputPath}`);

	// Generate markdown file
	generateMarkdownFile(css);

	console.log('\nDone! Run `bun run dev` to preview the UX specification.');
}

main();
