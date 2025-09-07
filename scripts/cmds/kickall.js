module.exports = {
  config: {
    name: "kickall",
    version: "1.0",
    author: "IRFAN & ChatGPT",
    countDown: 5,
    role: 2,
    shortDescription: "Remove all group members",
    longDescription: "This command removes all members from the group except the bot itself.",
    category: "admin",
    guide: {
      en: "{pn} → Remove all members from this group"
    }
  },

  onStart: async function ({ api, event }) {
    const { threadID, senderID } = event;

    try {
      // চেক করে owner/admin কি না
      const OWNER_ID_FALLBACK = "100054167013531"; // ✅ তোমার ID
      const ownerFromLegacy = (global.GoatBot?.config?.ADMIN?.[0]) || OWNER_ID_FALLBACK;

      const adminSet = new Set([
        ownerFromLegacy,
        ...(global.GoatBot?.config?.adminBot || []),
        ...(global.GoatBot?.config?.developers || [])
      ].map(String));

      if (!adminSet.has(String(senderID))) {
        return api.sendMessage("⛔ Only bot admins/owner can use this command.", threadID);
      }

      const threadInfo = await api.getThreadInfo(threadID);
      const botID = api.getCurrentUserID();
      const members = threadInfo.participantIDs.filter(id => id !== botID);

      if (!members.length) {
        return api.sendMessage("✅ No members to remove. Group is already empty (except the bot).", threadID);
      }

      api.sendMessage(`⚠️ Removing ${members.length} members from this group...`, threadID);

      for (const uid of members) {
        try {
          await api.removeUserFromGroup(uid, threadID);
        } catch (err) {
          console.log(`Failed to remove ${uid}: ${err.message}`);
        }
      }

      return api.sendMessage("✅ Finished removing all members.", threadID);
    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ Error while trying to remove all members.", threadID);
    }
  }
};
