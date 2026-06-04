import { createEffect, createSignal, onCleanup, onMount } from "solid-js";
import { createRoomSocketUrl, isValidStreamUrl } from "~/lib/stream";
import type { ClientMessage, ServerMessage } from "~/types/sync";

const DRIFT_SECONDS = 1.5;
const POSITION_INTERVAL_MS = 5_000;

type QueuedPlayback = {
  paused: boolean;
  currentTime: number;
};

type CreateStreamSyncOptions = {
  roomId: string;
  initialStreamUrl: string;
};

export function createStreamSync(options: CreateStreamSyncOptions) {
  const [streamUrl, setStreamUrl] = createSignal("");
  const [pendingStreamUrl, setPendingStreamUrl] = createSignal("");
  const [connectionStatus, setConnectionStatus] = createSignal("Connecting");
  const [syncStatus, setSyncStatus] = createSignal("Waiting for room state");
  const [viewerCount, setViewerCount] = createSignal(1);
  const [error, setError] = createSignal("");
  const [mediaError, setMediaError] = createSignal("");
  const [needsLiveStart, setNeedsLiveStart] = createSignal(false);

  let videoRef: HTMLVideoElement | undefined;
  let socket: WebSocket | undefined;
  let suppressPlayerEvents = false;
  let remotePlaybackEventWindowUntil = 0;
  let positionTimer: ReturnType<typeof setInterval> | undefined;
  let queuedPlayback: QueuedPlayback | undefined;

  const send = (message: ClientMessage) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  };

  const setVideoRef = (element: HTMLVideoElement) => {
    videoRef = element;
  };

  const clearPlayerSuppression = () => {
    window.setTimeout(() => {
      suppressPlayerEvents = false;
    }, 250);
  };

  const suppressRemotePlaybackEvents = () => {
    suppressPlayerEvents = true;
    remotePlaybackEventWindowUntil = Date.now() + 1_500;
  };

  const isRemotePlaybackEvent = () => suppressPlayerEvents || Date.now() < remotePlaybackEventWindowUntil;

  const applyRemoteTime = (time: number) => {
    if (!videoRef || !Number.isFinite(time)) return;
    if (Math.abs(videoRef.currentTime - time) <= DRIFT_SECONDS) return;
    suppressRemotePlaybackEvents();
    videoRef.currentTime = Math.max(0, time);
    clearPlayerSuppression();
  };

  const startRemotePlayback = async () => {
    if (!videoRef) return;

    try {
      await videoRef.play();
      setNeedsLiveStart(false);
    } catch {
      videoRef.muted = true;

      try {
        await videoRef.play();
        setNeedsLiveStart(false);
        setSyncStatus("Joined live muted. Unmute in the player when ready.");
      } catch {
        setNeedsLiveStart(true);
        setSyncStatus("Room is live. Press Join live to start playback.");
      }
    }
  };

  const applyPlayback = (paused: boolean, currentTime: number) => {
    applyRemoteTime(currentTime);
    if (!videoRef) return;

    suppressRemotePlaybackEvents();

    if (paused) {
      videoRef.autoplay = false;
      videoRef.removeAttribute("autoplay");
      videoRef.pause();
      setNeedsLiveStart(false);
      clearPlayerSuppression();
      return;
    }

    startRemotePlayback().finally(clearPlayerSuppression);
  };

  const handleMessage = (message: ServerMessage) => {
    switch (message.type) {
      case "snapshot":
        setViewerCount(message.viewerCount);
        queuedPlayback = undefined;
        if (message.streamUrl) {
          const isNewStream = message.streamUrl !== streamUrl();
          if (isNewStream) {
            queuedPlayback = { paused: message.paused, currentTime: message.currentTime };
          }
          setStreamUrl(message.streamUrl);
          setPendingStreamUrl(message.streamUrl);
        }
        if (!queuedPlayback) {
          applyPlayback(message.paused, message.currentTime);
        }
        if (!needsLiveStart()) setSyncStatus("Synced with room");
        break;
      case "streamChanged":
        setStreamUrl(message.streamUrl);
        setPendingStreamUrl(message.streamUrl);
        setMediaError("");
        setNeedsLiveStart(false);
        setSyncStatus("Stream updated");
        break;
      case "playbackChanged":
        applyPlayback(message.paused, message.currentTime);
        setSyncStatus(message.paused ? "Paused by room" : "Playing with room");
        break;
      case "presence":
        setViewerCount(message.viewerCount);
        break;
      case "error":
        setError(message.message);
        break;
    }
  };

  const updateStream = () => {
    const nextUrl = pendingStreamUrl().trim();

    if (!nextUrl) {
      setError("Paste a direct stream URL first.");
      return;
    }

    if (!isValidStreamUrl(nextUrl)) {
      setError("Use a full http or https stream URL.");
      return;
    }

    setError("");
    setMediaError("");
    setStreamUrl(nextUrl);
    send({ type: "setStream", streamUrl: nextUrl });
  };

  const joinLive = () => {
    suppressRemotePlaybackEvents();
    startRemotePlayback().finally(clearPlayerSuppression);
  };

  const handleLocalPlay = () => {
    setNeedsLiveStart(false);
    if (!isRemotePlaybackEvent() && videoRef) {
      send({ type: "play", currentTime: videoRef.currentTime });
    }
  };

  const handleLocalPause = () => {
    if (!isRemotePlaybackEvent() && videoRef) {
      send({ type: "pause", currentTime: videoRef.currentTime });
    }
  };

  const handleLocalEnded = () => {
    setNeedsLiveStart(false);
    if (!isRemotePlaybackEvent() && videoRef) {
      send({ type: "pause", currentTime: videoRef.currentTime });
    }
  };

  const handleLocalSeeked = () => {
    if (!isRemotePlaybackEvent() && videoRef) {
      send({ type: "seek", currentTime: videoRef.currentTime });
    }
  };

  onMount(() => {
    if (options.initialStreamUrl && isValidStreamUrl(options.initialStreamUrl)) {
      setStreamUrl(options.initialStreamUrl);
      setPendingStreamUrl(options.initialStreamUrl);
    }

    socket = new WebSocket(createRoomSocketUrl(options.roomId));

    socket.addEventListener("open", () => {
      setConnectionStatus("Connected");
      if (options.initialStreamUrl && isValidStreamUrl(options.initialStreamUrl)) {
        send({ type: "setStream", streamUrl: options.initialStreamUrl });
      }
    });

    socket.addEventListener("message", event => {
      try {
        handleMessage(JSON.parse(event.data) as ServerMessage);
      } catch {
        setError("Received an unreadable sync message.");
      }
    });

    socket.addEventListener("close", () => {
      setConnectionStatus("Disconnected");
      setSyncStatus("Room sync disconnected");
    });

    socket.addEventListener("error", () => {
      setConnectionStatus("Connection error");
      setSyncStatus("Room sync unavailable");
    });

    positionTimer = setInterval(() => {
      if (videoRef && !videoRef.paused) {
        send({ type: "position", currentTime: videoRef.currentTime });
      }
    }, POSITION_INTERVAL_MS);
  });

  onCleanup(() => {
    if (positionTimer) clearInterval(positionTimer);
    socket?.close();
  });

  createEffect(() => {
    const nextUrl = streamUrl();
    if (videoRef && nextUrl) {
      videoRef.src = nextUrl;
      videoRef.load();
      if (queuedPlayback) {
        const nextPlayback = queuedPlayback;
        queuedPlayback = undefined;
        window.setTimeout(() => applyPlayback(nextPlayback.paused, nextPlayback.currentTime), 0);
      }
    }
  });

  return {
    streamUrl,
    pendingStreamUrl,
    setPendingStreamUrl,
    connectionStatus,
    syncStatus,
    viewerCount,
    error,
    setError,
    mediaError,
    setMediaError,
    needsLiveStart,
    setVideoRef,
    updateStream,
    joinLive,
    handleLocalPlay,
    handleLocalPause,
    handleLocalEnded,
    handleLocalSeeked,
  };
}
