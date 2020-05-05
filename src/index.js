require('./discord-handler');
const express = require('express');
const googleUtils = require('./google-utils');
const { port } = require('./config');

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

  try {
    await googleUtils.setTokens(req.query.code);

    // Check if user is authorized to edit this playlist
    const playlists = await googleUtils.listUserPlaylists();
    const isOwner = playlists.map(p => p.id).includes(state.playlist);
    if (!isOwner) return res.status(401).send('User is not playlist owner');

    console.log('User is correctly authorized');
  } catch (err) {
    return res.status(err.code).send(err.message);
  }

  return res.send('OAuth credentials accepted');
});

app.listen(port, () => console.log(`App listening on port ${port}`));
