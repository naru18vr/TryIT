import { useEffect, useRef, useState } from "react";

type PlayerStateEvent = { data: number };

type YouTubePlayerInstance = {
  destroy: () => void;
};

type YouTubeApi = {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      playerVars: Record<string, number>;
      events: {
        onReady?: () => void;
        onStateChange: (event: PlayerStateEvent) => void;
      };
    },
  ) => YouTubePlayerInstance;
  PlayerState: { PLAYING: number };
};

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<YouTubeApi> | null = null;

function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise<YouTubeApi>((resolve, reject) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error("YouTube IFrame API could not be initialized."));
    };

    const existingScript = document.getElementById("youtube-iframe-api");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "youtube-iframe-api";
      script.src = "https://www.youtube.com/iframe_api";
      script.onerror = () => reject(new Error("YouTube IFrame API could not be loaded."));
      document.head.appendChild(script);
    }
  });
  return youtubeApiPromise;
}

/** True exactly once for the first genuine playback transition. */
export function shouldRecordPlayback(isPlaying: boolean, isWatched: boolean, alreadyRecorded: boolean) {
  return isPlaying && !isWatched && !alreadyRecorded;
}

export function shouldUsePlayerFallback(playerReady: boolean, playerFailed: boolean) {
  return playerFailed || !playerReady;
}

export function YouTubePlayer({
  videoId,
  title,
  isWatched,
  onPlaybackStarted,
}: {
  videoId: string;
  title: string;
  isWatched: boolean;
  onPlaybackStarted: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const recordedRef = useRef(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [playerFailed, setPlayerFailed] = useState(false);

  useEffect(() => {
    recordedRef.current = false;
    setPlayerReady(false);
    setPlayerFailed(false);
    let player: YouTubePlayerInstance | null = null;
    let disposed = false;
    const fallbackTimer = window.setTimeout(() => {
      if (!disposed) setPlayerFailed(true);
    }, 3500);

    void loadYouTubeApi().then((youtube) => {
      if (disposed || !hostRef.current) return;
      player = new youtube.Player(hostRef.current, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: () => {
            window.clearTimeout(fallbackTimer);
            setPlayerReady(true);
          },
          onStateChange: (event) => {
            const isPlaying = event.data === youtube.PlayerState.PLAYING;
            if (shouldRecordPlayback(isPlaying, isWatched, recordedRef.current)) {
              recordedRef.current = true;
              onPlaybackStarted();
            }
          },
        },
      });
    }).catch(() => setPlayerFailed(true));

    return () => {
      disposed = true;
      window.clearTimeout(fallbackTimer);
      player?.destroy();
    };
  }, [isWatched, onPlaybackStarted, videoId]);

  const showFallback = shouldUsePlayerFallback(playerReady, playerFailed);
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;

  return (
    <div className="relative h-full w-full bg-black" aria-label={`${title} のYouTubeプレイヤー`}>
      {!playerReady && !playerFailed && (
        <img
          src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-80"
        />
      )}
      {!showFallback && <div ref={hostRef} className="absolute inset-0 h-full w-full" />}
      {showFallback && (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      )}
    </div>
  );
}
