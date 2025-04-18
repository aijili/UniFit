// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDTv4PwJ967bdcNgGpIWgY0olNMWktt7yY",
  authDomain: "unifit-mdb.firebaseapp.com",
  projectId: "unifit-mdb",
  storageBucket: "unifit-mdb.firebasestorage.app",
  messagingSenderId: "402009546611",
  appId: "1:402009546611:web:0906a2b60e7c30a668ef06",
  measurementId: "G-FB79BRE1MD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);