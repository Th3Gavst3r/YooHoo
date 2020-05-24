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
router.get('/', async (req, res) => {
  if (!req.query.signupId) return res.status(400).send('Missing signup ID');

  // Retrieve linked signup information
  const signupDoc = await db.getSignup(req.query.signupId);
  if (!signupDoc.exists) {
    console.log(`Requested signupId ${req.query.signupId} does not exist`);
    return res.status(400).send('Invalid signup ID');
  }

  // Generate state to be sent through OAuth
  const state = {
    signupId: req.query.signupId,
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
  if (!state || !state.signupId) {
    console.log(`Callback received invalid state: ${req.query.state}`);
    return res.status(400).send('Invalid state');
  }

  // Retrieve linked signup information
  const signupDoc = await db.getSignup(state.signupId);
  if (!signupDoc.exists) {
    console.log(`Requested signupId ${req.query.signupId} does not exist`);
    return res.status(400).send('Invalid signup ID');
  }
  const signup = signupDoc.data();
  console.log(`Creating registration for signupId: ${signupDoc.id}`);

  // Validate signup
  if (!signup.channel || !signup.playlist || !signup.author) {
    console.error(`Malformed signup: ${signup}`);
    return res.status(500).send('Malformed signup');
  }

  try {
    const auth = googleUtils.createConnection();
    await googleUtils.setTokens(req.query.code, auth);

    // Check that playlist exists
    const playlistExists = await youtube.doesPlaylistExist(
      signup.playlist.id,
      auth
    );
    if (!playlistExists) {
      console.log(
        `User ${signup.user.id} registered nonexitent playlist: ${signup.playlist.id}`
      );
      return res.status(404).send(`Playlist ${signup.playlist.id} not found`);
    }

    // Check if user is authorized to edit this playlist
    const playlists = await youtube.listUserPlaylists(auth);
    const isOwner = playlists.map(p => p.id).includes(signup.playlist.id);
    if (!isOwner) {
      console.log(
        `User ${signup.author.tag} does not own playlist ${signup.playlist.id}`
      );
      return res.status(401).send('User is not playlist owner');
    }

    // Save registration to db
    const registration = {
      author: signup.author,
      channel: signup.channel,
      created: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      credentials: encrypt(JSON.stringify(auth.credentials)),
      playlist: signup.playlist,
    };
    await db.addRegistration(registration);

    console.log(`Deleting signup ${signupDoc.id}`);
    await db.deleteSignup(signupDoc.id);
    res.send('Playlist was registered successfully');

    if (signup.all) {
      console.log('Parsing chat history for videos');
      saveVideosFromChatHistory(auth, signup.channel.id, signup.playlist.id);
    }
  } catch (err) {
    console.error(err);
    return res.status(err.code || 500).send(err.message);
  }
});

async function saveVideosFromChatHistory(auth, channel, playlist) {
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
    // TODO: await batches
    messages.forEach(message => {
      videoIds = youtube.parseVideoIds(message.content);
      videoIds.forEach(videoId => {
        youtube
          .insertVideo(videoId, playlist, auth)
          .catch(err => console.error(err)); // DM registration author? Note: could just be a video 404
      });
    });
  } while (messages.size);
}

module.exports = router;
