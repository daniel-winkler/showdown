import { useEffect } from 'react';

const API_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
const PING_INTERVAL = 60000 * 5; // 5 minutes

/**
 * Custom hook to keep the server alive by pinging it periodically.
 * This prevents the server from spinning down due to inactivity on free hosting platforms.
 */
export function useKeepAlive() {
  useEffect(() => {
    const pingServer = async () => {
      try {
        const response = await fetch(`${API_URL}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          console.log('[KeepAlive] Server ping successful');
        } else {
          console.warn('[KeepAlive] Server ping failed with status:', response.status);
        }
      } catch (error) {
        console.error('[KeepAlive] Failed to ping server:', error);
      }
    };

    // Ping immediately on mount
    pingServer();

    // Set up interval to ping every 60 seconds
    const intervalId = setInterval(pingServer, PING_INTERVAL);

    // Cleanup interval on unmount
    return () => {
      clearInterval(intervalId);
      console.log('[KeepAlive] Stopped server pings');
    };
  }, []);
}
