export default function Nav() {
  return (
    <nav class="sticky top-0 z-20 border-b border-white/10 bg-slate-950/75 shadow-lg shadow-cyan-950/20 backdrop-blur-xl">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 text-slate-100">
        <a href="/" class="flex items-center gap-3 text-sm font-semibold tracking-wide text-slate-50">
          <span class="grid size-9 place-items-center rounded-full bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/25">
            W
          </span>
          <span>Watch Party Debrid</span>
        </a>
        <span class="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-200">
          No login
        </span>
      </div>
    </nav>
  );
}
