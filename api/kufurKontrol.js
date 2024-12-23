const express = require('express');
const stringSimilarity = require('string-similarity');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

// Cache için değişkenler ve ayarlar
const CACHE_DURATION = 5 * 60 * 1000; // 5 dakika
const cache = new Map();
let gizliKufurListesi = []; // Boş liste ile başlat

// Küfür listesini dosyadan oku
async function kufurListesiniYukle() {
    try {
        const dosyaYolu = path.join('./gerekli', 'kufurliste.txt');
        const veri = await fs.readFile(dosyaYolu, 'utf8');
        gizliKufurListesi = veri.split('\n')
            .map(kelime => kelime.trim()) // Boşlukları temizle
            .filter(kelime => kelime.length > 0); // Boş satırları filtrele
        
        console.log('Küfür listesi başarıyla yüklendi. Liste uzunluğu:', gizliKufurListesi.length);
    } catch (error) {
        console.error('Küfür listesi yüklenirken hata oluştu:', error);
        // Varsayılan listeyi kullan
    }
}

// Uygulama başladığında listeyi yükle
kufurListesiniYukle();

// Her 1 saatte bir listeyi tekrar yükle (güncelleme için)
setInterval(kufurListesiniYukle, 60 * 60 * 1000);

// Cache temizleme yardımcı fonksiyonu
const cleanCache = () => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
            cache.delete(key);
        }
    }
};

// Periyodik cache temizleme
setInterval(cleanCache, CACHE_DURATION);

// Benzerlik kontrolü yapan yardımcı fonksiyon
function kufurBenzerlikKontrol(kelime) {
    kelime = kelime.toLowerCase();
    
    for (const kufur of gizliKufurListesi) {
        const benzerlikOrani = stringSimilarity.compareTwoStrings(kelime, kufur);
        if (benzerlikOrani >= 0.8) {
            return {
                eslesme: true,
                benzerlikOrani: benzerlikOrani
            };
        }
    }
    
    return {
        eslesme: false,
        benzerlikOrani: 0
    };
}

// API endpoint işleyicisi
router.get('/api/kufurKontrol/:kelime', (req, res) => {
    try {
        const kelime = req.params.kelime;

        if (!kelime) {
            return res.status(400).json({
                error: 'Kelime parametresi gerekli',
                status: 400
            });
        }

        // Cache kontrol
        const cachedResult = cache.get(kelime);
        if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_DURATION) {
            return res.json(cachedResult.data);
        }

        // Kelimeyi kontrol et
        const kontrolSonucu = kufurBenzerlikKontrol(kelime);

        // Sonuç objesi
        const result = {
            success: true,
            data: {
                metin: kelime,
                kufurMu: kontrolSonucu.eslesme,
                benzerlikOrani: Math.round(kontrolSonucu.benzerlikOrani * 100) / 100,
                kontrolZamani: new Date().toISOString()
            },
            timestamp: new Date().toISOString()
        };

        // Sonucu cache'e kaydet
        cache.set(kelime, {
            timestamp: Date.now(),
            data: result
        });

        res.json(result);

    } catch (error) {
        const statusCode = error.response?.status || 500;
        const errorMessage = error.message || 'Bir hata oluştu';

        res.status(statusCode).json({
            error: errorMessage,
            status: statusCode
        });
    }
});

// Liste yenileme endpoint'i (opsiyonel, güvenlik önlemleri eklenebilir)
router.post('/api/kufurKontrol/yenile', async (req, res) => {
    try {
        await kufurListesiniYukle();
        res.json({
            success: true,
            message: 'Küfür listesi yenilendi',
            listeUzunlugu: gizliKufurListesi.length
        });
    } catch (error) {
        res.status(500).json({
            error: 'Liste yenilenirken hata oluştu',
            status: 500
        });
    }
});

// Hata yakalama middleware
router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Sunucu hatası oluştu',
        status: 500,
        message: err.message
    });
});

// Modül dışa aktarma
module.exports = {
    isim: "Küfür Kontrolü API",
    aciklama: "Verilen kelimeyi küfür içeriği açısından kontrol eder",
    link: "/api/kufurKontrol",
    route: router,
    aktiflik: 'pasif'
};
