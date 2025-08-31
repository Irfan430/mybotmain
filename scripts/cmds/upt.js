const os = require("os");
const axios = require("axios");
const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "uptime",
    version: "3.1",
    author: "IRFAN",
    role: 0,
    shortDescription: "Show advanced bot uptime info",
    longDescription: "Display advanced system statistics with performance metrics with robotic style canvas",
    category: "system",
    guide: "{pn}",
    aliases: ["upt"]
  },

  onStart: async function ({ message, threadsData }) {
    try {
      // Uptime calculation
      const uptime = process.uptime();
      const days = Math.floor(uptime / (60 * 60 * 24));
      const hours = Math.floor((uptime % (60 * 60 * 24)) / (60 * 60));
      const minutes = Math.floor((uptime % (60 * 60)) / 60);
      const seconds = Math.floor(uptime % 60);
      const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

      // System info
      const cpu = os.cpus()[0].model;
      const cores = os.cpus().length;
      const platform = os.platform();
      const arch = os.arch();
      const nodeVersion = process.version;
      const hostname = os.hostname();

      // Memory info
      const totalMem = os.totalmem() / 1024 / 1024 / 1024;
      const freeMem = os.freemem() / 1024 / 1024 / 1024;
      const usedMem = totalMem - freeMem;
      const memoryUsage = (usedMem / totalMem) * 100;

      // Performance metrics
      const loadAvg = os.loadavg();
      const cpuLoad = (loadAvg[0] / cores * 100).toFixed(2);

      // Bot info
      const prefix = global.GoatBot.config?.PREFIX || "/";
      const totalThreads = await threadsData.getAll().then(t => t.length);
      const totalCommands = global.GoatBot.commands.size;

      // Network info
      const networkInterfaces = os.networkInterfaces();
      const ipAddress = Object.values(networkInterfaces)
        .flat()
        .find(i => i.family === 'IPv4' && !i.internal)?.address || 'Not Available';

      // Create canvas
      const canvas = createCanvas(800, 600);
      const ctx = canvas.getContext('2d');

      // Draw background with robotic style
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#0a0a2a');
      gradient.addColorStop(1, '#1a1a4a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw circuit board pattern
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      
      // Horizontal lines
      for (let y = 50; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      
      // Vertical lines
      for (let x = 50; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Draw nodes at intersections
      for (let y = 50; y < canvas.height; y += 40) {
        for (let x = 50; x < canvas.width; x += 40) {
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fillStyle = '#00ffff';
          ctx.fill();
        }
      }

      // Draw title
      ctx.font = 'bold 36px Arial';
      ctx.fillStyle = '#00ffff';
      ctx.textAlign = 'center';
      ctx.fillText('ASTRA⚡MIND V3 STATUS', canvas.width / 2, 60);

      // Draw robot icon
      drawRobotIcon(ctx, canvas.width / 2, 130);

      // Draw info boxes
      const boxWidth = 700;
      const boxHeight = 350;
      const boxX = (canvas.width - boxWidth) / 2;
      const boxY = 180;

      // Box background
      ctx.fillStyle = 'rgba(0, 20, 40, 0.7)';
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 10);

      // Draw info text
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';

      const infoLines = [
        `⏰  Uptime: ${uptimeString}`,
        `🔧  CPU: ${shortenText(cpu, 30)} (${cores} cores)`,
        `📊  CPU Load: ${cpuLoad}%`,
        `🧠  RAM: ${usedMem.toFixed(2)}GB/${totalMem.toFixed(2)}GB (${memoryUsage.toFixed(1)}%)`,
        `${getProgressBar(memoryUsage, 20)}`,
        `💾  Platform: ${platform} (${arch})`,
        `🌐  IP Address: ${ipAddress}`,
        `🖥️  Hostname: ${hostname}`,
        `📦  Node.js: ${nodeVersion}`,
        `🤖  Threads: ${totalThreads}`,
        `📝  Commands: ${totalCommands}`,
        `⚡  Prefix: ${prefix}`
      ];

      const lineHeight = 28;
      const startY = boxY + 40;

      infoLines.forEach((line, i) => {
        ctx.fillText(line, boxX + 20, startY + (i * lineHeight));
      });

      // Draw footer
      ctx.font = 'italic 16px Arial';
      ctx.fillStyle = '#00aaaa';
      ctx.textAlign = 'center';
      ctx.fillText('Developed by IRFAN • Robotic System Monitor', canvas.width / 2, boxY + boxHeight + 30);

      // Convert canvas to buffer and send as attachment
      const buffer = canvas.toBuffer('image/png');
      const pathSave = path.join(__dirname, 'tmp', 'uptime_canvas.png');
      
      // Ensure tmp directory exists
      if (!fs.existsSync(path.dirname(pathSave))) {
        fs.mkdirSync(path.dirname(pathSave), { recursive: true });
      }
      
      fs.writeFileSync(pathSave, buffer);
      
      message.reply({
        body: "🤖 ASTRA⚡MIND V3 Status Report:",
        attachment: fs.createReadStream(pathSave)
      });

    } catch (error) {
      console.error('Error in uptime command:', error);
      message.reply("❌ An error occurred while generating system information canvas.");
    }
  }
};

// Helper function to draw rounded rectangles
function roundRect(ctx, x, y, width, height, radius) {
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

// Helper function to draw a simple robot icon
function drawRobotIcon(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  
  // Head
  ctx.fillStyle = '#00ffff';
  ctx.fillRect(-25, -40, 50, 40);
  
  // Eyes
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(-10, -25, 5, 0, Math.PI * 2);
  ctx.arc(10, -25, 5, 0, Math.PI * 2);
  ctx.fill();
  
  // Antenna
  ctx.strokeStyle = '#00ffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -40);
  ctx.lineTo(0, -55);
  ctx.stroke();
  
  // Antenna tip
  ctx.fillStyle = '#ff0000';
  ctx.beginPath();
  ctx.arc(0, -55, 3, 0, Math.PI * 2);
  ctx.fill();
  
  // Body
  ctx.fillStyle = '#0066aa';
  ctx.fillRect(-30, 0, 60, 50);
  
  // Details
  ctx.strokeStyle = '#00ffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(-25, 10, 50, 15);
  ctx.strokeRect(-25, 30, 50, 15);
  
  ctx.restore();
}

// Progress bar generator
function getProgressBar(percent, length) {
  const filled = Math.round(length * percent / 100);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty) + ` ${percent.toFixed(1)}%`;
}

// Helper function to shorten long text
function shortenText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
