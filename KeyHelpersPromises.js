var signal = require('signal-protocol')

var KeyHelper = signal.KeyHelper;

const generateIdentityKeyPair = () => new Promise((resolve, reject) => {
    KeyHelper
      .generateIdentityKeyPair()
      .then(function (identityKeyPair) {
        resolve(identityKeyPair)
      });
  });
  const generatePreKey = (registrationId) => new Promise((resolve, reject) => {
    KeyHelper
      .generatePreKey(registrationId)
      .then(function (preKey) {
        resolve(preKey)
      });
  })
  const generateSignedPreKey = (identityKeyPair, registrationId) => new Promise((resolve, reject) => {
    KeyHelper
      .generateSignedPreKey(identityKeyPair, registrationId)
      .then(function (signedPreKey) {
        resolve(signedPreKey)
      });
  });

module.exports = {
    generateIdentityKeyPair,
    generateSignedPreKey,
    generatePreKey,
}