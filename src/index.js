require('./discord-handler');
const express = require('express');
const favicon = require('serve-favicon');
const home = require('./routes/home');
const path = require('path');
const { port } = require('./config');
const privacy = require('./routes/privacy');
const register = require('./routes/register');

const app = express();

app.use(favicon(path.join(__dirname, 'views', 'img', 'favicon.ico')));
app.use('/', home);
app.use('/register', register);
app.use('/privacy', privacy);

app.listen(port, () => console.log(`App listening on port ${port}`));
