import { PortfolioConfig, SavedPortfolios } from './types';

const STORAGE_KEY = 'crypto-portfolio-configs';
const MAX_CONFIGS = 10; // Limit to prevent localStorage overflow

export function savePortfolioConfig(config: Omit<PortfolioConfig, 'id' | 'createdAt' | 'lastModified'>): PortfolioConfig {
    const savedData = getSavedPortfolios();

    const newConfig: PortfolioConfig = {
        ...config,
        id: `portfolio-${Date.now()}`,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
    };

    // Enforce limit
    if (savedData.configurations.length >= MAX_CONFIGS) {
        savedData.configurations.shift(); // Remove oldest
    }

    savedData.configurations.push(newConfig);

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));
        return newConfig;
    } catch (error) {
        // Handle quota exceeded error
        console.error('Failed to save portfolio:', error);
        throw new Error('Storage quota exceeded. Please delete old portfolios.');
    }
}

export function getSavedPortfolios(): SavedPortfolios {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return { configurations: [] };
        return JSON.parse(data);
    } catch (error) {
        console.error('Failed to load portfolios:', error);
        return { configurations: [] };
    }
}

export function deletePortfolioConfig(id: string): void {
    const savedData = getSavedPortfolios();
    savedData.configurations = savedData.configurations.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));
}

export function updatePortfolioConfig(id: string, updates: Partial<PortfolioConfig>): void {
    const savedData = getSavedPortfolios();
    const index = savedData.configurations.findIndex(c => c.id === id);

    if (index !== -1) {
        savedData.configurations[index] = {
            ...savedData.configurations[index],
            ...updates,
            lastModified: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));
    }
}

// Estimate storage usage
export function getStorageStats(): { used: number; limit: number; percentage: number } {
    const data = localStorage.getItem(STORAGE_KEY) || '';
    const used = new Blob([data]).size;
    const limit = 5 * 1024 * 1024; // 5MB typical limit
    return {
        used,
        limit,
        percentage: (used / limit) * 100,
    };
}
