import { TrackCard } from "@/components/ui/TrackCard";
import { ITrack } from "@/types";
import { FC, useState } from "react";

interface MusicGridProps {
  tracks: ITrack[];
  category: string;
  initialDisplayCount?: number;
  loadMoreCount?: number;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  hasMoreContent?: boolean;
  audioPlayer?: any;
}

const MusicGrid: FC<MusicGridProps> = ({
  tracks,
  category,
  initialDisplayCount = 18, // Show 3 rows initially (6 columns * 3 rows)
  loadMoreCount = 18, // Load 3 more rows each time
  onLoadMore,
  isLoadingMore = false,
  hasMoreContent = false,
  audioPlayer,
}) => {
  const [visibleCount, setVisibleCount] = useState(initialDisplayCount);

  const handlePlay = (track: ITrack) => {
    if (audioPlayer?.playTrack) {
      audioPlayer.playTrack(track);
    } else {
      console.log('🎵 Track clicked:', track.name || track.title);
    }
  };

  const handleLoadMoreClick = () => {
    if (tracks.length > visibleCount) {
      // Show more of existing tracks first
      setVisibleCount(prev => Math.min(prev + loadMoreCount, tracks.length));
    } else if (onLoadMore && hasMoreContent) {
      // Load new tracks from API
      onLoadMore();
      setVisibleCount(prev => prev + loadMoreCount);
    }
  };

  // Ensure unique items and stable keys in render
  const uniqueTracks = (() => {
    const seen = new Set<string>();
    const result: ITrack[] = [];
    for (const track of tracks) {
      const key = track.spotify_id || track.id || `${track.name}-${track.artist}-${track.album}`;
      if (!key) continue;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(track);
    }
    return result;
  })();

  const displayedTracks = uniqueTracks.slice(0, visibleCount);
  const showLoadMoreButton =
    (uniqueTracks.length > visibleCount) || // More existing tracks to show
    (hasMoreContent && !isLoadingMore); // Or more content available from API

  return (
    <div className="w-full">
      {/* Grid container */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-6">
        {displayedTracks.map((track) => {
          const key = track.spotify_id || track.id || `${track.name}-${track.artist}-${track.album}`;
          return (
            <div key={key} className="flex flex-col">
              <TrackCard
                track={track}
                category={category}
                isPlaying={false}
                onPlay={handlePlay}
                variant="detailed"
              />
            </div>
          );
        })}
      </div>

      {/* Load More Button */}
      {showLoadMoreButton && (
        <div className="flex justify-center">
          <button
            onClick={handleLoadMoreClick}
            disabled={isLoadingMore}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            {isLoadingMore ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Loading...
              </div>
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}

      {/* Loading indicator when fetching more content */}
      {isLoadingMore && !showLoadMoreButton && (
        <div className="flex justify-center py-4">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            Loading more tracks...
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicGrid;
