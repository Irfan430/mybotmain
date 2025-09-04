const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage, registerFont } = require('canvas');
const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

// Try to register robotic-style fonts
try {
    registerFont(path.join(__dirname, 'fonts', 'Orbitron-Bold.ttf'), { family: 'Orbitron', weight: 'bold' });
    registerFont(path.join(__dirname, 'fonts', 'RobotoMono-Italic.ttf'), { family: 'Roboto Mono', style: 'italic' });
} catch (e) {
    console.log('Custom fonts not found, using default fonts');
}

module.exports = {
    config: {
        name: "help",
        version: "4.0",
        author: "𝕴𝖗𝖋𝖆𝖓",
        countDown: 5,
        role: 0,
        description: "View command information with advanced robotic interface",
        category: "info",
        guide: {
            en: "{pn} [command] - View command details\n{pn} all - View all commands\n{pn} c [category] - View commands in category"
        }
    },

    langs: {
        en: {
            helpHeader: "🤖 ASTRA⚡MIND COMMAND SYSTEM",
            commandNotFound: "⚠️ Command '{command}' not found!",
            doNotHave: "None",
            roleText0: "👥 All Users",
            roleText1: "👑 Group Admins",
            roleText2: "⚡ Bot Admins",
            categoryEmpty: "❌ No commands found in category: {category}",
            totalCommands: "📊 Total Commands: {total}",
            categoryTitle: "📁 Category: {category}"
        }
    },

    onStart: async function({ message, args, event, threadsData, role, api }) {
        const { threadID } = event;
        const prefix = getPrefix(threadID);
        const commandName = args[0]?.toLowerCase();

        // Get bot owner information
        const botOwner = "𝕴𝖗𝖋𝖆𝖓"; // You can make this dynamic if you have owner info stored somewhere
        const botName = "ASTRA⚡MIND"; // Bot name
        const botVersion = "4.0"; // Bot version

        if (commandName === 'c' && args[1]) {
            const categoryArg = args[1].toUpperCase();
            const commandsInCategory = [];

            for (const [name, cmd] of commands) {
                if (cmd.config.role > 1 && role < cmd.config.role) continue;
                const category = cmd.config.category?.toUpperCase() || "GENERAL";
                if (category === categoryArg) {
                    commandsInCategory.push({ name });
                }
            }

            if (commandsInCategory.length === 0) {
                return message.reply(this.langs.en.categoryEmpty.replace(/{category}/g, categoryArg));
            }

            // Generate category canvas
            const categoryCanvas = await this.generateCategoryCanvas(
                categoryArg, 
                commandsInCategory, 
                prefix,
                botName,
                botOwner,
                botVersion
            );
            
            return message.reply({
                body: `📁 ${this.langs.en.categoryTitle.replace(/{category}/g, categoryArg)}`,
                attachment: categoryCanvas
            });
        }

        if (!commandName || commandName === 'all') {
            const categories = new Map();

            for (const [name, cmd] of commands) {
                if (cmd.config.role > 1 && role < cmd.config.role) continue;

                const category = cmd.config.category?.toUpperCase() || "GENERAL";
                if (!categories.has(category)) {
                    categories.set(category, []);
                }
                categories.get(category).push({ name });
            }

            // Generate main help canvas
            const mainCanvas = await this.generateMainHelpCanvas(
                categories, 
                prefix,
                botName,
                botOwner,
                botVersion
            );
            
            return message.reply({
                body: "🤖 ASTRA⚡MIND COMMAND SYSTEM",
                attachment: mainCanvas
            });
        }

        let cmd = commands.get(commandName) || commands.get(aliases.get(commandName));
        if (!cmd) {
            return message.reply(this.langs.en.commandNotFound.replace(/{command}/g, commandName));
        }

        // Generate command details canvas
        const commandCanvas = await this.generateCommandCanvas(
            cmd, 
            prefix, 
            role,
            botName,
            botOwner,
            botVersion
        );
        
        return message.reply({
            body: `📋 Command Details: ${cmd.config.name}`,
            attachment: commandCanvas
        });
    },

    generateMainHelpCanvas: async function(categories, prefix, botName, botOwner, botVersion) {
        const canvas = createCanvas(1200, 800);
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
        
        // Draw main header
        ctx.font = 'bold 42px Orbitron, Arial';
        const titleText = '🤖 ASTRA⚡MIND COMMAND SYSTEM';
        
        // Text shadow
        ctx.fillStyle = 'rgba(0, 200, 255, 0.5)';
        ctx.fillText(titleText, canvas.width/2 - ctx.measureText(titleText).width/2 + 2, 62);
        
        // Main text
        ctx.fillStyle = '#00ffff';
        ctx.fillText(titleText, canvas.width/2 - ctx.measureText(titleText).width/2, 60);
        
        // Draw bot info box
        const infoBoxWidth = 1100;
        const infoBoxHeight = 100;
        const infoBoxX = (canvas.width - infoBoxWidth) / 2;
        const infoBoxY = 90;
        
        // Box background
        ctx.fillStyle = 'rgba(0, 20, 40, 0.7)';
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3;
        roundRect(ctx, infoBoxX, infoBoxY, infoBoxWidth, infoBoxHeight, 15);
        
        // Draw bot info
        ctx.font = 'bold 20px Orbitron, Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        
        const botInfoLines = [
            `👑 Owner: ${botOwner} | ⚡ Version: ${botVersion} | 📊 Prefix: ${prefix}`,
            `💬 Type "${prefix}help [command]" for command details`
        ];
        
        botInfoLines.forEach((line, i) => {
            ctx.fillText(line, canvas.width/2, infoBoxY + 35 + (i * 30));
        });
        
        // Draw categories
        const sortedCategories = [...categories.keys()].sort();
        let totalCommands = 0;
        
        const cols = 3;
        const rows = Math.ceil(sortedCategories.length / cols);
        const categoryWidth = (infoBoxWidth - 40) / cols;
        const categoryHeight = 120;
        
        let categoryIndex = 0;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (categoryIndex >= sortedCategories.length) break;
                
                const category = sortedCategories[categoryIndex];
                const commandsInCategory = categories.get(category);
                totalCommands += commandsInCategory.length;
                
                const categoryX = infoBoxX + 20 + (col * categoryWidth);
                const categoryY = infoBoxY + infoBoxHeight + 20 + (row * categoryHeight);
                
                // Draw category box
                ctx.fillStyle = 'rgba(0, 30, 60, 0.7)';
                ctx.strokeStyle = '#00ffaa';
                ctx.lineWidth = 2;
                roundRect(ctx, categoryX, categoryY, categoryWidth - 10, categoryHeight - 10, 10);
                
                // Draw category title
                ctx.font = 'bold 18px Orbitron, Arial';
                ctx.fillStyle = '#00ffaa';
                ctx.textAlign = 'center';
                ctx.fillText(category, categoryX + (categoryWidth - 10)/2, categoryY + 25);
                
                // Draw command count
                ctx.font = 'bold 16px Orbitron, Arial';
                ctx.fillStyle = '#ffffff';
                ctx.fillText(`Commands: ${commandsInCategory.length}`, categoryX + (categoryWidth - 10)/2, categoryY + 50);
                
                // Draw sample commands (first 3)
                ctx.font = '14px Orbitron, Arial';
                ctx.fillStyle = '#cccccc';
                ctx.textAlign = 'left';
                
                const sampleCommands = commandsInCategory.slice(0, 3).map(c => c.name);
                sampleCommands.forEach((cmd, i) => {
                    ctx.fillText(`• ${cmd}`, categoryX + 10, categoryY + 75 + (i * 20));
                });
                
                if (commandsInCategory.length > 3) {
                    ctx.fillText(`• ...${commandsInCategory.length - 3} more`, categoryX + 10, categoryY + 75 + (3 * 20));
                }
                
                categoryIndex++;
            }
        }
        
        // Draw footer
        ctx.font = 'italic 18px Roboto Mono, Arial';
        ctx.fillStyle = '#00aaaa';
        ctx.textAlign = 'center';
        ctx.fillText(`📊 Total Commands: ${totalCommands} | Developed by ${botOwner}`, canvas.width/2, canvas.height - 30);
        
        // Convert canvas to buffer
        const buffer = canvas.toBuffer('image/png');
        const pathSave = path.join(__dirname, 'tmp', 'main_help.png');
        
        // Ensure tmp directory exists
        if (!fs.existsSync(path.dirname(pathSave))) {
            fs.mkdirSync(path.dirname(pathSave), { recursive: true });
        }
        
        fs.writeFileSync(pathSave, buffer);
        
        return fs.createReadStream(pathSave);
    },

    generateCategoryCanvas: async function(category, commands, prefix, botName, botOwner, botVersion) {
        const canvas = createCanvas(1000, 600);
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
        
        // Draw header
        ctx.font = 'bold 36px Orbitron, Arial';
        ctx.fillStyle = '#00ffff';
        ctx.textAlign = 'center';
        ctx.fillText(`📁 CATEGORY: ${category}`, canvas.width/2, 50);
        
        // Draw command list
        const boxWidth = 900;
        const boxHeight = 450;
        const boxX = (canvas.width - boxWidth) / 2;
        const boxY = 80;
        
        // Box background
        ctx.fillStyle = 'rgba(0, 20, 40, 0.7)';
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3;
        roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 15);
        
        // Draw commands in columns
        const cols = 3;
        const commandHeight = 25;
        const commandsPerCol = Math.ceil(commands.length / cols);
        
        ctx.font = '16px Orbitron, Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        
        for (let i = 0; i < commands.length; i++) {
            const col = Math.floor(i / commandsPerCol);
            const row = i % commandsPerCol;
            
            const x = boxX + 20 + (col * (boxWidth / cols));
            const y = boxY + 30 + (row * commandHeight);
            
            ctx.fillText(`• ${commands[i].name}`, x, y);
        }
        
        // Draw footer
        ctx.font = 'italic 16px Roboto Mono, Arial';
        ctx.fillStyle = '#00aaaa';
        ctx.textAlign = 'center';
        ctx.fillText(`📊 Total: ${commands.length} commands | Developed by ${botOwner}`, canvas.width/2, boxY + boxHeight + 30);
        
        // Convert canvas to buffer
        const buffer = canvas.toBuffer('image/png');
        const pathSave = path.join(__dirname, 'tmp', `category_${category}.png`);
        
        // Ensure tmp directory exists
        if (!fs.existsSync(path.dirname(pathSave))) {
            fs.mkdirSync(path.dirname(pathSave), { recursive: true });
        }
        
        fs.writeFileSync(pathSave, buffer);
        
        return fs.createReadStream(pathSave);
    },

    generateCommandCanvas: async function(cmd, prefix, role, botName, botOwner, botVersion) {
        const config = cmd.config;
        const description = config.description?.en || config.description || "No description";
        const aliasesList = config.aliases?.join(", ") || "None";
        const category = config.config?.toUpperCase() || "GENERAL";
        
        let roleText;
        switch(config.role) {
            case 1: roleText = "👑 Group Admins"; break;
            case 2: roleText = "⚡ Bot Admins"; break;
            default: roleText = "👥 All Users";
        }
        
        let guide = config.guide?.en || config.usage || config.guide || "No usage guide available";
        if (typeof guide === "object") guide = guide.body;
        guide = guide.replace(/\{prefix\}/g, prefix).replace(/\{name\}/g, config.name).replace(/\{pn\}/g, prefix + config.name);
        
        // Split guide into lines for display
        const guideLines = guide.split('\n');
        
        const canvas = createCanvas(1000, 700);
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
        
        // Draw header
        ctx.font = 'bold 36px Orbitron, Arial';
        ctx.fillStyle = '#00ffff';
        ctx.textAlign = 'center';
        ctx.fillText(`📋 COMMAND: ${config.name}`, canvas.width/2, 50);
        
        // Draw info box
        const boxWidth = 900;
        const boxHeight = 550;
        const boxX = (canvas.width - boxWidth) / 2;
        const boxY = 80;
        
        // Box background
        ctx.fillStyle = 'rgba(0, 20, 40, 0.7)';
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3;
        roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 15);
        
        // Draw command info
        ctx.font = 'bold 20px Orbitron, Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        
        const infoLines = [
            `📝 Description: ${description}`,
            `📂 Category: ${category}`,
            `🔤 Aliases: ${aliasesList}`,
            `🏷️ Version: ${config.version}`,
            `🔒 Permissions: ${roleText}`,
            `⏱️ Cooldown: ${config.countDown || 1}s`,
            `👤 Author: ${config.author || "Unknown"}`
        ];
        
        const lineHeight = 30;
        const startY = boxY + 40;
        
        infoLines.forEach((line, i) => {
            ctx.fillText(line, boxX + 20, startY + (i * lineHeight));
        });
        
        // Draw usage guide
        const usageY = startY + (infoLines.length * lineHeight) + 20;
        ctx.fillStyle = '#00ffaa';
        ctx.fillText('🛠️ USAGE GUIDE:', boxX + 20, usageY);
        
        ctx.font = '16px Orbitron, Arial';
        ctx.fillStyle = '#cccccc';
        
        guideLines.forEach((line, i) => {
            ctx.fillText(line, boxX + 20, usageY + 30 + (i * 25));
        });
        
        // Draw footer
        ctx.font = 'italic 16px Roboto Mono, Arial';
        ctx.fillStyle = '#00aaaa';
        ctx.textAlign = 'center';
        ctx.fillText(`Developed by ${botOwner} • ${botName} v${botVersion}`, canvas.width/2, boxY + boxHeight + 30);
        
        // Convert canvas to buffer
        const buffer = canvas.toBuffer('image/png');
        const pathSave = path.join(__dirname, 'tmp', `command_${config.name}.png`);
        
        // Ensure tmp directory exists
        if (!fs.existsSync(path.dirname(pathSave))) {
            fs.mkdirSync(path.dirname(pathSave), { recursive: true });
        }
        
        fs.writeFileSync(pathSave, buffer);
        
        return fs.createReadStream(pathSave);
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
