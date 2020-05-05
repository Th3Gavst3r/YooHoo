const Discord = require('discord.js');
const { appUrl } = require('../config');
const { errorReaction } = require('../util');

module.exports = {
  name: 'register',
  description: `Register a playlist with the current channel`,
  aliases: ['r'],
  usage: '[playlist id]',
  execute(message, args) {
    if (!args.length) return errorReaction(message);

    const playlist = args[0];
    const channel = message.channel.id;

    // Generate request URL
    const url = new URL('/', appUrl);
    url.searchParams.append('channel', channel);
    url.searchParams.append('playlist', playlist);

    // Respond with Sign in button
    const embed = new Discord.MessageEmbed()
      .setTitle('Sign in to YouTube')
      .setURL(url);
    message.reply(embed);
  },
};
