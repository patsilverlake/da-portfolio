/**
 * Independent Math Verification Script
 * This script fetches BTC data and calculates all metrics independently
 * to verify the formulas used in the dashboard
 */

import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

async function verifyMath() {
    console.log('='.repeat(80));
    console.log('CRYPTO PORTFOLIO MATH VERIFICATION');
    console.log('='.repeat(80));
    console.log('\nTest Case: 100% BTC allocation, $10,000 initial investment');
    console.log('Date Range: 2020-01-01 to present\n');

    // Configuration
    const INITIAL_INVESTMENT = 10000;
    const START_DATE = new Date('2020-01-01');
    const END_DATE = new Date();
    const TICKER = 'BTC-USD';
    const ANNUAL_RISK_FREE_RATE = 0.02; // 2%

    try {
        // Fetch BTC historical data
        console.log(`Fetching ${TICKER} data from Yahoo Finance...`);
        const rawData = await yahooFinance.historical(TICKER, {
            period1: START_DATE,
            period2: END_DATE,
            interval: '1d',
        });

        console.log(`\nFetched ${rawData.length} daily data points\n`);

        // Extract adjusted close prices
        const prices = rawData.map(d => ({
            date: d.date instanceof Date ? d.date.toISOString().split('T')[0] : new Date(d.date).toISOString().split('T')[0],
            price: d.adjClose || d.close
        }));

        // Sort by date to ensure chronological order
        prices.sort((a, b) => a.date.localeCompare(b.date));

        const firstDate = prices[0].date;
        const lastDate = prices[prices.length - 1].date;
        const firstPrice = prices[0].price;
        const lastPrice = prices[prices.length - 1].price;

        console.log('DATA SUMMARY:');
        console.log('-'.repeat(80));
        console.log(`First Date: ${firstDate}`);
        console.log(`Last Date:  ${lastDate}`);
        console.log(`First Price: $${firstPrice.toFixed(2)}`);
        console.log(`Last Price:  $${lastPrice.toFixed(2)}`);
        console.log(`Number of trading days: ${prices.length}`);

        // ============================================================
        // 1. FINAL BALANCE
        // ============================================================
        console.log('\n' + '='.repeat(80));
        console.log('1. FINAL BALANCE CALCULATION');
        console.log('='.repeat(80));

        // Calculate number of BTC units purchased
        const btcUnits = INITIAL_INVESTMENT / firstPrice;
        console.log(`\nFormula: Final Balance = Initial Investment * (Last Price / First Price)`);
        console.log(`Alternative: Units Purchased * Current Price`);
        console.log(`\nCalculation:`);
        console.log(`  Units of BTC purchased = $${INITIAL_INVESTMENT} / $${firstPrice.toFixed(2)} = ${btcUnits.toFixed(8)} BTC`);
        console.log(`  Final Balance = ${btcUnits.toFixed(8)} BTC * $${lastPrice.toFixed(2)} = $${(btcUnits * lastPrice).toFixed(2)}`);

        const finalBalance = btcUnits * lastPrice;
        const totalReturn = (finalBalance - INITIAL_INVESTMENT) / INITIAL_INVESTMENT;

        console.log(`\nRESULT: Final Balance = $${finalBalance.toFixed(2)}`);
        console.log(`Total Return = ${(totalReturn * 100).toFixed(2)}%`);

        // ============================================================
        // 2. CAGR (Compound Annual Growth Rate)
        // ============================================================
        console.log('\n' + '='.repeat(80));
        console.log('2. CAGR (COMPOUND ANNUAL GROWTH RATE)');
        console.log('='.repeat(80));

        const startDateObj = new Date(firstDate);
        const endDateObj = new Date(lastDate);
        const daysDiff = (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 3600 * 24);
        const years = daysDiff / 365;

        console.log(`\nFormula: CAGR = (Final Value / Initial Value)^(1/years) - 1`);
        console.log(`\nCalculation:`);
        console.log(`  Time Period = ${daysDiff.toFixed(0)} days = ${years.toFixed(4)} years`);
        console.log(`  CAGR = ($${finalBalance.toFixed(2)} / $${INITIAL_INVESTMENT})^(1/${years.toFixed(4)}) - 1`);
        console.log(`  CAGR = ${(finalBalance / INITIAL_INVESTMENT).toFixed(6)}^(${(1/years).toFixed(6)}) - 1`);

        const cagr = Math.pow(finalBalance / INITIAL_INVESTMENT, 1 / years) - 1;

        console.log(`\nRESULT: CAGR = ${(cagr * 100).toFixed(2)}%`);

        // ============================================================
        // 3. VOLATILITY (Annualized Standard Deviation)
        // ============================================================
        console.log('\n' + '='.repeat(80));
        console.log('3. VOLATILITY (ANNUALIZED STANDARD DEVIATION)');
        console.log('='.repeat(80));

        // Calculate daily returns
        const dailyReturns: number[] = [];
        for (let i = 1; i < prices.length; i++) {
            const dailyReturn = (prices[i].price / prices[i - 1].price) - 1;
            dailyReturns.push(dailyReturn);
        }

        // Calculate mean daily return
        const meanReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;

        // Calculate variance
        const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / dailyReturns.length;

        // Calculate standard deviation
        const dailyStdDev = Math.sqrt(variance);

        // Annualize (crypto trades 365 days/year)
        const volatility = dailyStdDev * Math.sqrt(365);

        console.log(`\nFormula: Volatility = Daily Std Dev * √365`);
        console.log(`\nStep 1: Calculate daily returns`);
        console.log(`  Daily Return[i] = (Price[i] / Price[i-1]) - 1`);
        console.log(`  Number of daily returns: ${dailyReturns.length}`);
        console.log(`  Sample daily returns (first 5):`);
        for (let i = 0; i < Math.min(5, dailyReturns.length); i++) {
            console.log(`    Day ${i+1}: ${(dailyReturns[i] * 100).toFixed(4)}%`);
        }

        console.log(`\nStep 2: Calculate mean daily return`);
        console.log(`  Mean = Σ(returns) / count = ${meanReturn.toFixed(8)}`);

        console.log(`\nStep 3: Calculate variance`);
        console.log(`  Variance = Σ(return - mean)² / count = ${variance.toFixed(10)}`);

        console.log(`\nStep 4: Calculate standard deviation`);
        console.log(`  Daily Std Dev = √variance = ${dailyStdDev.toFixed(8)}`);

        console.log(`\nStep 5: Annualize for crypto (365 days)`);
        console.log(`  Annualized Volatility = ${dailyStdDev.toFixed(8)} * √365`);
        console.log(`  Annualized Volatility = ${dailyStdDev.toFixed(8)} * ${Math.sqrt(365).toFixed(6)}`);

        console.log(`\nRESULT: Volatility = ${(volatility * 100).toFixed(2)}%`);

        // ============================================================
        // 4. SHARPE RATIO
        // ============================================================
        console.log('\n' + '='.repeat(80));
        console.log('4. SHARPE RATIO');
        console.log('='.repeat(80));

        const sharpeRatio = (cagr - ANNUAL_RISK_FREE_RATE) / volatility;

        console.log(`\nFormula: Sharpe Ratio = (Portfolio Return - Risk Free Rate) / Volatility`);
        console.log(`\nCalculation:`);
        console.log(`  Portfolio Return (CAGR) = ${(cagr * 100).toFixed(2)}%`);
        console.log(`  Risk Free Rate = ${(ANNUAL_RISK_FREE_RATE * 100).toFixed(2)}%`);
        console.log(`  Volatility = ${(volatility * 100).toFixed(2)}%`);
        console.log(`  Sharpe Ratio = (${(cagr * 100).toFixed(2)}% - ${(ANNUAL_RISK_FREE_RATE * 100).toFixed(2)}%) / ${(volatility * 100).toFixed(2)}%`);
        console.log(`  Sharpe Ratio = ${((cagr - ANNUAL_RISK_FREE_RATE) * 100).toFixed(2)}% / ${(volatility * 100).toFixed(2)}%`);

        console.log(`\nRESULT: Sharpe Ratio = ${sharpeRatio.toFixed(3)}`);

        // ============================================================
        // 5. MAX DRAWDOWN
        // ============================================================
        console.log('\n' + '='.repeat(80));
        console.log('5. MAX DRAWDOWN (PEAK TO TROUGH)');
        console.log('='.repeat(80));

        let maxDrawdown = 0;
        let peak = prices[0].price * btcUnits;
        let peakDate = prices[0].date;
        let troughAfterPeak = peak;
        let troughDate = peakDate;
        let maxDrawdownPeakDate = peakDate;
        let maxDrawdownTroughDate = peakDate;
        let maxDrawdownPeakValue = peak;
        let maxDrawdownTroughValue = peak;

        console.log(`\nFormula: Max Drawdown = MAX((Peak Value - Current Value) / Peak Value)`);
        console.log(`\nAlgorithm:`);
        console.log(`  1. Track running peak portfolio value`);
        console.log(`  2. At each point, calculate drawdown from peak`);
        console.log(`  3. Track maximum drawdown observed`);

        for (let i = 1; i < prices.length; i++) {
            const currentValue = prices[i].price * btcUnits;

            if (currentValue > peak) {
                peak = currentValue;
                peakDate = prices[i].date;
                troughAfterPeak = peak;
            } else {
                const drawdown = (peak - currentValue) / peak;
                if (drawdown > maxDrawdown) {
                    maxDrawdown = drawdown;
                    maxDrawdownPeakDate = peakDate;
                    maxDrawdownTroughDate = prices[i].date;
                    maxDrawdownPeakValue = peak;
                    maxDrawdownTroughValue = currentValue;
                }
            }
        }

        console.log(`\nMax Drawdown Details:`);
        console.log(`  Peak Date: ${maxDrawdownPeakDate}`);
        console.log(`  Peak Value: $${maxDrawdownPeakValue.toFixed(2)}`);
        console.log(`  Trough Date: ${maxDrawdownTroughDate}`);
        console.log(`  Trough Value: $${maxDrawdownTroughValue.toFixed(2)}`);
        console.log(`  Drawdown = ($${maxDrawdownPeakValue.toFixed(2)} - $${maxDrawdownTroughValue.toFixed(2)}) / $${maxDrawdownPeakValue.toFixed(2)}`);
        console.log(`  Drawdown = $${(maxDrawdownPeakValue - maxDrawdownTroughValue).toFixed(2)} / $${maxDrawdownPeakValue.toFixed(2)}`);

        console.log(`\nRESULT: Max Drawdown = ${(maxDrawdown * 100).toFixed(2)}%`);

        // ============================================================
        // 6. BEST DAY
        // ============================================================
        console.log('\n' + '='.repeat(80));
        console.log('6. BEST DAY (HIGHEST DAILY RETURN)');
        console.log('='.repeat(80));

        const bestDay = Math.max(...dailyReturns);
        const bestDayIndex = dailyReturns.indexOf(bestDay);

        console.log(`\nFormula: Best Day = MAX(Daily Returns)`);
        console.log(`\nCalculation:`);
        console.log(`  Search through all ${dailyReturns.length} daily returns`);
        console.log(`  Best day occurred on: ${prices[bestDayIndex + 1].date}`);
        console.log(`  Price went from $${prices[bestDayIndex].price.toFixed(2)} to $${prices[bestDayIndex + 1].price.toFixed(2)}`);

        console.log(`\nRESULT: Best Day = +${(bestDay * 100).toFixed(2)}%`);

        // ============================================================
        // 7. WORST DAY
        // ============================================================
        console.log('\n' + '='.repeat(80));
        console.log('7. WORST DAY (LOWEST DAILY RETURN)');
        console.log('='.repeat(80));

        const worstDay = Math.min(...dailyReturns);
        const worstDayIndex = dailyReturns.indexOf(worstDay);

        console.log(`\nFormula: Worst Day = MIN(Daily Returns)`);
        console.log(`\nCalculation:`);
        console.log(`  Search through all ${dailyReturns.length} daily returns`);
        console.log(`  Worst day occurred on: ${prices[worstDayIndex + 1].date}`);
        console.log(`  Price went from $${prices[worstDayIndex].price.toFixed(2)} to $${prices[worstDayIndex + 1].price.toFixed(2)}`);

        console.log(`\nRESULT: Worst Day = ${(worstDay * 100).toFixed(2)}%`);

        // ============================================================
        // SUMMARY
        // ============================================================
        console.log('\n' + '='.repeat(80));
        console.log('SUMMARY OF ALL METRICS');
        console.log('='.repeat(80));
        console.log(`\nInitial Investment: $${INITIAL_INVESTMENT.toLocaleString()}`);
        console.log(`Final Balance:      $${finalBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
        console.log(`Total Return:       ${(totalReturn * 100).toFixed(2)}%`);
        console.log(`\nAnnualized Metrics:`);
        console.log(`  CAGR:             ${(cagr * 100).toFixed(2)}%`);
        console.log(`  Volatility:       ${(volatility * 100).toFixed(2)}%`);
        console.log(`  Sharpe Ratio:     ${sharpeRatio.toFixed(3)}`);
        console.log(`\nRisk Metrics:`);
        console.log(`  Max Drawdown:     -${(maxDrawdown * 100).toFixed(2)}%`);
        console.log(`  Best Day:         +${(bestDay * 100).toFixed(2)}%`);
        console.log(`  Worst Day:        ${(worstDay * 100).toFixed(2)}%`);
        console.log(`\nTime Period: ${firstDate} to ${lastDate} (${years.toFixed(2)} years)`);
        console.log('='.repeat(80));

    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Run verification
verifyMath().then(() => {
    console.log('\nVerification complete!');
    process.exit(0);
}).catch((error) => {
    console.error('\nVerification failed:', error);
    process.exit(1);
});
