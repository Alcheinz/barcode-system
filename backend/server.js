const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const urunRoutes = require('./routes/urunRoutes');
const satisRoutes = require('./routes/satisRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Route'ları kullan
app.use('/api', urunRoutes);
app.use('/api', satisRoutes);

// Server'ı başlat
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
});