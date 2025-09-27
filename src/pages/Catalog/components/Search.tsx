import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { GoSearch, GoX, GoClock } from "react-icons/go";
import { FiTrendingUp } from "react-icons/fi";

interface SearchProps {
  setQuery: (val: {}) => void;
  isLoading?: boolean;
  hasResults?: boolean;
  resultsCount?: number;
}

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'trending' | 'suggestion';
}

const Search: React.FC<SearchProps> = ({ setQuery, isLoading = false, hasResults = true, resultsCount: _resultsCount = 0 }) => {
  const { category } = useParams();
  const [search, setSearch] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock trending/popular search suggestions based on category
  const getTrendingSuggestions = (): SearchSuggestion[] => {
    const baseSuggestions = {
      tracks: [
        { id: '1', text: 'pop hits 2024', type: 'trending' as const },
        { id: '2', text: 'hip hop', type: 'trending' as const },
        { id: '3', text: 'r&b classics', type: 'trending' as const },
        { id: '4', text: 'indie rock', type: 'trending' as const },
        { id: '5', text: 'electronic dance', type: 'trending' as const }
      ],
      albums: [
        { id: '1', text: 'new releases 2024', type: 'trending' as const },
        { id: '2', text: 'grammy winners', type: 'trending' as const },
        { id: '3', text: 'classic albums', type: 'trending' as const },
        { id: '4', text: 'soundtrack', type: 'trending' as const },
        { id: '5', text: 'greatest hits', type: 'trending' as const }
      ],
      playlists: [
        { id: '1', text: 'workout music', type: 'trending' as const },
        { id: '2', text: 'chill vibes', type: 'trending' as const },
        { id: '3', text: 'party playlist', type: 'trending' as const },
        { id: '4', text: 'study music', type: 'trending' as const },
        { id: '5', text: 'road trip', type: 'trending' as const }
      ]
    };
    return baseSuggestions[category as keyof typeof baseSuggestions] || baseSuggestions.tracks;
  };

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`recent_searches_${category}`);
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved).slice(0, 3));
      } catch (e) {
        console.warn('Failed to load recent searches:', e);
      }
    }
  }, [category]);

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    executeSearch(search.trim());
  };

  const executeSearch = (searchTerm: string) => {
    setQuery({ search: searchTerm });
    setSearch("");
    setShowSuggestions(false);

    // Save to recent searches
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem(`recent_searches_${category}`, JSON.stringify(updated));
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    executeSearch(suggestion.text);
  };

  const clearSearch = () => {
    setSearch("");
    inputRef.current?.focus();
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(`recent_searches_${category}`);
  };

  const getSuggestions = (): SearchSuggestion[] => {
    const trending = getTrendingSuggestions();
    const recent = recentSearches.map((text, index) => ({
      id: `recent-${index}`,
      text,
      type: 'recent' as const
    }));

    // Show recent first, then trending
    return [...recent, ...trending].slice(0, 6);
  };

  return (
    <div className="text-[14px] lg:py-10 md:pt-9 md:pb-10 sm:pt-8 sm:pb-10 pt-6 pb-8 flex flex-col items-center justify-center">
      {/* Search Form */}
      <form
        className="flex flex-row items-center justify-center relative"
        onSubmit={handleSubmit}
        ref={searchRef}
      >
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            className="py-[8px] pl-[20px] pr-[36px] rounded-full outline-hidden w-[300px] md:w-[340px] shadow-md transition-all duration-300 focus:shadow-xs text-[#666] focus:bg-[#ffffff] bg-[#fdfdfd] font-medium dark:bg-[#302d3a] dark:text-primary dark:focus:bg-[#474550]"
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            value={search}
            placeholder={(() => {
              switch (category) {
                case 'tracks':
                  return 'Search tracks, artists, genres...';
                case 'albums':
                  return 'Search albums, artists...';
                case 'playlists':
                  return 'Search playlists, moods...';
                default:
                  return 'Search music...';
              }
            })()}
          />

          {/* Clear button */}
          {search && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-[36px] top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
            >
              <GoX className="w-4 h-4" />
            </button>
          )}

          {/* Search button */}
          <button
            type="submit"
            disabled={isLoading || !search.trim()}
            className="text-[18px] absolute right-[8px] top-1/2 transform -translate-y-1/2 text-[#ff0000] z-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#ff0000] border-t-transparent" />
            ) : (
              <GoSearch />
            )}
          </button>
        </div>

        {/* Search Suggestions Dropdown */}
        {showSuggestions && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-10" onClick={() => setShowSuggestions(false)} />

            {/* Suggestions */}
            <div className="absolute top-full mt-2 left-0 w-[300px] md:w-[340px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
              <div className="p-2">
                {getSuggestions().length > 0 ? (
                  <>
                    {/* Recent Searches Header */}
                    {recentSearches.length > 0 && (
                      <>
                        <div className="flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          <span>Recent</span>
                          <button
                            onClick={clearRecentSearches}
                            className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                          >
                            Clear
                          </button>
                        </div>
                        {getSuggestions()
                          .filter(s => s.type === 'recent')
                          .map((suggestion) => (
                            <button
                              key={suggestion.id}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-700 dark:text-gray-300"
                            >
                              <GoClock className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{suggestion.text}</span>
                            </button>
                          ))
                        }
                        {getSuggestions().filter(s => s.type === 'trending').length > 0 && (
                          <hr className="my-2 border-gray-200 dark:border-gray-600" />
                        )}
                      </>
                    )}

                    {/* Trending Suggestions */}
                    {getSuggestions().filter(s => s.type === 'trending').length > 0 && (
                      <>
                        <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Trending
                        </div>
                        {getSuggestions()
                          .filter(s => s.type === 'trending')
                          .map((suggestion) => (
                            <button
                              key={suggestion.id}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-700 dark:text-gray-300"
                            >
                              <FiTrendingUp className="w-4 h-4 text-red-500" />
                              <span className="text-sm">{suggestion.text}</span>
                            </button>
                          ))
                        }
                      </>
                    )}
                  </>
                ) : (
                  <div className="px-3 py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                    Start typing to search for {category === 'tracks' ? 'tracks' : category === 'albums' ? 'albums' : 'music'}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </form>

      {/* Search Results Summary */}
      {!hasResults && !isLoading && (
        <div className="mt-4 text-center max-w-md">
          <div className="text-gray-500 dark:text-gray-400 text-sm mb-2">
            No results found. Try searching for:
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {getTrendingSuggestions().slice(0, 3).map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => executeSearch(suggestion.text)}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {suggestion.text}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;
