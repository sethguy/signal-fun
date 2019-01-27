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

  return {deviceId, registrationId};
};

const processPreKeyForUser = async(user, builder) => {

  const sessonConfig = {
    registrationId: user.registrationId,
    identityKey: user.identityKeyPair.pubKey,
    signedPreKey: {
      keyId: user.signedPreKey.keyId,
      publicKey: user.signedPreKey.keyPair.pubKey,
      signature: user.signedPreKey.signature
    },
    preKey: {
      keyId: user.preKey.keyId,
      publicKey: user.preKey.keyPair.pubKey
    }
  }

  await builder.processPreKey(sessonConfig);

}

const init = async() => {
  const user1Id = await registerClient(store);
  const user2Id = await registerClient(store2);
  const user1 = myStore[`${user1Id.deviceId}-${user1Id.registrationId}`]
  const user2 = myStore[`${user2Id.deviceId}-${user2Id.registrationId}`]
  console.log({user1, user2, myStore});

  var user1Address = new signal.SignalProtocolAddress('33.1', user1.deviceId);

  var user2Address = new signal.SignalProtocolAddress('44.1', user2.deviceId);

  var user1ToUser2SessionBuilder = new signal.SessionBuilder(store, user2Address);

  await processPreKeyForUser(user2, user1ToUser2SessionBuilder);
  
  var user1Session = new signal.SessionCipher(store, user2Address);

  var user2Session = new signal.SessionCipher(store2, user1Address);

  const user1ToUser2Ciphertext = await encryptMsg({msg: "whats if i hada chair", sessionCipher: user1Session})

  console.log(user1ToUser2Ciphertext)

  const decrypted = await decryptPreKeyWhisperlMsg({ciphertext: user1ToUser2Ciphertext.body, sessionCipher: user2Session})

  console.log('decrypted', decrypted)

  const user2ToUser1Ciphertext = await encryptMsg({msg: "i gues you coud sit", sessionCipher: user2Session})
  console.log('TCL: init -> user2ToUser1Ciphertext', user2ToUser1Ciphertext)

  const decrypted2 = await decryptNormalMsg({ciphertext: user2ToUser1Ciphertext.body, sessionCipher: user1Session})

  console.log('decrypted2', decrypted2)

}

init();