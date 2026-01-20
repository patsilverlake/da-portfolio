"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";
import type { MonthlyStats } from "@/lib/types";

interface MonthlyPerformanceProps {
    monthlyStats: MonthlyStats;
}

export function MonthlyPerformance({ monthlyStats }: MonthlyPerformanceProps) {
    const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;
    const formatMonth = (month: string) => {
        const [year, monthNum] = month.split('-');
        const date = new Date(parseInt(year), parseInt(monthNum) - 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    // Get last 12 months or all if less than 12
    const recentMonths = monthlyStats.monthlyData.slice(-12).reverse();

    return (
        <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-card/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80">
                            Avg Monthly Return
                        </CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="pt-1">
                        <div className={`text-2xl font-bold ${monthlyStats.averageReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercent(monthlyStats.averageReturn)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-card/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80">
                            Up Months
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent className="pt-1">
                        <div className="text-2xl font-bold text-green-600">
                            {monthlyStats.upMonths}
                        </div>
                        <p className="text-xs text-muted-foreground/70 mt-1.5">
                            {monthlyStats.downMonths} down months
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-card/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80">
                            Best / Worst Month
                        </CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent className="pt-1">
                        <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Best:</span>
                                <span className="font-semibold text-green-600">
                                    {formatPercent(monthlyStats.bestMonth.return)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Worst:</span>
                                <span className="font-semibold text-red-600">
                                    {formatPercent(monthlyStats.worstMonth.return)}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Monthly Table */}
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Recent Monthly Performance</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Month</th>
                                    <th className="text-right py-2 px-2 font-medium text-muted-foreground">Return</th>
                                    <th className="text-right py-2 px-2 font-medium text-muted-foreground">Start Value</th>
                                    <th className="text-right py-2 px-2 font-medium text-muted-foreground">End Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentMonths.map((month) => (
                                    <tr key={month.month} className="border-b last:border-0">
                                        <td className="py-2 px-2">{formatMonth(month.month)}</td>
                                        <td className={`text-right py-2 px-2 font-medium ${month.return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatPercent(month.return)}
                                        </td>
                                        <td className="text-right py-2 px-2 text-muted-foreground">
                                            ${month.startValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                        </td>
                                        <td className="text-right py-2 px-2 text-muted-foreground">
                                            ${month.endValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
