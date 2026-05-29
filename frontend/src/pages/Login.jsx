import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CONFIG } from '../utils/constants';
import { Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import logo from '../assets/logo.png';

const Login = () => {
  const { t, locale } = useLanguage();
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'mobile'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${CONFIG.API_BASE_URL}/api/auth/login`, {
        identifier,
        password
      });
      login(res.data, res.data.token); // Save user to AuthContext
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "auth.invalidCredentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#EFF5F1] font-sans relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="bg-white w-full max-w-[420px] rounded-[32px] p-8 md:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.03)] flex flex-col items-center">
        
        {/* Circular Badge Logo */}
        <img src={logo} alt="GramMitra Logo" className="w-14 h-14 rounded-2xl object-cover mb-4 shadow-sm border border-gray-100" />

        {/* Header Title */}
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight text-center">{t('common.appName') || 'GramMitra AI'}</h2>
        <p className="text-gray-400 text-xs font-semibold tracking-wide mt-1 text-center">{t('auth.smartVillageEcosystem') || 'Smart Village Ecosystem'}</p>

        <div className="w-full flex bg-[#F1F4F2] p-1 rounded-[18px] border border-gray-200/50 mt-8 mb-6">
          <button
            type="button"
            onClick={() => {
              setLoginMethod('email');
              setIdentifier('');
              setError('');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[14px] text-xs font-bold transition-all duration-300 ${
              loginMethod === 'email'
                ? 'bg-white text-village-emerald shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Mail className={`w-3.5 h-3.5 ${loginMethod === 'email' ? 'text-village-emerald' : 'text-gray-400'}`} />
            {t('auth.email') || 'Email'}
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMethod('mobile');
              setIdentifier('');
              setError('');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[14px] text-xs font-bold transition-all duration-300 ${
              loginMethod === 'mobile'
                ? 'bg-white text-village-emerald shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Phone className={`w-3.5 h-3.5 ${loginMethod === 'mobile' ? 'text-village-emerald' : 'text-gray-400'}`} />
            {t('auth.phone') || 'Mobile Number'}
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="w-full flex flex-col">
          
          {loginMethod === 'email' ? (
            <div className="space-y-1.5 w-full">
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">{t('auth.email') || 'Email'}</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  required
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-[16px] outline-none focus:border-village-emerald focus:ring-1 focus:ring-village-emerald transition-all text-sm placeholder-gray-400 text-gray-800"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 w-full">
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">{t('auth.phone') || 'Mobile Number'}</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  required
                  id="mobile"
                  name="mobile"
                  type="tel"
                  pattern="[0-9]{10}"
                  autoComplete="tel"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-[16px] outline-none focus:border-village-emerald focus:ring-1 focus:ring-village-emerald transition-all text-sm placeholder-gray-400 text-gray-800"
                />
              </div>
            </div>
          )}

          {/* Password Field */}
          <div className="space-y-1.5 w-full mt-4">
            <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">{t('auth.password') || 'Password'}</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                required
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-11 py-3 bg-white border border-gray-200 rounded-[16px] outline-none focus:border-village-emerald focus:ring-1 focus:ring-village-emerald transition-all text-sm placeholder-gray-400 text-gray-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
 
          {/* Error Banner */}
          {error && (
            <div className="w-full mt-4 p-3 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-2 text-red-600 text-xs font-semibold animate-fadeIn">
              <span>⚠️ {t(error) || error}</span>
            </div>
          )}

          {/* Remember Me & Forgot Password */}
          <div className="w-full flex items-center justify-between mt-5 text-xs">
            <label className="flex items-center gap-2 text-gray-600 font-semibold cursor-pointer select-none">
              <input
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-village-emerald focus:ring-village-emerald accent-village-emerald cursor-pointer"
              />
              {t('auth.rememberMe') || 'Remember Me'}
            </label>
            <a href="#forgot" className="text-village-emerald hover:text-village-darkGreen font-bold transition-colors">
              {t('auth.forgotPassword') || 'Forgot Password?'}
            </a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3.5 bg-gradient-to-r from-village-emerald to-village-emerald/90 hover:from-village-darkGreen hover:to-village-darkGreen text-white rounded-2xl font-bold transition-all shadow-[0_4px_12px_rgba(45,106,79,0.2)] text-sm active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (locale === 'hi' ? 'लॉगिन किया जा रहा है...' : 'Logging in...') : (t('auth.login') || 'Login')}
          </button>
        </form>

        {/* Footer Redirect */}
        <p className="mt-6 text-center text-xs text-gray-400 font-semibold">
          {t('auth.dontHaveAccount') || "Don't have an account?"}{' '}
          <a href="/signup" className="text-village-emerald font-bold hover:text-village-darkGreen hover:underline transition-all">
            {t('auth.signup') || 'Sign Up'}
          </a>
        </p>

      </div>
    </div>
  );
};

export default Login;