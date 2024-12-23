const express = require('express');
const axios = require('axios');
const router = express.Router();

// API için ayarlar
const api = axios.create({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Origin': 'https://www.sofascore.com',
        'Referer': 'https://www.sofascore.com/'
    }
});

// Maçları getir
async function fetchMatches() {
    try {
        console.log('Fetching matches from Sofascore API...');
        const today = new Date().toISOString().split('T')[0];

        // Canlı maçları getir
        const liveResponse = await api.get(`https://api.sofascore.com/api/v1/sport/football/events/live`);
        let matches = [];

        if (liveResponse.data?.events?.length > 0) {
            matches = [...matches, ...liveResponse.data.events];
        }

        // Bugünkü planlanmış maçları getir
        const todayResponse = await api.get(`https://api.sofascore.com/api/v1/sport/football/scheduled-events/${today}`);
        if (todayResponse.data?.events?.length > 0) {
            matches = [...matches, ...todayResponse.data.events];
        }

        if (matches.length === 0) {
            return [];
        }

        return processMatches(matches);

    } catch (error) {
        console.error('Error fetching matches:', error.message);
        throw error;
    }
}

// Maçları işle
function processMatches(events) {
    const filteredEvents = events.filter(event => {
        const isTurkish = event.tournament?.category?.country?.name === 'Turkey' ||
                         event.tournament?.category?.country?.name === 'Türkiye' ||
                         event.tournament?.uniqueTournament?.category?.country?.name === 'Turkey' ||
                         event.tournament?.uniqueTournament?.category?.country?.name === 'Türkiye';
        return isTurkish;
    });

    return filteredEvents.map(event => ({
        id: event.id,
        startTime: new Date(event.startTimestamp * 1000).toISOString(),
        status: {
            type: event.status.type,
            description: event.status.description
        },
        tournament: {
            name: event.tournament.name,
            category: event.tournament.category.name,
            country: event.tournament.category.country?.name || 
                    event.tournament.uniqueTournament?.category?.country?.name || 
                    'Turkey'
        },
        homeTeam: {
            id: event.homeTeam.id,
            name: event.homeTeam.name,
            score: event.homeScore?.current || 0
        },
        awayTeam: {
            id: event.awayTeam.id,
            name: event.awayTeam.name,
            score: event.awayScore?.current || 0
        },
        odds: event.odds ? {
            homeWin: event.odds['1'] || null,
            draw: event.odds['X'] || null,
            awayWin: event.odds['2'] || null
        } : null,
        venue: event.venue ? {
            name: event.venue.name,
            city: event.venue.city?.name
        } : null
    }));
}

// API endpoint
router.get('/api/ligMaclari', async (req, res) => {
    try {
        const matches = await fetchMatches();
        res.json({
            success: true,
            data: matches
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = {
    isim: "Maç API",
    aciklama: "Canlı ve bugünkü maç bilgilerini JSON formatında döndürür.",
    link: "/api/ligMaclari",
    route: router,
    aktiflik: 'aktif'
};
