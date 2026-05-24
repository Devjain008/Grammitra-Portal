import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Mail, Lock, MapPin, ChevronDown, Camera } from 'lucide-react';
import { USER_CATEGORIES, CONFIG } from '../utils/constants';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

const Signup = () => {
  const { t, locale } = useLanguage();
  
  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    email: '',
    gender: 'male',
    village: '',
    district: '',
    state: '',
    profileImage: '',
    password: '',
    confirmPassword: '',
    categories: []
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const toggleCategory = (catId) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(catId) 
        ? prev.categories.filter(c => c !== catId) 
        : [...prev.categories, catId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwordsNotMatch') || "Passwords do not match!");
      return;
    }
    if (formData.categories.length === 0) {
      setError(t('auth.selectAtLeastOneCategory') || "Please select at least one profile category.");
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...payload } = formData;

      const response = await axios.post(`${CONFIG.API_BASE_URL}/api/auth/register`, payload);
      console.log("Success:", response.data);
      navigate('/login');
    } catch (err) {
      console.error("Full Error Details:", err.response?.data || err.message);
      setError(err.response?.data?.message || (locale === 'hi' ? 'पंजीकरण विफल रहा। कृपया विवरण की जाँच करें।' : 'Registration failed. Please check details.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#f1f9f6] relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="bg-white shadow-[0_10px_40px_rgba(0,0,0,0.06)] rounded-[32px] w-full max-w-[900px] p-10 flex flex-col items-center">
        {/* Logo */}
        <div className="w-14 h-14 bg-[#48b475] rounded-full flex items-center justify-center text-white text-2xl font-bold font-sans shadow-sm select-none">
          ग्रा
        </div>
        
        {/* Title & Subtitle */}
        <h2 className="text-2xl font-black text-gray-800 mt-4">{t('auth.signup') || 'Sign Up'}</h2>
        <p className="text-xs text-gray-500 mt-1 mb-8">{t('auth.smartVillageEcosystem') || 'Smart Village Ecosystem'}</p>

        <form onSubmit={handleSubmit} className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 w-full">
            {/* Full Name */}
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1.5 block">{t('auth.fullName') || 'Full Name'}</label>
              <div className="relative flex items-center w-full border border-gray-200 bg-white rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#48b475]/30 focus-within:border-[#48b475] transition-all">
                <User className="text-gray-400 mr-3 w-5 h-5" />
                <input 
                  type="text"
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                  placeholder={t('auth.fullName') || "Full Name"}
                  className="w-full text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400"
                  required
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1.5 block">{t('auth.phone') || 'Mobile Number'}</label>
              <div className="relative flex items-center w-full border border-gray-200 bg-white rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#48b475]/30 focus-within:border-[#48b475] transition-all">
                <Phone className="text-gray-400 mr-3 w-5 h-5" />
                <input 
                  type="text"
                  value={formData.mobile}
                  onChange={e => setFormData({...formData, mobile: e.target.value})}
                  placeholder={t('auth.phone') || "Mobile Number"}
                  className="w-full text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1.5 block">{t('auth.email') || 'Email'}</label>
              <div className="relative flex items-center w-full border border-gray-200 bg-white rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#48b475]/30 focus-within:border-[#48b475] transition-all">
                <Mail className="text-gray-400 mr-3 w-5 h-5" />
                <input 
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder={t('auth.email') || "Email"}
                  className="w-full text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400"
                  required
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1.5 block">{t('auth.gender') || 'Gender'}</label>
              <div className="relative flex items-center w-full border border-gray-200 bg-white rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#48b475]/30 focus-within:border-[#48b475] transition-all">
                <select 
                  value={formData.gender}
                  onChange={e => setFormData({...formData, gender: e.target.value})}
                  className="w-full text-sm outline-none bg-transparent text-gray-800 cursor-pointer appearance-none pr-8 font-medium"
                  required
                >
                  <option value="male" className="bg-white text-gray-800 font-medium">{t('auth.genderMale') || 'Male'}</option>
                  <option value="female" className="bg-white text-gray-800 font-medium">{t('auth.genderFemale') || 'Female'}</option>
                  <option value="other" className="bg-white text-gray-800 font-medium">{t('auth.genderOther') || 'Other'}</option>
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Geolocation Section */}
            <div className="md:col-span-2 bg-[#f7fcf9] border border-gray-150 p-5 rounded-2xl space-y-4 shadow-sm">
              <div className="flex items-center gap-1.5 border-b border-gray-100 pb-2">
                <MapPin className="w-4 h-4 text-[#48b475]" />
                <span className="text-xs font-bold text-gray-700">
                  {t('location.title') || "Location Name details"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Village */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-555 uppercase text-left block">{t('location.village')}</label>
                  <div className="relative flex items-center w-full border border-gray-250 bg-white rounded-xl px-3 py-2.5 focus-within:ring-1 focus-within:ring-[#48b475] transition-all">
                    <input 
                      type="text"
                      value={formData.village}
                      onChange={e => setFormData({...formData, village: e.target.value})}
                      placeholder={t('location.village') || "Village / Locality"}
                      className="w-full text-xs outline-none bg-transparent text-gray-800 placeholder-gray-400 font-semibold"
                      required
                    />
                  </div>
                </div>

                {/* District */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-555 uppercase text-left block">{t('location.district')}</label>
                  <div className="relative flex items-center w-full border border-gray-250 bg-white rounded-xl px-3 py-2.5 focus-within:ring-1 focus-within:ring-[#48b475] transition-all">
                    <input 
                      type="text"
                      value={formData.district}
                      onChange={e => setFormData({...formData, district: e.target.value})}
                      placeholder={t('location.district') || "District"}
                      className="w-full text-xs outline-none bg-transparent text-gray-800 placeholder-gray-400 font-semibold"
                      required
                    />
                  </div>
                </div>

                {/* State */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-555 uppercase text-left block">{t('location.state')}</label>
                  <div className="relative flex items-center w-full border border-gray-250 bg-white rounded-xl px-3 py-2.5 focus-within:ring-1 focus-within:ring-[#48b475] transition-all">
                    <input 
                      type="text"
                      value={formData.state}
                      onChange={e => setFormData({...formData, state: e.target.value})}
                      placeholder={t('location.state') || "State"}
                      className="w-full text-xs outline-none bg-transparent text-gray-800 placeholder-gray-400 font-semibold"
                      required
                    />
                  </div>
                </div>
            </div>
          </div>

            {/* Profile Image URL (Optional) */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-700 mb-1.5 block">{locale === 'hi' ? 'प्रोफ़ाइल छवि URL (वैकल्पिक)' : 'Profile Image URL (Optional)'}</label>
              <div className="flex gap-4 items-center">
                <div className="relative flex-1 flex items-center border border-gray-200 bg-white rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#48b475]/30 focus-within:border-[#48b475] transition-all">
                  <Camera className="text-gray-400 mr-3 w-5 h-5" />
                  <input 
                    type="text"
                    value={formData.profileImage}
                    onChange={e => setFormData({...formData, profileImage: e.target.value})}
                    placeholder={locale === 'hi' ? 'अपनी छवि का URL यहाँ पेस्ट करें...' : 'Paste your profile image URL here...'}
                    className="w-full text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400"
                  />
                </div>
                {formData.profileImage && (
                  <div className="w-12 h-12 rounded-2xl overflow-hidden border border-gray-200 shrink-0">
                    <img 
                      src={formData.profileImage} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1.5 block">{t('auth.password') || 'Password'}</label>
              <div className="relative flex items-center w-full border border-gray-200 bg-white rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#48b475]/30 focus-within:border-[#48b475] transition-all">
                <Lock className="text-gray-400 mr-3 w-5 h-5" />
                <input 
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  placeholder="Password"
                  className="w-full text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400"
                  required
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1.5 block">{t('auth.confirmPassword') || 'Confirm Password'}</label>
              <div className="relative flex items-center w-full border border-gray-200 bg-white rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#48b475]/30 focus-within:border-[#48b475] transition-all">
                <Lock className="text-gray-400 mr-3 w-5 h-5" />
                <input 
                  type="password"
                  value={formData.confirmPassword}
                  onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                  placeholder="Confirm Password"
                  className="w-full text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400"
                  required
                />
              </div>
            </div>
          </div>            {/* Category Selector */}
          <div className="w-full mt-6">
            <label className="text-xs font-bold text-gray-700 mb-3 block text-left">{t('auth.selectCategories') || 'Select Categories'}</label>
            <div className="flex flex-wrap gap-2.5 w-full justify-start">
              {USER_CATEGORIES.map(cat => (
                <button 
                  key={cat.id} 
                  type="button" 
                  onClick={() => toggleCategory(cat.id)}
                  className={`text-xs font-bold px-5 py-2.5 rounded-full transition-all duration-200 cursor-pointer ${
                    formData.categories.includes(cat.id) 
                      ? 'bg-[#48b475] text-white shadow-sm' 
                      : 'bg-[#f5f3f7] hover:bg-[#eae6ee] text-gray-800'
                  }`}
                >
                  {t('categories.' + cat.id) || cat.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Error Banner */}
          {error && (
            <div className="w-full mt-5 p-3 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-2 text-red-600 text-xs font-semibold animate-fadeIn">
              <span>⚠️ {error}</span>
            </div>
          )}
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[#48b475] hover:bg-[#3d9c63] active:scale-[0.98] text-white py-3.5 rounded-2xl font-bold text-sm shadow-md shadow-[#48b475]/20 mt-8 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (locale === 'hi' ? 'पंजीकरण किया जा रहा है...' : 'Signing up...') : (t('auth.signup') || 'Sign Up')}
          </button>
        </form>
 
        <div className="text-xs text-gray-500 mt-6 text-center w-full">
          {t('auth.alreadyHaveAccount') || 'Already have an account?'}{' '}
          <button 
            type="button" 
            onClick={() => navigate('/login')}
            className="text-[#48b475] font-bold hover:underline cursor-pointer bg-transparent border-none p-0 inline transition-colors"
          >
            {t('auth.login') || 'Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Signup;