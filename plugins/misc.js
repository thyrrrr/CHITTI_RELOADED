const { Sparky, isPublic, audioCut, fetch } = require("../lib");
const config = require("../config.js");
const FormData = require("form-data");
const crypto = require("crypto");

// ----------------- Misc Plugins -----------------
Sparky({
    name: "jid",
    fromMe: isPublic,
    category: "misc",
    desc: "Gets the unique ID of a WhatsApp chat or user."
}, async ({ m }) => {
    return await m.reply(`${m?.quoted ? m?.quoted?.sender : m.jid}`);
});

Sparky({
    name: "runtime",
    fromMe: isPublic,
    category: "misc",
    desc: "Shows the bot's current runtime."
}, async ({ m }) => {
    return await m.reply(`_Runtime : ${await m.runtime()}_`);
});

Sparky({
    name: "ping",
    fromMe: isPublic,
    category: "misc",
    desc: "Checks if the bot is online and responsive."
}, async ({ m }) => {
    const start = new Date().getTime();
    let pong = await m.sendMsg(m.jid, "_Checking Ping..._", { quoted: m });
    const end = new Date().getTime();
    return await m.sendMsg(m.jid, `_${config.PING} : ${end - start} ms_`, { edit: pong.key });
});

Sparky({
    name: "wame",
    fromMe: isPublic,
    category: "misc",
    desc: "Converts a phone number into a WhatsApp link."
}, async ({ m, args }) => {
    return await m.reply(`https://wa.me/${m?.quoted ? m?.quoted?.sender?.split("@")[0] : m?.sender?.split("@")[0]}${args ? `?text=${args}` : ''}`);
});

// ----------------- Song Finder Plugin -----------------
const ACRCloudOptions = {
    host: "identify-ap-southeast-1.acrcloud.com",
    endpoint: "/v1/identify",
    signature_version: "1",
    data_type: "audio",
    secure: true,
    access_key: "6c4fe1633e88fb59fc5a6477683b54ee",
    access_secret: "7gKApXSRc8bt640k9C5Jro1nn1XEycKgpOX6V0y5"
};

function buildStringToSign(method, uri, accessKey, dataType, signatureVersion, timestamp) {
    return [method, uri, accessKey, dataType, signatureVersion, timestamp].join("\n");
}

function sign(signString, accessSecret) {
    return crypto
        .createHmac("sha1", accessSecret)
        .update(Buffer.from(signString, "utf-8"))
        .digest()
        .toString("base64");
}

Sparky({
    name: "find",
    fromMe: isPublic,
    category: "search",
    desc: "Find the song from audio or video."
}, async ({ m }) => {
    try {
        // --- Check if user replied to audio/video ---
        if (
            !m.quoted ||
            !(
                m.quoted.message.audioMessage ||
                m.quoted.message.videoMessage ||
                (m.quoted.message.documentMessage &&
                 ["audio/mp4", "video/mp4", "audio/mpeg"].includes(m.quoted.message.documentMessage.mimetype))
            )
        ) {
            return await m.reply("*Reply to an audio or video file!*"); 
        }

        // --- Download media buffer ---
        const fileBuffer = await m.quoted.download();

        // --- Cut first 15 seconds ---
        const data = await audioCut(fileBuffer, 0, 15);

        const timestamp = Math.floor(Date.now() / 1000);
        const stringToSign = buildStringToSign(
            "POST",
            ACRCloudOptions.endpoint,
            ACRCloudOptions.access_key,
            ACRCloudOptions.data_type,
            ACRCloudOptions.signature_version,
            timestamp
        );

        const signature = sign(stringToSign, ACRCloudOptions.access_secret);

        // --- Build form data ---
        const form = new FormData();
        form.append("sample", data, { filename: "sample.mp3" });
        form.append("sample_bytes", data.length);
        form.append("access_key", ACRCloudOptions.access_key);
        form.append("data_type", ACRCloudOptions.data_type);
        form.append("signature_version", ACRCloudOptions.signature_version);
        form.append("signature", signature);
        form.append("timestamp", timestamp);

        // --- Send request to ACRCloud ---
        const res = await fetch("http://" + ACRCloudOptions.host + ACRCloudOptions.endpoint, {
            method: "POST",
            body: form
        });

        const result = await res.json();

        if (result.status.msg !== "Success") {
            return await m.reply(`❌ ${result.status.msg}`);
        }

        const song = result.metadata.music[0];
        const artists = song.artists ? song.artists.map(a => a.name).join(", ") : "N/A";

        // --- Send result ---
        await m.reply(
            `🎵 *Title:* ${song.title}\n` +
            `💿 *Album:* ${song.album?.name || "N/A"}\n` +
            `👨‍🎤 *Artists:* ${artists}\n` +
            `📅 *Release Date:* ${song.release_date || "N/A"}`
        );

    } catch (err) {
        console.error(err);
        await m.reply("❌ Something went wrong while identifying the song.");
    }
});
