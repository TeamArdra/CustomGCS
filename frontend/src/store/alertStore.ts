import { create } from 'zustand';

export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: number;
  duration?: number;
  dismissible: boolean;
}

export interface AlertState {
  alerts: Alert[];
}

export interface AlertActions {
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp'>) => void;
  removeAlert: (id: string) => void;
  clearAlerts: () => void;
}

export type AlertStore = AlertState & AlertActions;

const initialState: AlertState = {
  alerts: [],
};

let alertId = 0;

export const useAlertStore = create<AlertStore>((set) => ({
  ...initialState,
  addAlert: (alert) =>
    set((state) => ({
      alerts: [
        ...state.alerts,
        {
          ...alert,
          id: `alert-${alertId++}`,
          timestamp: Date.now(),
        },
      ],
    })),
  removeAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== id),
    })),
  clearAlerts: () => set({ alerts: [] }),
}));
