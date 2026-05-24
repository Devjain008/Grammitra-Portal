import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useCall } from '../context/CallContext';
import { useNavigate } from 'react-router-dom';
import { CONFIG } from '../utils/constants';
import { 
  Users, Search, Filter, MessageSquare, Phone, Video, 
  ChevronRight, X, GraduationCap, Clock, Award, Briefcase, 
  MapPin, Loader, AlertCircle, CheckCircle
} from 'lucide-react';

const Toast = ({ message, type, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: -40, x: '-50%' }}
    animate={{ opacity: 1, y: 0, x: '-50%' }}
    exit={{ opacity: 0, y: -40, x: '-50%' }}
    className="fixed top-5 left-1/2 z-[9999] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold"
    style={{
      background: type === 'success' ? 'linear-gradient(135deg,#22c55e,#16a34a)' :
        type === 'error' ? 'linear-gradient(135deg,#ef4444,#dc2626)' :
          'linear-gradient(135deg,#3b82f6,#2563eb)',
      color: '#fff'
    }}
  >
    {type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
    {message}
    <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 bg-transparent border-0 cursor-pointer text-white">
      <X className="w-3.5 h-3.5" />
    </button>
  </motion.div>
);

const Teachers = () => {
  const { locale, t } = useLanguage();
  const { token, user } = useAuth();
  const { startCall } = useCall();
  const navigate = useNavigate();

  const isEn = locale === 'en';

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Toast notifications
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };
  const clearToast = () => setToast(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedQualification, setSelectedQualification] = useState('');
  const [selectedExperience, setSelectedExperience] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${CONFIG.API_BASE_URL}/api/education/teachers`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTeachers(res.data);
      } catch (err) {
        console.error('Failed to fetch teachers:', err);
        setError(isEn ? 'Failed to load teachers directory.' : 'शिक्षकों की सूची लोड करने में विफल।');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchTeachers();
  }, [token, isEn]);

  // Extract unique subjects & qualifications dynamically for filters
  const allSubjects = Array.from(new Set(
    teachers.flatMap(t => t.teacherSubject 
      ? t.teacherSubject.split(',').map(s => s.trim()) 
      : []
    )
  )).filter(Boolean);

  const allQualifications = Array.from(new Set(
    teachers.map(t => t.teacherQualifications?.trim()).filter(Boolean)
  ));

  // Chat with Teacher
  const handleChat = async (teacherId, teacherName) => {
    if (!token) return showToast(isEn ? 'Please log in to chat.' : 'चैट करने के लिए कृपया लॉगइन करें।', 'error');
    if (teacherId === user?._id) {
      return showToast(isEn ? 'This is your own profile!' : 'यह आपकी खुद की प्रोफ़ाइल है!', 'warning');
    }
    try {
      const res = await axios.post(
        `${CONFIG.API_BASE_URL}/api/chat/room`,
        { userId2: teacherId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate(`/chat?roomId=${res.data._id}`);
    } catch (err) {
      console.error(err);
      showToast(isEn ? 'Failed to start chat.' : 'चैट शुरू करने में विफल।', 'error');
    }
  };

  // Call Teacher
  const handleCall = (teacher, type = 'audio') => {
    if (!token) return showToast(isEn ? 'Please log in to make a call.' : 'कॉल करने के लिए कृपया लॉगइन करें।', 'error');
    if (teacher._id === user?._id) {
      return showToast(isEn ? 'You cannot call yourself.' : 'आप खुद को कॉल नहीं कर सकते।', 'warning');
    }
    
    // Check if teacher is registered and active
    startCall({
      id: teacher._id,
      name: teacher.fullName,
      image: teacher.profileImage || null
    }, type);
  };

  // Filter Logic
  const filteredTeachers = teachers.filter(t => {
    const subjects = t.teacherSubject ? t.teacherSubject.toLowerCase() : '';
    const qualification = t.teacherQualifications ? t.teacherQualifications.toLowerCase() : '';
    const name = t.fullName ? t.fullName.toLowerCase() : '';
    const email = t.email ? t.email.toLowerCase() : '';

    const matchesSearch = 
      name.includes(searchTerm.toLowerCase()) || 
      subjects.includes(searchTerm.toLowerCase()) || 
      qualification.includes(searchTerm.toLowerCase()) || 
      email.includes(searchTerm.toLowerCase());

    const matchesSubject = !selectedSubject || 
      subjects.split(',').map(s => s.trim()).includes(selectedSubject.toLowerCase());

    const matchesQual = !selectedQualification || 
      t.teacherQualifications === selectedQualification;

    const matchesExp = !selectedExperience || (() => {
      const expVal = parseFloat(t.teacherExperience);
      if (isNaN(expVal)) return false;
      if (selectedExperience === '1-3') return expVal >= 1 && expVal <= 3;
      if (selectedExperience === '3-5') return expVal > 3 && expVal <= 5;
      if (selectedExperience === '5+') return expVal > 5;
      return true;
    })();

    return matchesSearch && matchesSubject && matchesQual && matchesExp;
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <AnimatePresence>{toast && <Toast {...toast} onClose={clearToast} />}</AnimatePresence>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 right-10 text-9xl">👩‍🏫</div>
          <div className="absolute bottom-0 left-20 text-7xl">🎓</div>
        </div>
        <div className="relative">
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-emerald-100" />
            {isEn ? 'Village Teachers Directory' : 'गाँव शिक्षक निर्देशिका'}
          </h1>
          <p className="text-emerald-100 text-lg opacity-90">
            {isEn 
              ? 'Find, contact, and chat with certified educators and instructors in your village.' 
              : 'अपने गाँव में प्रमाणित शिक्षकों और प्रशिक्षकों को खोजें, संपर्क करें और चैट करें।'}
          </p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder={isEn ? 'Search teachers by name, subject, qualification...' : 'शिक्षक का नाम, विषय, योग्यता से खोजें...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full text-sm pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-400 font-semibold text-gray-700 transition-all"
            />
          </div>

          {/* Clean Filters Button */}
          {(selectedSubject || selectedQualification || selectedExperience || searchTerm) && (
            <button 
              onClick={() => {
                setSelectedSubject('');
                setSelectedQualification('');
                setSelectedExperience('');
                setSearchTerm('');
              }}
              className="text-xs font-bold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 border-0 px-4 py-3 rounded-xl cursor-pointer transition-all shrink-0"
            >
              {isEn ? 'Clear Filters' : 'फ़िल्टर हटाएं'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Subject Filter */}
          <div className="relative">
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-400 font-semibold cursor-pointer text-gray-700 appearance-none"
            >
              <option value="">{isEn ? 'All Subjects' : 'सभी विषय'}</option>
              {allSubjects.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Qualification Filter */}
          <div className="relative">
            <select
              value={selectedQualification}
              onChange={e => setSelectedQualification(e.target.value)}
              className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-400 font-semibold cursor-pointer text-gray-700 appearance-none"
            >
              <option value="">{isEn ? 'All Qualifications' : 'सभी योग्यताएं'}</option>
              {allQualifications.map(qual => (
                <option key={qual} value={qual}>{qual}</option>
              ))}
            </select>
            <GraduationCap className="w-3.5 h-3.5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Experience Filter */}
          <div className="relative">
            <select
              value={selectedExperience}
              onChange={e => setSelectedExperience(e.target.value)}
              className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-400 font-semibold cursor-pointer text-gray-700 appearance-none"
            >
              <option value="">{isEn ? 'Any Experience' : 'अनुभव (कोई भी)'}</option>
              <option value="1-3">{isEn ? '1 to 3 Years' : '1 से 3 साल'}</option>
              <option value="3-5">{isEn ? '3 to 5 Years' : '3 से 5 साल'}</option>
              <option value="5+">{isEn ? '5+ Years' : '5 साल से अधिक'}</option>
            </select>
            <Clock className="w-3.5 h-3.5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-emerald-500">
          <Loader className="animate-spin w-10 h-10 mb-3" />
          <p className="font-semibold animate-pulse">{isEn ? 'Loading teachers list...' : 'शिक्षकों की सूची लोड हो रही है...'}</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 rounded-2xl p-6 border border-red-100 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-150 p-12 text-center text-gray-400">
          <Users className="w-16 h-16 mx-auto mb-3 opacity-30 text-emerald-600" />
          <h3 className="font-bold text-gray-700 text-lg mb-1">{isEn ? 'No Teachers Found' : 'कोई शिक्षक नहीं मिला'}</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            {isEn 
              ? 'Try modifying your search query or categories filter to expand the list.' 
              : 'कृपया अपनी खोज या फ़िल्टर बदलें।'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {filteredTeachers.map((teacher, idx) => {
            const isSelf = teacher._id === user?._id;
            return (
              <motion.div 
                key={teacher._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all p-6 relative overflow-hidden flex flex-col justify-between h-full group"
              >
                {isSelf && (
                  <span className="absolute top-4 right-4 bg-emerald-500 text-white px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider shadow">
                    {isEn ? 'You' : 'आप'}
                  </span>
                )}
                
                <div className="space-y-4">
                  {/* Avatar & Name Info */}
                  <div className="flex items-start gap-4">
                    {teacher.profileImage ? (
                      <img 
                        src={teacher.profileImage} 
                        alt={teacher.fullName} 
                        className="w-14 h-14 rounded-2xl object-cover border border-emerald-100 shadow-sm"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-200 flex items-center justify-center font-black text-emerald-700 text-xl uppercase shadow-sm border border-emerald-50 shrink-0">
                        {teacher.fullName?.slice(0, 2)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-extrabold text-gray-800 text-base group-hover:text-emerald-600 transition-colors truncate">
                        {teacher.fullName}
                      </h3>
                      <div className="flex flex-col gap-0.5 mt-1">
                        <p className="text-xs text-gray-500 font-semibold flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
                          {teacher.teacherQualifications || (isEn ? 'Certified Educator' : 'प्रमाणित शिक्षक')}
                        </p>
                        {teacher.teacherExperience && (
                          <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-500" />
                            {teacher.teacherExperience} {isEn ? 'Years Experience' : 'वर्ष का अनुभव'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Subject Badges */}
                  {teacher.teacherSubject && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {teacher.teacherSubject.split(',').map((subj, sIdx) => (
                        <span 
                          key={sIdx} 
                          className="bg-emerald-50/70 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-lg border border-emerald-100"
                        >
                          {subj.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Bio/Intro */}
                  {teacher.bio && (
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 italic pt-1 border-t border-gray-50">
                      "{teacher.bio}"
                    </p>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between gap-3">
                  <span className="text-[10px] text-gray-400 font-extrabold tracking-wide uppercase">
                    {teacher.teacherContact || teacher.mobile}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* View Details Button */}
                    <button 
                      onClick={() => setSelectedTeacher(teacher)}
                      className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl border-0 cursor-pointer transition-all active:scale-95"
                      title={isEn ? 'View Profile' : 'प्रोफ़ाइल देखें'}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    {/* Chat button */}
                    {!isSelf && (
                      <button 
                        onClick={() => handleChat(teacher._id, teacher.fullName)}
                        className="flex items-center gap-1 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded-xl border-0 cursor-pointer transition-all active:scale-95 shadow-sm"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        {isEn ? 'Chat' : 'चैट'}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Teacher Profile Details Modal/Drawer */}
      <AnimatePresence>
        {selectedTeacher && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 flex flex-col relative"
            >
              {/* Header Close button */}
              <button 
                onClick={() => setSelectedTeacher(null)}
                className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 text-white rounded-full border-0 cursor-pointer transition-all z-20"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Cover Banner */}
              <div 
                className="h-32 bg-gradient-to-r from-emerald-500 to-teal-600 relative flex items-end p-6"
              >
                <div className="flex gap-4 items-center translate-y-8 z-10">
                  {selectedTeacher.profileImage ? (
                    <img 
                      src={selectedTeacher.profileImage} 
                      alt={selectedTeacher.fullName} 
                      className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-200 flex items-center justify-center font-black text-emerald-700 text-3xl uppercase shadow-lg border-4 border-white">
                      {selectedTeacher.fullName?.slice(0, 2)}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 pt-12 space-y-5 overflow-y-auto max-h-[70vh] custom-scrollbar">
                <div>
                  <h2 className="text-xl font-black text-gray-900 flex items-center gap-1.5">
                    {selectedTeacher.fullName}
                  </h2>
                  <p className="text-xs text-gray-400 font-extrabold uppercase mt-0.5 tracking-wider">
                    {selectedTeacher.email}
                  </p>
                </div>

                {/* Profile Grid Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50/40 border border-emerald-100 p-3.5 rounded-2xl flex items-start gap-2.5">
                    <Award className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{isEn ? 'Qualification' : 'योग्यता'}</p>
                      <p className="text-xs font-bold text-gray-800">{selectedTeacher.teacherQualifications || (isEn ? 'N/A' : 'उपलब्ध नहीं')}</p>
                    </div>
                  </div>
                  <div className="bg-emerald-50/40 border border-emerald-100 p-3.5 rounded-2xl flex items-start gap-2.5">
                    <Briefcase className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{isEn ? 'Experience' : 'अनुभव'}</p>
                      <p className="text-xs font-bold text-gray-800">
                        {selectedTeacher.teacherExperience ? `${selectedTeacher.teacherExperience} ${isEn ? 'Years' : 'साल'}` : (isEn ? 'N/A' : 'उपलब्ध नहीं')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Subjects Badges */}
                {selectedTeacher.teacherSubject && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wide">{isEn ? 'Subjects Taught' : 'पढ़ाए जाने वाले विषय'}</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTeacher.teacherSubject.split(',').map((subj, idx) => (
                        <span key={idx} className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-3 py-1 rounded-xl border border-emerald-200">
                          {subj.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Biography */}
                {selectedTeacher.bio && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wide">{isEn ? 'Biography' : 'जीवनी'}</h3>
                    <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 border border-gray-150 p-4 rounded-2xl italic">
                      "{selectedTeacher.bio}"
                    </p>
                  </div>
                )}

                {/* Active Batches / Classes */}
                {selectedTeacher.batches && selectedTeacher.batches.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wide">{isEn ? 'Active Batches' : 'सक्रिय बैच'}</h3>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {selectedTeacher.batches.map(batch => (
                        <div key={batch._id} className="p-3 bg-gray-50 border border-gray-150 rounded-2xl flex items-center justify-between">
                          <div>
                            <p className="text-xs font-extrabold text-gray-800">{batch.batchName}</p>
                            <p className="text-[10px] text-gray-500 font-semibold">{batch.className} — {batch.subject}</p>
                          </div>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold uppercase">
                            {isEn ? 'Active' : 'सक्रिय'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Location and Contact Info */}
                <div className="space-y-1.5 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-rose-500" />
                    <span className="font-semibold">{selectedTeacher.village || user?.village || (isEn ? 'Nearby Village' : 'पड़ोसी गाँव')}</span>
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-500" />
                    <span className="font-semibold">{selectedTeacher.teacherContact || selectedTeacher.mobile}</span>
                  </p>
                </div>

                {/* Actions Button */}
                {selectedTeacher._id !== user?._id && (
                  <div className="pt-4 flex gap-2">
                    {/* Live Audio Call */}
                    <button 
                      onClick={() => handleCall(selectedTeacher, 'audio')}
                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-2xl shadow-md border-0 cursor-pointer transition-all active:scale-95"
                    >
                      <Phone className="w-4 h-4" />
                      {isEn ? 'Voice Call' : 'ऑडियो कॉल'}
                    </button>

                    {/* Live Video Call */}
                    <button 
                      onClick={() => handleCall(selectedTeacher, 'video')}
                      className="flex-1 flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 rounded-2xl shadow-md border-0 cursor-pointer transition-all active:scale-95"
                    >
                      <Video className="w-4 h-4" />
                      {isEn ? 'Video Call' : 'वीडियो कॉल'}
                    </button>

                    {/* Private Chat */}
                    <button 
                      onClick={() => handleChat(selectedTeacher._id, selectedTeacher.fullName)}
                      className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl shadow-md border-0 cursor-pointer transition-all active:scale-95"
                      title={isEn ? 'Chat Now' : 'चैट शुरू करें'}
                    >
                      <MessageSquare className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Teachers;
