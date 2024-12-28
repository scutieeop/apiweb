const express = require('express');
const LevelCard = require('../moduller/test.js');
const router = express.Router();

// Cache ayarları
const CACHE_DURATION = 5 * 60 * 1000; // 5 dakika
const cache = new Map();

// Cache temizleme fonksiyonu
const cleanCache = () => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
            cache.delete(key);
        }
    }
};

// Periyodik cache temizliği
setInterval(cleanCache, CACHE_DURATION);

// Level card endpoint'i
router.get('/api/level-card', async (req, res) => {
    try {
        const { username, avatarURL, level, currentXP, requiredXP, season } = req.query;

        // Parametre kontrolü
        if (!username || !avatarURL || !level || !currentXP || !requiredXP || !season) {
            return res.status(400).json({
                error: 'Eksik parametreler. username, avatarURL, level, currentXP, requiredXP ve season gerekli.',
                status: 400
            });
        }

        // Cache key oluştur
        const cacheKey = `${username}-${level}-${currentXP}-${requiredXP}-${season}`;

        // Cache kontrolü
        const cachedImage = cache.get(cacheKey);
        if (cachedImage && Date.now() - cachedImage.timestamp < CACHE_DURATION) {
            return res.sendFile(cachedImage.filePath, { root: '.' }, (err) => {
                if (err) {
                    console.error('Cache dosyası gönderme hatası:', err);
                    res.status(500).json({
                        error: 'Dosya gönderilirken bir hata oluştu',
                        status: 500
                    });
                }
            });
        }

        const levelCard = new LevelCard();
        
        // Kart oluşturma
        await levelCard.generateCard({
            username,
            avatarURL,
            level: parseInt(level),
            currentXP: parseInt(currentXP),
            requiredXP: parseInt(requiredXP),
            season
        });

        // Benzersiz dosya adı oluştur
        const fileName = `cache/level-card-${username}-${Date.now()}.png`;

        // Kartı kaydet
        await levelCard.saveCard(fileName);

        // Cache'e kaydet
        cache.set(cacheKey, {
            timestamp: Date.now(),
            filePath: fileName
        });

        // Response gönder
        res.sendFile(fileName, { root: '.' }, (err) => {
            if (err) {
                console.error('Dosya gönderme hatası:', err);
                res.status(500).json({
                    error: 'Dosya gönderilirken bir hata oluştu',
                    status: 500
                });
            }
        });

    } catch (error) {
        console.error('Hata:', error);
        res.status(500).json({
            error: 'Kart oluşturulurken bir hata oluştu',
            status: 500
        });
    }
});

module.exports = {
    isim: "Level Card API",
    aciklama: "Kullanıcının seviye bilgilerine göre özel level kartı oluşturur",
    link: "/api/level-card",
    route: router,
    aktiflik: 'aktif',
    parametreler: [
        {
            isim: "username",
            zorunlu: true,
            aciklama: "Kullanıcı adı"
        },
        {
            isim: "avatarURL",
            zorunlu: true,
            aciklama: "Kullanıcı profil resmi URL'i"
        },
        {
            isim: "level",
            zorunlu: true,
            aciklama: "Kullanıcının mevcut seviyesi"
        },
        {
            isim: "currentXP",
            zorunlu: true,
            aciklama: "Kullanıcının mevcut XP miktarı"
        },
        {
            isim: "requiredXP",
            zorunlu: true,
            aciklama: "Bir sonraki seviyeye geçmek için gereken XP miktarı"
        },
        {
            isim: "season",
            zorunlu: true,
            aciklama: "Mevcut sezon bilgisi / summer / winter / autumn / spring "
        }
    ]
};