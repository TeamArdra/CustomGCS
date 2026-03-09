import { Search, Download, Upload, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { parameterService } from '../services/api/parameter';
import type { Parameter } from '../services/api/parameter';

function parseTypedValue(type: string, raw: string): string | number | boolean {
  if (type === 'number') {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (type === 'boolean') {
    return raw === 'true' || raw === '1';
  }
  return raw;
}

export default function ParametersPage() {
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [search, setSearch] = useState('');
  const [pendingChanges, setPendingChanges] = useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const loadParameters = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const response = await parameterService.getParameters();
      setParameters(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load parameters';
      setStatusMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadParameters();
  }, []);

  const filteredParameters = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) {
      return parameters;
    }
    return parameters.filter((param) => param.name.toLowerCase().includes(normalized));
  }, [parameters, search]);

  const paramGroups = useMemo(() => {
    const groups = new Map<string, { name: string; count: number; modified: number }>();
    for (const parameter of filteredParameters) {
      const [prefix] = parameter.name.split('_');
      const name = prefix || 'misc';
      const key = name.toUpperCase();
      const current = groups.get(key) ?? { name: key, count: 0, modified: 0 };
      current.count += 1;
      if (pendingChanges[parameter.name] !== undefined) {
        current.modified += 1;
      }
      groups.set(key, current);
    }
    return Array.from(groups.values()).slice(0, 6);
  }, [filteredParameters, pendingChanges]);

  const pendingCount = Object.keys(pendingChanges).length;

  const handleParameterChange = (parameter: Parameter, rawValue: string) => {
    setPendingChanges((current) => ({
      ...current,
      [parameter.name]: rawValue,
    }));
  };

  const applyPendingChanges = async () => {
    if (pendingCount === 0) {
      setStatusMessage('No pending parameter changes to apply.');
      return;
    }

    setIsApplying(true);
    setStatusMessage(null);
    try {
      for (const parameter of parameters) {
        const raw = pendingChanges[parameter.name];
        if (raw === undefined) {
          continue;
        }
        await parameterService.updateParameter(parameter.name, parseTypedValue(parameter.type, raw));
      }

      setPendingChanges({});
      setStatusMessage('Parameter changes uploaded successfully.');
      await loadParameters();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to apply parameter changes';
      setStatusMessage(message);
    } finally {
      setIsApplying(false);
    }
  };

  const onDownload = async () => {
    setStatusMessage(null);
    try {
      await parameterService.downloadParameters();
      setStatusMessage('Parameter snapshot downloaded.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to download parameters';
      setStatusMessage(message);
    }
  };

  const onReset = async () => {
    setStatusMessage(null);
    try {
      await parameterService.resetParameters();
      setPendingChanges({});
      setStatusMessage('All parameters reset on backend.');
      await loadParameters();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reset parameters';
      setStatusMessage(message);
    }
  };

  return (
    <div className="h-full w-full bg-gradient-to-br from-slate-900/20 to-slate-950/20 p-6 space-y-6">
      <div className="border-b border-slate-800/50 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold text-slate-50 mb-2">Parameters</h1>
            <p className="text-base text-slate-400 font-light">Vehicle configuration parameters</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void onDownload()}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
            <button
              onClick={() => void applyPendingChanges()}
              disabled={isApplying || pendingCount === 0}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-700/80 hover:bg-sky-700 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Upload className="h-4 w-4" />
              {isApplying ? 'Uploading...' : `Upload${pendingCount > 0 ? ` (${pendingCount})` : ''}`}
            </button>
            <button
              onClick={() => void onReset()}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-sm font-medium transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Reset All
            </button>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
          {statusMessage}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
        <input
          type="text"
          placeholder="Search parameters..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-900/60 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paramGroups.map((group) => (
          <div key={group.name} className="rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/80 to-slate-950/60 p-6 shadow-xl shadow-black/30">
            <h3 className="text-lg font-semibold text-slate-200 mb-2">{group.name}</h3>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span>{group.count} parameters</span>
              {group.modified > 0 && <span className="text-amber-400 font-medium">{group.modified} modified</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 overflow-hidden">
        <div className="grid grid-cols-12 px-4 py-3 text-xs uppercase tracking-wide text-slate-400 border-b border-slate-700/60">
          <div className="col-span-5">Name</div>
          <div className="col-span-3">Type</div>
          <div className="col-span-4">Value</div>
        </div>

        <div className="max-h-[50vh] overflow-auto">
          {isLoading && <div className="px-4 py-6 text-sm text-slate-400">Loading parameters...</div>}
          {!isLoading && filteredParameters.length === 0 && (
            <div className="px-4 py-6 text-sm text-slate-400">No parameters found.</div>
          )}
          {!isLoading &&
            filteredParameters.map((parameter) => {
              const draft = pendingChanges[parameter.name];
              const shownValue = draft ?? String(parameter.value);
              return (
                <div
                  key={parameter.id}
                  className="grid grid-cols-12 items-center px-4 py-3 border-b border-slate-800/70 text-sm"
                >
                  <div className="col-span-5 text-slate-200 font-medium">{parameter.name}</div>
                  <div className="col-span-3 text-slate-400">{parameter.type}</div>
                  <div className="col-span-4">
                    <input
                      value={shownValue}
                      onChange={(event) => handleParameterChange(parameter, event.target.value)}
                      className="w-full px-2 py-1.5 rounded border border-slate-700 bg-slate-950/60 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
