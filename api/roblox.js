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

// API endpoint işleyicisi
router.get('/api/roblox-profile', async (req, res) => {
    try {
        const username = req.query.username;

        if (!username) {
            return res.status(400).json({
                error: 'Kullanıcı adı (username) parametresi gerekli',
                status: 400
            });
        }

        // Önbellekte varsa, önbellekten döndür
        const cachedData = cache.get(username);
        if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
            return res.json(cachedData.data);
        }

        // Roblox API'den kullanıcı bilgilerini al
        const userResponse = await axios.get(`https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(username)}&limit=1`, {
            timeout: 5000,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Custom-Roblox-Profile-API/1.0'
            }
        });

        const user = userResponse.data.data[0];

        if (!user) {
            return res.status(404).json({
                error: 'Bu kullanıcı adıyla eşleşen bir profil bulunamadı',
                status: 404
            });
        }

        // Ek kullanıcı detaylarını al
        const userDetailsResponse = await axios.get(`https://users.roblox.com/v1/users/${user.id}`, {
            timeout: 5000,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Custom-Roblox-Profile-API/1.0'
            }
        });

        // Kullanıcı profil bilgilerini oluştur
        const userProfile = {
            success: true,
            data: {
                id: user.id,
                username: user.name,
                displayName: user.displayName,
                description: userDetailsResponse.data.description || 'Bir açıklama bulunamadı',
                created: new Date(user.created).toISOString(),
                isBanned: userDetailsResponse.data.isBanned || false,
                avatarUrls: {
                    headshot: `https://www.roblox.com/headshot-thumbnail/image?userId=${user.id}&width=420&height=420&format=png`,
                    fullBody: `https://www.roblox.com/avatar-thumbnail/image?userId=${user.id}&width=420&height=420&format=png`
                },
                profileUrl: `https://www.roblox.com/users/${user.id}/profile`
            },
            timestamp: new Date().toISOString()
        };

        // Önbelleğe kaydet
        cache.set(username, {
            timestamp: Date.now(),
            data: userProfile
        });

        res.json(userProfile);
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
    isim: "Roblox Profil Bilgisi API",
    aciklama: "Bir kullanıcı adı ile detaylı Roblox profil bilgilerini döndürür (?username=kullanıcıadı)",
    link: "/api/roblox-profile",
    route: router,
    aktiflik: 'pasif'
};