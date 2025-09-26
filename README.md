<div align="center" >
  <br/>
  <br/>
  <img src="/src/assets/svg/podbeat.svg" alt="Podbeat logo" width="80" height="auto" />
  <h1>Podbeat</h1>
  <br/>

  <p >
A modern music discovery app built with React and TypeScript. <br/> Browse tracks, albums, and artists with intelligent search and audio playback.
  </p>
</div>

<br/>
<br/>

## ✨ Features

### 🎵 Music Discovery

- **Smart Search**: Advanced search algorithm with genre-based filtering, year-based queries, and popularity scoring
- **Command Palette**: Press `Cmd+K` (Mac) or `Ctrl+K` (Windows) for instant search across tracks, albums, and artists
- **Latest Hits**: Curated collection of 2024-2025 chart-topping tracks from Spotify's top charts
- **Popular Tracks**: Classic hits and timeless favorites with verified metadata

### 🎧 Audio Experience

- **Mini Player**: Full-featured audio player with play/pause, seek, volume control, and shuffle/repeat modes
- **Preview Playback**: Real-time audio previews from Spotify's CDN when available
- **Visual Feedback**: Audio visualizer and progress indicators for enhanced user experience
- **Responsive Controls**: Touch-friendly controls optimized for mobile and desktop

### 🎨 User Interface

- **Modern Design**: Clean, responsive interface with dark/light theme support
- **Grid & List Views**: Toggle between detailed grid view and compact list view
- **Smooth Animations**: Framer Motion powered transitions and micro-interactions
- **Mobile Optimized**: Fully responsive design that works on all screen sizes

### 🔍 Advanced Search

- **Multi-term Search**: Intelligent search across track names, artists, albums, and genres
- **Genre Aliases**: Smart genre matching (e.g., "hip hop" matches "rap", "latin trap")
- **Year-based Queries**: Search by release year (e.g., "2024", "2023")
- **Popularity Filtering**: Results ranked by Spotify popularity scores

### 🚀 Performance

- **Lazy Loading**: Code splitting and lazy-loaded components for faster initial load
- **Caching**: Intelligent caching with RTK Query for optimal performance
- **Offline Support**: Graceful fallback to cached content when offline
- **Error Handling**: Comprehensive error boundaries and user-friendly error messages

## How it works

Podbeat runs in two modes depending on your setup:

### Demo mode (no API needed)

Without API credentials:

- Curated collection of 2024-2025 chart toppers with verified Spotify metadata
- Works immediately after `git clone` and `npm install`
- Real album artwork and track metadata from Spotify CDN
- Features artists like Billie Eilish, Harry Styles, Morgan Wallen, Taylor Swift, and more
- Enhanced search functionality with mock data

Benefits:

- Perfect for trying out the app quickly
- No API setup required
- Images load from Spotify CDN
- Shows off the full UI and search capabilities

<br/>

### With Spotify API (recommended)

If you have Spotify API credentials:

- Real-time access to Spotify's music catalog
- Search across millions of tracks, albums, and artists
- Latest trending songs and new releases
- All features available with live data

Requires:

- Spotify API credentials in `.env` file
- Backend server running for CORS handling

<br/>
Podbeat automatically detects which mode to use and provides seamless fallback.
<br/>
