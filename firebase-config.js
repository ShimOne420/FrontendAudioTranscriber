import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-analytics.js";

const firebaseConfig = {
    apiKey: "AIzaSyCpIN4GU9y8Pgm9NSO76F_tL3AiwicnRgA",
    authDomain: "audiotranscription-8dab7.firebaseapp.com",
    projectId: "audiotranscription-8dab7",
    storageBucket: "audiotranscription-8dab7.appspot.com",
    messagingSenderId: "696854325181",
    appId: "1:696854325181:web:d52cc13243c469d45ad4d4",
    measurementId: "G-75T7L72XCR"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { db };
