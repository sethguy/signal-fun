var signal = require('signal-protocol')

const SignalProtocolStore = require('./utils/InMemorySignalProtocolStore')
const store = new SignalProtocolStore();
const store2 = new SignalProtocolStore();


const {encryptMsg, onEncrypted} = require('./messaging')

const { initClient} = require('./clientRegistration')

const {getlatestAndConvertbundle} = require('./bundleUtils')
const init = async() => {

  await initClient("user1",store);
  const user1Cloud = await getlatestAndConvertbundle('user1')

  await initClient("user2",store2);

  const user2Cloud = await getlatestAndConvertbundle('user2')

  console.log('TCL: init -> user2Cloud', user2Cloud)

  var user1InitSessionBuilder = new signal.SessionBuilder(store, user2Cloud.address);

  await user1InitSessionBuilder.processPreKey(user2Cloud.bundle);

  var user1Session = new signal.SessionCipher(store, user2Cloud.address);

  const user1ToUser2Ciphertext = await encryptMsg({msg: "whats if i hada chair", sessionCipher: user1Session});

  //
  var user2Session = new signal.SessionCipher(store2, user1Cloud.address);

  const decrypted = await onEncrypted(user1ToUser2Ciphertext, user2Session);

  console.log('decrypted', decrypted);

  const user2ToUser1Ciphertext = await encryptMsg({msg: "i gues you coud sit", sessionCipher: user2Session});

  //
  const decrypted2 = await onEncrypted(user2ToUser1Ciphertext, user1Session);

  console.log('decrypted2', decrypted2);

}

init();

