const { getTime, drive } = global.utils;
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

if (!global.temp.welcomeEvent)
	global.temp.welcomeEvent = {};

module.exports = {
	config: {
		name: "welcome",
		version: "1.7",
		author: "IRFAN", // Changed author to IRFAN
		category: "events"
	},

	langs: {
		vi: {
			session1: "sáng",
			session2: "trưa",
			session3: "chiều",
			session4: "tối",
			welcomeMessage: "Cảm ơn bạn đã mời tôi vào nhóm!\nPrefix bot: %1\nĐể xem danh sách lệnh hãy nhập: %1help",
			multiple1: "bạn",
			multiple2: "các bạn",
			defaultWelcomeMessage: "Xin chào {userName}.\nChào mừng bạn đến với {boxName}.\nChúc bạn có buổi {session} vui vẻ!"
		},
		en: {
			session1: "morning",
			session2: "noon",
			session3: "afternoon",
			session4: "evening",
			welcomeMessage: "Thank you for inviting me to the group!\nBot prefix: %1\nTo view the list of commands, please enter: %1help",
			multiple1: "you",
			multiple2: "you guys",
			defaultWelcomeMessage: `Hello {userName}.\nWelcome {multiple} to the chat group: {boxName}\nHave a nice {session} 😊`
		}
	},

	onStart: async ({ threadsData, message, event, api, getLang }) => {
		if (event.logMessageType == "log:subscribe")
			return async function () {
				const hours = getTime("HH");
				const { threadID } = event;
				const { nickNameBot } = global.GoatBot.config;
				const prefix = global.utils.getPrefix(threadID);
				const dataAddedParticipants = event.logMessageData.addedParticipants;
				
				// if new member is bot
				if (dataAddedParticipants.some((item) => item.userFbId == api.getCurrentUserID())) {
					if (nickNameBot)
						api.changeNickname(nickNameBot, threadID, api.getCurrentUserID());
					return message.send(getLang("welcomeMessage", prefix));
				}
				
				// if new member:
				if (!global.temp.welcomeEvent[threadID])
					global.temp.welcomeEvent[threadID] = {
						joinTimeout: null,
						dataAddedParticipants: []
					};

				// push new member to array
				global.temp.welcomeEvent[threadID].dataAddedParticipants.push(...dataAddedParticipants);
				// if timeout is set, clear it
				clearTimeout(global.temp.welcomeEvent[threadID].joinTimeout);

				// set new timeout
				global.temp.welcomeEvent[threadID].joinTimeout = setTimeout(async function () {
					const threadData = await threadsData.get(threadID);
					if (threadData.settings.sendWelcomeMessage == false)
						return;
						
					const dataAddedParticipants = global.temp.welcomeEvent[threadID].dataAddedParticipants;
					const dataBanned = threadData.data.banned_ban || [];
					const threadName = threadData.threadName;
					const userName = [],
						mentions = [];
					let multiple = false;

					if (dataAddedParticipants.length > 1)
						multiple = true;

					for (const user of dataAddedParticipants) {
						if (dataBanned.some((item) => item.id == user.userFbId))
							continue;
						userName.push(user.fullName);
						mentions.push({
							tag: user.fullName,
							id: user.userFbId
						});
					}
					
					// {userName}:   name of new member
					// {multiple}:
					// {boxName}:    name of group
					// {threadName}: name of group
					// {session}:    session of day
					if (userName.length == 0) return;
					
					let { welcomeMessage = getLang("defaultWelcomeMessage") } = threadData.data;
					
					// Get session
					const session = hours <= 10
						? getLang("session1")
						: hours <= 12
							? getLang("session2")
							: hours <= 18
								? getLang("session3")
								: getLang("session4");
					
					const multipleText = multiple ? getLang("multiple2") : getLang("multiple1");
					
					// Replace placeholders
					welcomeMessage = welcomeMessage
						.replace(/\{userName\}|\{userNameTag\}/g, userName.join(", "))
						.replace(/\{boxName\}|\{threadName\}/g, threadName)
						.replace(/\{multiple\}/g, multipleText)
						.replace(/\{session\}/g, session);

					// Generate welcome canvas
					const welcomeCanvas = await generateWelcomeCanvas(
						userName.join(", "), 
						threadName, 
						session, 
						multipleText,
						dataAddedParticipants[0].userFbId
					);
					
					const form = {
						body: welcomeMessage,
						mentions: welcomeMessage.match(/\{userNameTag\}/g) ? mentions : null,
						attachment: [welcomeCanvas]
					};

					message.send(form);
					delete global.temp.welcomeEvent[threadID];
				}, 1500);
			};
	}
};

async function generateWelcomeCanvas(userName, boxName, session, multiple, userID) {
	const canvas = createCanvas(800, 400);
	const ctx = canvas.getContext('2d');
	
	// Draw background
	const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
	gradient.addColorStop(0, '#0a0a2a');
	gradient.addColorStop(1, '#1a1a4a');
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	
	// Draw decorative elements
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
	
	// Draw main content box
	const boxWidth = 700;
	const boxHeight = 300;
	const boxX = (canvas.width - boxWidth) / 2;
	const boxY = (canvas.height - boxHeight) / 2;
	
	// Box background
	ctx.fillStyle = 'rgba(0, 20, 40, 0.7)';
	ctx.strokeStyle = '#00ffff';
	ctx.lineWidth = 2;
	roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 15);
	
	// Draw title
	ctx.font = 'bold 28px Arial';
	ctx.fillStyle = '#00ffff';
	ctx.textAlign = 'center';
	ctx.fillText('🎉 WELCOME 🎉', canvas.width / 2, boxY + 40);
	
	// Draw user avatar
	try {
		const avatarUrl = `https://graph.facebook.com/${userID}/picture?width=200&height=200&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
		const avatar = await loadImage(avatarUrl);
		
		// Draw avatar in circle
		ctx.save();
		ctx.beginPath();
		ctx.arc(boxX + 60, boxY + boxHeight / 2, 40, 0, Math.PI * 2);
		ctx.closePath();
		ctx.clip();
		ctx.drawImage(avatar, boxX + 20, boxY + boxHeight / 2 - 40, 80, 80);
		ctx.restore();
	} catch (error) {
		console.error('Error loading avatar:', error);
	}
	
	// Draw welcome text
	ctx.font = 'bold 20px Arial';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'left';
	
	const lines = [
		`👤 User: ${userName}`,
		`👥 Group: ${boxName}`,
		`🌅 Session: ${session}`,
		`🎯 Status: Welcome ${multiple}!`
	];
	
	const lineHeight = 30;
	const startY = boxY + 80;
	
	lines.forEach((line, i) => {
		ctx.fillText(line, boxX + 120, startY + (i * lineHeight));
	});
	
	// Draw decorative elements
	ctx.strokeStyle = '#00ffff';
	ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.moveTo(boxX + 110, boxY + 70);
	ctx.lineTo(boxX + boxWidth - 20, boxY + 70);
	ctx.stroke();
	
	// Draw footer
	ctx.font = 'italic 14px Arial';
	ctx.fillStyle = '#00aaaa';
	ctx.textAlign = 'center';
	ctx.fillText('Developed by IRFAN • Astra⚡Mind System', canvas.width / 2, boxY + boxHeight + 30);
	
	// Convert canvas to buffer
	const buffer = canvas.toBuffer('image/png');
	const pathSave = path.join(__dirname, 'tmp', 'welcome_canvas.png');
	
	// Ensure tmp directory exists
	if (!fs.existsSync(path.dirname(pathSave))) {
		fs.mkdirSync(path.dirname(pathSave), { recursive: true });
	}
	
	fs.writeFileSync(pathSave, buffer);
	
	return fs.createReadStream(pathSave);
}

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
