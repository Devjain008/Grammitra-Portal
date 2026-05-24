import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CONFIG } from '../utils/constants';
import {
  GraduationCap, BookOpen, Target, Bot, Upload, FileText,
  Users, CheckCircle, Bell, Clock, Sparkles, Loader, AlertCircle,
  Trash2, Plus, MessageSquare, X, ChevronDown, ChevronUp,
  UserPlus, Calendar, DollarSign, Edit2, Save, RefreshCw,
  CheckSquare, XSquare, Eye, UserCheck, Shield, Settings,
  TrendingUp, BarChart2, ClipboardList, Star, Award
} from 'lucide-react';

// ─── SHARED HELPERS ─────────────────────────────────────────────────────────

const api = (token) => ({
  get: (url) => axios.get(`${CONFIG.API_BASE_URL}${url}`, { headers: { Authorization: `Bearer ${token}` } }),
  post: (url, data) => axios.post(`${CONFIG.API_BASE_URL}${url}`, data, { headers: { Authorization: `Bearer ${token}` } }),
  put: (url, data) => axios.put(`${CONFIG.API_BASE_URL}${url}`, data, { headers: { Authorization: `Bearer ${token}` } }),
  delete: (url) => axios.delete(`${CONFIG.API_BASE_URL}${url}`, { headers: { Authorization: `Bearer ${token}` } }),
});

const Toast = ({ message, type = 'success', onClose }) => (
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

const useToast = () => {
  const [toast, setToast] = useState(null);
  const show = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);
  return { toast, show, clear: () => setToast(null) };
};

// ─── STUDENT DASHBOARD ──────────────────────────────────────────────────────

const StudentDashboard = ({ user, token, isEn, navigate }) => {
  const { toast, show, clear } = useToast();

  // Profile
  const [profile, setProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem('grammitra_student_profile')) || null; } catch { return null; }
  });
  const [editingProfile, setEditingProfile] = useState(!profile);
  const [profileForm, setProfileForm] = useState({
    level: profile?.level || 'school',
    grade: profile?.grade || '',
    medium: profile?.medium || 'hindi',
    schoolName: profile?.schoolName || '',
    board: profile?.board || ''
  });

  // AI Study Plan
  const [studyPlan, setStudyPlan] = useState(() => localStorage.getItem('grammitra_student_studyplan') || null);
  const [loadingStudyPlan, setLoadingStudyPlan] = useState(false);

  // AI Career
  const [domain, setDomain] = useState('');
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [roadmap, setRoadmap] = useState(null);

  // Todos
  const [todos, setTodos] = useState(() => {
    try {
      const saved = localStorage.getItem('grammitra_student_todos');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: 1, task: isEn ? 'Complete Math Chapter 4' : 'गणित अध्याय 4 पूरा करें', done: true },
      { id: 2, task: isEn ? 'Revise Science Notes' : 'विज्ञान नोट्स दोहराएं', done: false },
      { id: 3, task: isEn ? 'Take Mock Test for SSC' : 'एसएससी के लिए मॉक टेस्ट लें', done: false },
    ];
  });
  const [newTodo, setNewTodo] = useState('');

  // Student batches
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  const req = api(token);

  useEffect(() => {
    localStorage.setItem('grammitra_student_todos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    const fetchBatches = async () => {
      setLoadingBatches(true);
      try { const res = await req.get('/api/education/my-batches'); setBatches(res.data); }
      catch {} finally { setLoadingBatches(false); }
    };
    fetchBatches();
    // eslint-disable-next-line
  }, [token]);

  const saveProfile = (e) => {
    e.preventDefault();
    localStorage.setItem('grammitra_student_profile', JSON.stringify(profileForm));
    setProfile(profileForm);
    setEditingProfile(false);
    show(isEn ? 'Profile saved!' : 'प्रोफ़ाइल सहेजी!');
  };

  const generateStudyPlan = async () => {
    if (!profile) return;
    setLoadingStudyPlan(true);
    try {
      const prompt = `Act as an expert academic counselor for rural Indian students.
Student Details:
- Level: ${profile.level === 'school' ? 'School' : 'College'}
- Class/Semester: ${profile.grade}
- Medium: ${profile.medium}
- School/College: ${profile.schoolName}
- Board/University: ${profile.board}
Create a detailed personalized weekly study plan in ${isEn ? 'English' : 'Hindi'} with:
1. Daily study hours breakdown
2. Key subjects and focus areas
3. A structured 7-day timetable
4. Motivation tips specific to their board/university`;
      const res = await req.post('/api/ai/ask', { prompt, language: isEn ? 'en' : 'hi' });
      setStudyPlan(res.data.reply);
      localStorage.setItem('grammitra_student_studyplan', res.data.reply);
      show(isEn ? 'Study plan generated!' : 'अध्ययन योजना तैयार!');
    } catch {
      show(isEn ? 'Failed to generate plan.' : 'योजना बनाने में विफल।', 'error');
    } finally { setLoadingStudyPlan(false); }
  };

  const generateRoadmap = async (e) => {
    e.preventDefault();
    if (!domain) return;
    setLoadingRoadmap(true);
    try {
      const prompt = `Act as an expert career counselor for rural Indian students. The student wants to pursue '${domain}'. Create a practical step-by-step career roadmap with free resources, key skills, timeline, and job opportunities.`;
      const res = await req.post('/api/ai/ask', { prompt, language: isEn ? 'en' : 'hi' });
      setRoadmap(res.data.reply);
    } catch {
      show(isEn ? 'Failed to generate roadmap.' : 'रोडमैप बनाने में विफल।', 'error');
    } finally { setLoadingRoadmap(false); }
  };

  const startChat = async (teacherId) => {
    try {
      const res = await req.post('/api/chat/room', { userId2: teacherId });
      navigate(`/chat?roomId=${res.data._id}`);
    } catch { show(isEn ? 'Could not start chat.' : 'चैट शुरू नहीं हो सकी।', 'error'); }
  };

  const openBatchChat = (chatRoomId) => {
    if (chatRoomId) navigate(`/chat?roomId=${chatRoomId}`);
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>{toast && <Toast {...toast} onClose={clear} />}</AnimatePresence>

      {/* ── Student Header ── */}
      <div className="relative overflow-hidden rounded-3xl p-8 text-white"
        style={{ background: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#a855f7 100%)' }}>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black">
                {isEn ? 'Student Dashboard' : 'छात्र डैशबोर्ड'}
              </h2>
              <p className="text-purple-200 text-sm">{user?.fullName}</p>
            </div>
          </div>
          {profile && (
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { label: isEn ? profile.level === 'school' ? 'School' : 'College' : profile.level === 'school' ? 'स्कूल' : 'कॉलेज', icon: '🏫' },
                { label: profile.grade, icon: '📚' },
                { label: profile.medium === 'hindi' ? (isEn ? 'Hindi Medium' : 'हिंदी माध्यम') : (isEn ? 'English Medium' : 'अंग्रेजी माध्यम'), icon: '🗣️' },
                { label: profile.board, icon: '📋' },
              ].map((item, i) => (
                <span key={i} className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-1 text-xs font-bold flex items-center gap-1">
                  {item.icon} {item.label}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle,#fff,transparent)', transform: 'translate(30%,-30%)' }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT COLUMN ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Academic Profile Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg,#ede9fe,#f3f4f6)' }}>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-purple-600" />
                <h3 className="font-black text-gray-800">
                  {isEn ? 'Academic Profile' : 'शैक्षणिक प्रोफ़ाइल'}
                </h3>
              </div>
              {profile && !editingProfile && (
                <button onClick={() => { setProfileForm(profile); setEditingProfile(true); }}
                  className="text-xs text-purple-600 font-bold flex items-center gap-1 bg-transparent border-0 cursor-pointer hover:text-purple-700">
                  <Edit2 className="w-3.5 h-3.5" />
                  {isEn ? 'Edit' : 'बदलें'}
                </button>
              )}
            </div>

            <div className="p-6">
              {editingProfile ? (
                <form onSubmit={saveProfile} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                        {isEn ? 'Level' : 'स्तर'}
                      </label>
                      <select value={profileForm.level}
                        onChange={e => setProfileForm({ ...profileForm, level: e.target.value })}
                        className="w-full text-sm border border-gray-200 bg-gray-50 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-purple-400 font-semibold cursor-pointer">
                        <option value="school">{isEn ? 'School' : 'स्कूल'}</option>
                        <option value="college">{isEn ? 'College' : 'कॉलेज'}</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                        {profileForm.level === 'school' ? (isEn ? 'Class' : 'कक्षा') : (isEn ? 'Semester' : 'सेमेस्टर')}
                      </label>
                      <input required type="text"
                        placeholder={profileForm.level === 'school' ? 'e.g. 10th' : 'e.g. Sem 4'}
                        value={profileForm.grade}
                        onChange={e => setProfileForm({ ...profileForm, grade: e.target.value })}
                        className="w-full text-sm border border-gray-200 bg-gray-50 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-purple-400 font-semibold" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                        {isEn ? 'Medium' : 'माध्यम'}
                      </label>
                      <select value={profileForm.medium}
                        onChange={e => setProfileForm({ ...profileForm, medium: e.target.value })}
                        className="w-full text-sm border border-gray-200 bg-gray-50 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-purple-400 font-semibold cursor-pointer">
                        <option value="hindi">{isEn ? 'Hindi' : 'हिंदी'}</option>
                        <option value="english">{isEn ? 'English' : 'अंग्रेजी'}</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                        {profileForm.level === 'school' ? (isEn ? 'Board (e.g. MP Board)' : 'बोर्ड') : (isEn ? 'University' : 'विश्वविद्यालय')}
                      </label>
                      <input required type="text"
                        placeholder={profileForm.level === 'school' ? 'e.g. MP Board, CBSE' : 'e.g. RDVV'}
                        value={profileForm.board}
                        onChange={e => setProfileForm({ ...profileForm, board: e.target.value })}
                        className="w-full text-sm border border-gray-200 bg-gray-50 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-purple-400 font-semibold" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      {profileForm.level === 'school' ? (isEn ? 'School Name' : 'स्कूल का नाम') : (isEn ? 'College Name' : 'कॉलेज का नाम')}
                    </label>
                    <input required type="text"
                      placeholder={profileForm.level === 'school' ? 'e.g. Govt Excellence School' : 'e.g. Govt PG College'}
                      value={profileForm.schoolName}
                      onChange={e => setProfileForm({ ...profileForm, schoolName: e.target.value })}
                      className="w-full text-sm border border-gray-200 bg-gray-50 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-purple-400 font-semibold" />
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    {profile && (
                      <button type="button" onClick={() => setEditingProfile(false)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold border-0 cursor-pointer">
                        {isEn ? 'Cancel' : 'रद्द'}
                      </button>
                    )}
                    <button type="submit"
                      className="px-5 py-2 text-white rounded-xl text-xs font-bold border-0 cursor-pointer flex items-center gap-1.5"
                      style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                      <Save className="w-3.5 h-3.5" />
                      {isEn ? 'Save Profile' : 'सहेजें'}
                    </button>
                  </div>
                </form>
              ) : profile ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label: isEn ? 'Level' : 'स्तर', value: profile.level === 'school' ? (isEn ? 'School' : 'स्कूल') : (isEn ? 'College' : 'कॉलेज') },
                    { label: profile.level === 'school' ? (isEn ? 'Class' : 'कक्षा') : (isEn ? 'Semester' : 'सेमेस्टर'), value: profile.grade },
                    { label: isEn ? 'Medium' : 'माध्यम', value: profile.medium === 'hindi' ? (isEn ? 'Hindi' : 'हिंदी') : (isEn ? 'English' : 'अंग्रेजी') },
                    { label: profile.level === 'school' ? (isEn ? 'School' : 'स्कूल') : (isEn ? 'College' : 'कॉलेज'), value: profile.schoolName },
                    { label: profile.level === 'school' ? (isEn ? 'Board' : 'बोर्ड') : (isEn ? 'University' : 'विश्वविद्यालय'), value: profile.board },
                  ].map((item, i) => (
                    <div key={i} className="bg-purple-50/50 rounded-2xl p-3">
                      <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-0.5">{item.label}</p>
                      <p className="font-bold text-gray-800 text-sm">{item.value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-400 text-sm">{isEn ? 'Fill your profile to get personalized study plans.' : 'व्यक्तिगत अध्ययन योजना के लिए प्रोफ़ाइल भरें।'}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Enrolled Batches */}
          {batches.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg,#dbeafe,#f3f4f6)' }}>
                <ClipboardList className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-gray-800">{isEn ? 'My Batches' : 'मेरे बैच'}</h3>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {loadingBatches ? (
                  <div className="col-span-2 flex justify-center py-6"><Loader className="animate-spin w-5 h-5 text-blue-500" /></div>
                ) : batches.map(batch => (
                  <div key={batch._id} className="p-4 rounded-2xl border border-blue-100 bg-blue-50/30 flex flex-col gap-3">
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{batch.batchName}</p>
                      <p className="text-xs text-gray-500">{batch.teacherName} • {isEn ? 'Class' : 'कक्षा'} {batch.className}</p>
                    </div>
                    {batch.subject && <span className="text-[10px] bg-blue-100 text-blue-700 rounded-lg px-2 py-0.5 font-bold w-fit">{batch.subject}</span>}
                    <button
                      onClick={() => openBatchChat(batch.chatRoomId)}
                      disabled={!batch.chatRoomId}
                      className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl px-3 py-1.5 border-0 cursor-pointer transition-all w-fit disabled:opacity-50">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {isEn ? 'Open Group Chat' : 'ग्रुप चैट खोलें'}
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* AI Study Plan */}
          {profile && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between"
                style={{ background: 'linear-gradient(135deg,#eef2ff,#f3f4f6)' }}>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-black text-gray-800">{isEn ? 'AI Weekly Study Plan' : 'AI साप्ताहिक अध्ययन योजना'}</h3>
                </div>
                <button onClick={generateStudyPlan} disabled={loadingStudyPlan}
                  className="flex items-center gap-1.5 text-xs font-bold text-white rounded-xl px-4 py-2 border-0 cursor-pointer disabled:opacity-50 transition-all"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  {loadingStudyPlan ? <Loader className="animate-spin w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  {studyPlan ? (isEn ? 'Refresh' : 'अपडेट करें') : (isEn ? 'Generate' : 'बनाएं')}
                </button>
              </div>
              <div className="p-6 min-h-[200px]">
                {loadingStudyPlan ? (
                  <div className="flex flex-col items-center justify-center py-12 text-indigo-500">
                    <Loader className="animate-spin w-8 h-8 mb-3" />
                    <p className="text-sm font-medium animate-pulse">{isEn ? 'AI is building your plan...' : 'AI आपकी योजना बना रहा है...'}</p>
                  </div>
                ) : studyPlan ? (
                  <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto pr-2">{studyPlan}</div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Target className="w-12 h-12 mb-3 opacity-40" />
                    <p className="text-sm font-semibold">{isEn ? 'Click Generate to build your plan.' : 'योजना बनाने के लिए Generate क्लिक करें।'}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="space-y-6">

          {/* Todo List */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg,#dbeafe,#f3f4f6)' }}>
              <Target className="w-4 h-4 text-blue-600" />
              <h3 className="font-black text-gray-800 text-sm">{isEn ? 'Study Planner' : 'अध्ययन योजनाकार'}</h3>
            </div>
            <div className="p-5">
              <form onSubmit={(e) => { e.preventDefault(); if (!newTodo.trim()) return; setTodos([...todos, { id: Date.now(), task: newTodo.trim(), done: false }]); setNewTodo(''); }} className="flex gap-2 mb-4">
                <input type="text" required placeholder={isEn ? 'Add new task...' : 'नया कार्य जोड़ें...'}
                  value={newTodo} onChange={e => setNewTodo(e.target.value)}
                  className="flex-1 text-xs border border-gray-200 bg-gray-50 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400 font-semibold" />
                <button type="submit" className="p-2 text-white rounded-xl border-0 cursor-pointer flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
                  <Plus className="w-4 h-4" />
                </button>
              </form>
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {todos.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">{isEn ? 'No tasks yet.' : 'कोई कार्य नहीं।'}</p>
                ) : todos.map(todo => (
                  <div key={todo.id} onClick={() => setTodos(todos.map(t => t.id === todo.id ? { ...t, done: !t.done } : t))}
                    className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between gap-3 transition-all ${todo.done ? 'bg-gray-50 border-gray-200' : 'bg-white border-blue-100 shadow-sm'}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle className={`w-4 h-4 shrink-0 ${todo.done ? 'text-gray-300' : 'text-blue-500'}`} />
                      <span className={`text-xs font-semibold truncate ${todo.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{todo.task}</span>
                    </div>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setTodos(todos.filter(t => t.id !== todo.id)); }}
                      className="text-red-400 hover:text-red-600 p-1 rounded-lg border-0 bg-transparent cursor-pointer shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              {todos.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{isEn ? 'Progress' : 'प्रगति'}</span>
                    <span>{todos.filter(t => t.done).length}/{todos.length}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                      style={{ width: `${(todos.filter(t => t.done).length / todos.length) * 100}%` }} />
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* AI Career Roadmap */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg,#fae8ff,#f3f4f6)' }}>
              <Bot className="w-4 h-4 text-purple-600" />
              <h3 className="font-black text-gray-800 text-sm">{isEn ? 'AI Career Roadmap' : 'AI करियर रोडमैप'}</h3>
            </div>
            <div className="p-5">
              <form onSubmit={generateRoadmap} className="space-y-3 mb-4">
                <select required value={domain} onChange={e => setDomain(e.target.value)}
                  className="w-full text-xs border border-gray-200 bg-gray-50 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-purple-400 font-semibold cursor-pointer">
                  <option value="">{isEn ? 'Select Career Domain' : 'करियर क्षेत्र चुनें'}</option>
                  <option value="Coding & Software">{isEn ? '💻 Coding & Software' : '💻 कोडिंग और सॉफ्टवेयर'}</option>
                  <option value="Artificial Intelligence">{isEn ? '🤖 Artificial Intelligence' : '🤖 आर्टिफिशियल इंटेलिजेंस'}</option>
                  <option value="Government Exams (UPSC/SSC)">{isEn ? '🏛️ Govt Exams (UPSC/SSC)' : '🏛️ सरकारी परीक्षा'}</option>
                  <option value="Modern Farming Technology">{isEn ? '🌾 Modern Farming' : '🌾 आधुनिक खेती'}</option>
                  <option value="Business & Commerce">{isEn ? '💼 Business & Commerce' : '💼 व्यापार और वाणिज्य'}</option>
                  <option value="Teaching & Education">{isEn ? '👩‍🏫 Teaching' : '👩‍🏫 शिक्षण'}</option>
                </select>
                <button type="submit" disabled={loadingRoadmap}
                  className="w-full text-white py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 border-0 cursor-pointer disabled:opacity-50 text-xs transition-all"
                  style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)' }}>
                  {loadingRoadmap ? <Loader className="animate-spin w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {isEn ? 'Generate Roadmap' : 'रोडमैप बनाएं'}
                </button>
              </form>
              {roadmap && !loadingRoadmap && (
                <div className="max-h-[220px] overflow-y-auto bg-purple-50/30 rounded-2xl p-4 text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {roadmap}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// ─── TEACHER DASHBOARD ──────────────────────────────────────────────────────

const TeacherDashboard = ({ user, token, isEn, navigate, updateUser }) => {
  const { toast, show, clear } = useToast();
  const req = api(token);

  // Teacher profile
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    subject: user?.teacherSubject || '',
    qualification: user?.teacherQualifications || '',
    contact: user?.teacherContact || user?.mobile || '',
    experience: user?.teacherExperience || ''
  });

  const [subjectsList, setSubjectsList] = useState([]);
  const [newSubjInput, setNewSubjInput] = useState('');

  const handleAddSubject = () => {
    if (!newSubjInput.trim()) return;
    if (subjectsList.includes(newSubjInput.trim())) return;
    setSubjectsList([...subjectsList, newSubjInput.trim()]);
    setNewSubjInput('');
  };

  const handleRemoveSubject = (idxToRemove) => {
    setSubjectsList(subjectsList.filter((_, idx) => idx !== idxToRemove));
  };

  // Batches
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchDetails, setBatchDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Create batch form
  const [showCreateBatch, setShowCreateBatch] = useState(false);
  const [batchForm, setBatchForm] = useState({ batchName: '', className: '', subject: '' });
  const [creatingBatch, setCreatingBatch] = useState(false);

  // Add student form
  const [addStudentEmail, setAddStudentEmail] = useState('');
  const [addingStudent, setAddingStudent] = useState(false);

  // Attendance
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [savingAttendance, setSavingAttendance] = useState(false);

  // Fees
  const [feesForm, setFeesForm] = useState([]);
  const [savingFees, setSavingFees] = useState(false);
  const [editingFees, setEditingFees] = useState(false);



  // Active tab within batch
  const [batchTab, setBatchTab] = useState('students');

  useEffect(() => {
    fetchBatches();
    // eslint-disable-next-line
  }, [token]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        subject: user.teacherSubject || '',
        qualification: user.teacherQualifications || '',
        contact: user.teacherContact || user.mobile || '',
        experience: user.teacherExperience || ''
      });
      setSubjectsList(user.teacherSubject ? user.teacherSubject.split(',').map(s => s.trim()).filter(Boolean) : []);
    }
  }, [user]);

  const fetchBatches = async () => {
    setLoadingBatches(true);
    try { const res = await req.get('/api/education/batches'); setBatches(res.data); }
    catch {} finally { setLoadingBatches(false); }
  };



  const fetchBatchDetails = async (batchId) => {
    setLoadingDetails(true);
    try {
      const res = await req.get(`/api/education/batches/${batchId}`);
      setBatchDetails(res.data);
      setBatches(prev => prev.map(b => b._id === batchId ? { ...b, students: res.data.students, joinRequests: res.data.joinRequests } : b));
      // Initialize attendance records
      const recs = {};
      res.data.students?.forEach(s => { recs[s.userId] = false; });
      setAttendanceRecords(recs);
      setFeesForm(res.data.fees || []);
    } catch { show(isEn ? 'Failed to load batch details.' : 'बैच विवरण लोड नहीं हो सका।', 'error'); }
    finally { setLoadingDetails(false); }
  };

  const openBatch = (batch) => {
    setSelectedBatch(batch);
    fetchBatchDetails(batch._id);
    setBatchTab('students');
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    try {
      const finalSubjectString = subjectsList.join(', ');
      const res = await req.put('/api/auth/profile', {
        teacherSubject: finalSubjectString,
        teacherQualifications: profileForm.qualification,
        teacherContact: profileForm.contact,
        teacherExperience: profileForm.experience
      });
      updateUser(res.data);
      setProfileForm(prev => ({ ...prev, subject: finalSubjectString }));
      setEditingProfile(false);
      show(isEn ? 'Profile updated!' : 'प्रोफ़ाइल अपडेट!');
    } catch { show(isEn ? 'Update failed.' : 'अपडेट विफल।', 'error'); }
  };

  const createBatch = async (e) => {
    e.preventDefault();
    setCreatingBatch(true);
    try {
      const res = await req.post('/api/education/batches', batchForm);
      setBatches([res.data, ...batches]);
      setShowCreateBatch(false);
      setBatchForm({ batchName: '', className: '', subject: '' });
      show(isEn ? 'Batch created!' : 'बैच बनाया!');
      openBatch(res.data);
    } catch { show(isEn ? 'Failed to create batch.' : 'बैच नहीं बना।', 'error'); }
    finally { setCreatingBatch(false); }
  };

  const addStudent = async (e) => {
    e.preventDefault();
    setAddingStudent(true);
    try {
      await req.post(`/api/education/batches/${selectedBatch._id}/add-student`, { email: addStudentEmail });
      setAddStudentEmail('');
      fetchBatchDetails(selectedBatch._id);
      show(isEn ? 'Student added!' : 'छात्र जोड़ा!');
    } catch (err) {
      show(err.response?.data?.message || (isEn ? 'Failed to add student.' : 'छात्र नहीं जोड़ा गया।'), 'error');
    } finally { setAddingStudent(false); }
  };

  const removeStudent = async (userId) => {
    if (!window.confirm(isEn ? 'Remove this student?' : 'इस छात्र को हटाएं?')) return;
    try {
      await req.delete(`/api/education/batches/${selectedBatch._id}/students/${userId}`);
      fetchBatchDetails(selectedBatch._id);
      show(isEn ? 'Student removed.' : 'छात्र हटाया।');
    } catch { show(isEn ? 'Failed to remove.' : 'हटाने में विफल।', 'error'); }
  };

  const handleJoinRequest = async (requestId, action) => {
    try {
      await req.put(`/api/education/batches/${selectedBatch._id}/join-requests/${requestId}`, { action });
      fetchBatchDetails(selectedBatch._id);
      show(isEn ? `Request ${action}d!` : `अनुरोध ${action === 'approve' ? 'स्वीकृत' : 'अस्वीकृत'}!`);
    } catch { show(isEn ? 'Action failed.' : 'कार्यवाही विफल।', 'error'); }
  };

  const saveAttendance = async () => {
    setSavingAttendance(true);
    try {
      const records = Object.entries(attendanceRecords).map(([userId, present]) => ({ userId, present }));
      await req.post(`/api/education/batches/${selectedBatch._id}/attendance`, { date: attendanceDate, records });
      show(isEn ? 'Attendance saved!' : 'उपस्थिति सहेजी!');
    } catch { show(isEn ? 'Failed to save attendance.' : 'उपस्थिति सहेजने में विफल।', 'error'); }
    finally { setSavingAttendance(false); }
  };

  const saveFees = async () => {
    setSavingFees(true);
    try {
      await req.put(`/api/education/batches/${selectedBatch._id}/fees`, { fees: feesForm });
      fetchBatchDetails(selectedBatch._id);
      setEditingFees(false);
      show(isEn ? 'Fees updated!' : 'फीस अपडेट!');
    } catch { show(isEn ? 'Failed to save fees.' : 'फीस सहेजने में विफल।', 'error'); }
    finally { setSavingFees(false); }
  };

  const toggleFeePaid = async (studentId, feeId, current) => {
    try {
      await req.put(`/api/education/batches/${selectedBatch._id}/students/${studentId}/fees/${feeId}`, { paid: !current });
      fetchBatchDetails(selectedBatch._id);
    } catch { show(isEn ? 'Failed to update.' : 'अपडेट विफल।', 'error'); }
  };



  return (
    <div className="space-y-6">
      <AnimatePresence>{toast && <Toast {...toast} onClose={clear} />}</AnimatePresence>

      {/* ── Teacher Header ── */}
      <div className="relative overflow-hidden rounded-3xl p-8 text-white"
        style={{ background: 'linear-gradient(135deg,#ea580c 0%,#f97316 50%,#fbbf24 100%)' }}>
        <div className="relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black">{isEn ? 'Teacher Dashboard' : 'शिक्षक डैशबोर्ड'}</h2>
                <p className="text-orange-100 text-sm">{user?.fullName}</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateBatch(true)}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-5 py-2.5 rounded-2xl text-sm font-bold border-0 cursor-pointer transition-all">
              <Plus className="w-4 h-4" />
              {isEn ? 'Create Batch' : 'बैच बनाएं'}
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { label: user?.teacherSubject || (isEn ? 'Subject not set' : 'विषय सेट नहीं'), icon: '📖' },
              { label: user?.teacherExperience || 'N/A', icon: '⏳' },
              { label: `${batches.length} ${isEn ? 'Batches' : 'बैच'}`, icon: '👥' },
            ].map((item, i) => (
              <span key={i} className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-1 text-xs font-bold flex items-center gap-1">
                {item.icon} {item.label}
              </span>
            ))}
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle,#fff,transparent)', transform: 'translate(30%,-30%)' }} />
      </div>

      {/* Create Batch Modal */}
      <AnimatePresence>
        {showCreateBatch && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-orange-50">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-orange-600" />
                  <h3 className="font-black text-gray-800">{isEn ? 'Create New Batch' : 'नया बैच बनाएं'}</h3>
                </div>
                <button onClick={() => setShowCreateBatch(false)} className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center cursor-pointer border-1">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <form onSubmit={createBatch} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">{isEn ? 'Batch Name' : 'बैच का नाम'}</label>
                  <input required type="text" placeholder={isEn ? 'e.g. Morning Batch 2025' : 'जैसे मॉर्निंग बैच 2025'}
                    value={batchForm.batchName} onChange={e => setBatchForm({ ...batchForm, batchName: e.target.value })}
                    className="w-full text-sm border border-gray-200 bg-gray-50 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400 font-semibold" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">{isEn ? 'Class / Semester' : 'कक्षा / सेमेस्टर'}</label>
                  <input required type="text" placeholder={isEn ? 'e.g. 10th Grade, Sem 3' : 'जैसे 10वीं, Sem 3'}
                    value={batchForm.className} onChange={e => setBatchForm({ ...batchForm, className: e.target.value })}
                    className="w-full text-sm border border-gray-200 bg-gray-50 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400 font-semibold" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">{isEn ? 'Subject (optional)' : 'विषय (वैकल्पिक)'}</label>
                  <select value={batchForm.subject} onChange={e => setBatchForm({ ...batchForm, subject: e.target.value })}
                    className="w-full text-sm border border-gray-200 bg-gray-50 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400 font-semibold cursor-pointer">
                    <option value="">{isEn ? 'Select subject' : 'विषय चुनें'}</option>
                    <option value="Mathematics">{isEn ? 'Mathematics' : 'गणित'}</option>
                    <option value="Science">{isEn ? 'Science' : 'विज्ञान'}</option>
                    <option value="English">English</option>
                    <option value="Hindi">{isEn ? 'Hindi' : 'हिंदी'}</option>
                    <option value="Social Science">{isEn ? 'Social Science' : 'सामाजिक विज्ञान'}</option>
                    <option value="Sanskrit">{isEn ? 'Sanskrit' : 'संस्कृत'}</option>
                    <option value="All Subjects">{isEn ? 'All Subjects' : 'सभी विषय'}</option>
                  </select>
                </div>
                <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
                  <button type="button" onClick={() => setShowCreateBatch(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold border-0 cursor-pointer">
                    {isEn ? 'Cancel' : 'रद्द'}
                  </button>
                  <button type="submit" disabled={creatingBatch}
                    className="px-5 py-2 text-white rounded-xl text-xs font-bold border-0 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
                    {creatingBatch ? <Loader className="animate-spin w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    {isEn ? 'Create Batch' : 'बनाएं'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ── LEFT: Teacher Profile + Batches List ── */}
        <div className="space-y-6">

          {/* Teaching Profile Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-orange-50">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-orange-600" />
                <h3 className="font-black text-gray-800 text-sm">{isEn ? 'Teaching Profile' : 'शिक्षण प्रोफ़ाइल'}</h3>
              </div>
              <button onClick={() => setEditingProfile(!editingProfile)}
                className="text-xs text-orange-600 font-bold bg-transparent border-0 cursor-pointer hover:text-orange-700 flex items-center gap-1">
                <Edit2 className="w-3 h-3" />
                {editingProfile ? (isEn ? 'Cancel' : 'रद्द') : (isEn ? 'Edit' : 'बदलें')}
              </button>
            </div>
            {editingProfile ? (
              <form onSubmit={updateProfile} className="p-5 space-y-4 text-left">
                {/* Subject Selector Text Section */}
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    {isEn ? 'Subjects' : 'विषय'}
                  </label>
                  
                  {/* Current subjects list (1, 2, 3...) */}
                  {subjectsList.length > 0 && (
                    <div className="space-y-1.5 mb-2.5">
                      {subjectsList.map((subj, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-gray-50 border border-gray-150 rounded-xl px-3 py-2 text-xs font-bold text-gray-700">
                          <span>{idx + 1}. {subj}</span>
                          <button type="button" onClick={() => handleRemoveSubject(idx)}
                            className="text-red-500 hover:text-red-755 bg-transparent border-0 cursor-pointer p-0.5 flex items-center justify-center transition-all hover:scale-105 active:scale-95">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add subject text input */}
                  <div className="flex gap-2">
                    <input type="text" value={newSubjInput} onChange={e => setNewSubjInput(e.target.value)}
                      placeholder={isEn ? 'Enter subject name...' : 'विषय का नाम दर्ज करें...'}
                      className="flex-1 text-xs border border-gray-250 bg-gray-50 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-orange-400 font-semibold" />
                    <button type="button" onClick={handleAddSubject}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl border-0 cursor-pointer transition-all active:scale-95 whitespace-nowrap">
                      {isEn ? 'Add Subject' : 'विषय जोड़ें'}
                    </button>
                  </div>
                </div>

                {[
                  { label: isEn ? 'Qualification' : 'योग्यता', key: 'qualification', placeholder: 'e.g. B.Ed, M.Sc' },
                  { label: isEn ? 'Experience' : 'अनुभव', key: 'experience', placeholder: 'e.g. 5 Years' },
                  { label: isEn ? 'Contact' : 'संपर्क', key: 'contact', placeholder: '9876543210' },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">{label}</label>
                    <input type="text" placeholder={placeholder} value={profileForm[key]}
                      onChange={e => setProfileForm({ ...profileForm, [key]: e.target.value })}
                      className="w-full text-xs border border-gray-200 bg-gray-50 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400 font-semibold" />
                  </div>
                ))}
                
                <button type="submit" className="w-full text-white py-2.5 rounded-xl font-bold text-xs border-0 cursor-pointer flex items-center justify-center gap-1.5 mt-2 transition-all active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
                  <Save className="w-3.5 h-3.5" />
                  {isEn ? 'Save Changes' : 'सहेजें'}
                </button>
              </form>
            ) : (
              <div className="p-5 space-y-3 text-left">
                {/* Subject list representation (1, 2, 3...) */}
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{isEn ? 'Subject' : 'विषय'}</span>
                  {subjectsList.length === 0 ? (
                    <span className="font-bold text-gray-800 text-sm mt-0.5">{isEn ? 'Not set' : 'सेट नहीं'}</span>
                  ) : (
                    <ol className="list-decimal list-inside pl-1 mt-1.5 space-y-1">
                      {subjectsList.map((subj, idx) => (
                        <li key={idx} className="font-bold text-gray-800 text-sm">{subj}</li>
                      ))}
                    </ol>
                  )}
                </div>

                {[
                  { label: isEn ? 'Qualification' : 'योग्यता', value: user?.teacherQualifications },
                  { label: isEn ? 'Experience' : 'अनुभव', value: user?.teacherExperience },
                  { label: isEn ? 'Contact' : 'संपर्क', value: user?.teacherContact || user?.mobile },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
                    <span className="font-bold text-gray-800 text-sm mt-0.5">{value || (isEn ? 'Not set' : 'सेट नहीं')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Batches List */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-50">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-indigo-600" />
                <h3 className="font-black text-gray-800 text-sm">{isEn ? 'My Batches' : 'मेरे बैच'}</h3>
              </div>
              <span className="text-xs bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5 font-bold">{batches.length}</span>
            </div>
            <div className="p-4 space-y-3 max-h-[380px] overflow-y-auto">
              {loadingBatches ? (
                <div className="flex justify-center py-6"><Loader className="animate-spin w-5 h-5 text-indigo-500" /></div>
              ) : batches.length === 0 ? (
                <div className="text-center py-6">
                  <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">{isEn ? 'No batches yet. Create one!' : 'कोई बैच नहीं। बनाएं!'}</p>
                </div>
              ) : batches.map(batch => (
                <button key={batch._id} onClick={() => openBatch(batch)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${selectedBatch?._id === batch._id ? 'border-orange-300 bg-orange-50' : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'}`}>
                  <p className="font-bold text-gray-800 text-sm">{batch.batchName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isEn ? 'Class' : 'कक्षा'} {batch.className}
                    {batch.subject ? ` • ${batch.subject}` : ''}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] bg-blue-100 text-blue-700 rounded-lg px-2 py-0.5 font-bold">
                      {batch.students?.length || 0} {isEn ? 'Students' : 'छात्र'}
                    </span>
                    {(batch.joinRequests?.filter(r => r.status === 'pending')?.length || 0) > 0 && (
                      <span className="text-[10px] bg-yellow-100 text-yellow-700 rounded-lg px-2 py-0.5 font-bold">
                        {batch.joinRequests.filter(r => r.status === 'pending').length} {isEn ? 'pending' : 'अनुरोध'}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Batch Details + Announcement ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Batch Details Panel */}
          {selectedBatch ? (
            <AnimatePresence mode="wait">
              <motion.div key={selectedBatch._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Batch Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between"
                  style={{ background: 'linear-gradient(135deg,#fff7ed,#f3f4f6)' }}>
                  <div>
                    <h3 className="font-black text-gray-800">{selectedBatch.batchName}</h3>
                    <p className="text-xs text-gray-500">{isEn ? 'Class' : 'कक्षा'} {selectedBatch.className} {selectedBatch.subject ? `• ${selectedBatch.subject}` : ''}</p>
                  </div>
                  {selectedBatch.chatRoomId && (
                    <button onClick={() => navigate(`/chat?roomId=${selectedBatch.chatRoomId}`)}
                      className="flex items-center gap-1.5 text-xs font-bold text-white rounded-xl px-4 py-2 border-0 cursor-pointer transition-all"
                      style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
                      <MessageSquare className="w-3.5 h-3.5" />
                      {isEn ? 'Open Group Chat' : 'ग्रुप चैट'}
                    </button>
                  )}
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100">
                  {[
                    { key: 'students', label: isEn ? 'Students' : 'छात्र', icon: Users },
                    { key: 'attendance', label: isEn ? 'Attendance' : 'उपस्थिति', icon: CheckSquare },
                    { key: 'fees', label: isEn ? 'Fees' : 'शुल्क', icon: DollarSign },
                    { key: 'requests', label: isEn ? 'Requests' : 'अनुरोध', icon: UserPlus },
                  ].map(({ key, label, icon: Icon }) => (
                    <button key={key} onClick={() => setBatchTab(key)}
                      className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold transition-all border-0 cursor-pointer border-b-2 ${batchTab === key ? 'border-orange-500 text-orange-600 bg-orange-50' : 'border-transparent text-gray-500 hover:text-gray-700 bg-transparent'}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                      {key === 'requests' && (batchDetails?.joinRequests?.filter(r => r.status === 'pending').length || 0) > 0 && (
                        <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-black">
                          {batchDetails.joinRequests.filter(r => r.status === 'pending').length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {loadingDetails ? (
                  <div className="flex justify-center py-12"><Loader className="animate-spin w-6 h-6 text-orange-500" /></div>
                ) : (
                  <div className="p-6">

                    {/* ── STUDENTS TAB ── */}
                    {batchTab === 'students' && (
                    <div className="space-y-5">

                      {/* Add Student Panel */}
                      <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-4">
                        <p className="text-xs font-black text-orange-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <UserPlus className="w-3.5 h-3.5" />
                          {isEn ? 'Add Student by Email' : 'ईमेल से छात्र जोड़ें'}
                        </p>
                        <form onSubmit={addStudent} className="flex gap-2">
                          <input type="email" required
                            placeholder={isEn ? 'Enter student Gmail address...' : 'छात्र की Gmail ID दर्ज करें...'}
                            value={addStudentEmail} onChange={e => setAddStudentEmail(e.target.value)}
                            className="flex-1 text-sm border border-orange-200 bg-white rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-orange-400 font-semibold" />
                          <button type="submit" disabled={addingStudent}
                            className="px-5 py-2 text-white rounded-xl font-bold text-sm border-0 cursor-pointer flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
                            style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
                            {addingStudent ? <Loader className="animate-spin w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                            {isEn ? 'Add' : 'जोड़ें'}
                          </button>
                        </form>
                      </div>

                      {/* Students count */}
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-black text-gray-500 uppercase tracking-wider">
                          {isEn ? `${batchDetails?.students?.length || 0} Students Enrolled` : `${batchDetails?.students?.length || 0} छात्र नामांकित`}
                        </p>
                        {(batchDetails?.students?.length || 0) > 0 && (
                          <span className="text-[10px] text-gray-400">
                            {isEn ? 'Circle = attendance %' : 'वृत्त = उपस्थिति %'}
                          </span>
                        )}
                      </div>

                      {/* Student Cards */}
                      {(!batchDetails?.students || batchDetails.students.length === 0) ? (
                        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100">
                          <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                          <p className="text-sm font-bold text-gray-400">{isEn ? 'No students enrolled yet.' : 'अभी कोई छात्र नामांकित नहीं।'}</p>
                          <p className="text-xs text-gray-400 mt-1">{isEn ? 'Use the form above to add students.' : 'ऊपर की फॉर्म से छात्रों को जोड़ें।'}</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                          {batchDetails.students.map((student) => {
                            const allDays = batchDetails.attendance || [];
                            const presentDays = allDays.filter(day =>
                              day.records?.some(r => r.userId?.toString() === student.userId?.toString() && r.present)
                            ).length;
                            const totalDays = allDays.length;
                            const pct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : null;
                            const pctColor = pct === null ? '#9ca3af' : pct >= 75 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';

                            return (
                              <div key={student.userId} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                                {/* Main info row */}
                                <div className="flex items-center gap-3 p-4">
                                  {/* Avatar */}
                                  <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-white text-sm uppercase shrink-0"
                                    style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
                                    {(student.profile?.fullName || student.fullName || '?').slice(0, 2)}
                                  </div>
                                  {/* Details */}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-black text-gray-800 text-sm truncate">
                                      {student.profile?.fullName || student.fullName}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">{student.email}</p>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                      {student.profile?.village && (
                                        <span className="text-[10px] text-gray-400">📍 {student.profile.village}</span>
                                      )}
                                      {student.profile?.gender && (
                                        <span className="text-[10px] bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 font-medium capitalize">
                                          {student.profile.gender}
                                        </span>
                                      )}
                                      <span className="text-[10px] text-gray-400">
                                        {isEn ? 'Joined' : 'जुड़े'}: {new Date(student.joinedAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                  {/* Attendance % */}
                                  <div className="text-center shrink-0 mr-1">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center border-2"
                                      style={{ borderColor: pctColor }}>
                                      <span className="text-xs font-black" style={{ color: pctColor }}>
                                        {pct !== null ? `${pct}%` : '—'}
                                      </span>
                                    </div>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">{isEn ? 'Attend.' : 'उपस्.'}</p>
                                  </div>
                                  {/* Remove button */}
                                  <button onClick={() => removeStudent(student.userId)}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border-0 cursor-pointer shrink-0 transition-all font-bold text-xs">
                                    <Trash2 className="w-3.5 h-3.5" />
                                    {isEn ? 'Remove' : 'हटाएं'}
                                  </button>
                                </div>
                                {/* Attendance history mini-chart (last 20 days) */}
                                {totalDays > 0 && (
                                  <div className="px-4 pb-3 pt-0 border-t border-gray-50">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-2 mb-2">
                                      {isEn ? `Attendance History — ${presentDays}/${totalDays} days` : `उपस्थिति इतिहास — ${presentDays}/${totalDays} दिन`}
                                    </p>
                                    <div className="flex gap-1 flex-wrap">
                                      {allDays.slice(-20).map((day, idx) => {
                                        const rec = day.records?.find(r => r.userId?.toString() === student.userId?.toString());
                                        const present = rec?.present;
                                        return (
                                          <div key={idx} title={day.date} className="flex flex-col items-center gap-0.5">
                                            <div className={`w-6 h-6 rounded-md text-[9px] font-black flex items-center justify-center ${
                                              present ? 'bg-green-500 text-white' : rec ? 'bg-red-400 text-white' : 'bg-gray-100 text-gray-300'
                                            }`}>
                                              {present ? '✓' : rec ? '✗' : '—'}
                                            </div>
                                            <span className="text-[8px] text-gray-300">{day.date?.slice(5)}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    )}

                    {/* ── ATTENDANCE TAB ── */}
                    {batchTab === 'attendance' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 flex-wrap">
                          <label className="text-xs font-bold text-gray-500 uppercase">{isEn ? 'Date' : 'तारीख'}:</label>
                          <input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)}
                            className="text-sm border border-gray-200 bg-gray-50 rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-orange-400 font-semibold" />
                          <button onClick={saveAttendance} disabled={savingAttendance}
                            className="px-4 py-1.5 text-white rounded-xl font-bold text-xs border-0 cursor-pointer flex items-center gap-1 disabled:opacity-50 ml-auto"
                            style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
                            {savingAttendance ? <Loader className="animate-spin w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                            {isEn ? 'Save Attendance' : 'उपस्थिति सहेजें'}
                          </button>
                        </div>

                        {(!batchDetails?.students || batchDetails.students.length === 0) ? (
                          <p className="text-xs text-gray-400 text-center py-8">{isEn ? 'Add students first.' : 'पहले छात्र जोड़ें।'}</p>
                        ) : (
                          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                            <div className="flex items-center gap-2 mb-3">
                              <button onClick={() => {
                                const allPresent = {};
                                batchDetails.students.forEach(s => { allPresent[s.userId] = true; });
                                setAttendanceRecords(allPresent);
                              }} className="text-xs bg-green-100 text-green-700 font-bold px-3 py-1 rounded-lg border-0 cursor-pointer">
                                {isEn ? '✓ All Present' : '✓ सभी उपस्थित'}
                              </button>
                              <button onClick={() => {
                                const allAbsent = {};
                                batchDetails.students.forEach(s => { allAbsent[s.userId] = false; });
                                setAttendanceRecords(allAbsent);
                              }} className="text-xs bg-red-100 text-red-700 font-bold px-3 py-1 rounded-lg border-0 cursor-pointer">
                                {isEn ? '✗ All Absent' : '✗ सभी अनुपस्थित'}
                              </button>
                            </div>
                            {batchDetails.students.map(student => (
                              <div key={student.userId}
                                onClick={() => setAttendanceRecords(prev => ({ ...prev, [student.userId]: !prev[student.userId] }))}
                                className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${attendanceRecords[student.userId] ? 'bg-green-50 border-green-200' : 'bg-red-50/50 border-red-100'}`}>
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${attendanceRecords[student.userId] ? 'bg-green-500 text-white' : 'bg-red-300 text-white'}`}>
                                  {attendanceRecords[student.userId] ? '✓' : '✗'}
                                </div>
                                <span className="font-semibold text-sm text-gray-800">{student.profile?.fullName || student.fullName}</span>
                                <span className={`ml-auto text-xs font-bold ${attendanceRecords[student.userId] ? 'text-green-600' : 'text-red-500'}`}>
                                  {attendanceRecords[student.userId] ? (isEn ? 'Present' : 'उपस्थित') : (isEn ? 'Absent' : 'अनुपस्थित')}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── FEES TAB ── */}
                    {batchTab === 'fees' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-gray-700 text-sm">{isEn ? 'Fee Structure' : 'शुल्क संरचना'}</h4>
                          <div className="flex gap-2">
                            {editingFees && (
                              <button onClick={() => setFeesForm([...feesForm, { label: '', amount: '', dueDate: '' }])}
                                className="text-xs bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-lg border-0 cursor-pointer flex items-center gap-1">
                                <Plus className="w-3 h-3" />
                                {isEn ? 'Add Fee' : 'फीस जोड़ें'}
                              </button>
                            )}
                            <button onClick={() => { if (editingFees) saveFees(); else setEditingFees(true); }}
                              disabled={savingFees}
                              className="text-xs text-white font-bold px-3 py-1 rounded-lg border-0 cursor-pointer flex items-center gap-1 disabled:opacity-50"
                              style={{ background: editingFees ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'linear-gradient(135deg,#f97316,#ea580c)' }}>
                              {savingFees ? <Loader className="animate-spin w-3 h-3" /> : editingFees ? <Save className="w-3 h-3" /> : <Edit2 className="w-3 h-3" />}
                              {editingFees ? (isEn ? 'Save Fees' : 'सहेजें') : (isEn ? 'Edit Fees' : 'फीस बदलें')}
                            </button>
                          </div>
                        </div>

                        {editingFees ? (
                          <div className="space-y-3">
                            {feesForm.map((fee, idx) => (
                              <div key={idx} className="p-3 border border-gray-200 rounded-xl space-y-2 bg-gray-50/50">
                                <div className="grid grid-cols-2 gap-2">
                                  <input type="text" placeholder={isEn ? 'Label (e.g. Monthly Fee)' : 'लेबल (जैसे मासिक शुल्क)'}
                                    value={fee.label} onChange={e => { const f = [...feesForm]; f[idx].label = e.target.value; setFeesForm(f); }}
                                    className="text-xs border border-gray-200 bg-white rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-orange-400 font-semibold col-span-2" />
                                  <input type="number" placeholder={isEn ? 'Amount (₹)' : 'राशि (₹)'}
                                    value={fee.amount} onChange={e => { const f = [...feesForm]; f[idx].amount = e.target.value; setFeesForm(f); }}
                                    className="text-xs border border-gray-200 bg-white rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-orange-400 font-semibold" />
                                  <input type="date" value={fee.dueDate} onChange={e => { const f = [...feesForm]; f[idx].dueDate = e.target.value; setFeesForm(f); }}
                                    className="text-xs border border-gray-200 bg-white rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-orange-400 font-semibold" />
                                </div>
                                <button type="button" onClick={() => setFeesForm(feesForm.filter((_, i) => i !== idx))}
                                  className="text-xs text-red-500 font-bold bg-transparent border-0 cursor-pointer">
                                  {isEn ? '✗ Remove' : '✗ हटाएं'}
                                </button>
                              </div>
                            ))}
                            {feesForm.length === 0 && (
                              <p className="text-xs text-gray-400 text-center py-4">{isEn ? 'No fees added.' : 'कोई शुल्क नहीं।'}</p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {feesForm.length === 0 ? (
                              <p className="text-xs text-gray-400 text-center py-8">{isEn ? 'No fees configured.' : 'कोई शुल्क नहीं।'}</p>
                            ) : (
                              <>
                                <div className="grid grid-cols-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-2 border-b border-gray-100">
                                  <span>{isEn ? 'Fee' : 'शुल्क'}</span>
                                  <span className="text-center">{isEn ? 'Amount' : 'राशि'}</span>
                                  <span className="text-right">{isEn ? 'Due Date' : 'अंतिम तिथि'}</span>
                                </div>
                                {feesForm.map((fee, idx) => (
                                  <div key={idx} className="grid grid-cols-3 items-center text-sm py-2 border-b border-gray-50">
                                    <span className="font-semibold text-gray-800 text-xs">{fee.label}</span>
                                    <span className="text-center font-bold text-orange-600 text-xs">₹{fee.amount}</span>
                                    <span className="text-right text-xs text-gray-500">{fee.dueDate || '—'}</span>
                                  </div>
                                ))}
                              </>
                            )}

                            {/* Per-student fee payment status */}
                            {feesForm.length > 0 && batchDetails?.students?.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-gray-100">
                                <h5 className="text-xs font-bold text-gray-600 mb-3">{isEn ? 'Payment Status' : 'भुगतान स्थिति'}</h5>
                                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                  {batchDetails.students.map(student => (
                                    <div key={student.userId} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                      <p className="text-xs font-bold text-gray-700 mb-2">
                                        {student.profile?.fullName || student.fullName}
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                        {feesForm.map((fee, feeIdx) => {
                                          const feeId = batchDetails.fees?.[feeIdx]?._id;
                                          const paid = student.feesPaid && feeId ? student.feesPaid[feeId] : false;
                                          return (
                                            <button key={feeIdx}
                                              onClick={() => feeId && toggleFeePaid(student.userId, feeId, paid)}
                                              className={`text-[10px] font-bold px-2 py-1 rounded-lg border-0 cursor-pointer transition-all ${paid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                              {paid ? '✓' : '✗'} {fee.label} ₹{fee.amount}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── JOIN REQUESTS TAB ── */}
                    {batchTab === 'requests' && (
                      <div className="space-y-3">
                        {(!batchDetails?.joinRequests || batchDetails.joinRequests.filter(r => r.status === 'pending').length === 0) ? (
                          <div className="text-center py-8">
                            <CheckCircle className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">{isEn ? 'No pending requests.' : 'कोई अनुरोध नहीं।'}</p>
                          </div>
                        ) : (
                          batchDetails.joinRequests.filter(r => r.status === 'pending').map(req => (
                            <div key={req._id} className="p-4 rounded-2xl border border-yellow-100 bg-yellow-50/50 flex items-center justify-between gap-4">
                              <div>
                                <p className="font-bold text-gray-800 text-sm">{req.fullName}</p>
                                <p className="text-xs text-gray-500">{req.email}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                  {new Date(req.requestedAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <button onClick={() => handleJoinRequest(req._id, 'approve')}
                                  className="flex items-center gap-1 text-xs font-bold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-xl border-0 cursor-pointer transition-all">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  {isEn ? 'Approve' : 'स्वीकृत'}
                                </button>
                                <button onClick={() => handleJoinRequest(req._id, 'reject')}
                                  className="flex items-center gap-1 text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-xl border-0 cursor-pointer transition-all">
                                  <X className="w-3.5 h-3.5" />
                                  {isEn ? 'Reject' : 'अस्वीकृत'}
                                </button>
                              </div>
                            </div>
                          ))
                        )}

                        {/* Approved history */}
                        {batchDetails?.joinRequests?.filter(r => r.status !== 'pending').length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{isEn ? 'History' : 'इतिहास'}</p>
                            {batchDetails.joinRequests.filter(r => r.status !== 'pending').map(req => (
                              <div key={req._id} className="flex items-center gap-3 py-2 text-xs">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-white text-[9px] ${req.status === 'approved' ? 'bg-green-500' : 'bg-red-400'}`}>
                                  {req.status === 'approved' ? '✓' : '✗'}
                                </span>
                                <span className="font-semibold text-gray-700">{req.fullName}</span>
                                <span className={`ml-auto font-bold ${req.status === 'approved' ? 'text-green-600' : 'text-red-500'}`}>
                                  {req.status === 'approved' ? (isEn ? 'Approved' : 'स्वीकृत') : (isEn ? 'Rejected' : 'अस्वीकृत')}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center py-16 text-center">
              <ClipboardList className="w-16 h-16 text-gray-200 mb-4" />
              <h3 className="font-black text-gray-700 text-lg mb-1">
                {isEn ? 'Select a Batch' : 'एक बैच चुनें'}
              </h3>
              <p className="text-sm text-gray-400 max-w-xs">
                {isEn ? 'Click on a batch from the left to manage students, attendance, and fees.' : 'छात्र, उपस्थिति और शुल्क प्रबंधित करने के लिए बाईं ओर से बैच चुनें।'}
              </p>
            </div>
          )}          
        </div>
      </div>
    </div>
  );
};

// ─── TEACHER REGISTRATION FORM (for non-teachers) ───────────────────────────

const TeacherRegModal = ({ isEn, token, onClose, onSuccess }) => {
  const [form, setForm] = useState({ subject: '', qualification: '', contact: '', experience: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${CONFIG.API_BASE_URL}/api/education/register-teacher`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onSuccess(res.data);
    } catch { alert(isEn ? 'Registration failed.' : 'पंजीकरण विफल।'); }
    finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-600" />
            <h3 className="font-black text-gray-800">{isEn ? 'Register as Teacher' : 'शिक्षक पंजीकरण'}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center cursor-pointer">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {[
            { label: isEn ? 'Subject' : 'विषय', key: 'subject', type: 'select' },
            { label: isEn ? 'Qualification' : 'योग्यता', key: 'qualification', type: 'text', placeholder: 'e.g. B.Ed, M.Sc', required: true },
            { label: isEn ? 'Experience' : 'अनुभव', key: 'experience', type: 'text', placeholder: 'e.g. 5 Years' },
            { label: isEn ? 'Contact' : 'संपर्क', key: 'contact', type: 'text', placeholder: '9876543210', required: true },
          ].map(({ label, key, type, placeholder, required: req }) => (
            <div key={key}>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">{label}</label>
              {type === 'select' ? (
                <select required value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                  className="w-full text-sm border border-gray-200 bg-gray-50 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-400 font-semibold cursor-pointer">
                  <option value="">{isEn ? 'Select Subject' : 'विषय चुनें'}</option>
                  <option value="Mathematics">{isEn ? 'Mathematics' : 'गणित'}</option>
                  <option value="Science">{isEn ? 'Science' : 'विज्ञान'}</option>
                  <option value="English">English</option>
                  <option value="Hindi">{isEn ? 'Hindi' : 'हिंदी'}</option>
                  <option value="Social Science">{isEn ? 'Social Science' : 'सामाजिक विज्ञान'}</option>
                  <option value="Sanskrit">{isEn ? 'Sanskrit' : 'संस्कृत'}</option>
                  <option value="Other">{isEn ? 'Multi-subject' : 'बहु-विषय'}</option>
                </select>
              ) : (
                <input type={type} required={!!req} placeholder={placeholder} value={form[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  className="w-full text-sm border border-gray-200 bg-gray-50 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-400 font-semibold" />
              )}
            </div>
          ))}
          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold border-0 cursor-pointer">
              {isEn ? 'Cancel' : 'रद्द'}
            </button>
            <button type="submit" disabled={loading}
              className="px-5 py-2 text-white rounded-xl text-xs font-bold border-0 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
              {loading ? <Loader className="animate-spin w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
              {isEn ? 'Register' : 'पंजीकरण करें'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// ─── MAIN EDUCATION COMPONENT ────────────────────────────────────────────────

const Education = () => {
  const { t, locale } = useLanguage();
  const { token, user, updateUser } = useAuth();
  const navigate = useNavigate();

  const isEn = locale === 'en';
  const isStudent = user?.categories?.includes('student');
  const isTeacher = user?.categories?.includes('teacher');
  const isBoth = isStudent && isTeacher;
  const hasAccess = isStudent || isTeacher;
  const [showTeacherReg, setShowTeacherReg] = useState(false);
  // When user has both roles, default to teacher view; single-role users always see their view
  const [activeRole, setActiveRole] = useState(isTeacher ? 'teacher' : 'student');

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 text-left">

      {/* ── Global Header ── */}
      <div className="relative overflow-hidden rounded-3xl p-8 text-white"
        style={{ background: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#4338ca 100%)' }}>
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <GraduationCap className="w-8 h-8 text-indigo-200" />
              <h1 className="text-3xl font-black">{t('education.title')}</h1>
            </div>
            <p className="text-indigo-300 text-sm">{t('education.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {!isTeacher && (
              <button onClick={() => setShowTeacherReg(true)}
                className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm px-5 py-2.5 rounded-2xl text-sm font-bold border-0 cursor-pointer transition-all border border-white/20">
                <UserCheck className="w-4 h-4" />
                {isEn ? 'Register as Teacher' : 'शिक्षक के रूप में पंजीकरण'}
              </button>
            )}
          </div>
        </div>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M30 5L55 20v30L30 55 5 50V20z\' fill=\'none\' stroke=\'white\' stroke-width=\'1\'/%3E%3C/svg%3E")', backgroundSize: '60px' }} />
      </div>

      {/* ── ROLE SWITCHER (only when user has both student + teacher roles) ── */}
      {isBoth && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 p-1.5 bg-white rounded-2xl shadow-sm border border-gray-100 w-fit">
          {[
            { key: 'teacher', label: isEn ? '👨‍🏫 Teacher Dashboard' : '👨‍🏫 शिक्षक डैशबोर्ड', color: '#ea580c' },
            { key: 'student', label: isEn ? '📚 Student Dashboard' : '📚 छात्र डैशबोर्ड', color: '#4f46e5' },
          ].map(tab => (
            <button key={tab.key}
              onClick={() => setActiveRole(tab.key)}
              className="px-5 py-2.5 rounded-xl text-sm font-black transition-all border-0 cursor-pointer"
              style={activeRole === tab.key
                ? { background: tab.color, color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }
                : { background: 'transparent', color: '#6b7280' }
              }>
              {tab.label}
            </button>
          ))}
        </motion.div>
      )}

      {/* Teacher registration modal */}
      <AnimatePresence>
        {showTeacherReg && (
          <TeacherRegModal
            isEn={isEn}
            token={token}
            onClose={() => setShowTeacherReg(false)}
            onSuccess={(data) => {
              updateUser(data);
              setShowTeacherReg(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* No Access State */}
      {!hasAccess && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center mb-5">
            <AlertCircle className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">
            {isEn ? 'Education Profile Required' : 'शिक्षा प्रोफ़ाइल आवश्यक'}
          </h2>
          <p className="text-gray-500 max-w-md text-sm leading-relaxed">
            {isEn
              ? 'This module is for students and teachers. Update your profile to mark yourself as a student, or register as a teacher using the button above.'
              : 'यह मॉड्यूल छात्रों और शिक्षकों के लिए है। अपनी प्रोफ़ाइल अपडेट करें या ऊपर के बटन से शिक्षक के रूप में पंजीकरण करें।'}
          </p>
        </motion.div>
      )}

      {/* ── Dashboard render logic ── */}
      <AnimatePresence mode="wait">
        {/* Student-only OR both-roles showing student tab */}
        {hasAccess && (isStudent && !isTeacher || isBoth && activeRole === 'student') && (
          <motion.div key="student" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <StudentDashboard user={user} token={token} isEn={isEn} navigate={navigate} />
          </motion.div>
        )}

        {/* Teacher-only OR both-roles showing teacher tab */}
        {hasAccess && (isTeacher && !isStudent || isBoth && activeRole === 'teacher') && (
          <motion.div key="teacher" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <TeacherDashboard user={user} token={token} isEn={isEn} navigate={navigate} updateUser={updateUser} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Education;