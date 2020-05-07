const db = require('./db');
const { decrypt } = require('./crypto');
const Discord = require('discord.js');
const { token } = require('./config').discord;
const { errorReaction } = require('./util');
const fs = require('fs');
const googleUtils = require('./google-utils');
const { prefix } = require('./config');
const youtube = require('./youtube');

const commandFiles = fs
  .readdirSync('./src/commands')
  .filter(file => file.endsWith('.js'));

// Initialize client with available command modules
const client = new Discord.Client();
client.commands = new Discord.Collection();
for (const file of commandFiles) {
  console.log(`Registering command: ${file}`);
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async message => {
  if (message.author.bot) return;

  if (message.content.startsWith(prefix)) {
    executeCommand(message);
  } else {
    const channelId = message.channel.id;
    const registrations = await db
      .findRegistrationsByChannelId(channelId)
      .then(snapshot => snapshot.docs.map(doc => doc.data()));

    /* Parse normal messages for youtube videos */
    const words = message.content.split(/\s/);
    words.forEach(word => {
      const match = youtube.parseVideoId(word);
      if (match) {
        const videoId = match[1];

        registrations.forEach(registration => {
          const credentials = JSON.parse(decrypt(registration.credentials));
          const auth = googleUtils.createConnection(credentials);

          youtube
            .insertVideo(videoId, registration.playlist.id, auth)
            .then(() => message.react('▶️')) // to use a custom emoji, bot must be member of guild that owns it
            .catch(err => console.error(err)); // DM registration author?
        });
      }
    });
  }
});

function executeCommand(message) {
  // Parse which command we received
  const args = message.content.slice(prefix.length + 1).split(/ +/);
  const commandName = args.shift().toLowerCase();
  const command =
    client.commands.get(commandName) ||
    client.commands.find(
      cmd => cmd.aliases && cmd.aliases.includes(commandName)
    );

  // Invalid command
  if (!command) {
    console.error(`Command not found: ${commandName}`);
    return errorReaction(message);
  }

  try {
    command.execute(message, args);
  } catch (err) {
    console.error(err);
    return errorReaction(message); // DM error?
  }
}

client.login(token);

module.exports = client;
