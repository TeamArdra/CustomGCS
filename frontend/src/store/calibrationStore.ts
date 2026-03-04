import { create } from 'zustand';

export interface CalibrationState {
  isCalibrating: boolean;
  calibrationType: 'compass' | 'accelerometer' | 'gyroscope' | null;
  progress: number;
  message: string;
  results: CalibrationResult[];
}

export interface CalibrationResult {
  type: string;
  success: boolean;
  timestamp: number;
  data?: Record<string, unknown>;
}

export interface CalibrationActions {
  startCalibration: (type: CalibrationState['calibrationType']) => void;
  updateProgress: (progress: number, message: string) => void;
  completeCalibration: (result: CalibrationResult) => void;
  reset: () => void;
}

export type CalibrationStore = CalibrationState & CalibrationActions;

const initialState: CalibrationState = {
  isCalibrating: false,
  calibrationType: null,
  progress: 0,
  message: '',
  results: [],
};

export const useCalibrationStore = create<CalibrationStore>((set) => ({
  ...initialState,
  startCalibration: (type) =>
    set({
      isCalibrating: true,
      calibrationType: type,
      progress: 0,
      message: `Starting ${type} calibration...`,
    }),
  updateProgress: (progress, message) =>
    set({
      progress,
      message,
    }),
  completeCalibration: (result) =>
    set((state) => ({
      isCalibrating: false,
      results: [...state.results, result],
    })),
  reset: () => set(initialState),
}));
