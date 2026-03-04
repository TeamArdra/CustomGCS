import { FileText, Download, Trash2, Search } from 'lucide-react';

export default function LogsPage() {
  const logs = [
    { name: 'flight_2026_03_04_14_32.bin', size: '2.4 MB', date: '4 Mar 2026, 14:32' },
    { name: 'flight_2026_03_03_09_15.bin', size: '1.8 MB', date: '3 Mar 2026, 09:15' },
    { name: 'flight_2026_03_02_16_45.bin', size: '3.1 MB', date: '2 Mar 2026, 16:45' },
  ];

  return (
    <div className="h-full w-full bg-gradient-to-br from-slate-900/20 to-slate-950/20 p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800/50 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold text-slate-50 mb-2">Flight Logs</h1>
            <p className="text-base text-slate-400 font-light">Flight logs and data analysis</p>
          </div>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-sm font-medium transition-colors">
            <Trash2 className="h-4 w-4" />
            Clear All
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
        <input
          type="text"
          placeholder="Search logs..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-900/60 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
      </div>

      {/* Log Files */}
      <div className="space-y-3">
        {logs.map((log, index) => (
          <div key={index} className="rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/80 to-slate-950/60 p-6 shadow-xl shadow-black/30 hover:border-slate-600/60 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-blue-500/20 p-3 ring-1 ring-blue-500/30">
                  <FileText className="h-6 w-6 text-blue-300" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-200">{log.name}</h3>
                  <p className="text-sm text-slate-400">{log.size} • {log.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors">
                  View
                </button>
                <button className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-200 transition-colors">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
