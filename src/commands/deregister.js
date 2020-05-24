const { APIErrors } = require('discord.js').Constants;
const db = require('../db');
const { MessageEmbed } = require('discord.js');
const { errorReaction } = require('../util');

module.exports = {
  name: 'deregister',
  description: `Deregister a playlist with the current channel`,
  aliases: ['d'],
  usage: '[playlist id]',
  async execute(message, args) {
    if (!args.length) return errorReaction(message);

    const playlist = args.slice(-1)[0];

    const snapshot = await db.getRegistrationsByChannelIdAndPlaylistIdAndAuthorId(
      message.channel.id,
      playlist,
      message.author.id
    );

    if (snapshot.size > 1) {
      throw new Error('Error: Multiple existing registrations');
    } else if (snapshot.empty) {
      return;
    } else {
      const registration = snapshot.docs[0];
      await db.deleteRegistration(registration.id);

      const location =
        message.channel.type === 'dm'
          ? 'that you DM to YooHoo'
          : `from <#${message.channel.id}>`;

      const embed = new MessageEmbed()
        .setColor('#ff0000')
        .setDescription(
          `Videos ${location} will no longer be saved to your [playlist](https://www.youtube.com/playlist?list=${playlist}).`
        );
      message.author.send(embed).catch(err => {
        if (err.code === APIErrors.CANNOT_MESSAGE_USER) {
          message.channel.send(embed);
        } else throw err;
      });
    }
  },
};
