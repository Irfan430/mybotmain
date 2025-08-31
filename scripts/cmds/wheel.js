const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "wheel",
    version: "3.1",
    author: "IRFAN",
    shortDescription: "🎡 Ultra-Stable Wheel Game",
    longDescription: "Guaranteed smooth spinning experience with automatic fail-safes",
    category: "Game",
    guide: {
      en: "{p}wheel <amount>"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { senderID, threadID } = event;
    let betAmount = 0;

    try {
      betAmount = this.sanitizeBetAmount(args[0]);
      if (!betAmount) {
        return api.sendMessage(
          `❌ Invalid bet amount! Usage: ${global.GoatBot.config.prefix}wheel 500`,
          threadID
        );
      }

      const user = await usersData.get(senderID);
      if (!this.isValidUserData(user)) {
        return api.sendMessage(
          "🔒 Account verification failed. Please contact support.",
          threadID
        );
      }

      if (betAmount > user.money) {
        return api.sendMessage(
          `❌ Insufficient balance! You have: ${this.formatMoney(user.money)}`,
          threadID
        );
      }

      // Send initial spinning message
      await api.sendMessage("🌀 Starting the wheel...", threadID);
      
      // Generate spinning animation frames
      const frames = await this.generateSpinningFrames();
      
      // Send each frame with a delay to simulate spinning
      for (let i = 0; i < frames.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 300));
        await api.sendMessage({
          body: i === frames.length - 1 ? "🎡 Wheel is stopping..." : "🌀 Wheel is spinning...",
          attachment: frames[i]
        }, threadID);
      }

      // Get the result
      const { result, winAmount } = await this.executeSpin(betAmount);
      const newBalance = user.money + winAmount;

      await usersData.set(senderID, { money: newBalance });

      // Generate final result canvas
      const resultCanvas = await this.generateResultCanvas(result, winAmount, betAmount, newBalance);
      
      return api.sendMessage({
        body: this.generateResultText(result, winAmount, betAmount, newBalance),
        attachment: resultCanvas
      }, threadID);

    } catch (error) {
      console.error("Wheel System Error:", error);
      return api.sendMessage(
        `🎡 System recovered! Your ${this.formatMoney(betAmount)} coins are safe. Try spinning again.`,
        threadID
      );
    }
  },

  sanitizeBetAmount: function(input) {
    const amount = parseInt(String(input || "").replace(/[^0-9]/g, ""));
    return amount > 0 ? amount : null;
  },

  isValidUserData: function(user) {
    return user && typeof user.money === "number" && user.money >= 0;
  },

  async executeSpin(betAmount) {
    const wheelSegments = [
      { emoji: "🍒", multiplier: 0.5, weight: 20, color: "#ff0000" },
      { emoji: "🍋", multiplier: 1, weight: 30, color: "#ffff00" },
      { emoji: "🍊", multiplier: 2, weight: 25, color: "#ffa500" }, 
      { emoji: "🍇", multiplier: 3, weight: 15, color: "#800080" },
      { emoji: "💎", multiplier: 5, weight: 7, color: "#00ffff" },
      { emoji: "💰", multiplier: 10, weight: 3, color: "#ffd700" }
    ];

    const totalWeight = wheelSegments.reduce((sum, seg) => sum + seg.weight, 0);
    const randomValue = Math.random() * totalWeight;
    let cumulativeWeight = 0;

    const result = wheelSegments.find(segment => {
      cumulativeWeight += segment.weight;
      return randomValue <= cumulativeWeight;
    }) || wheelSegments[0];

    const winAmount = Math.floor(betAmount * result.multiplier) - betAmount;

    return { result, winAmount };
  },

  generateResultText: function(result, winAmount, betAmount, newBalance) {
    const resultText = [
      `🎡 WHEEL STOPPED ON: ${result.emoji}`,
      "",
      this.getOutcomeText(result.multiplier, winAmount, betAmount),
      `💰 NEW BALANCE: ${this.formatMoney(newBalance)}`
    ].join("\n");

    return resultText;
  },

  getOutcomeText: function(multiplier, winAmount, betAmount) {
    if (multiplier < 1) return `❌ LOST: ${this.formatMoney(betAmount * 0.5)}`;
    if (multiplier === 1) return "➖ BROKE EVEN";
    return `✅ WON ${multiplier}X! (+${this.formatMoney(winAmount)})`;
  },

  formatMoney: function(amount) {
    const units = ["", "K", "M", "B"];
    let unitIndex = 0;
    
    while (amount >= 1000 && unitIndex < units.length - 1) {
      amount /= 1000;
      unitIndex++;
    }
    
    return amount.toFixed(amount % 1 ? 2 : 0) + units[unitIndex];
  },

  async generateSpinningFrames() {
    const wheelSegments = [
      { emoji: "🍒", multiplier: 0.5, weight: 20, color: "#ff0000" },
      { emoji: "🍋", multiplier: 1, weight: 30, color: "#ffff00" },
      { emoji: "🍊", multiplier: 2, weight: 25, color: "#ffa500" }, 
      { emoji: "🍇", multiplier: 3, weight: 15, color: "#800080" },
      { emoji: "💎", multiplier: 5, weight: 7, color: "#00ffff" },
      { emoji: "💰", multiplier: 10, weight: 3, color: "#ffd700" }
    ];

    const frames = [];
    const frameCount = 10; // Number of spinning frames
    
    for (let i = 0; i < frameCount; i++) {
      const canvas = createCanvas(500, 500);
      const ctx = canvas.getContext('2d');
      
      // Draw background
      ctx.fillStyle = '#0a0a2a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw wheel
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 200;
      
      // Draw wheel base
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#1a1a4a';
      ctx.fill();
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 5;
      ctx.stroke();
      
      // Draw segments with rotation for spinning effect
      const totalWeight = wheelSegments.reduce((sum, seg) => sum + seg.weight, 0);
      let startAngle = (i * 0.5) % (Math.PI * 2); // Rotate with each frame
      
      for (const segment of wheelSegments) {
        const sliceAngle = (segment.weight / totalWeight) * Math.PI * 2;
        const endAngle = startAngle + sliceAngle;
        
        // Draw segment
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = segment.color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw segment text
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + sliceAngle / 2);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 30px Arial';
        ctx.fillStyle = '#000000';
        ctx.fillText(segment.emoji, radius * 0.7, 0);
        ctx.fillText(`${segment.multiplier}x`, radius * 0.7, 30);
        ctx.restore();
        
        startAngle = endAngle;
      }
      
      // Draw wheel center
      ctx.beginPath();
      ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
      ctx.fillStyle = '#00ffff';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Draw pointer
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - radius - 20);
      ctx.lineTo(centerX - 15, centerY - radius + 10);
      ctx.lineTo(centerX + 15, centerY - radius + 10);
      ctx.closePath();
      ctx.fillStyle = '#ff0000';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Convert canvas to buffer
      const buffer = canvas.toBuffer('image/png');
      frames.push(buffer);
    }
    
    return frames;
  },

  async generateResultCanvas(result, winAmount, betAmount, newBalance) {
    const canvas = createCanvas(600, 500);
    const ctx = canvas.getContext('2d');
    
    // Draw background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0a0a2a');
    gradient.addColorStop(1, '#1a1a4a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw title
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = '#00ffff';
    ctx.textAlign = 'center';
    ctx.fillText('🎡 WHEEL OF FORTUNE 🎡', canvas.width / 2, 40);
    
    // Draw wheel
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 - 50;
    const radius = 150;
    
    // Draw wheel base
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a4a';
    ctx.fill();
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 5;
    ctx.stroke();
    
    // Draw winning segment highlighted
    const wheelSegments = [
      { emoji: "🍒", multiplier: 0.5, weight: 20, color: "#ff0000" },
      { emoji: "🍋", multiplier: 1, weight: 30, color: "#ffff00" },
      { emoji: "🍊", multiplier: 2, weight: 25, color: "#ffa500" }, 
      { emoji: "🍇", multiplier: 3, weight: 15, color: "#800080" },
      { emoji: "💎", multiplier: 5, weight: 7, color: "#00ffff" },
      { emoji: "💰", multiplier: 10, weight: 3, color: "#ffd700" }
    ];
    
    const totalWeight = wheelSegments.reduce((sum, seg) => sum + seg.weight, 0);
    let startAngle = 0;
    
    for (const segment of wheelSegments) {
      const sliceAngle = (segment.weight / totalWeight) * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;
      
      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      
      if (segment.emoji === result.emoji) {
        // Highlight winning segment
        ctx.fillStyle = this.lightenColor(segment.color, 50);
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 20;
      } else {
        ctx.fillStyle = segment.color;
        ctx.shadowBlur = 0;
      }
      
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw segment text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = '#000000';
      ctx.fillText(segment.emoji, radius * 0.7, 0);
      ctx.fillText(`${segment.multiplier}x`, radius * 0.7, 25);
      ctx.restore();
      
      startAngle = endAngle;
    }
    
    // Reset shadow
    ctx.shadowBlur = 0;
    
    // Draw wheel center
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
    ctx.fillStyle = '#00ffff';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw pointer
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius - 15);
    ctx.lineTo(centerX - 12, centerY - radius + 8);
    ctx.lineTo(centerX + 12, centerY - radius + 8);
    ctx.closePath();
    ctx.fillStyle = '#ff0000';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw result text
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`RESULT: ${result.emoji} ${result.multiplier}x`, centerX, centerY + radius + 40);
    
    // Draw outcome text
    ctx.font = '18px Arial';
    if (result.multiplier < 1) {
      ctx.fillStyle = '#ff0000';
      ctx.fillText(`LOST: ${this.formatMoney(betAmount * 0.5)}`, centerX, centerY + radius + 70);
    } else if (result.multiplier === 1) {
      ctx.fillStyle = '#ffff00';
      ctx.fillText('BROKE EVEN', centerX, centerY + radius + 70);
    } else {
      ctx.fillStyle = '#00ff00';
      ctx.fillText(`WON ${result.multiplier}X! (+${this.formatMoney(winAmount)})`, centerX, centerY + radius + 70);
    }
    
    // Draw balance
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#00ffff';
    ctx.fillText(`NEW BALANCE: ${this.formatMoney(newBalance)}`, centerX, centerY + radius + 100);
    
    // Convert canvas to buffer
    return canvas.toBuffer('image/png');
  },

  lightenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
    return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
  }
};
