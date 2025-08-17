const { Sparky, isPublic } = require("../lib");
const { getJson } = require("./pluginsCore");

Sparky({
  name: "gopu",
  fromMe: isPublic,
  category: "fun",
  desc: "Send random couple DP (Thejus & Gopika)"
}, 
async ({ m }) => {
  try {
    await m.react("💑");

    // Fetch array of couple DPs
    const data = await getJson("https://gist.github.com/ayazaliofc/58f731507d834f61b9b6f6b950804a7a/raw");
    if (!Array.isArray(data) || !data.length) {
      await m.react("❌");
      return await m.reply("❌ Could not fetch couple DP, try again later.");
    }

    // Pick random entry
    const { male, female } = data[Math.floor(Math.random() * data.length)];

    // Send images
    await m.sendFromUrl(male, { caption: "👦 𝘛𝘩𝘦𝘫𝘶𝘴 🤍" });
    await m.sendFromUrl(female, { caption: "👧 𝘎𝘰𝘱𝘪𝘬𝘢 🌸" });

    await m.react("✅");
  } catch (e) {
    console.error(e);
    await m.react("❌");
    await m.reply("❌ Error fetching/sending couple DP.");
  }
});
