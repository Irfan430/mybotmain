const fs = require("fs-extra");
const { utils } = global;
const axios = require('axios');
const path = require('path');

module.exports = {
    config: {
        name: "prefix",
        version: "2.2",
        author: "NTKhang + Enhanced by IRFAN",
        countDown: 5,
        role: 0,
        description: "Change bot prefix in your group or globally with enhanced UI",
        category: "config",
        guide: {
            en: "🔹 To see current prefix: just type 'prefix'\n"
                + "🔹 To change group prefix: prefix <new prefix>\n"
                + "🔹 To change global prefix: prefix <new prefix> -g\n"
                + "🔹 To reset prefix: prefix reset"
        }
    },

    langs: {
        en: {
            reset: "🔄 **Prefix Reset Successfully!**\n\n✅ System prefix has been reset to default:\n`%1`\n\n⚡ AstraMind System • Powered by IRFAN",
            onlyAdmin: "🚫 **Access Denied!**\n\nOnly administrators can change the system-wide prefix.\n\n🔒 Administrative privileges required.",
            confirmGlobal: "🌐 **Global Prefix Change Request**\n\nYou're about to change the global prefix to: `%1`\n\n⚠️ This will affect ALL groups and users!\n\nPlease react to this message to confirm the change.",
            confirmThisThread: "💬 **Group Prefix Change Request**\n\nYou're about to change this group's prefix to: `%1`\n\n✅ This change will only affect this group.\n\nPlease react to this message to confirm the change.",
            successGlobal: "🌐 **Global Prefix Updated!**\n\n✅ Successfully changed global prefix to:\n`%1`\n\n⚡ AstraMind System • Global Configuration Updated",
            successThisThread: "💬 **Group Prefix Updated!**\n\n✅ Successfully changed this group's prefix to:\n`%1`\n\n⚡ AstraMind System • Group Configuration Updated",
            prefixInfo: "🤖 **ASTRA⚡MIND PREFIX INFORMATION**\n\n"
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

            const prefixInfoMessage = 
                getLang("prefixInfo") +
                `👥 **Group:** ${groupName}\n\n` +
                `🌐 **Global Prefix:** \`${systemPrefix}\`\n` +
                `💬 **Group Prefix:** \`${groupPrefix}\`\n\n` +
                `🕒 **Time:** ${timePart}\n` +
                `📅 **Date:** ${datePart}\n\n` +
                `⚡ **Developed by IRFAN**\n` +
                `🔧 **AstraMind Robotic System v2.2**`;

            return message.reply({
                body: prefixInfoMessage,
                attachment: await this.getPrefixImage()
            });
        }

        if (args[0] === "reset") {
            await threadsData.set(event.threadID, null, "data.prefix");
            
            const resetMessage = 
                `🔄 **PREFIX RESET COMPLETED**\n\n` +
                `✅ Successfully reset prefix to system default:\n` +
                `\`${global.GoatBot.config.prefix}\`\n\n` +
                `⚡ AstraMind System • Configuration Reset`;

            return message.reply({
                body: resetMessage,
                attachment: await this.getPrefixImage()
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
            const adminErrorMessage = 
                `🚫 **ADMINISTRATOR PRIVILEGES REQUIRED**\n\n` +
                `⛔ You don't have permission to change the global prefix.\n\n` +
                `🔒 This action requires system administrator role (level 2).\n\n` +
                `⚡ AstraMind System • Security Protocol`;

            return message.reply({
                body: adminErrorMessage,
                attachment: await this.getPrefixImage()
            });
        }

        const confirmMsg = formSet.setGlobal 
            ? getLang("confirmGlobal", newPrefix)
            : getLang("confirmThisThread", newPrefix);

        return message.reply({
            body: confirmMsg,
            attachment: await this.getPrefixImage()
        }, (err, info) => {
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
            
            const successMessage = 
                `🌐 **GLOBAL PREFIX UPDATE SUCCESSFUL**\n\n` +
                `✅ Global prefix has been updated to:\n` +
                `\`${newPrefix}\`\n\n` +
                `⚡ This change affects ALL groups and users.\n` +
                `🔧 AstraMind System • Global Configuration`;

            return message.reply({
                body: successMessage,
                attachment: await this.getPrefixImage()
            });
        } else {
            await threadsData.set(event.threadID, newPrefix, "data.prefix");
            
            const successMessage = 
                `💬 **GROUP PREFIX UPDATE SUCCESSFUL**\n\n` +
                `✅ Group prefix has been updated to:\n` +
                `\`${newPrefix}\`\n\n` +
                `⚡ This change only affects this group.\n` +
                `🔧 AstraMind System • Group Configuration`;

            return message.reply({
                body: successMessage,
                attachment: await this.getPrefixImage()
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

            const prefixInfoMessage = 
                `🤖 **ASTRA⚡MIND PREFIX SYSTEM**\n\n` +
                `👥 **Group:** ${groupName}\n\n` +
                `🌐 **Global Prefix:** \`${systemPrefix}\`\n` +
                `💬 **Group Prefix:** \`${groupPrefix}\`\n\n` +
                `🕒 **Time:** ${timePart}\n` +
                `📅 **Date:** ${datePart}\n\n` +
                `⚡ **Commands:**\n` +
                `• Type 'prefix <new>' to change group prefix\n` +
                `• Type 'prefix reset' to reset to default\n` +
                `• Add '-g' for global changes (admin only)\n\n` +
                `🔧 **AstraMind System v2.2**\n` +
                `👨‍💻 **Developed by IRFAN**`;

            return message.reply({
                body: prefixInfoMessage,
                attachment: await this.getPrefixImage()
            });
        }
    },

    // Function to get your image
    getPrefixImage: async function() {
        try {
            const imageUrl = "https://i.postimg.cc/59BGv4DD/1730967635406.jpg";
            const response = await axios.get(imageUrl, { responseType: 'stream' });
            return response.data;
        } catch (error) {
            console.error('Error loading prefix image:', error);
            return null;
        }
    }
};
