/* js/firebase-config.js — Islands Firebase (shared auth across all projects) */

var firebaseConfig = {
  apiKey: "AIzaSyA52PE4vS45kudV42XktdwCnu3rZ_g2u84",
  authDomain: "islands-108.firebaseapp.com",
  projectId: "islands-108",
  storageBucket: "islands-108.firebasestorage.app",
  messagingSenderId: "573340181588",
  appId: "1:573340181588:web:8e7be442f955c2433239c1",
  measurementId: "G-CBQZJE1RE7"
};

firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();
var auth = firebase.auth();
