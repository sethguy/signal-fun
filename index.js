var signal = require('signal-protocol')
var dcodeIO = require('./node_modules/signal-protocol/build/dcodeIO.js');

var KeyHelper = signal.KeyHelper;
const SignalProtocolStore = require('./utils/InMemorySignalProtocolStore')
const store = new SignalProtocolStore();
const store2 = new SignalProtocolStore();

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
const encryptMsg = async({msg, store, address}) => {
  var sessionCipher = new signal.SessionCipher(store, address);
  const ciphertext = sessionCipher.encrypt(msg, 'uint32')
  return ciphertext;
}
const str2ab = (str) => {
  var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
  var bufView = new Uint32Array(buf);
  for (var i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}
const registerClient = async(store) => {
  const deviceId = 1;
  const registrationId = KeyHelper.generateRegistrationId();
  const identityKeyPair = await generateIdentityKeyPair();
  store.put('identityKey', identityKeyPair);

  const preKey = await generatePreKey(registrationId);
  store.storePreKey(preKey.keyId, preKey.keyPair);
  const signedPreKey = await generateSignedPreKey(identityKeyPair, registrationId);
  // console.log({
  //   signedPreKey
  // })

  store.storeSignedPreKey(signedPreKey.keyId, signedPreKey.keyPair);



  myStore[`${deviceId}-${registrationId}`] = {
    deviceId,
    registrationId,
    storeId: `${deviceId}-${registrationId}`,
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
  const user1Id = await registerClient(store);
  const user2Id = await registerClient(store2);
  const user1 = myStore[`${user1Id.deviceId}-${user1Id.registrationId}`]
  const user2 = myStore[`${user2Id.deviceId}-${user2Id.registrationId}`]
  console.log({
    user1,
    user2,
    myStore,
  });
  var user1Address = new signal.SignalProtocolAddress('33.1', user1.deviceId);

  var user2Address = new signal.SignalProtocolAddress('44.1', user2.deviceId);

  //

  var user1ToUser2Session = new signal.SessionBuilder(store, user2Address);

  var user2ToUser1Session = new signal.SessionBuilder(store2, user1Address);

  const sesson1Config = {
    registrationId: user1.registrationId,
    identityKey: user1.identityKeyPair.pubKey,
    signedPreKey: {
      keyId: user1.signedPreKey.keyId,
      publicKey: user1.signedPreKey.keyPair.pubKey,
      signature: user1.signedPreKey.signature,
    },
    preKey: {
      keyId: user1.preKey.keyId,
      publicKey: user1.preKey.keyPair.pubKey
    },
  }
  const sesson2Config = {
    registrationId: user2.registrationId,
    identityKey: user2.identityKeyPair.pubKey,
    signedPreKey: {
      keyId: user2.signedPreKey.keyId,
      publicKey: user2.signedPreKey.keyPair.pubKey,
      signature: user2.signedPreKey.signature,
    },
    preKey: {
      keyId: user2.preKey.keyId,
      publicKey: user2.preKey.keyPair.pubKey
    },
  }
  console.log({
    sesson2Config
  })
  await user1ToUser2Session.processPreKey(sesson1Config);


  await user2ToUser1Session.processPreKey(sesson2Config);

  //


  console.log({
    sesson1Config
  })



  const user1ToUser2Ciphertext = await encryptMsg({
    msg: "whats if i hada chair",
    store,
    address: user2Address
  }, 'uint32')

  console.log(user1ToUser2Ciphertext)

}

init();