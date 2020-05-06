require('./discord-handler');
const express = require('express');
const { port } = require('./config');
const register = require('./routes/register');

const app = express();

app.use('/register', register);

app.listen(port, () => console.log(`App listening on port ${port}`));
