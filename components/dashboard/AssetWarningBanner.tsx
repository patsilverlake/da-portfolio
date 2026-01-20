"use client"

import { AlertTriangle, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AssetWarningBannerProps {
    invalidAssets: string[];
    startDate: string;
    earliestValidDate: string;
    onDismiss?: () => void;
}

export function AssetWarningBanner({
    invalidAssets,
    startDate,
    earliestValidDate,
    onDismiss
}: AssetWarningBannerProps) {
    if (invalidAssets.length === 0) return null;

    return (
        <Card className="border-orange-500/50 bg-orange-500/10">
            <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                        <div className="space-y-2">
                            <p className="text-sm font-medium">
                                Some assets were not available on {startDate}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                The following assets have been excluded from the portfolio: {' '}
                                <span className="font-medium text-foreground">
                                    {invalidAssets.map(a => a.replace('-USD', '')).join(', ')}
                                </span>
                            </p>
                            {earliestValidDate && (
                                <p className="text-sm text-muted-foreground">
                                    <strong>Suggestion:</strong> Select a start date on or after{' '}
                                    <span className="font-medium text-foreground">{earliestValidDate}</span>
                                    {' '}to include all selected assets.
                                </p>
                            )}
                        </div>
                    </div>
                    {onDismiss && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={onDismiss}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
