// In script.js: Replace the existing setupUploadPage function
function setupUploadPage() {
    const form = document.getElementById('upload-form');
    const statusText = document.getElementById('upload-status');
    const simulateBtn = document.getElementById('simulate-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        simulateBtn.disabled = true;
        statusText.textContent = "✅ Upload simulated. Proceeding to Dashboard with mock data...";

        // --- TEMPORARY FIX: BYPASSING THE BLOCKED NETLIFY FUNCTION ---
        // We clear the session data to ensure the dashboard loads the default mock data.
        sessionStorage.removeItem('cafeReportData'); 
            
        setTimeout(() => {
            window.location.href = 'index.html'; 
        }, 1000);
        // -----------------------------------------------------------
    });
}
