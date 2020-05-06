require('./discord-handler');
const { encrypt } = require('./crypto');
const db = require('./db');
const express = require('express');
const firebaseAdmin = require('firebase-admin');
const googleUtils = require('./google-utils');
const { port } = require('./config');
const youtube = require('./youtube');

const app = express();

/**
 * Google OAuth landing pages
 */
app.get('/', (req, res) => {
  if (!req.query.channel) return res.status(400).send('Missing channel');
  if (!req.query.playlist) return res.status(400).send('Missing playlist');

  // Generate state to be sent through OAuth
  const state = {
    channel: req.query.channel,
    playlist: req.query.playlist,
  };
  const encodedState = Buffer.from(JSON.stringify(state)).toString('base64');

  // Begin OAuth process
  res.redirect(googleUtils.getConnectionUrl(encodedState));
});

app.get('/callback', async (req, res) => {
  if (!req.query.code) res.status(400).send('Missing auth code');

  // Validate received state
  const state = JSON.parse(
    Buffer.from(req.query.state, 'base64').toString('ascii')
  );
  if (!state || !state.channel || !state.playlist)
    res.status(400).send('Invalid state');
  const { playlist, channel } = state;

  try {
    const auth = googleUtils.createConnection();
    await googleUtils.setTokens(req.query.code, auth);

    // Check that playlist exists
    const playlistExists = await youtube.doesPlaylistExist(playlist, auth);
    if (!playlistExists) return res.status(404).send('Playlist does not exist');

    // Check if user is authorized to edit this playlist
    const playlists = await youtube.listUserPlaylists(auth);
    const isOwner = playlists.map(p => p.id).includes(playlist);
    if (!isOwner) return res.status(401).send('User is not playlist owner');

    // Save registration to db
    const registration = {
      channel: channel,
      created: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      credentials: encrypt(JSON.stringify(auth.credentials)),
      playlist: playlist,
    };

    // Check if registration already exists
    const registrationsRef = db.collection('registrations');
    const snapshot = await registrationsRef
      .where('playlist', '==', playlist)
      .where('channel', '==', channel)
      .get();

    if (snapshot.size > 1) {
      throw new Error('Error: Multiple existing registrations');
    } else if (snapshot.empty) {
      await registrationsRef.add(registration);
    } else {
      await registrationsRef.doc(snapshot.docs[0].id).set(registration);
    }
  } catch (err) {
    console.error(err);
    return res.status(err.code || 500).send(err.message);
  }

  return res.send('Playlist was registered successfully');
});

app.listen(port, () => console.log(`App listening on port ${port}`));
