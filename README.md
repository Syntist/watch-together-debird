# Watch Party Debrid

No-login watch party MVP for manually supplied browser-playable debrid stream URLs.

## Developing

```bash
npm run build
npm run start
```

Open `http://127.0.0.1:3000`, paste a direct `http` or `https` stream URL on the landing page, and share the generated `/watch/<roomId>` link.

`npm run dev` still runs the Vite development server for UI work, but this SolidStart alpha only wires the Nitro WebSocket route in the built server path.

## Behavior

- Rooms are anonymous and identified by the URL.
- The SolidStart/Nitro WebSocket endpoint is `/ws?room=<roomId>`.
- Room state is stored in memory and resets when the server restarts.
- The player syncs stream URL, play, pause, seek, late joins, and periodic playback position.
- Debrid links must be direct browser-playable media URLs. Provider CORS or hotlink rules can still block playback.
