const express = require('express');
const app = express();

app.use(express.json()); // JSON gövdesini işlemek için gerekli

app.post('/api/map/draw', (req, res) => {
    const { type, coordinates, options } = req.body;

    if (!type || !coordinates || !options) {
        return res.status(400).json({ error: "Eksik parametreler" });
    }

    // İşlemler burada yapılır
    console.log("Gelen veri:", req.body);

    res.status(200).json({ message: "Harita başarıyla çizildi", data: req.body });
});

// Sunucu başlatılıyor
app.listen(3001, () => {
    console.log('Sunucu 3000 portunda çalışıyor');
});
