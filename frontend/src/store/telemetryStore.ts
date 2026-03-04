import { create } from 'zustand';

export interface TelemetryData {
  roll: number;
  pitch: number;
  yaw: number;
  altitude: number;
  groundSpeed: number;
  airSpeed: number;
  climbRate: number;
  heading: number;
  latitude: number;
  longitude: number;
  batteries: BatteryData[];
  gpsStatus: 'no_gps' | 'no_fix' | '2d' | '3d';
  satCount: number;
  temperature: number;
  mode: string;
  armed: boolean;
  timestamp: number;
}

export interface BatteryData {
  cellCount: number;
  voltage: number;
  current: number;
  capacity: number;
  remaining: number;
}

export interface TelemetryState {
  currentTelemetry: TelemetryData | null;
  telemetryHistory: TelemetryData[];
  isReceiving: boolean;
  lastUpdateTime: number | null;
}

export interface TelemetryActions {
  updateTelemetry: (data: TelemetryData) => void;
  setIsReceiving: (receiving: boolean) => void;
  clearHistory: () => void;
}

export type TelemetryStore = TelemetryState & TelemetryActions;

const initialState: TelemetryState = {
  currentTelemetry: null,
  telemetryHistory: [],
  isReceiving: false,
  lastUpdateTime: null,
};

export const useTelemetryStore = create<TelemetryStore>((set) => ({
  ...initialState,
  updateTelemetry: (data) =>
    set((state) => ({
      currentTelemetry: data,
      lastUpdateTime: Date.now(),
      telemetryHistory: [...state.telemetryHistory.slice(-999), data],
    })),
  setIsReceiving: (receiving) => set({ isReceiving: receiving }),
  clearHistory: () => set({ telemetryHistory: [] }),
}));
