const express = require('express');
const router = express.Router();

const sehirler = [
    {
        isim: "İstanbul",
        bolge: "Marmara",
        nufus: 15840900,
        plaka: "34"
    },
    {
        isim: "Ankara",
        bolge: "İç Anadolu",
        nufus: 5747325,
        plaka: "06"
    },
    {
        isim: "İzmir",
        bolge: "Ege",
        nufus: 4439372,
        plaka: "35"
    },
    {
        isim: "Bursa",
        bolge: "Marmara",
        nufus: 3147818,
        plaka: "16"
    },
    {
        isim: "Antalya",
        bolge: "Akdeniz",
        nufus: 2619832,
        plaka: "07"
    },
    {
        isim: "Adana",
        bolge: "Akdeniz",
        nufus: 2258718,
        plaka: "01"
    },
    {
        isim: "Konya",
        bolge: "İç Anadolu",
        nufus: 2277017,
        plaka: "42"
    },
    {
        isim: "Gaziantep",
        bolge: "Güneydoğu Anadolu",
        nufus: 2130432,
        plaka: "27"
    },
    {
        isim: "Şanlıurfa",
        bolge: "Güneydoğu Anadolu",
        nufus: 2115256,
        plaka: "63"
    },
    {
        isim: "Kocaeli",
        bolge: "Marmara",
        nufus: 2033441,
        plaka: "41"
    }
];

// API endpoint işleyicisi
router.get('/api/random-city', async (req, res) => {
    try {
        const bolge = req.query.bolge;
        let uygunSehirler = [...sehirler];

        // Eğer bölge parametresi varsa, sadece o bölgedeki şehirleri filtrele
        if (bolge) {
            uygunSehirler = sehirler.filter(sehir => 
                sehir.bolge.toLowerCase() === bolge.toLowerCase()
            );
            
            if (uygunSehirler.length === 0) {
                throw new Error('Bu bölgede şehir bulunamadı');
            }
        }

        // Rastgele bir şehir seç
        const rastgeleSehir = uygunSehirler[
            Math.floor(Math.random() * uygunSehirler.length)
        ];

        res.json(rastgeleSehir);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// API bilgileri ve route'u dışa aktar
module.exports = {
    isim: "Rastgele Şehir API",
    aciklama: "Türkiye'nin büyük şehirlerinden rastgele bir şehir döndürür. Bölge parametresi ile filtrelenebilir (?bolge=Marmara gibi)",
    link: "/api/random-city",
    route: router,
    aktiflik: 'aktif' // veya 'pasif' olarak ayarlanabilir
};


