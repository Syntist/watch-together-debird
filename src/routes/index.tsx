import { useNavigate } from "@solidjs/router";
import { createSignal } from "solid-js";
import { createRoomId, isValidStreamUrl } from "~/lib/stream";

export default function Home() {
  const navigate = useNavigate();
  const [streamUrl, setStreamUrl] = createSignal("");
  const [error, setError] = createSignal("");

  const createRoom = () => {
    const nextStreamUrl = streamUrl().trim();

    if (!nextStreamUrl) {
      setError("Paste a direct stream URL to create a room.");
      return;
    }

    if (!isValidStreamUrl(nextStreamUrl)) {
      setError("Use a full http or https stream URL.");
      return;
    }

    const roomId = createRoomId();
    const params = new URLSearchParams({ src: nextStreamUrl });
    navigate(`/watch/${roomId}?${params.toString()}`);
  };

  return (
    <main class="min-h-[calc(100vh-65px)] bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_85%_12%,rgba(129,140,248,0.14),transparent_30%),linear-gradient(135deg,#070b16_0%,#101827_48%,#07111f_100%)]">
      <section class="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.05fr_0.95fr] md:items-center md:py-16">
        <div class="space-y-7">
          <div class="space-y-4">
            <p class="inline-flex rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1 text-sm font-medium text-cyan-100 shadow-lg shadow-cyan-950/20">
              Manual debrid stream rooms
            </p>
            <h1 class="max-w-3xl text-4xl font-semibold leading-tight text-slate-50 sm:text-5xl">
              Paste a stream link, start a synced watch party.
            </h1>
            <p class="max-w-2xl text-base leading-7 text-slate-300">
              Bring a direct browser-playable media URL from TorBox, Real-Debrid, or another debrid source.
              The room syncs the player state across everyone with the same share link.
            </p>
          </div>

          <form
            class="space-y-4 rounded-[28px] border border-white/10 bg-white/[0.08] p-5 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl"
            onSubmit={event => {
              event.preventDefault();
              createRoom();
            }}
          >
            <label for="stream-url" class="block text-sm font-medium text-slate-100">
              Direct stream URL
            </label>
            <div class="flex flex-col gap-3 sm:flex-row">
              <input
                id="stream-url"
                type="url"
                value={streamUrl()}
                onInput={event => {
                  setStreamUrl(event.currentTarget.value);
                  setError("");
                }}
                placeholder="https://..."
                class="min-h-14 flex-1 rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-slate-100 shadow-inner shadow-black/30 outline-none transition placeholder:text-slate-500 hover:border-white/20 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/15"
              />
              <button
                type="submit"
                class="min-h-14 rounded-2xl bg-cyan-300 px-6 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-200 focus:outline-none focus:ring-4 focus:ring-cyan-300/25"
              >
                Create Room
              </button>
            </div>
            <p class="min-h-5 text-sm text-rose-300">{error()}</p>
          </form>
        </div>

        <div class="rounded-[32px] border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-indigo-950/30 backdrop-blur-xl">
          <div class="aspect-video overflow-hidden rounded-[24px] border border-white/10 bg-slate-950 shadow-inner shadow-black/40">
            <div class="flex h-full items-center justify-center bg-[linear-gradient(135deg,rgba(34,211,238,0.14),rgba(99,102,241,0.10)_45%,rgba(15,23,42,0.9))] px-6 text-center text-sm text-slate-400">
              <span class="rounded-full border border-white/10 bg-white/5 px-4 py-2">Shared player initializes after room creation</span>
            </div>
          </div>
          <div class="mt-5 grid gap-3 text-sm text-slate-300">
            <div class="flex items-center justify-between rounded-2xl bg-white/[0.05] px-4 py-3">
              <span>Room access</span>
              <span class="font-medium text-slate-50">Anonymous link</span>
            </div>
            <div class="flex items-center justify-between rounded-2xl bg-white/[0.05] px-4 py-3">
              <span>Sync events</span>
              <span class="font-medium text-slate-50">Play, pause, seek</span>
            </div>
            <div class="flex items-center justify-between rounded-2xl bg-white/[0.05] px-4 py-3">
              <span>Storage</span>
              <span class="font-medium text-slate-50">In-memory MVP</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
