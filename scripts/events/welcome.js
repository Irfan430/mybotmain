const { getTime, drive } = global.utils;
const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

// Try to register robotic-style fonts
try {
    registerFont(path.join(__dirname, 'fonts', 'Orbitron-Bold.ttf'), { family: 'Orbitron', weight: 'bold' });
    registerFont(path.join(__dirname, 'fonts', 'RobotoMono-Italic.ttf'), { family: 'Roboto Mono', style: 'italic' });
} catch (e) {
    console.log('Custom fonts not found, using default fonts');
}

if (!global.temp.welcomeEvent)
    global.temp.welcomeEvent = {};

module.exports = {
    config: {
        name: "welcome",
        version: "2.0",
        author: "IRFAN", 
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
            defaultWelcomeMessage: `Hello {userName}.\nWelcome {multiple} to the chat group: {boxName}\nHave a nice {session} 😊`,
            memberCount: "Member Count: {count}"
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
                    
                    // Get member count
                    let memberCount = 0;
                    try {
                        const threadInfo = await api.getThreadInfo(threadID);
                        memberCount = threadInfo.participantIDs.length;
                    } catch (e) {
                        console.error("Error getting thread info:", e);
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
                        dataAddedParticipants[0].userFbId,
                        memberCount
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

async function generateWelcomeCanvas(userName, boxName, session, multiple, userID, memberCount) {
    const canvas = createCanvas(1000, 500);
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
    
    // Draw main content box
    const boxWidth = 900;
    const boxHeight = 380;
    const boxX = (canvas.width - boxWidth) / 2;
    const boxY = (canvas.height - boxHeight) / 2;
    
    // Box background with transparency
    ctx.fillStyle = 'rgba(0, 20, 40, 0.7)';
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 15);
    
    // Container inner glow
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    roundRect(ctx, boxX + 2, boxY + 2, boxWidth - 4, boxHeight - 4, 13);

    // Draw title with robotic text effect
    ctx.font = 'bold 36px Orbitron, Arial';
    const titleText = 'ASTRA⚡MIND WELCOME SYSTEM';
    
    // Text shadow
    ctx.fillStyle = 'rgba(0, 200, 255, 0.5)';
    ctx.fillText(titleText, canvas.width/2 - ctx.measureText(titleText).width/2 + 2, boxY + 42);
    
    // Main text
    ctx.fillStyle = '#00ffff';
    ctx.fillText(titleText, canvas.width/2 - ctx.measureText(titleText).width/2, boxY + 40);
    
    // Draw user avatar with futuristic frame
    try {
        const avatarUrl = `https://graph.facebook.com/${userID}/picture?width=400&height=400&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const avatar = await loadImage(avatarUrl);
        
        // Draw avatar in circle with glow effect
        ctx.save();
        
        // Outer glow
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(boxX + 100, boxY + boxHeight / 2, 60, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
        ctx.fill();
        
        // Avatar clip
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(boxX + 100, boxY + boxHeight / 2, 55, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, boxX + 45, boxY + boxHeight / 2 - 55, 110, 110);
        
        // Avatar border
        ctx.beginPath();
        ctx.arc(boxX + 100, boxY + boxHeight / 2, 55, 0, Math.PI * 2);
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.restore();
    } catch (error) {
        console.error('Error loading avatar:', error);
    }
    
    // Draw welcome text with futuristic style
    ctx.font = 'bold 22px Orbitron, Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    
    const lines = [
        `👤 𝗨𝗦𝗘𝗥: ${userName}`,
        `👥 𝗚𝗥𝗢𝗨𝗣: ${boxName}`,
        `🌅 𝗦𝗘𝗦𝗦𝗜𝗢𝗡: ${session}`,
        `👨‍👩‍👧‍👦 𝗠𝗘𝗠𝗕𝗘𝗥𝗦: ${memberCount}`,
        `🎯 𝗦𝗧𝗔𝗧𝗨𝗦: Welcome ${multiple}!`
    ];
    
    const lineHeight = 40;
    const startY = boxY + 90;
    
    lines.forEach((line, i) => {
        // Text glow effect
        ctx.fillStyle = 'rgba(0, 200, 255, 0.4)';
        ctx.fillText(line, boxX + 180 + 1, startY + (i * lineHeight) + 1);
        
        // Main text
        ctx.fillStyle = i === 0 ? '#00ffaa' : '#ffffff';
        ctx.fillText(line, boxX + 180, startY + (i * lineHeight));
    });
    
    // Draw decorative elements
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(boxX + 170, boxY + 80);
    ctx.lineTo(boxX + boxWidth - 30, boxY + 80);
    ctx.stroke();
    
    // Add connection lines from avatar to info
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(boxX + 155, boxY + boxHeight / 2);
    ctx.lineTo(boxX + 170, boxY + boxHeight / 2);
    ctx.stroke();
    
    // Draw footer with advanced design
    ctx.font = 'italic 18px Roboto Mono, Arial';
    ctx.fillStyle = '#00aaaa';
    ctx.textAlign = 'center';
    
    // Footer text with glow
    const footerText = 'Developed by IRFAN • Astra⚡Mind Robotic System';
    ctx.fillStyle = 'rgba(0, 170, 170, 0.5)';
    ctx.fillText(footerText, canvas.width/2 + 1, boxY + boxHeight + 41);
    
    ctx.fillStyle = '#00aaaa';
    ctx.fillText(footerText, canvas.width/2, boxY + boxHeight + 40);
    
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
