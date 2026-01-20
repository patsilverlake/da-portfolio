import type { Metrics, DailyData } from './finance';
import type { MonthlyPerformance } from './types';

interface ExportData {
    portfolioName?: string;
    startDate: string;
    endDate: string;
    initialInvestment: number;
    selectedAssets: string[];
    weights: { [ticker: string]: number };
    metrics: Metrics;
    marketData: DailyData[];
    rebalanceFrequency: string;
}

/**
 * Escape a value for CSV - wrap in quotes if it contains commas, quotes, or newlines
 */
function escapeCSV(value: string | number): string {
    const str = String(value);
    // If the value contains comma, double quote, or newline, wrap in quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        // Escape any existing double quotes by doubling them
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

/**
 * Format a number for CSV (no commas in the number itself)
 */
function formatNumber(value: number, decimals: number = 2): string {
    return value.toFixed(decimals);
}

/**
 * Format currency for CSV (no commas, just the number with $ prefix)
 */
function formatCurrency(value: number, decimals: number = 2): string {
    return `$${formatNumber(value, decimals)}`;
}

/**
 * Generate CSV content with multiple sections separated by headers
 */
export function generateCSV(data: ExportData): string {
    const lines: string[] = [];
    const {
        portfolioName,
        startDate,
        endDate,
        initialInvestment,
        selectedAssets,
        weights,
        metrics,
        marketData,
        rebalanceFrequency
    } = data;

    // ============================================
    // TAB 1: PORTFOLIO CONFIGURATION
    // ============================================
    lines.push('=== PORTFOLIO CONFIGURATION ===');
    lines.push('');
    lines.push(`Portfolio Name,${escapeCSV(portfolioName || 'Custom Portfolio')}`);
    lines.push(`Start Date,${startDate}`);
    lines.push(`End Date,${endDate}`);
    lines.push(`Initial Investment,${formatCurrency(initialInvestment, 0)}`);
    lines.push(`Rebalancing Strategy,${rebalanceFrequency}`);
    lines.push('');
    lines.push('Asset Allocation:');
    lines.push('Asset,Weight (%)');
    selectedAssets.forEach(asset => {
        const symbol = asset.replace('-USD', '');
        lines.push(`${symbol},${weights[asset] || 0}%`);
    });
    lines.push('');
    lines.push('');

    // ============================================
    // TAB 2: SUMMARY DASHBOARD METRICS
    // ============================================
    lines.push('=== SUMMARY DASHBOARD METRICS ===');
    lines.push('');
    lines.push('Metric,Value');
    lines.push(`Final Balance,${formatCurrency(metrics.finalBalance)}`);
    lines.push(`Total Return,${formatNumber(metrics.totalReturn * 100)}%`);
    lines.push(`Annualized Return (CAGR),${formatNumber(metrics.cagr * 100)}%`);
    lines.push(`Sharpe Ratio (3% RFR),${formatNumber(metrics.sharpeRatio)}`);
    lines.push(`Volatility (Annualized),${formatNumber(metrics.volatility * 100)}%`);
    lines.push(`S&P 500 Correlation,${metrics.sp500Correlation !== undefined ? formatNumber(metrics.sp500Correlation) : 'N/A'}`);
    lines.push(`Max Drawdown,${formatNumber(metrics.maxDrawdown * 100)}%`);
    lines.push(`Best Day,${formatNumber(metrics.bestDay * 100)}%`);
    lines.push(`Worst Day,${formatNumber(metrics.worstDay * 100)}%`);
    lines.push('');
    lines.push('');

    // ============================================
    // TAB 3: MONTHLY PERFORMANCE BREAKDOWN
    // ============================================
    lines.push('=== MONTHLY PERFORMANCE BREAKDOWN ===');
    lines.push('');

    if (metrics.monthlyStats) {
        lines.push('Monthly Summary:');
        lines.push(`Average Monthly Return,${formatNumber(metrics.monthlyStats.averageReturn * 100)}%`);
        lines.push(`Up Months,${metrics.monthlyStats.upMonths}`);
        lines.push(`Down Months,${metrics.monthlyStats.downMonths}`);
        lines.push(`Best Month,${escapeCSV(`${metrics.monthlyStats.bestMonth.month} (${formatNumber(metrics.monthlyStats.bestMonth.return * 100)}%)`)}`);
        lines.push(`Worst Month,${escapeCSV(`${metrics.monthlyStats.worstMonth.month} (${formatNumber(metrics.monthlyStats.worstMonth.return * 100)}%)`)}`);
        lines.push('');
        lines.push('Monthly Details:');
        lines.push('Month,Return (%),Start Value,End Value');

        metrics.monthlyStats.monthlyData.forEach((month: MonthlyPerformance) => {
            lines.push(`${month.month},${formatNumber(month.return * 100)}%,${formatCurrency(month.startValue)},${formatCurrency(month.endValue)}`);
        });
    } else {
        lines.push('No monthly data available');
    }
    lines.push('');
    lines.push('');

    // ============================================
    // TAB 4: DAILY CLOSING PRICES
    // ============================================
    lines.push('=== DAILY CLOSING PRICES ===');
    lines.push('');

    // Header row with all assets
    const priceHeaders = ['Date', ...selectedAssets.map(a => a.replace('-USD', '')), '^GSPC (S&P 500)'];
    lines.push(priceHeaders.join(','));

    // Data rows
    marketData.forEach(day => {
        const row = [
            day.date,
            ...selectedAssets.map(asset => {
                const price = day[asset] as number;
                return price ? price.toFixed(2) : '0';
            }),
            (day['^GSPC'] as number)?.toFixed(2) || ''
        ];
        lines.push(row.join(','));
    });

    return lines.join('\n');
}

/**
 * Download a string as a file
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Export portfolio data as CSV
 */
export function exportToCSV(data: ExportData): void {
    const csv = generateCSV(data);
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `portfolio-snapshot-${timestamp}.csv`;
    downloadFile(csv, filename, 'text/csv;charset=utf-8;');
}

/**
 * Export dashboard as PDF using the browser's native print functionality.
 * This approach fully supports modern CSS (oklch, lab, etc.) since the browser handles rendering.
 */
export async function exportToPDF(
    elementId: string,
    _filename?: string
): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element with id "${elementId}" not found`);
        return;
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
        console.error('Could not open print window. Please allow popups for this site.');
        alert('Could not open print window. Please allow popups for this site.');
        return;
    }

    // Get all stylesheets from the current document
    const styleSheets = Array.from(document.styleSheets);
    let cssText = '';

    styleSheets.forEach(sheet => {
        try {
            if (sheet.cssRules) {
                Array.from(sheet.cssRules).forEach(rule => {
                    cssText += rule.cssText + '\n';
                });
            }
        } catch {
            // Skip cross-origin stylesheets
            if (sheet.href) {
                cssText += `@import url("${sheet.href}");\n`;
            }
        }
    });

    // Clone the element
    const clonedContent = element.cloneNode(true) as HTMLElement;

    // Write the print document
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Portfolio Snapshot</title>
            <style>
                ${cssText}

                /* Print-specific styles */
                @media print {
                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }

                    @page {
                        size: landscape;
                        margin: 10mm;
                    }
                }

                /* General styles for the print window */
                body {
                    margin: 0;
                    padding: 20px;
                    background: white;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }

                /* Ensure content fits on page */
                #print-content {
                    max-width: 100%;
                }
            </style>
        </head>
        <body>
            <div id="print-content">
                ${clonedContent.outerHTML}
            </div>
            <script>
                // Auto-trigger print dialog once loaded
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                    }, 500);
                };
            </script>
        </body>
        </html>
    `);

    printWindow.document.close();
}
