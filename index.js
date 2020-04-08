require('dotenv').config();
const PORT = process.env.PORT;

require('./discord-handler');
const express = require('express');
const gsUtils = require('./google-utils');

const app = express();

/**
 * Google OAuth landing pages
 */
app.get('/', (req, res) => res.redirect(gsUtils.getConnectionUrl()));
app.get('/callback', (req, res) => {
  gsUtils.setTokens(req.query.code);
  res.send('hello user');
});

app.listen(PORT, () => console.log(`App listening on port ${PORT}`));
