import { useEffect, useState } from "react";
import { FiLoader } from "react-icons/fi";
import { useParams, useSearchParams } from "react-router-dom";


import { Error, ErrorBoundary, SkelatonLoader } from "@/common";
import { AlbumCard } from "@/components/ui/AlbumCard";
import { TrackCard } from "@/components/ui/TrackCard";
import { useGetTracksQuery } from "@/services/MusicAPI";
import { smallMaxWidth } from "@/styles";
import { ITrack } from "@/types";
import { Search, SortOptions, ViewToggle } from "./components";

interface CatalogProps {
  audioPlayer?: any;
}

const Catalog = ({ audioPlayer }: CatalogProps) => {
  const [page, setPage] = useState(1);
  const [tracks, setTracks] = useState<ITrack[]>([]);
  const [isCategoryChanged, setIsCategoryChanged] = useState<boolean>(false);
  const [query, setQuery] = useSearchParams();
  const { category } = useParams();

  const type = query.get("type") || "popular";
  const searchQuery = query.get("search") || "";
  const sortBy = query.get("sort") || "popularity";
  const viewMode = query.get("view") || "grid";


  const { data, isLoading, isFetching, isError } = useGetTracksQuery({
    category,
    page,
    searchQuery,
    type,
  });

  useEffect(() => {
    setPage(1);
    setIsCategoryChanged(true);
  }, [category, searchQuery]);

  // Sorting function
  const sortTracks = (tracks: ITrack[], sortBy: string): ITrack[] => {
    const sortedTracks = [...tracks];

    switch (sortBy) {
      case 'popularity':
        return sortedTracks.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      case 'release_date':
        return sortedTracks.sort((a, b) => (b.id || '').localeCompare(a.id || ''));
      case 'alphabetical':
        return sortedTracks.sort((a, b) => (a.name || a.title || '').localeCompare(b.name || b.title || ''));
      case 'duration':
        return sortedTracks.sort((a, b) => (a.duration || 0) - (b.duration || 0));
      default:
        return sortedTracks;
    }
  };

  useEffect(() => {
    if (isLoading || isFetching) return;

    if (data?.results) {
      const newResults = sortTracks(data.results, sortBy);

      const dedupe = (items: ITrack[]) => {
        const seen = new Set<string>();
        const out: ITrack[] = [];
        for (const t of items) {
          const key = t.spotify_id || t.id || `${t.name}-${t.artist}-${t.album}`;
          if (!key) continue;
          if (seen.has(key)) continue;
          seen.add(key);
          out.push(t);
        }
        return out;
      };

      if (page > 1) {
        setTracks((prev) => dedupe([...prev, ...newResults]));
      } else {
        setTracks(dedupe(newResults));
        setIsCategoryChanged(false);
      }
    }
  }, [data, isFetching, isLoading, page, sortBy]);

  return (
    <ErrorBoundary>
      <section className={`${smallMaxWidth}`}>
        <Search
          setQuery={setQuery}
          isLoading={isLoading || isFetching}
          hasResults={tracks.length > 0}
          resultsCount={tracks.length}
        />


        {/* Controls Bar */}
        <div className="px-4 sm:px-6 lg:px-8 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <SortOptions category={String(category)} />
            </div>
            <ViewToggle category={String(category)} />
          </div>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 lg:px-8">
          {isLoading || isCategoryChanged ? (
            <SkelatonLoader isMoviesSliderLoader={false} />
          ) : isError ? (
            <Error error="Unable to load content. Please try again later." className="h-96" />
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                  : "space-y-4"
              }
            >
              {tracks?.map((item) => {
                const key = item.spotify_id || item.id || `${item.name}-${item.artist}-${item.album}`;
                return (
                  <div key={key}>
                    {category === 'albums' ? (
                      <AlbumCard
                        album={item as any}
                        variant={viewMode === 'list' ? 'compact' : 'detailed'}
                        isPlaying={audioPlayer?.currentTrack?.id === item.id && audioPlayer?.isPlaying}
                        onPlay={audioPlayer?.playTrack}
                      />
                    ) : (
                      <TrackCard
                        track={item}
                        category={String(category)}
                        variant={viewMode === 'list' ? 'compact' : 'detailed'}
                        isPlaying={audioPlayer?.currentTrack?.id === item.id && audioPlayer?.isPlaying}
                        onPlay={audioPlayer?.playTrack}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More */}
          {isFetching && !isCategoryChanged ? (
            <div className="my-4">
              <FiLoader className="mx-auto dark:text-gray-300 w-5 h-5 animate-spin" />
            </div>
          ) : !isError && tracks.length > 0 && (
            <div className="w-full flex items-center justify-center mt-8">
              <button
                type="button"
                onClick={() => {
                  setPage(page + 1);
                }}
                disabled={isFetching}
                className="sm:py-2 xs:py-[6px] py-1 sm:px-4 xs:px-3 px-[10.75px] bg-[#ff0000] text-gray-50 rounded-full md:text-[15.25px] sm:text-[14.75px] xs:text-[14px] text-[12.75px] shadow-md hover:-translate-y-1 transition-all duration-300 font-medium font-nunito my-4"
              >
                Load more
              </button>
            </div>
          )}
        </div>
      </section>
    </ErrorBoundary>
  );
};

export default Catalog;
