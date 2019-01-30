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

module.exports = firebase;