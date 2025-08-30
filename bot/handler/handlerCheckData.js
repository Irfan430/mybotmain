// bot/handler/handlerCheckData.js
const { db, utils, GoatBot } = global;
const { config } = GoatBot;
const { log, getText } = utils;
const { creatingThreadData, creatingUserData } = global.client.database;

function safeThreadName(event, fallbackId) {
  return (
    event?.threadName ||
    event?.thread_info?.name ||
    event?.threadInfo?.name ||
    `group_${fallbackId || "unknown"}`
  );
}

module.exports = async function (usersData, threadsData, event) {
  const threadID = String(event?.threadID || "");
  const senderID = event?.senderID || event?.author || event?.userID;

  // ———————————— CHECK THREAD DATA ———————————— //
  if (threadID) {
    try {
      if (global.temp.createThreadDataError.includes(threadID)) return;

      const findInCreatingThreadData =
        creatingThreadData.find(t => t.threadID == threadID);

      if (!findInCreatingThreadData) {
        // cache এ থাকলে স্কিপ
        if (global.db.allThreadData?.some?.(t => t.threadID == threadID)) return;

        // create queue-তে রেজিস্টার (double create এড়াতে)
        let resolvePromise, rejectPromise;
        const creatingPromise = new Promise((res, rej) => { resolvePromise = res; rejectPromise = rej; });
        creatingThreadData.push({ threadID, promise: creatingPromise });

        try {
          // থ্রেড ডাটা তৈরি (framework অনুযায়ী create(threadID))
          const threadData = await threadsData.create(threadID).catch(() => null);

          // লগ সেফ: threadData নাল হলে ফেলে দিও না
          const tName = threadData?.threadName || safeThreadName(event, threadID);
          log.info("DATABASE", `New Thread: ${threadID} | ${tName} | ${config.database.type}`);

          // ✅ Auto-Approve: নতুন থ্রেডেই অ্যাপ্রুভ অন করে দাও, যাতে বট রিপ্লাই দেয়
          await threadsData.update(threadID, d => {
            d.settings ??= {};
            d.settings.approval = { status: true, approvedBy: "system", at: Date.now() };
            // fallback data গুলোও সেফ করে রাখি
            d.threadName ||= tName;
            d.isGroup = event?.isGroup === true;
            d.participants = Array.isArray(event?.participantIDs) ? event.participantIDs.map(String) : (d.participants || []);
            return d;
          }).catch(() => {});

          resolvePromise();
        } catch (err) {
          rejectPromise(err);
          if (err?.name != "DATA_ALREADY_EXISTS") {
            global.temp.createThreadDataError.push(threadID);
            log.err("DATABASE", getText("handlerCheckData", "cantCreateThread", threadID), err);
          }
        } finally {
          const idx = creatingThreadData.findIndex(t => t.threadID == threadID);
          if (idx > -1) creatingThreadData.splice(idx, 1);
        }
      } else {
        // চলমান ক্রিয়েশন থাকলে ওটাই শেষ হওয়া পর্যন্ত অপেক্ষা
        await findInCreatingThreadData.promise;
      }
    } catch (err) {
      log.err("DATABASE", "Unexpected error while checking thread data", err);
    }
  }

  // ————————————— CHECK USER DATA ————————————— //
  if (senderID) {
    try {
      const findInCreatingUserData =
        creatingUserData.find(u => u.userID == senderID);

      if (!findInCreatingUserData) {
        // cache এ থাকলে স্কিপ
        if (db.allUserData?.some?.(u => u.userID == senderID)) return;

        const userData = await usersData.create(senderID).catch(() => null);
        log.info(
          "DATABASE",
          `New User: ${senderID} | ${userData?.name || "unknown"} | ${config.database.type}`
        );
      } else {
        await findInCreatingUserData.promise;
      }
    } catch (err) {
      if (err?.name != "DATA_ALREADY_EXISTS")
        log.err("DATABASE", getText("handlerCheckData", "cantCreateUser", senderID), err);
    }
  }
};