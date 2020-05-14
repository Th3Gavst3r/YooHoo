const { MessageEmbed } = require('discord.js');
const { appUrl } = require('../config');
const { errorReaction } = require('../util');

module.exports = {
  name: 'register',
  description: `Register a playlist with the current channel`,
  aliases: ['r'],
  usage: '[options] [playlist id]',
  options: [
    { name: 'all', description: 'Include videos from past chat history' },
  ],
  execute(message, args) {
    if (!args.length) return errorReaction(message);

    const playlist = args.slice(-1)[0];
    const channel = message.channel.id;
    const user = message.author.id;

    // Generate request URL
    const url = new URL('/register', appUrl);
    url.searchParams.append('channel', channel);
    url.searchParams.append('playlist', playlist);
    url.searchParams.append('user', user);
    if (args.includes('all')) url.searchParams.append('all', true);

    // Respond with Sign in button
    const embed = new MessageEmbed().setTitle('Sign in to YouTube').setURL(url);
    message.reply(embed);
  },
};
