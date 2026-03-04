import { create } from 'zustand';

export interface ConnectionState {
  isConnected: boolean;
  connectionType: 'none' | 'usb' | 'serial' | 'network';
  lastConnectedTime: Date | null;
  connectionError: string | null;
  mockMode: boolean; // true = mock data, false = real backend
}

export interface ConnectionActions {
  setConnected: (connected: boolean) => void;
  setConnectionType: (type: ConnectionState['connectionType']) => void;
  setConnectionError: (error: string | null) => void;
  setMockMode: (mock: boolean) => void;
  resetConnection: () => void;
}

export type ConnectionStore = ConnectionState & ConnectionActions;

const initialState: ConnectionState = {
  isConnected: false,
  connectionType: 'none',
  lastConnectedTime: null,
  connectionError: null,
  mockMode: true, // Default to mock mode
};

export const useConnectionStore = create<ConnectionStore>((set) => ({
  ...initialState,
  setConnected: (connected) =>
    set({
      isConnected: connected,
      lastConnectedTime: connected ? new Date() : null,
    }),
  setConnectionType: (type) => set({ connectionType: type }),
  setConnectionError: (error) => set({ connectionError: error }),
  setMockMode: (mock) => set({ mockMode: mock }),
  resetConnection: () => set(initialState),
}));
