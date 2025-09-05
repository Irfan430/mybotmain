const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage, registerFont } = require('canvas');

// Try to register robotic-style fonts
try {
    registerFont(path.join(__dirname, 'fonts', 'Orbitron-Bold.ttf'), { family: 'Orbitron', weight: 'bold' });
    registerFont(path.join(__dirname, 'fonts', 'RobotoMono-Italic.ttf'), { family: 'Roboto Mono', style: 'italic' });
} catch (e) {
    console.log('Custom fonts not found, using default fonts');
}

// Utility function to draw rounded rectangles
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

// Utility function to format money with commas
function formatMoney(amount) {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Generate leaderboard canvas
async function generateLeaderboardCanvas(top) {
    const canvas = createCanvas(800, 500);
    const ctx = canvas.getContext('2d');
    
    // Draw futuristic background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#001a33');
    gradient.addColorStop(0.5, '#003366');
    gradient.addColorStop(1, '#000d1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw circuit patterns
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    
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

    // Draw circuit nodes
    for (let y = 40; y < canvas.height; y += 35) {
        for (let x = 40; x < canvas.width; x += 35) {
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#00ffff';
            ctx.fill();
        }
    }

    // Draw header
    ctx.font = 'bold 36px Orbitron, Arial';
    ctx.fillStyle = '#00ffff';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 TOP SPIN WINNERS', canvas.width/2, 50);

    // Draw leaderboard container
    const boxWidth = 700;
    const boxHeight = 350;
    const boxX = (canvas.width - boxWidth) / 2;
    const boxY = 80;
    
    ctx.fillStyle = 'rgba(0, 20, 40, 0.7)';
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 15);

    // Draw leaderboard entries
    ctx.font = 'bold 24px Orbitron, Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    
    const startY = boxY + 50;
    const lineHeight = 40;
    
    // Draw column headers
    ctx.fillText('RANK', boxX + 30, startY);
    ctx.fillText('PLAYER', boxX + 150, startY);
    ctx.fillText('TOTAL WINNINGS', boxX + 500, startY);
    
    // Draw separator line
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.moveTo(boxX + 20, startY + 15);
    ctx.lineTo(boxX + boxWidth - 20, startY + 15);
    ctx.stroke();
    
    // Draw top entries
    for (let i = 0; i < Math.min(top.length, 8); i++) {
        const user = top[i];
        const name = user.name || `User ${user.userID?.slice(-4) || "??"}`;
        const yPos = startY + 30 + (i * lineHeight);
        
        // Rank
        ctx.fillStyle = i < 3 ? ['#ffcc00', '#cccccc', '#cd7f32'][i] : '#ffffff';
        ctx.fillText(`${i + 1}.`, boxX + 30, yPos);
        
        // Player name
        ctx.fillStyle = '#ffffff';
        ctx.fillText(name.length > 20 ? name.substring(0, 20) + '...' : name, boxX + 150, yPos);
        
        // Winnings
        ctx.fillStyle = '#00ff00';
        ctx.fillText(formatMoney(user.data.totalSpinWin) + ' coins', boxX + 500, yPos);
    }

    // Draw footer
    ctx.font = 'italic 16px Roboto Mono, Arial';
    ctx.fillStyle = '#00aaaa';
    ctx.textAlign = 'center';
    ctx.fillText('Developed by IRFAN • Astra⚡Mind Robotic System', canvas.width / 2, boxY + boxHeight + 30);
    
    // Convert canvas to buffer
    const buffer = canvas.toBuffer('image/png');
    const pathSave = path.join(__dirname, 'tmp', `leaderboard_${Date.now()}.png`);
    
    // Ensure tmp directory exists
    if (!fs.existsSync(path.dirname(pathSave))) {
        fs.mkdirSync(path.dirname(pathSave), { recursive: true });
    }
    
    fs.writeFileSync(pathSave, buffer);
    
    return fs.createReadStream(pathSave);
}

module.exports = {
    config: {
        name: "spin",
        version: "5.1",
        author: "XNIL + Enhanced by IRFAN",
        countDown: 5,
        role: 0,
        description: "Spin and win/loss money with futuristic interface. Use '/spin <amount>' or '/spin top'.",
        category: "game",
        guide: {
            en: "{p}spin <amount>\n{p}spin top"
        }
    },

    onStart: async function ({ message, event, args, usersData, api }) {
        const senderID = event.senderID;
        const subCommand = args[0];

        // ✅ /spin top leaderboard
        if (subCommand === "top") {
            const allUsers = await usersData.getAll();

            const top = allUsers
                .filter(u => typeof u.data?.totalSpinWin === "number" && u.data.totalSpinWin > 0)
                .sort((a, b) => b.data.totalSpinWin - a.data.totalSpinWin)
                .slice(0, 10);

            if (top.length === 0) {
                return message.reply("❌ No spin winners yet.");
            }

            // Generate leaderboard canvas
            const leaderboardCanvas = await generateLeaderboardCanvas(top);
            
            const result = top.map((user, i) => {
                const name = user.name || `User ${user.userID?.slice(-4) || "??"}`;
                return `${i + 1}. ${name} – 💸 ${formatMoney(user.data.totalSpinWin)} coins`;
            }).join("\n");

            return message.reply({
                body: `🏆 Top Spin Winners:\n\n${result}`,
                attachment: leaderboardCanvas
            });
        }

        // ✅ /spin <amount>
        const betAmount = parseInt(subCommand);
        if (isNaN(betAmount) || betAmount <= 0) {
            return message.reply("❌ Usage:\n/spin <amount>\n/spin top");
        }

        const userData = await usersData.get(senderID) || {};
        userData.money = userData.money || 0;
        userData.data = userData.data || {};
        userData.data.totalSpinWin = userData.data.totalSpinWin || 0;

        if (userData.money < betAmount) {
            return message.reply(`❌ Not enough money.\n💰 Your balance: ${formatMoney(userData.money)}`);
        }

        // Get user info for canvas
        let userName = "Player";
        try {
            const userInfo = await api.getUserInfo(senderID);
            userName = userInfo[senderID].name || "Player";
        } catch (e) {
            console.error("Error getting user info:", e);
        }

        // Bet deduct
        userData.money -= betAmount;

        const outcomes = [
            { text: "💥 You lost everything!", multiplier: 0, type: "LOSS", color: "#ff5555", bgGradient: ["#300000", "#500000", "#200000"] },
            { text: "😞 You got back half.", multiplier: 0.5, type: "LOSS", color: "#ff5555", bgGradient: ["#300000", "#500000", "#200000"] },
            { text: "🟡 You broke even.", multiplier: 1, type: "NEUTRAL", color: "#ffff00", bgGradient: ["#303000", "#505000", "#202000"] },
            { text: "🟢 You doubled your money!", multiplier: 2, type: "WIN", color: "#00ff00", bgGradient: ["#003000", "#005000", "#002000"] },
            { text: "🔥 You tripled your bet!", multiplier: 3, type: "WIN", color: "#00ff00", bgGradient: ["#003000", "#005000", "#002000"] },
            { text: "🎉 JACKPOT! 10x reward!", multiplier: 10, type: "JACKPOT", color: "#ffcc00", bgGradient: ["#303000", "#505000", "#202000"] }
        ];

        const result = outcomes[Math.floor(Math.random() * outcomes.length)];
        const reward = Math.floor(betAmount * result.multiplier);
        userData.money += reward;

        if (reward > betAmount) {
            const profit = reward - betAmount;
            userData.data.totalSpinWin += profit;
        }

        await usersData.set(senderID, userData);

        // Generate spin result canvas with dynamic colors based on result
        const spinCanvas = await generateSpinCanvas(userName, betAmount, reward, result, userData.money);
        
        // Send both canvas and text message
        return message.reply({
            body: `${result.text}\n🎰 You bet: ${formatMoney(betAmount)}\n💸 You won: ${formatMoney(reward)}\n💰 New balance: ${formatMoney(userData.money)}`,
            attachment: spinCanvas
        }, event.threadID);
    }
};

// Generate spin result canvas with dynamic colors
async function generateSpinCanvas(userName, betAmount, reward, result, newBalance) {
    const canvas = createCanvas(800, 500);
    const ctx = canvas.getContext('2d');
    
    // Draw dynamic background based on result type
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, result.bgGradient[0]);
    gradient.addColorStop(0.5, result.bgGradient[1]);
    gradient.addColorStop(1, result.bgGradient[2]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw circuit patterns with dynamic colors
    ctx.strokeStyle = result.type === "JACKPOT" ? 'rgba(255, 204, 0, 0.15)' : 
                     result.type === "WIN" ? 'rgba(0, 255, 255, 0.15)' : 
                     result.type === "NEUTRAL" ? 'rgba(255, 255, 0, 0.15)' : 
                     'rgba(255, 85, 85, 0.15)';
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

    // Draw circuit nodes with dynamic colors
    for (let y = 40; y < canvas.height; y += 35) {
        for (let x = 40; x < canvas.width; x += 35) {
            // Outer glow
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = result.type === "JACKPOT" ? 'rgba(255, 204, 0, 0.3)' : 
                           result.type === "WIN" ? 'rgba(0, 255, 255, 0.3)' : 
                           result.type === "NEUTRAL" ? 'rgba(255, 255, 0, 0.3)' : 
                           'rgba(255, 85, 85, 0.3)';
            ctx.fill();
            
            // Inner node
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fillStyle = result.type === "JACKPOT" ? '#ffcc00' : 
                           result.type === "WIN" ? '#00ffff' : 
                           result.type === "NEUTRAL" ? '#ffff00' : 
                           '#ff5555';
            ctx.fill();
        }
    }

    // Draw data streams with dynamic colors
    for (let i = 0; i < 3; i++) {
        const startX = Math.random() * canvas.width;
        const startY = Math.random() * canvas.height;
        
        const streamGradient = ctx.createLinearGradient(startX, startY, startX + 200, startY + 200);
        streamGradient.addColorStop(0, result.type === "JACKPOT" ? 'rgba(255, 204, 0, 0)' : 
                                   result.type === "WIN" ? 'rgba(0, 255, 255, 0)' : 
                                   result.type === "NEUTRAL" ? 'rgba(255, 255, 0, 0)' : 
                                   'rgba(255, 85, 85, 0)');
        streamGradient.addColorStop(0.5, result.type === "JACKPOT" ? 'rgba(255, 204, 0, 0.6)' : 
                                    result.type === "WIN" ? 'rgba(0, 255, 255, 0.6)' : 
                                    result.type === "NEUTRAL" ? 'rgba(255, 255, 0, 0.6)' : 
                                    'rgba(255, 85, 85, 0.6)');
        streamGradient.addColorStop(1, result.type === "JACKPOT" ? 'rgba(255, 204, 0, 0)' : 
                                   result.type === "WIN" ? 'rgba(0, 255, 255, 0)' : 
                                   result.type === "NEUTRAL" ? 'rgba(255, 255, 0, 0)' : 
                                   'rgba(255, 85, 85, 0)');
        
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
    
    // Draw main header with dynamic colors
    ctx.font = 'bold 36px Orbitron, Arial';
    const titleText = '🎰 ASTRA⚡MIND SPIN GAME';
    
    // Text shadow
    ctx.fillStyle = result.type === "JACKPOT" ? 'rgba(255, 204, 0, 0.5)' : 
                   result.type === "WIN" ? 'rgba(0, 200, 255, 0.5)' : 
                   result.type === "NEUTRAL" ? 'rgba(255, 255, 0, 0.5)' : 
                   'rgba(255, 85, 85, 0.5)';
    ctx.fillText(titleText, canvas.width/2 - ctx.measureText(titleText).width/2 + 2, 52);
    
    // Main text
    ctx.fillStyle = result.type === "JACKPOT" ? '#ffcc00' : 
                   result.type === "WIN" ? '#00ffff' : 
                   result.type === "NEUTRAL" ? '#ffff00' : 
                   '#ff5555';
    ctx.fillText(titleText, canvas.width/2 - ctx.measureText(titleText).width/2, 50);

    // Draw info container with dynamic colors
    const boxWidth = 700;
    const boxHeight = 350;
    const boxX = (canvas.width - boxWidth) / 2;
    const boxY = 80;
    
    // Box background
    ctx.fillStyle = result.type === "JACKPOT" ? 'rgba(50, 40, 0, 0.7)' : 
                   result.type === "WIN" ? 'rgba(0, 20, 40, 0.7)' : 
                   result.type === "NEUTRAL" ? 'rgba(40, 40, 0, 0.7)' : 
                   'rgba(40, 0, 0, 0.7)';
    ctx.strokeStyle = result.type === "JACKPOT" ? '#ffcc00' : 
                     result.type === "WIN" ? '#00ffff' : 
                     result.type === "NEUTRAL" ? '#ffff00' : 
                     '#ff5555';
    ctx.lineWidth = 3;
    drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 15);
    
    // Container inner glow
    ctx.strokeStyle = result.type === "JACKPOT" ? 'rgba(255, 204, 0, 0.3)' : 
                     result.type === "WIN" ? 'rgba(0, 255, 255, 0.3)' : 
                     result.type === "NEUTRAL" ? 'rgba(255, 255, 0, 0.3)' : 
                     'rgba(255, 85, 85, 0.3)';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, boxX + 2, boxY + 2, boxWidth - 4, boxHeight - 4, 13);
    
    // Draw player info
    ctx.font = 'bold 22px Orbitron, Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(`👤 Player: ${userName}`, boxX + 20, boxY + 40);
    
    // Draw spin wheel visualization with dynamic colors
    const wheelRadius = 80;
    const wheelX = canvas.width / 2;
    const wheelY = boxY + 130;
    
    // Draw wheel background
    ctx.beginPath();
    ctx.arc(wheelX, wheelY, wheelRadius, 0, Math.PI * 2);
    ctx.fillStyle = result.type === "JACKPOT" ? '#3a3a1a' : 
                   result.type === "WIN" ? '#1a1a3a' : 
                   result.type === "NEUTRAL" ? '#3a3a1a' : 
                   '#3a1a1a';
    ctx.fill();
    ctx.strokeStyle = result.type === "JACKPOT" ? '#ffcc00' : 
                     result.type === "WIN" ? '#00ffff' : 
                     result.type === "NEUTRAL" ? '#ffff00' : 
                     '#ff5555';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw wheel segments with dynamic colors
    const segments = 6;
    const colors = result.type === "JACKPOT" ? 
        ['#ffcc00', '#ffaa00', '#ff8800', '#ff6600', '#ff4400', '#ff2200'] :
        result.type === "WIN" ? 
        ['#00ffff', '#00cccc', '#009999', '#006666', '#003333', '#0000ff'] :
        result.type === "NEUTRAL" ? 
        ['#ffff00', '#cccc00', '#999900', '#666600', '#333300', '#ffff00'] :
        ['#ff5555', '#cc4444', '#993333', '#662222', '#331111', '#ff0000'];
    
    for (let i = 0; i < segments; i++) {
        const startAngle = (i * 2 * Math.PI) / segments;
        const endAngle = ((i + 1) * 2 * Math.PI) / segments;
        
        ctx.beginPath();
        ctx.moveTo(wheelX, wheelY);
        ctx.arc(wheelX, wheelY, wheelRadius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = colors[i];
        ctx.fill();
        ctx.stroke();
    }
    
    // Draw wheel center
    ctx.beginPath();
    ctx.arc(wheelX, wheelY, 15, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = result.type === "JACKPOT" ? '#ffcc00' : 
                     result.type === "WIN" ? '#00ffff' : 
                     result.type === "NEUTRAL" ? '#ffff00' : 
                     '#ff5555';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw pointer
    ctx.beginPath();
    ctx.moveTo(wheelX + wheelRadius + 20, wheelY);
    ctx.lineTo(wheelX + wheelRadius + 5, wheelY - 10);
    ctx.lineTo(wheelX + wheelRadius + 5, wheelY + 10);
    ctx.closePath();
    ctx.fillStyle = result.type === "JACKPOT" ? '#ffcc00' : 
                   result.type === "WIN" ? '#00ffff' : 
                   result.type === "NEUTRAL" ? '#ffff00' : 
                   '#ff5555';
    ctx.fill();
    
    // Draw result type with different colors
    ctx.font = 'bold 32px Orbitron, Arial';
    ctx.fillStyle = result.color;
    ctx.textAlign = 'center';
    ctx.fillText(result.type, canvas.width / 2, boxY + 220);
    
    // Draw bet and win information
    ctx.font = 'bold 20px Orbitron, Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    
    const infoLines = [
        `💰 Bet: ${formatMoney(betAmount)} coins`,
        `🎯 Result: ${reward >= 0 ? '+' : ''}${formatMoney(reward)} coins`,
        `💎 New Balance: ${formatMoney(newBalance)} coins`
    ];
    
    const lineHeight = 30;
    const startY = boxY + 260;
    
    infoLines.forEach((line, i) => {
        ctx.fillText(line, boxX + 20, startY + (i * lineHeight));
    });
    
    // Draw footer
    ctx.font = 'italic 16px Roboto Mono, Arial';
    ctx.fillStyle = result.type === "JACKPOT" ? '#ffcc00' : 
                   result.type === "WIN" ? '#00aaaa' : 
                   result.type === "NEUTRAL" ? '#aaaa00' : 
                   '#aa5555';
    ctx.textAlign = 'center';
    ctx.fillText('Developed by IRFAN • Astra⚡Mind Robotic System', canvas.width / 2, boxY + boxHeight + 30);
    
    // Convert canvas to buffer
    const buffer = canvas.toBuffer('image/png');
    const pathSave = path.join(__dirname, 'tmp', `spin_${Date.now()}.png`);
    
    // Ensure tmp directory exists
    if (!fs.existsSync(path.dirname(pathSave))) {
        fs.mkdirSync(path.dirname(pathSave), { recursive: true });
    }
    
    fs.writeFileSync(pathSave, buffer);
    
    return fs.createReadStream(pathSave);
}