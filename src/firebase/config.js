// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBBZzIvcTUMG7ZMz_J5xR4JLa4q97-fMvk",
  authDomain: "istylear-39e16.firebaseapp.com",
  projectId: "istylear-39e16",
  storageBucket: "istylear-39e16.firebasestorage.app",
  messagingSenderId: "995463798309",
  appId: "1:995463798309:web:2a1c2c4ea23e8959c8a9cc",
  measurementId: "G-GXBHSN0B0C",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// eslint-disable-next-line no-unused-vars
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
