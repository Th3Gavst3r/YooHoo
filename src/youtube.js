const { google } = require('googleapis');

function parseVideoIds(text) {
  // https://stackoverflow.com/questions/3452546/how-do-i-get-the-youtube-video-id-from-a-url
  const youtubeIdRegex = /(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([\w\$\-+]*)/g;

  const ids = [];
  while ((match = youtubeIdRegex.exec(text))) {
    ids.push(match[1]);
  }
  return ids;
}

async function insertVideo(videoId, playlistId, auth, position) {
  const youtube = google.youtube({
    version: 'v3',
    auth: auth,
  });

  const playlistContainsVideo = await doesPlaylistContainVideo(
    playlistId,
    videoId,
    auth
  );

  if (playlistContainsVideo) return;

  return youtube.playlistItems.insert({
    part: 'snippet',
    resource: {
      snippet: {
        playlistId,
        position: position,
        resourceId: {
          kind: 'youtube#video',
          videoId,
        },
      },
    },
  });
}

async function listUserPlaylists(auth) {
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

async function doesPlaylistExist(playlistId, auth) {
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

async function doesPlaylistContainVideo(playlistId, videoId, auth) {
  const youtube = google.youtube({
    version: 'v3',
    auth: auth,
  });

  const res = await youtube.playlistItems.list({
    part: 'id',
    playlistId: playlistId,
    videoId: videoId,
  });

  return res.data.items.length >= 1;
}

module.exports = {
  insertVideo,
  listUserPlaylists,
  doesPlaylistExist,
  doesPlaylistContainVideo,
  parseVideoIds,
};
