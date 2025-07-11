import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    color?: 'blue' | 'emerald' | 'purple' | 'orange' | 'slate';
}

export function MetricsCard({
                                title,
                                value,
                                description,
                                icon: Icon,
                                trend,
                                format = 'number',
                                className,
                                loading = false,
                                color = 'blue'
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
            return trend.value > 0 ? 'text-red-600' : 'text-emerald-600';
        }
        return trend.value > 0 ? 'text-emerald-600' : trend.value < 0 ? 'text-red-600' : 'text-slate-500';
    };

    const getColorClasses = (colorName: string) => {
        const colors = {
            blue: {
                bg: 'bg-blue-100',
                text: 'text-blue-600',
                icon: 'text-blue-500'
            },
            emerald: {
                bg: 'bg-emerald-100',
                text: 'text-emerald-600',
                icon: 'text-emerald-500'
            },
            purple: {
                bg: 'bg-purple-100',
                text: 'text-purple-600',
                icon: 'text-purple-500'
            },
            orange: {
                bg: 'bg-orange-100',
                text: 'text-orange-600',
                icon: 'text-orange-500'
            },
            slate: {
                bg: 'bg-slate-100',
                text: 'text-slate-600',
                icon: 'text-slate-500'
            }
        };
        return colors[colorName] || colors.blue;
    };

    const colorClasses = getColorClasses(color);

    return (
        <Card className={cn(
            "transition-all duration-200 hover:shadow-md",
            className
        )}>
            <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                    {Icon && (
                        <div className={cn("p-2 rounded-lg", colorClasses.bg)}>
                            <Icon className={cn("w-5 h-5", colorClasses.icon)} />
                        </div>
                    )}
                    {trend && (
                        <div className={cn("flex items-center gap-1", getTrendColor())}>
                            {getTrendIcon()}
                            <span className="text-sm font-medium">
                                {Math.abs(trend.value).toFixed(1)}%
                            </span>
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-600">{title}</p>

                    {loading ? (
                        <div className="animate-pulse">
                            <div className="h-8 bg-slate-200 rounded w-24 mb-2"></div>
                            <div className="h-3 bg-slate-200 rounded w-32"></div>
                        </div>
                    ) : (
                        <>
                            <p className="text-2xl font-bold text-slate-900 leading-tight">
                                {formatValue(value)}
                            </p>

                            <div className="flex items-center justify-between">
                                {description && (
                                    <p className="text-xs text-slate-500">{description}</p>
                                )}

                                {trend && (
                                    <Badge variant="outline" className="text-xs">
                                        {trend.label}
                                    </Badge>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}