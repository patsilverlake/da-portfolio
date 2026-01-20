"use client"

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PerformanceChartProps {
    data: { date: string; value: number }[];
    className?: string;
}

export function PerformanceChart({ data, className }: PerformanceChartProps) {
    // Format dates for axis
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString(undefined, { year: '2-digit', month: 'short' });
    };

    // Format currency for axis
    const formatCurrency = (val: number) => {
        // Use K/M for large numbers
        if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
        return `$${val}`;
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
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

    return (
        <Card className={cn("w-full h-[400px] border-0 shadow-sm", className)}>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">Portfolio Growth</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px] w-full">
                {data.length === 0 ? (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                        Loading data...
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
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
                            <Tooltip content={<CustomTooltip />} />
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
            </CardContent>
        </Card>
    );
}
