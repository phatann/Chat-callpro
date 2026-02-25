import { useEffect, useRef, useState, useCallback } from 'react';
import { Message } from '../types';

export const useWebSocket = (userId: string | undefined) => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [incomingCall, setIncomingCall] = useState<{ senderId: string, signalData: any } | null>(null);

  useEffect(() => {
    if (!userId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WS Connected');
      setIsConnected(true);
    };

    ws.current.onclose = () => {
      console.log('WS Disconnected');
      setIsConnected(false);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'chat_ack' || data.type === 'chat_new') {
        setMessages((prev) => [...prev, data.message]);
      } else if (data.type === 'call_signal') {
        setIncomingCall({ senderId: data.senderId, signalData: data.signalData });
      } else if (data.type === 'call_end') {
        setIncomingCall(null); // Clear incoming call state
        // Dispatch a custom event or use a callback if needed, 
        // but clearing state might be enough if components react to it
        window.dispatchEvent(new CustomEvent('call_ended'));
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
    }
  }, []);

  const sendSignal = useCallback((receiverId: string, signalData: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'call_signal',
        receiverId,
        signalData
      }));
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

  return { isConnected, messages, sendMessage, sendSignal, endCall, incomingCall, setMessages };
};
