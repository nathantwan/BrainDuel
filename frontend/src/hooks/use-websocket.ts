import { WebSocketMessage } from '../types/battle'; // Adjust the import path as necessary
import { useEffect, useRef, useCallback, useState } from 'react';

export const useWebSocket = (userId: string | null) => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const messageHandlers = useRef<Map<string, (message: any) => void>>(new Map());

  const connect = useCallback(() => {
    if (!userId || ws.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = `${process.env.REACT_APP_WS_URL || 'ws://localhost:8000'}/battles/ws/${userId}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    ws.current.onmessage = (event) => {
      try {
        console.log('WebSocket message received:', event.data);
        const message: WebSocketMessage = JSON.parse(event.data);
        setLastMessage(message);
        console.log('Parsed message:', message);
        
        // Call specific handler if registered
        const handler = messageHandlers.current.get(message.type);
        if (handler) {
          console.log('Calling handler for message type:', message.type);
          handler(message);
        } else {
          console.log('No handler registered for message type:', message.type);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      // Attempt to reconnect after 3 seconds
      setTimeout(connect, 3000);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };
  }, [userId]);

  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
      setIsConnected(false);
    }
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected');
    }
  }, []);

  const addMessageHandler = useCallback((type: string, handler: (message: any) => void) => {
    messageHandlers.current.set(type, handler);
  }, []);

  const removeMessageHandler = useCallback((type: string) => {
    messageHandlers.current.delete(type);
  }, []);

  useEffect(() => {
    if (userId) {
      connect();
    }
    return disconnect;
  }, [userId, connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    addMessageHandler,
    removeMessageHandler,
    connect,
    disconnect,
  };
};
