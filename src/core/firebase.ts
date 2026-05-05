import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAqlXqFF1_m6VAwVAvr_lRXgSZESy_BJ4k",
  authDomain: "marche-du-faucon.firebaseapp.com",
  projectId: "marche-du-faucon",
  storageBucket: "marche-du-faucon.firebasestorage.app",
  messagingSenderId: "577122324982",
  appId: "1:577122324982:web:f522d9d52384adb8a1f7d7",
  measurementId: "G-V0JD90HPVZ",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
