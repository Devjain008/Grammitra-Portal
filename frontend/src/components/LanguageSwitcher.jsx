import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Languages } from 'lucide-react';

const LanguageSwitcher = () => {
  const { locale, setLocale } = useLanguage();

  const toggleLanguage = () => {
    setLocale(locale === 'en' ? 'hi' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-village-mint/10 text-village-darkGreen hover:bg-village-mint/20 transition-all font-semibold text-sm border border-village-mint/20"
      aria-label="Toggle Language"
    >
      <Languages className="w-4 h-4" />
      <span>{locale === 'en' ? 'हिंदी' : 'English'}</span>
    </button>
  );
};

export default LanguageSwitcher;