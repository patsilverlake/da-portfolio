import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

// Initialize Yahoo Finance instance (required for v3+)
const yahooFinance = new YahooFinance();

// Force dynamic to prevent static caching issues with external APIs if needed,
// though for historical data static might be better, we want freshness.
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    // Allow overriding start date, default to 2020-01-01
    const startDateParam = searchParams.get('startDate') || '2020-01-01';
    const endDateParam = searchParams.get('endDate') || new Date().toISOString().split('T')[0];

    // Parse assets from query parameter
    const assetsParam = searchParams.get('assets');
    const requestedAssets = assetsParam ? assetsParam.split(',') : ['BTC-USD', 'ETH-USD', 'SOL-USD'];

    // Validate assets for security (prevent injection)
    const ASSETS = requestedAssets.filter(asset =>
        /^[A-Z0-9]+-USD$/.test(asset) && requestedAssets.length <= 20
    );

    // Always include S&P 500 for correlation analysis
    const assetsToFetch = [...ASSETS, '^GSPC'];

    try {
        const startDate = new Date(startDateParam);
        const endDate = new Date(endDateParam);

        const allData: Record<string, any[]> = {};

        // Fetch data for all assets in parallel
        await Promise.all(
            assetsToFetch.map(async (symbol) => {
                try {
                    const result = await yahooFinance.historical(symbol, {
                        period1: startDate,
                        period2: endDate,
                        interval: '1d',
                    });
                    allData[symbol] = result;
                } catch (error) {
                    console.error(`Failed to fetch data for ${symbol}`, error);
                    allData[symbol] = [];
                }
            })
        );

        // Align data by date
        // 1. Collect all unique dates
        const uniqueDates = new Set<string>();
        Object.values(allData).forEach((data) => {
            data.forEach((day) => {
                if (day.date) {
                    // Format date as YYYY-MM-DD for consistency
                    // yahoo-finance2 returns Date objects or strings depending on config, usually Date
                    const dateStr = day.date instanceof Date
                        ? day.date.toISOString().split('T')[0]
                        : new Date(day.date).toISOString().split('T')[0];
                    uniqueDates.add(dateStr);
                }
            });
        });

        const sortedDates = Array.from(uniqueDates).sort();

        // 2. Build the result array
        const alignedData = sortedDates.map((dateStr) => {
            const dayRecord: Record<string, any> = { date: dateStr };

            assetsToFetch.forEach((symbol) => {
                const symbolData = allData[symbol];
                // Find the record for this date
                const entry = symbolData.find((d) => {
                    const dStr = d.date instanceof Date
                        ? d.date.toISOString().split('T')[0]
                        : new Date(d.date).toISOString().split('T')[0];
                    return dStr === dateStr;
                });

                if (entry) {
                    dayRecord[symbol] = entry.adjClose || entry.close;
                } else {
                    // If missing, we could forward fill from previous day in the loop, 
                    // but for efficient mapping we might need a more stateful approach.
                    // For now, leave undefined and handle in frontend or second pass.
                    dayRecord[symbol] = null;
                }
            });
            return dayRecord;
        });

        // 3. Forward Fill missing values (Basic)
        // Crypto trades 24/7 so gaps are rare but specific asset outages or listing dates differ.
        // e.g. SOL might not exist in Jan 2020 (Mainnet launch March 2020).
        const filledData = [];
        let lastKnownValues: Record<string, number> = {};

        for (const day of alignedData) {
            const newDay: Record<string, any> = { ...day };
            assetsToFetch.forEach(symbol => {
                if (newDay[symbol] !== null && newDay[symbol] !== undefined) {
                    lastKnownValues[symbol] = newDay[symbol];
                } else if (lastKnownValues[symbol] !== undefined) {
                    newDay[symbol] = lastKnownValues[symbol];
                } else {
                    // If never seen before (before listing), keep as 0 or null?
                    // 0 is safer for "value = units * price" logic (value is 0).
                    newDay[symbol] = 0;
                }
            });
            filledData.push(newDay);
        }

        return NextResponse.json(filledData);

    } catch (error) {
        console.error('Error fetching market data:', error);
        return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
    }
}
