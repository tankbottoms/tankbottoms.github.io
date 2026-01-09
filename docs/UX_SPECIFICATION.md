# UX Specification - Design System

**Project:** Mr. Whiskers Blog
**Version:** 1.0
**Generated:** 2026-01-08

This specification documents the complete design system. Another project can use this document to create a stylistically identical site with a different theme by:

1. Replacing `theme.svg` with your own mascot/logo
2. Updating the accent color (default: `#9c27b0` purple)
3. Replacing category names and icons
4. Updating content while preserving structure

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing System](#4-spacing-system)
5. [Layout Patterns](#5-layout-patterns)
6. [Component Catalog](#6-component-catalog)
7. [Animation Patterns](#7-animation-patterns)
8. [Icon System](#8-icon-system)
9. [Responsive Design](#9-responsive-design)
10. [Interactive States](#10-interactive-states)
11. [Special Content Blocks](#11-special-content-blocks)
12. [Navigation Patterns](#12-navigation-patterns)
13. [Form Controls](#13-form-controls)
14. [Accessibility](#14-accessibility)
15. [Theme Customization Guide](#15-theme-customization-guide)

---

## 1. Design Philosophy

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Terminal Aesthetic** | Monospace-first typography, sharp corners (no border-radius on functional elements), hard offset shadows creating a layered paper effect |
| **Information Density** | Compact layouts prioritizing content over decoration. Timeline-based navigation with sticky markers for temporal context |
| **Consistent Spacing** | 8px base grid. Uniform padding values. Gap-based flex/grid layouts |
| **Minimal Decoration** | Color accents on values/badges only, not on containers. No gratuitous visual effects |
| **Semantic Hierarchy** | Clear visual distinction between content levels using typography weight, size, and spacing |

### Design Rules

1. **No border-radius** on functional containers (cards, boxes, buttons)
2. **Hard offset shadows**: `box-shadow: 2px 2px 0px var(--color-shadow)` (3px for featured)
3. **1px borders** on containers, 4px left accent borders on highlighted content
4. **Color in content only**: Badges, icons, values get color; containers stay neutral
5. **Monospace body text**: Reinforces terminal/developer aesthetic
6. **Serif headings**: H1 only uses serif for visual hierarchy break

---

## 2. Color System

### CSS Variable Architecture

All colors must be defined as CSS variables. Never hardcode hex values in components.

### Light Mode (Default)

```css
:root, [data-theme='light'] {
  /* Backgrounds */
  --color-bg: #fafafa;              /* Page background */
  --color-bg-secondary: #ffffff;    /* Card/box backgrounds */

  /* Text */
  --color-text: #111111;            /* Primary text */
  --color-text-muted: #666666;      /* Secondary text, metadata */

  /* Borders */
  --color-border: #e5e5e5;          /* Standard borders (1px) */
  --color-border-dark: #000000;     /* Accent borders, hover states */

  /* Interactive */
  --color-link: #0066cc;            /* Hyperlinks */
  --color-hover-bg: #e8e8e8;        /* Hover state backgrounds */
  --color-shadow: #000000;          /* Box shadows */

  /* Special */
  --color-timeline: #d4d4d4;        /* Timeline connector line */
  --color-featured-bg: #ffffff;     /* Featured item background */
  --color-featured-border: #000000; /* Featured item border */
  --color-code-bg: #f5f5f5;         /* Code block background */
  --color-code-text: #111111;       /* Code text */
}
```

### Dark Mode

```css
[data-theme='dark'] {
  --color-bg: #0a0a0a;
  --color-bg-secondary: #1a1a1a;
  --color-text: #e5e5e5;
  --color-text-muted: #a0a0a0;
  --color-border: #2a2a2a;
  --color-border-dark: #e5e5e5;
  --color-link: #5c9fd8;
  --color-hover-bg: #1a1a1a;
  --color-shadow: #000000;
  --color-timeline: #3a3a3a;
  --color-featured-bg: #1a1a1a;
  --color-featured-border: #e5e5e5;
  --color-code-bg: #0f0f0f;
  --color-code-text: #d4d4d4;
}
```

### Accent Color (Theme Primary)

```css
--color-accent: #9c27b0; /* Purple - replace for your theme */
```

Used for:

- Section heading icons
- Stat card values and icons
- Active filter states
- Featured badges
- Hover states on icons
- Timeline marker active state

### Category Colors

Define category-specific colors for badges and tags:

| Category | Hex | Usage |
|----------|-----|-------|
| Primary (naps) | `#9c27b0` | Purple - main category |
| Secondary (toys) | `#ff9800` | Orange |
| Tertiary (chaos) | `#f44336` | Red |
| Quaternary (mondays) | `#607d8b` | Blue-grey |
| Quinary (food) | `#ff5722` | Deep orange |
| Senary (appreciation) | `#e91e63` | Pink |
| Septenary (peeves) | `#795548` | Brown |
| Octonary (comfort) | `#ffc107` | Amber |

### Semantic Colors (Alerts)

| State | Background | Border |
|-------|------------|--------|
| Warning | `rgba(255,193,7,0.15)` | `#ffc107` |
| Danger | `rgba(220,53,69,0.15)` | `#dc3545` |
| Info | `rgba(23,162,184,0.15)` | `#17a2b8` |
| Success | `rgba(40,167,69,0.15)` | `#28a745` |
| Primary | `rgba(0,123,255,0.15)` | `#007bff` |

---

## 3. Typography

### Font Stacks

```css
:root {
  --font-mono: ui-monospace, 'Cascadia Code', 'Source Code Pro',
               Menlo, Consolas, 'DejaVu Sans Mono', monospace;
  --font-serif: 'Georgia', 'Times New Roman', serif;
}
```

### Type Scale

| Element | Font | Size | Weight | Line Height |
|---------|------|------|--------|-------------|
| H1 | serif | 2rem | 600 | 1.2 |
| H2 | mono | 1.5rem | 600 | 1.3 |
| H3 | mono | 1.25rem | 600 | 1.4 |
| Body | mono | 14px | 400 | 1.6 |
| Small | mono | 0.875rem | 400 | 1.5 |
| Caption | mono | 0.75rem | 400 | 1.4 |
| Code | mono | 0.9em | 400 | 1.4 |
| Badge | mono | 0.7rem | 400 | 1 |

### Text Colors

- **Primary**: `var(--color-text)` - Main content
- **Muted**: `var(--color-text-muted)` - Metadata, secondary info
- **Link**: `var(--color-link)` - Hyperlinks
- **Accent**: `var(--color-accent)` - Emphasized values

### Link Styling

```css
a {
  color: var(--color-link);
  text-decoration: underline;
  text-decoration-skip-ink: auto;
}

a:hover {
  text-decoration-thickness: 2px;
}
```

---

## 4. Spacing System

### Base Unit

8px grid system. All spacing values are multiples of 0.25rem (4px).

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | 0.25rem (4px) | Tight gaps, badge padding |
| `--space-sm` | 0.5rem (8px) | Button padding, small gaps |
| `--space-md` | 1rem (16px) | Card padding, standard gaps |
| `--space-lg` | 1.5rem (24px) | Section padding |
| `--space-xl` | 2rem (32px) | Page margins |
| `--space-xxl` | 3rem (48px) | Major section breaks |

### Container Widths

| Container | Max Width | Usage |
|-----------|-----------|-------|
| Content | 750px | Blog posts, main pages |
| Wide | 900px | UX spec, documentation |
| Full | 1200px | Post content area |

### Standard Padding

- **Cards**: 1rem (compact: 0.75rem)
- **Sections**: 1.5rem
- **Page**: 2rem vertical, 0.5in horizontal
- **Buttons**: 0.5rem vertical, 0.75rem horizontal

---

## 5. Layout Patterns

### Page Structure

```
Page Container (min-height: 100vh)
├── Header (max-width: 750px, centered)
│   ├── Logo Block (flex, gap 0)
│   │   ├── Theme SVG (56x56px, spinning)
│   │   ├── Title (serif, 1.5rem)
│   │   └── Subtitle (mono, 0.7rem, muted)
│   └── Navigation (flex, gap 1rem)
├── Main Content (flex: 1)
└── Footer (max-width: 750px, centered)
```

### Card Pattern

```css
.card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  padding: 1rem;
  transition: all 0.2s ease;
}

.card:hover {
  border-color: var(--color-border-dark);
  box-shadow: 2px 2px 0px var(--color-shadow);
}
```

### Section Box Pattern

```css
.section-box {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  padding: 1.5rem;
  margin-bottom: 3rem;
}
```

### Featured Item Pattern

```css
.featured {
  background: var(--color-featured-bg);
  border: 1px solid var(--color-featured-border);
  box-shadow: 3px 3px 0px var(--color-shadow);
  transform: scale(1.02);
  transform-origin: left center;
}

.featured:hover {
  box-shadow: 6px 6px 0px var(--color-shadow);
  transform: scale(1.04);
}
```

### Grid Layouts

```css
/* Auto-fit grid */
.grid-auto {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

/* Fixed columns */
.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

/* Color swatches (6 columns) */
.grid-6 {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.75rem;
}
```

---

## 6. Component Catalog

### Rating Component

Visual rating display using theme icons (1-5 scale).

**Sizes:**

| Size | Icon | Gap |
|------|------|-----|
| sm | 18px | 1px |
| md | 22px | 2px |
| lg | 28px | 3px |

**States:**

- **Filled**: Full opacity, accent color
- **Empty**: 25% opacity, grayscale
- **Hover (filled)**: Scale 1.5, rotate 360deg (0.5s)
- **Hover (empty)**: Opacity 0.4

### Filter Component

Interactive filter bar with icon toggles.

```css
.filter-item {
  cursor: pointer;
  transition: transform 0.2s;
}

.filter-item:hover {
  transform: scale(1.5);
}

.filter-item.active {
  /* Color SVG shown */
}

.filter-item.inactive {
  /* Grayscale SVG, reduced opacity */
}
```

### Badge Component

Inline colored tag with icon.

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border: 1px solid;
  /* Colors set dynamically per category */
  background-color: {color}20; /* 12% opacity */
  border-color: {color};
  color: {color};
}

.badge:hover {
  transform: translateY(-1px);
  box-shadow: 2px 2px 0px var(--color-shadow);
}

.badge i {
  font-size: 0.75rem;
}
```

### Stats Card

Metric display with icon and label.

```css
.stats-card {
  padding: 1.5rem 1rem;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  text-align: center;
}

.stats-card:hover {
  border-color: var(--color-border-dark);
  box-shadow: 2px 2px 0px var(--color-shadow);
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 1.75rem;
  color: var(--color-accent);
  margin-bottom: 0.75rem;
}

.stat-number {
  font-family: var(--font-mono);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-accent);
}

.stat-label {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

### Timeline Entry

Event card in chronological list.

```css
.timeline {
  border-left: 1px solid var(--color-timeline);
  padding: 0.5rem 0;
}

.timeline-item {
  padding: 0.5rem 0.75rem;
  margin-left: 1rem;
  position: relative;
  cursor: pointer;
  transition: all 0.15s ease;
}

.timeline-item:hover {
  background: var(--color-hover-bg);
}

.timeline-dot {
  position: absolute;
  left: calc(-1rem - 0.75rem - 3px);
  top: 4px;
  width: 6px;
  height: 6px;
  background: var(--color-border-dark);
  outline: 2px solid var(--color-bg);
}
```

### Modal/Popup

Overlay dialog pattern.

```css
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  max-width: 500px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  box-shadow: 8px 8px 0px var(--color-shadow);
  max-height: 80vh;
  overflow-y: auto;
}
```

### Loader

Loading state indicator.

```css
.loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loader-icon {
  width: 64px;
  height: 64px;
  animation: spin 1.5s linear infinite;
}

.loader-text {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--color-text-muted);
}
```

---

## 7. Animation Patterns

### Keyframes

```css
/* Continuous rotation */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Float up and down */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* Color cycling through categories */
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

/* Fade in */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide up */
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Animation Durations

| Type | Duration | Easing |
|------|----------|--------|
| Hover transitions | 0.2s | ease |
| Fade in | 0.3s | ease |
| Slide animations | 0.3s | ease-out |
| Icon rotation (hover) | 0.5s | ease |
| Continuous spin (slow) | 1.5s-4s | linear |
| Float | 3s | ease-in-out |

### Hover Transitions

```css
/* Standard hover transition */
.interactive {
  transition: all 0.2s ease;
}

/* Transform on hover */
.lift-on-hover:hover {
  transform: translateY(-2px);
}

/* Scale on hover */
.grow-on-hover:hover {
  transform: scale(1.1);
}
```

---

## 8. Icon System

### Font Awesome Setup

Load Font Awesome with all styles:

```html
<link rel="stylesheet" href="/fontawesome/css/all.min.css" />
```

### Default Style

Use **Thin** style (`fat` class) as project default:

```html
<i class="fat fa-cat"></i>
```

### Icon Sizes

| Class | Size |
|-------|------|
| fa-xs | 0.75em |
| fa-sm | 0.875em |
| (default) | 1em |
| fa-lg | 1.25em |
| fa-xl | 1.5em |
| fa-2x | 2em |

### Common Icons

| Usage | Icon | Class |
|-------|------|-------|
| Back/Return | Arrow left | `fa-arrow-left` |
| Search | Magnifying glass | `fa-search` |
| Filter | Filter | `fa-filter` |
| View/Eye | Eye | `fa-eye` |
| Download PDF | File PDF | `fa-file-pdf` |
| Download MD | File code | `fa-file-code` |
| Download TXT | File lines | `fa-file-lines` |
| Settings | Gear | `fa-gear` |
| Close | X mark | `fa-xmark` |
| Check | Check | `fa-check` |
| Copy | Copy | `fa-copy` |
| External link | Arrow up right | `fa-arrow-up-right-from-square` |

### Icon in Headers

```html
<h2><i class="fat fa-palette"></i> Section Title</h2>
```

```css
h2 i {
  color: var(--color-accent);
  margin-right: 0.5rem;
}
```

---

## 9. Responsive Design

### Breakpoints

| Breakpoint | Target |
|------------|--------|
| 480px | Small phones |
| 640px | Large phones |
| 768px | Tablets |
| 1024px | Small laptops |
| 1200px | Desktop |

### Mobile Adjustments

```css
@media (max-width: 768px) {
  /* Stack header vertically */
  .header {
    flex-direction: column;
    text-align: center;
  }

  /* Reduce grid columns */
  .grid-3 {
    grid-template-columns: 1fr;
  }

  .grid-6 {
    grid-template-columns: repeat(3, 1fr);
  }

  /* Reduce spacing */
  .section-box {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .grid-6 {
    grid-template-columns: repeat(2, 1fr);
  }

  h1 {
    font-size: 1.75rem;
  }
}
```

### Touch Device Considerations

```css
@media (hover: none) and (pointer: coarse) {
  /* Disable hover transforms on touch */
  .card:hover {
    transform: none;
  }

  /* Increase touch targets */
  button, a {
    min-height: 44px;
    min-width: 44px;
  }
}
```

---

## 10. Interactive States

### Button States

```css
.button {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.button:hover {
  border-color: var(--color-border-dark);
  box-shadow: 2px 2px 0px var(--color-shadow);
}

.button:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0px var(--color-shadow);
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### Link States

```css
a {
  color: var(--color-link);
  text-decoration: underline;
}

a:hover {
  text-decoration-thickness: 2px;
}

a:visited {
  color: var(--color-link); /* Keep same color */
}

a:focus-visible {
  outline: 2px solid var(--color-link);
  outline-offset: 2px;
}
```

### Card States

```css
.card {
  border: 1px solid var(--color-border);
  transition: all 0.2s ease;
}

.card:hover {
  border-color: var(--color-border-dark);
  box-shadow: 2px 2px 0px var(--color-shadow);
}

.card.selected {
  border-color: var(--color-accent);
  box-shadow: 2px 2px 0px var(--color-accent);
}
```

### Focus States

```css
:focus-visible {
  outline: 2px solid var(--color-link);
  outline-offset: 2px;
}

button:focus-visible {
  border-color: var(--color-border-dark);
}
```

---

## 11. Special Content Blocks

### Highlight/Alert Box

```css
.highlight-{type} {
  background: rgba({color}, 0.15);
  border-left: 4px solid {color};
  padding: 1rem;
  margin: 1.5rem 0;
  border-radius: 0 5px 5px 0;
}

.highlight-{type} h4 {
  margin-top: 0;
  margin-bottom: 0.75rem;
  font-family: var(--font-serif);
}
```

### Testimony/Quote Box

```css
.testimony-box {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-border-dark);
  padding: 1rem 1.25rem;
  margin: 1.5rem 0;
  font-family: var(--font-serif);
}

.testimony-box strong {
  font-weight: 700;
  color: var(--color-text);
}
```

### Code Block

```css
pre {
  background: var(--color-code-bg);
  padding: 1rem;
  overflow-x: auto;
  border: 1px solid var(--color-border);
  margin: 1rem 0;
}

code {
  background: var(--color-code-bg);
  padding: 0.2rem 0.4rem;
  font-size: 0.9em;
}

/* Dark code blocks for examples */
.code-block-dark {
  background: #1a1a1a;
  color: #e5e5e5;
}
```

### Table

```css
table {
  width: 100%;
  border-collapse: collapse;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  margin: 2rem 0;
}

th {
  background: var(--color-hover-bg);
  font-weight: 600;
  text-align: left;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
}

td {
  padding: 0.75rem;
  border: 1px solid var(--color-border);
}

tr:nth-child(even) {
  background: var(--color-hover-bg);
}
```

---

## 12. Navigation Patterns

### Header Navigation

```css
.nav {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.nav-link {
  text-decoration: none;
  color: var(--color-text);
  transition: all 0.2s ease;
}

.nav-link:hover {
  text-decoration: underline;
  text-underline-offset: 8px;
}

.nav-link.active {
  text-decoration: underline;
  text-decoration-thickness: 2px;
}
```

### Back Link

```css
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-link);
  text-decoration: underline;
  font-size: 0.875rem;
}

.back-link:hover {
  text-decoration-thickness: 2px;
}
```

### Floating Action Button

```css
.fab {
  position: fixed;
  bottom: 32px;
  left: 32px;
  width: 64px;
  height: 64px;
  z-index: 1000;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.fab:hover {
  transform: scale(1.1);
}

.fab.hidden {
  opacity: 0;
  pointer-events: none;
}
```

### Sticky Markers (Timeline)

```css
.year-marker {
  position: sticky;
  top: 1rem;
  z-index: 10;
  font-family: var(--font-mono);
  font-size: 1.1rem;
  font-weight: 600;
  opacity: 0.4;
  transition: opacity 0.3s, color 0.3s;
}

.year-marker.sticky-active {
  opacity: 1;
  color: var(--color-accent);
}
```

---

## 13. Form Controls

### Text Input

```css
input[type="text"],
input[type="search"] {
  width: 100%;
  font-family: var(--font-mono);
  font-size: 1rem;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--color-text);
  padding: 0.5rem 0;
  color: var(--color-text);
}

input:focus {
  outline: none;
  border-bottom-width: 2px;
}

input::placeholder {
  color: var(--color-text-muted);
  opacity: 0.6;
}
```

### Button

```css
button {
  font-family: var(--font-mono);
  font-size: 0.875rem;
  padding: 0.5rem 0.75rem;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--color-text);
}

button:hover {
  border-color: var(--color-border-dark);
  box-shadow: 2px 2px 0px var(--color-shadow);
}
```

### Icon Button (Borderless)

```css
.icon-button {
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  color: var(--color-text-muted);
  font-size: 1.5rem;
  transition: color 0.2s ease;
}

.icon-button:hover {
  color: var(--color-accent);
}
```

### Select

```css
select {
  font-family: var(--font-mono);
  font-size: 0.875rem;
  padding: 0.5rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  color: var(--color-text);
}
```

---

## 14. Accessibility

### Color Contrast

All text meets WCAG AA contrast requirements:

| Combination | Contrast |
|-------------|----------|
| Text on background | 15.9:1 |
| Muted text on background | 5.7:1 |
| Link on background | 4.9:1 |

### Semantic HTML

- Use proper heading hierarchy (h1 > h2 > h3)
- Use `<nav>` for navigation
- Use `<main>` for main content
- Use `<article>` for blog posts
- Use `<button>` for clickable actions
- Use `<a>` for navigation links

### ARIA Labels

```html
<!-- Icon-only buttons -->
<button aria-label="Download PDF" title="Download PDF">
  <i class="fat fa-file-pdf"></i>
</button>

<!-- Interactive elements -->
<button aria-label="Filter by category" aria-pressed="false">
```

### Keyboard Support

- All interactive elements focusable via Tab
- Escape closes modals
- Enter activates buttons and links
- Focus styles visible on keyboard navigation

### Motion Preferences

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 15. Theme Customization Guide

To create a new theme based on this design system:

### Step 1: Replace Theme Assets

1. **Logo/Mascot SVG**: Replace files in `/static/images/`:
   - `theme-icon.svg` - Main icon (56x56px recommended)
   - `theme-icon-color.svg` - Color version for interactions
   - `theme-icon-bw.svg` - Grayscale version
   - `favicon.svg` - Browser tab icon
   - `favicon.ico` - Fallback favicon

2. **Update manifest**: Edit `manifest.json` with your theme name and colors

### Step 2: Update Colors

1. **Accent Color**: Replace `#9c27b0` with your primary brand color
2. **Category Colors**: Define 6-8 category colors for badges
3. **Update CSS variables** in `src/app.css`

### Step 3: Update Content Structure

1. **Categories**: Edit `/static/json/categories.json`:

```json
{
  "categories": [
    {
      "id": "your-category",
      "name": "Category Name",
      "shortName": "short",
      "description": "Description",
      "color": "#hexcolor",
      "icon": "fa-icon-name"
    }
  ]
}
```

2. **Site Title**: Update in `+layout.svelte`:
   - Header title and subtitle
   - Footer text
   - Meta tags

3. **Rating System**: Rename "Nap Score" to your metric name

### Step 4: Content

1. **Blog Posts**: Add markdown files to `src/docs/posts/`
2. **About Page**: Update `src/routes/about/+page.svelte`
3. **Research Page**: Update category descriptions

### Files to Modify

| File | Changes |
|------|---------|
| `src/app.css` | Color variables, accent color |
| `src/routes/+layout.svelte` | Title, subtitle, footer |
| `static/images/*.svg` | Theme icons |
| `static/json/categories.json` | Category definitions |
| `CLAUDE.md` | Project-specific instructions |

### Preserved Patterns

These should remain unchanged to maintain design consistency:

- Spacing system (8px grid)
- Typography scale
- Box shadow style (2px 2px 0px)
- Border widths (1px standard, 4px accent)
- Animation durations
- Responsive breakpoints
- Component structure

---

## Appendix: CSS Variables Reference

```css
:root {
  /* Fonts */
  --font-mono: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace;
  --font-serif: 'Georgia', 'Times New Roman', serif;

  /* Colors - Light Mode */
  --color-bg: #fafafa;
  --color-bg-secondary: #ffffff;
  --color-text: #111111;
  --color-text-muted: #666666;
  --color-border: #e5e5e5;
  --color-border-dark: #000000;
  --color-link: #0066cc;
  --color-hover-bg: #e8e8e8;
  --color-shadow: #000000;
  --color-timeline: #d4d4d4;
  --color-featured-bg: #ffffff;
  --color-featured-border: #000000;
  --color-code-bg: #f5f5f5;
  --color-code-text: #111111;

  /* Accent */
  --color-accent: #9c27b0;
}
```

---

*This specification is designed to be portable. Copy this document to any new project, replace theme assets and accent colors, and maintain the same visual language with entirely different content.*
