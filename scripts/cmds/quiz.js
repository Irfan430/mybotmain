const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "quiz",
    aliases: ["qz"],
    version: "3.0",
    author: "Irfan",
    countDown: 3,
    role: 0,
    description: "Multiple choice quiz game with betting",
    category: "game",
    guide: {
      en: "{p}qz <bet>"
    }
  },

  onStart: async function ({ message, event, args, usersData }) {
    const bet = Math.max(0, parseInt(args[0], 10) || 0);

    // Load quiz data
    const quizPath = path.join(process.cwd(), "irfan", "quizdata.json");
    let data;
    try {
      const raw = fs.readFileSync(quizPath, "utf-8");
      data = JSON.parse(raw);
    } catch (e) {
      return message.reply("❌ quizdata.json লোড করা যায়নি!");
    }

    if (!Array.isArray(data) || data.length === 0) {
      return message.reply("❌ কোনো প্রশ্ন পাওয়া যায়নি!");
    }

    // Pick random question
    const q = data[Math.floor(Math.random() * data.length)];
    const options = ["𝗔", "𝗕", "𝗖", "𝗗"];
    let formatted = `╭──✦ ${q.question}\n`;
    q.options.forEach((opt, i) => {
      formatted += `├‣ ${options[i]}) ${opt}\n`;
    });
    formatted += "╰──────────────────‣\n";
    formatted += "𝚁𝚎𝚙𝚕𝚢 𝚝𝚘 𝚝𝚑𝚒𝚜 𝚖𝚎𝚜𝚜𝚊𝚐𝚎 𝚠𝚒𝚝𝚑 𝚢𝚘𝚞𝚛 𝚊𝚗𝚜𝚠𝚎𝚛.";

    // Ensure user has enough balance
    if (bet > 0) {
      try {
        const u = await usersData.get(event.senderID);
        if ((u.money || 0) < bet) {
          return message.reply(`❌ পর্যাপ্ত ব্যালেন্স নেই। আপনার ব্যালেন্স: $${u.money || 0}`);
        }
      } catch (e) {}
    }

    return message.reply(formatted, (err, info) => {
      if (err) return;
      const Reply = {
        commandName: "quiz",
        messageID: info.messageID,
        threadID: event.threadID,
        author: event.senderID,
        correct: String(q.answer).trim().toLowerCase(),
        bet
      };
      global.GoatBot.onReply.set(info.messageID, Reply);
    });
  },

  onReply: async function ({ message, event, Reply, usersData }) {
    if (!Reply || Reply.commandName !== "quiz") return;
    if (event.senderID !== Reply.author) return;

    const ans = (event.body || "").trim().toLowerCase();
    const correct = Reply.correct;
    const bet = Reply.bet || 0;

    if (ans === correct) {
      if (bet > 0) {
        const u = await usersData.get(event.senderID);
        u.money = (u.money || 0) + bet;
        u.data = u.data || {};
        u.data.quizWin = (u.data.quizWin || 0) + 1;
        await usersData.set(event.senderID, u);
      }
      global.GoatBot.onReply.delete(Reply.messageID);
      return message.reply(`✅ সঠিক উত্তর!\n💰 জিতলেন: $${bet}`);
    } else {
      if (bet > 0) {
        const u = await usersData.get(event.senderID);
        u.money = Math.max(0, (u.money || 0) - bet);
        u.data = u.data || {};
        u.data.quizLoss = (u.data.quizLoss || 0) + 1;
        await usersData.set(event.senderID, u);
      }
      global.GoatBot.onReply.delete(Reply.messageID);
      return message.reply(`❌ ভুল উত্তর!\n✔ সঠিক উত্তর: ${correct.toUpperCase()}\n💸 হারালেন: $${bet}`);
    }
  }
};
