var signal = require('signal-protocol')

var KeyHelper = signal.KeyHelper;
const SignalProtocolStore = require('./utils/InMemorySignalProtocolStore')
const store = new SignalProtocolStore();
const store2 = new SignalProtocolStore();

const myStore = {};
const v4 = require('uuid').v4;

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
const encryptMsg = async({msg, sessionCipher}) => {
  const ciphertext = await sessionCipher.encrypt(msg)
  return ciphertext;
}
const decryptNormalMsg = async({ciphertext, sessionCipher}) => {
  const decryptedBuffer = await sessionCipher.decryptWhisperMessage(ciphertext, 'binary')
  const text = String
    .fromCharCode
    .apply(null, new Uint8Array(decryptedBuffer))
  return text;
}

const decryptPreKeyWhisperlMsg = async({ciphertext, sessionCipher}) => {
  const decryptedBuffer = await sessionCipher.decryptPreKeyWhisperMessage(ciphertext, 'binary')
  const text = String
    .fromCharCode
    .apply(null, new Uint8Array(decryptedBuffer))
  return text;
}

const registerClient = async(store) => {
  const deviceId = 1;
  const registrationId = KeyHelper.generateRegistrationId();
  const identityKeyPair = await generateIdentityKeyPair();
  store.put('identityKey', identityKeyPair);
  store.put('registrationId', registrationId);

  const preKey = await generatePreKey(registrationId);
  store.storePreKey(preKey.keyId, preKey.keyPair);
  const signedPreKey = await generateSignedPreKey(identityKeyPair, registrationId);
  store.storeSignedPreKey(signedPreKey.keyId, signedPreKey.keyPair);

  myStore[`${deviceId}-${registrationId}`] = {
    deviceId,
    registrationId,
    storeId: `${deviceId}-${registrationId}`,
    identityKeyPair,
    preKey,
    signedPreKey
  };
  var address = new signal.SignalProtocolAddress(`${registrationId}.1`, deviceId);
  const bundle = await generatePreKeyBundle(store, await store.getLocalRegistrationId())

  return {deviceId, registrationId, address,bundle};
};

const onEncrypted = (ciphertextPack, sessionCipher) => {
  if (ciphertextPack.type === 1) {
    return decryptNormalMsg({ciphertext: ciphertextPack.body, sessionCipher: sessionCipher});
  } else {
    return decryptPreKeyWhisperlMsg({ciphertext: ciphertextPack.body, sessionCipher: sessionCipher});
  }
}

const init = async() => {

  const user1Id = await registerClient(store);

  //
  const user2Id = await registerClient(store2);

  //
  var user1InitSessionBuilder = new signal.SessionBuilder(store, user2Id.address);

  await user1InitSessionBuilder.processPreKey(user2Id.bundle);

  var user1Session = new signal.SessionCipher(store, user2Id.address);

  const user1ToUser2Ciphertext = await encryptMsg({msg: "whats if i hada chair", sessionCipher: user1Session});

  //
  var user2Session = new signal.SessionCipher(store2, user1Id.address);

  const decrypted = await onEncrypted( user1ToUser2Ciphertext, user2Session);

  console.log('decrypted', decrypted);

  const user2ToUser1Ciphertext = await encryptMsg({msg: "i gues you coud sit", sessionCipher: user2Session});

  //
  const decrypted2 = await onEncrypted( user2ToUser1Ciphertext, user1Session);

  console.log('decrypted2', decrypted2);

}

init();

const generatePreKeyBundle = (store, registrationId) => {
  return Promise.all([
    store.getIdentityKeyPair(),
      store.getLocalRegistrationId()
    ])
    .then(function (result) {
      var identity = result[0];
      var registrationId = result[1];

      return Promise.all([
        KeyHelper.generatePreKey(registrationId),
          KeyHelper.generateSignedPreKey(identity, registrationId)
        ])
        .then(function (keys) {
          var preKey = keys[0]
          var signedPreKey = keys[1];

          store.storePreKey(registrationId, preKey.keyPair);
          store.storeSignedPreKey(registrationId, signedPreKey.keyPair);

          return {
            identityKey: identity.pubKey,
            registrationId: registrationId,
            preKey: {
              keyId: registrationId,
              publicKey: preKey.keyPair.pubKey
            },
            signedPreKey: {
              keyId: registrationId,
              publicKey: signedPreKey.keyPair.pubKey,
              signature: signedPreKey.signature
            }
          };
        });
    });
}