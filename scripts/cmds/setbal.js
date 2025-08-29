const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "setbal",
    version: "1.2",
    author: "𝕴𝖗𝖋𝖆𝖓",
    countDown: 5,
    role: 2, // Only bot admin can use
    description: "Set user balance (Bot Owner Only)",
    category: "economy",
    guide: {
      en: "{pn} [@mention | uid] [amount] - Set user balance"
    }
  },

  onStart: async function ({ message, event, args, usersData, api }) {
    // Get bot owner ID from config
    const botOwnerIDs = global.GoatBot.config.adminBot || [];
    
    // Check if user is bot owner
    if (!botOwnerIDs.includes(event.senderID)) {
      return message.reply("❌ This command is only for the bot owner.");
    }

    // Check if arguments are provided
    if (args.length < 2) {
      return message.reply("⚠️ Please provide a user and amount. Usage: /setbal [@mention | uid] [amount]");
    }

    let targetID;
    let amount = parseFloat(args[args.length - 1]);

    // Check if amount is valid
    if (isNaN(amount) || amount < 0) {
      return message.reply("⚠️ Please provide a valid amount.");
    }

    // Check if first argument is a mention
    if (Object.keys(event.mentions).length > 0) {
      targetID = Object.keys(event.mentions)[0];
    } else {
      // Check if first argument is a UID
      targetID = args[0];
      if (isNaN(targetID)) {
        return message.reply("⚠️ Please provide a valid user mention or UID.");
      }
    }

    try {
      // Get user data
      const userData = await usersData.get(targetID);
      const userInfo = await api.getUserInfo(targetID);
      const userName = userInfo[targetID]?.name || "Unknown User";
      
      // Set new balance
      await usersData.set(targetID, {
        money: amount
      });

      // Format the money
      const formatMoney = (amount) => {
        if (isNaN(amount)) return "$0";
        amount = Number(amount);
        const scales = [
          { value: 1e15, suffix: 'Q' },
          { value: 1e12, suffix: 'T' },
          { value: 1e9, suffix: 'B' },
          { value: 1e6, suffix: 'M' },
          { value: 1e3, suffix: 'k' }
        ];
        const scale = scales.find(s => amount >= s.value);
        if (scale) {
          const scaledValue = amount / scale.value;
          return `$${scaledValue.toFixed(1)}${scale.suffix}`;
        }
        return `$${amount.toLocaleString()}`;
      };

      // Create response message
      const createFlatDisplay = (title, contentLines) => {
        return `✨ ${title} ✨\n` + 
          contentLines.map(line => `➤ ${line}`).join('\n') + '\n';
      };

      message.reply(createFlatDisplay("Balance Updated", [
        `User: ${userName}`,
        `New Balance: ${formatMoney(amount)}`,
        `Set by: Bot Owner`
      ]));

    } catch (error) {
      console.error("Setbal command error:", error);
      message.reply("❌ Failed to set balance. Please try again.");
    }
  }
};
