import { Activity, Gauge, Wind, Zap, Satellite, Compass as CompassIcon, Thermometer, BarChart3, WifiOff } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTelemetryStore } from '../store/telemetryStore';
import { useConnectionStore } from '../store/connectionStore';
import { startMockTelemetryStream } from '../utils/mockTelemetry';
import ArtificialHorizon from '../components/widgets/ArtificialHorizon';
import EmergencyControls from "../components/emergency/EmergencyControls";

export default function DashboardPage() {
  const [nowMs, setNowMs] = useState(Date.now());
  const telemetry = useTelemetryStore((state) => state.currentTelemetry);
  const updateTelemetry = useTelemetryStore((state) => state.updateTelemetry);
  const setIsReceiving = useTelemetryStore((state) => state.setIsReceiving);
  const { mockMode, setConnected, isConnected } = useConnectionStore();

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

    const stop = startMockTelemetryStream((data) => {
      updateTelemetry(data);
      setIsReceiving(true);
      setConnected(true);
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

      {/* Header */}
      <div className="border-b border-slate-800/50 pb-6">
        <h1 className="text-5xl font-bold text-slate-50 mb-2">Dashboard</h1>
        <p className="text-base text-slate-400 font-light">
          Real-time vehicle telemetry and status
        </p>
      </div>

      {/* System Status */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          System Status
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

          {/* Altitude */}
          <div className="group rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-6 shadow-xl shadow-black/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase">Altitude</p>
                <p className="pt-2 text-4xl font-bold text-blue-100">
                  {displayTelemetry?.altitude ?? '--'} m
                </p>
              </div>
              <Gauge className="h-7 w-7 text-blue-300" />
            </div>
          </div>

          {/* Ground Speed */}
          <div className="group rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-6 shadow-xl shadow-black/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase">Ground Speed</p>
                <p className="pt-2 text-4xl font-bold text-emerald-100">
                  {displayTelemetry?.groundSpeed ?? '--'} m/s
                </p>
              </div>
              <Wind className="h-7 w-7 text-emerald-300" />
            </div>
          </div>

          {/* Battery */}
          <div className="group rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-6 shadow-xl shadow-black/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase">Battery</p>
                <p className="pt-2 text-4xl font-bold text-amber-100">
                  {displayTelemetry?.batteries[0]?.remaining?.toFixed(1) ?? '--'}%
                </p>
              </div>
              <Zap className="h-7 w-7 text-amber-300" />
            </div>
          </div>

          {/* GPS */}
          <div className="group rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-6 shadow-xl shadow-black/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase">GPS Status</p>
                <p className="pt-2 text-4xl font-bold text-rose-100">
                  {displayTelemetry?.gpsStatus === '3d'
                    ? '3D Fix'
                    : displayTelemetry?.gpsStatus === '2d'
                    ? '2D Fix'
                    : 'No Fix'}
                </p>
              </div>
              <Satellite className="h-7 w-7 text-rose-300" />
            </div>
          </div>

        </div>
      </div>

      {/* HUD */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Heads-Up Display
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          <div className="lg:col-span-3 rounded-2xl border border-slate-700/60 bg-slate-900/60 p-8">

            <div className="aspect-video flex items-center justify-center">

              {displayTelemetry ? (
                <ArtificialHorizon
                  pitch={displayTelemetry.pitch}
                  roll={displayTelemetry.roll}
                />
              ) : (
                <div className="text-center">
                  <WifiOff className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-400">No Vehicle Connected</p>
                </div>
              )}

            </div>

          </div>

          {/* Flight Data */}
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">
              Flight Data
            </h3>

            <div className="space-y-3">

              <p>Heading: {displayTelemetry?.heading ?? '--'}°</p>
              <p>Speed: {displayTelemetry?.groundSpeed ?? '--'} m/s</p>
              <p>Altitude: {displayTelemetry?.altitude ?? '--'} m</p>
              <p>Mode: {displayTelemetry?.mode ?? '--'}</p>

              <p className={telemetryDelayTone}>
                Delay: {telemetryDelayMs != null ? `${telemetryDelayMs} ms` : '--'}
              </p>

            </div>

          </div>

        </div>
        </div>

{/* Emergency Control Panel */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Emergency Controls
        </h2>

        <EmergencyControls />
      </div>

      </div>
      

      
  );
}