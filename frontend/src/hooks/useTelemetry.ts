import { useEffect } from 'react';
import { useTelemetryStore } from '../store';

export const useTelemetry = () => {
  const { currentTelemetry, telemetryHistory, isReceiving, updateTelemetry } = useTelemetryStore();

  useEffect(() => {
    // This hook provides access to telemetry data from the store
    // Telemetry updates are handled by the WebSocket service and store
  }, []);

  return {
    currentTelemetry,
    telemetryHistory,
    isReceiving,
    updateTelemetry,
  };
};
