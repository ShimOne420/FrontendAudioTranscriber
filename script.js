const BACKEND_URL = "https://audiotesto.duckdns.org"; // URL del backend
const POLLING_INTERVAL = 2000; // Ogni 2 secondi verifica Firebase

let accessCode = "";
let transcriptionId = "";

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

    console.log("🚀 Uploading file:", file);

    try {
        let response = await fetch(`${BACKEND_URL}/transcribe`, {
            method: "POST",
            body: formData
        });

        let result = await response.json();
        console.log("📌 Risultato della trascrizione:", result);

        if (result.transcription) {
            transcriptionId = file.name;
            console.log("✅ File caricato con successo:", transcriptionId);
            startCheckingProgress();
        } else {
            console.error("❌ Errore nella trascrizione:", result.error);
            alert("Errore durante la trascrizione.");
        }
    } catch (error) {
        console.error("❌ Errore durante l'upload:", error);
        alert("Upload fallito.");
    }
}

async function startCheckingProgress() {
    if (!transcriptionId) {
        alert("Error: Transcription ID not found!");
        return;
    }

    let liveStatus = document.getElementById("liveStatus");
    let resultText = document.getElementById("result");
    let loadingSpinner = document.getElementById("loadingSpinner");

    // Mostra lo spinner e il testo "Processing..."
    liveStatus.innerText = "Processing...";
    loadingSpinner.style.display = "block";

    let interval = setInterval(async () => {
        try {
            let response = await fetch(`${BACKEND_URL}/get_transcription?filename=${transcriptionId}`);
            let data = await response.json();

            if (!response.ok || data.error) {
                throw new Error("Error checking transcription progress.");
            }

            // Se la trascrizione è disponibile, mostriamo il testo e fermiamo il polling
            if (data.text) {
                resultText.innerText = data.text;
                liveStatus.innerText = "Completed!";
                loadingSpinner.style.display = "none"; // Nasconde lo spinner
                clearInterval(interval);
                document.getElementById("downloadPdf").style.display = "block";
            }
        } catch (error) {
            clearInterval(interval);
            alert("Error checking transcription progress.");
            liveStatus.innerText = "Error in progress check.";
            loadingSpinner.style.display = "none"; // Nasconde lo spinner in caso di errore
        }
    }, POLLING_INTERVAL);
}

function downloadPDF() {
    let text = document.getElementById("result").innerText;
    let doc = new jsPDF();
    doc.text(text, 10, 10);
    doc.save("transcription.pdf");
}
