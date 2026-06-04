import { defineWebSocketHandler } from "nitro";
import { handleWatchRoomMessage, joinWatchRoom, leaveWatchRoom } from "~/services/watch-room";

export default defineWebSocketHandler({
  open: joinWatchRoom,
  message: handleWatchRoomMessage,
  close: leaveWatchRoom,
});
