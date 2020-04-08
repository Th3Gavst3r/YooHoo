require('dotenv').config();
const PORT = process.env.PORT;
const TOKEN = process.env.TOKEN;

const Discord = require('discord.js');
const express = require('express');
const gsUtils = require('./google-utils');

const client = new Discord.Client();
const app = express();

const urlRegex = /((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?/g;

/**
 * Google OAuth landing pages
 */
app.get('/', (req, res) => res.redirect(gsUtils.getConnectionUrl()));
app.get('/callback', (req, res) => {
  gsUtils.setTokens(req.query.code);
  res.send('hello user');
});

app.listen(PORT, () => console.log(`App listening on port ${PORT}`));

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
