const pool = require('../config/db');

// Yeni satış kaydet
exports.satisKaydet = async (req, res) => {
  const { toplam_fiyat, urunler } = req.body;
  
  if (!toplam_fiyat || !urunler) {
    return res.status(400).json({ hata: 'Toplam fiyat ve ürünler zorunludur' });
  }
  
  try {
    const [result] = await pool.query(
      'INSERT INTO satislar (toplam_fiyat, urunler) VALUES (?, ?)',
      [toplam_fiyat, JSON.stringify(urunler)]
    );
    
    res.status(201).json({ 
      mesaj: 'Satış başarıyla kaydedildi', 
      satis_id: result.insertId 
    });
  } catch (error) {
    console.error('Hata:', error);
    res.status(500).json({ hata: 'Sunucu hatası' });
  }
};

// Satış geçmişini getir
exports.satisGecmisiGetir = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM satislar ORDER BY tarih DESC');
    res.json(rows);
  } catch (error) {
    console.error('Hata:', error);
    res.status(500).json({ hata: 'Sunucu hatası' });
  }
};