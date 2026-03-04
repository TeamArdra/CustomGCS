import { TelemetryData } from '../store/telemetryStore';

// Simulated vehicle state
let state = {
  altitude: 0,
  groundSpeed: 0,
  heading: 0,
  roll: 0,
  pitch: 0,
  yaw: 0,
  climbRate: 0,
  latitude: 37.7749,
  longitude: -122.4194,
  temperature: 25,
};

/**
 * Generates realistic mock telemetry data
 * Simulates a vehicle in flight with gradual changes
 */
export function generateMockTelemetry(): TelemetryData {
  // Simulate altitude changes (0-120m range, gradual climb/descent)
  state.climbRate = (Math.random() - 0.5) * 10; // -5 to 5 m/s
  state.altitude = Math.max(
    0,
    Math.min(150, state.altitude + state.climbRate * 0.1)
  );

  // Simulate speed (0-30 m/s, realistic acceleration)
  const targetSpeed = 15 + Math.sin(Date.now() / 10000) * 10;
  state.groundSpeed += (targetSpeed - state.groundSpeed) * 0.02;

  // Simulate heading (continuous rotation)
  state.heading = (state.heading + Math.random() * 2 - 1) % 360;

  // Simulate roll and pitch (small oscillations)
  state.roll = Math.sin(Date.now() / 3000) * 15;
  state.pitch = Math.cos(Date.now() / 4000) * 10;
  state.yaw = state.heading;

  // Simulate GPS drift (very small)
  state.latitude += (Math.random() - 0.5) * 0.0001;
  state.longitude += (Math.random() - 0.5) * 0.0001;

  // Simulate temperature variations
  state.temperature += (Math.random() - 0.5) * 0.5;

  return {
    roll: state.roll,
    pitch: state.pitch,
    yaw: state.yaw,
    altitude: Math.round(state.altitude * 10) / 10,
    groundSpeed: Math.round(state.groundSpeed * 10) / 10,
    airSpeed: state.groundSpeed + (Math.random() - 0.5) * 2,
    climbRate: Math.round(state.climbRate * 10) / 10,
    heading: Math.round(state.heading),
    latitude: state.latitude,
    longitude: state.longitude,
    batteries: [
      {
        cellCount: 4,
        voltage: 14.8 + (Math.random() - 0.5) * 0.2,
        current: 15 + Math.random() * 10,
        capacity: 5000,
        remaining: Math.max(20, 100 - (Date.now() / 300000) * 100), // Slowly drain over 50 min
      },
    ],
    gpsStatus: Date.now() % 20000 < 2000 ? 'no_fix' : '3d', // Occasional no-fix
    satCount: 10 + Math.floor(Math.random() * 4),
    temperature: Math.round(state.temperature * 10) / 10,
    mode: 'GUIDED',
    armed: true,
    timestamp: Date.now(),
  };
}

/**
 * Starts mock telemetry generation with a callback
 * @param callback Function to call with each new telemetry update
 * @param interval Milliseconds between updates (default: 500ms)
 * @returns Function to stop the generator
 */
export function startMockTelemetryStream(
  callback: (data: TelemetryData) => void,
  interval: number = 500
): () => void {
  const intervalId = setInterval(() => {
    callback(generateMockTelemetry());
  }, interval);

  return () => clearInterval(intervalId);
}
