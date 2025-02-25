import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-analytics.js";

// ✅ Configurazione Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCpIN4GU9y8Pgm9NSO76F_tL3AiwicnRgA",
    authDomain: "audiotranscription-8dab7.firebaseapp.com",
    projectId: "audiotranscription-8dab7",
    storageBucket: "audiotranscription-8dab7.appspot.com",
    messagingSenderId: "696854325181",
    appId: "1:696854325181:web:d52cc13243c469d45ad4d4",
    measurementId: "G-75T7L72XCR"
};

// ✅ Inizializza Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

console.log("✅ Firebase inizializzato correttamente!");

// ✅ Variabili globali
const BACKEND_URL = "https://audiotesto.duckdns.org"; 
const POLLING_INTERVAL = 2000; 
let accessCode = "";
let transcriptionId = "";

// ✅ Funzione Login
window.login = async function login() {
    accessCode = document.getElementById("accessCode").value;

    let response = await fetch(`${BACKEND_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `code=${accessCode}`
    });

    let result = await response.json();
    if (result.status === "success") {
        document.getElementById("loginForm").style.display = "none";
        document.getElementById("uploadForm").style.display = "block";
    } else {
        alert("Invalid Code! Please try again.");
    }
}

// ✅ Funzione Upload File
window.uploadFile = async function uploadFile() {
    if (!accessCode) {
        alert("You must enter a valid code first!");
        return;
    }

    let fileInput = document.getElementById("file");
    let file = fileInput.files[0];

    if (!file) {
        alert("Please select a file first!");
        return;
    }

    let formData = new FormData();
    formData.append("file", file);
    formData.append("language", document.getElementById("language").value);
    formData.append("code", accessCode);

    console.log("🚀 Uploading file:", file.name);

    try {
        let response = await fetch(`${BACKEND_URL}/transcribe`, {
            method: "POST",
            body: formData
        });

        let result = await response.json();
        console.log("📌 Risultato della trascrizione:", result);

        if (result.filename) {
            transcriptionId = result.filename;
            console.log("✅ File caricato con successo:", transcriptionId);
            startListeningToFirestore();
        } else {
            console.error("❌ Errore nella trascrizione:", result.error);
            alert(`Errore durante la trascrizione: ${result.error}`);
        }
    } catch (error) {
        console.error("❌ Errore durante l'upload:", error);
        alert("Upload fallito.");
    }
};

function startListeningToFirestore() {
    if (!transcriptionId) {
        alert("Error: Transcription ID not found!");
        return;
    }

    let liveStatus = document.getElementById("liveStatus");
    let resultText = document.getElementById("result");
    let loadingSpinner = document.getElementById("loadingSpinner");
    let progressBar = document.getElementById("progressBar");

    liveStatus.innerText = "Processing...";
    loadingSpinner.style.display = "block";
    progressBar.style.width = "0%";
    progressBar.innerText = "0%";

    console.log("🔄 Inizio ascolto Firestore per:", transcriptionId);

    // ✅ ASCOLTA Firebase Firestore IN TEMPO REALE
    const transcriptionRef = doc(db, "transcriptions", transcriptionId);
    
    onSnapshot(transcriptionRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
            let data = docSnapshot.data();
            console.log("🔥 Aggiornamento Firestore ricevuto:", data); // <--- DEBUG

            if (data.text) {
                resultText.innerText = data.text; // Aggiorna la trascrizione in tempo reale
            }

            if (data.progress !== undefined) {
                progressBar.style.width = `${data.progress}%`;
                progressBar.innerText = `${Math.round(data.progress)}%`;
                console.log(`📊 Progresso trascrizione: ${data.progress}%`); // <--- DEBUG
            }

            if (data.progress >= 100) {
                liveStatus.innerText = "Completed!";
                loadingSpinner.style.display = "none";
                document.getElementById("downloadPdf").style.display = "block";
            }
        } else {
            console.error("❌ Documento non trovato su Firebase.");
        }
    }, (error) => {
        console.error("❌ Errore durante l'ascolto di Firestore:", error);
    });
}

// ✅ Funzione per scaricare il PDF della trascrizione
window.downloadPDF = function downloadPDF() {
    let text = document.getElementById("result").innerText;
    let doc = new jsPDF();
    doc.text(text, 10, 10);
    doc.save("transcription.pdf");
};
