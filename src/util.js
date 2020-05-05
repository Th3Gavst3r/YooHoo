function errorReaction(message) {
  return message.react('❌');
  // .then(res => delay(defaultCooldown, res))
  // .then(res => res.users.remove());
}

module.exports = { errorReaction };
