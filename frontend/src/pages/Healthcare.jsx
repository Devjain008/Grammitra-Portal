import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useCall } from '../context/CallContext';
import {
  HeartPulse, Thermometer, ShieldAlert, Bot, Send, Activity,
  Stethoscope, AlertTriangle, Loader, Phone, MapPin, Plus, Trash2,
  Bell, BellOff, Calculator, ChevronDown, ChevronUp, X, Clock,
  Droplets, Wind, Eye, Zap, Info, CheckCircle2, Building2, MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CONFIG } from '../utils/constants';

/* ─── Mock Disease Data ─────────────────────────────────────────── */
const mockDiseases = [
  {
    _id: '1',
    diseaseName: { en: 'Heatstroke (Loo)', hi: 'हीटस्ट्रोक (लू)' },
    season: 'summer',
    description: { en: 'A condition caused by your body overheating due to prolonged exposure to high temperatures.', hi: 'उच्च तापमान के लंबे समय तक संपर्क के कारण शरीर का अत्यधिक गर्म होना।' },
    symptoms: { en: ['High body temp (103°F+)', 'Hot, red, dry skin', 'Fast, strong pulse', 'Dizziness or nausea'], hi: ['तेज बुखार (103°F+)', 'गर्म, लाल, सूखी त्वचा', 'तेज नाड़ी', 'चक्कर या मतली'] },
    preventionTips: { en: ['Drink ORS/water frequently', 'Stay indoors 12 PM – 4 PM', 'Wear loose cotton clothes'], hi: ['खूब ORS/पानी पिएं', 'दोपहर 12-4 बजे घर रहें', 'ढीले सूती कपड़े पहनें'] },
    emergencyWarnings: { en: ['Fainting / loss of consciousness', 'Confusion or slurred speech'], hi: ['बेहोशी', 'भ्रम या बोलने में कठिनाई'] },
    icon: '🌡️',
    color: 'from-orange-50 to-red-50',
    badge: 'bg-orange-100 text-orange-700',
  },
  {
    _id: '2',
    diseaseName: { en: 'Dengue Fever', hi: 'डेंगू बुखार' },
    season: 'monsoon',
    description: { en: 'A mosquito-borne viral disease prevalent in tropical areas during monsoon season.', hi: 'मानसून में मच्छरों से फैलने वाला वायरल रोग।' },
    symptoms: { en: ['Sudden high fever', 'Severe joint & muscle pain', 'Pain behind eyes', 'Skin rash'], hi: ['अचानक तेज बुखार', 'जोड़ों में दर्द', 'आंखों के पीछे दर्द', 'त्वचा पर दाने'] },
    preventionTips: { en: ['Use mosquito nets & repellents', 'Clear stagnant water', 'Wear full-sleeved clothes'], hi: ['मच्छरदानी का प्रयोग करें', 'जमा पानी साफ करें', 'पूरी बांह के कपड़े पहनें'] },
    emergencyWarnings: { en: ['Bleeding from gums/nose', 'Severe abdominal pain', 'Persistent vomiting'], hi: ['मसूड़ों से खून', 'पेट में तेज दर्द', 'लगातार उल्टी'] },
    icon: '🦟',
    color: 'from-teal-50 to-cyan-50',
    badge: 'bg-teal-100 text-teal-700',
  },
  {
    _id: '3',
    diseaseName: { en: 'Common Cold & Flu', hi: 'सर्दी और फ्लू' },
    season: 'winter',
    description: { en: 'Viral respiratory illness spread by contact with an infected person or contaminated surfaces.', hi: 'वायरल श्वसन संक्रमण जो छींकने या संपर्क से फैलता है।' },
    symptoms: { en: ['Runny nose', 'Sore throat', 'Cough & sneezing', 'Mild fever & body ache'], hi: ['नाक बहना', 'गले में दर्द', 'खांसी और छींक', 'हल्का बुखार'] },
    preventionTips: { en: ['Wash hands frequently', 'Wear warm clothes', 'Avoid crowded places when sick'], hi: ['बार-बार हाथ धोएं', 'गर्म कपड़े पहनें', 'बीमार होने पर भीड़ से बचें'] },
    emergencyWarnings: { en: ['Difficulty breathing', 'Chest pain', 'High fever above 104°F'], hi: ['सांस लेने में कठिनाई', 'सीने में दर्द', '104°F से अधिक बुखार'] },
    icon: '🤧',
    color: 'from-blue-50 to-indigo-50',
    badge: 'bg-blue-100 text-blue-700',
  },
  {
    _id: '4',
    diseaseName: { en: 'Malaria', hi: 'मलेरिया' },
    season: 'monsoon',
    description: { en: 'A life-threatening disease caused by parasites transmitted through the bites of infected female Anopheles mosquitoes.', hi: 'मादा एनोफेलीज मच्छर के काटने से फैलने वाला जानलेवा रोग।' },
    symptoms: { en: ['Cyclic fever & chills', 'Sweating', 'Headache', 'Vomiting & fatigue'], hi: ['बुखार और कंपकंपी', 'पसीना', 'सिरदर्द', 'उल्टी और थकान'] },
    preventionTips: { en: ['Sleep under insecticide-treated nets', 'Take antimalarial pills if travelling', 'Eliminate standing water'], hi: ['कीटनाशक जाल के नीचे सोएं', 'सफर में मलेरियारोधी दवाएं लें', 'खड़े पानी को हटाएं'] },
    emergencyWarnings: { en: ['Severe shaking/chills', 'High fever with confusion', 'Jaundice or dark urine'], hi: ['तेज कंपकंपी', 'बुखार के साथ भ्रम', 'पीलिया या गहरे रंग का मूत्र'] },
    icon: '🦠',
    color: 'from-purple-50 to-violet-50',
    badge: 'bg-purple-100 text-purple-700',
  },
];

/* ─── First Aid Quick Guides ────────────────────────────────────── */
const firstAidGuides = [
  {
    id: 1,
    title: { en: 'Snake Bite', hi: 'सांप का काटना' },
    icon: '🐍',
    color: 'border-l-green-500',
    steps: {
      en: ['Stay calm and immobilise the bitten limb', 'Keep limb below heart level', 'Remove tight items near the bite', 'Do NOT cut, suck, or apply tourniquet', 'Rush to nearest hospital immediately'],
      hi: ['शांत रहें और काटे गए अंग को स्थिर रखें', 'अंग को हृदय के स्तर से नीचे रखें', 'काटने के स्थान के पास की तंग वस्तुएं हटा दें', 'काटें, चूसें या पट्टी (टूर्निकेट) न लगाएं', 'तुरंत निकटतम अस्पताल ले जाएं'],
    },
  },
  {
    id: 2,
    title: { en: 'Choking', hi: 'दम घुटना / दम अटकना' },
    icon: '😮‍💨',
    color: 'border-l-blue-500',
    steps: {
      en: ['Ask "Are you choking?" — if they cannot speak, act fast', '5 back blows between shoulder blades', '5 abdominal thrusts (Heimlich manoeuvre)', 'Repeat until object expelled or person loses consciousness', 'If unconscious, start CPR and call 108'],
      hi: ['पूछें "क्या आपका दम घुट रहा है?" — यदि वे बोल न सकें, तो तेजी से कार्य करें', 'कंधों के बीच पीठ पर 5 बार थपथपाएं', '5 बार पेट पर दबाव डालें (हेमलिच पैंतरेबाज़ी)', 'वस्तु बाहर निकलने या व्यक्ति के बेहोश होने तक दोहराएं', 'यदि बेहोश हो जाए, तो सीपीआर (CPR) शुरू करें और 108 पर कॉल करें'],
    },
  },
  {
    id: 3,
    title: { en: 'Burns', hi: 'जल जाना' },
    icon: '🔥',
    color: 'border-l-orange-500',
    steps: {
      en: ['Cool burn under cold running water for 20 min', 'Do NOT use ice, butter, or toothpaste', 'Cover loosely with clean cloth or bandage', 'Do not burst any blisters', 'Seek medical help for large or deep burns'],
      hi: ['जले हुए हिस्से को 20 मिनट तक ठंडे बहते पानी के नीचे ठंडा करें', 'बर्फ, मक्खन या टूथपेस्ट का उपयोग न करें', 'साफ कपड़े या पट्टी से ढीला ढकें', 'छाले न फोड़ें', 'बड़े या गहरे घाव के लिए तुरंत चिकित्सा सहायता लें'],
    },
  },
  {
    id: 4,
    title: { en: 'Fracture', hi: 'हड्डी टूटना (फ्रैक्चर)' },
    icon: '🦴',
    color: 'border-l-gray-500',
    steps: {
      en: ['Immobilize the injured area, do not straighten', 'Apply a makeshift splint if available', 'Elevate the limb gently if possible', 'Apply ice pack wrapped in cloth to reduce swelling', 'Transport to hospital carefully'],
      hi: ['चोटिल हिस्से को स्थिर रखें, उसे सीधा करने की कोशिश न करें', 'यदि उपलब्ध हो, तो अस्थायी खपच्ची (स्प्लिंट) लगाएं', 'यदि संभव हो, तो अंग को धीरे से ऊपर उठाएं', 'सूजन कम करने के लिए कपड़े में लिपटा बर्फ लगाएं', 'अस्पताल तक सावधानीपूर्वक पहुंचाएं'],
    },
  },
  {
    id: 5,
    title: { en: 'Heart Attack', hi: 'दिल का दौरा (हार्ट अटैक)' },
    icon: '❤️',
    color: 'border-l-red-500',
    steps: {
      en: ['Call 108 immediately', 'Have the person sit or lie comfortably', 'Loosen tight clothing', 'If trained, begin CPR if person becomes unconscious', 'Give aspirin (325mg) if available and no allergy'],
      hi: ['तुरंत 108 पर कॉल करें', 'व्यक्ति को आराम से बैठने या लेटने दें', 'तंग कपड़े ढीले करें', 'यदि प्रशिक्षित हों, तो व्यक्ति के बेहोश होने पर सीपीआर शुरू करें', 'यदि उपलब्ध हो और एलर्जी न हो, तो एस्पिरिन (325mg) दें'],
    },
  },
  {
    id: 6,
    title: { en: 'Drowning', hi: 'डूबना' },
    icon: '🏊',
    color: 'border-l-cyan-500',
    steps: {
      en: ['Remove from water safely (use rope/branch if needed)', 'Call 108 immediately', 'Check for breathing — if absent, start CPR', 'Do NOT try to drain water from lungs', 'Keep warm until help arrives'],
      hi: ['सुरक्षित रूप से पानी से बाहर निकालें (जरूरत पड़ने पर रस्सी/शाखा का उपयोग करें)', 'तुरंत 108 पर कॉल करें', 'सांस की जांच करें — यदि अनुपस्थित हो, तो सीपीआर शुरू करें', 'फेफड़ों से पानी निकालने की कोशिश न करें', 'सहायता आने तक गर्म रखें'],
    },
  },
];

/* ─── Nearby Health Centers (Mock) ──────────────────────────────── */
const healthCenters = [
  { id: 1, name: { en: 'Primary Health Centre (PHC)', hi: 'प्राथमिक स्वास्थ्य केंद्र (PHC)' }, type: { en: 'Government', hi: 'सरकारी' }, distance: { en: '1.2 km', hi: '1.2 किमी' }, phone: '108', icon: '🏥', timing: { en: '24/7 Emergency', hi: '24/7 आपातकालीन' }, color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
  { id: 2, name: { en: 'Community Health Centre', hi: 'सामुदायिक स्वास्थ्य केंद्र' }, type: { en: 'Government', hi: 'सरकारी' }, distance: { en: '4.5 km', hi: '4.5 किमी' }, phone: '104', icon: '🏨', timing: { en: 'Mon–Sat, 8 AM–6 PM', hi: 'सोम–शनि, सुबह 8–शाम 6 बजे' }, color: 'bg-blue-50 border-blue-200 text-blue-800' },
  { id: 3, name: { en: 'Jan Aushadhi Kendra', hi: 'जन औषधि केंद्र' }, type: { en: 'Pharmacy', hi: 'दवा की दुकान' }, distance: { en: '0.8 km', hi: '0.8 किमी' }, phone: '1800-111-255', icon: '💊', timing: { en: 'Mon–Sun, 7 AM–10 PM', hi: 'सोम–रवि, सुबह 7–रात 10 बजे' }, color: 'bg-purple-50 border-purple-200 text-purple-800' },
  { id: 4, name: { en: 'ASHA / ANM Worker', hi: 'आशा / एएनएम कार्यकर्ता' }, type: { en: 'Village Health', hi: 'ग्राम स्वास्थ्य कार्यकर्ता' }, distance: { en: 'Your Village', hi: 'आपका गाँव' }, phone: '104', icon: '👩‍⚕️', timing: { en: 'Always Available', hi: 'हमेशा उपलब्ध' }, color: 'bg-rose-50 border-rose-200 text-rose-800' },
];

/* ─── Main Component ─────────────────────────────────────────────── */
const Healthcare = () => {
  const { t, locale } = useLanguage();
  const { token, user } = useAuth();
  const { addToCart } = useCart();
  const { startCall } = useCall();
  const navigate = useNavigate();

  const handleChatWithClinic = async (ownerId) => {
    if (!token) return alert(locale === 'hi' ? 'कृपया लॉगइन करें।' : 'Please log in.');
    if (!ownerId) return alert(locale === 'hi' ? 'क्लीनिक स्वामी की जानकारी नहीं मिली।' : 'Clinic owner information is missing.');
    if (ownerId.toString() === user?._id?.toString()) {
      return alert(locale === 'hi' ? 'यह आपका अपना क्लीनिक है!' : 'This is your own clinic!');
    }
    try {
      const res = await axios.post(
        `${CONFIG.API_BASE_URL}/api/chat/room`,
        { userId2: ownerId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate(`/chat?roomId=${res.data._id}`);
    } catch (err) {
      console.error(err);
      alert(locale === 'hi' ? 'क्लीनिक के साथ चैट शुरू करने में विफल।' : 'Failed to start chat with the clinic.');
    }
  };

  const handleCallClinic = (clinic) => {
    if (!token) return alert(locale === 'hi' ? 'कॉल करने के लिए कृपया लॉगइन करें।' : 'Please log in to make a call.');
    const ownerId = clinic.ownerId;
    if (ownerId) {
      if (ownerId.toString() === user?._id?.toString()) {
        return alert(locale === 'hi' ? 'आप खुद को कॉल नहीं कर सकते।' : 'You cannot call yourself.');
      }
      startCall({
        id: ownerId,
        name: clinic.name,
        image: null
      }, 'audio');
    } else {
      const ph = clinic.contactNumber;
      if (ph && ph.trim()) {
        window.location.href = `tel:${ph}`;
      } else {
        alert(locale === 'hi' ? 'क्लीनिक का फ़ोन नंबर उपलब्ध नहीं है।' : 'Clinic contact number is not available.');
      }
    }
  };

  const [diseases, setDiseases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('alerts');
  const [expandedGuide, setExpandedGuide] = useState(null);
  
  const [healthcareProducts, setHealthcareProducts] = useState([]);
  const [openClinicDrawer, setOpenClinicDrawer] = useState(null);
  const handleBuyMedicine = (product) => {
    if (!token) return alert(locale === 'hi' ? 'दवा खरीदने के लिए कृपया लॉगइन करें।' : 'Please log in to order medicine.');
    if (product.businessId?.ownerId === user?._id) {
      return alert(locale === 'hi' ? 'यह आपका खुद का उत्पाद है!' : 'This is your own product!');
    }
    if (product.stock <= 0) return alert(locale === 'hi' ? 'यह दवा आउट ऑफ स्टॉक है!' : 'This medicine is out of stock!');
    addToCart(product, 1);
    alert(locale === 'hi' ? `${product.name} कार्ट में जोड़ा गया!` : `${product.name} added to cart!`);
  };

  const tabs = [
    { key: 'alerts', label: t('healthcare.tabAlerts') || '🩺 Disease Alerts', icon: Activity },
    { key: 'firstaid', label: t('healthcare.tabFirstAid') || '🚑 First Aid', icon: Zap },
    { key: 'centers', label: t('healthcare.tabCenters') || '🏥 Health Centers', icon: Building2 },
    { key: 'tools', label: t('healthcare.tabTools') || '🧮 Health Tools', icon: Calculator },
    { key: 'chat', label: t('healthcare.tabChat') || '🤖 AI Doctor', icon: Stethoscope },
  ];

  const [userCoords, setUserCoords] = useState(null);
  const [registeredClinics, setRegisteredClinics] = useState([]);
  const [clinicsLoading, setClinicsLoading] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        (err) => {
          if (err.code === 1) console.log("Geolocation permission denied.");
          else console.log("Geolocation error:", err.message || err);
          if (user?.location?.coordinates?.length === 2) {
            setUserCoords({ lng: user.location.coordinates[0], lat: user.location.coordinates[1] });
          }
        }
      );
    } else if (user?.location?.coordinates?.length === 2) {
      setUserCoords({ lng: user.location.coordinates[0], lat: user.location.coordinates[1] });
    }
  }, [user]);

  useEffect(() => {
    const fetchRegisteredClinics = async () => {
      try {
        setClinicsLoading(true);
        const res = await axios.get(`${CONFIG.API_BASE_URL}/api/market/businesses`);
        const clinics = res.data.filter(b => b.type === 'clinic' || b.type === 'medical');
        setRegisteredClinics(clinics);
      } catch (err) {
        console.error("Failed to fetch registered clinics:", err);
      } finally {
        setClinicsLoading(false);
      }
    };
    const fetchHealthcareProducts = async () => {
      try {
        const res = await axios.get(`${CONFIG.API_BASE_URL}/api/market/products`);
        setHealthcareProducts(res.data.filter(p => p.category === 'healthcare'));
      } catch (err) {
        console.error("Failed to fetch healthcare products:", err);
      }
    };
    fetchRegisteredClinics();
    fetchHealthcareProducts();
  }, []);

  const calculateClinicDistance = (clinic) => {
    if (!clinic) return { val: 9999, label: t('healthcare.unknown') || 'Unknown', type: 'unknown' };
    if (userCoords && clinic.location?.coordinates?.length === 2) {
      const [bizLng, bizLat] = clinic.location.coordinates;
      const R = 6371;
      const dLat = (bizLat - userCoords.lat) * Math.PI / 180;
      const dLon = (bizLng - userCoords.lng) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(userCoords.lat * Math.PI / 180) * Math.cos(bizLat * Math.PI / 180) * Math.sin(dLon/2)**2;
      const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return { val: d, label: `${d.toFixed(1)} ${locale === 'hi' ? 'किमी' : 'km'}`, type: 'gps' };
    }
    if (user) {
      const uVillage = (user.village || '').trim().toLowerCase();
      const bVillage = (clinic.village || '').trim().toLowerCase();
      const uDistrict = (user.district || '').trim().toLowerCase();
      const bDistrict = (clinic.district || '').trim().toLowerCase();
      const uState = (user.state || '').trim().toLowerCase();
      const bState = (clinic.state || '').trim().toLowerCase();
      if (uVillage && bVillage && uVillage === bVillage) return { val: 0.1, label: t('healthcare.sameVillage') || 'Same Village', type: 'text' };
      if (uDistrict && bDistrict && uDistrict === bDistrict) return { val: 10, label: t('healthcare.sameDistrict') || 'Same District', type: 'text' };
      if (uState && bState && uState === bState) return { val: 100, label: t('healthcare.sameState') || 'Same State', type: 'text' };
    }
    return { val: 9999, label: clinic.village || t('healthcare.nearby') || 'Nearby', type: 'unknown' };
  };

  const renderDistanceBadge = (distanceInfo) => {
    if (!distanceInfo || distanceInfo.val === 9999) return null;
    const val = distanceInfo.val;
    let bgClass = '', textClass = '', borderClass = '', label = distanceInfo.label;
    if (distanceInfo.type === 'gps') {
      if (val < 1) { bgClass = 'bg-emerald-50'; textClass = 'text-emerald-700'; borderClass = 'border-emerald-200'; label = `🟢 ${label} (Very Close)`; }
      else if (val <= 15) { bgClass = 'bg-teal-50'; textClass = 'text-teal-700'; borderClass = 'border-teal-200'; label = `🔵 ${label} (Nearby)`; }
      else { bgClass = 'bg-amber-50'; textClass = 'text-amber-800'; borderClass = 'border-amber-200'; label = `⚠️ ${label} (Far)`; }
    } else if (distanceInfo.type === 'text') {
      if (val === 0.1) { bgClass = 'bg-emerald-50'; textClass = 'text-emerald-700'; borderClass = 'border-emerald-200'; }
      else if (val === 10) { bgClass = 'bg-teal-50'; textClass = 'text-teal-700'; borderClass = 'border-teal-200'; }
      else { bgClass = 'bg-blue-50'; textClass = 'text-blue-700'; borderClass = 'border-blue-200'; }
    }
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${bgClass} ${textClass} ${borderClass} shadow-sm`}>
        {label}
      </span>
    );
  };

  const [bmi, setBmi] = useState({ weight: '', height: '', result: null });
  const [reminders, setReminders] = useState([
    { id: 1, name: 'Paracetamol 500mg', time: '08:00', enabled: true },
    { id: 2, name: 'Vitamin D3', time: '13:00', enabled: true },
  ]);
  const [newReminder, setNewReminder] = useState({ name: '', time: '08:00' });
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hello! I am your AI Health Assistant. Describe your symptoms for basic first-aid advice. I am an AI, not a doctor — always consult a professional for serious issues.' }
  ]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (messages.length === 1 && messages[0].sender === 'ai') {
      const greeting = locale === 'en'
        ? "Hello! I am your AI Health Assistant. Describe your symptoms for basic first-aid advice. I am an AI, not a doctor — always consult a professional for serious issues."
        : "नमस्ते! मैं आपका AI स्वास्थ्य सहायक हूँ। लक्षणों का वर्णन करें। मैं AI हूँ, डॉक्टर नहीं।";
      setMessages([{ sender: 'ai', text: greeting }]);
    }
  }, [locale]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loc = (obj) => (!obj ? '' : obj[locale] || obj['en']);

  useEffect(() => {
    const fetchDiseases = async () => {
      try {
        const res = await axios.get(`${CONFIG.API_BASE_URL}/api/health/diseases`);
        setDiseases(res.data);
      } catch {
        setDiseases(mockDiseases);
      } finally {
        setLoading(false);
      }
    };
    fetchDiseases();
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMessage = chatInput;
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await axios.post(`${CONFIG.API_BASE_URL}/api/health/ask`, { prompt: userMessage, language: locale });
      setMessages(prev => [...prev, { sender: 'ai', text: res.data.reply }]);
    } catch {
      setMessages(prev => [...prev, { sender: 'ai', text: locale === 'hi' ? "सेवा अस्थाई रूप से अनुपलब्ध है। कृपया पुन: प्रयास करें।" : "Service temporarily unavailable. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const calcBMI = () => {
    const w = parseFloat(bmi.weight);
    const h = parseFloat(bmi.height) / 100;
    if (!w || !h || h <= 0) return;
    const val = (w / (h * h)).toFixed(1);
    let category, color;
    if (val < 18.5) { category = t('healthcare.underweight'); color = 'text-blue-600'; }
    else if (val < 25) { category = t('healthcare.normalWeight'); color = 'text-emerald-600'; }
    else if (val < 30) { category = t('healthcare.overweight'); color = 'text-orange-500'; }
    else { category = t('healthcare.obese'); color = 'text-red-600'; }
    setBmi(prev => ({ ...prev, result: { val, category, color } }));
  };

  const addReminder = () => {
    if (!newReminder.name.trim()) return;
    setReminders(prev => [...prev, { id: Date.now(), ...newReminder, enabled: true }]);
    setNewReminder({ name: '', time: '08:00' });
    setShowAddReminder(false);
  };
  const toggleReminder = (id) => setReminders(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  const deleteReminder = (id) => setReminders(prev => prev.filter(r => r.id !== id));

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 right-10 text-9xl">❤️</div>
          <div className="absolute bottom-0 left-20 text-7xl">🩺</div>
        </div>
        <div className="relative">
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3 mb-2">
            <HeartPulse className="w-8 h-8 text-rose-100 animate-pulse" />
            {t('healthcare.title')}
          </h1>
          <p className="text-rose-100 text-lg opacity-90">{t('healthcare.subtitle')}</p>

          {/* Emergency Quick Bar */}
          <div className="mt-5 flex flex-wrap gap-3">
            {[
              { label: locale === 'hi' ? 'एम्बुलेंस' : 'Ambulance', number: '108', emoji: '🚑' },
              { label: locale === 'hi' ? 'स्वास्थ्य हेल्पलाइन' : 'Health Helpline', number: '104', emoji: '📞' },
              { label: locale === 'hi' ? 'पुलिस' : 'Police', number: '100', emoji: '🚔' },
              { label: locale === 'hi' ? 'महिला हेल्पलाइन' : 'Women Helpline', number: '1091', emoji: '👩' },
            ].map(em => (
              <a key={em.number} href={`tel:${em.number}`}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur px-4 py-2 rounded-xl text-sm font-bold transition-all border border-white/20 hover:scale-105">
                <span>{em.emoji}</span>
                <div className="text-left">
                  <div className="text-xs text-white/70 leading-none">{em.label}</div>
                  <div className="text-white font-black text-base leading-tight">{em.number}</div>
                </div>
                <Phone className="w-3.5 h-3.5 ml-1 text-white/70" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex-shrink-0 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              activeTab === tab.key
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-200'
                : 'bg-white text-gray-600 hover:bg-rose-50 hover:text-rose-600 border border-gray-200'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">

        {/* ── TAB: Disease Alerts ── */}
        {activeTab === 'alerts' && (
          <motion.div key="alerts" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Activity className="w-6 h-6 text-rose-500" /> {t('healthcare.seasonalAlerts')}
            </h2>
            {loading ? (
              <div className="flex justify-center p-10"><Loader className="animate-spin text-rose-500 w-10 h-10" /></div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {(diseases.length > 0 ? diseases : mockDiseases).map((disease, idx) => {
                  const d = { icon: '🏥', color: 'from-gray-50 to-slate-50', badge: 'bg-gray-100 text-gray-700', ...disease };
                  return (
                    <motion.div key={disease._id}
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
                      <div className={`bg-gradient-to-r ${d.color} p-5 flex items-start gap-4`}>
                        <span className="text-4xl">{d.icon}</span>
                        <div className="flex-1">
                          <span className={`text-xs font-bold px-3 py-0.5 rounded-full ${d.badge} uppercase tracking-wider mb-1.5 inline-block`}>
                            {t(`healthcare.${disease.season}`) || disease.season}
                          </span>
                          <h3 className="text-xl font-bold text-gray-800">{loc(disease.diseaseName)}</h3>
                          <p className="text-sm text-gray-600 mt-1 leading-relaxed">{loc(disease.description)}</p>
                        </div>
                      </div>
                      <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-700 text-xs uppercase tracking-wider flex items-center gap-1">
                            <Thermometer className="w-3.5 h-3.5 text-orange-500" /> {t('healthcare.symptomsTitle')}
                          </h4>
                          <ul className="space-y-1">
                            {loc(disease.symptoms).map((s, i) => (
                              <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                                <span className="text-orange-400 mt-0.5">•</span>{s}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-700 text-xs uppercase tracking-wider flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5 text-teal-500" /> {t('healthcare.preventionTitle')}
                          </h4>
                          <ul className="space-y-1">
                            {loc(disease.preventionTips).map((tip, i) => (
                              <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                                <CheckCircle2 className="w-3 h-3 text-teal-400 mt-0.5 flex-shrink-0" />{tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-red-50 p-3 rounded-xl border border-red-100 space-y-1.5">
                          <h4 className="font-bold text-red-700 text-xs uppercase tracking-wider flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> {t('healthcare.emergencySigns')}
                          </h4>
                          {loc(disease.emergencyWarnings).map((w, i) => (
                            <p key={i} className="text-xs text-red-600 font-medium flex items-start gap-1">
                              <span className="text-red-400">⚠</span>{w}
                            </p>
                          ))}
                          <a href="tel:108" className="mt-2 flex items-center justify-center gap-1.5 bg-red-500 text-white text-xs font-bold py-1.5 rounded-lg hover:bg-red-600 transition-colors">
                            <Phone className="w-3.5 h-3.5" /> {t('healthcare.callNow').replace('{{phone}}', '108')}
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ── TAB: First Aid ── */}
        {activeTab === 'firstaid' && (
          <motion.div key="firstaid" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Zap className="w-6 h-6 text-orange-500" /> {t('healthcare.firstAidGuide')}
              </h2>
              <span className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 px-3 py-1 rounded-full font-medium">
                ⚠ {t('healthcare.firstAidDisclaimer')}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {firstAidGuides.map((guide, idx) => (
                <motion.div key={guide.id}
                  initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.07 }}
                  className={`bg-white rounded-2xl shadow-sm border border-gray-100 border-l-4 ${guide.color} overflow-hidden`}>
                  <button className="w-full flex items-center justify-between p-5 text-left"
                    onClick={() => setExpandedGuide(expandedGuide === guide.id ? null : guide.id)}>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{guide.icon}</span>
                      <h3 className="font-bold text-gray-800 text-base">{loc(guide.title)}</h3>
                    </div>
                    {expandedGuide === guide.id
                      ? <ChevronUp className="w-5 h-5 text-gray-400" />
                      : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </button>
                  <AnimatePresence>
                    {expandedGuide === guide.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-gray-100">
                        <ol className="px-5 pb-5 pt-3 space-y-2.5">
                          {loc(guide.steps).map((step, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                              <span className="w-6 h-6 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── TAB: Health Centers ── */}
        {activeTab === 'centers' && (
          <motion.div key="centers" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-500" /> {t('healthcare.nearbyCenters') || 'Nearby Health Centers'}
            </h2>

            {/* Registered Clinics */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                🩺 {t('healthcare.registeredClinics') || 'Registered Clinics & Doctors (ग्रामीण क्लीनिक और मेडिकल)'}
              </h3>
              {clinicsLoading ? (
                <div className="flex justify-center p-6"><Loader className="animate-spin text-rose-500 w-8 h-8" /></div>
              ) : registeredClinics.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-gray-500 text-sm">
                  {t('healthcare.noClinics') || 'No registered clinics or medical stores in this village yet. Register one via the Shop/Marketplace tab!'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  {registeredClinics.map((clinic, idx) => {
                    const distanceInfo = calculateClinicDistance(clinic);
                    const clinicProducts = healthcareProducts.filter(p => p.businessId?._id === clinic._id);
                    const isMedical = clinic.type === 'medical';
                    return (
                      <motion.div key={clinic._id}
                        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all p-5 relative overflow-hidden text-left">
                        {clinic.isVerified && (
                          <span className="absolute top-3 right-3 bg-blue-500 text-white px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider flex items-center gap-0.5 shadow-sm z-10">
                            ✓ {t('yourShop.verified') || 'Verified'}
                          </span>
                        )}
                        <div className="flex items-start gap-4">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${isMedical ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-rose-50 text-rose-600 border-rose-100'} border flex-shrink-0`}>
                            {isMedical ? '💊' : '🏥'}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <h3 className="font-bold text-gray-800 truncate pr-16">{clinic.name}</h3>
                            <span className={`text-[10px] font-bold ${isMedical ? 'text-purple-700 bg-purple-50 border-purple-100' : 'text-rose-700 bg-rose-50 border-rose-100'} px-2 py-0.5 rounded-md border w-fit mt-1 inline-block`}>
                              {isMedical ? (locale === 'hi' ? 'दवा की दुकान' : 'Medical Store') : (locale === 'hi' ? 'क्लिनिक / अस्पताल' : 'Clinic / Hospital')}
                            </span>
                            {clinic.description && (
                              <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">{clinic.description}</p>
                            )}
                            <div className="mt-3 space-y-1.5">
                              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-rose-400" /> {clinic.address || clinic.village || 'Nearby'}
                              </p>
                              {clinic.timing && (
                                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-blue-400" /> {t('healthcare.hours') || 'Hours: '}{clinic.timing}
                                </p>
                              )}
                              {distanceInfo && distanceInfo.val !== 9999 && (
                                <div className="mt-2">{renderDistanceBadge(distanceInfo)}</div>
                              )}
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                              <button type="button" onClick={() => handleCallClinic(clinic)}
                                className="inline-flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm border-0 cursor-pointer">
                                <Phone className="w-3.5 h-3.5" /> {locale === 'hi' ? 'कॉल करें' : 'Call'}
                              </button>
                              {clinic.ownerId && clinic.ownerId !== user?._id && (
                                <button type="button" onClick={() => handleChatWithClinic(clinic.ownerId)}
                                  className="inline-flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm border-0 cursor-pointer">
                                  <MessageSquare className="w-3.5 h-3.5" /> {locale === 'hi' ? 'चैट करें' : 'Chat'}
                                </button>
                              )}
                              {clinicProducts.length > 0 && (
                                <button type="button" onClick={() => setOpenClinicDrawer(openClinicDrawer === clinic._id ? null : clinic._id)}
                                  className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm border-0 cursor-pointer">
                                  💊 {openClinicDrawer === clinic._id 
                                    ? (locale === 'hi' ? 'दवाइयाँ बंद करें' : 'Hide Medicines') 
                                    : (locale === 'hi' ? `दवाइयाँ देखें (${clinicProducts.length})` : `Medicines (${clinicProducts.length})`)}
                                </button>
                              )}
                            </div>

                            {/* Collapsible Medicines List */}
                            {openClinicDrawer === clinic._id && clinicProducts.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-gray-150 space-y-3">
                                <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1">
                                  💊 {locale === 'hi' ? 'दवाइयों और सेवाओं की सूची:' : 'Available Medicines & Services:'}
                                </h4>
                                <div className="grid grid-cols-1 gap-2.5">
                                  {clinicProducts.map(prod => (
                                    <div key={prod._id} className="flex justify-between items-center bg-gray-50 border border-gray-150 rounded-xl p-3 hover:shadow-xs transition-shadow">
                                      <div className="text-left min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <h5 className="font-bold text-gray-800 text-xs">{prod.name}</h5>
                                          {prod.stock <= 0 ? (
                                            <span className="bg-red-50 text-red-700 text-[8px] font-bold px-1.5 py-0.5 rounded-md border border-red-100">
                                              {locale === 'hi' ? 'स्टॉक खत्म' : 'Out of Stock'}
                                            </span>
                                          ) : prod.stock <= 5 ? (
                                            <span className="bg-amber-50 text-amber-800 text-[8px] font-bold px-1.5 py-0.5 rounded-md border border-amber-100">
                                              {locale === 'hi' ? `कम स्टॉक (${prod.stock})` : `Low Stock (${prod.stock})`}
                                            </span>
                                          ) : null}
                                        </div>
                                        {prod.description && <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">{prod.description}</p>}
                                      </div>
                                      <div className="flex items-center gap-3 shrink-0 ml-4">
                                        <div className="text-right">
                                          <span className="text-xs font-black text-rose-600 block">
                                            ₹{prod.discount > 0 ? Math.round(prod.price * (1 - prod.discount / 100)) : prod.price}
                                            <span className="text-[9px] text-gray-400 font-normal">/{prod.unit || 'Pc'}</span>
                                          </span>
                                          {prod.discount > 0 && (
                                            <span className="text-[10px] text-gray-300 line-through">₹{prod.price}</span>
                                          )}
                                        </div>
                                        <button type="button" onClick={() => handleBuyMedicine(prod)}
                                          disabled={prod.stock <= 0}
                                          className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors border-0 cursor-pointer flex items-center gap-1 shadow-sm">
                                          🛒 {locale === 'hi' ? 'ऑर्डर' : 'Order'}
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Government Health Centers */}
            <div className="border-t border-gray-100 pt-6 space-y-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                🏛️ {t('healthcare.publicServices') || 'Public Health Services & Workers'}
              </h3>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                  {t('healthcare.publicDisclaimer') || 'These are common government health facilities available in most rural areas. Contact your local ASHA worker for exact location details.'}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {healthCenters.map((center, idx) => (
                  <motion.div key={center.id}
                    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow p-5">
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${center.color.split(' ')[0]} flex-shrink-0`}>
                        {center.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-800">{loc(center.name)}</h3>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${center.color} mt-1 inline-block`}>
                          {loc(center.type)}
                        </span>
                        <div className="mt-3 space-y-1.5">
                          <p className="text-xs text-gray-500 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-rose-400" />{loc(center.distance)}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-blue-400" />{loc(center.timing)}
                          </p>
                        </div>
                        <a href={`tel:${center.phone}`}
                          className="mt-3 inline-flex items-center gap-2 bg-rose-500 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-rose-600 transition-colors">
                          <Phone className="w-3.5 h-3.5" /> {t('healthcare.call') || 'Call '}{center.phone}
                        </a>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Health Tips Banner */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 rounded-2xl text-white">
              <h3 className="font-bold text-lg mb-3">{t('healthcare.dailyTips') || '💡 Daily Health Tips'}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: <Droplets className="w-5 h-5" />, tip: t('healthcare.tips.water') || 'Drink 8 glasses of water daily' },
                  { icon: <Wind className="w-5 h-5" />, tip: t('healthcare.tips.exercise') || 'Exercise 30 min every day' },
                  { icon: <Eye className="w-5 h-5" />, tip: t('healthcare.tips.sleep') || 'Sleep 7–8 hours per night' },
                  { icon: <CheckCircle2 className="w-5 h-5" />, tip: t('healthcare.tips.washHands') || 'Wash hands before meals' },
                ].map((tip, i) => (
                  <div key={i} className="bg-white/20 rounded-xl p-3 flex items-start gap-2 text-xs font-medium">
                    {tip.icon}{tip.tip}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── TAB: Health Tools ── */}
        {activeTab === 'tools' && (
          <motion.div key="tools" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Calculator className="w-6 h-6 text-purple-500" /> {t('healthcare.healthTools') || 'Health Tools'}
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* BMI Calculator */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 border-t-4 border-purple-500">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                  <Calculator className="w-5 h-5 text-purple-500" /> {t('healthcare.bmiTitle') || 'BMI Calculator'}
                </h3>
                <p className="text-sm text-gray-500">{t('healthcare.bmiDesc') || 'Body Mass Index helps evaluate if your weight is healthy for your height.'}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">{t('healthcare.weight') || 'Weight (kg)'}</label>
                    <input type="number" placeholder={t('healthcare.weightPlaceholder') || 'e.g. 65'} value={bmi.weight}
                      onChange={e => setBmi(p => ({ ...p, weight: e.target.value, result: null }))}
                      className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">{t('healthcare.height') || 'Height (cm)'}</label>
                    <input type="number" placeholder={t('healthcare.heightPlaceholder') || 'e.g. 170'} value={bmi.height}
                      onChange={e => setBmi(p => ({ ...p, height: e.target.value, result: null }))}
                      className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                  </div>
                </div>
                <button onClick={calcBMI} className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors">
                  {t('healthcare.calcBmi') || 'Calculate BMI'}
                </button>
                {bmi.result && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="bg-purple-50 border border-purple-200 p-4 rounded-2xl text-center">
                    <p className="text-5xl font-black text-purple-700">{bmi.result.val}</p>
                    <p className={`text-lg font-bold mt-1 ${bmi.result.color}`}>{bmi.result.category}</p>
                    <div className="mt-3 grid grid-cols-4 gap-1 text-[10px] font-semibold">
                      {[
                        ['< 18.5', t('healthcare.underweightSimple') || 'Underweight', 'bg-blue-200'],
                        ['18.5–24.9', t('healthcare.normal') || 'Normal', 'bg-emerald-200'],
                        ['25–29.9', t('healthcare.overweightSimple') || 'Overweight', 'bg-orange-200'],
                        ['≥ 30', t('healthcare.obeseSimple') || 'Obese', 'bg-red-200'],
                      ].map(([range, label, cls]) => (
                        <div key={label} className={`${cls} rounded-lg p-1.5 text-center`}>
                          <div className="font-black text-gray-700">{range}</div>
                          <div className="text-gray-600">{label}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Medicine Reminder */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 border-t-4 border-rose-500">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                    <Bell className="w-5 h-5 text-rose-500" /> {t('healthcare.medReminders') || 'Medicine Reminders'}
                  </h3>
                  <button onClick={() => setShowAddReminder(p => !p)}
                    className="flex items-center gap-1.5 bg-rose-500 text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-rose-600 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> {t('healthcare.add') || 'Add'}
                  </button>
                </div>
                <p className="text-sm text-gray-500">{t('healthcare.medRemindersDesc') || 'Track your daily medications. (Note: Actual device alerts require browser notification permission.)'}</p>

                <AnimatePresence>
                  {showAddReminder && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl space-y-3">
                        <input type="text" placeholder={t('healthcare.medNamePlaceholder') || 'Medicine name'} value={newReminder.name}
                          onChange={e => setNewReminder(p => ({ ...p, name: e.target.value }))}
                          className="w-full p-2.5 rounded-xl bg-white border border-rose-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400" />
                        <input type="time" value={newReminder.time}
                          onChange={e => setNewReminder(p => ({ ...p, time: e.target.value }))}
                          className="w-full p-2.5 rounded-xl bg-white border border-rose-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400" />
                        <button onClick={addReminder}
                          className="w-full bg-rose-500 text-white py-2 rounded-xl text-sm font-bold hover:bg-rose-600 transition-colors">
                          {t('healthcare.saveReminder') || 'Save Reminder'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {reminders.length === 0 && (
                    <p className="text-center text-gray-400 py-4 text-sm">{t('healthcare.noReminders') || 'No reminders added yet.'}</p>
                  )}
                  {reminders.map(rem => (
                    <motion.div key={rem.id} layout
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${rem.enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${rem.enabled ? 'bg-rose-100 text-rose-500' : 'bg-gray-100 text-gray-400'}`}>
                        {rem.enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-800 truncate">{rem.name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" />{rem.time}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => toggleReminder(rem.id)}
                          className={`p-1.5 rounded-lg transition-colors text-xs font-bold ${rem.enabled ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                          {rem.enabled ? (locale === 'hi' ? 'चालू' : 'ON') : (locale === 'hi' ? 'बंद' : 'OFF')}
                        </button>
                        <button onClick={() => deleteReminder(rem.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── TAB: AI Health Chat ── */}
        {activeTab === 'chat' && (
          <motion.div key="chat" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col" style={{ height: '600px' }}>
              {/* Header */}
              <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                  <Stethoscope className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{t('healthcare.askAI')}</h3>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" />
                    {locale === 'hi' ? 'ऑनलाइन' : 'Online'}
                  </p>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="bg-yellow-50 p-3 border-b border-yellow-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-700 font-medium">{t('healthcare.disclaimer')}</p>
              </div>

              {/* Quick prompts */}
              <div className="px-4 pt-3 flex flex-wrap gap-2">
                {[
                  t('healthcare.chatPrompts.fever') || 'I have fever and headache',
                  t('healthcare.chatPrompts.diarrhea') || 'My child has diarrhea',
                  t('healthcare.chatPrompts.bee') || 'I was stung by a bee',
                  t('healthcare.chatPrompts.chest') || 'Chest pain tips',
                ].map(prompt => (
                  <button key={prompt} onClick={() => setChatInput(prompt)}
                    className="text-xs bg-rose-50 text-rose-600 border border-rose-200 px-3 py-1.5 rounded-xl hover:bg-rose-100 transition-colors font-medium">
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.sender === 'ai' && (
                      <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center mr-2 flex-shrink-0 self-end">
                        <Bot className="w-4 h-4 text-rose-500" />
                      </div>
                    )}
                    <div className={`max-w-[80%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-rose-500 text-white rounded-br-none'
                        : 'bg-white border border-rose-100 text-gray-800 rounded-bl-none shadow-sm whitespace-pre-wrap'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-rose-100 p-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-4 bg-white rounded-b-2xl border-t border-gray-100 flex gap-2">
                <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                  placeholder={t('healthcare.typeMessage')} disabled={chatLoading}
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50 text-sm" />
                <button type="submit" disabled={chatLoading || !chatInput.trim()}
                  className="bg-rose-500 text-white px-4 py-2.5 rounded-xl hover:bg-rose-600 transition-colors disabled:opacity-50 flex items-center gap-2">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Healthcare;