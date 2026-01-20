"use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    getSavedPortfolios,
    savePortfolioConfig,
    deletePortfolioConfig
} from "@/lib/portfolio-storage";
import { PortfolioConfig } from "@/lib/types";
import { Save, FolderOpen, Trash2, Check } from "lucide-react";

interface PortfolioManagerProps {
    currentConfig: {
        id: string;
        name: string;
        selectedAssets: string[];
        weights: { [ticker: string]: number };
        initialInvestment: number;
        startDate?: string;
        endDate?: string;
        rebalanceFrequency?: string;
        createdAt: string;
        lastModified: string;
    };
    onLoadConfig: (config: PortfolioConfig) => void;
}

export function PortfolioManager({ currentConfig, onLoadConfig }: PortfolioManagerProps) {
    const [savedPortfolios, setSavedPortfolios] = useState<PortfolioConfig[]>([]);
    const [saveName, setSaveName] = useState('');
    const [showSaveInput, setShowSaveInput] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    useEffect(() => {
        loadSavedPortfolios();
    }, []);

    const loadSavedPortfolios = () => {
        const data = getSavedPortfolios();
        setSavedPortfolios(data.configurations);
    };

    const handleSave = () => {
        if (!saveName.trim()) return;

        // Validate total weight = 100
        const totalWeight = Object.values(currentConfig.weights).reduce((a, b) => a + b, 0);
        if (Math.abs(totalWeight - 100) > 0.1) {
            alert('Portfolio weights must sum to 100%');
            return;
        }

        try {
            setSaveStatus('saving');
            savePortfolioConfig({
                name: saveName.trim(),
                selectedAssets: currentConfig.selectedAssets,
                weights: currentConfig.weights,
                initialInvestment: currentConfig.initialInvestment,
            });

            setSaveStatus('saved');
            setSaveName('');
            setShowSaveInput(false);
            loadSavedPortfolios();

            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (error) {
            setSaveStatus('error');
            alert(error instanceof Error ? error.message : 'Failed to save portfolio');
        }
    };

    const handleDelete = (id: string) => {
        if (confirm('Delete this portfolio configuration?')) {
            deletePortfolioConfig(id);
            loadSavedPortfolios();
        }
    };

    const handleLoad = (config: PortfolioConfig) => {
        onLoadConfig(config);
    };

    return (
        <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">Saved Portfolios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Save Current Configuration */}
                <div className="space-y-2">
                    {!showSaveInput ? (
                        <Button
                            onClick={() => setShowSaveInput(true)}
                            className="w-full"
                        >
                            <Save className="h-4 w-4" />
                            Save Current Portfolio
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Input
                                type="text"
                                placeholder="Portfolio name..."
                                value={saveName}
                                onChange={(e) => setSaveName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                            />
                            <Button
                                onClick={handleSave}
                                disabled={!saveName.trim() || saveStatus === 'saving'}
                                variant="default"
                                size="default"
                            >
                                {saveStatus === 'saved' ? <Check className="h-4 w-4" /> : 'Save'}
                            </Button>
                            <Button
                                onClick={() => {
                                    setShowSaveInput(false);
                                    setSaveName('');
                                }}
                                variant="secondary"
                            >
                                Cancel
                            </Button>
                        </div>
                    )}
                </div>

                {/* Saved Portfolios List */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label>Saved Configurations</Label>
                        <Badge variant="secondary">{savedPortfolios.length}/10</Badge>
                    </div>
                    {savedPortfolios.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No saved portfolios yet
                        </p>
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {savedPortfolios.map(config => (
                                <div
                                    key={config.id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{config.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {config.selectedAssets.length} assets • ${config.initialInvestment.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            onClick={() => handleLoad(config)}
                                            variant="ghost"
                                            size="icon"
                                            title="Load portfolio"
                                        >
                                            <FolderOpen className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            onClick={() => handleDelete(config.id)}
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            title="Delete portfolio"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
