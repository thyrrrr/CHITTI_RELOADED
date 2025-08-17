const { Sparky, isPublic, getJson } = require("../lib");
const Jimp = require("jimp");

async function addTextToImage(url, text) {
    const image = await Jimp.read(url);
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);

    image.print(
        font,
        10,
        image.bitmap.height - 50,
        {
            text,
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
            alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
        },
        image.bitmap.width
    );

    const buffer = await image.getBufferAsync(Jimp.MIME_JPEG);
    return buffer;
}

Sparky({
    name: "us🤍",
    fromMe: isPublic,
    category: "fun",
    desc: "Send random couple DP with Thejus & Gopika"
}, 
async ({ m }) => {
    try {
        const data = await getJson("https://raw.githubusercontent.com/AyazAliOFC/couple-dp-json/main/couple.json");

        if (!data || !data.result) {
            return await m.reply("❌ Could not fetch couple DP, try again later.");
        }

        const couple = data.result[Math.floor(Math.random() * data.result.length)];
        const { male, female } = couple;

        // Add names on images
        const maleImg = await addTextToImage(male, "𝘛𝘩𝘦𝘫𝘶𝘴");
        const femaleImg = await addTextToImage(female, "𝘎𝘰𝘱𝘪𝘬𝘢");

        await m.sendMessage(m.jid, { image: maleImg, caption: "👦 𝘛𝘩𝘦𝘫𝘶𝘴" });
        await m.sendMessage(m.jid, { image: femaleImg, caption: "👧 𝘎𝘰𝘱𝘪𝘬𝘢" });

    } catch (e) {
        console.error(e);
        await m.reply("❌ Error fetching couple DP.");
    }
});
