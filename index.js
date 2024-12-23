const fs = require('fs').promises;
const path = require('path');
const express = require('express');
const app = express();

// EJS template engine ayarları
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// API route'larını otomatik yükleyen fonksiyon
async function loadApiRoutes(app) {
    const apiDir = path.join(__dirname, 'api');
    const files = await fs.readdir(apiDir);
    const apiList = [];

    for (const file of files) {
        if (file.endsWith('.js')) {
            // Her API dosyasını require et
            const apiPath = path.join(apiDir, file);
            const apiModule = require(apiPath);
            
            // API bilgilerini kontrol et
            if (apiModule.isim && apiModule.aciklama && apiModule.link && apiModule.route && apiModule.aktiflik) {
                // Sadece aktif API'ler için route'u kaydet
                if (apiModule.aktiflik === 'aktif') {
                    app.use(apiModule.route);
                }
                
                // Tüm API'leri (aktif veya pasif) listeye ekle
                apiList.push({
                    isim: apiModule.isim,
                    aciklama: apiModule.aciklama,
                    link: apiModule.link,
                    aktiflik: apiModule.aktiflik
                });
            }
        }
    }

    return apiList;
}

// Ana route
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

app.get('/', async (req, res) => {
    try {
        const apiList = await loadApiRoutes(app);
        res.render('index', { apiList });
    } catch (error) {
        console.error('Hata:', error);
        res.status(500).send('Bir hata oluştu');
    }
});

// Sunucuyu başlat
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor`);
});