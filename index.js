require('dotenv').config();
const PORT = process.env.PORT;

require('./discord-handler');
const express = require('express');
const googleUtils = require('./google-utils');

const app = express();

/**
 * Google OAuth landing pages
 */
app.get('/', (req, res) => res.redirect(googleUtils.getConnectionUrl()));
app.get('/callback', (req, res) => {
  googleUtils.setTokens(req.query.code);
  res.send('OAuth credentials accepted');
});

app.listen(PORT, () => console.log(`App listening on port ${PORT}`));
