// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD5W2LqvzIzVijIxYpn5RthviuFOLpiYVY",
  authDomain: "ppps-3c295.firebaseapp.com",
  projectId: "ppps-3c295",
  storageBucket: "ppps-3c295.firebasestorage.app",
  messagingSenderId: "935796052328",
  appId: "1:935796052328:web:b2770e499ecf6675bb86dd",
  measurementId: "G-KFTGKSFG8C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
