const axios = require('axios');
const fs = require('fs');
const path = require('path');

// ক্যাশে সিস্টেম - প্রতিটি সার্চের জন্য আলাদা ইন্ডেক্স রাখে
const searchCache = new Map();

module.exports = {
  config: {
    name: "pic",
    aliases: ["celebrity", "celebpics", "images", "pinterest"],
    version: "2.0",
    author: "YourName",
    countDown: 5, // 5 সেকেন্ড কাউন্টডাউন
    role: 0,
    shortDescription: "সেলিব্রিটি ইমেজ সার্চ Pinterest থেকে",
    longDescription: "Pinterest API ব্যবহার করে সেলিব্রিটিদের ১০টি ছবি খুঁজে দেয়, ৫ সেকেন্ড কুলডাউন সহ",
    category: "image",
    guide: {
      en: "{pn} <সেলিব্রিটি নাম>"
    }
  },

  onStart: async function ({ message, args, event, api }) {
    try {
      const name = args.join(" ");
      if (!name) {
        return message.reply("⚠️ অনুগ্রহ করে একজন সেলিব্রিটির নাম লিখুন।");
      }

      // কুলডাউন চেক করুন
      const now = Date.now();
      const userID = event.senderID;
      const cacheKey = `${userID}_${name}`;
      
      if (searchCache.has(cacheKey)) {
        const lastSearch = searchCache.get(cacheKey);
        const timeDiff = now - lastSearch.time;
        
        if (timeDiff < 5000) { // 5 সেকেন্ড কুলডাউন
          const remainingTime = Math.ceil((5000 - timeDiff) / 1000);
          return message.reply(`⏰ ${remainingTime} সেকেন্ড পরে আবার চেষ্টা করুন।`);
        }
      }

      // ইমেজ ডাউনলোড করার জন্য ফোল্ডার তৈরি করুন
      const dirPath = path.join(__dirname, "cache", "pics");
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      message.reply(`🔍 "${name}" এর ছবি খুঁজছি...`);

      // Pinterest API থেকে ইমেজ URLs পাওয়া
      const apiUrl = `https://kaiz-apis.gleeze.com/api/pinterest?search=${encodeURIComponent(name)}&apikey=a96577fa-b30a-428a-af48-b2e816c16a4c`;
      
      const response = await axios.get(apiUrl);
      const imageUrls = response.data.data;
      
      if (!imageUrls || imageUrls.length === 0) {
        return message.reply(`❌ "${name}" এর কোনো ছবি পাওয়া যায়নি।`);
      }

      // ক্যাশে থেকে বর্তমান ইন্ডেক্স পাওয়া
      let currentIndex = 0;
      if (searchCache.has(cacheKey)) {
        currentIndex = (searchCache.get(cacheKey).index + 1) % imageUrls.length;
      }

      // ১০টি ছবি ডাউনলোড করুন (বর্তমান ইন্ডেক্স থেকে)
      const downloadedImages = [];
      for (let i = 0; i < Math.min(10, imageUrls.length); i++) {
        try {
          const imgIndex = (currentIndex + i) % imageUrls.length;
          const imagePath = path.join(dirPath, `image_${i}.jpg`);
          
          await this.downloadImage(imageUrls[imgIndex], imagePath);
          downloadedImages.push(fs.createReadStream(imagePath));
        } catch (error) {
          console.error(`Error downloading image ${i}:`, error);
        }
      }

      if (downloadedImages.length === 0) {
        return message.reply("❌ ছবি ডাউনলোড করতে সমস্যা হয়েছে।");
      }

      // ক্যাশে আপডেট করুন
      searchCache.set(cacheKey, {
        time: now,
        index: (currentIndex + 10) % imageUrls.length,
        urls: imageUrls
      });

      // ৫ মিনিট পর ক্যাশে থেকে পুরনো ডেটা মুছে ফেলুন
      setTimeout(() => {
        if (searchCache.has(cacheKey)) {
          searchCache.delete(cacheKey);
        }
      }, 5 * 60 * 1000); // 5 মিনিট

      // ছবি পাঠান
      await message.reply({
        body: `📸 ${name} - ${downloadedImages.length}টি ছবি পাওয়া গেছে\n\nপরের বার একই নামে ভিন্ন ছবি পাবেন!`,
        attachment: downloadedImages
      });

    } catch (error) {
      console.error("Error in pic command:", error);
      message.reply("❌ ছবি খুঁজে পেতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।");
    }
  },

  downloadImage: async function (url, filePath) {
    try {
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
        timeout: 10000 // 10 সেকেন্ড টাইমআউট
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    } catch (error) {
      console.error("Download error:", error);
      throw error;
    }
  }
};
