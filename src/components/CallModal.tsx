import { useEffect, useRef, useState } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { User } from '../types';
import { useWebSocket } from '../hooks/useWebSocket';

interface CallModalProps {
  currentUser: User;
  targetUser: User;
  isVideo: boolean;
  isIncoming: boolean;
  onClose: () => void;
  ws: ReturnType<typeof useWebSocket>;
}

export default function CallModal({ currentUser, targetUser, isVideo, isIncoming, onClose, ws }: CallModalProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [status, setStatus] = useState(isIncoming ? 'Incoming call...' : 'Calling...');
  const [callError, setCallError] = useState<string | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);

  // Monitor WebSocket connection
  useEffect(() => {
    if (!ws.isConnected) {
      setCallError('Connection lost. Reconnecting...');
    } else {
      setCallError(null);
    }
  }, [ws.isConnected]);

  useEffect(() => {
    const startCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: isVideo, 
          audio: true 
        });
        setLocalStream(stream);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const peer = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        peerRef.current = peer;

        // ICE Connection State Monitoring
        peer.oniceconnectionstatechange = () => {
          const state = peer.iceConnectionState;
          console.log('ICE Connection State:', state);
          if (state === 'disconnected') {
            setStatus('Reconnecting...');
          } else if (state === 'failed') {
            setStatus('Connection failed');
            setCallError('Call connection failed. Please try again.');
          } else if (state === 'connected') {
            setStatus('Connected');
            setCallError(null);
          }
        };

        stream.getTracks().forEach(track => peer.addTrack(track, stream));

        peer.ontrack = (event) => {
          setRemoteStream(event.streams[0]);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        peer.onicecandidate = (event) => {
          if (event.candidate) {
            if (ws.isConnected) {
              ws.sendSignal(targetUser.id, { type: 'candidate', candidate: event.candidate });
            }
          }
        };

        if (!isIncoming) {
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          if (ws.isConnected) {
            ws.sendSignal(targetUser.id, { type: 'offer', offer });
          } else {
            setCallError('Cannot start call: No connection');
          }
        } else {
          // If incoming, we wait for the offer via props/ws
        }

      } catch (err) {
        console.error('Error accessing media devices:', err);
        setStatus('Media Error');
        setCallError('Failed to access camera/microphone. Please check permissions.');
      }
    };

    startCall();

    return () => {
      localStream?.getTracks().forEach(track => track.stop());
      peerRef.current?.close();
    };
  }, []);

  // Handle signaling
  useEffect(() => {
    if (ws.incomingCall && ws.incomingCall.senderId === targetUser.id) {
      const { signalData } = ws.incomingCall;
      const peer = peerRef.current;
      if (!peer) return;

      const handleSignal = async () => {
        try {
          if (signalData.type === 'offer') {
            await peer.setRemoteDescription(new RTCSessionDescription(signalData.offer));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            if (ws.isConnected) {
              ws.sendSignal(targetUser.id, { type: 'answer', answer });
              setStatus('Connected');
            }
          } else if (signalData.type === 'answer') {
            await peer.setRemoteDescription(new RTCSessionDescription(signalData.answer));
            setStatus('Connected');
          } else if (signalData.type === 'candidate') {
            await peer.addIceCandidate(new RTCIceCandidate(signalData.candidate));
          }
        } catch (e) {
          console.error('Signaling error:', e);
          setCallError('Signaling error occurred.');
        }
      };
      handleSignal();
    }
  }, [ws.incomingCall, ws.isConnected]);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
      setIsCameraOff(!isCameraOff);
    }
  };

  const handleEndCall = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center">
      <div className="relative w-full h-full md:h-[85vh] md:max-w-4xl md:rounded-2xl overflow-hidden flex flex-col bg-slate-900">
        {/* Error Banner */}
        {callError && (
          <div className="absolute top-20 left-0 right-0 z-30 flex justify-center px-4">
            <div className="bg-red-500/90 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg backdrop-blur-sm text-center">
              {callError}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 pt-safe bg-gradient-to-b from-black/80 to-transparent z-20 flex justify-between items-start">
          <div className="flex items-center gap-3 mt-2">
            <img src={targetUser.avatar_url} alt={targetUser.username} className="w-10 h-10 rounded-full border-2 border-white/20" />
            <div>
              <h3 className="text-white font-semibold text-shadow">{targetUser.username}</h3>
              <p className="text-white/80 text-sm text-shadow">{status}</p>
            </div>
          </div>
        </div>

        {/* Video Area */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
          {/* Remote Video */}
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
          
          {/* Local Video (PIP) */}
          <div className="absolute top-20 right-4 w-32 h-48 md:w-48 md:h-36 bg-slate-800 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl z-20">
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover transform scale-x-[-1]" 
            />
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 pb-safe pt-8 bg-gradient-to-t from-black/90 to-transparent z-20 flex justify-center items-center gap-6 md:gap-8 mb-8">
          <button 
            onClick={toggleMute}
            className={`p-4 rounded-full ${isMuted ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'} backdrop-blur-md transition-all active:scale-95`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          
          <button 
            onClick={handleEndCall}
            className="p-5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-500/30"
          >
            <PhoneOff className="w-8 h-8" />
          </button>

          <button 
            onClick={toggleCamera}
            className={`p-4 rounded-full ${isCameraOff ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'} backdrop-blur-md transition-all active:scale-95`}
          >
            {isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </div>
  );
}
