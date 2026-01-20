/**
 * Trace SOL Allocation Behavior
 * Shows what happens to the 10% SOL allocation when SOL has no data at start
 */

import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

async function traceSOLAllocation() {
    console.log('='.repeat(80));
    console.log('TRACING SOL ALLOCATION BEHAVIOR');
    console.log('='.repeat(80));
    console.log('\nQuestion: What happens to the 10% SOL allocation when SOL has');
    console.log('no price data on 2020-01-01?\n');

    const INITIAL_INVESTMENT = 10000;
    const START_DATE = new Date('2020-01-01');
    const END_DATE = new Date('2020-04-01'); // Just check first few months

    try {
        // Fetch SOL data
        console.log('Fetching SOL-USD data...');
        const solData = await yahooFinance.historical('SOL-USD', {
            period1: START_DATE,
            period2: END_DATE,
            interval: '1d',
        });

        if (solData.length === 0) {
            console.log('❌ No SOL data available for this period\n');
        } else {
            console.log(`✓ First SOL data point: ${solData[0].date}`);
            console.log(`  Price: $${(solData[0].adjClose || solData[0].close).toFixed(4)}\n`);
        }

        // Simulate the API route behavior
        console.log('='.repeat(80));
        console.log('API ROUTE BEHAVIOR (route.ts lines 92-112)');
        console.log('='.repeat(80));

        // Create some mock dates
        const dates = [];
        for (let i = 0; i < 90; i++) {
            const date = new Date(START_DATE);
            date.setDate(date.getDate() + i);
            dates.push(date.toISOString().split('T')[0]);
        }

        console.log('\nForward-fill logic:');
        console.log('  if (price exists) → use it and remember as "last known"');
        console.log('  else if (last known exists) → use last known (forward fill)');
        console.log('  else → use 0 (asset not yet listed)\n');

        let lastKnownSOLPrice: number | undefined = undefined;
        let firstSOLDate: string | null = null;

        console.log('Sample of filled prices for SOL:\n');
        console.log('Date           | Raw Data | After Forward Fill | Explanation');
        console.log('-'.repeat(80));

        for (let i = 0; i < Math.min(20, dates.length); i++) {
            const dateStr = dates[i];
            const solEntry = solData.find(d => {
                const dStr = d.date instanceof Date
                    ? d.date.toISOString().split('T')[0]
                    : new Date(d.date).toISOString().split('T')[0];
                return dStr === dateStr;
            });

            let filledPrice: number;
            let explanation: string;

            if (solEntry) {
                const price = solEntry.adjClose || solEntry.close;
                lastKnownSOLPrice = price;
                filledPrice = price;
                explanation = 'Real price data';
                if (!firstSOLDate) {
                    firstSOLDate = dateStr;
                    explanation = '🟢 FIRST SOL DATA!';
                }
            } else if (lastKnownSOLPrice !== undefined) {
                filledPrice = lastKnownSOLPrice;
                explanation = 'Forward filled';
            } else {
                filledPrice = 0;
                explanation = 'Not listed yet → 0';
            }

            const rawDataStr = solEntry ? `$${(solEntry.adjClose || solEntry.close).toFixed(2)}` : 'null';
            console.log(`${dateStr} | ${rawDataStr.padEnd(8)} | $${filledPrice.toFixed(2).padEnd(8)} | ${explanation}`);
        }

        // Now simulate portfolio calculation
        console.log('\n' + '='.repeat(80));
        console.log('PORTFOLIO CALCULATION (finance.ts lines 106-121)');
        console.log('='.repeat(80));

        console.log('\nStep 1: Calculate initial units (Day 0 = 2020-01-01)');
        console.log('-------------------------------------------------------');

        const solPriceDay0 = 0; // From forward-fill logic
        const solWeight = 0.10; // 10%
        const solInvestmentAmount = INITIAL_INVESTMENT * solWeight;

        console.log(`SOL allocation: 10% of $10,000 = $${solInvestmentAmount}`);
        console.log(`SOL price on 2020-01-01: $${solPriceDay0.toFixed(2)}`);
        console.log(`\nFormula: units = investment / price`);

        let solUnits: number;
        if (solPriceDay0 > 0) {
            solUnits = solInvestmentAmount / solPriceDay0;
            console.log(`SOL units = $${solInvestmentAmount} / $${solPriceDay0} = ${solUnits}`);
        } else {
            solUnits = 0;
            console.log(`❌ Price is 0, so: SOL units = 0`);
            console.log(`\nThis means: The $1,000 SOL allocation is NOT invested!`);
        }

        console.log('\n' + '='.repeat(80));
        console.log('ANSWER TO YOUR QUESTION');
        console.log('='.repeat(80));

        console.log(`\n❌ NO, the SOL allocation does NOT get added in March 2020!`);
        console.log(`\nHere's what actually happens:\n`);
        console.log(`1. On Day 0 (2020-01-01):`);
        console.log(`   - SOL has no data → forward-fill sets price to $0`);
        console.log(`   - Portfolio calculation: units = $1,000 / $0 = 0 units`);
        console.log(`   - Result: 0 SOL units purchased, $1,000 sits uninvested\n`);

        console.log(`2. When SOL data appears (March 2020):`);
        console.log(`   - Forward-fill now uses real SOL prices`);
        console.log(`   - BUT: You still own 0 SOL units (from Day 0)`);
        console.log(`   - Portfolio value = 0 units × $X price = $0`);
        console.log(`   - Result: SOL never contributes to portfolio!\n`);

        console.log(`3. What this means for your portfolio:`);
        console.log(`   - Effective starting value: $9,000 (60% BTC + 30% ETH only)`);
        console.log(`   - The 10% SOL allocation is effectively lost/uninvested`);
        console.log(`   - Portfolio behaves as if it were 66.7% BTC, 33.3% ETH`);

        console.log('\n' + '='.repeat(80));
        console.log('IS THIS A BUG?');
        console.log('='.repeat(80));

        console.log(`\n⚠️  YES - This is a bug in the current implementation!\n`);
        console.log(`The intended behavior should probably be ONE of these:\n`);
        console.log(`Option A: "Historical Accuracy"`);
        console.log(`  - Only allow assets that have data at the start date`);
        console.log(`  - Reject SOL in Jan 2020 portfolio with error message`);
        console.log(`  - User would need to pick a later start date\n`);

        console.log(`Option B: "Delayed Entry" (More Complex)`);
        console.log(`  - Keep the $1,000 as "cash" until SOL lists`);
        console.log(`  - When SOL data first appears, calculate units at that price`);
        console.log(`  - Example: SOL first lists at ~$0.50 → buy 2,000 SOL units\n`);

        console.log(`Option C: "Pro-rata Reallocation"`);
        console.log(`  - If an asset has no data, redistribute its weight to others`);
        console.log(`  - 10% SOL missing → split between BTC (67%) and ETH (33%)`);
        console.log(`  - Start with full $10,000 invested across available assets\n`);

        console.log(`Current behavior is unintended and misleading to users!`);

    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

traceSOLAllocation().then(() => {
    console.log('\n');
    process.exit(0);
}).catch((error) => {
    console.error('\nTrace failed:', error);
    process.exit(1);
});
