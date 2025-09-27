import { lazy, Suspense, useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";

import {
  DemoModeBadge,
  ErrorBoundary,
  Footer,
  Header,
  Loader,
  ScrollToTop,
  SideBar,
} from "@/common";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { MiniPlayer } from "@/components/ui/MiniPlayer";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

import "react-loading-skeleton/dist/skeleton.css";
import "swiper/css";

const Catalog = lazy(() => import("./pages/Catalog"));
const Home = lazy(() => import("./pages/Home"));
const Detail = lazy(() => import("./pages/Detail"));
const NotFound = lazy(() => import("./pages/NotFound"));

const App = () => {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const audioPlayer = useAudioPlayer();

  // Debug: Log when Command Palette state changes
  useEffect(() => {
    console.log('Command Palette state changed:', isCommandPaletteOpen);
  }, [isCommandPaletteOpen]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log('Key pressed:', { key: e.key, metaKey: e.metaKey, ctrlKey: e.ctrlKey });

      // Cmd+K or Ctrl+K to open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        console.log('Command palette shortcut triggered');
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <SideBar />
      <Header onOpenSearch={() => setIsCommandPaletteOpen(true)} />
      <DemoModeBadge />
      <main className="transition-all duration-300 lg:pb-14 md:pb-4 sm:pb-2 xs:pb-1 pb-0 bg-white dark:bg-deep-dark min-h-screen">
        <ScrollToTop>
          <ErrorBoundary>
            <Suspense fallback={<Loader />}>
              <Routes>
                <Route path="/" element={<Home audioPlayer={audioPlayer} />} />
                <Route path="/:category/:id" element={<Detail audioPlayer={audioPlayer} />} />
                <Route path="/:category" element={<Catalog audioPlayer={audioPlayer} />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </ScrollToTop>
      </main>

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onItemSelect={(item) => {
          console.log('Selected item:', item);
          // Handle item selection - navigation only (no audio player)
        }}
      />

      <Footer />

      {/* Mini Player */}
      <MiniPlayer
        currentTrack={audioPlayer.currentTrack}
        isPlaying={audioPlayer.isPlaying}
        progress={audioPlayer.progress}
        volume={audioPlayer.volume}
        isShuffled={audioPlayer.isShuffled}
        repeatMode={audioPlayer.repeatMode}
        onTogglePlay={audioPlayer.togglePlay}
        onSkipPrevious={audioPlayer.skipPrevious}
        onSkipNext={audioPlayer.skipNext}
        onSeek={audioPlayer.seek}
        onVolumeChange={audioPlayer.setVolume}
        onToggleShuffle={audioPlayer.toggleShuffle}
        onToggleRepeat={audioPlayer.toggleRepeat}
        onToggleFavorite={audioPlayer.toggleFavorite}
        onClose={audioPlayer.closePlayer}
        isMinimized={audioPlayer.isMinimized}
        onToggleMinimize={audioPlayer.toggleMinimize}
      />
    </>
  );
};

export default App;
