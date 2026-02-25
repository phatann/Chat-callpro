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
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);

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

        stream.getTracks().forEach(track => peer.addTrack(track, stream));

        peer.ontrack = (event) => {
          setRemoteStream(event.streams[0]);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        peer.onicecandidate = (event) => {
          if (event.candidate) {
            ws.sendSignal(targetUser.id, { type: 'candidate', candidate: event.candidate });
          }
        };

        if (!isIncoming) {
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          ws.sendSignal(targetUser.id, { type: 'offer', offer });
        } else {
          // If incoming, we wait for the offer via props/ws
          // The parent component should pass the offer signal if it exists
          // But for simplicity, we'll handle signaling in the effect below
        }

      } catch (err) {
        console.error('Error accessing media devices:', err);
        setStatus('Failed to access camera/microphone');
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
        if (signalData.type === 'offer') {
          await peer.setRemoteDescription(new RTCSessionDescription(signalData.offer));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          ws.sendSignal(targetUser.id, { type: 'answer', answer });
          setStatus('Connected');
        } else if (signalData.type === 'answer') {
          await peer.setRemoteDescription(new RTCSessionDescription(signalData.answer));
          setStatus('Connected');
        } else if (signalData.type === 'candidate') {
          await peer.addIceCandidate(new RTCIceCandidate(signalData.candidate));
        }
      };
      handleSignal();
    }
  }, [ws.incomingCall]);

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
    ws.endCall(targetUser.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      <div className="relative w-full max-w-4xl h-[80vh] bg-slate-900 rounded-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent z-10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={targetUser.avatar_url} alt={targetUser.username} className="w-10 h-10 rounded-full border-2 border-white/20" />
            <div>
              <h3 className="text-white font-semibold">{targetUser.username}</h3>
              <p className="text-white/60 text-sm">{status}</p>
            </div>
          </div>
        </div>

        {/* Video Area */}
        <div className="flex-1 relative bg-black flex items-center justify-center">
          {/* Remote Video */}
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
          
          {/* Local Video (PIP) */}
          <div className="absolute bottom-4 right-4 w-48 h-36 bg-slate-800 rounded-lg overflow-hidden border border-white/10 shadow-xl">
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
          <button 
            onClick={toggleMute}
            className={`p-4 rounded-full ${isMuted ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'} backdrop-blur-md transition-all`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          
          <button 
            onClick={handleEndCall}
            className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all scale-110"
          >
            <PhoneOff className="w-8 h-8" />
          </button>

          <button 
            onClick={toggleCamera}
            className={`p-4 rounded-full ${isCameraOff ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'} backdrop-blur-md transition-all`}
          >
            {isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </div>
  );
}
