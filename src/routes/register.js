const db = require('../db');
const discordClient = require('../discord-handler');
const { encrypt } = require('../crypto');
const express = require('express');
const firebaseAdmin = require('firebase-admin');
const googleUtils = require('../google-utils');
const { prefix } = require('../config');
const youtube = require('../youtube');

const router = express.Router();

/**
 * Google OAuth landing pages
 */
router.get('/', (req, res) => {
  if (!req.query.channel) return res.status(400).send('Missing channel');
  if (!req.query.playlist) return res.status(400).send('Missing playlist');
  if (!req.query.user) return res.status(400).send('Missing user');

  // Generate state to be sent through OAuth
  const state = {
    channel: req.query.channel,
    playlist: req.query.playlist,
    user: req.query.user,
    all: req.query.all,
  };
  const encodedState = Buffer.from(JSON.stringify(state)).toString('base64');

  // Begin OAuth process
  res.redirect(googleUtils.getConnectionUrl(encodedState));
});

router.get('/callback', async (req, res) => {
  if (!req.query.code) return res.status(400).send('Missing auth code');

  // Validate received state
  const state = JSON.parse(
    Buffer.from(req.query.state, 'base64').toString('ascii')
  );
  if (!state || !state.channel || !state.playlist || !state.user)
  const { playlist, channel, user, all } = state;
    return res.status(400).send('Invalid state');

  try {
    const auth = googleUtils.createConnection();
    await googleUtils.setTokens(req.query.code, auth);

    // Check that playlist exists
    const playlistExists = await youtube.doesPlaylistExist(playlist, auth);
    if (!playlistExists)
      return res.status(404).send(`Playlist ${playlist} does not exist`);

    // Check if user is authorized to edit this playlist
    const playlists = await youtube.listUserPlaylists(auth);
    const isOwner = playlists.map(p => p.id).includes(playlist);
    if (!isOwner) return res.status(401).send('User is not playlist owner');

    // Save registration to db
    const registration = {
      channel: {
        id: channel,
      },
      created: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      credentials: encrypt(JSON.stringify(auth.credentials)),
      playlist: {
        id: playlist,
      },
      user: {
        id: user,
      },
    };
    await db.setRegistration(registration);

    res.send('Playlist was registered successfully');

    if (all === 'true') {
      let messages;
      let oldestMessage;
      do {
        messages = await discordClient.channels.fetch(channel).then(channel =>
          channel.messages.fetch({
            before: oldestMessage && oldestMessage.id,
            limit: 100,
          })
        );

        // Save oldest for pagination
        oldestMessage =
          messages.size &&
          messages.reduce((prev, curr) =>
            prev.createdTimestamp < curr.createdTimestamp ? prev : curr
          );

        // Remove bot messages
        messages = messages.filter(
          m => !m.author.bot && !m.content.startsWith(prefix + ' ')
        );

        // Scan message buffer for videos
        messages.forEach(message => {
          videoIds = youtube.parseVideoIds(message.content);
          videoIds.forEach(videoId => {
            youtube
              .insertVideo(videoId, playlist, auth)
              .catch(err => console.error(err)); // DM registration author?
          });
        });
      } while (messages.size);
    }
  } catch (err) {
    console.error(err);
    return res.status(err.code || 500).send(err.message);
  }
});

module.exports = router;
