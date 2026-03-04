import { create } from 'zustand';

export interface Mission {
  id: string;
  name: string;
  description: string;
  waypoints: Waypoint[];
  status: 'draft' | 'planned' | 'executing' | 'completed' | 'aborted';
  createdAt: Date;
  updatedAt: Date;
  executionStartTime?: Date;
}

export interface Waypoint {
  id: string;
  sequence: number;
  latitude: number;
  longitude: number;
  altitude: number;
  holdTime: number;
  command: string;
  params: Record<string, unknown>;
}

export interface MissionState {
  missions: Mission[];
  activeMission: Mission | null;
  currentWaypointIndex: number;
  isExecuting: boolean;
}

export interface MissionActions {
  addMission: (mission: Mission) => void;
  updateMission: (id: string, mission: Partial<Mission>) => void;
  deleteMission: (id: string) => void;
  setActiveMission: (mission: Mission | null) => void;
  setCurrentWaypointIndex: (index: number) => void;
  setIsExecuting: (executing: boolean) => void;
}

export type MissionStore = MissionState & MissionActions;

const initialState: MissionState = {
  missions: [],
  activeMission: null,
  currentWaypointIndex: 0,
  isExecuting: false,
};

export const useMissionStore = create<MissionStore>((set) => ({
  ...initialState,
  addMission: (mission) =>
    set((state) => ({
      missions: [...state.missions, mission],
    })),
  updateMission: (id, updates) =>
    set((state) => ({
      missions: state.missions.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),
  deleteMission: (id) =>
    set((state) => ({
      missions: state.missions.filter((m) => m.id !== id),
    })),
  setActiveMission: (mission) => set({ activeMission: mission }),
  setCurrentWaypointIndex: (index) => set({ currentWaypointIndex: index }),
  setIsExecuting: (executing) => set({ isExecuting: executing }),
}));
