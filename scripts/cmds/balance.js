const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage, registerFont } = require('canvas');
const { getPrefix } = global.utils;

// Try to register robotic-style fonts
try {
    registerFont(path.join(__dirname, 'fonts', 'Orbitron-Bold.ttf'), { family: 'Orbitron', weight: 'bold' });
    registerFont(path.join(__dirname, 'fonts', 'RobotoMono-Italic.ttf'), { family: 'Roboto Mono', style: 'italic' });
} catch (e) {
    console.log('Custom fonts not found, using default fonts');
}

module.exports = {
    config: {
        name: "balance",
        aliases: ["bal", "money"],
        version: "2.0",
        author: "IRFAN",
        countDown: 5,
        role: 0,
        shortDescription: "Check your balance with style",
        longDescription: "Check your current balance with a futuristic robotic interface",
        category: "Economy",
        guide: {
            en: "{pn} or {pn} @mention"
        }
    },

    onStart: async function ({ event, message, usersData, args, api }) {
        try {
            let targetID;
            let targetName;
            
            if (Object.keys(event.mentions).length > 0) {
                targetID = Object.keys(event.mentions)[0];
                targetName = event.mentions[targetID];
            } else {
                targetID = event.senderID;
                targetName = "Your";
            }
            
            const userData = await usersData.get(targetID);
            const balance = userData.money;
            
            // Get user info for avatar
            let userName = "User";
            try {
                const userInfo = await api.getUserInfo(targetID);
                userName = userInfo[targetID].name || "User";
            } catch (e) {
                console.error("Error getting user info:", e);
            }
            
            // Generate balance canvas
            const balanceCanvas = await generateBalanceCanvas(userName, balance, targetID);
            
            return message.reply({
                body: `💰 ${targetName} Balance Information`,
                attachment: balanceCanvas
            });
            
        } catch (error) {
            console.error(error);
            return message.reply("❌ An error occurred while fetching balance information.");
        }
    }
};

async function generateBalanceCanvas(userName, balance, userID) {
    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext('2d');
    
    // Draw futuristic background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#001125');
    gradient.addColorStop(0.5, '#001933');
    gradient.addColorStop(1, '#000d1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw advanced circuit patterns
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    
    // Draw grid lines
    for (let y = 40; y < canvas.height; y += 35) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    for (let x = 40; x < canvas.width; x += 35) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    // Draw circuit nodes with glow effect
    for (let y = 40; y < canvas.height; y += 35) {
        for (let x = 40; x < canvas.width; x += 35) {
            // Outer glow
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
            ctx.fill();
            
            // Inner node
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#00ffff';
            ctx.fill();
        }
    }

    // Draw data streams
    for (let i = 0; i < 3; i++) {
        const startX = Math.random() * canvas.width;
        const startY = Math.random() * canvas.height;
        
        const streamGradient = ctx.createLinearGradient(startX, startY, startX + 200, startY + 200);
        streamGradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
        streamGradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.6)');
        streamGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
        
        ctx.strokeStyle = streamGradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.bezierCurveTo(
            startX + 100, startY - 50,
            startX + 150, startY + 100,
            startX + 200, startY + 50
        );
        ctx.stroke();
    }
    
    // Draw main header
    ctx.font = 'bold 36px Orbitron, Arial';
    const titleText = '💎 ASTRA⚡MIND BALANCE SYSTEM';
    
    // Text shadow
    ctx.fillStyle = 'rgba(0, 200, 255, 0.5)';
    ctx.fillText(titleText, canvas.width/2 - ctx.measureText(titleText).width/2 + 2, 52);
    
    // Main text
    ctx.fillStyle = '#00ffff';
    ctx.fillText(titleText, canvas.width/2 - ctx.measureText(titleText).width/2, 50);
    
    // Draw info container
    const boxWidth = 700;
    const boxHeight = 250;
    const boxX = (canvas.width - boxWidth) / 2;
    const boxY = 80;
    
    // Box background
    ctx.fillStyle = 'rgba(0, 20, 40, 0.7)';
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 15);
    
    // Container inner glow
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, boxX + 2, boxY + 2, boxWidth - 4, boxHeight - 4, 13);
    
    // Draw user avatar
    try {
        const avatarUrl = `https://graph.facebook.com/${userID}/picture?width=200&height=200&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const avatar = await loadImage(avatarUrl);
        
        // Draw avatar in circle with glow effect
        ctx.save();
        
        // Outer glow
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(boxX + 80, boxY + boxHeight / 2, 50, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
        ctx.fill();
        
        // Avatar clip
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(boxX + 80, boxY + boxHeight / 2, 45, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, boxX + 35, boxY + boxHeight / 2 - 45, 90, 90);
        
        // Avatar border
        ctx.beginPath();
        ctx.arc(boxX + 80, boxY + boxHeight / 2, 45, 0, Math.PI * 2);
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.restore();
    } catch (error) {
        console.error('Error loading avatar:', error);
        // Draw placeholder if image fails to load
        ctx.beginPath();
        ctx.arc(boxX + 80, boxY + boxHeight / 2, 45, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 50, 100, 0.5)';
        ctx.fill();
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.font = 'bold 16px Orbitron, Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('No Image', boxX + 80, boxY + boxHeight / 2 + 5);
    }
    
    // Draw user info
    ctx.font = 'bold 22px Orbitron, Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    
    const infoLines = [
        `👤 User: ${userName}`,
        `💰 Balance: ${balance.toLocaleString()} coins`,
        `📊 Status: ${balance > 1000 ? 'Wealthy' : balance > 100 ? 'Moderate' : 'Low'}`
    ];
    
    const lineHeight = 40;
    const startY = boxY + 50;
    
    infoLines.forEach((line, i) => {
        // Text glow effect
        ctx.fillStyle = 'rgba(0, 200, 255, 0.4)';
        ctx.fillText(line, boxX + 150 + 1, startY + (i * lineHeight) + 1);
        
        // Main text
        ctx.fillStyle = i === 2 ? (balance > 1000 ? '#00ff00' : balance > 100 ? '#ffff00' : '#ff5555') : '#ffffff';
        ctx.fillText(line, boxX + 150, startY + (i * lineHeight));
    });
    
    // Draw balance visualization
    const maxBarWidth = 400;
    const barHeight = 20;
    const barX = boxX + 150;
    const barY = boxY + 170;
    
    // Background bar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(barX, barY, maxBarWidth, barHeight);
    
    // Progress bar (capped at 5000 for visualization)
    const progressWidth = Math.min((balance / 5000) * maxBarWidth, maxBarWidth);
    const barGradient = ctx.createLinearGradient(barX, barY, barX + progressWidth, barY);
    barGradient.addColorStop(0, '#00ffaa');
    barGradient.addColorStop(1, '#00aaff');
    ctx.fillStyle = barGradient;
    ctx.fillRect(barX, barY, progressWidth, barHeight);
    
    // Bar border
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, maxBarWidth, barHeight);
    
    // Bar labels
    ctx.font = '14px Orbitron, Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('0', barX - 15, barY + 15);
    ctx.fillText('5K', barX + maxBarWidth + 5, barY + 15);
    
    // Draw footer
    ctx.font = 'italic 16px Roboto Mono, Arial';
    ctx.fillStyle = '#00aaaa';
    ctx.textAlign = 'center';
    ctx.fillText('Developed by IRFAN • Astra⚡Mind Robotic System', canvas.width / 2, boxY + boxHeight + 40);
    
    // Convert canvas to buffer
    const buffer = canvas.toBuffer('image/png');
    const pathSave = path.join(__dirname, 'tmp', `balance_${userID}.png`);
    
    // Ensure tmp directory exists
    if (!fs.existsSync(path.dirname(pathSave))) {
        fs.mkdirSync(path.dirname(pathSave), { recursive: true });
    }
    
    fs.writeFileSync(pathSave, buffer);
    
    return fs.createReadStream(pathSave);
}

// Helper function to draw rounded rectangles
function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}