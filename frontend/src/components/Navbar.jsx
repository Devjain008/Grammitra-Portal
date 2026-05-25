import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSocket } from '../context/SocketContext';
import { Search, Mic, Bell, Bot, UserCircle, ShoppingCart, X, CheckCircle, Package, LogOut, Store, Mail, Phone, MapPin, Edit, Save, Loader, LineChart, Wrench, MessageSquare, Camera, Briefcase } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import VoiceAssistant from './VoiceAssistant';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { CONFIG, USER_CATEGORIES } from '../utils/constants';

const Navbar = () => {
  const { t, locale, setLocale } = useLanguage();
  const { user, logout, updateUser, token } = useAuth();
  const { cartCount } = useCart();
  const socket = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeNotification, setActiveNotification] = useState(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [yourSpaceModalOpen, setYourSpaceModalOpen] = useState(false);

  // Dynamic Notifications States
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(`notifications_${user?._id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [unreadCount, setUnreadCount] = useState(() => {
    try {
      const saved = localStorage.getItem(`unreadCount_${user?._id}`);
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [notificationsDropdownOpen, setNotificationsDropdownOpen] = useState(false);

  const notificationsRef = useRef(null);
  const profileRef = useRef(null);

  // Handle click outside dropdowns to close them
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Sync Notifications & Unread Count to LocalStorage
  useEffect(() => {
    if (user?._id) {
      localStorage.setItem(`notifications_${user._id}`, JSON.stringify(notifications));
    }
  }, [notifications, user?._id]);

  useEffect(() => {
    if (user?._id) {
      localStorage.setItem(`unreadCount_${user._id}`, unreadCount.toString());
    }
  }, [unreadCount, user?._id]);

  // Load/reload notifications on login or identity change
  useEffect(() => {
    if (user?._id) {
      try {
        const savedNotifications = localStorage.getItem(`notifications_${user._id}`);
        setNotifications(savedNotifications ? JSON.parse(savedNotifications) : []);
        const savedUnread = localStorage.getItem(`unreadCount_${user._id}`);
        setUnreadCount(savedUnread ? parseInt(savedUnread, 10) : 0);
      } catch (err) {
        console.error("Failed to load notifications from localStorage", err);
      }
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user?._id]);

  const toggleNotificationsDropdown = () => {
    setNotificationsDropdownOpen(prev => !prev);
    setUnreadCount(0);
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const handleMarkAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleNotificationClick = (notif) => {
    handleMarkAsRead(notif.id);
    setNotificationsDropdownOpen(false);
    if (notif.type === 'NEW_ORDER') {
      navigate('/your-shop');
    } else if (notif.type === 'ORDER_UPDATE') {
      navigate('/orders');
    } else if (notif.type === 'SERVICE_REQUEST') {
      navigate('/your-work');
    } else if (notif.type === 'NEW_MESSAGE') {
      navigate(`/chat?roomId=${notif.roomId}`);
    }
  };

  // Edit Profile States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    mobile: '',
    gender: '',
    village: '',
    district: '',
    state: '',
    profileImage: '',
    categories: [],
    notifications: true,
    orderNotifications: true,
    serviceNotifications: true,
    chatNotifications: true
  });
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadSuccess, setImageUploadSuccess] = useState(false);

  const [myAppliedJobs, setMyAppliedJobs] = useState([]);
  const [myBookedLabours, setMyBookedLabours] = useState([]);
  const [loadingProfileHistory, setLoadingProfileHistory] = useState(false);

  useEffect(() => {
    if ((!profileModalOpen && !yourSpaceModalOpen) || !token) return;

    const fetchHistory = async () => {
      try {
        setLoadingProfileHistory(true);
        // Fetch all jobs
        const jobsRes = await axios.get(`${CONFIG.API_BASE_URL}/api/jobs`);
        // Filter jobs user applied to
        const applied = jobsRes.data.filter(job => 
          job.applicants?.some(app => (app.userId?._id || app.userId)?.toString() === user?._id?.toString())
        );
        setMyAppliedJobs(applied);

        // Fetch all labours
        const labourRes = await axios.get(`${CONFIG.API_BASE_URL}/api/labour`);
        // Filter bookings user made
        const booked = [];
        labourRes.data.forEach(worker => {
          worker.serviceRequests?.forEach(req => {
            if ((req.requesterId?._id || req.requesterId)?.toString() === user?._id?.toString()) {
              booked.push({
                workerId: worker._id,
                workerName: worker.name,
                skill: worker.skill,
                requestId: req._id,
                status: req.status,
                dateTime: req.dateTime,
                offerAmount: req.offerAmount,
                contactNumber: worker.contactNumber
              });
            }
          });
        });
        setMyBookedLabours(booked);
      } catch (err) {
        console.error("Failed to load history:", err);
      } finally {
        setLoadingProfileHistory(false);
      }
    };

    fetchHistory();
  }, [profileModalOpen, yourSpaceModalOpen, token, user?._id]);

  const handleCancelJobApplication = async (jobId) => {
    if (!window.confirm(locale === 'hi' ? 'क्या आप इस नौकरी के आवेदन को रद्द करना चाहते हैं?' : 'Are you sure you want to withdraw this job application?')) return;
    try {
      await axios.post(`${CONFIG.API_BASE_URL}/api/jobs/${jobId}/cancel-apply`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyAppliedJobs(prev => prev.filter(j => j._id !== jobId));
      alert(locale === 'hi' ? 'आवेदन रद्द कर दिया गया।' : 'Application withdrawn successfully.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel application.');
    }
  };

  const handleCancelLabourBooking = async (workerId, requestId) => {
    if (!window.confirm(locale === 'hi' ? 'क्या आप इस श्रमिक बुकिंग को रद्द करना चाहते हैं?' : 'Are you sure you want to cancel this booking request?')) return;
    try {
      await axios.delete(`${CONFIG.API_BASE_URL}/api/labour/requests/${workerId}/${requestId}/cancel`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyBookedLabours(prev => prev.filter(b => b.requestId !== requestId));
      alert(locale === 'hi' ? 'बुकिंग रद्द कर दी गई।' : 'Booking cancelled successfully.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking.');
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setEditError(locale === 'hi' ? 'छवि का आकार 5MB से कम होना चाहिए।' : 'Image size must be less than 5MB.');
      return;
    }

    const data = new FormData();
    data.append('image', file);

    setUploadingImage(true);
    setImageUploadSuccess(false);
    setEditError('');

    try {
      const res = await axios.post(`${CONFIG.API_BASE_URL}/api/auth/upload-profile`, data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setEditForm(prev => ({ ...prev, profileImage: res.data.imageUrl }));
      setImageUploadSuccess(true);
    } catch (err) {
      console.error("Upload error details:", err.response?.data || err.message);
      setEditError(err.response?.data?.message || (locale === 'hi' ? 'छवि अपलोड करने में विफल।' : 'Failed to upload image.'));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEditProfileSubmit = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditLoading(true);
    try {
      const response = await axios.put(
        `${CONFIG.API_BASE_URL}/api/auth/profile`,
        editForm,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      updateUser(response.data);
      setIsEditingProfile(false);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditClick = () => {
    setEditForm({
      fullName: user?.fullName || user?.name || '',
      email: user?.email || '',
      mobile: user?.mobile || '',
      gender: user?.gender || 'male',
      village: user?.village || '',
      district: user?.district || '',
      state: user?.state || '',
      profileImage: user?.profileImage || '',
      categories: user?.categories || [],
      notifications: user?.notifications !== false,
      orderNotifications: user?.orderNotifications !== false,
      serviceNotifications: user?.serviceNotifications !== false,
      chatNotifications: user?.chatNotifications !== false,
    });
    setEditError('');
    setIsEditingProfile(true);
  };

  const toggleEditCategory = (catId) => {
    setEditForm(prev => ({
      ...prev,
      categories: prev.categories.includes(catId)
        ? prev.categories.filter(c => c !== catId)
        : [...prev.categories, catId]
    }));
  };

  const userCategories = Array.isArray(user?.categories)
    ? user.categories
    : (typeof user?.categories === 'string'
        ? [user.categories]
        : []);

  // Web Audio tone generator for real-time notification sounds
  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Audio Context error:", e);
    }
  };

  useEffect(() => {
    if (socket) {
      let timer;
      const handleNotification = (data) => {
        // Respect user's notification preferences
        if (user?.notifications === false) return;
        if (data.type === 'SERVICE_REQUEST' && user?.serviceNotifications === false) return;
        if ((data.type === 'NEW_ORDER' || data.type === 'ORDER_UPDATE') && user?.orderNotifications === false) return;

        let customData = { ...data };

        if (data.type === 'ORDER_UPDATE') {
          const status = data.order?.status;
          const shopName = data.order?.businessId?.name || 'Local Store';
          
          if (status === 'accepted') {
            customData.title = 'Order Approved';
            customData.titleHindi = 'ऑर्डर स्वीकृत किया गया';
            customData.message = `Your order for ${shopName} has been approved!`;
            customData.messageHindi = `आपका ${shopName} के लिए ऑर्डर स्वीकार कर लिया गया है!`;
          } else if (status === 'completed') {
            customData.title = 'Order Delivered';
            customData.titleHindi = 'ऑर्डर वितरित किया गया';
            customData.message = `Your order for ${shopName} has been delivered successfully!`;
            customData.messageHindi = `आपका ${shopName} के लिए ऑर्डर सफलतापूर्वक वितरित (डिलीवर) कर दिया गया है!`;
          } else if (status === 'cancelled') {
            customData.title = 'Order Cancelled';
            customData.titleHindi = 'ऑर्डर रद्द किया गया';
            customData.message = `Your order for ${shopName} has been cancelled.`;
            customData.messageHindi = `आपका ${shopName} के लिए ऑर्डर रद्द कर दिया गया है।`;
          }
        }

        const newNotif = {
          id: customData.id || Date.now().toString(),
          type: customData.type,
          message: customData.message,
          messageHindi: customData.messageHindi,
          title: customData.title,
          titleHindi: customData.titleHindi,
          orderId: customData.order?._id,
          createdAt: new Date().toISOString(),
          read: false
        };

        setNotifications(prev => [newNotif, ...prev]);
        setUnreadCount(prev => prev + 1);
        setActiveNotification(customData);
        playNotificationSound();
        
        if (timer) clearTimeout(timer);
        // Auto-dismiss after 8 seconds
        timer = setTimeout(() => {
          setActiveNotification(null);
        }, 8000);
      };

      const handleReceiveMessageGlobal = (msg) => {
        // Skip if user is the sender
        if (msg.senderId === user?._id) return;

        // Skip if user has notifications or chat notifications disabled
        if (user?.notifications === false || user?.chatNotifications === false) return;

        // Skip if user is currently viewing the active room on the chat page
        const queryParams = new URLSearchParams(location.search);
        const currentRoomId = queryParams.get('roomId');
        const isChatPage = location.pathname === '/chat';
        if (isChatPage && currentRoomId === msg.roomId) return;

        // Construct notification payload for chat message
        const newNotif = {
          id: msg._id || Date.now().toString(),
          type: 'NEW_MESSAGE',
          title: 'New Chat Message',
          titleHindi: 'नया चैट संदेश',
          message: `${msg.senderName}: ${msg.content}`,
          messageHindi: `${msg.senderName}: ${msg.content}`,
          roomId: msg.roomId,
          createdAt: new Date().toISOString(),
          read: false
        };

        setNotifications(prev => [newNotif, ...prev]);
        setUnreadCount(prev => prev + 1);
        setActiveNotification(newNotif);
        playNotificationSound();

        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          setActiveNotification(null);
        }, 8000);
      };

      socket.on('notification', handleNotification);
      socket.on('receive_message', handleReceiveMessageGlobal);
      return () => {
        socket.off('notification', handleNotification);
        socket.off('receive_message', handleReceiveMessageGlobal);
        if (timer) clearTimeout(timer);
      };
    }
  }, [socket, user, location]);

  return (
    <>
      <nav className="glass-card sticky top-4 z-50 mx-4 px-6 py-3 flex justify-between items-center">
      {/* Search Bar */}
      <div className="relative hidden md:block w-1/3">
        <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
        <input 
          type="text" 
          placeholder={t('common.search')} 
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-village-cream/50 border border-village-mint/20 focus:outline-none focus:ring-2 focus:ring-village-mint transition-all"
        />
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-2 md:gap-4 ml-auto">
        {/* Language Switcher */}
        <LanguageSwitcher />
        <VoiceAssistant />
        
        {/* <button className="p-2 text-gray-600 hover:text-blue-500 bg-gray-50 hover:bg-blue-50 rounded-full transition-all relative">
          <Bot className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
        </button> */}

        {/* Shopping Cart Icon */}
        <Link 
          to="/cart" 
          className="p-2 text-gray-600 hover:text-amber-600 bg-gray-50 hover:bg-amber-50 rounded-full transition-all relative"
          title={locale === 'hi' ? 'कार्ट' : 'Shopping Cart'}
        >
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow-md animate-bounce">
              {cartCount}
            </span>
          )}
        </Link>

        {/* Dynamic Notifications Icon & Dropdown */}
        <div ref={notificationsRef} className="relative z-50">
          <button 
            onClick={toggleNotificationsDropdown}
            className="p-2 text-gray-600 hover:text-village-emerald bg-gray-50 hover:bg-village-lightMint rounded-full transition-all relative cursor-pointer"
            title={locale === 'hi' ? 'सूचनाएं' : 'Notifications'}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow-md animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notificationsDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 p-4 z-50 space-y-3 max-h-96 overflow-y-auto"
              >
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-sm font-bold text-gray-800">{locale === 'hi' ? 'सूचनाएं' : 'Notifications'}</span>
                  {notifications.length > 0 && (
                    <button 
                      onClick={handleClearAllNotifications}
                      className="text-xs text-red-500 hover:text-red-700 font-semibold cursor-pointer border-0 bg-transparent"
                    >
                      {locale === 'hi' ? 'सभी साफ करें' : 'Clear All'}
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 text-xs flex flex-col items-center gap-2">
                      <Bell className="w-8 h-8 opacity-40 text-gray-400" />
                      {locale === 'hi' ? 'अभी कोई सूचना नहीं है' : 'No notifications yet'}
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer text-left flex gap-2.5 items-start ${
                          notif.read 
                            ? 'bg-gray-50/50 border-gray-100 text-gray-600' 
                            : 'bg-village-lightMint/30 border-village-mint/20 text-gray-800 font-medium hover:bg-village-lightMint/50'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${
                          notif.type === 'NEW_ORDER' 
                            ? 'bg-amber-100 text-amber-700' 
                            : notif.type === 'SERVICE_REQUEST'
                              ? 'bg-blue-100 text-blue-700'
                              : notif.type === 'NEW_MESSAGE'
                                ? 'bg-teal-100 text-teal-700'
                                : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {notif.type === 'SERVICE_REQUEST' ? (
                            <Wrench className="w-3.5 h-3.5" />
                          ) : notif.type === 'NEW_MESSAGE' ? (
                            <MessageSquare className="w-3.5 h-3.5" />
                          ) : (
                            <Package className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs leading-relaxed">
                            {locale === 'hi' ? (notif.messageHindi || notif.message) : notif.message}
                          </p>
                          <span className="text-[10px] text-gray-400 mt-1 block">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div ref={profileRef} className="relative z-50">
          <div 
            className="flex items-center gap-2 pl-2 border-l border-gray-200 cursor-pointer select-none animate-pulse-hover"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
          >
            <div className="hidden md:block text-right">
              <p className="text-sm font-semibold text-gray-800">{user?.fullName || user?.name || "User"}</p>
              <p className="text-xs text-gray-500 capitalize">{t(`categories.${userCategories[0]}`) || userCategories[0] || "Villager"}</p>
            </div>
            {user?.profileImage ? (
              <img src={user.profileImage} alt={user.fullName} className="w-8 h-8 rounded-full object-cover border border-village-mint/20 shadow-sm" />
            ) : (
              <UserCircle className="w-8 h-8 text-village-emerald" />
            )}
          </div>

          <AnimatePresence>
            {profileDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-xs bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 p-3 z-50 space-y-1.5"
              >
                <div className="px-3.5 py-2.5 border-b border-gray-100/80 text-left flex flex-col gap-0.5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{locale === 'hi' ? 'इस रूप में लॉग इन किया है' : 'Signed in as'}</p>
                  <p className="text-sm font-extrabold text-gray-800 truncate">{user?.fullName || user?.name || "User"}</p>
                  <p className="text-[11px] text-village-emerald font-semibold capitalize bg-village-lightMint/50 px-2 py-0.5 rounded-md w-fit mt-1">
                    {userCategories.map(cat => t(`categories.${cat}`) || cat).join(', ') || (locale === 'hi' ? 'ग्रामीण' : 'Villager')}
                  </p>
                  {user?.village && (
                    <p className="text-[11px] text-gray-500 font-medium mt-1 flex items-center gap-1">
                      <span>📍</span> {user.village}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    setIsEditingProfile(false);
                    setProfileModalOpen(true);
                  }}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-village-lightMint/60 hover:text-village-emerald transition-all duration-200 w-full text-left cursor-pointer border-0 bg-transparent"
                >
                  <UserCircle className="w-4 h-4 text-village-emerald animate-pulse-hover" />
                  {locale === 'en' ? 'My Profile' : 'मेरी प्रोफाइल'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    setYourSpaceModalOpen(true);
                  }}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-emerald-50/60 hover:text-emerald-800 transition-all duration-200 w-full text-left cursor-pointer border-0 bg-transparent"
                >
                  <Briefcase className="w-4 h-4 text-emerald-500 animate-pulse-hover" />
                  {locale === 'en' ? 'Your Space' : 'आपका स्पेस'}
                </button>

                <Link
                  to="/cart"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-amber-50/60 hover:text-amber-800 transition-all duration-200 w-full text-left"
                >
                  <ShoppingCart className="w-4 h-4 text-amber-500" />
                  {locale === 'hi' ? `शॉपिंग कार्ट (${cartCount})` : `Shopping Cart (${cartCount})`}
                </Link>

                <Link
                  to="/orders"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-emerald-50/60 hover:text-emerald-800 transition-all duration-200 w-full text-left"
                >
                  <Package className="w-4 h-4 text-emerald-500" />
                  {locale === 'hi' ? 'आपके ऑर्डर्स' : 'Your Orders'}
                </Link>

                {userCategories.some(cat => ['shopkeeper', 'businessman'].includes(cat)) && (
                  <Link
                    to="/your-shop"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-teal-50/60 hover:text-teal-800 transition-all duration-200 w-full text-left"
                  >
                    <Store className="w-4 h-4 text-teal-500" />
                    {locale === 'hi' ? 'आपकी दुकान' : 'Your Shop'}
                  </Link>
                )}

                <hr className="border-gray-100/80 my-1" />

                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 w-full text-left cursor-pointer border-0 bg-transparent"
                >
                  <LogOut className="w-4 h-4" />
                  {locale === 'hi' ? 'लॉगआउट' : 'Logout'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>

      {/* Floating Animated Socket Notification Banner */}
      <AnimatePresence>
        {activeNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, y: -20, scale: 0.95, opacity: 0 }}
            className={`fixed top-6 right-6 z-50 max-w-sm w-full bg-white rounded-2xl shadow-2xl border-l-4 ${
              activeNotification.type === 'SERVICE_REQUEST' ? 'border-blue-500' : 
              activeNotification.type === 'NEW_MESSAGE' ? 'border-teal-500' : 'border-amber-500'
            } overflow-hidden flex flex-col p-4 space-y-3`}
            style={{ filter: 'drop-shadow(0 20px 25px rgba(0, 0, 0, 0.15))' }}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl border flex-shrink-0 ${
                activeNotification.type === 'SERVICE_REQUEST' 
                  ? 'bg-blue-50 border-blue-100 text-blue-600' 
                  : activeNotification.type === 'NEW_MESSAGE'
                    ? 'bg-teal-50 border-teal-100 text-teal-600'
                    : 'bg-amber-50 border-amber-100 text-amber-600'
              }`}>
                {activeNotification.type === 'SERVICE_REQUEST' ? (
                  <Wrench className="w-5 h-5" />
                ) : activeNotification.type === 'NEW_MESSAGE' ? (
                  <MessageSquare className="w-5 h-5" />
                ) : (
                  <Package className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-gray-800">
                  {locale === 'hi'
                    ? (activeNotification.titleHindi || 
                       (activeNotification.type === 'NEW_ORDER' ? '🎉 नया ऑर्डर प्राप्त हुआ!' : 
                        activeNotification.type === 'SERVICE_REQUEST' ? '🛠️ सेवा अनुरोध प्राप्त हुआ!' : 
                        activeNotification.type === 'NEW_MESSAGE' ? '💬 नया संदेश प्राप्त हुआ!' : 
                        '📦 ऑर्डर अपडेट किया गया'))
                    : (activeNotification.title || 
                       (activeNotification.type === 'NEW_ORDER' ? '🎉 New Order Received!' : 
                        activeNotification.type === 'SERVICE_REQUEST' ? '🛠️ Service Request Received!' : 
                        activeNotification.type === 'NEW_MESSAGE' ? '💬 New Message Received!' : 
                        '📦 Order Updated'))}
                </h4>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  {locale === 'hi' ? (activeNotification.messageHindi || activeNotification.message) : activeNotification.message}
                </p>
              </div>
              <button 
                onClick={() => setActiveNotification(null)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {activeNotification.type === 'SERVICE_REQUEST' && (
              <div className="flex justify-between items-center bg-gray-55/60 p-2 rounded-xl text-[10px] text-gray-500">
                <span>{locale === 'hi' ? 'स्थान:' : 'Location:'} <b className="text-gray-800">{activeNotification.clientLocation?.village || 'Nearby'}</b></span>
                <Link 
                  to="/your-work" 
                  onClick={() => setActiveNotification(null)}
                  className="text-blue-600 hover:text-blue-700 font-bold underline"
                >
                  {locale === 'hi' ? 'विवरण देखें' : 'View Details'}
                </Link>
              </div>
            )}
            {activeNotification.type === 'NEW_MESSAGE' && (
              <div className="flex justify-between items-center bg-gray-55/60 p-2 rounded-xl text-[10px] text-gray-500">
                <span>{locale === 'hi' ? 'चैट संदेश' : 'Chat Message'}</span>
                <Link 
                  to={`/chat?roomId=${activeNotification.roomId}`} 
                  onClick={() => setActiveNotification(null)}
                  className="text-teal-600 hover:text-teal-700 font-bold underline"
                >
                  {locale === 'hi' ? 'अभी उत्तर दें' : 'Reply Now'}
                </Link>
              </div>
            )}
            {activeNotification.order && (
              <div className="flex justify-between items-center bg-gray-55/60 p-2 rounded-xl text-[10px] text-gray-500">
                <span>{locale === 'hi' ? 'राशि:' : 'Amt:'} <b className="text-gray-800">₹{activeNotification.order.totalAmount}</b></span>
                <span className="capitalize">{locale === 'hi' ? 'स्थिति:' : 'Status:'} <b className="text-amber-600">{activeNotification.order.status}</b></span>
                {activeNotification.type === 'NEW_ORDER' && (
                  <Link 
                    to="/your-shop" 
                    onClick={() => setActiveNotification(null)}
                    className="text-emerald-600 hover:text-emerald-700 font-bold underline"
                  >
                    {locale === 'hi' ? 'दुकान देखें' : 'View Shop'}
                  </Link>
                )}
                {activeNotification.type === 'ORDER_UPDATE' && (
                  <Link 
                    to="/orders" 
                    onClick={() => setActiveNotification(null)}
                    className="text-emerald-600 hover:text-emerald-700 font-bold underline"
                  >
                    {locale === 'hi' ? 'ऑर्डर ट्रैक करें' : 'Track Order'}
                  </Link>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Details Modal */}
      <AnimatePresence>
        {profileModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProfileModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] shadow-2xl border border-gray-100 max-w-md w-full p-6 z-[60] relative overflow-hidden text-left"
            >
              {/* Header Pattern decoration */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-village-emerald to-village-mint" />

              {/* Close Button */}
              <button
                onClick={() => setProfileModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-50 rounded-lg transition-colors border-0 bg-transparent cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {!isEditingProfile ? (
                <>
                  <div className="flex flex-col items-center mt-2">
                    {/* Big Avatar */}
                    <div className="w-20 h-20 bg-village-lightMint/50 rounded-full flex items-center justify-center border border-village-mint/20 mb-3 animate-pulse-hover overflow-hidden">
                      {user?.profileImage ? (
                        <img src={user.profileImage} alt={user.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <UserCircle className="w-14 h-14 text-village-emerald" />
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">{user?.fullName || user?.name || "User"}</h3>
                    <div className="flex flex-wrap gap-1.5 justify-center mt-1">
                      {userCategories.map((cat, idx) => (
                        <span key={idx} className="text-[10px] text-village-emerald font-extrabold uppercase tracking-wide bg-village-lightMint/50 px-2.5 py-0.5 rounded-full">
                          {t(`categories.${cat}`) || cat}
                        </span>
                      ))}
                      {userCategories.length === 0 && (
                        <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wide bg-gray-100 px-2.5 py-0.5 rounded-full">
                          {locale === 'hi' ? 'ग्रामीण' : 'Villager'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Detail fields */}
                  <div className="mt-6 space-y-4">
                    {/* Email Address */}
                    <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-gray-50/50 border border-gray-100">
                      <div className="bg-blue-50 p-2 rounded-xl text-blue-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{locale === 'en' ? 'Email Address' : 'ईमेल पता'}</p>
                        <p className="text-sm font-semibold text-gray-700 truncate">{user?.email || (locale === 'en' ? 'Not provided' : 'उपलब्ध नहीं')}</p>
                      </div>
                    </div>

                    {/* Mobile Number */}
                    <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-gray-50/50 border border-gray-100">
                      <div className="bg-emerald-50 p-2 rounded-xl text-emerald-500">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{locale === 'en' ? 'Mobile Number' : 'मोबाइल नंबर'}</p>
                        <p className="text-sm font-semibold text-gray-700 truncate">{user?.mobile || (locale === 'en' ? 'Not provided' : 'उपलब्ध नहीं')}</p>
                      </div>
                    </div>

                    {/* Gender */}
                    <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-gray-50/50 border border-gray-100">
                      <div className="bg-purple-50 p-2 rounded-xl text-purple-500">
                        <UserCircle className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{locale === 'en' ? 'Gender' : 'लिंग'}</p>
                        <p className="text-sm font-semibold text-gray-700 capitalize truncate">{user?.gender || (locale === 'en' ? 'Not specified' : 'निर्दिष्ट नहीं')}</p>
                      </div>
                    </div>

                    {/* Address Info */}
                    <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-gray-50/50 border border-gray-100">
                      <div className="bg-amber-50 p-2 rounded-xl text-amber-500">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{locale === 'en' ? 'Village / Town' : 'गाँव / शहर'}</p>
                        <p className="text-sm font-semibold text-gray-700 truncate">
                          {user?.village ? `${user.village}${user.district ? `, ${user.district}` : ''}${user.state ? `, ${user.state}` : ''}` : (locale === 'en' ? 'Not provided' : 'उपलब्ध नहीं')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={handleEditClick}
                      className="px-4 py-2.5 bg-village-emerald hover:bg-village-emerald/90 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer border-0 flex-1 md:flex-initial text-center font-sans flex items-center justify-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      {locale === 'en' ? 'Edit Profile' : 'प्रोफाइल बदलें'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileModalOpen(false)}
                      className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-xs transition-colors cursor-pointer border-0 flex-1 md:flex-initial text-center font-sans"
                    >
                      {locale === 'en' ? 'Close' : 'बंद करें'}
                    </button>
                  </div>
                </>
              ) : (
                <form onSubmit={handleEditProfileSubmit} className="flex flex-col mt-2">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">{locale === 'en' ? 'Edit Profile' : 'प्रोफाइल संपादित करें'}</h3>
                    <p className="text-xs text-gray-500">{locale === 'en' ? 'Update your personal details' : 'अपनी व्यक्तिगत जानकारी अपडेट करें'}</p>
                  </div>

                  <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
                    {/* Profile Image (Browse & Paste URL) */}
                    <div className="bg-[#f7fcf9] border border-gray-150 p-4 rounded-2xl space-y-3 shadow-sm">
                      <label className="text-xs font-bold text-gray-700 block">{locale === 'hi' ? 'प्रोफ़ाइल छवि' : 'Profile Image'}</label>
                      
                      <div className="flex items-center gap-4">
                        {/* Image Preview / Browse Button */}
                        <div className="relative group shrink-0">
                          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-dashed border-[#48b475] hover:border-[#3d9c63] flex items-center justify-center bg-white cursor-pointer transition-all shadow-inner relative">
                            {editForm.profileImage ? (
                              <img 
                                src={editForm.profileImage} 
                                alt="Preview" 
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ) : (
                              <div className="flex flex-col items-center text-gray-400 group-hover:text-[#48b475] transition-colors">
                                <Camera className="w-6 h-6 mb-0.5" />
                                <span className="text-[8px] font-bold uppercase">{locale === 'hi' ? 'ब्राउज़' : 'Browse'}</span>
                              </div>
                            )}
                            {/* Hover overlay to change image */}
                            {editForm.profileImage && (
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                                {locale === 'hi' ? 'बदलें' : 'Change'}
                              </div>
                            )}
                          </div>
                          <input 
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={uploadingImage}
                          />
                        </div>

                        {/* Upload Status / Paste URL Input */}
                        <div className="flex-1 min-w-0 space-y-2">
                          {uploadingImage ? (
                            <div className="flex items-center gap-1.5 text-[#48b475] text-xs font-bold">
                              <span className="w-3.5 h-3.5 border-2 border-[#48b475] border-t-transparent rounded-full animate-spin"></span>
                              <span className="truncate">{locale === 'hi' ? 'अपलोड हो रहा है...' : 'Uploading...'}</span>
                            </div>
                          ) : imageUploadSuccess ? (
                            <div className="text-green-600 text-xs font-bold">
                              ✓ {locale === 'hi' ? 'सफलतापूर्वक अपलोड!' : 'Uploaded successfully!'}
                            </div>
                          ) : (
                            <p className="text-[10px] text-gray-500">
                              {locale === 'hi' ? 'छवि चुनें (JPG/PNG, अधिकतम 5MB)' : 'Select image (JPG/PNG, max 5MB)'}
                            </p>
                          )}

                          <div className="relative flex items-center border border-gray-200 bg-white rounded-xl px-3 py-1.5 focus-within:ring-1 focus-within:ring-[#48b475] transition-all">
                            <span className="text-[9px] font-bold text-gray-400 uppercase mr-1.5">{locale === 'hi' ? 'या URL:' : 'Or URL:'}</span>
                            <input 
                              type="text"
                              value={editForm.profileImage || ''}
                              onChange={e => {
                                setEditForm({...editForm, profileImage: e.target.value});
                                setImageUploadSuccess(false);
                              }}
                              placeholder={locale === 'hi' ? 'छवि का URL यहाँ पेस्ट करें...' : 'Paste profile image URL here...'}
                              className="w-full text-xs outline-none bg-transparent text-gray-800 placeholder-gray-400 font-semibold"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Name */}
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">{locale === 'en' ? 'Full Name' : 'पूरा नाम'}</label>
                      <input
                        type="text"
                        value={editForm.fullName}
                        onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                        className="w-full text-sm border border-gray-200 bg-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-village-emerald/20 focus:border-village-emerald outline-none transition-all text-gray-800 font-semibold"
                        required
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">{locale === 'en' ? 'Email Address' : 'ईमेल पता'}</label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full text-sm border border-gray-200 bg-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-village-emerald/20 focus:border-village-emerald outline-none transition-all text-gray-800 font-semibold"
                      />
                    </div>

                    {/* Mobile */}
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">{locale === 'en' ? 'Mobile Number' : 'मोबाइल नंबर'}</label>
                      <input
                        type="text"
                        value={editForm.mobile}
                        onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                        className="w-full text-sm border border-gray-200 bg-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-village-emerald/20 focus:border-village-emerald outline-none transition-all text-gray-800 font-semibold"
                        required
                      />
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">{locale === 'en' ? 'Gender' : 'लिंग'}</label>
                      <select
                        value={editForm.gender}
                        onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                        className="w-full text-sm border border-gray-200 bg-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-village-emerald/20 focus:border-village-emerald outline-none transition-all text-gray-800 font-semibold cursor-pointer"
                      >
                        <option value="male" className="bg-white text-gray-800 font-semibold">Male</option>
                        <option value="female" className="bg-white text-gray-800 font-semibold">Female</option>
                        <option value="other" className="bg-white text-gray-800 font-semibold">Other</option>
                      </select>
                    </div>

                    {/* Location Name Details Section */}
                    <div className="bg-gray-55/40 border border-gray-150 p-3.5 rounded-2xl space-y-3">
                      <div className="flex items-center gap-1.5 border-b border-gray-100/50 pb-1.5">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('location.title')}</span>
                      </div>

                      <div className="space-y-3.5">
                        {/* Village */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-555 uppercase text-left block">{t('location.village')}</label>
                          <input
                            type="text"
                            required
                            value={editForm.village}
                            onChange={(e) => setEditForm({ ...editForm, village: e.target.value })}
                            placeholder={t('location.village') || "Village"}
                            className="w-full text-sm border border-gray-200 bg-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-village-emerald/20 focus:border-village-emerald outline-none transition-all text-gray-800 font-semibold"
                          />
                        </div>

                        {/* District */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-555 uppercase text-left block">{t('location.district')}</label>
                          <input
                            type="text"
                            required
                            value={editForm.district}
                            onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                            placeholder={t('location.district') || "District"}
                            className="w-full text-sm border border-gray-250 bg-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-village-emerald/20 focus:border-village-emerald outline-none transition-all text-gray-800 font-semibold"
                          />
                        </div>

                        {/* State */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-555 uppercase text-left block">{t('location.state')}</label>
                          <input
                            type="text"
                            required
                            value={editForm.state}
                            onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                            placeholder={t('location.state') || "State"}
                            className="w-full text-sm border border-gray-250 bg-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-village-emerald/20 focus:border-village-emerald outline-none transition-all text-gray-800 font-semibold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Notification Settings */}
                    <div className="bg-gray-55/40 border border-gray-150 p-3.5 rounded-2xl space-y-3">
                      <div className="flex items-center gap-1.5 border-b border-gray-100/50 pb-1.5">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                          {locale === 'hi' ? 'सूचनाएं सेटिंग' : 'Notification Settings'}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {/* Master Enable */}
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={editForm.notifications}
                            onChange={(e) => setEditForm({ ...editForm, notifications: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-300 text-village-emerald focus:ring-village-emerald/30 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-gray-700">
                            {locale === 'hi' ? 'सभी सूचनाएं प्राप्त करें' : 'Receive Notifications'}
                          </span>
                        </label>

                        {/* Specific Sub-settings (only show if master notifications enabled) */}
                        {editForm.notifications && (
                          <div className="pl-6.5 space-y-2 border-l border-gray-100 mt-2">
                            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={editForm.orderNotifications}
                                onChange={(e) => setEditForm({ ...editForm, orderNotifications: e.target.checked })}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-village-emerald focus:ring-village-emerald/30 cursor-pointer"
                              />
                              <span className="text-xs font-medium text-gray-600">
                                {locale === 'hi' ? 'दुकान और ऑर्डर अपडेट' : 'Shop & Order Updates'}
                              </span>
                            </label>

                            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={editForm.serviceNotifications}
                                onChange={(e) => setEditForm({ ...editForm, serviceNotifications: e.target.checked })}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-village-emerald focus:ring-village-emerald/30 cursor-pointer"
                              />
                              <span className="text-xs font-medium text-gray-600">
                                {locale === 'hi' ? 'श्रमिक और सेवा अनुरोध' : 'Labour & Service Requests'}
                              </span>
                            </label>

                            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={editForm.chatNotifications}
                                onChange={(e) => setEditForm({ ...editForm, chatNotifications: e.target.checked })}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-village-emerald focus:ring-village-emerald/30 cursor-pointer"
                              />
                              <span className="text-xs font-medium text-gray-600">
                                {locale === 'hi' ? 'सामुदायिक चैट संदेश' : 'Community Chat Messages'}
                              </span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Categories */}
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">{locale === 'en' ? 'Profile Categories' : 'प्रोफाइल श्रेणियां'}</label>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {USER_CATEGORIES.map(cat => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => toggleEditCategory(cat.id)}
                            className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer border-0 ${
                              editForm.categories.includes(cat.id)
                                ? 'bg-village-emerald text-white shadow-sm font-sans'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 font-sans'
                            }`}
                          >
                            {t(`categories.${cat.id}`) || cat.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {editError && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-100 rounded-xl flex items-center gap-1.5 text-red-600 text-xs font-semibold">
                      <span>⚠️ {editError}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-5 flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-xs transition-colors cursor-pointer border-0 flex-1 md:flex-initial text-center font-sans"
                      disabled={editLoading}
                    >
                      {locale === 'en' ? 'Cancel' : 'रद्द करें'}
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-village-emerald hover:bg-village-emerald/90 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer border-0 flex-1 md:flex-initial text-center font-sans flex items-center justify-center gap-1.5"
                      disabled={editLoading}
                    >
                      {editLoading ? (
                        <>
                          <Loader className="w-3.5 h-3.5 animate-spin" />
                          {locale === 'en' ? 'Saving...' : 'सहेज रहे हैं...'}
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          {locale === 'en' ? 'Save' : 'सहेजें'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Your Space Modal */}
      <AnimatePresence>
        {yourSpaceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setYourSpaceModalOpen(false)}
              className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            />
            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] shadow-2xl border border-gray-105 max-w-lg w-full p-6 z-[60] relative flex flex-col max-h-[85vh] text-left"
            >
              {/* Header Pattern decoration */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 to-teal-550" />

              {/* Close Button */}
              <button
                onClick={() => setYourSpaceModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-605 p-1 hover:bg-gray-50 rounded-lg transition-colors border-0 bg-transparent cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-5 mt-2">
                <h3 className="text-lg font-black text-gray-800 font-sans">{locale === 'hi' ? 'आपका स्पेस' : 'Your Space'}</h3>
                <p className="text-xs text-gray-500 font-sans mt-0.5">{locale === 'hi' ? 'अपने सक्रिय आवेदनों और बुकिंग की निगरानी करें' : 'Monitor your active applications and bookings'}</p>
              </div>

              <div className="overflow-y-auto pr-1 flex-1 space-y-6 custom-scrollbar">
                {/* Applied Jobs History */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5 font-sans">
                    💼 {locale === 'en' ? 'Applied Jobs' : 'आवेदन की गई नौकरियां'}
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">{myAppliedJobs.length}</span>
                  </h4>
                  {loadingProfileHistory ? (
                    <div className="text-center py-4 text-xs text-gray-450 animate-pulse">{locale === 'en' ? 'Loading application history...' : 'इतिहास लोड हो रहा है...'}</div>
                  ) : myAppliedJobs.length === 0 ? (
                    <p className="text-[11px] text-gray-400 italic text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 font-sans">
                      {locale === 'en' ? 'No job applications yet.' : 'अभी तक कोई नौकरी के लिए आवेदन नहीं है।'}
                    </p>
                  ) : (
                    <div className="space-y-2 pr-1">
                      {myAppliedJobs.map(job => (
                        <div key={job._id} className="p-3.5 bg-gray-50 border border-gray-150 rounded-2xl flex items-center justify-between gap-3 text-xs font-sans hover:bg-gray-100/60 transition-colors">
                          <div className="min-w-0 flex-1 text-left">
                            <p className="font-bold text-gray-800 truncate">{job.title}</p>
                            <p className="text-[10px] text-gray-400 truncate mt-0.5">{job.company} — {job.village || 'Nearby'}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                              job.applicants?.find(a => (a.userId?._id || a.userId)?.toString() === user?._id?.toString())?.status === 'hired'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {job.applicants?.find(a => (a.userId?._id || a.userId)?.toString() === user?._id?.toString())?.status || 'applied'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCancelJobApplication(job._id)}
                              className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border-0 cursor-pointer font-bold flex items-center justify-center gap-1 text-[10px]"
                              title={locale === 'en' ? 'Withdraw Application' : 'आवेदन रद्द करें'}
                            >
                              <X className="w-3 h-3" /> {locale === 'en' ? 'Cancel' : 'रद्द करें'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Booked Labours History */}
                <div className="space-y-2.5 pt-4 border-t border-gray-100 pb-2">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5 font-sans">
                    🛠️ {locale === 'en' ? 'Booked Labour Services' : 'बुक की गई श्रम सेवाएं'}
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">{myBookedLabours.length}</span>
                  </h4>
                  {loadingProfileHistory ? (
                    <div className="text-center py-4 text-xs text-gray-450 animate-pulse">{locale === 'en' ? 'Loading booking history...' : 'इतिहास लोड हो रहा है...'}</div>
                  ) : myBookedLabours.length === 0 ? (
                    <p className="text-[11px] text-gray-400 italic text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 font-sans">
                      {locale === 'en' ? 'No bookings yet.' : 'अभी तक कोई बुकिंग नहीं है।'}
                    </p>
                  ) : (
                    <div className="space-y-2 pr-1 font-sans">
                      {myBookedLabours.map(booking => (
                        <div key={booking.requestId} className="p-3.5 bg-gray-50 border border-gray-150 rounded-2xl flex items-center justify-between gap-3 text-xs hover:bg-gray-100/60 transition-colors">
                          <div className="min-w-0 flex-1 text-left">
                            <p className="font-bold text-gray-800 truncate">{booking.workerName}</p>
                            <p className="text-[10px] text-gray-400 capitalize mt-0.5">{t(`labour.skills.${booking.skill}`) || booking.skill} — {booking.contactNumber}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                              booking.status === 'accepted'
                                ? 'bg-green-100 text-green-700'
                                : booking.status === 'rejected'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {booking.status}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCancelLabourBooking(booking.workerId, booking.requestId)}
                              className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border-0 cursor-pointer font-bold flex items-center justify-center gap-1 text-[10px]"
                              title={locale === 'en' ? 'Cancel Booking' : 'बुकिंग रद्द करें'}
                            >
                              <X className="w-3 h-3" /> {locale === 'en' ? 'Cancel' : 'रद्द करें'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex justify-end border-t pt-4">
                <button
                  type="button"
                  onClick={() => setYourSpaceModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-xs transition-colors cursor-pointer border-0 text-center font-sans"
                >
                  {locale === 'en' ? 'Close' : 'बंद करें'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;