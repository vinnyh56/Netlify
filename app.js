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
    // Removed triggerFileUpload as it is now integrated into initializeFileUpload
    
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

    // --- REPORT GENERATION (CORE) ---
    generateReport: async function() {
        const generate
