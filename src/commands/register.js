const { APIErrors } = require('discord.js').Constants;
const { MessageEmbed } = require('discord.js');
const { appUrl } = require('../config');
const db = require('../db');
const { errorReaction } = require('../util');
const firebaseAdmin = require('firebase-admin');
const { parsePlaylistId } = require('../youtube');

module.exports = {
  name: 'register',
  description: `Register a playlist with the current channel`,
  aliases: ['r'],
  usage: '[options] [playlist url or id]',
  options: [
    { name: 'all', description: 'Include videos from past chat history' },
  ],
  async execute(message, args) {
    if (!args.length) return errorReaction(message);

    const playlist = parsePlaylistId(args.slice(-1)[0]);
    const all = args.includes('all');
    if (!playlist) return errorReaction(message);

    console.log(
      `Registration initiated by ${message.author.tag} (${message.author.id}). Channel: ${message.channel.id} Playlist: ${playlist}`
    );
    const signup = {
      all: all,
      author: JSON.parse(JSON.stringify(message.author)),
      channel: JSON.parse(JSON.stringify(message.channel)),
      created: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      playlist: {
        id: playlist,
      },
    };

    const signupDoc = await db.addSignup(signup);

    // Generate request URL
    const url = new URL('/register', appUrl);
    url.searchParams.append('signupId', signupDoc.id);

    // Respond with Sign in button
    const embed = new MessageEmbed()
      .setColor('#ff0000')
      .setTitle('Sign in to YouTube')
      .setURL(url);

    console.log(`Sending signup url: ${url}`);
    message.author.send(embed).catch(err => {
      if (err.code === APIErrors.CANNOT_MESSAGE_USER) {
        message.reply(embed);
      } else throw err;
    });
  },
};
