import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - allow multiple frontend ports during development
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:5178'
  ],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Spotify API configuration
const SPOTIFY_API_BASE_URL = 'https://api.spotify.com/v1';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

// Token cache
let tokenCache = {
  token: null,
  expiresAt: 0
};

// Function to get Spotify access token
const getSpotifyToken = async () => {
  // Check if we have a valid cached token
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  if (!process.env.VITE_SPOTIFY_CLIENT_ID || !process.env.VITE_SPOTIFY_CLIENT_SECRET) {
    throw new Error('Spotify credentials not configured');
  }

  try {
    const response = await axios.post(SPOTIFY_TOKEN_URL,
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${process.env.VITE_SPOTIFY_CLIENT_ID}:${process.env.VITE_SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
        }
      }
    );

    const data = response.data;

    // Cache the token with 5-minute buffer before expiry
    tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 300) * 1000
    };

    return data.access_token;
  } catch (error) {
    console.error('Failed to get Spotify token:', error.response?.data || error.message);
    throw new Error('Authentication failed');
  }
};

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'spotify-proxy' });
});

// Add informational root endpoint to avoid 404 at '/'
app.get('/', (req, res) => {
  res.json({
    message: 'Spotify Proxy Server',
    health: '/health',
    proxy_example: '/api/spotify/search?q=year:2025&type=track&limit=1',
  });
});

// Spotify API proxy endpoints
app.use('/api/spotify', async (req, res, next) => {
  try {
    // Get the Spotify API path from the request URL
    const spotifyPath = req.url.substring(1); // Remove leading slash
    const spotifyUrl = `${SPOTIFY_API_BASE_URL}/${spotifyPath}`;

    console.log(`Proxying request to: ${spotifyUrl}`);
    console.log('Query params:', req.query);

    // Get access token
    const token = await getSpotifyToken();

    // Prepare request configuration
    const config = {
      method: req.method,
      url: spotifyUrl,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      params: req.query,
      timeout: 10000, // 10 second timeout
    };

    // Add body for non-GET requests
    if (req.method !== 'GET' && req.body) {
      config.data = req.body;
    }

    // Make request to Spotify API
    const response = await axios(config);

    // Add cache headers based on endpoint type
    const setCacheHeaders = (path) => {
      if (path.includes('search')) {
        res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
      } else if (path.includes('featured-playlists')) {
        res.set('Cache-Control', 'public, max-age=1800'); // 30 minutes
      } else if (path.includes('new-releases')) {
        res.set('Cache-Control', 'public, max-age=3600'); // 1 hour
      } else if (path.includes('tracks/') || path.includes('albums/') || path.includes('artists/')) {
        res.set('Cache-Control', 'public, max-age=86400'); // 24 hours
      } else {
        res.set('Cache-Control', 'public, max-age=1800'); // 30 minutes default
      }
    };

    setCacheHeaders(spotifyPath);

    // Return the response
    res.status(response.status).json(response.data);

  } catch (error) {
    console.error('Proxy error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Proxy request failed',
      details: error.response?.data || error.message
    });
  }
});

// Catch-all error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: {
      status: 500,
      message: 'Internal server error'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      status: 404,
      message: 'Endpoint not found'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Spotify Proxy Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🎵 Proxy endpoint: http://localhost:${PORT}/api/spotify/*`);

  // Test Spotify credentials on startup
  getSpotifyToken()
    .then(() => console.log('✅ Spotify API credentials verified'))
    .catch(err => console.error('❌ Spotify API credentials failed:', err.message));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
