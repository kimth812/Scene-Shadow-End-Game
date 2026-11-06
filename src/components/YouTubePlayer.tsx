import { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { MOVIE_SETTINGS, ONE_LINE_CREDIT } from '../types';
import { ExternalLink, AlertTriangle, Play, RefreshCw } from 'lucide-react';

export interface YouTubePlayerHandle {
  playSegment: (start: number, end: number, loop?: boolean, onEnd?: () => void) => void;
  pause: () => void;
  getCurrentTime: () => number;
  setSpeed: (rate: number) => void;
  seekTo: (seconds: number) => void;
  isReady: boolean;
}

interface YouTubePlayerProps {
  onTimeUpdate?: (currentTime: number) => void;
  onPlaybackStateChange?: (isPlaying: boolean) => void;
  autoLoopDelayMs?: number; // default 1500ms
  showCredit?: boolean;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

export const YouTubePlayer = forwardRef<YouTubePlayerHandle, YouTubePlayerProps>(
  ({ onTimeUpdate, onPlaybackStateChange, autoLoopDelayMs = 1500, showCredit = true }, ref) => {
    const containerIdRef = useRef<string>(`yt-player-${Math.random().toString(36).substring(2, 9)}`);
    const playerRef = useRef<any>(null);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [currentSpeed, setCurrentSpeed] = useState<number>(1.0);
    const [isPlaying, setIsPlaying] = useState(false);

    // Segment control tracking refs
    const currentSegmentRef = useRef<{
      start: number;
      end: number;
      loop: boolean;
      onEnd?: () => void;
    } | null>(null);

    const loopTimeoutRef = useRef<number | null>(null);
    const intervalRef = useRef<number | null>(null);

    // Stop segment tracking interval
    const stopSegmentInterval = useCallback(() => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, []);

    // Stop any scheduled loop replay
    const cancelLoopTimeout = useCallback(() => {
      if (loopTimeoutRef.current !== null) {
        window.clearTimeout(loopTimeoutRef.current);
        loopTimeoutRef.current = null;
      }
    }, []);

    const pause = useCallback(() => {
      cancelLoopTimeout();
      stopSegmentInterval();
      if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
        try {
          playerRef.current.pauseVideo();
        } catch (e) {
          console.warn('pause error', e);
        }
      }
      setIsPlaying(false);
      onPlaybackStateChange?.(false);
    }, [cancelLoopTimeout, stopSegmentInterval, onPlaybackStateChange]);

    const playSegmentInternal = useCallback(
      (start: number, end: number, loop: boolean = false, onEnd?: () => void) => {
        cancelLoopTimeout();
        stopSegmentInterval();

        if (!playerRef.current || typeof playerRef.current.seekTo !== 'function') {
          console.warn('YouTube player not ready yet');
          return;
        }

        currentSegmentRef.current = { start, end, loop, onEnd };

        try {
          playerRef.current.seekTo(start, true);
          playerRef.current.playVideo();
          setIsPlaying(true);
          onPlaybackStateChange?.(true);
        } catch (e) {
          console.warn('Playback error', e);
        }

        // Check time every 100ms per PRD requirements
        intervalRef.current = window.setInterval(() => {
          if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') {
            return;
          }

          try {
            const time = playerRef.current.getCurrentTime();
            onTimeUpdate?.(time);

            const seg = currentSegmentRef.current;
            if (seg && time >= seg.end) {
              // Pause immediately
              playerRef.current.pauseVideo();
              setIsPlaying(false);
              onPlaybackStateChange?.(false);
              stopSegmentInterval();

              if (seg.onEnd) {
                seg.onEnd();
              }

              // If loop is on, wait 1.5 seconds then replay
              if (seg.loop) {
                loopTimeoutRef.current = window.setTimeout(() => {
                  if (currentSegmentRef.current?.loop) {
                    playSegmentInternal(seg.start, seg.end, true, seg.onEnd);
                  }
                }, autoLoopDelayMs);
              }
            }
          } catch (err) {
            console.error('Time check error', err);
          }
        }, 100);
      },
      [cancelLoopTimeout, stopSegmentInterval, autoLoopDelayMs, onPlaybackStateChange, onTimeUpdate]
    );

    const getCurrentTime = useCallback((): number => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          return playerRef.current.getCurrentTime() || 0;
        } catch {
          return 0;
        }
      }
      return 0;
    }, []);

    const setSpeed = useCallback((rate: number) => {
      setCurrentSpeed(rate);
      if (playerRef.current && typeof playerRef.current.setPlaybackRate === 'function') {
        try {
          playerRef.current.setPlaybackRate(rate);
        } catch (e) {
          console.warn('Set playback rate error', e);
        }
      }
    }, []);

    const seekTo = useCallback((seconds: number) => {
      if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
        try {
          playerRef.current.seekTo(seconds, true);
        } catch (e) {
          console.warn('seekTo error', e);
        }
      }
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        playSegment: (start: number, end: number, loop = false, onEnd) => {
          playSegmentInternal(start, end, loop, onEnd);
        },
        pause,
        getCurrentTime,
        setSpeed,
        seekTo,
        isReady: isPlayerReady,
      }),
      [playSegmentInternal, pause, getCurrentTime, setSpeed, seekTo, isPlayerReady]
    );

    // Initialize YouTube Iframe API
    useEffect(() => {
      let isMounted = true;

      function createPlayer() {
        if (!window.YT || !window.YT.Player) return;
        const targetEl = document.getElementById(containerIdRef.current);
        if (!targetEl) return;

        try {
          playerRef.current = new window.YT.Player(containerIdRef.current, {
            videoId: MOVIE_SETTINGS.videoId,
            playerVars: {
              start: MOVIE_SETTINGS.startSeconds,
              end: MOVIE_SETTINGS.endSeconds,
              playsinline: 1,
              rel: 0,
              modestbranding: 1,
              controls: 1,
              cc_load_policy: 0,
              iv_load_policy: 3,
            },
            events: {
              onReady: () => {
                if (isMounted) {
                  setIsPlayerReady(true);
                  setHasError(false);
                }
              },
              onStateChange: (event: any) => {
                if (!isMounted) return;
                // YT.PlayerState.PLAYING is 1, PAUSED is 2, ENDED is 0
                if (event.data === 1) {
                  setIsPlaying(true);
                  onPlaybackStateChange?.(true);
                } else if (event.data === 2 || event.data === 0) {
                  setIsPlaying(false);
                  onPlaybackStateChange?.(false);
                }
              },
              onError: (event: any) => {
                if (!isMounted) return;
                // 101 or 150 = cannot be embedded
                console.warn('YouTube Player error code:', event.data);
                setHasError(true);
                if (event.data === 101 || event.data === 150) {
                  setErrorMessage(
                    "This video can't play inside the app due to YouTube restrictions. Tap below to open it directly on YouTube."
                  );
                } else {
                  setErrorMessage("The video player couldn't load. Tap below to open it on YouTube.");
                }
              },
            },
          });
        } catch (err) {
          console.error('Failed to create YouTube player', err);
          if (isMounted) setHasError(true);
        }
      }

      // Load YouTube Iframe API script if not already present
      if (!window.YT || !window.YT.Player) {
        const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
        if (!existingScript) {
          const tag = document.createElement('script');
          tag.src = 'https://www.youtube.com/iframe_api';
          const firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
        }

        const prevOnReady = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          if (prevOnReady) prevOnReady();
          if (isMounted) createPlayer();
        };
      } else {
        createPlayer();
      }

      return () => {
        isMounted = false;
        cancelLoopTimeout();
        stopSegmentInterval();
        if (playerRef.current && typeof playerRef.current.destroy === 'function') {
          try {
            playerRef.current.destroy();
          } catch (e) {
            console.warn('Player destroy error', e);
          }
        }
      };
    }, [cancelLoopTimeout, stopSegmentInterval, onPlaybackStateChange]);

    return (
      <div className="w-full flex flex-col">
        {/* 16:9 Video Aspect Ratio Container */}
        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg border border-emerald-950/80">
          {hasError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-slate-900 to-slate-950 text-slate-100">
              <AlertTriangle className="w-10 h-10 text-amber-400 mb-2" />
              <p className="text-sm font-medium mb-1 text-slate-200">
                This video can&apos;t play inside the app.
              </p>
              <p className="text-xs text-slate-400 mb-4 max-w-xs">
                {errorMessage || 'YouTube restricted embed playback.'}
              </p>
              <a
                href={`https://www.youtube.com/watch?v=${MOVIE_SETTINGS.videoId}&t=${MOVIE_SETTINGS.startSeconds}s`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs tracking-wide shadow-md transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open on YouTube (10s) / 유튜브에서 열기</span>
              </a>
              <p className="text-[11px] text-slate-500 mt-3">
                Sentence text, recording, and self-check continue to work normally!
              </p>
            </div>
          ) : (
            <>
              <div id={containerIdRef.current} className="w-full h-full" />
              {!isPlayerReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-400 gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                  <span className="text-xs text-slate-400 font-medium tracking-wide">
                    Loading Movie Clip / 클립 불러오는 중...
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Mandatory One-Line Credit Under Video (At least 13px, gray) */}
        {showCredit && (
          <div className="mt-2 px-1">
            <p className="text-[13px] leading-snug text-slate-400 font-normal">
              {ONE_LINE_CREDIT}
            </p>
          </div>
        )}
      </div>
    );
  }
);

YouTubePlayer.displayName = 'YouTubePlayer';
