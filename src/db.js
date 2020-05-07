const Firestore = require('@google-cloud/firestore');
const db = new Firestore();

async function setRegistration(registration) {
  const registrationsRef = db.collection('registrations');

  // Check if registration already exists
  const snapshot = await registrationsRef
    .where('playlist', '==', registration.playlist)
    .where('channel', '==', registration.channel)
    .get();

  if (snapshot.size > 1) {
    throw new Error('Error: Multiple existing registrations');
  } else if (snapshot.empty) {
    return registrationsRef.add(registration);
  } else {
    return registrationsRef.doc(snapshot.docs[0].id).set(registration);
  }
}

function findRegistrationsByChannelId(channelId) {
  return db
    .collection('registrations')
    .where('channel.id', '==', channelId)
    .get();
}

module.exports = { setRegistration, findRegistrationsByChannelId };
