import type { MonthlyStats, MonthlyPerformance, AssetValidation, RebalanceFrequency } from './types';

export interface DailyData {
    date: string;
    [ticker: string]: number | string; // Dynamic ticker access
}

export interface Metrics {
    initialInvestment: number;
    finalBalance: number;
    totalReturn: number;
    cagr: number;
    volatility: number;
    sharpeRatio: number;
    bestDay: number;
    worstDay: number;
    maxDrawdown: number;
    monthlyStats?: MonthlyStats;
    sp500Correlation?: number;
}

export const ANNUAL_RISK_FREE_RATE = 0.03; // 3% Risk-Free Rate

export function validateAssetsForDateRange(
    historicalData: DailyData[],
    weights: { [ticker: string]: number }
): AssetValidation {
    if (!historicalData || historicalData.length === 0) {
        return {
            valid: false,
            invalidAssets: Object.keys(weights),
            validAssets: [],
            earliestValidDate: ''
        };
    }

    const firstDay = historicalData[0];
    const invalidAssets: string[] = [];
    const validAssets: string[] = [];

    Object.keys(weights).forEach(ticker => {
        const price = firstDay[ticker] as number;
        if (!price || price <= 0) {
            invalidAssets.push(ticker);
        } else {
            validAssets.push(ticker);
        }
    });

    // Find earliest date when all selected assets are available
    let earliestValidDate = '';
    for (const day of historicalData) {
        const allValid = Object.keys(weights).every(ticker => {
            const price = day[ticker] as number;
            return price && price > 0;
        });
        if (allValid) {
            earliestValidDate = day.date;
            break;
        }
    }

    return {
        valid: invalidAssets.length === 0,
        invalidAssets,
        validAssets,
        earliestValidDate
    };
}

export function calculateMetrics(
    portfolioValues: { date: string; value: number }[],
    initialInvestment: number,
    sp500Data?: { date: string; value: number }[]
): Metrics {
    if (portfolioValues.length < 2) {
        return {
            initialInvestment,
            finalBalance: initialInvestment,
            totalReturn: 0,
            cagr: 0,
            volatility: 0,
            sharpeRatio: 0,
            bestDay: 0,
            worstDay: 0,
            maxDrawdown: 0,
        };
    }

    const finalBalance = portfolioValues[portfolioValues.length - 1].value;
    const totalReturn = (finalBalance - initialInvestment) / initialInvestment;

    // Time period in years
    const startDate = new Date(portfolioValues[0].date);
    const endDate = new Date(portfolioValues[portfolioValues.length - 1].date);
    const years = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24 * 365);

    // CAGR
    const cagr = years > 0 ? Math.pow(finalBalance / initialInvestment, 1 / years) - 1 : 0;

    // Daily Returns
    const dailyReturns: number[] = [];
    for (let i = 1; i < portfolioValues.length; i++) {
        const r = (portfolioValues[i].value / portfolioValues[i - 1].value) - 1;
        dailyReturns.push(r);
    }

    // Volatility (Annualized Standard Deviation)
    // Crypto trades 365 days a year
    const meanReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / dailyReturns.length;
    const stdDev = Math.sqrt(variance);
    const volatility = stdDev * Math.sqrt(365);

    // Sharpe Ratio
    // Sharpe = (Rp - Rf) / Sigma_p
    // We use CAGR as Rp (Annualized Return)
    const sharpeRatio = volatility !== 0 ? (cagr - ANNUAL_RISK_FREE_RATE) / volatility : 0;

    // Best/Worst Days
    const bestDay = Math.max(...dailyReturns);
    const worstDay = Math.min(...dailyReturns);

    // Calculate Max Drawdown
    let maxDrawdown = 0;
    let peak = portfolioValues[0].value;

    for (let i = 1; i < portfolioValues.length; i++) {
        const currentValue = portfolioValues[i].value;
        if (currentValue > peak) {
            peak = currentValue;
        } else {
            const drawdown = (peak - currentValue) / peak;
            maxDrawdown = Math.max(maxDrawdown, drawdown);
        }
    }

    // Calculate S&P 500 correlation if data is provided
    let sp500Correlation: number | undefined;
    if (sp500Data && sp500Data.length > 1 && portfolioValues.length > 1) {
        // Build a map of S&P 500 values by date for alignment
        const sp500ByDate: Record<string, number> = {};
        const sp500Dates: string[] = []; // Sorted list of dates with S&P 500 data
        sp500Data.forEach(d => {
            if (d.value && d.value > 0) {
                sp500ByDate[d.date] = d.value;
                sp500Dates.push(d.date);
            }
        });
        sp500Dates.sort();

        // Helper function to find nearest previous trading day
        const findNearestSp500Date = (targetDate: string): string | null => {
            // First check exact match
            if (sp500ByDate[targetDate]) {
                return targetDate;
            }
            // Find the most recent date before targetDate
            let nearestDate: string | null = null;
            for (let i = sp500Dates.length - 1; i >= 0; i--) {
                if (sp500Dates[i] <= targetDate) {
                    nearestDate = sp500Dates[i];
                    break;
                }
            }
            return nearestDate;
        };

        // Calculate weekly returns to ensure we capture S&P 500 trading days
        // Group portfolio values by week and calculate weekly returns
        const weeklyPortfolioReturns: number[] = [];
        const weeklySp500Returns: number[] = [];

        // Use a sliding window approach - compare every 5-7 days
        const stepSize = 5; // Approximately weekly
        for (let i = stepSize; i < portfolioValues.length; i += stepSize) {
            const currDate = portfolioValues[i].date;
            const prevDate = portfolioValues[i - stepSize].date;

            const currSp500Date = findNearestSp500Date(currDate);
            const prevSp500Date = findNearestSp500Date(prevDate);

            if (currSp500Date && prevSp500Date && currSp500Date !== prevSp500Date) {
                const portfolioReturn = (portfolioValues[i].value / portfolioValues[i - stepSize].value) - 1;
                const sp500Return = (sp500ByDate[currSp500Date] / sp500ByDate[prevSp500Date]) - 1;

                weeklyPortfolioReturns.push(portfolioReturn);
                weeklySp500Returns.push(sp500Return);
            }
        }

        // Calculate correlation if we have enough data points (at least 10 weeks)
        if (weeklyPortfolioReturns.length >= 10) {
            sp500Correlation = calculateCorrelation(weeklyPortfolioReturns, weeklySp500Returns);
        } else {
            // Fallback: try daily alignment with nearest date lookup
            const alignedPortfolioReturns: number[] = [];
            const alignedSp500Returns: number[] = [];

            let lastValidSp500Date: string | null = null;
            let lastValidSp500Value: number | null = null;
            let lastPortfolioValue: number | null = null;

            for (let i = 0; i < portfolioValues.length; i++) {
                const currDate = portfolioValues[i].date;
                const currSp500Date = findNearestSp500Date(currDate);

                if (currSp500Date && sp500ByDate[currSp500Date]) {
                    const currSp500Value = sp500ByDate[currSp500Date];

                    // Only calculate return if we have a previous valid point and dates are different
                    if (lastValidSp500Date && lastValidSp500Value && lastPortfolioValue &&
                        currSp500Date !== lastValidSp500Date) {
                        const portfolioReturn = (portfolioValues[i].value / lastPortfolioValue) - 1;
                        const sp500Return = (currSp500Value / lastValidSp500Value) - 1;

                        alignedPortfolioReturns.push(portfolioReturn);
                        alignedSp500Returns.push(sp500Return);
                    }

                    lastValidSp500Date = currSp500Date;
                    lastValidSp500Value = currSp500Value;
                    lastPortfolioValue = portfolioValues[i].value;
                }
            }

            if (alignedPortfolioReturns.length >= 20) {
                sp500Correlation = calculateCorrelation(alignedPortfolioReturns, alignedSp500Returns);
            }
        }
    }

    const monthlyStats = calculateMonthlyPerformance(portfolioValues) ?? undefined;

    return {
        initialInvestment,
        finalBalance,
        totalReturn,
        cagr,
        volatility,
        sharpeRatio,
        bestDay,
        worstDay,
        maxDrawdown,
        monthlyStats,
        sp500Correlation
    };
}

// Helper function to check if rebalancing should occur on a given date
function shouldRebalance(
    currentDate: string,
    lastRebalanceDate: string,
    frequency: RebalanceFrequency
): boolean {
    if (frequency === 'none') return false;

    const current = new Date(currentDate);
    const lastRebalance = new Date(lastRebalanceDate);

    if (frequency === 'quarterly') {
        // Rebalance every 3 months
        const currentQuarter = Math.floor(current.getMonth() / 3);
        const lastQuarter = Math.floor(lastRebalance.getMonth() / 3);
        const currentYear = current.getFullYear();
        const lastYear = lastRebalance.getFullYear();

        return (currentYear > lastYear) ||
               (currentYear === lastYear && currentQuarter > lastQuarter);
    }

    if (frequency === 'annually') {
        // Rebalance every year
        return current.getFullYear() > lastRebalance.getFullYear();
    }

    return false;
}

export function calculatePortfolioHistory(
    historicalData: DailyData[],
    weights: { [ticker: string]: number }, // percentages summing to 100 (e.g., 50, 30, 20)
    initialInvestment: number,
    rebalanceFrequency: RebalanceFrequency = 'none'
): { date: string; value: number }[] {
    if (!historicalData || historicalData.length === 0) return [];

    const results: { date: string; value: number }[] = [];
    let units: { [ticker: string]: number } = {};
    let lastRebalanceDate = historicalData[0].date;

    // Helper to calculate units from a given portfolio value
    const calculateUnits = (dayData: DailyData, portfolioValue: number) => {
        const newUnits: { [ticker: string]: number } = {};
        Object.keys(weights).forEach((ticker) => {
            const weight = weights[ticker] / 100;
            const price = dayData[ticker] as number;
            if (price && price > 0) {
                newUnits[ticker] = (portfolioValue * weight) / price;
            } else {
                newUnits[ticker] = 0;
            }
        });
        return newUnits;
    };

    // Helper to calculate portfolio value from units
    const calculateValue = (dayData: DailyData, currentUnits: { [ticker: string]: number }) => {
        let totalValue = 0;
        Object.keys(currentUnits).forEach((ticker) => {
            const price = dayData[ticker] as number;
            if (typeof price === 'number') {
                totalValue += currentUnits[ticker] * price;
            }
        });
        return totalValue;
    };

    // Initialize units on Day 0
    units = calculateUnits(historicalData[0], initialInvestment);

    // Calculate portfolio value for each day
    for (let i = 0; i < historicalData.length; i++) {
        const day = historicalData[i];

        // Check if we need to rebalance (not on day 0)
        if (i > 0 && shouldRebalance(day.date, lastRebalanceDate, rebalanceFrequency)) {
            // Calculate current portfolio value before rebalancing
            const currentValue = calculateValue(day, units);
            // Rebalance: recalculate units based on current value and target weights
            units = calculateUnits(day, currentValue);
            lastRebalanceDate = day.date;
        }

        const totalValue = calculateValue(day, units);

        results.push({
            date: day.date,
            value: totalValue,
        });
    }

    return results;
}

export function calculateMonthlyPerformance(
    portfolioValues: { date: string; value: number }[]
): MonthlyStats | null {
    if (portfolioValues.length < 2) return null;

    // Group by month
    const monthlyData: MonthlyPerformance[] = [];
    let currentMonth = '';
    let monthStart: { date: string; value: number } | null = null;
    let monthEnd: { date: string; value: number } | null = null;

    for (let i = 0; i < portfolioValues.length; i++) {
        const day = portfolioValues[i];
        const month = day.date.substring(0, 7); // YYYY-MM

        if (month !== currentMonth) {
            // New month started
            if (monthStart && monthEnd) {
                // Save previous month
                const monthReturn = (monthEnd.value / monthStart.value) - 1;
                monthlyData.push({
                    month: currentMonth,
                    return: monthReturn,
                    startValue: monthStart.value,
                    endValue: monthEnd.value
                });
            }
            currentMonth = month;
            monthStart = day;
        }
        monthEnd = day;
    }

    // Add the last month
    if (monthStart && monthEnd) {
        const monthReturn = (monthEnd.value / monthStart.value) - 1;
        monthlyData.push({
            month: currentMonth,
            return: monthReturn,
            startValue: monthStart.value,
            endValue: monthEnd.value
        });
    }

    if (monthlyData.length === 0) return null;

    // Calculate aggregations
    const averageReturn = monthlyData.reduce((sum, m) => sum + m.return, 0) / monthlyData.length;
    const upMonths = monthlyData.filter(m => m.return > 0).length;
    const downMonths = monthlyData.filter(m => m.return <= 0).length;
    const bestMonth = monthlyData.reduce((best, m) => m.return > best.return ? m : best);
    const worstMonth = monthlyData.reduce((worst, m) => m.return < worst.return ? m : worst);

    return {
        averageReturn,
        upMonths,
        downMonths,
        bestMonth,
        worstMonth,
        monthlyData
    };
}

export function calculateCorrelation(
    portfolioReturns: number[],
    benchmarkReturns: number[]
): number {
    if (portfolioReturns.length !== benchmarkReturns.length || portfolioReturns.length < 2) {
        return 0;
    }

    const n = portfolioReturns.length;

    // Calculate means
    const meanX = portfolioReturns.reduce((a, b) => a + b, 0) / n;
    const meanY = benchmarkReturns.reduce((a, b) => a + b, 0) / n;

    // Calculate correlation using Pearson formula
    let numerator = 0;
    let sumXSquared = 0;
    let sumYSquared = 0;

    for (let i = 0; i < n; i++) {
        const xDiff = portfolioReturns[i] - meanX;
        const yDiff = benchmarkReturns[i] - meanY;
        numerator += xDiff * yDiff;
        sumXSquared += xDiff * xDiff;
        sumYSquared += yDiff * yDiff;
    }

    const denominator = Math.sqrt(sumXSquared * sumYSquared);

    if (denominator === 0) return 0;

    return numerator / denominator;
}
