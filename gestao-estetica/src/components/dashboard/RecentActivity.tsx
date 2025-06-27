import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Calendar,
    DollarSign,
    User,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    ArrowRight,
    TrendingUp,
    Activity
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
    limit?: number;
}

export function RecentActivity({
                                   activities,
                                   loading = false,
                                   showAll = false,
                                   onViewAll,
                                   limit = 5
                               }: RecentActivityProps) {
    const displayActivities = showAll ? activities : activities.slice(0, limit);

    const getActivityIcon = (type: Activity['type'], status?: Activity['status']) => {
        switch (type) {
            case 'appointment':
                return <Calendar className="h-5 w-5 text-blue-600" />;
            case 'payment':
                return <DollarSign className="h-5 w-5 text-emerald-600" />;
            case 'client':
                return <User className="h-5 w-5 text-purple-600" />;
            case 'procedure':
                return <TrendingUp className="h-5 w-5 text-indigo-600" />;
            default:
                return <Activity className="h-5 w-5 text-slate-600" />;
        }
    };

    const getStatusIcon = (status?: Activity['status']) => {
        switch (status) {
            case 'success':
                return <CheckCircle className="h-4 w-4 text-emerald-500" />;
            case 'error':
                return <XCircle className="h-4 w-4 text-red-500" />;
            case 'warning':
                return <AlertCircle className="h-4 w-4 text-amber-500" />;
            default:
                return null;
        }
    };

    const getActivityGradient = (type: Activity['type']) => {
        switch (type) {
            case 'appointment':
                return 'from-blue-500 to-indigo-600';
            case 'payment':
                return 'from-emerald-500 to-green-600';
            case 'client':
                return 'from-purple-500 to-pink-600';
            case 'procedure':
                return 'from-indigo-500 to-purple-600';
            default:
                return 'from-slate-500 to-slate-600';
        }
    };

    const getStatusBadgeStyle = (status?: Activity['status']) => {
        switch (status) {
            case 'success':
                return 'bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-lg shadow-emerald-500/25';
            case 'error':
                return 'bg-gradient-to-r from-red-500 to-rose-500 text-white border-0 shadow-lg shadow-red-500/25';
            case 'warning':
                return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg shadow-amber-500/25';
            default:
                return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 shadow-lg shadow-blue-500/25';
        }
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
            <Card className="border-0 shadow-xl shadow-slate-200/60 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Activity className="w-5 h-5 text-slate-500" />
                        Atividades Recentes
                    </CardTitle>
                    <CardDescription className="mt-1">
                        Últimas movimentações do sistema
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center space-x-4 animate-pulse">
                                <div className="w-12 h-12 bg-slate-200 rounded-2xl" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-slate-200 rounded-lg w-3/4" />
                                    <div className="h-3 bg-slate-200 rounded-lg w-1/2" />
                                </div>
                                <div className="h-6 bg-slate-200 rounded-lg w-16" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-0 shadow-xl shadow-slate-200/60 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Activity className="w-5 h-5 text-slate-600" />
                            Atividades Recentes
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Últimas movimentações do sistema
                        </CardDescription>
                    </div>
                    {!showAll && activities.length > limit && onViewAll && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onViewAll}
                            className="rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                            Ver tudo
                            <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-6">
                {displayActivities.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Activity className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-500 font-medium">
                            Nenhuma atividade recente
                        </p>
                        <p className="text-sm text-slate-400 mt-1">
                            As atividades aparecerão aqui quando ocorrerem
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {displayActivities.map((activity, index) => (
                            <div
                                key={activity.id}
                                className="group relative p-4 rounded-2xl bg-white border border-slate-200/60 hover:shadow-lg hover:shadow-slate-200/60 transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0">
                                        {activity.client ? (
                                            <div className="relative">
                                                <Avatar className="h-12 w-12 ring-2 ring-white shadow-lg">
                                                    <AvatarImage src={activity.client.avatar} />
                                                    <AvatarFallback className={`bg-gradient-to-br ${getActivityGradient(activity.type)} text-white font-semibold`}>
                                                        {activity.client.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className={`absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br ${getActivityGradient(activity.type)} rounded-lg flex items-center justify-center shadow-lg`}>
                                                    {getActivityIcon(activity.type, activity.status)}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={`w-12 h-12 bg-gradient-to-br ${getActivityGradient(activity.type)} rounded-2xl flex items-center justify-center shadow-lg`}>
                                                {getActivityIcon(activity.type, activity.status)}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-base font-semibold text-slate-900">
                                                {activity.title}
                                            </p>
                                            {getStatusIcon(activity.status)}
                                        </div>
                                        <p className="text-sm text-slate-600 mb-3">
                                            {activity.description}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-500 font-medium">
                                                {formatTimestamp(activity.timestamp)}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                {activity.value && (
                                                    <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-lg shadow-emerald-500/25 text-xs font-semibold">
                                                        {formatValue(activity.value)}
                                                    </Badge>
                                                )}
                                                {activity.status && (
                                                    <Badge className={`${getStatusBadgeStyle(activity.status)} text-xs font-semibold`}>
                                                        {activity.status === 'success' ? 'Concluído' :
                                                            activity.status === 'error' ? 'Erro' :
                                                                activity.status === 'warning' ? 'Atenção' : 'Info'}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <ArrowRight className="w-4 h-4 text-slate-400" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}