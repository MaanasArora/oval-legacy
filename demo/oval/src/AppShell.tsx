export default function AppShell({
  sidebar,
  canvas,
  analysis
}: {
  sidebar: React.ReactNode;
  canvas: React.ReactNode;
  analysis: React.ReactNode;
}) {
  return (
    <div className="h-screen w-screen bg-slate-100 text-slate-800 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-semibold tracking-tight">oval</h1>
          <span className="text-xs text-slate-500">
            Opinion Visualization with Annotated Labels
          </span>
        </div>

        <span className="text-xs text-slate-400">experimental demo</span>
      </header>

      {/* Main workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 shrink-0 border-r border-slate-200 bg-white flex flex-col">
          <div className="flex-1 overflow-y-auto px-5 py-6">{sidebar}</div>
        </aside>

        {/* Canvas */}
        <main className="flex-1 overflow-hidden p-6">
          <div className="h-full w-full rounded-xl border border-slate-200 bg-white">
            {canvas}
          </div>
        </main>

        <main className="flex-1 overflow-hidden p-6">
          <div className="h-full w-full rounded-xl border border-slate-200 bg-white">
            {analysis}
          </div>
        </main>
      </div>
    </div>
  );
}
