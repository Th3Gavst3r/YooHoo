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

const client = new Discord.Client();
module.exports = client;

// Initialize client with available command modules
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

  if (
    message.content.startsWith(prefix + ' ') ||
    message.content.match(new RegExp(`^<@!?${client.user.id}>`)) // Bot was mentioned
  ) {
    executeCommand(message);
  } else {
    /* Parse normal messages for youtube videos */
    const videoIds = youtube.parseVideoIds(message.content);
    if (videoIds.length) {
      const channelId = message.channel.id;
      const registrations = await db
        .getRegistrationsByChannelId(channelId)
        .then(snapshot => snapshot.docs.map(doc => doc.data()));

      const promises = [];
      videoIds.forEach(videoId => {
        registrations.forEach(registration => {
          try {
            const credentials = JSON.parse(decrypt(registration.credentials));
            const auth = googleUtils.createConnection(credentials);

            promises.push(
              youtube
                .insertVideo(videoId, registration.playlist.id, auth, 0)
                .catch(err => console.error(err)) // DM registration author?
            );
          } catch (err) {
            console.error(err);
          }
        });
      });

      Promise.all(promises).then(() => message.react('▶️')); // to use a custom emoji, bot must be member of guild that owns it
    }
  }
});

function executeCommand(message) {
  // Parse which command we received
  const args = message.content.split(/ +/).slice(1);
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
