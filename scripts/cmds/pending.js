module.exports = {
  config: {
    name: "pending",
    version: "2.0",
    author: "Chitron Bhattacharjee, edited by ChatGPT",
    countDown: 5,
    role: 2,
    shortDescription: "Manage pending groups",
    longDescription: "List groups in pending state, approve or refuse them",
    category: "owner"
  },

  langs: {
    en: {
      invalidNumber: "%1 is not a valid number",
      cancelSuccess: "Refused %1 thread(s)!",
      approveSuccess: "Approved %1 thread(s) successfully!",

      cantGetPendingList: "Can't get the pending list!",
      returnListPending: "»「PENDING」«\n❮ Total threads to approve: %1 ❯\n\n%2",
      returnListClean: "「PENDING」There is no thread in the pending list",

      notAllowed: "⛔ Only bot admins/developers can use this command."
    }
  },

  onReply: async function ({ api, event, Reply, getLang }) {
    if (String(event.senderID) !== String(Reply.author)) return;
    const { body, threadID, messageID } = event;
    let count = 0;

    // Cancel mode
    if ((isNaN(body) && body.startsWith("c")) || body.startsWith("cancel")) {
      const indexes = (body.slice(1).trim()).split(/\s+/);
      for (const idx of indexes) {
        if (isNaN(idx) || idx <= 0 || idx > Reply.pending.length)
          return api.sendMessage(getLang("invalidNumber", idx), threadID, messageID);

        api.removeUserFromGroup(api.getCurrentUserID(), Reply.pending[idx - 1].threadID);
        count++;
      }
      return api.sendMessage(getLang("cancelSuccess", count), threadID, messageID);
    }

    // Approve mode
    const indexes = body.split(/\s+/);
    for (const idx of indexes) {
      if (isNaN(idx) || idx <= 0 || idx > Reply.pending.length)
        return api.sendMessage(getLang("invalidNumber", idx), threadID, messageID);

      const group = Reply.pending[idx - 1];
      api.sendMessage(
        `🦆 Connected!\n\n🆔 Thread ID: ${group.threadID}\n✨ The bot is now active here.`,
        group.threadID
      );
      count++;
    }
    return api.sendMessage(getLang("approveSuccess", count), threadID, messageID);
  },

  onStart: async function ({ api, event, getLang, commandName }) {
    const { threadID, messageID, senderID } = event;

    // --- Owner/Admin Check ---
    const OWNER_ID_FALLBACK = "61568791604271";
    const ownerFromLegacy = (global.GoatBot?.config?.ADMIN?.[0]) || OWNER_ID_FALLBACK;

    const adminSet = new Set([
      ownerFromLegacy,
      ...(global.GoatBot?.config?.adminBot || []),
      ...(global.GoatBot?.config?.developers || [])
    ].map(String));

    if (!adminSet.has(String(senderID))) {
      return api.sendMessage(getLang("notAllowed"), threadID, messageID);
    }

    let msg = "", index = 1;

    try {
      var spam = await api.getThreadList(100, null, ["OTHER"]) || [];
      var pending = await api.getThreadList(100, null, ["PENDING"]) || [];
    } catch (e) {
      return api.sendMessage(getLang("cantGetPendingList"), threadID, messageID);
    }

    const list = [...spam, ...pending].filter(group => group.isSubscribed && group.isGroup);

    for (const g of list) msg += `${index++}/ ${g.name} (${g.threadID})\n`;

    if (list.length !== 0) {
      return api.sendMessage(
        getLang("returnListPending", list.length, msg),
        threadID,
        (err, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            author: event.senderID,
            pending: list
          });
        },
        messageID
      );
    } else {
      return api.sendMessage(getLang("returnListClean"), threadID, messageID);
    }
  }
};
