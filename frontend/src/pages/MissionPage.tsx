import { useRef, useState, type ChangeEvent } from 'react';
import { MapPin, Plus, Trash2, Download, Upload, Play, Edit2, Eye, EyeOff } from 'lucide-react';
import { missionService, type MissionUploadItem } from '../services/api/mission';
import { useConnectionStore } from '../store/connectionStore';

interface Waypoint {
  id: number;
  type: 'Takeoff' | 'Waypoint' | 'Land' | 'Loiter' | 'RTL';
  lat: number;
  lon: number;
  alt: number;
  speed: number;
  heading: number;
  delay: number;
}

function commandToType(command: number): Waypoint['type'] {
  if (command === 22) return 'Takeoff';
  if (command === 21) return 'Land';
  if (command === 19) return 'Loiter';
  if (command === 20) return 'RTL';
  return 'Waypoint';
}

function missionItemsToWaypoints(items: MissionUploadItem[]): Waypoint[] {
  return items.map((item, index) => ({
    id: index + 1,
    type: commandToType(Number(item.command)),
    lat: Number(item.x),
    lon: Number(item.y),
    alt: Number(item.z),
    speed: 15,
    heading: Number(item.param4 ?? 0),
    delay: Number(item.param1 ?? 0),
  }));
}

export default function MissionPage() {
  const { isConnected, mockMode } = useConnectionStore();
  const [waypoints, setWaypoints] = useState<Waypoint[]>([
    { id: 1, type: 'Takeoff', lat: 37.7749, lon: -122.4194, alt: 10, speed: 5, heading: 0, delay: 0 },
    { id: 2, type: 'Waypoint', lat: 37.7750, lon: -122.4180, alt: 50, speed: 15, heading: 90, delay: 0 },
    { id: 3, type: 'Waypoint', lat: 37.7760, lon: -122.4180, alt: 50, speed: 15, heading: 180, delay: 5 },
    { id: 4, type: 'Land', lat: 37.7749, lon: -122.4194, alt: 0, speed: 3, heading: 0, delay: 0 },
  ]);

  const [selectedWaypoint, setSelectedWaypoint] = useState<number | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const extractMissionItems = (payload: unknown): MissionUploadItem[] => {
    const candidate = payload as Record<string, unknown>;

    let rawItems: unknown[] | null = null;
    if (Array.isArray(payload)) {
      rawItems = payload;
    } else if (Array.isArray(candidate?.items)) {
      rawItems = candidate.items as unknown[];
    } else if (Array.isArray((candidate?.mission as Record<string, unknown> | undefined)?.items)) {
      rawItems = (candidate.mission as Record<string, unknown>).items as unknown[];
    } else if (Array.isArray(candidate?.mission)) {
      rawItems = candidate.mission as unknown[];
    } else if (Array.isArray(candidate?.waypoints)) {
      const waypoints = candidate.waypoints as Array<Record<string, unknown>>;
      rawItems = waypoints.map((wp, index) => {
        const isFirst = index === 0;
        const isLast = index === waypoints.length - 1;
        return {
          frame: 10,
          command: isFirst ? 22 : isLast ? 21 : 19,
          param1: Number(wp.holdTime ?? wp.delay ?? 0),
          param2: 0,
          param3: 0,
          param4: Number(wp.heading ?? 0),
          x: Number(wp.latitude ?? wp.lat ?? 0),
          y: Number(wp.longitude ?? wp.lon ?? 0),
          z: Number(wp.altitude ?? wp.alt ?? 0),
        };
      });
    }

    if (!rawItems || rawItems.length === 0) {
      throw new Error('Unsupported JSON format. Expected an array of mission items or { items: [...] }.');
    }

    const items = rawItems.map((item, index) => {
      const row = item as Record<string, unknown>;

      const params = Array.isArray(row.params) ? (row.params as unknown[]) : [];

      const xCandidate = row.x ?? row.lat ?? row.latitude ?? params[4];
      const yCandidate = row.y ?? row.lon ?? row.lng ?? row.longitude ?? params[5];
      const zCandidate = row.z ?? row.alt ?? row.altitude ?? params[6];

      const frame = Number(row.frame ?? 10);
      const command = Number(row.command);
      const x = Number(xCandidate);
      const y = Number(yCandidate);
      const z = Number(zCandidate);

      if (!Number.isFinite(frame) || !Number.isFinite(command) || !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
        throw new Error(`Mission item at index ${index} has invalid frame/command/coordinates.`);
      }

      return {
        frame,
        command,
        param1: Number(row.param1 ?? params[0] ?? 0),
        param2: Number(row.param2 ?? params[1] ?? 0),
        param3: Number(row.param3 ?? params[2] ?? 0),
        param4: Number(row.param4 ?? params[3] ?? 0),
        x,
        y,
        z,
      };
    });

    return items;
  };

  const onUploadClick = () => {
    fileInputRef.current?.click();
  };

  const onMissionFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const items = extractMissionItems(parsed);
      const result = await missionService.uploadMissionItems(items);
      setWaypoints(missionItemsToWaypoints(items));

      if (result.queued) {
        setUploadStatus(`Saved ${items.length} mission items from ${file.name} (vehicle disconnected, queued).`);
      } else {
        setUploadStatus(`Uploaded ${items.length} mission items from ${file.name} to vehicle.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload mission file';
      setUploadStatus(message);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const onDownloadMission = async () => {
    setUploadStatus(null);
    try {
      const missions = await missionService.getMissions();
      const firstMission = missions[0];
      if (!firstMission || !Array.isArray(firstMission.waypoints) || firstMission.waypoints.length === 0) {
        setUploadStatus('No mission items available on backend/vehicle.');
        return;
      }

      const nextWaypoints: Waypoint[] = firstMission.waypoints.map((wp, index) => ({
        id: index + 1,
        type: commandToType(Number(wp.command)),
        lat: Number(wp.latitude),
        lon: Number(wp.longitude),
        alt: Number(wp.altitude),
        speed: 15,
        heading: Number(wp.params?.param4 ?? 0),
        delay: Number(wp.holdTime ?? 0),
      }));

      setWaypoints(nextWaypoints);
      setUploadStatus(`Loaded ${nextWaypoints.length} waypoints from backend.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to download mission from backend';
      setUploadStatus(message);
    }
  };

  const onStartMission = async () => {
    setUploadStatus(null);
    try {
      await missionService.executeMission('active-mission');
      setUploadStatus('Mission start command sent.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start mission';
      setUploadStatus(message);
    }
  };

  const onClearMission = async () => {
    setUploadStatus(null);
    try {
      await missionService.abortMission();
      setWaypoints([]);
      setUploadStatus('Mission cleared from backend queue.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to clear mission';
      setUploadStatus(message);
    }
  };

  const addWaypoint = () => {
    const newId = Math.max(...waypoints.map(w => w.id), 0) + 1;
    setWaypoints([...waypoints, {
      id: newId,
      type: 'Waypoint',
      lat: 37.7749,
      lon: -122.4194,
      alt: 50,
      speed: 15,
      heading: 0,
      delay: 0,
    }]);
  };

  const deleteWaypoint = (id: number) => {
    setWaypoints(waypoints.filter(w => w.id !== id));
    if (selectedWaypoint === id) setSelectedWaypoint(null);
  };

  const updateWaypoint = (id: number, updates: Partial<Waypoint>) => {
    setWaypoints(waypoints.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  const totalDistance = waypoints.length > 1
    ? waypoints.reduce((acc, w, i) => {
      if (i === 0) return 0;
      const prev = waypoints[i - 1];
      const R = 6371; // Earth radius in km
      const dLat = (w.lat - prev.lat) * Math.PI / 180;
      const dLon = (w.lon - prev.lon) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(prev.lat * Math.PI / 180) * Math.cos(w.lat * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return acc + R * c;
    }, 0).toFixed(2)
    : '0.00';

  const estimatedTime = waypoints.reduce((acc, w) => acc + (w.delay || 0), 0) +
    Math.round(parseFloat(totalDistance) / 15 * 60); // Rough estimate at 15 m/s

  const maxAltitude = Math.max(...waypoints.map(w => w.alt), 0);

  return (
    <div className="h-full w-full bg-gradient-to-br from-slate-900/20 to-slate-950/20 p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800/50 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold text-slate-50 mb-2">Mission Planning</h1>
            <p className="text-base text-slate-400 font-light">Design and execute autonomous missions</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMap(!showMap)}
              className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              {showMap ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setEditMode(!editMode)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                editMode
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800/50 hover:bg-slate-700 text-slate-200'
              }`}
            >
              <Edit2 className="h-4 w-4" />
              {editMode ? 'Done' : 'Edit'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map - 3 columns */}
        {showMap && (
          <div className="lg:col-span-3 rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/80 to-slate-950/60 p-6 shadow-xl shadow-black/30">
            <div className="aspect-video rounded-xl border border-slate-700/40 bg-slate-950/50 flex flex-col items-center justify-center">
              <MapPin className="h-16 w-16 text-slate-600 mb-4" strokeWidth={1} />
              <p className="text-slate-400 text-xl font-semibold mb-2">Interactive Map</p>
              <p className="text-sm text-slate-500">Leaflet/Mapbox integration</p>
              <p className="text-xs text-slate-600 mt-3">Click waypoints to edit • Drag to reorder</p>
            </div>
          </div>
        )}

        {/* Waypoint List - 1 column (or full width if map hidden) */}
        <div className={`${showMap ? 'lg:col-span-1' : 'lg:col-span-4'} space-y-4`}>
          {/* Controls */}
          <div className="rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/80 to-slate-950/60 p-6 shadow-xl shadow-black/30 space-y-3">
            <h3 className="text-sm font-semibold text-slate-300">Actions</h3>
            <div className="space-y-2">
              <button
                onClick={addWaypoint}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-sm font-medium transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Waypoint
              </button>
              <button
                onClick={onUploadClick}
                disabled={isUploading}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                {isUploading ? 'Uploading...' : 'Upload JSON'}
              </button>
              <button
                onClick={() => void onDownloadMission()}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
              <button
                onClick={() => void onStartMission()}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white text-sm font-medium transition-colors"
              >
                <Play className="h-4 w-4" />
                Start Mission
              </button>
              <button
                onClick={() => void onClearMission()}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-sm font-medium transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => void onMissionFileSelected(event)}
            />
            {!mockMode && !isConnected && (
              <p className="text-xs text-amber-300">Vehicle disconnected: uploads will be queued on backend until reconnect.</p>
            )}
            {uploadStatus && <p className="text-xs text-slate-400">{uploadStatus}</p>}
          </div>

          {/* Statistics */}
          <div className="rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/80 to-slate-950/60 p-6 shadow-xl shadow-black/30 space-y-3">
            <h3 className="text-sm font-semibold text-slate-300">Statistics</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Waypoints:</span>
                <span className="text-slate-200 font-semibold">{waypoints.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Distance:</span>
                <span className="text-slate-200 font-semibold">{totalDistance} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Est. Time:</span>
                <span className="text-slate-200 font-semibold">{estimatedTime}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Max Alt:</span>
                <span className="text-slate-200 font-semibold">{maxAltitude}m</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Waypoints Table */}
      <div className="rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/80 to-slate-950/60 p-6 shadow-xl shadow-black/30">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">Waypoints</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/40">
                <th className="px-4 py-2 text-left text-slate-400 font-medium">#</th>
                <th className="px-4 py-2 text-left text-slate-400 font-medium">Type</th>
                <th className="px-4 py-2 text-left text-slate-400 font-medium">Latitude</th>
                <th className="px-4 py-2 text-left text-slate-400 font-medium">Longitude</th>
                <th className="px-4 py-2 text-left text-slate-400 font-medium">Altitude (m)</th>
                <th className="px-4 py-2 text-left text-slate-400 font-medium">Speed (m/s)</th>
                <th className="px-4 py-2 text-left text-slate-400 font-medium">Heading (°)</th>
                <th className="px-4 py-2 text-left text-slate-400 font-medium">Delay (s)</th>
                <th className="px-4 py-2 text-center text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {waypoints.map((wp, idx) => (
                <tr
                  key={wp.id}
                  onClick={() => setSelectedWaypoint(wp.id)}
                  className={`border-b border-slate-700/20 hover:bg-slate-800/30 transition-colors cursor-pointer ${
                    selectedWaypoint === wp.id ? 'bg-indigo-500/15' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-slate-300 font-semibold">{idx + 1}</td>
                  <td className="px-4 py-3">
                    {editMode ? (
                      <select
                        value={wp.type}
                        onChange={(e) => updateWaypoint(wp.id, { type: e.target.value as any })}
                        className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-200 text-xs"
                      >
                        <option>Takeoff</option>
                        <option>Waypoint</option>
                        <option>Loiter</option>
                        <option>Land</option>
                        <option>RTL</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        wp.type === 'Takeoff' ? 'bg-emerald-500/20 text-emerald-300' :
                        wp.type === 'Land' ? 'bg-rose-500/20 text-rose-300' :
                        wp.type === 'RTL' ? 'bg-amber-500/20 text-amber-300' :
                        wp.type === 'Loiter' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-indigo-500/20 text-indigo-300'
                      }`}>
                        {wp.type}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {editMode ? (
                      <input
                        type="number"
                        value={wp.lat}
                        onChange={(e) => updateWaypoint(wp.id, { lat: parseFloat(e.target.value) })}
                        step="0.0001"
                        className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-200 text-xs w-24"
                      />
                    ) : (
                      wp.lat.toFixed(4)
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {editMode ? (
                      <input
                        type="number"
                        value={wp.lon}
                        onChange={(e) => updateWaypoint(wp.id, { lon: parseFloat(e.target.value) })}
                        step="0.0001"
                        className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-200 text-xs w-24"
                      />
                    ) : (
                      wp.lon.toFixed(4)
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {editMode ? (
                      <input
                        type="number"
                        value={wp.alt}
                        onChange={(e) => updateWaypoint(wp.id, { alt: parseFloat(e.target.value) })}
                        className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-200 text-xs w-20"
                      />
                    ) : (
                      wp.alt
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {editMode ? (
                      <input
                        type="number"
                        value={wp.speed}
                        onChange={(e) => updateWaypoint(wp.id, { speed: parseFloat(e.target.value) })}
                        className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-200 text-xs w-20"
                      />
                    ) : (
                      wp.speed
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {editMode ? (
                      <input
                        type="number"
                        value={wp.heading}
                        onChange={(e) => updateWaypoint(wp.id, { heading: parseFloat(e.target.value) })}
                        min="0"
                        max="360"
                        className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-200 text-xs w-20"
                      />
                    ) : (
                      wp.heading
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {editMode ? (
                      <input
                        type="number"
                        value={wp.delay}
                        onChange={(e) => updateWaypoint(wp.id, { delay: parseFloat(e.target.value) })}
                        min="0"
                        className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-200 text-xs w-20"
                      />
                    ) : (
                      wp.delay
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => deleteWaypoint(wp.id)}
                      className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-rose-600/30 text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
