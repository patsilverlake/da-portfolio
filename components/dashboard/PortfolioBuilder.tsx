"use client"

import { useState, useEffect, useMemo } from "react";
import { AssetAllocator } from "./AssetAllocator";
import { AssetSearch } from "./AssetSearch";
import { PortfolioManager } from "./PortfolioManager";
import { PerformanceChartTabs } from "./PerformanceChartTabs";
import { AssetWarningBanner } from "./AssetWarningBanner";
import { MonthlyPerformance } from "./MonthlyPerformance";
import { calculateMetrics, calculatePortfolioHistory, calculateRollingMetrics, DailyData, validateAssetsForDateRange } from "@/lib/finance";
import { PortfolioConfig } from "@/lib/types";
import type { AssetValidation, RebalanceFrequency } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, Activity, AlertTriangle, Zap, Download, FileText, FileSpreadsheet } from "lucide-react";
import { exportToCSV, exportToPDF } from "@/lib/export";

// Predefined portfolio presets
const PORTFOLIO_PRESETS: Array<{
    id: string;
    name: string;
    description: string;
    startDate: string;
    selectedAssets: string[];
    weights: { [ticker: string]: number };
}> = [
    {
        id: 'btc-only',
        name: 'BTC Only',
        description: 'Bitcoin 100%',
        startDate: '2021-01-01',
        selectedAssets: ['BTC-USD'],
        weights: { 'BTC-USD': 100 },
    },
    {
        id: 'btc-eth',
        name: 'BTC + ETH',
        description: 'Bitcoin 70%, Ethereum 30%',
        startDate: '2021-01-01',
        selectedAssets: ['BTC-USD', 'ETH-USD'],
        weights: { 'BTC-USD': 70, 'ETH-USD': 30 },
    },
    {
        id: 'btc-eth-sol',
        name: 'BTC + ETH + SOL',
        description: 'Bitcoin 60%, Ethereum 30%, Solana 10%',
        startDate: '2021-01-01',
        selectedAssets: ['BTC-USD', 'ETH-USD', 'SOL-USD'],
        weights: { 'BTC-USD': 60, 'ETH-USD': 30, 'SOL-USD': 10 },
    },
];

export function PortfolioBuilder() {
    const [marketData, setMarketData] = useState<DailyData[]>([]);
    const [loading, setLoading] = useState(true);
    const [initialInvestment, setInitialInvestment] = useState(10000);
    const [startDate, setStartDate] = useState('2020-01-01');
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [dateError, setDateError] = useState('');
    const [assetValidation, setAssetValidation] = useState<AssetValidation | null>(null);
    const [showWarning, setShowWarning] = useState(true);
    const [selectedAssets, setSelectedAssets] = useState<string[]>([
        'BTC-USD', 'ETH-USD', 'SOL-USD'
    ]);
    const [weights, setWeights] = useState<{ [ticker: string]: number }>({
        "BTC-USD": 40,
        "ETH-USD": 35,
        "SOL-USD": 25,
    });
    const [rebalanceFrequency, setRebalanceFrequency] = useState<RebalanceFrequency>('none');
    const [exportingPDF, setExportingPDF] = useState(false);
    const [exportingCSV, setExportingCSV] = useState(false);

    const validateDates = (start: string, end: string): string => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const today = new Date();
        const minDate = new Date('2020-01-01');

        if (startDate < minDate) {
            return 'Start date cannot be before 2020-01-01';
        }
        if (endDate > today) {
            return 'End date cannot be in the future';
        }
        if (startDate >= endDate) {
            return 'Start date must be before end date';
        }

        const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
        if (daysDiff < 30) {
            return 'Date range must be at least 30 days';
        }

        return '';
    };

    const handlePresetDateRange = (preset: string) => {
        const today = new Date();
        const end = today.toISOString().split('T')[0];
        let start = '2020-01-01';

        switch (preset) {
            case 'YTD':
                start = `${today.getFullYear()}-01-01`;
                break;
            case '1Y':
                const oneYearAgo = new Date(today);
                oneYearAgo.setFullYear(today.getFullYear() - 1);
                start = oneYearAgo.toISOString().split('T')[0];
                break;
            case '3Y':
                const threeYearsAgo = new Date(today);
                threeYearsAgo.setFullYear(today.getFullYear() - 3);
                start = threeYearsAgo.toISOString().split('T')[0];
                break;
            case '5Y':
                const fiveYearsAgo = new Date(today);
                fiveYearsAgo.setFullYear(today.getFullYear() - 5);
                start = fiveYearsAgo.toISOString().split('T')[0];
                break;
            case 'MAX':
                start = '2020-01-01';
                break;
        }

        setStartDate(start);
        setEndDate(end);
    };

    useEffect(() => {
        async function fetchData() {
            const error = validateDates(startDate, endDate);
            if (error) {
                setDateError(error);
                setLoading(false);
                return;
            }
            setDateError('');

            try {
                const assetsParam = selectedAssets.join(',');
                const res = await fetch(
                    `/api/market-data?startDate=${startDate}&endDate=${endDate}&assets=${assetsParam}`
                );
                if (!res.ok) throw new Error('Failed to fetch data');
                const data = await res.json();
                setMarketData(data);

                // Validate assets for date range
                const validation = validateAssetsForDateRange(data, weights);
                setAssetValidation(validation);

                // Filter weights to only include valid assets
                if (!validation.valid) {
                    const filteredWeights: { [ticker: string]: number } = {};
                    validation.validAssets.forEach(ticker => {
                        if (weights[ticker]) {
                            filteredWeights[ticker] = weights[ticker];
                        }
                    });
                    setWeights(filteredWeights);
                    setShowWarning(true);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [selectedAssets, startDate, endDate]);

    const handleWeightChange = (ticker: string, newValue: number) => {
        setWeights(prev => ({ ...prev, [ticker]: newValue }));
    };

    const handleAddAsset = (ticker: string) => {
        if (!selectedAssets.includes(ticker)) {
            setSelectedAssets(prev => [...prev, ticker]);
            setWeights(prev => ({ ...prev, [ticker]: 0 }));
        }
    };

    const handleRemoveAsset = (ticker: string) => {
        if (selectedAssets.length <= 1) return; // Prevent removing last asset
        setSelectedAssets(prev => prev.filter(t => t !== ticker));
        setWeights(prev => {
            const newWeights = { ...prev };
            delete newWeights[ticker];
            return newWeights;
        });
    };

    const handleLoadConfig = (config: PortfolioConfig) => {
        setSelectedAssets(config.selectedAssets);
        setWeights(config.weights);
        setInitialInvestment(config.initialInvestment);
        if (config.startDate) setStartDate(config.startDate);
        if (config.endDate) setEndDate(config.endDate);
        if (config.rebalanceFrequency) setRebalanceFrequency(config.rebalanceFrequency);
    };

    const handleLoadPreset = (presetId: string) => {
        const preset = PORTFOLIO_PRESETS.find(p => p.id === presetId);
        if (!preset) return;

        setSelectedAssets(preset.selectedAssets);
        setWeights(preset.weights);
        setStartDate(preset.startDate);
        setEndDate(new Date().toISOString().split('T')[0]);
        setRebalanceFrequency('none');
        setLoading(true);
    };

    const handleExportCSV = async () => {
        setExportingCSV(true);
        try {
            // We need to wait for metrics to be calculated
            const exportData = {
                portfolioName: `Portfolio ${startDate} to ${endDate}`,
                startDate,
                endDate,
                initialInvestment,
                selectedAssets,
                weights,
                metrics,
                marketData,
                rebalanceFrequency
            };
            exportToCSV(exportData);
        } catch (error) {
            console.error('Error exporting CSV:', error);
        } finally {
            setExportingCSV(false);
        }
    };

    const handleExportPDF = async () => {
        setExportingPDF(true);
        try {
            await exportToPDF('dashboard-content', `portfolio-snapshot-${startDate}-to-${endDate}.pdf`);
        } catch (error) {
            console.error('Error exporting PDF:', error);
        } finally {
            setExportingPDF(false);
        }
    };

    const chartData = useMemo(() => {
        return calculatePortfolioHistory(marketData, weights, initialInvestment, rebalanceFrequency);
    }, [marketData, weights, initialInvestment, rebalanceFrequency]);

    const metrics = useMemo(() => {
        // Extract S&P 500 data if available - check if any day has S&P 500 data
        const hasSp500Data = marketData.length > 0 && marketData.some(day => {
            const val = day['^GSPC'] as number;
            return val && val > 0;
        });

        const sp500Data = hasSp500Data
            ? marketData
                .filter(day => {
                    const val = day['^GSPC'] as number;
                    return val && val > 0;
                })
                .map(day => ({
                    date: day.date,
                    value: day['^GSPC'] as number
                }))
            : undefined;

        return calculateMetrics(chartData, initialInvestment, sp500Data);
    }, [chartData, initialInvestment, marketData]);

    const rollingMetrics = useMemo(() => {
        return calculateRollingMetrics(chartData);
    }, [chartData]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
                <div className="flex flex-col items-center gap-6">
                    {/* Animated chart */}
                    <div className="relative w-48 h-24">
                        <svg viewBox="0 0 160 64" className="w-full h-full overflow-visible">
                            {/* Subtle grid */}
                            <line x1="0" y1="16" x2="160" y2="16" stroke="#e2e8f0" strokeWidth="0.5" />
                            <line x1="0" y1="32" x2="160" y2="32" stroke="#e2e8f0" strokeWidth="0.5" />
                            <line x1="0" y1="48" x2="160" y2="48" stroke="#e2e8f0" strokeWidth="0.5" />

                            {/* Green gradient fill under the line */}
                            <defs>
                                <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.15" />
                                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                                </linearGradient>
                                <clipPath id="chartClip">
                                    <rect x="0" y="0" width="160" height="64">
                                        <animate
                                            attributeName="width"
                                            from="0"
                                            to="160"
                                            dur="1.5s"
                                            repeatCount="indefinite"
                                        />
                                    </rect>
                                </clipPath>
                            </defs>

                            {/* Area fill */}
                            <path
                                d="M0,48 Q20,44 40,40 T80,32 T120,20 T160,8 L160,64 L0,64 Z"
                                fill="url(#greenGradient)"
                                clipPath="url(#chartClip)"
                            />

                            {/* Animated green line going up to top-right */}
                            <path
                                d="M0,48 Q20,44 40,40 T80,32 T120,20 T160,8"
                                fill="none"
                                stroke="#22c55e"
                                strokeWidth="2"
                                strokeLinecap="round"
                                clipPath="url(#chartClip)"
                            />

                            {/* Moving dot at the end */}
                            <circle r="4" fill="#22c55e">
                                <animateMotion
                                    dur="1.5s"
                                    repeatCount="indefinite"
                                    path="M0,48 Q20,44 40,40 T80,32 T120,20 T160,8"
                                />
                            </circle>
                        </svg>
                    </div>

                    {/* Loading text */}
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-base font-medium text-slate-700">
                            Loading Market Data
                        </p>
                        <p className="text-sm text-slate-400">
                            Fetching latest prices...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const StatCard = ({ title, value, icon: Icon, subtext, color }: any) => (
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200 bg-gradient-to-br from-card to-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80">{title}</CardTitle>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${color === "text-green-600" ? "from-green-500/10 to-green-600/10" : color === "text-blue-600" ? "from-blue-500/10 to-blue-600/10" : color === "text-orange-500" ? "from-orange-500/10 to-orange-600/10" : "from-muted/50 to-muted/30"}`}>
                    <Icon className={`h-4 w-4 ${color || "text-muted-foreground"}`} />
                </div>
            </CardHeader>
            <CardContent className="pt-1">
                <div className="text-2xl font-bold metric-value tracking-tight">{value}</div>
                {subtext && <p className="text-xs text-muted-foreground/70 mt-1.5">{subtext}</p>}
            </CardContent>
        </Card>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            <div className="container mx-auto p-6 space-y-6 max-w-7xl">
                {/* Header */}
                <div className="space-y-2 pb-4">
                    <h1 className="text-3xl font-bold tracking-tight">Portfolio Dashboard</h1>
                    <p className="text-muted-foreground">Analyze and optimize your cryptocurrency investments</p>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar Controls */}
                <div className="w-full md:w-1/3 space-y-4">
                    <Card className="border-0 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Investment Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Initial Investment ($)</Label>
                                <Input
                                    type="number"
                                    value={initialInvestment}
                                    onChange={(e) => setInitialInvestment(Number(e.target.value))}
                                    className="h-10 font-mono"
                                />
                            </div>

                            {/* Preset Date Range Buttons */}
                            <div className="space-y-2">
                                <Label>Quick Date Ranges</Label>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePresetDateRange('YTD')}
                                        disabled={loading}
                                        className="text-xs"
                                    >
                                        YTD
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePresetDateRange('1Y')}
                                        disabled={loading}
                                        className="text-xs"
                                    >
                                        1 Year
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePresetDateRange('3Y')}
                                        disabled={loading}
                                        className="text-xs"
                                    >
                                        3 Years
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePresetDateRange('5Y')}
                                        disabled={loading}
                                        className="text-xs"
                                    >
                                        5 Years
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePresetDateRange('MAX')}
                                        disabled={loading}
                                        className="text-xs"
                                    >
                                        Max
                                    </Button>
                                </div>
                            </div>

                            {/* Manual Date Inputs */}
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    min="2020-01-01"
                                    max={endDate}
                                    disabled={loading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    min={startDate}
                                    max={new Date().toISOString().split('T')[0]}
                                    disabled={loading}
                                />
                            </div>

                            {dateError && (
                                <div className="text-sm text-red-500 flex items-center gap-1">
                                    <AlertTriangle className="h-4 w-4" />
                                    {dateError}
                                </div>
                            )}

                            {/* Rebalancing Frequency */}
                            <div className="space-y-2">
                                <Label>Rebalancing Strategy</Label>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        variant={rebalanceFrequency === 'none' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setRebalanceFrequency('none')}
                                        disabled={loading}
                                        className="text-xs"
                                    >
                                        None
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={rebalanceFrequency === 'quarterly' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setRebalanceFrequency('quarterly')}
                                        disabled={loading}
                                        className="text-xs"
                                    >
                                        Quarterly
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={rebalanceFrequency === 'annually' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setRebalanceFrequency('annually')}
                                        disabled={loading}
                                        className="text-xs"
                                    >
                                        Annually
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {rebalanceFrequency === 'none' && 'No rebalancing - weights drift over time'}
                                    {rebalanceFrequency === 'quarterly' && 'Rebalances to target weights every quarter'}
                                    {rebalanceFrequency === 'annually' && 'Rebalances to target weights every year'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <AssetSearch
                        selectedAssets={selectedAssets}
                        onAddAsset={handleAddAsset}
                        onRemoveAsset={handleRemoveAsset}
                    />

                    <AssetAllocator
                        selectedAssets={selectedAssets}
                        weights={weights}
                        onWeightChange={handleWeightChange}
                    />

                    {/* Portfolio Presets */}
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/5 to-primary/10">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Zap className="h-4 w-4 text-primary" />
                                Quick Start Presets
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <p className="text-xs text-muted-foreground mb-3">
                                Load a predefined portfolio (Jan 2021 to Present)
                            </p>
                            <div className="grid gap-2">
                                {PORTFOLIO_PRESETS.map(preset => (
                                    <Button
                                        key={preset.id}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleLoadPreset(preset.id)}
                                        disabled={loading}
                                        className="w-full justify-start h-auto py-2 px-3 hover:bg-primary/10 hover:border-primary/50"
                                    >
                                        <div className="flex flex-col items-start">
                                            <span className="font-medium">{preset.name}</span>
                                            <span className="text-xs text-muted-foreground">{preset.description}</span>
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <PortfolioManager
                        currentConfig={{
                            id: '',
                            name: '',
                            selectedAssets,
                            weights,
                            initialInvestment,
                            startDate,
                            endDate,
                            rebalanceFrequency,
                            createdAt: new Date().toISOString(),
                            lastModified: new Date().toISOString(),
                        }}
                        onLoadConfig={handleLoadConfig}
                    />
                </div>

                {/* Main Content */}
                <div className="w-full md:w-2/3 space-y-4">
                    {/* Export Buttons */}
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportCSV}
                            disabled={loading || exportingCSV}
                            className="gap-2"
                        >
                            <FileSpreadsheet className="h-4 w-4" />
                            {exportingCSV ? 'Exporting...' : 'Export CSV'}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportPDF}
                            disabled={loading || exportingPDF}
                            className="gap-2"
                        >
                            <FileText className="h-4 w-4" />
                            {exportingPDF ? 'Generating...' : 'Export PDF'}
                        </Button>
                    </div>

                    {/* Dashboard Content for PDF Export */}
                    <div id="dashboard-content" className="space-y-4 bg-background p-4 rounded-lg">
                    {/* Asset Warning Banner */}
                    {assetValidation && !assetValidation.valid && showWarning && (
                        <AssetWarningBanner
                            invalidAssets={assetValidation.invalidAssets}
                            startDate={startDate}
                            earliestValidDate={assetValidation.earliestValidDate}
                            onDismiss={() => setShowWarning(false)}
                        />
                    )}

                    {/* Key Metrics Section */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-muted-foreground">
                                Performance Metrics
                            </h3>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                {new Date(startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })} - {new Date(endDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <StatCard
                                title="Final Balance"
                                value={`$${metrics.finalBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                                icon={DollarSign}
                                subtext={`Returns: ${(metrics.totalReturn * 100).toFixed(1)}%`}
                                color="text-green-600"
                            />
                            <StatCard
                                title="Annualized (CAGR)"
                                value={`${(metrics.cagr * 100).toFixed(1)}%`}
                                icon={TrendingUp}
                                color="text-blue-600"
                            />
                            <StatCard
                                title="Sharpe Ratio"
                                value={metrics.sharpeRatio.toFixed(2)}
                                icon={Activity}
                                subtext="Risk Adjusted (3% RFR)"
                            />
                            <StatCard
                                title="Volatility"
                                value={`${(metrics.volatility * 100).toFixed(1)}%`}
                                icon={AlertTriangle}
                                color="text-orange-500"
                            />
                            <StatCard
                                title="S&P 500 Correl."
                                value={metrics.sp500Correlation !== undefined ? metrics.sp500Correlation.toFixed(2) : 'N/A'}
                                icon={Activity}
                                color={
                                    metrics.sp500Correlation === undefined ? "text-gray-400" :
                                    metrics.sp500Correlation > 0.7 ? "text-blue-600" :
                                    metrics.sp500Correlation > 0.3 ? "text-gray-600" :
                                    "text-orange-500"
                                }
                                subtext={
                                    metrics.sp500Correlation === undefined ? "Unavailable" :
                                    metrics.sp500Correlation > 0.7 ? "High correlation" :
                                    metrics.sp500Correlation > 0.3 ? "Moderate" :
                                    "Low correlation"
                                }
                            />
                        </div>
                    </div>

                    <PerformanceChartTabs portfolioData={chartData} rollingMetrics={rollingMetrics} />

                    {/* Additional Stats */}
                    <div className="grid grid-cols-3 gap-3">
                        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200 bg-gradient-to-br from-card to-card/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80">Max Drawdown</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-1">
                                <div className="text-xl font-bold metric-value text-red-500">
                                    -{(metrics.maxDrawdown * 100).toFixed(1)}%
                                </div>
                                <p className="text-xs text-muted-foreground/70 mt-1.5">Peak to Trough</p>
                            </CardContent>
                        </Card>
                        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200 bg-gradient-to-br from-card to-card/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80">Best Day</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-1">
                                <div className="text-xl font-bold metric-value text-green-600">
                                    +{(metrics.bestDay * 100).toFixed(2)}%
                                </div>
                                <p className="text-xs text-muted-foreground/70 mt-1.5">Largest Daily Gain</p>
                            </CardContent>
                        </Card>
                        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200 bg-gradient-to-br from-card to-card/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80">Worst Day</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-1">
                                <div className="text-xl font-bold metric-value text-red-600">
                                    {(metrics.worstDay * 100).toFixed(2)}%
                                </div>
                                <p className="text-xs text-muted-foreground/70 mt-1.5">Largest Daily Loss</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Monthly Performance */}
                    {metrics.monthlyStats && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Monthly Performance Breakdown</h3>
                            <MonthlyPerformance monthlyStats={metrics.monthlyStats} />
                        </div>
                    )}
                    </div>
                    {/* End of dashboard-content */}
                </div>
            </div>
            </div>
        </div>
    );
}
