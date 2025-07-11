'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import {
    Megaphone,
    Crown,
    AlertTriangle,
    Calendar,
    Mail,
    MessageSquare,
    TrendingUp,
    TrendingDown,
    Activity,
    DollarSign,
    Eye,
    Send,
    Pause,
    Play,
    CheckCircle,
    Zap,
    Heart,
    Sparkles,
    Filter,
    Plus,
    Edit,
    MoreHorizontal,
    RefreshCw,
    Search,
    ArrowUpRight,
    Brain,
    Keyboard,
    Loader2,
    XCircle,
    UserPlus,
    Users,
    Copy,
    Trash2
} from 'lucide-react'

// Hooks do sistema para campanhas
import {
    useCampaignsPage,
    useCampaignPerformanceReport,
    useAllSegmentData,
    useCreateCampaign,
    useUpdateCampaign,
    useDeleteCampaign,
    useToggleCampaignStatus,
    useDuplicateCampaign
} from '@/lib/hooks/useCampaigns'

// Hooks dos clientes (para compatibilidade)
import {
    useClientsBySegment,
    useClientStats,
    useUpcomingBirthdays
} from '@/lib/hooks/useClients'

// Store
import { useCampaignStore } from '@/store/useCampaignStore'

// Types
import type { Database } from '@/lib/database/supabase/types'
import {Sidebar} from "@/components/layout/sidebar";

type Campaign = Database['public']['Tables']['campaigns']['Row']
type CampaignStatus = Database['public']['Enums']['campaign_status_enum']
type CampaignType = Database['public']['Enums']['campaign_type_enum']
type ClientSegment = Database['public']['Enums']['client_segment_enum']

// Utility function for class names
const cn = (...classes: (string | undefined | null | boolean)[]) => {
    return classes.filter(Boolean).join(' ')
}

interface QuickAction {
    id: string
    title: string
    description: string
    icon: React.ElementType
    color: string
    action: () => void
    count?: number
    shortcut?: string
}

interface SmartInsight {
    type: 'opportunity' | 'warning' | 'success' | 'info'
    title: string
    description: string
    action?: {
        label: string
        onClick: () => void
    }
    value?: string | number
}

const CampaignsPage: React.FC = () => {
    // Estados principais
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [showShortcuts, setShowShortcuts] = useState(false)
    const [focusedRowIndex, setFocusedRowIndex] = useState(-1)

    // Refs para navegação
    const searchRef = useRef<HTMLInputElement>(null)

    // Store
    const { filters, pagination, setSearchQuery, setFilters, setPagination } = useCampaignStore()

    // Dados das campanhas (usando hooks reais)
    const paginationOptions = useMemo(() => ({
        page: pagination.page,
        limit: pagination.limit,
        filters: {
            ...filters,
            status: statusFilter !== 'all' ? statusFilter as CampaignStatus : undefined,
            searchQuery: searchTerm || undefined
        }
    }), [pagination.page, pagination.limit, filters, statusFilter, searchTerm])

    const {
        campaigns: campaignsQuery,
        performance: performanceQuery,
        templates: templatesQuery,
        isLoading: isLoadingMain
    } = useCampaignsPage(paginationOptions)

    // Dados dos clientes (para compatibilidade com insights)
    const { data: clientStats } = useClientStats()
    const { data: vipClients } = useClientsBySegment('vip')
    const { data: regularClients } = useClientsBySegment('regular')
    const { data: newClients } = useClientsBySegment('new')
    const { data: atRiskClients } = useClientsBySegment('at_risk')
    const { data: upcomingBirthdays } = useUpcomingBirthdays(30)

    // Dados de segmentação para campanhas
    const segmentData = useAllSegmentData()

    // Mutations
    const createCampaignMutation = useCreateCampaign()
    const updateCampaignMutation = useUpdateCampaign()
    const deleteCampaignMutation = useDeleteCampaign()
    const toggleStatusMutation = useToggleCampaignStatus()
    const duplicateCampaignMutation = useDuplicateCampaign()

    // Estados de loading combinados
    const isLoading = isLoadingMain || campaignsQuery.isLoading || performanceQuery.isLoading

    // Dados das campanhas
    const campaigns = campaignsQuery.data?.data || []
    const performanceData = performanceQuery.data

    // ================ HANDLERS ================
    const handleCreateCampaign = useCallback(() => {
        console.log('Abrindo criador de campanhas...')
        // Aqui integraria com modal de criação de campanha
    }, [])

    const handleCreateSegmentCampaign = useCallback((segment: string) => {
        console.log(`Criando campanha para segmento: ${segment}`)
        // Aqui integraria com criação automática baseada no segmento
    }, [])

    const handleAICampaign = useCallback(() => {
        console.log('Iniciando criação automática com IA...')
        // Aqui integraria com IA para sugerir campanhas baseadas nos dados
    }, [])

    const handleRefreshData = useCallback(() => {
        campaignsQuery.refetch()
        performanceQuery.refetch()
        console.log('Dados atualizados!')
    }, [campaignsQuery, performanceQuery])

    const handleViewCampaign = useCallback((campaignId: string) => {
        console.log('Abrindo detalhes da campanha:', campaignId)
    }, [])

    const handleAutoSegmentation = useCallback(() => {
        console.log('Executando segmentação automática...')
    }, [])

    const handleToggleStatus = useCallback((id: string, newStatus: CampaignStatus) => {
        toggleStatusMutation.mutate({ id, status: newStatus })
    }, [toggleStatusMutation])

    const handleDuplicateCampaign = useCallback((id: string) => {
        duplicateCampaignMutation.mutate({ id })
    }, [duplicateCampaignMutation])

    const handleDeleteCampaign = useCallback((id: string) => {
        if (confirm('Tem certeza que deseja excluir esta campanha?')) {
            deleteCampaignMutation.mutate(id)
        }
    }, [deleteCampaignMutation])

    // ================ NAVEGAÇÃO POR TECLADO ================
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'k':
                        e.preventDefault()
                        searchRef.current?.focus()
                        break
                    case 'n':
                        e.preventDefault()
                        handleCreateCampaign()
                        break
                    case 'r':
                        e.preventDefault()
                        handleRefreshData()
                        break
                    case '/':
                        e.preventDefault()
                        setShowShortcuts(!showShortcuts)
                        break
                }
            }

            // Navegação na lista
            if (campaigns.length > 0) {
                switch (e.key) {
                    case 'ArrowDown':
                        e.preventDefault()
                        setFocusedRowIndex(prev =>
                            prev < campaigns.length - 1 ? prev + 1 : prev
                        )
                        break
                    case 'ArrowUp':
                        e.preventDefault()
                        setFocusedRowIndex(prev => prev > 0 ? prev - 1 : prev)
                        break
                    case 'Enter':
                        if (focusedRowIndex >= 0) {
                            const campaign = campaigns[focusedRowIndex]
                            handleViewCampaign(campaign.id)
                        }
                        break
                    case 'Escape':
                        setFocusedRowIndex(-1)
                        break
                }
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [showShortcuts, focusedRowIndex, campaigns, handleCreateCampaign, handleRefreshData])

    // ================ DADOS CALCULADOS ================
    // Estatísticas calculadas baseadas em dados reais
    const stats = useMemo(() => {
        if (!performanceData) return {
            totalCampaigns: 0,
            activeCampaigns: 0,
            totalSent: 0,
            totalRevenue: 0,
            avgOpenRate: 0,
            avgConversionRate: 0
        }

        return {
            totalCampaigns: performanceData.total_campaigns,
            activeCampaigns: performanceData.active_campaigns,
            totalSent: performanceData.total_sent,
            totalRevenue: performanceData.total_revenue,
            avgOpenRate: performanceData.avg_open_rate,
            avgConversionRate: performanceData.avg_conversion_rate
        }
    }, [performanceData])

    // Smart Insights baseados em dados reais
    const smartInsights: SmartInsight[] = useMemo(() => {
        const insights: SmartInsight[] = []

        // Insights baseados nos dados reais dos clientes
        if (upcomingBirthdays && upcomingBirthdays.length > 0) {
            insights.push({
                type: 'opportunity',
                title: 'Oportunidade de Aniversários',
                description: `${upcomingBirthdays.length} clientes fazem aniversário nos próximos 30 dias. Configure campanhas personalizadas.`,
                action: {
                    label: 'Criar Campanha',
                    onClick: () => handleCreateSegmentCampaign('birthday')
                },
                value: upcomingBirthdays.length
            })
        }

        if (atRiskClients && atRiskClients.length > 0) {
            insights.push({
                type: 'warning',
                title: 'Clientes em Risco',
                description: `${atRiskClients.length} clientes precisam de campanhas de reativação urgente.`,
                action: {
                    label: 'Reativar',
                    onClick: () => handleCreateSegmentCampaign('at_risk')
                },
                value: atRiskClients.length
            })
        }

        if (stats.avgOpenRate > 70) {
            insights.push({
                type: 'success',
                title: 'Excelente Engajamento',
                description: `Taxa de abertura média de ${stats.avgOpenRate.toFixed(1)}% está acima da média do mercado.`,
                value: `${stats.avgOpenRate.toFixed(1)}%`
            })
        }

        if (newClients && newClients.length > 10) {
            insights.push({
                type: 'success',
                title: 'Boa Aquisição de Clientes',
                description: `${newClients.length} novos clientes este período. Configure sequência de boas-vindas.`,
                action: {
                    label: 'Config. Boas-vindas',
                    onClick: () => handleCreateSegmentCampaign('new')
                },
                value: newClients.length
            })
        }

        return insights
    }, [stats, upcomingBirthdays, atRiskClients, newClients, handleCreateSegmentCampaign])

    // Quick Actions baseados em dados reais
    const quickActions: QuickAction[] = useMemo(() => [
        {
            id: 'vip-campaign',
            title: 'Campanha VIP',
            description: `${vipClients?.length || 0} clientes elegíveis`,
            icon: Crown,
            color: 'from-amber-500 to-orange-500',
            action: () => handleCreateSegmentCampaign('vip'),
            count: vipClients?.length || 0,
            shortcut: 'V'
        },
        {
            id: 'birthday-campaign',
            title: 'Aniversariantes',
            description: `${upcomingBirthdays?.length || 0} próximos aniversários`,
            icon: Heart,
            color: 'from-pink-500 to-rose-500',
            action: () => handleCreateSegmentCampaign('birthday'),
            count: upcomingBirthdays?.length || 0,
            shortcut: 'B'
        },
        {
            id: 'reactivation',
            title: 'Reativação',
            description: `${atRiskClients?.length || 0} clientes em risco`,
            icon: AlertTriangle,
            color: 'from-red-500 to-red-600',
            action: () => handleCreateSegmentCampaign('at_risk'),
            count: atRiskClients?.length || 0,
            shortcut: 'R'
        },
        {
            id: 'auto-campaign',
            title: 'IA Automática',
            description: 'Segmentar com IA',
            icon: Brain,
            color: 'from-purple-500 to-indigo-600',
            action: handleAutoSegmentation,
            shortcut: 'A'
        }
    ], [vipClients?.length, upcomingBirthdays?.length, atRiskClients?.length, handleCreateSegmentCampaign, handleAutoSegmentation])

    // Métricas principais
    const metricsData = useMemo(() => [
        {
            title: 'Campanhas Ativas',
            value: stats.activeCampaigns,
            total: stats.totalCampaigns,
            icon: Megaphone,
            gradient: 'from-blue-500 to-blue-600',
            trend: { value: 12, isPositive: true },
            onClick: () => setStatusFilter('active')
        },
        {
            title: 'Clientes Alcançados',
            value: stats.totalSent,
            icon: Send,
            gradient: 'from-green-500 to-emerald-500',
            trend: { value: 25, isPositive: true },
            onClick: () => console.log('Ver alcance')
        },
        {
            title: 'Taxa de Abertura',
            value: `${stats.avgOpenRate.toFixed(1)}%`,
            icon: Eye,
            gradient: 'from-purple-500 to-purple-600',
            trend: { value: 8, isPositive: true },
            onClick: () => console.log('Ver engajamento')
        },
        {
            title: 'ROI Campanhas',
            value: `R$ ${stats.totalRevenue.toLocaleString('pt-BR')}`,
            icon: DollarSign,
            gradient: 'from-amber-500 to-orange-500',
            trend: { value: 15, isPositive: true },
            onClick: () => console.log('Ver ROI')
        }
    ], [stats])

    // ================ UTILITÁRIOS ================
    const getCampaignTypeIcon = (type: CampaignType) => {
        const icons = {
            email: Mail,
            sms: MessageSquare,
            whatsapp: MessageSquare,
            calendar: Calendar,
            birthday: Heart
        }
        return icons[type] || Mail
    }

    const getStatusBadge = (status: CampaignStatus) => {
        const statusConfig = {
            draft: { label: 'Rascunho', variant: 'secondary' as const, icon: Edit },
            active: { label: 'Ativa', variant: 'default' as const, icon: Play },
            paused: { label: 'Pausada', variant: 'secondary' as const, icon: Pause },
            completed: { label: 'Concluída', variant: 'default' as const, icon: CheckCircle },
            cancelled: { label: 'Cancelada', variant: 'destructive' as const, icon: XCircle }
        }

        const config = statusConfig[status]
        const Icon = config.icon

        return (
            <Badge variant={config.variant} className="flex items-center gap-1">
                <Icon className="w-3 h-3" />
                {config.label}
            </Badge>
        )
    }

    // Calcular métricas da campanha
    const getCampaignMetrics = (campaign: Campaign) => {
        const openRate = campaign.target_count > 0
            ? (campaign.opened_count / campaign.target_count) * 100
            : 0
        const clickRate = campaign.opened_count > 0
            ? (campaign.clicked_count / campaign.opened_count) * 100
            : 0
        const conversionRate = campaign.target_count > 0
            ? (campaign.converted_count / campaign.target_count) * 100
            : 0

        return { openRate, clickRate, conversionRate }
    }

    // ================ LOADING STATE ================
    if (isLoading && campaigns.length === 0) {
        return (
            <TooltipProvider>
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                    <div className="lg:ml-64">
                        <div className="flex flex-col items-center justify-center h-96 space-y-4">
                            <div className="relative">
                                <Loader2 className="w-12 h-12 animate-spin text-pink-500" />
                                <div className="absolute inset-0 rounded-full bg-pink-500/20 animate-ping"></div>
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">Carregando Campanhas</h3>
                                <p className="text-slate-600">Analisando dados dos clientes...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </TooltipProvider>
        )
    }

    // ================ RENDER PRINCIPAL ================
    return (
        <TooltipProvider>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                {/* Sidebar */}
                <Sidebar />
                <div className="lg:ml-64">
                    {/* Header */}
                    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
                        <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-600 rounded-lg flex items-center justify-center shadow-lg shadow-pink-500/25">
                                            <Megaphone className="w-4 h-4 text-white" />
                                        </div>
                                        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                            Campanhas de Marketing
                                        </h1>
                                        {isLoading && (
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin text-pink-500" />
                                                <span className="text-sm text-pink-600">Sincronizando...</span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-slate-600 text-xs sm:text-sm font-medium">
                                        Campanhas inteligentes baseadas na segmentação real dos seus clientes
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 sm:gap-3">
                                    <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-lg shadow-emerald-500/25 text-xs">
                                        <Activity className="w-3 h-3 mr-1" />
                                        {clientStats?.total || 0} Clientes
                                    </Badge>

                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleRefreshData}
                                                    disabled={isLoading}
                                                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                                                >
                                                    <RefreshCw className={cn("w-4 h-4 text-slate-600", isLoading && "animate-spin")} />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Atualizar dados (Ctrl+R)</p>
                                            </TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                                                >
                                                    <Filter className="w-4 h-4 text-slate-600" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Filtros avançados</p>
                                            </TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setShowShortcuts(!showShortcuts)}
                                                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                                                >
                                                    <Keyboard className="w-4 h-4 text-slate-600" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Atalhos (Ctrl+/)</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>

                                    <Button
                                        onClick={handleCreateCampaign}
                                        disabled={createCampaignMutation.isPending}
                                        className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-lg shadow-pink-500/25 border-0"
                                    >
                                        {createCampaignMutation.isPending ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Plus className="w-4 h-4 mr-2" />
                                        )}
                                        Nova Campanha
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Keyboard Shortcuts Panel */}
                    {showShortcuts && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                            <Card className="w-full max-w-md">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Keyboard className="w-5 h-5" />
                                        Atalhos do Teclado
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="grid grid-cols-1 gap-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>Buscar</span>
                                            <kbd className="px-2 py-1 bg-slate-100 rounded text-xs">Ctrl+K</kbd>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Nova Campanha</span>
                                            <kbd className="px-2 py-1 bg-slate-100 rounded text-xs">Ctrl+N</kbd>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Atualizar</span>
                                            <kbd className="px-2 py-1 bg-slate-100 rounded text-xs">Ctrl+R</kbd>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Navegar</span>
                                            <kbd className="px-2 py-1 bg-slate-100 rounded text-xs">↑ ↓</kbd>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => setShowShortcuts(false)}
                                        className="w-full"
                                    >
                                        Fechar
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Content */}
                    <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                        <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">

                            {/* Smart Insights baseados em dados reais */}
                            {smartInsights.length > 0 && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {smartInsights.slice(0, 2).map((insight, index) => (
                                        <Alert key={index} className={cn(
                                            "border-l-4 animate-in slide-in-from-left-4",
                                            insight.type === 'opportunity' && "border-l-blue-500 bg-blue-50/50",
                                            insight.type === 'warning' && "border-l-amber-500 bg-amber-50/50",
                                            insight.type === 'success' && "border-l-green-500 bg-green-50/50",
                                            insight.type === 'info' && "border-l-purple-500 bg-purple-50/50"
                                        )}>
                                            <Zap className="h-4 w-4" />
                                            <AlertDescription className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium">{insight.title}</div>
                                                    <div className="text-sm text-slate-600">{insight.description}</div>
                                                </div>
                                                {insight.action && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={insight.action.onClick}
                                                    >
                                                        {insight.action.label}
                                                        <ArrowUpRight className="w-3 h-3 ml-1" />
                                                    </Button>
                                                )}
                                            </AlertDescription>
                                        </Alert>
                                    ))}
                                </div>
                            )}

                            {/* Métricas Principais */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                                {metricsData.map((metric, index) => (
                                    <Card
                                        key={index}
                                        className="relative overflow-hidden border-0 shadow-xl shadow-slate-200/60 hover:shadow-2xl hover:shadow-slate-300/60 transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
                                        onClick={metric.onClick}
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
                                        <CardContent className="p-4 lg:p-6 relative">
                                            <div className="flex items-center justify-between mb-3 lg:mb-4">
                                                <div className={`p-2 lg:p-3 rounded-2xl bg-gradient-to-br ${metric.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                                    <metric.icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                                                </div>
                                                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                                    metric.trend.isPositive
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {metric.trend.isPositive ? (
                                                        <TrendingUp className="w-3 h-3" />
                                                    ) : (
                                                        <TrendingDown className="w-3 h-3" />
                                                    )}
                                                    +{metric.trend.value}%
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <p className="text-xs lg:text-sm font-medium text-slate-600">{metric.title}</p>
                                                <p className="text-xl lg:text-3xl font-bold text-slate-900 group-hover:text-2xl lg:group-hover:text-4xl transition-all duration-300">
                                                    {metric.value}
                                                </p>
                                                {metric.total && (
                                                    <p className="text-xs text-slate-500">
                                                        de {metric.total} total
                                                    </p>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* Quick Actions baseados em dados reais */}
                            <Card className="border-0 shadow-xl shadow-slate-200/60">
                                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                    <CardTitle className="flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-purple-500" />
                                        Ações Inteligentes
                                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                                            Baseado nos seus dados
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {quickActions.map((action) => (
                                            <Button
                                                key={action.id}
                                                variant="outline"
                                                className="h-auto p-4 flex flex-col items-start text-left bg-white hover:bg-gradient-to-r hover:from-white hover:to-slate-50 border-slate-200 group"
                                                onClick={action.action}
                                                disabled={action.count === 0 && action.id !== 'auto-campaign'}
                                            >
                                                <div className="flex items-center justify-between w-full mb-2">
                                                    <div className={`p-2 rounded-lg bg-gradient-to-br ${action.color} group-hover:scale-110 transition-transform duration-200`}>
                                                        <action.icon className="w-4 h-4 text-white" />
                                                    </div>
                                                    {action.count !== undefined && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            {action.count}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <span className="font-semibold text-slate-900 group-hover:text-purple-600 transition-colors">
                                                    {action.title}
                                                </span>
                                                <span className="text-xs text-slate-600">{action.description}</span>
                                                {action.shortcut && (
                                                    <kbd className="mt-2 px-2 py-1 bg-slate-100 rounded text-xs text-slate-500">
                                                        {action.shortcut}
                                                    </kbd>
                                                )}
                                            </Button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Busca e Filtros */}
                            <Card className="border-0 shadow-xl shadow-slate-200/60">
                                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                    <CardTitle className="flex items-center gap-2">
                                        <Search className="w-5 h-5 text-purple-500" />
                                        Buscar Campanhas
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="flex flex-col lg:flex-row gap-4">
                                        <div className="flex-1">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                                <Input
                                                    ref={searchRef}
                                                    placeholder="Buscar campanhas... (Ctrl+K)"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="pl-10 border-slate-200 focus:border-pink-500 focus:ring-pink-500/20"
                                                />
                                                {searchTerm && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                                                        onClick={() => setSearchTerm('')}
                                                    >
                                                        <XCircle className="w-3 h-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                                                <TabsList className="bg-slate-100 border-0">
                                                    <TabsTrigger value="all" className="data-[state=active]:bg-white">Todas</TabsTrigger>
                                                    <TabsTrigger value="active" className="data-[state=active]:bg-white">Ativas</TabsTrigger>
                                                    <TabsTrigger value="draft" className="data-[state=active]:bg-white">Rascunhos</TabsTrigger>
                                                    <TabsTrigger value="completed" className="data-[state=active]:bg-white">Concluídas</TabsTrigger>
                                                </TabsList>
                                            </Tabs>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Lista de Campanhas */}
                            <Card className="border-0 shadow-xl shadow-slate-200/60">
                                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2">
                                            <Megaphone className="w-5 h-5 text-pink-500" />
                                            Campanhas ({campaigns.length})
                                        </CardTitle>
                                        <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">
                                            {campaigns.length} resultados
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {campaigns.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                                {searchTerm || statusFilter !== 'all'
                                                    ? 'Nenhuma campanha encontrada'
                                                    : 'Configure suas primeiras campanhas'
                                                }
                                            </h3>
                                            <p className="text-slate-500 mb-6">
                                                {searchTerm || statusFilter !== 'all'
                                                    ? 'Tente ajustar os filtros de busca.'
                                                    : 'Use os dados dos seus clientes para criar campanhas personalizadas.'
                                                }
                                            </p>
                                            <Button
                                                onClick={handleCreateCampaign}
                                                disabled={createCampaignMutation.isPending}
                                                className="bg-gradient-to-r from-pink-500 to-rose-600"
                                            >
                                                {createCampaignMutation.isPending ? (
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Plus className="w-4 h-4 mr-2" />
                                                )}
                                                Nova Campanha
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            {/* Table Header */}
                                            <div className="grid grid-cols-10 gap-4 p-4 bg-slate-50/50 border-b text-sm font-semibold text-slate-700">
                                                <div>Campanha</div>
                                                <div>Tipo</div>
                                                <div>Segmento</div>
                                                <div>Status</div>
                                                <div>Alcance</div>
                                                <div>Abertura</div>
                                                <div>Conversão</div>
                                                <div>ROI</div>
                                                <div>Criada</div>
                                                <div className="text-right">Ações</div>
                                            </div>

                                            {/* Table Body */}
                                            {campaigns.map((campaign, index) => {
                                                const Icon = getCampaignTypeIcon(campaign.type)
                                                const metrics = getCampaignMetrics(campaign)

                                                return (
                                                    <div
                                                        key={campaign.id}
                                                        className={cn(
                                                            "grid grid-cols-10 gap-4 p-4 border-b hover:bg-slate-50/50 transition-all duration-200 cursor-pointer group",
                                                            index === focusedRowIndex && "bg-blue-50 ring-2 ring-blue-500"
                                                        )}
                                                        onClick={() => handleViewCampaign(campaign.id)}
                                                    >
                                                        <div>
                                                            <p className="font-medium text-slate-900 group-hover:text-pink-600 transition-colors">
                                                                {campaign.name}
                                                            </p>
                                                            <p className="text-sm text-slate-500 truncate">{campaign.description}</p>
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <Icon className="w-4 h-4 text-slate-600" />
                                                                <span className="text-sm capitalize">{campaign.type}</span>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <Badge variant="outline" className="capitalize">
                                                                {campaign.target_segment || 'Todos'}
                                                            </Badge>
                                                        </div>
                                                        <div>
                                                            {getStatusBadge(campaign.status)}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">{campaign.sent_count}</span>
                                                            <span className="text-slate-500">/{campaign.target_count}</span>
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium">{metrics.openRate.toFixed(1)}%</span>
                                                                <Progress value={metrics.openRate} className="w-16 h-1" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">{metrics.conversionRate.toFixed(1)}%</span>
                                                        </div>
                                                        <div>
                                                            <span className="font-medium text-green-600">
                                                                R$ {campaign.revenue_generated.toLocaleString('pt-BR')}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-sm text-slate-500">
                                                                {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
                                                            </span>
                                                        </div>
                                                        <div className="text-right" onClick={(e) => e.stopPropagation()}>
                                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => handleDuplicateCampaign(campaign.id)}
                                                                            disabled={duplicateCampaignMutation.isPending}
                                                                            className="h-8 w-8 p-0"
                                                                        >
                                                                            <Copy className="h-3 w-3" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Duplicar</TooltipContent>
                                                                </Tooltip>

                                                                {campaign.status === 'active' ? (
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => handleToggleStatus(campaign.id, 'paused')}
                                                                                disabled={toggleStatusMutation.isPending}
                                                                                className="h-8 w-8 p-0"
                                                                            >
                                                                                <Pause className="h-3 w-3" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>Pausar</TooltipContent>
                                                                    </Tooltip>
                                                                ) : (
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => handleToggleStatus(campaign.id, 'active')}
                                                                                disabled={toggleStatusMutation.isPending}
                                                                                className="h-8 w-8 p-0"
                                                                            >
                                                                                <Play className="h-3 w-3" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>Ativar</TooltipContent>
                                                                    </Tooltip>
                                                                )}

                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => handleDeleteCampaign(campaign.id)}
                                                                            disabled={deleteCampaignMutation.isPending}
                                                                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                                                        >
                                                                            <Trash2 className="h-3 w-3" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Excluir</TooltipContent>
                                                                </Tooltip>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </main>
                </div>
            </div>
        </TooltipProvider>
    )
}

export default CampaignsPage