var signal = require('signal-protocol')
var firebase = require('./firebase')
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

const bundle64 = (bundle) => {

    const {
        identityKey,
        signedPreKey,
        preKey,
        ...bundleData
    } = bundle;

    const identityKey64 = btoa(ab2str(identityKey));
    const signedPreKey64 = {
        ...signedPreKey,
        publicKey: btoa(ab2str(signedPreKey.publicKey)),
        signature: btoa(ab2str(signedPreKey.signature))
    }

    const preKey64 = {
        ...preKey,
        publicKey: btoa(ab2str(preKey.publicKey))
    }

    return {
        ...bundleData,
        identityKey64,
        signedPreKey64,
        preKey64
    }

}

const convertbundle64 = (bundle64) => {

    const {
        identityKey64,
        signedPreKey64,
        preKey64,
        ...bundleData
    } = bundle64;

    const identityKey = str2ab(atob(identityKey64));
    const signedPreKey = {
        ...signedPreKey64,
        publicKey: str2ab(atob(signedPreKey64.publicKey)),
        signature: str2ab(atob(signedPreKey64.signature))
    }

    const preKey = {
        ...preKey64,
        publicKey: str2ab(atob(preKey64.publicKey))
    }

    return {
        ...bundleData,
        identityKey,
        signedPreKey,
        preKey
    }

}

const getlatestBundle = async(userId) => {

    const jetsonRef = firebase
        .firestore()
        .collection('jetson');

    const query = jetsonRef
        .where('userId', '==', userId)
        .orderBy('created', 'desc')
        .limit(1)

    const {docs} = await query.get();

    const [one] = docs

    const latestSes = {
        id: one.id,
        ...one.data()
    }

    return latestSes;
}

const getlatestAndConvertbundle = async(userId) => {

    const latestSes = await getlatestBundle(userId);

    const {
        bundle64,
        deviceId,
        registrationId,
        ...sesData
    } = latestSes;

    const bundle = convertbundle64(bundle64);
    var address = new signal.SignalProtocolAddress(`${registrationId}.1`, deviceId);

    return {
        address,
        bundle,
        deviceId,
        registrationId,
        ...sesData
    };
}


module.exports = {
    getlatestAndConvertbundle,
    bundle64,
}