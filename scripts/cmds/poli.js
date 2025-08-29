const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "poli",
    version: "1.0",
    author: "𝕴𝖗𝖋𝖆𝖓",
    countDown: 30,
    role: 0,
    description: "Generate images using Poli AI",
    category: "image",
    guide: {
      en: "{pn} [prompt] - Generate image using Poli AI"
    }
  },

  onStart: async function({ event, message, args, api }) {
    try {
      // Check if prompt is provided
      if (args.length === 0) {
        return message.reply("⚠️ Please provide a prompt to generate an image. Example: /poli a beautiful landscape");
      }

      const prompt = args.join(" ");
      
      // Send waiting message
      const waitingMessage = await message.reply("⏳ Generating your image, please wait...");
      
      // Encode the prompt for URL
      const encodedPrompt = encodeURIComponent(prompt);
      
      // API URL for Poli AI (replace with actual Poli API endpoint if different)
      const apiUrl = `https://kaiz-apis.gleeze.com/api/poli?prompt=${encodedPrompt}&apikey=a96577fa-b30a-428a-af48-b2e816c16a4c`;
      
      // Download the image
      const imagePath = path.join(__dirname, "tmp", "poli_image.jpg");
      
      // Ensure tmp directory exists
      if (!fs.existsSync(path.dirname(imagePath))) {
        fs.mkdirSync(path.dirname(imagePath), { recursive: true });
      }
      
      // Download the image
      const response = await axios({
        method: 'GET',
        url: apiUrl,
        responseType: 'stream'
      });
      
      const writer = fs.createWriteStream(imagePath);
      response.data.pipe(writer);
      
      writer.on('finish', async () => {
        // Delete the waiting message
        api.unsendMessage(waitingMessage.messageID);
        
        // Send the generated image
        message.reply({
          body: `✅ Your image has been generated!\n📝 Prompt: ${prompt}`,
          attachment: fs.createReadStream(imagePath)
        });
      });
      
      writer.on('error', (err) => {
        console.error("Image download error:", err);
        api.unsendMessage(waitingMessage.messageID);
        message.reply("❌ Failed to download image. Please try again.");
      });
      
    } catch (error) {
      console.error("Poli command error:", error);
      // If there's a waiting message, try to unsend it first
      if (waitingMessage) {
        try {
          api.unsendMessage(waitingMessage.messageID);
        } catch (e) {
          console.error("Could not unsend waiting message:", e);
        }
      }
      message.reply("❌ Failed to generate image. Please try again.");
    }
  }
};
