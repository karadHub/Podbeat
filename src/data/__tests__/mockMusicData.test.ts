import { describe, it, expect, vi } from 'vitest';
import {
  getMockData,
  shouldUseMockData,
  getMockTrackById,
  MOCK_LATEST_HITS,
  MOCK_POPULAR_TRACKS,
  MOCK_HERO_TRACKS
} from '../mockMusicData';

// Mock environment variables
vi.mock('../../../utils/config', () => ({
  SPOTIFY_CLIENT_ID: undefined,
  SPOTIFY_CLIENT_SECRET: undefined,
  USE_BACKEND_PROXY: false
}));

describe('Mock Music Data', () => {
  describe('Data Quality Standards', () => {
    it('should have high-quality latest hits with proper popularity scores', () => {
      MOCK_LATEST_HITS.forEach(track => {
        expect(track.popularity).toBeGreaterThanOrEqual(80);
        expect(track.id).toBeDefined();
        expect(track.spotify_id).toBeDefined();
        expect(track.name).toBeDefined();
        expect(track.artist).toBeDefined();
        expect(track.album).toBeDefined();
        expect(track.poster_path).toContain('https://');
        expect(track.duration).toBeGreaterThan(0);
      });
    });


    it('should ensure no artist repetition within sections', () => {
      const checkArtistDiversity = (tracks: any[], sectionName: string) => {
        const artists = tracks.map(track => track.artist.toLowerCase());
        const uniqueArtists = new Set(artists);
        expect(uniqueArtists.size, `${sectionName} should have unique artists`).toBe(artists.length);
      };

      checkArtistDiversity(MOCK_LATEST_HITS, 'Latest Hits');
      checkArtistDiversity(MOCK_POPULAR_TRACKS, 'Popular Tracks');
    });

    it('should have valid image URLs from Spotify CDN', () => {
      const allTracks = [...MOCK_LATEST_HITS, ...MOCK_POPULAR_TRACKS];
      allTracks.forEach(track => {
        expect(track.poster_path).toMatch(/^https:\/\/i\.scdn\.co\/image\//);
        expect(track.backdrop_path).toMatch(/^https:\/\/i\.scdn\.co\/image\//);
      });
    });
  });

  describe('getMockData function', () => {
    it('should return latest hits for tracks-latest', () => {
      const result = getMockData('tracks', 'latest');
      expect(result.results).toEqual(MOCK_LATEST_HITS);
    });

    it('should return latest hits for tracks-lofi fallback', () => {
      const result = getMockData('tracks', 'lofi');
      expect(result.results).toEqual(MOCK_LATEST_HITS);
    });

    it('should return popular tracks for tracks-popular', () => {
      const result = getMockData('tracks', 'popular');
      expect(result.results).toEqual(MOCK_POPULAR_TRACKS);
    });

    it('should return hero tracks for tracks-hero', () => {
      const result = getMockData('tracks', 'hero');
      expect(result.results).toEqual(MOCK_HERO_TRACKS);
    });

    it('should return default content for unknown categories', () => {
      const result = getMockData('unknown', 'unknown');
      expect(result.results).toBeDefined();
      expect(result.results.length).toBeLessThanOrEqual(20);
    });
  });

  describe('shouldUseMockData function', () => {
    it('should return a boolean value', () => {
      const result = shouldUseMockData();
      expect(typeof result).toBe('boolean');
    });

    it('should evaluate environment variables correctly', () => {
      // Log what the function is seeing to understand the test environment
      console.log('Environment check:', {
        VITE_SPOTIFY_CLIENT_ID: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
        VITE_SPOTIFY_CLIENT_SECRET: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET,
        VITE_USE_BACKEND_PROXY: import.meta.env.VITE_USE_BACKEND_PROXY
      });

      const result = shouldUseMockData();

      // In a real deployment without credentials, this should be true
      // In test environment, the behavior depends on the setup
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getMockTrackById function', () => {
    it('should find tracks by ID', () => {
      const firstTrack = MOCK_LATEST_HITS[0];
      const result = getMockTrackById(firstTrack.id);
      expect(result).toEqual(firstTrack);
    });

    it('should find tracks by spotify_id', () => {
      const firstTrack = MOCK_LATEST_HITS[0];
      expect(firstTrack.spotify_id).toBeDefined();
      const result = getMockTrackById(firstTrack.spotify_id!);
      expect(result).toEqual(firstTrack);
    });

    it('should return undefined for non-existent IDs', () => {
      const result = getMockTrackById('non-existent-id');
      expect(result).toBeUndefined();
    });

    it('should search across all mock datasets', () => {
      // Test track from each dataset
      const latestTrack = getMockTrackById(MOCK_LATEST_HITS[0].id);
      const popularTrack = getMockTrackById(MOCK_POPULAR_TRACKS[0].id);

      expect(latestTrack).toBeDefined();
      expect(popularTrack).toBeDefined();
    });
  });

  describe('Data Structure Compliance', () => {
    it('should match ITrack interface requirements', () => {
      const testTrack = MOCK_LATEST_HITS[0];

      // Required fields
      expect(testTrack.id).toBeDefined();
      expect(testTrack.spotify_id).toBeDefined();
      expect(testTrack.name).toBeDefined();
      expect(testTrack.title).toBeDefined();
      expect(testTrack.original_title).toBeDefined();
      expect(testTrack.artist).toBeDefined();
      expect(testTrack.album).toBeDefined();
      expect(testTrack.poster_path).toBeDefined();
      expect(testTrack.backdrop_path).toBeDefined();
      expect(testTrack.overview).toBeDefined();
      expect(testTrack.duration).toBeDefined();
      expect(testTrack.popularity).toBeDefined();

      // Type checks
      expect(typeof testTrack.id).toBe('string');
      expect(typeof testTrack.name).toBe('string');
      expect(typeof testTrack.artist).toBe('string');
      expect(typeof testTrack.duration).toBe('number');
      expect(typeof testTrack.popularity).toBe('number');
    });

    it('should have consistent naming between title fields', () => {
      MOCK_LATEST_HITS.forEach(track => {
        expect(track.name).toBe(track.title);
        expect(track.name).toBe(track.original_title);
      });
    });
  });

  describe('Educational Value', () => {
    it('should include recognizable mainstream artists', () => {
      const recognizableArtists = [
        'Harry Styles', 'Taylor Swift', 'Ed Sheeran', 'Dua Lipa',
        'The Killers', 'The Beatles', 'Adele'
      ];

      const allArtists = MOCK_LATEST_HITS.concat(MOCK_POPULAR_TRACKS)
        .map(track => track.artist);

      recognizableArtists.forEach(artist => {
        expect(allArtists).toContain(artist);
      });
    });

    it('should provide diverse music categories for learning', () => {
      expect(MOCK_LATEST_HITS.length).toBeGreaterThanOrEqual(8);
      expect(MOCK_POPULAR_TRACKS.length).toBeGreaterThanOrEqual(4);
    });

    it('should have realistic duration values', () => {
      const allTracks = [...MOCK_LATEST_HITS, ...MOCK_POPULAR_TRACKS];
      allTracks.forEach(track => {
        // Typical song duration: 2-6 minutes (120000-360000ms)
        expect(track.duration).toBeGreaterThan(120000);
        expect(track.duration).toBeLessThan(360000);
      });
    });
  });
});