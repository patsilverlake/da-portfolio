import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getAssetByTicker } from "@/lib/crypto-assets";

interface AssetAllocatorProps {
    selectedAssets: string[];
    weights: { [ticker: string]: number };
    onWeightChange: (ticker: string, value: number) => void;
    className?: string;
}

export function AssetAllocator({ selectedAssets, weights, onWeightChange, className }: AssetAllocatorProps) {
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    const isInvalid = totalWeight !== 100;

    return (
        <Card className={cn("w-full border-0 shadow-sm", className)}>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex justify-between items-center">
                    Asset Allocation
                    <Badge
                        variant={isInvalid ? "destructive" : "default"}
                        className="font-mono"
                    >
                        {totalWeight.toFixed(0)}%
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {selectedAssets.map((ticker) => {
                    const asset = getAssetByTicker(ticker);
                    const label = asset ? `${asset.name} (${asset.symbol})` : ticker;
                    const color = asset?.color || 'bg-gray-500';

                    return (
                        <div key={ticker} className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2">
                                    <div className={cn("w-3 h-3 rounded-full", color)} />
                                    {label}
                                </Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        value={weights[ticker]}
                                        onChange={(e) => onWeightChange(ticker, Number(e.target.value))}
                                        className="w-16 h-8 text-right"
                                        min={0}
                                        max={100}
                                    />
                                    <span className="text-sm text-muted-foreground">%</span>
                                </div>
                            </div>
                            <Slider
                                value={[weights[ticker]]}
                                onValueChange={(val) => onWeightChange(ticker, val[0])}
                                max={100}
                                step={1}
                                className={cn("w-full cursor-pointer")}
                            />
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
