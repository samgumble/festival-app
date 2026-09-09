export function App() {
  return (
    <main className="p-6 space-y-4">
      <div className="checker h-3" />
      <h1 className="font-display text-[32px] leading-9 text-structure-2">Lineup</h1>
      <p className="font-shade text-[56px] leading-none text-sun tabular-nums">09 : 04</p>
      <p className="eyebrow text-structure">Now playing · Main Stage</p>
      <p>Body copy in DM Sans on paper.</p>
      <div className="rounded-card bg-surface border border-hair shadow-card p-4">Card</div>
      <button className="rounded-ctl bg-sun text-ink font-semibold h-12 px-5 shadow-sun">Remind me</button>
      <button onClick={() => { const h = document.documentElement; h.dataset.theme = h.dataset.theme === "dark" ? "light" : "dark"; }}>toggle theme</button>
    </main>
  );
}
