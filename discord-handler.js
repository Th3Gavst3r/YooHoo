const TOKEN = process.env.DISCORD_TOKEN;
const PLAYLIST_ID = process.env.PLAYLIST_ID;

const Discord = require('discord.js');
const googleUtils = require('./google-utils');
const client = new Discord.Client();

// https://stackoverflow.com/questions/3452546/how-do-i-get-the-youtube-video-id-from-a-url
const youtubeIdRegex = /.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?\s]*).*/;

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  const words = msg.content.split(/\s|,/);

  words.forEach(word => {
    const match = word.match(youtubeIdRegex);
    if (match) {
      const videoId = match[1];
      googleUtils
        .insertVideo(videoId, PLAYLIST_ID)
        .catch(err => console.error(err));
    }
  });
});

client.login(TOKEN);

exports.default = client;
