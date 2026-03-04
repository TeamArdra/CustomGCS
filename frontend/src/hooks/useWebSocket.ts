import { useCallback } from 'react';
import { wsClient } from '../services/websocket';
import { useConnectionStore } from '../store';

export const useWebSocket = () => {
  const { setConnected, setConnectionType, setConnectionError } = useConnectionStore();

  // Don't auto-connect for now - just provide connect function
  const connect = useCallback(async () => {
    try {
      await wsClient.connect();
      setConnected(true);
      setConnectionType('network');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect';
      setConnectionError(errorMessage);
      setConnected(false);
    }
  }, [setConnected, setConnectionType, setConnectionError]);

  const disconnect = useCallback(() => {
    wsClient.disconnect();
    setConnected(false);
  }, [setConnected]);

  const send = useCallback((message: Record<string, unknown>) => {
    wsClient.send(message);
  }, []);

  const subscribe = useCallback((type: string, handler: (data: unknown) => void) => {
    wsClient.on(type, handler);
    return () => wsClient.off(type);
  }, []);

  return {
    isConnected: wsClient.isConnected(),
    connect,
    disconnect,
    send,
    subscribe,
  };
};
