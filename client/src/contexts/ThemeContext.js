import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  // İlk başlangıç durumunu localStorage'dan al
  const getSavedTheme = () => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) {
      return JSON.parse(savedTheme);
    }
    return false; // Varsayılan değer
  };
  
  const [darkMode, setDarkMode] = useState(getSavedTheme());
  
  // LocalStorage'daki tema değişikliğini dinle ve HTML'e tema sınıfını ekle veya kaldır
  useEffect(() => {
    // Tema durumunu HTML'de güncelle
    if (darkMode) {
      document.documentElement.setAttribute('data-bs-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-bs-theme', 'light');
    }
    
    // Tema durumunu localStorage'a kaydet
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);
  
  // Tema değiştirme işlevi
  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };
  
  return (
    <ThemeContext.Provider 
      value={{ 
        darkMode, 
        toggleTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext; 