export interface TelemetryUpdate {
  attitude: {
    roll: number;
    pitch: number;
    yaw: number;
  };
  position: {
    latitude: number;
    longitude: number;
    altitude: number;
    relativeAlt: number;
  };
  velocity: {
    groundSpeed: number;
    airSpeed: number;
    vx: number;
    vy: number;
    vz: number;
    climbRate: number;
  };
  battery: {
    voltage: number;
    current: number;
    remaining: number;
  };
  gps: {
    status: 'no_gps' | 'no_fix' | '2d_fix' | '3d_fix';
    satCount: number;
    hdop: number;
    vdop: number;
  };
  mode: string;
  armed: boolean;
  timestamp: number;
}

export type TelemetryField = keyof TelemetryUpdate;
