const { Permissions, MessageEmbed } = require('discord.js');
const { clientId } = require('../config').discord;

module.exports = {
  name: 'invite',
  description: `Get a link to invite YooHoo to your server`,
  aliases: ['i'],
  usage: '',
  execute(message, args) {
    const permissions = new Permissions([
      'ADD_REACTIONS',
      'VIEW_CHANNEL',
      'SEND_MESSAGES',
      'EMBED_LINKS',
      'READ_MESSAGE_HISTORY',
    ]);

    const url = new URL('https://discordapp.com/oauth2/authorize');
    url.searchParams.append('client_id', clientId);
    url.searchParams.append('permissions', permissions.bitfield);
    url.searchParams.append('scope', 'bot');

    // Respond with invite
    const embed = new MessageEmbed()
      .setTitle('Add YooHoo to your server')
      .setURL(url);
    message.reply(embed);
  },
};
