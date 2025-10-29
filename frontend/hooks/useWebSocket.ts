import { useState, useEffect, useRef } from 'react';

export const useWebSocket = (url: string, onMessage: (event: MessageEvent) => void, enabled: boolean) => {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<number | null>(null);
  const reconnectAttempts = useRef(0);

  useEffect(() => {
    if (!enabled || !url) {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (ws.current) {
        ws.current.onclose = null;
        ws.current.close();
      }
      setConnectionStatus('disconnected');
      return;
    }

    const connect = () => {
      if (ws.current && ws.current.readyState !== WebSocket.CLOSED) return;

      setConnectionStatus('connecting');
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;
        if(reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      };

      ws.current.onmessage = onMessage;

      ws.current.onerror = () => {
        console.error('WebSocket error occurred. This is often due to a connection failure. See the onclose event for more details.');
      };

      ws.current.onclose = (event: CloseEvent) => {
        console.log(`WebSocket disconnected: Code=${event.code}, Reason='${event.reason}', WasClean=${event.wasClean}`);
        setConnectionStatus('disconnected');
        
        // Only attempt to reconnect if the connection was not closed cleanly or if it's an abnormal closure
        if (!event.wasClean || event.code === 1006) {
            const delay = Math.min(1000 * (2 ** reconnectAttempts.current), 30000);
            reconnectTimeout.current = window.setTimeout(connect, delay);
            reconnectAttempts.current++;
        }
      };
    };

    connect();

    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (ws.current) {
        ws.current.onclose = null; 
        ws.current.close();
      }
    };
  }, [url, onMessage, enabled]);

  return { connectionStatus };
};
