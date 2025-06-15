import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCt1MOgWBat53pScwbytOVgiZ_wp9vPrc4",
  authDomain: "autocare-21c20.firebaseapp.com",
  projectId: "autocare-21c20",
  storageBucket: "autocare-21c20.firebasestorage.app",
  messagingSenderId: "1026416150943",
  appId: "1:1026416150943:web:423584abadc6841c2595aa"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);