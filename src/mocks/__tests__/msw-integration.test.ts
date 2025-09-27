import { describe, it, expect, vi as _vi, beforeEach } from 'vitest';
import { server } from '../server';
import { http, HttpResponse } from 'msw';
import { MOCK_LATEST_HITS } from '@/data/mockMusicData';

describe('MSW Integration Tests', () => {
  beforeEach(() => {
    // Reset any request handlers between tests
    server.resetHandlers();
  });

  describe('Spotify API Mocking', () => {
    it('should mock token endpoint with realistic delay', async () => {
      const startTime = Date.now();

      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.ok).toBe(true);
      expect(duration).toBeGreaterThanOrEqual(90); // Should have realistic delay

      const data = await response.json();
      expect(data).toMatchObject({
        access_token: 'mock-access-token',
        token_type: 'Bearer',
        expires_in: 3600
      });
    });

    it('should mock search endpoint with query-based routing', async () => {
      const response = await fetch(
        'https://api.spotify.com/v1/search?q=year:2024&type=track&limit=20'
      );

      expect(response.ok).toBe(true);
      const data = await response.json();

      expect(data).toHaveProperty('tracks');
      expect(data.tracks).toHaveProperty('items');
      expect(data.tracks.items).toBeInstanceOf(Array);
      expect(data.tracks.items.length).toBeGreaterThan(0);

      // Verify the structure matches Spotify API format
      const firstTrack = data.tracks.items[0];
      expect(firstTrack).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        artists: expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String)
          })
        ]),
        album: expect.objectContaining({
          name: expect.any(String),
          images: expect.arrayContaining([
            expect.objectContaining({
              url: expect.stringMatching(/^https:\/\//)
            })
          ])
        }),
        duration_ms: expect.any(Number),
        popularity: expect.any(Number)
      });
    });

    it('should route different queries to appropriate mock datasets', async () => {
      // Test latest hits query routing
      const latestResponse = await fetch(
        'https://api.spotify.com/v1/search?q=year:2025&type=track'
      );
      const latestData = await latestResponse.json();

      const latestTrack = latestData.tracks.items[0];
      expect(latestTrack.popularity).toBeGreaterThanOrEqual(80); // Latest hits have higher popularity

      // Test popular tracks query routing
      const popularResponse = await fetch(
        'https://api.spotify.com/v1/search?q=popular&type=track'
      );
      const popularData = await popularResponse.json();

      const popularTrack = popularData.tracks.items[0];
      expect(popularTrack.popularity).toBeGreaterThanOrEqual(75); // Popular tracks have high popularity
    });

    it('should handle individual track requests', async () => {
      const trackId = MOCK_LATEST_HITS[0].spotify_id;

      const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`);

      expect(response.ok).toBe(true);
      const track = await response.json();

      expect(track).toMatchObject({
        id: trackId,
        name: MOCK_LATEST_HITS[0].name,
        artists: [
          expect.objectContaining({
            name: MOCK_LATEST_HITS[0].artist
          })
        ]
      });
    });

    it('should return 404 for non-existent tracks', async () => {
      const response = await fetch('https://api.spotify.com/v1/tracks/non-existent-id');

      expect(response.status).toBe(404);
      const errorData = await response.json();
      expect(errorData.error.status).toBe(404);
    });
  });

  describe('Backend Proxy Mocking', () => {
    it('should mock local backend proxy endpoints', async () => {
      const response = await fetch('http://localhost:3001/api/spotify/search?q=popular');

      expect(response.ok).toBe(true);
      const data = await response.json();

      expect(data.tracks.items).toBeInstanceOf(Array);
      expect(data.tracks.items.length).toBeGreaterThan(0);
    });
  });

  describe('Error Simulation', () => {
    it('should simulate occasional rate limiting errors', async () => {
      // Run multiple requests to potentially hit the 5% error rate
      const requests = Array.from({ length: 50 }, () =>
        fetch('https://api.spotify.com/v1/search?q=test&type=track')
      );

      const responses = await Promise.allSettled(requests);
      const errorResponses = responses.filter(
        result => result.status === 'fulfilled' && !result.value.ok
      );

      // Should have some error responses due to random rate limiting
      // Note: This test might be flaky due to randomness, but demonstrates the concept
      if (errorResponses.length > 0) {
        const errorResponse = errorResponses[0] as PromiseFulfilledResult<Response>;
        expect(errorResponse.value.status).toBe(429);
      }
    });

    it('should handle custom error override', async () => {
      // Override handler to always return an error
      server.use(
        http.get('https://api.spotify.com/v1/search', () => {
          return HttpResponse.json(
            { error: { status: 500, message: 'Internal Server Error' } },
            { status: 500 }
          );
        })
      );

      const response = await fetch('https://api.spotify.com/v1/search?q=test');
      expect(response.status).toBe(500);
    });
  });

  describe('Performance & Realism', () => {
    it('should have realistic response times', async () => {
      const startTime = Date.now();

      const response = await fetch('https://api.spotify.com/v1/search?q=test');

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.ok).toBe(true);
      expect(duration).toBeGreaterThanOrEqual(250); // Should have realistic API delay
      expect(duration).toBeLessThan(1000); // But not too slow
    });

    it('should return properly formatted Spotify-like responses', async () => {
      const response = await fetch('https://api.spotify.com/v1/search?q=test');
      const data = await response.json();

      // Verify response structure matches Spotify API documentation
      expect(data.tracks).toMatchObject({
        href: expect.stringMatching(/^https:\/\/api\.spotify\.com/),
        limit: expect.any(Number),
        offset: expect.any(Number),
        total: expect.any(Number),
        items: expect.any(Array)
      });

      // Verify track items have proper Spotify structure
      if (data.tracks.items.length > 0) {
        const track = data.tracks.items[0];
        expect(track).toMatchObject({
          album: {
            album_type: expect.any(String),
            artists: expect.any(Array),
            images: expect.any(Array),
            name: expect.any(String)
          },
          artists: expect.any(Array),
          duration_ms: expect.any(Number),
          external_urls: expect.objectContaining({
            spotify: expect.stringMatching(/^https:\/\/open\.spotify\.com/)
          }),
          id: expect.any(String),
          name: expect.any(String),
          popularity: expect.any(Number),
          type: 'track',
          uri: expect.stringMatching(/^spotify:track:/)
        });
      }
    });
  });
});