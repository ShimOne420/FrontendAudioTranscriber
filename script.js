const BACKEND_URL = "https://audiotesto.duckdns.org"; 
const POLLING_INTERVAL = 2000; 

let accessCode = "";
let transcriptionId = "";


const firebaseConfig = {
    apiKey: "LA_TUA_API_KEY",
    authDomain: "AudioTranscription.firebaseapp.com",
    projectId: "audiotranscription-8dab7",
    storageBucket: "IL_TUO_BUCKET.appspot.com",
    messagingSenderId: "IL_TUO_SENDER_ID",
    appId: "IL_TUO_APP_ID"
};

// ✅ Inizializza Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
async function login() {
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

async function startCheckingLiveProgress() {
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

    let interval = setInterval(async () => {
        try {
            let response = await fetch(`${BACKEND_URL}/get_live_transcription?filename=${transcriptionId}`);
            let data = await response.json();

            if (!response.ok || data.error) {
                console.error("❌ Errore durante il polling:", data.error);
                throw new Error("Error checking transcription progress.");
            }

            // ✅ Aggiorna il testo live
            if (data.text) {
                resultText.innerText = data.text;
                console.log("✍️ Trascrizione aggiornata:", data.text);
            }

            // ✅ Aggiorna la barra di caricamento
            if (data.progress !== undefined) {
                progressBar.style.width = `${data.progress}%`;
                progressBar.innerText = `${Math.round(data.progress)}%`;
                console.log(`📊 Progresso trascrizione: ${data.progress}%`);
            }

            // ✅ Se completato, ferma il polling
            if (data.progress >= 100) {
                clearInterval(interval);
                liveStatus.innerText = "Completed!";
                loadingSpinner.style.display = "none";
                document.getElementById("downloadPdf").style.display = "block";
            }
        } catch (error) {
            console.error("❌ Errore durante il controllo della trascrizione:", error);
            clearInterval(interval);
            alert("Errore nel recupero della trascrizione.");
            liveStatus.innerText = "Error in progress check.";
            loadingSpinner.style.display = "none";
        }
    }, POLLING_INTERVAL);
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
