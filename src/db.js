const Firestore = require('@google-cloud/firestore');
const db = new Firestore();

const registrationsRef = db.collection('registrations');
const signupsRef = db.collection('signups');

async function addRegistration(registration) {
  // Check if registration already exists
  const snapshot = await getRegistrationsByChannelIdAndPlaylistId(
    registration.channel.id,
    registration.playlist.id
  );

  if (snapshot.size > 1) {
    throw new Error('Error: Multiple existing registrations');
  } else if (snapshot.empty) {
    return registrationsRef.add(registration);
  } else {
    console.log(`Overwriting existing registration: ${snapshot.docs[0].id}`);
    return registrationsRef.doc(snapshot.docs[0].id).set(registration);
  }
}

function getRegistrationsByChannelId(channelId) {
  return registrationsRef.where('channel.id', '==', channelId).get();
}

function getRegistrationsByChannelIdAndPlaylistId(channelId, playlistId) {
  return registrationsRef
    .where('channel.id', '==', channelId)
    .where('playlist.id', '==', playlistId)
    .get();
}

function getRegistrationsByChannelIdAndPlaylistIdAndAuthorId(
  channelId,
  playlistId,
  authorId
) {
  return registrationsRef
    .where('channel.id', '==', channelId)
    .where('playlist.id', '==', playlistId)
    .where('author.id', '==', authorId)
    .get();
}

function deleteRegistration(registrationId) {
  return registrationsRef.doc(registrationId).delete();
}

function addSignup(signup) {
  return signupsRef.add(signup);
}

function getSignup(signupId) {
  return signupsRef.doc(signupId).get();
}

function deleteSignup(signupId) {
  return signupsRef.doc(signupId).delete();
}

module.exports = {
  addRegistration,
  getRegistrationsByChannelId,
  getRegistrationsByChannelIdAndPlaylistId,
  getRegistrationsByChannelIdAndPlaylistIdAndAuthorId,
  deleteRegistration,
  addSignup,
  getSignup,
  deleteSignup,
};
