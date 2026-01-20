import { calculateMetrics, calculatePortfolioHistory } from '../lib/finance';

// Mock Data: Steady 10% daily growth (unrealistic but good for math check)
// Day 0: 100
// Day 1: 110
// Day 2: 121
const mockData = [
    { date: '2020-01-01', BTC: 100 },
    { date: '2020-01-02', BTC: 110 },
    { date: '2020-01-03', BTC: 121 },
];

const weights = { BTC: 100 };
const initial = 1000;

console.log('Running Verification...');

const history = calculatePortfolioHistory(mockData as any, weights, initial);

console.log('History Length:', history.length);
console.log('Day 0 Value:', history[0].value, '(Expected 1000)');
console.log('Day 2 Value:', history[2].value, '(Expected 1210)');

const metrics = calculateMetrics(history, initial);
console.log('Total Return:', metrics.totalReturn, '(Expected 0.21)');

// Time diff is 2 days. Normalized to years: 2/365
const years = 2 / 365;
const expectedCAGR = Math.pow(1210 / 1000, 1 / years) - 1;
console.log('CAGR:', metrics.cagr, `(Expected ~${expectedCAGR})`);
console.log('Calculated CAGR matches formula:', Math.abs(metrics.cagr - expectedCAGR) < 0.0001);

if (Math.abs(metrics.totalReturn - 0.21) < 0.0001) {
    console.log('SUCCESS: Basic calculations verified.');
} else {
    console.error('FAILURE: Calculation mismatch.');
}
