const express = require('express');
const router = express.Router();
const satisController = require('../controllers/satisController');

// Yeni satış kaydet
router.post('/satis', satisController.satisKaydet);

// Satış geçmişini getir
router.get('/satislar', satisController.satisGecmisiGetir);

module.exports = router;