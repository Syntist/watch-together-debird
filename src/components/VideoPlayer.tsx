import { onCleanup, onMount } from "solid-js";
import type videojs from "video.js";
import "video.js/dist/video-js.css";

type VideoPlayerProps = {
  onVideoReady: (element: HTMLVideoElement) => void;
  onPlay: () => void;
  onPause: () => void;
  onEnded: () => void;
  onSeeked: () => void;
  onError: () => void;
};

export default function VideoPlayer(props: VideoPlayerProps) {
  let videoRef: HTMLVideoElement | undefined;
  let player: ReturnType<typeof videojs> | undefined;

  onMount(async () => {
    if (!videoRef) return;

    props.onVideoReady(videoRef);

    console.log("Initializing video.js player with ref:", videoRef);

    const { default: createVideoJsPlayer } = await import("video.js");

    player = createVideoJsPlayer(videoRef, {
      controls: true,
      fluid: true,
      preload: "auto",
      responsive: true,
      html5: {
        vhs: {
          enableLowInitialPlaylist: true,
          smoothQualityChange: true,
        },
      },
    });
  });

  onCleanup(() => {
    player?.dispose();
  });

  return (
    <video
      ref={element => {
        videoRef = element;
      }}
      class="video-js vjs-big-play-centered vjs-fill aspect-video w-full bg-black"
      controls
      playsinline
      onPlay={() => props.onPlay()}
      onPause={() => props.onPause()}
      onEnded={() => props.onEnded()}
      onSeeked={() => props.onSeeked()}
      onError={() => props.onError()}
    />
  );
}
