import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { CONFIG, getDefaultAvatar } from '../utils/constants';
import { 
  Wrench, MapPin, CheckCircle, Clock, Save, Edit, Trash2, 
  Map, Phone, User, Calendar, MessageSquare, Loader, Navigation, Image, Coins,
  Search, ChevronDown, Check, X
} from 'lucide-react';

const YourWork = () => {
  const { t, locale } = useLanguage();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  // Filters and actions states
  const [reqSearchTerm, setReqSearchTerm] = useState('');
  const [reqStatusFilter, setReqStatusFilter] = useState('all');
  const [statusActionLoading, setStatusActionLoading] = useState(null);

  const handleUpdateRequestStatus = async (requestId, newStatus) => {
    setStatusActionLoading(requestId);
    setError('');
    setSuccess('');
    try {
      const res = await axios.put(
        `${CONFIG.API_BASE_URL}/api/labour/requests/${requestId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfile(res.data.profile);
      setSuccess(
        newStatus === 'accepted'
          ? (locale === 'hi' ? 'सेवा अनुरोध स्वीकार कर लिया गया!' : 'Service request accepted!')
          : (locale === 'hi' ? 'सेवा अनुरोध अस्वीकार कर दिया गया!' : 'Service request declined!')
      );
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        (locale === 'hi' ? 'अनुरोध की स्थिति अपडेट करने में विफल।' : 'Failed to update request status.')
      );
      setTimeout(() => setError(''), 4000);
    } finally {
      setStatusActionLoading(null);
    }
  };

  const processedRequests = React.useMemo(() => {
    if (!profile || !profile.serviceRequests) return [];
    return profile.serviceRequests
      .filter(req => {
        const s = reqSearchTerm.toLowerCase();
        const matchesSearch = 
          (req.requesterName || '').toLowerCase().includes(s) ||
          (req.requesterMobile || '').toLowerCase().includes(s) ||
          (req.village || '').toLowerCase().includes(s) ||
          (req.note || '').toLowerCase().includes(s);
        
        const matchesStatus = reqStatusFilter === 'all' || req.status === reqStatusFilter;
        return matchesSearch && matchesStatus;
      });
  }, [profile, reqSearchTerm, reqStatusFilter]);

  const [formData, setFormData] = useState({
    skill: 'electrician',
    experience: '',
    serviceCharge: '',
    chargeType: 'daily',
    contactNumber: '',
    whatsapp: '',
    workingRadius: 20,
    bio: '',
    village: '',
    district: '',
    state: '',
    profileImage: '',
    coordinates: ['', ''] // [lng, lat]
  });

  // Fetch worker profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(`${CONFIG.API_BASE_URL}/api/labour/my-profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data);
      
      // Seed edit form data
      if (res.data) {
        const combined = [res.data.village, res.data.district, res.data.state].filter(Boolean).join(', ');
        setFormData({
          skill: res.data.skill || 'electrician',
          experience: res.data.experience || '',
          serviceCharge: res.data.serviceCharge || '',
          chargeType: res.data.chargeType || 'daily',
          contactNumber: res.data.contactNumber || '',
          whatsapp: res.data.whatsapp || '',
          workingRadius: res.data.workingRadius || 20,
          bio: res.data.bio || '',
          village: combined,
          district: '',
          state: '',
          profileImage: res.data.profileImage || '',
          coordinates: res.data.location?.coordinates || ['', '']
        });
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setProfile(null); // No profile registered yet
      } else {
        setError(locale === 'hi' ? 'श्रमिक प्रोफ़ाइल लोड करने में विफल।' : 'Failed to fetch worker profile.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  // Pre-populate registration fields from logged-in user profile
  useEffect(() => {
    if (user && !profile) {
      const combined = [user.village, user.district, user.state].filter(Boolean).join(', ');
      setFormData(prev => ({
        ...prev,
        contactNumber: prev.contactNumber || user.mobile || '',
        village: prev.village || combined || '',
        district: '',
        state: '',
        coordinates: (prev.coordinates[0] !== '' && prev.coordinates[1] !== '')
          ? prev.coordinates
          : (user.location?.coordinates || ['', ''])
      }));
    }
  }, [user, profile]);

  // Handle Geolocation coordinate capture & reverse lookup to get location name details
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert(t('labour.form.getLocationError'));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { longitude, latitude } = position.coords;
        setFormData(prev => ({
          ...prev,
          coordinates: [longitude, latitude]
        }));
        
        try {
          // Query OpenStreetMap Nominatim reverse geocoding API to resolve coordinates to address names
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=${locale}`);
          const data = await response.json();
          
          if (data && data.address) {
            const addr = data.address;
            const villageName = addr.village || addr.suburb || addr.town || addr.city_district || addr.locality || '';
            const districtName = addr.district || addr.county || addr.city || '';
            const stateName = addr.state || '';
            const combined = [villageName, districtName, stateName].filter(Boolean).join(', ');
            
            setFormData(prev => ({
              ...prev,
              village: combined || prev.village,
              district: '',
              state: ''
            }));
            alert(t('location.success') || "Location details detected successfully!");
          }
        } catch (err) {
          console.error("Reverse geocoding failed:", err);
          alert(t('location.error') || "GPS coordinate detected, but failed to resolve address name. Please fill manually.");
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        console.error(err);
        setLocating(false);
        alert(t('labour.form.getLocationError'));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Convert uploaded image file to base64
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert(locale === 'hi' ? "छवि का आकार 2MB से कम होना चाहिए।" : "Image size should be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        profileImage: reader.result // base64 string
      }));
    };
    reader.readAsDataURL(file);
  };

  // Register Profile (POST)
  const handleRegister = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const parts = formData.village.split(',').map(p => p.trim());
      const villageVal = parts[0] || '';
      const districtVal = parts[1] || '';
      const stateVal = parts.slice(2).join(', ') || '';

      const payload = {
        ...formData,
        name: user?.fullName || 'Worker',
        village: villageVal,
        district: districtVal,
        state: stateVal,
        experience: Number(formData.experience),
        serviceCharge: Number(formData.serviceCharge),
        workingRadius: Number(formData.workingRadius),
        coordinates: formData.coordinates[0] !== '' ? [Number(formData.coordinates[0]), Number(formData.coordinates[1])] : undefined
      };

      const res = await axios.post(`${CONFIG.API_BASE_URL}/api/labour`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data);
      setSuccess(locale === 'hi' ? 'कार्य प्रोफ़ाइल सफलतापूर्वक पंजीकृत की गई!' : 'Work profile registered successfully!');
      fetchProfile();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || (locale === 'hi' ? 'कार्य प्रोफ़ाइल पंजीकृत करने में विफल।' : 'Failed to register work profile.'));
    } finally {
      setSaving(false);
    }
  };

  // Update Profile (PUT)
  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const parts = formData.village.split(',').map(p => p.trim());
      const villageVal = parts[0] || '';
      const districtVal = parts[1] || '';
      const stateVal = parts.slice(2).join(', ') || '';

      const payload = {
        ...formData,
        name: user?.fullName || 'Worker',
        village: villageVal,
        district: districtVal,
        state: stateVal,
        experience: Number(formData.experience),
        serviceCharge: Number(formData.serviceCharge),
        workingRadius: Number(formData.workingRadius),
        coordinates: formData.coordinates[0] !== '' ? [Number(formData.coordinates[0]), Number(formData.coordinates[1])] : undefined
      };

      const res = await axios.put(`${CONFIG.API_BASE_URL}/api/labour/my-profile`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data);
      setIsEditing(false);
      setSuccess(locale === 'hi' ? 'कार्य प्रोफ़ाइल सफलतापूर्वक अपडेट की गई!' : 'Work profile updated successfully!');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || (locale === 'hi' ? 'कार्य प्रोफ़ाइल अपडेट करने में विफल।' : 'Failed to update work profile.'));
    } finally {
      setSaving(false);
    }
  };

  // Toggle availability state directly
  const handleToggleAvailability = async () => {
    if (!profile) return;
    try {
      const updatedVal = !profile.isAvailable;
      const res = await axios.put(`${CONFIG.API_BASE_URL}/api/labour/my-profile`, {
        isAvailable: updatedVal
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data);
    } catch (err) {
      console.error(err);
      alert(locale === 'hi' ? 'उपलब्धता अपडेट करने में विफल।' : 'Failed to update availability.');
    }
  };

  // Delete/Deactivate profile
  const handleDeleteProfile = async () => {
    if (!window.confirm(t('labour.form.deleteConfirm'))) return;
    try {
      await axios.delete(`${CONFIG.API_BASE_URL}/api/labour/my-profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(null);
      setSuccess(locale === 'hi' ? 'श्रमिक प्रोफ़ाइल सफलतापूर्वक हटा दी गई।' : 'Worker profile deleted successfully.');
    } catch (err) {
      console.error(err);
      alert(locale === 'hi' ? 'श्रमिक प्रोफ़ाइल हटाने में विफल।' : 'Failed to delete worker profile.');
    }
  };

  // Initiate direct chat room with requester/client
  const handleChatWithClient = async (clientId) => {
    if (!token) return alert(locale === 'hi' ? 'कृपया लॉगइन करें।' : 'Please log in.');
    if (!clientId) return alert(locale === 'hi' ? 'ग्राहक का विवरण नहीं मिला।' : 'Client details missing.');
    if (clientId.toString() === user?._id?.toString()) {
      return alert(locale === 'hi' ? 'आप खुद से चैट नहीं कर सकते।' : 'You cannot chat with yourself.');
    }
    try {
      const res = await axios.post(
        `${CONFIG.API_BASE_URL}/api/chat/room`,
        { userId2: clientId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate(`/chat?roomId=${res.data._id}`);
    } catch (err) {
      console.error(err);
      alert(locale === 'hi' ? 'ग्राहक के साथ चैट शुरू करने में विफल।' : 'Failed to start chat with the client.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40">
        <Loader className="animate-spin text-village-emerald w-12 h-12" />
      </div>
    );
  }

  const avatarUrl = profile?.profileImage || getDefaultAvatar(profile?.gender || user?.gender);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-village-emerald to-village-mint p-8 rounded-3xl text-white shadow-xl flex justify-between items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3 mb-2">
            <Wrench className="w-8 h-8 text-village-lightMint" />
            {t('labour.dashboard.title')}
          </h1>
          <p className="text-village-lightMint text-lg opacity-90">{t('labour.dashboard.sub')}</p>
        </div>
        {profile && (
          <button 
            onClick={handleToggleAvailability}
            className={`px-6 py-2.5 rounded-full font-bold flex items-center gap-2 shadow-lg transition-all ${
              profile.isAvailable 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            {profile.isAvailable ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            {profile.isAvailable ? t('labour.available') : t('labour.busy')}
          </button>
        )}
      </div>

      {success && (
        <div className="bg-green-50 text-green-700 border border-green-200 p-4 rounded-2xl font-semibold flex items-center gap-2">
          <CheckCircle className="w-5 h-5" /> {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-2xl font-semibold flex items-center gap-2">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Main Body */}
      {!profile ? (
        /* Worker Registration Form */
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm max-w-2xl mx-auto">
          <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-2 border-b pb-4">
            <Wrench className="w-6 h-6 text-village-emerald" />
            {t('labour.form.registerBtn')}
          </h2>
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-1 bg-gray-50/50 p-4 border border-gray-150 rounded-2xl">
              <label className="text-xs font-bold text-gray-600 block mb-1">{t('labour.form.profileImage') || 'Profile Image'}</label>
              <div className="flex items-center gap-4">
                {formData.profileImage ? (
                  <img 
                    src={formData.profileImage} 
                    alt="Preview" 
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow bg-white"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full border border-gray-250 flex flex-col items-center justify-center text-gray-400 bg-white shadow-inner">
                    <Image className="w-6 h-6 opacity-60" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <input 
                      type="file" 
                      accept="image/*" 
                      id="worker-register-image" 
                      onChange={handleImageChange} 
                      className="hidden" 
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('worker-register-image').click()}
                      className="bg-white hover:bg-gray-50 border border-gray-255 text-gray-700 text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                      {t('labour.form.browseImage') || 'Browse Image'}
                    </button>
                    {formData.profileImage && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, profileImage: '' })}
                        className="bg-red-50 hover:bg-red-100 text-red-650 text-xs font-bold px-3 py-2 rounded-xl border border-red-200 transition-all active:scale-95 cursor-pointer"
                      >
                        {t('common.cancel') || 'Remove'}
                      </button>
                    )}
                  </div>
                  <input 
                    type="text" 
                    value={formData.profileImage || ''}
                    onChange={(e) => setFormData({ ...formData, profileImage: e.target.value })}
                    placeholder={t('labour.form.pasteImageUrl') || 'Or paste profile image URL directly...'}
                    className="w-full p-2.5 bg-white rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-village-mint"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">{t('labour.form.skill')}</label>
                <select
                  value={formData.skill}
                  onChange={(e) => setFormData({ ...formData, skill: e.target.value })}
                  className="w-full p-3.5 rounded-2xl bg-gray-55 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-village-mint text-gray-800 font-medium cursor-pointer"
                >
                  <option value="electrician" className="bg-white text-gray-850 font-medium">{t('labour.skills.electrician')}</option>
                  <option value="plumber" className="bg-white text-gray-850 font-medium">{t('labour.skills.plumber')}</option>
                  <option value="mason" className="bg-white text-gray-850 font-medium">{t('labour.skills.mason')}</option>
                  <option value="carpenter" className="bg-white text-gray-850 font-medium">{t('labour.skills.carpenter')}</option>
                  <option value="mechanic" className="bg-white text-gray-850 font-medium">{t('labour.skills.mechanic')}</option>
                  <option value="painter" className="bg-white text-gray-850 font-medium">{t('labour.skills.painter')}</option>
                  <option value="welder" className="bg-white text-gray-850 font-medium">{t('labour.skills.welder')}</option>
                  <option value="driver" className="bg-white text-gray-850 font-medium">{t('labour.skills.driver')}</option>
                  <option value="cook" className="bg-white text-gray-850 font-medium">{t('labour.skills.cook')}</option>
                  <option value="security" className="bg-white text-gray-850 font-medium">{t('labour.skills.security')}</option>
                  <option value="cleaner" className="bg-white text-gray-850 font-medium">{t('labour.skills.cleaner')}</option>
                  <option value="farmer_labour" className="bg-white text-gray-850 font-medium">{t('labour.skills.farmer_labour')}</option>
                  <option value="tailor" className="bg-white text-gray-850 font-medium">{t('labour.skills.tailor')}</option>
                  <option value="other" className="bg-white text-gray-850 font-medium">{t('labour.skills.other')}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">{t('labour.form.experience')}</label>
                <input 
                  type="number" 
                  min="0"
                  required
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  placeholder="e.g. 5"
                  className="w-full p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-village-mint"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">{t('labour.form.charge')}</label>
                <input 
                  type="number" 
                  min="1"
                  required
                  value={formData.serviceCharge}
                  onChange={(e) => setFormData({ ...formData, serviceCharge: e.target.value })}
                  placeholder="e.g. 400"
                  className="w-full p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-village-mint"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">{t('labour.form.basis')}</label>
                <select
                  value={formData.chargeType}
                  onChange={(e) => setFormData({ ...formData, chargeType: e.target.value })}
                  className="w-full p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-village-mint text-gray-800 font-medium cursor-pointer"
                >
                  <option value="daily" className="bg-white text-gray-800 font-medium">{t('labour.form.rateDaily')}</option>
                  <option value="hourly" className="bg-white text-gray-800 font-medium">{t('labour.form.rateHourly')}</option>
                  <option value="fixed" className="bg-white text-gray-800 font-medium">{t('labour.form.rateFixed')}</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">{t('labour.form.contactNumber') || 'Contact Number'}</label>
                <input 
                  type="text" 
                  required
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  placeholder="10-digit mobile"
                  className="w-full p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-village-mint"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">{t('labour.form.whatsapp')}</label>
                <input 
                  type="text" 
                  maxLength="10"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="WhatsApp mobile"
                  className="w-full p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-village-mint"
                />
              </div>
            </div>

            {/* Geolocation & Location Name auto-resolving widget */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-150 space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <span className="text-xs font-bold text-gray-700">{t('location.title')}</span>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={locating}
                  className="bg-village-emerald hover:bg-village-darkGreen text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow transition-all active:scale-95 disabled:opacity-75 cursor-pointer border-0"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  {locating ? t('location.detecting') : t('location.detectBtn')}
                </button>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-550 uppercase text-left block">{t('location.singleLabel')}</label>
                <input 
                  type="text" 
                  required
                  value={formData.village}
                  onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                  placeholder={t('location.villagePlaceholder') || "e.g. Village, District, State"}
                  className="w-full p-3 bg-white rounded-xl border border-gray-200 text-xs text-gray-800 font-semibold focus:outline-none focus:ring-1 focus:ring-village-mint"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600">{t('labour.form.radius')}</label>
              <input 
                type="number" 
                min="1"
                required
                value={formData.workingRadius}
                onChange={(e) => setFormData({ ...formData, workingRadius: e.target.value })}
                placeholder="e.g. 20"
                className="w-full p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-village-mint"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600">{t('labour.form.bio')}</label>
              <textarea 
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder={t('labour.form.bioPlaceholder') || "Brief summary about your expertise..."}
                rows="3"
                className="w-full p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-village-mint resize-none"
              ></textarea>
            </div>

            <button 
              type="submit"
              disabled={saving}
              className="w-full bg-village-emerald hover:bg-village-darkGreen text-white py-3.5 rounded-2xl font-bold transition-all shadow-lg active:scale-95 disabled:opacity-75 flex items-center justify-center gap-2"
            >
              {saving && <Loader className="animate-spin w-5 h-5" />}
              {t('labour.form.registerBtn')}
            </button>
          </form>
        </div>
      ) : (
        /* Worker Dashboard & Request Portal */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Worker details */}
          <div className="lg:col-span-1 space-y-6">
            {!isEditing ? (
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden flex flex-col items-center text-center">
                {/* Header background banner decoration */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-village-emerald to-village-mint" />
                
                <img 
                  src={avatarUrl} 
                  alt={profile.name} 
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md bg-village-lightMint mt-4 mb-3"
                />
                
                <h3 className="text-xl font-bold text-gray-850">{profile.name}</h3>
                <p className="text-village-emerald font-semibold text-sm mt-0.5">{t(`labour.skills.${profile.skill}`)}</p>

                <div className="w-full border-t border-gray-100 my-4 pt-4 text-left space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">{t('labour.form.experience')}</span>
                    <span className="text-gray-800 font-bold">{profile.experience} {locale === 'hi' ? 'वर्ष' : 'years'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">{locale === 'hi' ? 'सेवा शुल्क' : 'Service Charge'}</span>
                    <span className="text-gray-800 font-bold">₹{profile.serviceCharge} {profile.chargeType === 'daily' ? t('labour.perDay') : (locale === 'hi' ? '/ घंटा' : '/ hr')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">{locale === 'hi' ? 'संपर्क नंबर' : 'Contact Number'}</span>
                    <span className="text-gray-800 font-semibold">{profile.contactNumber}</span>
                  </div>
                  {profile.whatsapp && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">{locale === 'hi' ? 'व्हाट्सएप' : 'WhatsApp'}</span>
                      <span className="text-gray-855 font-semibold">{profile.whatsapp}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">{locale === 'hi' ? 'सेवा दायरा' : 'Service Radius'}</span>
                    <span className="text-gray-855 font-semibold">{profile.workingRadius || 20} {locale === 'hi' ? 'किमी' : 'km'}</span>
                  </div>
                  <div className="flex justify-between items-start text-sm">
                    <span className="text-gray-500 font-medium flex-shrink-0 mr-2">{locale === 'hi' ? 'पता' : 'Address'}</span>
                    <span className="text-gray-850 font-semibold text-right">
                      {[profile.village, profile.district, profile.state].filter(Boolean).join(', ')}
                    </span>
                  </div>
                  
                  {/* Replaced Raw Coordinates text display with a Clean View Map link */}
                  {profile.location?.coordinates?.length === 2 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">{locale === 'hi' ? 'मानचित्र स्थान' : 'Map Location'}</span>
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${profile.location.coordinates[1]},${profile.location.coordinates[0]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-village-emerald hover:underline text-xs font-bold flex items-center gap-1"
                      >
                        📍 {locale === 'hi' ? 'मानचित्र नेविगेशन देखें' : 'View Map Navigation'}
                      </a>
                    </div>
                  )}
                </div>

                {profile.bio && (
                  <p className="text-gray-500 text-xs leading-relaxed italic border-t border-gray-100/80 w-full pt-3 text-left">
                    "{profile.bio}"
                  </p>
                )}

                <div className="flex gap-2.5 w-full mt-6">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs py-2.5 rounded-xl border border-gray-250 flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    {locale === 'hi' ? 'प्रोफ़ाइल संपादित करें' : 'Edit Profile'}
                  </button>
                  <button
                    onClick={handleDeleteProfile}
                    className="bg-red-50 hover:bg-red-100 text-red-650 p-2.5 rounded-xl border border-red-200 flex items-center justify-center transition-all shadow-sm active:scale-95"
                    title={t('labour.form.deleteProfile')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Worker edit profile form */
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-village-emerald to-village-mint" />
                <h3 className="text-lg font-bold text-gray-850 mb-4 mt-2">{t('labour.form.editProfileTitle') || 'Edit Work Profile'}</h3>
                <form onSubmit={handleUpdate} className="space-y-4">
                  {/* Edit form Image Select */}
                  <div className="space-y-1 bg-gray-50/50 p-3.5 border border-gray-150 rounded-xl">
                    <label className="text-[10px] font-bold text-gray-550 uppercase block mb-1">{t('labour.form.profileImage') || 'Profile Image'}</label>
                    <div className="flex items-center gap-3">
                      {formData.profileImage ? (
                        <img 
                          src={formData.profileImage} 
                          alt="Preview" 
                          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow bg-white"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full border border-gray-255 flex flex-col items-center justify-center text-gray-400 bg-white">
                          <Image className="w-4 h-4 opacity-55" />
                        </div>
                      )}
                      <div className="flex-1 space-y-1.5">
                        <div className="flex gap-2">
                          <input 
                            type="file" 
                            accept="image/*" 
                            id="worker-edit-image" 
                            onChange={handleImageChange} 
                            className="hidden" 
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById('worker-edit-image').click()}
                            className="bg-white hover:bg-gray-50 border border-gray-250 text-gray-750 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer"
                          >
                            {t('labour.form.browse') || 'Browse'}
                          </button>
                          {formData.profileImage && (
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, profileImage: '' })}
                              className="bg-red-50 hover:bg-red-100 text-red-655 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-red-200 transition-all active:scale-95 cursor-pointer"
                            >
                              {t('common.cancel') || 'Remove'}
                            </button>
                          )}
                        </div>
                        <input 
                          type="text" 
                          value={formData.profileImage || ''}
                          onChange={(e) => setFormData({ ...formData, profileImage: e.target.value })}
                          placeholder={t('labour.form.pasteImageUrl') || "Or paste profile image URL..."}
                          className="w-full p-2 bg-white rounded-lg border border-gray-250 text-[10px] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">{t('labour.form.skill')}</label>
                    <select
                      value={formData.skill}
                      onChange={(e) => setFormData({ ...formData, skill: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-gray-55 border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-village-mint cursor-pointer"
                    >
                      <option value="electrician">{t('labour.skills.electrician')}</option>
                      <option value="plumber">{t('labour.skills.plumber')}</option>
                      <option value="mason">{t('labour.skills.mason')}</option>
                      <option value="carpenter">{t('labour.skills.carpenter')}</option>
                      <option value="mechanic">{t('labour.skills.mechanic')}</option>
                      <option value="painter">{t('labour.skills.painter')}</option>
                      <option value="welder">{t('labour.skills.welder')}</option>
                      <option value="driver">{t('labour.skills.driver')}</option>
                      <option value="cook">{t('labour.skills.cook')}</option>
                      <option value="security">{t('labour.skills.security')}</option>
                      <option value="cleaner">{t('labour.skills.cleaner')}</option>
                      <option value="farmer_labour">{t('labour.skills.farmer_labour')}</option>
                      <option value="tailor">{t('labour.skills.tailor')}</option>
                      <option value="other">{t('labour.skills.other')}</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">{t('labour.form.experience') || 'Exp (Years)'}</label>
                      <input 
                        type="number" 
                        required
                        value={formData.experience}
                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">{t('labour.form.charge') || 'Charge (₹)'}</label>
                      <input 
                        type="number" 
                        required
                        value={formData.serviceCharge}
                        onChange={(e) => setFormData({ ...formData, serviceCharge: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">{t('labour.form.basis') || 'Rate Basis'}</label>
                    <select
                      value={formData.chargeType}
                      onChange={(e) => setFormData({ ...formData, chargeType: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs cursor-pointer"
                    >
                      <option value="daily">{t('labour.form.rateDaily')}</option>
                      <option value="hourly">{t('labour.form.rateHourly')}</option>
                      <option value="fixed">{t('labour.form.rateFixed')}</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">{t('labour.form.contactNumber') || 'Contact Number'}</label>
                      <input 
                        type="text" 
                        required
                        value={formData.contactNumber}
                        onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">{t('labour.form.whatsapp') || 'WhatsApp'}</label>
                      <input 
                        type="text" 
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs"
                      />
                    </div>
                  </div>

                  {/* Edit Form Location details reverse resolving box */}
                  <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-150 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-gray-500 uppercase">{t('location.title')}</span>
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={locating}
                        className="text-[10px] font-bold bg-village-emerald hover:bg-village-darkGreen text-white px-2.5 py-1 rounded-lg transition-transform active:scale-95 disabled:opacity-75 cursor-pointer border-0"
                      >
                        {locating ? t('location.detecting') : t('location.detectBtn')}
                      </button>
                    </div>
                    <div className="space-y-1">
                      <input 
                        type="text" 
                        placeholder={t('location.villagePlaceholder') || "e.g. Village, District, State"}
                        required
                        value={formData.village}
                        onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 font-semibold focus:outline-none focus:ring-1 focus:ring-village-mint"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">{t('labour.form.bio') || 'Bio'}</label>
                    <textarea 
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder={t('labour.form.bioPlaceholder') || "Brief summary about your expertise..."}
                      rows="2"
                      className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-village-mint"
                    ></textarea>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-2 rounded-xl transition-all cursor-pointer border-0"
                    >
                      {t('common.cancel') || 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 bg-village-emerald hover:bg-village-darkGreen text-white font-bold text-xs py-2 rounded-xl transition-all disabled:opacity-75 cursor-pointer border-0 flex items-center justify-center gap-1"
                    >
                      {saving && <Loader className="animate-spin w-3 h-3" />}
                      {saving ? (t('labour.form.saving') || 'Saving...') : (t('labour.form.save') || 'Save')}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Right Column (2 spans): Received Service Requests List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col min-h-[500px]">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 border-b pb-4 mb-4">
                <Clock className="w-5 h-5 text-village-emerald" />
                {t('labour.dashboard.requestsTitle')}
                <span className="bg-village-lightMint text-village-emerald text-xs font-extrabold px-2.5 py-0.5 rounded-full ml-1.5">
                  {processedRequests.length}
                </span>
              </h2>

              {/* Advanced Filter Bar for Incoming Requests */}
              {profile.serviceRequests && profile.serviceRequests.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-3 mb-4 text-xs font-semibold text-left">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder={locale === 'hi' ? 'ग्राहक, गाँव या मोबाइल खोजें...' : 'Search customer, village, mobile...'}
                      value={reqSearchTerm}
                      onChange={e => setReqSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-village-mint"
                    />
                    {reqSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setReqSearchTerm('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-650 border-0 bg-transparent cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  
                  {/* Status Filter */}
                  <div className="relative">
                    <select
                      value={reqStatusFilter}
                      onChange={e => setReqStatusFilter(e.target.value)}
                      className="appearance-none bg-gray-50 border border-gray-200 rounded-xl pl-3 pr-8 py-2.5 text-gray-700 font-bold focus:outline-none cursor-pointer text-xs"
                    >
                      <option value="all">{locale === 'hi' ? 'सभी स्थितियां' : 'All Statuses'}</option>
                      <option value="pending">{t('labour.dashboard.statusPending') || 'Pending'}</option>
                      <option value="accepted">{t('labour.dashboard.statusAccepted') || 'Accepted'}</option>
                      <option value="rejected">{t('labour.dashboard.statusDeclined') || 'Declined'}</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {!profile.serviceRequests || profile.serviceRequests.length === 0 ? (
                  <div className="flex flex-col justify-center items-center h-full text-center py-20 text-gray-400">
                    <Clock className="w-12 h-12 opacity-35 mb-2" />
                    <p className="text-sm font-medium">{t('labour.dashboard.noRequests')}</p>
                  </div>
                ) : processedRequests.length === 0 ? (
                  <div className="flex flex-col justify-center items-center h-full text-center py-20 text-gray-400">
                    <Clock className="w-12 h-12 opacity-35 mb-2" />
                    <p className="text-sm font-medium">{locale === 'hi' ? 'कोई अनुरोध फ़िल्टर से मेल नहीं खाता।' : 'No requests match your filters.'}</p>
                  </div>
                ) : (
                  processedRequests.map((req, idx) => {
                    const statusColor = req.status === 'accepted' 
                      ? 'bg-green-50 text-green-700 border-green-200' 
                      : req.status === 'rejected'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200';
                    
                    const statusLabel = req.status === 'accepted'
                      ? (t('labour.dashboard.statusAccepted') || 'Accepted')
                      : req.status === 'rejected'
                      ? (t('labour.dashboard.statusDeclined') || 'Declined')
                      : (t('labour.dashboard.statusPending') || 'Pending');

                    return (
                      <div 
                        key={req._id || idx}
                        className="p-4 bg-gray-50/50 hover:bg-gray-50 border border-gray-150 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-village-lightMint text-village-emerald text-[10px] font-bold px-2 py-0.5 rounded-md">
                              {idx + 1}
                            </span>
                            <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-gray-400" />
                              {req.requesterName}
                            </h4>
                            <span className="text-[10px] text-gray-400 font-medium flex items-center gap-0.5 ml-2">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(req.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${statusColor}`}>
                              {statusLabel}
                            </span>
                          </div>
  
                          <div className="flex flex-col md:flex-row md:items-center gap-x-6 gap-y-1.5 text-xs text-gray-500 font-semibold">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-gray-400" />
                              {req.requesterMobile || 'N/A'}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-village-mint" />
                              {req.village}
                            </span>
                            {req.coordinates && req.coordinates.length === 2 && (
                              <a 
                                href={`https://www.google.com/maps/search/?api=1&query=${req.coordinates[1]},${req.coordinates[0]}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-village-emerald hover:underline flex items-center gap-0.5 font-bold"
                              >
                                <Map className="w-3.5 h-3.5 text-village-mint" />
                                {t('labour.dashboard.showOnMap')}
                              </a>
                            )}
                          </div>
  
                          {(req.dateTime || req.offerAmount) && (
                            <div className="flex flex-wrap gap-2.5 mt-1.5 mb-1">
                              {req.dateTime && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-700 bg-village-lightMint/40 text-village-darkGreen px-2.5 py-1 rounded-lg border border-village-mint/20 shadow-sm">
                                  <Calendar className="w-3.5 h-3.5 text-village-emerald" />
                                  <span className="text-gray-400 font-normal">{t('labour.dashboard.requestedDateTime')}:</span>
                                  <span>{new Date(req.dateTime).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                </span>
                              )}
                              {req.offerAmount && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-750 bg-yellow-50 text-yellow-800 px-2.5 py-1 rounded-lg border border-yellow-200/50 shadow-sm">
                                  <Coins className="w-3.5 h-3.5 text-yellow-600" />
                                  <span className="text-gray-400 font-normal">{t('labour.dashboard.offerAmount')}:</span>
                                  <span className="text-yellow-700 font-extrabold">₹{req.offerAmount}</span>
                                </span>
                              )}
                            </div>
                          )}
  
                          {req.note && (
                            <p className="text-xs text-gray-600 bg-white/70 p-2.5 rounded-xl border border-gray-150/70 italic leading-relaxed">
                              "{req.note}"
                            </p>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2 self-stretch md:self-auto justify-center">
                          {/* Accept / Decline Buttons (Pending status only) */}
                          {req.status === 'pending' && (
                            <div className="flex gap-2 w-full">
                              <button
                                onClick={() => handleUpdateRequestStatus(req._id, 'rejected')}
                                disabled={statusActionLoading !== null}
                                className="flex-1 md:flex-none bg-red-50 hover:bg-red-100 text-red-650 border border-red-200 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                <X className="w-3.5 h-3.5" />
                                {t('labour.dashboard.reject') || 'Decline'}
                              </button>
                              <button
                                onClick={() => handleUpdateRequestStatus(req._id, 'accepted')}
                                disabled={statusActionLoading !== null}
                                className="flex-1 md:flex-none bg-emerald-500 hover:bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-md cursor-pointer disabled:opacity-50"
                              >
                                {statusActionLoading === req._id ? (
                                  <Loader className="animate-spin w-3.5 h-3.5" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                                {t('labour.dashboard.accept') || 'Accept'}
                              </button>
                            </div>
                          )}

                          <div className="flex gap-2 self-stretch justify-end">
                            {req.requesterId && (
                              <button
                                type="button"
                                onClick={() => handleChatWithClient(req.requesterId)}
                                className="flex-1 md:flex-none bg-white border border-village-mint text-village-emerald px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-village-lightMint transition-colors flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                {locale === 'hi' ? 'चैट करें' : 'Chat'}
                              </button>
                            )}
                            {req.requesterMobile && (
                              <a 
                                href={`tel:${req.requesterMobile}`}
                                className="flex-1 md:flex-none bg-white border border-gray-250 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center text-center"
                              >
                                {locale === 'hi' ? 'कॉल करें' : 'Call'}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YourWork;
