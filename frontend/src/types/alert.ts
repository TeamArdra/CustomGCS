export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: number;
  duration?: number;
}

export type AlertSeverity = Alert['type'];
