const db = require('./db');
const { decrypt } = require('./crypto');
const Discord = require('discord.js');
const { token } = require('./config').discord;
const { errorReaction, processedReaction } = require('./util');
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
  client.user.setPresence({ activity: { name: `${prefix} help` } });
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
      console.log(`Received message with videos: ${JSON.stringify(videoIds)}`);
      const channelId = message.channel.id;
      const registrations = await db
        .getRegistrationsByChannelId(channelId)
        .then(snapshot => snapshot.docs.map(doc => doc.data()));

      console.log(
        `Registrations for channel ${message.channel.id}: ${JSON.stringify(
          registrations
        )}`
      );
      if (registrations.length === 0) return;

      const promises = [];
      videoIds.forEach(videoId => {
        registrations.forEach(registration => {
          console.log(
            `Saving video ${videoId} to playlist ${registration.playlist.id}`
          );
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

      Promise.all(promises).then(() => processedReaction(message)); // to use a custom emoji, bot must be member of guild that owns it
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
