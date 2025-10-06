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

    // --- UI/NAVIGATION CONTROLS (Omitted for brevity, assumed to be working) ---
    // ... (All UI/Navigation functions remain the same) ...
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

    updateGenerateButton: function() {
        const generateBtn = document.getElementById('generate-btn');
        const hasRequiredFiles = this.uploadedFiles.pos.length > 0 && 
                                 this.uploadedFiles.zomato.length > 0 && 
                                 this.uploadedFiles.swiggy.length > 0;

        generateBtn.disabled = !hasRequiredFiles;
        generateBtn.textContent = hasRequiredFiles ? 'Generate Report' : 'Upload ALL Files to Generate';
    },

    // Note: All other UI/navigation functions (showTab, initializeFileUpload, handleFileUpload, etc.)
    // are assumed to be copied from the previous final version and remain unchanged.

    // --- FILE HANDLING (Unchanged) ---
    triggerFileUpload: function(source) {
        document.getElementById(source + '-files').click();
    },

    initializeFileUpload: function() {
        const sources = ['pos', 'zomato', 'swiggy'];

        sources.forEach(source => {
            const uploadZone = document.querySelector(`[data-source="${source}"]`);
            const fileInput = document.getElementById(source + '-files');

            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleFileUpload(source, e.target.files);
                }
            });
            // Drag and drop handlers omitted for brevity
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

    clearAllFiles: function() {
        this.resetDashboardState();
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
