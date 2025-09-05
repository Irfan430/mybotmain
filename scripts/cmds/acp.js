const moment = require("moment-timezone");
const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs-extra');
const path = require('path');

// Try to register fonts
try {
    registerFont(path.join(__dirname, 'fonts', 'Orbitron-Bold.ttf'), { family: 'Orbitron', weight: 'bold' });
    registerFont(path.join(__dirname, 'fonts', 'RobotoMono-Italic.ttf'), { family: 'Roboto Mono', style: 'italic' });
} catch (e) {
    console.log('Custom fonts not found, using default fonts');
}

module.exports = {
  config: {
    name: "accept",
    aliases: ['acp'],
    version: "2.0",
    author: "xnil6x + Enhanced by IRFAN",
    countDown: 8,
    role: 2,
    shortDescription: "Manage friend requests with style",
    longDescription: "Accept or reject friend requests with a sleek interface and profile preview",
    category: "Utility",
    guide: {
      en: "{pn} [add|del|info] [number|all]"
    }
  },

  onReply: async function ({ message, Reply, event, api, commandName }) {
    const { author, listRequest, messageID } = Reply;
    if (author !== event.senderID) return;
    const args = event.body.trim().toLowerCase().split(/\s+/);

    clearTimeout(Reply.unsendTimeout);

    // Handle info command to show user profile
    if (args[0] === "info") {
      const stt = args[1];
      if (!stt || isNaN(stt)) {
        return api.sendMessage("❌ Please provide a valid request number.", event.threadID, event.messageID);
      }

      const user = listRequest[parseInt(stt) - 1];
      if (!user) {
        return api.sendMessage(`❌ Can't find request #${stt}`, event.threadID, event.messageID);
      }

      try {
        // Generate profile info canvas
        const profileCanvas = await this.generateProfileCanvas(user);
        return message.reply({
          body: `📋 Profile Information for Request #${stt}`,
          attachment: profileCanvas
        });
      } catch (error) {
        console.error(error);
        return api.sendMessage("❌ Failed to generate profile information.", event.threadID, event.messageID);
      }
    }

    const form = {
      av: api.getCurrentUserID(),
      fb_api_caller_class: "RelayModern",
      variables: {
        input: {
          source: "friends_tab",
          actor_id: api.getCurrentUserID(),
          client_mutation_id: Math.round(Math.random() * 19).toString()
        },
        scale: 3,
        refresh_num: 0
      }
    };

    const success = [];
    const failed = [];

    if (args[0] === "add") {
      form.fb_api_req_friendly_name = "FriendingCometFriendRequestConfirmMutation";
      form.doc_id = "3147613905362928";
    }
    else if (args[0] === "del") {
      form.fb_api_req_friendly_name = "FriendingCometFriendRequestDeleteMutation";
      form.doc_id = "4108254489275063";
    }
    else {
      return api.sendMessage("❌ Invalid command. Usage: <add|del|info> <number|all>", event.threadID, event.messageID);
    }

    let targetIDs = args.slice(1);

    if (args[1] === "all") {
      targetIDs = Array.from({ length: listRequest.length }, (_, i) => i + 1);
    }

    const newTargetIDs = [];
    const promiseFriends = [];

    for (const stt of targetIDs) {
      const user = listRequest[parseInt(stt) - 1];
      if (!user) {
        failed.push(`🚫 Can't find request #${stt}`);
        continue;
      }
      form.variables.input.friend_requester_id = user.node.id;
      form.variables = JSON.stringify(form.variables);
      newTargetIDs.push(user);
      promiseFriends.push(api.httpPost("https://www.facebook.com/api/graphql/", form));
      form.variables = JSON.parse(form.variables);
    }

    const results = await Promise.allSettled(promiseFriends);
    
    results.forEach((result, index) => {
      const user = newTargetIDs[index];
      if (result.status === "fulfilled" && !JSON.parse(result.value).errors) {
        success.push(`✅ ${user.node.name} (${user.node.id})`);
      } else {
        failed.push(`❌ ${user.node.name} (${user.node.id})`);
      }
    });

    let replyMsg = "";
    if (success.length > 0) {
      replyMsg += `✨ Successfully ${args[0] === 'add' ? 'accepted' : 'rejected'} ${success.length} request(s):\n${success.join("\n")}\n\n`;
    }
    if (failed.length > 0) {
      replyMsg += `⚠️ Failed to process ${failed.length} request(s):\n${failed.join("\n")}`;
    }

    if (replyMsg) {
      api.sendMessage(replyMsg, event.threadID, event.messageID);
    } else {
      api.unsendMessage(messageID);
      api.sendMessage("❌ No valid requests were processed.", event.threadID);
    }

    api.unsendMessage(messageID);
  },

  onStart: async function ({ event, api, commandName }) {
    try {
      const form = {
        av: api.getCurrentUserID(),
        fb_api_req_friendly_name: "FriendingCometFriendRequestsRootQueryRelayPreloader",
        fb_api_caller_class: "RelayModern",
        doc_id: "4499164963466303",
        variables: JSON.stringify({ input: { scale: 3 } })
      };
      
      const response = await api.httpPost("https://www.facebook.com/api/graphql/", form);
      const listRequest = JSON.parse(response).data.viewer.friending_possibilities.edges;
      
      if (!listRequest || listRequest.length === 0) {
        return api.sendMessage("🌟 You have no pending friend requests!", event.threadID);
      }

      let msg = "📩 Pending Friend Requests:\n\n";
      listRequest.forEach((user, index) => {
        msg += `🔹 ${index + 1}. ${user.node.name}\n`;
        msg += `   🆔: ${user.node.id}\n`;
        msg += `   🔗: ${user.node.url.replace("www.facebook", "fb")}\n`;
        msg += `   ⏰: ${moment(user.time * 1009).tz("Asia/Manila").format("DD/MM/YYYY HH:mm:ss")}\n\n`;
      });

      msg += "💡 Reply with:\n"
           + "• 'add <number>' to accept a request\n"
           + "• 'del <number>' to reject a request\n"
           + "• 'info <number>' to view profile information\n"
           + "• 'add all' to accept all\n"
           + "• 'del all' to reject all\n\n"
           + "⏳ This menu will auto-delete in 2 minutes";

      api.sendMessage(msg, event.threadID, (e, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          messageID: info.messageID,
          listRequest,
          author: event.senderID,
          unsendTimeout: setTimeout(() => {
            api.unsendMessage(info.messageID);
          }, 2 * 60 * 1000) // 2 minutes
        });
      }, event.messageID);

    } catch (error) {
      console.error(error);
      api.sendMessage("❌ An error occurred while fetching friend requests.", event.threadID);
    }
  },

  generateProfileCanvas: async function(user) {
    const canvas = createCanvas(800, 500);
    const ctx = canvas.getContext('2d');
    
    // Draw futuristic background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#001125');
    gradient.addColorStop(0.5, '#001933');
    gradient.addColorStop(1, '#000d1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw circuit patterns
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

    // Draw circuit nodes
    for (let y = 40; y < canvas.height; y += 35) {
      for (let x = 40; x < canvas.width; x += 35) {
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#00ffff';
        ctx.fill();
      }
    }
    
    // Draw profile container
    const boxWidth = 700;
    const boxHeight = 400;
    const boxX = (canvas.width - boxWidth) / 2;
    const boxY = (canvas.height - boxHeight) / 2;
    
    // Box background
    ctx.fillStyle = 'rgba(0, 20, 40, 0.7)';
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    this.drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 15);
    
    // Draw title
    ctx.font = 'bold 32px Orbitron, Arial';
    ctx.fillStyle = '#00ffff';
    ctx.textAlign = 'center';
    ctx.fillText('👤 USER PROFILE INFORMATION', canvas.width / 2, boxY + 40);
    
    // Try to load profile picture
    try {
      const profileUrl = `https://graph.facebook.com/${user.node.id}/picture?width=400&height=400&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const profilePic = await loadImage(profileUrl);
      
      // Draw profile picture in circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(boxX + 100, boxY + boxHeight / 2, 60, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(profilePic, boxX + 40, boxY + boxHeight / 2 - 60, 120, 120);
      ctx.restore();
      
      // Draw profile picture border
      ctx.beginPath();
      ctx.arc(boxX + 100, boxY + boxHeight / 2, 60, 0, Math.PI * 2);
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 3;
      ctx.stroke();
    } catch (error) {
      console.error('Error loading profile picture:', error);
      // Draw placeholder if image fails to load
      ctx.beginPath();
      ctx.arc(boxX + 100, boxY + boxHeight / 2, 60, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 50, 100, 0.5)';
      ctx.fill();
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      ctx.font = 'bold 20px Orbitron, Arial';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('No Image', boxX + 100, boxY + boxHeight / 2 + 5);
    }
    
    // Draw user information
    ctx.font = 'bold 20px Orbitron, Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    
    const infoLines = [
      `📛 Name: ${user.node.name}`,
      `🆔 ID: ${user.node.id}`,
      `🔗 Profile: ${user.node.url.replace("www.facebook", "fb")}`,
      `📅 Request Date: ${moment(user.time * 1009).tz("Asia/Manila").format("DD/MM/YYYY HH:mm:ss")}`
    ];
    
    const lineHeight = 30;
    const startY = boxY + 100;
    
    infoLines.forEach((line, i) => {
      ctx.fillText(line, boxX + 180, startY + (i * lineHeight));
    });
    
    // Draw footer
    ctx.font = 'italic 16px Roboto Mono, Arial';
    ctx.fillStyle = '#00aaaa';
    ctx.textAlign = 'center';
    ctx.fillText('Developed by IRFAN • Astra⚡Mind System', canvas.width / 2, boxY + boxHeight + 30);
    
    // Convert canvas to buffer
    const buffer = canvas.toBuffer('image/png');
    const pathSave = path.join(__dirname, 'tmp', `profile_${user.node.id}.png`);
    
    // Ensure tmp directory exists
    if (!fs.existsSync(path.dirname(pathSave))) {
      fs.mkdirSync(path.dirname(pathSave), { recursive: true });
    }
    
    fs.writeFileSync(pathSave, buffer);
    
    return fs.createReadStream(pathSave);
  },

  drawRoundedRect: function(ctx, x, y, width, height, radius) {
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
};