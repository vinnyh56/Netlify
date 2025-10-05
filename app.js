// Global App Object
window.app = {
    // State variables
    uploadedFiles: { pos: [], zomato: [], swiggy: [] },
    generatedReport: null,
    reportPeriod: 'daily',
    hasGeneratedReport: false,
    
    // Constants (Used in simulation logic)
    CONSTANTS: {
        VARIANCE_THRESHOLD: 5, // %
        ZOMATO_COMMISSION_RATE: 0.20,
        SWIGGY_COMMISSION_RATE: 0.22,
        MOCK_REVENUE_BASE: 50000,
        MOCK_ORDERS_BASE: 50
    },

    // --- INITIALIZATION ---
    init: function() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeFileUpload();
            this.initializeTabNavigation();
            this.resetDashboardState();
            this.showTab('home');

            // Set initial period state
            this.reportPeriod = document.querySelector('input[name="period"]:checked').value;
            document.getElementById('report-settings-form').addEventListener('change', (e) => {
                if (e.target.name === 'period') {
                    this.reportPeriod = e.target.value;
                }
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
            document.querySelector(`[data-source="${source}"]`).className = 'upload-zone'; // Reset class
            document.getElementById(source + '-files').value = ''; // Clear file input
        });
        this.updateGenerateButton();
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

            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleFileUpload(source, e.target.files);
                }
            });

            // Drag and drop handlers
            uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('dragover'); });
            uploadZone.addEventListener('dragleave', (e) => { e.preventDefault(); uploadZone.classList.remove('dragover'); });
            uploadZone.addEventListener('drop', (e) => { 
                e.preventDefault(); 
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

        statusElement.textContent = `Processing ${fileList.length} file(s)...`;
        uploadZone.classList.remove('has-files');
        uploadZone.classList.add('processing');

        // Simulate file parsing delay
        setTimeout(() => {
            this.uploadedFiles[source] = fileList;

            const fileNames = fileList.map(f => f.name).join(', ');
            let displayText = `✅ ${fileList.length} file(s): `;
            displayText += fileNames.length > 40 ? fileNames.substring(0, 40) + '...' : fileNames;

            statusElement.textContent = displayText;
            statusElement.className = 'upload-status success';
            uploadZone.classList.remove('processing');
            uploadZone.classList.add('has-files');

            this.updateGenerateButton();
        }, 1000);
    },

    updateGenerateButton: function() {
        const generateBtn = document.getElementById('generate-btn');
        const hasFiles = this.uploadedFiles.pos.length > 0 || 
                         this.uploadedFiles.zomato.length > 0 || 
                         this.uploadedFiles.swiggy.length > 0;

        generateBtn.disabled = !hasFiles;
        generateBtn.textContent = hasFiles ? 'Generate Report' : 'Upload Files First';
    },

    clearAllFiles: function() {
        this.resetDashboardState();
        document.querySelector('.action-bar').scrollIntoView({ behavior: 'smooth' });
    },

    loadDemoData: function() {
        this.uploadedFiles.pos = [{name: 'pos_orders_master.xlsx', size: 15420}];
        this.uploadedFiles.zomato = [{name: 'zomato_settlement_report.csv', size: 8730}];
        this.uploadedFiles.swiggy = [{name: 'swiggy_business_metrics.xlsx', size: 12650}];

        // Update UI for demo data
        this.handleFileUpload('pos', this.uploadedFiles.pos);
        this.handleFileUpload('zomato', this.uploadedFiles.zomato);
        this.handleFileUpload('swiggy', this.uploadedFiles.swiggy);
    },
    
    // --- REPORT GENERATION ---
    generateReport: function() {
        if (!this.uploadedFiles.pos.length && !this.uploadedFiles.zomato.length && !this.uploadedFiles.swiggy.length) {
            alert('Please upload at least one file from any source.');
            return;
        }

        const generateBtn = document.getElementById('generate-btn');
        generateBtn.textContent = 'Analyzing Data...';
        generateBtn.disabled = true;

        setTimeout(() => {
            this.generatedReport = this.createMockReport();
            this.hasGeneratedReport = true;

            this.enableReportTabs();
            this.showHeaderPeriod(this.generatedReport.period);
            this.populateAllReports(this.generatedReport);
            this.showTab('dashboard');

            generateBtn.textContent = 'Report Generated';
            generateBtn.disabled = false;
        }, 2000);
    },

    createMockReport: function() {
        // --- Structured Mock Data Generation ---
        const MOCK_DATA = {
            daily: { pos_rev: 45000, zom_rev: 15000, swi_rev: 12000, pos_orders: 200, zom_orders: 80, swi_orders: 50 },
            weekly: { pos_rev: 300000, zom_rev: 100000, swi_rev: 80000, pos_orders: 1400, zom_orders: 560, swi_orders: 350 },
            monthly: { pos_rev: 1200000, zom_rev: 400000, swi_rev: 320000, pos_orders: 5600, zom_orders: 2240, swi_orders: 1400 }
        };

        const data = MOCK_DATA[this.reportPeriod] || MOCK_DATA.daily;

        const report = {
            period: this.generatePeriodString(),
            generated_at: new Date().toISOString(),
            pos_data: { available: this.uploadedFiles.pos.length > 0, revenue: data.pos_rev, orders: data.pos_orders },
            zomato_data: { available: this.uploadedFiles.zomato.length > 0, revenue: data.zom_rev, orders: data.zom_orders },
            swiggy_data: { available: this.uploadedFiles.swiggy.length > 0, revenue: data.swi_rev, orders: data.swi_orders }
        };

        // Run calculations
        report.summary = this.calculateReconciliationSummary(report);
        report.platform_breakdown = this.calculatePlatformBreakdown(report);
        report.financial_analysis = this.calculateFinancialAnalysis(report);
        report.variance_analysis = this.calculateVarianceAnalysis(report);
        report.performance_data = this.calculatePerformanceData(report);

        return report;
    },

    generatePeriodString: function() {
        const now = new Date();
        const options = { year: 'numeric', month: 'short', day: 'numeric' };

        if (this.reportPeriod === 'daily') {
            return now.toLocaleDateString('en-US', options);
        } else if (this.reportPeriod === 'weekly') {
            const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
            const weekEnd = new Date(now.setDate(weekStart.getDate() + 6));
            return `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
        } else if (this.reportPeriod === 'monthly') {
            return now.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        }
        return 'Custom Period';
    },

    // --- CALCULATION LOGIC ---
    calculateReconciliationSummary: function(report) {
        const posOrders = report.pos_data.available ? report.pos_data.orders : 0;
        const posRevenue = report.pos_data.available ? report.pos_data.revenue : 0;
        const zomatoOrders = report.zomato_data.available ? report.zomato_data.orders : 0;
        const zomatoRevenue = report.zomato_data.available ? report.zomato_data.revenue : 0;
        const swiggyOrders = report.swiggy_data.available ? report.swiggy_data.orders : 0;
        const swiggyRevenue = report.swiggy_data.available ? report.swiggy_data.revenue : 0;

        const platformOrders = zomatoOrders + swiggyOrders;
        const platformRevenue = zomatoRevenue + swiggyRevenue;

        // Simulate a 5% loss in orders and 8% loss in revenue for variance
        const assumedPlatformOrders = Math.floor(posOrders * 0.95);
        const assumedPlatformRevenue = Math.floor(posRevenue * 0.92);

        const orderVariance = posOrders - platformOrders;
        const revenueVariance = assumedPlatformRevenue - platformRevenue; // Use assumed for a realistic variance
        
        const orderCoverage = posOrders > 0 ? (platformOrders / posOrders) * 100 : 0;
        const revenueCoverage = posRevenue > 0 ? (platformRevenue / assumedPlatformRevenue) * 100 : 0;
        const variancePercentage = assumedPlatformRevenue > 0 ? Math.abs(revenueVariance / assumedPlatformRevenue) * 100 : 0;

        return {
            pos_orders: posOrders, pos_revenue: posRevenue,
            platform_orders: platformOrders, platform_revenue: platformRevenue,
            order_variance: orderVariance, revenue_variance: revenueVariance,
            order_coverage: orderCoverage, revenue_coverage: revenueCoverage,
            variance_percentage: variancePercentage,
            status: variancePercentage <= this.CONSTANTS.VARIANCE_THRESHOLD ? 'PASS' : 'FAIL'
        };
    },

    calculatePlatformBreakdown: function(report) {
        const zomatoOrders = report.zomato_data.available ? report.zomato_data.orders : 0;
        const zomatoRevenue = report.zomato_data.available ? report.zomato_data.revenue : 0;
        const swiggyOrders = report.swiggy_data.available ? report.swiggy_data.orders : 0;
        const swiggyRevenue = report.swiggy_data.available ? report.swiggy_data.revenue : 0;

        const totalOrders = zomatoOrders + swiggyOrders;
        const totalRevenue = zomatoRevenue + swiggyRevenue;

        const platforms = [
            {
                platform: 'Zomato', orders: zomatoOrders, revenue: zomatoRevenue, 
                market_share: totalOrders > 0 ? (zomatoOrders / totalOrders) * 100 : 0,
                aov: zomatoOrders > 0 ? zomatoRevenue / zomatoOrders : 0, available: report.zomato_data.available
            },
            {
                platform: 'Swiggy', orders: swiggyOrders, revenue: swiggyRevenue, 
                market_share: totalOrders > 0 ? (swiggyOrders / totalOrders) * 100 : 0,
                aov: swiggyOrders > 0 ? swiggyRevenue / swiggyOrders : 0, available: report.swiggy_data.available
            }
        ];
        return platforms.filter(p => p.available);
    },

    calculateFinancialAnalysis: function(report) {
        const platformRevenue = report.summary.platform_revenue;
        const zomatoCommission = report.zomato_data.available ? report.zomato_data.revenue * this.CONSTANTS.ZOMATO_COMMISSION_RATE : 0;
        const swiggyCommission = report.swiggy_data.available ? report.swiggy_data.revenue * this.CONSTANTS.SWIGGY_COMMISSION_RATE : 0;
        const totalCommission = zomatoCommission + swiggyCommission;
        
        // Mocking other costs
        const adsSpend = platformRevenue * 0.03; // Estimated 3%
        const discounts = platformRevenue * 0.12; // Estimated 12%
        const netPayout = platformRevenue - totalCommission - adsSpend - discounts;

        return [
            { component: 'Gross Platform Revenue', amount: platformRevenue, percentage: 100.0, impact: 'baseline' },
            { component: `Estimated Commission (Avg ${((this.CONSTANTS.ZOMATO_COMMISSION_RATE + this.CONSTANTS.SWIGGY_COMMISSION_RATE) / 2 * 100).toFixed(0)}%)`, amount: totalCommission, percentage: platformRevenue > 0 ? (totalCommission / platformRevenue) * 100 : 0, impact: 'negative' },
            { component: 'Advertising Spend', amount: adsSpend, percentage: platformRevenue > 0 ? (adsSpend / platformRevenue) * 100 : 0, impact: 'negative' },
            { component: 'Platform Discounts', amount: discounts, percentage: platformRevenue > 0 ? (discounts / platformRevenue) * 100 : 0, impact: 'negative' },
            { component: 'Estimated Net Payout', amount: netPayout, percentage: platformRevenue > 0 ? (netPayout / platformRevenue) * 100 : 0, impact: 'positive' }
        ];
    },

    calculateVarianceAnalysis: function(report) {
        const totalVariance = Math.abs(report.summary.revenue_variance);

        if (totalVariance === 0) {
            return [{ component: 'Perfect Match', amount: 0, percentage: 100.0, status: '✅ No Variance', explanation: 'Revenue perfectly matched across all platforms' }];
        }

        // Break down the variance into common causes
        const rejectedOrders = totalVariance * 0.5; // 50%
        const timingDiff = totalVariance * 0.3; // 30%
        const missingDiscount = totalVariance * 0.2; // 20%

        return [
            { component: 'Platform Rejections', amount: rejectedOrders, percentage: (rejectedOrders / totalVariance) * 100, status: '🔴 Operational Issue', explanation: 'Orders processed in POS but rejected/cancelled by platforms' },
            { component: 'Timing Differences', amount: timingDiff, percentage: (timingDiff / totalVariance) * 100, status: '🟡 Timing Difference', explanation: 'Revenue recognition timing differences between POS and settlement report' },
            { component: 'Missing Discount Codes', amount: missingDiscount, percentage: (missingDiscount / totalVariance) * 100, status: '❌ Financial Discrepancy', explanation: 'Discount codes applied on POS but missing from platform payout report' }
        ];
    },
    
    calculatePerformanceData: function(report) {
        const days = this.reportPeriod === 'daily' ? 1 : this.reportPeriod === 'weekly' ? 7 : 30;
        const performanceData = [];

        const totalZomatoOrders = report.zomato_data.available ? report.zomato_data.orders : 0;
        const totalSwiggyOrders = report.swiggy_data.available ? report.swiggy_data.orders : 0;
        const totalZomatoRevenue = report.zomato_data.available ? report.zomato_data.revenue : 0;
        const totalSwiggyRevenue = report.swiggy_data.available ? report.swiggy_data.revenue : 0;

        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (days - 1 - i));
            
            // Generate data with slight randomness around the average
            const dailyZomatoOrders = Math.floor(totalZomatoOrders / days) + (Math.random() * 5);
            const dailySwiggyOrders = Math.floor(totalSwiggyOrders / days) + (Math.random() * 3);
            const dailyZomatoRevenue = totalZomatoRevenue / days * (0.9 + Math.random() * 0.2); // +/- 10%
            const dailySwiggyRevenue = totalSwiggyRevenue / days * (0.9 + Math.random() * 0.2); 

            const dailyTotal = Math.max(0, dailyZomatoRevenue + dailySwiggyRevenue);
            const estimatedPayout = dailyTotal * 0.60; // Estimated 60% Net

            performanceData.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                zomato_orders: Math.max(0, Math.floor(dailyZomatoOrders)),
                swiggy_orders: Math.max(0, Math.floor(dailySwiggyOrders)),
                total_orders: Math.max(0, Math.floor(dailyZomatoOrders + dailySwiggyOrders)),
                zomato_revenue: Math.max(0, dailyZomatoRevenue),
                swiggy_revenue: Math.max(0, dailySwiggyRevenue),
                total_revenue: dailyTotal,
                estimated_payout: estimatedPayout
            });
        }
        return performanceData;
    },
    
    // --- POPULATION LOGIC ---
    populateAllReports: function(report) {
        this.populateDashboardOverview(report);
        this.populateExecutiveSummary(report);
        this.populatePlatformBreakdown(report);
        this.populateFinancialAnalysis(report);
        this.populateVarianceAnalysis(report);
        this.populatePerformanceReport(report);
    },

    populateDashboardOverview: function(report) {
        const content = document.getElementById('dashboard-content');
        const summary = report.summary;
        const payoutEstimate = report.financial_analysis.find(item => item.component.includes('Net Payout')).amount;

        content.innerHTML = `
            <div class="metrics-grid">
                <div class="metric-card">
                    <h3>Revenue Variance</h3>
                    <div class="metric-value">${summary.variance_percentage.toFixed(1)}%</div>
                    <div class="metric-status ${summary.status === 'PASS' ? 'success' : 'warning'}">
                        ${summary.status === 'PASS' ? '✅ Within Threshold' : '⚠️ Action Required'}
                    </div>
                </div>
                <div class="metric-card">
                    <h3>Order Coverage</h3>
                    <div class="metric-value">${summary.order_coverage.toFixed(1)}%</div>
                    <div class="metric-status ${summary.order_coverage >= 95 ? 'success' : 'warning'}">
                        ${summary.order_coverage >= 95 ? '✅ Excellent' : '⚠️ Review Missing Orders'}
                    </div>
                </div>
                <div class="metric-card">
                    <h3>Estimated Payout</h3>
                    <div class="metric-value">₹${Math.floor(payoutEstimate).toLocaleString('en-IN')}</div>
                    <div class="metric-status info">📊 ${report.period} Net Revenue</div>
                </div>
                <div class="metric-card">
                    <h3>Combined Orders</h3>
                    <div class="metric-value">${summary.platform_orders.toLocaleString()}</div>
                    <div class="metric-status info">📦 Total Deliveries</div>
                </div>
            </div>
        `;
    },

    populateExecutiveSummary: function(report) {
        const content = document.getElementById('executive-content');
        const summary = report.summary;
        const finalPayout = report.financial_analysis.find(item => item.component.includes('Net Payout')).amount;

        content.innerHTML = `
            <div class="report-table">
                <table>
                    <thead>
                        <tr><th>Metric</th><th>Value</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>Reporting Period</td><td>${report.period}</td><td>N/A</td></tr>
                        <tr><td>POS Revenue (Benchmark)</td><td>₹${(summary.pos_revenue || 0).toLocaleString('en-IN')}</td><td>Base</td></tr>
                        <tr><td>Platform Revenue Combined</td><td>₹${summary.platform_revenue.toLocaleString('en-IN')}</td><td>Actual</td></tr>
                        <tr><td>Revenue Variance</td><td>₹${Math.abs(summary.revenue_variance).toLocaleString('en-IN')} (${summary.variance_percentage.toFixed(1)}%)</td>
                            <td class="${summary.status === 'PASS' ? 'success' : 'error'}">${summary.status === 'PASS' ? 'PASS' : 'FAIL'}</td></tr>
                        <tr><td>Estimated Net Payout</td><td>₹${Math.floor(finalPayout).toLocaleString('en-IN')}</td><td class="positive">Key Result</td></tr>
                    </tbody>
                </table>
            </div>
        `;
    },

    populatePlatformBreakdown: function(report) {
        const content = document.getElementById('platform-content');
        const platforms = report.platform_breakdown;
        
        let tableRows = platforms.map(platform => `
            <tr>
                <td>${platform.platform}</td>
                <td>${platform.orders}</td>
                <td>₹${platform.revenue.toLocaleString('en-IN')}</td>
                <td>${platform.market_share.toFixed(1)}%</td>
                <td>₹${platform.aov.toFixed(2)}</td>
            </tr>
        `).join('');

        const totalOrders = platforms.reduce((sum, p) => sum + p.orders, 0);
        const totalRevenue = platforms.reduce((sum, p) => sum + p.revenue, 0);

        content.innerHTML = `
            <div class="report-table">
                <table>
                    <thead>
                        <tr><th>Platform</th><th>Orders</th><th>Revenue</th><th>Market Share</th><th>AOV</th></tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                        <tr class="total-row">
                            <td><strong>Combined Total</strong></td>
                            <td><strong>${totalOrders}</strong></td>
                            <td><strong>₹${totalRevenue.toLocaleString('en-IN')}</strong></td>
                            <td><strong>100.0%</strong></td>
                            <td><strong>₹${totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : '0.00'}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    },

    populateFinancialAnalysis: function(report) {
        const content = document.getElementById('financial-content');
        const financial = report.financial_analysis;

        const tableRows = financial.map(item => `
            <tr class="${item.impact}">
                <td>${item.component}</td>
                <td>₹${Math.floor(item.amount).toLocaleString('en-IN')}</td>
                <td>${item.percentage.toFixed(1)}%</td>
                <td>${item.impact === 'positive' ? 'Revenue' : item.impact === 'negative' ? 'Cost' : 'Base'}</td>
            </tr>
        `).join('');

        content.innerHTML = `
            <div class="report-table">
                <table>
                    <thead>
                        <tr><th>Component</th><th>Amount</th><th>Percentage</th><th>Type</th></tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
            </div>
        `;
    },

    populateVarianceAnalysis: function(report) {
        const content = document.getElementById('variance-content');
        const variance = report.variance_analysis;

        const tableRows = variance.map(item => `
            <tr>
                <td>${item.component}</td>
                <td>₹${Math.floor(item.amount).toLocaleString('en-IN')}</td>
                <td>${item.percentage.toFixed(1)}%</td>
                <td>${item.status}</td>
                <td>${item.explanation}</td>
            </tr>
        `).join('');

        content.innerHTML = `
            <div class="report-table">
                <table>
                    <thead>
                        <tr><th>Variance Component</th><th>Amount</th><th>Percentage</th><th>Status</th><th>Explanation</th></tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
            </div>
        `;
    },

    populatePerformanceReport: function(report) {
        const content = document.getElementById('performance-content');
        const performance = report.performance_data;

        const tableRows = performance.map(day => `
            <tr>
                <td>${day.date}</td>
                <td>${day.zomato_orders}</td>
                <td>${day.swiggy_orders}</td>
                <td>${day.total_orders}</td>
                <td>₹${Math.floor(day.zomato_revenue).toLocaleString('en-IN')}</td>
                <td>₹${Math.floor(day.swiggy_revenue).toLocaleString('en-IN')}</td>
                <td>₹${Math.floor(day.total_revenue).toLocaleString('en-IN')}</td>
                <td>₹${Math.floor(day.estimated_payout).toLocaleString('en-IN')}</td>
            </tr>
        `).join('');

        const totals = performance.reduce((acc, day) => ({
            zomato_orders: acc.zomato_orders + day.zomato_orders, swiggy_orders: acc.swiggy_orders + day.swiggy_orders, total_orders: acc.total_orders + day.total_orders,
            zomato_revenue: acc.zomato_revenue + day.zomato_revenue, swiggy_revenue: acc.swiggy_revenue + day.swiggy_revenue, total_revenue: acc.total_revenue + day.total_revenue, estimated_payout: acc.estimated_payout + day.estimated_payout
        }), { zomato_orders: 0, swiggy_orders: 0, total_orders: 0, zomato_revenue: 0, swiggy_revenue: 0, total_revenue: 0, estimated_payout: 0 });

        content.innerHTML = `
            <div class="report-table">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Zomato Orders</th>
                            <th>Swiggy Orders</th>
                            <th>Total Orders</th>
                            <th>Zomato Revenue</th>
                            <th>Swiggy Revenue</th>
                            <th>Total Revenue</th>
                            <th>Estimated Payout</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                        <tr class="total-row">
                            <td><strong>Total</strong></td>
                            <td><strong>${Math.floor(totals.zomato_orders).toLocaleString()}</strong></td>
                            <td><strong>${Math.floor(totals.swiggy_orders).toLocaleString()}</strong></td>
                            <td><strong>${Math.floor(totals.total_orders).toLocaleString()}</strong></td>
                            <td><strong>₹${Math.floor(totals.zomato_revenue).toLocaleString('en-IN')}</strong></td>
                            <td><strong>₹${Math.floor(totals.swiggy_revenue).toLocaleString('en-IN')}</strong></td>
                            <td><strong>₹${Math.floor(totals.total_revenue).toLocaleString('en-IN')}</strong></td>
                            <td><strong>₹${Math.floor(totals.estimated_payout).toLocaleString('en-IN')}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    },
};

// Start the application
window.app.init();
