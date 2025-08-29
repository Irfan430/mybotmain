const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "uid",
    version: "2.2",
    author: "𝕴𝖗𝖋𝖆𝖓",
    countDown: 5,
    role: 0,
    description: "Get user ID information with enhanced display and profile picture",
    category: "info",
    guide: {
      en: "{pn} [@mention | reply] - Get user ID information"
    }
  },

  onStart: async function({ event, message, usersData, args, api }) {
    try {
      // Send waiting message first
      const waitingMessage = await message.reply("⏳ Fetching user information, please wait...");
      
      let targetID;
      let targetName;
      
      // Check if there's a mention or reply
      if (Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
        targetName = event.mentions[targetID];
      } else if (event.messageReply) {
        targetID = event.messageReply.senderID;
        // Get user info from API
        const userInfo = await api.getUserInfo(targetID);
        targetName = userInfo[targetID].name;
      } else {
        targetID = event.senderID;
        // Get user info from API
        const userInfo = await api.getUserInfo(targetID);
        targetName = userInfo[targetID].name;
      }

      const profileLink = `https://facebook.com/${targetID}`;
      const profilePicURL = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      
      // Create a beautiful formatted message without tips
      const formattedMessage = `
╔═══════════════════════════════╗
│        𝗨𝗦𝗘𝗥 𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗧𝗜𝗢𝗡       │
╠═══════════════════════════════╣
│ 𝗡𝗮𝗺𝗲: ${targetName}
│ 𝗨𝗜𝗗: ${targetID}
│ 𝗣𝗿𝗼𝗳𝗶𝗹𝗲: ${profileLink}
╚═══════════════════════════════╝
      `.trim();

      // Unsend the waiting message
      api.unsendMessage(waitingMessage.messageID);
      
      // Send the actual result with profile picture
      message.reply({
        body: formattedMessage,
        attachment: await global.utils.getStreamFromURL(profilePicURL)
      });
      
    } catch (error) {
      console.error("UID Command Error:", error);
      // If there's a waiting message, try to unsend it first
      if (waitingMessage) {
        try {
          api.unsendMessage(waitingMessage.messageID);
        } catch (e) {
          console.error("Could not unsend waiting message:", e);
        }
      }
      // Send error message
      message.reply("❌ An error occurred while fetching user information. Please try again.");
    }
  }
};
