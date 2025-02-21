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
    let formData = new FormData();
    formData.append("file", fileInput.files[0]);
    formData.append("language", document.getElementById("language").value);
    formData.append("code", accessCode);

    let progressBar = document.getElementById("progressBar");
    let liveStatus = document.getElementById("liveStatus");
    progressBar.style.width = "0%";
    progressBar.innerText = "Uploading...";
    liveStatus.innerText = "Uploading file...";

    let response = await fetch(`${BACKEND_URL}/transcribe`, {
        method: "POST",
        body: formData
    });

    let result = await response.json();
    if (result.message.includes("File uploaded successfully")) {
        transcriptionId = fileInput.files[0].name;
        liveStatus.innerText = "Transcription in progress...";
        startCheckingProgress(); // Inizia a controllare Firebase
    } else {
        alert("Error in transcription!");
        progressBar.style.width = "0%";
    }
}

// ✅ Controlla Firebase per aggiornare il progresso
async function startCheckingProgress() {
    let progressBar = document.getElementById("progressBar");
    let liveStatus = document.getElementById("liveStatus");
    let resultText = document.getElementById("result");

    let interval = setInterval(async () => {
        let response = await fetch(`${BACKEND_URL}/progress?file=${transcriptionId}`);
        let data = await response.json();

        if (data.error) {
            clearInterval(interval);
            alert("Error checking transcription progress.");
            return;
        }

        // Aggiorna il testo trascritto progressivamente
        resultText.innerText = data.text || "";
        
        // Simula una barra di avanzamento
        let progress = data.progress || 0;
        progressBar.style.width = `${progress}%`;
        progressBar.innerText = `${progress}%`;

        // Stato di avanzamento
        if (progress < 100) {
            liveStatus.innerText = `Processing... ${progress}%`;
        } else {
            clearInterval(interval);
            liveStatus.innerText = "Completed!";
            document.getElementById("downloadPdf").style.display = "block";
        }
    }, POLLING_INTERVAL);
}

function downloadPDF() {
    let text = document.getElementById("result").innerText;
    let doc = new jsPDF();
    doc.text(text, 10, 10);
    doc.save("transcription.pdf");
}
