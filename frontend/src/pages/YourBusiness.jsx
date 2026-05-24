import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import { CONFIG } from '../utils/constants';
import { 
  Building2, Users, IndianRupee, Briefcase, Plus, Trash2, Loader, 
  Clock, Phone, TrendingUp, UserPlus, FileText, X, Check, XCircle, AlertCircle, MapPin, MessageCircle,
  Search, ChevronDown
} from 'lucide-react';

const JOB_CATEGORIES = [
  'agriculture',
  'construction',
  'retail',
  'education',
  'healthcare',
  'it',
  'transport',
  'manufacturing',
  'other'
];

const YourBusiness = () => {
  const { t, locale } = useLanguage();
  const isEn = locale === 'en';
  const { token, user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  const [shop, setShop] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [totalSalary, setTotalSalary] = useState(0);
  const [postedJobs, setPostedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tab states: 'employees', 'applicants', 'post-job'
  const [activeTab, setActiveTab] = useState('employees');
  const [selectedJobForApplicants, setSelectedJobForApplicants] = useState(null);

  const [empSearchTerm, setEmpSearchTerm] = useState('');
  const [empRoleFilter, setEmpRoleFilter] = useState('all');
  const [applicantStatusFilter, setApplicantStatusFilter] = useState('all');

  const processedEmployees = React.useMemo(() => {
    return employees.filter(emp => {
      const s = empSearchTerm.toLowerCase();
      const matchesSearch = (emp.name || '').toLowerCase().includes(s) || (emp.role || '').toLowerCase().includes(s) || (emp.mobile || '').includes(s);
      const matchesRole = empRoleFilter === 'all' || emp.role === empRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [employees, empSearchTerm, empRoleFilter]);

  const uniqueEmployeeRoles = React.useMemo(() => {
    const roles = employees.map(emp => emp.role).filter(Boolean);
    return [...new Set(roles)];
  }, [employees]);

  // Manual Add Employee Modal
  const [addEmpModalOpen, setAddEmpModalOpen] = useState(false);
  const [empForm, setEmpForm] = useState({
    name: '',
    mobile: '',
    role: '',
    salary: '',
    salaryType: 'monthly'
  });
  const [empModalError, setEmpModalError] = useState('');
  const [empModalLoading, setEmpModalLoading] = useState(false);

  // Post Job Form
  const [jobForm, setJobForm] = useState({
    title: '',
    company: '',
    description: '',
    category: 'agriculture',
    salaryMin: '',
    salaryMax: '',
    salaryType: 'monthly',
    totalRequired: 1,
    workMode: 'onsite',
    workTiming: '9 AM - 6 PM',
    skillsRequired: '',
    contactNumber: '',
    contactEmail: '',
    village: '',
    district: '',
    state: '',
    latitude: '',
    longitude: ''
  });
  const [jobFormError, setJobFormError] = useState('');
  const [jobFormSuccess, setJobFormSuccess] = useState('');
  const [jobFormLoading, setJobFormLoading] = useState(false);

  // Pricing/Salary changes
  const [actionLoading, setActionLoading] = useState(false);

  // Multiple businesses states
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [isRegisteringNew, setIsRegisteringNew] = useState(false);

  // Business registration states
  const [businessForm, setBusinessForm] = useState({
    name: '',
    type: 'fertilizer',
    description: '',
    address: '',
    whatsapp: '',
    timing: '9 AM - 6 PM',
  });
  const [locationName, setLocationName] = useState('');
  const [resolvedCoords, setResolvedCoords] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoSuccess, setGeoSuccess] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [registerError, setRegisterError] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);

  // Business type mapping labels
  const getBusinessTypeLabel = (type) => {
    const mapping = {
      agri_equipment: locale === 'hi' ? 'कृषि उपकरण' : 'Agri Equipment',
      fertilizer: locale === 'hi' ? 'उर्वरक और बीज' : 'Fertilizers & Seeds',
      grocery: locale === 'hi' ? 'किराना दुकान' : 'Grocery Shop',
      dairy: locale === 'hi' ? 'डेयरी' : 'Dairy',
      medical: locale === 'hi' ? 'दवा की दुकान' : 'Medical Store',
      clinic: locale === 'hi' ? 'क्लिनिक / अस्पताल' : 'Clinic / Hospital',
      electronics: locale === 'hi' ? 'इलेक्ट्रॉनिक्स स्टोर' : 'Electronics Store',
      mobile_repair: locale === 'hi' ? 'मोबाइल रिपेयरिंग' : 'Mobile Repairing',
      cyber_cafe: locale === 'hi' ? 'इंटरनेट कैफे' : 'Cyber Cafe',
      restaurant: locale === 'hi' ? 'होटल / भोजन स्टोर' : 'Hotel / Food Store',
      hardware: locale === 'hi' ? 'हार्डवेयर दुकान' : 'Hardware Shop',
      salon: locale === 'hi' ? 'सैलून / पार्लर' : 'Salon / Parlour',
      other: locale === 'hi' ? 'अन्य व्यवसाय' : 'Other Business'
    };
    return mapping[type] || type;
  };

  // Reverse-geocode coordinates to locationName via OpenStreetMap Nominatim
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );
      if (response.data) {
        if (response.data.display_name) {
          return response.data.display_name;
        }
        const address = response.data.address;
        const parts = [];
        if (address.village || address.suburb || address.town || address.city) {
          parts.push(address.village || address.suburb || address.town || address.city);
        }
        if (address.county || address.district) {
          parts.push(address.county || address.district);
        }
        if (address.state) {
          parts.push(address.state);
        }
        if (parts.length > 0) {
          return parts.join(', ');
        }
      }
      return `${lat}, ${lng}`;
    } catch (err) {
      console.error("Reverse geocoding failed:", err);
      return `${lat}, ${lng}`;
    }
  };

  // Forward-geocode locationName to coordinates via OpenStreetMap Nominatim
  const forwardGeocode = async (query) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      );
      if (response.data && response.data.length > 0) {
        const item = response.data[0];
        return {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon)
        };
      }
      return null;
    } catch (err) {
      console.error("Forward geocoding failed:", err);
      return null;
    }
  };

  // Fetch live geolocation dynamically & reverse lookup to parse address parts
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert(t('location.gpsError') || "Geolocation is not supported by your browser.");
      return;
    }
    setGeoLoading(true);
    setGeoSuccess(false);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        setResolvedCoords({ lat: latitude, lng: longitude });
        
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=${locale}`);
          const data = await response.json();
          
          if (data && data.address) {
            const addr = data.address;
            const villageName = addr.village || addr.suburb || addr.town || addr.city_district || addr.locality || '';
            const districtName = addr.district || addr.county || addr.city || '';
            const stateName = addr.state || '';
            const combined = [villageName, districtName, stateName].filter(Boolean).join(', ');
            
            setBusinessForm(prev => ({
              ...prev,
              village: combined || prev.village,
              district: '',
              state: ''
            }));
            setGeoSuccess(true);
            alert(t('location.success') || "Location details resolved successfully!");
          }
        } catch (err) {
          console.error("Reverse geocoding failed:", err);
          alert(t('location.error') || "Failed to resolve address name. Please fill manually.");
        } finally {
          setGeoLoading(false);
        }
      },
      (error) => {
        console.warn("Geolocation error:", error.message || error);
        alert(t('location.gpsError') || "Failed to retrieve live location.");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            lng: position.coords.longitude,
            lat: position.coords.latitude
          });
        },
        (error) => {
          if (user?.location?.coordinates?.length === 2) {
            setUserCoords({
              lng: user.location.coordinates[0],
              lat: user.location.coordinates[1]
            });
          }
        }
      );
    } else if (user?.location?.coordinates?.length === 2) {
      setUserCoords({
        lng: user.location.coordinates[0],
        lat: user.location.coordinates[1]
      });
    }
  }, [user]);

  // Pre-populate registration fields from logged-in user profile
  useEffect(() => {
    if (user && !shop) {
      const combined = [user.village, user.district, user.state].filter(Boolean).join(', ');
      setBusinessForm(prev => ({
        ...prev,
        whatsapp: prev.whatsapp || user.mobile || '',
        village: prev.village || combined || '',
        district: '',
        state: ''
      }));
      if (user.location?.coordinates?.length === 2) {
        setResolvedCoords({
          lng: user.location.coordinates[0],
          lat: user.location.coordinates[1]
        });
      }
    }
  }, [user, shop]);

  // Keep locationName in sync with userCoords initially
  useEffect(() => {
    const initLocationName = async () => {
      if (userCoords && !locationName) {
        setGeoLoading(true);
        const name = await reverseGeocode(userCoords.lat, userCoords.lng);
        setLocationName(name);
        setResolvedCoords({ lat: userCoords.lat, lng: userCoords.lng });
        setGeoLoading(false);
      }
    };
    initLocationName();
  }, [userCoords]);

  const loadBusinessData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      
      // 1. Fetch all user's businesses
      const busRes = await axios.get(`${CONFIG.API_BASE_URL}/api/market/my-businesses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const bizList = busRes.data || [];
      setBusinesses(bizList);
      
      if (bizList.length > 0) {
        let activeBiz = bizList[0];
        if (selectedBusinessId) {
          const found = bizList.find(b => b._id === selectedBusinessId);
          if (found) activeBiz = found;
        }
        
        setSelectedBusinessId(activeBiz._id);
        setShop(activeBiz);
        setIsRegisteringNew(false);

        // Auto-fill company name, contact, and location in job form
        const combinedAddress = [activeBiz.village || user?.village, activeBiz.district || user?.district, activeBiz.state || user?.state].filter(Boolean).join(', ');
        setJobForm(prev => ({
          ...prev,
          company: activeBiz.name,
          contactNumber: activeBiz.contactNumber || '',
          village: combinedAddress,
          district: '',
          state: '',
          latitude: activeBiz.location?.coordinates?.[1] || '',
          longitude: activeBiz.location?.coordinates?.[0] || ''
        }));

        // 2. Fetch employees for active business
        try {
          const empRes = await axios.get(`${CONFIG.API_BASE_URL}/api/employees?businessId=${activeBiz._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setEmployees(empRes.data.employees || []);
          setTotalSalary(empRes.data.totalSalary || 0);
        } catch (err) {
          console.error("Failed to load employees:", err);
        }

        // 3. Fetch posted jobs and applicants
        try {
          const jobsRes = await axios.get(`${CONFIG.API_BASE_URL}/api/jobs/posted?businessId=${activeBiz._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setPostedJobs(jobsRes.data || []);
          
          if (jobsRes.data.length > 0) {
            const stillExists = jobsRes.data.some(j => j._id === selectedJobForApplicants);
            if (!stillExists) {
              setSelectedJobForApplicants(jobsRes.data[0]._id);
            }
          } else {
            setSelectedJobForApplicants(null);
          }
        } catch (err) {
          console.error("Failed to load posted jobs:", err);
        }
      } else {
        setShop(null);
        setIsRegisteringNew(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBusinessData();
  }, [token, selectedBusinessId]);

  // Handle Business Registration
  const handleRegisterBusiness = async (e) => {
    e.preventDefault();
    setRegisterLoading(true);
    setRegisterError('');
    try {
      const parts = businessForm.village.split(',').map(p => p.trim());
      const villageVal = parts[0] || '';
      const districtVal = parts[1] || '';
      const stateVal = parts.slice(2).join(', ') || '';

      const payload = {
        ...businessForm,
        village: villageVal,
        district: districtVal,
        state: stateVal,
        contactNumber: businessForm.whatsapp
      };

      let finalCoords = resolvedCoords;
      if (!finalCoords && businessForm.village) {
        const query = businessForm.village;
        const geocoded = await forwardGeocode(query);
        if (geocoded) {
          finalCoords = geocoded;
        }
      }

      if (finalCoords) {
        payload.location = {
          type: 'Point',
          coordinates: [finalCoords.lng, finalCoords.lat]
        };
      }

      const res = await axios.post(
        `${CONFIG.API_BASE_URL}/api/market/business`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setBusinessForm({
        name: '',
        type: 'fertilizer',
        description: '',
        address: '',
        whatsapp: '',
        timing: '9 AM - 6 PM',
        village: '',
        district: '',
        state: '',
      });
      setResolvedCoords(null);
      setGeoSuccess(false);
      
      setSelectedBusinessId(res.data._id);
      setIsRegisteringNew(false);
      await loadBusinessData();
    } catch (err) {
      console.error(err);
      setRegisterError(err.response?.data?.message || t('yourShop.registerFail') || 'Failed to register business.');
    } finally {
      setRegisterLoading(false);
    }
  };

  // Handle Socket.io job updates in real-time
  useEffect(() => {
    if (!socket) return;

    const handleJobUpdated = (updatedJob) => {
      setPostedJobs(currentJobs => 
        currentJobs.map(job => job._id === updatedJob._id ? updatedJob : job)
      );
    };

    socket.on('job_updated', handleJobUpdated);
    return () => {
      socket.off('job_updated', handleJobUpdated);
    };
  }, [socket]);

  // ── Employee Salary Adjustments ──
  const handleSalaryChange = async (employeeId, newSalary) => {
    if (newSalary < 0) return;
    try {
      setActionLoading(true);
      const res = await axios.put(
        `${CONFIG.API_BASE_URL}/api/employees/${employeeId}`,
        { salary: newSalary },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update locally
      setEmployees(prev => prev.map(emp => emp._id === employeeId ? res.data : emp));
      
      // Recalculate total salary payroll locally
      setEmployees(current => {
        const sum = current.reduce((acc, emp) => acc + emp.salary, 0);
        setTotalSalary(sum);
        return current;
      });

    } catch (err) {
      console.error(err);
      alert(t('yourBusiness.updateSalaryFailMsg'));
    } finally {
      setActionLoading(false);
    }
  };

  // ── Fire / Delete Employee ──
  const handleRemoveEmployee = async (employeeId) => {
    if (!window.confirm(t('yourBusiness.removeConfirm'))) return;
    try {
      setActionLoading(true);
      await axios.delete(
        `${CONFIG.API_BASE_URL}/api/employees/${employeeId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setEmployees(prev => prev.filter(emp => emp._id !== employeeId));
      
      // Recalculate total salary payroll locally
      setEmployees(current => {
        const sum = current.reduce((acc, emp) => acc + emp.salary, 0);
        setTotalSalary(sum);
        return current;
      });
      
    } catch (err) {
      console.error(err);
      alert(t('yourBusiness.removeEmployeeFailMsg'));
    } finally {
      setActionLoading(false);
    }
  };

  // ── Manual Add Employee ──
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setEmpModalError('');
    setEmpModalLoading(true);
    try {
      const payload = {
        name: empForm.name,
        role: empForm.role,
        salary: parseFloat(empForm.salary) || 0,
        mobile: empForm.mobile,
        salaryType: empForm.salaryType,
        businessId: selectedBusinessId
      };

      const res = await axios.post(
        `${CONFIG.API_BASE_URL}/api/employees`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setEmployees(prev => [res.data, ...prev]);
      
      // Recalculate total salary payroll locally
      setEmployees(current => {
        const sum = current.reduce((acc, emp) => acc + emp.salary, 0);
        setTotalSalary(sum);
        return current;
      });

      setEmpForm({
        name: '',
        mobile: '',
        role: '',
        salary: '',
        salaryType: 'monthly'
      });
      setAddEmpModalOpen(false);
    } catch (err) {
      console.error(err);
      setEmpModalError(err.response?.data?.message || t('yourBusiness.addEmployeeFailMsg'));
    } finally {
      setEmpModalLoading(false);
    }
  };

  // ── Process Applicant (Hire or Reject) ──
  const handleApplicantStatus = async (jobId, applicantUserId, newStatus) => {
    try {
      setActionLoading(true);
      const res = await axios.put(
        `${CONFIG.API_BASE_URL}/api/jobs/${jobId}/applicants/${applicantUserId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update posted jobs state
      setPostedJobs(prev => prev.map(job => job._id === jobId ? res.data : job));
      
      // If hired, refresh employee list to show the newly added employee
      if (newStatus === 'hired') {
        const empRes = await axios.get(`${CONFIG.API_BASE_URL}/api/employees?businessId=${selectedBusinessId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEmployees(empRes.data.employees || []);
        setTotalSalary(empRes.data.totalSalary || 0);
        alert(t('yourBusiness.applicantHiredMsg'));
      } else {
        alert(t('yourBusiness.applicantRejectedMsg'));
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || t('yourBusiness.applicantStatusFailMsg'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleChatWithApplicant = async (applicantUserId) => {
    if (!token) {
      alert(locale === 'hi' ? 'चैट करने के लिए कृपया लॉग इन करें।' : 'Please log in to chat.');
      return;
    }
    if (applicantUserId === user?._id) {
      alert(locale === 'hi' ? 'आप खुद से चैट नहीं कर सकते।' : 'You cannot chat with yourself.');
      return;
    }
    try {
      const res = await axios.post(
        `${CONFIG.API_BASE_URL}/api/chat/room`,
        { userId2: applicantUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate(`/chat?roomId=${res.data._id}`);
    } catch (err) {
      console.error(err);
      alert(locale === 'hi' ? 'आवेदक के साथ चैट शुरू करने में विफल।' : 'Failed to start chat with the applicant.');
    }
  };

  const calculateApplicantDistance = (applicant) => {
    const appLocation = applicant.userId?.location || applicant.location;
    const bizLocation = shop?.location || user?.location;

    if (bizLocation && appLocation && bizLocation.coordinates?.length === 2 && appLocation.coordinates?.length === 2) {
      const [bizLng, bizLat] = bizLocation.coordinates;
      const [appLng, appLat] = appLocation.coordinates;
      
      const R = 6371; // km
      const dLat = (appLat - bizLat) * Math.PI / 180;
      const dLon = (appLng - bizLng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(bizLat * Math.PI / 180) * Math.cos(appLat * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      const d = R * c;
      return { val: d, label: locale === 'hi' ? `${d.toFixed(1)} किमी दूर` : `${d.toFixed(1)} km away`, type: 'gps' };
    }

    // fallback to text matching
    const bVillage = (shop?.village || user?.village || '').trim().toLowerCase();
    const aVillage = (applicant.userId?.village || applicant.village || '').trim().toLowerCase();

    if (bVillage && aVillage && bVillage === aVillage) {
      return { val: 0.1, label: t('healthcare.sameVillage') || 'Same Village', type: 'text' };
    }

    return { val: 9999, label: applicant.userId?.village || applicant.village || t('healthcare.nearby') || 'Nearby', type: 'unknown' };
  };

  const renderApplicantDistanceBadge = (distanceInfo) => {
    if (!distanceInfo || distanceInfo.val === 9999) return null;

    const val = distanceInfo.val;
    let bgClass = '';
    let textClass = '';
    let borderClass = '';
    let label = distanceInfo.label;

    if (distanceInfo.type === 'gps') {
      if (val < 1) {
        bgClass = 'bg-emerald-50';
        textClass = 'text-emerald-700';
        borderClass = 'border-emerald-250';
        label = `🟢 ${label} ${t('healthcare.veryClose') || '(Very Close)'}`;
      } else if (val <= 15) {
        bgClass = 'bg-teal-50';
        textClass = 'text-teal-700';
        borderClass = 'border-teal-250';
        label = `🔵 ${label} ${t('healthcare.nearby') || '(Nearby)'}`;
      } else {
        bgClass = 'bg-amber-50';
        textClass = 'text-amber-800';
        borderClass = 'border-amber-250';
        label = `⚠️ ${label} ${t('healthcare.farLocation') || '(Far)'}`;
      }
    } else if (distanceInfo.type === 'text') {
      bgClass = 'bg-emerald-50';
      textClass = 'text-emerald-700';
      borderClass = 'border-emerald-250';
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${bgClass} ${textClass} ${borderClass} shadow-sm transition-all`}>
        {label}
      </span>
    );
  };

  // ── Create Job Vacancy ──
  const handleCreateJob = async (e) => {
    e.preventDefault();
    setJobFormError('');
    setJobFormSuccess('');
    setJobFormLoading(true);
    try {
      const parts = jobForm.village.split(',').map(p => p.trim());
      const villageVal = parts[0] || '';
      const districtVal = parts[1] || '';
      const stateVal = parts.slice(2).join(', ') || '';

      const payload = {
        ...jobForm,
        salaryMin: parseFloat(jobForm.salaryMin) || 0,
        salaryMax: jobForm.salaryMax ? parseFloat(jobForm.salaryMax) : undefined,
        totalRequired: parseInt(jobForm.totalRequired) || 1,
        skillsRequired: jobForm.skillsRequired ? jobForm.skillsRequired.split(',').map(s => s.trim()) : [],
        village: villageVal,
        district: districtVal,
        state: stateVal,
        businessId: selectedBusinessId
      };

      if (jobForm.latitude && jobForm.longitude) {
        payload.location = {
          type: 'Point',
          coordinates: [parseFloat(jobForm.longitude), parseFloat(jobForm.latitude)]
        };
      } else if (shop?.location) {
        payload.location = shop.location;
      }

      const res = await axios.post(
        `${CONFIG.API_BASE_URL}/api/jobs`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPostedJobs(prev => [res.data, ...prev]);
      if (!selectedJobForApplicants) {
        setSelectedJobForApplicants(res.data._id);
      }
      
      const combined = [shop?.village || user?.village, shop?.district || user?.district, shop?.state || user?.state].filter(Boolean).join(', ');
      setJobForm({
        title: '',
        company: shop?.name || '',
        description: '',
        category: 'agriculture',
        salaryMin: '',
        salaryMax: '',
        salaryType: 'monthly',
        totalRequired: 1,
        workMode: 'onsite',
        workTiming: '9 AM - 6 PM',
        skillsRequired: '',
        contactNumber: shop?.contactNumber || '',
        contactEmail: '',
        village: combined,
        district: '',
        state: '',
        latitude: shop?.location?.coordinates?.[1] || '',
        longitude: shop?.location?.coordinates?.[0] || ''
      });
      setJobFormSuccess(t('yourBusiness.postJobSuccessMsg'));
      setActiveTab('applicants'); // redirect to applications tab
    } catch (err) {
      console.error(err);
      setJobFormError(err.response?.data?.message || t('yourBusiness.postJobFailMsg'));
    } finally {
      setJobFormLoading(false);
    }
  };

  const selectedJob = postedJobs.find(j => j._id === selectedJobForApplicants);
  const selectedApplicants = React.useMemo(() => {
    const list = selectedJob?.applicants || [];
    return list.filter(app => {
      return applicantStatusFilter === 'all' || app.status === applicantStatusFilter;
    });
  }, [selectedJob, applicantStatusFilter]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-500 p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3 mb-2">
            <Building2 className="w-8 h-8 text-teal-200" />
            {t('yourBusiness.title')}
          </h1>
          <p className="text-emerald-100 text-lg opacity-90">
            {shop ? t('yourBusiness.manageSubtitle', { name: shop.name }) : t('yourBusiness.controlSubtitle')}
          </p>
        </div>
        {shop && activeTab === 'employees' && (
          <button 
            onClick={() => {
              setEmpModalError('');
              setAddEmpModalOpen(true);
            }}
            className="bg-white text-teal-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-50 transition-all shadow-lg transform hover:-translate-y-0.5 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            {t('yourBusiness.addEmployee')}
          </button>
        )}
      </div>

      {/* Business Switcher & Add Button Bar */}
      {businesses.length > 0 && !isRegisteringNew && (
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-gray-150 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto text-left">
            <Building2 className="w-5 h-5 text-teal-600 flex-shrink-0" />
            <label className="text-sm font-bold text-gray-700 whitespace-nowrap">
              {t('yourBusiness.selectBusiness')}
            </label>
            <select
              value={selectedBusinessId}
              onChange={(e) => setSelectedBusinessId(e.target.value)}
              className="flex-1 sm:flex-none p-2.5 rounded-xl bg-gray-50 border border-gray-250 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 font-bold text-gray-800"
            >
              {businesses.map((biz) => (
                <option key={biz._id} value={biz._id}>
                  {biz.name} ({getBusinessTypeLabel(biz.type)})
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setIsRegisteringNew(true)}
            className="w-full sm:w-auto bg-teal-50 hover:bg-teal-100 text-teal-700 px-5 py-2.5 rounded-xl font-bold text-sm transition-all border border-teal-150 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('yourBusiness.registerAnotherBusiness')}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader className="animate-spin text-teal-600 w-12 h-12" />
        </div>
      ) : isRegisteringNew ? (
        /* BUSINESS REGISTRATION CARD FORM */
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto glass-card bg-white p-8 rounded-3xl shadow-xl border border-gray-100"
        >
          <div className="text-center mb-6">
            <Building2 className="w-16 h-16 text-teal-500 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-gray-800">{t('yourShop.registerTitle')}</h2>
            <p className="text-gray-500 text-sm mt-1">{t('yourShop.registerSubtitle')}</p>
          </div>

          {registerError && (
            <div className="bg-red-50 text-red-650 border border-red-200 p-3 rounded-xl text-sm font-medium mb-4">
              {registerError}
            </div>
          )}

          <form onSubmit={handleRegisterBusiness} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-650 text-left block">{t('yourShop.shopName')}</label>
              <input 
                type="text" 
                required
                value={businessForm.name}
                onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })}
                placeholder="e.g. Kisan Seed Agency"
                className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-650 text-left block">{t('yourShop.businessType')}</label>
                <select
                  value={businessForm.type}
                  onChange={(e) => setBusinessForm({ ...businessForm, type: e.target.value })}
                  className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-gray-800 font-medium"
                >
                  <option value="agri_equipment" className="bg-white text-gray-800 font-medium">{getBusinessTypeLabel('agri_equipment')}</option>
                  <option value="fertilizer" className="bg-white text-gray-800 font-medium">{getBusinessTypeLabel('fertilizer')}</option>
                  <option value="grocery" className="bg-white text-gray-800 font-medium">{getBusinessTypeLabel('grocery')}</option>
                  <option value="dairy" className="bg-white text-gray-800 font-medium">{getBusinessTypeLabel('dairy')}</option>
                  <option value="medical" className="bg-white text-gray-800 font-medium">{getBusinessTypeLabel('medical')}</option>
                  <option value="clinic" className="bg-white text-gray-800 font-medium">{getBusinessTypeLabel('clinic')}</option>
                  <option value="electronics" className="bg-white text-gray-800 font-medium">{getBusinessTypeLabel('electronics')}</option>
                  <option value="mobile_repair" className="bg-white text-gray-800 font-medium">{getBusinessTypeLabel('mobile_repair')}</option>
                  <option value="cyber_cafe" className="bg-white text-gray-800 font-medium">{getBusinessTypeLabel('cyber_cafe')}</option>
                  <option value="restaurant" className="bg-white text-gray-800 font-medium">{getBusinessTypeLabel('restaurant')}</option>
                  <option value="hardware" className="bg-white text-gray-800 font-medium">{getBusinessTypeLabel('hardware')}</option>
                  <option value="salon" className="bg-white text-gray-800 font-medium">{getBusinessTypeLabel('salon')}</option>
                  <option value="other" className="bg-white text-gray-800 font-medium">{getBusinessTypeLabel('other')}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-655 text-left block">{t('yourShop.contactNumber')}</label>
                <input 
                  type="text" 
                  required
                  maxLength="10"
                  value={businessForm.whatsapp}
                  onChange={(e) => setBusinessForm({ ...businessForm, whatsapp: e.target.value })}
                  placeholder={locale === 'hi' ? '10-अंकीय मोबाइल नंबर' : '10-digit number'}
                  className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-650 text-left block">{t('yourShop.workingHours')}</label>
                <input 
                  type="text" 
                  value={businessForm.timing}
                  onChange={(e) => setBusinessForm({ ...businessForm, timing: e.target.value })}
                  placeholder={locale === 'hi' ? 'जैसे सुबह 9 - शाम 6 बजे' : 'e.g. 9 AM - 6 PM'}
                  className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-650 text-left block">{t('yourShop.shopAddress')}</label>
                <input 
                  type="text" 
                  required
                  value={businessForm.address}
                  onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })}
                  placeholder={locale === 'hi' ? 'जैसे मुख्य मंडी रोड, रामनगर' : 'e.g. Main Mandi Road, Ramnagar'}
                  className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
            </div>

            {/* Geolocation Section */}
            <div className="bg-teal-50/50 border border-teal-100 p-4 rounded-2xl space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <span className="text-xs font-bold text-gray-700">{t('location.title') || "Location Name details"}</span>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={geoLoading}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow transition-all active:scale-95 disabled:opacity-75 cursor-pointer border-0"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {geoLoading ? (t('location.detecting') || 'Detecting...') : (t('location.detectBtn') || 'Detect Location Name')}
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-555 uppercase text-left block">{t('location.singleLabel')}</label>
                <input 
                  type="text" 
                  required
                  value={businessForm.village}
                  onChange={(e) => setBusinessForm({ ...businessForm, village: e.target.value })}
                  placeholder={t('location.villagePlaceholder') || "e.g. Village, District, State"}
                  className="w-full p-3 bg-white rounded-xl border border-gray-200 text-xs text-gray-800 font-semibold focus:outline-none focus:ring-1 focus:ring-teal-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-650 text-left block">{t('yourShop.aboutBusiness')}</label>
              <textarea 
                value={businessForm.description}
                onChange={(e) => setBusinessForm({ ...businessForm, description: e.target.value })}
                placeholder={t('yourShop.aboutPlaceholder')}
                rows="3"
                className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none text-left"
              ></textarea>
            </div>

            <div className="flex gap-4">
              {businesses.length > 0 && (
                <button 
                  type="button" 
                  onClick={() => setIsRegisteringNew(false)}
                  className="flex-1 bg-gray-150 text-gray-700 py-3.5 rounded-xl font-bold hover:bg-gray-250 transition-colors flex items-center justify-center gap-2 shadow-sm text-sm"
                >
                  {t('common.cancel')}
                </button>
              )}
              <button 
                type="submit" 
                disabled={registerLoading}
                className="flex-1 bg-teal-600 text-white py-3.5 rounded-xl font-bold hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-75"
              >
                {registerLoading && <Loader className="animate-spin w-5 h-5" />}
                {t('yourShop.registerBtn')}
              </button>
            </div>
          </form>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Stat 1: Total Employees */}
            <div className="glass-card p-6 bg-white border border-gray-100 rounded-3xl flex items-center justify-between shadow-sm relative overflow-hidden">
              <div className="space-y-1 z-10 text-left">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('yourBusiness.activeStaff')}</p>
                <h3 className="text-3xl font-black text-gray-800">{employees.length}</h3>
                <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> {t('yourBusiness.directStaff')}
                </p>
              </div>
              <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center text-2xl">
                <Users className="w-6 h-6" />
              </div>
              <div className="absolute right-[-20px] bottom-[-20px] text-gray-50 opacity-10 text-8xl">👥</div>
            </div>

            {/* Stat 2: Total Payroll */}
            <div className="glass-card p-6 bg-white border border-gray-100 rounded-3xl flex items-center justify-between shadow-sm relative overflow-hidden">
              <div className="space-y-1 z-10 text-left">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('yourBusiness.monthlyPayroll')}</p>
                <h3 className="text-3xl font-black text-amber-600 flex items-center">
                  <IndianRupee className="w-6 h-6" />
                  {locale === 'hi' ? totalSalary.toLocaleString('hi-IN') : totalSalary.toLocaleString('en-IN')}
                </h3>
                <p className="text-xs text-gray-500">{t('yourBusiness.autoCalculated')}</p>
              </div>
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-2xl">
                <IndianRupee className="w-6 h-6" />
              </div>
              <div className="absolute right-[-20px] bottom-[-20px] text-gray-50 opacity-10 text-8xl">₹</div>
            </div>

            {/* Stat 3: Open Job Openings */}
            <div className="glass-card p-6 bg-white border border-gray-100 rounded-3xl flex items-center justify-between shadow-sm relative overflow-hidden">
              <div className="space-y-1 z-10 text-left">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('yourBusiness.activePostings')}</p>
                <h3 className="text-3xl font-black text-cyan-600">{postedJobs.length}</h3>
                <p className="text-xs text-cyan-600 font-semibold flex items-center gap-1">
                  {t('yourBusiness.hiringTalent')}
                </p>
              </div>
              <div className="w-14 h-14 bg-cyan-50 text-cyan-600 rounded-2xl flex items-center justify-center text-2xl">
                <Briefcase className="w-6 h-6" />
              </div>
              <div className="absolute right-[-20px] bottom-[-20px] text-gray-50 opacity-10 text-8xl">💼</div>
            </div>

          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap scrollbar-none">
            {[
              { id: 'employees', label: `👥 ${t('yourBusiness.employeesTab')}`, count: employees.length },
              { id: 'applicants', label: `📩 ${t('yourBusiness.applicantsTab')}`, count: postedJobs.reduce((acc, j) => acc + j.applicants.filter(a => a.status === 'applied').length, 0) },
              { id: 'post-job', label: `💼 ${t('yourBusiness.postJobTab')}` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                  activeTab === tab.id
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-gray-500 hover:text-teal-600 hover:border-gray-300'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full text-xs font-bold">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'employees' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Search & Filter Bar */}
              <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-center text-xs font-semibold">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={isEn ? 'Search employees by name, mobile, role...' : 'कर्मचारी का नाम, मोबाइल या रोल खोजें...'}
                    value={empSearchTerm}
                    onChange={e => setEmpSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs text-xs font-semibold"
                  />
                  {empSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setEmpSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-605 border-0 bg-transparent cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="relative w-full sm:w-48 shrink-0">
                  <select
                    value={empRoleFilter}
                    onChange={e => setEmpRoleFilter(e.target.value)}
                    className="appearance-none w-full bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-2.5 text-gray-700 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-xs text-xs"
                  >
                    <option value="all">{isEn ? 'All Roles' : 'सभी भूमिकाएँ'}</option>
                    {uniqueEmployeeRoles.map(role => (
                      <option key={role} value={role} className="capitalize">{role}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                {(empSearchTerm || empRoleFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setEmpSearchTerm('');
                      setEmpRoleFilter('all');
                    }}
                    className="text-red-500 hover:text-red-650 font-bold flex items-center gap-1 bg-transparent border-0 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    {isEn ? 'Clear' : 'साफ करें'}
                  </button>
                )}
              </div>
              {employees.length === 0 ? (
                /* ── No employees at all ── */
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                    <Users className="w-9 h-9 text-gray-300" />
                  </div>
                  <h4 className="text-base font-bold text-gray-700 mb-1">
                    {isEn ? 'No Employees Yet' : 'कोई कर्मचारी नहीं'}
                  </h4>
                  <p className="text-sm text-gray-400 max-w-xs">
                    {isEn
                      ? 'Add employees manually or hire applicants from job postings.'
                      : 'कर्मचारियों को मैन्युअल रूप से जोड़ें या नौकरी पोस्टिंग से आवेदकों को नियुक्त करें।'}
                  </p>
                  <button
                    onClick={() => { setEmpModalError(''); setAddEmpModalOpen(true); }}
                    className="mt-5 bg-teal-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-teal-700 transition-all shadow-md"
                  >
                    <UserPlus className="w-4 h-4" />
                    {isEn ? 'Add First Employee' : 'पहला कर्मचारी जोड़ें'}
                  </button>
                </div>
              ) : processedEmployees.length === 0 ? (
                /* ── Search/filter returned no results ── */
                <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                  <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-3 border border-amber-100">
                    <Search className="w-7 h-7 text-amber-400" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-700 mb-1">
                    {isEn ? 'No employees match your search' : 'खोज से कोई कर्मचारी नहीं मिला'}
                  </h4>
                  <p className="text-xs text-gray-400">
                    {isEn ? 'Try a different name, mobile or role.' : 'कोई अन्य नाम, मोबाइल या भूमिका आजमाएँ।'}
                  </p>
                  <button
                    onClick={() => { setEmpSearchTerm(''); setEmpRoleFilter('all'); }}
                    className="mt-4 text-teal-600 text-xs font-bold hover:underline"
                  >
                    {isEn ? 'Clear Filters' : 'फ़िल्टर हटाएँ'}
                  </button>
                </div>
              ) : (
                /* ── Employee table ── */
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 font-bold text-xs uppercase tracking-wider">
                        <th className="pb-3 pl-4">{t('yourBusiness.tableName')}</th>
                        <th className="pb-3">{t('yourBusiness.tableRole')}</th>
                        <th className="pb-3">{t('yourBusiness.tableContact')}</th>
                        <th className="pb-3">{locale === 'hi' ? 'स्थान' : 'Place'}</th>
                        <th className="pb-3">{locale === 'hi' ? 'दूरी' : 'Distance'}</th>
                        <th className="pb-3">{t('yourBusiness.tableJoined')}</th>
                        <th className="pb-3">{t('yourBusiness.tableSalary')}</th>
                        <th className="pb-3 text-right pr-4">{t('yourBusiness.tableActions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm">
                      {processedEmployees.map(emp => {
                        const empDistanceInfo = calculateApplicantDistance(emp);
                        return (
                          <tr key={emp._id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-4 pl-4 font-bold text-gray-850">{emp.name}</td>
                            <td className="py-4">
                              <span className="bg-teal-50 text-teal-700 border border-teal-100 px-2.5 py-1 rounded-lg text-xs font-semibold capitalize">
                                {emp.role}
                              </span>
                            </td>
                            <td className="py-4 text-gray-550 font-medium">{emp.mobile || t('yourBusiness.noPhone')}</td>
                            <td className="py-4 text-gray-550 font-medium">
                              {emp.userId?.village || emp.village || '-'}
                            </td>
                            <td className="py-4">
                              {renderApplicantDistanceBadge(empDistanceInfo)}
                            </td>
                            <td className="py-4 text-gray-550">{new Date(emp.joinedAt).toLocaleDateString()}</td>
                            <td className="py-4">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-800 flex items-center">
                                  <IndianRupee className="w-3.5 h-3.5 text-gray-500" />
                                  {emp.salary}
                                </span>
                                <span className="text-[10px] text-gray-400 font-semibold uppercase">
                                  {t('yourBusiness.salaryCycle', { type: t(`yourBusiness.salaryTypes.${emp.salaryType}`) })}
                                </span>
                                <div className="flex items-center gap-1 ml-2">
                                  <button
                                    type="button"
                                    onClick={() => handleSalaryChange(emp._id, emp.salary - 100)}
                                    title={t('yourBusiness.decreaseSalaryTitle')}
                                    disabled={actionLoading || emp.salary <= 100}
                                    className="w-6 h-6 rounded-md bg-red-50 text-red-650 flex items-center justify-center font-bold text-xs hover:bg-red-100 transition-colors active:scale-95 disabled:opacity-50"
                                  >
                                    -
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSalaryChange(emp._id, emp.salary + 100)}
                                    title={t('yourBusiness.increaseSalaryTitle')}
                                    disabled={actionLoading}
                                    className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs hover:bg-emerald-100 transition-colors active:scale-95"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 text-right pr-4">
                              <div className="flex items-center justify-end gap-1">
                                {emp.userId?._id && (
                                  <button
                                    type="button"
                                    onClick={() => handleChatWithApplicant(emp.userId._id)}
                                    className="p-2 text-teal-650 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition-all active:scale-95"
                                    title={t('labour.message') || 'Chat'}
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveEmployee(emp._id)}
                                  disabled={actionLoading}
                                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-95"
                                  title={t('yourBusiness.removeEmployeeTitle')}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
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

            {/* TAB: Applicants */}
            {activeTab === 'applicants' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Side: List of Job vacancies */}
                <div className="glass-card bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4 lg:col-span-1 text-left">
                  <h3 className="font-bold text-gray-800 text-base">{t('yourBusiness.selectJob')}</h3>
                  
                  {postedJobs.length === 0 ? (
                    <p className="text-gray-400 text-sm py-4">{t('yourBusiness.noJobsYet')}</p>
                  ) : (
                    <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                      {postedJobs.map(job => {
                        const newApplicants = job.applicants.filter(a => a.status === 'applied').length;
                        const isSelected = job._id === selectedJobForApplicants;
                        
                        return (
                          <button
                            key={job._id}
                            onClick={() => setSelectedJobForApplicants(job._id)}
                            className={`w-full p-4 rounded-2xl border text-left transition-all ${
                              isSelected 
                                ? 'bg-teal-50 border-teal-200 shadow-sm'
                                : 'bg-gray-50/50 border-gray-150 hover:bg-gray-50'
                            }`}
                          >
                            <h4 className="font-bold text-gray-800 text-sm truncate">{job.title}</h4>
                            <p className="text-xs text-gray-500 mt-1 uppercase font-semibold">{t(`yourBusiness.jobCategories.${job.category}`)}</p>
                            <div className="flex justify-between items-center mt-3">
                              <span className="text-xs text-gray-500 font-medium">
                                {t('yourBusiness.hiredStatus', { filled: job.filledCount, total: job.totalRequired })}
                              </span>
                              {newApplicants > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                  {t('yourBusiness.newApplicantsTag', { count: newApplicants })}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right Side: Applicants list */}
                <div className="glass-card bg-white p-6 rounded-3xl border border-gray-100 shadow-sm lg:col-span-2 space-y-4 text-left">
                  <div className="border-b border-gray-50 pb-4">
                    <h3 className="text-lg font-bold text-gray-800">
                      {selectedJob ? t('yourBusiness.applicationsFor', { title: selectedJob.title }) : t('yourBusiness.selectJobToView')}
                    </h3>
                    {selectedJob && (
                      <p className="text-xs text-gray-400 mt-1">
                        {t('yourBusiness.postedOn', { 
                          date: new Date(selectedJob.createdAt).toLocaleDateString(), 
                          slots: selectedJob.totalRequired - selectedJob.filledCount 
                        })}
                      </p>
                    )}
                  </div>

                  {selectedJob && (
                    <div className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-150 text-xs font-semibold">
                      <span className="text-gray-500">{isEn ? 'Filter by Status:' : 'स्थिति के अनुसार फ़िल्टर:'}</span>
                      <div className="relative">
                        <select
                          value={applicantStatusFilter}
                          onChange={e => setApplicantStatusFilter(e.target.value)}
                          className="appearance-none bg-white border border-gray-250 rounded-lg pl-2.5 pr-7 py-1 text-gray-700 font-bold focus:outline-none cursor-pointer"
                        >
                          <option value="all">{isEn ? 'All Statuses' : 'सभी स्थितियां'}</option>
                          <option value="applied">{isEn ? 'Applied / Pending' : 'आवेदन किया / लंबित'}</option>
                          <option value="shortlisted">{isEn ? 'Shortlisted' : 'शॉर्टलिस्टेड'}</option>
                          <option value="hired">{isEn ? 'Hired' : 'नियुक्त'}</option>
                          <option value="rejected">{isEn ? 'Rejected' : 'अस्वीकृत'}</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  )}

                  {selectedJob && selectedApplicants.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center space-y-2">
                      <FileText className="w-12 h-12 text-gray-300" />
                      <h4 className="font-bold text-gray-700">{t('yourBusiness.noApplicants')}</h4>
                      <p className="text-xs max-w-sm">{t('yourBusiness.noApplicantsDesc')}</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                      {selectedApplicants.map(app => {
                        const distanceInfo = calculateApplicantDistance(app);
                        const appVillage = app.userId?.village || app.village;
                        return (
                          <div 
                            key={app.userId?._id || app.userId}
                            className="p-4 bg-gray-50/50 border border-gray-150 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="space-y-1">
                              <h4 className="font-bold text-gray-800 text-base">{app.name}</h4>
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5 text-gray-400" /> {t('yourBusiness.mobileLabel')}: {app.mobile || t('yourBusiness.noPhone')}
                              </p>
                              {appVillage && (
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" /> {appVillage}
                                </p>
                              )}
                              {distanceInfo && distanceInfo.val !== 9999 && (
                                <div className="pt-1">
                                  {renderApplicantDistanceBadge(distanceInfo)}
                                </div>
                              )}
                              <p className="text-xs text-gray-400 pt-1">{t('yourBusiness.appliedOn', { date: new Date(app.appliedAt).toLocaleDateString() })}</p>
                            </div>

                            <div className="flex items-center gap-2 mt-2 md:mt-0">
                              <button
                                onClick={() => handleChatWithApplicant(app.userId?._id || app.userId)}
                                className="px-3.5 py-2 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 text-xs font-bold transition-all flex items-center gap-1.5 border border-teal-150"
                              >
                                <MessageCircle className="w-4 h-4" /> {t('labour.message') || 'Chat'}
                              </button>
                              {app.status === 'applied' ? (
                                <>
                                  <button
                                    onClick={() => handleApplicantStatus(selectedJob._id, app.userId?._id || app.userId, 'rejected')}
                                    disabled={actionLoading}
                                    className="px-3.5 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold transition-all flex items-center gap-1"
                                  >
                                    <XCircle className="w-4 h-4" /> {t('yourBusiness.reject')}
                                  </button>
                                  <button
                                    onClick={() => handleApplicantStatus(selectedJob._id, app.userId?._id || app.userId, 'hired')}
                                    disabled={actionLoading || selectedJob.filledCount >= selectedJob.totalRequired}
                                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-sm disabled:opacity-50"
                                  >
                                    <Check className="w-4 h-4" /> {t('yourBusiness.hire')}
                                  </button>
                                </>
                              ) : (
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                  app.status === 'hired'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {app.status === 'hired' ? t('yourBusiness.statusHired') : t('yourBusiness.statusRejected')}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: Post Job */}
            {activeTab === 'post-job' && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl mx-auto glass-card bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-left"
              >
                <div className="border-b border-gray-50 pb-4 mb-6">
                  <h3 className="text-xl font-bold text-gray-800">{t('yourBusiness.recruitTitle')}</h3>
                  <p className="text-xs text-gray-400 mt-1">{t('yourBusiness.recruitDesc')}</p>
                </div>

                {jobFormError && (
                  <div className="bg-red-50 text-red-650 border border-red-200 p-3.5 rounded-xl text-sm font-medium mb-4">
                    {jobFormError}
                  </div>
                )}
                {jobFormSuccess && (
                  <div className="bg-emerald-50 text-emerald-700 border border-emerald-250 p-3.5 rounded-xl text-sm font-medium mb-4">
                    {jobFormSuccess}
                  </div>
                )}

                <form onSubmit={handleCreateJob} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">{t('yourBusiness.jobTitle')}</label>
                      <input 
                        type="text" 
                        required
                        value={jobForm.title}
                        onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                        placeholder={t('yourBusiness.jobTitlePlaceholder')}
                        className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">{t('yourBusiness.companyName')}</label>
                      <input 
                        type="text" 
                        required
                        value={jobForm.company}
                        onChange={(e) => setJobForm({ ...jobForm, company: e.target.value })}
                        placeholder={t('yourBusiness.companyPlaceholder')}
                        className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">{t('yourBusiness.jobDesc')}</label>
                    <textarea 
                      required
                      rows="3"
                      value={jobForm.description}
                      onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                      placeholder={t('yourBusiness.jobDescPlaceholder')}
                      className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">{t('yourBusiness.jobCategory')}</label>
                      <select
                        value={jobForm.category}
                        onChange={(e) => setJobForm({ ...jobForm, category: e.target.value })}
                        className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 font-medium"
                      >
                        {JOB_CATEGORIES.map((catKey) => (
                          <option key={catKey} value={catKey}>
                            {t(`yourBusiness.jobCategories.${catKey}`)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">{t('yourBusiness.workMode')}</label>
                      <select
                        value={jobForm.workMode}
                        onChange={(e) => setJobForm({ ...jobForm, workMode: e.target.value })}
                        className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 font-medium"
                      >
                        <option value="onsite">{t('yourBusiness.workModes.onsite')}</option>
                        <option value="remote">{t('yourBusiness.workModes.remote')}</option>
                        <option value="hybrid">{t('yourBusiness.workModes.hybrid')}</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">{t('yourBusiness.openingsCount')}</label>
                      <input 
                        type="number" 
                        required
                        min="1"
                        value={jobForm.totalRequired}
                        onChange={(e) => setJobForm({ ...jobForm, totalRequired: e.target.value })}
                        placeholder={t('yourBusiness.openingsPlaceholder')}
                        className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">{t('yourBusiness.minSalary')}</label>
                      <input 
                        type="number" 
                        required
                        value={jobForm.salaryMin}
                        onChange={(e) => setJobForm({ ...jobForm, salaryMin: e.target.value })}
                        placeholder={t('yourBusiness.minSalaryPlaceholder')}
                        className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">{t('yourBusiness.maxSalary')}</label>
                      <input 
                        type="number" 
                        value={jobForm.salaryMax}
                        onChange={(e) => setJobForm({ ...jobForm, salaryMax: e.target.value })}
                        placeholder={t('yourBusiness.maxSalaryPlaceholder')}
                        className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">{t('yourBusiness.salaryPayout')}</label>
                      <select
                        value={jobForm.salaryType}
                        onChange={(e) => setJobForm({ ...jobForm, salaryType: e.target.value })}
                        className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 font-medium"
                      >
                        <option value="monthly">{t('yourBusiness.salaryTypes.monthly')}</option>
                        <option value="daily">{t('yourBusiness.salaryTypes.daily')}</option>
                        <option value="hourly">{t('yourBusiness.salaryTypes.hourly')}</option>
                        <option value="fixed">{t('yourBusiness.salaryTypes.fixed')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">{t('yourBusiness.workTiming')}</label>
                      <input 
                        type="text" 
                        value={jobForm.workTiming}
                        onChange={(e) => setJobForm({ ...jobForm, workTiming: e.target.value })}
                        placeholder={t('yourBusiness.workTimingPlaceholder')}
                        className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                      />
                    </div>

                    <div className="space-y-1 col-span-2">
                      <label className="text-xs font-bold text-gray-600">{t('yourBusiness.requiredSkills')}</label>
                      <input 
                        type="text" 
                        value={jobForm.skillsRequired}
                        onChange={(e) => setJobForm({ ...jobForm, skillsRequired: e.target.value })}
                        placeholder={t('yourBusiness.skillsPlaceholder')}
                        className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">{t('yourBusiness.contactNumber')}</label>
                      <input 
                        type="tel" 
                        required
                        value={jobForm.contactNumber}
                        onChange={(e) => setJobForm({ ...jobForm, contactNumber: e.target.value })}
                        placeholder={t('yourBusiness.contactPlaceholder')}
                        className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">{t('yourBusiness.contactEmail')}</label>
                      <input 
                        type="email" 
                        required
                        value={jobForm.contactEmail}
                        onChange={(e) => setJobForm({ ...jobForm, contactEmail: e.target.value })}
                        placeholder={t('yourBusiness.emailPlaceholder')}
                        className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 font-semibold"
                      />
                    </div>
                  </div>

                  {/* Job Location Section */}
                  <div className="bg-teal-50/50 border border-teal-100 p-5 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center flex-wrap gap-2 border-b border-teal-100/50 pb-2">
                      <span className="text-sm font-bold text-teal-850 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-teal-650" /> {locale === 'hi' ? 'नौकरी का स्थान (Job Location)' : 'Job Location & Geolocation'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (!navigator.geolocation) return alert(t('location.gpsError'));
                          navigator.geolocation.getCurrentPosition(
                            async (pos) => {
                              const lat = pos.coords.latitude;
                              const lng = pos.coords.longitude;
                              try {
                                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=${locale}`);
                                const data = await response.json();
                                if (data && data.address) {
                                  const addr = data.address;
                                  const villageName = addr.village || addr.suburb || addr.town || addr.city_district || addr.locality || '';
                                  const districtName = addr.district || addr.county || addr.city || '';
                                  const stateName = addr.state || '';
                                  const combined = [villageName, districtName, stateName].filter(Boolean).join(', ');
                                  
                                  setJobForm(prev => ({
                                    ...prev,
                                    latitude: lat,
                                    longitude: lng,
                                    village: combined || prev.village,
                                    district: '',
                                    state: ''
                                  }));
                                  alert(t('location.success'));
                                }
                              } catch (err) {
                                console.error("Reverse geocoding job location failed:", err);
                                setJobForm(prev => ({
                                  ...prev,
                                  latitude: lat,
                                  longitude: lng
                                }));
                                alert(t('location.error'));
                              }
                            },
                            () => alert(t('location.gpsError'))
                          );
                        }}
                        className="bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition active:scale-95 flex items-center gap-1 cursor-pointer border-0"
                      >
                        📍 {t('location.detectBtn')}
                      </button>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-555 uppercase text-left block">{t('location.singleLabel')}</label>
                      <input 
                        type="text" 
                        required
                        value={jobForm.village}
                        onChange={(e) => setJobForm({ ...jobForm, village: e.target.value })}
                        placeholder={t('location.villagePlaceholder') || "e.g. Village, District, State"}
                        className="w-full p-3 rounded-xl bg-white border border-gray-250 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 font-semibold"
                      />
                    </div>

                    {jobForm.latitude && jobForm.longitude && (
                      <div className="text-[11px] font-semibold text-teal-750 bg-teal-100/50 px-2.5 py-1.5 rounded-xl border border-teal-200 w-fit animate-fadeIn flex items-center gap-1">
                        ✓ {t('location.success')}
                      </div>
                    )}
                  </div>



                  <button 
                    type="submit"
                    disabled={jobFormLoading}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md transform active:scale-95 flex items-center justify-center gap-2"
                  >
                    {jobFormLoading ? <Loader className="animate-spin w-5 h-5" /> : <><Plus className="w-5 h-5" /> {t('yourBusiness.postJobBtn')}</>}
                  </button>

                </form>
              </motion.div>
            )}

        </div>
      )}

      {/* Manual Add Employee Modal */}
      <AnimatePresence>
        {addEmpModalOpen && (
          <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative border border-gray-150"
            >
              {/* Modal Header */}
              <div className="p-6 bg-gradient-to-r from-teal-600 to-emerald-600 text-white flex justify-between items-center">
                <div className="text-left">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-teal-200" />
                    {t('yourBusiness.registerEmpTitle')}
                  </h3>
                  <p className="text-xs text-emerald-150">{t('yourBusiness.registerEmpSubtitle')}</p>
                </div>
                <button 
                  onClick={() => setAddEmpModalOpen(false)}
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleAddEmployee} className="p-6 space-y-4 text-left">
                {empModalError && (
                  <div className="bg-red-50 text-red-655 border border-red-200 p-3 rounded-xl text-xs font-semibold">
                    {empModalError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-650">{t('yourBusiness.empName')}</label>
                  <input 
                    type="text" 
                    required
                    value={empForm.name}
                    onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                    placeholder={t('yourBusiness.empNamePlaceholder')}
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-655">{t('yourBusiness.empMobile')}</label>
                  <input 
                    type="text" 
                    maxLength="10"
                    value={empForm.mobile}
                    onChange={(e) => setEmpForm({ ...empForm, mobile: e.target.value })}
                    placeholder={t('yourBusiness.contactPlaceholder')}
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-650">{t('yourBusiness.empRole')}</label>
                  <input 
                    type="text" 
                    required
                    value={empForm.role}
                    onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })}
                    placeholder={t('yourBusiness.empRolePlaceholder')}
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-655">{t('yourBusiness.empSalary')}</label>
                    <input 
                      type="number" 
                      required
                      min="0"
                      value={empForm.salary}
                      onChange={(e) => setEmpForm({ ...empForm, salary: e.target.value })}
                      placeholder={t('yourBusiness.empSalaryPlaceholder')}
                      className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-650">{t('yourBusiness.empSalaryCycle')}</label>
                    <select
                      value={empForm.salaryType}
                      onChange={(e) => setEmpForm({ ...empForm, salaryType: e.target.value })}
                      className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 font-semibold"
                    >
                      <option value="monthly">{t('yourBusiness.salaryTypes.monthly')}</option>
                      <option value="daily">{t('yourBusiness.salaryTypes.daily')}</option>
                      <option value="hourly">{t('yourBusiness.salaryTypes.hourly')}</option>
                      <option value="fixed">{t('yourBusiness.salaryTypes.fixed')}</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={empModalLoading}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md transform active:scale-95 flex items-center justify-center gap-2"
                >
                  {empModalLoading ? <Loader className="animate-spin w-5 h-5" /> : <><Plus className="w-5 h-5" /> {t('yourBusiness.addEmployee')}</>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default YourBusiness;
