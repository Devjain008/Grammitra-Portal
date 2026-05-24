import React, { createContext, useContext, useState, useEffect } from "react";
// Change the import path to start from 'src'
import enTranslations from "../locales/en.json"; 
import hiTranslations from "../locales/hi.json";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [locale, setLocale] = useState(localStorage.getItem('gramMitra_locale') || 'en');
  const [translations, setTranslations] = useState(locale === 'en' ? enTranslations : hiTranslations);

  useEffect(() => {
    localStorage.setItem('gramMitra_locale', locale);
    setTranslations(locale === 'en' ? enTranslations : hiTranslations);
  }, [locale]);

  const t = (path) => {
    const keys = path.split('.');
    let value = translations;
    for (const key of keys) {
      if (value && value[key]) {
        value = value[key];
      } else {
        return path;
      }
    }
    return value;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);