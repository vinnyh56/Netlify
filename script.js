// --- Data Retrieval Function ---
function getReportData() {
    const storedData = sessionStorage.getItem('cafeReportData');
    
    // Default Mock Data (used if no session data is found or on first load)
    const mockData = {
        daily_report: {
            revenue: 0.00, 
            orders: 0,
            aov: 0.00,
            bestSeller: "N/A - Please Upload Data",
            decisionMakers: "Owner/CEO, Store Manager, Head Chef"
        },
        variance_report: [
            { platform: "POS (In-Store)", revenue: 0, orders: 0, salesVariance: "N/A" },
            { platform: "Swiggy", revenue: 0, orders: 0, salesVariance: "N/A" },
            { platform: "Zomato", revenue: 0, orders: 0, salesVariance: "N/A" }
        ],
        menu_analysis: [
            "Data pending upload.",
            "Run a simulation to generate reports.",
            "Note: Backend processing is required.",
        ]
    };

    if (storedData) {
        return JSON.parse(storedData);
    } else {
        return mockData;
    }
}


// ----------------------------------------------------------------------
// --- DASHBOARD RENDERING FUNCTIONS ---
// ----------------------------------------------------------------------

function renderDailyReport(data) {
    const dataDiv = document.getElementById('daily-data');
    if (!dataDiv) return;

    const dailyData = data.daily_report;
    const aovValue = dailyData.orders > 0 ? dailyData.aov.toFixed(2) : '0.00';

    // Summary text content
    const summaryHTML = `
        <div style="flex: 1; min-width: 250px;">
            <p><strong>Total Revenue Today:</strong> ₹${dailyData.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            <p><strong>Total Orders:</strong> ${dailyData.orders}</p>
            <p><strong>Average Order Value (AOV):</strong> ₹${aovValue}</p>
            <p><strong>Best Selling Item:</strong> ${dailyData.bestSeller}</p>
            <p><strong>Key Decision Makers:</strong> ${dailyData.decisionMakers || "Owner/CEO, Store Manager, Head Chef"}</p>
        </div>
    `;

    // Set up the layout container for the summary and the Pie Chart
    dataDiv.innerHTML = `<div style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap;">
                            ${summaryHTML}
                            <div style="flex: 1; max-width: 300px;">
                                <canvas id="sourcePieChart"></canvas>
                            </div>
                        </div>`;
}

function renderRevenueSourceChart(data) {
    const ctx = document.getElementById('sourcePieChart');
    if (!ctx || typeof Chart === 'undefined') return;

    const varianceData = data.variance_report;
    const labels = varianceData.map(item => item.platform);
    const revenues = varianceData.map(item => item.revenue);

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Revenue Share (₹)',
                data: revenues,
                backgroundColor: [
                    'rgba(75, 192, 192, 0.8)', // POS 
                    'rgba(255, 99, 132, 0.8)',  // Swiggy
                    'rgba(255, 159, 64, 0.8)'   // Zomato
                ],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                },
                title: {
                    display: true,
                    text: 'Revenue Source Breakdown'
                }
            }
        }
    });
}

function renderKeyInsights(data) {
    const dailyData = data.daily_report;
    const varianceData = data.variance_report;

    let insightsHTML = '';

    // --- INSIGHT 1: Overall Revenue Performance ---
    const totalRevenue = dailyData.revenue;
    const revenueBenchmark = 40000;

    if (totalRevenue >= revenueBenchmark) {
        insightsHTML += `<li>✅ **Strong Revenue Day:** Total revenue of ₹${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })} is above the ₹${revenueBenchmark.toLocaleString('en-IN')} benchmark.</li>`;
    } else {
        insightsHTML += `<li>🔴 **Revenue Alert:** Total revenue is ₹${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}. Review staffing or promotions to meet the ₹${revenueBenchmark.toLocaleString('en-IN')} daily goal.</li>`;
    }

    // --- INSIGHT 2: Platform Variance Analysis (Up/Down) ---
    varianceData.forEach(item => {
        const variance = parseFloat(item.salesVariance.replace(/[^0-9.-]/g, ''));
        const platform = item.platform;

        if (variance >= 5) { // Significant upswing
            insightsHTML += `<li>⬆️ **${platform} High Performer:** Sales are **${item.salesVariance}** above target. Analyze successful items/timeslots to replicate this success across other platforms.</li>`;
        } else if (variance <= -5) { // Significant downturn
            insightsHTML += `<li>⬇️ **${platform} Underperforming:** Sales are **${item.salesVariance}** below target. Check for service issues, menu visibility, or competitor pricing immediately.</li>`;
        }
    });

    // --- INSIGHT 3: Menu Item Alert ---
    const lowStockItem = data.menu_analysis.find(item => item.includes('Low Stock Warning'));
    if (lowStockItem) {
         insightsHTML += `<li>⚠️ **Inventory Warning:** ${lowStockItem}. Place the restock order now to prevent out-of-stock losses.</li>`;
    }

    // 2. Wrap the final insights in a clear container
    const finalInsights = `
        <div id="key-insights-card" class="dashboard-card" style="margin-top: 20px;">
            <h2>💡 Key Decision Highlights</h2>
            <ul style="list-style: none; padding-left: 0;">
                ${insightsHTML}
            </ul>
        </div>
    `;

    // 3. Append the insights card to the main section
    const mainSection = document.querySelector('main');
    if (mainSection && !document.getElementById('key-insights-card')) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = finalInsights.trim();
        const newCard = tempDiv.firstChild;
        
        // Insert the new card after the Daily Report section
        const dailyReportCard = document.getElementById('daily-report');
        if (dailyReportCard) {
            dailyReportCard.parentNode.insertBefore(newCard, dailyReportCard.nextSibling);
        }
    }
}


function renderVarianceReport(data) {
    const table = document.getElementById('variance-table');
    if (!table) return;

    const varianceData = data.variance_report;

    let tableHTML = `
        <thead>
            <tr>
                <th>Platform</th>
                <th>Revenue</th>
                <th>Orders</th>
                <th>Sales Variance (vs. Target)</th>
            </tr>
        </thead>
        <tbody>
    `;

    varianceData.forEach(item => {
        const varianceColor = item.salesVariance.includes('+') ? 'green' : (item.salesVariance.includes('-') ? 'red' : '#333');
        tableHTML += `
            <tr>
                <td>${item.platform}</td>
                <td>₹${item.revenue.toLocaleString('en-IN')}</td>
                <td>${item.orders}</td>
                <td style="color: ${varianceColor}; font-weight: bold;">${item.salesVariance}</td>
            </tr>
        `;
    });

    tableHTML += `</tbody>`;
    table.innerHTML = tableHTML;
}

function renderRevenueChart(data) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx || typeof Chart === 'undefined') return;

    const varianceData = data.variance_report;
    const labels = varianceData.map(item => item.platform);
    const revenues = varianceData.map(item => item.revenue);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Revenue (₹)',
                data: revenues,
                backgroundColor: [
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(255, 159, 64, 0.8)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Revenue (₹)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Revenue by Platform'
                }
            }
        }
    });
}

function renderMenuAnalysis(data) {
    const ul = document.getElementById('menu-data');
    if (!ul) return;
    
    const menuData = data.menu_analysis;

    let listHTML = '';
    menuData.forEach(item => {
        listHTML += `<li>${item}</li>`;
    });

    ul.innerHTML = listHTML;
}


// ----------------------------------------------------------------------
// --- UPLOAD LOGIC ---
// ----------------------------------------------------------------------

function setupUploadPage() {
    const form = document.getElementById('upload-form');
    const statusText = document.getElementById('upload-status');
    const simulateBtn = document.getElementById('simulate-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        sessionStorage.removeItem('cafeReportData'); 

        simulateBtn.disabled = true;
        statusText.textContent = "Uploading and running simulation... Please wait (This may take a few seconds).";

        const formData = new FormData(form);
        
        try {
            // CRITICAL CHANGE FOR NETLIFY: Use a relative path for the function
            const response = await fetch('/.netlify/functions/upload-data', {
                method: 'POST',
                body: formData 
            });

            if (!response.ok) {
                // If the function fails or is not found (404), this catches it
                const errorText = await response.text();
                statusText.textContent = `Error: Backend processing failed or not found (${response.status}).`;
                console.error('Fetch error:', response.status, errorText);
                simulateBtn.disabled = false;
                return;
            }

            const reportData = await response.json();

            // Store the data returned from the backend
            sessionStorage.setItem('cafeReportData', JSON.stringify(reportData));

            statusText.textContent = "✅ Simulation successful! Redirecting to Dashboard...";
            
            setTimeout(() => {
                window.location.href = 'index.html'; 
            }, 1000);

        } catch (error) {
            statusText.textContent = `Connection Error: Could not reach the Netlify Function.`;
            console.error('Fetch error:', error);
            simulateBtn.disabled = false;
        }
    });
}


// ----------------------------------------------------------------------
// --- INITIALIZATION ---
// ----------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    if (document.title.includes('Dashboard')) {
        const reportData = getReportData();
        
        // Render Dashboard components
        renderDailyReport(reportData);
        renderRevenueSourceChart(reportData); 
        renderKeyInsights(reportData); 
        renderVarianceReport(reportData);
        renderRevenueChart(reportData); 
        renderMenuAnalysis(reportData);
    } else if (document.title.includes('Upload')) {
        setupUploadPage();
    }
});
