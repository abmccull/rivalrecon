'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { cookieName } from '@/lib/i18n/client';
import { setCookie } from 'cookies-next';

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const { i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  
  // Initialize language selection on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentLang = i18n.language || localStorage.getItem('i18nextLng') || 'en';
      setSelectedLanguage(currentLang);
      
      console.log(`LanguageSwitcher initialized with language: ${currentLang}`);
    }
  }, [i18n.language]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    console.log(`Language change requested: ${selectedLanguage} → ${newLang}`);
    
    // Update state
    setSelectedLanguage(newLang);
    
    // Save language in both i18next and localStorage
    i18n.changeLanguage(newLang);
    localStorage.setItem('i18nextLng', newLang);
    
    try {
      // Set cookie for server-side
      setCookie(cookieName, newLang, { 
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/' 
      });
    } catch (error) {
      console.error('Failed to set language cookie:', error);
    }
    
    console.log('Language changed successfully!');
    
    // Force page reload to apply the language change to all components
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <select
      value={selectedLanguage}
      onChange={handleLanguageChange}
      className="bg-transparent border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:border-transparent"
    >
      <option value="en">English</option>
      <option value="es">Español</option>
      <option value="fr">Français</option>
      <option value="de">Deutsch</option>
    </select>
  );
}
