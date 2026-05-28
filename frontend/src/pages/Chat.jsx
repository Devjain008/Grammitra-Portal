import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useCall } from '../context/CallContext';
import { CONFIG } from '../utils/constants.jsx';
import {
  MessageCircle, Users, Send, Building2, PlusCircle, X, User,
  Loader, MessageSquare, MoreVertical, Pin, Archive, Copy,
  Trash2, Edit3, LogOut, Crown, Search, UserPlus, CheckCircle,
  Paperclip, Mic, MicOff, Play, Pause, Download, Image, Film,
  Music, FileText, Phone, Video, Info, ChevronLeft, Volume2,
  StopCircle, Settings, VolumeX, Ban
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

/* ─────────── Helper: avatar with image or initial letter ─────────── */
const Avatar = ({ src, name, size = 'md', className = '' }) => {
  const sizeMap = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-2xl', xl: 'w-20 h-20 text-3xl' };
  const initials = (name || '?').charAt(0).toUpperCase();
  const colors = ['from-teal-400 to-emerald-500','from-blue-400 to-indigo-500','from-purple-400 to-pink-500','from-amber-400 to-orange-500'];
  const colorIdx = (name || '').charCodeAt(0) % colors.length;

  if (src) {
    return <img src={src} alt={name} className={`${sizeMap[size]} rounded-full object-cover border-2 border-white shadow-sm ${className}`} onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />;
  }
  return (
    <div className={`${sizeMap[size]} rounded-full bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0 ${className}`}>
      {initials}
    </div>
  );
};

/* ─────────── Helper: format duration mm:ss ─────────── */
const fmtDur = (sec) => {
  if (!sec || isNaN(sec) || !isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

/* ─────────── Helper: file type icon ─────────── */
const FileIcon = ({ mime, className = 'w-5 h-5' }) => {
  if (!mime) return <FileText className={className} />;
  if (mime.startsWith('image/')) return <Image className={`${className} text-blue-500`} />;
  if (mime.startsWith('video/')) return <Film className={`${className} text-purple-500`} />;
  if (mime.startsWith('audio/')) return <Music className={`${className} text-green-500`} />;
  if (mime === 'application/pdf') return <FileText className={`${className} text-red-500`} />;
  if (mime.includes('zip')) return <FileText className={`${className} text-amber-500`} />;
  return <FileText className={`${className} text-gray-500`} />;
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

/* ─────────── Inline Audio Player ─────────── */
const AudioPlayer = ({ src, isVoice = false, isMe = false }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); } else { audioRef.current.play(); }
    setPlaying(!playing);
  };

  return (
    <div className={`flex items-center gap-2 min-w-[160px] max-w-[220px] ${isMe ? '' : ''}`}>
      <audio ref={audioRef} src={src}
        onTimeUpdate={() => {
          const audio = audioRef.current;
          if (audio && audio.currentTime < 99999) {
            setCurrent(audio.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          const audio = audioRef.current;
          if (!audio) return;
          if (audio.duration === Infinity) {
            // Chrome WebM duration bug workaround: seek to the end to force browser to parse metadata
            audio.currentTime = 1e9;
            audio.ontimeupdate = () => {
              audio.ontimeupdate = null; // Unbind immediately
              setDuration(audio.duration || 0);
              audio.currentTime = 0; // Reset back to start
            };
          } else {
            setDuration(audio.duration || 0);
          }
        }}
        onEnded={() => { setPlaying(false); setCurrent(0); }}
      />
      <button onClick={toggle}
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isMe ? 'bg-white/20 hover:bg-white/30' : 'bg-teal-100 hover:bg-teal-200'}`}>
        {playing ? <Pause className={`w-4 h-4 ${isMe ? 'text-white' : 'text-teal-700'}`} /> : <Play className={`w-4 h-4 ${isMe ? 'text-white' : 'text-teal-700'}`} />}
      </button>
      <div className="flex-1 space-y-1">
        {isVoice && <Volume2 className={`w-3 h-3 ${isMe ? 'text-white/70' : 'text-gray-400'}`} />}
        <div className={`h-1 rounded-full ${isMe ? 'bg-white/30' : 'bg-gray-200'}`}>
          <div
            className={`h-1 rounded-full transition-all ${isMe ? 'bg-white' : 'bg-teal-500'}`}
            style={{ width: duration ? `${(current / duration) * 100}%` : '0%' }}
          />
        </div>
        <span className={`text-[9px] font-mono ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
          {fmtDur(current)} / {fmtDur(duration)}
        </span>
      </div>
    </div>
  );
};

/* ─────────── Message Bubble Content ─────────── */
const MessageContent = ({ msg, isMe }) => {
  const [imgOpen, setImgOpen] = useState(false);

  if (msg.deletedForEveryone) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-gray-400 italic">
        <X className="w-3.5 h-3.5" /> {isMe ? 'You deleted this message' : 'This message was deleted'}
      </span>
    );
  }

  switch (msg.type) {
    case 'image':
      return (
        <>
          <img src={msg.fileUrl} alt={msg.fileName || 'image'} className="max-w-[200px] rounded-xl cursor-pointer object-cover" onClick={() => setImgOpen(true)} />
          <AnimatePresence>
            {imgOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
                onClick={() => setImgOpen(false)}>
                <img src={msg.fileUrl} alt="full" className="max-w-full max-h-full rounded-2xl shadow-2xl" />
                <button className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-2 rounded-full" onClick={() => setImgOpen(false)}>
                  <X className="w-6 h-6 text-white" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      );

    case 'video':
      return (
        <video src={msg.fileUrl} controls className="max-w-[240px] rounded-xl" style={{ maxHeight: 180 }} />
      );

    case 'audio':
      return <AudioPlayer src={msg.fileUrl} isMe={isMe} />;

    case 'voice':
      return <AudioPlayer src={msg.fileUrl} isVoice isMe={isMe} />;

    case 'file':
      return (
        <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" download={msg.fileName}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isMe ? 'bg-white/15 hover:bg-white/25' : 'bg-gray-100 hover:bg-gray-200'} transition-colors min-w-[160px]`}>
          <FileIcon mime={msg.fileMimeType} className="w-6 h-6 shrink-0" />
          <div className="min-w-0">
            <p className={`text-xs font-semibold truncate max-w-[130px] ${isMe ? 'text-white' : 'text-gray-800'}`}>{msg.fileName || msg.content}</p>
            <p className={`text-[9px] ${isMe ? 'text-white/60' : 'text-gray-400'}`}>Tap to download</p>
          </div>
          <Download className={`w-4 h-4 shrink-0 ${isMe ? 'text-white/70' : 'text-gray-500'}`} />
        </a>
      );

    default:
      return <span className="leading-relaxed whitespace-pre-wrap break-words">{msg.content}</span>;
  }
};

/* ═══════════════ MAIN CHAT COMPONENT ═══════════════ */
const Chat = () => {
  const { t, locale } = useLanguage();
  const { user, token } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const BASE = CONFIG.API_BASE_URL;

  /* ── Core state ── */
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const [activeMessageMenu, setActiveMessageMenu] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileShowList, setMobileShowList] = useState(!new URLSearchParams(location.search).get('roomId'));

  /* ── Group create ── */
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [groupError, setGroupError] = useState('');
  const [groupLoading, setGroupLoading] = useState(false);

  /* ── WhatsApp-style ── */
  const [sidebarTab, setSidebarTab] = useState('chats');
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);
  const [sidebarMenuOpen, setSidebarMenuOpen] = useState(null);
  const [chatHeaderMenuOpen, setChatHeaderMenuOpen] = useState(false);
  const [groupMobileInput, setGroupMobileInput] = useState('');
  const [groupRenameInput, setGroupRenameInput] = useState('');
  const [editingGroupName, setEditingGroupName] = useState(false);
  const [addMemberError, setAddMemberError] = useState('');
  const [addMemberSuccess, setAddMemberSuccess] = useState('');

  /* ── Find user by mobile ── */
  const [findUserModalOpen, setFindUserModalOpen] = useState(false);
  const [findMobileInput, setFindMobileInput] = useState('');
  const [findUserResult, setFindUserResult] = useState(null);
  const [findUserError, setFindUserError] = useState('');
  const [findUserLoading, setFindUserLoading] = useState(false);
  const [findUserChatLoading, setFindUserChatLoading] = useState(false);

  /* ── File / attachment ── */
  const fileInputRef = useRef(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [filePreview, setFilePreview] = useState(null); // { file, url, type }

  /* ── Voice recording ── */
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  /* ── WebRTC Call Context ── */
  const { startCall } = useCall();

  /* ── Message Context Menu Anchor & Forward States ── */
  const [messageMenuAnchor, setMessageMenuAnchor] = useState(null); // { top, left, msgId, isMe, msgContent, msgType }
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [forwardContent, setForwardContent] = useState('');
  const [forwardType, setForwardType] = useState('text');
  const [forwardSearch, setForwardSearch] = useState('');

  /* ── Refs ── */
  const chatEndRef = useRef(null);
  const sidebarMenuRef = useRef(null);
  const headerMenuRef = useRef(null);

  /* ═══ API Helpers ═══ */
  const authHeader = { Authorization: `Bearer ${token}` };

  /* ─── Fetch rooms ─── */
  const fetchRooms = useCallback(async (selectRoomId = null) => {
    try {
      setLoadingRooms(true);
      const res = await axios.get(`${BASE}/api/chat/rooms`, { headers: authHeader });
      setRooms(res.data);
      const params = new URLSearchParams(location.search);
      const queryRoomId = selectRoomId || params.get('roomId');
      if (queryRoomId) {
        const found = res.data.find(r => r._id === queryRoomId);
        if (found) setActiveRoom(found);
        else if (res.data.length > 0) setActiveRoom(res.data[0]);
      } else if (res.data.length > 0 && !activeRoom) {
        setActiveRoom(res.data[0]);
      }
    } catch (err) { console.error(err); }
    finally { setLoadingRooms(false); }
  }, [token]);

  useEffect(() => { if (token) fetchRooms(); }, [token]);

  /* ─── Fetch messages on room change ─── */
  useEffect(() => {
    if (!activeRoom || !token) return;
    (async () => {
      try {
        setLoadingMessages(true);
        const res = await axios.get(`${BASE}/api/chat/${activeRoom._id}`, { headers: authHeader });
        setMessages(res.data);
      } catch (err) { console.error(err); }
      finally { setLoadingMessages(false); }
    })();
    if (socket) socket.emit('join_room', activeRoom._id);
  }, [activeRoom?._id, socket, token]);

  /* ─── Socket listeners ─── */
  useEffect(() => {
    if (!socket) return;
    const onMsg = (msg) => {
      if (activeRoom && msg.roomId === activeRoom._id) {
        setMessages(prev => {
          if (msg.senderId?.toString() === user?._id?.toString()) {
            const ti = prev.findIndex(m => m._tempId && m.content === msg.content);
            if (ti !== -1) { const u = [...prev]; u[ti] = { ...msg, isMe: true }; return u; }
          }
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
      setRooms(pr => pr.map(r => r._id === msg.roomId ? { ...r, lastMessage: msg.content || '📎 File', lastMessageAt: msg.createdAt } : r));
    };
    const onTyping = (name) => { setTypingUser(name); setTimeout(() => setTypingUser(''), 2000); };
    const onDeleted = (data) => {
      if (activeRoom && data.roomId === activeRoom._id) {
        setMessages(prev => prev.map(m => m._id === data.messageId ? { ...m, deletedForEveryone: true } : m));
      }
    };
    const onSettingsUpdated = (updatedRoom) => {
      if (activeRoom?._id === updatedRoom._id) {
        setActiveRoom(updatedRoom);
      }
      setRooms(prev => prev.map(r => r._id === updatedRoom._id ? {
        ...r,
        onlyAdminsCanAddMembers: updatedRoom.onlyAdminsCanAddMembers,
        onlyAdminsCanSendMessages: updatedRoom.onlyAdminsCanSendMessages,
        participants: updatedRoom.participants
      } : r));
    };

    socket.on('receive_message', onMsg);
    socket.on('user_typing', onTyping);
    socket.on('message_deleted', onDeleted);
    socket.on('room_settings_updated', onSettingsUpdated);

    return () => {
      socket.off('receive_message', onMsg);
      socket.off('user_typing', onTyping);
      socket.off('message_deleted', onDeleted);
      socket.off('room_settings_updated', onSettingsUpdated);
    };
  }, [socket, activeRoom?._id]);

  /* ─── Auto-scroll ─── */
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  /* ─── Synchronize Mobile View on Room Selection ─── */
  useEffect(() => {
    if (activeRoom?._id) {
      setMobileShowList(false);
    }
  }, [activeRoom?._id]);

  /* ─── Close menus on outside click ─── */
  useEffect(() => {
    const fn = (e) => {
      if (!e.target.closest('[data-sidebar-menu]')) setSidebarMenuOpen(null);
      if (!e.target.closest('[data-header-menu]')) setChatHeaderMenuOpen(false);
      if (!e.target.closest('[data-msg-menu]')) {
        setActiveMessageMenu(null);
        setMessageMenuAnchor(null);
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);



  /* ═══ Helpers ═══ */
  const getRoomName = (room) => {
    if (room.roomType === 'group') return room.roomName;
    const other = room.participants?.find(p => (p._id || p) !== user?._id && (p._id || p)?.toString() !== user?._id?.toString());
    return other?.fullName || 'Direct Chat';
  };
  const getRoomOtherUser = (room) => room.roomType === 'direct' ? room.participants?.find(p => (p._id || p)?.toString() !== user?._id?.toString()) : null;
  const getRoomSubtitle = (room) => {
    if (room.roomType === 'group') return `${room.participants?.length || 0} ${locale === 'hi' ? 'सदस्य' : 'members'}`;
    const other = getRoomOtherUser(room);
    if (!other) return '';
    return [other.role?.toUpperCase(), other.village].filter(Boolean).join(' • ');
  };
  const getRoomIcon = (room) => room.roomType === 'group' ? (room.roomName?.includes('Village Group') ? Building2 : Users) : User;
  const getRoomColor = (room) => room.roomType === 'group' ? (room.roomName?.includes('Village') ? 'from-teal-400 to-cyan-500' : 'from-blue-400 to-indigo-500') : 'from-emerald-400 to-teal-500';
  const isPinned = (room) => room.pinnedBy?.some(id => id?.toString() === user?._id?.toString());
  const isArchived = (room) => room.archivedBy?.some(id => id?.toString() === user?._id?.toString());
  const isAdmin = (room) => room.adminIds?.some(id => id?.toString() === user?._id?.toString()) || room.admins?.some(id => id?.toString() === user?._id?.toString());
  const isMuted = (room) => room.mutedBy?.some(id => id?.toString() === user?._id?.toString());
  const isBlocked = (room) => room.blockedBy?.some(id => id?.toString() === user?._id?.toString());

  /* ═══ Send text message ═══ */
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRoom) return;
    const content = newMessage;
    setNewMessage('');
    const tempId = `temp_${Date.now()}`;
    setMessages(prev => [...prev, { _id: tempId, _tempId: tempId, roomId: activeRoom._id, senderId: user._id, senderName: user.fullName, content, type: 'text', createdAt: new Date().toISOString(), isMe: true }]);
    if (socket) socket.emit('send_message', { roomId: activeRoom._id, senderId: user._id, senderName: user.fullName || 'You', content });
    setRooms(pr => pr.map(r => r._id === activeRoom._id ? { ...r, lastMessage: content, lastMessageAt: new Date().toISOString() } : r));
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (socket && activeRoom) socket.emit('typing', { roomId: activeRoom._id, senderName: user.fullName || 'Someone' });
  };

  /* ═══ File Upload ═══ */
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    let type = 'file';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';
    else if (file.type.startsWith('audio/')) type = 'audio';
    setFilePreview({ file, url, type });
    e.target.value = '';
  };

  const handleSendFile = async () => {
    if (!filePreview || !activeRoom) return;
    setUploadingFile(true);
    try {
      const fd = new FormData();
      fd.append('file', filePreview.file);
      fd.append('roomId', activeRoom._id);
      fd.append('senderName', user.fullName || 'You');
      // ⚠️ Do NOT set Content-Type manually — browser must set it with boundary for multer
      await axios.post(`${BASE}/api/chat/upload`, fd, { headers: { Authorization: `Bearer ${token}` } });
      setFilePreview(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploadingFile(false);
    }
  };

  /* ═══ Voice Recording ═══ */
  const startRecording = async () => {
    if (!activeRoom) { alert('Please select a chat first.'); return; }
    if (isRecording) return; // prevent double-tap

    // 🔑 Capture roomId NOW before any async operation (prevents stale closure bug)
    const roomId = activeRoom._id;
    const senderName = user?.fullName || 'You';

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Pick best supported MIME type (browser may append codec info like ;codecs=opus)
      const preferredMimes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg',
        'audio/mp4',
      ];
      const supportedMime = preferredMimes.find(m => MediaRecorder.isTypeSupported(m)) || '';

      const mr = new MediaRecorder(stream, supportedMime ? { mimeType: supportedMime } : {});
      audioChunksRef.current = [];

      // timeslice=250ms ensures we get data even for short recordings
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        // Stop all mic tracks
        stream.getTracks().forEach(t => t.stop());

        // If chunks were cleared, it was a cancel — don't upload
        if (audioChunksRef.current.length === 0) return;

        const recordedMime = (mr.mimeType || supportedMime || 'audio/webm').split(';')[0];
        const blob = new Blob(audioChunksRef.current, { type: recordedMime });

        if (blob.size < 500) return; // too short / silent

        setVoiceLoading(true);
        try {
          // Determine file extension from mime
          let ext = 'webm';
          if (recordedMime.includes('ogg')) ext = 'ogg';
          else if (recordedMime.includes('mp4')) ext = 'mp4';

          const fd = new FormData();
          fd.append('file', blob, `voice-${Date.now()}.${ext}`);
          fd.append('roomId', roomId);
          fd.append('senderName', senderName);
          fd.append('type', 'voice');

          // ⚠️ Do NOT set Content-Type — browser sets multipart/form-data with correct boundary
          await axios.post(`${BASE}/api/chat/upload`, fd, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (err) {
          console.error('Voice upload error:', err);
          alert('Failed to send voice message. Please try again.');
        } finally {
          setVoiceLoading(false);
        }
      };

      mr.start(250); // collect chunks every 250ms
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000);

    } catch (err) {
      console.error('Mic error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert('Microphone blocked. Please allow mic access in your browser settings and try again.');
      } else {
        alert('Could not start recording: ' + err.message);
      }
    }
  };

  const stopRecording = () => {
    // Use ref directly — don't depend on isRecording state (may be stale in async context)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      clearInterval(recordingTimerRef.current);
      setIsRecording(false);
      setRecordingSeconds(0);
    }
  };

  const cancelRecording = () => {
    // Clear chunks FIRST so onstop handler knows to discard
    audioChunksRef.current = [];
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingSeconds(0);
    mediaRecorderRef.current = null;
  };

  /* ═══ Delete message ═══ */
  const handleDeleteMessage = async (messageId, deleteType) => {
    setActiveMessageMenu(null);
    try {
      if (!messageId || messageId.startsWith?.('temp_') || !/^[0-9a-fA-F]{24}$/.test(messageId)) {
        setMessages(prev => prev.filter(m => m._id !== messageId));
        return;
      }
      await axios.post(`${BASE}/api/chat/message/${messageId}/delete`, { deleteType }, { headers: authHeader });
      if (deleteType === 'me') {
        setMessages(prev => prev.filter(m => m._id !== messageId));
      } else {
        setMessages(prev => prev.map(m => m._id === messageId ? { ...m, deletedForEveryone: true } : m));
      }
    } catch (err) { alert('Failed to delete message.'); }
  };

  const handleCopyMessage = (text) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setActiveMessageMenu(null);
    setMessageMenuAnchor(null);
  };

  const handleForwardToRoom = async (roomId) => {
    if (!forwardContent) return;
    try {
      if (socket) {
        socket.emit('send_message', {
          roomId,
          senderId: user._id,
          senderName: user.fullName || 'You',
          content: forwardContent
        });
      }

      if (activeRoom?._id === roomId) {
        const tempId = `temp_${Date.now()}`;
        setMessages(prev => [...prev, {
          _id: tempId,
          _tempId: tempId,
          roomId,
          senderId: user._id,
          senderName: user.fullName || 'You',
          content: forwardContent,
          type: 'text',
          createdAt: new Date().toISOString(),
          isMe: true
        }]);
      }

      setRooms(pr => pr.map(r => r._id === roomId ? { ...r, lastMessage: forwardContent, lastMessageAt: new Date().toISOString() } : r));
      setForwardModalOpen(false);
      setForwardContent('');
      alert(locale === 'hi' ? 'संदेश फॉरवर्ड किया गया!' : 'Message forwarded!');
    } catch (err) {
      console.error(err);
      alert('Failed to forward message.');
    }
  };

  /* ═══ Room actions ═══ */
  const roomAction = async (url, method = 'POST', body = {}) => {
    const res = await axios({ method, url: `${BASE}${url}`, data: body, headers: authHeader });
    return res.data;
  };

  const handlePinRoom = async (roomId) => {
    const updated = await roomAction(`/api/chat/room/${roomId}/pin`);
    setRooms(prev => prev.map(r => r._id === roomId ? updated : r));
    if (activeRoom?._id === roomId) setActiveRoom(updated);
    setSidebarMenuOpen(null); setChatHeaderMenuOpen(false);
  };
  const handleArchiveRoom = async (roomId) => {
    const updated = await roomAction(`/api/chat/room/${roomId}/archive`);
    setRooms(prev => prev.map(r => r._id === roomId ? updated : r));
    if (activeRoom?._id === roomId) setActiveRoom(updated);
    setSidebarMenuOpen(null); setChatHeaderMenuOpen(false);
  };
  const handleClearChat = async (roomId) => {
    if (!window.confirm(locale === 'hi' ? 'सभी संदेश हटाएँ?' : 'Clear all messages?')) return;
    await roomAction(`/api/chat/room/${roomId}/clear`);
    if (activeRoom?._id === roomId) setMessages([]);
    setRooms(prev => prev.map(r => r._id === roomId ? { ...r, lastMessage: '' } : r));
    setSidebarMenuOpen(null); setChatHeaderMenuOpen(false);
  };
  const handleMuteRoom = async (roomId) => {
    try {
      const res = await axios.post(`${BASE}/api/chat/room/${roomId}/mute`, {}, { headers: authHeader });
      setRooms(prev => prev.map(r => r._id === roomId ? res.data : r));
      if (activeRoom?._id === roomId) setActiveRoom(res.data);
      setSidebarMenuOpen(null); setChatHeaderMenuOpen(false);
    } catch (err) {
      alert('Failed to update mute setting.');
    }
  };
  const handleBlockRoom = async (roomId) => {
    try {
      const res = await axios.post(`${BASE}/api/chat/room/${roomId}/block`, {}, { headers: authHeader });
      setRooms(prev => prev.map(r => r._id === roomId ? res.data : r));
      if (activeRoom?._id === roomId) setActiveRoom(res.data);
      setSidebarMenuOpen(null); setChatHeaderMenuOpen(false);
    } catch (err) {
      alert('Failed to update block setting.');
    }
  };
  const handleDeleteChat = async (roomId) => {
    if (!window.confirm(locale === 'hi' ? 'यह चैट पूरी तरह से डिलीट करें?' : 'Delete this chat completely?')) return;
    try {
      await axios.post(`${BASE}/api/chat/room/${roomId}/delete-chat`, {}, { headers: authHeader });
      setRooms(prev => prev.filter(r => r._id !== roomId));
      if (activeRoom?._id === roomId) {
        setActiveRoom(null);
        setMessages([]);
      }
      setSidebarMenuOpen(null); setChatHeaderMenuOpen(false);
    } catch (err) {
      alert('Failed to delete chat.');
    }
  };
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setGroupLoading(true); setGroupError('');
    try {
      const res = await axios.post(`${BASE}/api/chat/group`, { roomName: newGroupName }, { headers: authHeader });
      setRooms(prev => [res.data, ...prev]);
      setActiveRoom(res.data);
      setIsGroupModalOpen(false); setNewGroupName('');
    } catch (err) { setGroupError(err.response?.data?.message || 'Failed'); }
    finally { setGroupLoading(false); }
  };

  const handleUpdateGroupSettings = async (roomId, fields) => {
    try {
      const res = await axios.put(`${BASE}/api/chat/group/${roomId}/settings`, fields, { headers: authHeader });
      setRooms(prev => prev.map(r => r._id === roomId ? res.data : r));
      setActiveRoom(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update settings.');
    }
  };
  const handleRenameGroup = async (e, roomId) => {
    e.preventDefault();
    if (!groupRenameInput.trim()) return;
    try {
      const res = await axios.put(`${BASE}/api/chat/group/${roomId}/name`, { roomName: groupRenameInput }, { headers: authHeader });
      setRooms(prev => prev.map(r => r._id === roomId ? res.data : r));
      setActiveRoom(res.data); setEditingGroupName(false); setGroupRenameInput('');
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };
  const handleAddMemberByMobile = async (e, roomId) => {
    e.preventDefault();
    setAddMemberError(''); setAddMemberSuccess('');
    try {
      const res = await axios.post(`${BASE}/api/chat/group/${roomId}/add-member-mobile`, { mobile: groupMobileInput }, { headers: authHeader });
      setRooms(prev => prev.map(r => r._id === roomId ? res.data : r));
      setActiveRoom(res.data);
      setAddMemberSuccess(locale === 'hi' ? 'सदस्य जोड़ा गया!' : 'Member added!');
      setGroupMobileInput('');
    } catch (err) { setAddMemberError(err.response?.data?.message || 'Failed'); }
  };
  const handleMakeAdmin = async (roomId, uid) => {
    try {
      const res = await axios.post(`${BASE}/api/chat/group/${roomId}/make-admin`, { targetUserId: uid }, { headers: authHeader });
      setRooms(prev => prev.map(r => r._id === roomId ? res.data : r));
      setActiveRoom(res.data);
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };
  const handleRemoveMember = async (roomId, uid) => {
    if (!window.confirm(locale === 'hi' ? 'सदस्य निकालें?' : 'Remove this member?')) return;
    await axios.delete(`${BASE}/api/chat/group/${roomId}/members/${uid}`, { headers: authHeader });
    const updated = { ...activeRoom, participants: activeRoom.participants.filter(p => (p._id || p)?.toString() !== uid) };
    setRooms(prev => prev.map(r => r._id === roomId ? updated : r));
    setActiveRoom(updated);
  };
  const handleExitGroup = async (roomId) => {
    if (!window.confirm(locale === 'hi' ? 'ग्रुप छोड़ें?' : 'Leave this group?')) return;
    await axios.post(`${BASE}/api/chat/group/${roomId}/exit`, {}, { headers: authHeader });
    setRooms(prev => prev.filter(r => r._id !== roomId));
    setActiveRoom(null); setIsDetailsPanelOpen(false);
  };

  /* ═══ Find User by Mobile ═══ */
  const handleFindUser = async (e) => {
    e.preventDefault();
    if (!findMobileInput.trim()) return;
    setFindUserLoading(true); setFindUserResult(null); setFindUserError('');
    try {
      const res = await axios.get(`${BASE}/api/chat/search-user?mobile=${findMobileInput.trim()}`, { headers: authHeader });
      setFindUserResult(res.data);
    } catch (err) {
      setFindUserError(err.response?.data?.message || 'User not found');
    } finally { setFindUserLoading(false); }
  };

  const handleStartChatWithFoundUser = async () => {
    if (!findUserResult) return;
    if (findUserResult._id === user._id) { alert(locale === 'hi' ? 'आप खुद से चैट नहीं कर सकते।' : "You can't chat with yourself."); return; }
    
    // Prevent direct chat initiation with the System Admin
    if (findUserResult.role === 'admin' && user.role !== 'admin') {
      alert(locale === 'hi'
        ? 'सिस्टम एडमिन के साथ डायरेक्ट चैट करने की अनुमति नहीं है।'
        : 'Direct chat with the System Admin is not allowed.');
      return;
    }

    setFindUserChatLoading(true);
    try {
      const res = await axios.post(`${BASE}/api/chat/room`, { userId2: findUserResult._id }, { headers: authHeader });
      setFindUserModalOpen(false); setFindMobileInput(''); setFindUserResult(null);
      await fetchRooms(res.data._id);
      navigate(`/chat?roomId=${res.data._id}`);
    } catch (err) { alert('Failed to start chat.'); }
    finally { setFindUserChatLoading(false); }
  };

  /* ─── Computed filtered rooms ─── */
  const filteredRooms = rooms.filter(room => {
    const matchSearch = getRoomName(room).toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;
    if (sidebarTab === 'archived') return isArchived(room);
    if (sidebarTab === 'pinned') return isPinned(room) && !isArchived(room);
    return !isArchived(room);
  });
  const archivedCount = rooms.filter(r => isArchived(r)).length;
  const pinnedCount = rooms.filter(r => isPinned(r) && !isArchived(r)).length;

  /* ════════════════════ RENDER ════════════════════ */
  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-5">
      <style>{`
        .chat-bg { background: #efeae2 url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23b8b0a0' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") ;}
        .voice-pulse { animation: vPulse 1s ease-in-out infinite; }
        @keyframes vPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(220,38,38,.4); } 50% { box-shadow: 0 0 0 10px rgba(220,38,38,0); } }
        .msg-slide-in { animation: msgIn .18s ease-out; }
        @keyframes msgIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
      `}</style>

      {/* ── Header ── */}
      <div className="flex items-center justify-between bg-gradient-to-r from-teal-600 to-emerald-500 px-8 py-6 rounded-3xl text-white shadow-xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <MessageCircle className="w-7 h-7 text-teal-100" />
            {locale === 'hi' ? 'लाइव कम्युनिटी चैट' : 'Live Community Chat'}
          </h1>
          <p className="text-teal-100 text-sm opacity-90 mt-0.5">{locale === 'hi' ? 'गाँव, खेत और बाज़ार के साथी से जुड़ें' : 'Connect with your village, farm & marketplace'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setFindUserModalOpen(true)}
            className="flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/30 text-white text-sm font-bold px-4 py-2.5 rounded-2xl transition-all">
            <Search className="w-4 h-4" />
            {locale === 'hi' ? 'यूज़र खोजें' : 'Find User'}
          </button>
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div className="flex gap-4 h-[72vh] min-h-[500px]">

        {/* ════ LEFT SIDEBAR ════ */}
        <div className={`w-full md:w-80 md:flex-shrink-0 bg-white rounded-3xl shadow-lg flex flex-col overflow-hidden border border-gray-150 transition-all duration-300 ${mobileShowList ? 'flex' : 'hidden md:flex'}`}>

          {/* Sidebar header */}
          <div className="p-3 border-b border-gray-100 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-700 text-sm flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-teal-600" />
                {locale === 'hi' ? 'चैट' : 'Chats'}
              </span>
              <div className="flex gap-1.5">
                <button onClick={() => setFindUserModalOpen(true)}
                  className="flex items-center gap-1 bg-teal-50 hover:bg-teal-100 text-teal-700 text-[11px] font-bold px-2 py-1.5 rounded-xl border border-teal-200 transition-all"
                  title={locale === 'hi' ? 'नया संपर्क' : 'New Direct Chat'}>
                  <UserPlus className="w-3.5 h-3.5" />
                  {locale === 'hi' ? 'चैट' : 'Chat'}
                </button>
                <button onClick={() => setIsGroupModalOpen(true)}
                  className="flex items-center gap-1 bg-teal-50 hover:bg-teal-100 text-teal-700 text-[11px] font-bold px-2 py-1.5 rounded-xl border border-teal-200 transition-all">
                  <PlusCircle className="w-3.5 h-3.5" />
                  {locale === 'hi' ? 'ग्रुप' : 'Group'}
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'chats', label: locale === 'hi' ? 'चैट' : 'Chats' },
                { id: 'pinned', label: `📌 ${pinnedCount}` },
                { id: 'archived', label: `📂 ${archivedCount}` },
              ].map(tab => (
                <button key={tab.id} onClick={() => setSidebarTab(tab.id)}
                  className={`py-1.5 rounded-xl text-[10px] font-bold transition-all ${sidebarTab === tab.id ? 'bg-teal-600 text-white shadow' : 'text-gray-500 hover:bg-gray-100'}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input type="text" placeholder={locale === 'hi' ? 'खोजें...' : 'Search...'} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
          </div>

          {/* Room list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {loadingRooms ? (
              <div className="flex justify-center py-16"><Loader className="animate-spin w-7 h-7 text-teal-500" /></div>
            ) : filteredRooms.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs">{locale === 'hi' ? 'कोई चैट नहीं मिली' : 'No chats found'}</div>
            ) : filteredRooms.map(room => {
              const isActive = activeRoom?._id === room._id;
              const otherUser = getRoomOtherUser(room);
              const pinned = isPinned(room);

              return (
                <div key={room._id} className="relative group" data-sidebar-menu>
                  <button onClick={() => { setActiveRoom(room); setIsDetailsPanelOpen(false); navigate(`/chat?roomId=${room._id}`); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all text-left ${isActive ? 'bg-teal-50 border border-teal-200 shadow-sm' : 'hover:bg-gray-50 border border-transparent'}`}>

                    <div className="relative shrink-0">
                      {otherUser?.profileImage ? (
                        <img src={otherUser.profileImage} alt={otherUser.fullName} className="w-11 h-11 rounded-full object-cover border-2 border-white shadow" />
                      ) : (
                        <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${getRoomColor(room)} flex items-center justify-center text-white font-bold text-base shadow`}>
                          {getRoomName(room).charAt(0).toUpperCase()}
                        </div>
                      )}
                      {pinned && <span className="absolute -top-0.5 -right-0.5 text-[9px] bg-amber-400 rounded-full w-4 h-4 flex items-center justify-center">📌</span>}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-bold text-gray-800 truncate">{getRoomName(room)}</span>
                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          {isMuted(room) && <VolumeX className="w-3 h-3 text-gray-400" />}
                          {isBlocked(room) && <Ban className="w-3 h-3 text-red-500" />}
                          {room.lastMessageAt && <span className="text-[9px] text-gray-400">{new Date(room.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">{room.lastMessage || getRoomSubtitle(room)}</p>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ════ CHAT WINDOW + DETAILS ════ */}
        <div className={`flex-1 flex overflow-hidden rounded-3xl border border-gray-200 shadow-lg bg-white transition-all duration-300 ${!mobileShowList ? 'flex' : 'hidden md:flex'}`}>

          {/* Chat window */}
          <div className={`flex flex-col overflow-hidden transition-all duration-300 ${isDetailsPanelOpen ? 'w-full md:w-3/5' : 'w-full'} border-r border-gray-100`}>

            {activeRoom ? (
              <>
                {/* Chat header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white/90 backdrop-blur-sm relative z-20">
                  <div className="flex items-center gap-3 min-w-0">
                    <button 
                      onClick={() => setMobileShowList(true)}
                      className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 mr-1 shrink-0"
                      title={locale === 'hi' ? 'पीछे' : 'Back'}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    {(() => {
                      const otherUser = getRoomOtherUser(activeRoom);
                      return otherUser?.profileImage ? (
                        <img src={otherUser.profileImage} alt={otherUser.fullName} className="w-10 h-10 rounded-full object-cover border-2 border-teal-100 shrink-0" />
                      ) : (
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getRoomColor(activeRoom)} flex items-center justify-center text-white font-bold shrink-0`}>
                          {getRoomName(activeRoom).charAt(0).toUpperCase()}
                        </div>
                      );
                    })()}
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-800 text-sm truncate">{getRoomName(activeRoom)}</h3>
                      <p className="text-[11px] text-teal-600 font-semibold">
                        {typingUser ? `${typingUser} ${locale === 'hi' ? 'टाइप कर रहा है...' : 'typing...'}` : getRoomSubtitle(activeRoom)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {activeRoom.roomType === 'direct' && (
                      <>
                        <button onClick={() => {
                          const other = getRoomOtherUser(activeRoom);
                          if (other) {
                            startCall({
                              id: other._id,
                              name: other.fullName || other.name || 'User',
                              image: other.profileImage
                            }, 'audio');
                          }
                        }} className="p-2 rounded-xl hover:bg-gray-100 text-teal-600 hover:text-teal-700 transition-colors active:scale-95" title="Audio Call">
                          <Phone className="w-4.5 h-4.5" />
                        </button>
                        <button onClick={() => {
                          const other = getRoomOtherUser(activeRoom);
                          if (other) {
                            startCall({
                              id: other._id,
                              name: other.fullName || other.name || 'User',
                              image: other.profileImage
                            }, 'video');
                          }
                        }} className="p-2 rounded-xl hover:bg-gray-100 text-teal-600 hover:text-teal-700 transition-colors active:scale-95" title="Video Call">
                          <Video className="w-4.5 h-4.5" />
                        </button>
                      </>
                    )}
                    {activeRoom.roomType === 'group' && (!activeRoom.onlyAdminsCanAddMembers || isAdmin(activeRoom)) && (
                      <button onClick={() => { setIsDetailsPanelOpen(true); setTimeout(() => { const el = document.getElementById('groupMobileInput'); if (el) el.focus(); }, 100); }}
                        className="flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-teal-200 transition-colors active:scale-95"
                        title={locale === 'hi' ? 'सदस्य जोड़ें' : 'Add Member'}>
                        <UserPlus className="w-4 h-4" />
                        <span className="hidden sm:inline">{locale === 'hi' ? 'जोड़ें' : 'Add Member'}</span>
                      </button>
                    )}
                    <button onClick={() => setIsDetailsPanelOpen(v => !v)}
                      className={`p-2 rounded-xl transition-colors ${isDetailsPanelOpen ? 'bg-teal-100 text-teal-700' : 'hover:bg-gray-100 text-gray-500'}`} title="Details">
                      <Info className="w-4.5 h-4.5" />
                    </button>
                    <div className="relative" data-header-menu>
                      <button onClick={() => setChatHeaderMenuOpen(v => !v)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
                        <MoreVertical className="w-4.5 h-4.5" />
                      </button>
                      <AnimatePresence>
                        {chatHeaderMenuOpen && (
                          <motion.div initial={{ opacity: 0, scale: 0.92, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: -4 }} transition={{ duration: 0.1 }}
                            className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden py-1">
                            {[
                              { icon: <Pin className="w-3.5 h-3.5 text-amber-500" />, label: isPinned(activeRoom) ? (locale === 'hi' ? 'पिन हटाएँ' : 'Unpin') : (locale === 'hi' ? 'पिन करें' : 'Pin Chat'), action: () => handlePinRoom(activeRoom._id) },
                              { icon: <Archive className="w-3.5 h-3.5 text-blue-500" />, label: isArchived(activeRoom) ? (locale === 'hi' ? 'अनआर्काइव' : 'Unarchive') : (locale === 'hi' ? 'आर्काइव' : 'Archive'), action: () => handleArchiveRoom(activeRoom._id) },
                              { icon: <VolumeX className="w-3.5 h-3.5 text-gray-500" />, label: isMuted(activeRoom) ? (locale === 'hi' ? 'अनम्यूट' : 'Unmute') : (locale === 'hi' ? 'म्यूट' : 'Mute'), action: () => handleMuteRoom(activeRoom._id) },
                              ...(activeRoom.roomType === 'direct' ? [{ icon: <Ban className="w-3.5 h-3.5 text-red-500" />, label: isBlocked(activeRoom) ? (locale === 'hi' ? 'अनब्लॉक' : 'Unblock') : (locale === 'hi' ? 'ब्लॉक' : 'Block'), action: () => handleBlockRoom(activeRoom._id) }] : []),
                              { icon: <Trash2 className="w-3.5 h-3.5 text-gray-400" />, label: locale === 'hi' ? 'चैट मिटाएँ' : 'Clear Chat', action: () => handleClearChat(activeRoom._id) },
                              { icon: <Trash2 className="w-3.5 h-3.5 text-red-500" />, label: locale === 'hi' ? 'चैट डिलीट करें' : 'Delete Chat', action: () => handleDeleteChat(activeRoom._id), danger: true },
                              ...(activeRoom.roomType === 'group' ? [{ icon: <LogOut className="w-3.5 h-3.5 text-red-600" />, label: locale === 'hi' ? 'ग्रुप छोड़ें' : 'Exit Group', action: () => handleExitGroup(activeRoom._id), danger: true }] : []),
                            ].map((item, i) => (
                              <button key={i} onClick={item.action}
                                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium transition-colors ${item.danger ? 'text-red-500 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'} ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                                {item.icon} {item.label}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 chat-bg">
                  {loadingMessages ? (
                    <div className="flex justify-center py-16"><Loader className="animate-spin w-8 h-8 text-teal-500" /></div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                      <MessageSquare className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-400 text-sm">{locale === 'hi' ? 'पहला संदेश भेजें!' : 'Send the first message!'}</p>
                    </div>
                  ) : messages.map(msg => {
                    const isMe = msg.senderId?.toString() === user?._id?.toString() || msg.isMe;
                    return (
                      <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group msg-slide-in`}>
                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[72%]`}>
                          {!isMe && activeRoom.roomType === 'group' && (
                            <span className="text-[10px] text-teal-700 font-bold ml-2 mb-0.5">{msg.senderName}</span>
                          )}
                          <div className="flex items-end gap-1.5">
                            {!isMe && (
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mb-0.5">
                                {(msg.senderName || '?').charAt(0).toUpperCase()}
                              </div>
                            )}

                            <div className={`relative rounded-2xl px-3.5 py-2.5 shadow-sm text-sm ${isMe ? 'bg-teal-600 text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'}`}>
                              <MessageContent msg={msg} isMe={isMe} />
                              <span className={`block text-[9px] mt-1 text-right ${isMe ? 'text-teal-200' : 'text-gray-400'}`}>
                                {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            {/* Message menu */}
                            {!msg.deletedForEveryone && (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity self-center" data-msg-menu>
                                <button onClick={(e) => {
                                  e.stopPropagation();
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setMessageMenuAnchor(messageMenuAnchor?.msgId === msg._id ? null : {
                                    top: rect.bottom + 4,
                                    left: isMe ? rect.right - 192 : rect.left,
                                    msgId: msg._id,
                                    isMe,
                                    msgContent: msg.content,
                                    msgType: msg.type
                                  });
                                }}
                                  className="p-1 rounded-full hover:bg-gray-200/70 text-gray-400">
                                  <MoreVertical className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                {/* File preview bar */}
                <AnimatePresence>
                  {filePreview && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="px-4 py-2 border-t border-gray-100 bg-teal-50 flex items-center gap-3">
                      {filePreview.type === 'image' && <img src={filePreview.url} className="w-12 h-12 rounded-xl object-cover border border-teal-200" alt="preview" />}
                      {filePreview.type === 'video' && <video src={filePreview.url} className="w-12 h-12 rounded-xl object-cover border border-teal-200" />}
                      {filePreview.type === 'audio' && <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center"><Music className="w-6 h-6 text-teal-600" /></div>}
                      {filePreview.type === 'file' && <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center"><FileText className="w-6 h-6 text-teal-600" /></div>}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-teal-800 truncate">{filePreview.file.name}</p>
                        <p className="text-[10px] text-teal-600">{(filePreview.file.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button onClick={handleSendFile} disabled={uploadingFile}
                        className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 disabled:opacity-60 transition-colors">
                        {uploadingFile ? <Loader className="animate-spin w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                        {locale === 'hi' ? 'भेजें' : 'Send'}
                      </button>
                      <button onClick={() => setFilePreview(null)} className="p-1.5 rounded-full hover:bg-teal-100 text-teal-600">
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Input area */}
                <div className="px-4 py-3 border-t border-gray-100 bg-white">
                  {activeRoom.roomType === 'group' && activeRoom.onlyAdminsCanSendMessages && !isAdmin(activeRoom) ? (
                    <div className="bg-gray-50 border border-gray-200 text-gray-500 rounded-2xl py-3.5 px-4 text-center text-xs font-semibold flex items-center justify-center gap-2 select-none shadow-inner">
                      <span>🔒</span>
                      {locale === 'hi' ? 'केवल एडमिन ही इस ग्रुप में संदेश भेज सकते हैं' : 'Only admins can send messages in this group'}
                    </div>
                  ) : activeRoom.blockedBy && activeRoom.blockedBy.length > 0 ? (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl py-3.5 px-4 text-center text-xs font-bold flex items-center justify-center gap-2 select-none shadow-inner">
                      <span>🚫</span>
                      {activeRoom.blockedBy.some(id => id?.toString() === user?._id?.toString()) ? (
                        <span className="flex items-center gap-2 justify-center flex-wrap">
                          {locale === 'hi' ? 'आपने इस यूज़र को ब्लॉक किया है।' : 'You have blocked this contact.'}
                          <button
                            onClick={() => handleBlockRoom(activeRoom._id)}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg transition active:scale-95 cursor-pointer border-0 uppercase tracking-wide font-sans ml-1.5"
                          >
                            {locale === 'hi' ? 'अनब्लॉक करें' : 'Unblock'}
                          </button>
                        </span>
                      ) : (
                        <span>{locale === 'hi' ? 'आप इस यूज़र को संदेश नहीं भेज सकते।' : 'You cannot send messages to this contact.'}</span>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Recording indicator */}
                      <AnimatePresence>
                        {isRecording && (
                          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                            className="flex items-center justify-between mb-2 bg-red-50 border border-red-200 rounded-2xl px-4 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <span className="w-3 h-3 rounded-full bg-red-500 voice-pulse" />
                              <span className="text-red-600 text-sm font-bold">{locale === 'hi' ? 'रिकॉर्डिंग हो रही है...' : 'Recording...'}</span>
                              <span className="text-red-500 font-mono text-sm font-bold">{fmtDur(recordingSeconds)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={cancelRecording} className="text-xs text-gray-500 hover:text-gray-700 font-medium px-2 py-1 rounded-lg hover:bg-gray-100">
                                {locale === 'hi' ? 'रद्द करें' : 'Cancel'}
                              </button>
                              <button onClick={stopRecording}
                                className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors">
                                <StopCircle className="w-3.5 h-3.5" />
                                {locale === 'hi' ? 'भेजें' : 'Send'}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        {/* Attach file button */}
                        <button type="button" onClick={() => fileInputRef.current?.click()}
                          className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-teal-600 transition-colors shrink-0"
                          title={locale === 'hi' ? 'फाइल अटैच करें' : 'Attach file'}>
                          <Paperclip className="w-5 h-5" />
                        </button>
                        <input ref={fileInputRef} type="file" className="hidden"
                          accept="image/*,video/*,audio/*,.pdf,.zip,.doc,.docx,.xls,.xlsx,.txt"
                          onChange={handleFileSelect} />

                        {/* Text input */}
                        <input type="text" value={newMessage} onChange={handleInputChange}
                          placeholder={isRecording ? (locale === 'hi' ? 'रिकॉर्डिंग...' : 'Recording...') : (locale === 'hi' ? 'संदेश लिखें...' : 'Type a message...')}
                          disabled={isRecording}
                          className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all disabled:opacity-50" />

                        {/* Send text / Mic button */}
                        {newMessage.trim() ? (
                          <button type="submit"
                            className="bg-teal-600 hover:bg-teal-700 text-white p-2.5 rounded-2xl transition-colors shadow-md active:scale-95 shrink-0">
                            <Send className="w-5 h-5" />
                          </button>
                        ) : (
                          <button type="button"
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={voiceLoading}
                            className={`p-2.5 rounded-2xl transition-all shadow-md active:scale-95 shrink-0 ${isRecording ? 'bg-red-500 hover:bg-red-600 voice-pulse' : 'bg-teal-600 hover:bg-teal-700'} text-white disabled:opacity-50`}
                            title={isRecording ? (locale === 'hi' ? 'रोकें और भेजें' : 'Stop & Send') : (locale === 'hi' ? 'वॉइस मैसेज रिकॉर्ड करें' : 'Record voice message')}>
                            {voiceLoading ? <Loader className="animate-spin w-5 h-5" /> : isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                          </button>
                        )}
                      </form>
                      {!isRecording && !newMessage && (
                        <p className="text-[10px] text-gray-400 text-center mt-1">{locale === 'hi' ? '🎤 माइक बटन दबाकर वॉइस मैसेज भेजें' : '🎤 Tap mic to record · tap again to send'}</p>
                      )}
                    </>
                  )}

                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-gray-50 text-center p-8">
                <div className="w-20 h-20 rounded-3xl bg-teal-50 border-2 border-teal-100 flex items-center justify-center">
                  <MessageCircle className="w-10 h-10 text-teal-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-700">{locale === 'hi' ? 'कोई चैट चुनें' : 'Select a Chat'}</h3>
                <p className="text-gray-400 text-sm max-w-xs">{locale === 'hi' ? 'बाएं से कोई बातचीत चुनें या नया यूज़र खोजें।' : 'Choose a conversation from the left or find a new user.'}</p>
                <button onClick={() => setFindUserModalOpen(true)}
                  className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold px-5 py-2.5 rounded-2xl transition-all shadow-md">
                  <Search className="w-4 h-4" /> {locale === 'hi' ? 'यूज़र खोजें' : 'Find a User'}
                </button>
              </div>
            )}
          </div>

          {/* ════ RIGHT: DETAILS PANEL ════ */}
          <AnimatePresence>
            {isDetailsPanelOpen && activeRoom && (
              <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: window.innerWidth < 768 ? '100%' : '40%', opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 md:relative border-l border-gray-100 bg-gray-50 flex flex-col overflow-hidden z-30">
                {/* Panel header */}
                <div className="px-4 py-3 border-b border-gray-200 bg-white flex justify-between items-center">
                  <h3 className="font-bold text-gray-800 text-sm">{locale === 'hi' ? 'विवरण' : 'Details'}</h3>
                  <button onClick={() => setIsDetailsPanelOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"><X className="w-4 h-4" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Profile */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 text-center space-y-3">
                    {(() => {
                      const other = getRoomOtherUser(activeRoom);
                      return other?.profileImage ? (
                        <img src={other.profileImage} alt={other.fullName} className="w-20 h-20 rounded-full object-cover border-4 border-teal-100 mx-auto shadow-lg" />
                      ) : (
                        <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getRoomColor(activeRoom)} flex items-center justify-center text-white font-bold text-3xl mx-auto shadow-lg`}>
                          {getRoomName(activeRoom).charAt(0).toUpperCase()}
                        </div>
                      );
                    })()}

                    {/* Group rename or title */}
                    {activeRoom.roomType === 'group' && isAdmin(activeRoom) ? (
                      editingGroupName ? (
                        <form onSubmit={e => handleRenameGroup(e, activeRoom._id)} className="flex gap-2 mt-2">
                          <input autoFocus value={groupRenameInput} onChange={e => setGroupRenameInput(e.target.value)} placeholder={activeRoom.roomName}
                            className="flex-1 text-sm px-3 py-1.5 rounded-xl border border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-400" />
                          <button type="submit" className="p-1.5 bg-teal-600 text-white rounded-xl"><CheckCircle className="w-4 h-4" /></button>
                          <button type="button" onClick={() => setEditingGroupName(false)} className="p-1.5 bg-gray-100 text-gray-500 rounded-xl"><X className="w-4 h-4" /></button>
                        </form>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <h4 className="font-bold text-gray-900">{getRoomName(activeRoom)}</h4>
                          <button onClick={() => { setEditingGroupName(true); setGroupRenameInput(activeRoom.roomName); }} className="text-gray-400 hover:text-teal-600">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )
                    ) : (
                      <>
                        <h4 className="font-bold text-gray-900 text-lg">{getRoomName(activeRoom)}</h4>
                        {/* Show bio for direct chat */}
                        {activeRoom.roomType === 'direct' && (() => {
                          const other = getRoomOtherUser(activeRoom);
                          return other?.bio ? <p className="text-xs text-gray-500 italic leading-relaxed">"{other.bio}"</p> : null;
                        })()}
                        {activeRoom.roomType === 'direct' && (() => {
                          const other = getRoomOtherUser(activeRoom);
                          return other?.village ? <p className="text-[11px] text-teal-600 font-semibold">📍 {other.village}{other.district ? `, ${other.district}` : ''}</p> : null;
                        })()}
                      </>
                    )}

                    <div className="flex justify-center gap-2 flex-wrap">
                      {isPinned(activeRoom) && <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full font-bold">📌 Pinned</span>}
                      {isArchived(activeRoom) && <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full font-bold">📂 Archived</span>}
                    </div>
                  </div>

                  {/* Quick action grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { emoji: isPinned(activeRoom) ? '📌' : '📌', label: isPinned(activeRoom) ? (locale === 'hi' ? 'अनपिन' : 'Unpin') : (locale === 'hi' ? 'पिन' : 'Pin'), action: () => handlePinRoom(activeRoom._id) },
                      { emoji: '📂', label: isArchived(activeRoom) ? (locale === 'hi' ? 'अनआर्काइव' : 'Unarchive') : (locale === 'hi' ? 'आर्काइव' : 'Archive'), action: () => handleArchiveRoom(activeRoom._id) },
                      { emoji: '🗑️', label: locale === 'hi' ? 'हटाएँ' : 'Clear', action: () => handleClearChat(activeRoom._id), danger: true },
                    ].map(btn => (
                      <button key={btn.label} onClick={btn.action}
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-[10px] font-bold transition-all bg-white ${btn.danger ? 'text-red-500 border-red-100 hover:bg-red-50' : 'text-gray-600 border-gray-100 hover:bg-gray-100'}`}>
                        <span className="text-xl">{btn.emoji}</span>{btn.label}
                      </button>
                    ))}
                  </div>

                  {/* Group features */}
                  {activeRoom.roomType === 'group' && (
                    <>
                      {/* Add by mobile */}
                      {(!activeRoom.onlyAdminsCanAddMembers || isAdmin(activeRoom)) && (
                        <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-3 animate-fade-in">
                          <h5 className="font-bold text-gray-700 text-xs flex items-center gap-2">
                            <UserPlus className="w-3.5 h-3.5 text-teal-600" />
                            {locale === 'hi' ? 'मोबाइल से जोड़ें' : 'Add by Mobile'}
                          </h5>
                          <form onSubmit={e => handleAddMemberByMobile(e, activeRoom._id)} className="flex gap-2">
                            <input id="groupMobileInput" type="tel" value={groupMobileInput} onChange={e => setGroupMobileInput(e.target.value)}
                              placeholder="10-digit mobile" className="flex-1 text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50" />
                            <button type="submit" className="bg-teal-600 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-teal-700 transition-colors">{locale === 'hi' ? 'जोड़ें' : 'Add'}</button>
                          </form>
                          {addMemberSuccess && <p className="text-[10px] text-green-600 font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" />{addMemberSuccess}</p>}
                          {addMemberError && <p className="text-[10px] text-red-500 font-bold">{addMemberError}</p>}
                        </div>
                      )}

                      {/* Group Settings (Admin Only) */}
                      {isAdmin(activeRoom) && (
                        <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-3 animate-fade-in">
                          <h5 className="font-bold text-gray-700 text-xs flex items-center gap-2">
                            <Settings className="w-3.5 h-3.5 text-teal-600" />
                            {locale === 'hi' ? 'ग्रुप सेटिंग्स' : 'Group Settings'}
                          </h5>
                          <div className="space-y-2.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-600 font-medium">
                                {locale === 'hi' ? 'केवल एडमिन सदस्य जोड़ सकते हैं' : 'Only Admins can add members'}
                              </span>
                              <button type="button" onClick={() => handleUpdateGroupSettings(activeRoom._id, { onlyAdminsCanAddMembers: !activeRoom.onlyAdminsCanAddMembers })}
                                className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${activeRoom.onlyAdminsCanAddMembers ? 'bg-teal-600' : 'bg-gray-200'}`}>
                                <div className={`bg-white w-4 h-4 rounded-full shadow transform duration-200 ease-in-out ${activeRoom.onlyAdminsCanAddMembers ? 'translate-x-5' : 'translate-x-0'}`} />
                              </button>
                            </div>
                            <div className="flex justify-between items-center text-xs border-t border-gray-50 pt-2.5">
                              <span className="text-gray-600 font-medium">
                                {locale === 'hi' ? 'केवल एडमिन संदेश भेज सकते हैं' : 'Only Admins can send messages'}
                              </span>
                              <button type="button" onClick={() => handleUpdateGroupSettings(activeRoom._id, { onlyAdminsCanSendMessages: !activeRoom.onlyAdminsCanSendMessages })}
                                className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${activeRoom.onlyAdminsCanSendMessages ? 'bg-teal-600' : 'bg-gray-200'}`}>
                                <div className={`bg-white w-4 h-4 rounded-full shadow transform duration-200 ease-in-out ${activeRoom.onlyAdminsCanSendMessages ? 'translate-x-5' : 'translate-x-0'}`} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Members list */}
                      <div className="bg-white rounded-2xl p-4 border border-gray-100">
                        <h5 className="font-bold text-gray-700 text-xs mb-3 flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-teal-600" />
                          {locale === 'hi' ? `सदस्य (${activeRoom.participants?.length || 0})` : `Members (${activeRoom.participants?.length || 0})`}
                        </h5>
                        <div className="space-y-2 max-h-52 overflow-y-auto">
                          {activeRoom.participants?.map(p => {
                            const pId = p._id || p;
                            const pName = p.fullName || p.name || 'Member';
                            const pImg = p.profileImage;
                            const pBio = p.bio;
                            const pAdmin = activeRoom.adminIds?.some(a => a?.toString() === pId?.toString());
                            const pIsMe = pId?.toString() === user?._id?.toString();
                            return (
                              <div key={pId} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 group/m">
                                {pImg ? (
                                  <img src={pImg} alt={pName} className="w-8 h-8 rounded-full object-cover border border-teal-100 shrink-0" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                    {pName.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-gray-800 truncate">{pName}{pIsMe ? ` (${locale === 'hi' ? 'आप' : 'You'})` : ''}</p>
                                  {pBio && <p className="text-[9px] text-gray-400 truncate italic">{pBio}</p>}
                                  {pAdmin && <p className="text-[9px] text-amber-600 font-bold flex items-center gap-0.5"><Crown className="w-2.5 h-2.5" />{locale === 'hi' ? 'एडमिन' : 'Admin'}</p>}
                                </div>
                                {isAdmin(activeRoom) && !pIsMe && (
                                  <div className="opacity-0 group-hover/m:opacity-100 flex gap-1 transition-opacity">
                                    {!pAdmin && <button onClick={() => handleMakeAdmin(activeRoom._id, pId)} className="p-1 bg-amber-50 text-amber-600 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors" title="Make Admin"><Crown className="w-3 h-3" /></button>}
                                    <button onClick={() => handleRemoveMember(activeRoom._id, pId)} className="p-1 bg-red-50 text-red-500 rounded-lg border border-red-200 hover:bg-red-100 transition-colors" title="Remove"><X className="w-3 h-3" /></button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <button onClick={() => handleExitGroup(activeRoom._id)}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors">
                        <LogOut className="w-4 h-4" /> {locale === 'hi' ? 'ग्रुप छोड़ें' : 'Exit Group'}
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ════ FIND USER MODAL ════ */}
      <AnimatePresence>
        {findUserModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) { setFindUserModalOpen(false); setFindUserResult(null); setFindUserError(''); setFindMobileInput(''); } }}>
            <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }} transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">

              {/* Modal header */}
              <div className="bg-gradient-to-r from-teal-600 to-emerald-500 p-5 flex justify-between items-center">
                <div>
                  <h3 className="text-white font-bold text-lg flex items-center gap-2"><Search className="w-5 h-5" />{locale === 'hi' ? 'यूज़र खोजें' : 'Find User'}</h3>
                  <p className="text-teal-100 text-xs mt-0.5">{locale === 'hi' ? 'मोबाइल नंबर से खोजें और चैट शुरू करें' : 'Search by mobile number and start chatting'}</p>
                </div>
                <button onClick={() => { setFindUserModalOpen(false); setFindUserResult(null); setFindUserError(''); setFindMobileInput(''); }}
                  className="bg-white/15 hover:bg-white/25 p-2 rounded-full text-white transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-5 space-y-4">
                {/* Search form */}
                <form onSubmit={handleFindUser} className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="tel" value={findMobileInput} onChange={e => setFindMobileInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder={locale === 'hi' ? '10 अंक का मोबाइल नंबर' : '10-digit mobile number'}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                  </div>
                  <button type="submit" disabled={findUserLoading || findMobileInput.length < 10}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-3 rounded-2xl disabled:opacity-50 transition-colors flex items-center gap-1.5">
                    {findUserLoading ? <Loader className="animate-spin w-4 h-4" /> : <Search className="w-4 h-4" />}
                  </button>
                </form>

                {/* Error state */}
                {findUserError && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                    <p className="text-red-500 font-bold text-sm">😕 {locale === 'hi' ? 'कोई यूज़र नहीं मिला' : 'No user found'}</p>
                    <p className="text-red-400 text-xs mt-1">{findUserError}</p>
                  </motion.div>
                )}

                {/* Found user card */}
                {findUserResult && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      {findUserResult.profileImage ? (
                        <img src={findUserResult.profileImage} alt={findUserResult.fullName}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-teal-200 shadow" />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-2xl shadow">
                          {findUserResult.fullName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 text-base">{findUserResult.fullName}</h4>
                        <p className="text-xs text-teal-600 font-semibold">📱 {findUserResult.mobile}</p>
                        {findUserResult.village && <p className="text-xs text-gray-500">📍 {findUserResult.village}{findUserResult.district ? `, ${findUserResult.district}` : ''}</p>}
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {findUserResult.categories?.map(cat => (
                            <span key={cat} className="text-[9px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-bold capitalize">{cat}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    {findUserResult.bio && (
                      <div className="bg-white/70 rounded-xl px-3 py-2 border border-teal-100">
                        <p className="text-xs text-gray-600 italic leading-relaxed">"{findUserResult.bio}"</p>
                      </div>
                    )}
                    <button onClick={handleStartChatWithFoundUser} disabled={findUserChatLoading}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-60">
                      {findUserChatLoading ? <Loader className="animate-spin w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
                      {locale === 'hi' ? 'चैट शुरू करें' : 'Start Chat'}
                    </button>
                  </motion.div>
                )}

                {!findUserResult && !findUserError && !findUserLoading && (
                  <div className="text-center py-4">
                    <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-2">
                      <Search className="w-7 h-7 text-teal-400" />
                    </div>
                    <p className="text-gray-400 text-xs">{locale === 'hi' ? '10 अंक का मोबाइल नंबर डालें और खोजें' : 'Enter 10-digit mobile number to find user'}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════ CREATE GROUP MODAL ════ */}
      <AnimatePresence>
        {isGroupModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }} transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-teal-600 to-emerald-500 p-6 flex justify-between items-center">
                <div>
                  <h3 className="text-white font-bold text-xl flex items-center gap-2"><Users className="w-5 h-5" />{locale === 'hi' ? 'नया ग्रुप बनाएँ' : 'Create Group'}</h3>
                  <p className="text-teal-100 text-xs mt-0.5">{locale === 'hi' ? 'समुदाय के साथ बातचीत शुरू करें' : 'Start a group discussion'}</p>
                </div>
                <button onClick={() => setIsGroupModalOpen(false)} className="bg-white/15 hover:bg-white/25 p-2 rounded-full text-white"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
                {groupError && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm">{groupError}</div>}
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1.5">{locale === 'hi' ? 'ग्रुप का नाम' : 'Group Name'}</label>
                  <input type="text" required value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
                    placeholder={locale === 'hi' ? 'जैसे: पिपरिया मंडी अपडेट्स' : 'e.g. Pipariya Mandi Updates'}
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <button type="submit" disabled={groupLoading || !newGroupName.trim()}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg disabled:opacity-60">
                  {groupLoading && <Loader className="animate-spin w-5 h-5" />}
                  {locale === 'hi' ? 'ग्रुप बनाएँ' : 'Create Group'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════ GLOBAL MESSAGE CONTEXT MENU ════ */}
      <AnimatePresence>
        {messageMenuAnchor && (
          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ duration: 0.1 }}
            style={{ position: 'fixed', top: messageMenuAnchor.top, left: messageMenuAnchor.left }}
            className="z-[100] w-48 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden py-1"
            data-msg-menu>
            {messageMenuAnchor.msgType === 'text' && (
              <button onClick={() => handleCopyMessage(messageMenuAnchor.msgContent)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 font-medium">
                <Copy className="w-3.5 h-3.5 text-gray-400" /> {locale === 'hi' ? 'कॉपी करें' : 'Copy'}
              </button>
            )}
            <button onClick={() => {
              setMessageMenuAnchor(null);
              setForwardContent(messageMenuAnchor.msgContent);
              setForwardType(messageMenuAnchor.msgType);
              setForwardModalOpen(true);
            }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 font-medium border-t border-gray-50">
              <Send className="w-3.5 h-3.5 text-gray-400 rotate-45" /> {locale === 'hi' ? 'फॉरवर्ड करें' : 'Forward'}
            </button>
            <button onClick={() => {
              handleDeleteMessage(messageMenuAnchor.msgId, 'me');
              setMessageMenuAnchor(null);
            }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 font-medium border-t border-gray-50">
              <Trash2 className="w-3.5 h-3.5 text-gray-400" /> {locale === 'hi' ? 'मेरे लिए हटाएँ' : 'Delete for Me'}
            </button>
            {messageMenuAnchor.isMe && (
              <button onClick={() => {
                handleDeleteMessage(messageMenuAnchor.msgId, 'everyone');
                setMessageMenuAnchor(null);
              }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 font-semibold border-t border-gray-100">
                <Trash2 className="w-3.5 h-3.5" /> {locale === 'hi' ? 'सबके लिए हटाएँ' : 'Delete for Everyone'}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════ FORWARD MESSAGE MODAL ════ */}
      <AnimatePresence>
        {forwardModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }} transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
              <div className="bg-gradient-to-r from-teal-600 to-emerald-500 p-5 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <Send className="w-5 h-5 rotate-45" />
                    {locale === 'hi' ? 'फॉरवर्ड करें' : 'Forward Message'}
                  </h3>
                  <p className="text-teal-100 text-xs mt-0.5">{locale === 'hi' ? 'गाँव या साथी को भेजें' : 'Send to a contact or group'}</p>
                </div>
                <button onClick={() => { setForwardModalOpen(false); setForwardContent(''); }}
                  className="bg-white/15 hover:bg-white/25 p-2 rounded-full text-white transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-4 border-b border-gray-100 shrink-0">
                <input type="text" placeholder={locale === 'hi' ? 'संपर्क खोजें...' : 'Search contact...'} value={forwardSearch} onChange={e => setForwardSearch(e.target.value)}
                  className="w-full pl-3 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {rooms
                  .filter(r => getRoomName(r).toLowerCase().includes(forwardSearch.toLowerCase()))
                  .map(room => (
                    <button key={room._id} onClick={() => handleForwardToRoom(room._id)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-2xl border border-gray-100 hover:bg-teal-50 hover:border-teal-200 transition-all text-left">
                      <div className="shrink-0">
                        {getRoomOtherUser(room)?.profileImage ? (
                          <img src={getRoomOtherUser(room).profileImage} alt={getRoomName(room)} className="w-10 h-10 rounded-full object-cover border border-teal-100" />
                        ) : (
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getRoomColor(room)} flex items-center justify-center text-white font-bold text-sm shadow`}>
                            {getRoomName(room).charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">{getRoomName(room)}</p>
                        <p className="text-[10px] text-gray-500 truncate">{getRoomSubtitle(room)}</p>
                      </div>
                      <span className="text-[10px] bg-teal-50 border border-teal-100 text-teal-700 font-bold px-2.5 py-1 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition-colors">
                        {locale === 'hi' ? 'भेजें' : 'Send'}
                      </span>
                    </button>
                  ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chat;