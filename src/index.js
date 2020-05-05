require('./discord-handler');
const express = require('express');
const googleUtils = require('./google-utils');
const { port } = require('./config');

const app = express();

/**
 * Google OAuth landing pages
 */
app.get('/', (req, res) => res.redirect(googleUtils.getConnectionUrl()));
app.get('/callback', (req, res) => {
  googleUtils.setTokens(req.query.code);
  res.send('OAuth credentials accepted');
});

app.listen(port, () => console.log(`App listening on port ${port}`));
