import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const VoiceAssistant = () => {
  const [isListening, setIsListening] = useState(false);
  const { locale } = useLanguage();
  const navigate = useNavigate();

  // Speech Recognition Setup
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  useEffect(() => {
    if (recognition) {
      recognition.lang = locale === 'hi' ? 'hi-IN' : 'en-US';
      recognition.continuous = false;

      recognition.onresult = (event) => {
        const command = event.results[0][0].transcript.toLowerCase();
        handleCommand(command);
        setIsListening(false);
      };

      recognition.onend = () => setIsListening(false);
    }
  }, [locale]);

  const handleCommand = (command) => {
    const cmd = command.toLowerCase().trim();
    
    let targetRoute = '';
    let speechText = '';

    // Check labor skills
    if (cmd.includes('electrician') || cmd.includes('बिजली मिस्त्री') || cmd.includes('बिजली')) {
      targetRoute = '/labour?skill=electrician';
      speechText = locale === 'hi' ? 'बिजली मिस्त्री खोज रहे हैं' : 'Searching for electricians';
    } else if (cmd.includes('plumber') || cmd.includes('नलसाज') || cmd.includes('प्लम्बर')) {
      targetRoute = '/labour?skill=plumber';
      speechText = locale === 'hi' ? 'नलसाज खोज रहे हैं' : 'Searching for plumbers';
    } else if (cmd.includes('mason') || cmd.includes('राजमिस्त्री') || cmd.includes('राज मिस्त्री')) {
      targetRoute = '/labour?skill=mason';
      speechText = locale === 'hi' ? 'राजमिस्त्री खोज रहे हैं' : 'Searching for masons';
    } else if (cmd.includes('carpenter') || cmd.includes('बढ़ई')) {
      targetRoute = '/labour?skill=carpenter';
      speechText = locale === 'hi' ? 'बढ़ई खोज रहे हैं' : 'Searching for carpenters';
    } else if (cmd.includes('mechanic') || cmd.includes('मैकेनिक') || cmd.includes('मिस्त्री')) {
      targetRoute = '/labour?skill=mechanic';
      speechText = locale === 'hi' ? 'मैकेनिक खोज रहे हैं' : 'Searching for mechanics';
    } else if (cmd.includes('driver') || cmd.includes('चालक') || cmd.includes('ड्राइवर')) {
      targetRoute = '/labour?skill=driver';
      speechText = locale === 'hi' ? 'ड्राइवर खोज रहे हैं' : 'Searching for drivers';
    } else if (cmd.includes('cook') || cmd.includes('रसोइया')) {
      targetRoute = '/labour?skill=cook';
      speechText = locale === 'hi' ? 'रसोइया खोज रहे हैं' : 'Searching for cooks';
    } else if (cmd.includes('security') || cmd.includes('चौकीदार') || cmd.includes('सुरक्षा')) {
      targetRoute = '/labour?skill=security';
      speechText = locale === 'hi' ? 'सुरक्षा गार्ड खोज रहे हैं' : 'Searching for security';
    } else if (cmd.includes('cleaner') || cmd.includes('सफाई')) {
      targetRoute = '/labour?skill=cleaner';
      speechText = locale === 'hi' ? 'सफाई कर्मी खोज रहे हैं' : 'Searching for cleaners';
    } else if (cmd.includes('painter') || cmd.includes('पेंटर') || cmd.includes('रंगसाज')) {
      targetRoute = '/labour?skill=painter';
      speechText = locale === 'hi' ? 'पेंटर खोज रहे हैं' : 'Searching for painters';
    } else if (cmd.includes('welder') || cmd.includes('वेल्डर')) {
      targetRoute = '/labour?skill=welder';
      speechText = locale === 'hi' ? 'वेल्डर खोज रहे हैं' : 'Searching for welders';
    } else if (cmd.includes('labour') || cmd.includes('मजदूर') || cmd.includes('कामगार') || cmd.includes('नौकरी')) {
      targetRoute = '/labour';
      speechText = locale === 'hi' ? 'मजदूरों की सूची पर जा रहे हैं' : 'Navigating to labor services';
    } else if (cmd.includes('dashboard') || cmd.includes('home') || cmd.includes('मुख्य पृष्ठ') || cmd.includes('होम')) {
      targetRoute = '/dashboard';
      speechText = locale === 'hi' ? 'डैशबोर्ड पर जा रहे हैं' : 'Navigating to Dashboard';
    } else if (cmd.includes('market') || cmd.includes('mandi') || cmd.includes('बाजार') || cmd.includes('दुकान') || cmd.includes('मंडी')) {
      targetRoute = '/marketplace';
      speechText = locale === 'hi' ? 'मंडी पर जा रहे हैं' : 'Navigating to Marketplace';
    } else if (cmd.includes('farmer') || cmd.includes('kisan') || cmd.includes('खेती') || cmd.includes('किसान')) {
      targetRoute = '/farmer-ai';
      speechText = locale === 'hi' ? 'किसान सहायता पर जा रहे हैं' : 'Navigating to Farmer AI';
    } else if (cmd.includes('health') || cmd.includes('doctor') || cmd.includes('अस्पताल') || cmd.includes('डॉक्टर') || cmd.includes('स्वास्थ्य')) {
      targetRoute = '/healthcare';
      speechText = locale === 'hi' ? 'स्वास्थ्य सेवा पर जा रहे हैं' : 'Navigating to Healthcare';
    } else if (cmd.includes('education') || cmd.includes('study') || cmd.includes('पढ़ाई') || cmd.includes('शिक्षा') || cmd.includes('स्कूल')) {
      targetRoute = '/education';
      speechText = locale === 'hi' ? 'शिक्षा विभाग पर जा रहे हैं' : 'Navigating to Education';
    } else {
      speechText = locale === 'hi' ? `मैंने सुना: ${command}` : `I heard: ${command}`;
    }

    if (targetRoute) {
      navigate(targetRoute);
    }

    // Voice Feedback
    const speech = new SpeechSynthesisUtterance(speechText);
    speech.lang = locale === 'hi' ? 'hi-IN' : 'en-US';
    window.speechSynthesis.speak(speech);
  };

  const toggleListen = () => {
    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  if (!recognition) return null; // Hide if browser doesn't support it

  return (
    <button
      onClick={toggleListen}
      className={`p-2 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-village-lightMint hover:text-village-emerald'}`}
      title="Voice Assistant"
    >
      {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
    </button>
  );
};

export default VoiceAssistant;