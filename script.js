import { db } from "./firebase-config.js";

const BACKEND_URL = "https://audiotesto.duckdns.org"; 
const POLLING_INTERVAL = 2000; 

let accessCode = "";
let transcriptionId = "";



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

async function uploadFile() {
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
}


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

    // ✅ ASCOLTA Firebase Firestore IN TEMPO REALE
    db.collection("transcriptions").doc(transcriptionId)
        .onSnapshot((doc) => {
            if (doc.exists) {
                let data = doc.data();
                console.log("🔄 Trascrizione aggiornata:", data.text);

                if (data.text) {
                    resultText.innerText = data.text;
                }

                if (data.progress !== undefined) {
                    progressBar.style.width = `${data.progress}%`;
                    progressBar.innerText = `${Math.round(data.progress)}%`;
                }

                // ✅ Se la trascrizione è completata, ferma il loading
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
function downloadPDF() {
    let text = document.getElementById("result").innerText;
    let doc = new jsPDF();
    doc.text(text, 10, 10);
    doc.save("transcription.pdf");
}
