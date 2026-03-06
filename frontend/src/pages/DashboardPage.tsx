import { Activity, Gauge, Wind, Zap, Satellite, Compass as CompassIcon, Thermometer, BarChart3, WifiOff } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTelemetryStore } from '../store/telemetryStore';
import { useConnectionStore } from '../store/connectionStore';
import { startMockTelemetryStream } from '../utils/mockTelemetry';
import ArtificialHorizon from '../components/widgets/ArtificialHorizon';

export default function DashboardPage() {
  const [nowMs, setNowMs] = useState(Date.now());
  const telemetry = useTelemetryStore((state) => state.currentTelemetry);
  const updateTelemetry = useTelemetryStore((state) => state.updateTelemetry);
  const setIsReceiving = useTelemetryStore((state) => state.setIsReceiving);
  const { mockMode, setConnected, isConnected } = useConnectionStore();

  // Show telemetry only when connected (mock or live)
  const displayTelemetry = isConnected ? telemetry : null;
  const telemetryDelayMs = useMemo(() => {
    if (!displayTelemetry?.timestamp) {
      return null;
    }
    return Math.max(0, nowMs - displayTelemetry.timestamp);
  }, [displayTelemetry?.timestamp, nowMs]);

  useEffect(() => {
    if (!mockMode) {
      setIsReceiving(false);
      return;
    }

    // Start mock telemetry stream
    const stop = startMockTelemetryStream((data) => {
      updateTelemetry(data);
      setIsReceiving(true);
      setConnected(true); // Connected when receiving data
    }, 500);

    return () => {
      stop();
      setIsReceiving(false);
      setConnected(false);
    };
  }, [mockMode, updateTelemetry, setIsReceiving, setConnected]);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 200);
    return () => clearInterval(timer);
  }, []);

  const telemetryDelayTone =
    telemetryDelayMs == null
      ? 'text-slate-300'
      : telemetryDelayMs < 120
      ? 'text-emerald-300'
      : telemetryDelayMs < 300
      ? 'text-amber-300'
      : 'text-rose-300';
  return (
    <div className="h-full w-full bg-gradient-to-br from-slate-900/20 to-slate-950/20 p-6 space-y-8">
      {/* Header Section */}
      <div className="border-b border-slate-800/50 pb-6">
        <h1 className="text-5xl font-bold text-slate-50 mb-2">Dashboard</h1>
        <p className="text-base text-slate-400 font-light">Real-time vehicle telemetry and status</p>
      </div>

      {/* Quick Stats */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">System Status</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Altitude Card */}
          <div className="group rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-6 shadow-xl shadow-black/30 hover:border-blue-500/40 hover:shadow-blue-500/10 transition-all duration-300 hover:translate-y-[-2px]">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Altitude</p>
                <p className="pt-2 text-4xl font-bold text-blue-100">
                  {displayTelemetry?.altitude ?? '--'} m
                </p>
                <p className="text-xs text-slate-500 mt-1">Relative to home</p>
              </div>
              <div className="rounded-xl bg-blue-500/20 p-3 ring-1 ring-blue-500/40 group-hover:bg-blue-500/30 transition-all">
                <Gauge className="h-7 w-7 text-blue-300" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Ground Speed Card */}
          <div className="group rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-6 shadow-xl shadow-black/30 hover:border-emerald-500/40 hover:shadow-emerald-500/10 transition-all duration-300 hover:translate-y-[-2px]">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Ground Speed</p>
                <p className="pt-2 text-4xl font-bold text-emerald-100">
                  {displayTelemetry?.groundSpeed ?? '--'} m/s
                </p>
                <p className="text-xs text-slate-500 mt-1">Horizontal velocity</p>
              </div>
              <div className="rounded-xl bg-emerald-500/20 p-3 ring-1 ring-emerald-500/40 group-hover:bg-emerald-500/30 transition-all">
                <Wind className="h-7 w-7 text-emerald-300" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Battery Card */}
          <div className="group rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-6 shadow-xl shadow-black/30 hover:border-amber-500/40 hover:shadow-amber-500/10 transition-all duration-300 hover:translate-y-[-2px]">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Battery</p>
                <p className="pt-2 text-4xl font-bold text-amber-100">
                  {displayTelemetry?.batteries[0]?.remaining?.toFixed(1) ?? '--'}%
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {displayTelemetry?.batteries[0]?.voltage?.toFixed(2) ?? '--'} V
                </p>
              </div>
              <div className="rounded-xl bg-amber-500/20 p-3 ring-1 ring-amber-500/40 group-hover:bg-amber-500/30 transition-all">
                <Zap className="h-7 w-7 text-amber-300" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* GPS Status Card */}
          <div className="group rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-6 shadow-xl shadow-black/30 hover:border-rose-500/40 hover:shadow-rose-500/10 transition-all duration-300 hover:translate-y-[-2px]">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">GPS Status</p>
                <p className="pt-2 text-4xl font-bold text-rose-100">
                  {displayTelemetry?.gpsStatus === '3d'
                    ? '3D Fix'
                    : displayTelemetry?.gpsStatus === '2d'
                    ? '2D Fix'
                    : 'No Fix'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {displayTelemetry?.satCount ?? 0} satellites
                </p>
              </div>
              <div className="rounded-xl bg-rose-500/20 p-3 ring-1 ring-rose-500/40 group-hover:bg-rose-500/30 transition-all">
                <Satellite className="h-7 w-7 text-rose-300" strokeWidth={1.5} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HUD Section */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Heads-Up Display</h2>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main HUD with Artificial Horizon - 3 columns */}
          <div className="lg:col-span-3 rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/80 to-slate-950/60 p-8 shadow-xl shadow-black/30">
            <div className="aspect-video rounded-xl border border-slate-700/40 bg-slate-950/50 flex flex-col items-center justify-center backdrop-blur-sm">
              {displayTelemetry ? (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <ArtificialHorizon pitch={displayTelemetry.pitch} roll={displayTelemetry.roll} />
                </div>
              ) : (
                <div className="text-center space-y-6 p-8">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full bg-rose-500/10 animate-ping"></div>
                    </div>
                    <div className="relative flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-slate-800/60 border-2 border-slate-700/40 flex items-center justify-center">
                        <WifiOff className="h-10 w-10 text-slate-400" strokeWidth={1.5} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-slate-200">No Vehicle Connected</h3>
                    <p className="text-sm text-slate-400 max-w-sm mx-auto">
                      Switch to <span className="text-blue-400 font-semibold">MOCK</span> mode to view simulated data or connect to a real vehicle
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/40 border border-slate-700/30">
                      <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                      <span className="text-xs text-slate-400">Disconnected</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Telemetry Panel - 1 column */}
          <div className="rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/80 to-slate-950/60 p-6 shadow-xl shadow-black/30 space-y-4">
            <h3 className="text-sm font-semibold text-slate-300">Flight Data</h3>
            
            <div className="space-y-3">
              <div className="flex flex-col p-3 rounded-lg bg-slate-900/40 border border-slate-800/50">
                <span className="text-xs text-slate-500 mb-1">Heading</span>
                <span className="text-lg font-bold text-indigo-200">
                  {displayTelemetry?.heading ?? '--'}°
                </span>
              </div>
              
              <div className="flex flex-col p-3 rounded-lg bg-slate-900/40 border border-slate-800/50">
                <span className="text-xs text-slate-500 mb-1">Altitude</span>
                <span className="text-lg font-bold text-blue-200">
                  {displayTelemetry?.altitude?.toFixed(1) ?? '--'} m
                </span>
              </div>

              <div className="flex flex-col p-3 rounded-lg bg-slate-900/40 border border-slate-800/50">
                <span className="text-xs text-slate-500 mb-1">Speed</span>
                <span className="text-lg font-bold text-emerald-200">
                  {displayTelemetry?.groundSpeed?.toFixed(1) ?? '--'} m/s
                </span>
              </div>

              <div className="flex flex-col p-3 rounded-lg bg-slate-900/40 border border-slate-800/50">
                <span className="text-xs text-slate-500 mb-1">Climb Rate</span>
                <span className="text-lg font-bold text-amber-200">
                  {displayTelemetry?.climbRate?.toFixed(1) ?? '--'} m/s
                </span>
              </div>

              <div className="flex flex-col p-3 rounded-lg bg-slate-900/40 border border-slate-800/50">
                <span className="text-xs text-slate-500 mb-1">Temperature</span>
                <span className="text-lg font-bold text-orange-200">
                  {displayTelemetry?.temperature?.toFixed(1) ?? '--'}°C
                </span>
              </div>

              <div className="flex flex-col p-3 rounded-lg bg-slate-900/40 border border-slate-800/50">
                <span className="text-xs text-slate-500 mb-1">GPS Status</span>
                <span className="text-lg font-bold text-rose-200">
                  {displayTelemetry?.satCount ?? '--'} sats
                </span>
              </div>

              <div className="flex flex-col p-3 rounded-lg bg-slate-900/40 border border-slate-800/50">
                <span className="text-xs text-slate-500 mb-1">Mode</span>
                <span className="text-lg font-bold text-cyan-200">
                  {displayTelemetry?.mode ?? '--'}
                </span>
              </div>

              <div className="flex flex-col p-3 rounded-lg bg-slate-900/40 border border-slate-800/50">
                <span className="text-xs text-slate-500 mb-1">Arm State</span>
                <span
                  className={`text-lg font-bold ${
                    displayTelemetry?.armed
                      ? 'text-rose-300'
                      : displayTelemetry
                      ? 'text-emerald-300'
                      : 'text-slate-300'
                  }`}
                >
                  {displayTelemetry?.armed ? 'ARMED' : displayTelemetry ? 'DISARMED' : '--'}
                </span>
              </div>

              <div className="flex flex-col p-3 rounded-lg bg-slate-900/40 border border-slate-800/50">
                <span className="text-xs text-slate-500 mb-1">Telemetry Delay</span>
                <span className={`text-lg font-bold ${telemetryDelayTone}`}>
                  {telemetryDelayMs != null ? `${telemetryDelayMs} ms` : '--'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
