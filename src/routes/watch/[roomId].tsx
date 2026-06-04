import { useParams, useSearchParams } from "@solidjs/router";
import { createSignal, Show } from "solid-js";
import VideoPlayer from "~/components/VideoPlayer";
import { createStreamSync } from "~/hooks/createStreamSync";

export default function WatchRoom() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const [linkCopied, setLinkCopied] = createSignal(false);

  const roomId = () => params.roomId ?? "room";
  const initialStreamUrl = typeof searchParams.src === "string" ? searchParams.src : "";
  const stream = createStreamSync({ roomId: roomId(), initialStreamUrl });

  const copyRoomLink = async () => {
    const shareUrl = `${window.location.origin}/watch/${encodeURIComponent(roomId())}`;
    await navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    window.setTimeout(() => setLinkCopied(false), 1500);
  };

  return (
    <main class="min-h-[calc(100vh-65px)] bg-[radial-gradient(circle_at_18%_0%,rgba(34,211,238,0.13),transparent_28%),radial-gradient(circle_at_85%_18%,rgba(129,140,248,0.15),transparent_28%),linear-gradient(135deg,#070b16_0%,#101827_50%,#07111f_100%)] px-4 py-6">
      <section class="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1fr_320px]">
        <div class="space-y-4">
          <div class="overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-2xl shadow-cyan-950/30">
            <div class="relative">
              <VideoPlayer
                onVideoReady={stream.setVideoRef}
                onPlay={stream.handleLocalPlay}
                onPause={stream.handleLocalPause}
                onEnded={stream.handleLocalEnded}
                onSeeked={stream.handleLocalSeeked}
                onError={() => stream.setMediaError("The browser could not play this URL. The link may be expired, blocked, or not a direct media stream.")}
              />

              <Show when={stream.needsLiveStart()}>
                <div class="absolute inset-0 grid place-items-center bg-slate-950/70 p-6 backdrop-blur-sm">
                  <button
                    type="button"
                    class="min-h-12 rounded-2xl bg-cyan-300 px-6 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:bg-cyan-200 focus:outline-none focus:ring-4 focus:ring-cyan-300/25"
                    onClick={stream.joinLive}
                  >
                    Join live
                  </button>
                </div>
              </Show>
            </div>
          </div>

          <Show when={stream.mediaError()}>
            <p class="rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100 shadow-lg shadow-amber-950/20 backdrop-blur">
              {stream.mediaError()}
            </p>
          </Show>
        </div>

        <aside class="space-y-4 rounded-[28px] border border-white/10 bg-white/[0.08] p-4 shadow-2xl shadow-indigo-950/30 backdrop-blur-xl">
          <div>
            <p class="text-xs font-medium uppercase tracking-wide text-cyan-200">Room</p>
            <h1 class="mt-1 break-all text-xl font-semibold text-slate-50">{roomId()}</h1>
          </div>

          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="rounded-2xl border border-white/10 bg-slate-950/60 p-3 shadow-inner shadow-black/20">
              <p class="text-slate-500">Socket</p>
              <p class="mt-1 font-medium text-slate-100">{stream.connectionStatus()}</p>
            </div>
            <div class="rounded-2xl border border-white/10 bg-slate-950/60 p-3 shadow-inner shadow-black/20">
              <p class="text-slate-500">Viewers</p>
              <p class="mt-1 font-medium text-slate-100">{stream.viewerCount()}</p>
            </div>
          </div>

          <p class="rounded-2xl border border-cyan-200/20 bg-cyan-200/10 px-4 py-3 text-sm text-cyan-100">{stream.syncStatus()}</p>

          <form
            class="space-y-3"
            onSubmit={event => {
              event.preventDefault();
              stream.updateStream();
            }}
          >
            <label for="room-stream-url" class="block text-sm font-medium text-slate-100">
              Stream URL
            </label>
            <input
              id="room-stream-url"
              type="url"
              value={stream.pendingStreamUrl()}
              onInput={event => {
                stream.setPendingStreamUrl(event.currentTarget.value);
                stream.setError("");
              }}
              placeholder="https://..."
              class="min-h-12 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-slate-100 shadow-inner shadow-black/30 outline-none transition placeholder:text-slate-500 hover:border-white/20 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/15"
            />
            <button
              type="submit"
              class="min-h-12 w-full rounded-2xl bg-cyan-300 px-4 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-200 focus:outline-none focus:ring-4 focus:ring-cyan-300/25"
            >
              Update Stream
            </button>
          </form>

          <button
            type="button"
            onClick={copyRoomLink}
            class="min-h-12 w-full rounded-2xl border border-white/15 bg-white/[0.04] px-4 text-sm font-semibold text-slate-100 transition hover:border-cyan-200/60 hover:bg-white/[0.08] focus:outline-none focus:ring-4 focus:ring-cyan-300/15"
          >
            {linkCopied() ? "Copied" : "Copy Room Link"}
          </button>

          <Show when={stream.error()}>
            <p class="rounded-2xl border border-rose-300/30 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">{stream.error()}</p>
          </Show>
        </aside>
      </section>
    </main>
  );
}
