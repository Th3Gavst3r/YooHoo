require('dotenv').config();
const APP_URL = process.env.APP_URL;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const PLAYLIST_ID = process.env.PLAYLIST_ID;
const PORT = process.env.PORT;

module.exports = {
  appUrl: APP_URL,
  discord: {
    clientId: DISCORD_CLIENT_ID,
    token: DISCORD_TOKEN,
  },
  encryption: {
    key: ENCRYPTION_KEY,
  },
  google: {
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
  },
  playlistId: PLAYLIST_ID,
  port: PORT,
  prefix: 'yh',
  supportServerUrl: 'https://discord.gg/g9BKJR2',
};
