const { MessageEmbed } = require('discord.js');
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
    const user = message.author.id;

    // Generate request URL
    const url = new URL('/register', appUrl);
    url.searchParams.append('channel', channel);
    url.searchParams.append('playlist', playlist);
    url.searchParams.append('user', user);

    // Respond with Sign in button
    const embed = new MessageEmbed().setTitle('Sign in to YouTube').setURL(url);
    message.reply(embed);
  },
};
