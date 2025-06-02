import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBCWsqdON8ixvWBMlBFBj96xcWLQ8e9iZ8",
  authDomain: "roomzi-dfa4d.firebaseapp.com",
  projectId: "roomzi-dfa4d",
  storageBucket: "roomzi-dfa4d.firebasestorage.app",
  messagingSenderId: "721342501672",
  appId: "1:721342501672:web:f7e224a201f3123553761d",
  measurementId: "G-V4HEVYLMWM"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase Auth and export it
export const auth = getAuth(firebaseApp);