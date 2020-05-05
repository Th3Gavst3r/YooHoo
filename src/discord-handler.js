const Discord = require('discord.js');
const playlistId = require('./config');
const { token } = require('./config').discord;
const fs = require('fs');
const googleUtils = require('./google-utils');
const { prefix } = require('./config');

const commandFiles = fs
  .readdirSync('./src/commands')
  .filter(file => file.endsWith('.js'));

const client = new Discord.Client();
client.commands = new Discord.Collection();
for (const file of commandFiles) {
  console.log(`Registering command: ${file}`);
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

// https://stackoverflow.com/questions/3452546/how-do-i-get-the-youtube-video-id-from-a-url
const youtubeIdRegex = /.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?\s]*).*/;

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', message => {
  if (message.author.bot) return;

  if (message.content.startsWith(prefix)) {
    const args = message.content.slice(prefix.length + 1).split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command =
      client.commands.get(commandName) ||
      client.commands.find(
        cmd => cmd.aliases && cmd.aliases.includes(commandName)
      );

    if (!command) {
      console.error(`Command not found: ${commandName}`);
    }

    try {
      command.execute(message, args);
    } catch (err) {
      console.error(err);
    }
  } else {
    const words = message.content.split(/\s/);
    words.forEach(word => {
      const match = word.match(youtubeIdRegex);
      if (match) {
        const videoId = match[1];
        googleUtils
          .insertVideo(videoId, playlistId)
          .then(() => message.react('▶️')) // to use a custom emoji, bot must be member of guild that owns it
          .catch(err => console.error(err)); // DM registration author?
      }
    });
  }
});

client.login(token);

module.exports = client;
