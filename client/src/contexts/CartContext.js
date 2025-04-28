import React, { createContext, useState, useEffect, useContext } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [sepet, setSepet] = useState([]);
  const [toplam, setToplam] = useState(0);
  
  // LocalStorage'dan sepeti yükle
  useEffect(() => {
    const savedCart = localStorage.getItem('sepet');
    if (savedCart) {
      setSepet(JSON.parse(savedCart));
    }
  }, []);
  
  // Toplam hesaplama
  useEffect(() => {
    const yeniToplam = sepet.reduce((toplam, item) => toplam + (Number(item.urun.fiyat) * item.miktar), 0);
    setToplam(yeniToplam);
    
    // Sepeti LocalStorage'a kaydet
    localStorage.setItem('sepet', JSON.stringify(sepet));
  }, [sepet]);
  
  // Sepete ürün ekle veya miktarını artır
  const sepeteEkle = (urun) => {
    // Ürünün sayıya dönüştürülmüş fiyatını kullan
    urun.fiyat = Number(urun.fiyat);
    
    // Sepette ürün zaten var mı kontrol et
    const sepetIndex = sepet.findIndex(item => item.urun.barkod === urun.barkod);
    
    if (sepetIndex !== -1) {
      // Ürün zaten sepette, miktarını artır
      const yeniSepet = [...sepet];
      yeniSepet[sepetIndex].miktar += 1;
      setSepet(yeniSepet);
    } else {
      // Ürünü sepete ekle
      setSepet([...sepet, { urun, miktar: 1 }]);
    }
  };
  
  // Sepetten ürün kaldırma
  const urunKaldir = (index) => {
    const yeniSepet = [...sepet];
    yeniSepet.splice(index, 1);
    setSepet(yeniSepet);
  };
  
  // Miktar değiştirme
  const miktarDegistir = (index, yeniMiktar) => {
    if (yeniMiktar < 1) return;
    
    const yeniSepet = [...sepet];
    yeniSepet[index].miktar = yeniMiktar;
    setSepet(yeniSepet);
  };
  
  // Sepeti temizle
  const sepetiTemizle = () => {
    setSepet([]);
  };
  
  return (
    <CartContext.Provider 
      value={{ 
        sepet, 
        toplam, 
        sepeteEkle, 
        urunKaldir, 
        miktarDegistir, 
        sepetiTemizle 
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartContext; 