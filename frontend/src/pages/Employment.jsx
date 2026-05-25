import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { CONFIG } from '../utils/constants';
import {
  Briefcase, MapPin, IndianRupee, Users, Search,
  Clock, Loader, Check, MessageCircle, ChevronDown,
  AlertTriangle, Package, Wifi, X, Star
} from 'lucide-react';

/* ─── Distance badge ─── */
const DistanceBadge = ({ info }) => {
  if (!info || info.val === 9999) return null;
  const { val, label, type } = info;
  let cls = 'bg-blue-50 text-blue-700 border-blue-100';
  let dot = '🔵';
  if (type === 'gps') {
    if (val < 1)        { cls = 'bg-emerald-50 text-emerald-700 border-emerald-100'; dot = '🟢'; }
    else if (val <= 10) { cls = 'bg-teal-50 text-teal-700 border-teal-100'; dot = '🔵'; }
    else if (val <= 25) { cls = 'bg-amber-50 text-amber-700 border-amber-100'; dot = '🟡'; }
    else                { cls = 'bg-rose-50 text-rose-700 border-rose-100'; dot = '🔴'; }
  } else if (type === 'text') {
    if (val === 0.1) cls = 'bg-emerald-50 text-emerald-700 border-emerald-100';
    else if (val === 10) cls = 'bg-teal-50 text-teal-700 border-teal-100';
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}>
      {dot} {label}
    </span>
  );
};

const Employment = () => {
  const socket = useSocket();
  const { t, locale } = useLanguage();
  const isEn = locale === 'en';
  const { token, user } = useAuth();
  const [searchParams] = useSearchParams();
  const villageParam = searchParams.get('village');
  const navigate = useNavigate();

  const [jobs, setJobs]                     = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [searchTerm, setSearchTerm]         = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedWorkMode, setSelectedWorkMode] = useState('all');
  const [selectedSalaryType, setSelectedSalaryType] = useState('all');
  const [selectedSalaryRange, setSelectedSalaryRange] = useState('all');
  const [selectedVacancyStatus, setSelectedVacancyStatus] = useState('all');
  const [filterNearest, setFilterNearest]   = useState(false);
  const [userCoords, setUserCoords]         = useState(null);

  /* Reviews state */
  const [expandedReviews, setExpandedReviews] = useState({});
  const [submitRatings,   setSubmitRatings]   = useState({});
  const [submitComments,  setSubmitComments]  = useState({});

  const toggleReviews = (jobId) => {
    setExpandedReviews(prev => ({ ...prev, [jobId]: !prev[jobId] }));
    if (!submitRatings[jobId]) {
      setSubmitRatings(prev => ({ ...prev, [jobId]: 5 }));
    }
  };

  const handleAddReview = async (e, jobId) => {
    e.preventDefault();
    if (!token) {
      alert(isEn ? 'Please log in to submit a review.' : 'समीक्षा सबमिट करने के लिए कृपया लॉग इन करें।');
      return;
    }
    const rating = submitRatings[jobId] || 5;
    const comment = submitComments[jobId] || '';

    try {
      const res = await axios.post(
        `${CONFIG.API_BASE_URL}/api/jobs/${jobId}/review`,
        { rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setJobs(prev => prev.map(j => j._id === jobId ? res.data.job : j));
      setSubmitComments(prev => ({ ...prev, [jobId]: '' }));
      setSubmitRatings(prev => ({ ...prev, [jobId]: 5 }));
    } catch (err) {
      alert(err.response?.data?.message || (isEn ? 'Failed to submit review.' : 'समीक्षा सबमिट करने में विफल।'));
    }
  };

  /* ── geo ── */
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => setUserCoords({ lat: coords.latitude, lng: coords.longitude }),
        () => { if (user?.location?.coordinates?.length === 2) setUserCoords({ lng: user.location.coordinates[0], lat: user.location.coordinates[1] }); }
      );
    } else if (user?.location?.coordinates?.length === 2) {
      setUserCoords({ lng: user.location.coordinates[0], lat: user.location.coordinates[1] });
    }
  }, [user]);

  /* ── fetch ── */
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${CONFIG.API_BASE_URL}/api/jobs`);
      setJobs(res.data); setError(null);
    } catch { setError(isEn ? 'Failed to fetch job openings.' : 'नौकरियां लोड करने में विफल।'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchJobs(); }, []);

  /* ── socket ── */
  useEffect(() => {
    if (!socket) return;
    const handler = (updated) => setJobs(prev => prev.map(j => j._id === updated._id ? updated : j));
    socket.on('job_updated', handler);
    return () => socket.off('job_updated', handler);
  }, [socket]);

  /* ── actions ── */
  const handleApply = async (jobId) => {
    if (!token) return alert(isEn ? 'Please log in to apply.' : 'आवेदन करने के लिए कृपया लॉग इन करें।');
    const job = jobs.find(j => j._id === jobId);
    if (job) {
      const employerId = job.businessId?.ownerId || (typeof job.postedBy === 'object' ? job.postedBy?._id : job.postedBy);
      if (user && employerId?.toString() === user._id?.toString()) {
        return alert(isEn ? 'You cannot apply to your own job!' : 'आप अपनी खुद की नौकरी के लिए आवेदन नहीं कर सकते!');
      }
    }
    try {
      const res = await axios.post(`${CONFIG.API_BASE_URL}/api/jobs/${jobId}/apply`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setJobs(prev => prev.map(j => j._id === jobId ? res.data : j));
      alert(isEn ? 'Application submitted successfully!' : 'आवेदन सफलतापूर्वक सबमिट हुआ!');
    } catch (err) { alert(err.response?.data?.message || (isEn ? 'Failed to submit application.' : 'आवेदन जमा करने में विफल।')); }
  };

  const handleChatWithEmployer = async (job) => {
    if (!token) return alert(isEn ? 'Please log in to chat with employers.' : 'नियोक्ताओं से चैट करने के लिए लॉग इन करें।');
    const eid = job.businessId?.ownerId || (typeof job.postedBy === 'object' ? job.postedBy?._id : job.postedBy);
    if (!eid) return alert(isEn ? 'Employer details not registered yet.' : 'नियोक्ता विवरण अभी पंजीकृत नहीं है।');
    if (eid === user?._id) return alert(isEn ? 'You posted this job vacancy!' : 'यह नौकरी आपने ही पोस्ट की है!');
    try {
      const res = await axios.post(`${CONFIG.API_BASE_URL}/api/chat/room`, { userId2: eid }, { headers: { Authorization: `Bearer ${token}` } });
      navigate(`/chat?roomId=${res.data._id}`);
    } catch { alert(isEn ? 'Failed to start chat with the employer.' : 'नियोक्ता से चैट शुरू करने में विफल।'); }
  };

  /* ── distance ── */
  const calculateDistance = (job) => {
    const jc = job.location || job.businessId?.location;
    if (userCoords && jc?.coordinates?.length === 2) {
      const [jLng, jLat] = jc.coordinates;
      const R = 6371, dLat = (jLat - userCoords.lat) * Math.PI / 180, dLon = (jLng - userCoords.lng) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(userCoords.lat*Math.PI/180)*Math.cos(jLat*Math.PI/180)*Math.sin(dLon/2)**2;
      const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return { val: d, label: `${d.toFixed(1)} km`, type: 'gps' };
    }
    if (user) {
      const uV = (user.village||'').toLowerCase(), uD = (user.district||'').toLowerCase(), uS = (user.state||'').toLowerCase();
      const jV = (job.businessId?.village||job.village||'').toLowerCase();
      const jD = (job.businessId?.district||job.district||'').toLowerCase();
      const jS = (job.businessId?.state||job.state||'').toLowerCase();
      if (uV && jV && uV === jV) return { val: 0.1, label: isEn ? 'Same Village' : 'समान गाँव', type: 'text' };
      if (uD && jD && uD === jD) return { val: 10, label: isEn ? 'Same District' : 'समान जिला', type: 'text' };
      if (uS && jS && uS === jS) return { val: 100, label: isEn ? 'Same State' : 'समान राज्य', type: 'text' };
    }
    return { val: 9999, label: job.workMode === 'remote' ? (isEn ? 'Remote' : 'रिमोट') : (job.businessId?.village || job.village || (isEn ? 'Nearby' : 'नज़दीकी')), type: 'unknown' };
  };

  const processedJobs = React.useMemo(() => {
    let result = jobs
      .filter(j => {
        const s = searchTerm.toLowerCase();
        return (j.title||'').toLowerCase().includes(s) || (j.company||'').toLowerCase().includes(s) || (j.description||'').toLowerCase().includes(s);
      })
      .filter(j => selectedCategory === 'all' || j.category === selectedCategory)
      .filter(j => selectedWorkMode === 'all' || j.workMode === selectedWorkMode)
      .filter(j => selectedSalaryType === 'all' || j.salaryType === selectedSalaryType)
      .filter(j => {
        if (selectedSalaryRange === 'all') return true;
        const sMin = j.salaryMin || 0;
        if (selectedSalaryRange === 'under5k') return sMin < 5000;
        if (selectedSalaryRange === '5k-15k') return sMin >= 5000 && sMin <= 15000;
        if (selectedSalaryRange === '15k-30k') return sMin > 15000 && sMin <= 30000;
        if (selectedSalaryRange === 'above30k') return sMin > 30000;
        return true;
      })
      .filter(j => {
        if (selectedVacancyStatus === 'open') {
          return j.filledCount < j.totalRequired;
        }
        return true;
      })
      .filter(j => {
        if (!villageParam) return true;
        const jV = (j.businessId?.village || j.village || '').toLowerCase();
        return jV === villageParam.toLowerCase();
      })
      .map(j => ({ ...j, _dist: calculateDistance(j) }));
    if (filterNearest) result.sort((a, b) => a._dist.val - b._dist.val);
    return result;
  }, [jobs, searchTerm, selectedCategory, selectedWorkMode, selectedSalaryType, selectedSalaryRange, selectedVacancyStatus, filterNearest, userCoords, user, villageParam]);

  const categories = [
    ['all', isEn ? 'All Categories' : 'सभी श्रेणियां'],
    ['agriculture', isEn ? 'Agriculture' : 'कृषि'],
    ['construction', isEn ? 'Construction' : 'निर्माण'],
    ['retail', isEn ? 'Retail & Sales' : 'खुदरा और बिक्री'],
    ['education', isEn ? 'Education' : 'शिक्षा'],
    ['healthcare', isEn ? 'Healthcare' : 'स्वास्थ्य सेवा'],
    ['it', isEn ? 'IT / Data Entry' : 'आईटी / डेटा एंट्री'],
    ['transport', isEn ? 'Transport / Delivery' : 'परिवहन / डिलीवरी'],
    ['manufacturing', isEn ? 'Manufacturing' : 'विनिर्माण'],
    ['other', isEn ? 'Other' : 'अन्य'],
  ];

  return (
    <div className="min-h-screen bg-[#f6f7f3] p-4 md:p-8 max-w-7xl mx-auto space-y-6">

      {/* ── HERO HEADER ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden bg-[#1a3a2a] rounded-3xl px-8 py-10 text-white shadow-xl"
      >
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-emerald-400/10 blur-2xl" />
        <div className="absolute bottom-0 left-16 w-32 h-32 rounded-full bg-amber-500/10 blur-xl" />
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-400/20 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">{t('employment.title')}</h1>
            <p className="text-white/55 text-sm mt-0.5">{t('employment.subtitle')}</p>
          </div>
        </div>
      </motion.div>

      {/* ── FILTER BAR ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        {/* Row 1: Search & Nearest */}
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder={t('common.search') || 'Search jobs, companies, descriptions...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-650"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Nearest toggle */}
          {user?.role !== 'admin' && (
            <button
              type="button"
              onClick={() => setFilterNearest(f => !f)}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold border shadow-sm transition-all active:scale-[0.98] ${
                filterNearest
                  ? 'bg-[#1a3a2a] text-white border-[#1a3a2a]'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
              }`}
            >
              <MapPin className={`w-4 h-4 ${filterNearest ? 'text-emerald-400' : 'text-emerald-600'}`} />
              {isEn ? 'Nearest First' : 'नज़दीकी पहले'}
            </button>
          )}
        </div>

        {/* Row 2: Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-gray-150 shadow-sm text-xs font-semibold">
          <span className="text-gray-400 uppercase tracking-wider text-[10px] mr-1">{isEn ? 'Filters:' : 'फ़िल्टर:'}</span>
          
          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="appearance-none bg-gray-50 border border-gray-200 rounded-xl pl-3 pr-8 py-2 text-gray-700 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              {categories.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          {/* Work Mode Dropdown */}
          <div className="relative">
            <select
              value={selectedWorkMode}
              onChange={e => setSelectedWorkMode(e.target.value)}
              className="appearance-none bg-gray-50 border border-gray-200 rounded-xl pl-3 pr-8 py-2 text-gray-700 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">{isEn ? 'All Modes' : 'सभी मोड'}</option>
              <option value="onsite">{isEn ? 'On-Site' : 'ऑन-साइट'}</option>
              <option value="remote">{isEn ? 'Remote' : 'रिमोट'}</option>
              <option value="hybrid">{isEn ? 'Hybrid' : 'हाइब्रिड'}</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          {/* Salary Payout Dropdown */}
          <div className="relative">
            <select
              value={selectedSalaryType}
              onChange={e => setSelectedSalaryType(e.target.value)}
              className="appearance-none bg-gray-50 border border-gray-200 rounded-xl pl-3 pr-8 py-2 text-gray-700 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">{isEn ? 'All Frequencies' : 'सभी अवधियां'}</option>
              <option value="monthly">{isEn ? 'Monthly' : 'मासिक'}</option>
              <option value="daily">{isEn ? 'Daily' : 'दैनिक'}</option>
              <option value="hourly">{isEn ? 'Hourly' : 'घंटेवार'}</option>
              <option value="fixed">{isEn ? 'Fixed' : 'निश्चित'}</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          {/* Salary Range Dropdown */}
          <div className="relative">
            <select
              value={selectedSalaryRange}
              onChange={e => setSelectedSalaryRange(e.target.value)}
              className="appearance-none bg-gray-50 border border-gray-200 rounded-xl pl-3 pr-8 py-2 text-gray-700 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">{isEn ? 'All Salary Ranges' : 'सभी वेतन सीमा'}</option>
              <option value="under5k">{isEn ? 'Under ₹5,000' : '₹5,000 से कम'}</option>
              <option value="5k-15k">{isEn ? '₹5,000 - ₹15,000' : '₹5,000 - ₹15,000'}</option>
              <option value="15k-30k">{isEn ? '₹15,000 - ₹30,000' : '₹15,000 - ₹30,000'}</option>
              <option value="above30k">{isEn ? 'Above ₹30,000' : '₹30,000 से अधिक'}</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          {/* Vacancy Status Dropdown */}
          <div className="relative">
            <select
              value={selectedVacancyStatus}
              onChange={e => setSelectedVacancyStatus(e.target.value)}
              className="appearance-none bg-gray-50 border border-gray-200 rounded-xl pl-3 pr-8 py-2 text-gray-700 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">{isEn ? 'All Vacancies' : 'सभी रिक्तियां'}</option>
              <option value="open">{isEn ? 'Open Positions Only' : 'केवल खाली पद'}</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          {/* Clear/Reset button */}
          {(selectedCategory !== 'all' || selectedWorkMode !== 'all' || selectedSalaryType !== 'all' || selectedSalaryRange !== 'all' || selectedVacancyStatus !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSelectedWorkMode('all');
                setSelectedSalaryType('all');
                setSelectedSalaryRange('all');
                setSelectedVacancyStatus('all');
              }}
              className="text-red-650 hover:text-red-700 ml-auto font-bold flex items-center gap-1 bg-transparent border-0 cursor-pointer transition-all"
            >
              <X className="w-3.5 h-3.5" />
              {isEn ? 'Reset' : 'रीसेट'}
            </button>
          )}
        </div>
      </motion.div>

      {/* ── STATES ── */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader className="animate-spin w-8 h-8 text-emerald-600" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 rounded-2xl px-5 py-4 text-sm font-medium">
          <AlertTriangle className="w-5 h-5 shrink-0" /> {error}
        </div>
      ) : processedJobs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Briefcase className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-black text-gray-700 mb-1">{isEn ? 'No jobs found' : 'कोई नौकरी नहीं मिली'}</h3>
          <p className="text-sm text-gray-400">{isEn ? 'Try adjusting your filters or check back later.' : 'अपने फिल्टर बदलें या बाद में जाँचें।'}</p>
        </motion.div>
      ) : (
        /* ── JOB CARDS ── */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {processedJobs.map((job, i) => {
            const filled   = Math.min(100, Math.round((job.filledCount / job.totalRequired) * 100));
            const isFull   = job.filledCount >= job.totalRequired;
            const hasApplied = user && job.applicants?.some(a => a.userId === user._id);
            const isRemote = job.workMode === 'remote';
            const employerId = job.businessId?.ownerId || (typeof job.postedBy === 'object' ? job.postedBy?._id : job.postedBy);
            const isOwn    = user && employerId === user._id;

            return (
              <motion.div
                key={job._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.35 }}
                className={`relative bg-white rounded-2xl border shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col ${
                  isFull ? 'border-red-100' : 'border-gray-100'
                }`}
              >
                {/* Closed ribbon */}
                {isFull && (
                  <div className="absolute top-5 right-[-30px] bg-red-500 text-white text-[10px] font-black px-10 py-0.5 rotate-45 shadow z-10 uppercase tracking-widest">
                    {isEn ? 'Closed' : 'बंद'}
                  </div>
                )}

                <div className="p-5 flex flex-col flex-1">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h3 className="font-black text-gray-800 text-base leading-snug truncate">{job.title}</h3>
                      <p className="text-sm text-gray-400 font-medium mt-0.5 truncate">{job.businessId?.name || job.company}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-xs font-bold text-gray-700">{job.rating > 0 ? job.rating : '0'}</span>
                        <span className="text-xs text-gray-400">({job.totalRatings || job.reviews?.length || 0})</span>
                      </div>
                    </div>
                    <span className={`shrink-0 flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                      isRemote
                        ? 'bg-blue-50 text-blue-700 border-blue-100'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    }`}>
                      {isRemote ? <><Wifi className="w-3 h-3" /> {isEn ? 'Remote' : 'रिमोट'}</> : (isEn ? 'On-site' : 'ऑन-साइट')}
                    </span>
                  </div>

                  {/* Description */}
                  {job.description && (
                    <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-4">{job.description}</p>
                  )}

                  {/* Meta pills */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl font-medium">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      {isRemote ? (isEn ? 'Remote' : 'रिमोट') : (job.businessId?.village || job.village || (isEn ? 'Nearby' : 'नज़दीकी'))}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl font-medium">
                      <IndianRupee className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ₹{job.salaryMin}{job.salaryMax ? `–₹${job.salaryMax}` : ''} / {job.salaryType}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl font-medium">
                      <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                    {user?.role !== 'admin' && job._dist && <DistanceBadge info={job._dist} />}
                  </div>

                  {/* Progress */}
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        {t('employment.openings')}
                      </span>
                      <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                        isFull ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {Math.max(0, job.totalRequired - job.filledCount)} {isEn ? 'left' : 'शेष'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${filled}%` }}
                        transition={{ delay: i * 0.05 + 0.3, duration: 0.6, ease: 'easeOut' }}
                        className={`h-2 rounded-full ${isFull ? 'bg-red-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'}`}
                      />
                    </div>
                    <p className="text-right text-[10px] text-gray-400 mt-1.5 font-medium">
                      {job.filledCount} {isEn ? 'of' : 'में से'} {job.totalRequired} {isEn ? 'hired' : 'भर्ती'}
                    </p>
                  </div>

                  {/* Action buttons */}
                  {user?.role !== 'admin' && (
                    <div className="flex gap-2.5 mt-4">
                    {(job.businessId?.ownerId || (typeof job.postedBy === 'object' ? job.postedBy?._id : job.postedBy)) !== user?._id && (
                      <button
                        type="button"
                        onClick={() => handleChatWithEmployer(job)}
                        className="bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all transform active:scale-95 text-sm"
                      >
                        <MessageCircle className="w-4 h-4" /> {isEn ? 'Chat' : 'चैट'}
                      </button>
                    )}
                      <button
                        type="button"
                        disabled={isFull || hasApplied || isOwn}
                        onClick={() => handleApply(job._id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                          isFull
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : hasApplied
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                            : isOwn
                            ? 'bg-amber-50/50 text-amber-800 border border-amber-200 cursor-default'
                            : 'bg-[#1a3a2a] hover:bg-[#1f4a35] text-white shadow-sm'
                        }`}
                      >
                        {isFull
                          ? (isEn ? 'Position Filled' : 'पद भर गया')
                          : hasApplied
                          ? <><Check className="w-4 h-4" /> {isEn ? 'Applied' : 'आवेदित'}</>
                          : isOwn
                          ? (isEn ? 'Your Listing' : 'आपकी प्रविष्टि')
                          : t('employment.applyNow')
                        }
                      </button>
                    </div>
                  )}
                </div>

                {/* Reviews Section */}
                <div className="border-t border-gray-100 px-5 py-3 bg-gray-50/50 rounded-b-2xl">
                    <button
                      onClick={() => toggleReviews(job._id)}
                      className="w-full flex items-center justify-between text-xs font-bold text-gray-600 hover:text-[#1a3a2a] transition-colors bg-transparent border-0 cursor-pointer p-0"
                    >
                      <span className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        {isEn ? `Reviews (${job.reviews?.length || 0})` : `समीक्षाएं (${job.reviews?.length || 0})`}
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedReviews[job._id] ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <AnimatePresence>
                      {expandedReviews[job._id] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          {job.reviews && job.reviews.length > 0 ? (
                            <div className="space-y-2.5 max-h-48 overflow-y-auto mt-3 pr-1">
                              {job.reviews.map((rev) => (
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

                          {!isOwn && token && user?.role !== 'admin' && !job.reviews?.some(r => r.userId?.toString() === user?._id?.toString() || r.userId === user?._id) && (
                            <form onSubmit={(e) => handleAddReview(e, job._id)} className="mt-3 pt-3 border-t border-gray-150 text-left space-y-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-bold text-gray-600 font-sans">{isEn ? 'Your Rating:' : 'आपकी रेटिंग:'}</span>
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((stars) => (
                                    <button
                                      key={stars}
                                      type="button"
                                      onClick={() => setSubmitRatings(prev => ({ ...prev, [job._id]: stars }))}
                                      className="p-0 border-0 bg-transparent cursor-pointer flex items-center"
                                    >
                                      <Star className={`w-4 h-4 transition-colors ${stars <= (submitRatings[job._id] || 5) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 hover:text-amber-300'}`} />
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={submitComments[job._id] || ''}
                                  onChange={(e) => setSubmitComments(prev => ({ ...prev, [job._id]: e.target.value }))}
                                  placeholder={isEn ? 'Write a review…' : 'समीक्षा लिखें…'}
                                  className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700 font-medium"
                                  required
                                />
                                <button
                                  type="submit"
                                  className="bg-[#1a3a2a] hover:bg-[#25523b] text-white font-bold text-xs px-3.5 rounded-xl active:scale-95 transition-all flex items-center justify-center shrink-0 border-0 cursor-pointer"
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
    </div>
  );
};

export default Employment;