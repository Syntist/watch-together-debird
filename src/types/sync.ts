export type PlaybackState = {
  paused: boolean;
  currentTime: number;
  updatedAt: number;
};

export type ClientMessage =
  | { type: "setStream"; streamUrl: string }
  | { type: "play"; currentTime: number }
  | { type: "pause"; currentTime: number }
  | { type: "seek"; currentTime: number }
  | { type: "position"; currentTime: number };

export type ServerMessage =
  | {
      type: "snapshot";
      roomId: string;
      streamUrl: string;
      paused: boolean;
      currentTime: number;
      updatedAt: number;
      viewerCount: number;
    }
  | { type: "streamChanged"; streamUrl: string }
  | { type: "playbackChanged"; paused: boolean; currentTime: number; updatedAt: number }
  | { type: "presence"; viewerCount: number }
  | { type: "error"; message: string };
