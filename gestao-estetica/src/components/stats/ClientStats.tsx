'use client'

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import {
    Users,
    Crown,
    UserPlus,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Activity,
    DollarSign,
    Heart,
    Calendar,
    Target,
    CheckCircle,
    XCircle,
    Clock,
    BarChart3,
    PieChart,
    ArrowUpRight,
    ArrowDownRight,
    Eye,
    RefreshCw,
    Download,
    Share2,
    MoreHorizontal,
    Zap,
    Award,
    Star,
    Flame,
    ShieldCheck,
    AlertCircle,
    TrendingUpIcon
} from 'lucide-react'
import { cn } from '@/lib/utils/utils'

interface ClientStatsData {
    total: number
    active: number
    inactive: number
    blocked: number
    vip: number
    regular: number
    new: number
    at_risk: number
    lost: number
    totalSpent: number
    averageSpent: number
    totalVisits: number
    averageVisits: number
    birthdays: number
    newThisMonth: number
    churnRate: number
    ltv: number
    growthRate?: number
    retentionRate?: number
    conversionRate?: number
}

interface ClientStatsProps {
    data: Partial<ClientStatsData>
    loading?: boolean
    period?: string
    className?: string
    onCardClick?: (cardType: string, value: any) => void
    onExport?: () => void
    showComparison?: boolean
    previousPeriodData?: Partial<ClientStatsData>
    refreshData?: () => void
}

interface StatCardProps {
    title: string
    value: number | string
    icon: React.ElementType
    description?: string
    trend?: {
        value: number
        isPositive: boolean
        label: string
        percentage?: number
    }
    gradient: string
    format?: 'number' | 'currency' | 'percentage'
    className?: string
    onClick?: () => void
    loading?: boolean
    progress?: number
    badge?: {
        text: string
        variant: 'default' | 'secondary' | 'destructive' | 'success'
    }
    interactive?: boolean
}

const StatCard: React.FC<StatCardProps> = ({
                                               title,
                                               value,
                                               icon: Icon,
                                               description,
                                               trend,
                                               gradient,
                                               format = 'number',
                                               className,
                                               onClick,
                                               loading = false,
                                               progress,
                                               badge,
                                               interactive = true
                                           }) => {
    const [isHovered, setIsHovered] = useState(false)
    const [isPressed, setIsPressed] = useState(false)

    const formatValue = useCallback((val: number | string) => {
        if (typeof val === 'string') return val

        switch (format) {
            case 'currency':
                return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            case 'percentage':
                return `${val.toFixed(1)}%`
            default:
                return val.toLocaleString('pt-BR')
        }
    }, [format])

    const cardRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const card = cardRef.current
        if (!card || !interactive) return

        const handleMouseMove = (e: MouseEvent) => {
            const rect = card.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            const centerX = rect.width / 2
            const centerY = rect.height / 2
            const rotateX = (y - centerY) / 10
            const rotateY = (centerX - x) / 10

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`
        }

        const handleMouseLeave = () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'
        }

        if (isHovered) {
            card.addEventListener('mousemove', handleMouseMove)
            card.addEventListener('mouseleave', handleMouseLeave)
        }

        return () => {
            card.removeEventListener('mousemove', handleMouseMove)
            card.removeEventListener('mouseleave', handleMouseLeave)
        }
    }, [isHovered, interactive])

    if (loading) {
        return (
            <Card className={cn("relative overflow-hidden border-0 shadow-lg", className)}>
                <CardContent className="p-4 lg:p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="w-12 h-12 bg-slate-200 rounded-2xl"></div>
                            <div className="w-16 h-6 bg-slate-200 rounded"></div>
                        </div>
                        <div className="space-y-2">
                            <div className="w-24 h-4 bg-slate-200 rounded"></div>
                            <div className="w-32 h-8 bg-slate-200 rounded"></div>
                            <div className="w-20 h-3 bg-slate-200 rounded"></div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Card
                        ref={cardRef}
                        className={cn(
                            "relative overflow-hidden border-0 shadow-lg transition-all duration-300 cursor-pointer group",
                            interactive && "hover:shadow-2xl",
                            isPressed && "scale-95",
                            className
                        )}
                        onClick={onClick}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        onMouseDown={() => setIsPressed(true)}
                        onMouseUp={() => setIsPressed(false)}
                        role={onClick ? "button" : undefined}
                        tabIndex={onClick ? 0 : undefined}
                        onKeyDown={(e) => {
                            if (onClick && (e.key === 'Enter' || e.key === ' ')) {
                                e.preventDefault()
                                onClick()
                            }
                        }}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />

                        {/* Animated background pattern */}
                        <div className="absolute inset-0 opacity-5">
                            <div className={`w-32 h-32 bg-gradient-to-br ${gradient} rounded-full blur-2xl -top-8 -right-8 animate-pulse`}></div>
                        </div>

                        <CardContent className="p-4 lg:p-6 relative z-10">
                            <div className="flex items-center justify-between mb-3 lg:mb-4">
                                <div className={cn(
                                    "p-2 lg:p-3 rounded-2xl bg-gradient-to-br shadow-lg transition-all duration-300",
                                    gradient,
                                    isHovered && "scale-110 shadow-xl"
                                )}>
                                    <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                                </div>

                                <div className="flex items-center gap-2">
                                    {badge && (
                                        <Badge
                                            variant={badge.variant}
                                            className="text-xs animate-in fade-in-50"
                                        >
                                            {badge.text}
                                        </Badge>
                                    )}

                                    {trend && (
                                        <div className={cn(
                                            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-200",
                                            trend.isPositive
                                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                                        )}>
                                            {trend.isPositive ? (
                                                <TrendingUp className="w-3 h-3" />
                                            ) : (
                                                <TrendingDown className="w-3 h-3" />
                                            )}
                                            {trend.percentage !== undefined ? `${trend.percentage}%` : `${trend.value > 0 ? '+' : ''}${trend.value}%`}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1 lg:space-y-2">
                                <p className="text-xs lg:text-sm font-medium text-slate-600">{title}</p>
                                <div className="flex items-baseline gap-2">
                                    <p className={cn(
                                        "font-bold text-slate-900 leading-tight transition-all duration-300",
                                        isHovered ? "text-2xl lg:text-4xl" : "text-xl lg:text-3xl"
                                    )}>
                                        {formatValue(value)}
                                    </p>
                                    {onClick && (
                                        <ArrowUpRight className={cn(
                                            "w-4 h-4 text-slate-400 transition-all duration-300",
                                            isHovered && "text-slate-600 transform translate-x-1 -translate-y-1"
                                        )} />
                                    )}
                                </div>

                                {description && (
                                    <p className="text-xs text-slate-500">{description}</p>
                                )}

                                {progress !== undefined && (
                                    <div className="pt-2">
                                        <Progress
                                            value={progress}
                                            className="h-2 transition-all duration-500"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">{progress}% da meta</p>
                                    </div>
                                )}

                                {trend?.label && (
                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {trend.label}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TooltipTrigger>
                <TooltipContent side="top">
                    <p>{description || `Ver detalhes de ${title.toLowerCase()}`}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

const ClientStats: React.FC<ClientStatsProps> = ({
                                                     data,
                                                     loading = false,
                                                     period = 'total',
                                                     className,
                                                     onCardClick,
                                                     onExport,
                                                     showComparison = false,
                                                     previousPeriodData = {},
                                                     refreshData
                                                 }) => {
    const [view, setView] = useState<'overview' | 'detailed'>('overview')
    const [selectedMetric, setSelectedMetric] = useState<string | null>(null)

    // Calculate trend comparisons
    const calculateTrend = useCallback((current: number, previous: number) => {
        if (!previous || previous === 0) return null
        const change = ((current - previous) / previous) * 100
        return {
            value: Math.round(change * 10) / 10,
            isPositive: change >= 0,
            label: `vs período anterior`,
            percentage: Math.abs(Math.round(change * 10) / 10)
        }
    }, [])

    // Stats configuration with enhanced interactivity
    const statsConfig = useMemo(() => [
        {
            id: 'total',
            title: 'Total de Clientes',
            value: data.total || 0,
            icon: Users,
            description: 'Base de clientes cadastrada',
            gradient: 'from-blue-500 to-blue-600',
            trend: showComparison ? calculateTrend(data.total || 0, previousPeriodData.total || 0) : undefined,
            format: 'number' as const,
            badge: data.newThisMonth ? {
                text: `+${data.newThisMonth} novos`,
                variant: 'default' as const
            } : undefined,
            progress: data.total ? Math.min((data.total / 1000) * 100, 100) : 0
        },
        {
            id: 'active',
            title: 'Clientes Ativos',
            value: data.active || 0,
            icon: CheckCircle,
            description: 'Com status ativo no sistema',
            gradient: 'from-emerald-500 to-emerald-600',
            trend: showComparison ? calculateTrend(data.active || 0, previousPeriodData.active || 0) : undefined,
            format: 'number' as const,
            badge: data.total ? {
                text: `${Math.round((data.active || 0) / data.total * 100)}% do total`,
                variant: 'secondary' as const
            } : undefined
        },
        {
            id: 'vip',
            title: 'Clientes VIP',
            value: data.vip || 0,
            icon: Crown,
            description: 'Clientes de alto valor',
            gradient: 'from-amber-500 to-orange-500',
            trend: showComparison ? calculateTrend(data.vip || 0, previousPeriodData.vip || 0) : undefined,
            format: 'number' as const,
            badge: {
                text: 'Premium',
                variant: 'default' as const
            }
        },
        {
            id: 'at_risk',
            title: 'Clientes em Risco',
            value: data.at_risk || 0,
            icon: AlertTriangle,
            description: 'Necessitam atenção especial',
            gradient: 'from-red-500 to-red-600',
            trend: showComparison ? calculateTrend(data.at_risk || 0, previousPeriodData.at_risk || 0) : undefined,
            format: 'number' as const,
            badge: data.churnRate ? {
                text: `${data.churnRate.toFixed(1)}% churn`,
                variant: 'destructive' as const
            } : undefined
        },
        {
            id: 'revenue',
            title: 'Faturamento Total',
            value: data.totalSpent || 0,
            icon: DollarSign,
            description: 'Receita gerada pelos clientes',
            gradient: 'from-purple-500 to-purple-600',
            trend: showComparison ? calculateTrend(data.totalSpent || 0, previousPeriodData.totalSpent || 0) : undefined,
            format: 'currency' as const
        },
        {
            id: 'ticket',
            title: 'Ticket Médio',
            value: data.averageSpent || 0,
            icon: TrendingUp,
            description: 'Valor médio por cliente',
            gradient: 'from-indigo-500 to-indigo-600',
            trend: showComparison ? calculateTrend(data.averageSpent || 0, previousPeriodData.averageSpent || 0) : undefined,
            format: 'currency' as const
        },
        {
            id: 'visits',
            title: 'Total de Visitas',
            value: data.totalVisits || 0,
            icon: Activity,
            description: 'Atendimentos realizados',
            gradient: 'from-green-500 to-green-600',
            trend: showComparison ? calculateTrend(data.totalVisits || 0, previousPeriodData.totalVisits || 0) : undefined,
            format: 'number' as const
        },
        {
            id: 'birthdays',
            title: 'Aniversariantes',
            value: data.birthdays || 0,
            icon: Heart,
            description: 'Próximos 30 dias',
            gradient: 'from-pink-500 to-rose-500',
            badge: {
                text: 'Oportunidade',
                variant: 'secondary' as const
            }
        }
    ], [data, previousPeriodData, showComparison, calculateTrend])

    const handleCardClick = useCallback((statId: string, value: any) => {
        setSelectedMetric(statId)
        onCardClick?.(statId, value)
    }, [onCardClick])

    // Loading skeleton with better animation
    if (loading) {
        return (
            <div className={cn("space-y-6", className)}>
                <div className="flex items-center justify-between">
                    <div className="w-48 h-8 bg-slate-200 rounded animate-pulse"></div>
                    <div className="flex gap-2">
                        <div className="w-20 h-8 bg-slate-200 rounded animate-pulse"></div>
                        <div className="w-24 h-8 bg-slate-200 rounded animate-pulse"></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    {[...Array(8)].map((_, i) => (
                        <StatCard
                            key={i}
                            title=""
                            value={0}
                            icon={Users}
                            gradient="from-slate-200 to-slate-300"
                            loading={true}
                        />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className={cn("space-y-6", className)}>
            {/* Header with controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-purple-500" />
                        Estatísticas de Clientes
                    </h2>
                    <p className="text-slate-600">
                        Análise detalhada da base de clientes - {period}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex bg-slate-100 rounded-lg p-1">
                        <Button
                            variant={view === 'overview' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setView('overview')}
                        >
                            <Eye className="w-4 h-4 mr-1" />
                            Visão Geral
                        </Button>
                        <Button
                            variant={view === 'detailed' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setView('detailed')}
                        >
                            <PieChart className="w-4 h-4 mr-1" />
                            Detalhado
                        </Button>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {refreshData && (
                                <DropdownMenuItem onClick={refreshData}>
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Atualizar Dados
                                </DropdownMenuItem>
                            )}
                            {onExport && (
                                <DropdownMenuItem onClick={onExport}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Exportar Relatório
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                                <Share2 className="w-4 h-4 mr-2" />
                                Compartilhar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Alert for important metrics */}
            {(data.at_risk || 0) > 0 && (
                <Card className="border-l-4 border-l-amber-500 bg-amber-50/50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                            <div>
                                <p className="font-medium text-amber-800">
                                    Atenção: {data.at_risk} cliente{data.at_risk !== 1 ? 's' : ''} em risco
                                </p>
                                <p className="text-sm text-amber-700">
                                    Considere executar campanhas de retenção para reduzir o churn.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Main Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {statsConfig.map((stat) => (
                    <StatCard
                        key={stat.id}
                        title={stat.title}
                        value={stat.value}
                        icon={stat.icon}
                        description={stat.description}
                        trend={stat.trend}
                        gradient={stat.gradient}
                        format={stat.format}
                        onClick={() => handleCardClick(stat.id, stat.value)}
                        badge={stat.badge}
                        progress={stat.progress}
                        className={selectedMetric === stat.id ? 'ring-2 ring-purple-500' : ''}
                    />
                ))}
            </div>

            {/* Detailed Analysis Cards */}
            {view === 'detailed' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-top-4">
                    {/* Status Distribution */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="w-5 h-5 text-blue-500" />
                                Distribuição por Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { key: 'active', label: 'Ativos', value: data.active || 0, color: 'bg-emerald-500', icon: CheckCircle },
                                { key: 'inactive', label: 'Inativos', value: data.inactive || 0, color: 'bg-slate-400', icon: Clock },
                                { key: 'blocked', label: 'Bloqueados', value: data.blocked || 0, color: 'bg-red-500', icon: XCircle }
                            ].map((item) => {
                                const percentage = data.total ? Math.round((item.value / data.total) * 100) : 0
                                const IconComponent = item.icon

                                return (
                                    <div key={item.key} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                                                <IconComponent className="w-4 h-4 text-slate-500" />
                                                <span className="text-sm font-medium">{item.label}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-slate-500">{percentage}%</span>
                                                <span className="text-sm font-semibold">{item.value}</span>
                                            </div>
                                        </div>
                                        <Progress value={percentage} className="h-2" />
                                    </div>
                                )
                            })}
                        </CardContent>
                    </Card>

                    {/* Segment Distribution */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="w-5 h-5 text-purple-500" />
                                Segmentação de Clientes
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { key: 'vip', label: 'VIP', value: data.vip || 0, icon: Crown, color: 'text-amber-500' },
                                { key: 'regular', label: 'Regular', value: data.regular || 0, icon: Users, color: 'text-blue-500' },
                                { key: 'new', label: 'Novos', value: data.new || 0, icon: UserPlus, color: 'text-green-500' },
                                { key: 'at_risk', label: 'Em Risco', value: data.at_risk || 0, icon: AlertTriangle, color: 'text-red-500' }
                            ].map((item) => {
                                const percentage = data.total ? Math.round((item.value / data.total) * 100) : 0
                                const IconComponent = item.icon

                                return (
                                    <div key={item.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <IconComponent className={`w-5 h-5 ${item.color}`} />
                                            <div>
                                                <span className="text-sm font-medium">{item.label}</span>
                                                <p className="text-xs text-slate-500">{percentage}% do total</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-lg font-bold">{item.value}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </CardContent>
                    </Card>

                    {/* Performance Metrics */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="w-5 h-5 text-green-500" />
                                Métricas de Performance
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-blue-800">LTV Médio</span>
                                    <Star className="w-4 h-4 text-blue-600" />
                                </div>
                                <p className="text-2xl font-bold text-blue-900">
                                    R$ {(data.ltv || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-blue-600 mt-1">Lifetime Value por cliente</p>
                            </div>

                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-green-800">Frequência Média</span>
                                    <Flame className="w-4 h-4 text-green-600" />
                                </div>
                                <p className="text-2xl font-bold text-green-900">
                                    {data.averageVisits?.toFixed(1) || 0}
                                </p>
                                <p className="text-xs text-green-600 mt-1">Visitas por cliente</p>
                            </div>

                            {data.retentionRate !== undefined && (
                                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-purple-800">Taxa de Retenção</span>
                                        <ShieldCheck className="w-4 h-4 text-purple-600" />
                                    </div>
                                    <p className="text-2xl font-bold text-purple-900">
                                        {data.retentionRate.toFixed(1)}%
                                    </p>
                                    <p className="text-xs text-purple-600 mt-1">Clientes mantidos</p>
                                </div>
                            )}

                            {data.churnRate !== undefined && (
                                <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-orange-800">Taxa de Churn</span>
                                        <TrendingDown className="w-4 h-4 text-orange-600" />
                                    </div>
                                    <p className="text-2xl font-bold text-orange-900">
                                        {data.churnRate.toFixed(1)}%
                                    </p>
                                    <p className="text-xs text-orange-600 mt-1">Clientes perdidos no período</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Executive Summary */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 via-blue-50 to-purple-50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-800">
                        <Award className="w-5 h-5 text-blue-500" />
                        Resumo Executivo - {period}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="text-center space-y-2">
                            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                {data.total || 0}
                            </div>
                            <div className="text-sm text-slate-600">Total de Clientes</div>
                            <div className="text-xs text-slate-500">
                                Base ativa: {data.total ? Math.round((data.active || 0) / data.total * 100) : 0}%
                            </div>
                        </div>

                        <div className="text-center space-y-2">
                            <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                                {data.total ? Math.round((data.active || 0) / data.total * 100) : 0}%
                            </div>
                            <div className="text-sm text-slate-600">Taxa de Atividade</div>
                            <div className="text-xs text-slate-500">
                                {data.active || 0} clientes ativos
                            </div>
                        </div>

                        <div className="text-center space-y-2">
                            <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                R$ {Math.round(data.averageSpent || 0).toLocaleString('pt-BR')}
                            </div>
                            <div className="text-sm text-slate-600">Ticket Médio</div>
                            <div className="text-xs text-slate-500">
                                Por cliente ativo
                            </div>
                        </div>

                        <div className="text-center space-y-2">
                            <div className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                                {data.vip || 0}
                            </div>
                            <div className="text-sm text-slate-600">Clientes VIP</div>
                            <div className="text-xs text-slate-500">
                                {data.total ? Math.round((data.vip || 0) / data.total * 100) : 0}% do total
                            </div>
                        </div>
                    </div>

                    {/* Key Insights */}
                    <div className="mt-6 pt-6 border-t border-slate-200">
                        <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                            <TrendingUpIcon className="w-4 h-4" />
                            Insights Principais
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {data.newThisMonth && data.newThisMonth > 0 && (
                                <div className="flex items-center gap-2 text-green-700">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>{data.newThisMonth} novos clientes este mês</span>
                                </div>
                            )}

                            {(data.at_risk || 0) > 0 && (
                                <div className="flex items-center gap-2 text-red-700">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>{data.at_risk} clientes precisam de atenção</span>
                                </div>
                            )}

                            {(data.birthdays || 0) > 0 && (
                                <div className="flex items-center gap-2 text-purple-700">
                                    <Heart className="w-4 h-4" />
                                    <span>{data.birthdays} aniversariantes próximos</span>
                                </div>
                            )}

                            {data.growthRate && data.growthRate > 0 && (
                                <div className="flex items-center gap-2 text-blue-700">
                                    <TrendingUp className="w-4 h-4" />
                                    <span>Crescimento de {data.growthRate.toFixed(1)}% no período</span>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default ClientStats