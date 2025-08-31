const fs = require("fs-extra");
const { utils } = global;

module.exports = {
	config: {
		name: "prefix",
		version: "1.8",
		author: "NTKhang + Modified by IRFAN",
		countDown: 5,
		role: 0,
		description: "Change bot prefix in your group or globally",
		category: "config",
		guide: {
			en: "To see current prefix: just type 'prefix'\n"
				+ "To change group prefix: prefix <new prefix>\n"
				+ "To change global prefix: prefix <new prefix> -g\n"
				+ "To reset prefix: prefix reset"
		}
	},

	langs: {
		en: {
			reset: "✅ Prefix reset to default:\n➡️  System prefix: %1",
			onlyAdmin: "⛔ Only admin can change the system-wide prefix.",
			confirmGlobal: "⚙️ Global prefix change requested.\n🪄 React to confirm.",
			confirmThisThread: "🛠️ Group prefix change requested.\n🪄 React to confirm.",
			successGlobal: "✅ Global prefix changed successfully!\n🆕 New prefix: %1",
			successThisThread: "✅ Group prefix updated!\n🆕 New prefix: %1"
		}
	},

	onStart: async function ({ message, role, args, commandName, event, threadsData, getLang }) {
		// যদি শুধু "prefix" লিখে থাকে (কোন আর্গুমেন্ট নেই)
		if (args.length === 0) {
			const systemPrefix = global.GoatBot.config.prefix;
			const groupPrefix = await threadsData.get(event.threadID, "data.prefix") || systemPrefix;
			
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

			const infoBox = `
╔═══════ Astra⚡Mind ═══════╗
🌐 𝗚𝗹𝗼𝗯𝗮𝗹 𝗣𝗿𝗲𝗳𝗶𝘅: ${systemPrefix}
💬 𝗚𝗿𝗼𝘂𝗽 𝗣𝗿𝗲𝗳𝗶𝘅: ${groupPrefix}
🕒 𝗧𝗶𝗺𝗲: ${timePart}
📅 𝗗𝗮𝘁𝗲: ${datePart}
╚══════════════════════╝`;

			return message.reply(infoBox);
		}

		if (args[0] === "reset") {
			await threadsData.set(event.threadID, null, "data.prefix");
			return message.reply(getLang("reset", global.GoatBot.config.prefix));
		}

		const newPrefix = args[0];
		const formSet = {
			commandName,
			author: event.senderID,
			newPrefix,
			setGlobal: args[1] === "-g"
		};

		if (formSet.setGlobal && role < 2)
			return message.reply(getLang("onlyAdmin"));

		const confirmMsg = formSet.setGlobal ? getLang("confirmGlobal") : getLang("confirmThisThread");

		return message.reply(confirmMsg, (err, info) => {
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
			return message.reply(getLang("successGlobal", newPrefix));
		} else {
			await threadsData.set(event.threadID, newPrefix, "data.prefix");
			return message.reply(getLang("successThisThread", newPrefix));
		}
	},

	onChat: async function ({ event, message, threadsData }) {
		// শুধু "prefix" লিখলেই রেসপন্স দিবে (কোন প্রিফিক্স ছাড়া)
		if (event.body && event.body.toLowerCase() === "prefix") {
			const systemPrefix = global.GoatBot.config.prefix;
			const groupPrefix = await threadsData.get(event.threadID, "data.prefix") || systemPrefix;
			
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

			const infoBox = `
╔═══════ Astra⚡Mind ═══════╗
🌐 𝗚𝗹𝗼𝗯𝗮𝗹 𝗣𝗿𝗲𝗳𝗶𝘅: ${systemPrefix}
💬 𝗚𝗿𝗼𝘂𝗽 𝗣𝗿𝗲𝗳𝗶𝘅: ${groupPrefix}
🕒 𝗧𝗶𝗺𝗲: ${timePart}
📅 𝗗𝗮𝘁𝗲: ${datePart}
╚══════════════════════╝`;

			return message.reply(infoBox);
		}
	}
};