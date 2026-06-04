import type { Message, Peer } from "crossws";
import type { ClientMessage, ServerMessage } from "~/types/sync";

type RoomState = {
  streamUrl: string;
  paused: boolean;
  currentTime: number;
  updatedAt: number;
  peers: Set<Peer>;
};

const rooms = new Map<string, RoomState>();
const peerRooms = new WeakMap<Peer, string>();

function getRoom(roomId: string) {
  let room = rooms.get(roomId);

  if (!room) {
    room = {
      streamUrl: "",
      paused: true,
      currentTime: 0,
      updatedAt: Date.now(),
      peers: new Set(),
    };
    rooms.set(roomId, room);
  }

  return room;
}

function getRoomId(peer: Peer) {
  try {
    const url = new URL(peer.request?.url ?? "");
    return url.searchParams.get("room")?.trim() || "lobby";
  } catch {
    return "lobby";
  }
}

function send(peer: Peer, message: ServerMessage) {
  peer.send(JSON.stringify(message));
}

function broadcast(room: RoomState, message: ServerMessage, except?: Peer) {
  for (const peer of room.peers) {
    if (peer !== except) send(peer, message);
  }
}

function isValidStreamUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function readCurrentTime(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
}

function getLiveCurrentTime(room: RoomState) {
  if (room.paused) return room.currentTime;
  return room.currentTime + Math.max(0, (Date.now() - room.updatedAt) / 1000);
}

export function joinWatchRoom(peer: Peer) {
  const roomId = getRoomId(peer);
  const room = getRoom(roomId);

  room.peers.add(peer);
  peerRooms.set(peer, roomId);

  send(peer, {
    type: "snapshot",
    roomId,
    streamUrl: room.streamUrl,
    paused: room.paused,
    currentTime: getLiveCurrentTime(room),
    updatedAt: room.updatedAt,
    viewerCount: room.peers.size,
  });
  broadcast(room, { type: "presence", viewerCount: room.peers.size });
}

export function handleWatchRoomMessage(peer: Peer, message: Message) {
  const roomId = peerRooms.get(peer);
  if (!roomId) return;

  const room = rooms.get(roomId);
  if (!room) return;

  let payload: ClientMessage;

  try {
    payload = JSON.parse(message.text()) as ClientMessage;
  } catch {
    send(peer, { type: "error", message: "Invalid sync message." });
    return;
  }

  switch (payload.type) {
    case "setStream": {
      if (!isValidStreamUrl(payload.streamUrl)) {
        send(peer, { type: "error", message: "Use a full http or https stream URL." });
        return;
      }

      room.streamUrl = payload.streamUrl.trim();
      room.currentTime = 0;
      room.paused = true;
      room.updatedAt = Date.now();
      broadcast(room, { type: "streamChanged", streamUrl: room.streamUrl }, peer);
      broadcast(room, {
        type: "playbackChanged",
        paused: room.paused,
        currentTime: room.currentTime,
        updatedAt: room.updatedAt,
      });
      break;
    }
    case "play":
    case "pause":
    case "seek": {
      room.currentTime = readCurrentTime(payload.currentTime);
      room.paused = payload.type === "pause";
      room.updatedAt = Date.now();
      broadcast(room, {
        type: "playbackChanged",
        paused: room.paused,
        currentTime: room.currentTime,
        updatedAt: room.updatedAt,
      }, peer);
      break;
    }
    case "position": {
      if (room.paused) return;
      room.currentTime = readCurrentTime(payload.currentTime);
      room.updatedAt = Date.now();
      break;
    }
  }
}

export function leaveWatchRoom(peer: Peer) {
  const roomId = peerRooms.get(peer);
  if (!roomId) return;

  const room = rooms.get(roomId);
  if (!room) return;

  room.peers.delete(peer);
  peerRooms.delete(peer);

  if (room.peers.size === 0 && !room.streamUrl) {
    rooms.delete(roomId);
    return;
  }

  broadcast(room, { type: "presence", viewerCount: room.peers.size });
}
