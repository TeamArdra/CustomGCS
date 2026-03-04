// Coordinate conversion utilities

export const coordinateUtils = {
  // Convert decimal degrees to degrees, minutes, seconds
  decimalToDMS: (decimal: number): { degrees: number; minutes: number; seconds: number } => {
    const degrees = Math.floor(Math.abs(decimal));
    const minutesDecimal = (Math.abs(decimal) - degrees) * 60;
    const minutes = Math.floor(minutesDecimal);
    const seconds = (minutesDecimal - minutes) * 60;

    return {
      degrees,
      minutes,
      seconds: Math.round(seconds * 100) / 100,
    };
  },

  // Convert degrees, minutes, seconds to decimal
  dmsToDecimal: (degrees: number, minutes: number, seconds: number): number => {
    return degrees + minutes / 60 + seconds / 3600;
  },

  // Calculate distance between two coordinates (Haversine formula)
  calculateDistance: (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  // Calculate bearing between two coordinates
  calculateBearing: (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
    const x =
      Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
      Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLon);
    return (Math.atan2(y, x) * 180) / Math.PI;
  },
};
