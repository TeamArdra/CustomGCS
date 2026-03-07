import { Activity, Compass, Gauge, Radio, Satellite, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { calibrationService, type CalibrationItem, type CalibrationType } from '../services/api/calibration';
import { useConnectionStore } from '../store';
import { useCalibrationStore } from '../store/calibrationStore';

const SENSOR_META: Record<string, { name: string; icon: typeof Compass }> = {
  compass: { name: 'Compass', icon: Compass },
  accelerometer: { name: 'Accelerometer', icon: Gauge },
  gyroscope: { name: 'Gyroscope', icon: Gauge },
  radio: { name: 'Radio', icon: Radio },
  esc: { name: 'ESC', icon: Zap },
  accel: { name: "Accelerometer", icon: Gauge },
  gps: { name: "GPS", icon: Satellite },
  pid: { name: "PID Controller", icon: Activity }
};

function formatLastCalibrated(timestamp?: number | null): string {
  if (!timestamp) {
    return 'Never';
  }
  return new Date(timestamp * 1000).toLocaleString();
}

function statusStyle(status: string): string {
  if (status === 'calibrated') return 'bg-emerald-500/15 text-emerald-300';
  if (status === 'in_progress') return 'bg-blue-500/15 text-blue-300';
  if (status === 'needs_calibration') return 'bg-amber-500/15 text-amber-300';
  return 'bg-slate-500/15 text-slate-300';
}

export default function CalibrationPage() {
  const { mockMode, isConnected } = useConnectionStore();
  const {
    isCalibrating,
    calibrationType,
    progress,
    message,
    results,
    startCalibration,
    updateProgress,
    completeCalibration,
  } = useCalibrationStore();

  const [items, setItems] = useState<CalibrationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canRunCalibration = mockMode || isConnected;

  const loadCalibrationStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const statusItems = await calibrationService.getStatus();
      setItems(statusItems);
    } catch (err) {
      const messageText = err instanceof Error ? err.message : 'Failed to load calibration status';
      setError(messageText);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCalibrationStatus();
  }, []);

  const startCalibrationFlow = async (type: CalibrationType) => {
    if (isCalibrating || !canRunCalibration) {
      return;
    }

    startCalibration(type);
    updateProgress(10, `Sending ${type} calibration command...`);

    try {
      if (mockMode) {
        updateProgress(60, `Running ${type} calibration...`);
        await new Promise((resolve) => setTimeout(resolve, 800));
        updateProgress(100, `${type} calibration complete`);
        completeCalibration({ type, success: true, timestamp: Date.now() });
      } else {
        updateProgress(50, `Waiting for ${type} ACK...`);
        const updatedItem = await calibrationService.start(type);
        updateProgress(100, updatedItem.message || `${type} calibration acknowledged`);
        completeCalibration({
          type,
          success: updatedItem.status === 'calibrated',
          timestamp: Date.now(),
          data: { ...updatedItem },
        });
      }

      await loadCalibrationStatus();
    } catch (err) {
      const messageText = err instanceof Error ? err.message : `Failed ${type} calibration`;
      updateProgress(0, messageText);
      completeCalibration({ type, success: false, timestamp: Date.now(), data: { error: messageText } });
      setError(messageText);
      await loadCalibrationStatus();
    }
  };

  const sortedItems = useMemo(() => {
    const order = ['compass', 'accelerometer', 'gyroscope', 'radio', 'esc'];
    return [...items].sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
  }, [items]);


  const runPIDCalibration = () => {
  console.log("Running PID Calibration...");
  alert("PID Calibration Started");
};

const runGPSCalibration = () => {
  console.log("Running GPS Calibration...");
  alert("GPS Calibration Started");
};

const runAccelCalibration = () => {
  console.log("Running Accelerometer Calibration...");
  alert("Accelerometer Calibration Started");
};

const runESCCalibration = () => {
  console.log("Running ESC Calibration...");
  alert("ESC Calibration Started");
};

const runCompassCalibration = () => {
  console.log("Running Compass Calibration...");
  alert("Compass Calibration Started");
};




  return (
    <div className="h-full w-full bg-gradient-to-br from-slate-900/20 to-slate-950/20 p-6 space-y-6">
      <div className="border-b border-slate-800/50 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold text-slate-50 mb-2">Calibration</h1>
            <p className="text-base text-slate-400 font-light">Sensor calibration and configuration</p>
          </div>
          <button
            onClick={() => void loadCalibrationStatus()}
            disabled={loading}
            className="rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh Status'}
          </button>
        </div>
      </div>

      {!canRunCalibration && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          Connect to vehicle in LIVE mode (or switch to MOCK mode) to run calibration actions.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
          {error}
        </div>
      )}

      {isCalibrating && (
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
          <div className="flex items-center justify-between text-sm text-blue-200">
            <span>{message || `Calibrating ${calibrationType}...`}</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-2 h-2 w-full rounded bg-slate-800">
            <div className="h-2 rounded bg-blue-400 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sortedItems.map((item) => {
          const meta = SENSOR_META[item.type] ?? { name: item.type, icon: Gauge };
          const Icon = meta.icon;
          const runningThis = isCalibrating && calibrationType === item.type;

          return (
            <div
              key={item.type}
              className="rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/80 to-slate-950/60 p-6 shadow-xl shadow-black/30"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-indigo-500/20 p-3 ring-1 ring-indigo-500/30">
                    <Icon className="h-6 w-6 text-indigo-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-200">{meta.name}</h3>
                    <p className="text-xs text-slate-500">Last: {formatLastCalibrated(item.last_calibrated)}</p>
                    {item.message && <p className="mt-1 text-xs text-slate-400">{item.message}</p>}
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(item.status)}`}>
                  {item.status.replaceAll('_', ' ')}
                </span>
              </div>

              <button
                onClick={() => void startCalibrationFlow(item.type as CalibrationType)}
                disabled={isCalibrating || !canRunCalibration}
                className="w-full rounded-lg bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {runningThis ? 'Calibrating...' : `Start ${meta.name} Calibration`}
              </button>
            </div>
          );
        })}
      </div>

      {results.length > 0 && (
        <div className="rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/80 to-slate-950/60 p-6 shadow-xl shadow-black/30">
          <h3 className="mb-4 text-lg font-semibold text-slate-200">Recent Results</h3>
          <div className="space-y-2">
            {results.slice(-5).reverse().map((result, index) => (
              <div key={`${result.type}-${result.timestamp}-${index}`} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{result.type}</span>
                <span className={result.success ? 'text-emerald-300' : 'text-rose-300'}>
                  {result.success ? 'Success' : 'Failed'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    


  );
}
