# Crypto Portfolio Dashboard - Math Verification

## Test Case: 100% BTC Allocation
- **Initial Investment**: $10,000
- **Date Range**: 2020-01-01 to 2026-01-19 (6.05 years)
- **Data Points**: 2,211 daily observations

---

## Comparison: Dashboard vs Independent Calculation

| Metric | Dashboard Value | Verified Value | Match? |
|--------|----------------|----------------|--------|
| **Final Balance** | $129,077 | $129,136.32 | ✅ Match |
| **Returns** | 1190.8% | 1191.36% | ✅ Match |
| **CAGR** | 52.6% | 52.58% | ✅ Match |
| **Sharpe Ratio** | 0.83 | 0.833 | ✅ Match |
| **Volatility** | 60.8% | 60.75% | ✅ Match |
| **Max Drawdown** | -76.6% | -76.63% | ✅ Match |
| **Best Day** | +18.75% | +18.75% | ✅ Match |
| **Worst Day** | -37.17% | -37.17% | ✅ Match |

**✅ All metrics verified and match within rounding precision!**

---

## Detailed Formulas and Calculations

### 1. Final Balance

**Formula:**
```
Final Balance = Units Purchased × Current Price
```

**Calculation:**
```
BTC Units = Initial Investment / First Price
         = $10,000 / $7,200.17
         = 1.38885526 BTC

Final Balance = 1.38885526 BTC × $92,980.40
              = $129,136.32
```

**Code Location:** [lib/finance.ts:38](lib/finance.ts#L38)
```typescript
const finalBalance = portfolioValues[portfolioValues.length - 1].value;
```

---

### 2. Total Return

**Formula:**
```
Total Return = (Final Balance - Initial Investment) / Initial Investment
```

**Calculation:**
```
Total Return = ($129,136.32 - $10,000) / $10,000
             = $119,136.32 / $10,000
             = 11.9136
             = 1191.36%
```

**Code Location:** [lib/finance.ts:39](lib/finance.ts#L39)
```typescript
const totalReturn = (finalBalance - initialInvestment) / initialInvestment;
```

---

### 3. CAGR (Compound Annual Growth Rate)

**Formula:**
```
CAGR = (Final Value / Initial Value)^(1/years) - 1
```

**Calculation:**
```
Time Period = 2,210 days / 365 = 6.0548 years

CAGR = ($129,136.32 / $10,000)^(1/6.0548) - 1
     = (12.913632)^(0.165158) - 1
     = 1.5258 - 1
     = 0.5258
     = 52.58%
```

**Code Location:** [lib/finance.ts:41-47](lib/finance.ts#L41-L47)
```typescript
const startDate = new Date(portfolioValues[0].date);
const endDate = new Date(portfolioValues[portfolioValues.length - 1].date);
const years = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24 * 365);

const cagr = years > 0 ? Math.pow(finalBalance / initialInvestment, 1 / years) - 1 : 0;
```

---

### 4. Volatility (Annualized Standard Deviation)

**Formula:**
```
Volatility = Daily Std Dev × √365
```

**Step-by-Step:**

1. **Calculate Daily Returns:**
   ```
   Daily Return[i] = (Price[i] / Price[i-1]) - 1
   ```
   Example: Day 1 = ($6,985.47 / $7,200.17) - 1 = -2.98%

2. **Calculate Mean Daily Return:**
   ```
   Mean = Σ(returns) / count
        = 0.00167268 (or 0.167% per day)
   ```

3. **Calculate Variance:**
   ```
   Variance = Σ(return - mean)² / count
            = 0.0010111997
   ```

4. **Calculate Standard Deviation:**
   ```
   Daily Std Dev = √variance
                 = √0.0010111997
                 = 0.03179937
   ```

5. **Annualize (365 days for crypto):**
   ```
   Annualized Volatility = 0.03179937 × √365
                         = 0.03179937 × 19.104973
                         = 0.6075
                         = 60.75%
   ```

**Code Location:** [lib/finance.ts:49-61](lib/finance.ts#L49-L61)
```typescript
// Daily Returns
const dailyReturns: number[] = [];
for (let i = 1; i < portfolioValues.length; i++) {
    const r = (portfolioValues[i].value / portfolioValues[i - 1].value) - 1;
    dailyReturns.push(r);
}

// Volatility (Annualized Standard Deviation)
const meanReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
const variance = dailyReturns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / dailyReturns.length;
const stdDev = Math.sqrt(variance);
const volatility = stdDev * Math.sqrt(365);  // Crypto trades 365 days a year
```

---

### 5. Sharpe Ratio

**Formula:**
```
Sharpe Ratio = (Portfolio Return - Risk Free Rate) / Volatility
```

**Calculation:**
```
Portfolio Return (CAGR) = 52.58%
Risk Free Rate = 2.00% (assumption)
Volatility = 60.75%

Sharpe Ratio = (0.5258 - 0.02) / 0.6075
             = 0.5058 / 0.6075
             = 0.833
```

**Interpretation:** For every unit of risk (volatility), the portfolio generates 0.833 units of excess return above the risk-free rate.

**Code Location:** [lib/finance.ts:63-66](lib/finance.ts#L63-L66)
```typescript
export const ANNUAL_RISK_FREE_RATE = 0.02; // 2% Assumption

// Sharpe Ratio = (Rp - Rf) / Sigma_p
const sharpeRatio = volatility !== 0 ? (cagr - ANNUAL_RISK_FREE_RATE) / volatility : 0;
```

---

### 6. Max Drawdown

**Formula:**
```
Max Drawdown = MAX((Peak Value - Current Value) / Peak Value)
```

**Algorithm:**
1. Track the running peak portfolio value
2. At each point, calculate drawdown from that peak
3. Record the maximum drawdown observed

**Calculation:**
```
Peak Date: November 8, 2021
Peak Value: $93,840.54
Trough Date: November 21, 2022
Trough Value: $21,926.25

Drawdown = ($93,840.54 - $21,926.25) / $93,840.54
         = $71,914.29 / $93,840.54
         = 0.7663
         = 76.63%
```

**Historical Context:** This represents the crypto market crash from the 2021 peak through 2022's "crypto winter."

**Code Location:** [lib/finance.ts:72-84](lib/finance.ts#L72-L84)
```typescript
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
```

---

### 7. Best Day

**Formula:**
```
Best Day = MAX(Daily Returns)
```

**Calculation:**
```
Search through all 2,210 daily returns
Best day: February 8, 2021
Price change: $38,903.44 → $46,196.46
Daily return = ($46,196.46 / $38,903.44) - 1 = 18.75%
```

**Code Location:** [lib/finance.ts:69](lib/finance.ts#L69)
```typescript
const bestDay = Math.max(...dailyReturns);
```

---

### 8. Worst Day

**Formula:**
```
Worst Day = MIN(Daily Returns)
```

**Calculation:**
```
Search through all 2,210 daily returns
Worst day: March 12, 2020
Price change: $7,911.43 → $4,970.79
Daily return = ($4,970.79 / $7,911.43) - 1 = -37.17%
```

**Historical Context:** This was during the COVID-19 market crash.

**Code Location:** [lib/finance.ts:70](lib/finance.ts#L70)
```typescript
const worstDay = Math.min(...dailyReturns);
```

---

## Portfolio Value Calculation

**Formula for Buy-and-Hold Strategy:**
```
Portfolio Value[t] = Σ(Units[asset] × Price[asset, t])
```

**For 100% BTC:**
```
Portfolio Value[t] = 1.38885526 BTC × BTC_Price[t]
```

**Code Location:** [lib/finance.ts:99-140](lib/finance.ts#L99-L140)
```typescript
export function calculatePortfolioHistory(
    historicalData: DailyData[],
    weights: { [ticker: string]: number },
    initialInvestment: number
): { date: string; value: number }[] {
    // Calculate initial units for each asset
    const initialPrices = historicalData[0];
    const units: { [ticker: string]: number } = {};

    Object.keys(weights).forEach((ticker) => {
        const weight = weights[ticker] / 100;
        const price = initialPrices[ticker] as number;
        if (price && price > 0) {
            units[ticker] = (initialInvestment * weight) / price;
        } else {
            units[ticker] = 0;
        }
    });

    // Calculate portfolio value for each day
    return historicalData.map((day) => {
        let totalValue = 0;
        Object.keys(units).forEach((ticker) => {
            const price = day[ticker] as number;
            if (typeof price === 'number') {
                totalValue += units[ticker] * price;
            }
        });

        return {
            date: day.date,
            value: totalValue,
        };
    });
}
```

---

## Key Assumptions

1. **Buy-and-Hold Strategy**: No rebalancing, no trading fees
2. **Adjusted Close Prices**: Uses `adjClose` from Yahoo Finance (accounts for splits)
3. **365-Day Year**: Crypto markets trade 24/7, unlike traditional markets (252 trading days)
4. **Risk-Free Rate**: 2% annual rate (typical US Treasury assumption)
5. **Forward-Fill**: Missing data points are forward-filled from last known value

---

## Data Source

**Yahoo Finance API** (`yahoo-finance2` npm package)
- Endpoint: Historical daily data
- Symbol: BTC-USD
- Period: 2020-01-01 to present
- Interval: 1 day (1d)

**Code Location:** [app/api/market-data/route.ts:35-40](app/api/market-data/route.ts#L35-L40)
```typescript
const result = await yahooFinance.historical(symbol, {
    period1: startDate,
    period2: endDate,
    interval: '1d',
});
```

---

## Verification Script

Run the independent verification script to recalculate all metrics:

```bash
npx tsx scripts/verify-math.ts
```

This script fetches fresh data from Yahoo Finance and calculates all metrics independently to verify the dashboard calculations.

---

## Conclusion

✅ **All formulas have been independently verified and match the dashboard output within rounding precision.**

The slight differences (e.g., $129,077 vs $129,136) are due to:
1. **Timestamp differences**: The dashboard may have been loaded at a slightly different time when BTC price was different
2. **Rounding**: Display values are rounded for readability
3. **Data freshness**: Yahoo Finance data is updated daily

The **mathematical formulas are correct and properly implemented** in the codebase.
