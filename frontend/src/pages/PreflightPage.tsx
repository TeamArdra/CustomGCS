import { CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';

export default function PreflightPage() {
  const checks = [
    { name: 'GPS Lock', status: 'pass', message: '12 satellites' },
    { name: 'Battery Level', status: 'pass', message: '98% (14.8V)' },
    { name: 'IMU Calibration', status: 'pending', message: 'Awaiting data...' },
    { name: 'Compass Calibration', status: 'pending', message: 'Awaiting data...' },
    { name: 'RC Link', status: 'fail', message: 'No signal detected' },
    { name: 'Motor Test', status: 'pending', message: 'Not performed' },
  ];

  return (
    <div className="h-full w-full bg-gradient-to-br from-slate-900/20 to-slate-950/20 p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800/50 pb-6">
        <h1 className="text-5xl font-bold text-slate-50 mb-2">Preflight Checks</h1>
        <p className="text-base text-slate-400 font-light">System verification and safety checks</p>
      </div>

      {/* Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {checks.map((check, index) => (
          <div key={index} className="rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/80 to-slate-950/60 p-6 shadow-xl shadow-black/30">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-200 mb-1">{check.name}</h3>
                <p className="text-sm text-slate-400">{check.message}</p>
              </div>
              <div>
                {check.status === 'pass' && <CheckCircle2 className="h-6 w-6 text-emerald-400" />}
                {check.status === 'fail' && <XCircle className="h-6 w-6 text-rose-400" />}
                {check.status === 'pending' && <Clock className="h-6 w-6 text-amber-400" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/80 to-slate-950/60 p-6 shadow-xl shadow-black/30">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-amber-400" />
          <div>
            <h3 className="text-lg font-semibold text-slate-200">Not Ready for Flight</h3>
            <p className="text-sm text-slate-400">Complete all checks before arming</p>
          </div>
        </div>
      </div>
    </div>
  );
}
