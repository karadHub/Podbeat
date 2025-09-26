# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Quick Start:**
```bash
npm run dev          # Frontend only (demo mode)
npm run dev:full     # Full stack with Spotify API
```

**Testing:**
```bash
npm test             # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Coverage report (85%+ line coverage required)
npm run test:e2e     # Playwright end-to-end tests
npm run test:visual  # Visual regression tests
```

**Build & Deploy:**
```bash
npm run build        # Build for production
npm run validate:deploy # Run tests + build (deployment check)
npm run quality:check   # Coverage validation
```

**Server Management:**
```bash
npm run server:dev   # Start backend server with nodemon
npm run server       # Start backend server in production
```

## Architecture Overview

**Dual-Mode Operation:**
- **Demo Mode**: Works immediately without API credentials using curated 2024-2025 chart data
- **Live Mode**: Requires Spotify API credentials, uses Express server as CORS proxy

**Frontend Stack:**
- React 18 + TypeScript + Vite
- Redux Toolkit with RTK Query for state management
- Two separate APIs: `SpotifyAPI.ts` (live data) and `MusicAPI.ts` (unified interface)
- Tailwind CSS + Framer Motion for animations

**Key Directories:**
```
src/
├── store/           # Redux store with SpotifyAPI & MusicAPI reducers
├── services/        # API services (SpotifyAPI, MusicAPI, MCPAudioService)
├── pages/           # Route components (Home, Catalog, Detail, NotFound)
├── common/          # Shared components (Header, Footer, Loader, etc.)
├── components/ui/   # UI components (TrackCard, AlbumCard, CommandPalette)
├── context/         # React contexts (theme, global state)
├── mocks/           # MSW handlers for testing
└── utils/           # Helper functions, config, offline cache
```

**Backend (Express Server):**
- Located in `server/index.js`
- CORS proxy for Spotify Web API (runs on port 3001)
- Required for live Spotify data due to CORS restrictions

**Environment Setup:**
Copy `.env.example` to `.env` and add Spotify credentials for live mode. App automatically detects which mode to use based on environment variables.

**Testing Strategy:**
- Vitest for unit tests with 85%+ coverage requirements
- MSW for API mocking
- Playwright for E2E and visual regression tests
- Tests exclude server/ directory and config files

**Routing:**
- `/:category/:id` - Detail pages (track/album/artist)
- `/:category` - Catalog pages (tracks/albums/artists)
- `/` - Home page
- Command Palette accessible via Cmd/Ctrl+K

**State Management:**
Redux store manages two API slices - SpotifyAPI for live data and MusicAPI for unified interface. Components use RTK Query hooks for data fetching.
- Do not implement new features that I didn't tell you to do. If you'd like to add something we haven't discussed, you must confirm the plan with me.
- You must always test whether the app is still running without any errors whenever you make code changes.