export type RebalanceFrequency = 'none' | 'quarterly' | 'annually';

export interface PortfolioConfig {
    id: string;                          // Unique ID (timestamp-based)
    name: string;                        // User-provided name
    selectedAssets: string[];            // Array of tickers
    weights: { [ticker: string]: number }; // Asset weights
    initialInvestment: number;           // Initial capital
    createdAt: string;                   // ISO timestamp
    lastModified: string;                // ISO timestamp
    startDate?: string;                  // Optional start date (YYYY-MM-DD)
    endDate?: string;                    // Optional end date (YYYY-MM-DD)
    rebalanceFrequency?: RebalanceFrequency; // Rebalancing strategy
}

export interface SavedPortfolios {
    configurations: PortfolioConfig[];
}

export interface MonthlyPerformance {
    month: string;              // YYYY-MM format
    return: number;             // Monthly return as decimal
    startValue: number;
    endValue: number;
}

export interface MonthlyStats {
    averageReturn: number;
    upMonths: number;
    downMonths: number;
    bestMonth: MonthlyPerformance;
    worstMonth: MonthlyPerformance;
    monthlyData: MonthlyPerformance[];
}

export interface AssetValidation {
    valid: boolean;
    invalidAssets: string[];
    validAssets: string[];
    earliestValidDate: string;  // Earliest date when all selected assets are available
}
