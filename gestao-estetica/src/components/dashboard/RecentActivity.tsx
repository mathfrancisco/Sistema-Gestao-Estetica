import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
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
    Activity,
    Filter,
    Search,
    Eye,
    EyeOff,
    RefreshCw,
    Download,
    Zap,
    Timer,
    Sparkles
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
    const [selectedType, setSelectedType] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showDetails, setShowDetails] = useState(false);

    // Filtrar atividades
    const filteredActivities = activities.filter(activity => {
        const matchesType = selectedType === 'all' || activity.type === selectedType;
        const matchesStatus = selectedStatus === 'all' || activity.status === selectedStatus;
        const matchesSearch = searchTerm === '' ||
            activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            activity.client?.name.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesType && matchesStatus && matchesSearch;
    });

    const displayActivities = showAll ? filteredActivities : filteredActivities.slice(0, limit);

    const getActivityIcon = (type: Activity['type'], status?: Activity['status']) => {
        const icons = {
            appointment: Calendar,
            payment: DollarSign,
            client: User,
            procedure: TrendingUp
        };
        const IconComponent = icons[type] || Activity;
        return <IconComponent className="h-5 w-5" />;
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

    const getActivityGradient = (type: Activity['type']) => {
        const gradients = {
            appointment: 'from-blue-500 to-indigo-600',
            payment: 'from-emerald-500 to-green-600',
            client: 'from-purple-500 to-pink-600',
            procedure: 'from-indigo-500 to-purple-600'
        };
        return gradients[type] || 'from-slate-500 to-slate-600';
    };

    const getStatusBadgeStyle = (status?: Activity['status']) => {
        const styles = {
            success: 'bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-lg shadow-emerald-500/25',
            error: 'bg-gradient-to-r from-red-500 to-rose-500 text-white border-0 shadow-lg shadow-red-500/25',
            warning: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg shadow-amber-500/25',
            info: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 shadow-lg shadow-blue-500/25'
        };
        return styles[status || 'info'];
    };

    const getTypeLabel = (type: Activity['type']) => {
        const labels = {
            appointment: 'Agendamentos',
            payment: 'Pagamentos',
            client: 'Clientes',
            procedure: 'Procedimentos'
        };
        return labels[type];
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

    const getActivityStats = () => {
        const types = ['appointment', 'payment', 'client', 'procedure'];
        const statuses = ['success', 'warning', 'error', 'info'];

        return {
            byType: types.map(type => ({
                type,
                count: activities.filter(a => a.type === type).length,
                label: getTypeLabel(type as Activity['type'])
            })),
            byStatus: statuses.map(status => ({
                status,
                count: activities.filter(a => a.status === status).length,
                label: status === 'success' ? 'Concluído' :
                    status === 'error' ? 'Erro' :
                        status === 'warning' ? 'Atenção' : 'Info'
            }))
        };
    };

    if (loading) {
        return (
            <Card className={cn("border-0 shadow-2xl shadow-slate-200/60 overflow-hidden bg-gradient-to-br from-white via-slate-50/30 to-white", className)}>
                <CardHeader className="bg-gradient-to-r from-slate-50/80 to-white/80 backdrop-blur-sm border-b border-slate-100">
                    <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-slate-400 to-slate-500 shadow-lg animate-pulse">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        Atividades Recentes
                    </CardTitle>
                    <CardDescription className="mt-1">
                        Carregando últimas movimentações...
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center space-x-4 p-4 rounded-2xl bg-slate-50/50 animate-pulse">
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

    const stats = getActivityStats();

    return (
        <Card className={cn("border-0 shadow-2xl shadow-slate-200/60 overflow-hidden bg-gradient-to-br from-white via-slate-50/30 to-white", className)}>
            <CardHeader className="bg-gradient-to-r from-slate-50/80 to-white/80 backdrop-blur-sm border-b border-slate-100">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-3 text-xl">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                                <Activity className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Atividades Recentes</h2>
                                <CardDescription className="mt-1">
                                    Últimas movimentações do sistema
                                </CardDescription>
                            </div>
                        </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg shadow-blue-500/25">
                            <Sparkles className="w-3 h-3 mr-1" />
                            {displayActivities.length} atividades
                        </Badge>
                        <div className="flex items-center gap-1">
                            {onRefresh && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onRefresh}
                                    className="hover:bg-slate-100 rounded-xl"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </Button>
                            )}
                            {onExport && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onExport}
                                    className="hover:bg-slate-100 rounded-xl"
                                >
                                    <Download className="w-4 h-4" />
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowDetails(!showDetails)}
                                className="hover:bg-slate-100 rounded-xl"
                            >
                                {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                        </div>
                        {!showAll && filteredActivities.length > limit && onViewAll && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onViewAll}
                                className="rounded-xl bg-white hover:bg-slate-50 shadow-sm"
                            >
                                Ver tudo
                                <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
                {/* Filtros e Busca */}
                {(showFilters || showSearch) && (
                    <div className="space-y-4">
                        {showSearch && (
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar atividades..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                                />
                            </div>
                        )}

                        {showFilters && (
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-slate-500" />
                                    <span className="text-sm font-medium text-slate-700">Filtros:</span>
                                </div>
                                <Tabs value={selectedType} onValueChange={setSelectedType}>
                                    <TabsList className="bg-slate-100/80 backdrop-blur-sm">
                                        <TabsTrigger value="all">Todos</TabsTrigger>
                                        <TabsTrigger value="appointment">Agendamentos</TabsTrigger>
                                        <TabsTrigger value="payment">Pagamentos</TabsTrigger>
                                        <TabsTrigger value="client">Clientes</TabsTrigger>
                                        <TabsTrigger value="procedure">Procedimentos</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                                <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
                                    <TabsList className="bg-slate-100/80 backdrop-blur-sm">
                                        <TabsTrigger value="all">Status</TabsTrigger>
                                        <TabsTrigger value="success">Sucesso</TabsTrigger>
                                        <TabsTrigger value="warning">Atenção</TabsTrigger>
                                        <TabsTrigger value="error">Erro</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                        )}
                    </div>
                )}

                {/* Estatísticas */}
                {showDetails && (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {stats.byType.map(({ type, count, label }) => (
                                <div key={type} className="text-center p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
                                    <div className={cn(
                                        "w-8 h-8 rounded-xl bg-gradient-to-br mx-auto mb-2 flex items-center justify-center shadow-lg",
                                        getActivityGradient(type as Activity['type'])
                                    )}>
                                        {getActivityIcon(type as Activity['type'])}
                                    </div>
                                    <div className="text-2xl font-bold text-slate-900 mb-1">{count}</div>
                                    <div className="text-sm text-slate-600 font-medium">{label}</div>
                                </div>
                            ))}
                        </div>
                        <Separator />
                    </>
                )}

                {/* Lista de Atividades */}
                {displayActivities.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Activity className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">
                            {searchTerm || selectedType !== 'all' || selectedStatus !== 'all'
                                ? 'Nenhuma atividade encontrada'
                                : 'Nenhuma atividade recente'
                            }
                        </h3>
                        <p className="text-slate-500 mb-6 max-w-md mx-auto">
                            {searchTerm
                                ? `Não encontramos atividades para "${searchTerm}"`
                                : 'As atividades aparecerão aqui quando ocorrerem'
                            }
                        </p>
                        {searchTerm && (
                            <Button
                                variant="outline"
                                onClick={() => setSearchTerm('')}
                                className="rounded-xl"
                            >
                                Limpar busca
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {displayActivities.map((activity, index) => (
                            <div
                                key={activity.id}
                                className="group relative p-5 rounded-2xl bg-white/80 backdrop-blur-sm border border-slate-200/60 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-500 hover:-translate-y-1 hover:scale-[1.02]"
                            >
                                {/* Background gradient effect */}
                                <div className={cn(
                                    "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-all duration-500 rounded-2xl",
                                    getActivityGradient(activity.type)
                                )} />

                                <div className="flex items-start gap-4 relative z-10">
                                    <div className="flex-shrink-0">
                                        {activity.client ? (
                                            <div className="relative">
                                                <Avatar className="h-14 w-14 ring-2 ring-white shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                                                    <AvatarImage src={activity.client.avatar} />
                                                    <AvatarFallback className={cn(
                                                        "bg-gradient-to-br text-white font-bold text-lg",
                                                        getActivityGradient(activity.type)
                                                    )}>
                                                        {activity.client.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className={cn(
                                                    "absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white group-hover:scale-110 transition-all duration-300",
                                                    getActivityGradient(activity.type)
                                                )}>
                                                    {getActivityIcon(activity.type, activity.status)}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={cn(
                                                "w-14 h-14 bg-gradient-to-br rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300",
                                                getActivityGradient(activity.type)
                                            )}>
                                                {getActivityIcon(activity.type, activity.status)}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="text-base font-bold text-slate-900 group-hover:text-slate-800 transition-colors duration-300">
                                                {activity.title}
                                            </h4>
                                            {getStatusIcon(activity.status)}
                                        </div>
                                        <p className="text-sm text-slate-600 mb-3 leading-relaxed group-hover:text-slate-700 transition-colors duration-300">
                                            {activity.description}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Timer className="w-3 h-3 text-slate-400" />
                                                <span className="text-xs text-slate-500 font-medium">
                                                    {formatTimestamp(activity.timestamp)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {activity.value && (
                                                    <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-lg shadow-emerald-500/25 text-xs font-bold px-3 py-1">
                                                        {formatValue(activity.value)}
                                                    </Badge>
                                                )}
                                                {activity.status && (
                                                    <Badge className={cn(getStatusBadgeStyle(activity.status), "text-xs font-bold px-3 py-1")}>
                                                        {activity.status === 'success' ? 'Concluído' :
                                                            activity.status === 'error' ? 'Erro' :
                                                                activity.status === 'warning' ? 'Atenção' : 'Info'}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all duration-300" />
                                    </div>
                                </div>

                                {/* Hover shine effect */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}