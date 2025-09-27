import {
  getMockData,
  getMockTrackById,
  shouldUseMockData,
} from "@/data/mockMusicData";
import { ITrack } from "@/types";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { spotifyApi } from "./SpotifyAPI";

// Create a unified API that wraps Spotify functionality
export const musicApi = createApi({
  reducerPath: "musicApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/" }), // Dummy base query since we're using manual queries

  endpoints: (builder) => ({
    // This is just a placeholder - we'll use the Spotify API directly
    getTracks: builder.query<
      { results: ITrack[] },
      {
        category: string | undefined;
        type?: string;
        page?: number;
        searchQuery?: string;
        showSimilarTracks?: boolean;
        id?: number;
      }
    >({
      query: () => "", // Dummy query since we handle this manually
    }),

    getTrack: builder.query<ITrack, { category: string; id: number }>({
      query: () => "", // Dummy query since we handle this manually
    }),
  }),
});

// Enhanced search algorithm for mock data
const performEnhancedSearch = (
  tracks: ITrack[],
  searchQuery: string
): ITrack[] => {
  if (!searchQuery || !tracks.length) return [];

  const query = searchQuery.toLowerCase().trim();
  const searchTerms = query.split(/\s+/).filter((term) => term.length > 0);

  console.log(`🔍 Enhanced search: "${query}" -> [${searchTerms.join(", ")}]`);

  // Check if search is year-based
  const yearMatch = query.match(/\b(19|20)\d{2}\b/);
  const searchYear = yearMatch ? parseInt(yearMatch[0]) : null;

  const scoredResults: Array<{ track: ITrack; score: number }> = [];

  tracks.forEach((track) => {
    let score = 0;
    const trackText = {
      name: track.name?.toLowerCase() || "",
      title: track.title?.toLowerCase() || "",
      original_title: track.original_title?.toLowerCase() || "",
      artist: track.artist?.toLowerCase() || "",
      album: track.album?.toLowerCase() || "",
      overview: track.overview?.toLowerCase() || "",
      genre: track.genre?.toLowerCase() || "",
      year: track.year?.toString() || "",
    };

    // Exact match bonuses (highest priority)
    if (trackText.name === query || trackText.title === query) score += 100;
    if (trackText.artist === query) score += 90;
    if (trackText.album === query) score += 80;
    if (trackText.genre === query) score += 70;

    // Year-based search
    if (searchYear && track.year === searchYear) {
      score += 85;
      console.log(`🗓️ Year match: ${track.name} (${track.year}) +85`);
    }

    // Genre-based search with flexible matching
    const genreAliases: Record<string, string[]> = {
      pop: ["pop", "alternative pop", "dance pop", "synthpop"],
      rock: ["rock", "pop rock", "alternative rock", "classic rock"],
      "hip hop": ["hip hop", "hip-hop", "rap", "latin trap"],
      "r&b": ["r&b", "rnb", "soul"],
      electronic: ["electronic", "dance", "edm", "synthpop"],
      country: ["country"],
      indie: ["indie", "indie folk", "indie rock"],
      folk: ["folk", "indie folk"],
      punk: ["punk", "pop punk"],
      garage: ["garage", "uk garage"],
      "k-pop": ["k-pop", "kpop"],
      latin: ["latin", "latin trap"],
    };

    // Check for genre matches
    for (const [searchGenre, aliases] of Object.entries(genreAliases)) {
      if (query.includes(searchGenre)) {
        if (aliases.some((alias) => trackText.genre.includes(alias))) {
          score += 75;
          console.log(
            `🎵 Genre match: ${track.name} (${track.genre}) for "${searchGenre}" +75`
          );
          break;
        }
      }
    }

    // Multi-term search scoring
    const _allFields = [
      trackText.name,
      trackText.title,
      trackText.original_title,
      trackText.artist,
      trackText.album,
      trackText.overview,
      trackText.genre,
      trackText.year,
    ].join(" ");

    searchTerms.forEach((term) => {
      // Title/Name matches
      if (trackText.name.includes(term) || trackText.title.includes(term))
        score += 50;
      if (trackText.original_title.includes(term)) score += 45;

      // Artist matches
      if (trackText.artist.includes(term)) score += 40;

      // Album matches
      if (trackText.album.includes(term)) score += 30;

      // Genre matches
      if (trackText.genre.includes(term)) score += 35;

      // Overview matches
      if (trackText.overview.includes(term)) score += 15;

      // Year matches
      if (trackText.year.includes(term)) score += 25;
    });

    // Partial word matching bonus
    searchTerms.forEach((term) => {
      if (term.length >= 3) {
        if (trackText.name.includes(term) || trackText.artist.includes(term)) {
          score += 20;
        }
      }
    });

    // Popularity boost for better user experience
    if (track.popularity && track.popularity > 85) score += 10;
    if (track.popularity && track.popularity > 90) score += 5;

    if (score > 0) {
      console.log(`📊 "${track.name}" by ${track.artist}: score = ${score}`);
      scoredResults.push({ track, score });
    }
  });

  // Sort by score (descending) and return tracks
  const sortedResults = scoredResults
    .sort((a, b) => b.score - a.score)
    .map((item) => item.track);

  console.log(`🎯 Final results: ${sortedResults.length} tracks`);
  if (sortedResults.length > 0) {
    console.log(
      `🏆 Top result: "${sortedResults[0].name}" by ${sortedResults[0].artist}`
    );
  }

  return sortedResults;
};

// Create hooks that provide music data through Spotify API integration
export const useGetTracksQuery = (
  args: {
    category: string | undefined;
    type?: string;
    page?: number;
    searchQuery?: string;
    showSimilarTracks?: boolean;
    id?: number;
    cacheKey?: string; // Add unique cache key
  },
  options?: { skip?: boolean }
) => {
  const { category, type, searchQuery, showSimilarTracks } = args;
  const { skip = false } = options || {};

  // Check if we should use mock data
  const useMockData = shouldUseMockData();

  // Debug logging
  console.group(`🔧 MusicAPI useGetShowsQuery Debug`);
  console.log("📊 Query Arguments:", {
    category,
    type,
    searchQuery,
    showSimilarTracks,
    skip,
  });
  console.log("🎭 Mock Data Mode:", useMockData);
  console.groupEnd();

  // Early return with mock data if no API available
  if (useMockData && !searchQuery && !showSimilarTracks) {
    console.log(`🎭 Using mock data for ${category}-${type}`);
    const mockData = getMockData(category || "tracks", type || "popular");
    return {
      data: mockData,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: undefined,
    } as any;
  }

  // Handle search queries
  if (searchQuery) {
    // In mock mode, return filtered mock data for search
    if (useMockData) {
      console.log(`🎭 Enhanced mock search for: "${searchQuery}"`);

      // Get comprehensive mock data from all sources
      const latestHits = getMockData("tracks", "latest");
      const popularTracks = getMockData("tracks", "popular");
      const allTracks = [...latestHits.results, ...popularTracks.results];

      // Enhanced search algorithm
      const searchResults = performEnhancedSearch(allTracks, searchQuery);

      console.log(
        `🎭 Search results: ${searchResults.length} tracks found for "${searchQuery}"`
      );
      return {
        data: { results: searchResults },
        isLoading: false,
        isFetching: false,
        isError: false,
        error: undefined,
      } as any;
    }

    if (category === "tracks") {
      return spotifyApi.useSearchMusicQuery(
        {
          query: searchQuery,
          type: "track",
          limit: 20,
        },
        { skip }
      );
    } else if (category === "albums") {
      return spotifyApi.useSearchMusicQuery(
        {
          query: searchQuery,
          type: "album",
          limit: 20,
        },
        { skip }
      );
    }
  }

  // Handle similar tracks (related content)
  if (showSimilarTracks) {
    // In mock mode, return a subset of popular tracks
    if (useMockData) {
      console.log(`🎭 Mock similar tracks`);
      const mockData = getMockData("tracks", "popular");
      return {
        data: { results: mockData.results.slice(0, 10) },
        isLoading: false,
        isFetching: false,
        isError: false,
        error: undefined,
      } as any;
    }

    return spotifyApi.useSearchMusicQuery(
      {
        query: "recommended",
        type: "track",
        limit: 10,
      },
      { skip }
    );
  }

  // Content strategy trigger - return placeholder ID to activate advanced search
  const getPlaylistIdForSection = (
    category: string,
    type: string
  ): string | null => {
    const CONTENT_STRATEGIES: Record<string, string> = {
      // Primary sections using advanced search
      "tracks-latest": "ADVANCED_SEARCH", // Year-based search strategy

      // Legacy playlist mappings (kept for compatibility)
      "tracks-popular": "37i9dQZF1DXcBWIGoYBM5M", // Today's Top Hits (31M+ followers)
      "playlists-toplists": "37i9dQZF1DX4o1BcGBQzKt", // Electronic Rising

      // Album-specific strategies using advanced search
      "albums-new_releases": "ADVANCED_SEARCH", // Latest album releases
      "albums-popular": "ADVANCED_SEARCH", // Popular album search
      "albums-classic": "ADVANCED_SEARCH", // Classic album search
      "albums-indie": "ADVANCED_SEARCH", // Independent album search

      // Additional genre expansions
      "tracks-throwback": "ADVANCED_SEARCH", // Year-based throwback search
      "tracks-classic": "ADVANCED_SEARCH", // Classic hits search
      "tracks-rnb-classic": "ADVANCED_SEARCH", // R&B classics search
      "tracks-chill": "ADVANCED_SEARCH", // Chill music search
    };

    return CONTENT_STRATEGIES[`${category}-${type}`] || null;
  };

  // Deduplication helper to ensure unique content across sections
  const deduplicateResults = (data: any) => {
    if (!data?.results) return data;

    const seen = new Set();
    const uniqueResults = data.results.filter((track: any) => {
      const key = `${track.name?.toLowerCase()}-${track.artist?.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    console.log(
      `🔧 Deduplication: ${data.results.length} → ${uniqueResults.length} tracks`
    );
    return { ...data, results: uniqueResults };
  };

  // Simplified filtering with consistent 75+ popularity threshold
  const getPopularityThreshold = (): number => {
    return 75; // Always use 75+ minimum for high-quality mainstream hits
  };

  const getContentFilter = (type: string) => {
    // Default: exclude ALL ambient content for mainstream sections (Latest Hits)
    return (track: any) => {
      const name = track.name?.toLowerCase() || "";
      const isAmbient =
        /sleep|white noise|rain|nature sounds|meditation|relax|ambient|loopable|asmr|calm|peaceful|gentle|soothing/i.test(
          name
        );
      if (isAmbient) {
        console.log(
          `🚫 Filtering out ambient track: "${track.name}" for ${type} section`
        );
      }
      return !isAmbient;
    };
  };

  const validateSearchResults = (results: any[], type: string): void => {
    const minPopularity = getPopularityThreshold();
    const lowQualityCount = results.filter(
      (r) => (r.popularity || 0) < minPopularity
    ).length;

    if (lowQualityCount > results.length * 0.2) {
      // Max 20% low quality
      console.warn(
        `⚠️ Quality issue in ${type}: ${lowQualityCount}/${results.length} tracks below ${minPopularity} popularity`
      );
    }

    // Check artist diversity
    const artistCounts = new Map();
    results.forEach((track) => {
      const artist = track.artist?.toLowerCase();
      artistCounts.set(artist, (artistCounts.get(artist) || 0) + 1);
    });

    const duplicateArtists = Array.from(artistCounts.entries()).filter(
      ([_, count]) => count > 1
    );
    if (duplicateArtists.length > 0) {
      console.warn(
        `⚠️ Artist repetition in ${type}:`,
        duplicateArtists.map(([artist, count]) => `${artist}(${count})`)
      );
    }

    console.log(
      `✅ ${type} validation: ${
        results.length
      } tracks, avg popularity: ${Math.round(
        results.reduce((sum, r) => sum + (r.popularity || 0), 0) /
          results.length
      )}`
    );
  };

  // Advanced filtering with consistent popularity thresholds and strict artist diversity
  const advancedFilterResults = (data: any, type: string) => {
    if (!data?.results) return data;

    console.log(
      `🎯 Advanced filtering: ${data.results.length} input tracks for ${type}`
    );

    // Step 1: Basic deduplication
    const deduplicated = deduplicateResults(data);

    // Step 2: Apply content filtering based on type
    const contentFilter = getContentFilter(type);
    const contentFiltered = deduplicated.results.filter(contentFilter);

    // Step 2.5: Sort by popularity to ensure we get the highest quality tracks first
    const sortedByPopularity = contentFiltered.sort(
      (a: any, b: any) => (b.popularity || 0) - (a.popularity || 0)
    );

    // Step 3: Artist and Album diversity - max 1 track per artist, more flexible on albums
    const artistCounts = new Map();
    const albumCounts = new Map();
    const diverseResults = sortedByPopularity.filter((track: any) => {
      const artist = track.artist?.toLowerCase();
      const album = track.album?.toLowerCase();

      if (!artist) return false;

      // Check artist diversity (max 2 tracks per artist for better variety)
      const artistCount = artistCounts.get(artist) || 0;
      if (artistCount >= 2) {
        // Changed from 1 to 2
        console.log(
          `🚫 Skipping track by ${track.artist} (already has ${artistCount} tracks)`
        );
        return false;
      }

      // Check album diversity - less aggressive, allow 2 tracks per album to ensure enough results
      if (album) {
        const albumCount = albumCounts.get(album) || 0;
        if (albumCount >= 2) {
          // Changed from 1 to 2
          console.log(
            `🚫 Skipping track from "${track.album}" (already has ${albumCount} tracks from this album)`
          );
          return false;
        }
        albumCounts.set(album, albumCount + 1);
      }

      artistCounts.set(artist, artistCount + 1);
      return true;
    });

    // Step 4: Consistent 75+ popularity filtering
    const popularityThreshold = getPopularityThreshold();
    const qualityFiltered = diverseResults.filter(
      (track: any) => (track.popularity || 0) >= popularityThreshold
    );

    console.log(
      `🎯 Advanced filtering complete: ${data.results.length} → ${qualityFiltered.length} tracks`
    );
    console.log(`📊 Artist diversity: ${artistCounts.size} unique artists`);
    console.log(
      `💿 Album diversity: ${albumCounts.size} unique albums (prevents soundtrack flooding)`
    );
    console.log(
      `📈 Popularity threshold: ${popularityThreshold}+ (avg: ${Math.round(
        qualityFiltered.reduce(
          (sum: number, t: any) => sum + (t.popularity || 0),
          0
        ) / qualityFiltered.length
      )})`
    );

    // Validate results
    validateSearchResults(qualityFiltered, type);

    return { ...data, results: qualityFiltered };
  };

  // Handle different categories using simple 2024/2025 top tracks strategy
  const playlistId = getPlaylistIdForSection(category || "", type || "");

  console.log(
    `🔍 Checking content strategy for ${category}-${type}: strategy = ${playlistId}`
  );

  if (playlistId === "ADVANCED_SEARCH" || playlistId) {
    console.log(
      `🎵 Using simple 2024/2025 top tracks strategy for ${category}-${type}`
    );

    // Simple two-query strategy for 2024 and 2025 top tracks
    const query2024 = "year:2024";
    const query2025 = "year:2025";

    console.log(
      `🔍 Query 1: "${query2024}" with limit=50 (market=US hardcoded in SpotifyAPI)`
    );
    console.log(
      `🔍 Query 2: "${query2025}" with limit=50 (market=US hardcoded in SpotifyAPI)`
    );

    const query1Result = spotifyApi.useSearchMusicQuery(
      {
        query: query2024,
        type: category === "albums" ? "album" : "track",
        limit: 50,
      },
      { skip }
    );

    const query2Result = spotifyApi.useSearchMusicQuery(
      {
        query: query2025,
        type: category === "albums" ? "album" : "track",
        limit: 50,
      },
      { skip }
    );

    // Combine results from both 2024 and 2025 queries
    const allResults = [query1Result, query2Result];
    const isMultiQuery = true;

    // Check if both queries are loaded
    const allLoaded = allResults.every((result) => !result.isLoading);
    const hasError = allResults.some((result) => result.isError);
    const isLoading = allResults.some((result) => result.isLoading);

    if (isMultiQuery && allLoaded && !hasError) {
      // Combine results from both 2024 and 2025 queries
      const combinedTracks: any[] = [];

      allResults.forEach((result, index) => {
        if (!skip && result.data?.results) {
          const queryYear = index === 0 ? "2024" : "2025";
          console.log(
            `📊 ${queryYear} Query: ${result.data.results.length} tracks`
          );
          combinedTracks.push(...result.data.results);
        }
      });

      console.log(
        `🚀 Combined 2024/2025 Results: ${combinedTracks.length} total tracks from 2 year-based queries`
      );

      if (combinedTracks.length > 0) {
        // Apply enhanced filtering to combined results
        const combinedData = { results: combinedTracks };
        const enhancedData = advancedFilterResults(combinedData, type || "");

        return {
          data: enhancedData,
          isLoading: false,
          isFetching: false,
          isError: false,
          error: undefined,
        } as any;
      }
    }

    // For single-query sections or while loading, use primary query
    return {
      ...query1Result,
      data: query1Result.data
        ? advancedFilterResults(query1Result.data, type || "")
        : undefined,
      isLoading: isLoading,
      isError: hasError,
    };
  }

  // Default fallback - empty results
  return {
    data: {
      results: [],
    },
    isLoading: false,
    isFetching: false,
    isError: false,
    error: undefined,
  } as any;
};

export const useGetTrackQuery = (
  args: { category: string; id: number | string },
  options?: { skip?: boolean }
) => {
  const { category, id } = args;
  const { skip = false } = options || {};

  // Check if we should use mock data
  const useMockData = shouldUseMockData();

  // Handle both string and number IDs properly
  let stringId: string;
  if (typeof id === "number") {
    stringId = String(id);
  } else {
    stringId = id;
  }

  // Validate that we have a proper ID
  if (
    !stringId ||
    stringId.trim() === "" ||
    stringId === "undefined" ||
    stringId === "null"
  ) {
    console.error("Invalid ID provided to useGetShowQuery:", id);
    return {
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: true,
      error: { status: 400, message: "Invalid ID provided" },
    } as any;
  }

  // In mock mode, try to find track by ID in mock data
  if (useMockData) {
    console.log(`🎭 Mock track lookup for ID: ${stringId}`);
    const mockTrack = getMockTrackById(stringId);
    if (mockTrack) {
      return {
        data: mockTrack,
        isLoading: false,
        isFetching: false,
        isError: false,
        error: undefined,
      } as any;
    } else {
      return {
        data: undefined,
        isLoading: false,
        isFetching: false,
        isError: true,
        error: { status: 404, message: "Track not found in mock data" },
      } as any;
    }
  }

  if (category === "tracks") {
    return spotifyApi.useGetTrackQuery({ id: stringId }, { skip });
  } else if (category === "albums") {
    // Transform album response to track format for compatibility
    const albumQuery = spotifyApi.useGetAlbumQuery({ id: stringId }, { skip });
    return {
      ...albumQuery,
      data: albumQuery.data
        ? {
            ...albumQuery.data,
            artist: albumQuery.data.artists?.[0] || "",
            album: albumQuery.data.name,
            duration: 0,
            preview_url: null,
            title: albumQuery.data.name,
            genres: [],
          }
        : undefined,
    };
  } else if (category === "artists") {
    // Handle artist details
    const artistQuery = spotifyApi.useGetArtistQuery(
      { id: stringId },
      { skip }
    );
    return {
      ...artistQuery,
      data: artistQuery.data
        ? {
            ...artistQuery.data,
            artist: artistQuery.data.name,
            album: "",
            duration: 0,
            preview_url: null,
            title: artistQuery.data.name,
            genres: artistQuery.data.genres || [],
          }
        : undefined,
    };
  }

  // Fallback: try to search for the ID (for unknown categories or legacy support)
  const searchQuery = spotifyApi.useSearchMusicQuery(
    {
      query: stringId,
      type: "track",
      limit: 50,
    },
    { skip }
  );
  return {
    ...searchQuery,
    data:
      searchQuery.data?.results.find((track) => track.id === stringId) ||
      undefined,
  };
};
