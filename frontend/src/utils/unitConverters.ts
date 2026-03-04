// Unit conversion utilities

export const unitConverters = {
  // Speed conversions
  mpsToKnots: (mps: number): number => mps * 1.944,
  knopsToMps: (knots: number): number => knots / 1.944,
  mpsToKmh: (mps: number): number => mps * 3.6,
  kmhToMps: (kmh: number): number => kmh / 3.6,

  // Distance conversions
  metersToFeet: (meters: number): number => meters * 3.28084,
  feetToMeters: (feet: number): number => feet / 3.28084,
  kmToMiles: (km: number): number => km * 0.621371,
  milesToKm: (miles: number): number => miles / 0.621371,

  // Temperature conversions
  celsiusToFahrenheit: (celsius: number): number => (celsius * 9) / 5 + 32,
  fahrenheitToCelsius: (fahrenheit: number): number => ((fahrenheit - 32) * 5) / 9,

  // Pressure conversions
  paToBar: (pa: number): number => pa / 100000,
  barToPa: (bar: number): number => bar * 100000,
  paToMbar: (pa: number): number => pa / 100,
  mbarToPa: (mbar: number): number => mbar * 100,

  // Angle conversions
  degreesToRadians: (degrees: number): number => (degrees * Math.PI) / 180,
  radiansToDegrees: (radians: number): number => (radians * 180) / Math.PI,

  // Battery conversions
  voltTomV: (volts: number): number => volts * 1000,
  mvToVolt: (mv: number): number => mv / 1000,
};
