var signal = require('signal-protocol')


var KeyHelper = signal.KeyHelper;

const SignalProtocolStore = require('./utils/InMemorySignalProtocolStore')

const store = new SignalProtocolStore();
var registrationId = KeyHelper.generateRegistrationId();
// Store registrationId somewhere durable and safe.

KeyHelper.generateIdentityKeyPair().then(function(identityKeyPair) {
  // keyPair -> { pubKey: ArrayBuffer, privKey: ArrayBuffer }
  // Store identityKeyPair somewhere durable and safe.
  console.log('identityKeyPair', identityKeyPair)

  KeyHelper.generatePreKey(registrationId).then(function(preKey) {
    store.storePreKey(preKey.registrationId, preKey.keyPair);
    console.log('preKey', preKey)

    KeyHelper.generateSignedPreKey(identityKeyPair, registrationId).then(function(signedPreKey) {
      store.storeSignedPreKey(signedPreKey.keyId, signedPreKey.keyPair);
      console.log('signedPreKey', signedPreKey)

    });

  });
});





