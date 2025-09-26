import { useCallback, useEffect, useRef, useState } from "react";
import { mcpAudioService } from "../services/MCPAudioService.js";
import type { ITrack } from "../types.js";

interface AudioPlayerState {
  currentTrack: ITrack | null;
  isPlaying: boolean;
  progress: number;
  volume: number;
  isShuffled: boolean;
  repeatMode: "off" | "one" | "all";
  isMinimized: boolean;
  effectiveDurationMs?: number;
  queue: ITrack[];
  currentIndex: number;
}

export const useAudioPlayer = () => {
  const [state, setState] = useState<AudioPlayerState>({
    currentTrack: null,
    isPlaying: false,
    progress: 0,
    volume: 80,
    isShuffled: false,
    repeatMode: "off",
    isMinimized: false,
    queue: [],
    currentIndex: -1,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const simulationInterval = useRef<NodeJS.Timeout | null>(null);
  const hasProbedAudioContext = useRef<boolean>(false);
  const playNextRef = useRef<(opts?: { auto?: boolean }) => void>();

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();

    const audio = audioRef.current;
    // Ensure sane defaults to avoid accelerated playback
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    // Normalize playback parameters
    audio.defaultPlaybackRate = 1.0;
    audio.playbackRate = 1.0;
    // Preserve pitch across playbackRate changes (where supported)
    if (typeof (audio as any).preservesPitch !== "undefined")
      (audio as any).preservesPitch = true;
    if (typeof (audio as any).mozPreservesPitch !== "undefined")
      (audio as any).mozPreservesPitch = true;
    if (typeof (audio as any).webkitPreservesPitch !== "undefined")
      (audio as any).webkitPreservesPitch = true;

    const handleEnded = () => {
      console.log("🔚 AUDIO DEBUG: Track ended naturally");
      playNextRef.current?.({ auto: true });
    };
    audio.muted = false;
    audio.defaultMuted = false;

    const handleLoadStart = () => {
      console.log("📥 AUDIO DEBUG: Audio loading started");
    };

    const handleCanPlay = () => {
      console.log("✅ AUDIO DEBUG: Audio can start playing (canplay event)");
    };

    const handleLoadedMetadata = () => {
      if (!audio.duration || Number.isNaN(audio.duration)) {
        console.log("⚠️ AUDIO DEBUG: Invalid duration in metadata");
        return;
      }
      const durationMs = Math.round(audio.duration * 1000);
      setState((prev) => ({ ...prev, effectiveDurationMs: durationMs }));
      console.log("🔧 AUDIO DEBUG: Loaded metadata duration(ms):", durationMs);
      console.log(
        "🔧 AUDIO DEBUG: playbackRate/defaultPlaybackRate:",
        audio.playbackRate,
        audio.defaultPlaybackRate
      );
    };

    const handleError = (e: Event) => {
      console.error("❌ AUDIO DEBUG: Audio error event:", e);
      if (audio.error) {
        console.error("❌ AUDIO DEBUG: Audio error details:", {
          code: audio.error.code,
          message: audio.error.message,
        });
      }
      setState((prev) => ({ ...prev, isPlaying: false }));
    };

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("error", handleError);

    // Set initial volume
    audio.volume = state.volume / 100;

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("error", handleError);
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
      }
    };
  }, []);

  // Add a console log to track volume changes
  useEffect(() => {
    if (audioRef.current) {
      const newVolume = state.volume / 100;
      audioRef.current.volume = newVolume;
      console.log(`🔊 AUDIO DEBUG: Volume set to ${newVolume}`);
    }
  }, [state.volume]);

  // Update progress
  useEffect(() => {
    if (
      state.isPlaying &&
      audioRef.current &&
      state.currentTrack?.preview_url
    ) {
      // Ensure playback rate is normal
      audioRef.current.defaultPlaybackRate = 1.0;
      audioRef.current.playbackRate = 1.0;

      progressInterval.current = setInterval(() => {
        const audio = audioRef.current;
        if (audio && audio.duration && !audio.paused) {
          const currentProgress = (audio.currentTime / audio.duration) * 100;
          setState((prev) => ({ ...prev, progress: currentProgress }));

          // Auto-advance when audio naturally ends
          if (currentProgress >= 99.5) {
            setState((prev) => ({ ...prev, isPlaying: false, progress: 0 }));
          }
        }
      }, 250); // Optimized for smoother UI - 4 updates per second
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    };
  }, [state.isPlaying, state.currentTrack?.preview_url]);

  const playTrack = useCallback(
    async (track: ITrack, options?: { queue?: ITrack[]; index?: number }) => {
      console.log("🎵 Playing track:", track.title || track.name);

      // Clear any existing simulation interval
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
        simulationInterval.current = null;
      }

      // If it's the same track, just toggle play/pause
      if (state.currentTrack?.id === track.id) {
        setState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
        if (state.isPlaying) {
          audioRef.current?.pause();
          if (simulationInterval.current) {
            clearInterval(simulationInterval.current);
            simulationInterval.current = null;
          }
        } else {
          if (audioRef.current && state.currentTrack.preview_url) {
            // Ensure AudioContext is resumed
            if (audioRef.current.paused && !hasProbedAudioContext.current) {
              const audioContext = new (window.AudioContext ||
                (window as any).webkitAudioContext)();
              if (audioContext.state === "suspended") {
                audioContext.resume();
              }
              hasProbedAudioContext.current = true;
            }
            audioRef.current.play().catch(console.error);
          }
        }
        return;
      }

      // Set new track immediately for responsive UI
      setState((prev) => ({
        ...prev,
        currentTrack: track,
        isPlaying: true,
        progress: 0,
      }));

      try {
        // Check if track already has preview URL
        if ("preview_url" in track && track.preview_url) {
          console.log(
            "✅ Track already has preview URL:",
            track.preview_url.substring(0, 50) + "..."
          );
          var enhancedTrack = track;
        } else {
          // Try to enhance the track with MCP preview URL
          console.log(
            "🔄 MCP: Enhancing track with preview URL...",
            track.name
          );
          var enhancedTrack = await mcpAudioService.enhanceTrackWithPreview(
            track
          );

          console.log("🎯 MCP: Enhancement result:", {
            trackName: enhancedTrack.name,
            hasPreviewUrl: !!enhancedTrack.preview_url,
            previewUrl: enhancedTrack.preview_url
              ? "Available"
              : "Not available",
          });
        }

        // Update the current track with enhanced data
        setState((prev) => ({
          ...prev,
          currentTrack: enhancedTrack,
        }));

        // Load and play audio if preview URL is available
        if (audioRef.current && enhancedTrack.preview_url) {
          console.log(
            "🎶 Loading real preview URL:",
            enhancedTrack.preview_url.substring(0, 50) + "..."
          );
          console.log(
            "🔧 AUDIO DEBUG: Full preview URL:",
            enhancedTrack.preview_url
          );

          // Enhanced audio debugging
          const audio = audioRef.current;
          // Reset rate controls defensively before setting src
          audio.defaultPlaybackRate = 1.0;
          audio.playbackRate = 1.0;
          audio.src = enhancedTrack.preview_url;
          audio.volume = state.volume / 100;
          // Preserve pitch flags after src assignment for Safari/WebKit quirks
          if (typeof (audio as any).preservesPitch !== "undefined")
            (audio as any).preservesPitch = true;
          if (typeof (audio as any).mozPreservesPitch !== "undefined")
            (audio as any).mozPreservesPitch = true;
          if (typeof (audio as any).webkitPreservesPitch !== "undefined")
            (audio as any).webkitPreservesPitch = true;

          console.log("🔧 AUDIO DEBUG: Audio element state:", {
            src: audio.src,
            volume: audio.volume,
            muted: audio.muted,
            readyState: audio.readyState,
            networkState: audio.networkState,
            canPlay: audio.readyState >= 3,
          });

          // Add event listeners for detailed debugging
          const handleLoadedData = () => {
            console.log("✅ AUDIO DEBUG: Audio data loaded successfully");
            console.log("🔧 AUDIO DEBUG: Duration:", audio.duration, "seconds");
            if (audio.duration) {
              setState((prev) => ({
                ...prev,
                effectiveDurationMs: Math.round(audio.duration * 1000),
              }));
            }
            console.log(
              "🔧 AUDIO DEBUG: playbackRate/defaultPlaybackRate on loadeddata:",
              audio.playbackRate,
              audio.defaultPlaybackRate
            );
          };

          const handleCanPlay = () => {
            console.log(
              "✅ AUDIO DEBUG: Audio can play - ready state:",
              audio.readyState
            );
          };

          const handlePlay = () => {
            console.log(
              "✅ AUDIO DEBUG: Play event fired - audio should be playing now"
            );
            console.log(
              "🔧 AUDIO DEBUG: Current time:",
              audio.currentTime,
              "Paused:",
              audio.paused
            );
            console.log(
              "🔧 AUDIO DEBUG: playbackRate/defaultPlaybackRate on play:",
              audio.playbackRate,
              audio.defaultPlaybackRate
            );
          };

          const handleError = (e: Event) => {
            console.error("❌ AUDIO DEBUG: Audio error event:", e);
            if (audio.error) {
              console.error("❌ AUDIO DEBUG: Audio error details:", {
                code: audio.error.code,
                message: audio.error.message,
              });
            }
          };

          audio.addEventListener("loadeddata", handleLoadedData);
          audio.addEventListener("canplay", handleCanPlay);
          audio.addEventListener("play", handlePlay);
          audio.addEventListener("error", handleError);

          try {
            if (!hasProbedAudioContext.current) {
              hasProbedAudioContext.current = true;
              try {
                // Probe AudioContext to log device sample rate for diagnostics
                const AC: any =
                  (window as any).AudioContext ||
                  (window as any).webkitAudioContext;
                if (AC) {
                  const ctx = new AC();
                  console.log(
                    "🔧 AUDIO DEBUG: AudioContext sampleRate:",
                    ctx.sampleRate
                  );
                  // Some browsers start suspended; close quickly to free resources
                  ctx.close?.();
                } else {
                  console.log(
                    "🔧 AUDIO DEBUG: AudioContext not available, using HTMLAudioElement only"
                  );
                }
              } catch (ctxErr) {
                console.log(
                  "🔧 AUDIO DEBUG: AudioContext probe failed; proceeding with <audio> only",
                  ctxErr
                );
              }
            }

            console.log("🎵 AUDIO DEBUG: Attempting to play...");

            // Wait for audio to be ready before playing
            if (audio.readyState < 3) {
              console.log("⏳ AUDIO DEBUG: Waiting for audio to load...");
              await new Promise((resolve) => {
                const onCanPlay = () => {
                  console.log("✅ AUDIO DEBUG: Audio ready to play");
                  audio.removeEventListener("canplaythrough", onCanPlay);
                  resolve(void 0);
                };
                audio.addEventListener("canplaythrough", onCanPlay);

                // Timeout after 5 seconds if audio doesn't load
                setTimeout(() => {
                  audio.removeEventListener("canplaythrough", onCanPlay);
                  console.log(
                    "⚠️ AUDIO DEBUG: Timeout waiting for audio to load, attempting play anyway"
                  );
                  resolve(void 0);
                }, 5000);
              });
            }

            const playPromise = await audio.play();
            console.log(
              "✅ AUDIO DEBUG: Play promise resolved successfully:",
              playPromise
            );
            console.log(
              "🔧 AUDIO DEBUG: After play() - paused:",
              audio.paused,
              "currentTime:",
              audio.currentTime
            );
          } catch (error) {
            console.error("❌ AUDIO DEBUG: Play promise rejected:", error);
            console.error("❌ AUDIO DEBUG: Error details:", {
              name: (error as Error).name,
              message: (error as Error).message,
              audioSrc: audio.src,
              audioVolume: audio.volume,
              audioMuted: audio.muted,
            });

            // Explicit fallback to native <audio> re-attach cycle
            try {
              console.log(
                "🔄 AUDIO DEBUG: Retrying with fresh <audio> element"
              );
              const fresh = new Audio();
              fresh.preload = "auto";
              fresh.crossOrigin = "anonymous";
              fresh.defaultPlaybackRate = 1.0;
              fresh.playbackRate = 1.0;
              if (typeof (fresh as any).preservesPitch !== "undefined")
                (fresh as any).preservesPitch = true;
              if (typeof (fresh as any).mozPreservesPitch !== "undefined")
                (fresh as any).mozPreservesPitch = true;
              if (typeof (fresh as any).webkitPreservesPitch !== "undefined")
                (fresh as any).webkitPreservesPitch = true;
              fresh.src = audio.src;
              fresh.volume = audio.volume;
              audioRef.current = fresh;
              await fresh.play();
              console.log("✅ AUDIO DEBUG: Fallback <audio> play succeeded");
            } catch (fallbackErr) {
              console.log(
                "⚠️ AUDIO DEBUG: Fallback <audio> also failed, but keeping player active for manual control",
                fallbackErr
              );
              // Don't automatically start simulation - let user control the player
              setState((prev) => ({ ...prev, isPlaying: false }));
            }
          } finally {
            // Clean up event listeners
            setTimeout(() => {
              audio.removeEventListener("loadeddata", handleLoadedData);
              audio.removeEventListener("canplay", handleCanPlay);
              audio.removeEventListener("play", handlePlay);
              audio.removeEventListener("error", handleError);
            }, 5000);
          }
        } else {
          console.log("⚠️ No preview URL available - using simulation");
          startSimulation();
        }
      } catch (error) {
        console.error(
          "❌ MCP service error, falling back to simulation:",
          error
        );
        startSimulation();
      }

      function startSimulation() {
        console.log("⚠️ Starting simulation for track without preview URL");
        // Simulate progress for tracks without preview URLs
        // Use track's actual duration if available, otherwise default to 3 minutes
        const trackDurationMs =
          state.currentTrack?.duration ||
          state.effectiveDurationMs ||
          3 * 60 * 1000; // 3 minutes default

        const updateIntervalMs = 250; // Update every 250ms
        const totalUpdates = trackDurationMs / updateIntervalMs;
        const progressIncrement = 100 / totalUpdates; // Calculate increment based on actual duration

        console.log(
          `🔧 Simulation setup: Duration=${trackDurationMs}ms, Increment=${progressIncrement.toFixed(
            3
          )}%`
        );

        let simulatedProgress = 0;
        simulationInterval.current = setInterval(() => {
          simulatedProgress += progressIncrement;
          setState((prev) => ({ ...prev, progress: simulatedProgress }));

          if (simulatedProgress >= 100) {
            if (simulationInterval.current) {
              clearInterval(simulationInterval.current);
              simulationInterval.current = null;
            }
            setState((prev) => ({ ...prev, isPlaying: false, progress: 0 }));
          }
        }, updateIntervalMs);
      }
    },
    [
      state.currentTrack?.id,
      state.isPlaying,
      state.queue,
      state.volume,
      state.effectiveDurationMs,
    ]
  );

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current
        .play()
        .then(() => setState((prev) => ({ ...prev, isPlaying: true })))
        .catch((err) =>
          console.error("❌ AUDIO DEBUG: togglePlayPause play() failed:", err)
        );
    } else {
      audioRef.current.pause();
      setState((prev) => ({ ...prev, isPlaying: false }));
    }
  }, []);

  const seek = useCallback((progress: number) => {
    if (audioRef.current && audioRef.current.duration) {
      const newTime = (progress / 100) * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
      setState((prev) => ({ ...prev, progress }));
      console.log(`⏩ AUDIO DEBUG: Seek to ${newTime.toFixed(2)}s`);
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    setState((prev) => ({ ...prev, volume }));
  }, []);

  const toggleShuffle = useCallback(() => {
    setState((prev) => {
      const isShuffled = !prev.isShuffled;
      console.log(`🔀 AUDIO DEBUG: Shuffle mode ${isShuffled ? "ON" : "OFF"}`);
      return { ...prev, isShuffled };
    });
  }, []);

  const setRepeatMode = useCallback((mode: "off" | "one" | "all") => {
    setState((prev) => {
      console.log(`🔁 AUDIO DEBUG: Repeat mode set to ${mode}`);
      return { ...prev, repeatMode: mode };
    });
  }, []);

  const playNextTrack = useCallback(
    (opts: { auto?: boolean } = {}) => {
      // queue-aware next logic + repeat + shuffle
      const { queue, currentIndex, isShuffled, repeatMode } = state;

      if (queue.length === 0) {
        console.log("⚠️ AUDIO DEBUG: Empty queue, cannot play next track");
        return;
      }

      let newIndex = currentIndex;
      if (isShuffled) {
        // Random track from the queue
        newIndex = Math.floor(Math.random() * queue.length);
      } else {
        // Sequential track
        newIndex = (currentIndex + 1) % queue.length;
      }

      const nextTrack = queue[newIndex];
      if (!nextTrack) {
        console.log("⚠️ AUDIO DEBUG: Next track not found in queue");
        return;
      }

      console.log(
        `⏭️ AUDIO DEBUG: Playing next track (index: ${newIndex})`,
        nextTrack.title || nextTrack.name
      );

      setState((prev) => ({
        ...prev,
        currentTrack: nextTrack,
        isPlaying: true,
        progress: 0,
        currentIndex: newIndex,
      }));

      // Play the next track
      playTrack(nextTrack, { index: newIndex });
    },
    [state, playTrack]
  );

  const playPreviousTrack = useCallback(() => {
    // queue-aware previous logic
    const { queue, currentIndex, repeatMode } = state;

    if (queue.length === 0) {
      console.log("⚠️ AUDIO DEBUG: Empty queue, cannot play previous track");
      return;
    }

    let newIndex = currentIndex;
    if (repeatMode === "one") {
      // Repeat the same track
      newIndex = currentIndex;
    } else if (repeatMode === "all") {
      // Go to the last track in the queue
      newIndex = (currentIndex - 1 + queue.length) % queue.length;
    } else {
      // Normal playback, do nothing if at the start
      if (currentIndex === 0) return;
      newIndex = currentIndex - 1;
    }

    const prevTrack = queue[newIndex];
    if (!prevTrack) {
      console.log("⚠️ AUDIO DEBUG: Previous track not found in queue");
      return;
    }

    console.log(
      `⏮️ AUDIO DEBUG: Playing previous track (index: ${newIndex})`,
      prevTrack.title || prevTrack.name
    );

    setState((prev) => ({
      ...prev,
      currentTrack: prevTrack,
      isPlaying: true,
      progress: 0,
      currentIndex: newIndex,
    }));

    // Play the previous track
    playTrack(prevTrack, { index: newIndex });
  }, [state, playTrack]);

  useEffect(() => {
    playNextRef.current = playNextTrack;
  }, [playNextTrack]);

  const toggleMinimize = useCallback(() => {
    setState((prev) => ({ ...prev, isMinimized: !prev.isMinimized }));
  }, []);

  const closePlayer = useCallback(() => {
    // reset queue & state
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }

    setState({
      currentTrack: null,
      isPlaying: false,
      progress: 0,
      volume: 80,
      isShuffled: false,
      repeatMode: "off",
      isMinimized: false,
      queue: [],
      currentIndex: -1,
    });
  }, []);

  return {
    currentTrack: state.currentTrack,
    isPlaying: state.isPlaying,
    progress: state.progress,
    volume: state.volume,
    isShuffled: state.isShuffled,
    repeatMode: state.repeatMode,
    isMinimized: state.isMinimized,
    queue: state.queue,
    currentIndex: state.currentIndex,
    playTrack,
    togglePlayPause,
    seek,
    setVolume,
    toggleShuffle,
    setRepeatMode,
    playNextTrack,
    playPreviousTrack,
    toggleMinimize,
    closePlayer,
  };
};
