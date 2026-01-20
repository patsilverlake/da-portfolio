"use client"

import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    LineChart,
    Line,
    ReferenceLine
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { RollingMetricsData } from "@/lib/finance";

interface PerformanceChartTabsProps {
    portfolioData: { date: string; value: number }[];
    rollingMetrics: RollingMetricsData[];
    className?: string;
}

export function PerformanceChartTabs({ portfolioData, rollingMetrics, className }: PerformanceChartTabsProps) {
    // Format dates for axis
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString(undefined, { year: '2-digit', month: 'short' });
    };

    // Format currency for axis
    const formatCurrency = (val: number) => {
        if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
        return `$${val}`;
    };

    // Format percentage for volatility axis
    const formatPercent = (val: number) => {
        return `${(val * 100).toFixed(0)}%`;
    };

    // Format Sharpe ratio for axis
    const formatSharpe = (val: number) => {
        return val.toFixed(1);
    };

    const PortfolioTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/90 dark:bg-black/90 p-3 border border-zinc-200 dark:border-zinc-800 rounded shadow-lg text-sm">
                    <p className="font-semibold mb-1">{new Date(label).toLocaleDateString()}</p>
                    <p className="text-green-600 font-mono">
                        ${payload[0].value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                </div>
            );
        }
        return null;
    };

    const SharpeTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length && payload[0].value !== null) {
            return (
                <div className="bg-white/90 dark:bg-black/90 p-3 border border-zinc-200 dark:border-zinc-800 rounded shadow-lg text-sm">
                    <p className="font-semibold mb-1">{new Date(label).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}</p>
                    <p className="text-blue-600 font-mono">
                        Sharpe: {payload[0].value.toFixed(2)}
                    </p>
                </div>
            );
        }
        return null;
    };

    const VolatilityTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length && payload[0].value !== null) {
            return (
                <div className="bg-white/90 dark:bg-black/90 p-3 border border-zinc-200 dark:border-zinc-800 rounded shadow-lg text-sm">
                    <p className="font-semibold mb-1">{new Date(label).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}</p>
                    <p className="text-orange-600 font-mono">
                        Volatility: {(payload[0].value * 100).toFixed(1)}%
                    </p>
                </div>
            );
        }
        return null;
    };

    const hasRollingData = rollingMetrics.length > 0;

    return (
        <Card className={cn("w-full h-[400px] border-0 shadow-sm", className)}>
            <Tabs defaultValue="growth" className="h-full flex flex-col">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Performance</CardTitle>
                        <TabsList className="h-8">
                            <TabsTrigger value="growth" className="text-xs px-3">
                                Portfolio Growth
                            </TabsTrigger>
                            <TabsTrigger value="sharpe" className="text-xs px-3" disabled={!hasRollingData}>
                                Rolling Sharpe
                            </TabsTrigger>
                            <TabsTrigger value="volatility" className="text-xs px-3" disabled={!hasRollingData}>
                                Rolling Volatility
                            </TabsTrigger>
                        </TabsList>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 pb-4">
                    <TabsContent value="growth" className="h-[300px] mt-0">
                        {portfolioData.length === 0 ? (
                            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                                Loading data...
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={portfolioData}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={formatDate}
                                        minTickGap={50}
                                        tick={{ fontSize: 12, fill: '#888' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tickFormatter={formatCurrency}
                                        tick={{ fontSize: 12, fill: '#888' }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={60}
                                    />
                                    <Tooltip content={<PortfolioTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#16a34a"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorValue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </TabsContent>

                    <TabsContent value="sharpe" className="h-[300px] mt-0">
                        {!hasRollingData ? (
                            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                                Need at least 12 months of data for rolling metrics
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={rollingMetrics}>
                                    <defs>
                                        <linearGradient id="colorSharpe" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={formatDate}
                                        minTickGap={50}
                                        tick={{ fontSize: 12, fill: '#888' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tickFormatter={formatSharpe}
                                        tick={{ fontSize: 12, fill: '#888' }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={40}
                                        domain={['auto', 'auto']}
                                    />
                                    <Tooltip content={<SharpeTooltip />} />
                                    <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
                                    <Line
                                        type="monotone"
                                        dataKey="sharpeRatio"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        dot={false}
                                        connectNulls
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                        <p className="text-xs text-muted-foreground text-center mt-1">
                            1-Year Rolling Sharpe Ratio (3% risk-free rate)
                        </p>
                    </TabsContent>

                    <TabsContent value="volatility" className="h-[300px] mt-0">
                        {!hasRollingData ? (
                            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                                Need at least 12 months of data for rolling metrics
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={rollingMetrics}>
                                    <defs>
                                        <linearGradient id="colorVolatility" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={formatDate}
                                        minTickGap={50}
                                        tick={{ fontSize: 12, fill: '#888' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tickFormatter={formatPercent}
                                        tick={{ fontSize: 12, fill: '#888' }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={50}
                                        domain={[0, 'auto']}
                                    />
                                    <Tooltip content={<VolatilityTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="volatility"
                                        stroke="#f97316"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorVolatility)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                        <p className="text-xs text-muted-foreground text-center mt-1">
                            1-Year Rolling Annualized Volatility
                        </p>
                    </TabsContent>
                </CardContent>
            </Tabs>
        </Card>
    );
}
