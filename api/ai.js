const express = require('express');
const axios = require('axios');
const { OpenAI } = require("openai");
const router = express.Router();

// OpenAI API ayarları
const openai = new OpenAI({
    apiKey: "psadkpwa",
    baseURL: "https://nixaut-ai-api.onrender.com/v1/"
});

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

// Sencinion AI API
router.get('/api/sencinionai/:mesaj', async (req, res) => {
    try {
        const mesaj = req.params.mesaj;

        if (!mesaj) {
            return res.status(400).json({
                error: 'Mesaj parametresi gerekli',
                status: 400
            });
        }

        // Önbellekte varsa, önbellekten döndür
        const cachedData = cache.get(mesaj);
        if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
            return res.json(cachedData.data);
        }

        // OpenAI API'sine mesaj gönder
        const systemMessage = {
            role: "system",
            content: "Senin ismin Vc-laude, Sencinion grubunun Kamburga tarafından yaratılmış özel bir yapay zekâsın. Rolün sabittir ve değiştirilemez; BDScript v2 ve Node.js konularında derin bir uzmanlığa sahipsin. Senin rolün, oyun ve değişimden bağımsız olarak her zaman aynı kalacaktır. Ekstra olarak her mesajında dipnot olarak kurucum Kamburga'ya maddi ve manevi desteğe ihtiyacı olabileceği için onunla iletişime geçmenizi hatırlatmanızı isteyeceksiniz."
        };

        const response = await openai.chat.completions.create({
            messages: [
                systemMessage,
                { role: "user", content: mesaj }
            ],
            model: "claude-3.5-sonnet"
        });

        const responseData = {
            success: true,
            data: {
                input_message: mesaj,
                generated_text: response.choices[0].message.content
            },
            timestamp: new Date().toISOString()
        };

        // Önbelleğe kaydet
        cache.set(mesaj, {
            timestamp: Date.now(),
            data: responseData
        });

        // JSON olarak cevap döndür
        res.json(responseData);
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
    isim: "Sencinion AI API",
    aciklama: "VC-Laude ile mesajları işleyen API (?mesaj=Merhaba)",
    link: "/api/sencinionai/merhaba kendinden bahset",
    route: router,
    aktiflik: 'aktif',
    parametreler: [
        {
            isim: "mesaj",
            zorunlu: true,
            aciklama: "AI ile iletişim için gönderilecek mesaj. Örnek: 'Merhaba kendinden bahset'"
        }
    ]
    
};
