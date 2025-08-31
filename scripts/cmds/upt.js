const os = require("os");
const axios = require("axios");

module.exports = {
  config: {
    name: "uptime",
    version: "3.1",
    author: "IRFAN",
    role: 0,
    shortDescription: "Show advanced bot uptime info",
    longDescription: "Display advanced system statistics with performance metrics",
    category: "system",
    guide: "{pn}",
    aliases: ["upt"] // নতুন alias যোগ করা হয়েছে
  },

  onStart: async function ({ message, threadsData }) {
    try {
      // আপটাইম ক্যালকুলেশন
      const uptime = process.uptime();
      const days = Math.floor(uptime / (60 * 60 * 24));
      const hours = Math.floor((uptime % (60 * 60 * 24)) / (60 * 60));
      const minutes = Math.floor((uptime % (60 * 60)) / 60);
      const seconds = Math.floor(uptime % 60);
      const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

      // সিস্টেম ইনফো
      const cpu = os.cpus()[0].model;
      const cores = os.cpus().length;
      const platform = os.platform();
      const arch = os.arch();
      const nodeVersion = process.version;
      const hostname = os.hostname();

      // মেমোরি ইনফো
      const totalMem = os.totalmem() / 1024 / 1024 / 1024;
      const freeMem = os.freemem() / 1024 / 1024 / 1024;
      const usedMem = totalMem - freeMem;
      const memoryUsage = (usedMem / totalMem) * 100;

      // পারফরম্যান্স মেট্রিক্স
      const loadAvg = os.loadavg();
      const cpuLoad = (loadAvg[0] / cores * 100).toFixed(2);

      // বট ইনফো
      const prefix = global.GoatBot.config?.PREFIX || "/";
      const totalThreads = await threadsData.getAll().then(t => t.length);
      const totalCommands = global.GoatBot.commands.size;

      // নেটওয়ার্ক ইনফো
      const networkInterfaces = os.networkInterfaces();
      const ipAddress = Object.values(networkInterfaces)
        .flat()
        .find(i => i.family === 'IPv4' && !i.internal)?.address || 'Not Available';

      // ASCII আর্ট এবং ফরম্যাটিং
      const line = "═".repeat(45);
      
      const box = `
╔${line}╗
║ 🚀 𝗔𝗦𝗧𝗥𝗔⚡𝗠𝗜𝗡𝗗 𝗩3 𝗔𝗗𝗩𝗔𝗡𝗖𝗘𝗗 𝗦𝗧𝗔𝗧𝗨𝗦
╟${line}╢
║ ⏰ 𝗨𝗽𝘁𝗶𝗺𝗲: ${uptimeString}
║ 🔧 𝗖𝗣𝗨: ${cpu} (${cores} cores)
║ 📊 𝗖𝗣𝗨 𝗟𝗼𝗮𝗱: ${cpuLoad}%
║ 🧠 𝗥𝗔𝗠: ${usedMem.toFixed(2)}GB/${totalMem.toFixed(2)}GB (${memoryUsage.toFixed(1)}%)
║ ${getProgressBar(memoryUsage, 25)}
║ 💾 𝗣𝗹𝗮𝘁𝗳𝗼𝗿𝗺: ${platform} (${arch})
║ 🌐 𝗜𝗣 𝗔𝗱𝗱𝗿𝗲𝘀𝘀: ${ipAddress}
║ 🖥️ 𝗛𝗼𝘀𝘁𝗻𝗮𝗺𝗲: ${hostname}
║ 📦 𝗡𝗼𝗱𝗲.𝗷𝘀: ${nodeVersion}
╟${line}╢
║ 🤖 𝗕𝗼𝘁 𝗦𝘁𝗮𝘁𝘀:
║   𝗧𝗵𝗿𝗲𝗮𝗱𝘀: ${totalThreads}
║   𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀: ${totalCommands}
║   𝗣𝗿𝗲𝗳𝗶𝘅: ${prefix}
╟${line}╢
║ 👑 𝗗𝗲𝘃𝗲𝗹𝗼𝗽𝗲𝗿: IRFAN
╚${line}╝`;

      message.reply(box);
    } catch (error) {
      console.error('Error in uptime command:', error);
      message.reply("❌ An error occurred while fetching system information.");
    }
  }
};

// প্রোগ্রেস বার জেনারেটরের ফাংশন
function getProgressBar(percent, length) {
  const filled = Math.round(length * percent / 100);
  const empty = length - filled;
  return `▰`.repeat(filled) + `▱`.repeat(empty) + ` ${percent.toFixed(1)}%`;
}