const fs = require("fs-extra");
const path = require("path");
const sleep = ms => new Promise(res => setTimeout(res, ms));

module.exports = {
  config: {
    name: "autofdrq",
    version: "1.4",
    author: "IRFAN & ChatGPT",
    countDown: 10,
    role: 1,
    shortDescription: {
      en: "Start auto friend request accept and group add"
    },
    longDescription: {
      en: "Automatically accepts incoming friend requests every 5 minutes and adds them to a specific group. Also notifies the owner."
    },
    category: "admin",
    guide: {
      en: "+autofdrq"
    }
  },

  onStart: async function ({ api, message }) {
    const GROUP_TID = "8774256825985157"; // ✅ your group ID
    const OWNER_UID = "100054167013531";  // ✅ your ID

    // যদি আগেই ইন্টারভ্যাল চলে তবে সেটি বন্ধ করো
    if (global.autofdrqInterval) {
      clearInterval(global.autofdrqInterval);
      global.autofdrqInterval = null;
    }

    message.reply("✅ Auto FD accept started. Every 5 minutes checking new requests...");

    // প্রতি 5 মিনিট = 300000 ms
    global.autofdrqInterval = setInterval(async () => {
      try {
        const friendRequests = await api.getThreadList(100, null, ["PENDING"]);
        const newRequests = friendRequests.filter(t => t.isFriendRequest && t.threadType === "USER");

        if (!newRequests.length) return;

        for (const thread of newRequests) {
          const uid = thread.userID || thread.threadID;
          if (!uid) continue;

          try {
            await api.acceptFriendRequest(uid);
            await sleep(1000);

            try {
              await api.addUserToGroup(uid, GROUP_TID);
              await sleep(1000);
              await api.sendMessage(`✅ Accepted friend request from ${uid} and added to group.`, OWNER_UID);
            } catch (groupErr) {
              const fallbackMsg = `⚠️ Accepted ${uid} but couldn't add to group.\n└─ Reason: ${groupErr.message}`;
              try {
                await api.sendMessage(fallbackMsg, OWNER_UID);
              } catch {
                await api.sendMessage(fallbackMsg, GROUP_TID);
              }
            }

          } catch (acceptErr) {
            const failAcceptMsg = `❌ Failed to accept request from ${uid}\n└─ Reason: ${acceptErr.message}`;
            try {
              await api.sendMessage(failAcceptMsg, OWNER_UID);
            } catch {
              await api.sendMessage(failAcceptMsg, GROUP_TID);
            }
          }
        }
      } catch (err) {
        const errorMsg = `❌ Global error during autoFD processing\n└─ Reason: ${err.message}`;
        try {
          await api.sendMessage(errorMsg, OWNER_UID);
        } catch {
          await api.sendMessage(errorMsg, GROUP_TID);
        }
      }
    }, 300000); // 5 minutes interval
  }
};
