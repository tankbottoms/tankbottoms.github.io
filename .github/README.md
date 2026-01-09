# Mr. Whiskers Blog

A minimal, timeline-style blog template built with SvelteKit 5. Designed for IPFS-first deployment with multi-platform mirror support.

## Features

- Timeline-based landing page with chronological post ordering
- Nap Score rating system (1-5) for content evaluation
- Research category tagging and filtering
- Full IPFS/IPNS support with relative path conversion
- Multi-platform deployment: IPFS, Vercel, GitHub Pages, Docker
- Font Awesome icons with thin (fat) style preference
- CSS variable-based theming
- Markdown content with frontmatter metadata

## Project Structure

```
tankbottoms-github-pages/
  .github/
    workflows/
      deploy.yml          # GitHub Pages deployment
  scripts/
    check-links.ts        # Link verification (pre-build)
    deploy-ipfs.ts        # IPFS/IPNS deployment
    deploy-filebase.ts    # Filebase pinning backup
    download-ipfs-cache.ts # IPFS content caching
  src/
    docs/
      posts/              # Markdown blog posts
    lib/
      components/         # Svelte components
      stores/             # State management
      utils/              # Utility functions
    routes/               # SvelteKit routes
  static/
    images/               # SVG and image assets
    json/                 # JSON data files
    fontawesome/          # Font Awesome icons
  docker-compose.yml      # Container deployment
  svelte.config.js        # Dual adapter (Vercel + Static)
  svelte.config.static.js # IPFS-specific static adapter
  vite.config.ts          # Vite configuration
  IPFS-CID.md             # Current deployment info
  CLAUDE.md               # AI assistant instructions
```

## Quick Start

```bash
# Install dependencies
bun install

# Development server
bun run dev

# Build for Vercel
bun run build

# Build and deploy to IPFS
bun run ipfs
```

## Deployment Options

### IPFS (Primary)

The site is optimized for IPFS with automatic path conversion from absolute to relative URLs.

```bash
# Test IPFS connectivity
bun run ipfs test

# Deploy to IPFS and publish IPNS
bun run ipfs

# Verify existing deployment
bun run ipfs verify
```

**IPNS Key:** `mrwhiskers-blog` (hosted on spark-2)

**Gateways:**

- Primary: `https://ipfs.pantsonfire.xyz`
- Secondary: `https://ipfs1.shh-shush.xyz`
- Public: `https://ipfs.io`, `https://dweb.link`

### Vercel

Automatically deployed on push to main branch. Uses `@sveltejs/adapter-vercel` with Node.js 22.x runtime.

### GitHub Pages

Workflow in `.github/workflows/deploy.yml` builds with `@sveltejs/adapter-static` and deploys to GitHub Pages.

### Docker

```bash
# Build and run
docker-compose up --build

# Access at http://localhost:4173
```

## ENS Configuration

The site uses IPNS for stable addressing. ENS domains point to the IPNS key, not the CID, so updates don't require ENS transactions.

| Domain | Content |
|--------|---------|
| tankbottoms.eth | `ipns://[IPNS_NAME]` |

## Build Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Development server with HMR |
| `bun run build` | Production build (Vercel) |
| `bun run ipfs` | Build and deploy to IPFS |
| `bun run ipfs test` | Test IPFS node connectivity |
| `bun run check-links` | Verify all internal/external links |
| `bun run check-links:skip-external` | Check internal links only |
| `bun run generate:ux-spec` | Generate UX specification page |

## Pre-Build Checks

The `postbuild` script automatically runs link verification:

```bash
bun run scripts/check-links.ts --skip-external
```

This catches:

- Broken internal routes
- Missing static assets
- Invalid markdown links
- IPFS CID format validation

## Content Guidelines

Blog posts are markdown files in `src/docs/posts/` with frontmatter:

```yaml
---
title: Post Title
blurb: Short description
date: 2026-01-03
napScore: 4
research: [naps, sunbeams]
---

Content here...
```

**Nap Score:** 1-5 rating displayed as cat icons

**Research Categories:** naps, toys, things-to-knock-over, mondays, lasagna, owner-appreciation, pet-peeves, sunbeams

## Theming

All colors use CSS variables defined in the layout. Never hardcode colors.

**Accent:** `#9c27b0` (purple)

**Icons:** Font Awesome Thin (`fat`) by default

```svelte
<i class="fat fa-cat"></i>
```

## UX Specification

The project includes a comprehensive UX specification at `/ux-spec` documenting the design system:

- **Design Principles**: Terminal aesthetic, information density, consistent spacing
- **Color Palette**: Core, scheme, and semantic colors with CSS variable names
- **Typography**: Font stacks and size hierarchy
- **Box Types**: Section boxes, filter boxes, stats cards, timeline entries
- **Badges**: Category badges and status indicators
- **Icons**: Font Awesome Thin icon reference

**Generate/Regenerate:**

```bash
bun run generate:ux-spec
```

This creates:

- `/ux-spec` route with interactive documentation
- `docs/UX_SPECIFICATION.md` markdown version

The page includes export buttons for PDF, Markdown, and plain text formats.

## License

MIT License

Copyright (c) 2026 tankbottoms

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Disclaimer

This software is provided for legitimate, lawful purposes only. Any use of this software for harassment, stalking, defamation, or any other unlawful purpose is strictly prohibited. The author(s) disclaim any responsibility for misuse of this software. Users are solely responsible for ensuring their use complies with all applicable laws and regulations.

## Author

- **tankbottoms** - [GitHub](https://github.com/tankbottoms)
