import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  
  // LocalStorage'dan tema bilgisini yükle
  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme) {
      setDarkMode(JSON.parse(savedTheme));
    }
  }, []);
  
  // Tema durumunu değiştir ve HTML'e tema sınıfını ekle veya kaldır
  useEffect(() => {
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