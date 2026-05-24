import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { CONFIG, getDefaultAvatar } from '../utils/constants';
import {
  Sprout, Wrench, GraduationCap, Store, CloudRain,
  Briefcase, Users, TrendingUp, AlertCircle, BookOpen,
  School, Building, MapPin, Activity, Loader, Landmark,
  MessageSquare, X, Star, Phone, Send, CheckCircle, Clock,
  Calendar, Award, ChevronRight, Eye, Compass
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import AdminDashboard from './AdminDashboard';
import { useNavigate } from 'react-router-dom';

/* ─── Reusable stat card ─── */

  const renderAvatarBubbles = (list, isShop = false, isEn = true) => {
    const listToUse = list || [];
    if (listToUse.length === 0) {
      return (
        <div className="flex items-center gap-1.5 py-2 text-left">
          <div className="flex -space-x-2.5 overflow-hidden">
            <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover bg-gray-50 shrink-0" src={getDefaultAvatar('other')} alt="avatar" />
            <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover bg-gray-50 shrink-0" src={getDefaultAvatar('other')} alt="avatar" />
          </div>
          <span className="text-xs text-gray-450 font-semibold ml-1">
            +0 {isEn ? 'more' : 'और'}
          </span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 py-2 text-left">
        <div className="flex -space-x-2.5 overflow-hidden">
          {listToUse.slice(0, 3).map((item, idx) => {
            const gender = item.gender || item.userId?.gender;
            const img = isShop ? (item.logo || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(item.name)}`) : (item.profileImage || getDefaultAvatar(gender));
            return (
              <img
                key={item._id || idx}
                className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover bg-gray-50 shrink-0"
                src={img}
                alt=""
              />
            );
          })}
        </div>
        <span className="text-xs text-gray-450 font-semibold ml-1">
          + {Math.max(0, listToUse.length - 3)} {isEn ? 'more' : 'और'}
        </span>
      </div>
    );
  };

const StatCard = ({ icon: Icon, iconBg, iconColor, label, value, delay = 0, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4, ease: 'easeOut' }}
    onClick={onClick}
    className={`
      relative overflow-hidden bg-white rounded-2xl border border-gray-100
      shadow-sm hover:shadow-md transition-all duration-300 p-4
      flex items-center gap-3
      ${onClick ? 'cursor-pointer hover:border-gray-200 active:scale-[0.99]' : ''}
    `}
  >
    <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
      <Icon className={`w-5 h-5 ${iconColor}`} />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1 truncate">
        {label}
      </p>
      <p className="text-xl font-black text-gray-800 leading-none">{value}</p>
    </div>
  </motion.div>
);

/* ─── Village infrastructure card ─── */
const InfraCard = ({ icon: Icon, iconBg, iconColor, label, value, isFacility, onClick, delay, report, isEn }) => {
  const isZeroFacility = isFacility && value === 0;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.35 }}
      onClick={onClick}
      className={`
        bg-white rounded-2xl border border-gray-100 shadow-sm
        hover:shadow-md transition-all duration-300 p-4
        flex flex-col gap-2.5
        ${onClick ? 'cursor-pointer hover:border-gray-200 active:scale-[0.99]' : ''}
      `}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1.5 truncate">
          {label}
        </p>
        {isZeroFacility ? (
          <div className="space-y-1.5">
            <span className="inline-block text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md uppercase tracking-wide">
              {isEn ? 'Not Present' : 'उपलब्ध नहीं'}
            </span>
            {report?.nearestCity && (
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-2">
                <p className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5">{isEn ? 'Nearest' : 'निकटतम'}</p>
                <p className="text-xs font-semibold text-gray-700 leading-tight">
                  {isEn ? report.nearestCity.en : report.nearestCity.hi}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-2xl font-black text-gray-800 leading-none">{value}</p>
        )}
      </div>
    </motion.div>
  );
};

/* ─── Section heading ─── */
const SectionHeading = ({ children, sub }) => (
  <div className="mb-5">
    <h2 className="text-lg font-black text-gray-800 tracking-tight leading-tight">{children}</h2>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

const Dashboard = () => {
  const { token, user } = useAuth();
  const { t, locale } = useLanguage();
  const navigate = useNavigate();

  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  const [report, setReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError, setReportError] = useState('');

  const [globalStats, setGlobalStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    activeJobs: 0,
    localShops: 0,
    totalFarmers: 0,
    totalLabour: 0,
    activeLabour: 0,
    localProducts: 0,
  });

  const isEn = locale === 'en';

  const [showTeachersModal, setShowTeachersModal] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingLoadingTeachers] = useState(false);
  const [teachersError, setTeachersError] = useState('');

  // ── LOCAL DIRECTORY DYNAMIC STATES ──
  const [dirTab, setDirTab] = useState('all');
  const [dirTeachers, setDirTeachers] = useState([]);
  const [dirShops, setDirShops] = useState([]);
  const [dirLabour, setDirLabour] = useState([]);
  const [loadingDir, setLoadingDir] = useState(false);
  const [dirError, setDirError] = useState('');
  const [showShopsModal, setShowShopsModal] = useState(false);
  const [showLabourModal, setShowLabourModal] = useState(false);

  // ── LOCAL DIRECTORY EXPANDABLE/CONTACT STATES ──
  const [expandedTeacherId, setExpandedTeacherId] = useState(null);
  const [expandedShopId, setExpandedShopId] = useState(null);
  const [expandedLabourId, setExpandedLabourId] = useState(null);
  const [revealedContacts, setRevealedContacts] = useState({}); // id -> boolean

  const toggleContactReveal = (id) => {
    setRevealedContacts(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // ── LABOUR BOOKING STATES ──
  const [hireModalOpen, setHireModalOpen] = useState(false);
  const [selectedLabour, setSelectedLabour] = useState(null);
  const [hireNote, setHireNote] = useState('');
  const [hireDateTime, setHireDateTime] = useState('');
  const [hireOfferAmount, setHireOfferAmount] = useState('');
  const [hireLoading, setHireLoading] = useState(false);
  const [hireError, setHireError] = useState('');
  const [hireSuccess, setHireSuccess] = useState('');

  // Fetch Directory Data
  useEffect(() => {
    const fetchDirectoryData = async () => {
      if (!token || !user?.village) return;
      try {
        setLoadingDir(true);
        setDirError('');
        const [teachersRes, shopsRes, labourRes] = await Promise.all([
          axios.get(`${CONFIG.API_BASE_URL}/api/education/teachers`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${CONFIG.API_BASE_URL}/api/market/businesses?village=${encodeURIComponent(user.village)}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${CONFIG.API_BASE_URL}/api/labour?village=${encodeURIComponent(user.village)}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setDirTeachers(teachersRes.data);
        // Sync teachers for the existing modal as well
        setTeachers(teachersRes.data);
        setDirShops(shopsRes.data);
        setDirLabour(labourRes.data);
      } catch (err) {
        console.error('Error fetching directory data:', err);
        setDirError(isEn ? 'Failed to fetch directory data.' : 'निर्देशिका डेटा प्राप्त करने में विफल।');
      } finally {
        setLoadingDir(false);
      }
    };
    fetchDirectoryData();
  }, [token, user?.village]);

  // Sync teachers if modal is opened manually
  useEffect(() => {
    if (showTeachersModal && dirTeachers.length > 0) {
      setTeachers(dirTeachers);
    }
  }, [showTeachersModal, dirTeachers]);

  // Generic Chat Room Starter
  const handleStartChat = async (targetUserId) => {
    if (!token) {
      alert(isEn ? 'Please log in to chat.' : 'चैट करने के लिए कृपया लॉग इन करें।');
      return;
    }
    if (!targetUserId || targetUserId.toString() === user?._id?.toString()) return;
    try {
      const res = await axios.post(`${CONFIG.API_BASE_URL}/api/chat/room`, {
        userId2: targetUserId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate(`/chat?roomId=${res.data._id}`);
    } catch (err) {
      console.error(err);
      alert(isEn ? 'Failed to start chat.' : 'चैट शुरू करने में विफल।');
    }
  };

  const handleTeacherChat = handleStartChat;

  // Hire/Service request handler
  const handleSendHireRequest = async (e) => {
    e.preventDefault();
    if (!selectedLabour) return;
    setHireLoading(true);
    setHireError('');
    setHireSuccess('');

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
        `${CONFIG.API_BASE_URL}/api/labour/${selectedLabour._id}/request`,
        {
          clientLocation: { village: user?.village || 'Nearby', coordinates: coords },
          note: hireNote,
          dateTime: hireDateTime || undefined,
          offerAmount: hireOfferAmount ? Number(hireOfferAmount) : undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHireSuccess(isEn ? 'Service request sent successfully!' : 'सेवा अनुरोध सफलतापूर्वक भेजा गया!');
      setHireNote('');
      setHireDateTime('');
      setHireOfferAmount('');
      setTimeout(() => {
        setHireModalOpen(false);
        setSelectedLabour(null);
        setHireSuccess('');
      }, 2200);
    } catch (err) {
      setHireError(err.response?.data?.message || (isEn ? 'Failed to send request.' : 'अनुरोध भेजने में विफल।'));
    } finally {
      setHireLoading(false);
    }
  };

  useEffect(() => {
    const fetchReport = async () => {
      if (!token || !user?.village) return;
      try {
        setLoadingReport(true);
        const res = await axios.get(`${CONFIG.API_BASE_URL}/api/auth/village-report`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReport(res.data);
        setReportError('');
      } catch (err) {
        console.error(err);
        setReportError(
          isEn ? 'Failed to fetch village report.' : 'ग्राम रिपोर्ट प्राप्त करने में विफल।'
        );
      } finally {
        setLoadingReport(false);
      }
    };

    const fetchGlobalStats = async () => {
      if (!token) return;
      try {
        const res = await axios.get(`${CONFIG.API_BASE_URL}/api/auth/global-stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGlobalStats(res.data);
      } catch (err) {
        console.error('Failed to fetch global stats:', err);
      }
    };

    fetchReport();
    fetchGlobalStats();
  }, [token, user?.village]);

  /* ── Infrastructure items config ── */
  const infraItems = report
    ? [
        { icon: Building,      iconBg: 'bg-red-50',      iconColor: 'text-red-500',     label: isEn ? 'Hospitals' : 'अस्पताल',                value: report.hospitals,           isFacility: true },
        { icon: School,        iconBg: 'bg-blue-50',     iconColor: 'text-blue-500',    label: isEn ? 'Schools' : 'स्कूल',                     value: report.schools,             isFacility: true },
        { icon: GraduationCap, iconBg: 'bg-indigo-50',   iconColor: 'text-indigo-500',  label: isEn ? 'Colleges' : 'कॉलेज',                    value: report.colleges,            isFacility: true },
        { icon: BookOpen,      iconBg: 'bg-emerald-50',  iconColor: 'text-emerald-600', label: isEn ? 'Village Teachers' : 'ग्राम शिक्षक',     value: report.totalTeachers || 0,  onClick: () => setShowTeachersModal(true) },
        { icon: Store,         iconBg: 'bg-violet-50',   iconColor: 'text-violet-500',  label: isEn ? 'Total Shops' : 'कुल दुकानें',            value: report.totalShops,          onClick: () => navigate(`/marketplace?village=${encodeURIComponent(user.village)}`) },
        { icon: TrendingUp,    iconBg: 'bg-pink-50',     iconColor: 'text-pink-500',    label: isEn ? 'Local Products' : 'स्थानीय उत्पाद',      value: report.localProducts || 0,  onClick: () => navigate(`/marketplace?village=${encodeURIComponent(user.village)}`) },
        { icon: Wrench,        iconBg: 'bg-yellow-50',   iconColor: 'text-yellow-600',  label: isEn ? 'Total Labour' : 'कुल श्रमिक',           value: report.totalLabour || 0,    onClick: () => navigate(`/labour?village=${encodeURIComponent(user.village)}`) },
        { icon: Activity,      iconBg: 'bg-teal-50',     iconColor: 'text-teal-600',    label: isEn ? 'Active Labour' : 'सक्रिय श्रमिक',        value: report.activeLabour || 0,   onClick: () => navigate(`/labour?village=${encodeURIComponent(user.village)}`) },
        { icon: Briefcase,     iconBg: 'bg-orange-50',   iconColor: 'text-orange-500',  label: isEn ? 'Required Jobs' : 'आवश्यक नौकरियाँ',     value: report.totalVacancies || 0, onClick: () => navigate(`/employment?village=${encodeURIComponent(user.village)}`) },
        { icon: Users,         iconBg: 'bg-emerald-50',  iconColor: 'text-emerald-600', label: isEn ? 'Registered Users' : 'पंजीकृत उपयोगकर्ता', value: report.totalUsers },
        { icon: Activity,      iconBg: 'bg-sky-50',      iconColor: 'text-sky-500',     label: isEn ? 'Active Users' : 'सक्रिय उपयोगकर्ता',    value: report.activeUsers || 0 },
      ]
    : [];

  return (
    <div className="min-h-screen bg-[#f6f7f3] font-sans">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-10">

        {/* ── GLOBAL ANALYTICS (Only if user has NO village profile) ── */}
        {!user?.village && (
          <>
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <SectionHeading sub={isEn ? 'Platform-wide overview' : 'प्लेटफ़ॉर्म अवलोकन'}>
                {t('dashboard.analytics')}
              </SectionHeading>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                <StatCard icon={Users}      iconBg="bg-blue-50"     iconColor="text-blue-500"    label={isEn ? 'Total Users' : 'कुल उपयोगकर्ता'}     value={(globalStats.totalUsers    || 0).toLocaleString()} delay={0.02} />
                <StatCard icon={Activity}   iconBg="bg-sky-50"      iconColor="text-sky-500"     label={isEn ? 'Active Users' : 'सक्रिय उपयोगकर्ता'}  value={(globalStats.activeUsers   || 0).toLocaleString()} delay={0.04} />
                <StatCard icon={Store}      iconBg="bg-violet-50"   iconColor="text-violet-500"  label={isEn ? 'Local Shops' : 'स्थानीय दुकानें'}     value={(globalStats.localShops    || 0).toLocaleString()} delay={0.06} onClick={() => navigate('/marketplace')} />
                <StatCard icon={TrendingUp} iconBg="bg-pink-50"     iconColor="text-pink-500"    label={isEn ? 'Local Products' : 'स्थानीय उत्पाद'}   value={(globalStats.localProducts || 0).toLocaleString()} delay={0.08} onClick={() => navigate('/marketplace')} />
                <StatCard icon={Wrench}     iconBg="bg-yellow-50"   iconColor="text-yellow-600"  label={isEn ? 'Total Labour' : 'कुल श्रमिक'}        value={(globalStats.totalLabour   || 0).toLocaleString()} delay={0.10} onClick={() => navigate('/labour')} />
                <StatCard icon={Activity}   iconBg="bg-teal-50"     iconColor="text-teal-600"    label={isEn ? 'Active Labour' : 'सक्रिय श्रमिक'}     value={(globalStats.activeLabour  || 0).toLocaleString()} delay={0.12} onClick={() => navigate('/labour')} />
                <StatCard icon={Briefcase}  iconBg="bg-orange-50"   iconColor="text-orange-500"  label={isEn ? 'Active Jobs' : 'सक्रिय नौकरियाँ'}    value={(globalStats.activeJobs    || 0).toLocaleString()} delay={0.14} onClick={() => navigate('/employment')} />
                <StatCard icon={Sprout}     iconBg="bg-emerald-50"  iconColor="text-emerald-600" label={isEn ? 'Total Farmers' : 'कुल किसान'}        value={(globalStats.totalFarmers  || 0).toLocaleString()} delay={0.16} onClick={() => navigate('/farmer-ai')} />
              </div>
            </motion.section>

            <div className="border-t border-dashed border-gray-200" />
          </>
        )}

        {/* ── VILLAGE REPORT ── */}
        {user?.village ? (
          <>
            <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {/* Heading row */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <Landmark className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-800 leading-tight">
                    {isEn ? 'Village Report' : 'ग्राम रिपोर्ट'}
                  </h2>
                  <p className="text-sm font-semibold text-emerald-600 leading-tight">{user.village}</p>
                </div>
              </div>
              {report && (
                <span className="text-[11px] font-bold text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                  {report.district}, {report.state}
                </span>
              )}
            </div>

            {/* Loading */}
            {loadingReport && (
              <div className="flex justify-center items-center py-20 text-emerald-500">
                <Loader className="animate-spin w-7 h-7" />
              </div>
            )}

            {/* Error */}
            {reportError && !loadingReport && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 rounded-2xl px-5 py-4 text-sm font-medium">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {reportError}
              </div>
            )}

            {/* Report content */}
            {!loadingReport && report && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Left + Center — infrastructure + jobs */}
                <div className="lg:col-span-2 space-y-5">

                  {/* Infrastructure grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                    {infraItems.map(({ icon, iconBg, iconColor, label, value, isFacility, onClick }, i) => (
                      <InfraCard
                        key={label}
                        icon={icon}
                        iconBg={iconBg}
                        iconColor={iconColor}
                        label={label}
                        value={value}
                        isFacility={isFacility}
                        onClick={onClick}
                        delay={0.3 + i * 0.04}
                        report={report}
                        isEn={isEn}
                      />
                    ))}
                  </div>

                  {/* Active Jobs */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
                  >
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                        <Briefcase className="w-4 h-4 text-orange-500" />
                      </div>
                      <h3 className="font-black text-gray-800 text-sm">
                        {isEn ? 'Active Jobs In Village' : 'गाँव में सक्रिय नौकरियाँ'}
                      </h3>
                    </div>

                    {report.requiredJobs.length === 0 ? (
                      <p className="text-sm text-gray-400 py-4 text-center">
                        {isEn ? 'No active jobs posted right now.' : 'अभी कोई सक्रिय नौकरी उपलब्ध नहीं है।'}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {report.requiredJobs.map((job) => (
                          <div
                            key={job.id}
                            className="flex items-center justify-between gap-3 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-gray-800 text-sm truncate">{job.title}</p>
                              <p className="text-xs text-gray-400 mt-0.5 truncate">{job.company}</p>
                            </div>
                            <span className="shrink-0 bg-orange-100 text-orange-700 font-bold text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap">
                              {job.remaining} {isEn ? 'left' : 'शेष'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* Right — village details card */}
                <motion.div
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45, duration: 0.45 }}
                  className="lg:col-span-1 bg-[#0d3327] text-white rounded-2xl shadow-lg p-6 flex flex-col justify-between min-h-[360px]"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/10">
                      <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
                      <h3 className="font-bold text-sm tracking-wide">
                        {isEn ? 'Village Details' : 'गाँव का विवरण'}
                      </h3>
                    </div>

                    <div className="space-y-6">
                      {/* Literacy Rate */}
                      <div>
                        <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-2">
                          {isEn ? 'Literacy Rate' : 'साक्षरता दर'}
                        </p>
                        <p className="text-3xl font-black mb-3 leading-none">{report.literacyRate}%</p>
                        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                          <motion.div
                            className="bg-emerald-400 h-1.5 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${report.literacyRate}%` }}
                            transition={{ delay: 0.7, duration: 0.9, ease: 'easeOut' }}
                          />
                        </div>
                      </div>

                      {/* Primary Crop */}
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                          <Sprout className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-0.5">
                            {isEn ? 'Primary Crop' : 'मुख्य फसल'}
                          </p>
                          <p className="font-semibold text-sm leading-snug">
                            {isEn ? report.primaryCrop?.en : report.primaryCrop?.hi}
                          </p>
                        </div>
                      </div>

                      {/* Nearest City */}
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-0.5">
                            {isEn ? 'Nearest City' : 'निकटतम शहर'}
                          </p>
                          <p className="font-semibold text-sm leading-snug">
                            {isEn ? report.nearestCity?.en : report.nearestCity?.hi}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-white/10 flex justify-between items-center text-[10px] text-white/30 font-semibold uppercase tracking-wider">
                    <span>GramMitra AI Verified</span>
                    <span>{new Date().getFullYear()}</span>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.section>

          
          {/* ── LOCAL VILLAGE DIRECTORY REDESIGNED ── */}
          {user?.village && report && !loadingReport && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
              {/* Left Column: Category Grid Card */}
              <div className="lg:col-span-8 bg-white rounded-[32px] border border-gray-100 shadow-xs p-6 space-y-6">
                
                {/* Title & Tabs row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-50 pb-5">
                  <div className="text-left">
                    <h2 className="text-lg font-black text-gray-800 tracking-tight leading-tight flex items-center gap-2">
                      <Landmark className="w-5 h-5 text-emerald-600" />
                      {isEn ? 'Explore Local Directory' : 'स्थानीय निर्देशिका खोजें'}
                    </h2>
                    <p className="text-xs text-gray-450 mt-1">
                      {isEn ? `Find services, shops, and other amenities in ${user.village}` : `${user.village} में सेवाएं, दुकानों और अन्य सुविधाओं को खोजें।`}
                    </p>
                  </div>

                  {/* Filter tab buttons selector */}
                  <div className="flex bg-gray-50 border border-gray-200 p-1 rounded-2xl shrink-0 self-start md:self-auto overflow-x-auto scrollbar-none gap-0.5">
                    {[
                      { id: 'all', label: isEn ? 'All Categories' : 'सभी श्रेणी', count: dirTeachers.length + dirShops.length + dirLabour.length },
                      { id: 'teachers', label: isEn ? 'Teachers' : 'शिक्षक', count: dirTeachers.length },
                      { id: 'shops', label: isEn ? 'Shops & Products' : 'दुकानें और उत्पाद', count: dirShops.length },
                      { id: 'labour', label: isEn ? 'Labour Services' : 'श्रमिक सेवाएं', count: dirLabour.length }
                    ].map(tab => {
                      const isActive = dirTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setDirTab(tab.id)}
                          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border-0 ${
                            isActive
                              ? 'bg-white text-emerald-700 shadow-xs text-emerald-800 font-extrabold'
                              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/50 bg-transparent'
                          }`}
                        >
                          <span>{tab.label}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                            isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-200 text-gray-500'
                          }`}>
                            {tab.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Categories cards layout grid */}
                {loadingDir ? (
                  <div className="flex flex-col items-center justify-center py-16 text-emerald-600">
                    <Loader className="animate-spin w-8 h-8 mb-2" />
                    <p className="text-xs font-semibold animate-pulse">{isEn ? 'Loading directory...' : 'निर्देशिका लोड हो रही है...'}</p>
                  </div>
                ) : dirError ? (
                  <div className="bg-red-50 border border-red-100 text-red-655 rounded-2xl px-5 py-4 text-xs font-medium text-center">
                    {dirError}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* 1. TEACHERS CARD */}
                    {(dirTab === 'all' || dirTab === 'teachers') && (
                      <div className="bg-white border border-gray-150/75 rounded-3xl p-5 flex flex-col justify-between transition-all hover:shadow-xs text-left">
                        <div>
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                              <BookOpen className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                              <h3 className="font-extrabold text-gray-800 text-sm leading-tight flex items-center gap-1.5">
                                {isEn ? 'Teachers' : 'शिक्षक'}
                                <span className="bg-emerald-50 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded-md font-bold">
                                  {dirTeachers.length}
                                </span>
                              </h3>
                              <p className="text-xs text-gray-400 mt-1 leading-snug">{isEn ? 'Local teachers and tuitions' : 'स्थानीय शिक्षक और ट्यूशन'}</p>
                            </div>
                          </div>
                          <div className="mt-4">
                            {renderAvatarBubbles(dirTeachers, false, isEn)}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 mt-4 pt-3 border-t border-gray-50">
                          <button
                            type="button"
                            onClick={() => setShowTeachersModal(true)}
                            className="flex items-center justify-center gap-1 border border-gray-200 hover:bg-gray-50 text-gray-700 text-[11px] font-bold py-2 rounded-xl transition-all cursor-pointer bg-white"
                          >
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            {isEn ? 'Contact' : 'संपर्क करें'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowTeachersModal(true)}
                            className="flex items-center justify-center gap-1 bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-bold py-2 rounded-xl transition-all cursor-pointer border-0 shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            {isEn ? 'View All' : 'देखें सभी'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 2. SHOPS CARD */}
                    {(dirTab === 'all' || dirTab === 'shops') && (
                      <div className="bg-white border border-gray-150/75 rounded-3xl p-5 flex flex-col justify-between transition-all hover:shadow-xs text-left">
                        <div>
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                              <Store className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                              <h3 className="font-extrabold text-gray-800 text-sm leading-tight flex items-center gap-1.5">
                                {isEn ? 'Shops & Products' : 'दुकानें और उत्पाद'}
                                <span className="bg-indigo-50 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded-md font-bold">
                                  {dirShops.length}
                                </span>
                              </h3>
                              <p className="text-xs text-gray-400 mt-1 leading-snug">{isEn ? 'Local shops and available products' : 'स्थानीय दुकानें और उपलब्ध उत्पाद'}</p>
                            </div>
                          </div>
                          <div className="mt-4">
                            {renderAvatarBubbles(dirShops, true, isEn)}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 mt-4 pt-3 border-t border-gray-50">
                          <button
                            type="button"
                            onClick={() => setShowShopsModal(true)}
                            className="flex items-center justify-center gap-1 border border-gray-200 hover:bg-gray-50 text-gray-700 text-[11px] font-bold py-2 rounded-xl transition-all cursor-pointer bg-white"
                          >
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            {isEn ? 'Contact' : 'संपर्क करें'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowShopsModal(true)}
                            className="flex items-center justify-center gap-1 bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-bold py-2 rounded-xl transition-all cursor-pointer border-0 shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            {isEn ? 'View All' : 'देखें सभी'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 3. LABOUR CARD */}
                    {(dirTab === 'all' || dirTab === 'labour') && (
                      <div className="bg-white border border-gray-150/75 rounded-3xl p-5 flex flex-col justify-between transition-all hover:shadow-xs text-left">
                        <div>
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center shrink-0 border border-teal-100">
                              <Wrench className="w-6 h-6 text-teal-600" />
                            </div>
                            <div>
                              <h3 className="font-extrabold text-gray-800 text-sm leading-tight flex items-center gap-1.5">
                                {isEn ? 'Labour Services' : 'श्रमिक सेवाएं'}
                                <span className="bg-teal-50 text-teal-700 text-[10px] px-1.5 py-0.5 rounded-md font-bold">
                                  {dirLabour.length}
                                </span>
                              </h3>
                              <p className="text-xs text-gray-400 mt-1 leading-snug">{isEn ? 'Local workers and services' : 'स्थानीय श्रमिक और सेवाएं'}</p>
                            </div>
                          </div>
                          <div className="mt-4">
                            {renderAvatarBubbles(dirLabour, false, isEn)}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 mt-4 pt-3 border-t border-gray-50">
                          <button
                            type="button"
                            onClick={() => setShowLabourModal(true)}
                            className="flex items-center justify-center gap-1 border border-gray-200 hover:bg-gray-50 text-gray-700 text-[11px] font-bold py-2 rounded-xl transition-all cursor-pointer bg-white"
                          >
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            {isEn ? 'Contact' : 'संपर्क करें'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowLabourModal(true)}
                            className="flex items-center justify-center gap-1 bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-bold py-2 rounded-xl transition-all cursor-pointer border-0 shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            {isEn ? 'View All' : 'देखें सभी'}
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>

              {/* Right Column: Quick Action Tasks */}
              <div className="lg:col-span-4 bg-emerald-50/10 border border-emerald-100 rounded-[32px] p-6 text-left flex flex-col justify-between hover:shadow-xs transition-shadow">
                <div>
                  <h3 className="font-extrabold text-emerald-800 text-sm leading-tight flex items-center gap-1.5 border-b border-emerald-100 pb-3">
                    {isEn ? 'Quick Tasks' : 'त्वरित कार्य'}
                  </h3>
                  <div className="mt-4 space-y-4">
                    {[
                      { title: isEn ? 'Find Jobs' : 'नौकरी खोजें', desc: isEn ? 'Search local work openings' : 'अपने क्षेत्र में नौकरियां खोजें', icon: Briefcase, path: '/employment' },
                      { title: isEn ? 'Find Labour' : 'श्रमिक खोजें', desc: isEn ? 'Contact local workers' : 'उपलब्ध श्रमिकों से संपर्क करें', icon: Wrench, path: '/labour' },
                      { title: isEn ? 'Add Your Shop' : 'अपनी दुकान जोड़ें', desc: isEn ? 'Expand your business footprint' : 'अपना व्यवसाय बढ़ाएं', icon: Store, path: '/your-shop' },
                      { title: isEn ? 'Government Schemes' : 'सरकारी योजनाएं', desc: isEn ? 'Browse active welfare programs' : 'योजनाओं की जानकारी पाएं', icon: Landmark, path: '/schemes' }
                    ].map((item, idx) => {
                      const IconComponent = item.icon;
                      return (
                        <div
                          key={idx}
                          onClick={() => navigate(item.path)}
                          className="flex items-center justify-between p-3 rounded-2xl bg-white border border-gray-100 hover:border-emerald-200/50 hover:bg-emerald-50/10 shadow-xs hover:shadow-sm transition-all duration-200 cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50/60 group-hover:bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100/30">
                              <IconComponent className="w-5 h-5 text-emerald-700" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-gray-800 text-xs leading-none">{item.title}</p>
                              <p className="text-[10px] text-gray-450 mt-1 leading-tight truncate">{item.desc}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
          </>
        ) : (
          /* ── NO VILLAGE BANNER ── */
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-start gap-4 bg-white border border-orange-200 rounded-2xl px-6 py-5 shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h3 className="font-black text-gray-800 mb-1.5">
                {isEn ? 'Village Profile Incomplete' : 'गाँव का विवरण अपूर्ण'}
              </h3>
              <p className="text-sm text-gray-505 leading-relaxed">
                {isEn
                  ? 'Please update your Village Name in settings to view custom local reports, jobs, and shop analytics.'
                  : 'कस्टम स्थानीय रिपोर्ट, नौकरियां और दुकान विश्लेषण देखने के लिए कृपया सेटिंग्स में अपने गाँव का नाम अपडेट करें।'}
              </p>
            </div>
          </motion.div>
        )}
  {/* Village Teachers Directory Modal */}
        {showTeachersModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/95 backdrop-blur-md max-w-2xl w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-gray-100"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-emerald-50/50">
                <div className="text-left">
                  <h3 className="font-black text-gray-800 text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-600" />
                    {isEn ? 'Village Teachers Directory' : 'ग्राम शिक्षक निर्देशिका'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isEn ? `Educators registered in ${user.village}` : `${user.village} में पंजीकृत शिक्षक`}
                  </p>
                </div>
                <button
                  onClick={() => setShowTeachersModal(false)}
                  className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center border border-gray-200 cursor-pointer shadow-sm transition-all"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {loadingTeachers ? (
                  <div className="flex flex-col items-center justify-center py-12 text-emerald-600">
                    <Loader className="animate-spin w-8 h-8 mb-2" />
                    <p className="text-xs font-semibold animate-pulse">{isEn ? 'Loading teachers...' : 'शिक्षकों की सूची लोड हो रही है...'}</p>
                  </div>
                ) : teachersError ? (
                  <p className="text-center text-red-500 text-sm py-8 font-medium">{teachersError}</p>
                ) : teachers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Users className="w-12 h-12 mb-2 opacity-40" />
                    <p className="text-sm font-semibold">{isEn ? 'No teachers found in your village.' : 'आपके गाँव में कोई शिक्षक नहीं मिला।'}</p>
                  </div>
                ) : (
                  // Grouping & Display
                  (() => {
                    const grouped = teachers.reduce((acc, t) => {
                      const subject = t.teacherSubject || (isEn ? 'General / Other' : 'सामान्य / अन्य');
                      if (!acc[subject]) acc[subject] = [];
                      acc[subject].push(t);
                      return acc;
                    }, {});

                    return Object.keys(grouped).map((subject) => (
                      <div key={subject} className="space-y-3">
                        <h4 className="font-extrabold text-xs text-emerald-600 border-b border-emerald-100 pb-1.5 uppercase tracking-wider text-left">
                          {subject}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {grouped[subject].map((teacher) => (
                            <div key={teacher._id} className="p-4 bg-emerald-50/30 hover:bg-emerald-50/60 border border-emerald-100/50 rounded-2xl flex flex-col justify-between transition-all">
                              <div className="flex gap-3">
                                <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 font-extrabold text-emerald-700 text-sm uppercase">
                                  {teacher.fullName.slice(0, 2)}
                                </div>
                                <div className="min-w-0 text-left">
                                  <p className="font-bold text-gray-800 text-sm truncate">{teacher.fullName}</p>
                                  <p className="text-xs text-gray-500 font-semibold truncate">{teacher.teacherQualifications || (isEn ? 'Educator' : 'शिक्षक')}</p>
                                  {teacher.teacherExperience && (
                                    <p className="text-[9px] text-emerald-700 font-bold uppercase mt-0.5 bg-emerald-50 inline-block px-1.5 py-0.5 rounded-md">
                                      {teacher.teacherExperience} {isEn ? 'Years Exp' : 'वर्ष अनुभव'}
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="mt-4 pt-3 border-t border-emerald-100/30 flex justify-between items-center gap-2">
                                <div className="text-left min-w-0">
                                  <p className="font-bold text-[8px] uppercase tracking-wider text-gray-400 leading-none mb-1">{isEn ? 'Contact' : 'संपर्क'}</p>
                                  <p className="font-semibold text-xs text-gray-700 truncate">{teacher.teacherContact || teacher.mobile}</p>
                                </div>
                                <button
                                  onClick={() => handleTeacherChat(teacher._id)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-3.5 py-1.5 font-bold text-xs flex items-center gap-1.5 border-0 cursor-pointer shadow-sm hover:shadow transition-all shrink-0"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  {isEn ? 'Chat' : 'चैट'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()
                )}
              </div>
            </motion.div>
          </div>
        )}

        
        {/* Village Shops Directory Modal */}
        {showShopsModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-gray-100 max-w-3xl w-full"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-indigo-50/50">
                <div className="text-left">
                  <h3 className="font-black text-gray-800 text-lg flex items-center gap-2">
                    <Store className="w-5 h-5 text-indigo-600" />
                    {isEn ? 'Village Shops Directory' : 'ग्राम दुकान निर्देशिका'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isEn ? `Shops registered in ${user.village}` : `${user.village} में पंजीकृत दुकानें`}
                  </p>
                </div>
                <button
                  onClick={() => setShowShopsModal(false)}
                  className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center border border-gray-200 cursor-pointer shadow-sm transition-all"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
                {dirShops.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Store className="w-12 h-12 mb-2 opacity-40" />
                    <p className="text-sm font-semibold">{isEn ? 'No shops found in your village.' : 'आपके गाँव में कोई दुकान नहीं मिली।'}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {dirShops.map(shop => {
                      const logo = shop.logo || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(shop.name)}`;
                      const isExpanded = expandedShopId === shop._id;
                      const isContactRevealed = !!revealedContacts[shop._id];

                      return (
                        <div key={shop._id} className="bg-indigo-50/10 border border-indigo-100/50 rounded-3xl p-5 flex flex-col justify-between transition-all">
                          <div>
                            <div className="flex items-center gap-3">
                              <img src={logo} alt={shop.name} className="w-11 h-11 rounded-2xl bg-indigo-50 object-cover border border-indigo-100 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-gray-800 text-sm leading-tight truncate">{shop.name}</h3>
                                <p className="text-[10px] text-gray-400 mt-0.5">{shop.timing || '9 AM - 9 PM'}</p>
                              </div>
                            </div>
                            
                            {shop.address && (
                              <p className="text-xs text-gray-500 mt-2 font-medium truncate">{shop.address}</p>
                            )}

                            {/* Contact Info */}
                            {isContactRevealed && shop.contactNumber && (
                              <div className="mt-3 p-2.5 bg-indigo-50/50 rounded-xl space-y-1 text-xs">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-500 font-medium">{isEn ? 'Mobile No:' : 'मोबाइल नंबर:'}</span>
                                  <a href={`tel:${shop.contactNumber}`} className="font-bold text-indigo-700 hover:underline">{shop.contactNumber}</a>
                                </div>
                                {shop.contactNumber.replace(/\D/g, '').length >= 10 && (
                                  <div className="flex justify-between items-center border-t border-indigo-100/50 pt-1.5 mt-1.5">
                                    <span className="text-gray-500 font-medium">{isEn ? 'WhatsApp Chat:' : 'व्हाट्सएप चैट:'}</span>
                                    <a
                                      href={`https://wa.me/91${shop.contactNumber.replace(/\D/g, '').slice(-10)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-bold text-green-600 hover:underline"
                                    >
                                      WhatsApp
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Products scrollable strip */}
                            {shop.products && shop.products.length > 0 && (
                              <div className="mt-4">
                                <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider mb-2">{isEn ? 'Products In Shop' : 'दुकान में उत्पाद'}</p>
                                <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
                                  {shop.products.map(product => (
                                    <div key={product._id} className="w-16 shrink-0 text-center">
                                      <img
                                        src={product.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&auto=format&fit=crop'}
                                        alt={product.name}
                                        className="w-10 h-10 mx-auto rounded-lg object-cover bg-gray-50 border border-gray-100"
                                      />
                                      <p className="text-[8px] font-semibold text-gray-705 truncate mt-1">{product.name}</p>
                                      <p className="text-[8px] font-bold text-indigo-650">₹{product.price}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="mt-4 pt-3 border-t border-indigo-100/30 grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => toggleContactReveal(shop._id)}
                              className="text-[10px] font-bold py-1.5 rounded-lg border border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-50/50 cursor-pointer text-center"
                            >
                              {isContactRevealed ? (isEn ? 'Hide Contact' : 'संपर्क छुपाएं') : (isEn ? 'Contact' : 'संपर्क')}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowShopsModal(false);
                                handleStartChat(shop.ownerId);
                              }}
                              className="text-[10px] font-bold py-1.5 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 border-0 cursor-pointer text-center"
                            >
                              {isEn ? 'Chat' : 'चैट'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Village Labour Services Directory Modal */}
        {showLabourModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-gray-100 max-w-3xl w-full"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-teal-50/50">
                <div className="text-left">
                  <h3 className="font-black text-gray-800 text-lg flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-teal-600" />
                    {isEn ? 'Village Labour Services Directory' : 'ग्राम श्रमिक निर्देशिका'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isEn ? `Workers registered in ${user.village}` : `${user.village} में पंजीकृत श्रमिक`}
                  </p>
                </div>
                <button
                  onClick={() => setShowLabourModal(false)}
                  className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center border border-gray-200 cursor-pointer shadow-sm transition-all"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
                {dirLabour.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Wrench className="w-12 h-12 mb-2 opacity-40" />
                    <p className="text-sm font-semibold">{isEn ? 'No workers found in your village.' : 'आपके गाँव में कोई श्रमिक नहीं मिला।'}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {dirLabour.map(worker => {
                      const workerUserId = worker.userId?._id || worker.userId;
                      const workerGender = worker.userId?.gender || 'male';
                      const avatar = worker.profileImage || getDefaultAvatar(workerGender);
                      const isSelf = workerUserId?.toString() === user?._id?.toString();
                      const isContactRevealed = !!revealedContacts[worker._id];

                      return (
                        <div key={worker._id} className="bg-teal-50/10 border border-teal-100/50 rounded-3xl p-5 flex flex-col justify-between transition-all">
                          <div>
                            <div className="flex items-start gap-3">
                              <img src={avatar} alt={worker.name} className="w-11 h-11 rounded-2xl object-cover border border-teal-100 shrink-0 bg-teal-50" />
                              <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-gray-800 text-sm leading-tight truncate">{worker.name}</h3>
                                <p className="text-[10px] text-teal-650 font-bold uppercase tracking-wide mt-0.5">
                                  {t(`labour.skills.${worker.skill}`) || worker.skill}
                                </p>
                                <p className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md w-fit mt-1 inline-block">
                                  {worker.experience} {isEn ? 'Years Exp' : 'वर्ष अनुभव'}
                                </p>
                              </div>
                            </div>
                            
                            {worker.bio && (
                              <p className="text-xs text-gray-500 mt-2 font-medium italic truncate">"{worker.bio}"</p>
                            )}

                            {/* Service charge info */}
                            <div className="mt-3 flex justify-between items-center text-xs border-t border-teal-100/30 pt-2">
                              <span className="text-gray-500 font-medium">{isEn ? 'Service Charge:' : 'सेवा शुल्क:'}</span>
                              <span className="font-extrabold text-gray-805">
                                ₹{worker.serviceCharge} {worker.chargeType === 'daily' ? (isEn ? '/ day' : '/ दिन') : (isEn ? '/ hr' : '/ घंटा')}
                              </span>
                            </div>

                            {/* Contact Info */}
                            {isContactRevealed && worker.contactNumber && (
                              <div className="mt-3 p-2.5 bg-teal-50/50 rounded-xl space-y-1 text-xs">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-500 font-medium">{isEn ? 'Mobile No:' : 'मोबाइल नंबर:'}</span>
                                  <a href={`tel:${worker.contactNumber}`} className="font-bold text-teal-700 hover:underline">{worker.contactNumber}</a>
                                </div>
                                {worker.contactNumber.replace(/\D/g, '').length >= 10 && (
                                  <div className="flex justify-between items-center border-t border-teal-100/50 pt-1.5 mt-1.5">
                                    <span className="text-gray-500 font-medium">{isEn ? 'WhatsApp Chat:' : 'व्हाट्सएप चैट:'}</span>
                                    <a
                                      href={`https://wa.me/91${worker.contactNumber.replace(/\D/g, '').slice(-10)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-bold text-green-600 hover:underline"
                                    >
                                      WhatsApp
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="mt-4 pt-3 border-t border-teal-100/30 grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              onClick={() => toggleContactReveal(worker._id)}
                              className="text-[10px] font-bold py-1.5 rounded-lg border border-teal-200 text-teal-700 bg-white hover:bg-teal-50/50 cursor-pointer text-center shrink-0"
                            >
                              {isContactRevealed ? (isEn ? 'Hide' : 'छुपाएं') : (isEn ? 'Contact' : 'संपर्क')}
                            </button>
                            
                            {!isSelf ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowLabourModal(false);
                                    handleStartChat(workerUserId);
                                  }}
                                  className="text-[10px] font-bold py-1.5 rounded-lg text-teal-700 bg-white hover:bg-teal-50/55 border border-teal-200 cursor-pointer text-center shrink-0"
                                >
                                  {isEn ? 'Chat' : 'चैट'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowLabourModal(false);
                                    setSelectedLabour(worker);
                                    setHireModalOpen(true);
                                  }}
                                  className="text-[10px] font-bold py-1.5 rounded-lg text-white bg-gradient-to-b from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 border-0 cursor-pointer text-center shrink-0"
                                >
                                  {isEn ? 'Hire' : 'बुक'}
                                </button>
                              </>
                            ) : (
                              <span className="col-span-2 text-[10px] text-gray-400 italic text-center py-1.5 bg-gray-50 rounded-lg font-medium">{isEn ? 'Your Profile' : 'आपकी प्रोफ़ाइल'}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
  
{/* Labour Services Hiring Modal */}
        <AnimatePresence>
          {hireModalOpen && selectedLabour && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                transition={{ type: 'spring', damping: 28, stiffness: 340 }}
                className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden text-left"
              >
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-teal-600 to-emerald-500 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-bold text-base flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      {isEn ? 'Send Service Request' : 'सेवा अनुरोध भेजें'}
                    </h3>
                    <p className="text-teal-100 text-xs mt-0.5">
                      {isEn ? 'Fill in details to hire the worker' : 'श्रमिक को बुक करने के लिए विवरण भरें'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setHireModalOpen(false);
                      setSelectedLabour(null);
                    }}
                    className="bg-white/15 hover:bg-white/30 p-1.5 rounded-full transition-colors cursor-pointer border-0"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Worker Summary */}
                <div className="mx-5 mt-5 bg-teal-50/50 border border-teal-100 rounded-2xl px-4 py-3 text-sm">
                  <div className="font-bold text-gray-800 mb-1 flex items-center gap-2">
                    <img
                      src={selectedLabour.profileImage || getDefaultAvatar(selectedLabour.userId?.gender || 'male')}
                      alt={selectedLabour.name}
                      className="w-8 h-8 rounded-xl bg-teal-100/50"
                    />
                    {selectedLabour.name}
                  </div>
                  <div className="text-xs text-gray-500 space-y-0.5">
                    <div>
                      <span className="font-semibold text-gray-600">{isEn ? 'Skill' : 'कौशल'}:</span>{' '}
                      {t(`labour.skills.${selectedLabour.skill}`) || selectedLabour.skill}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">{isEn ? 'Rate' : 'दर'}:</span>{' '}
                      ₹{selectedLabour.serviceCharge}{' '}
                      {selectedLabour.chargeType === 'daily'
                        ? (isEn ? '/ day' : '/ दिन')
                        : (isEn ? '/ hr' : '/ घंटा')}
                    </div>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSendHireRequest} className="p-5 space-y-4">
                  {hireError && (
                    <div className="bg-red-50 border border-red-205 text-red-650 rounded-xl p-3 text-xs font-semibold">
                      {hireError}
                    </div>
                  )}
                  {hireSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-xs font-medium flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> {hireSuccess}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600">
                        {isEn ? 'Date & Time' : 'तारीख और समय'}
                      </label>
                      <input
                        type="datetime-local"
                        value={hireDateTime}
                        onChange={(e) => setHireDateTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-750 font-medium focus:outline-none focus:ring-2 focus:ring-teal-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600">
                        {isEn ? 'Offer Amount (₹)' : 'प्रस्तावित राशि (₹)'}
                      </label>
                      <input
                        type="number"
                        value={hireOfferAmount}
                        onChange={(e) => setHireOfferAmount(e.target.value)}
                        placeholder="e.g. 500"
                        min="0"
                        className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-755 font-medium focus:outline-none focus:ring-2 focus:ring-teal-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">
                      {isEn ? 'Note (Optional)' : 'विवरण (वैकल्पिक)'}
                    </label>
                    <textarea
                      value={hireNote}
                      onChange={(e) => setHireNote(e.target.value)}
                      placeholder={isEn ? 'Describe the work you need...' : 'आवश्यक कार्य का संक्षिप्त विवरण दें...'}
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={hireLoading || !!hireSuccess}
                    className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer border-0 active:scale-[0.98]"
                  >
                    {hireLoading
                      ? <><Loader className="animate-spin w-4 h-4" />{isEn ? 'Sending...' : 'भेजा जा रहा है...'}</>
                      : <><Send className="w-4 h-4" />{isEn ? 'Submit Request' : 'अनुरोध भेजें'}</>
                    }
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Dashboard;