const { errorReaction } = require('../util');
const { prefix } = require('../config');

module.exports = {
  name: 'help',
  aliases: ['h', 'info'],
  description: `List information about YooHoo's commands`,
  usage: '[command name]',
  execute(message, args) {
    const data = [];
    const { commands } = message.client;

    if (!args.length) {
      /* List all available commands */
      data.push('All commands');
      data.push(commands.map(cmd => `\`${cmd.name}\``).join(', '));
      data.push(
        `\nSend \`${prefix} help [command name]\` to get info for a specific command`
      );

      return message.reply(data, { split: true });
    } else {
      /* List detailed usage for a specific command */
      const name = args[0].toLowerCase();
      const command =
        commands.get(name) ||
        commands.find(c => c.aliases && c.aliases.includes(name));

      if (!command) return errorReaction(message);

      // Populate metadata fields
      data.push(`**Name:** ${command.name}`);

      if (command.aliases)
        data.push(`**Aliases:** ${command.aliases.join(', ')}`);
      if (command.description)
        data.push(`**Description:** ${command.description}`);
      if (command.usage)
        data.push(`**Usage:** ${prefix} ${command.name} ${command.usage}`);

      message.channel.send(data, { split: true });
    }
  },
};
