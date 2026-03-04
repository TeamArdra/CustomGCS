import { create } from 'zustand';

export interface PreflightItem {
  id: string;
  name: string;
  status: 'pending' | 'passed' | 'failed' | 'warning';
  message?: string;
}

export interface PreflightState {
  items: PreflightItem[];
  isRunning: boolean;
  allPassed: boolean;
}

export interface PreflightActions {
  setItems: (items: PreflightItem[]) => void;
  updateItem: (id: string, item: Partial<PreflightItem>) => void;
  setIsRunning: (running: boolean) => void;
  reset: () => void;
}

export type PreflightStore = PreflightState & PreflightActions;

const initialState: PreflightState = {
  items: [],
  isRunning: false,
  allPassed: false,
};

export const usePreflightStore = create<PreflightStore>((set) => ({
  ...initialState,
  setItems: (items) =>
    set({
      items,
      allPassed: items.every((i) => i.status === 'passed' || i.status === 'warning'),
    }),
  updateItem: (id, updates) =>
    set((state) => {
      const newItems = state.items.map((i) => (i.id === id ? { ...i, ...updates } : i));
      return {
        items: newItems,
        allPassed: newItems.every((i) => i.status === 'passed' || i.status === 'warning'),
      };
    }),
  setIsRunning: (running) => set({ isRunning: running }),
  reset: () => set(initialState),
}));
