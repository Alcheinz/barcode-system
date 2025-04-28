const pool = require('../config/db');

// Tüm ürünleri getir
exports.tumUrunleriGetir = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM urunler');
    res.json(rows);
  } catch (error) {
    console.error('Hata:', error);
    res.status(500).json({ hata: 'Sunucu hatası' });
  }
};

// Barkod numarasına göre ürün getir
exports.urunGetir = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM urunler WHERE barkod = ?', [req.params.barkod]);
    
    if (rows.length === 0) {
      return res.status(404).json({ hata: 'Ürün bulunamadı' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Hata:', error);
    res.status(500).json({ hata: 'Sunucu hatası' });
  }
};

// Yeni ürün ekle
exports.urunEkle = async (req, res) => {
  const { barkod, urun_adi, fiyat, stok_adedi } = req.body;
  
  if (!barkod || !urun_adi || !fiyat) {
    return res.status(400).json({ hata: 'Barkod, ürün adı ve fiyat zorunludur' });
  }
  
  try {
    const [result] = await pool.query(
      'INSERT INTO urunler (barkod, urun_adi, fiyat, stok_adedi) VALUES (?, ?, ?, ?)',
      [barkod, urun_adi, fiyat, stok_adedi || 0]
    );
    
    res.status(201).json({ mesaj: 'Ürün başarıyla eklendi', id: result.insertId });
  } catch (error) {
    console.error('Hata:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ hata: 'Bu barkod zaten kayıtlı' });
    }
    
    res.status(500).json({ hata: 'Sunucu hatası' });
  }
};

// Ürünü güncelle
exports.urunGuncelle = async (req, res) => {
  const { urun_adi, fiyat, stok_adedi } = req.body;
  const { barkod } = req.params;
  
  try {
    const [result] = await pool.query(
      'UPDATE urunler SET urun_adi = ?, fiyat = ?, stok_adedi = ?, son_guncelleme = NOW() WHERE barkod = ?',
      [urun_adi, fiyat, stok_adedi, barkod]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ hata: 'Güncellenecek ürün bulunamadı' });
    }
    
    res.json({ mesaj: 'Ürün başarıyla güncellendi' });
  } catch (error) {
    console.error('Hata:', error);
    res.status(500).json({ hata: 'Sunucu hatası' });
  }
};

// Ürünü sil
exports.urunSil = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM urunler WHERE barkod = ?', [req.params.barkod]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ hata: 'Silinecek ürün bulunamadı' });
    }
    
    res.json({ mesaj: 'Ürün başarıyla silindi' });
  } catch (error) {
    console.error('Hata:', error);
    res.status(500).json({ hata: 'Sunucu hatası' });
  }
};

// Tüm ürünleri sil
exports.tumUrunleriSil = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM urunler');
    
    res.json({ 
      mesaj: 'Tüm ürünler başarıyla silindi', 
      silinenUrunSayisi: result.affectedRows 
    });
  } catch (error) {
    console.error('Hata:', error);
    res.status(500).json({ hata: 'Sunucu hatası' });
  }
};