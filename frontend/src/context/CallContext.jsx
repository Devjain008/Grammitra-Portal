import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { AnimatePresence, motion } from 'framer-motion';
import { Phone, Video, Mic, MicOff, Film, X, Loader } from 'lucide-react';

const CallContext = createContext();

export const useCall = () => useContext(CallContext);

/* ─────────── Helper: format duration mm:ss ─────────── */
const fmtDur = (sec) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

/* ─────────── Helper: Ringtone Synthesizer (Web Audio API) ─────────── */
let ringAudioCtx = null;
let ringInterval = null;

const playRingtone = () => {
  try {
    if (ringAudioCtx) return;
    ringAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    const playBeep = () => {
      if (!ringAudioCtx || ringAudioCtx.state === 'closed') return;
      const osc1 = ringAudioCtx.createOscillator();
      const osc2 = ringAudioCtx.createOscillator();
      const gainNode = ringAudioCtx.createGain();
      
      osc1.type = 'sine';
      osc1.frequency.value = 440;
      osc2.type = 'sine';
      osc2.frequency.value = 480;
      
      gainNode.gain.setValueAtTime(0, ringAudioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.12, ringAudioCtx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.12, ringAudioCtx.currentTime + 1.8);
      gainNode.gain.linearRampToValueAtTime(0, ringAudioCtx.currentTime + 2.0);
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ringAudioCtx.destination);
      
      osc1.start();
      osc2.start();
      
      osc1.stop(ringAudioCtx.currentTime + 2.0);
      osc2.stop(ringAudioCtx.currentTime + 2.0);
    };
    
    playBeep();
    ringInterval = setInterval(playBeep, 4000);
  } catch (err) {
    console.error('Ringtone error:', err);
  }
};

const stopRingtone = () => {
  clearInterval(ringInterval);
  ringInterval = null;
  if (ringAudioCtx) {
    try {
      ringAudioCtx.close().catch(() => {});
    } catch (e) {}
    ringAudioCtx = null;
  }
};

export const CallProvider = ({ children }) => {
  const socket = useSocket();
  const { user } = useAuth();
  const { locale } = useLanguage();

  const [callState, setCallState] = useState('idle'); // 'idle' | 'calling' | 'incoming' | 'active'
  const [callType, setCallType] = useState('audio'); // 'audio' | 'video'
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callTimer, setCallTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [activeCallUser, setActiveCallUser] = useState(null); // { name, image, id, offer, roomId }

  const pcRef = useRef(null);
  const callTimerRef = useRef(null);
  const callStateRef = useRef('idle');
  const queuedRemoteCandidates = useRef([]); // Queued remote ICE candidates

  // Sync ref to avoid closure issues
  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  // Ringtone playback
  useEffect(() => {
    if (callState === 'calling' || callState === 'incoming') {
      playRingtone();
    } else {
      stopRingtone();
    }
    return () => stopRingtone();
  }, [callState]);

  const processQueuedCandidates = async () => {
    if (pcRef.current && pcRef.current.remoteDescription) {
      const candidates = queuedRemoteCandidates.current;
      queuedRemoteCandidates.current = [];
      for (const cand of candidates) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(cand));
        } catch (err) {
          console.error('Error adding queued ICE candidate:', err);
        }
      }
    }
  };

  // Handle incoming calls socket events
  useEffect(() => {
    if (!socket) return;

    const onCallIncoming = async (data) => {
      if (callStateRef.current !== 'idle') {
        socket.emit('call:reject', { callerId: data.callerId });
        return;
      }
      setCallType(data.callType);
      setCallState('incoming');
      setActiveCallUser({
        id: data.callerId,
        name: data.callerName,
        image: data.callerImage,
        offer: data.offer,
        roomId: data.roomId
      });
    };

    const onCallAnswered = async (data) => {
      if (pcRef.current) {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          setCallState('active');
          startCallTimer();
          await processQueuedCandidates();
        } catch (err) {
          console.error('Error setting remote description:', err);
          endCall();
        }
      }
    };

    const onCallIceCandidate = async (data) => {
      if (pcRef.current && pcRef.current.remoteDescription) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      } else {
        queuedRemoteCandidates.current.push(data.candidate);
      }
    };

    const onCallRejected = () => {
      alert(locale === 'hi' ? 'कॉल अस्वीकार कर दी गई।' : 'Call rejected.');
      endCall(false);
    };

    const onCallEnded = () => {
      endCall(false);
    };

    socket.on('call:incoming', onCallIncoming);
    socket.on('call:answered', onCallAnswered);
    socket.on('call:ice-candidate', onCallIceCandidate);
    socket.on('call:rejected', onCallRejected);
    socket.on('call:ended', onCallEnded);

    return () => {
      socket.off('call:incoming', onCallIncoming);
      socket.off('call:answered', onCallAnswered);
      socket.off('call:ice-candidate', onCallIceCandidate);
      socket.off('call:rejected', onCallRejected);
      socket.off('call:ended', onCallEnded);
    };
  }, [socket, locale]);

  const startCallTimer = () => {
    clearInterval(callTimerRef.current);
    setCallTimer(0);
    callTimerRef.current = setInterval(() => {
      setCallTimer(prev => prev + 1);
    }, 1000);
  };

  const initPeerConnection = (otherUserId) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('call:ice-candidate', {
          targetId: otherUserId,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setRemoteStream(remoteStream);
    };

    pcRef.current = pc;
    return pc;
  };

  const startCall = async (targetUser, type) => {
    if (!socket || !user) return;
    setCallState('calling');
    setActiveCallUser(targetUser);

    let stream = null;
    let actualType = type;

    try {
      const constraints = {
        audio: true,
        video: type === 'video'
      };
      stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      console.warn('Failed to get primary video/audio media stream:', err);
      if (type === 'video') {
        try {
          // Fallback 1: try audio only
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          actualType = 'audio';
          setCallType('audio');
          alert(locale === 'hi' ? 'कैमरा व्यस्त है या उपलब्ध नहीं है। ऑडियो कॉल पर स्विच किया जा रहा है।' : 'Camera device is in use or unavailable. Switching to audio call.');
        } catch (audioErr) {
          console.error('Audio fallback failed as well:', audioErr);
        }
      }
    }

    setCallType(actualType);
    setLocalStream(stream);

    try {
      const pc = initPeerConnection(targetUser.id);
      if (stream) {
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
      } else {
        alert(locale === 'hi' ? 'कैमरा और माइक व्यस्त हैं। कॉल बिना ऑडियो/वीडियो के कनेक्ट की जा रही है।' : 'Camera and microphone are in use or permissions denied. Connecting call in receive-only mode.');
      }

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('call:initiate', {
        calleeId: targetUser.id,
        callerId: user._id,
        callerName: user.fullName || 'User',
        callerImage: user.profileImage,
        callType: actualType,
        offer
      });
    } catch (err) {
      console.error('Failed to initiate calling:', err);
      alert(locale === 'hi' ? 'कॉल शुरू करने में विफल।' : 'Failed to initiate call.');
      endCall();
    }
  };

  const acceptCall = async () => {
    if (!socket || !activeCallUser || !activeCallUser.offer) return;
    setCallState('active');
    startCallTimer();

    let stream = null;
    let actualCallType = callType;

    try {
      const constraints = {
        audio: true,
        video: callType === 'video'
      };
      stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      console.warn('Accept call media capture failed:', err);
      if (callType === 'video') {
        try {
          // Fallback 1: try audio only
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          actualCallType = 'audio';
          setCallType('audio');
          alert(locale === 'hi' ? 'कैमरा डिवाइस व्यस्त है। केवल ऑडियो के साथ कॉल स्वीकार की जा रही है।' : 'Camera device is in use. Accepting call with audio only.');
        } catch (audioErr) {
          console.error('Accept call audio fallback failed:', audioErr);
        }
      }
    }

    setLocalStream(stream);

    try {
      const pc = initPeerConnection(activeCallUser.id);
      if (stream) {
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
      } else {
        alert(locale === 'hi' ? 'ऑडियो/वीडियो डिवाइस व्यस्त हैं। कॉल बिना आपके माइक/कैमरा के कनेक्ट की जा रही है।' : 'Audio/video devices are in use. Connecting call in receive-only mode.');
      }

      await pc.setRemoteDescription(new RTCSessionDescription(activeCallUser.offer));
      await processQueuedCandidates();

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('call:answer', {
        callerId: activeCallUser.id,
        answer
      });
    } catch (err) {
      console.error('Error accepting call:', err);
      alert(locale === 'hi' ? 'कॉल स्वीकार करने में विफल।' : 'Failed to accept call.');
      rejectCall();
    }
  };

  const rejectCall = () => {
    if (socket && activeCallUser) {
      socket.emit('call:reject', { callerId: activeCallUser.id });
    }
    endCall(false);
  };

  const endCall = (emitEvent = true) => {
    clearInterval(callTimerRef.current);
    queuedRemoteCandidates.current = [];
    if (emitEvent && socket && activeCallUser) {
      socket.emit('call:end', { targetId: activeCallUser.id });
    }

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    setCallState('idle');
    setActiveCallUser(null);
    setIsMuted(false);
    setIsVideoOff(false);
    setCallTimer(0);
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream && callType === 'video') {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  return (
    <CallContext.Provider value={{ startCall, acceptCall, rejectCall, endCall, toggleMute, toggleVideo, callState, callType, localStream, remoteStream, callTimer, isMuted, isVideoOff, activeCallUser }}>
      {children}

      {/* ════ INCOMING CALL BANNER ════ */}
      <AnimatePresence>
        {callState === 'incoming' && activeCallUser && (
          <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -100, opacity: 0 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[999] w-[90%] max-w-md bg-white border border-teal-100 rounded-3xl p-4 shadow-2xl flex items-center justify-between gap-4 animate-bounce">
            <div className="flex items-center gap-3">
              {activeCallUser.image ? (
                <img src={activeCallUser.image} alt={activeCallUser.name} className="w-12 h-12 rounded-2xl object-cover border border-teal-200 shadow" />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-xl">
                  {activeCallUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h4 className="font-bold text-gray-900 text-sm">{activeCallUser.name}</h4>
                <p className="text-xs text-teal-600 font-semibold flex items-center gap-1.5 animate-pulse">
                  {callType === 'video' ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
                  {callType === 'video' ? (locale === 'hi' ? 'इनकमिंग वीडियो कॉल...' : 'Incoming Video Call...') : (locale === 'hi' ? 'इनकमिंग ऑडियो कॉल...' : 'Incoming Audio Call...')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={rejectCall} className="p-3 bg-red-100 hover:bg-red-200 text-red-600 rounded-2xl transition-all shadow-md active:scale-95">
                <X className="w-5 h-5" />
              </button>
              <button onClick={acceptCall} className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-2xl transition-all shadow-md active:scale-95">
                <Phone className="w-5 h-5 animate-pulse" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════ CALL SCREEN OVERLAY ════ */}
      <AnimatePresence>
        {(callState === 'calling' || callState === 'active') && activeCallUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[998] bg-gray-950 flex flex-col items-center justify-between p-6 md:p-8">
            {/* Call Info Header */}
            <div className="text-center space-y-2 mt-8">
              {activeCallUser.image ? (
                <img src={activeCallUser.image} alt={activeCallUser.name} className="w-24 h-24 rounded-full object-cover border-4 border-white/20 mx-auto shadow-2xl" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-50 to-emerald-100 flex items-center justify-center text-teal-700 font-bold text-4xl mx-auto shadow-2xl border-4 border-white/20">
                  {activeCallUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <h3 className="text-white font-bold text-2xl">{activeCallUser.name}</h3>
              <p className="text-gray-400 text-sm font-semibold flex items-center justify-center gap-1.5">
                {callType === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                {callState === 'calling' 
                  ? (locale === 'hi' ? 'रिंग हो रही है...' : 'Ringing...') 
                  : `${locale === 'hi' ? 'कॉल चालू' : 'Call Active'} • ${fmtDur(callTimer)}`
                }
              </p>
            </div>

            {/* Hidden audio element for audio-only calls */}
            {callType === 'audio' && callState === 'active' && remoteStream && (
              <audio 
                ref={(el) => {
                  if (el && remoteStream && el.srcObject !== remoteStream) {
                    el.srcObject = remoteStream;
                  }
                }} 
                autoPlay 
                playsInline 
              />
            )}

            {/* Video Streams Section */}
            {callType === 'video' && (
              <div className="relative w-full max-w-2xl aspect-video rounded-3xl bg-gray-900 overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center my-4">
                {/* Remote Video (Full Screen inside container) */}
                {callState === 'active' && remoteStream ? (
                  <video 
                    ref={(el) => {
                      if (el && remoteStream && el.srcObject !== remoteStream) {
                        el.srcObject = remoteStream;
                      }
                    }} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="text-center text-gray-500 text-sm space-y-2">
                    <Loader className="animate-spin w-8 h-8 text-teal-500 mx-auto" />
                    <p>{locale === 'hi' ? 'कैमरा कनेक्ट हो रहा है...' : 'Connecting camera...'}</p>
                  </div>
                )}

                {/* Local Video (Floating Picture-in-Picture) */}
                <div className="absolute bottom-4 right-4 w-1/4 min-w-[100px] aspect-video rounded-2xl bg-gray-800 border-2 border-white/20 shadow-xl overflow-hidden z-10">
                  <video 
                    ref={(el) => {
                      if (el && localStream && el.srcObject !== localStream) {
                        el.srcObject = localStream;
                      }
                    }} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover" 
                  />
                  {isVideoOff && (
                    <div className="absolute inset-0 bg-gray-900 flex items-center justify-center text-white text-[10px] font-bold">
                      Camera Off
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Call Controls Footer */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <button onClick={toggleMute}
                className={`p-4 rounded-full transition-all shadow-lg active:scale-95 ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'}`}
                title={isMuted ? 'Unmute Mic' : 'Mute Mic'}>
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>

              <button onClick={() => endCall()} className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all shadow-xl active:scale-95" title="End Call">
                <X className="w-8 h-8" />
              </button>

              {callType === 'video' && (
                <button onClick={toggleVideo}
                  className={`p-4 rounded-full transition-all shadow-lg active:scale-95 ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'}`}
                  title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}>
                  <Film className="w-6 h-6" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </CallContext.Provider>
  );
};
