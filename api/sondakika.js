const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');
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

// Axios için özel HTTPS agentı
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

// Haber çekme fonksiyonu
const scrapeNews = async () => {
    const config = {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive'
        },
        timeout: 10000,
        httpsAgent
    };

    const response = await axios.get('https://www.sondakika.com/', config);
    const html = response.data;
    const $ = cheerio.load(html);

    const articles = [];

    $('ul#bxsliderid > li').each((index, element) => {
        if (index >= 20) return false;

        const $element = $(element);
        const titleElement = $element.find('a[title]');
        const title = titleElement.attr('title')?.trim();
        const link = titleElement.attr('href');
        const imgElement = $element.find('img');
        const image = imgElement.attr('data-original') || imgElement.attr('src');
        const description = $element.find('label').text().trim();
        const publishTime = $element.find('span.ssaat').text().trim();

        if (title && link) {
            articles.push({
                title,
                link: link.startsWith('/') ? `https://www.sondakika.com${link}` : link,
                image: image || null,
                description: description || null,
                publishDate: publishTime || new Date().toISOString()
            });
        }
    });

    return articles;
};

// API endpoint
router.get('/api/sondakika-news', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const cacheKey = `news_${limit}`;

        // Cache kontrolü
        const cachedData = cache.get(cacheKey);
        if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
            return res.json({
                success: true,
                source: 'cache',
                data: cachedData.data.slice(0, limit),
                timestamp: new Date(cachedData.timestamp).toISOString()
            });
        }

        // Yeni veri çek
        const articles = await scrapeNews();

        // Cache'e kaydet
        cache.set(cacheKey, {
            timestamp: Date.now(),
            data: articles
        });

        // Response
        res.json({
            success: true,
            source: 'fresh',
            data: articles.slice(0, limit),
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        const statusCode = error.response?.status || 500;
        const errorMessage = error.response?.data?.message || error.message || 'Bir hata oluştu';

        res.status(statusCode).json({
            success: false,
            error: errorMessage,
            status: statusCode
        });
    }
});

// Health check endpoint
router.get('/api/sondakika-news/health', (req, res) => {
    res.json({
        status: 'UP',
        cache: {
            size: cache.size,
            entries: Array.from(cache.keys())
        },
        timestamp: new Date().toISOString()
    });
});

// Modül dışa aktarma
module.exports = {
    isim: "Son Dakika Haber API",
    aciklama: "SonDakika.com sitesinden güncel haberleri getirir. Limit parametresi ile haber sayısı sınırlanabilir (?limit=10)",
    link: "/api/sondakika-news",
    route: router,
    aktiflik: 'aktif'
};
