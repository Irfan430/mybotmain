const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "approve",
    aliases: ["approval"],
    version: "2.1",
    author: "Aesther, edited by ChatGPT",
    role: 2,
    shortDescription: "Approve or reject groups",
    longDescription: "Manage approved, pending, and rejected groups via config.json",
    category: "admin",
    guide: {
      en: `⚙️ Usage:
{pn}                  → Approve the current group
{pn} <groupID>        → Approve a group by ID
{pn} list             → Show approved groups
{pn} pending          → Show pending groups
{pn} reject <groupID> → Reject a group
{pn} help             → Show this help`
    }
  },

  onStart: async function ({ api, event, args }) {
    const CONFIG_PATH = path.join(__dirname, "../../config.json");
    const { threadID, senderID, messageID } = event;

    // --- Helpers ---
    function readJSONSafely(file, fallback) {
      try { return JSON.parse(fs.readFileSync(file, "utf8")); }
      catch { return fallback; }
    }
    function writeJSONSafely(file, obj) {
      fs.writeFileSync(file, JSON.stringify(obj, null, 2));
    }
    function uniq(arr = []) {
      return Array.from(new Set(arr.map(String)));
    }

    // Load or initialize config
    const defaultConfig = {
      AUTO_APPROVE: {
        enabled: true,
        approvedGroups: [],
        autoApproveMessage: false
      },
      APPROVAL: {
        approvedGroups: [],
        pendingGroups: [],
        rejectedGroups: []
      },
      // keep these here in case they're missing in user's config
      adminBot: [],
      developers: []
    };

    const config = Object.assign({}, defaultConfig, readJSONSafely(CONFIG_PATH, {}));
    // ensure sections exist
    config.AUTO_APPROVE = Object.assign({}, defaultConfig.AUTO_APPROVE, config.AUTO_APPROVE || {});
    config.APPROVAL = Object.assign({}, defaultConfig.APPROVAL, config.APPROVAL || {});
    config.adminBot = uniq(config.adminBot || []);
    config.developers = uniq(config.developers || []);

    // Determine admins (accept multiple possible fields for compatibility)
    const OWNER_ID_FALLBACK = "100054167013531";
    const ownerFromLegacy = (global.GoatBot?.config?.ADMIN?.[0]) || OWNER_ID_FALLBACK;

    const adminSet = new Set([
      ownerFromLegacy,
      ...(global.GoatBot?.config?.adminBot || []),
      ...(global.GoatBot?.config?.developers || []),
      ...config.adminBot,
      ...config.developers
    ].map(String));

    const isAdmin = adminSet.has(String(senderID));

    // Restrict command
    if (!isAdmin) {
      return api.sendMessage("⛔ Only bot admins/developers can use this command.", threadID, messageID);
    }

    const subCommand = (args[0] || "").toLowerCase();
    const pn = (global.GoatBot?.config?.prefix || "/") + this.config.name;

    // HELP
    if (subCommand === "help") {
      return api.sendMessage(this.config.guide.en.replace(/{pn}/g, pn), threadID, messageID);
    }

    // LIST APPROVED
    if (subCommand === "list") {
      const approved = uniq(config.APPROVAL.approvedGroups);
      if (!approved.length)
        return api.sendMessage("📭 No approved groups.", threadID, messageID);

      return api.sendMessage(
        `✅ Approved groups (${approved.length}):\n\n` +
        approved.map((id, i) => `${i + 1}. 🆔 ${id}`).join("\n"),
        threadID, messageID
      );
    }

    // LIST PENDING
    if (subCommand === "pending") {
      const pending = uniq(config.APPROVAL.pendingGroups);
      if (!pending.length)
        return api.sendMessage("⏳ No pending groups.", threadID, messageID);

      return api.sendMessage(
        `🕒 Pending groups (${pending.length}):\n\n` +
        pending.map((id, i) => `${i + 1}. 🆔 ${id}`).join("\n"),
        threadID, messageID
      );
    }

    // REJECT
    if (subCommand === "reject") {
      const groupId = (args[1] || "").trim();
      if (!groupId)
        return api.sendMessage("❌ Please provide a group ID to reject.", threadID, messageID);

      // remove from approved & pending
      ["approvedGroups", "pendingGroups"].forEach(key => {
        config.APPROVAL[key] = (config.APPROVAL[key] || []).filter(id => String(id) !== String(groupId));
      });

      // add to rejected
      if (!config.APPROVAL.rejectedGroups.includes(groupId)) {
        config.APPROVAL.rejectedGroups.push(groupId);
      }

      writeJSONSafely(CONFIG_PATH, config);
      api.sendMessage(`🚫 Group ${groupId} rejected successfully.`, threadID, messageID);
      try {
        api.sendMessage("❌ This group has been rejected by the admin. The bot will no longer work here.", groupId);
      } catch {}
      return;
    }

    // APPROVE (current or provided)
    let targetID = (!isNaN(args[0])) ? String(args[0]) : String(threadID);

    if (config.APPROVAL.approvedGroups.includes(targetID)) {
      return api.sendMessage(`✅ This group is already approved.\n🆔 ${targetID}`, threadID, messageID);
    }
    if (config.APPROVAL.rejectedGroups.includes(targetID)) {
      return api.sendMessage(`❌ This group was previously rejected.\n🆔 ${targetID}`, threadID, messageID);
    }

    // update approval lists
    config.APPROVAL.pendingGroups = (config.APPROVAL.pendingGroups || []).filter(id => String(id) !== targetID);
    config.APPROVAL.approvedGroups.push(targetID);
    config.APPROVAL.approvedGroups = uniq(config.APPROVAL.approvedGroups);

    // sync with AUTO_APPROVE if enabled
    if (config.AUTO_APPROVE?.enabled) {
      config.AUTO_APPROVE.approvedGroups = uniq([
        ...(config.AUTO_APPROVE.approvedGroups || []),
        targetID
      ]);
    }

    writeJSONSafely(CONFIG_PATH, config);

    return api.sendMessage(
      `🎉 Group approved successfully!\n\n🆔 Thread ID: ${targetID}\n✨ The bot is now active here.`,
      threadID, messageID
    );
  }
};
