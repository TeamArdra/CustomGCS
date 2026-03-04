import { Compass, Gauge, Radio, Zap } from 'lucide-react';

export default function CalibrationPage() {
  const sensors = [
    { name: 'Compass', icon: Compass, status: 'Calibrated', lastCal: '2 days ago' },
    { name: 'Accelerometer', icon: Gauge, status: 'Needs Calibration', lastCal: 'Never' },
    { name: 'Radio', icon: Radio, status: 'Calibrated', lastCal: '1 week ago' },
    { name: 'ESC', icon: Zap, status: 'Calibrated', lastCal: '3 days ago' },
  ];

  return (
    <div className="h-full w-full bg-gradient-to-br from-slate-900/20 to-slate-950/20 p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800/50 pb-6">
        <h1 className="text-5xl font-bold text-slate-50 mb-2">Calibration</h1>
        <p className="text-base text-slate-400 font-light">Sensor calibration and configuration</p>
      </div>

      {/* Sensor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sensors.map((sensor, index) => (
          <div key={index} className="rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/80 to-slate-950/60 p-6 shadow-xl shadow-black/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-indigo-500/20 p-3 ring-1 ring-indigo-500/30">
                  <sensor.icon className="h-6 w-6 text-indigo-300" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-200">{sensor.name}</h3>
                  <p className="text-xs text-slate-500">Last: {sensor.lastCal}</p>
                </div>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                sensor.status === 'Calibrated' 
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'bg-amber-500/15 text-amber-300'
              }`}>
                {sensor.status}
              </span>
            </div>
            <button className="w-full px-4 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors">
              Start Calibration
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
