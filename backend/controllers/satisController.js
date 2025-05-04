const pool = require('../config/db');

// Yeni satış kaydet
exports.satisKaydet = async (req, res) => {
  const { toplam_fiyat, urunler } = req.body;
  
  if (!toplam_fiyat || !urunler) {
    return res.status(400).json({ hata: 'Toplam fiyat ve ürünler zorunludur' });
  }
  
  const connection = await pool.getConnection();
  
  try {
    // İşlemleri bir transaction içerisinde gerçekleştir
    await connection.beginTransaction();
    
    // Satışı kaydet
    const [result] = await connection.query(
      'INSERT INTO satislar (toplam_fiyat, urunler) VALUES (?, ?)',
      [toplam_fiyat, JSON.stringify(urunler)]
    );
    
    // Her bir ürün için stok güncelleme işlemini gerçekleştir
    for (const urun of urunler) {
      // Önce ürünün mevcut stok durumunu kontrol et
      const [stokKontrol] = await connection.query(
        'SELECT stok_adedi FROM urunler WHERE barkod = ?',
        [urun.barkod]
      );
      
      if (stokKontrol.length > 0) {
        const mevcutStok = stokKontrol[0].stok_adedi;
        const yeniStok = Math.max(0, mevcutStok - urun.miktar); // Stok eksi değere düşmemeli
        
        // Stok güncelleme
        await connection.query(
          'UPDATE urunler SET stok_adedi = ?, son_guncelleme = NOW() WHERE barkod = ?',
          [yeniStok, urun.barkod]
        );
      }
    }
    
    // İşlemleri onayla
    await connection.commit();
    
    res.status(201).json({ 
      mesaj: 'Satış başarıyla kaydedildi ve stoklar güncellendi', 
      satis_id: result.insertId 
    });
  } catch (error) {
    // Hata durumunda tüm işlemleri geri al
    await connection.rollback();
    
    console.error('Hata:', error);
    res.status(500).json({ hata: 'Sunucu hatası' });
  } finally {
    // Her durumda bağlantıyı serbest bırak
    connection.release();
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