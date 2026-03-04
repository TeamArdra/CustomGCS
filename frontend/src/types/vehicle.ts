export interface Vehicle {
  id: string;
  name: string;
  type: 'quadcopter' | 'hexacopter' | 'plane' | 'vtol' | 'rover' | 'submarine';
  systemId: number;
  componentId: number;
  armed: boolean;
  mode: string;
  battery: {
    voltage: number;
    current: number;
    remaining: number;
  };
}

export interface VehicleStatus {
  systemStatus: number;
  sensorStatus: number;
  lastHeartbeatTime: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  token?: string;
}
