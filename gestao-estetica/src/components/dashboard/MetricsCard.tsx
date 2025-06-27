import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricsCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon?: React.ElementType;
    trend?: {
        value: number;
        label: string;
        isPositive?: boolean;
    };
    format?: 'currency' | 'percentage' | 'number';
    className?: string;
    loading?: boolean;
}

export function MetricsCard({
                                title,
                                value,
                                description,
                                icon: Icon,
                                trend,
                                format = 'number',
                                className,
                                loading = false
                            }: MetricsCardProps) {
    const formatValue = (val: string | number) => {
        if (loading) return '---';
        const numValue = typeof val === 'string' ? parseFloat(val) : val;
        switch (format) {
            case 'currency':
                return new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }).format(numValue);
            case 'percentage':
                return `${numValue.toFixed(1)}%`;
            default:
                return new Intl.NumberFormat('pt-BR').format(numValue);
        }
    };

    const getTrendIcon = () => {
        if (!trend) return null;
        if (trend.value > 0) return <TrendingUp className="h-4 w-4" />;
        if (trend.value < 0) return <TrendingDown className="h-4 w-4" />;
        return <Minus className="h-4 w-4" />;
    };

    const getTrendColor = () => {
        if (!trend) return '';
        if (trend.isPositive === false) {
            return trend.value > 0 ? 'text-red-600' : 'text-green-600';
        }
        return trend.value > 0 ? 'text-green-600' : trend.value < 0 ? 'text-red-600' : 'text-gray-500';
    };

    return (
        <Card className={cn(
            "transition-all duration-200 hover:shadow-lg border border-gray-200 bg-white rounded-xl p-4",
            className
        )}>
            <CardHeader className="flex flex-col items-start space-y-2 pb-0">
                <div className="flex items-center gap-2 w-full">
                    {Icon && <Icon className="h-5 w-5 text-primary" />}
                    <CardTitle className="text-base font-semibold text-gray-700">{title}</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className={cn(
                        "text-4xl font-extrabold tracking-tight",
                        loading && "animate-pulse bg-muted rounded h-10 w-32"
                    )}>
                        {!loading && formatValue(value)}
                    </span>
                    {trend && (
                        <span className={cn(
                            "flex items-center gap-1 text-lg font-medium",
                            getTrendColor()
                        )}>
                            {getTrendIcon()}
                            <span>
                                {Math.abs(trend.value).toFixed(1)}%
                            </span>
                        </span>
                    )}
                </div>
                {description && (
                    <CardDescription className="text-sm text-gray-500 text-center">
                        {description}
                    </CardDescription>
                )}
                {trend && (
                    <span className="text-xs text-muted-foreground mt-1">
                        {trend.label}
                    </span>
                )}
            </CardContent>
        </Card>
    );
}