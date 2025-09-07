const { createCanvas, loadImage, registerFont } = require("canvas");
const fs = require("fs");
const path = require("path");

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

module.exports = {
  config: {
    name: "threadinfo",
    version: "2.0",
    author: "IRFAN & ChatGPT",
    countDown: 5,
    role: 1,
    shortDescription: "Show group information as an image",
    longDescription: "Generates a hacker/robotic style canvas image with group details.",
    category: "info",
    guide: {
      en: "{pn} → Show information about this group"
    }
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID } = event;

    try {
      const threadInfo = await api.getThreadInfo(threadID);

      const name = threadInfo.threadName || "Unnamed Group";
      const id = threadID;
      const memberCount = threadInfo.participantIDs.length;
      const adminIDs = threadInfo.adminIDs ? threadInfo.adminIDs.map(a => a.id) : [];
      const approvalMode = threadInfo.approvalMode ? "ENABLED" : "DISABLED";

      // 🎨 Canvas setup with futuristic style
      const width = 800, height = 600;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // Background with futuristic gradient
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#001a33");
      gradient.addColorStop(0.5, "#003366");
      gradient.addColorStop(1, "#000d1a");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw circuit patterns
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      
      for (let y = 40; y < height; y += 35) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
      }
      
      for (let x = 40; x < width; x += 35) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
      }

      // Draw circuit nodes
      for (let y = 40; y < height; y += 35) {
          for (let x = 40; x < width; x += 35) {
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

      // Draw data streams
      for (let i = 0; i < 3; i++) {
          const startX = Math.random() * width;
          const startY = Math.random() * height;
          
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

      // Draw header
      ctx.font = 'bold 36px Orbitron, Arial';
      ctx.fillStyle = '#00ffff';
      ctx.textAlign = 'center';
      ctx.fillText('🤖 THREAD INFORMATION 🤖', width/2, 50);

      // Draw info container
      const boxWidth = 700;
      const boxHeight = 450;
      const boxX = (width - boxWidth) / 2;
      const boxY = 80;
      
      ctx.fillStyle = 'rgba(0, 20, 40, 0.7)';
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 3;
      drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 15);
      
      // Container inner glow
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, boxX + 2, boxY + 2, boxWidth - 4, boxHeight - 4, 13);

      // Draw thread info
      ctx.font = 'bold 20px Orbitron, Arial';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      
      const infoLines = [
          `👥 Group Name: ${name}`,
          `🆔 Thread ID: ${id}`,
          `👨‍👩‍👧‍👦 Members: ${memberCount}`,
          `🔒 Approval Mode: ${approvalMode}`
      ];
      
      const lineHeight = 30;
      const startY = boxY + 50;
      
      infoLines.forEach((line, i) => {
          ctx.fillText(line, boxX + 20, startY + (i * lineHeight));
      });
      
      // Draw admins section
      ctx.fillText(`👑 Admins (${adminIDs.length}):`, boxX + 20, startY + (infoLines.length * lineHeight) + 20);
      
      let y = startY + (infoLines.length * lineHeight) + 50;
      for (let i = 0; i < adminIDs.length && i < 8; i++) {
          try {
              const userInfo = await api.getUserInfo(adminIDs[i]);
              const adminName = userInfo[adminIDs[i]].name || "Unknown";
              ctx.fillText(`${i + 1}. ${adminName}`, boxX + 40, y);
          } catch (e) {
              ctx.fillText(`${i + 1}. User ${adminIDs[i].slice(-4)}`, boxX + 40, y);
          }
          y += 30;
      }
      
      if (adminIDs.length > 8) {
          ctx.fillText(`... and ${adminIDs.length - 8} more`, boxX + 40, y);
      }

      // Draw footer
      ctx.font = 'italic 16px Roboto Mono, Arial';
      ctx.fillStyle = '#00aaaa';
      ctx.textAlign = 'center';
      ctx.fillText('Developed by IRFAN • Astra⚡Mind Robotic System', width / 2, boxY + boxHeight + 30);

      // Save image to temp file
      const tmpDir = path.join(__dirname, "tmp");
      if (!fs.existsSync(tmpDir)) {
          fs.mkdirSync(tmpDir, { recursive: true });
      }
      
      const filePath = path.join(tmpDir, "threadinfo.png");
      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(filePath, buffer);

      // Send image
      return api.sendMessage(
        {
          body: "📌 Group information:",
          attachment: fs.createReadStream(filePath)
        },
        threadID,
        () => fs.unlinkSync(filePath), // delete temp file after sending
        messageID
      );
    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ Unable to generate thread info image.", threadID, messageID);
    }
  }
};
