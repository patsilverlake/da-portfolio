/**
 * Multi-Asset Portfolio Math Verification Script
 * Test Case: 60% BTC, 30% ETH, 10% SOL allocation
 */

import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

async function verifyMultiAssetMath() {
    console.log('='.repeat(80));
    console.log('MULTI-ASSET CRYPTO PORTFOLIO MATH VERIFICATION');
    console.log('='.repeat(80));
    console.log('\nTest Case: 60% BTC, 30% ETH, 10% SOL allocation');
    console.log('Initial Investment: $10,000');
    console.log('Date Range: 2020-01-01 to present\n');

    // Configuration
    const INITIAL_INVESTMENT = 10000;
    const START_DATE = new Date('2020-01-01');
    const END_DATE = new Date();
    const ANNUAL_RISK_FREE_RATE = 0.02; // 2%

    const PORTFOLIO = {
        'BTC-USD': 0.60,  // 60%
        'ETH-USD': 0.30,  // 30%
        'SOL-USD': 0.10   // 10%
    };

    try {
        // Fetch data for all assets
        console.log('Fetching historical data for all assets...\n');
        const allData: Record<string, any[]> = {};

        for (const ticker of Object.keys(PORTFOLIO)) {
            try {
                console.log(`Fetching ${ticker}...`);
                const result = await yahooFinance.historical(ticker, {
                    period1: START_DATE,
                    period2: END_DATE,
                    interval: '1d',
                });
                allData[ticker] = result;
                console.log(`  ✓ Fetched ${result.length} data points`);
            } catch (error) {
                console.error(`  ✗ Failed to fetch ${ticker}:`, error);
                allData[ticker] = [];
            }
        }

        // Align data by date
        console.log('\nAligning data by date...');
        const uniqueDates = new Set<string>();

        Object.values(allData).forEach((data) => {
            data.forEach((day) => {
                if (day.date) {
                    const dateStr = day.date instanceof Date
                        ? day.date.toISOString().split('T')[0]
                        : new Date(day.date).toISOString().split('T')[0];
                    uniqueDates.add(dateStr);
                }
            });
        });

        const sortedDates = Array.from(uniqueDates).sort();

        // Build aligned dataset
        const alignedData = sortedDates.map((dateStr) => {
            const dayRecord: Record<string, any> = { date: dateStr };

            Object.keys(PORTFOLIO).forEach((ticker) => {
                const symbolData = allData[ticker];
                const entry = symbolData.find((d) => {
                    const dStr = d.date instanceof Date
                        ? d.date.toISOString().split('T')[0]
                        : new Date(d.date).toISOString().split('T')[0];
                    return dStr === dateStr;
                });

                if (entry) {
                    dayRecord[ticker] = entry.adjClose || entry.close;
                } else {
                    dayRecord[ticker] = null;
                }
            });
            return dayRecord;
        });

        // Forward fill missing values
        const filledData = [];
        let lastKnownValues: Record<string, number> = {};

        for (const day of alignedData) {
            const newDay: Record<string, any> = { ...day };
            Object.keys(PORTFOLIO).forEach(ticker => {
                if (newDay[ticker] !== null && newDay[ticker] !== undefined) {
                    lastKnownValues[ticker] = newDay[ticker];
                } else if (lastKnownValues[ticker] !== undefined) {
                    newDay[ticker] = lastKnownValues[ticker];
                } else {
                    newDay[ticker] = 0;
                }
            });
            filledData.push(newDay);
        }

        console.log(`Total aligned data points: ${filledData.length}\n`);

        // ============================================================
        // CALCULATE INITIAL UNITS FOR EACH ASSET
        // ============================================================
        console.log('='.repeat(80));
        console.log('INITIAL ALLOCATION');
        console.log('='.repeat(80));

        const initialPrices = filledData[0];
        const units: Record<string, number> = {};

        console.log(`\nFirst Date: ${filledData[0].date}`);
        console.log(`Last Date:  ${filledData[filledData.length - 1].date}\n`);

        Object.keys(PORTFOLIO).forEach((ticker) => {
            const weight = PORTFOLIO[ticker as keyof typeof PORTFOLIO];
            const price = initialPrices[ticker] as number;
            const investmentAmount = INITIAL_INVESTMENT * weight;

            if (price && price > 0) {
                units[ticker] = investmentAmount / price;
                console.log(`${ticker}:`);
                console.log(`  Weight: ${(weight * 100).toFixed(1)}%`);
                console.log(`  Investment: $${investmentAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}`);
                console.log(`  First Price: $${price.toFixed(2)}`);
                console.log(`  Units: ${units[ticker].toFixed(8)}`);
            } else {
                units[ticker] = 0;
                console.log(`${ticker}: No data available at start date`);
            }
        });

        // ============================================================
        // CALCULATE PORTFOLIO VALUE OVER TIME
        // ============================================================
        console.log('\n' + '='.repeat(80));
        console.log('PORTFOLIO VALUE CALCULATION');
        console.log('='.repeat(80));

        const portfolioValues = filledData.map((day) => {
            let totalValue = 0;
            Object.keys(units).forEach((ticker) => {
                const price = day[ticker] as number;
                if (typeof price === 'number') {
                    totalValue += units[ticker] * price;
                }
            });

            return {
                date: day.date as string,
                value: totalValue,
            };
        });

        console.log(`\nFormula: Portfolio Value = Σ(Units[asset] × Price[asset])`);
        console.log(`\nSample calculations (first 3 days):`);
        for (let i = 0; i < Math.min(3, portfolioValues.length); i++) {
            const day = filledData[i];
            console.log(`\n${portfolioValues[i].date}:`);
            let total = 0;
            Object.keys(units).forEach((ticker) => {
                const price = day[ticker] as number;
                const value = units[ticker] * price;
                total += value;
                console.log(`  ${ticker}: ${units[ticker].toFixed(6)} × $${price.toFixed(2)} = $${value.toFixed(2)}`);
            });
            console.log(`  Total: $${total.toFixed(2)}`);
        }

        const finalBalance = portfolioValues[portfolioValues.length - 1].value;
        const totalReturn = (finalBalance - INITIAL_INVESTMENT) / INITIAL_INVESTMENT;

        console.log(`\n\nFinal Portfolio Value: $${finalBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}`);
        console.log(`Total Return: ${(totalReturn * 100).toFixed(2)}%`);

        // ============================================================
        // CALCULATE METRICS
        // ============================================================
        console.log('\n' + '='.repeat(80));
        console.log('METRIC CALCULATIONS');
        console.log('='.repeat(80));

        // Time period
        const startDate = new Date(portfolioValues[0].date);
        const endDate = new Date(portfolioValues[portfolioValues.length - 1].date);
        const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
        const years = daysDiff / 365;

        // CAGR
        console.log('\n1. CAGR:');
        console.log(`   Formula: (Final / Initial)^(1/years) - 1`);
        console.log(`   Time Period: ${daysDiff.toFixed(0)} days = ${years.toFixed(4)} years`);
        const cagr = Math.pow(finalBalance / INITIAL_INVESTMENT, 1 / years) - 1;
        console.log(`   CAGR = ($${finalBalance.toFixed(2)} / $${INITIAL_INVESTMENT})^(1/${years.toFixed(4)}) - 1`);
        console.log(`   CAGR = ${(cagr * 100).toFixed(2)}%`);

        // Daily Returns
        const dailyReturns: number[] = [];
        for (let i = 1; i < portfolioValues.length; i++) {
            const r = (portfolioValues[i].value / portfolioValues[i - 1].value) - 1;
            dailyReturns.push(r);
        }

        // Volatility
        console.log('\n2. Volatility:');
        console.log(`   Formula: Daily Std Dev × √365`);
        const meanReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
        const variance = dailyReturns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / dailyReturns.length;
        const stdDev = Math.sqrt(variance);
        const volatility = stdDev * Math.sqrt(365);
        console.log(`   Daily Std Dev = ${stdDev.toFixed(8)}`);
        console.log(`   Annualized = ${stdDev.toFixed(8)} × √365 = ${volatility.toFixed(8)}`);
        console.log(`   Volatility = ${(volatility * 100).toFixed(2)}%`);

        // Sharpe Ratio
        console.log('\n3. Sharpe Ratio:');
        console.log(`   Formula: (CAGR - Risk Free Rate) / Volatility`);
        const sharpeRatio = (cagr - ANNUAL_RISK_FREE_RATE) / volatility;
        console.log(`   Sharpe = (${(cagr * 100).toFixed(2)}% - ${(ANNUAL_RISK_FREE_RATE * 100).toFixed(2)}%) / ${(volatility * 100).toFixed(2)}%`);
        console.log(`   Sharpe Ratio = ${sharpeRatio.toFixed(3)}`);

        // Max Drawdown
        console.log('\n4. Max Drawdown:');
        console.log(`   Formula: MAX((Peak - Current) / Peak)`);
        let maxDrawdown = 0;
        let peak = portfolioValues[0].value;
        let maxDrawdownPeakDate = portfolioValues[0].date;
        let maxDrawdownTroughDate = portfolioValues[0].date;
        let maxDrawdownPeakValue = peak;
        let maxDrawdownTroughValue = peak;

        for (let i = 1; i < portfolioValues.length; i++) {
            const currentValue = portfolioValues[i].value;
            if (currentValue > peak) {
                peak = currentValue;
            } else {
                const drawdown = (peak - currentValue) / peak;
                if (drawdown > maxDrawdown) {
                    maxDrawdown = drawdown;
                    maxDrawdownPeakDate = portfolioValues.slice(0, i).reduce((prev, curr) =>
                        curr.value >= peak ? curr : prev
                    ).date;
                    maxDrawdownTroughDate = portfolioValues[i].date;
                    maxDrawdownPeakValue = peak;
                    maxDrawdownTroughValue = currentValue;
                }
            }
        }
        console.log(`   Peak Date: ${maxDrawdownPeakDate} ($${maxDrawdownPeakValue.toFixed(2)})`);
        console.log(`   Trough Date: ${maxDrawdownTroughDate} ($${maxDrawdownTroughValue.toFixed(2)})`);
        console.log(`   Max Drawdown = ${(maxDrawdown * 100).toFixed(2)}%`);

        // Best/Worst Days
        const bestDay = Math.max(...dailyReturns);
        const worstDay = Math.min(...dailyReturns);
        const bestDayIndex = dailyReturns.indexOf(bestDay);
        const worstDayIndex = dailyReturns.indexOf(worstDay);

        console.log('\n5. Best Day:');
        console.log(`   Date: ${portfolioValues[bestDayIndex + 1].date}`);
        console.log(`   Return: +${(bestDay * 100).toFixed(2)}%`);

        console.log('\n6. Worst Day:');
        console.log(`   Date: ${portfolioValues[worstDayIndex + 1].date}`);
        console.log(`   Return: ${(worstDay * 100).toFixed(2)}%`);

        // ============================================================
        // SUMMARY
        // ============================================================
        console.log('\n' + '='.repeat(80));
        console.log('FINAL SUMMARY - 60% BTC / 30% ETH / 10% SOL');
        console.log('='.repeat(80));
        console.log(`\nInitial Investment: $${INITIAL_INVESTMENT.toLocaleString()}`);
        console.log(`Final Balance:      $${finalBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}`);
        console.log(`Total Return:       ${(totalReturn * 100).toFixed(2)}%`);
        console.log(`\nAnnualized Metrics:`);
        console.log(`  CAGR:             ${(cagr * 100).toFixed(2)}%`);
        console.log(`  Volatility:       ${(volatility * 100).toFixed(2)}%`);
        console.log(`  Sharpe Ratio:     ${sharpeRatio.toFixed(3)}`);
        console.log(`\nRisk Metrics:`);
        console.log(`  Max Drawdown:     -${(maxDrawdown * 100).toFixed(2)}%`);
        console.log(`  Best Day:         +${(bestDay * 100).toFixed(2)}%`);
        console.log(`  Worst Day:        ${(worstDay * 100).toFixed(2)}%`);
        console.log(`\nTime Period: ${portfolioValues[0].date} to ${portfolioValues[portfolioValues.length - 1].date}`);
        console.log(`             (${years.toFixed(2)} years, ${portfolioValues.length} days)`);
        console.log('='.repeat(80));

        // ============================================================
        // COMPARISON WITH DASHBOARD
        // ============================================================
        console.log('\n' + '='.repeat(80));
        console.log('DASHBOARD COMPARISON');
        console.log('='.repeat(80));
        console.log('\nExpected Dashboard Values (from screenshot):');
        console.log('  Final Balance:  $151,028');
        console.log('  Returns:        1410.3%');
        console.log('  CAGR:           56.6%');
        console.log('  Sharpe Ratio:   0.80');
        console.log('  Volatility:     68.5%');
        console.log('  Max Drawdown:   -76.9%');
        console.log('  Best Day:       +20.07%');
        console.log('  Worst Day:      -39.26%');

        console.log('\nCalculated Values:');
        console.log(`  Final Balance:  $${finalBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}`);
        console.log(`  Returns:        ${(totalReturn * 100).toFixed(1)}%`);
        console.log(`  CAGR:           ${(cagr * 100).toFixed(1)}%`);
        console.log(`  Sharpe Ratio:   ${sharpeRatio.toFixed(2)}`);
        console.log(`  Volatility:     ${(volatility * 100).toFixed(1)}%`);
        console.log(`  Max Drawdown:   -${(maxDrawdown * 100).toFixed(1)}%`);
        console.log(`  Best Day:       +${(bestDay * 100).toFixed(2)}%`);
        console.log(`  Worst Day:      ${(worstDay * 100).toFixed(2)}%`);

    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Run verification
verifyMultiAssetMath().then(() => {
    console.log('\nVerification complete!');
    process.exit(0);
}).catch((error) => {
    console.error('\nVerification failed:', error);
    process.exit(1);
});
