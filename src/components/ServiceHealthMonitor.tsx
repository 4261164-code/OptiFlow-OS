import React, { useEffect, useRef } from 'react';
import { useNotifications } from './NotificationContext';
import { apiFetch } from '../lib/auth';

export function ServiceHealthMonitor() {
  const { addNotification } = useNotifications();
  const monitorIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await apiFetch('/api/health/affiliates');
        const res = await response.json();

        if (res && res.issues && res.issues.length > 0) {
           res.issues.forEach((issue: string) => {
              addNotification('error', 'Service Health Alert', issue);
           });
        }
      } catch (err: any) {
        console.error("Health monitor ping failed:", err);
      }
    };

    // Run first check after a short delay (e.g. 10s)
    const initialDelay = setTimeout(() => {
      checkHealth();
    }, 10000);

    // Set 5-minute interval
    monitorIntervalRef.current = setInterval(() => {
      checkHealth();
    }, 5 * 60 * 1000);

    return () => {
      clearTimeout(initialDelay);
      if (monitorIntervalRef.current) {
        clearInterval(monitorIntervalRef.current);
      }
    };
  }, [addNotification]);

  return null;
}
