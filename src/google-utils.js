const { google } = require('googleapis');
const { appUrl } = require('./config');
const { clientId, clientSecret } = require('./config').google;

const googleConfig = {
  clientId: clientId,
  clientSecret: clientSecret,
  redirect: `${appUrl}/callback`, // this must match your google api settings
};

const auth = createConnection();

/**
 * Create the google auth object which gives us access to talk to google's apis.
 */
function createConnection() {
  return new google.auth.OAuth2(
    googleConfig.clientId,
    googleConfig.clientSecret,
    googleConfig.redirect
  );
}

/**
 * This scope tells google what information we want to request.
 */
const defaultScope = ['https://www.googleapis.com/auth/youtube'];

/**
 * Get a url which will open the google sign-in page and request access to the scope provided (such as calendar events).
 */
function getConnectionUrl(state) {
  return auth.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // access type and approval prompt will force a new refresh token to be made each time signs in
    scope: defaultScope,
    state: state,
  });
}

/**
 * Exchange authCode for access and refresh tokens
 */
async function setTokens(authCode) {
  const data = await auth.getToken(authCode);
  const tokens = data.tokens;
  auth.setCredentials(tokens);
  console.log('OAuth credentials accepted');
}

async function insertVideo(videoId, playlistId) {
  const youtube = google.youtube({
    version: 'v3',
    auth: auth,
  });

  return youtube.playlistItems.insert({
    part: 'snippet',
    resource: {
      snippet: {
        playlistId,
        position: 0,
        resourceId: {
          kind: 'youtube#video',
          videoId,
        },
      },
    },
  });
}

async function listUserPlaylists() {
  const youtube = google.youtube({
    version: 'v3',
    auth: auth,
  });

  const playlists = [];

  let res = undefined;
  do {
    res = await youtube.playlists.list({
      part: 'id',
      mine: true,
      maxResults: 50,
      pageToken: res && res.data.nextPageToken,
    });

    res.data.items.forEach(p => playlists.push(p));
  } while (res.data.nextPageToken);

  return playlists;
}

async function doesPlaylistExist(playlistId) {
  const youtube = google.youtube({
    version: 'v3',
    auth: auth,
  });

  const res = await youtube.playlists.list({
    part: 'id',
    id: playlistId,
    maxResults: 1,
  });

  return res.data.items.length === 1;
}

module.exports = {
  getConnectionUrl,
  setTokens,
  insertVideo,
  listUserPlaylists,
  doesPlaylistExist,
};
