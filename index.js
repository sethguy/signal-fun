var signal = require('signal-protocol')
var KeyHelper = signal.KeyHelper;
const SignalProtocolStore = require('./utils/InMemorySignalProtocolStore')
const store = new SignalProtocolStore();

const generateIdentityKeyPair = () => {
  return new Promise((resolve, reject) => {
    KeyHelper.generateIdentityKeyPair().then(function(identityKeyPair) {
      resolve(identityKeyPair)
    });

  })
}

const generatePreKey = (registrationId) => {
  return new Promise((resolve, reject) => {
    KeyHelper.generatePreKey(registrationId).then(function(preKey) {
      resolve(preKey)
    });
  })
}

const generateSignedPreKey = (identityKeyPair, registrationId) => {
  return new Promise((resolve, reject) => {
    KeyHelper.generateSignedPreKey(identityKeyPair, registrationId).then(function(signedPreKey) {
      resolve(signedPreKey)
    });
  })
}

const init = async() => {
  var registrationId = KeyHelper.generateRegistrationId();
  const identityKeyPair = await generateIdentityKeyPair(registrationId)
  const preKey = await generatePreKey(registrationId);
  store.storePreKey(preKey.registrationId, preKey.keyPair);
  console.log('preKey', preKey)
  const signedPreKey = await generateSignedPreKey(identityKeyPair, registrationId);
  store.storeSignedPreKey(signedPreKey.keyId, signedPreKey.keyPair);
  console.log('signedPreKey', signedPreKey)
}

init();