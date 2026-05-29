import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Volume2, VolumeX, X, Send, RefreshCw, 
  Play, Pause, HelpCircle, Navigation, ChevronRight, 
  Bot, Sparkles, School, Building, Phone, MapPin, 
  Activity, Trash2, GraduationCap, CheckCircle,
  ChevronDown, ChevronUp, Wrench, CloudSun, Droplets,
  Wind, ThermometerSun, AlertTriangle
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { CONFIG } from '../utils/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

const VoiceAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [typedInput, setTypedInput] = useState('');
  
  const { locale, t } = useLanguage();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const isSpeakingRef = useRef(false);

  const isEn = locale === 'en';

  const [showSuggestions, setShowSuggestions] = useState(true);

  // Available Suggestion Chips based on active page route (Changes dynamically)
  const getDynamicSuggestions = () => {
    const path = location.pathname;
    
    if (path.includes('/farmer-ai')) {
      return isEn ? [
        { text: "🌾 How to increase crop yield?", icon: <Sparkles className="w-3.5 h-3.5" /> },
        { text: "🐛 Natural pest control tips", icon: <Activity className="w-3.5 h-3.5" /> },
        { text: "🌤️ What's the weather in Pune?", icon: <CloudSun className="w-3.5 h-3.5" /> },
        { text: "📋 Soil testing in my area", icon: <GraduationCap className="w-3.5 h-3.5" /> }
      ] : [
        { text: "🌾 गेहूं की पैदावार कैसे बढ़ाएं?", icon: <Sparkles className="w-3.5 h-3.5" /> },
        { text: "🐛 प्राकृतिक कीटनाशक के उपाय", icon: <Activity className="w-3.5 h-3.5" /> },
        { text: "🌤️ पुणे का मौसम कैसा है?", icon: <CloudSun className="w-3.5 h-3.5" /> },
        { text: "📋 मिट्टी की जांच कैसे कराएं?", icon: <GraduationCap className="w-3.5 h-3.5" /> }
      ];
    }
    
    if (path.includes('/healthcare')) {
      return isEn ? [
        { text: "🩺 What are dengue symptoms?", icon: <Activity className="w-3.5 h-3.5" /> },
        { text: "🏥 Hospitals near me", icon: <Building className="w-3.5 h-3.5" /> },
        { text: "💧 ORS solution preparation", icon: <Sparkles className="w-3.5 h-3.5" /> },
        { text: "🦟 Prevention of malaria", icon: <Navigation className="w-3.5 h-3.5" /> }
      ] : [
        { text: "🩺 डेंगू बुखार के लक्षण क्या हैं?", icon: <Activity className="w-3.5 h-3.5" /> },
        { text: "🏥 अस्पतालों की जानकारी दें", icon: <Building className="w-3.5 h-3.5" /> },
        { text: "💧 ओआरएस घोल कैसे तैयार करें?", icon: <Sparkles className="w-3.5 h-3.5" /> },
        { text: "🦟 मलेरिया से बचाव के उपाय", icon: <Navigation className="w-3.5 h-3.5" /> }
      ];
    }
    
    if (path.includes('/education') || path.includes('/teachers')) {
      return isEn ? [
        { text: "💻 How to learn coding free?", icon: <GraduationCap className="w-3.5 h-3.5" /> },
        { text: "🏫 Schools in my village", icon: <School className="w-3.5 h-3.5" /> },
        { text: "📚 Weekly study plan for SSC", icon: <Sparkles className="w-3.5 h-3.5" /> },
        { text: "👩‍🏫 Find local intermediate colleges", icon: <Building className="w-3.5 h-3.5" /> }
      ] : [
        { text: "💻 फ्री में कोडिंग कैसे सीखें?", icon: <GraduationCap className="w-3.5 h-3.5" /> },
        { text: "🏫 मेरे गाँव के स्कूल दिखाओ", icon: <School className="w-3.5 h-3.5" /> },
        { text: "📚 एसएससी की तैयारी के लिए टाइम टेबल", icon: <Sparkles className="w-3.5 h-3.5" /> },
        { text: "👩‍🏫 स्थानीय इंटरमीडिएट कॉलेज खोजें", icon: <Building className="w-3.5 h-3.5" /> }
      ];
    }
    
    if (path.includes('/marketplace') || path.includes('/your-shop') || path.includes('/your-business')) {
      return isEn ? [
        { text: "🛒 Open Marketplace Mandi", icon: <Navigation className="w-3.5 h-3.5" /> },
        { text: "💼 Grow my local business", icon: <Sparkles className="w-3.5 h-3.5" /> },
        { text: "📈 View hot selling products", icon: <Activity className="w-3.5 h-3.5" /> },
        { text: "🛍️ How to list my shop?", icon: <Building className="w-3.5 h-3.5" /> }
      ] : [
        { text: "🛒 मंडी बाजार खोलें", icon: <Navigation className="w-3.5 h-3.5" /> },
        { text: "💼 अपने व्यवसाय को कैसे बढ़ाएं?", icon: <Sparkles className="w-3.5 h-3.5" /> },
        { text: "📈 सबसे ज्यादा बिकने वाले उत्पाद", icon: <Activity className="w-3.5 h-3.5" /> },
        { text: "🛍️ अपनी दुकान का पंजीकरण कैसे करें?", icon: <Building className="w-3.5 h-3.5" /> }
      ];
    }

    if (path.includes('/labour') || path.includes('/employment') || path.includes('/your-work')) {
      return isEn ? [
        { text: "📋 Find a local job", icon: <Building className="w-3.5 h-3.5" /> },
        { text: "👷 Hire an electrician", icon: <Wrench className="w-3.5 h-3.5" /> },
        { text: "🛠️ Available labour vacancies", icon: <Sparkles className="w-3.5 h-3.5" /> },
        { text: "💼 Register as driver", icon: <Navigation className="w-3.5 h-3.5" /> }
      ] : [
        { text: "📋 कोई स्थानीय काम ढूंढें", icon: <Building className="w-3.5 h-3.5" /> },
        { text: "👷 बिजली मिस्त्री बुलाएं", icon: <Wrench className="w-3.5 h-3.5" /> },
        { text: "🛠️ मनरेगा/श्रमिक काम की सूची", icon: <Sparkles className="w-3.5 h-3.5" /> },
        { text: "💼 ड्राइवर के रूप में पंजीकरण", icon: <Navigation className="w-3.5 h-3.5" /> }
      ];
    }
    
    // Default
    return isEn ? [
      { text: "🌾 How to increase crop yield?", icon: <Sparkles className="w-3.5 h-3.5" /> },
      // { text: "🌤️ What's the weather in Pune?", icon: <CloudSun className="w-3.5 h-3.5" /> },
      { text: "🏫 Schools in my village", icon: <School className="w-3.5 h-3.5" /> },
      { text: "🏥 Hospitals near me", icon: <Building className="w-3.5 h-3.5" /> },
      { text: "🛒 Open Marketplace Mandi", icon: <Navigation className="w-3.5 h-3.5" /> },
      { text: "💻 How to learn coding free?", icon: <GraduationCap className="w-3.5 h-3.5" /> }
    ] : [
      { text: "🌾 गेहूं की पैदावार कैसे बढ़ाएं?", icon: <Sparkles className="w-3.5 h-3.5" /> },
      // { text: "🌤️ पुणे का मौसम कैसा है?", icon: <CloudSun className="w-3.5 h-3.5" /> },
      { text: "🏫 मेरे गाँव के स्कूल दिखाओ", icon: <School className="w-3.5 h-3.5" /> },
      { text: "🏥 अस्पतालों की जानकारी दें", icon: <Building className="w-3.5 h-3.5" /> },
      { text: "🛒 मंडी बाजार खोलें", icon: <Navigation className="w-3.5 h-3.5" /> },
      { text: "💻 फ्री में कोडिंग कैसे सीखें?", icon: <GraduationCap className="w-3.5 h-3.5" /> }
    ];
  };

  const suggestions = getDynamicSuggestions();

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = locale === 'hi' ? 'hi-IN' : 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setTranscription(isEn ? 'Listening...' : 'सुन रहा हूँ...');
        stopSpeaking(); // Stop any active AI reading when user starts speaking
      };

      rec.onresult = (event) => {
        const resultText = event.results[0][0].transcript;
        setTranscription(resultText);
        handleIncomingQuery(resultText);
      };

      rec.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        setTranscription(
          isEn 
            ? "Sorry, I couldn't hear that. Please try again." 
            : "क्षमा करें, मैं सुन नहीं सका। कृपया फिर से प्रयास करें।"
        );
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [locale, isEn]);

  // Scroll to bottom of chat when history changes
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isLoading]);

  // Clean up speech synthesis on component unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  // Speak response out loud using Web Speech Synthesis with support for long text (prevents Chrome cutoff bug)
  const speakText = (text) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    
    stopSpeaking(); // stop any current speech
    
    // Clean up text format for speech synthesis (remove markdown asterisk, hashes, etc.)
    const cleanText = text
      .replace(/[*#`_\-]/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    // Split text into smaller chunks (by punctuation) to prevent Chrome's 15-second cutoff bug
    const sentences = cleanText.match(/[^.!?\u0964\u0965]+[.!?\u0964\u0965]+|[^.!?\u0964\u0965]+/g) || [cleanText];
    
    sentences.forEach((sentence, idx) => {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) return;
      
      const utterance = new SpeechSynthesisUtterance(trimmedSentence);
      utterance.lang = locale === 'hi' ? 'hi-IN' : 'en-US';
      
      // Find optimal local voice if possible
      const voices = window.speechSynthesis.getVoices();
      const optimalVoice = voices.find(v => 
        v.lang.startsWith(locale === 'hi' ? 'hi' : 'en') && 
        (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Microsoft'))
      );
      if (optimalVoice) {
        utterance.voice = optimalVoice;
      }
      
      utterance.rate = locale === 'hi' ? 1.0 : 1.05;
      utterance.pitch = 1.0;
      
      if (idx === 0) {
        utterance.onstart = () => {
          isSpeakingRef.current = true;
        };
      }
      
      if (idx === sentences.length - 1) {
        utterance.onend = () => {
          isSpeakingRef.current = false;
        };
        utterance.onerror = () => {
          isSpeakingRef.current = false;
        };
      }
      
      window.speechSynthesis.speak(utterance);
    });
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      isSpeakingRef.current = false;
    }
  };

  // Main input handler
  const handleIncomingQuery = async (queryText) => {
    if (!queryText || !queryText.trim()) return;
    
    // Add user query to chat history
    const userMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: queryText,
      timestamp: new Date()
    };
    
    setChatHistory(prev => [...prev, userMessage]);
    setIsLoading(true);
    setTranscription('');

    const cleanQuery = queryText.toLowerCase().trim();

    // 1. Navigation Parser
    const navMatch = parseNavigationCommand(cleanQuery);
    if (navMatch) {
      setIsLoading(false);
      const replyText = isEn 
        ? `Opening the ${navMatch.name} page for you.`
        : `आपके लिए ${navMatch.nameHindi} पेज खोल रहा हूँ।`;
      
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: replyText,
        type: 'navigation',
        route: navMatch.route,
        timestamp: new Date()
      };
      
      setChatHistory(prev => [...prev, aiResponse]);
      speakText(replyText);
      
      // Navigate after a small delay to let user hear
      setTimeout(() => {
        navigate(navMatch.route);
        // Automatically minimize helper on nav to clear viewport space
        setIsOpen(false);
      }, 1500);
      return;
    }

    // 2. Facilities Infrastructure Fetcher
    const facilityType = parseFacilityCommand(cleanQuery);
    if (facilityType) {
      try {
        const res = await axios.get(`${CONFIG.API_BASE_URL}/api/auth/facilities?type=${facilityType}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        const list = res.data || [];
        setIsLoading(false);

        let spokenSummary = '';
        let replyMarkdown = '';

        if (list.length === 0) {
          if (facilityType === 'school') {
            replyMarkdown = isEn
              ? `I couldn't find registered **schools** in your village directory yet, but the nearest public options are:\n1. **Government Primary School** (1.5 km away)\n2. **Village Higher Secondary School** (3 km away)\n\nYou can also explore free online courses in our **Education Center**!`
              : `मुझे निर्देशिका में आपके गाँव में पंजीकृत **स्कूल** नहीं मिले, लेकिन नजदीकी स्कूल हैं:\n1. **सरकारी प्राथमिक विद्यालय** (1.5 किमी दूर)\n2. **ग्राम उच्च माध्यमिक विद्यालय** (3 किमी दूर)\n\nआप हमारे **शिक्षा विभाग** पेज पर मुफ्त ऑनलाइन कोर्सेज भी देख सकते हैं!`;
            spokenSummary = isEn
              ? "I couldn't find registered schools in your village, but the nearest public primary school is 1.5 km away, and the higher secondary school is 3 km away. You can also explore free online courses in our Education Center!"
              : "मुझे निर्देशिका में आपके गाँव में पंजीकृत स्कूल नहीं मिले, लेकिन नजदीकी प्राथमिक विद्यालय 1.5 किमी दूर है और उच्च माध्यमिक विद्यालय 3 किमी दूर है। आप हमारे शिक्षा विभाग पेज पर मुफ्त ऑनलाइन कोर्सेज भी देख सकते हैं!";
          } else if (facilityType === 'hospital') {
            replyMarkdown = isEn
              ? `I couldn't find registered **hospitals** in your village directory yet, but the nearest healthcare options are:\n1. **Community Health Center (CHC)** (4.5 km away)\n2. **Government District Hospital** (12 km away)\n\n*Emergency*: Please call **108** for ambulance services, or check our **Healthcare** page for consultation!`
              : `मुझे निर्देशिका में आपके गाँव में पंजीकृत **अस्पताल** नहीं मिले, लेकिन नजदीकी स्वास्थ्य विकल्प हैं:\n1. **सामुदायिक स्वास्थ्य केंद्र (CHC)** (4.5 किमी दूर)\n2. **राजकीय जिला अस्पताल** (12 किमी दूर)\n\n*आपातकालीन*: एम्बुलेंस सेवाओं के लिए तुरंत **108** पर कॉल करें, या परामर्श के लिए हमारे **स्वास्थ्य केंद्र** पेज को देखें!`;
            spokenSummary = isEn
              ? "I couldn't find registered hospitals in your village, but the nearest Community Health Center is 4.5 km away. For emergencies, please call 108 immediately or check our Healthcare page for consultation."
              : "मुझे निर्देशिका में आपके गाँव में पंजीकृत अस्पताल नहीं मिले, लेकिन नजदीकी सामुदायिक स्वास्थ्य केंद्र 4.5 किमी दूर है। आपातकालीन स्थिति के लिए तुरंत 108 पर कॉल करें या हमारे स्वास्थ्य केंद्र पेज को देखें।";
          } else {
            replyMarkdown = isEn
              ? `I couldn't find registered **colleges** in your village directory yet, but the nearest option is:\n1. **Government Degree College** (6.5 km away in the block town)\n\nPlease check our **Education Center** page for information on colleges and admissions!`
              : `मुझे निर्देशिका में आपके गाँव में पंजीकृत **कॉलेज** नहीं मिले, लेकिन नजदीकी विकल्प हैं:\n1. **राजकीय डिग्री कॉलेज** (ब्लॉक शहर में 6.5 किमी दूर)\n\nकॉलेज और प्रवेश की जानकारी के लिए कृपया हमारे **शिक्षा विभाग** पेज को देखें!`;
            spokenSummary = isEn
              ? "I couldn't find registered colleges in your village directory, but the Government Degree College is 6.5 km away in the block town. Please check our Education Center page for college and admission information."
              : "मुझे निर्देशिका में आपके गाँव में पंजीकृत कॉलेज नहीं मिले, लेकिन राजकीय डिग्री कॉलेज ब्लॉक शहर में 6.5 किमी दूर है। कॉलेज और प्रवेश की जानकारी के लिए कृपया हमारे शिक्षा विभाग पेज को देखें।";
          }
        } else {
          replyMarkdown = isEn
            ? `Here are the registered **${facilityType}s** in your village:\n`
            : `यहाँ आपके गाँव में पंजीकृत **${facilityType === 'school' ? 'स्कूलों' : facilityType === 'hospital' ? 'अस्पतालों' : 'कॉलेजों'}** की सूची है:\n`;
          
          spokenSummary = isEn
            ? `I found ${list.length} ${facilityType}s in your village. `
            : `मुझे आपके गाँव में ${list.length} ${facilityType === 'school' ? 'स्कूल' : facilityType === 'hospital' ? 'अस्पताल' : 'कॉलेज'} मिले हैं। `;

          list.forEach((item, idx) => {
            const nameStr = isEn ? item.name : (item.nameHi || item.name);
            const typeStr = isEn ? item.type : (item.typeHi || item.type);
            spokenSummary += `${idx + 1}. ${nameStr} (${typeStr}). `;
          });
        }

        const aiResponse = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: replyMarkdown,
          type: 'facilities',
          facilityType,
          facilities: list,
          timestamp: new Date()
        };

        setChatHistory(prev => [...prev, aiResponse]);
        speakText(spokenSummary);
      } catch (err) {
        console.error("Facilities fetch failed inside VoiceAssistant:", err);
        setIsLoading(false);
        const errText = isEn 
          ? "Failed to fetch local village facilities. Please check your network." 
          : "गाँव की स्थानीय सुविधाओं की जानकारी प्राप्त करने में विफल। कृपया नेटवर्क की जाँच करें।";
        setChatHistory(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: errText,
          timestamp: new Date()
        }]);
        speakText(errText);
      }
      return;
    }

    // 2.5 Weather Command Parser
    const weatherLocation = parseWeatherCommand(cleanQuery);
    if (weatherLocation !== null) {
      try {
        const targetLoc = weatherLocation || user?.village || user?.district || user?.state || 'Delhi';
        const res = await axios.get(`${CONFIG.API_BASE_URL}/api/farmer/weather?village=${encodeURIComponent(targetLoc)}`);
        
        setIsLoading(false);
        const data = res.data;
        
        const spokenText = isEn 
          ? `The current weather in ${data.location || targetLoc} is ${data.temperature} degrees Celsius with ${data.condition}. The farming alert is: ${data.farmingAlert}`
          : `${data.location || targetLoc} में वर्तमान तापमान ${data.temperature} डिग्री सेल्सियस है और मौसम ${data.condition} है। कृषि चेतावनी है: ${data.farmingAlert}`;
        
        const aiResponse = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: isEn 
            ? `Here is the current weather details for **${data.location || targetLoc}**:` 
            : `यहाँ **${data.location || targetLoc}** के लिए वर्तमान मौसम की जानकारी है:`,
          type: 'weather',
          weather: data,
          timestamp: new Date()
        };
        
        setChatHistory(prev => [...prev, aiResponse]);
        speakText(spokenText);
      } catch (err) {
        console.error("Weather query failed inside VoiceAssistant:", err);
        setIsLoading(false);
        const errText = isEn 
          ? "Failed to fetch weather data. Please check the location name or network connectivity." 
          : "मौसम की जानकारी प्राप्त करने में विफल। कृपया स्थान का नाम या नेटवर्क कनेक्शन जांचें।";
        setChatHistory(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: errText,
          timestamp: new Date()
        }]);
        speakText(errText);
      }
      return;
    }

    // 3. General AI Advice Query (Gemini / Advice System)
    try {
      const res = await axios.post(`${CONFIG.API_BASE_URL}/api/ai/ask`, {
        prompt: queryText,
        language: locale === 'hi' ? 'hi' : 'en'
      });

      setIsLoading(false);
      const reply = res.data.reply;
      
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: reply,
        type: 'general',
        timestamp: new Date()
      };

      setChatHistory(prev => [...prev, aiResponse]);
      speakText(reply);
    } catch (err) {
      console.error("AI service fetch failed:", err);
      setIsLoading(false);
      const errText = isEn 
        ? "I am having trouble connecting to my brain right now. Please try again soon!" 
        : "मुझे अभी जुड़ने में कठिनाई हो रही है। कृपया कुछ देर में पुनः प्रयास करें!";
      setChatHistory(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: errText,
        timestamp: new Date()
      }]);
      speakText(errText);
    }
  };

  // Helper to parse dynamic route links
  const parseNavigationCommand = (query) => {
    const pages = [
      { 
        keys: ['market', 'mandi', 'sell', 'shop', 'product', 'बाजार', 'मंडी', 'दुकान', 'सौदा', 'खरीद', 'बेच'], 
        route: '/marketplace', 
        name: 'Mandi Marketplace', 
        nameHindi: 'मंडी बाजार' 
      },
      { 
        keys: ['farmer', 'kisan', 'agriculture', 'farming', 'crop', 'soil', 'weather', 'किसान', 'खेती', 'फसल', 'मिट्टी', 'मौसम'], 
        route: '/farmer-ai', 
        name: 'Farmer AI Assistant', 
        nameHindi: 'किसान सहायता' 
      },
      { 
        keys: ['health', 'doctor', 'medical', 'hospital page', 'clinic', 'बीमारी', 'स्वास्थ्य', 'डॉक्टर', 'इलाज', 'दवा'], 
        route: '/healthcare', 
        name: 'Healthcare Corner', 
        nameHindi: 'स्वास्थ्य केंद्र' 
      },
      { 
        keys: ['education', 'study', 'student', 'school page', 'course', 'पढ़ाई', 'शिक्षा', 'स्कूल', 'छात्र', 'सीखना'], 
        route: '/education', 
        name: 'Education Center', 
        nameHindi: 'शिक्षा विभाग' 
      },
      { 
        keys: ['labour', 'job', 'work', 'hire', 'employment', 'मजदूर', 'काम', 'नौकरी', 'रोजगार', 'कामगार'], 
        route: '/labour', 
        name: 'Labour Services', 
        nameHindi: 'श्रमिक सेवाएं' 
      },
      { 
        keys: ['teacher', 'find teacher', 'tutor', 'शिक्षक', 'गुरु', 'ट्यूशन'], 
        route: '/teachers', 
        name: 'Village Teachers Directory', 
        nameHindi: 'ग्राम शिक्षक निर्देशिका' 
      },
      { 
        keys: ['scheme', 'yojana', 'sarkari', 'सरकारी योजना', 'योजना', 'स्कीम'], 
        route: '/schemes', 
        name: 'Government Schemes', 
        nameHindi: 'सरकारी योजनाएं' 
      },
      { 
        keys: ['home', 'dashboard', 'main page', 'होम', 'मुख्य पृष्ठ', 'डैशबोर्ड'], 
        route: '/dashboard', 
        name: 'Dashboard Home', 
        nameHindi: 'मुख्य डैशबोर्ड' 
      }
    ];

    for (const page of pages) {
      if (page.keys.some(k => query.includes(k))) {
        return page;
      }
    }
    return null;
  };

  // Helper to parse dynamic local facilities request
  const parseFacilityCommand = (query) => {
    const schools = ['school', 'schools', 'स्कूल', 'विद्यालय', 'शिक्षा संस्थान'];
    const hospitals = ['hospital', 'hospitals', 'clinic', 'clinics', 'अस्पताल', 'अस्पतालों', 'चिकित्सालय', 'स्वास्थ्य केंद्र', 'दवाखाना'];
    const colleges = ['college', 'colleges', 'कॉलेज', 'महाविद्यालय', 'यूनिवर्सिटी'];

    if (schools.some(k => query.includes(k))) return 'school';
    if (hospitals.some(k => query.includes(k))) return 'hospital';
    if (colleges.some(k => query.includes(k))) return 'college';
    
    return null;
  };

  // Helper to parse weather commands and extract location
  const parseWeatherCommand = (query) => {
    const q = query.toLowerCase().trim();
    
    const weatherKeywords = [
      'weather', 'mausam', 'temp', 'temperature', 'rain', 'forecast',
      'मौसम', 'तापमान', 'बारिश', 'वेदर', 'बरसात', 'हवा'
    ];
    
    const hasWeatherKeyword = weatherKeywords.some(k => q.includes(k));
    if (!hasWeatherKeyword) return null;
    
    let location = '';
    
    // English patterns like "weather in Mumbai", "temperature of Delhi"
    const inMatch = q.match(/(?:weather|temp|temperature|forecast|rain|मौसम|वेदर|तापमान)\s+(?:in|of|for|at)\s+([a-zA-Z\s\u0900-\u097F]+)/);
    if (inMatch && inMatch[1]) {
      location = inMatch[1].trim();
    } else {
      // Hindi patterns like "Mumbai ka mausam", "Delhi me weather"
      const kaMatch = q.match(/([a-zA-Z\s\u0900-\u097F]+)\s+(?:ka|me|mein)\s+(?:mausam|weather|temp|temperature|barish|मौसम|वेदर|तापमान)/);
      if (kaMatch && kaMatch[1]) {
        location = kaMatch[1].trim();
      } else {
        // Direct pattern like "Mumbai weather", "Pune temperature"
        const directMatch = q.match(/([a-zA-Z\s\u0900-\u097F]+)\s+(?:weather|mausam|temp|temperature|मौसम|वेदर|तापमान)/);
        if (directMatch && directMatch[1]) {
          const potentialLoc = directMatch[1].trim();
          const stopwords = ['is', 'the', 'how', 'what', 'current', 'live', 'show', 'get', 'tell', 'me', 'today', 'tomorrow', 'का', 'में', 'क्या', 'कैसा', 'दिखाओ', 'बताओ'];
          if (!stopwords.includes(potentialLoc)) {
            location = potentialLoc;
          }
        }
      }
    }
    
    if (location) {
      const cleanWords = location.split(/\s+/).filter(word => {
        const stopwords = ['is', 'the', 'how', 'what', 'current', 'live', 'show', 'get', 'tell', 'me', 'today', 'tomorrow', 'please', 'any', 'a', 'an', 'का', 'में', 'क्या', 'कैसा', 'दिखाओ', 'बताओ', 'की', 'के', 'है'];
        return !stopwords.includes(word);
      });
      location = cleanWords.join(' ');
    }
    
    return location || ''; // Return empty string if weather query but no location specified
  };

  const toggleListen = () => {
    if (!recognitionRef.current) {
      alert(
        isEn 
          ? "Speech Recognition is not supported by your current browser. Please try Google Chrome or MS Edge."
          : "आपका ब्राउज़र आवाज पहचान का समर्थन नहीं करता है। कृपया गूगल क्रोम या एमएस एज का उपयोग करें।"
      );
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Recognition start race condition handled:", err);
      }
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!typedInput.trim()) return;
    handleIncomingQuery(typedInput);
    setTypedInput('');
  };

  const toggleMute = () => {
    setIsMuted(prev => {
      const nextMute = !prev;
      if (nextMute) {
        stopSpeaking();
      }
      return nextMute;
    });
  };

  const clearHistory = () => {
    setChatHistory([]);
    stopSpeaking();
    // Greet user
    setChatHistory([{
      id: 'greet',
      sender: 'ai',
      text: isEn 
        ? "History cleared. Ask me anything about farming, education, local facilities, or say 'Take me to Marketplace'!"
        : "इतिहास साफ़ कर दिया गया है। मुझसे खेती, शिक्षा, स्थानीय सुविधाओं के बारे में कुछ भी पूछें, या कहें 'मंडी बाजार खोलें'!",
      timestamp: new Date()
    }]);
  };

  // Render initial greeting if chat is empty when drawer opens
  useEffect(() => {
    if (isOpen && chatHistory.length === 0) {
      setChatHistory([
        {
          id: 'greet',
          sender: 'ai',
          text: isEn 
            ? `Hello ${user?.fullName || 'friend'}! I am GramMitra AI Assistant. Click the microphone below and ask me any question in English or Hindi!` 
            : `नमस्ते ${user?.fullName || 'मित्र'}! मैं ग्राममित्र आवाज सहायक हूँ। नीचे माइक्रोफ़ोन बटन दबाएं और मुझसे अंग्रेजी या हिंदी में कोई भी प्रश्न पूछें!`,
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen, chatHistory.length, isEn, user?.fullName]);

  return (
    <>
      {/* Trigger Button in Navbar */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
          isOpen 
            ? 'bg-village-emerald text-white shadow-md ring-2 ring-village-emerald/30' 
            : 'bg-village-cream/60 text-village-emerald hover:bg-village-lightMint border border-village-mint/20 hover:text-village-emerald shadow-sm'
        }`}
        title="Voice Assistant"
      >
        <Mic className={`w-4 h-4 ${isListening ? 'animate-pulse text-red-500' : ''}`} />
        <span className="hidden sm:inline text-xs font-bold font-sans tracking-wide">
          {isEn ? 'Voice AI' : 'आवाज AI'}
        </span>
      </button>

      {/* Center-aligned Animated Drawer & Modal Overlay using React Portal */}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              {/* Backdrop Blur Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setIsOpen(false);
                  stopSpeaking();
                }}
                className="absolute inset-0 bg-black/45 backdrop-blur-[2px] cursor-pointer"
              />

              {/* Centered Modal Card */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="relative w-full max-w-[440px] h-[580px] bg-white/95 backdrop-blur-md rounded-[32px] shadow-2xl border border-village-mint/20 flex flex-col overflow-hidden z-10"
                style={{ filter: 'drop-shadow(0 25px 30px rgba(27, 67, 50, 0.15))' }}
              >
                {/* Drawer Header */}
                <div className="px-5 py-4 bg-gradient-to-r from-village-emerald to-village-mint text-white flex items-center justify-between shadow-sm relative">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm animate-pulse-hover">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm tracking-wide">
                        {isEn ? 'GramMitra Assistant' : 'ग्राममित्र आवाज सहायक'}
                      </h3>
                      <p className="text-[10px] text-village-lightMint font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-ping" />
                        {isListening ? (isEn ? 'Listening...' : 'सुन रहा हूँ...') : (isEn ? 'Bilingual Voice active' : 'द्विभाषी आवाज सक्रिय')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={toggleMute}
                      className="p-1.5 rounded-lg hover:bg-white/10 transition-colors border-0 bg-transparent text-white cursor-pointer"
                      title={isMuted ? (isEn ? 'Unmute voice' : 'आवाज चालू करें') : (isEn ? 'Mute voice' : 'आवाज बंद करें')}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4 text-red-200" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={clearHistory}
                      className="p-1.5 rounded-lg hover:bg-white/10 transition-colors border-0 bg-transparent text-white cursor-pointer"
                      title={isEn ? 'Clear history' : 'इतिहास साफ करें'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        stopSpeaking();
                      }}
                      className="p-1.5 rounded-lg hover:bg-white/10 transition-colors border-0 bg-transparent text-white cursor-pointer"
                    >
                      <X className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>

                {/* Scrollable Conversation Container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-village-cream/10 custom-scrollbar">
                  {chatHistory.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                          msg.sender === 'user'
                            ? 'bg-village-emerald text-white rounded-br-none font-medium'
                            : 'bg-white border border-gray-100 text-gray-700 rounded-bl-none'
                        }`}
                      >
                        {/* Render standard text/markdown */}
                        <div className="whitespace-pre-line font-sans font-normal leading-relaxed">
                          {msg.text}
                        </div>

                        {/* Navigation Specific Card */}
                        {msg.type === 'navigation' && (
                          <div className="mt-2.5 bg-village-lightMint/30 border border-village-mint/30 rounded-xl p-2.5 flex items-center justify-between text-gray-800">
                            <div className="flex items-center gap-2">
                              <Navigation className="w-4 h-4 text-village-emerald shrink-0" />
                              <span className="font-extrabold text-[11px] truncate">
                                {isEn ? `Redirecting to ${msg.route}` : `${msg.route} पर पुनर्निर्देशित`}
                              </span>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-village-emerald" />
                          </div>
                        )}

                        {/* Infrastructure Dynamic Facilities Card */}
                        {msg.type === 'facilities' && msg.facilities && (
                          <div className="mt-3 space-y-2">
                            {msg.facilities.map((fac, idx) => (
                              <div
                                key={idx}
                                className="bg-village-lightMint/20 border border-village-mint/20 rounded-xl p-3 flex flex-col gap-1.5 relative overflow-hidden"
                              >
                                <div className="absolute top-0 right-0 h-1 bg-village-mint w-full" />
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="font-extrabold text-[11px] text-village-darkGreen leading-tight">
                                    {isEn ? fac.name : (fac.nameHi || fac.name)}
                                  </h4>
                                  <span className="shrink-0 text-[9px] font-black uppercase bg-village-emerald text-white px-2 py-0.5 rounded-full tracking-wide">
                                    {isEn ? fac.type : (fac.typeHi || fac.type)}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-1 pt-1.5 border-t border-village-mint/10 text-[10px] text-gray-600">
                                  <div className="flex items-center gap-1 font-semibold">
                                    <MapPin className="w-3 h-3 text-village-mint shrink-0" />
                                    <span>{fac.distance}</span>
                                  </div>
                                  {fac.medium && (
                                    <div className="flex items-center gap-1 font-semibold truncate">
                                      <GraduationCap className="w-3 h-3 text-village-mint shrink-0" />
                                      <span>{isEn ? fac.medium : (fac.mediumHi || fac.medium)}</span>
                                    </div>
                                  )}
                                  {fac.beds !== undefined && (
                                    <div className="flex items-center gap-1 font-semibold">
                                      <Activity className="w-3 h-3 text-village-mint shrink-0" />
                                      <span>{fac.beds} {isEn ? 'Beds' : 'बिस्तर'}</span>
                                    </div>
                                  )}
                                  {fac.specialty && (
                                    <div className="flex items-center gap-1 font-semibold col-span-2 truncate">
                                      <Building className="w-3 h-3 text-village-mint shrink-0" />
                                      <span>{isEn ? fac.specialty : (fac.specialtyHi || fac.specialty)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Dynamic Weather Card */}
                        {msg.type === 'weather' && msg.weather && (
                          <div className="mt-3 bg-gradient-to-br from-blue-50/50 to-village-lightMint/30 border border-village-mint/20 rounded-2xl p-4 flex flex-col gap-3 shadow-sm relative overflow-hidden text-gray-800">
                            <div className="absolute top-0 right-0 h-1 bg-village-emerald w-full" />
                            
                            {/* Weather Card Header */}
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase text-village-darkGreen tracking-wide flex items-center gap-1.5">
                                <CloudSun className="w-3.5 h-3.5 text-village-emerald animate-pulse" />
                                {msg.weather.location || (isEn ? 'Current Weather' : 'वर्तमान मौसम')}
                              </span>
                            </div>

                            {/* Main Metrics */}
                            <div className="grid grid-cols-2 gap-3 items-center">
                              {/* Temp */}
                              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-2.5 flex items-center gap-2 border border-gray-100">
                                <ThermometerSun className="w-6 h-6 text-orange-500 shrink-0" />
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{isEn ? 'Temp' : 'तापमान'}</span>
                                  <span className="text-sm font-extrabold text-gray-800 leading-tight">{msg.weather.temperature}°C</span>
                                </div>
                              </div>
                              {/* Condition */}
                              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-2.5 flex flex-col justify-center border border-gray-100 h-full text-center">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{isEn ? 'Condition' : 'स्थिति'}</span>
                                <span className="text-[11px] font-extrabold text-village-darkGreen capitalize leading-snug truncate">{msg.weather.condition}</span>
                              </div>
                            </div>

                            {/* Minor Metrics */}
                            <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-600">
                              <div className="flex items-center gap-1.5 font-bold bg-white/50 px-2.5 py-1.5 rounded-lg border border-gray-100/50">
                                <Droplets className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                <span>{isEn ? 'Humidity:' : 'नमी:'} <strong>{msg.weather.humidity}%</strong></span>
                              </div>
                              <div className="flex items-center gap-1.5 font-bold bg-white/50 px-2.5 py-1.5 rounded-lg border border-gray-100/50">
                                <Wind className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                                <span>{isEn ? 'Wind:' : 'हवा:'} <strong>{msg.weather.windSpeed} km/h</strong></span>
                              </div>
                            </div>

                            {/* Farming Alert Banner */}
                            {msg.weather.farmingAlert && (
                              <div className="bg-red-50 border border-red-100 rounded-xl p-2.5 flex gap-2 items-start text-[10px] text-red-600 leading-relaxed shadow-sm">
                                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                  <strong className="text-red-700 font-bold block mb-0.5">{isEn ? 'Farming Alert:' : 'कृषि चेतावनी:'}</strong>
                                  {msg.weather.farmingAlert}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* AI Thinking Animation */}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2">
                        <Bot className="w-4 h-4 text-village-emerald animate-pulse" />
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-village-mint rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-village-emerald rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-village-mint rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={chatEndRef} />
                </div>

                {/* Listening Wave Visualizer Overlay (Slide-up strip) */}
                <AnimatePresence>
                  {(isListening || transcription) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-5 py-3.5 bg-village-lightMint/50 border-t border-b border-village-mint/20 flex flex-col gap-2 items-center text-center shrink-0"
                    >
                      {isListening && (
                        <div className="flex items-center gap-1.5 justify-center h-5">
                          <span className="w-1 h-3.5 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1 h-5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1 h-6 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          <span className="w-1 h-5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
                          <span className="w-1 h-3.5 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '600ms' }} />
                        </div>
                      )}
                      <p className="text-xs text-gray-700 italic font-medium leading-relaxed max-h-12 overflow-y-auto px-2">
                        {transcription}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Collapsible Suggestion Chips Container */}
                {!isLoading && (
                  <div className="px-4 py-3 border-t border-gray-100 shrink-0 bg-white">
                    {/* Header Toggle */}
                    <button
                      type="button"
                      onClick={() => setShowSuggestions(!showSuggestions)}
                      className="w-full flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 px-1 border-0 bg-transparent cursor-pointer hover:text-village-emerald transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-village-mint" />
                        <span>{isEn ? 'Try Saying:' : 'कहकर देखें:'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[9px] lowercase font-normal italic text-gray-400 select-none">
                        <span>{showSuggestions ? (isEn ? 'hide' : 'छिपाएं') : (isEn ? 'show' : 'दिखाएं')}</span>
                        {showSuggestions ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                    
                    {/* Collapsible Chips List */}
                    <AnimatePresence>
                      {showSuggestions && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex flex-wrap gap-1.5 mt-1.5 overflow-hidden"
                        >
                          {suggestions.map((sug, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                handleIncomingQuery(sug.text);
                                setShowSuggestions(false);
                              }}
                              className="text-xs font-semibold text-gray-700 hover:text-village-emerald bg-white/80 border border-gray-100 hover:bg-village-lightMint/60 hover:border-village-emerald/30 shadow-[0_2px_8px_rgba(0,0,0,0.02)] px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                            >
                              {sug.icon}
                              <span>{sug.text}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Input Footer */}
                <div className="p-4 bg-white border-t border-gray-100 flex flex-col gap-2 shrink-0">
                  <form onSubmit={handleTextSubmit} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={typedInput}
                      onChange={(e) => setTypedInput(e.target.value)}
                      placeholder={isEn ? "Ask me anything or type here..." : "मुझसे कुछ भी पूछें या टाइप करें..."}
                      className="flex-1 border border-gray-200 bg-gray-50 rounded-2xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-village-mint focus:bg-white font-medium transition-all"
                      disabled={isLoading}
                    />
                    
                    {/* Send Button */}
                    {typedInput.trim() ? (
                      <button
                        type="submit"
                        className="p-2.5 text-white bg-village-emerald hover:bg-village-darkGreen rounded-2xl shadow-md cursor-pointer border-0 transition-all flex items-center justify-center shrink-0"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    ) : (
                      // Large Voice Microphone Toggle Button
                      <button
                        type="button"
                        onClick={toggleListen}
                        className={`p-2.5 rounded-2xl shadow-md border-0 transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                          isListening
                            ? 'bg-red-500 text-white animate-pulse shadow-red-200'
                            : 'bg-village-cream/50 text-village-emerald hover:bg-village-lightMint'
                        }`}
                        title={isListening ? (isEn ? 'Stop listening' : 'सुनना बंद करें') : (isEn ? 'Start speaking' : 'बोलना शुरू करें')}
                      >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>
                    )}
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default VoiceAssistant;