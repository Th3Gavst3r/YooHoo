function delay(t, v) {
  return new Promise(function (resolve) {
    setTimeout(resolve.bind(null, v), t);
  });
}

function react(message, emoji) {
  return message
    .react(emoji)
    .then(res => delay(3000, res))
    .then(res => res.users.remove());
}

function processedReaction(message) {
  return react(message, '▶️');
}

function errorReaction(message) {
  return react(message, '❌');
}

module.exports = { processedReaction, errorReaction };
