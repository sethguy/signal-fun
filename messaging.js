const encryptMsg = async({msg, sessionCipher}) => {
    const ciphertext = await sessionCipher.encrypt(msg)
    return ciphertext;
  }
  
  const decryptPreKeyWhisperlMsg = async({ciphertext, sessionCipher}) => {
    const decryptedBuffer = await sessionCipher.decryptPreKeyWhisperMessage(ciphertext, 'binary')
    const text = String
      .fromCharCode
      .apply(null, new Uint8Array(decryptedBuffer))
    return text;
  }
  
  const decryptNormalMsg = async({ciphertext, sessionCipher}) => {
    const decryptedBuffer = await sessionCipher.decryptWhisperMessage(ciphertext, 'binary')
    const text = String
      .fromCharCode
      .apply(null, new Uint8Array(decryptedBuffer))
    return text;
  }

  const onEncrypted = (ciphertextPack, sessionCipher) => {
    if (ciphertextPack.type === 1) {
      return decryptNormalMsg({ciphertext: ciphertextPack.body, sessionCipher: sessionCipher});
    } else {
      return decryptPreKeyWhisperlMsg({ciphertext: ciphertextPack.body, sessionCipher: sessionCipher});
    }
  }

  module.exports = {
    encryptMsg,
    onEncrypted,
    decryptNormalMsg,
    decryptPreKeyWhisperlMsg,
  }