import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Calendar,
    DollarSign,
    User,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    ArrowRight,
    Activity,
    Search,
    Eye,
    EyeOff,
    RefreshCw,
    Download
} from 'lucide-react';
import { cn } from '@/lib/utils/utils';

interface Activity {
    id: string;
    type: 'appointment' | 'payment' | 'client' | 'procedure';
    title: string;
    description: string;
    timestamp: string;
    status?: 'success' | 'warning' | 'error' | 'info';
    value?: number;
    client?: {
        name: string;
        avatar?: string;
    };
    metadata?: Record<string, any>;
}

interface RecentActivityProps {
    activities: Activity[];
    loading?: boolean;
    showAll?: boolean;
    onViewAll?: () => void;
    onRefresh?: () => void;
    onExport?: () => void;
    limit?: number;
    showFilters?: boolean;
    showSearch?: boolean;
    className?: string;
}

export function RecentActivity({
                                   activities,
                                   loading = false,
                                   showAll = false,
                                   onViewAll,
                                   onRefresh,
                                   onExport,
                                   limit = 5,
                                   showFilters = true,
                                   showSearch = true,
                                   className
                               }: RecentActivityProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [showDetails, setShowDetails] = useState(false);

    // Filtrar atividades
    const filteredActivities = activities.filter(activity => {
        if (searchTerm === '') return true;
        return activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            activity.client?.name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const displayActivities = showAll ? filteredActivities : filteredActivities.slice(0, limit);

    const getActivityIcon = (type: Activity['type']) => {
        const icons = {
            appointment: Calendar,
            payment: DollarSign,
            client: User,
            procedure: Activity
        };
        const IconComponent = icons[type] || Activity;
        return <IconComponent className="h-4 w-4" />;
    };

    const getStatusIcon = (status?: Activity['status']) => {
        switch (status) {
            case 'success':
                return <CheckCircle className="h-4 w-4 text-emerald-500" />;
            case 'error':
                return <XCircle className="h-4 w-4 text-red-500" />;
            case 'warning':
                return <AlertCircle className="h-4 w-4 text-amber-500" />;
            case 'info':
                return <Clock className="h-4 w-4 text-blue-500" />;
            default:
                return null;
        }
    };

    const getTypeColor = (type: Activity['type']) => {
        const colors = {
            appointment: 'bg-blue-100 text-blue-700',
            payment: 'bg-emerald-100 text-emerald-700',
            client: 'bg-purple-100 text-purple-700',
            procedure: 'bg-orange-100 text-orange-700'
        };
        return colors[type] || 'bg-slate-100 text-slate-700';
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'Agora';
        if (diffInMinutes < 60) return `${diffInMinutes}min atrás`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h atrás`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d atrás`;

        return date.toLocaleDateString('pt-BR');
    };

    const formatValue = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    if (loading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-500" />
                        Atividades Recentes
                    </CardTitle>
                    <CardDescription>Carregando últimas movimentações...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center space-x-4 animate-pulse">
                                <div className="w-10 h-10 bg-slate-200 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                                </div>
                                <div className="h-6 bg-slate-200 rounded w-16" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-500" />
                            Atividades Recentes
                        </CardTitle>
                        <CardDescription>Últimas movimentações do sistema</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                            {displayActivities.length} atividades
                        </Badge>

                        <div className="flex items-center gap-1">
                            {onRefresh && (
                                <Button variant="ghost" size="sm" onClick={onRefresh}>
                                    <RefreshCw className="w-4 h-4" />
                                </Button>
                            )}
                            {onExport && (
                                <Button variant="ghost" size="sm" onClick={onExport}>
                                    <Download className="w-4 h-4" />
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowDetails(!showDetails)}
                            >
                                {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                        </div>

                        {!showAll && filteredActivities.length > limit && onViewAll && (
                            <Button variant="outline" size="sm" onClick={onViewAll}>
                                Ver tudo
                                <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Busca */}
                {showSearch && (
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Buscar atividades..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                )}

                {/* Lista de Atividades */}
                {displayActivities.length === 0 ? (
                    <div className="text-center py-8">
                        <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="font-medium text-slate-900 mb-2">
                            {searchTerm ? 'Nenhuma atividade encontrada' : 'Nenhuma atividade recente'}
                        </h3>
                        <p className="text-sm text-slate-500">
                            {searchTerm
                                ? `Não encontramos atividades para "${searchTerm}"`
                                : 'As atividades aparecerão aqui quando ocorrerem'
                            }
                        </p>
                        {searchTerm && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-4"
                                onClick={() => setSearchTerm('')}
                            >
                                Limpar busca
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {displayActivities.map((activity) => (
                            <div
                                key={activity.id}
                                className="flex items-start gap-4 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex-shrink-0">
                                    {activity.client ? (
                                        <div className="relative">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={activity.client.avatar} />
                                                <AvatarFallback className={getTypeColor(activity.type)}>
                                                    {activity.client.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className={cn(
                                                "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white",
                                                getTypeColor(activity.type)
                                            )}>
                                                {getActivityIcon(activity.type)}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center",
                                            getTypeColor(activity.type)
                                        )}>
                                            {getActivityIcon(activity.type)}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-medium text-slate-900 truncate">
                                            {activity.title}
                                        </h4>
                                        {getStatusIcon(activity.status)}
                                    </div>
                                    <p className="text-sm text-slate-600 mb-2">
                                        {activity.description}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-500">
                                            {formatTimestamp(activity.timestamp)}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {activity.value && (
                                                <Badge variant="outline" className="text-xs">
                                                    {formatValue(activity.value)}
                                                </Badge>
                                            )}
                                            {activity.status && (
                                                <Badge
                                                    variant={activity.status === 'success' ? 'default' : 'outline'}
                                                    className="text-xs"
                                                >
                                                    {activity.status === 'success' ? 'Concluído' :
                                                        activity.status === 'error' ? 'Erro' :
                                                            activity.status === 'warning' ? 'Atenção' : 'Info'}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Estatísticas detalhadas */}
                {showDetails && displayActivities.length > 0 && (
                    <div className="pt-4 border-t border-slate-200">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {['appointment', 'payment', 'client', 'procedure'].map((type) => {
                                const count = activities.filter(a => a.type === type).length;
                                const labels = {
                                    appointment: 'Agendamentos',
                                    payment: 'Pagamentos',
                                    client: 'Clientes',
                                    procedure: 'Procedimentos'
                                };

                                return (
                                    <div key={type} className="text-center p-3 bg-slate-50 rounded-lg">
                                        <div className={cn(
                                            "w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center",
                                            getTypeColor(type as Activity['type'])
                                        )}>
                                            {getActivityIcon(type as Activity['type'])}
                                        </div>
                                        <div className="text-lg font-bold text-slate-900">{count}</div>
                                        <div className="text-xs text-slate-600">{labels[type]}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}