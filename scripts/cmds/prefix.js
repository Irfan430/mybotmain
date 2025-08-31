const fs = require("fs-extra");
const { utils } = global;
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

module.exports = {
	config: {
		name: "prefix",
		version: "1.8",
		author: "NTKhang + Modified by IRFAN",
		countDown: 5,
		role: 0,
		description: "Change bot prefix in your group or globally",
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

	onStart: async function ({ message, role, args, commandName, event, threadsData, getLang }) {
		// যদি শুধু "prefix" লিখে থাকে (কোন আর্গুমেন্ট নেই)
		if (args.length === 0) {
			const systemPrefix = global.GoatBot.config.prefix;
			const groupPrefix = await threadsData.get(event.threadID, "data.prefix") || systemPrefix;
			
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

			// Create canvas for prefix display
			const canvas = createCanvas(600, 400);
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
			ctx.font = 'bold 28px Arial';
			ctx.fillStyle = '#00ffff';
			ctx.textAlign = 'center';
			ctx.fillText('ASTRA⚡MIND PREFIX INFO', canvas.width / 2, 50);

			// Draw info box
			const boxWidth = 500;
			const boxHeight = 250;
			const boxX = (canvas.width - boxWidth) / 2;
			const boxY = 80;

			// Box background
			ctx.fillStyle = 'rgba(0, 20, 40, 0.7)';
			ctx.strokeStyle = '#00ffff';
			ctx.lineWidth = 2;
			roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 10);

			// Draw info text
			ctx.font = 'bold 20px Arial';
			ctx.textAlign = 'left';
			ctx.fillStyle = '#ffffff';

			const infoLines = [
				`🌐 𝗚𝗹𝗼𝗯𝗮𝗹 𝗣𝗿𝗲𝗳𝗶𝘅: ${systemPrefix}`,
				`💬 𝗚𝗿𝗼𝘂𝗽 𝗣𝗿𝗲𝗳𝗶𝘅: ${groupPrefix}`,
				`🕒 𝗧𝗶𝗺𝗲: ${timePart}`,
				`📅 𝗗𝗮𝘁𝗲: ${datePart}`
			];

			const lineHeight = 40;
			const startY = boxY + 50;

			infoLines.forEach((line, i) => {
				ctx.fillText(line, boxX + 20, startY + (i * lineHeight));
			});

			// Draw footer
			ctx.font = 'italic 16px Arial';
			ctx.fillStyle = '#00aaaa';
			ctx.textAlign = 'center';
			ctx.fillText('Developed by IRFAN • Astra⚡Mind System', canvas.width / 2, boxY + boxHeight + 30);

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
			
			// Create canvas for reset confirmation
			const canvas = createCanvas(600, 300);
			const ctx = canvas.getContext('2d');

			// Draw background with robotic style
			const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
			gradient.addColorStop(0, '#0a0a2a');
			gradient.addColorStop(1, '#1a1a4a');
			ctx.fillStyle = gradient;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// Draw title
			ctx.font = 'bold 28px Arial';
			ctx.fillStyle = '#00ff00';
			ctx.textAlign = 'center';
			ctx.fillText('PREFIX RESET SUCCESSFUL', canvas.width / 2, 50);

			// Draw info box
			ctx.fillStyle = 'rgba(0, 20, 40, 0.7)';
			ctx.strokeStyle = '#00ff00';
			ctx.lineWidth = 2;
			roundRect(ctx, 50, 80, canvas.width - 100, 150, 10);

			// Draw info text
			ctx.font = 'bold 20px Arial';
			ctx.textAlign = 'center';
			ctx.fillStyle = '#ffffff';
			ctx.fillText(`✅ Prefix reset to default:`, canvas.width / 2, 120);
			ctx.fillText(`➡️ System prefix: ${global.GoatBot.config.prefix}`, canvas.width / 2, 160);

			// Draw footer
			ctx.font = 'italic 16px Arial';
			ctx.fillStyle = '#00aaaa';
			ctx.fillText('Developed by IRFAN • Astra⚡Mind System', canvas.width / 2, 250);

			// Convert canvas to buffer and send as attachment
			const buffer = canvas.toBuffer('image/png');
			const pathSave = path.join(__dirname, 'tmp', 'prefix_reset.png');
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
			// Create canvas for admin error
			const canvas = createCanvas(600, 300);
			const ctx = canvas.getContext('2d');

			// Draw background with robotic style
			const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
			gradient.addColorStop(0, '#0a0a2a');
			gradient.addColorStop(1, '#1a1a4a');
			ctx.fillStyle = gradient;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// Draw title
			ctx.font = 'bold 28px Arial';
			ctx.fillStyle = '#ff0000';
			ctx.textAlign = 'center';
			ctx.fillText('ADMIN PERMISSION REQUIRED', canvas.width / 2, 50);

			// Draw info box
			ctx.fillStyle = 'rgba(0, 20, 40, 0.7)';
			ctx.strokeStyle = '#ff0000';
			ctx.lineWidth = 2;
			roundRect(ctx, 50, 80, canvas.width - 100, 150, 10);

			// Draw info text
			ctx.font = 'bold 20px Arial';
			ctx.textAlign = 'center';
			ctx.fillStyle = '#ffffff';
			ctx.fillText(`⛔ Only admin can change the`, canvas.width / 2, 120);
			ctx.fillText(`system-wide prefix.`, canvas.width / 2, 160);

			// Draw footer
			ctx.font = 'italic 16px Arial';
			ctx.fillStyle = '#00aaaa';
			ctx.fillText('Developed by IRFAN • Astra⚡Mind System', canvas.width / 2, 250);

			// Convert canvas to buffer and send as attachment
			const buffer = canvas.toBuffer('image/png');
			const pathSave = path.join(__dirname, 'tmp', 'prefix_error.png');
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
			
			// Create canvas for global prefix change success
			const canvas = createCanvas(600, 300);
			const ctx = canvas.getContext('2d');

			// Draw background with robotic style
			const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
			gradient.addColorStop(0, '#0a0a2a');
			gradient.addColorStop(1, '#1a1a4a');
			ctx.fillStyle = gradient;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// Draw title
			ctx.font = 'bold 28px Arial';
			ctx.fillStyle = '#00ff00';
			ctx.textAlign = 'center';
			ctx.fillText('GLOBAL PREFIX UPDATED', canvas.width / 2, 50);

			// Draw info box
			ctx.fillStyle = 'rgba(0, 20, 40, 0.7)';
			ctx.strokeStyle = '#00ff00';
			ctx.lineWidth = 2;
			roundRect(ctx, 50, 80, canvas.width - 100, 150, 10);

			// Draw info text
			ctx.font = 'bold 20px Arial';
			ctx.textAlign = 'center';
			ctx.fillStyle = '#ffffff';
			ctx.fillText(`✅ Global prefix changed successfully!`, canvas.width / 2, 120);
			ctx.fillText(`🆕 New prefix: ${newPrefix}`, canvas.width / 2, 160);

			// Draw footer
			ctx.font = 'italic 16px Arial';
			ctx.fillStyle = '#00aaaa';
			ctx.fillText('Developed by IRFAN • Astra⚡Mind System', canvas.width / 2, 250);

			// Convert canvas to buffer and send as attachment
			const buffer = canvas.toBuffer('image/png');
			const pathSave = path.join(__dirname, 'tmp', 'prefix_global.png');
			fs.writeFileSync(pathSave, buffer);
			
			return message.reply({
				body: getLang("successGlobal", newPrefix),
				attachment: fs.createReadStream(pathSave)
			});
		} else {
			await threadsData.set(event.threadID, newPrefix, "data.prefix");
			
			// Create canvas for group prefix change success
			const canvas = createCanvas(600, 300);
			const ctx = canvas.getContext('2d');

			// Draw background with robotic style
			const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
			gradient.addColorStop(0, '#0a0a2a');
			gradient.addColorStop(1, '#1a1a4a');
			ctx.fillStyle = gradient;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// Draw title
			ctx.font = 'bold 28px Arial';
			ctx.fillStyle = '#00ff00';
			ctx.textAlign = 'center';
			ctx.fillText('GROUP PREFIX UPDATED', canvas.width / 2, 50);

			// Draw info box
			ctx.fillStyle = 'rgba(0, 20, 40, 0.7)';
			ctx.strokeStyle = '#00ff00';
			ctx.lineWidth = 2;
			roundRect(ctx, 50, 80, canvas.width - 100, 150, 10);

			// Draw info text
			ctx.font = 'bold 20px Arial';
			ctx.textAlign = 'center';
			ctx.fillStyle = '#ffffff';
			ctx.fillText(`✅ Group prefix updated!`, canvas.width / 2, 120);
			ctx.fillText(`🆕 New prefix: ${newPrefix}`, canvas.width / 2, 160);

			// Draw footer
			ctx.font = 'italic 16px Arial';
			ctx.fillStyle = '#00aaaa';
			ctx.fillText('Developed by IRFAN • Astra⚡Mind System', canvas.width / 2, 250);

			// Convert canvas to buffer and send as attachment
			const buffer = canvas.toBuffer('image/png');
			const pathSave = path.join(__dirname, 'tmp', 'prefix_group.png');
			fs.writeFileSync(pathSave, buffer);
			
			return message.reply({
				body: getLang("successThisThread", newPrefix),
				attachment: fs.createReadStream(pathSave)
			});
		}
	},

	onChat: async function ({ event, message, threadsData }) {
		// শুধু "prefix" লিখলেই রেসপন্স দিবে (কোন প্রিফিক্স ছাড়া)
		if (event.body && event.body.toLowerCase() === "prefix") {
			const systemPrefix = global.GoatBot.config.prefix;
			const groupPrefix = await threadsData.get(event.threadID, "data.prefix") || systemPrefix;
			
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

			// Create canvas for prefix display
			const canvas = createCanvas(600, 400);
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
			ctx.font = 'bold 28px Arial';
			ctx.fillStyle = '#00ffff';
			ctx.textAlign = 'center';
			ctx.fillText('ASTRA⚡MIND PREFIX INFO', canvas.width / 2, 50);

			// Draw info box
			const boxWidth = 500;
			const boxHeight = 250;
			const boxX = (canvas.width - boxWidth) / 2;
			const boxY = 80;

			// Box background
			ctx.fillStyle = 'rgba(0, 20, 40, 0.7)';
			ctx.strokeStyle = '#00ffff';
			ctx.lineWidth = 2;
			roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 10);

			// Draw info text
			ctx.font = 'bold 20px Arial';
			ctx.textAlign = 'left';
			ctx.fillStyle = '#ffffff';

			const infoLines = [
				`🌐 𝗚𝗹𝗼𝗯𝗮𝗹 𝗣𝗿𝗲𝗳𝗶𝘅: ${systemPrefix}`,
				`💬 𝗚𝗿𝗼𝘂𝗽 𝗣𝗿𝗲𝗳𝗶𝘅: ${groupPrefix}`,
				`🕒 𝗧𝗶𝗺𝗲: ${timePart}`,
				`📅 𝗗𝗮𝘁𝗲: ${datePart}`
			];

			const lineHeight = 40;
			const startY = boxY + 50;

			infoLines.forEach((line, i) => {
				ctx.fillText(line, boxX + 20, startY + (i * lineHeight));
			});

			// Draw footer
			ctx.font = 'italic 16px Arial';
			ctx.fillStyle = '#00aaaa';
			ctx.textAlign = 'center';
			ctx.fillText('Developed by IRFAN • Astra⚡Mind System', canvas.width / 2, boxY + boxHeight + 30);

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
