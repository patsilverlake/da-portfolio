export interface CryptoAsset {
    ticker: string;      // e.g., "BTC-USD"
    name: string;        // e.g., "Bitcoin"
    symbol: string;      // e.g., "BTC"
    color: string;       // Tailwind color class for UI
    marketCapRank: number; // For sorting/filtering
}

export const AVAILABLE_CRYPTO_ASSETS: CryptoAsset[] = [
    { ticker: 'BTC-USD', name: 'Bitcoin', symbol: 'BTC', color: 'bg-orange-500', marketCapRank: 1 },
    { ticker: 'ETH-USD', name: 'Ethereum', symbol: 'ETH', color: 'bg-blue-600', marketCapRank: 2 },
    { ticker: 'BNB-USD', name: 'BNB', symbol: 'BNB', color: 'bg-yellow-500', marketCapRank: 4 },
    { ticker: 'SOL-USD', name: 'Solana', symbol: 'SOL', color: 'bg-purple-500', marketCapRank: 5 },
    { ticker: 'XRP-USD', name: 'Ripple', symbol: 'XRP', color: 'bg-black', marketCapRank: 6 },
    { ticker: 'DOGE-USD', name: 'Dogecoin', symbol: 'DOGE', color: 'bg-yellow-400', marketCapRank: 8 },
    { ticker: 'ADA-USD', name: 'Cardano', symbol: 'ADA', color: 'bg-blue-400', marketCapRank: 10 },
    { ticker: 'AVAX-USD', name: 'Avalanche', symbol: 'AVAX', color: 'bg-red-500', marketCapRank: 11 },
    { ticker: 'DOT-USD', name: 'Polkadot', symbol: 'DOT', color: 'bg-pink-500', marketCapRank: 12 },
    { ticker: 'MATIC-USD', name: 'Polygon', symbol: 'MATIC', color: 'bg-indigo-600', marketCapRank: 13 },
    { ticker: 'LINK-USD', name: 'Chainlink', symbol: 'LINK', color: 'bg-blue-500', marketCapRank: 14 },
    { ticker: 'UNI7083-USD', name: 'Uniswap', symbol: 'UNI', color: 'bg-pink-600', marketCapRank: 20 },
    { ticker: 'ATOM-USD', name: 'Cosmos', symbol: 'ATOM', color: 'bg-gray-700', marketCapRank: 25 },
    { ticker: 'LTC-USD', name: 'Litecoin', symbol: 'LTC', color: 'bg-gray-400', marketCapRank: 15 },
    { ticker: 'TRX-USD', name: 'Tron', symbol: 'TRX', color: 'bg-red-600', marketCapRank: 16 },
];

export function getAssetByTicker(ticker: string): CryptoAsset | undefined {
    return AVAILABLE_CRYPTO_ASSETS.find(a => a.ticker === ticker);
}
