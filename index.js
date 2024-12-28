// index.js
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const app = express();
const LevelCard = require('./moduller/test');

// EJS template engine ayarları
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Statik dosyalar için middleware
app.use(express.static('public'));

// API route'larını otomatik yükleyen fonksiyon
async function loadApiRoutes(app) {
    const apiDir = path.join(__dirname, 'api');
    const files = await fs.readdir(apiDir);
    const apiList = [];

    for (const file of files) {
        if (file.endsWith('.js')) {
            const apiPath = path.join(apiDir, file);
            const apiModule = require(apiPath);
            
            if (apiModule.isim && apiModule.aciklama && apiModule.link && apiModule.route && apiModule.aktiflik) {
                if (apiModule.aktiflik === 'aktif') {
                    app.use(apiModule.route);
                }
                
                apiList.push({
                    isim: apiModule.isim,
                    aciklama: apiModule.aciklama,
                    link: apiModule.link,
                    aktiflik: apiModule.aktiflik,
                    parametreler: apiModule.parametreler || []
                });
            }
        }
    }

    return apiList;
}

// Ana route'lar
app.get('/', async (req, res) => {
    try {
        const apiList = await loadApiRoutes(app);
        res.render('index', { apiList });
    } catch (error) {
        console.error('Hata:', error);
        res.status(500).send('Bir hata oluştu');
    }
});

app.get('/api', async (req, res) => {
    try {
        const apiList = await loadApiRoutes(app);
        res.render('api', { apiList });
    } catch (error) {
        console.error('Hata:', error);
        res.status(500).send('Bir hata oluştu');
    }
});

app.get('/bekleme', async (req, res) => {
    res.render('bekleme');
});

// Sunucuyu başlat
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor`);
});
