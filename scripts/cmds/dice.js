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

module.exports = {
  config: {
    name: "dice",
    version: "2.0",
    author: "xnil6x + Enhanced by IRFAN",
    shortDescription: "🎲 Dice Game | Bet & win coins with style!",
    longDescription: "Bet coins and roll the dice with a futuristic robotic interface. Dice value decides your fate.",
    category: "Game",
    guide: {
      en: "{p}dice <bet amount>\nExample: {p}dice 1000"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { senderID, threadID } = event;
    const userData = await usersData.get(senderID);

    if (!userData || userData.money === undefined) {
      return api.sendMessage("❌ Account issue! Please try again later.", threadID);
    }

    const betAmount = parseInt(args[0]);

    if (isNaN(betAmount) || betAmount <= 0) {
      return api.sendMessage("⚠️ Invalid usage!\nUse like: {p}dice <bet amount>\nExample: {p}dice 1000", threadID);
    }

    if (betAmount > userData.money) {
      return api.sendMessage(`❌ You only have ${formatMoney(userData.money)} coins!`, threadID);
    }

    const diceRoll = Math.floor(Math.random() * 6) + 1;
    let resultMessage = "";
    let winAmount = 0;
    let resultType = "";

    switch (diceRoll) {
      case 1:
      case 2:
        winAmount = -betAmount;
        resultMessage = `❌ You lost!\nLost: ${formatMoney(betAmount)} coins`;
        resultType = "LOSS";
        break;
      case 3:
        winAmount = betAmount * 2;
        resultMessage = `✅ You won DOUBLE!\nWon: +${formatMoney(winAmount)} coins`;
        resultType = "WIN";
        break;
      case 4:
      case 5:
        winAmount = betAmount * 3;
        resultMessage = `✅ You won TRIPLE!\nWon: +${formatMoney(winAmount)} coins`;
        resultType = "WIN";
        break;
      case 6:
        winAmount = betAmount * 10;
        resultMessage = `🎉 JACKPOT! Rolled 6\nWon: +${formatMoney(winAmount)} coins`;
        resultType = "JACKPOT";
        break;
    }

    // Update user balance
    await usersData.set(senderID, {
      money: userData.money + winAmount
    });

    // Get user info for the canvas
    let userName = "Player";
    try {
      const userInfo = await api.getUserInfo(senderID);
      userName = userInfo[senderID].name || "Player";
    } catch (e) {
      console.error("Error getting user info:", e);
    }

    // Generate dice canvas
    const diceCanvas = await generateDiceCanvas(userName, diceRoll, betAmount, winAmount, resultType, userData.money + winAmount);
    
    // Send both canvas and text message
    return api.sendMessage({
      body: `🎲 ${userName}'s Dice Roll Result:\n${resultMessage}\n💰 New Balance: ${formatMoney(userData.money + winAmount)} coins`,
      attachment: diceCanvas
    }, threadID);
  }
};

// Generate dice canvas function
async function generateDiceCanvas(userName, diceRoll, betAmount, winAmount, resultType, newBalance) {
  const canvas = createCanvas(800, 500);
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
  const titleText = '🎲 ASTRA⚡MIND DICE GAME';
  
  // Text shadow
  ctx.fillStyle = 'rgba(0, 200, 255, 0.5)';
  ctx.fillText(titleText, canvas.width/2 - ctx.measureText(titleText).width/2 + 2, 52);
  
  // Main text
  ctx.fillStyle = '#00ffff';
  ctx.fillText(titleText, canvas.width/2 - ctx.measureText(titleText).width/2, 50);

  // Draw info container
  const boxWidth = 700;
  const boxHeight = 350;
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
  
  // Draw player info
  ctx.font = 'bold 22px Orbitron, Arial';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText(`👤 Player: ${userName}`, boxX + 20, boxY + 40);
  
  // Draw dice visualization
  const diceSize = 80;
  const diceX = boxX + (boxWidth - diceSize) / 2;
  const diceY = boxY + 70;
  
  // Draw dice background
  ctx.fillStyle = '#1a1a3a';
  ctx.strokeStyle = '#00ffff';
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, diceX, diceY, diceSize, diceSize, 10);
  
  // Draw dice dots based on the roll
  ctx.fillStyle = '#00ffff';
  const dotRadius = 8;
  const dotPositions = {
    1: [[diceSize/2, diceSize/2]],
    2: [[diceSize/4, diceSize/4], [3*diceSize/4, 3*diceSize/4]],
    3: [[diceSize/4, diceSize/4], [diceSize/2, diceSize/2], [3*diceSize/4, 3*diceSize/4]],
    4: [[diceSize/4, diceSize/4], [3*diceSize/4, diceSize/4], [diceSize/4, 3*diceSize/4], [3*diceSize/4, 3*diceSize/4]],
    5: [[diceSize/4, diceSize/4], [3*diceSize/4, diceSize/4], [diceSize/2, diceSize/2], [diceSize/4, 3*diceSize/4], [3*diceSize/4, 3*diceSize/4]],
    6: [[diceSize/4, diceSize/4], [3*diceSize/4, diceSize/4], [diceSize/4, diceSize/2], [3*diceSize/4, diceSize/2], [diceSize/4, 3*diceSize/4], [3*diceSize/4, 3*diceSize/4]]
  };
  
  dotPositions[diceRoll].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(diceX + x, diceY + y, dotRadius, 0, Math.PI * 2);
    ctx.fill();
  });
  
  // Draw roll result text
  ctx.font = 'bold 28px Orbitron, Arial';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(`You rolled: ${diceRoll}`, canvas.width / 2, boxY + 180);
  
  // Draw result type with different colors
  let resultColor = '#00ff00'; // Default green for wins
  if (resultType === "LOSS") resultColor = '#ff5555';
  if (resultType === "JACKPOT") resultColor = '#ffcc00';
  
  ctx.font = 'bold 32px Orbitron, Arial';
  ctx.fillStyle = resultColor;
  ctx.fillText(resultType, canvas.width / 2, boxY + 220);
  
  // Draw bet and win information
  ctx.font = 'bold 20px Orbitron, Arial';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  
  const infoLines = [
    `💰 Bet: ${formatMoney(betAmount)} coins`,
    `🎯 Result: ${winAmount >= 0 ? '+' : ''}${formatMoney(winAmount)} coins`,
    `💎 New Balance: ${formatMoney(newBalance)} coins`
  ];
  
  const lineHeight = 30;
  const startY = boxY + 250;
  
  infoLines.forEach((line, i) => {
    ctx.fillText(line, boxX + 20, startY + (i * lineHeight));
  });
  
  // Draw footer
  ctx.font = 'italic 16px Roboto Mono, Arial';
  ctx.fillStyle = '#00aaaa';
  ctx.textAlign = 'center';
  ctx.fillText('Developed by IRFAN • Astra⚡Mind Robotic System', canvas.width / 2, boxY + boxHeight + 30);
  
  // Convert canvas to buffer
  const buffer = canvas.toBuffer('image/png');
  const pathSave = path.join(__dirname, 'tmp', `dice_${Date.now()}.png`);
  
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

// Money formatting function
function formatMoney(num) {
  if (num >= 1e15) return (num / 1e15).toFixed(2).replace(/\.00$/, "") + "Q";
  if (num >= 1e12) return (num / 1e12).toFixed(2).replace(/\.00$/, "") + "T";
  if (num >= 1e9) return (num / 1e9).toFixed(2).replace(/\.00$/, "") + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2).replace(/\.00$/, "") + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(2).replace(/\.00$/, "") + "K";
  return num.toString();
}