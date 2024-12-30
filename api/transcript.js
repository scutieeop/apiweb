const express = require('express');
const { YoutubeTranscript } = require('youtube-transcript');
const router = express.Router();

const CACHE_DURATION = 5 * 60 * 1000;
const cache = new Map();

// Desteklenen diller
const SUPPORTED_LANGUAGES = {
    'tr': { code: 'tr', name: 'Türkçe', country: 'TR' },
    'en': { code: 'en', name: 'English', country: 'US' },
    'de': { code: 'de', name: 'Deutsch', country: 'DE' },
    'es': { code: 'es', name: 'Español', country: 'ES' },
    'fr': { code: 'fr', name: 'Français', country: 'FR' },
    'it': { code: 'it', name: 'Italiano', country: 'IT' },
    'ja': { code: 'ja', name: '日本語', country: 'JP' },
    'ko': { code: 'ko', name: '한국어', country: 'KR' },
    'ru': { code: 'ru', name: 'Русский', country: 'RU' }
};

const cleanCache = () => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
            cache.delete(key);
        }
    }
};

setInterval(cleanCache, CACHE_DURATION);

const extractVideoId = (url) => {
    try {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        return urlParams.get('v');
    } catch (error) {
        return null;
    }
};

const apiRouter = express.Router();

// Dil listesi endpoint'i
apiRouter.get('/api/transcript/languages', (req, res) => {
    res.json({
        success: true,
        data: SUPPORTED_LANGUAGES
    });
});

apiRouter.get('/api/transcript', async (req, res) => {
    try {
        const { url, lang = 'en' } = req.query;
        
        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'Video URL gerekli'
            });
        }

        // Dil kontrolü
        if (!SUPPORTED_LANGUAGES[lang]) {
            return res.status(400).json({
                success: false,
                error: 'Desteklenmeyen dil kodu',
                supportedLanguages: Object.keys(SUPPORTED_LANGUAGES)
            });
        }

        const videoId = extractVideoId(url);
        if (!videoId) {
            return res.status(400).json({
                success: false,
                error: 'Geçersiz YouTube URL'
            });
        }

        const cacheKey = `transcript_${videoId}_${lang}`;
        const cachedData = cache.get(cacheKey);
        
        if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
            return res.json({
                success: true,
                source: 'cache',
                data: cachedData.data,
                timestamp: new Date(cachedData.timestamp).toISOString()
            });
        }

        const langConfig = SUPPORTED_LANGUAGES[lang];
        const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
            lang: langConfig.code,
            country: langConfig.country
        });

        const result = {
            videoId,
            language: langConfig.name,
            languageCode: lang,
            transcript
        };

        cache.set(cacheKey, {
            timestamp: Date.now(),
            data: result
        });

        res.json({
            success: true,
            source: 'fresh',
            data: result,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Transcript Error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            status: 500
        });
    }
});

module.exports = {
    isim: "YouTube Transcript API",
    aciklama: "YouTube videolarının transkriptlerini getirir",
    link: "/api/transcript",
    route: apiRouter,
    aktiflik: 'aktif',
    parametreler: [
        {
            isim: "url",
            zorunlu: true,
            aciklama: "YouTube video URL'si"
        },
        {
            isim: "lang",
            zorunlu: false,
            aciklama: "Transkript dili (varsayılan: en)",
            degerler: Object.keys(SUPPORTED_LANGUAGES)
        }
    ]
};
