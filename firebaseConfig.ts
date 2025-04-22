import { initializeApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDTv4PwJ967bdcNgGpIWgY0olNMWktt7yY",
    authDomain: "unifit-mdb.firebaseapp.com",
    projectId: "unifit-mdb",
    storageBucket: "unifit-mdb.appspot.com", // Fixed the storage bucket URL
    messagingSenderId: "402009546611",
    appId: "1:402009546611:web:0906a2b60e7c30a668ef06",
    measurementId: "G-FB79BRE1MD"
};

// Initialize Firebase
let auth: Auth | null = null;

try {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  console.log("Firebase successfully initialized");
} catch (error) {
  console.error("Firebase initialization error:", error);
}

export { auth }; 