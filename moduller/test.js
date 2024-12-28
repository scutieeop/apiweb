const Canvas = require('canvas');
const path = require('path');
const fs = require('fs');

class LevelCard {
    constructor() {
        this.canvas = Canvas.createCanvas(934, 282);
        this.ctx = this.canvas.getContext('2d');
    }

    // Varsayılan avatar oluştur
    createDefaultAvatar(size) {
        const tempCanvas = Canvas.createCanvas(size, size);
        const tempCtx = tempCanvas.getContext('2d');

        // Arka plan
        tempCtx.fillStyle = '#36393f';
        tempCtx.fillRect(0, 0, size, size);

        // Varsayılan kullanıcı ikonu
        tempCtx.fillStyle = '#72767d';
        tempCtx.beginPath();
        // Baş kısmı
        tempCtx.arc(size/2, size/2 - size/12, size/4, 0, Math.PI * 2);
        tempCtx.fill();
        // Vücut kısmı
        tempCtx.beginPath();
        tempCtx.arc(size/2, size/2 + size/3, size/3, 0, Math.PI * 2);
        tempCtx.fill();

        return tempCanvas;
    }

    // Avatar yükleme fonksiyonu
    async loadAvatar(url) {
        try {
            if (!url) {
                return this.createDefaultAvatar(200);
            }

            const avatar = await Canvas.loadImage(url).catch(() => null);
            if (!avatar) {
                return this.createDefaultAvatar(200);
            }
            return avatar;
        } catch (error) {
            console.error('Avatar yüklenirken hata oluştu:', error);
            return this.createDefaultAvatar(200);
        }
    }

    // Arka plan desenini oluştur
    async createBackground(season) {
        const backgrounds = {
            winter: {
                primary: '#1a365d',
                secondary: '#2a4365',
                pattern: '❄️',
                gradientColors: ['#2c5282', '#2b6cb0']
            },
            autumn: {
                primary: '#7b341e',
                secondary: '#9c4221',
                pattern: '🍂',
                gradientColors: ['#c05621', '#dd6b20']
            },
            spring: {
                primary: '#22543d',
                secondary: '#276749',
                pattern: '🌸',
                gradientColors: ['#2f855a', '#38a169']
            },
            summer: {
                primary: '#744210',
                secondary: '#975a16',
                pattern: '☀️',
                gradientColors: ['#d69e2e', '#ecc94b']
            }
        };

        const theme = backgrounds[season] || backgrounds.winter;

        // Gradyan arka plan
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, 0);
        gradient.addColorStop(0, theme.gradientColors[0]);
        gradient.addColorStop(1, theme.gradientColors[1]);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Dekoratif desenler
        this.ctx.fillStyle = theme.secondary;
        this.ctx.globalAlpha = 0.1;
        for (let i = 0; i < 20; i++) {
            this.ctx.beginPath();
            this.ctx.arc(
                Math.random() * this.canvas.width,
                Math.random() * this.canvas.height,
                Math.random() * 50,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;
    }

    // Kullanıcı bilgilerini ekle
    async drawUserInfo(username, avatarURL) {
        // Avatar yükleme
        const avatar = await this.loadAvatar(avatarURL);

        // Avatar çerçevesi
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(140, 141, 100, 0, Math.PI * 2);
        this.ctx.lineWidth = 10;
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.stroke();
        this.ctx.closePath();
        this.ctx.clip();

        // Avatar çizimi
        this.ctx.drawImage(avatar, 40, 41, 200, 200);
        this.ctx.restore();

        // Kullanıcı adı
        this.ctx.font = 'bold 40px Arial';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(username, 280, 150);
    }

    // Level bar ve XP bilgilerini ekle
    drawLevelBar(currentXP, requiredXP, level) {
        const barWidth = 534;
        const barHeight = 30;
        const barX = 280;
        const barY = 180;

        // XP Bar arka planı
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.beginPath();
        this.ctx.roundRect(barX, barY, barWidth, barHeight, 15);
        this.ctx.fill();

        // XP progress
        const progress = Math.min((currentXP / requiredXP) * barWidth, barWidth);
        const gradient = this.ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, '#c3dafe');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.roundRect(barX, barY, progress, barHeight, 15);
        this.ctx.fill();

        // Level ve XP text
        this.ctx.font = 'bold 25px Arial';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(`Level ${level}`, barX, barY - 10);
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`${currentXP} / ${requiredXP} XP`, barX + barWidth - 150, barY + 50);
    }

    // Dekoratif detaylar ekle
    addDecorations(season) {
        const decorations = {
            winter: ['❄️', '🌨️', '⛄'],
            autumn: ['🍂', '🍁', '🌰'],
            spring: ['🌸', '🌺', '🌷'],
            summer: ['☀️', '🌴', '🌊']
        };

        const emojis = decorations[season] || decorations.winter;
        
        // Dekoratif emojiler
        this.ctx.font = '30px Arial';
        emojis.forEach((emoji, index) => {
            this.ctx.fillText(emoji, 830, 100 + (index * 50));
        });
    }

    // Kartı oluştur
    async generateCard(options = {}) {
        const {
            username = 'User',
            avatarURL = null,
            level = 1,
            currentXP = 0,
            requiredXP = 100,
            season = 'winter'
        } = options;

        await this.createBackground(season);
        await this.drawUserInfo(username, avatarURL);
        this.drawLevelBar(currentXP, requiredXP, level);
        this.addDecorations(season);

        return this.canvas;
    }

    // Kartı kaydet
    async saveCard(outputPath = 'level-card.png') {
        const buffer = this.canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
        return outputPath;
    }
}

module.exports = LevelCard;

// Kullanım örneği:
/*
const levelCard = new LevelCard();

// Avatar URL'si ile kullanım
levelCard.generateCard({
    username: 'CoolUser',
    avatarURL: 'https://cdn.discordapp.com/avatars/USER_ID/AVATAR_HASH.png',
    level: 5,
    currentXP: 750,
    requiredXP: 1000,
    season: 'winter'
}).then(async (canvas) => {
    await levelCard.saveCard('user-level-card.png');
    console.log('Level kartı oluşturuldu!');
});

// Avatar URL'si olmadan kullanım
levelCard.generateCard({
    username: 'NewUser',
    level: 1,
    currentXP: 50,
    requiredXP: 100,
    season: 'summer'
}).then(async (canvas) => {
    await levelCard.saveCard('new-user-card.png');
    console.log('Level kartı oluşturuldu!');
});
*/