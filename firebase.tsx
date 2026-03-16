// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDEQUz1W4eSRx55vKaZDclPQi6TaZBaSn4",
  authDomain: "aosell-3f431.firebaseapp.com",
  projectId: "aosell-3f431",
  storageBucket: "aosell-3f431.firebasestorage.app",
  messagingSenderId: "938947493830",
  appId: "1:938947493830:web:eff3947eeecb42a274bcc7",
  measurementId: "G-V9C6DK89JX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);