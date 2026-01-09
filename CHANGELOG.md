# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- **UX Specification Page** (`/ux-spec`)
  - Interactive design system documentation
  - Color palette visualization with CSS variable names
  - Typography examples with font stacks
  - Box type demonstrations (section, filter, stats, timeline, featured)
  - Badge reference (category and status badges)
  - Icon grid with Font Awesome Thin icons
  - Terminology definitions
  - Export buttons: PDF (print), Markdown (download), TXT (download)

- **UX Spec Generator** (`scripts/generate-ux-spec.ts`)
  - Parses `src/app.css` for CSS variables
  - Extracts and categorizes color tokens (core, scheme, semantic)
  - Generates `/ux-spec` route with embedded export content
  - Generates `docs/UX_SPECIFICATION.md` markdown version
  - Configurable via `CONFIG` object

- **Documentation**
  - `docs/UX_SPECIFICATION.md` - Markdown version of design system
  - `TODO.md` - Project task tracking
  - Updated `README.md` with UX spec section

- **Build Scripts**
  - `bun run generate:ux-spec` - Regenerate UX specification

### Fixed

- **UX Spec Accessibility** (`/ux-spec`)
  - Fixed a11y warnings for demo navigation links (using spans with role="link")
  - Added aria-labels to icon-only buttons for screen reader support

## [1.0.0] - 2026-01-03

### Added

- Initial release
- SvelteKit 5 timeline blog template
- Nap Score rating system (1-5)
- Research category tagging
- IPFS/IPNS deployment support
- Vercel adapter configuration
- GitHub Pages workflow
- Font Awesome Thin (fat) icons
- CSS variable-based theming
- Dark mode support
- Timeline with sticky year/month markers
- Featured post highlighting
- Category filtering
- Visit history tracking
- Responsive mobile design
