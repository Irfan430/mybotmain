const fs = require("fs-extra");
const { utils } = global;
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

// Try to register robotic-style fonts
try {
    registerFont(path.join(__dirname, 'fonts', 'Orbitron-Bold.ttf'), { family: 'Orbitron', weight: 'bold' });
    registerFont(path.join(__dirname, 'fonts', 'RobotoMono-Italic.ttf'), { family: 'Roboto Mono', style: 'italic' });
} catch (e) {
    console.log('Custom fonts not found, using default fonts');
}

module.exports = {
    config: {
        name: "prefix",
        version: "2.1",
        author: "NTKhang + Enhanced by IRFAN",
        countDown: 5,
        role: 0,
        description: "Change bot prefix in your group or globally with enhanced robotic UI",
        category: "config",
        guide: {
            en: "To see current prefix: just type 'prefix'\n"
                + "To change group prefix: prefix <new prefix>\n"
                + "To change global prefix: prefix <new prefix> -g\n"
                + "To reset prefix: prefix reset"
        }
    },

    langs: {
        en: {
            reset: "✅ Prefix reset to default:\n➡️  System prefix: %1",
            onlyAdmin: "⛔ Only admin can change the system-wide prefix.",
            confirmGlobal: "⚙️ Global prefix change requested.\n🪄 React to confirm.",
            confirmThisThread: "🛠️ Group prefix change requested.\n🪄 React to confirm.",
            successGlobal: "✅ Global prefix changed successfully!\n🆕 New prefix: %1",
            successThisThread: "✅ Group prefix updated!\n🆕 New prefix: %1"
        }
    },

    onStart: async function ({ message, role, args, commandName, event, threadsData, getLang, api }) {
        // If only "prefix" is typed (no arguments)
        if (args.length === 0) {
            const systemPrefix = global.GoatBot.config.prefix;
            const groupPrefix = await threadsData.get(event.threadID, "data.prefix") || systemPrefix;
            
            // Get group name
            let groupName = "Private Chat";
            try {
                const threadInfo = await api.getThreadInfo(event.threadID);
                groupName = threadInfo.threadName || "Private Chat";
            } catch (e) {
                console.error("Error getting thread info:", e);
            }

            const dateTime = new Date().toLocaleString("en-US", {
                timeZone: "Asia/Dhaka",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            });

            const [datePart, timePart] = dateTime.split(", ");

            // Create enhanced robotic style canvas
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

            // Draw data streams (animated effect simulated with gradient lines)
            for (let i = 0; i < 5; i++) {
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

            // Draw main header with robotic text effect
            ctx.font = 'bold 36px Orbitron, Arial';
            const headerText = 'ASTRA⚡MIND PREFIX SYSTEM';
            
            // Text shadow
            ctx.fillStyle = 'rgba(0, 200, 255, 0.5)';
            ctx.fillText(headerText, canvas.width/2 - ctx.measureText(headerText).width/2 + 2, 52);
            
            // Main text
            ctx.fillStyle = '#00ffff';
            ctx.fillText(headerText, canvas.width/2 - ctx.measureText(headerText).width/2, 50);

            // Draw info container with robotic design
            const containerWidth = 700;
            const containerHeight = 320;
            const containerX = (canvas.width - containerWidth) / 2;
            const containerY = 80;

            // Container background with transparency
            ctx.fillStyle = 'rgba(0, 20, 40, 0.7)';
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            roundRect(ctx, containerX, containerY, containerWidth, containerHeight, 15);
            
            // Container inner glow
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            roundRect(ctx, containerX + 2, containerY + 2, containerWidth - 4, containerHeight - 4, 13);

            // Draw group name
            ctx.font = 'bold 24px Orbitron, Arial';
            ctx.fillStyle = '#00ffaa';
            ctx.textAlign = 'center';
            ctx.fillText(`👥 GROUP: ${groupName}`, canvas.width/2, containerY + 40);

            // Draw info content
            ctx.font = 'bold 20px Orbitron, Arial';
            ctx.textAlign = 'left';
            ctx.fillStyle = '#ffffff';

            const infoLines = [
                `🌐 𝗚𝗹𝗼𝗯𝗮𝗹 𝗣𝗿𝗲𝗳𝗶𝘅: ${systemPrefix}`,
                `💬 𝗚𝗿𝗼𝘂𝗽 𝗣𝗿𝗲𝗳𝗶𝘅: ${groupPrefix}`,
                `🕒 𝗧𝗶𝗺𝗲: ${timePart}`,
                `📅 𝗗𝗮𝘁𝗲: ${datePart}`
            ];

            const lineHeight = 45;
            const startY = containerY + 80;

            infoLines.forEach((line, i) => {
                // Text glow effect
                ctx.fillStyle = 'rgba(0, 200, 255, 0.4)';
                ctx.fillText(line, containerX + 25 + 1, startY + (i * lineHeight) + 1);
                
                // Main text
                ctx.fillStyle = '#ffffff';
                ctx.fillText(line, containerX + 25, startY + (i * lineHeight));
            });

            // Draw footer with advanced design
            ctx.font = 'italic 18px Roboto Mono, Arial';
            ctx.fillStyle = '#00aaaa';
            ctx.textAlign = 'center';
            
            // Footer text with glow
            const footerText = 'Developed by IRFAN • Astra⚡Mind Robotic System';
            ctx.fillStyle = 'rgba(0, 170, 170, 0.5)';
            ctx.fillText(footerText, canvas.width/2 + 1, containerY + containerHeight + 41);
            
            ctx.fillStyle = '#00aaaa';
            ctx.fillText(footerText, canvas.width/2, containerY + containerHeight + 40);

            // Convert canvas to buffer and send as attachment
            const buffer = canvas.toBuffer('image/png');
            const pathSave = path.join(__dirname, 'tmp', 'prefix_canvas.png');
            
            // Ensure tmp directory exists
            if (!fs.existsSync(path.dirname(pathSave))) {
                fs.mkdirSync(path.dirname(pathSave), { recursive: true });
            }
            
            fs.writeFileSync(pathSave, buffer);
            
            return message.reply({
                body: "🤖 ASTRA⚡MIND Prefix Information:",
                attachment: fs.createReadStream(pathSave)
            });
        }

        if (args[0] === "reset") {
            await threadsData.set(event.threadID, null, "data.prefix");
            
            // Create enhanced reset canvas
            const canvas = createCanvas(700, 400);
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

            // Draw title
            ctx.font = 'bold 32px Orbitron, Arial';
            ctx.fillStyle = '#00ff00';
            ctx.textAlign = 'center';
            ctx.fillText('PREFIX RESET SUCCESSFUL', canvas.width / 2, 60);

            // Draw info box
            const boxWidth = 600;
            const boxHeight = 200;
            const boxX = (canvas.width - boxWidth) / 2;
            const boxY = 100;

            // Box background
            ctx.fillStyle = 'rgba(0, 20, 40, 0.7)';
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 3;
            roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 15);

            // Draw info text
            ctx.font = 'bold 24px Orbitron, Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`✅ Prefix reset to default:`, canvas.width / 2, boxY + 50);
            ctx.fillText(`➡️ System prefix: ${global.GoatBot.config.prefix}`, canvas.width / 2, boxY + 100);

            // Draw footer
            ctx.font = 'italic 18px Roboto Mono, Arial';
            ctx.fillStyle = '#00aaaa';
            ctx.textAlign = 'center';
            ctx.fillText('Developed by IRFAN • Astra⚡Mind Robotic System', canvas.width / 2, boxY + boxHeight + 50);

            // Convert canvas to buffer and send as attachment
            const buffer = canvas.toBuffer('image/png');
            const pathSave = path.join(__dirname, 'tmp', 'prefix_reset.png');
            
            // Ensure tmp directory exists
            if (!fs.existsSync(path.dirname(pathSave))) {
                fs.mkdirSync(path.dirname(pathSave), { recursive: true });
            }
            
            fs.writeFileSync(pathSave, buffer);
            
            return message.reply({
                body: getLang("reset", global.GoatBot.config.prefix),
                attachment: fs.createReadStream(pathSave)
            });
        }

        const newPrefix = args[0];
        const formSet = {
            commandName,
            author: event.senderID,
            newPrefix,
            setGlobal: args[1] === "-g"
        };

        if (formSet.setGlobal && role < 2) {
            // Create enhanced admin error canvas
            const canvas = createCanvas(700, 400);
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

            // Draw title
            ctx.font = 'bold 32px Orbitron, Arial';
            ctx.fillStyle = '#ff0000';
            ctx.textAlign = 'center';
            ctx.fillText('ADMIN PERMISSION REQUIRED', canvas.width / 2, 60);

            // Draw info box
            const boxWidth = 600;
            const boxHeight = 200;
            const boxX = (canvas.width - boxWidth) / 2;
            const boxY = 100;

            // Box background
            ctx.fillStyle = 'rgba(0, 20, 40, 0.7)';
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 3;
            roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 15);

            // Draw info text
            ctx.font = 'bold 24px Orbitron, Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`⛔ Only admin can change the`, canvas.width / 2, boxY + 70);
            ctx.fillText(`system-wide prefix.`, canvas.width / 2, boxY + 120);

            // Draw footer
            ctx.font = 'italic 18px Roboto Mono, Arial';
            ctx.fillStyle = '#00aaaa';
            ctx.textAlign = 'center';
            ctx.fillText('Developed by IRFAN • Astra⚡Mind Robotic System', canvas.width / 2, boxY + boxHeight + 50);

            // Convert canvas to buffer and send as attachment
            const buffer = canvas.toBuffer('image/png');
            const pathSave = path.join(__dirname, 'tmp', 'prefix_error.png');
            
            // Ensure tmp directory exists
            if (!fs.existsSync(path.dirname(pathSave))) {
                fs.mkdirSync(path.dirname(pathSave), { recursive: true });
            }
            
            fs.writeFileSync(pathSave, buffer);
            
            return message.reply({
                body: getLang("onlyAdmin"),
                attachment: fs.createReadStream(pathSave)
            });
        }

        const confirmMsg = formSet.setGlobal ? getLang("confirmGlobal") : getLang("confirmThisThread");

        return message.reply(confirmMsg, (err, info) => {
            formSet.messageID = info.messageID;
            global.GoatBot.onReaction.set(info.messageID, formSet);
        });
    },

    onReaction: async function ({ message, threadsData, event, Reaction, getLang }) {
        const { author, newPrefix, setGlobal } = Reaction;
        if (event.userID !== author) return;

        if (setGlobal) {
            global.GoatBot.config.prefix = newPrefix;
            fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
            
            // Create enhanced global prefix change success canvas
            const canvas = createCanvas(700, 400);
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

            // Draw title
            ctx.font = 'bold 32px Orbitron, Arial';
            ctx.fillStyle = '#00ff00';
            ctx.textAlign = 'center';
            ctx.fillText('GLOBAL PREFIX UPDATED', canvas.width / 2, 60);

            // Draw info box
            const boxWidth = 600;
            const boxHeight = 200;
            const boxX = (canvas.width - boxWidth) / 2;
            const boxY = 100;

            // Box background
            ctx.fillStyle = 'rgba(0, 20, 40, 0.7)';
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 3;
            roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 15);

            // Draw info text
            ctx.font = 'bold 24px Orbitron, Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`✅ Global prefix changed successfully!`, canvas.width / 2, boxY + 70);
            ctx.fillText(`🆕 New prefix: ${newPrefix}`, canvas.width / 2, boxY + 120);

            // Draw footer
            ctx.font = 'italic 18px Roboto Mono, Arial';
            ctx.fillStyle = '#00aaaa';
            ctx.textAlign = 'center';
            ctx.fillText('Developed by IRFAN • Astra⚡Mind Robotic System', canvas.width / 2, boxY + boxHeight + 50);

            // Convert canvas to buffer and send as attachment
            const buffer = canvas.toBuffer('image/png');
            const pathSave = path.join(__dirname, 'tmp', 'prefix_global.png');
            
            // Ensure tmp directory exists
            if (!fs.existsSync(path.dirname(pathSave))) {
                fs.mkdirSync(path.dirname(pathSave), { recursive: true });
            }
            
            fs.writeFileSync(pathSave, buffer);
            
            return message.reply({
                body: getLang("successGlobal", newPrefix),
                attachment: fs.createReadStream(pathSave)
            });
        } else {
            await threadsData.set(event.threadID, newPrefix, "data.prefix");
            
            // Create enhanced group prefix change success canvas
            const canvas = createCanvas(700, 400);
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

            // Draw title
            ctx.font = 'bold 32px Orbitron, Arial';
            ctx.fillStyle = '#00ff00';
            ctx.textAlign = 'center';
            ctx.fillText('GROUP PREFIX UPDATED', canvas.width / 2, 60);

            // Draw info box
            const boxWidth = 600;
            const boxHeight = 200;
            const boxX = (canvas.width - boxWidth) / 2;
            const boxY = 100;

            // Box background
            ctx.fillStyle = 'rgba(0, 20, 40, 0.7)';
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 3;
            roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 15);

            // Draw info text
            ctx.font = 'bold 24px Orbitron, Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`✅ Group prefix updated!`, canvas.width / 2, boxY + 70);
            ctx.fillText(`🆕 New prefix: ${newPrefix}`, canvas.width / 2, boxY + 120);

            // Draw footer
            ctx.font = 'italic 18px Roboto Mono, Arial';
            ctx.fillStyle = '#00aaaa';
            ctx.textAlign = 'center';
            ctx.fillText('Developed by IRFAN • Astra⚡Mind Robotic System', canvas.width / 2, boxY + boxHeight + 50);

            // Convert canvas to buffer and send as attachment
            const buffer = canvas.toBuffer('image/png');
            const pathSave = path.join(__dirname, 'tmp', 'prefix_group.png');
            
            // Ensure tmp directory exists
            if (!fs.existsSync(path.dirname(pathSave))) {
                fs.mkdirSync(path.dirname(pathSave), { recursive: true });
            }
            
            fs.writeFileSync(pathSave, buffer);
            
            return message.reply({
                body: getLang("successThisThread", newPrefix),
                attachment: fs.createReadStream(pathSave)
            });
        }
    },

    onChat: async function ({ event, message, threadsData, api }) {
        // Respond to just "prefix" (without any prefix)
        if (event.body && event.body.toLowerCase() === "prefix") {
            const systemPrefix = global.GoatBot.config.prefix;
            const groupPrefix = await threadsData.get(event.threadID, "data.prefix") || systemPrefix;
            
            // Get group name
            let groupName = "Private Chat";
            try {
                const threadInfo = await api.getThreadInfo(event.threadID);
                groupName = threadInfo.threadName || "Private Chat";
            } catch (e) {
                console.error("Error getting thread info:", e);
            }

            const dateTime = new Date().toLocaleString("en-US", {
                timeZone: "Asia/Dhaka",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            });

            const [datePart, timePart] = dateTime.split(", ");

            // Create enhanced robotic style canvas
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

            // Draw data streams (animated effect simulated with gradient lines)
            for (let i = 0; i < 5; i++) {
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

            // Draw main header with robotic text effect
            ctx.font = 'bold 36px Orbitron, Arial';
            const headerText = 'ASTRA⚡MIND PREFIX SYSTEM';
            
            // Text shadow
            ctx.fillStyle = 'rgba(0, 200, 255, 0.5)';
            ctx.fillText(headerText, canvas.width/2 - ctx.measureText(headerText).width/2 + 2, 52);
            
            // Main text
            ctx.fillStyle = '#00ffff';
            ctx.fillText(headerText, canvas.width/2 - ctx.measureText(headerText).width/2, 50);

            // Draw info container with robotic design
            const containerWidth = 700;
            const containerHeight = 320;
            const containerX = (canvas.width - containerWidth) / 2;
            const containerY = 80;

            // Container background with transparency
            ctx.fillStyle = 'rgba(0, 20, 40, 0.7)';
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            roundRect(ctx, containerX, containerY, containerWidth, containerHeight, 15);
            
            // Container inner glow
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            roundRect(ctx, containerX + 2, containerY + 2, containerWidth - 4, containerHeight - 4, 13);

            // Draw group name
            ctx.font = 'bold 24px Orbitron, Arial';
            ctx.fillStyle = '#00ffaa';
            ctx.textAlign = 'center';
            ctx.fillText(`👥 GROUP: ${groupName}`, canvas.width/2, containerY + 40);

            // Draw info content
            ctx.font = 'bold 20px Orbitron, Arial';
            ctx.textAlign = 'left';
            ctx.fillStyle = '#ffffff';

            const infoLines = [
                `🌐 𝗚𝗹𝗼𝗯𝗮𝗹 𝗣𝗿𝗲𝗳𝗶𝘅: ${systemPrefix}`,
                `💬 𝗚𝗿𝗼𝘂𝗽 𝗣𝗿𝗲𝗳𝗶𝘅: ${groupPrefix}`,
                `🕒 𝗧𝗶𝗺𝗲: ${timePart}`,
                `📅 𝗗𝗮𝘁𝗲: ${datePart}`
            ];

            const lineHeight = 45;
            const startY = containerY + 80;

            infoLines.forEach((line, i) => {
                // Text glow effect
                ctx.fillStyle = 'rgba(0, 200, 255, 0.4)';
                ctx.fillText(line, containerX + 25 + 1, startY + (i * lineHeight) + 1);
                
                // Main text
                ctx.fillStyle = '#ffffff';
                ctx.fillText(line, containerX + 25, startY + (i * lineHeight));
            });

            // Draw footer with advanced design
            ctx.font = 'italic 18px Roboto Mono, Arial';
            ctx.fillStyle = '#00aaaa';
            ctx.textAlign = 'center';
            
            // Footer text with glow
            const footerText = 'Developed by IRFAN • Astra⚡Mind Robotic System';
            ctx.fillStyle = 'rgba(0, 170, 170, 0.5)';
            ctx.fillText(footerText, canvas.width/2 + 1, containerY + containerHeight + 41);
            
            ctx.fillStyle = '#00aaaa';
            ctx.fillText(footerText, canvas.width/2, containerY + containerHeight + 40);

            // Convert canvas to buffer and send as attachment
            const buffer = canvas.toBuffer('image/png');
            const pathSave = path.join(__dirname, 'tmp', 'prefix_chat.png');
            
            // Ensure tmp directory exists
            if (!fs.existsSync(path.dirname(pathSave))) {
                fs.mkdirSync(path.dirname(pathSave), { recursive: true });
            }
            
            fs.writeFileSync(pathSave, buffer);
            
            return message.reply({
                body: "🤖 ASTRA⚡MIND Prefix Information:",
                attachment: fs.createReadStream(pathSave)
            });
        }
    }
};

// Enhanced rounded rectangle function with better styling
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