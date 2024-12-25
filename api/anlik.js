const express = require('express');
const axios = require('axios');
const router = express.Router();

// Rate limiting ve önbellek için değişkenler
const CACHE_DURATION = 5 * 60 * 1000; // 5 dakika
const cache = new Map();

// Yardımcı fonksiyonlar
const cleanCache = () => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
            cache.delete(key);
        }
    }
};

// Her 5 dakikada bir önbelleği temizle
setInterval(cleanCache, CACHE_DURATION);

// IP Adresine göre konum bilgisini döndüren API
router.get('/api/ip-location', async (req, res) => {
    try {
        const ip = req.query.ip;

        if (!ip) {
            return res.status(400).json({
                error: 'IP adresi (ip) parametresi gerekli',
                status: 400
            });
        }

        // Önbellekte varsa, önbellekten döndür
        const cachedData = cache.get(ip);
        if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
            return res.json(cachedData.data);
        }

        // IP bilgilerini al
        const response = await axios.get(`http://ip-api.com/json/${ip}`, {
            timeout: 5000
        });

        if (response.data.status !== 'success') {
            return res.status(404).json({
                error: 'IP adresi bilgileri alınamadı',
                status: 404
            });
        }

        // IP bilgilerini düzenle
        const ipInfo = {
            success: true,
            data: {
                ip,
                country: response.data.country,
                region: response.data.regionName,
                city: response.data.city,
                isp: response.data.isp,
                latitude: response.data.lat,
                longitude: response.data.lon,
                timezone: response.data.timezone
            },
            timestamp: new Date().toISOString()
        };

        // Önbelleğe kaydet
        cache.set(ip, {
            timestamp: Date.now(),
            data: ipInfo
        });

        res.json(ipInfo);
    } catch (error) {
        const statusCode = error.response?.status || 500;
        const errorMessage = error.response?.data?.message || error.message || 'Bir hata oluştu';

        res.status(statusCode).json({
            error: errorMessage,
            status: statusCode
        });
    }
});

// Modül dışa aktarma
module.exports = {
    isim: "IP Konum API",
    aciklama: "Bir IP adresi ile detaylı konum bilgilerini döndürür (?ip=1.1.1.1)",
    link: "/api/ip-location",
    route: router,
    aktiflik: 'aktif'
};
