const client = require('../discord-handler');
const { errorReaction } = require('../util');
const { prefix } = require('../config');
const { getInviteUrl } = require('./invite');
const { MessageEmbed } = require('discord.js');

module.exports = {
  name: 'help',
  aliases: ['h', 'info'],
  description: `List information about YooHoo's commands`,
  usage: '[command name]',
  execute(message, args) {
    const { commands } = message.client;

    if (!args.length) {
      /* List all available commands */
      const embed = new MessageEmbed()
        .setColor('#ff0000')
        .setAuthor(
          client.user.username,
          undefined,
          'https://github.com/Th3Gavst3r/YooHoo'
        )
        .setThumbnail(client.user.avatarURL())
        .setURL('https://github.com/Th3Gavst3r/YooHoo')
        .setDescription(
          `A bot which saves posted YouTube videos to your playlists\nSend \`${prefix} help [command name]\` to get info for a specific command`
        )
        .addField(
          'All commands',
          commands.map(cmd => `\`${cmd.name}\``).join(', ')
        )
        .addField('Links', `[Invite](${getInviteUrl()})`);
      return message.channel.send(embed);
    } else {
      /* List detailed usage for a specific command */
      const name = args[0].toLowerCase();
      const command =
        commands.get(name) ||
        commands.find(c => c.aliases && c.aliases.includes(name));

      if (!command) return errorReaction(message);

      const embed = new MessageEmbed()
        .setColor('#ff0000')
        .setTitle(`\`${command.name}\``);

      // Populate metadata fields
      if (command.description) embed.setDescription(command.description);
      if (command.aliases)
        embed.addField(
          'Aliases',
          command.aliases.map(a => `\`${a}\``).join(', ')
        );
      if (command.usage)
        embed.addField(
          'Usage',
          `\`${prefix} ${command.name} ${command.usage}\``
        );
      if (command.options)
        embed.addField(
          'Options',
          command.options.map(o => `\`${o.name}\`: ${o.description}`)
        );

      message.channel.send(embed);
    }
  },
};
