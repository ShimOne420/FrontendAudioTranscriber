const BACKEND_URL = "http://35.206.101.150:8000"; // Replace with your actual backend URL

let accessCode = ""; // Stores the user's access code

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
    formData.append("code", accessCode); // Pass the access code to the backend

    let progressBar = document.getElementById("progressBar");
    progressBar.style.width = "0%";
    progressBar.innerText = "Uploading...";

    let response = await fetch(`${BACKEND_URL}/transcribe`, {
        method: "POST",
        body: formData
    });

    let result = await response.json();
    if (result.transcription) {
        document.getElementById("result").innerText = result.transcription;
        document.getElementById("downloadPdf").style.display = "block";
        progressBar.style.width = "100%";
        progressBar.innerText = "Completed!";
    } else {
        alert("Error in transcription!");
        progressBar.style.width = "0%";
    }
}

function downloadPDF() {
    let text = document.getElementById("result").innerText;
    let doc = new jsPDF();
    doc.text(text, 10, 10);
    doc.save("transcription.pdf");
}

// Interactive elements during waiting period
document.getElementById("interactiveArea").addEventListener("mousemove", function(event) {
    let circle = document.createElement("div");
    circle.className = "moving-circle";
    circle.style.left = `${event.clientX}px`;
    circle.style.top = `${event.clientY}px`;
    document.getElementById("interactiveArea").appendChild(circle);
    setTimeout(() => circle.remove(), 500);
});
