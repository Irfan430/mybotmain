// uid.js — Messenger friendly (stream), with clear debug
const fs = require("fs");
const path = require("path");
const Jimp = require("jimp");
const QRCode = require("qrcode");
const { findUid } = global.utils;

const rxIsUrl = /^(https?:\/\/)/i;
const rxFbHost = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:facebook|fb)\.com\/([^?\s#]+)/i;
const rxProfilePhp = /[?&]id=(\d{5,})/;
const rxNumericId = /^\d{5,}$/;

const TMP_DIR = path.join(process.cwd(), "tmp"); // writeable for most bot setups
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

module.exports = {
  config: {
    name: "uid",
    version: "4.1",
    author: "IrfanBot",
    countDown: 5,
    role: 0,
    description: { en: "Get Facebook UID (auto image card on Messenger)" },
    category: "info"
  },

  onStart: async function ({ message, event, args, api }) {
    const targets = new Map();
    const push = (uid,name)=>{ if(uid && !targets.has(uid)) targets.set(uid,name||null); };

    // reply
    if (event.messageReply?.senderID) push(event.messageReply.senderID);

    // mentions
    if (event.mentions && Object.keys(event.mentions).length) {
      for (const [uid, tag] of Object.entries(event.mentions)) push(uid, (tag||"").replace(/^@/,""));
    }

    // args (links/usernames/ids)
    for (const token of args) {
      try {
        let uid = null;
        if (rxNumericId.test(token)) uid = token;
        else if (rxIsUrl.test(token)) {
          const php = token.match(rxProfilePhp);
          if (php) uid = php[1];
          if (!uid) {
            const m = token.match(rxFbHost);
            if (m && m[1]) uid = await findUid(token);
          }
        } else if (/^[a-zA-Z0-9.\-]+$/.test(token)) {
          uid = await findUid(`https://facebook.com/${token}`);
        }
        if (!uid && (rxIsUrl.test(token) || token.includes("facebook.com"))) uid = await findUid(token);
        if (uid) push(uid);
      } catch {}
    }

    // self (default)
    if (!targets.size) push(event.senderID);
    if (!targets.size) return message.reply("❌ No valid UID found.");

    // enrich names (optional)
    try {
      if (typeof api?.getUserInfo === "function") {
        const info = await api.getUserInfo([...targets.keys()]);
        for (const uid of targets.keys()) if (info?.[uid]?.name) targets.set(uid, info[uid].name);
      }
    } catch {}

    // single → image card; multiple → text list
    if (targets.size === 1) {
      const [uid, nameRaw] = [...targets.entries()][0];
      const name = nameRaw || "Facebook User";
      const profileUrl = `https://facebook.com/${uid}`;

      try {
        const filePath = await renderCardToFile({ uid, name, profileUrl });
        return message.reply(
          {
            body: `🪪 UID Lookup\nName: ${name}\nUID: ${uid}\nProfile: ${profileUrl}`,
            attachment: fs.createReadStream(filePath) // Messenger-friendly stream
          },
          () => fs.existsSync(filePath) && fs.unlinkSync(filePath) // cleanup
        );
      } catch (err) {
        // Expose reason so you can fix quickly
        return message.reply(
          `🪪 UID Lookup\nName: ${name}\nUID: ${uid}\nProfile: ${profileUrl}\n\n⚠️ Image disabled: ${err?.message || err}`
        );
      }
    }

    // multiple targets (text only)
    let out = "🪪 UID Lookup\n";
    for (const [uid, name] of targets) {
      const nm = name ? `Name: ${name}\n` : "";
      out += `\n${nm}UID: ${uid}\nProfile: https://facebook.com/${uid}\n`;
    }
    return message.reply(out.trim());
  }
};

// ------ helpers ------
async function renderCardToFile({ uid, name, profileUrl }) {
  const W = 1200, H = 600;
  const bg = new Jimp(W, H, 0x0b1020ff);

  // simple gradient background
  const grad = await new Jimp(W, H);
  for (let y = 0; y < H; y++) {
    const p = y / H;
    const r = 15 + (37 - 15) * p;
    const g = 23 + (55 - 23) * p;
    const b = 42 + (90 - 42) * p;
    grad.scan(0, y, W, 1, function (x, y, idx) {
      this.bitmap.data[idx] = r;
      this.bitmap.data[idx + 1] = g;
      this.bitmap.data[idx + 2] = b;
      this.bitmap.data[idx + 3] = 255;
    });
  }
  bg.composite(grad, 0, 0);

  // avatar
  let av;
  try {
    av = await Jimp.read(`https://graph.facebook.com/${uid}/picture?height=600&width=600`);
  } catch {
    av = new Jimp(512, 512, 0x333333ff);
  }
  av.circle().resize(220, 220);
  bg.composite(av, 80, H / 2 - 110);

  // fonts
  const fTitle = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
  const fSub = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);

  bg.print(fTitle, 340, 180, name);
  bg.print(fSub, 340, 280, `UID: ${uid}`);
  bg.print(fSub, 340, 340, `Profile: facebook.com/${uid}`);

  // QR
  const qrBuf = await QRCode.toBuffer(profileUrl, { margin: 1, width: 160 });
  const qr = await Jimp.read(qrBuf);
  bg.composite(qr, W - 220, H - 220);

  // write to tmp (ensure writeable)
  const filePath = path.join(TMP_DIR, `uid_${uid}_${Date.now()}.png`);
  await bg.writeAsync(filePath);
  return filePath;
}
