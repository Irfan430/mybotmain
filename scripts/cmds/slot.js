const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "slots",
    aliases: ["slot", "spin"],
    version: "1.3",
    author: "IRFAN", // Changed author to IRFAN
    countDown: 3,
    role: 0,
    description: "🎰 Ultra-stylish slot machine with balanced odds",
    category: "game",
    guide: {
      en: "Use: {pn} [bet amount]"
    }
  },

  onStart: async function ({ message, event, args, usersData }) {
    const { senderID } = event;
    const bet = parseInt(args[0]);

    // Enhanced money formatting with colors
    const formatMoney = (amount) => {
      if (isNaN(amount)) return "💲0";
      amount = Number(amount);
      const scales = [
        { value: 1e15, suffix: 'Q', color: '🌈' },  // Quadrillion
        { value: 1e12, suffix: 'T', color: '✨' },  // Trillion
        { value: 1e9, suffix: 'B', color: '💎' },  // Billion
        { value: 1e6, suffix: 'M', color: '💰' },   // Million
        { value: 1e3, suffix: 'k', color: '💵' }    // Thousand
      ];
      const scale = scales.find(s => amount >= s.value);
      if (scale) {
        const scaledValue = amount / scale.value;
        return `${scale.color}${scaledValue.toFixed(2)}${scale.suffix}`;
      }
      return `💲${amount.toLocaleString()}`;
    };

    if (isNaN(bet) || bet <= 0) {
      return message.reply("🔴 𝗘𝗥𝗥𝗢𝗥: Please enter a valid bet amount!");
    }

    const user = await usersData.get(senderID);
    if (user.money < bet) {
      return message.reply(`🔴 𝗜𝗡𝗦𝗨𝗙𝗙𝗜𝗖𝗜𝗘𝗡𝗧 𝗙𝗨𝗡𝗗𝗦: You need ${formatMoney(bet - user.money)} more to play!`);
    }

    // Premium symbols with different weights
    const symbols = [
      { emoji: "🍒", weight: 30, color: "#ff0000" },
      { emoji: "🍋", weight: 25, color: "#ffff00" },
      { emoji: "🍇", weight: 20, color: "#800080" },
      { emoji: "🍉", weight: 15, color: "#ff4500" },
      { emoji: "⭐", weight: 7, color: "#ffff00" },
      { emoji: "7️⃣", weight: 3, color: "#ffd700" }
    ];

    // Weighted random selection
    const roll = () => {
      const totalWeight = symbols.reduce((sum, symbol) => sum + symbol.weight, 0);
      let random = Math.random() * totalWeight;
      for (const symbol of symbols) {
        if (random < symbol.weight) return symbol;
        random -= symbol.weight;
      }
      return symbols[0];
    };

    const slot1 = roll();
    const slot2 = roll();
    const slot3 = roll();

    // 50% chance to win with various multipliers
    let winnings = 0;
    let outcome;
    let winType = "";
    let bonus = "";
    let jackpot = false;

    if (slot1.emoji === "7️⃣" && slot2.emoji === "7️⃣" && slot3.emoji === "7️⃣") {
      winnings = bet * 10;
      outcome = "🔥 𝗠𝗘𝗚𝗔 𝗝𝗔𝗖𝗞𝗣𝗢𝗧! 𝗧𝗥𝗜𝗣𝗟𝗘 7️⃣!";
      winType = "💎 𝗠𝗔𝗫 𝗪𝗜𝗡";
      bonus = "🎆 𝗕𝗢𝗡𝗨𝗦: +3% to your total balance!";
      jackpot = true;
      await usersData.set(senderID, { money: user.money * 1.03 + winnings });
    } 
    else if (slot1.emoji === slot2.emoji && slot2.emoji === slot3.emoji) {
      winnings = bet * 5;
      outcome = "💰 𝗝𝗔𝗖𝗞𝗣𝗢𝗧! 3 matching symbols!";
      winType = "💫 𝗕𝗜𝗚 𝗪𝗜𝗡";
      await usersData.set(senderID, { money: user.money + winnings });
    } 
    else if (slot1.emoji === slot2.emoji || slot2.emoji === slot3.emoji || slot1.emoji === slot3.emoji) {
      winnings = bet * 2;
      outcome = "✨ 𝗡𝗜𝗖𝗘! 2 matching symbols!";
      winType = "🌟 𝗪𝗜𝗡";
      await usersData.set(senderID, { money: user.money + winnings });
    } 
    else if (Math.random() < 0.5) { // 50% base chance to win something
      winnings = bet * 1.5;
      outcome = "🎯 𝗟𝗨𝗖𝗞𝗬 𝗦𝗣𝗜𝗡! Bonus win!";
      winType = "🍀 𝗦𝗠𝗔𝗟𝗟 𝗪𝗜𝗡";
      await usersData.set(senderID, { money: user.money + winnings });
    } 
    else {
      winnings = -bet;
      outcome = "💸 𝗕𝗘𝗧𝗧𝗘𝗥 𝗟𝗨𝗖𝗞 𝗡𝗘𝗫𝗧 𝗧𝗜𝗠𝗘!";
      winType = "☠️ 𝗟𝗢𝗦𝗦";
      await usersData.set(senderID, { money: user.money + winnings });
    }

    const finalBalance = user.money + winnings;
    
    // Generate the slot machine canvas
    const canvasBuffer = await this.generateSlotCanvas(slot1, slot2, slot3, bet, winnings, outcome, finalBalance, jackpot);
    
    // Send the result with the canvas
    return message.reply({
      body: `🎰 𝗦𝗟𝗢𝗧 𝗠𝗔𝗖𝗛𝗜𝗡𝗘 𝗥𝗘𝗦𝗨𝗟𝗧\n\n${outcome}\n${winType}\n${bonus || ''}\n💰 𝗕𝗔𝗟𝗔𝗡𝗖𝗘: ${formatMoney(finalBalance)}`,
      attachment: canvasBuffer
    });
  },

  generateSlotCanvas: async function(slot1, slot2, slot3, bet, winnings, outcome, finalBalance, jackpot) {
    const canvas = createCanvas(600, 400);
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
    ctx.fillText('🎰 SLOT MACHINE 🎰', canvas.width / 2, 40);
    
    // Draw slot machine frame
    ctx.fillStyle = '#2a2a5a';
    ctx.fillRect(50, 70, 500, 200);
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(50, 70, 500, 200);
    
    // Draw slot windows
    const slotWidth = 120;
    const slotHeight = 120;
    const slotY = 90;
    
    // Slot 1
    ctx.fillStyle = '#000000';
    ctx.fillRect(100, slotY, slotWidth, slotHeight);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(100, slotY, slotWidth, slotHeight);
    
    // Slot 2
    ctx.fillRect(240, slotY, slotWidth, slotHeight);
    ctx.strokeRect(240, slotY, slotWidth, slotHeight);
    
    // Slot 3
    ctx.fillRect(380, slotY, slotWidth, slotHeight);
    ctx.strokeRect(380, slotY, slotWidth, slotHeight);
    
    // Draw symbols
    ctx.font = 'bold 50px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Slot 1 symbol
    ctx.fillStyle = slot1.color;
    ctx.fillText(slot1.emoji, 100 + slotWidth/2, slotY + slotHeight/2);
    
    // Slot 2 symbol
    ctx.fillStyle = slot2.color;
    ctx.fillText(slot2.emoji, 240 + slotWidth/2, slotY + slotHeight/2);
    
    // Slot 3 symbol
    ctx.fillStyle = slot3.color;
    ctx.fillText(slot3.emoji, 380 + slotWidth/2, slotY + slotHeight/2);
    
    // Draw result text
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = winnings >= 0 ? '#00ff00' : '#ff0000';
    ctx.fillText(outcome, canvas.width / 2, slotY + slotHeight + 40);
    
    // Draw bet and winnings
    ctx.font = '18px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`BET: ${this.formatMoney(bet)}`, canvas.width / 2, slotY + slotHeight + 70);
    
    if (winnings >= 0) {
      ctx.fillStyle = '#00ff00';
      ctx.fillText(`WINNINGS: +${this.formatMoney(winnings)}`, canvas.width / 2, slotY + slotHeight + 100);
    } else {
      ctx.fillStyle = '#ff0000';
      ctx.fillText(`LOSS: ${this.formatMoney(-winnings)}`, canvas.width / 2, slotY + slotHeight + 100);
    }
    
    // Draw balance
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#00ffff';
    ctx.fillText(`BALANCE: ${this.formatMoney(finalBalance)}`, canvas.width / 2, slotY + slotHeight + 130);
    
    // Draw jackpot effect if applicable
    if (jackpot) {
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = '#ffd700';
      ctx.fillText('🎆 JACKPOT! 🎆', canvas.width / 2, 30);
      
      // Draw sparkles
      for (let i = 0; i < 10; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffff00';
        ctx.fill();
      }
    }
    
    // Draw footer
    ctx.font = 'italic 14px Arial';
    ctx.fillStyle = '#00aaaa';
    ctx.fillText('Developed by IRFAN • Astra⚡Mind System', canvas.width / 2, canvas.height - 10);
    
    // Convert canvas to buffer
    const buffer = canvas.toBuffer('image/png');
    const pathSave = path.join(__dirname, 'tmp', 'slot_result.png');
    
    // Ensure tmp directory exists
    if (!fs.existsSync(path.dirname(pathSave))) {
      fs.mkdirSync(path.dirname(pathSave), { recursive: true });
    }
    
    fs.writeFileSync(pathSave, buffer);
    
    return fs.createReadStream(pathSave);
  },

  formatMoney: function(amount) {
    const units = ["", "K", "M", "B"];
    let unitIndex = 0;
    
    while (amount >= 1000 && unitIndex < units.length - 1) {
      amount /= 1000;
      unitIndex++;
    }
    
    return amount.toFixed(amount % 1 ? 2 : 0) + units[unitIndex];
  }
};
