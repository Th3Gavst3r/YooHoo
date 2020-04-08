const TOKEN = process.env.DISCORD_TOKEN;

const Discord = require('discord.js');
const client = new Discord.Client();
const urlRegex = /((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?/g;

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  const urls = msg.content.match(urlRegex);
  for (url of urls) {
    console.log(url);
  }
});

client.login(TOKEN);

exports.default = client;
