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

      const inProgress = creatingThreadData.find(t => t.threadID == threadID);
      if (!inProgress) {
        if (global.db.allThreadData?.some?.(t => t.threadID == threadID)) return;

        // queue রেজিস্টার (duplicate create এড়াতে)
        let resolvePromise, rejectPromise;
        const creatingPromise = new Promise((res, rej) => { resolvePromise = res; rejectPromise = rej; });
        creatingThreadData.push({ threadID, promise: creatingPromise });

        try {
          // threadsData.create(threadID) internally calls api.getThreadInfo and fills fields
          const threadData = await threadsData.create(threadID).catch(() => null);
          const tName = threadData?.threadName || safeThreadName(event, threadID);

          log.info("DATABASE", `New Thread: ${threadID} | ${tName} | ${config.database.type}`);

          // ✅ Auto-Approve so bot won't be silent on new DB
          await threadsData.update(threadID, d => {
            d.settings ??= {};
            d.settings.approval = { status: true, approvedBy: "system", at: Date.now() };
            d.threadName ||= tName;
            d.isGroup = event?.isGroup === true;
            d.participants = Array.isArray(event?.participantIDs)
              ? event.participantIDs.map(String)
              : (d.participants || []);
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
        await inProgress.promise;
      }
    } catch (err) {
      log.err("DATABASE", "Unexpected error while checking thread data", err);
    }
  }

  // ————————————— CHECK USER DATA ————————————— //
  if (senderID) {
    try {
      const inProgress = creatingUserData.find(u => u.userID == senderID);
      if (!inProgress) {
        if (db.allUserData?.some?.(u => u.userID == senderID)) return;

        const userData = await usersData.create(senderID).catch(() => null);
        log.info(
          "DATABASE",
          `New User: ${senderID} | ${userData?.name || "unknown"} | ${config.database.type}`
        );
      } else {
        await inProgress.promise;
      }
    } catch (err) {
      if (err?.name != "DATA_ALREADY_EXISTS")
        log.err("DATABASE", getText("handlerCheckData", "cantCreateUser", senderID), err);
    }
  }
};