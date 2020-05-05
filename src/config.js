require('dotenv').config();
const APP_URL = process.env.APP_URL;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const PLAYLIST_ID = process.env.PLAYLIST_ID;
const PORT = process.env.PORT;

module.exports = {
  appUrl: APP_URL,
  discord: {
    token: DISCORD_TOKEN,
  },
  google: {
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
  },
  playlistId: PLAYLIST_ID,
  port: PORT,
  prefix: 'yh',
};
