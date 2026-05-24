import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { CONFIG, getDefaultAvatar } from '../utils/constants';
import {
  Wrench, MapPin, Star, Phone, MessageSquare, CheckCircle, Clock,
  Search, X, Loader, Award, Send, Filter, ChevronDown
} from 'lucide-react';

/* ─── Skill options (label resolves via t()) ─────────────────────────────── */
const SKILL_OPTIONS = [
  'electrician','plumber','mason','carpenter','mechanic',
  'painter','welder','driver','cook','security','cleaner',
  'farmer_labour','tailor','other'
];

const LabourServices = () => {
  const { t, locale } = useLanguage();
  const isEn = locale === 'en';
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const skillParam  = searchParams.get('skill');
  const villageParam = searchParams.get('village');

  const [searchTerm,    setSearchTerm]    = useState('');
  const [selectedSkill, setSelectedSkill] = useState(skillParam || 'all');
  const [labours,       setLabours]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);

  const [selectedAvailability, setSelectedAvailability] = useState('all');
  const [selectedChargeType,   setSelectedChargeType]   = useState('all');
  const [selectedRating,       setSelectedRating]       = useState('all');
  const [selectedRateRange,    setSelectedRateRange]    = useState('all');
  const [selectedSort,         setSelectedSort]         = useState('default');

  /* Modal state */
  const [requestModalOpen,   setRequestModalOpen]   = useState(false);
  const [selectedWorker,     setSelectedWorker]     = useState(null);
  const [requestNote,        setRequestNote]        = useState('');
  const [requestDateTime,    setRequestDateTime]    = useState('');
  const [requestOfferAmount, setRequestOfferAmount] = useState('');
  const [requestLoading,     setRequestLoading]     = useState(false);
  const [requestError,       setRequestError]       = useState('');
  const [requestSuccess,     setRequestSuccess]     = useState('');

  /* Reviews state */
  const [expandedReviews, setExpandedReviews] = useState({});
  const [submitRatings,   setSubmitRatings]   = useState({});
  const [submitComments,  setSubmitComments]  = useState({});

  const toggleReviews = (workerId) => {
    setExpandedReviews(prev => ({ ...prev, [workerId]: !prev[workerId] }));
    if (!submitRatings[workerId]) {
      setSubmitRatings(prev => ({ ...prev, [workerId]: 5 }));
    }
  };

  const handleAddReview = async (e, workerId) => {
    e.preventDefault();
    if (!token) {
      alert(isEn ? 'Please log in to submit a review.' : 'समीक्षा सबमिट करने के लिए कृपया लॉग इन करें।');
      return;
    }
    const rating = submitRatings[workerId] || 5;
    const comment = submitComments[workerId] || '';

    try {
      const res = await axios.post(
        `${CONFIG.API_BASE_URL}/api/labour/${workerId}/review`,
        { rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLabours(prev => prev.map(w => w._id === workerId ? res.data.profile : w));
      setSubmitComments(prev => ({ ...prev, [workerId]: '' }));
      setSubmitRatings(prev => ({ ...prev, [workerId]: 5 }));
    } catch (err) {
      alert(err.response?.data?.message || (isEn ? 'Failed to submit review.' : 'समीक्षा सबमिट करने में विफल।'));
    }
  };

  useEffect(() => { if (skillParam) setSelectedSkill(skillParam); }, [skillParam]);

  /* ── Data fetch ────────────────────────────────────────────────────────── */
  const fetchLabours = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${CONFIG.API_BASE_URL}/api/labour`);
      setLabours(res.data);
      setError(null);
    } catch {
      setError(isEn ? 'Failed to fetch labour profiles.' : 'श्रम प्रोफाइल लोड करने में विफल।');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLabours(); }, []);

  /* ── Chat handler ──────────────────────────────────────────────────────── */
  const handleChatWithWorker = async (workerUserId) => {
    if (!token) {
      alert(isEn ? 'Please log in to chat with workers.' : 'श्रमिकों से चैट करने के लिए कृपया लॉग इन करें।');
      return;
    }
    if (!workerUserId || workerUserId.toString() === user?._id?.toString()) return;
    try {
      const res = await axios.post(
        `${CONFIG.API_BASE_URL}/api/chat/room`,
        { userId2: workerUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate(`/chat?roomId=${res.data._id}`);
    } catch {
      alert(isEn ? 'Failed to start chat.' : 'चैट शुरू करने में विफल।');
    }
  };

  /* ── Service request handler ───────────────────────────────────────────── */
  const handleSendServiceRequest = async (e) => {
    e.preventDefault();
    if (!selectedWorker) return;
    setRequestLoading(true);
    setRequestError('');
    setRequestSuccess('');

    let coordinates = user?.location?.coordinates || [];
    const getCoords = () => new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(coordinates);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve([pos.coords.longitude, pos.coords.latitude]),
        ()    => resolve(coordinates),
        { timeout: 3000 }
      );
    });

    try {
      const coords = await getCoords();
      await axios.post(
        `${CONFIG.API_BASE_URL}/api/labour/${selectedWorker._id}/request`,
        {
          clientLocation: { village: user?.village || 'Nearby', coordinates: coords },
          note: requestNote,
          dateTime:     requestDateTime    || undefined,
          offerAmount:  requestOfferAmount ? Number(requestOfferAmount) : undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequestSuccess(t('labour.requestSuccess') || (isEn ? 'Service request sent successfully!' : 'सेवा अनुरोध सफलतापूर्वक भेजा गया!'));
      setRequestNote(''); setRequestDateTime(''); setRequestOfferAmount('');
      setTimeout(() => { closeModal(); }, 2200);
    } catch (err) {
      setRequestError(err.response?.data?.message || (isEn ? 'Failed to send service request.' : 'सेवा अनुरोध भेजने में विफल।'));
    } finally {
      setRequestLoading(false);
    }
  };

  const closeModal = () => {
    setRequestModalOpen(false);
    setSelectedWorker(null);
    setRequestNote('');
    setRequestDateTime('');
    setRequestOfferAmount('');
    setRequestSuccess('');
    setRequestError('');
  };

  const openRequestModal = (worker) => {
    const workerUserId = worker.userId?._id || worker.userId;
    if (user && workerUserId?.toString() === user._id?.toString()) {
      return alert(isEn ? 'You cannot hire yourself!' : 'आप खुद को काम पर नहीं रख सकते!');
    }
    setSelectedWorker(worker);
    setRequestNote(''); setRequestDateTime(''); setRequestOfferAmount('');
    setRequestError(''); setRequestSuccess('');
    setRequestModalOpen(true);
  };

  /* ── Filter & Sort ───────────────────────────────────────────────────────── */
  const filteredLabours = React.useMemo(() => {
    return labours
      .filter(labour => {
        const skillLabel = t(`labour.skills.${labour.skill}`) || '';
        const matchesSearch =
          (labour.name   || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (labour.village || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          skillLabel.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesSkill = selectedSkill === 'all' || labour.skill === selectedSkill;
        const matchesVillage = !villageParam || (labour.village || '').toLowerCase() === villageParam.toLowerCase();
        
        const matchesAvailability = selectedAvailability === 'all' || 
          (selectedAvailability === 'available' ? labour.isAvailable : !labour.isAvailable);
        
        const matchesChargeType = selectedChargeType === 'all' || labour.chargeType === selectedChargeType;
        
        const matchesRating = selectedRating === 'all' || labour.rating >= Number(selectedRating);
        
        let matchesRateRange = true;
        if (selectedRateRange === 'under300') {
          matchesRateRange = labour.serviceCharge < 300;
        } else if (selectedRateRange === '300-600') {
          matchesRateRange = labour.serviceCharge >= 300 && labour.serviceCharge <= 600;
        } else if (selectedRateRange === 'above600') {
          matchesRateRange = labour.serviceCharge > 600;
        }

        return matchesSearch && matchesSkill && matchesVillage && matchesAvailability && matchesChargeType && matchesRating && matchesRateRange;
      })
      .sort((a, b) => {
        if (selectedSort === 'chargeAsc') {
          return (a.serviceCharge || 0) - (b.serviceCharge || 0);
        }
        if (selectedSort === 'chargeDesc') {
          return (b.serviceCharge || 0) - (a.serviceCharge || 0);
        }
        if (selectedSort === 'ratingDesc') {
          return (b.rating || 0) - (a.rating || 0);
        }
        return 0;
      });
  }, [labours, searchTerm, selectedSkill, villageParam, selectedAvailability, selectedChargeType, selectedRating, selectedRateRange, selectedSort, t]);

  /* ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 md:px-8">

        {/* ── Hero banner ─────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-400 p-7 md:p-10 text-white shadow-xl">
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-white/5" />

          <div className="relative">
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {t('labour.title')}
              </h1>
            </div>
            <p className="text-emerald-100 text-sm md:text-base mt-1 max-w-xl">
              {t('labour.subtitle')}
            </p>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-4 mt-5">
              {[
                { value: labours.length,  label: isEn ? 'Workers' : 'श्रमिक' },
                { value: labours.filter(l => l.isAvailable).length, label: isEn ? 'Available' : 'उपलब्ध' },
                { value: [...new Set(labours.map(l => l.skill))].length, label: isEn ? 'Skills' : 'कौशल' },
              ].map((stat, i) => (
                <div key={i} className="bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-2.5 text-center min-w-[70px]">
                  <div className="text-xl font-black">{stat.value}</div>
                  <div className="text-xs text-emerald-100">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Advanced Search & Filter Panel ─────────────────────────────────── */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4 text-left">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('labour.search') || (isEn ? 'Search by name, village, or skill…' : 'नाम, गाँव या कौशल खोजें…')}
                className="w-full pl-11 pr-10 py-3 rounded-2xl bg-gray-55 border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-450 transition-all font-semibold"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 border-0 bg-transparent cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Sorting Dropdown */}
            <div className="relative min-w-[200px]">
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm text-gray-700 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-455 cursor-pointer"
              >
                <option value="default">{isEn ? 'Default' : 'डिफ़ॉल्ट'}</option>
                <option value="chargeAsc">{isEn ? 'Price: Low to High' : 'मूल्य: कम से अधिक'}</option>
                <option value="chargeDesc">{isEn ? 'Price: High to Low' : 'मूल्य: अधिक से कम'}</option>
                <option value="ratingDesc">{isEn ? 'Highest Rated' : 'उच्चतम रेटिंग'}</option>
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5 pt-2">
            {/* Skill Filter */}
            <div className="relative">
              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl bg-gray-50/50 border border-gray-200 text-xs text-gray-700 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
              >
                <option value="all">{isEn ? 'All Skills' : 'सभी कौशल'}</option>
                {SKILL_OPTIONS.map(skill => (
                  <option key={skill} value={skill}>
                    {t(`labour.skills.${skill}`) || skill}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Availability Filter */}
            <div className="relative">
              <select
                value={selectedAvailability}
                onChange={(e) => setSelectedAvailability(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl bg-gray-50/50 border border-gray-200 text-xs text-gray-700 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
              >
                <option value="all">{isEn ? 'All Availability' : 'सभी उपलब्धता'}</option>
                <option value="available">{isEn ? 'Available Now' : 'अभी उपलब्ध'}</option>
                <option value="busy">{isEn ? 'Currently Busy' : 'वर्तमान में व्यस्त'}</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Charge Type Filter */}
            <div className="relative">
              <select
                value={selectedChargeType}
                onChange={(e) => setSelectedChargeType(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl bg-gray-50/50 border border-gray-200 text-xs text-gray-700 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
              >
                <option value="all">{isEn ? 'All Rate Types' : 'दर के सभी प्रकार'}</option>
                <option value="daily">{isEn ? 'Daily Rate' : 'दैनिक दर'}</option>
                <option value="hourly">{isEn ? 'Hourly Rate' : 'प्रति घंटा दर'}</option>
                <option value="fixed">{isEn ? 'Fixed Rate' : 'निश्चित दर'}</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Rate Range Filter */}
            <div className="relative">
              <select
                value={selectedRateRange}
                onChange={(e) => setSelectedRateRange(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl bg-gray-50/50 border border-gray-200 text-xs text-gray-700 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
              >
                <option value="all">{isEn ? 'All Rates' : 'सभी दरें'}</option>
                <option value="under300">{isEn ? 'Under ₹300' : '₹300 से कम'}</option>
                <option value="300-600">{isEn ? '₹300 - ₹600' : '₹300 - ₹600'}</option>
                <option value="above600">{isEn ? 'Above ₹600' : '₹600 से अधिक'}</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Rating Filter */}
            <div className="relative">
              <select
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl bg-gray-50/50 border border-gray-200 text-xs text-gray-700 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
              >
                <option value="all">{isEn ? 'All Ratings' : 'सभी रेटिंग'}</option>
                <option value="4.5">{isEn ? '4.5+ Stars' : '4.5+ स्टार'}</option>
                <option value="4.0">{isEn ? '4.0+ Stars' : '4.0+ स्टार'}</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Reset Filters Option */}
          {(searchTerm || selectedSkill !== 'all' || selectedAvailability !== 'all' || selectedChargeType !== 'all' || selectedRateRange !== 'all' || selectedRating !== 'all' || selectedSort !== 'default') && (
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSkill('all');
                  setSelectedAvailability('all');
                  setSelectedChargeType('all');
                  setSelectedRateRange('all');
                  setSelectedRating('all');
                  setSelectedSort('default');
                }}
                className="text-xs font-bold text-red-500 hover:text-red-650 flex items-center gap-1 bg-transparent border-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                {isEn ? 'Reset All Filters' : 'सभी फ़िल्टर साफ़ करें'}
              </button>
            </div>
          )}
        </div>

        {/* ── Results label ───────────────────────────────────────────── */}
        {!loading && !error && (
          <p className="text-xs text-gray-400 font-medium px-1">
            {isEn
              ? `Showing ${filteredLabours.length} worker${filteredLabours.length !== 1 ? 's' : ''}`
              : `${filteredLabours.length} श्रमिक मिले`}
          </p>
        )}

        {/* ── States ──────────────────────────────────────────────────── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader className="animate-spin text-emerald-500 w-10 h-10" />
            <p className="text-sm text-gray-400">{isEn ? 'Loading workers…' : 'श्रमिक लोड हो रहे हैं…'}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 font-medium text-sm">
            {error}
          </div>
        )}

        {/* ── Worker grid ─────────────────────────────────────────────── */}
        {!loading && !error && filteredLabours.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredLabours.map((worker, index) => {
              const workerUserId = worker.userId?._id || worker.userId;
              const avatarUrl = worker.profileImage || getDefaultAvatar(worker.userId?.gender || 'male');
              const isSelf = workerUserId?.toString() === user?._id?.toString();
              const ratingDisplay = worker.rating > 0 ? worker.rating : '4.5';
              const reviewCount   = worker.totalRatings || worker.reviews?.length || 12;

              return (
                <motion.div
                  key={worker._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.3 }}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
                >
                  {/* Card top strip */}
                  <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-teal-400" />

                  <div className="p-5 flex flex-col flex-1">
                    {/* Header row */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="relative shrink-0">
                        <img
                          src={avatarUrl}
                          alt={worker.name}
                          className="w-16 h-16 rounded-2xl object-cover bg-emerald-50 border border-gray-100"
                        />
                        {worker.isVerified && (
                          <span className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-0.5">
                            <Award className="w-3 h-3" />
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-gray-900 text-base leading-tight truncate">{worker.name}</h3>
                          {/* Availability pill */}
                          <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            worker.isAvailable
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-600'
                          }`}>
                            {worker.isAvailable
                              ? <><CheckCircle className="w-3 h-3" />{t('labour.available') || (isEn ? 'Available' : 'उपलब्ध')}</>
                              : <><Clock className="w-3 h-3" />{t('labour.busy') || (isEn ? 'Busy' : 'व्यस्त')}</>
                            }
                          </span>
                        </div>

                        <p className="text-emerald-600 text-xs font-semibold mt-0.5">
                          {t(`labour.skills.${worker.skill}`) || worker.skill}
                        </p>

                        {/* Rating */}
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-xs font-bold text-gray-700">{ratingDisplay}</span>
                          <span className="text-xs text-gray-400">({reviewCount})</span>
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    {worker.bio && (
                      <p className="text-gray-500 text-xs leading-relaxed mb-3 line-clamp-2 italic border-l-2 border-emerald-200 pl-2.5">
                        {worker.bio}
                      </p>
                    )}

                    {/* Info chips */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1">
                        <MapPin className="w-3 h-3 text-emerald-500" />
                        {worker.village || (isEn ? 'Nearby' : 'पास में')}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1">
                        <Phone className="w-3 h-3 text-gray-400" />
                        {worker.contactNumber}
                      </span>
                      {worker.whatsapp && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-green-50 border border-green-100 rounded-lg px-2.5 py-1">
                          <MessageSquare className="w-3 h-3 text-green-500" />
                          {isEn ? 'WhatsApp' : 'व्हाट्सएप'}
                        </span>
                      )}
                    </div>

                    {/* Rate */}
                    <div className="flex items-center justify-between bg-emerald-50 rounded-2xl px-4 py-2.5 mb-4">
                      <span className="text-xs text-gray-500 font-medium">
                        {isEn ? 'Service Rate' : 'सेवा दर'}
                      </span>
                      <span className="font-extrabold text-gray-800 text-base">
                        ₹{worker.serviceCharge || '300'}
                        <span className="text-gray-400 text-xs font-medium ml-1">
                          {worker.chargeType === 'daily'
                            ? (t('labour.perDay') || (isEn ? '/ day' : '/ दिन'))
                            : (isEn ? '/ hr' : '/ घंटा')}
                        </span>
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-auto grid grid-cols-3 gap-2">
                      {/* Call */}
                      <a
                        href={`tel:${worker.contactNumber}`}
                        className="col-span-1 flex flex-col items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-2xl py-2.5 text-[11px] font-bold transition-all shadow-sm"
                      >
                        <Phone className="w-4 h-4" />
                        {t('labour.call') || (isEn ? 'Call' : 'कॉल')}
                      </a>

                      {!isSelf ? (
                        <>
                          {/* Chat */}
                          <button
                            onClick={() => handleChatWithWorker(workerUserId)}
                            className="col-span-1 flex flex-col items-center justify-center gap-1 bg-white border border-emerald-200 hover:bg-emerald-50 active:scale-95 text-emerald-700 rounded-2xl py-2.5 text-[11px] font-bold transition-all"
                          >
                            <MessageSquare className="w-4 h-4" />
                            {t('labour.message') || (isEn ? 'Chat' : 'चैट')}
                          </button>

                          {/* Request */}
                          <button
                            onClick={() => openRequestModal(worker)}
                            className="col-span-1 flex flex-col items-center justify-center gap-1 bg-gradient-to-b from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 active:scale-95 text-white rounded-2xl py-2.5 text-[11px] font-bold transition-all shadow-sm"
                          >
                            <Send className="w-4 h-4" />
                            {isEn ? 'Hire' : 'बुक'}
                          </button>
                        </>
                      ) : (
                        <div className="col-span-2 flex items-center justify-center text-xs text-gray-400 italic">
                          {isEn ? 'Your profile' : 'आपकी प्रोफ़ाइल'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reviews Section */}
                  <div className="border-t border-gray-100 px-5 py-3 bg-gray-50/50">
                    <button
                      onClick={() => toggleReviews(worker._id)}
                      className="w-full flex items-center justify-between text-xs font-bold text-gray-600 hover:text-emerald-600 transition-colors bg-transparent border-0 cursor-pointer p-0"
                    >
                      <span className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        {isEn ? `Reviews (${worker.reviews?.length || 0})` : `समीक्षाएं (${worker.reviews?.length || 0})`}
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedReviews[worker._id] ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <AnimatePresence>
                      {expandedReviews[worker._id] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          {worker.reviews && worker.reviews.length > 0 ? (
                            <div className="space-y-2.5 max-h-48 overflow-y-auto mt-3 pr-1">
                              {worker.reviews.map((rev) => (
                                <div key={rev._id || rev.createdAt} className="bg-white p-2.5 rounded-xl border border-gray-100 text-left">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-gray-800 text-xs">{rev.name}</span>
                                    <div className="flex items-center gap-0.5">
                                      {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-3 h-3 ${i < rev.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                                      ))}
                                    </div>
                                  </div>
                                  <p className="text-gray-600 text-[11px] leading-normal">{rev.comment}</p>
                                  <span className="text-[9px] text-gray-400 block mt-1">{new Date(rev.createdAt).toLocaleDateString()}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] text-gray-400 italic text-center mt-3 py-2 bg-white rounded-xl border border-dashed border-gray-200">
                              {isEn ? 'No reviews yet. Be the first!' : 'अभी तक कोई समीक्षा नहीं है। पहली समीक्षा लिखें!'}
                            </p>
                          )}

                          {!isSelf && token && !worker.reviews?.some(r => r.userId?.toString() === user?._id?.toString() || r.userId === user?._id) && (
                            <form onSubmit={(e) => handleAddReview(e, worker._id)} className="mt-3 pt-3 border-t border-gray-150 text-left space-y-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-bold text-gray-600 font-sans">{isEn ? 'Your Rating:' : 'आपकी रेटिंग:'}</span>
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((stars) => (
                                    <button
                                      key={stars}
                                      type="button"
                                      onClick={() => setSubmitRatings(prev => ({ ...prev, [worker._id]: stars }))}
                                      className="p-0 border-0 bg-transparent cursor-pointer flex items-center"
                                    >
                                      <Star className={`w-4 h-4 transition-colors ${stars <= (submitRatings[worker._id] || 5) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 hover:text-amber-300'}`} />
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={submitComments[worker._id] || ''}
                                  onChange={(e) => setSubmitComments(prev => ({ ...prev, [worker._id]: e.target.value }))}
                                  placeholder={isEn ? 'Write a review…' : 'समीक्षा लिखें…'}
                                  className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-450 text-gray-700 font-medium"
                                  required
                                />
                                <button
                                  type="submit"
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 rounded-xl active:scale-95 transition-all flex items-center justify-center shrink-0 border-0 cursor-pointer"
                                >
                                  {isEn ? 'Post' : 'पोस्ट'}
                                </button>
                              </div>
                            </form>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ── Empty state ─────────────────────────────────────────────── */}
        {!loading && !error && filteredLabours.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-4">
              <Wrench className="w-9 h-9 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-1">
              {isEn ? 'No workers found' : 'कोई श्रमिक नहीं मिला'}
            </h3>
            <p className="text-sm text-gray-400 max-w-xs">
              {isEn ? 'Try adjusting your search or skill filter.' : 'कृपया अपनी खोज या कौशल फ़िल्टर बदलें।'}
            </p>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* Service Request Modal                                            */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {requestModalOpen && selectedWorker && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', damping: 28, stiffness: 340 }}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              {/* Modal header */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-white font-bold text-base flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    {t('labour.requestModalTitle') || (isEn ? 'Send Service Request' : 'सेवा अनुरोध भेजें')}
                  </h3>
                  <p className="text-emerald-100 text-xs mt-0.5">
                    {t('labour.requestModalSub') || (isEn ? 'Fill in the details below' : 'नीचे विवरण भरें')}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="bg-white/15 hover:bg-white/30 p-1.5 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Worker summary */}
              <div className="mx-5 mt-5 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 text-sm">
                <div className="font-bold text-gray-800 mb-1 flex items-center gap-2">
                  <img
                    src={selectedWorker.profileImage || getDefaultAvatar(selectedWorker.userId?.gender || 'male')}
                    alt={selectedWorker.name}
                    className="w-8 h-8 rounded-xl bg-emerald-100"
                  />
                  {selectedWorker.name}
                </div>
                <div className="text-xs text-gray-500 space-y-0.5">
                  <div>
                    <span className="font-medium text-gray-600">{isEn ? 'Skill' : 'कौशल'}:</span>{' '}
                    {t(`labour.skills.${selectedWorker.skill}`) || selectedWorker.skill}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">{isEn ? 'Rate' : 'दर'}:</span>{' '}
                    ₹{selectedWorker.serviceCharge}{' '}
                    {selectedWorker.chargeType === 'daily'
                      ? (t('labour.perDay') || (isEn ? '/ day' : '/ दिन'))
                      : (isEn ? '/ hr' : '/ घंटा')}
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSendServiceRequest} className="p-5 space-y-4">
                {requestError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-xs font-medium">
                    {requestError}
                  </div>
                )}
                {requestSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-xs font-medium flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> {requestSuccess}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">
                      {t('labour.requestDateTime') || (isEn ? 'Date & Time' : 'तारीख और समय')}
                    </label>
                    <input
                      type="datetime-local"
                      value={requestDateTime}
                      onChange={(e) => setRequestDateTime(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">
                      {t('labour.offerAmountLabel') || (isEn ? 'Offer Amount (₹)' : 'राशि (₹)')}
                    </label>
                    <input
                      type="number"
                      value={requestOfferAmount}
                      onChange={(e) => setRequestOfferAmount(e.target.value)}
                      placeholder="e.g. 500"
                      min="0"
                      className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">
                    {isEn ? 'Note (Optional)' : 'नोट (वैकल्पिक)'}
                  </label>
                  <textarea
                    value={requestNote}
                    onChange={(e) => setRequestNote(e.target.value)}
                    placeholder={t('labour.requestNotePlaceholder') || (isEn ? 'Describe the work you need…' : 'आवश्यक कार्य का विवरण दें…')}
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={requestLoading || !!requestSuccess}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
                >
                  {requestLoading
                    ? <><Loader className="animate-spin w-4 h-4" />{isEn ? 'Sending…' : 'भेजा जा रहा है…'}</>
                    : <><Send className="w-4 h-4" />{isEn ? 'Submit Request' : 'अनुरोध भेजें'}</>
                  }
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LabourServices;