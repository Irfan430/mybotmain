const fs = require("fs-extra");
const path = require("path");
const axios = require('axios');
const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

module.exports = {
    config: {
        name: "help",
        version: "5.0",
        author: "IRFAN",
        countDown: 5,
        role: 0,
        description: {
            en: "View all available commands with descriptions and pagination system"
        },
        category: "info",
        guide: {
            en: "{pn} [page] - View commands by page\n{pn} [command] - View command details"
        }
    },

    langs: {
        en: {
            helpHeader: "🤖 ASTRA⚡MIND COMMAND SYSTEM",
            commandNotFound: "❌ Command '{command}' not found!",
            doNotHave: "None",
            roleText0: "👥 All Users",
            roleText1: "👑 Group Admins", 
            roleText2: "⚡ Bot Admins",
            categoryEmpty: "❌ No commands found in category: {category}",
            totalCommands: "📊 Total Commands: {total}",
            categoryTitle: "📁 Category: {category}",
            commandList: "📋 Command List:",
            commandDetails: "📋 Command Details: {name}",
            pageInfo: "📄 Page {current} of {total}",
            navigation: "🔍 Use: '{prefix}help page{number}' or reply with page number"
        }
    },

    onStart: async function({ message, args, event, threadsData, role, api }) {
        const { threadID, senderID } = event;
        const prefix = getPrefix(threadID);
        
        // Get all commands
        const allCommands = this.getAllCommands(role);
        const totalPages = Math.ceil(allCommands.length / 8); // 8 commands per page to fit descriptions
        
        // Handle page navigation
        if (args[0] && args[0].startsWith("page")) {
            const pageNum = parseInt(args[0].replace("page", "")) || 1;
            return this.showPage(message, pageNum, allCommands, totalPages, prefix, threadID, senderID);
        }
        
        // Handle specific command help
        if (args[0] && !isNaN(parseInt(args[0]))) {
            const pageNum = parseInt(args[0]);
            return this.showPage(message, pageNum, allCommands, totalPages, prefix, threadID, senderID);
        }

        if (args[0]) {
            const commandName = args[0].toLowerCase();
            let cmd = commands.get(commandName) || commands.get(aliases.get(commandName));
            
            if (!cmd) {
                return message.reply(
                    this.langs.en.commandNotFound.replace(/{command}/g, commandName)
                );
            }

            const config = cmd.config;
            
            // Get description in English or fallback
            const description = config.description?.en || config.description || "No description available";
            const aliasesList = config.aliases?.join(", ") || this.langs.en.doNotHave;
            const category = config.category?.toUpperCase() || "GENERAL";
            
            let roleText;
            switch(config.role) {
                case 1: roleText = this.langs.en.roleText1; break;
                case 2: roleText = this.langs.en.roleText2; break;
                default: roleText = this.langs.en.roleText0;
            }
            
            // Get guide in English or fallback
            let guide = config.guide?.en || config.usage || config.guide || "No usage guide available";
            if (typeof guide === "object") guide = guide.body;
            guide = guide.replace(/\{prefix\}/g, prefix).replace(/\{name\}/g, config.name).replace(/\{pn\}/g, prefix + config.name);
            
            // Get bot info from config
            const botConfig = global.GoatBot.config;
            const botName = botConfig.nickNameBot || "ASTRA⚡MIND";
            const botAdmins = botConfig.adminBot || [];
            const developers = botConfig.developers || [];
            const isDeveloper = developers.includes(senderID);
            const isAdmin = botAdmins.includes(senderID);
            
            let commandDetails = 
                `🤖 **${botName} COMMAND DETAILS**\n\n` +
                `📝 **Command:** ${config.name}\n` +
                `📋 **Description:** ${description}\n` +
                `📁 **Category:** ${category}\n` +
                `🔤 **Aliases:** ${aliasesList}\n` +
                `🏷️ **Version:** ${config.version}\n` +
                `🔒 **Permissions:** ${roleText}\n` +
                `⏱️ **Cooldown:** ${config.countDown || 1}s\n` +
                `👤 **Author:** ${config.author || "Unknown"}\n\n` +
                `🛠️ **Usage:**\n${guide}\n\n` +
                `👑 **Your Role:** ${isDeveloper ? "⚡ Developer" : isAdmin ? "🔧 Admin" : "👥 User"}\n` +
                `⚡ **Developed by IRFAN**\n` +
                `🔧 ${botName} System v5.0`;

            return message.reply({
                body: commandDetails,
                attachment: await this.getHelpImage()
            });
        }

        // Default: show page 1
        return this.showPage(message, 1, allCommands, totalPages, prefix, threadID, senderID);
    },

    onChat: async function({ event, message, threadsData }) {
        const { senderID, threadID } = event;
        
        // Handle reply navigation
        if (event.type === "message_reply" && event.messageReply.body) {
            const replyBody = event.messageReply.body;
            if (replyBody.includes("COMMAND SYSTEM") || replyBody.includes("COMMAND LIST")) {
                const pageMatch = replyBody.match(/📄 Page (\d+) of (\d+)/);
                if (pageMatch) {
                    const currentPage = parseInt(pageMatch[1]);
                    const totalPages = parseInt(pageMatch[2]);
                    
                    const messageText = event.body?.toLowerCase().trim();
                    const requestedPage = parseInt(messageText);
                    
                    if (!isNaN(requestedPage) && requestedPage >= 1 && requestedPage <= totalPages) {
                        const allCommands = this.getAllCommands(0); // Default role for chat
                        return this.showPage(message, requestedPage, allCommands, totalPages, getPrefix(threadID), threadID, senderID);
                    }
                }
            }
        }
        
        // Handle "help" in chat
        const messageText = event.body?.toLowerCase().trim();
        if (messageText === "help") {
            const allCommands = this.getAllCommands(0);
            const totalPages = Math.ceil(allCommands.length / 8);
            return this.showPage(message, 1, allCommands, totalPages, getPrefix(threadID), threadID, senderID);
        }
    },

    // Get all commands filtered by role
    getAllCommands: function(role) {
        const commandList = [];
        
        for (const [name, cmd] of commands) {
            if (cmd.config.role > 1 && role < cmd.config.role) continue;
            
            const category = cmd.config.category?.toUpperCase() || "GENERAL";
            
            // Get description in English or fallback to regular description
            const description = cmd.config.description?.en || cmd.config.description || "No description available";
            
            commandList.push({
                name,
                category,
                description: description,
                role: cmd.config.role
            });
        }
        
        // Sort by category and name
        return commandList.sort((a, b) => {
            if (a.category !== b.category) {
                return a.category.localeCompare(b.category);
            }
            return a.name.localeCompare(b.name);
        });
    },

    // Show specific page
    showPage: async function(message, pageNum, allCommands, totalPages, prefix, threadID, senderID) {
        if (pageNum < 1 || pageNum > totalPages) {
            return message.reply(`❌ Invalid page number! Please choose between 1 and ${totalPages}`);
        }

        const startIndex = (pageNum - 1) * 8;
        const endIndex = Math.min(startIndex + 8, allCommands.length);
        const pageCommands = allCommands.slice(startIndex, endIndex);

        // Get bot info from config
        const botConfig = global.GoatBot.config;
        const botName = botConfig.nickNameBot || "ASTRA⚡MIND";
        const botAdmins = botConfig.adminBot || [];
        const developers = botConfig.developers || [];
        const isDeveloper = developers.includes(senderID);
        const isAdmin = botAdmins.includes(senderID);

        let commandList = 
            `🤖 **${botName} COMMAND SYSTEM**\n\n` +
            `📋 **COMMAND LIST**\n` +
            `📄 Page ${pageNum} of ${totalPages}\n\n`;

        let currentCategory = "";
        pageCommands.forEach((cmd, index) => {
            if (cmd.category !== currentCategory) {
                currentCategory = cmd.category;
                commandList += `\n📁 ${currentCategory}:\n`;
            }
            
            let roleIcon = "👥";
            if (cmd.role === 1) roleIcon = "👑";
            if (cmd.role === 2) roleIcon = "⚡";
            
            // Show command with description on the same line
            commandList += `${roleIcon} **${cmd.name}**\n`;
            commandList += `   📝 ${cmd.description}\n\n`;
        });

        commandList += 
            `📊 **Total Commands:** ${allCommands.length}\n` +
            `👑 **Your Role:** ${isDeveloper ? "⚡ Developer" : isAdmin ? "🔧 Admin" : "👥 User"}\n\n` +
            `🔍 **Navigation:**\n` +
            `• Use "${prefix}help page[number]" (e.g., "${prefix}help page2")\n` +
            `• Reply to this message with page number\n` +
            `• Use "${prefix}help [command]" for details\n\n` +
            `⚡ **Developed by IRFAN**\n` +
            `🔧 ${botName} System v5.0`;

        return message.reply({
            body: commandList,
            attachment: await this.getHelpImage()
        });
    },

    // Function to get help image
    getHelpImage: async function() {
        try {
            const imageUrl = "https://i.postimg.cc/59BGv4DD/1730967635406.jpg";
            const response = await axios.get(imageUrl, { responseType: 'stream' });
            return response.data;
        } catch (error) {
            console.error('Error loading help image:', error);
            return null;
        }
    }
};
