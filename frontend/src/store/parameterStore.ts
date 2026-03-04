import { create } from 'zustand';

export interface Parameter {
  id: string;
  name: string;
  value: string | number | boolean;
  type: 'string' | 'number' | 'boolean';
  min?: number;
  max?: number;
  description: string;
  category: string;
}

export interface ParameterState {
  parameters: Parameter[];
  isLoading: boolean;
  isDirty: boolean;
  pendingChanges: Record<string, unknown>;
}

export interface ParameterActions {
  setParameters: (parameters: Parameter[]) => void;
  updateParameter: (id: string, value: unknown) => void;
  setIsLoading: (loading: boolean) => void;
  discardChanges: () => void;
  applyChanges: () => void;
}

export type ParameterStore = ParameterState & ParameterActions;

const initialState: ParameterState = {
  parameters: [],
  isLoading: false,
  isDirty: false,
  pendingChanges: {},
};

export const useParameterStore = create<ParameterStore>((set) => ({
  ...initialState,
  setParameters: (parameters) => set({ parameters }),
  updateParameter: (id, value) =>
    set((state) => ({
      pendingChanges: { ...state.pendingChanges, [id]: value },
      isDirty: true,
    })),
  setIsLoading: (loading) => set({ isLoading: loading }),
  discardChanges: () =>
    set({
      pendingChanges: {},
      isDirty: false,
    }),
  applyChanges: () =>
    set((state) => ({
      parameters: state.parameters.map((p) =>
        state.pendingChanges[p.id] !== undefined
          ? { ...p, value: state.pendingChanges[p.id] as string | number | boolean }
          : p
      ),
      pendingChanges: {},
      isDirty: false,
    })),
}));
