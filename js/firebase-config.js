/* js/firebase-config.js — Firebase initialization (compat SDK via CDN)
   Loaded by community.js and profile page */

var firebaseConfig = {
  apiKey: "AIzaSyDtLOJvGf1CVEfuh3Ws-Hyjp3d4fM2mkyU",
  authDomain: "healing-with-medical-medium.firebaseapp.com",
  projectId: "healing-with-medical-medium",
  storageBucket: "healing-with-medical-medium.firebasestorage.app",
  messagingSenderId: "992076856579",
  appId: "1:992076856579:web:6c6ebbad5288a05bc27d36",
  measurementId: "G-2V9MBV97XY"
};

firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();
var auth = firebase.auth();
