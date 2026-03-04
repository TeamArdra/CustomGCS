// MAVLink message types for Protocol v2
export interface MAVLinkMessage {
  msgid: number;
  timestamp: number;
  data: Record<string, unknown>;
}

// Attitude
export interface AttitudeMessage {
  timeBootMs: number;
  roll: number;
  pitch: number;
  yaw: number;
  rollspeed: number;
  pitchspeed: number;
  yawspeed: number;
}

// GPS
export interface GlobalPositionIntMessage {
  timeBootMs: number;
  lat: number;
  lon: number;
  alt: number;
  relativeAlt: number;
  vx: number;
  vy: number;
  vz: number;
  hdg: number;
}

// System Status
export interface SysStatusMessage {
  onboardControlSensorsPresent: number;
  onboardControlSensorsEnabled: number;
  onboardControlSensorsHealth: number;
  load: number;
  voltageBattery: number;
  currentBattery: number;
  batteryRemaining: number;
  dropRateComm: number;
  errorsComm: number;
  errorsCount1: number;
  errorsCount2: number;
  errorsCount3: number;
  errorsCount4: number;
}

// Heartbeat
export interface HeartbeatMessage {
  type: number;
  autopilot: number;
  baseMode: number;
  customMode: number;
  systemStatus: number;
  mavlinkVersion: number;
}

// Power Status
export interface BatteryStatusMessage {
  id: number;
  batteryFunction: number;
  type: number;
  temperature: number;
  voltages: number[];
  currentBattery: number;
  currentConsumed: number;
  energyConsumed: number;
  batteryRemaining: number;
  timeRemaining: number;
  chargeState: number;
}

// RC Channels
export interface RcChannelsMessage {
  timeBootMs: number;
  chancount: number;
  chan1Raw: number;
  chan2Raw: number;
  chan3Raw: number;
  chan4Raw: number;
  chan5Raw: number;
  chan6Raw: number;
  chan7Raw: number;
  chan8Raw: number;
  chan9Raw: number;
  chan10Raw: number;
  chan11Raw: number;
  chan12Raw: number;
  chan13Raw: number;
  chan14Raw: number;
  chan15Raw: number;
  chan16Raw: number;
  rssi: number;
}
