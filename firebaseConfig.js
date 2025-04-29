import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDTv4PwJ967bdcNgGpIWgY0olNMWktt7yY",
    authDomain: "unifit-mdb.firebaseapp.com",
    projectId: "unifit-mdb",
    storageBucket: "unifit-mdb.appspot.com",
    messagingSenderId: "402009546611",
    appId: "1:402009546611:web:0906a2b60e7c30a668ef06",
    measurementId: "G-FB79BRE1MD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);