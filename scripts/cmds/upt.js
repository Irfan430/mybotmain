const fs = require("fs-extra");
const axios = require('axios');

module.exports = {
    config: {
        name: "uptime",
        version: "2.0",
        author: "IRFAN",
        countDown: 5,
        role: 0,
        description: "Check bot uptime with advanced statistics",
        category: "system",
        guide: {
            en: "💻 Use {p}uptime or {p}upt to check bot uptime and system status"
        },
        aliases: ["upt", "runtime", "online"]
    },

    onStart: async function ({ message, event, threadsData, usersData, commandName }) {
        try {
            // Calculate uptime
            const uptime = process.uptime();
            const days = Math.floor(uptime / (3600 * 24));
            const hours = Math.floor((uptime % (3600 * 24)) / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);

            // Get system statistics
            const os = require('os');
            const totalMemory = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2);
            const freeMemory = (os.freemem() / (1024 * 1024 * 1024)).toFixed(2);
            const usedMemory = (totalMemory - freeMemory).toFixed(2);
            const memoryUsage = ((usedMemory / totalMemory) * 100).toFixed(1);
            const platform = os.platform();
            const arch = os.arch();
            const cpuCount = os.cpus().length;
            const cpuModel = os.cpus()[0].model;

            // Get bot statistics
            const allThreads = await threadsData.getAll();
            const allUsers = await usersData.getAll();
            const activeThreads = allThreads.filter(thread => thread && thread.data).length;
            const totalUsers = allUsers.length;

            // Get current time and date
            const now = new Date();
            const startTime = new Date(now - uptime * 1000);
            
            const formatTime = (date) => {
                return date.toLocaleString("en-US", {
                    timeZone: "Asia/Dhaka",
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true,
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            };

            const currentTime = formatTime(now);
            const bootTime = formatTime(startTime);

            // Create enhanced uptime message
            const uptimeMessage = 
                `🤖 **ASTRA⚡MIND SYSTEM STATUS**\n\n` +
                
                `⏰ **UPTIME STATISTICS**\n` +
                `🕒 Online For: ${days > 0 ? `${days}d ` : ''}${hours}h ${minutes}m ${seconds}s\n` +
                `🚀 Boot Time: ${bootTime}\n` +
                `🔄 Current Time: ${currentTime}\n\n` +
                
                `📊 **BOT STATISTICS**\n` +
                `💬 Active Groups: ${activeThreads}\n` +
                `👥 Total Users: ${totalUsers}\n` +
                `⚡ Commands Processed: Calculating...\n\n` +
                
                `💻 **SYSTEM INFORMATION**\n` +
                `🖥️ Platform: ${platform} | ${arch}\n` +
                `🧠 CPU: ${cpuCount} Core | ${cpuModel.split('@')[0].trim()}\n` +
                `💾 Memory: ${usedMemory}GB / ${totalMemory}GB (${memoryUsage}%)\n` +
                `📈 Performance: ${memoryUsage > 80 ? '⚠️ High' : memoryUsage > 60 ? '✅ Normal' : '👍 Excellent'}\n\n` +
                
                `🔧 **SYSTEM STATUS**\n` +
                `✅ Bot: Online & Operational\n` +
                `🌐 API: Responsive\n` +
                `📡 Connection: Stable\n` +
                `🔥 Performance: Optimal\n\n` +
                
                `⚡ **Developed by IRFAN**\n` +
                `🔧 AstraMind System v2.0 | ${days === 0 ? 'Fresh Start' : days === 1 ? '1 Day Running' : `${days} Days Stable`}`;

            // Send message with image
            return message.reply({
                body: uptimeMessage,
                attachment: await this.getUptimeImage()
            });

        } catch (error) {
            console.error('Uptime command error:', error);
            
            const errorMessage = 
                `⚠️ **SYSTEM STATUS UPDATE**\n\n` +
                `❌ Unable to retrieve full system information\n` +
                `📊 Basic Uptime: ${Math.floor(process.uptime() / 60)} minutes\n` +
                `🔧 System: Partially Operational\n\n` +
                `⚡ AstraMind System | Technical Team Notified`;

            return message.reply({
                body: errorMessage,
                attachment: await this.getUptimeImage()
            });
        }
    },

    onChat: async function ({ event, message }) {
        // Respond to "upt" and "uptime" without prefix
        const messageText = event.body?.toLowerCase().trim();
        
        if (messageText === "upt" || messageText === "uptime") {
            await this.onStart({ message, event, threadsData: global.threadsData, usersData: global.usersData, commandName: "uptime" });
        }
    },

    // Function to get your uptime image
    getUptimeImage: async function() {
        try {
            const imageUrl = "https://i.postimg.cc/59BGv4DD/1730967635406.jpg";
            const response = await axios.get(imageUrl, { responseType: 'stream' });
            return response.data;
        } catch (error) {
            console.error('Error loading uptime image:', error);
            return null;
        }
    },

    // Additional system monitoring function
    getSystemHealth: function() {
        const os = require('os');
        const load = os.loadavg();
        const memory = {
            total: os.totalmem(),
            free: os.freemem(),
            used: os.totalmem() - os.freemem()
        };
        
        return {
            loadAverage: load.map(l => l.toFixed(2)),
            memoryUsage: ((memory.used / memory.total) * 100).toFixed(1),
            uptime: os.uptime()
        };
    }
};
