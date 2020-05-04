const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const APP_URL = process.env.APP_URL;

const { google } = require('googleapis');
const googleConfig = {
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  redirect: `${APP_URL}/callback`, // this must match your google api settings
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
function getConnectionUrl() {
  return auth.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // access type and approval prompt will force a new refresh token to be made each time signs in
    scope: defaultScope,
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

module.exports = { getConnectionUrl, setTokens, insertVideo };