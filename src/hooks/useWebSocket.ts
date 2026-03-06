import { useEffect, useRef, useState, useCallback } from 'react';
import { Message } from '../types';

export const useWebSocket = (userId: string | undefined, callbacks?: {
  onMessage?: (message: Message) => void;
  onIncomingCall?: (call: { senderId: string, signalData: any }) => void;
}) => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [incomingCall, setIncomingCall] = useState<{ senderId: string, signalData: any } | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  const [error, setError] = useState<string | null>(null);

  // Store callbacks in ref to avoid re-connecting websocket on callback change
  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    if (!userId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WS Connected');
      setIsConnected(true);
      setError(null);
    };

    ws.current.onclose = () => {
      console.log('WS Disconnected');
      setIsConnected(false);
      setError('Connection lost. Reconnecting...');
    };

    ws.current.onerror = (e) => {
      console.error('WS Error:', e);
      setError('WebSocket error occurred.');
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'chat_ack' || data.type === 'chat_new') {
        setMessages((prev) => [...prev, data.message]);
        callbacksRef.current?.onMessage?.(data.message);
      } else if (data.type === 'call_signal') {
        setIncomingCall({ senderId: data.senderId, signalData: data.signalData });
        callbacksRef.current?.onIncomingCall?.({ senderId: data.senderId, signalData: data.signalData });
      } else if (data.type === 'call_end') {
        setIncomingCall(null); // Clear incoming call state
        // Dispatch a custom event or use a callback if needed, 
        // but clearing state might be enough if components react to it
        window.dispatchEvent(new CustomEvent('call_ended'));
      } else if (data.type === 'typing') {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.add(data.senderId);
          return newSet;
        });
        
        // Auto-clear after 3 seconds if no more typing events
        setTimeout(() => {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.senderId);
            return newSet;
          });
        }, 3000);
      }
    };

    return () => {
      ws.current?.close();
    };
  }, [userId]);

  const sendMessage = useCallback((receiverId: string, content: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'chat',
        receiverId,
        content
      }));
      return true;
    } else {
      setError('Not connected. Message not sent.');
      return false;
    }
  }, []);

  const sendTyping = useCallback((receiverId: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'typing',
        receiverId
      }));
    }
  }, []);

  const sendSignal = useCallback((receiverId: string, signalData: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'call_signal',
        receiverId,
        signalData
      }));
      return true;
    } else {
      setError('Connection lost. Signal not sent.');
      return false;
    }
  }, []);

  const endCall = useCallback((receiverId: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'call_end',
        receiverId
      }));
    }
  }, []);

  return { isConnected, messages, sendMessage, sendTyping, sendSignal, endCall, incomingCall, setMessages, error, setError, typingUsers };
};
