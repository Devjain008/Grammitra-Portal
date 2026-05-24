import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { CONFIG } from '../utils/constants';
import {
  LineChart, Landmark, HeartPulse, ShieldCheck, 
  MapPin, Loader, Plus, AlertTriangle, FileText, CheckCircle
} from 'lucide-react';

const SCHEME_CATEGORIES = [
  { id: 'farmer',         label: 'Farmer / किसान' },
  { id: 'student',        label: 'Student / छात्र' },
  { id: 'labour',         label: 'Labour / श्रमिक' },
  { id: 'women',          label: 'Women / महिलाएं' },
  { id: 'businessman',    label: 'Businessman / व्यवसायी' },
  { id: 'senior_citizen', label: 'Senior Citizen / वरिष्ठ नागरिक' },
  { id: 'health',         label: 'Health / स्वास्थ्य' },
  { id: 'general',        label: 'General / सामान्य' }
];

const SEASONS = [
  { id: 'summer',     label: 'Summer / ग्रीष्म' },
  { id: 'monsoon',    label: 'Monsoon / वर्षा' },
  { id: 'winter',     label: 'Winter / शीत' },
  { id: 'all_season', label: 'All Season / सदाबहार' }
];

const AdminDashboard = () => {
  const { t, locale } = useLanguage();
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('performance');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Performance stats state
  const [performance, setPerformance] = useState([]);

  // Form states
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [formErrorMsg, setFormErrorMsg] = useState('');

  // Scheme Form
  const [schemeForm, setSchemeForm] = useState({
    titleEn: '', titleHi: '',
    descEn: '', descHi: '',
    categories: [],
    eligibilityEn: '', eligibilityHi: '',
    benefitsEn: '', benefitsHi: '',
    docsEn: '', docsHi: '',
    processEn: '', processHi: '',
    departmentEn: '', departmentHi: '',
    state: 'Central',
    officialLink: '',
    deadline: ''
  });

  // Health Guide Form
  const [healthForm, setHealthForm] = useState({
    diseaseNameEn: '', diseaseNameHi: '',
    season: 'all_season',
    descEn: '', descHi: '',
    symptomsEn: '', symptomsHi: '',
    preventionEn: '', preventionHi: '',
    medicinesEn: '', medicinesHi: '',
    precautionsEn: '', precautionsHi: '',
    emergencyEn: '', emergencyHi: ''
  });

  // Fetch village performance stats
  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${CONFIG.API_BASE_URL}/api/admin/village-performance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPerformance(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch village performance metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'performance') {
      fetchPerformance();
    }
  }, [activeTab]);

  // Handle Scheme categories toggle
  const toggleSchemeCategory = (catId) => {
    setSchemeForm(prev => ({
      ...prev,
      categories: prev.categories.includes(catId)
        ? prev.categories.filter(c => c !== catId)
        : [...prev.categories, catId]
    }));
  };

  // Handle Scheme Submit
  const handleSchemeSubmit = async (e) => {
    e.preventDefault();
    if (schemeForm.categories.length === 0) {
      setFormErrorMsg(locale === 'hi' ? 'कृपया कम से कम एक श्रेणी चुनें।' : 'Please select at least one category.');
      return;
    }

    setActionLoading(true);
    setFormErrorMsg('');
    setSuccessMsg('');

    try {
      // Structure fields to match bilingual models
      const payload = {
        title: { en: schemeForm.titleEn, hi: schemeForm.titleHi },
        description: { en: schemeForm.descEn, hi: schemeForm.descHi },
        category: schemeForm.categories,
        eligibility: {
          en: schemeForm.eligibilityEn.split('\n').map(s => s.trim()).filter(s => s),
          hi: schemeForm.eligibilityHi.split('\n').map(s => s.trim()).filter(s => s)
        },
        benefits: { en: schemeForm.benefitsEn, hi: schemeForm.benefitsHi },
        requiredDocuments: {
          en: schemeForm.docsEn.split('\n').map(s => s.trim()).filter(s => s),
          hi: schemeForm.docsHi.split('\n').map(s => s.trim()).filter(s => s)
        },
        applicationProcess: { en: schemeForm.processEn, hi: schemeForm.processHi },
        department: { en: schemeForm.departmentEn, hi: schemeForm.departmentHi },
        state: schemeForm.state,
        officialLink: schemeForm.officialLink,
        deadline: schemeForm.deadline || undefined
      };

      await axios.post(`${CONFIG.API_BASE_URL}/api/schemes`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccessMsg(locale === 'hi' ? 'सरकारी योजना सफलतापूर्वक जोड़ी गई!' : 'Scheme successfully added!');
      setSchemeForm({
        titleEn: '', titleHi: '',
        descEn: '', descHi: '',
        categories: [],
        eligibilityEn: '', eligibilityHi: '',
        benefitsEn: '', benefitsHi: '',
        docsEn: '', docsHi: '',
        processEn: '', processHi: '',
        departmentEn: '', departmentHi: '',
        state: 'Central',
        officialLink: '',
        deadline: ''
      });
    } catch (err) {
      setFormErrorMsg(err.response?.data?.message || 'Failed to submit scheme.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Health Tip Submit
  const handleHealthSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setFormErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        diseaseName: { en: healthForm.diseaseNameEn, hi: healthForm.diseaseNameHi },
        season: healthForm.season,
        description: { en: healthForm.descEn, hi: healthForm.descHi },
        symptoms: {
          en: healthForm.symptomsEn.split('\n').map(s => s.trim()).filter(s => s),
          hi: healthForm.symptomsHi.split('\n').map(s => s.trim()).filter(s => s)
        },
        preventionTips: {
          en: healthForm.preventionEn.split('\n').map(s => s.trim()).filter(s => s),
          hi: healthForm.preventionHi.split('\n').map(s => s.trim()).filter(s => s)
        },
        medicineSuggestions: { en: healthForm.medicinesEn, hi: healthForm.medicinesHi },
        precautions: { en: healthForm.precautionsEn, hi: healthForm.precautionsHi },
        emergencyWarnings: {
          en: healthForm.emergencyEn.split('\n').map(s => s.trim()).filter(s => s),
          hi: healthForm.emergencyHi.split('\n').map(s => s.trim()).filter(s => s)
        }
      };

      await axios.post(`${CONFIG.API_BASE_URL}/api/health/diseases`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccessMsg(locale === 'hi' ? 'स्वास्थ्य मार्गदर्शिका सफलतापूर्वक जोड़ी गई!' : 'Health awareness guide added!');
      setHealthForm({
        diseaseNameEn: '', diseaseNameHi: '',
        season: 'all_season',
        descEn: '', descHi: '',
        symptomsEn: '', symptomsHi: '',
        preventionEn: '', preventionHi: '',
        medicinesEn: '', medicinesHi: '',
        precautionsEn: '', precautionsHi: '',
        emergencyEn: '', emergencyHi: ''
      });
    } catch (err) {
      setFormErrorMsg(err.response?.data?.message || 'Failed to submit health guide.');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper to calculate village activity score
  const calculateActivityScore = (v) => {
    return (v.usersCount * 2) + (v.businessesCount * 5) + (v.jobsCount * 3);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-indigo-500 p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3 mb-2">
            <ShieldCheck className="w-8 h-8 text-blue-200" />
            {locale === 'en' ? 'Admin Dashboard' : 'प्रशासक डैशबोर्ड'}
          </h1>
          <p className="text-blue-100 text-lg opacity-90">
            {locale === 'en' ? 'Manage village insights, government schemes, and healthcare databases.' : 'गाँव के आंकड़े, सरकारी योजनाएं और स्वास्थ्य डेटाबेस प्रबंधित करें।'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => { setActiveTab('performance'); setFormErrorMsg(''); setSuccessMsg(''); }}
          className={`py-4 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'performance'
              ? 'border-indigo-650 text-indigo-700'
              : 'border-transparent text-gray-500 hover:text-indigo-600 hover:border-gray-300'
          }`}
        >
          <LineChart className="w-4 h-4" />
          {locale === 'en' ? 'Village Performance' : 'गाँव का प्रदर्शन'}
        </button>
        <button
          onClick={() => { setActiveTab('scheme'); setFormErrorMsg(''); setSuccessMsg(''); }}
          className={`py-4 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'scheme'
              ? 'border-indigo-650 text-indigo-700'
              : 'border-transparent text-gray-500 hover:text-indigo-600 hover:border-gray-300'
          }`}
        >
          <Landmark className="w-4 h-4" />
          {locale === 'en' ? 'Add Gov Scheme' : 'योजना जोड़ें'}
        </button>
        <button
          onClick={() => { setActiveTab('health'); setFormErrorMsg(''); setSuccessMsg(''); }}
          className={`py-4 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'health'
              ? 'border-indigo-650 text-indigo-700'
              : 'border-transparent text-gray-500 hover:text-indigo-600 hover:border-gray-300'
          }`}
        >
          <HeartPulse className="w-4 h-4" />
          {locale === 'en' ? 'Add Health Tip' : 'स्वास्थ्य टिप जोड़ें'}
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="mt-4">
        {formErrorMsg && (
          <div className="bg-red-50 text-red-650 border border-red-200 p-4 rounded-2xl text-sm font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            {formErrorMsg}
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 text-emerald-700 border border-emerald-250 p-4 rounded-2xl text-sm font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            {successMsg}
          </div>
        )}

        {/* TAB 1: Performance */}
        {activeTab === 'performance' && (
          <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden text-left">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">
                {locale === 'en' ? 'All Villages Activity Scorecard' : 'सभी गाँवों का गतिविधि स्कोरकार्ड'}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {locale === 'en' ? 'Live aggregation of users, businesses, and job vacancies per rural cluster.' : 'प्रत्येक ग्रामीण क्लस्टर के अनुसार उपयोगकर्ताओं, व्यवसायों और नौकरियों का लाइव एकत्रीकरण।'}
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader className="animate-spin text-indigo-600 w-10 h-10" />
              </div>
            ) : error ? (
              <div className="p-6 text-red-600 font-semibold">{error}</div>
            ) : performance.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                {locale === 'en' ? 'No registered village data found.' : 'कोई पंजीकृत गाँव का डेटा नहीं मिला।'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-bold text-xs uppercase tracking-wider">
                      <th className="py-4 pl-6">{locale === 'en' ? 'Village / Settlement' : 'गाँव / क्षेत्र'}</th>
                      <th className="py-4">{locale === 'en' ? 'Villagers Registered' : 'पंजीकृत ग्रामीण'}</th>
                      <th className="py-4">{locale === 'en' ? 'Active Local Shops' : 'सक्रिय दुकानें'}</th>
                      <th className="py-4">{locale === 'en' ? 'Total Job Posts' : 'कुल जॉब पोस्ट'}</th>
                      <th className="py-4">{locale === 'en' ? 'Active Openings' : 'सक्रिय रिक्तियां'}</th>
                      <th className="py-4 text-right pr-6">{locale === 'en' ? 'Overall Activity Score' : 'कुल गतिविधि स्कोर'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm font-semibold text-gray-700">
                    {performance.map((item, idx) => {
                      const score = calculateActivityScore(item);
                      let levelClass = 'bg-gray-100 text-gray-700';
                      let levelText = 'Low / कम';

                      if (score >= 25) {
                        levelClass = 'bg-emerald-100 text-emerald-700 border-emerald-200';
                        levelText = 'High / उच्च';
                      } else if (score >= 10) {
                        levelClass = 'bg-indigo-50 text-indigo-700 border-indigo-150';
                        levelText = 'Medium / मध्यम';
                      }

                      return (
                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 pl-6 font-extrabold text-gray-800 flex items-center gap-2">
                            <span className="text-indigo-650">📍</span>
                            {item.village}
                          </td>
                          <td className="py-4 text-gray-550">{item.usersCount}</td>
                          <td className="py-4 text-gray-550">{item.businessesCount}</td>
                          <td className="py-4 text-gray-550">{item.jobsCount}</td>
                          <td className="py-4">
                            <span className="bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-lg text-teal-700 text-xs font-bold">
                              {item.activeJobs}
                            </span>
                          </td>
                          <td className="py-4 text-right pr-6">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${levelClass}`}>
                               {score} ({levelText})
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Add Scheme */}
        {activeTab === 'scheme' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-3xl border border-gray-150 shadow-sm text-left"
          >
            <div className="border-b border-gray-100 pb-4 mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {locale === 'en' ? 'Add New Government Scheme' : 'नई सरकारी योजना जोड़ें'}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {locale === 'en' ? 'All fields support bilingual rendering to display schemes in English & Hindi.' : 'सभी क्षेत्र अंग्रेजी और हिंदी में योजनाओं को प्रदर्शित करने के लिए द्विभाषी इनपुट का समर्थन करते हैं।'}
              </p>
            </div>

            <form onSubmit={handleSchemeSubmit} className="space-y-6">
              {/* Category selections */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 block">
                  {locale === 'en' ? 'Target Audiences / Categories' : 'लक्षित दर्शक / श्रेणियां'} *
                </label>
                <div className="flex flex-wrap gap-2">
                  {SCHEME_CATEGORIES.map(cat => {
                    const isSelected = schemeForm.categories.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleSchemeCategory(cat.id)}
                        className={`text-xs font-bold px-4 py-2 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-gray-50 border-gray-250 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">Scheme Title (English) *</label>
                  <input
                    type="text"
                    required
                    value={schemeForm.titleEn}
                    onChange={(e) => setSchemeForm({ ...schemeForm, titleEn: e.target.value })}
                    placeholder="e.g. PM Kisan Samman Nidhi"
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">योजना का शीर्षक (हिंदी) *</label>
                  <input
                    type="text"
                    required
                    value={schemeForm.titleHi}
                    onChange={(e) => setSchemeForm({ ...schemeForm, titleHi: e.target.value })}
                    placeholder="जैसे: पीएम किसान सम्मान निधि"
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              {/* Description Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">Description (English) *</label>
                  <textarea
                    required
                    rows="3"
                    value={schemeForm.descEn}
                    onChange={(e) => setSchemeForm({ ...schemeForm, descEn: e.target.value })}
                    placeholder="Provide detailed description of the scheme..."
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">विवरण (हिंदी) *</label>
                  <textarea
                    required
                    rows="3"
                    value={schemeForm.descHi}
                    onChange={(e) => setSchemeForm({ ...schemeForm, descHi: e.target.value })}
                    placeholder="योजना का विस्तृत विवरण प्रदान करें..."
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                  />
                </div>
              </div>

              {/* Eligibility Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">Eligibility Criteria (English - One per line) *</label>
                  <textarea
                    required
                    rows="3"
                    value={schemeForm.eligibilityEn}
                    onChange={(e) => setSchemeForm({ ...schemeForm, eligibilityEn: e.target.value })}
                    placeholder="e.g. Must be a small landholding farmer&#10;Must reside in India"
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">पात्रता मानदंड (हिंदी - प्रति पंक्ति एक) *</label>
                  <textarea
                    required
                    rows="3"
                    value={schemeForm.eligibilityHi}
                    onChange={(e) => setSchemeForm({ ...schemeForm, eligibilityHi: e.target.value })}
                    placeholder="जैसे: छोटे जोत वाले किसान होने चाहिए&#10;भारत का निवासी होना चाहिए"
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              {/* Benefits Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">Benefits (English) *</label>
                  <input
                    type="text"
                    required
                    value={schemeForm.benefitsEn}
                    onChange={(e) => setSchemeForm({ ...schemeForm, benefitsEn: e.target.value })}
                    placeholder="e.g. Financial support of Rs 6000 per year"
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">लाभ (हिंदी) *</label>
                  <input
                    type="text"
                    required
                    value={schemeForm.benefitsHi}
                    onChange={(e) => setSchemeForm({ ...schemeForm, benefitsHi: e.target.value })}
                    placeholder="जैसे: प्रति वर्ष ₹6000 की वित्तीय सहायता"
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              {/* Documents Required */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">Required Documents (English - One per line) *</label>
                  <textarea
                    required
                    rows="3"
                    value={schemeForm.docsEn}
                    onChange={(e) => setSchemeForm({ ...schemeForm, docsEn: e.target.value })}
                    placeholder="e.g. Aadhaar Card&#10;Land Registry papers"
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">आवश्यक दस्तावेज (हिंदी - प्रति पंक्ति एक) *</label>
                  <textarea
                    required
                    rows="3"
                    value={schemeForm.docsHi}
                    onChange={(e) => setSchemeForm({ ...schemeForm, docsHi: e.target.value })}
                    placeholder="जैसे: आधार कार्ड&#10;भूमि रजिस्ट्री के कागजात"
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              {/* Application Process */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">Application Process (English) *</label>
                  <textarea
                    required
                    rows="3"
                    value={schemeForm.processEn}
                    onChange={(e) => setSchemeForm({ ...schemeForm, processEn: e.target.value })}
                    placeholder="Describe how villagers can apply..."
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">आवेदन प्रक्रिया (हिंदी) *</label>
                  <textarea
                    required
                    rows="3"
                    value={schemeForm.processHi}
                    onChange={(e) => setSchemeForm({ ...schemeForm, processHi: e.target.value })}
                    placeholder="विवरण दें कि ग्रामीण कैसे आवेदन कर सकते हैं..."
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                  />
                </div>
              </div>

              {/* Department & Regional Logistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">Department (English / Hindi) *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={schemeForm.departmentEn}
                      onChange={(e) => setSchemeForm({ ...schemeForm, departmentEn: e.target.value })}
                      placeholder="Agri Dept"
                      className="w-1/2 p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none"
                    />
                    <input
                      type="text"
                      required
                      value={schemeForm.departmentHi}
                      onChange={(e) => setSchemeForm({ ...schemeForm, departmentHi: e.target.value })}
                      placeholder="कृषि विभाग"
                      className="w-1/2 p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">Official Link</label>
                  <input
                    type="url"
                    value={schemeForm.officialLink}
                    onChange={(e) => setSchemeForm({ ...schemeForm, officialLink: e.target.value })}
                    placeholder="https://pmkisan.gov.in"
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">State scope</label>
                  <input
                    type="text"
                    value={schemeForm.state}
                    onChange={(e) => setSchemeForm({ ...schemeForm, state: e.target.value })}
                    placeholder="e.g. Central or Bihar"
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              {/* Deadline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">Deadline / अंतिम तिथि</label>
                  <input
                    type="date"
                    value={schemeForm.deadline}
                    onChange={(e) => setSchemeForm({ ...schemeForm, deadline: e.target.value })}
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-indigo-650 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? <Loader className="animate-spin w-5 h-5" /> : <><Plus className="w-5 h-5" /> {locale === 'en' ? 'Add Scheme' : 'सरकारी योजना जोड़ें'}</>}
              </button>
            </form>
          </motion.div>
        )}

        {/* TAB 3: Add Health Tip */}
        {activeTab === 'health' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-3xl border border-gray-150 shadow-sm text-left"
          >
            <div className="border-b border-gray-100 pb-4 mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {locale === 'en' ? 'Add Healthcare Disease & Awareness Card' : 'स्वास्थ्य और रोग मार्गदर्शिका कार्ड जोड़ें'}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {locale === 'en' ? 'Create seasonal disease awareness guidelines for local villager lookup.' : 'ग्रामीणों की जागरूकता के लिए मौसमी बीमारी की मार्गदर्शिका तैयार करें।'}
              </p>
            </div>

            <form onSubmit={handleHealthSubmit} className="space-y-6">
              {/* Season Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">Season / मौसम *</label>
                  <select
                    value={healthForm.season}
                    onChange={(e) => setHealthForm({ ...healthForm, season: e.target.value })}
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 font-semibold cursor-pointer"
                  >
                    {SEASONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Disease Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">Disease / Condition Name (English) *</label>
                  <input
                    type="text"
                    required
                    value={healthForm.diseaseNameEn}
                    onChange={(e) => setHealthForm({ ...healthForm, diseaseNameEn: e.target.value })}
                    placeholder="e.g. Malaria"
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">बीमारी / स्थिति का नाम (हिंदी) *</label>
                  <input
                    type="text"
                    required
                    value={healthForm.diseaseNameHi}
                    onChange={(e) => setHealthForm({ ...healthForm, diseaseNameHi: e.target.value })}
                    placeholder="जैसे: मलेरिया"
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">Description (English) *</label>
                  <textarea
                    required
                    rows="3"
                    value={healthForm.descEn}
                    onChange={(e) => setHealthForm({ ...healthForm, descEn: e.target.value })}
                    placeholder="Describe the seasonal condition..."
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">विवरण (हिंदी) *</label>
                  <textarea
                    required
                    rows="3"
                    value={healthForm.descHi}
                    onChange={(e) => setHealthForm({ ...healthForm, descHi: e.target.value })}
                    placeholder="मौसमी स्थिति का विवरण दें..."
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                  />
                </div>
              </div>

              {/* Symptoms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">Common Symptoms (English - One per line) *</label>
                  <textarea
                    required
                    rows="3"
                    value={healthForm.symptomsEn}
                    onChange={(e) => setHealthForm({ ...healthForm, symptomsEn: e.target.value })}
                    placeholder="e.g. High fever&#10;Body aches and chills"
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">सामान्य लक्षण (हिंदी - प्रति पंक्ति एक) *</label>
                  <textarea
                    required
                    rows="3"
                    value={healthForm.symptomsHi}
                    onChange={(e) => setHealthForm({ ...healthForm, symptomsHi: e.target.value })}
                    placeholder="जैसे: तेज बुखार&#10;शरीर में दर्द और ठंड लगना"
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              {/* Prevention Tips */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">Prevention Tips (English - One per line) *</label>
                  <textarea
                    required
                    rows="3"
                    value={healthForm.preventionEn}
                    onChange={(e) => setHealthForm({ ...healthForm, preventionEn: e.target.value })}
                    placeholder="e.g. Use mosquito nets&#10;Clear stagnant water"
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">बचाव के उपाय (हिंदी - प्रति पंक्ति एक) *</label>
                  <textarea
                    required
                    rows="3"
                    value={healthForm.preventionHi}
                    onChange={(e) => setHealthForm({ ...healthForm, preventionHi: e.target.value })}
                    placeholder="जैसे: मच्छरदानी का उपयोग करें&#10;रुके हुए पानी को साफ करें"
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              {/* OTC Medicines Awareness */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">Over-the-counter medicine suggestions (English)</label>
                  <input
                    type="text"
                    value={healthForm.medicinesEn}
                    onChange={(e) => setHealthForm({ ...healthForm, medicinesEn: e.target.value })}
                    placeholder="e.g. Paracetamol for fever management"
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">ओटीसी दवाएं (हिंदी)</label>
                  <input
                    type="text"
                    value={healthForm.medicinesHi}
                    onChange={(e) => setHealthForm({ ...healthForm, medicinesHi: e.target.value })}
                    placeholder="जैसे: बुखार के लिए पेरासिटामोल"
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              {/* Precautions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">Precautions / सावधानियां (English / Hindi)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={healthForm.precautionsEn}
                      onChange={(e) => setHealthForm({ ...healthForm, precautionsEn: e.target.value })}
                      placeholder="e.g. Avoid self-medicating antibiotics"
                      className="w-1/2 p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none"
                    />
                    <input
                      type="text"
                      value={healthForm.precautionsHi}
                      onChange={(e) => setHealthForm({ ...healthForm, precautionsHi: e.target.value })}
                      placeholder="जैसे: डॉक्टर की सलाह के बिना एंटीबायोटिक्स न लें"
                      className="w-1/2 p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Warnings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">Emergency Warnings (English - One per line) *</label>
                  <textarea
                    required
                    rows="3"
                    value={healthForm.emergencyEn}
                    onChange={(e) => setHealthForm({ ...healthForm, emergencyEn: e.target.value })}
                    placeholder="e.g. Breathing difficulties&#10;Fever exceeds 104°F"
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">आपातकालीन चेतावनी संकेत (हिंदी - प्रति पंक्ति एक) *</label>
                  <textarea
                    required
                    rows="3"
                    value={healthForm.emergencyHi}
                    onChange={(e) => setHealthForm({ ...healthForm, emergencyHi: e.target.value })}
                    placeholder="जैसे: सांस लेने में कठिनाई&#10;बुखार 104°F से अधिक होना"
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-indigo-650 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? <Loader className="animate-spin w-5 h-5" /> : <><Plus className="w-5 h-5" /> {locale === 'en' ? 'Add Health Card' : 'स्वास्थ्य कार्ड जोड़ें'}</>}
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
