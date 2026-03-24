import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDoPFmLdMB7EEsgyBMZBh5eQG7GjNfZtHA",
  authDomain: "neu-library-log-6e026.firebaseapp.com",
  projectId: "neu-library-log-6e026",
  storageBucket: "neu-library-log-6e026.firebasestorage.app",
  messagingSenderId: "982374857952",
  appId: "1:982374857952:web:85b7da1802832b8f2b6485"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);