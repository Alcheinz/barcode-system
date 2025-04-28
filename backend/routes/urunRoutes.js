const express = require('express');
const router = express.Router();
const urunController = require('../controllers/urunController');

// Tüm ürünleri getir
router.get('/urunler', urunController.tumUrunleriGetir);

// Barkod ile ürün getir
router.get('/urun/:barkod', urunController.urunGetir);

// Yeni ürün ekle
router.post('/urun', urunController.urunEkle);

// Ürün güncelle
router.put('/urun/:barkod', urunController.urunGuncelle);

// Ürün sil
router.delete('/urun/:barkod', urunController.urunSil);

// Tüm ürünleri sil
router.delete('/urunler/tumunu-sil', urunController.tumUrunleriSil);

module.exports = router;