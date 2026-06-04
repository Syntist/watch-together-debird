export function isValidStreamUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function createRoomId() {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(36).padStart(2, "0")).join("").slice(0, 12);
}

export function createRoomSocketUrl(roomId: string) {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws?room=${encodeURIComponent(roomId)}`;
}
