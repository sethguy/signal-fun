var signal = require('signal-protocol')
var KeyHelper = signal.KeyHelper;
const SignalProtocolStore = require('./utils/InMemorySignalProtocolStore')

// Store registrationId somewhere durable and safe.

// KeyHelper.generateIdentityKeyPair().then(function(identityKeyPair) {
//   // keyPair -> { pubKey: ArrayBuffer, privKey: ArrayBuffer }
//   // Store identityKeyPair somewhere durable and safe.

//   KeyHelper.generatePreKey(registrationId).then(function(preKey) {
//     store.storePreKey(preKey.registrationId, preKey.keyPair);
//     console.log('preKey', preKey)

//     KeyHelper.generateSignedPreKey(identityKeyPair, registrationId).then(function(signedPreKey) {
//       store.storeSignedPreKey(signedPreKey.keyId, signedPreKey.keyPair);
//       console.log('signedPreKey', signedPreKey)

//     });

//   });
// });


const generateIdentityKeyPair = new Promise((resolve, reject) => {

  KeyHelper.generateIdentityKeyPair().then(function(identityKeyPair) {
    resolve(identityKeyPair)
  });

})

const generatePreKey = (registrationId) => {
  return new Promise((resolve, reject) => {
    KeyHelper.generatePreKey(registrationId).then(function(preKey) {
      store.storePreKey(preKey.registrationId, preKey.keyPair);
      resolve(preKey)
    });
  })
}

const generateSignedPreKey = (identityKeyPair, registrationId) => {
  return new Promise((resolve, reject) => {
    KeyHelper.generateSignedPreKey(identityKeyPair, registrationId).then(function(signedPreKey) {
      store.storeSignedPreKey(signedPreKey.keyId, signedPreKey.keyPair);
      resolve(signedPreKey)
    });
  })
}


const init = async() => {

  const store = new SignalProtocolStore();
  var registrationId = KeyHelper.generateRegistrationId();

  const identityKeyPair = await generateIdentityKeyPair(registrationId)

  const preKey = await generatePreKey(registrationId);

  console.log('preKey', preKey)

  const signedPreKey = await generateSignedPreKey(identityKeyPair, registrationId);

  console.log('signedPreKey', signedPreKey)

}


init();