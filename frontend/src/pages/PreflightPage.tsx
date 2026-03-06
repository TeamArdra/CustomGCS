import { CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { preflightService, type PreflightCheck } from '../services/api/preflight';
import { vehicleService } from '../services/api';
import { usePreflightStore } from '../store/preflightStore';
import { useConnectionStore } from '../store';

export default function PreflightPage() {
  const { mockMode, isConnected } = useConnectionStore();
  const { items, setItems, isRunning, setIsRunning, allPassed } = usePreflightStore();
  const [error, setError] = useState<string | null>(null);
  const [checkedAt, setCheckedAt] = useState<number | null>(null);
  const [motorNumberInput, setMotorNumberInput] = useState('1');
  const [throttlePercentInput, setThrottlePercentInput] = useState('12');
  const [durationSecInput, setDurationSecInput] = useState('1.5');
  const [isRunningMotorTest, setIsRunningMotorTest] = useState(false);
  const [motorTestStatus, setMotorTestStatus] = useState<string | null>(null);
  const [vehicleArmed, setVehicleArmed] = useState(false);

  const loadVehicleInfo = async () => {
    if (mockMode || !isConnected) {
      setVehicleArmed(false);
      return;
    }

    try {
      const info = await vehicleService.getVehicleInfo();
      setVehicleArmed(Boolean(info?.armed));
    } catch {
      setVehicleArmed(false);
    }
  };

  const loadChecks = async () => {
    setError(null);
    setIsRunning(true);
    try {
      const response = await preflightService.getChecks();
      setItems(
        response.checks.map((check) => ({
          id: check.id,
          name: check.name,
          status: check.status,
          message: check.message,
        }))
      );
      setCheckedAt(response.timestamp);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load preflight checks';
      setError(message);
    } finally {
      setIsRunning(false);
    }
  };

  const runChecks = async () => {
    setError(null);
    setIsRunning(true);
    try {
      if (mockMode) {
        const mockChecks: PreflightCheck[] = [
          { id: 'connection', name: 'Vehicle Link', status: 'passed', message: 'Mock connection active' },
          { id: 'gps', name: 'GPS Lock', status: 'passed', message: '3D fix with 12 satellites' },
          { id: 'battery', name: 'Battery', status: 'passed', message: '92.0% (15.10V)' },
          { id: 'telemetry', name: 'Telemetry Freshness', status: 'passed', message: 'Fresh data (80 ms old)' },
          { id: 'vertical_stability', name: 'Vertical Stability', status: 'passed', message: 'Climb rate stable (0.02 m/s)' },
          { id: 'arm_state', name: 'Arm State', status: 'passed', message: 'Vehicle is disarmed' },
        ];
        setItems(
          mockChecks.map((check) => ({
            id: check.id,
            name: check.name,
            status: check.status,
            message: check.message,
          }))
        );
        setCheckedAt(Date.now());
      } else {
        const response = await preflightService.runChecks();
        setItems(
          response.checks.map((check) => ({
            id: check.id,
            name: check.name,
            status: check.status,
            message: check.message,
          }))
        );
        setCheckedAt(response.timestamp);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to run preflight checks';
      setError(message);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    void loadChecks();
  }, []);

  useEffect(() => {
    void loadVehicleInfo();
  }, [mockMode, isConnected]);

  const runMotorTest = async () => {
    const motorNumber = Math.max(1, Math.min(12, Math.round(Number(motorNumberInput) || 1)));
    const throttlePercent = Math.max(1, Math.min(30, Number(throttlePercentInput) || 1));
    const durationSec = Math.max(0.5, Math.min(5, Number(durationSecInput) || 0.5));

    setMotorNumberInput(String(motorNumber));
    setThrottlePercentInput(String(throttlePercent));
    setDurationSecInput(String(durationSec));

    setMotorTestStatus('Running motor test...');

    await loadVehicleInfo();

    if (!mockMode && !isConnected) {
      setMotorTestStatus('Connect vehicle before running motor test.');
      return;
    }

    if (vehicleArmed) {
      setMotorTestStatus('Disarm vehicle before running motor test.');
      return;
    }

    setIsRunningMotorTest(true);
    try {
      if (mockMode) {
        await new Promise((resolve) => setTimeout(resolve, 450));
        setMotorTestStatus(`Mock motor test completed for motor ${motorNumber}.`);
      } else {
        await vehicleService.motorTest({
          motor_number: motorNumber,
          throttle_percent: throttlePercent,
          duration_sec: durationSec,
        });
        setMotorTestStatus(`Motor ${motorNumber} test command acknowledged.`);
        await loadVehicleInfo();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Motor test failed';
      setMotorTestStatus(message);
    } finally {
      setIsRunningMotorTest(false);
    }
  };

  const summary = useMemo(() => {
    if (items.length === 0) {
      return { title: 'Preflight Not Run', message: 'Run checks before arming', tone: 'amber' as const };
    }

    const hasFailed = items.some((check) => check.status === 'failed');
    const hasWarning = items.some((check) => check.status === 'warning');

    if (hasFailed) {
      return { title: 'Not Ready for Flight', message: 'Resolve failed checks before arming', tone: 'rose' as const };
    }

    if (hasWarning) {
      return { title: 'Ready with Warnings', message: 'Review warnings before arming', tone: 'amber' as const };
    }

    return { title: 'Ready for Flight', message: 'All checks passed', tone: 'emerald' as const };
  }, [items]);

  const summaryToneClass =
    summary.tone === 'emerald'
      ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'
      : summary.tone === 'rose'
      ? 'text-rose-300 border-rose-500/30 bg-rose-500/10'
      : 'text-amber-300 border-amber-500/30 bg-amber-500/10';

  return (
    <div className="h-full w-full bg-gradient-to-br from-slate-900/20 to-slate-950/20 p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800/50 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold text-slate-50 mb-2">Preflight Checks</h1>
            <p className="text-base text-slate-400 font-light">System verification and safety checks</p>
            {checkedAt && (
              <p className="text-xs text-slate-500 mt-2">Last run: {new Date(checkedAt).toLocaleString()}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void loadChecks()}
              disabled={isRunning}
              className="rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-700 disabled:opacity-50"
            >
              {isRunning ? 'Loading...' : 'Refresh'}
            </button>
            <button
              onClick={() => void runChecks()}
              disabled={isRunning || (!mockMode && !isConnected)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
            >
              {isRunning ? 'Running...' : 'Run Checks'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">{error}</div>
      )}

      {/* Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {items.map((check) => (
          <div key={check.id} className="rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/80 to-slate-950/60 p-6 shadow-xl shadow-black/30">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-200 mb-1">{check.name}</h3>
                <p className="text-sm text-slate-400">{check.message || 'No details'}</p>
              </div>
              <div>
                {check.status === 'passed' && <CheckCircle2 className="h-6 w-6 text-emerald-400" />}
                {check.status === 'failed' && <XCircle className="h-6 w-6 text-rose-400" />}
                {check.status === 'warning' && <AlertTriangle className="h-6 w-6 text-amber-400" />}
                {check.status === 'pending' && <Clock className="h-6 w-6 text-slate-400" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className={`rounded-2xl border p-6 shadow-xl shadow-black/30 ${summaryToneClass}`}>
        <div className="flex items-center gap-3">
          {summary.tone === 'emerald' ? (
            <CheckCircle2 className="h-8 w-8 text-emerald-300" />
          ) : (
            <AlertTriangle className="h-8 w-8" />
          )}
          <div>
            <h3 className="text-lg font-semibold">{summary.title}</h3>
            <p className="text-sm opacity-90">{summary.message}</p>
            <p className="text-xs opacity-80 mt-1">All passed flag: {allPassed ? 'true' : 'false'}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/80 to-slate-950/60 p-6 shadow-xl shadow-black/30 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Motor Test</h3>
            <p className="text-sm text-slate-400">Use only on bench with propellers removed</p>
          </div>
          <span
            className={`rounded-md px-2 py-1 text-xs font-semibold ${
              vehicleArmed ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
            }`}
          >
            {vehicleArmed ? 'ARMED' : 'DISARMED'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="text-sm text-slate-300">
            Motor #
            <input
              type="number"
              min={1}
              max={12}
              value={motorNumberInput}
              onChange={(event) => setMotorNumberInput(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            />
          </label>

          <label className="text-sm text-slate-300">
            Throttle %
            <input
              type="number"
              min={1}
              max={30}
              step={0.5}
              value={throttlePercentInput}
              onChange={(event) => setThrottlePercentInput(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            />
          </label>

          <label className="text-sm text-slate-300">
            Duration (s)
            <input
              type="number"
              min={0.5}
              max={5}
              step={0.1}
              value={durationSecInput}
              onChange={(event) => setDurationSecInput(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => void runMotorTest()}
            disabled={isRunningMotorTest || (!mockMode && (!isConnected || vehicleArmed))}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
          >
            {isRunningMotorTest ? 'Testing...' : 'Run Motor Test'}
          </button>
          {motorTestStatus && <p className="text-sm text-slate-300">{motorTestStatus}</p>}
        </div>
      </div>
    </div>
  );
}
