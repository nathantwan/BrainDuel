import { WebSocketMessage } from '../types/websocket'; // Adjust the import path as necessary
import { useEffect, useRef, useCallback, useState } from 'react';

export const useWebSocket = (userId: string | null) => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const messageHandlers = useRef<Map<string, (message: WebSocketMessage) => void>>(new Map());
  
  // Debug lastMessage changes
  useEffect(() => {
    console.log('useWebSocket lastMessage changed:', lastMessage);
  }, [lastMessage]);
  
  // Create a simple event emitter for messages
  const messageListeners = useRef<Set<(message: WebSocketMessage) => void>>(new Set());
  
  // Connection event listeners
  const connectionListeners = useRef<Set<() => void>>(new Set());
  

  

  
  const addMessageListener = useCallback((listener: (message: WebSocketMessage) => void) => {
    console.log('Adding message listener, current count:', messageListeners.current.size);
    messageListeners.current.add(listener);
    console.log('Message listener added, new count:', messageListeners.current.size);
  }, []);
  
  const removeMessageListener = useCallback((listener: (message: WebSocketMessage) => void) => {
    console.log('Removing message listener, current count:', messageListeners.current.size);
    messageListeners.current.delete(listener);
    console.log('Message listener removed, new count:', messageListeners.current.size);
  }, []);

  const connect = useCallback(() => {
    if (!userId || ws.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/battles/ws/${userId}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      console.log('WebSocket connected - available handlers:', Array.from(messageHandlers.current.keys()));
      
      // Notify connection listeners
      console.log('Notifying connection listeners, count:', connectionListeners.current.size);
      connectionListeners.current.forEach(listener => {
        try {
          console.log('Calling connection listener');
          listener();
        } catch (error) {
          console.error('Error in connection listener:', error);
        }
      });
    };

    ws.current.onmessage = (event) => {
      try {
        console.log('WebSocket message received:', event.data);
        const message: WebSocketMessage = JSON.parse(event.data);
        console.log('Setting lastMessage to:', message);
        
        // Force the state update by using a function
        setLastMessage(() => {
          console.log('setLastMessage callback called with:', message);
          return message;
        });
        
        console.log('Parsed message:', message);
        
        // Notify all message listeners
        console.log('Notifying message listeners, count:', messageListeners.current.size);
        messageListeners.current.forEach(listener => {
          try {
            console.log('Calling message listener');
            listener(message);
          } catch (error) {
            console.error('Error in message listener:', error);
          }
        });
        
        // Call specific handler if registered
        const handler = messageHandlers.current.get(message.type);
        console.log('Looking for handler for message type:', message.type);
        console.log('Available handlers:', Array.from(messageHandlers.current.keys()));
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

  const addMessageHandler = useCallback((type: string, handler: (message: WebSocketMessage) => void) => {
    console.log('Adding message handler for type:', type);
    messageHandlers.current.set(type, handler);
    console.log('Current handlers:', Array.from(messageHandlers.current.keys()));
    console.log('WebSocket ready state:', ws.current?.readyState);
  }, []);

  const removeMessageHandler = useCallback((type: string) => {
    console.log('Removing message handler for type:', type);
    messageHandlers.current.delete(type);
  }, []);

  const addConnectionListener = useCallback((listener: () => void) => {
    console.log('Adding connection listener');
    connectionListeners.current.add(listener);
  }, []);

  const removeConnectionListener = useCallback((listener: () => void) => {
    console.log('Removing connection listener');
    connectionListeners.current.delete(listener);
  }, []);

  useEffect(() => {
    if (userId) {
      connect();
    }
    return disconnect;
  }, [userId]); // Only depend on userId, not the functions

  return {
    isConnected,
    lastMessage,
    sendMessage,
    addMessageHandler,
    removeMessageHandler,
    addMessageListener,
    removeMessageListener,
    addConnectionListener,
    removeConnectionListener,
    connect,
    disconnect,
  };
};
