const fs = require("fs");
const path = require("path");
const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

module.exports = {
  config: {
    name: "help",
    version: "3.2",
    author: "𝕴𝖗𝖋𝖆𝖓",
    countDown: 5,
    role: 0,
    description: "View command information with enhanced interface",
    category: "info",
    guide: {
      en: "{pn} [command] - View command details\n{pn} all - View all commands\n{pn} c [category] - View commands in category"
    }
  },

  langs: {
    en: {
      helpHeader: "╔══════════◇◆◇══════════╗\n"
                + "      𝗕𝗢𝗧 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗟𝗜𝗦𝗧\n"
                + "╠══════════◇◆◇══════════╣",
      categoryHeader: "\n   ┌────── {category} ──────┐\n",
      commandItem: "║ │ 🟢 {name}",
      helpFooter: "║ └─────────────────┘\n"
                + "╚══════════◇◆◇══════════╝",
      commandInfo: "╔══════════◇◆◇══════════╗\n"
                 + "║        𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗧𝗜𝗢𝗡      \n"
                 + "╠══════════◇◆◇══════════╣\n"
                 + "║ 🏷️ 𝗡𝗮𝗺𝗲: {name}\n"
                 + "║ 📝 𝗗𝗲𝘀𝗰𝗿𝗶𝗽𝘁𝗶𝗼𝗻: {description}\n"
                 + "║ 📂 𝗖𝗮𝘁𝗲𝗴𝗼𝗿𝘆: {category}\n"
                 + "║ 🔤 𝗔𝗹𝗶𝗮𝘀𝗲𝘀: {aliases}\n"
                 + "║ 🏷️ 𝗩𝗲𝗿𝘀𝗶𝗼𝗻: {version}\n"
                 + "║ 🔒 𝗣𝗲𝗿𝗺𝗶𝘀𝘀𝗶𝗼𝗻𝘀: {role}\n"
                 + "║ ⏱️ 𝗖𝗼𝗼𝗹𝗱𝗼𝘄𝗻: {countDown}𝘀\n"
                 + "║ 🔧 𝗨𝘀𝗲 𝗣𝗿𝗲𝗳𝗶𝘅: {usePrefix}\n"
                 + "║ 👤 𝗔𝘂𝘁𝗵𝗼𝗿: {author}\n"
                 + "╠══════════◇◆◇══════════╣",
      usageHeader: "║ 🛠️ 𝗨𝗦𝗔𝗚𝗘 𝗚𝗨𝗜𝗗𝗘",
      usageBody: " ║ {usage}",
      usageFooter: "╚══════════◇◆◇══════════╝",
      commandNotFound: "⚠️ Command '{command}' not found!",
      doNotHave: "None",
      roleText0: "👥 𝗔𝗹𝗹 𝗨𝘀𝗲𝗿𝘀",
      roleText1: "👑 𝗚𝗿𝗼𝘂𝗽 𝗔𝗱𝗺𝗶𝗻𝘀",
      roleText2: "⚡ 𝗕𝗼𝘁 𝗔𝗱𝗺𝗶𝗻𝘀",
      totalCommands: "📊 𝗧𝗼𝘁𝗮𝗹 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀: {total}\n"
                  + "𝕴𝖗𝖋𝖆𝖓"
    }
  },

  onStart: async function({ message, args, event, threadsData, role }) {
    const { threadID } = event;
    const prefix = getPrefix(threadID);
    const commandName = args[0]?.toLowerCase();
    const bannerURL = "https://i.postimg.cc/8k6G7JVR/20250813-233631-200.jpg";

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
        return message.reply(`❌ No commands found in category: ${categoryArg}`);
      }

      let replyMsg = this.langs.en.helpHeader;
      replyMsg += this.langs.en.categoryHeader.replace(/{category}/g, categoryArg);

      commandsInCategory.sort((a, b) => a.name.localeCompare(b.name)).forEach(cmd => {
        replyMsg += this.langs.en.commandItem.replace(/{name}/g, cmd.name) + "\n";
      });

      replyMsg += this.langs.en.helpFooter;
      replyMsg += "\n" + this.langs.en.totalCommands.replace(/{total}/g, commandsInCategory.length);

      return message.reply(replyMsg);
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

      const sortedCategories = [...categories.keys()].sort();
      let replyMsg = this.langs.en.helpHeader.replace(/{prefix}/g, prefix);
      let totalCommands = 0;

      for (const category of sortedCategories) {
        const commandsInCategory = categories.get(category).sort((a, b) => a.name.localeCompare(b.name));
        totalCommands += commandsInCategory.length;

        replyMsg += this.langs.en.categoryHeader.replace(/{category}/g, category);

        commandsInCategory.forEach(cmd => {
          replyMsg += this.langs.en.commandItem.replace(/{name}/g, cmd.name) + "\n";
        });

        replyMsg += this.langs.en.helpFooter;
      }

      replyMsg += "\n" + this.langs.en.totalCommands.replace(/{total}/g, totalCommands);

      try {
        return message.reply({
          body: replyMsg,
          attachment: await global.utils.getStreamFromURL(bannerURL)
        });
      } catch (e) {
        console.error("Couldn't load help banner:", e);
        return message.reply(replyMsg);
      }
    }

    let cmd = commands.get(commandName) || commands.get(aliases.get(commandName));
    if (!cmd) {
      return message.reply(this.langs.en.commandNotFound.replace(/{command}/g, commandName));
    }

    const config = cmd.config;
    const description = config.description?.en || config.description || "No description";
    const aliasesList = config.aliases?.join(", ") || this.langs.en.doNotHave;
    const category = config.category?.toUpperCase() || "GENERAL";

    let roleText;
    switch(config.role) {
      case 1: roleText = this.langs.en.roleText1; break;
      case 2: roleText = this.langs.en.roleText2; break;
      default: roleText = this.langs.en.roleText0;
    }

    let guide = config.guide?.en || config.usage || config.guide || "No usage guide available";
    if (typeof guide === "object") guide = guide.body;
    guide = guide.replace(/\{prefix\}/g, prefix).replace(/\{name\}/g, config.name).replace(/\{pn\}/g, prefix + config.name);

    let replyMsg = this.langs.en.commandInfo
      .replace(/{name}/g, config.name)
      .replace(/{description}/g, description)
      .replace(/{category}/g, category)
      .replace(/{aliases}/g, aliasesList)
      .replace(/{version}/g, config.version)
      .replace(/{role}/g, roleText)
      .replace(/{countDown}/g, config.countDown || 1)
      .replace(/{usePrefix}/g, typeof config.usePrefix === "boolean" ? (config.usePrefix ? "✅ Yes" : "❌ No") : "❓ Unknown")
      .replace(/{author}/g, "𝕴𝖗𝖋𝖆𝖓");

    replyMsg += "\n" + this.langs.en.usageHeader + "\n" +
                this.langs.en.usageBody.replace(/{usage}/g, guide.split("\n").join("\n ")) + "\n" +
                this.langs.en.usageFooter;

    return message.reply(replyMsg);
  }
};
