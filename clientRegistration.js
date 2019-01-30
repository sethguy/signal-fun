var signal = require('signal-protocol')
var KeyHelper = signal.KeyHelper;

var firebase = require('./firebase')

const {generateIdentityKeyPair, generateSignedPreKey, generatePreKey} = require('./KeyHelpersPromises')

const { bundle64} = require('./bundleUtils')

const v4 = require('uuid').v4;


const initClient = async(userId,store) =>{
  const id = userId || v4();
  const clientData = await registerClient(store);
  await initUserJetson({
    ...clientData,
    userId: id
  });
  return {
    ...clientData,
    userId: id
  }
}

const initUserJetson = async({deviceId, registrationId, bundle, userId}) => {
    const b64 = bundle64(bundle);
    await firebase
        .firestore()
        .collection('jetson')
        .add({
            created: new Date().getTime(),
            userId,
            deviceId,
            registrationId,
            bundle64: b64
        });
};

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

    var address = new signal.SignalProtocolAddress(`${registrationId}.1`, deviceId);
    const bundle = await generatePreKeyBundle(store, await store.getLocalRegistrationId())

    return {deviceId, registrationId, address, bundle};
};

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

module.exports = {
  initClient
}