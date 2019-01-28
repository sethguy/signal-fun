var signal = require('signal-protocol')

var firebase = require('firebase')

var config = {
  apiKey: "AIzaSyAgRn4rnja4ux7wOpQ9nfqUAqJXTRVayho",
  authDomain: "project-jetta.firebaseapp.com",
  databaseURL: "https://project-jetta.firebaseio.com",
  projectId: "project-jetta",
  storageBucket: "project-jetta.appspot.com",
  messagingSenderId: "217223507027"
};
firebase.initializeApp(config);

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

  return {deviceId, registrationId, address, bundle};
};

const onEncrypted = (ciphertextPack, sessionCipher) => {
  if (ciphertextPack.type === 1) {
    return decryptNormalMsg({ciphertext: ciphertextPack.body, sessionCipher: sessionCipher});
  } else {
    return decryptPreKeyWhisperlMsg({ciphertext: ciphertextPack.body, sessionCipher: sessionCipher});
  }
}

const ab2str = (buf) => {
  return String
    .fromCharCode
    .apply(null, new Uint8Array(buf));
}

const str2ab = (str) => {
  var buf = new ArrayBuffer(str.length); // 2 bytes for each char
  var bufView = new Uint8Array(buf);
  for (var i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

const initUserJetson = async({deviceId, registrationId, bundle, userId}) => {
	console.log('TCL: {deviceId, registrationId, bundle, userId}', {deviceId, registrationId, bundle, userId})
  // console.log('TCL: initUserJetson -> {deviceId, registrationId,
  // bundle,userId}', {deviceId, registrationId, bundle,userId})
  // console.log( "1", ab2str(bundle.identityKey) )

  // const string1 = ab2str(bundle.identityKey);

  
  // const base64 = btoa(string1)
	// console.log('TCL: base64', base64)
  
  // const bdecode = atob(base64)

	// console.log('TCL: bdecode', bdecode)


  // console.log("2", ab2str(str2ab(ab2str(bundle.identityKey)))  )

  // await firebase   .firestore()   .collection('jetson')   .add({deviceId,
  // registrationId, bundle,userId});

}
const init = async() => {

  const user1Id = await registerClient(store);
  const user1 = await initUserJetson({
    ...user1Id,
    userId: "user1"
  });

  console.log('user1', user1)

  //
  const user2Id = await registerClient(store2);
  const user2 = await initUserJetson({
    ...user2Id,
    userId: "user2"
  });

  //
  var user1InitSessionBuilder = new signal.SessionBuilder(store, user2Id.address);

  await user1InitSessionBuilder.processPreKey(user2Id.bundle);

  var user1Session = new signal.SessionCipher(store, user2Id.address);

  const user1ToUser2Ciphertext = await encryptMsg({msg: "whats if i hada chair", sessionCipher: user1Session});

  //
  var user2Session = new signal.SessionCipher(store2, user1Id.address);

  const decrypted = await onEncrypted(user1ToUser2Ciphertext, user2Session);

  console.log('decrypted', decrypted);

  const user2ToUser1Ciphertext = await encryptMsg({msg: "i gues you coud sit", sessionCipher: user2Session});

  //
  const decrypted2 = await onEncrypted(user2ToUser1Ciphertext, user1Session);

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