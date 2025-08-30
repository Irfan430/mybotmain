// bot/handler/handlerCheckData.js
const { db, utils, GoatBot } = global;
const { config } = GoatBot;
const { log, getText } = utils;
const { creatingThreadData, creatingUserData } = global.client.database;

/**
 * Safe helpers
 */
function safeThreadName(event, fallbackId) {
  // event/threadInfo থেকে নাম চেষ্টা করো; না পেলে ডিফল্ট
  return (
    event?.threadName ||
    event?.thread_info?.name || // কিছু lib এ এইভাবে আসে
    event?.threadInfo?.name ||  // FCA getThreadInfo() রেজাল্ট
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

      const findInCreatingThreadData = creatingThreadData.find(
        (t) => t.threadID == threadID
      );

      // যদি অন্য কোনো async ক্রিয়েশন ইতিমধ্যে প্রগ্রেসে থাকে
      if (findInCreatingThreadData) {
        await findInCreatingThreadData.promise;
      } else {
        // নতুন ক্রিয়েশনের প্রমিস রেজিস্টার
        let resolvePromise, rejectPromise;
        const creatingPromise = new Promise((res, rej) => {
          resolvePromise = res;
          rejectPromise = rej;
        });
        creatingThreadData.push({
          threadID,
          promise: creatingPromise,
        });

        try {
          // আগে থ্রেড ডাটা আছে কিনা দেখো
          const exists = await threadsData.get(threadID).catch(() => null);
          if (!exists) {
            // threadName resolve
            let threadName = event?.threadName || null;

            // না থাকলে API চেষ্টা
            if (!threadName && typeof global.api?.getThreadInfo === "function") {
              const info = await global.api.getThreadInfo(threadID).catch(() => null);
              threadName = info?.name || null;
            }

            // একদমই না পেলে ফালব্যাক
            if (!threadName) threadName = safeThreadName(event, threadID);

            // participants
            const participants = Array.isArray(event?.participantIDs)
              ? event.participantIDs.map(String)
              : [];

            await threadsData.create({
              threadID,
              threadName,
              isGroup: event?.isGroup === true,
              participants,
              settings: {},
              data: {}
            });

            log.info(
              "DATABASE",
              `New Thread: ${threadID} | ${threadName} | ${config.database.type}`
            );
          }
          resolvePromise();
        } catch (err) {
          rejectPromise(err);
          if (err?.name !== "DATA_ALREADY_EXISTS") {
            global.temp.createThreadDataError.push(threadID);
            log.err(
              "DATABASE",
              getText("handlerCheckData", "cantCreateThread", threadID),
              err
            );
          }
        } finally {
          // queue থেকে এই থ্রেড রেজিস্ট্রি সরাও
          const idx = creatingThreadData.findIndex((t) => t.threadID == threadID);
          if (idx > -1) creatingThreadData.splice(idx, 1);
        }
      }
    } catch (err) {
      // কোনো অপ্রত্যাশিত নাল/টাইপ ইস্যু হলে বট থামবে না
      log.err("DATABASE", "Unexpected error while checking thread data", err);
    }
  }

  // ————————————— CHECK USER DATA ————————————— //
  if (senderID) {
    try {
      const findInCreatingUserData = creatingUserData.find((u) => u.userID == senderID);

      if (!findInCreatingUserData) {
        const exists = await usersData.get(senderID).catch(() => null);
        if (!exists) {
          const userData = await usersData.create(senderID);
          log.info(
            "DATABASE",
            `New User: ${senderID} | ${userData?.name || "unknown"} | ${config.database.type}`
          );
        }
      } else {
        await findInCreatingUserData.promise;
      }
    } catch (err) {
      if (err?.name !== "DATA_ALREADY_EXISTS") {
        log.err("DATABASE", getText("handlerCheckData", "cantCreateUser", senderID), err);
      }
    }
  }
};