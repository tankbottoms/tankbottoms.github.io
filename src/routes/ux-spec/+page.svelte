<script lang="ts">
	import { base } from '$app/paths';

	// Export functions
	function exportPdf() {
		window.print();
	}

	function exportMarkdown() {
		const content = `# UX Specification - Mr. Whiskers Blog

Generated: 2026-01-08

## Table of Contents

1. Design Principles
2. Color Palette
3. Typography
4. Spacing System
5. Layout Patterns
6. Box Types
7. Badges
8. Icons
9. Animation Patterns
10. Interactive States
11. Navigation Patterns
12. Form Controls
13. Responsive Design
14. Accessibility
15. Theme Customization

---

## 1. Design Principles

### Terminal Aesthetic
Monospace typography, sharp corners, hard offset shadows. Clean, developer-friendly visual language with minimal decoration.

### Information Density
Compact layouts that prioritize content. Timeline-based navigation with sticky markers for context. Badges and ratings inline with content.

### Consistent Spacing
8px base grid. Uniform padding (1rem cards, 0.75rem compact). Gap-based layouts with flex/grid. No arbitrary spacing values.

---

## 2. Color Palette

### Core Colors

| Variable | Value |
|----------|-------|
| \`--color-bg\` | #fafafa |
| \`--color-bg-secondary\` | #ffffff |
| \`--color-text\` | #111111 |
| \`--color-text-muted\` | #666666 |
| \`--color-border\` | #e5e5e5 |
| \`--color-border-dark\` | #000000 |
| \`--color-link\` | #0066cc |
| \`--color-hover-bg\` | #e8e8e8 |
| \`--color-shadow\` | #000000 |
| \`--color-timeline\` | #d4d4d4 |

### Accent Color
\`#9c27b0\` (purple) - Replace with your brand color

### Category Colors
- naps: #9c27b0 (purple)
- toys: #ff9800 (orange)
- knock: #f44336 (red)
- mondays: #607d8b (blue-grey)
- lasagna: #ff5722 (deep orange)
- owner: #e91e63 (pink)
- peeves: #795548 (brown)
- sunbeams: #ffc107 (amber)

---

## 3. Typography

### Font Stacks
- **--font-mono**: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace
- **--font-serif**: 'Georgia', 'Times New Roman', serif

### Type Scale
| Element | Font | Size |
|---------|------|------|
| H1 | serif | 2rem |
| H2 | mono | 1.5rem |
| H3 | mono | 1.25rem |
| Body | mono | 14px |
| Badge | mono | 0.7rem |

---

## 4. Spacing System

### Base Unit
8px grid. All values are multiples of 0.25rem (4px).

| Token | Value | Usage |
|-------|-------|-------|
| xs | 0.25rem (4px) | Badge padding |
| sm | 0.5rem (8px) | Button padding |
| md | 1rem (16px) | Card padding |
| lg | 1.5rem (24px) | Section padding |
| xl | 2rem (32px) | Page margins |

### Container Widths
- 750px: Blog content
- 900px: Documentation
- 1200px: Full width

---

## 5. Layout Patterns

### Card Pattern
\`\`\`css
.card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  padding: 1rem;
}
.card:hover {
  border-color: var(--color-border-dark);
  box-shadow: 2px 2px 0px var(--color-shadow);
}
\`\`\`

### Featured Pattern
\`\`\`css
.featured {
  border: 1px solid var(--color-featured-border);
  box-shadow: 3px 3px 0px var(--color-shadow);
  transform: scale(1.02);
}
\`\`\`

---

## 6. Box Types

- **Section Box**: Default container with hover shadow
- **Filter Box**: Controls container, no shadow
- **Stats Card**: Metric display with accent color
- **Timeline Entry**: Event cards with left border
- **Featured Entry**: Highlighted with 3px shadow

---

## 7. Badges

### Category Badge CSS
\`\`\`css
.badge {
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border: 1px solid {color};
  background: {color}20;
  color: {color};
}
\`\`\`

---

## 8. Icons

Font Awesome Thin (fat) class is default.

Common icons: fa-cat, fa-bed, fa-utensils, fa-sun, fa-heart, fa-star, fa-arrow-left, fa-search, fa-filter, fa-file-pdf

---

## 9. Animation Patterns

| Type | Duration | Easing |
|------|----------|--------|
| Hover | 0.2s | ease |
| Fade | 0.3s | ease |
| Spin | 1.5-4s | linear |
| Float | 3s | ease-in-out |

---

## 10. Interactive States

### Button States
- Default: 1px border
- Hover: dark border + 2px shadow
- Active: translate(1px, 1px)
- Disabled: opacity 0.5

### Focus
\`outline: 2px solid var(--color-link); outline-offset: 2px;\`

---

## 11. Navigation Patterns

- Header nav with underline on active
- Back links with arrow icon
- Sticky timeline markers
- Floating action button (64x64px)

---

## 12. Form Controls

### Text Input
\`\`\`css
input {
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--color-text);
}
\`\`\`

### Icon Button
\`\`\`css
.icon-button {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
}
.icon-button:hover { color: #9c27b0; }
\`\`\`

---

## 13. Responsive Design

| Breakpoint | Target |
|------------|--------|
| 480px | Small phones |
| 768px | Tablets |
| 1024px | Desktop |

---

## 14. Accessibility

- WCAG AA color contrast
- Keyboard navigation support
- ARIA labels on icon buttons
- Reduced motion support

---

## 15. Theme Customization

### Files to Modify
1. \`src/app.css\` - Color variables
2. \`static/images/*.svg\` - Theme icons
3. \`static/json/categories.json\` - Categories
4. \`src/routes/+layout.svelte\` - Title/footer

### Preserved Patterns
- 8px spacing grid
- 2px 2px 0px shadow style
- 1px/4px border widths
- Animation timings
`;
		downloadFile(content, 'ux-specification.md', 'text/markdown');
	}

	function exportText() {
		const content = `UX SPECIFICATION - Mr. Whiskers Blog
==================================================
Generated: 2026-01-08

TABLE OF CONTENTS
-----------------
1. Design Principles
2. Color Palette
3. Typography
4. Spacing System
5. Layout Patterns
6. Box Types
7. Badges
8. Icons
9. Animation Patterns
10. Interactive States
11. Navigation Patterns
12. Form Controls
13. Responsive Design
14. Accessibility
15. Theme Customization

DESIGN PRINCIPLES
-----------------
Terminal Aesthetic
  - Monospace typography, sharp corners, hard offset shadows
  - Clean, developer-friendly visual language

Information Density
  - Compact layouts prioritizing content
  - Timeline navigation with sticky markers

Consistent Spacing
  - 8px base grid
  - Gap-based flex/grid layouts

COLOR PALETTE
-------------
Core Colors:
  --color-bg: #fafafa
  --color-bg-secondary: #ffffff
  --color-text: #111111
  --color-text-muted: #666666
  --color-border: #e5e5e5
  --color-border-dark: #000000
  --color-link: #0066cc
  --color-shadow: #000000
  --color-timeline: #d4d4d4

Accent Color: #9c27b0 (purple)

Category Colors:
  naps: #9c27b0 | toys: #ff9800 | knock: #f44336
  mondays: #607d8b | lasagna: #ff5722 | owner: #e91e63
  peeves: #795548 | sunbeams: #ffc107

TYPOGRAPHY
----------
Font Stacks:
  --font-mono: ui-monospace, Cascadia Code, Source Code Pro, Menlo, monospace
  --font-serif: Georgia, Times New Roman, serif

Type Scale:
  H1: 2rem (serif) | H2: 1.5rem (mono) | H3: 1.25rem (mono)
  Body: 14px (mono) | Badge: 0.7rem (mono)

SPACING SYSTEM
--------------
Base: 8px grid (0.25rem = 4px)

  xs: 0.25rem (4px)  - Badge padding
  sm: 0.5rem (8px)   - Button padding
  md: 1rem (16px)    - Card padding
  lg: 1.5rem (24px)  - Section padding
  xl: 2rem (32px)    - Page margins

Container Widths:
  750px (content) | 900px (docs) | 1200px (full)

LAYOUT PATTERNS
---------------
Card: 1px border, 2px 2px shadow on hover
Featured: 1px border, 3px 3px shadow, scale(1.02)

BOX TYPES
---------
Section Box: Container with hover shadow
Filter Box: Controls container, no shadow
Stats Card: Accent color on values/icons
Timeline Entry: Left border, badge colors
Featured Entry: Prominent border + shadow

BADGES
------
Category: background {color}20, border {color}, text {color}
Status: Featured (purple), New (green), Updated (blue)

ICONS
-----
Font Awesome Thin (fat) class
Common: fa-cat, fa-bed, fa-utensils, fa-sun, fa-heart, fa-star

ANIMATION PATTERNS
------------------
Hover: 0.2s ease
Fade: 0.3s ease
Spin: 1.5-4s linear
Float: 3s ease-in-out

INTERACTIVE STATES
------------------
Button: Default -> Hover (shadow) -> Active (translate) -> Disabled (0.5)
Focus: outline 2px solid link color, offset 2px

NAVIGATION
----------
Header: Underline on active
Back links: Arrow icon + text
Timeline: Sticky year/month markers
FAB: 64x64px fixed bottom-left

FORM CONTROLS
-------------
Text Input: Transparent bg, bottom border only
Icon Button: Transparent, muted color -> accent on hover

RESPONSIVE DESIGN
-----------------
480px: Small phones (2-col grids)
768px: Tablets (1-col, stacked headers)
1024px: Desktop (full layout)

ACCESSIBILITY
-------------
- WCAG AA color contrast
- Keyboard navigation
- ARIA labels on icons
- Reduced motion support

THEME CUSTOMIZATION
-------------------
Files to modify:
1. src/app.css - Color variables
2. static/images/*.svg - Theme icons
3. static/json/categories.json - Categories
4. src/routes/+layout.svelte - Title/footer

Preserved patterns:
  - 8px spacing grid
  - 2px 2px 0px shadow style
  - 1px/4px border widths
  - Animation timings

For full specification, see: docs/UX_SPECIFICATION.md
`;
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
</script>

<svelte:head>
	<title>UX Specification | Mr. Whiskers Blog</title>
	<meta name="description" content="Design system documentation for Mr. Whiskers Blog" />
</svelte:head>

<div class="ux-spec-page">
	<header class="spec-header">
		<div class="header-content">
			<a href="{base}/" class="back-link"><i class="fat fa-arrow-left"></i> Back to Timeline</a>
			<h1>UX Specification</h1>
			<p class="subtitle">Design system documentation for Mr. Whiskers Blog</p>
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
			<div class="color-swatch">
				<div class="swatch" style="background: var(--color-bg);"></div>
				<code>--color-bg</code>
				<span class="value">#fafafa</span>
			</div>
			<div class="color-swatch">
				<div class="swatch" style="background: var(--color-bg-secondary);"></div>
				<code>--color-bg-secondary</code>
				<span class="value">#ffffff</span>
			</div>
			<div class="color-swatch">
				<div class="swatch" style="background: var(--color-text);"></div>
				<code>--color-text</code>
				<span class="value">#111111</span>
			</div>
			<div class="color-swatch">
				<div class="swatch" style="background: var(--color-text-muted);"></div>
				<code>--color-text-muted</code>
				<span class="value">#666666</span>
			</div>
			<div class="color-swatch">
				<div class="swatch" style="background: var(--color-border);"></div>
				<code>--color-border</code>
				<span class="value">#e5e5e5</span>
			</div>
			<div class="color-swatch">
				<div class="swatch" style="background: var(--color-border-dark);"></div>
				<code>--color-border-dark</code>
				<span class="value">#000000</span>
			</div>
			<div class="color-swatch">
				<div class="swatch" style="background: var(--color-link);"></div>
				<code>--color-link</code>
				<span class="value">#0066cc</span>
			</div>
			<div class="color-swatch">
				<div class="swatch" style="background: var(--color-hover-bg);"></div>
				<code>--color-hover-bg</code>
				<span class="value">#e8e8e8</span>
			</div>
			<div class="color-swatch">
				<div class="swatch" style="background: var(--color-shadow);"></div>
				<code>--color-shadow</code>
				<span class="value">#000000</span>
			</div>
			<div class="color-swatch">
				<div class="swatch" style="background: var(--color-featured-bg);"></div>
				<code>--color-featured-bg</code>
				<span class="value">#ffffff</span>
			</div>
			<div class="color-swatch">
				<div class="swatch" style="background: var(--color-featured-border);"></div>
				<code>--color-featured-border</code>
				<span class="value">#000000</span>
			</div>
			<div class="color-swatch">
				<div class="swatch" style="background: var(--color-code-bg);"></div>
				<code>--color-code-bg</code>
				<span class="value">#f5f5f5</span>
			</div>
			<div class="color-swatch">
				<div class="swatch" style="background: var(--color-code-text);"></div>
				<code>--color-code-text</code>
				<span class="value">#111111</span>
			</div>
		</div>

		<h3>Scheme Colors</h3>
		<p class="section-desc">Domain-specific colors for timeline, charts, and featured content.</p>
		<div class="color-grid scheme-colors">
			<div class="color-swatch">
				<div class="swatch" style="background: var(--color-timeline);"></div>
				<code>--color-timeline</code>
				<span class="value">#d4d4d4</span>
			</div>
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
			<div class="font-stack">
				<code>--font-mono</code>
				<span>ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace</span>
			</div>
			<div class="font-stack">
				<code>--font-serif</code>
				<span>'Georgia', 'Times New Roman', serif</span>
			</div>
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

	<!-- Spacing System -->
	<section class="spec-section">
		<h2><i class="fat fa-ruler-combined"></i> Spacing System</h2>
		<p class="section-desc">8px base grid system. All spacing values are multiples of 0.25rem (4px).</p>

		<h3>Spacing Scale</h3>
		<table class="example-table">
			<thead>
				<tr>
					<th>Token</th>
					<th>Value</th>
					<th>Usage</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><code>--space-xs</code></td>
					<td>0.25rem (4px)</td>
					<td>Tight gaps, badge padding</td>
				</tr>
				<tr>
					<td><code>--space-sm</code></td>
					<td>0.5rem (8px)</td>
					<td>Button padding, small gaps</td>
				</tr>
				<tr>
					<td><code>--space-md</code></td>
					<td>1rem (16px)</td>
					<td>Card padding, standard gaps</td>
				</tr>
				<tr>
					<td><code>--space-lg</code></td>
					<td>1.5rem (24px)</td>
					<td>Section padding</td>
				</tr>
				<tr>
					<td><code>--space-xl</code></td>
					<td>2rem (32px)</td>
					<td>Page margins</td>
				</tr>
				<tr>
					<td><code>--space-xxl</code></td>
					<td>3rem (48px)</td>
					<td>Major section breaks</td>
				</tr>
			</tbody>
		</table>

		<h3>Container Widths</h3>
		<div class="width-examples">
			<div class="width-item">
				<div class="width-bar" style="width: 62.5%;"></div>
				<span><code>750px</code> - Content (blog posts)</span>
			</div>
			<div class="width-item">
				<div class="width-bar" style="width: 75%;"></div>
				<span><code>900px</code> - Wide (documentation)</span>
			</div>
			<div class="width-item">
				<div class="width-bar" style="width: 100%;"></div>
				<span><code>1200px</code> - Full (post content)</span>
			</div>
		</div>
	</section>

	<!-- Layout Patterns -->
	<section class="spec-section">
		<h2><i class="fat fa-objects-column"></i> Layout Patterns</h2>

		<h3>Page Structure</h3>
		<div class="code-block">
			<pre><code>Page Container (min-height: 100vh)
+-- Header (max-width: 750px, centered)
|   +-- Logo Block (flex, gap 0)
|   |   +-- Theme SVG (56x56px, spinning)
|   |   +-- Title (serif, 1.5rem)
|   |   +-- Subtitle (mono, 0.7rem, muted)
|   +-- Navigation (flex, gap 1rem)
+-- Main Content (flex: 1)
+-- Footer (max-width: 750px, centered)</code></pre>
		</div>

		<h3>Grid Patterns</h3>
		<div class="layout-examples">
			<div class="layout-example">
				<span class="layout-label">Auto-fit Grid</span>
				<div class="grid-demo auto-fit">
					<div class="grid-cell">1</div>
					<div class="grid-cell">2</div>
					<div class="grid-cell">3</div>
				</div>
				<code>grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));</code>
			</div>
			<div class="layout-example">
				<span class="layout-label">Fixed 3-Column</span>
				<div class="grid-demo fixed-3">
					<div class="grid-cell">1</div>
					<div class="grid-cell">2</div>
					<div class="grid-cell">3</div>
				</div>
				<code>grid-template-columns: repeat(3, 1fr);</code>
			</div>
			<div class="layout-example">
				<span class="layout-label">6-Column (Swatches)</span>
				<div class="grid-demo fixed-6">
					<div class="grid-cell small">1</div>
					<div class="grid-cell small">2</div>
					<div class="grid-cell small">3</div>
					<div class="grid-cell small">4</div>
					<div class="grid-cell small">5</div>
					<div class="grid-cell small">6</div>
				</div>
				<code>grid-template-columns: repeat(6, 1fr);</code>
			</div>
		</div>
	</section>

	<!-- Animation Patterns -->
	<section class="spec-section">
		<h2><i class="fat fa-sparkles"></i> Animation Patterns</h2>

		<h3>Keyframes</h3>
		<div class="animation-demos">
			<div class="animation-demo">
				<div class="anim-preview spin-demo">
					<i class="fat fa-cat"></i>
				</div>
				<div class="anim-info">
					<code>@keyframes spin</code>
					<span>Continuous rotation - loading, theme icon</span>
				</div>
			</div>
			<div class="animation-demo">
				<div class="anim-preview float-demo">
					<i class="fat fa-cat"></i>
				</div>
				<div class="anim-info">
					<code>@keyframes float</code>
					<span>Float up/down - decorative elements</span>
				</div>
			</div>
			<div class="animation-demo">
				<div class="anim-preview color-cycle-demo">
					<i class="fat fa-cat"></i>
				</div>
				<div class="anim-info">
					<code>@keyframes color-cycle</code>
					<span>Category color cycling</span>
				</div>
			</div>
		</div>

		<h3>Timing Reference</h3>
		<table class="example-table">
			<thead>
				<tr>
					<th>Type</th>
					<th>Duration</th>
					<th>Easing</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Hover transitions</td>
					<td>0.2s</td>
					<td>ease</td>
				</tr>
				<tr>
					<td>Fade in</td>
					<td>0.3s</td>
					<td>ease</td>
				</tr>
				<tr>
					<td>Slide animations</td>
					<td>0.3s</td>
					<td>ease-out</td>
				</tr>
				<tr>
					<td>Icon rotation (hover)</td>
					<td>0.5s</td>
					<td>ease</td>
				</tr>
				<tr>
					<td>Continuous spin</td>
					<td>1.5s-4s</td>
					<td>linear</td>
				</tr>
				<tr>
					<td>Float</td>
					<td>3s</td>
					<td>ease-in-out</td>
				</tr>
			</tbody>
		</table>
	</section>

	<!-- Interactive States -->
	<section class="spec-section">
		<h2><i class="fat fa-hand-pointer"></i> Interactive States</h2>

		<h3>Button States</h3>
		<div class="state-demos">
			<div class="state-demo">
				<button class="demo-button">Default</button>
				<button class="demo-button" style="border-color: var(--color-border-dark); box-shadow: 2px 2px 0px var(--color-shadow);">Hover</button>
				<button class="demo-button" style="transform: translate(1px, 1px); box-shadow: 1px 1px 0px var(--color-shadow);">Active</button>
				<button class="demo-button" style="opacity: 0.5; cursor: not-allowed;">Disabled</button>
			</div>
		</div>

		<h3>Card States</h3>
		<div class="state-demos card-states">
			<div class="demo-card">Default</div>
			<div class="demo-card hovered">Hover</div>
			<div class="demo-card selected">Selected</div>
		</div>

		<h3>Focus States</h3>
		<div class="focus-demo">
			<code>:focus-visible &lbrace; outline: 2px solid var(--color-link); outline-offset: 2px; &rbrace;</code>
		</div>
	</section>

	<!-- Special Content Blocks -->
	<section class="spec-section">
		<h2><i class="fat fa-rectangle-list"></i> Special Content Blocks</h2>

		<h3>Alert/Highlight Boxes</h3>
		<div class="content-block-demos">
			<div class="highlight-box highlight-warning">
				<h4>Warning</h4>
				<p>Caution or attention needed for this content.</p>
			</div>
			<div class="highlight-box highlight-danger">
				<h4>Danger</h4>
				<p>Critical errors or important warnings.</p>
			</div>
			<div class="highlight-box highlight-info">
				<h4>Info</h4>
				<p>Helpful informational content.</p>
			</div>
			<div class="highlight-box highlight-success">
				<h4>Success</h4>
				<p>Positive outcomes or confirmations.</p>
			</div>
		</div>

		<h3>Quote/Testimony Box</h3>
		<div class="testimony-box">
			<p>"The optimal napping position has been scientifically determined to maximize both comfort and sunbeam absorption."</p>
			<cite>- Mr. Whiskers, PhD</cite>
		</div>

		<h3>Code Block (Dark)</h3>
		<div class="code-block">
			<pre><code>const whiskers = &lbrace;
  name: 'Mr. Whiskers',
  occupation: 'Professional Napper',
  napScore: 5
&rbrace;;</code></pre>
		</div>
	</section>

	<!-- Navigation Patterns -->
	<section class="spec-section">
		<h2><i class="fat fa-compass"></i> Navigation Patterns</h2>

		<h3>Header Navigation</h3>
		<div class="nav-demo-container">
			<nav class="nav-demo">
				<span role="link" class="nav-link-demo">Home</span>
				<span role="link" class="nav-link-demo active">Research</span>
				<span role="link" class="nav-link-demo">About</span>
			</nav>
		</div>

		<h3>Back Link</h3>
		<div class="back-link-demo">
			<span role="link" class="back-link"><i class="fat fa-arrow-left"></i> Back to Timeline</span>
		</div>

		<h3>Sticky Timeline Markers</h3>
		<div class="sticky-demo">
			<div class="sticky-marker inactive">2024</div>
			<div class="sticky-marker active">2025</div>
			<span class="sticky-note">Active markers use accent color with full opacity</span>
		</div>

		<h3>Floating Action Button</h3>
		<div class="fab-demo-container">
			<div class="fab-demo">
				<i class="fat fa-cat"></i>
			</div>
			<code>position: fixed; bottom: 32px; left: 32px;</code>
		</div>
	</section>

	<!-- Form Controls -->
	<section class="spec-section">
		<h2><i class="fat fa-input-text"></i> Form Controls</h2>

		<h3>Text Input</h3>
		<div class="form-demo">
			<input type="text" placeholder="Search posts..." class="demo-input" />
			<code>border-bottom: 1px solid var(--color-text); background: transparent;</code>
		</div>

		<h3>Button Variants</h3>
		<div class="button-variants">
			<button class="demo-button">Standard</button>
			<button class="demo-button icon-only" aria-label="Search"><i class="fat fa-search"></i></button>
			<button class="demo-button primary">Primary</button>
		</div>

		<h3>Icon Button (Borderless)</h3>
		<div class="icon-button-demo">
			<button class="icon-btn-demo" aria-label="Download PDF"><i class="fat fa-file-pdf"></i></button>
			<button class="icon-btn-demo" aria-label="View code"><i class="fat fa-file-code"></i></button>
			<button class="icon-btn-demo" aria-label="View document"><i class="fat fa-file-lines"></i></button>
			<code>background: transparent; border: none; color: var(--color-text-muted);</code>
		</div>
	</section>

	<!-- Responsive Design -->
	<section class="spec-section">
		<h2><i class="fat fa-mobile-screen"></i> Responsive Design</h2>

		<h3>Breakpoints</h3>
		<table class="example-table">
			<thead>
				<tr>
					<th>Breakpoint</th>
					<th>Target</th>
					<th>Grid Changes</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><code>480px</code></td>
					<td>Small phones</td>
					<td>2-column grids, reduced font sizes</td>
				</tr>
				<tr>
					<td><code>640px</code></td>
					<td>Large phones</td>
					<td>3-column grids</td>
				</tr>
				<tr>
					<td><code>768px</code></td>
					<td>Tablets</td>
					<td>Single column layouts, stacked headers</td>
				</tr>
				<tr>
					<td><code>1024px</code></td>
					<td>Small laptops</td>
					<td>Standard desktop layout</td>
				</tr>
				<tr>
					<td><code>1200px</code></td>
					<td>Desktop</td>
					<td>Full 6-column grids</td>
				</tr>
			</tbody>
		</table>

		<h3>Touch Device Support</h3>
		<div class="code-block">
			<pre><code>@media (hover: none) and (pointer: coarse) &lbrace;
  /* Disable hover transforms */
  .card:hover &lbrace; transform: none; &rbrace;
  /* Increase touch targets */
  button, a &lbrace; min-height: 44px; min-width: 44px; &rbrace;
&rbrace;</code></pre>
		</div>
	</section>

	<!-- Accessibility -->
	<section class="spec-section">
		<h2><i class="fat fa-universal-access"></i> Accessibility</h2>

		<h3>Color Contrast (WCAG AA)</h3>
		<table class="example-table">
			<thead>
				<tr>
					<th>Combination</th>
					<th>Ratio</th>
					<th>Status</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Text on background</td>
					<td>15.9:1</td>
					<td><i class="fat fa-check" style="color: #28a745;"></i> Pass</td>
				</tr>
				<tr>
					<td>Muted text on background</td>
					<td>5.7:1</td>
					<td><i class="fat fa-check" style="color: #28a745;"></i> Pass</td>
				</tr>
				<tr>
					<td>Link on background</td>
					<td>4.9:1</td>
					<td><i class="fat fa-check" style="color: #28a745;"></i> Pass</td>
				</tr>
			</tbody>
		</table>

		<h3>ARIA Labels</h3>
		<div class="code-block">
			<pre><code>&lt;!-- Icon-only buttons --&gt;
&lt;button aria-label="Download PDF" title="Download PDF"&gt;
  &lt;i class="fat fa-file-pdf"&gt;&lt;/i&gt;
&lt;/button&gt;

&lt;!-- Interactive filters --&gt;
&lt;button aria-label="Filter by category" aria-pressed="false"&gt;</code></pre>
		</div>

		<h3>Motion Preferences</h3>
		<div class="code-block">
			<pre><code>@media (prefers-reduced-motion: reduce) &lbrace;
  * &lbrace;
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  &rbrace;
&rbrace;</code></pre>
		</div>

		<h3>Keyboard Support</h3>
		<ul class="a11y-list">
			<li><i class="fat fa-check"></i> All interactive elements focusable via Tab</li>
			<li><i class="fat fa-check"></i> Escape closes modals</li>
			<li><i class="fat fa-check"></i> Enter activates buttons and links</li>
			<li><i class="fat fa-check"></i> Focus styles visible on keyboard navigation</li>
		</ul>
	</section>

	<!-- Theme Customization -->
	<section class="spec-section">
		<h2><i class="fat fa-palette"></i> Theme Customization Guide</h2>
		<p class="section-desc">To create a new theme based on this design system, follow these steps.</p>

		<h3>Step 1: Replace Theme Assets</h3>
		<table class="example-table">
			<thead>
				<tr>
					<th>File</th>
					<th>Purpose</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><code>theme-icon.svg</code></td>
					<td>Main icon (56x56px recommended)</td>
				</tr>
				<tr>
					<td><code>theme-icon-color.svg</code></td>
					<td>Color version for interactions</td>
				</tr>
				<tr>
					<td><code>theme-icon-bw.svg</code></td>
					<td>Grayscale version</td>
				</tr>
				<tr>
					<td><code>favicon.svg</code></td>
					<td>Browser tab icon</td>
				</tr>
			</tbody>
		</table>

		<h3>Step 2: Update Colors</h3>
		<ol class="theme-steps">
			<li>Replace accent color <code>#9c27b0</code> with your brand color</li>
			<li>Define 6-8 category colors for badges</li>
			<li>Update CSS variables in <code>src/app.css</code></li>
		</ol>

		<h3>Step 3: Update Content Structure</h3>
		<div class="code-block">
			<pre><code>// static/json/categories.json
&lbrace;
  "categories": [
    &lbrace;
      "id": "your-category",
      "name": "Category Name",
      "shortName": "short",
      "color": "#hexcolor",
      "icon": "fa-icon-name"
    &rbrace;
  ]
&rbrace;</code></pre>
		</div>

		<h3>Files to Modify</h3>
		<table class="example-table">
			<thead>
				<tr>
					<th>File</th>
					<th>Changes</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><code>src/app.css</code></td>
					<td>Color variables, accent color</td>
				</tr>
				<tr>
					<td><code>src/routes/+layout.svelte</code></td>
					<td>Title, subtitle, footer</td>
				</tr>
				<tr>
					<td><code>static/images/*.svg</code></td>
					<td>Theme icons</td>
				</tr>
				<tr>
					<td><code>static/json/categories.json</code></td>
					<td>Category definitions</td>
				</tr>
			</tbody>
		</table>

		<h3>Preserved Patterns</h3>
		<p class="section-desc">These should remain unchanged to maintain design consistency:</p>
		<ul class="preserve-list">
			<li>Spacing system (8px grid)</li>
			<li>Typography scale</li>
			<li>Box shadow style (2px 2px 0px)</li>
			<li>Border widths (1px standard, 4px accent)</li>
			<li>Animation durations</li>
			<li>Responsive breakpoints</li>
		</ul>
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

			<dt>CSS Variables</dt>
			<dd>Custom properties defined in :root that enable consistent theming and easy customization.</dd>

			<dt>8px Grid</dt>
			<dd>Base spacing unit where all spacing values are multiples of 0.25rem (4px).</dd>
		</dl>
	</section>

	<footer class="spec-footer">
		<p>Generated: 2026-01-08</p>
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

	/* Spacing System */
	.width-examples {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.width-item {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.width-bar {
		height: 8px;
		background: #9c27b0;
		min-width: 50px;
	}

	.width-item span {
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	/* Layout Patterns */
	.layout-examples {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.layout-example {
		padding: 1rem;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
	}

	.layout-label {
		display: block;
		font-size: 0.7rem;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.5rem;
	}

	.grid-demo {
		display: grid;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.grid-demo.auto-fit {
		grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
	}

	.grid-demo.fixed-3 {
		grid-template-columns: repeat(3, 1fr);
	}

	.grid-demo.fixed-6 {
		grid-template-columns: repeat(6, 1fr);
	}

	.grid-cell {
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		padding: 1rem;
		text-align: center;
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	.grid-cell.small {
		padding: 0.5rem;
	}

	.layout-example > code {
		font-size: 0.7rem;
		color: var(--color-text-muted);
		background: transparent;
		padding: 0;
	}

	/* Animation Patterns */
	.animation-demos {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.animation-demo {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
	}

	.anim-preview {
		width: 50px;
		height: 50px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		color: var(--color-text);
	}

	.spin-demo i {
		animation: spin 2s linear infinite;
	}

	.float-demo i {
		animation: float 3s ease-in-out infinite;
	}

	.color-cycle-demo i {
		animation: color-cycle 4s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	@keyframes float {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-10px); }
	}

	@keyframes color-cycle {
		0% { color: #9c27b0; }
		14% { color: #ff9800; }
		28% { color: #f44336; }
		42% { color: #607d8b; }
		57% { color: #ff5722; }
		71% { color: #e91e63; }
		85% { color: #795548; }
		100% { color: #9c27b0; }
	}

	.anim-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.anim-info code {
		font-size: 0.8rem;
	}

	.anim-info span {
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	/* Interactive States */
	.state-demos {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		margin-bottom: 1rem;
	}

	.state-demo {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.demo-button {
		font-family: var(--font-mono);
		font-size: 0.8rem;
		padding: 0.5rem 0.75rem;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		cursor: pointer;
		color: var(--color-text);
	}

	.demo-button.icon-only {
		padding: 0.5rem;
	}

	.demo-button.primary {
		background: #9c27b020;
		border-color: #9c27b0;
		color: #9c27b0;
	}

	.card-states {
		display: flex;
		gap: 1rem;
	}

	.demo-card {
		padding: 1rem;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		font-size: 0.8rem;
		color: var(--color-text-muted);
		min-width: 100px;
		text-align: center;
	}

	.demo-card.hovered {
		border-color: var(--color-border-dark);
		box-shadow: 2px 2px 0px var(--color-shadow);
	}

	.demo-card.selected {
		border-color: #9c27b0;
		box-shadow: 2px 2px 0px #9c27b0;
	}

	.focus-demo {
		padding: 1rem;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
	}

	.focus-demo code {
		font-size: 0.75rem;
	}

	/* Special Content Blocks */
	.content-block-demos {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.highlight-box h4 {
		margin: 0 0 0.5rem 0;
		font-family: var(--font-serif);
		font-size: 0.9rem;
	}

	.highlight-box p {
		margin: 0;
		font-size: 0.8rem;
	}

	.highlight-warning {
		background: rgba(255,193,7,0.15);
		border-color: #ffc107;
	}

	.highlight-danger {
		background: rgba(220,53,69,0.15);
		border-color: #dc3545;
	}

	.highlight-info {
		background: rgba(23,162,184,0.15);
		border-color: #17a2b8;
	}

	.highlight-success {
		background: rgba(40,167,69,0.15);
		border-color: #28a745;
	}

	.testimony-box {
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-left: 4px solid var(--color-border-dark);
		padding: 1rem 1.25rem;
		margin-bottom: 1.5rem;
	}

	.testimony-box p {
		font-family: var(--font-serif);
		font-style: italic;
		margin: 0 0 0.5rem 0;
	}

	.testimony-box cite {
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	/* Navigation Patterns */
	.nav-demo-container {
		padding: 1rem;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		margin-bottom: 1rem;
	}

	.nav-demo {
		display: flex;
		gap: 1rem;
	}

	.nav-link-demo {
		text-decoration: none;
		color: var(--color-text);
		font-size: 0.85rem;
		transition: all 0.2s ease;
	}

	.nav-link-demo:hover {
		text-decoration: underline;
		text-underline-offset: 8px;
	}

	.nav-link-demo.active {
		text-decoration: underline;
		text-decoration-thickness: 2px;
		text-underline-offset: 8px;
	}

	.back-link-demo {
		padding: 1rem;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		margin-bottom: 1rem;
	}

	.sticky-demo {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		margin-bottom: 1rem;
	}

	.sticky-marker {
		font-family: var(--font-mono);
		font-size: 1rem;
		font-weight: 600;
		padding: 0.25rem 0.5rem;
	}

	.sticky-marker.inactive {
		opacity: 0.4;
		color: var(--color-text);
	}

	.sticky-marker.active {
		opacity: 1;
		color: #9c27b0;
	}

	.sticky-note {
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.fab-demo-container {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		padding: 1rem;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
	}

	.fab-demo {
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		font-size: 1.5rem;
		color: var(--color-text);
		cursor: pointer;
		transition: transform 0.2s ease;
	}

	.fab-demo:hover {
		transform: scale(1.1);
	}

	.fab-demo-container code {
		font-size: 0.7rem;
		color: var(--color-text-muted);
		background: transparent;
		padding: 0;
	}

	/* Form Controls */
	.form-demo {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		margin-bottom: 1rem;
	}

	.demo-input {
		width: 100%;
		max-width: 300px;
		font-family: var(--font-mono);
		font-size: 1rem;
		background: transparent;
		border: none;
		border-bottom: 1px solid var(--color-text);
		padding: 0.5rem 0;
		color: var(--color-text);
	}

	.demo-input:focus {
		outline: none;
		border-bottom-width: 2px;
	}

	.demo-input::placeholder {
		color: var(--color-text-muted);
		opacity: 0.6;
	}

	.form-demo code {
		font-size: 0.7rem;
		color: var(--color-text-muted);
		background: transparent;
		padding: 0;
	}

	.button-variants {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
		margin-bottom: 1rem;
	}

	.icon-button-demo {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
	}

	.icon-btn-demo {
		background: transparent;
		border: none;
		padding: 0;
		cursor: pointer;
		color: var(--color-text-muted);
		font-size: 1.5rem;
		transition: color 0.2s ease;
	}

	.icon-btn-demo:hover {
		color: #9c27b0;
	}

	.icon-button-demo code {
		font-size: 0.7rem;
		color: var(--color-text-muted);
		background: transparent;
		padding: 0;
	}

	/* Accessibility */
	.a11y-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.a11y-list li {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		font-size: 0.85rem;
	}

	.a11y-list i {
		color: #28a745;
	}

	/* Theme Customization */
	.theme-steps {
		padding-left: 1.5rem;
		margin: 0 0 1.5rem 0;
	}

	.theme-steps li {
		margin-bottom: 0.5rem;
		font-size: 0.85rem;
	}

	.preserve-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem;
	}

	.preserve-list li {
		font-size: 0.8rem;
		color: var(--color-text-muted);
		padding: 0.25rem 0;
	}

	.preserve-list li::before {
		content: "- ";
		color: #9c27b0;
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

		.grid-demo.fixed-6 {
			grid-template-columns: repeat(3, 1fr);
		}

		.content-block-demos {
			grid-template-columns: 1fr;
		}

		.card-states {
			flex-wrap: wrap;
		}

		.state-demo {
			width: 100%;
		}

		.preserve-list {
			grid-template-columns: 1fr;
		}

		.sticky-demo {
			flex-wrap: wrap;
		}
	}

	@media (max-width: 480px) {
		.color-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.icon-grid {
			grid-template-columns: repeat(3, 1fr);
		}

		.grid-demo.fixed-3,
		.grid-demo.fixed-6 {
			grid-template-columns: repeat(2, 1fr);
		}

		.animation-demo {
			flex-direction: column;
			text-align: center;
		}

		.anim-info {
			align-items: center;
		}

		.nav-demo {
			flex-direction: column;
			gap: 0.5rem;
		}

		.icon-button-demo {
			flex-wrap: wrap;
		}
	}
</style>
