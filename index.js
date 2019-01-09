var signal = require('signal-protocol')
var KeyHelper = signal.KeyHelper;
const SignalProtocolStore = require('./utils/InMemorySignalProtocolStore')
const store = new SignalProtocolStore();
const myStore = {};
const v4 = require('uuid').v4;

const generateIdentityKeyPair = () => new Promise((resolve, reject) => {
  KeyHelper.generateIdentityKeyPair().then(function(identityKeyPair) {
    resolve(identityKeyPair)
  });
});
const generatePreKey = (registrationId) => new Promise((resolve, reject) => {
  KeyHelper.generatePreKey(registrationId).then(function(preKey) {
    resolve(preKey)
  });
})
const generateSignedPreKey = (identityKeyPair, registrationId) => new Promise((resolve, reject) => {
  KeyHelper.generateSignedPreKey(identityKeyPair, registrationId).then(function(signedPreKey) {
    resolve(signedPreKey)
  });
});
const registerClient = async() => {
  const deviceId = v4();
  const registrationId = KeyHelper.generateRegistrationId();
  const identityKeyPair = await generateIdentityKeyPair(registrationId);
  const preKey = await generatePreKey(registrationId);
  store.storePreKey(preKey.registrationId, preKey.keyPair);
  const signedPreKey = await generateSignedPreKey(identityKeyPair, registrationId);
  store.storeSignedPreKey(signedPreKey.keyId, signedPreKey.keyPair);
  myStore[`${deviceId}-${registrationId}`] = {
    deviceId,
    registrationId,
    identityKeyPair,
    preKey,
    signedPreKey,
  };
  return {
    deviceId,
    registrationId
  };
};
const init = async () => {
  const user1 = await registerClient();
  const user2 = await registerClient();
  console.log({
    user1,
    user2,
    myStore,
  });
}

init();