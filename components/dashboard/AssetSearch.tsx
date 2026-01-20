"use client"

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AVAILABLE_CRYPTO_ASSETS, getAssetByTicker } from "@/lib/crypto-assets";
import { cn } from "@/lib/utils";
import { Search, X, ChevronDown } from "lucide-react";

interface AssetSearchProps {
    selectedAssets: string[];
    onAddAsset: (ticker: string) => void;
    onRemoveAsset: (ticker: string) => void;
}

export function AssetSearch({ selectedAssets, onAddAsset, onRemoveAsset }: AssetSearchProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    // Show all available (non-selected) assets when no search term, otherwise filter
    const filteredAssets = useMemo(() => {
        const availableAssets = AVAILABLE_CRYPTO_ASSETS.filter(
            asset => !selectedAssets.includes(asset.ticker)
        );

        if (!searchTerm) {
            // Sort by market cap rank when showing all
            return availableAssets.sort((a, b) => a.marketCapRank - b.marketCapRank);
        }

        const term = searchTerm.toLowerCase();
        return availableAssets.filter(asset =>
            asset.name.toLowerCase().includes(term) ||
            asset.symbol.toLowerCase().includes(term)
        );
    }, [searchTerm, selectedAssets]);

    const handleSelectAsset = (ticker: string) => {
        onAddAsset(ticker);
        setSearchTerm('');
        setShowDropdown(false);
    };

    return (
        <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">Manage Assets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Selected Assets List */}
                <div className="space-y-2">
                    <Label>Selected Assets ({selectedAssets.length})</Label>
                    <div className="flex flex-wrap gap-2">
                        {selectedAssets.map(ticker => {
                            const asset = getAssetByTicker(ticker);
                            return (
                                <Badge
                                    key={ticker}
                                    variant="secondary"
                                    className="flex items-center gap-1.5 pl-2 pr-1 py-1"
                                >
                                    <div className={cn("w-2 h-2 rounded-full", asset?.color)} />
                                    <span>{asset?.symbol || ticker}</span>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => onRemoveAsset(ticker)}
                                        disabled={selectedAssets.length <= 1}
                                        className="h-4 w-4 ml-1 hover:bg-transparent hover:text-destructive"
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </Badge>
                            );
                        })}
                    </div>
                </div>

                {/* Search Input */}
                <div className="relative">
                    <Label>Add Asset</Label>
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search or browse assets..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setShowDropdown(true);
                            }}
                            onFocus={() => setShowDropdown(true)}
                            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                            className="pl-8 pr-8"
                        />
                        <ChevronDown
                            className={cn(
                                "absolute right-2 top-2.5 h-4 w-4 text-muted-foreground transition-transform cursor-pointer",
                                showDropdown && "rotate-180"
                            )}
                            onClick={() => setShowDropdown(!showDropdown)}
                        />
                    </div>

                    {/* Dropdown Results */}
                    {showDropdown && filteredAssets.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-64 overflow-auto">
                            <div className="px-3 py-2 text-xs text-muted-foreground border-b bg-muted/30">
                                {searchTerm
                                    ? `${filteredAssets.length} result${filteredAssets.length !== 1 ? 's' : ''}`
                                    : `${filteredAssets.length} available asset${filteredAssets.length !== 1 ? 's' : ''}`
                                }
                            </div>
                            {filteredAssets.map(asset => (
                                <Button
                                    key={asset.ticker}
                                    variant="ghost"
                                    onClick={() => handleSelectAsset(asset.ticker)}
                                    className="w-full px-3 py-2 h-auto justify-start gap-2 rounded-none hover:bg-accent"
                                >
                                    <div className={cn("w-3 h-3 rounded-full flex-shrink-0", asset.color)} />
                                    <span className="font-medium">{asset.symbol}</span>
                                    <span className="text-sm text-muted-foreground truncate">{asset.name}</span>
                                    <span className="ml-auto text-xs text-muted-foreground/60">#{asset.marketCapRank}</span>
                                </Button>
                            ))}
                        </div>
                    )}

                    {/* No results message */}
                    {showDropdown && searchTerm && filteredAssets.length === 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg">
                            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                                No assets found matching &quot;{searchTerm}&quot;
                            </div>
                        </div>
                    )}

                    {/* All assets selected message */}
                    {showDropdown && !searchTerm && filteredAssets.length === 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg">
                            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                                All available assets are selected
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
