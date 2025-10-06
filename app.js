// Global App Object
window.app = {
    // State variables
    uploadedFiles: { pos: [], zomato: [], swiggy: [] },
    generatedReport: null,
    reportPeriod: 'daily',
    hasGeneratedReport: false,
    
    // --- CORE CONSTANTS (MARKET BENCHMARKS FOR RCA, NOT ACTUAL RATES) ---
    CONSTANTS: {
        // Range to determine if your negotiated commission is competitive
        MARKET_COMMISSION_MIN: 0.18, 
        MARKET_COMMISSION_MAX: 0.25, 
        
        // Threshold for acceptable revenue variance (5% is standard for reconciliation)
        VARIANCE_THRESHOLD: 0.05, 
    },

    // --- INITIALIZATION ---
    init: function() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeFileUpload();
            this.initializeTabNavigation();
            this.resetDashboardState();
            this.showTab('home');

            document.getElementById('report-settings-form').addEventListener('change', (e) => {
                if (e.target.name === 'period') {
                    this.reportPeriod = e.target.value;
                }
            });
            
            // Attach specific event handler for the demo button
            document.getElementById('demo-btn').addEventListener('click', () => {
                this.loadDemoData();
            });
            // Re-enable the demo button in the UI
            document.getElementById('demo-btn').disabled = false;
        });
    },

    // --- UTILITY FUNCTIONS ---
    // Cleans a string to be used as a numerical value (removes commas, currency, converts to float)
    cleanNumber: function(value) {
        if (typeof value === 'string') {
            return parseFloat(value.replace(/,/g, '').replace(/[^0-9.-]/g, '')) || 0;
        }
        return parseFloat(value) || 0;
    },

    // Robust file parsing logic using Papa Parse (handles messy headers)
    parseFile: function(file) {
        return new Promise((resolve, reject) => {
            if (typeof Papa === 'undefined') {
                return reject(new Error('Papa Parse library is not loaded. Cannot read files.'));
            }
            
            Papa.parse(file, {
                header: false, // Do not auto-detect headers
                dynamicTyping: false,
                skipEmptyLines: true,
                error: (err) => reject(new Error(`Parsing error in file ${file.name}: ${err.message}`)),
                complete: (results) => resolve(results)
            });
        });
    },

    // --- UI/NAVIGATION CONTROLS ---
    resetDashboardState: function() {
        this.uploadedFiles = { pos: [], zomato: [], swiggy: [] };
        this.generatedReport = null;
        this.hasGeneratedReport = false;
        this.resetUploadStates();
        this.disableReportTabs();
        this.hideHeaderPeriod();
        document.querySelector('input[name="period"][value="daily"]').checked = true;
        this.reportPeriod = 'daily';
    },

    resetUploadStates: function() {
        const sources = ['pos', 'zomato', 'swiggy'];
        sources.forEach(source => {
            document.getElementById(source + '-status').textContent = 'No files selected';
            document.querySelector(`[data-source="${source}"]`).className = 'upload-zone';
            document.getElementById(source + '-files').value = '';
        });
        this.updateGenerateButton();
        document.getElementById('report-error-log').textContent = '';
    },

    disableReportTabs: function() {
        const tabs = ['dashboard', 'executive', 'platform', 'financial', 'variance', 'daily'];
        tabs.forEach(tab => {
            const tabElement = document.querySelector(`[data-tab="${tab}"]`);
            tabElement.classList.add('disabled');
            tabElement.onclick = () => alert('Please upload files and generate a report first.');
        });
    },

    enableReportTabs: function() {
        const tabs = ['dashboard', 'executive', 'platform', 'financial', 'variance', 'daily'];
        tabs.forEach(tab => {
            const tabElement = document.querySelector(`[data-tab="${tab}"]`);
            tabElement.classList.remove('disabled');
            tabElement.onclick = () => this.showTab(tab);
        });
    },

    hideHeaderPeriod: function() {
        document.getElementById('header-period').style.display = 'none';
    },

    showHeaderPeriod: function(period) {
        document.getElementById('header-period').style.display = 'block';
        document.getElementById('period-display').textContent = period;
    },
    
    showTab: function(tabName) {
        if (!this.hasGeneratedReport && tabName !== 'home') {
            alert('Please upload files and generate a report first.');
            return;
        }

        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));

        document.getElementById(tabName + '-tab').classList.add('active');
        const navTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (navTab) navTab.classList.add('active');
    },

    initializeTabNavigation: function() {
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.showTab(tabName);
            });
        });
    },

    // --- FILE HANDLING ---
    triggerFileUpload: function(source) {
        document.getElementById(source + '-files').click();
    },

    initializeFileUpload: function() {
        const sources = ['pos', 'zomato', 'swiggy'];

        sources.forEach(source => {
            const uploadZone = document.querySelector(`[data-source="${source}"]`);
            const fileInput = document.getElementById(source + '-files');

            // --- FIX: Reliable Click Handler ---
            uploadZone.addEventListener('click', (e) => {
                e.stopPropagation(); 
                fileInput.click(); 
            });
            // ------------------------------------

            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleFileUpload(source, e.target.files);
                }
            });
            
            // Drag and drop handlers (included for completeness)
            uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('dragover'); });
            uploadZone.addEventListener('dragleave', (e) => { e.preventDefault(); uploadZone.classList.remove('dragover'); });
            uploadZone.addEventListener('drop', (e) => { 
                e.preventDefault(); 
                e.stopPropagation();
                uploadZone.classList.remove('dragover');
                this.handleFileUpload(source, e.dataTransfer.files);
            });
        });
    },

    handleFileUpload: function(source, files) {
        const statusElement = document.getElementById(source + '-status');
        const uploadZone = document.querySelector(`[data-source="${source}"]`);
        const fileList = Array.from(files);

        if (fileList.length === 0) return;

        statusElement.textContent = `File selected: ${fileList[0].name}`;
        uploadZone.classList.remove('processing');
        uploadZone.classList.add('has-files');
        this.uploadedFiles[source] = fileList;
        this.updateGenerateButton();
    },

    updateGenerateButton: function() {
        const generateBtn = document.getElementById('generate-btn');
        const hasRequiredFiles = this.uploadedFiles.pos.length > 0 && 
                                 this.uploadedFiles.zomato.length > 0 && 
                                 this.uploadedFiles.swiggy.length > 0;

        generateBtn.disabled = !hasRequiredFiles;
        generateBtn.textContent = hasRequiredFiles ? 'Generate Report' : 'Upload ALL Files to Generate';
    },

    clearAllFiles: function() {
        this.resetDashboardState();
    },
    
    // --- LOAD DEMO DATA (RE-ENABLED) ---
    loadDemoData: function() {
        // Simple mock to populate file list and allow dashboard navigation
        const mockFile = (name) => ({name: name, size: 1024 * 50, type: 'text/csv'});
        
        this.uploadedFiles.pos = [mockFile('POS_Orders_Master_Report.csv')];
        this.uploadedFiles.zomato = [mockFile('Zomato_Order_Level.csv')];
        this.uploadedFiles.swiggy = [mockFile('Swiggy_Settlement_Report.csv')];

        // Update UI for mock files
        this.handleFileUpload('pos', this.uploadedFiles.pos);
        this.handleFileUpload('zomato', this.uploadedFiles.zomato);
        this.handleFileUpload('swiggy', this.uploadedFiles.swiggy);
        
        // Disable the button temporarily and trigger a simulated report generation
        document.getElementById('generate-btn').disabled = true;
        document.getElementById('generate-btn').textContent = 'Generating with Demo Data...';
        
        // Since demo data cannot be parsed, we fall back to a structured mock report
        setTimeout(() => {
            this.generatedReport = this.createStructuredMockReport();
            this.hasGeneratedReport = true;
            this.enableReportTabs();
            this.showHeaderPeriod(this.generatedReport.period);
            this.populateAllReports(this.generatedReport);
            this.showTab('dashboard');
            document.getElementById('generate-btn').textContent = 'Report Generated (Demo)';
        }, 1500);
    },
    
    // --- REPORT GENERATION (CORE) ---
    generateReport: async function() {
        const generateBtn = document.getElementById('generate-btn');
        const errorLog = document.getElementById('report-error-log');
        errorLog.textContent = '';
        generateBtn.textContent = 'Reading Files...';
        generateBtn.disabled = true;

        try {
            // 1. Read Raw Data using robust parsing
            const posDataRaw = await this.parseFile(this.uploadedFiles.pos[0]);
            const zomatoDataRaw = await this.parseFile(this.uploadedFiles.zomato[0]);
            const swiggyDataRaw = await this.parseFile(this.uploadedFiles.swiggy[0]);

            // 2. Process Raw Data into clean arrays
            const posData = this.cleanParsedData(posDataRaw.data, 'pos');
            const zomatoData = this.cleanParsedData(zomatoDataRaw.data, 'zomato');
            const swiggyData = this.cleanParsedData(swiggyDataRaw.data, 'swiggy');
            
            if (!posData.length || !zomatoData.length || !swiggyData.length) {
                 throw new Error("One or more files contained no data after header cleaning. Check file content.");
            }

            // 3. Perform Reconciliation and Calculations
            this.generatedReport = this.runFullAnalysis(posData, zomatoData, swiggyData);
            this.hasGeneratedReport = true;

            // 4. Update UI
            this.enableReportTabs();
            this.showHeaderPeriod(this.generatedReport.period);
            this.populateAllReports(this.generatedReport);
            this.showTab('dashboard');

            generateBtn.textContent = 'Report Generated';
            generateBtn.disabled = false;
        } catch (error) {
            errorLog.textContent = `ERROR: ${error.message}. Please ensure the correct report file is uploaded.`;
            generateBtn.textContent = 'Failed to Generate Report';
            generateBtn.disabled = false;
            this.hasGeneratedReport = false;
            this.disableReportTabs();
            console.error(error);
        }
    },
    
    // --- MANUAL HEADER CLEANING AND DATA MAPPING ---
    cleanParsedData: function(rawData, source) {
        let skipRows = 0;
        
        // Define number of initial header rows to skip based on file type structure
        if (source === 'pos') {
            skipRows = 5; 
        } else if (source === 'zomato') {
            skipRows = 4; 
        } else if (source === 'swiggy') {
            skipRows = 3; 
        }

        if (rawData.length <= skipRows) return [];

        // 1. Get the actual header row
        const headers = rawData[skipRows].map(h => (h || '').trim());
        
        // 2. Get the data array (skipping all header/metadata rows)
        const dataArray = rawData.slice(skipRows + 1);

        // 3. Map the data array to objects using the correct headers
        return dataArray.map(rowArray => {
            let rowObject = {};
            headers.forEach((header, index) => {
                // Use the first part of the header for messy Zomato/Swiggy headers (e.g., 'Customer payable (Net bill...' -> 'Customer')
                const key = header.split(' ')[0] || `Col${index}`;
                rowObject[key] = rowArray[index];
            });
            return rowObject;
        }).filter(row => Object.values(row).some(val => val !== null && val !== '')); // Filter out entirely empty rows
    },

    // --- ANALYTICS AND CALCULATION LOGIC ---
    runFullAnalysis: function(posData, zomatoData, swiggyData) {
        const report = {
            period: this.generatePeriodString(),
            generated_at: new Date().toISOString(),
            raw: { pos: posData, zomato: zomatoData, swiggy: swiggyData }
        };

        const posTotal = this.calculatePOSTotals(posData);
        const zomatoTotals = this.calculateZomatoTotals(zomatoData);
        const swiggyTotals = this.calculateSwiggyTotals(swiggyData);

        report.summary = this.calculateReconciliationSummary(posTotal, zomatoTotals, swiggyTotals);
        report.platform_breakdown = this.calculatePlatformBreakdown(zomatoTotals, swiggyTotals);
        report.financial_analysis = this.calculateFinancialAnalysis(report.summary.platform_revenue, zomatoTotals, swiggyTotals);
        report.variance_analysis = this.calculateVarianceAnalysis(report.summary);
        report.performance_data = this.calculatePerformanceData(zomatoTotals, swiggyTotals);

        return report;
    },

    // --- MOCK REPORT FOR DEMO DATA FALLBACK ---
    createStructuredMockReport: function() {
        const data = { pos_rev: 45000, zom_rev: 15000, swi_rev: 12000, pos_orders: 200, zom_orders: 80, swi_orders: 50 };
        const report = {
            period: this.generatePeriodString(), generated_at: new Date().toISOString(),
            pos_data: { available: true, revenue: data.pos_rev, orders: data.pos_orders },
            zomato_data: { available: true, revenue: data.zom_rev, orders: data.zom_orders, commission: data.zom_rev * 0.20, ad_spend: 300 },
            swiggy_data: { available: true, revenue: data.swi_rev, orders: data.swi_orders, commission: data.swi_rev * 0.22, ad_spend: 250 }
        };

        const posTotal = { revenue: report.pos_data.revenue, orders: report.pos_data.orders };
        const zomatoTotals = { revenue: report.zomato_data.revenue, orders: report.zomato_data.orders, commission: report.zomato_data.commission, ad_spend: report.zomato_data.ad_spend };
        const swiggyTotals = { revenue: report.swiggy_data.revenue, orders: report.swiggy_data.orders, commission: report.swiggy_data.commission, ad_spend: report.swiggy_data.ad_spend };
        
        report.summary = this.calculateReconciliationSummary(posTotal, zomatoTotals, swiggyTotals);
        report.platform_breakdown = this.calculatePlatformBreakdown(zomatoTotals, swiggyTotals);
        report.financial_analysis = this.calculateFinancialAnalysis(report.summary.platform_revenue, zomatoTotals, swiggyTotals);
        report.variance_analysis = this.calculateVarianceAnalysis(report.summary);
        report.performance_data = this.calculatePerformanceData(zomatoTotals, swiggyTotals);

        return report;
    },
    // --- Individual calculation functions (omitted for brevity, assume full implementation is present) ---

    calculatePOSTotals: function(data) {
        const totalRevenue = data.reduce((sum, row) => sum + this.cleanNumber(row['Total']), 0); // Target: 'Total (₹)' -> 'Total'
        const totalOrders = data.filter(row => row['Invoice']).length; // Target: 'Invoice no' -> 'Invoice'
        return { revenue: totalRevenue, orders: totalOrders, data: data };
    },

    // ... (All other calculation functions are assumed to be present as defined in the previous complete version)
};

// Start the application
window.app.init();
