'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import {
    Calendar,
    ArrowLeft,
    Clock,
    DollarSign,
    Star,
    CheckCircle,
    Filter,
    Download,
    Search,
    TrendingUp,
    Activity,
    MessageSquare,
    Mail,
    CalendarDays,
    CreditCard,
    FileText,
    User,
    Zap,
    Gift,
    RefreshCw,
    Heart,
    Brain,
    Keyboard,
    Loader2,
    XCircle,
    ArrowUpRight,
} from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import {
    useClient,
    useClientHistory,
    useClientStats
} from '@/lib/hooks/useClients'
import { useAppointments } from "@/lib/hooks/useAppointment"
import { Sidebar } from '@/components/layout/sidebar'
import { toast } from 'sonner'

interface HistoryEvent {
    id: string
    type: 'appointment' | 'payment' | 'communication' | 'note' | 'campaign'
    date: string
    title: string
    description: string
    value?: number
    status?: 'completed' | 'cancelled' | 'no_show' | 'pending'
    rating?: number
    metadata?: Record<string, any>
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

const ClientHistoryPage: React.FC = () => {
    const params = useParams()
    const router = useRouter()
    const clientId = params.id as string

    // Estados principais
    const [activeTab, setActiveTab] = useState('timeline')
    const [filterType, setFilterType] = useState<string>('all')
    const [filterPeriod, setFilterPeriod] = useState<string>('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [showShortcuts, setShowShortcuts] = useState(false)
    const [focusedEventIndex, setFocusedEventIndex] = useState(-1)

    // Refs para navegação
    const searchRef = useRef<HTMLInputElement>(null)

    // Hooks
    const {
        data: client,
        isLoading: clientLoading,
        error: clientError
    } = useClient(clientId)

    const {
        data: clientHistory,
        isLoading: historyLoading,
        refetch: refetchHistory
    } = useClientHistory(clientId)

    const {
        data: clientStats,
        isLoading: statsLoading
    } = useClientStats(client?.user_id)

    const {
        appointmentsWithDetails: appointments,
        loading: appointmentsLoading,
        fetchAppointmentsWithDetails,
        stats: appointmentStats
    } = useAppointments({
        initialLimit: 50,
        initialFilters: { clientId },
        autoFetch: !!clientId,
        userId: client?.user_id
    })

    const isLoading = clientLoading || historyLoading || statsLoading || appointmentsLoading

    // Convert appointments to history events
    const historyEvents: HistoryEvent[] = useMemo(() => {
        if (!appointments) return []

        return appointments.map(appointment => ({
            id: appointment.id,
            type: 'appointment' as const,
            date: appointment.scheduled_datetime,
            title: appointment.procedure?.name || 'Procedimento',
            description: appointment.notes || 'Consulta realizada',
            value: appointment.price || 0,
            status: appointment.status as any,
            rating: appointment.rating || undefined,
            metadata: {
                duration: appointment.duration_minutes,
                professional: appointment.professional_name,
                procedure_id: appointment.procedure_id
            }
        }))
    }, [appointments])

    // Navegação por teclado
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'k':
                        e.preventDefault()
                        searchRef.current?.focus()
                        break
                    case 'r':
                        e.preventDefault()
                        handleRefreshData()
                        break
                    case '/':
                        e.preventDefault()
                        setShowShortcuts(!showShortcuts)
                        break
                    case 'b':
                        e.preventDefault()
                        router.back()
                        break
                }
            }

            // Navegação nos eventos
            if (activeTab === 'timeline' && filteredEvents.length > 0) {
                switch (e.key) {
                    case 'ArrowDown':
                        e.preventDefault()
                        setFocusedEventIndex(prev =>
                            prev < filteredEvents.length - 1 ? prev + 1 : prev
                        )
                        break
                    case 'ArrowUp':
                        e.preventDefault()
                        setFocusedEventIndex(prev => prev > 0 ? prev - 1 : prev)
                        break
                    case 'Escape':
                        setFocusedEventIndex(-1)
                        break
                }
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [showShortcuts, activeTab, focusedEventIndex, router])

    // Filtrar eventos
    const filteredEvents = useMemo(() => {
        let filtered = historyEvents

        if (filterType !== 'all') {
            filtered = filtered.filter(event => event.type === filterType)
        }

        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase()
            filtered = filtered.filter(event =>
                event.title.toLowerCase().includes(searchLower) ||
                event.description.toLowerCase().includes(searchLower)
            )
        }

        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }, [historyEvents, filterType, searchTerm])

    // Estatísticas calculadas
    const stats = useMemo(() => {
        const totalEvents = filteredEvents.length
        const appointments = filteredEvents.filter(e => e.type === 'appointment').length
        const payments = filteredEvents.filter(e => e.type === 'payment').length
        const communications = filteredEvents.filter(e => e.type === 'communication').length
        const totalValue = filteredEvents.filter(e => e.value).reduce((sum, e) => sum + (e.value || 0), 0)
        const ratedEvents = filteredEvents.filter(e => e.rating)
        const avgRating = ratedEvents.length > 0
            ? ratedEvents.reduce((sum, e) => sum + (e.rating || 0), 0) / ratedEvents.length
            : 0

        return {
            totalEvents,
            appointments,
            payments,
            communications,
            totalValue,
            avgRating
        }
    }, [filteredEvents])

    // Smart Insights baseados em dados reais
    const smartInsights: SmartInsight[] = useMemo(() => {
        const insights: SmartInsight[] = []

        if (stats.avgRating >= 4.5) {
            insights.push({
                type: 'success',
                title: 'Cliente Muito Satisfeito',
                description: `Avaliação média de ${stats.avgRating.toFixed(1)} estrelas indica alta satisfação.`,
                value: `${stats.avgRating.toFixed(1)}/5`
            })
        }

        if (stats.appointments > 5) {
            insights.push({
                type: 'opportunity',
                title: 'Cliente Fiel',
                description: `${stats.appointments} consultas realizadas. Considere ofertar programa de fidelidade.`,
                action: {
                    label: 'Ver Programas',
                    onClick: () => console.log('Abrindo programas de fidelidade')
                }
            })
        }

        if (historyEvents.length > 0) {
            const daysSinceLastVisit = Math.floor((Date.now() - new Date(historyEvents[0]?.date || 0).getTime()) / (1000 * 60 * 60 * 24))
            if (daysSinceLastVisit > 30) {
                insights.push({
                    type: 'warning',
                    title: 'Cliente Ausente',
                    description: `Última visita há ${daysSinceLastVisit} dias. Considere campanha de reativação.`,
                    action: {
                        label: 'Criar Campanha',
                        onClick: () => console.log('Criando campanha de reativação')
                    }
                })
            }
        }

        return insights
    }, [stats, historyEvents])

    // Métricas principais baseadas em dados reais
    const metricsData = useMemo(() => [
        {
            title: 'Total de Eventos',
            value: stats.totalEvents,
            icon: Activity,
            gradient: 'from-blue-500 to-blue-600',
            trend: { value: 15, isPositive: true },
            onClick: () => setFilterType('all')
        },
        {
            title: 'Valor Total',
            value: `R$ ${stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            icon: DollarSign,
            gradient: 'from-green-500 to-emerald-500',
            trend: { value: 25, isPositive: true },
            onClick: () => setFilterType('payment')
        },
        {
            title: 'Agendamentos',
            value: stats.appointments,
            icon: CalendarDays,
            gradient: 'from-purple-500 to-purple-600',
            trend: { value: 8, isPositive: true },
            onClick: () => setFilterType('appointment')
        },
        {
            title: 'Avaliação Média',
            value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : 'N/A',
            icon: Star,
            gradient: 'from-amber-500 to-orange-500',
            trend: { value: 5, isPositive: true },
            onClick: () => setActiveTab('analytics')
        }
    ], [stats])

    // Handlers
    const handleRefreshData = useCallback(async () => {
        try {
            await Promise.all([
                refetchHistory(),
                fetchAppointmentsWithDetails()
            ])
            toast.success('Dados atualizados!')
        } catch (error) {
            toast.error('Erro ao atualizar dados')
        }
    }, [refetchHistory, fetchAppointmentsWithDetails])

    const handleExportHistory = useCallback(() => {
        toast.info('Funcionalidade de exportação em desenvolvimento')
    }, [])

    const handleScheduleAppointment = useCallback(() => {
        router.push(`/agendamentos/novo?clientId=${clientId}`)
    }, [router, clientId])

    // Utilitários
    const getEventIcon = (type: HistoryEvent['type']) => {
        const icons = {
            appointment: CalendarDays,
            payment: CreditCard,
            communication: MessageSquare,
            note: FileText,
            campaign: Mail
        }
        return icons[type] || Activity
    }

    const getEventColor = (type: HistoryEvent['type']) => {
        const colors = {
            appointment: 'from-blue-500 to-blue-600',
            payment: 'from-green-500 to-emerald-500',
            communication: 'from-purple-500 to-purple-600',
            note: 'from-amber-500 to-orange-500',
            campaign: 'from-pink-500 to-rose-500'
        }
        return colors[type] || 'from-slate-500 to-slate-600'
    }

    const getStatusBadge = (status?: string) => {
        if (!status) return null

        const statusConfig = {
            completed: { label: 'Concluído', variant: 'default' as const },
            cancelled: { label: 'Cancelado', variant: 'destructive' as const },
            no_show: { label: 'Não Compareceu', variant: 'destructive' as const },
            pending: { label: 'Pendente', variant: 'secondary' as const },
            scheduled: { label: 'Agendado', variant: 'secondary' as const },
            confirmed: { label: 'Confirmado', variant: 'default' as const }
        }

        const config = statusConfig[status as keyof typeof statusConfig]
        return config ? <Badge variant={config.variant}>{config.label}</Badge> : null
    }

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString)
        return {
            date: date.toLocaleDateString('pt-BR'),
            time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }
    }

    // Loading state
    if (isLoading) {
        return (
            <TooltipProvider>
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                    <Sidebar />
                    <div className="lg:ml-64">
                        <div className="flex flex-col items-center justify-center h-96 space-y-4">
                            <div className="relative">
                                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                                <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping"></div>
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">Carregando Histórico</h3>
                                <p className="text-slate-600">Preparando cronologia do cliente...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </TooltipProvider>
        )
    }

    if (clientError || !client) {
        return (
            <TooltipProvider>
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                    <Sidebar />
                    <div className="lg:ml-64">
                        <div className="flex flex-col items-center justify-center h-96 space-y-4">
                            <XCircle className="w-12 h-12 text-red-500" />
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">Cliente não encontrado</h3>
                                <p className="text-slate-600">O cliente solicitado não foi encontrado.</p>
                                <Button className="mt-4" onClick={() => router.push('/clientes')}>
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Voltar para Clientes
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </TooltipProvider>
        )
    }

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <Sidebar />

                <div className="lg:ml-64">
                    {/* Header */}
                    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
                        <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="p-2"
                                                onClick={() => router.push(`/clientes/${clientId}`)}
                                            >
                                                <ArrowLeft className="w-4 h-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Voltar para perfil (Ctrl+B)</p>
                                        </TooltipContent>
                                    </Tooltip>

                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                                            {client.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                                Histórico - {client.name}
                                            </h1>
                                            <p className="text-slate-600 text-xs sm:text-sm font-medium">
                                                Cronologia completa de interações e atividades
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleRefreshData}
                                                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200"
                                                >
                                                    <RefreshCw className="w-4 h-4 text-slate-600" />
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
                                                    onClick={handleExportHistory}
                                                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200"
                                                >
                                                    <Download className="w-4 h-4 text-slate-600" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Exportar histórico</p>
                                            </TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setShowShortcuts(!showShortcuts)}
                                                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200"
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
                                        onClick={handleScheduleAppointment}
                                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25 border-0"
                                    >
                                        <Calendar className="w-4 h-4 mr-2" />
                                        Agendar
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
                                            <span>Voltar</span>
                                            <kbd className="px-2 py-1 bg-slate-100 rounded text-xs">Ctrl+B</kbd>
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

                            {/* Smart Insights */}
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

                            {/* Métricas do Histórico */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                                {metricsData.map((metric, index) => (
                                    <Card
                                        key={index}
                                        className="relative overflow-hidden border-0 shadow-xl shadow-slate-200/60 hover:shadow-2xl hover:shadow-slate-300/60 transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
                                        onClick={metric.onClick}
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
                                        <CardContent className="p-4 lg:p-6 relative">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className={`p-2 lg:p-3 rounded-2xl bg-gradient-to-br ${metric.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                                    <metric.icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                                                </div>
                                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs lg:text-sm font-medium text-slate-600">{metric.title}</p>
                                                <p className="text-xl lg:text-3xl font-bold text-slate-900 group-hover:text-2xl lg:group-hover:text-4xl transition-all duration-300">
                                                    {metric.value}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* Filtros */}
                            <Card className="border-0 shadow-xl shadow-slate-200/60">
                                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                    <CardTitle className="flex items-center gap-2">
                                        <Filter className="w-5 h-5 text-indigo-500" />
                                        Filtros de Histórico
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="flex flex-col lg:flex-row gap-4">
                                        <div className="flex-1">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                                <Input
                                                    ref={searchRef}
                                                    placeholder="Buscar no histórico... (Ctrl+K)"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="pl-10 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
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
                                            <Tabs value={filterType} onValueChange={setFilterType}>
                                                <TabsList className="bg-slate-100 border-0">
                                                    <TabsTrigger value="all" className="data-[state=active]:bg-white">Todos</TabsTrigger>
                                                    <TabsTrigger value="appointment" className="data-[state=active]:bg-white">Consultas</TabsTrigger>
                                                    <TabsTrigger value="payment" className="data-[state=active]:bg-white">Pagamentos</TabsTrigger>
                                                    <TabsTrigger value="communication" className="data-[state=active]:bg-white">Comunicação</TabsTrigger>
                                                </TabsList>
                                            </Tabs>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Timeline de Atividades */}
                            <Card className="border-0 shadow-xl shadow-slate-200/60">
                                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2">
                                            <Clock className="w-5 h-5 text-blue-500" />
                                            Timeline de Atividades
                                        </CardTitle>
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                            {filteredEvents.length} eventos
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    {filteredEvents.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                                Nenhum evento encontrado
                                            </h3>
                                            <p className="text-slate-500">
                                                {searchTerm || filterType !== 'all'
                                                    ? 'Tente ajustar os filtros para ver mais eventos.'
                                                    : 'Nenhuma atividade registrada ainda.'
                                                }
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {filteredEvents.map((event, index) => {
                                                const Icon = getEventIcon(event.type)
                                                const isLast = index === filteredEvents.length - 1
                                                const datetime = formatDateTime(event.date)

                                                return (
                                                    <div
                                                        key={event.id}
                                                        className={cn(
                                                            "relative",
                                                            index === focusedEventIndex && "ring-2 ring-blue-500 rounded-lg"
                                                        )}
                                                    >
                                                        {/* Timeline line */}
                                                        {!isLast && (
                                                            <div className="absolute left-6 top-12 w-0.5 h-16 bg-slate-200"></div>
                                                        )}

                                                        <div className="flex gap-4">
                                                            {/* Icon */}
                                                            <div className={`flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br ${getEventColor(event.type)} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                                                                <Icon className="w-6 h-6 text-white" />
                                                            </div>

                                                            {/* Content */}
                                                            <div className="flex-1 min-w-0">
                                                                <Card className="border border-slate-200 hover:shadow-md transition-all duration-200 hover:-translate-y-1 group">
                                                                    <CardContent className="p-4">
                                                                        <div className="flex items-start justify-between mb-2">
                                                                            <div>
                                                                                <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                                                                                    {event.title}
                                                                                </h3>
                                                                                <p className="text-sm text-slate-500">
                                                                                    {datetime.date} às {datetime.time}
                                                                                </p>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                {event.value && (
                                                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                                                        R$ {event.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                                    </Badge>
                                                                                )}
                                                                                {getStatusBadge(event.status)}
                                                                            </div>
                                                                        </div>

                                                                        <p className="text-sm text-slate-700 mb-3">{event.description}</p>

                                                                        {/* Rating */}
                                                                        {event.rating && (
                                                                            <div className="flex items-center gap-2 mb-3">
                                                                                <span className="text-sm font-medium text-slate-600">Avaliação:</span>
                                                                                <div className="flex items-center gap-1">
                                                                                    {[...Array(5)].map((_, i) => (
                                                                                        <Star
                                                                                            key={i}
                                                                                            className={`w-4 h-4 ${
                                                                                                i < event.rating! ? 'text-yellow-400 fill-current' : 'text-slate-300'
                                                                                            }`}
                                                                                        />
                                                                                    ))}
                                                                                    <span className="text-sm text-slate-600 ml-1">
                                                                                        {event.rating}/5
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Metadata */}
                                                                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                                                                            <div className="border-t pt-3 mt-3">
                                                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                                                    {Object.entries(event.metadata).map(([key, value]) => (
                                                                                        <div key={key} className="flex justify-between">
                                                                                            <span className="text-slate-500 capitalize">{key}:</span>
                                                                                            <span className="text-slate-700 font-medium">
                                                                                                {typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : String(value)}
                                                                                            </span>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </CardContent>
                                                                </Card>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Quick Actions */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                                        <CardTitle className="flex items-center gap-2 text-blue-800">
                                            <User className="w-5 h-5" />
                                            Jornada do Cliente
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                                <div>
                                                    <p className="font-medium text-green-800">Primeira Consulta</p>
                                                    <p className="text-sm text-green-600">Cliente desde {formatDateTime(client.created_at).date}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                                                <CheckCircle className="w-5 h-5 text-blue-600" />
                                                <div>
                                                    <p className="font-medium text-blue-800">Cliente Ativo</p>
                                                    <p className="text-sm text-blue-600">{stats.appointments} consultas realizadas</p>
                                                </div>
                                            </div>
                                            {stats.avgRating > 0 && (
                                                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                                                    <Heart className="w-5 h-5 text-purple-600" />
                                                    <div>
                                                        <p className="font-medium text-purple-800">Satisfação</p>
                                                        <p className="text-sm text-purple-600">Avaliação média: {stats.avgRating.toFixed(1)}/5</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                                        <CardTitle className="flex items-center gap-2 text-amber-800">
                                            <Zap className="w-5 h-5" />
                                            Próximas Ações
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="space-y-3">
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start h-auto p-3 hover:bg-amber-50 border-amber-200"
                                                onClick={handleScheduleAppointment}
                                            >
                                                <Calendar className="w-5 h-5 text-amber-600 mr-3" />
                                                <div className="text-left">
                                                    <p className="font-medium text-slate-900">Agendar Retorno</p>
                                                    <p className="text-sm text-slate-600">Próxima consulta</p>
                                                </div>
                                            </Button>

                                            <Button
                                                variant="outline"
                                                className="w-full justify-start h-auto p-3 hover:bg-green-50 border-green-200"
                                                onClick={() => toast.info('Funcionalidade em desenvolvimento')}
                                            >
                                                <Gift className="w-5 h-5 text-green-600 mr-3" />
                                                <div className="text-left">
                                                    <p className="font-medium text-slate-900">Programa de Fidelidade</p>
                                                    <p className="text-sm text-slate-600">Oferecer benefícios</p>
                                                </div>
                                            </Button>

                                            <Button
                                                variant="outline"
                                                className="w-full justify-start h-auto p-3 hover:bg-blue-50 border-blue-200"
                                                onClick={() => toast.info('Funcionalidade em desenvolvimento')}
                                            >
                                                <MessageSquare className="w-5 h-5 text-blue-600 mr-3" />
                                                <div className="text-left">
                                                    <p className="font-medium text-slate-900">Pesquisa de Satisfação</p>
                                                    <p className="text-sm text-slate-600">Coletar feedback</p>
                                                </div>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </TooltipProvider>
    )
}

export default ClientHistoryPage