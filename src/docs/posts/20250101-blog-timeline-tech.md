---
title: 'Blog & Timeline Publishing Technology'
blurb: 'SvelteKit 5 timeline blog with dual deployment to IPFS (via spark-2 node with IPNS keys) and Cloudflare Workers. Features mdsvex markdown processing, category-based filtering, significance ratings with Mr. Whiskers icons, search with localStorage history, and prerendered static output for decentralized hosting.'
date: January 1, 2025
significance: 2
research: [ai-llm]
tags: [sveltekit, ipfs, cloudflare, blog, publishing]
featured: false
---

This blog platform is itself a technical artifact worth documenting. Built with SvelteKit 5, it implements a timeline-style publishing system with multi-target deployment to IPFS, Cloudflare Workers, Vercel, and GitHub Pages. The platform serves as both a portfolio presentation layer and a testbed for exploring modern web publishing approaches, including decentralized hosting through IPFS and ENS integration.

## SvelteKit 5 Architecture

The blog is built on SvelteKit 5, leveraging its file-based routing, server-side rendering capabilities, and the new runes reactivity system. Content is authored in Markdown with YAML frontmatter and processed through mdsvex, which compiles Markdown files into Svelte components at build time.

The content pipeline uses Vite's glob imports to discover and load all posts from the docs directory, extracting metadata for the timeline view without requiring a separate content database or API. Posts are sorted chronologically, filtered by research category, and rated by significance, providing multiple navigation paths through the content.

The timeline UI presents posts in reverse chronological order with visual indicators for significance ratings, category badges, and featured status. Category pages aggregate posts by research area, and a filtering system allows visitors to narrow the timeline by significance threshold or category.

## Multi-Target Deployment

A key architectural decision was designing for deployment to fundamentally different hosting platforms without maintaining separate build configurations. The build system produces static output that can be served from any static hosting provider, with adapter configuration selecting the appropriate output format for each target.

IPFS deployment uses a custom build script that generates a static site, uploads it to a local IPFS node (spark-2), pins the content, and publishes the new CID under an IPNS key for persistent addressing. The IPNS key is linked to the tankbottoms.eth ENS name, creating a human-readable address that resolves to the latest content through the Ethereum Name Service.

Cloudflare Workers deployment uses the Workers Static Assets adapter, serving the prerendered site from Cloudflare's edge network with near-instant global delivery. Vercel deployment provides an additional CDN-hosted mirror, and GitHub Pages serves as a repository-linked deployment for accessibility.

## Content Management Approach

The content management approach is deliberately file-based rather than database-driven. Blog posts are Markdown files committed to the git repository, making the full content history available through version control. Frontmatter metadata provides the structured fields (title, date, significance, categories, tags) that drive the timeline UI without requiring a separate metadata store.

This approach means the entire blog, content and presentation, is contained in a single repository. There is no external CMS dependency, no database to maintain, and no API keys to manage. The tradeoff is that publishing requires a git commit and build cycle rather than a web-based editor, which is acceptable for a technical portfolio site.

## ENS and Permanent Web

The ENS integration links the blog to the tankbottoms.eth Ethereum name, which resolves to the IPNS address of the latest IPFS deployment. This creates a persistent, censorship-resistant publishing path: content is hosted on IPFS (content-addressed and distributed), addressed through IPNS (mutable pointer to current content), and discoverable through ENS (human-readable name resolution on Ethereum).

This architecture ensures that published content remains accessible even if any single hosting provider becomes unavailable, embodying the principle that publishing infrastructure should be resilient by design rather than dependent on the continued operation of any single service provider.
