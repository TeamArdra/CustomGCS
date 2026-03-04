import { Search, Download, Upload, RotateCcw } from 'lucide-react';

export default function ParametersPage() {
  const paramGroups = [
    { name: 'Flight Control', count: 45, modified: 3 },
    { name: 'Battery', count: 12, modified: 0 },
    { name: 'GPS', count: 8, modified: 1 },
    { name: 'Radio', count: 15, modified: 0 },
  ];

  return (
    <div className="h-full w-full bg-gradient-to-br from-slate-900/20 to-slate-950/20 p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800/50 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold text-slate-50 mb-2">Parameters</h1>
            <p className="text-base text-slate-400 font-light">Vehicle configuration parameters</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors">
              <Download className="h-4 w-4" />
              Download
            </button>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors">
              <Upload className="h-4 w-4" />
              Upload
            </button>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-sm font-medium transition-colors">
              <RotateCcw className="h-4 w-4" />
              Reset All
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
        <input
          type="text"
          placeholder="Search parameters..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-900/60 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
      </div>

      {/* Parameter Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paramGroups.map((group, index) => (
          <div key={index} className="rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/80 to-slate-950/60 p-6 shadow-xl shadow-black/30 hover:border-slate-600/60 transition-colors cursor-pointer">
            <h3 className="text-lg font-semibold text-slate-200 mb-2">{group.name}</h3>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span>{group.count} parameters</span>
              {group.modified > 0 && (
                <span className="text-amber-400 font-medium">{group.modified} modified</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
