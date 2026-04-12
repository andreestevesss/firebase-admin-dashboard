import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBDAk-XyfnhCMrYcFd1AFqObAaRztQFvm4",
  authDomain: "patriorxapp.firebaseapp.com",
  projectId: "patriorxapp",
  storageBucket: "patriorxapp.firebasestorage.app",
  messagingSenderId: "3067205720",
  appId: "1:3067205720:ios:c2eb1a5ec543a6e006922d",
  databaseURL: "https://patriorxapp-default-rtdb.firebaseio.com"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
