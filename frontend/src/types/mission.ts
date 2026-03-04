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

export type MissionStatus = 'draft' | 'planned' | 'executing' | 'completed' | 'aborted';
