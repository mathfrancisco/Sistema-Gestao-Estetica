'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    Users,
    Plus,
    Search,
    Clock,
    Phone,
    Mail,
    MoreHorizontal,
    CheckCircle,
    XCircle,
    RefreshCw,
    Edit,
    Trash2,
    Eye,
    Filter,
    Download,
    Bell,
    ChevronRight,
    Sparkles,
    Activity,
    TrendingUp,
    Heart,
    Calendar,
    UserPlus,
    Target,
    Crown,
    AlertTriangle,
    Settings,
    ArrowUpRight,
    Zap,
    Brain,
    Star,
    MessageCircle,
    Share2,
    BookOpen,
    Keyboard,
    Loader2
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { toast } from 'sonner'
import type { Database } from '@/lib/database/supabase/types'
import {
    useClients,
    useClientStats,
    useCreateClient,
    useUpdateClient,
    useDeleteClient,
    useBulkUpdateClientSegments,
    useUpcomingBirthdays
} from "@/lib/hooks/useClients"
import { Sidebar } from '@/components/layout/sidebar'
import ClientModal from '@/components/forms/ClientModal'
import { cn } from '@/lib/utils/utils'

type Client = Database['public']['Tables']['clients']['Row']
type ClientStatus = Database['public']['Enums']['client_status_enum']
type ClientSegment = Database['public']['Enums']['client_segment_enum']

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

const ClientsPage: React.FC = () => {
    // Estados principais
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [segmentFilter, setSegmentFilter] = useState<string>('all')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedClient, setSelectedClient] = useState<Client | undefined>()
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')
    const [showShortcuts, setShowShortcuts] = useState(false)
    const [focusedRowIndex, setFocusedRowIndex] = useState(-1)

    // Referencias para navegação por teclado
    const searchRef = useRef<HTMLInputElement>(null)
    const tableRef = useRef<HTMLTableElement>(null)

    // Hooks para gerenciar dados
    const {
        data: clientsData,
        isLoading: clientsLoading,
        error: clientsError,
        refetch: refetchClients
    } = useClients({
        page: 1,
        limit: 100,
        filters: {
            status: statusFilter !== 'all' ? statusFilter as ClientStatus : undefined,
            segment: segmentFilter !== 'all' ? segmentFilter as ClientSegment : undefined
        }
    })

    const {
        data: clientStats,
        isLoading: statsLoading,
        refetch: refetchStats
    } = useClientStats()

    const {
        data: upcomingBirthdays,
        isLoading: birthdaysLoading
    } = useUpcomingBirthdays(30)

    const { mutate: createClient, isPending: isCreating } = useCreateClient()
    const { mutate: updateClient, isPending: isUpdating } = useUpdateClient()
    const { mutate: deleteClient, isPending: isDeleting } = useDeleteClient()
    const { mutate: bulkUpdateSegments, isPending: isBulkUpdating } = useBulkUpdateClientSegments()

    const clients = clientsData?.data || []
    const isLoading = clientsLoading || statsLoading
    const isAnyMutating = isCreating || isUpdating || isDeleting || isBulkUpdating

    // Estado derivado para clientes filtrados
    const filteredClients = useMemo(() => {
        let filtered = clients

        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase()
            filtered = filtered.filter(client =>
                client.name?.toLowerCase().includes(searchLower) ||
                client.email?.toLowerCase().includes(searchLower) ||
                client.phone?.toLowerCase().includes(searchLower) ||
                client.cpf?.toLowerCase().includes(searchLower)
            )
        }

        return filtered
    }, [clients, searchTerm])

    // Atalhos de teclado
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl/Cmd + shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'k':
                        e.preventDefault()
                        searchRef.current?.focus()
                        break
                    case 'n':
                        e.preventDefault()
                        setIsModalOpen(true)
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

            // Navigation shortcuts
            if (viewMode === 'table' && filteredClients.length > 0) {
                switch (e.key) {
                    case 'ArrowDown':
                        e.preventDefault()
                        setFocusedRowIndex(prev =>
                            prev < filteredClients.length - 1 ? prev + 1 : prev
                        )
                        break
                    case 'ArrowUp':
                        e.preventDefault()
                        setFocusedRowIndex(prev => prev > 0 ? prev - 1 : prev)
                        break
                    case 'Enter':
                        if (focusedRowIndex >= 0) {
                            const client = filteredClients[focusedRowIndex]
                            handleViewClient(client.id)
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
    }, [showShortcuts, viewMode, filteredClients, focusedRowIndex])

    // Funções de utilidade para badges
    const getStatusBadge = useCallback((status: ClientStatus) => {
        const statusConfig = {
            active: {
                label: 'Ativo',
                variant: 'default' as const,
                icon: CheckCircle,
                className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors'
            },
            inactive: {
                label: 'Inativo',
                variant: 'secondary' as const,
                icon: Clock,
                className: 'bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors'
            },
            blocked: {
                label: 'Bloqueado',
                variant: 'destructive' as const,
                icon: XCircle,
                className: 'bg-red-100 text-red-800 hover:bg-red-200 transition-colors'
            }
        }

        const config = statusConfig[status]
        const Icon = config.icon

        return (
            <Badge
                variant={config.variant}
                className={cn("flex items-center gap-1 transition-all duration-200", config.className)}
            >
                <Icon className="w-3 h-3" />
                {config.label}
            </Badge>
        )
    }, [])

    const getSegmentBadge = useCallback((segment: ClientSegment | null) => {
        if (!segment) return null

        const segmentConfig = {
            vip: {
                label: 'VIP',
                icon: Crown,
                className: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 hover:from-amber-600 hover:to-orange-600'
            },
            regular: {
                label: 'Regular',
                icon: Users,
                className: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 hover:from-blue-600 hover:to-blue-700'
            },
            new: {
                label: 'Novo',
                icon: UserPlus,
                className: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 hover:from-green-600 hover:to-emerald-600'
            },
            at_risk: {
                label: 'Em Risco',
                icon: AlertTriangle,
                className: 'bg-gradient-to-r from-red-500 to-red-600 text-white border-0 hover:from-red-600 hover:to-red-700'
            },
            lost: {
                label: 'Perdido',
                icon: XCircle,
                className: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0 hover:from-gray-600 hover:to-gray-700'
            }
        }

        const config = segmentConfig[segment]
        const Icon = config.icon

        return (
            <Badge className={cn("flex items-center gap-1 transition-all duration-200", config.className)}>
                <Icon className="w-3 h-3" />
                {config.label}
            </Badge>
        )
    }, [])

    // Handlers
    const handleSaveClient = useCallback(async (data: any) => {
        try {
            if (selectedClient) {
                updateClient({ id: selectedClient.id, data }, {
                    onSuccess: () => {
                        toast.success('Cliente atualizado com sucesso!')
                        setIsModalOpen(false)
                        setSelectedClient(undefined)
                    },
                    onError: () => toast.error('Erro ao atualizar cliente')
                })
            } else {
                createClient(data, {
                    onSuccess: () => {
                        toast.success('Cliente criado com sucesso!')
                        setIsModalOpen(false)
                    },
                    onError: () => toast.error('Erro ao criar cliente')
                })
            }
        } catch (error) {
            toast.error('Erro ao salvar cliente')
        }
    }, [selectedClient, updateClient, createClient])

    const handleDeleteClient = useCallback(async (id: string) => {
        deleteClient(id, {
            onSuccess: () => toast.success('Cliente excluído com sucesso!'),
            onError: () => toast.error('Erro ao excluir cliente')
        })
    }, [deleteClient])

    const handleRefreshData = useCallback(async () => {
        await Promise.all([refetchClients(), refetchStats()])
        toast.success('Dados atualizados!')
    }, [refetchClients, refetchStats])

    const handleViewClient = useCallback((clientId: string) => {
        toast.info('Abrindo perfil do cliente...')
        // Navegar para página do cliente
    }, [])

    const handleBulkSegmentation = useCallback(async () => {
        try {
            toast.info('Executando segmentação automática...')
            // Lógica de segmentação automática aqui
            setTimeout(() => {
                toast.success('Segmentação automática concluída!')
            }, 2000)
        } catch (error) {
            toast.error('Erro na segmentação automática')
        }
    }, [])

    // Cálculos de estatísticas
    const statsData = useMemo(() => ({
        total: filteredClients.length,
        active: filteredClients.filter(client => client.status === 'active').length,
        vip: filteredClients.filter(client => client.segment === 'vip').length,
        atRisk: filteredClients.filter(client => client.segment === 'at_risk').length,
        new: filteredClients.filter(client => client.segment === 'new').length,
        birthdays: upcomingBirthdays?.length || 0
    }), [filteredClients, upcomingBirthdays])

    // Quick Actions configuration
    const quickActions: QuickAction[] = useMemo(() => [
        {
            id: 'birthdays',
            title: 'Aniversariantes',
            description: `${statsData.birthdays} próximos`,
            icon: Heart,
            color: 'from-pink-500 to-rose-500',
            action: () => {
                setSegmentFilter('birthday')
                toast.info(`Mostrando ${statsData.birthdays} aniversariantes`)
            },
            count: statsData.birthdays,
            shortcut: 'B'
        },
        {
            id: 'at_risk',
            title: 'Reativação',
            description: `${statsData.atRisk} em risco`,
            icon: AlertTriangle,
            color: 'from-red-500 to-red-600',
            action: () => {
                setSegmentFilter('at_risk')
                toast.info(`Mostrando ${statsData.atRisk} clientes em risco`)
            },
            count: statsData.atRisk,
            shortcut: 'R'
        },
        {
            id: 'vip',
            title: 'Clientes VIP',
            description: `${statsData.vip} premium`,
            icon: Crown,
            color: 'from-amber-500 to-orange-500',
            action: () => {
                setSegmentFilter('vip')
                toast.info(`Mostrando ${statsData.vip} clientes VIP`)
            },
            count: statsData.vip,
            shortcut: 'V'
        },
        {
            id: 'segmentation',
            title: 'Auto Segmentação',
            description: 'IA inteligente',
            icon: Brain,
            color: 'from-purple-500 to-indigo-600',
            action: handleBulkSegmentation,
            shortcut: 'S'
        }
    ], [statsData, handleBulkSegmentation])

    // Smart Insights
    const smartInsights: SmartInsight[] = useMemo(() => {
        const insights: SmartInsight[] = []

        if (statsData.birthdays > 0) {
            insights.push({
                type: 'opportunity',
                title: 'Oportunidade de Aniversário',
                description: `${statsData.birthdays} clientes fazem aniversário nos próximos 30 dias. Configure campanhas personalizadas.`,
                action: {
                    label: 'Criar Campanha',
                    onClick: () => toast.info('Criando campanha de aniversário...')
                },
                value: statsData.birthdays
            })
        }

        if (statsData.atRisk > 0) {
            insights.push({
                type: 'warning',
                title: 'Clientes em Risco',
                description: `${statsData.atRisk} clientes precisam de atenção especial para evitar churn.`,
                action: {
                    label: 'Ver Estratégias',
                    onClick: () => setSegmentFilter('at_risk')
                },
                value: statsData.atRisk
            })
        }

        if (statsData.new > 5) {
            insights.push({
                type: 'success',
                title: 'Crescimento Positivo',
                description: `${statsData.new} novos clientes este período. Continue as estratégias de aquisição.`,
                value: statsData.new
            })
        }

        return insights
    }, [statsData])

    // Métricas principais
    const metricsData = useMemo(() => [
        {
            title: 'Total de Clientes',
            value: statsData.total,
            icon: Users,
            description: 'Base total cadastrada',
            gradient: 'from-blue-500 to-blue-600',
            trend: { value: statsData.total, label: 'total', isPositive: true },
            onClick: () => setStatusFilter('all')
        },
        {
            title: 'Clientes Ativos',
            value: statsData.active,
            icon: CheckCircle,
            description: 'Com status ativo',
            gradient: 'from-emerald-500 to-emerald-600',
            trend: { value: statsData.active, label: 'ativos', isPositive: true },
            onClick: () => setStatusFilter('active')
        },
        {
            title: 'Clientes VIP',
            value: statsData.vip,
            icon: Crown,
            description: 'Alto valor e frequência',
            gradient: 'from-amber-500 to-orange-500',
            trend: { value: statsData.vip, label: 'VIP', isPositive: true },
            onClick: () => setSegmentFilter('vip')
        },
        {
            title: 'Aniversariantes',
            value: statsData.birthdays,
            icon: Heart,
            description: 'Próximos 30 dias',
            gradient: 'from-pink-500 to-rose-500',
            trend: { value: statsData.birthdays, label: 'aniversários', isPositive: true },
            onClick: () => toast.info('Visualizando aniversariantes...')
        }
    ], [statsData])

    // Loading state melhorado
    if (isLoading && filteredClients.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <Sidebar />
                <div className="lg:ml-64">
                    <div className="flex flex-col items-center justify-center h-96 space-y-4">
                        <div className="relative">
                            <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
                            <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping"></div>
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Carregando Clientes</h3>
                            <p className="text-slate-600">Preparando sua base de dados...</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                {/* Sidebar */}
                <Sidebar />

                {/* Conteúdo Principal */}
                <div className="lg:ml-64">
                    {/* Header Moderno e Responsivo */}
                    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
                        <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/25">
                                            <Users className="w-4 h-4 text-white" />
                                        </div>
                                        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                            Clientes
                                        </h1>
                                        {isAnyMutating && (
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                                                <span className="text-sm text-purple-600">Processando...</span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-slate-600 text-xs sm:text-sm font-medium">
                                        Gerencie seus clientes com IA e automação inteligente
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                    {/* Status Badge */}
                                    <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-lg shadow-emerald-500/25 text-xs">
                                        <Activity className="w-3 h-3 mr-1" />
                                        <span className="hidden sm:inline">Sistema Online</span>
                                        <span className="sm:hidden">Online</span>
                                    </Badge>

                                    {/* Action Buttons */}
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
                                                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                                                >
                                                    <Download className="w-4 h-4 text-slate-600" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Exportar dados</p>
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
                                                <p>Atalhos do teclado (Ctrl+/)</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>

                                    {/* Main Actions */}
                                    <div className="flex items-center gap-2 ml-2">
                                        <Link href="/clientes/segmentos">
                                            <Button variant="outline" className="bg-white border-slate-200 hover:bg-slate-50 shadow-sm">
                                                <Target className="w-4 h-4 mr-2" />
                                                Segmentos
                                            </Button>
                                        </Link>
                                        <Button
                                            onClick={() => {
                                                setSelectedClient(undefined)
                                                setIsModalOpen(true)
                                            }}
                                            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg shadow-purple-500/25 border-0"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Novo Cliente
                                        </Button>
                                    </div>
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
                                            <span>Novo Cliente</span>
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

                    {/* Conteúdo */}
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
                                                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
                                            </div>

                                            <div className="space-y-1 lg:space-y-2">
                                                <p className="text-xs lg:text-sm font-medium text-slate-600">{metric.title}</p>
                                                <p className="text-xl lg:text-3xl font-bold text-slate-900 leading-tight group-hover:text-2xl lg:group-hover:text-4xl transition-all duration-300">
                                                    {metric.value.toLocaleString()}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                                                    <span className="text-xs font-medium text-emerald-600">
                                                        {metric.trend.label}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* Quick Actions */}
                            <Card className="border-0 shadow-xl shadow-slate-200/60">
                                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                    <CardTitle className="flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-purple-500" />
                                        Ações Inteligentes
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

                            {/* Filtros e Busca */}
                            <Card className="border-0 shadow-xl shadow-slate-200/60 overflow-hidden">
                                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Search className="w-5 h-5 text-purple-500" />
                                        Filtros e Busca Inteligente
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 lg:p-6">
                                    <div className="flex flex-col lg:flex-row gap-4">
                                        <div className="flex-1">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                                <Input
                                                    ref={searchRef}
                                                    placeholder="Buscar por nome, email, telefone ou CPF... (Ctrl+K)"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="pl-10 border-slate-200 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200"
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
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                                                <TabsList className="bg-slate-100 border-0">
                                                    <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Todos</TabsTrigger>
                                                    <TabsTrigger value="active" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Ativos</TabsTrigger>
                                                    <TabsTrigger value="inactive" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Inativos</TabsTrigger>
                                                    <TabsTrigger value="blocked" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Bloqueados</TabsTrigger>
                                                </TabsList>
                                            </Tabs>
                                            <Tabs value={segmentFilter} onValueChange={setSegmentFilter}>
                                                <TabsList className="bg-slate-100 border-0">
                                                    <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Todos</TabsTrigger>
                                                    <TabsTrigger value="vip" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">VIP</TabsTrigger>
                                                    <TabsTrigger value="new" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Novos</TabsTrigger>
                                                    <TabsTrigger value="at_risk" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Em Risco</TabsTrigger>
                                                </TabsList>
                                            </Tabs>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Lista de Clientes */}
                            <Card className="border-0 shadow-xl shadow-slate-200/60 overflow-hidden">
                                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                        <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                                            <Users className="w-5 h-5 text-purple-500" />
                                            Clientes ({filteredClients.length})
                                            {isLoading && <RefreshCw className="w-4 h-4 animate-spin ml-2 text-purple-500" />}
                                        </CardTitle>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                                                <Activity className="w-3 h-3 mr-1" />
                                                {filteredClients.length} resultados
                                            </Badge>
                                            {filteredClients.length !== clients.length && (
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                                    Filtrados
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {filteredClients.length === 0 ? (
                                        <div className="text-center py-12 px-6">
                                            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25">
                                                <Users className="w-8 h-8 text-white" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                                {searchTerm || statusFilter !== 'all' || segmentFilter !== 'all'
                                                    ? 'Nenhum resultado encontrado'
                                                    : 'Nenhum cliente cadastrado'
                                                }
                                            </h3>
                                            <p className="text-slate-500 mb-6 max-w-md mx-auto">
                                                {searchTerm || statusFilter !== 'all' || segmentFilter !== 'all'
                                                    ? 'Tente ajustar os filtros ou termos de busca.'
                                                    : 'Comece cadastrando seu primeiro cliente.'
                                                }
                                            </p>
                                            <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                                {(searchTerm || statusFilter !== 'all' || segmentFilter !== 'all') && (
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => {
                                                            setSearchTerm('')
                                                            setStatusFilter('all')
                                                            setSegmentFilter('all')
                                                        }}
                                                    >
                                                        <RefreshCw className="w-4 h-4 mr-2" />
                                                        Limpar Filtros
                                                    </Button>
                                                )}
                                                <Button
                                                    onClick={() => {
                                                        setSelectedClient(undefined)
                                                        setIsModalOpen(true)
                                                    }}
                                                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg shadow-purple-500/25 border-0"
                                                >
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    Novo Cliente
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <Table ref={tableRef}>
                                                <TableHeader>
                                                    <TableRow className="bg-slate-50/50 hover:bg-slate-50">
                                                        <TableHead className="font-semibold text-slate-700">Cliente</TableHead>
                                                        <TableHead className="font-semibold text-slate-700">Contato</TableHead>
                                                        <TableHead className="font-semibold text-slate-700">Segmento</TableHead>
                                                        <TableHead className="font-semibold text-slate-700">Status</TableHead>
                                                        <TableHead className="font-semibold text-slate-700">Valor Total</TableHead>
                                                        <TableHead className="font-semibold text-slate-700">Visitas</TableHead>
                                                        <TableHead className="text-right font-semibold text-slate-700">Ações</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredClients.map((client, index) => (
                                                        <TableRow
                                                            key={client.id}
                                                            className={cn(
                                                                "hover:bg-slate-50/50 transition-all duration-200 cursor-pointer group",
                                                                index === focusedRowIndex && "bg-blue-50 ring-2 ring-blue-500 ring-offset-1"
                                                            )}
                                                            onClick={() => handleViewClient(client.id)}
                                                            onFocus={() => setFocusedRowIndex(index)}
                                                            tabIndex={0}
                                                        >
                                                            <TableCell className="py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg group-hover:scale-110 transition-transform duration-200">
                                                                        {client.name.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-medium text-slate-900 group-hover:text-purple-600 transition-colors">
                                                                            {client.name}
                                                                        </p>
                                                                        {client.cpf && (
                                                                            <p className="text-sm text-slate-500">CPF: {client.cpf}</p>
                                                                        )}
                                                                        {client.birthday && (
                                                                            <p className="text-sm text-slate-500">
                                                                                Nascimento: {format(new Date(client.birthday), 'dd/MM/yyyy', { locale: ptBR })}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-4">
                                                                <div className="space-y-1">
                                                                    {client.phone && (
                                                                        <div className="flex items-center gap-2 text-sm group/contact">
                                                                            <Phone className="w-3 h-3 text-slate-400" />
                                                                            <span
                                                                                className="hover:text-blue-600 cursor-pointer transition-colors"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation()
                                                                                    navigator.clipboard.writeText(client.phone!)
                                                                                    toast.success('Telefone copiado!')
                                                                                }}
                                                                            >
                                                                                {client.phone}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    {client.email && (
                                                                        <div className="flex items-center gap-2 text-sm group/contact">
                                                                            <Mail className="w-3 h-3 text-slate-400" />
                                                                            <span
                                                                                className="hover:text-blue-600 cursor-pointer transition-colors truncate max-w-48"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation()
                                                                                    navigator.clipboard.writeText(client.email!)
                                                                                    toast.success('Email copiado!')
                                                                                }}
                                                                            >
                                                                                {client.email}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-4">
                                                                {getSegmentBadge(client.segment)}
                                                            </TableCell>
                                                            <TableCell className="py-4">
                                                                {getStatusBadge(client.status)}
                                                            </TableCell>
                                                            <TableCell className="py-4">
                                                                <div>
                                                                    <p className="font-medium text-slate-900">
                                                                        R$ {client.total_spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                    </p>
                                                                    <div className="flex items-center gap-1">
                                                                        <Star className="w-3 h-3 text-amber-500" />
                                                                        <p className="text-sm text-slate-500">
                                                                            LTV: {client.ltv_score || 0}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-4">
                                                                <div>
                                                                    <p className="font-medium text-slate-900">
                                                                        {client.total_visits} visitas
                                                                    </p>
                                                                    {client.last_visit && (
                                                                        <p className="text-sm text-slate-500">
                                                                            Última: {format(new Date(client.last_visit), 'dd/MM/yyyy', { locale: ptBR })}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right py-4" onClick={(e) => e.stopPropagation()}>
                                                                <DropdownMenu>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <DropdownMenuTrigger asChild>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    className="h-8 w-8 p-0 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all duration-200"
                                                                                >
                                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                                </Button>
                                                                            </DropdownMenuTrigger>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>Mais ações</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>

                                                                    <DropdownMenuContent align="end" className="w-56">
                                                                        <DropdownMenuLabel>Ações do Cliente</DropdownMenuLabel>
                                                                        <DropdownMenuItem asChild className="cursor-pointer">
                                                                            <Link href={`/clientes/${client.id}`}>
                                                                                <Eye className="mr-2 h-4 w-4" />
                                                                                Ver Perfil Completo
                                                                            </Link>
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            onClick={() => {
                                                                                setSelectedClient(client)
                                                                                setIsModalOpen(true)
                                                                            }}
                                                                            className="cursor-pointer"
                                                                        >
                                                                            <Edit className="mr-2 h-4 w-4" />
                                                                            Editar Informações
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem asChild className="cursor-pointer">
                                                                            <Link href={`/agendamentos/novo?clientId=${client.id}`}>
                                                                                <Calendar className="mr-2 h-4 w-4" />
                                                                                Agendar Consulta
                                                                            </Link>
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem asChild className="cursor-pointer">
                                                                            <Link href={`/clientes/${client.id}/historico`}>
                                                                                <Clock className="mr-2 h-4 w-4" />
                                                                                Ver Histórico
                                                                            </Link>
                                                                        </DropdownMenuItem>
                                                                        {client.phone && (
                                                                            <DropdownMenuItem
                                                                                onClick={() => window.open(`https://wa.me/${client.phone?.replace(/\D/g, '')}`)}
                                                                                className="cursor-pointer"
                                                                            >
                                                                                <MessageCircle className="mr-2 h-4 w-4" />
                                                                                WhatsApp
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleDeleteClient(client.id)}
                                                                            className="cursor-pointer text-red-600 focus:text-red-600"
                                                                        >
                                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                                            Excluir Cliente
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Analytics Rápidos */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Top Clientes VIP */}
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                                        <CardTitle className="flex items-center gap-2 text-amber-800">
                                            <Crown className="w-5 h-5" />
                                            Top Clientes VIP
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="space-y-4">
                                            {filteredClients
                                                .filter(client => client.segment === 'vip')
                                                .sort((a, b) => b.total_spent - a.total_spent)
                                                .slice(0, 5)
                                                .map((client, index) => (
                                                    <div key={client.id} className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                                {index + 1}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-slate-900 truncate">
                                                                    {client.name}
                                                                </p>
                                                                <p className="text-xs text-slate-500">
                                                                    {client.total_visits} visitas
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-bold text-amber-600">
                                                                R$ {client.total_spent.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            {filteredClients.filter(client => client.segment === 'vip').length === 0 && (
                                                <div className="text-center py-6">
                                                    <Crown className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                                    <p className="text-sm text-slate-500">Nenhum cliente VIP encontrado</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Próximos Aniversários */}
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 border-b border-pink-100">
                                        <CardTitle className="flex items-center gap-2 text-pink-800">
                                            <Heart className="w-5 h-5" />
                                            Próximos Aniversários
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="space-y-4">
                                            {upcomingBirthdays?.slice(0, 5).map((client) => (
                                                <div key={client.id} className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-pink-50 transition-colors cursor-pointer">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
                                                            <Heart className="w-4 h-4 text-white" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-slate-900 truncate">
                                                                {client.name}
                                                            </p>
                                                            <div className="flex items-center gap-2">
                                                                {client.phone && (
                                                                    <span className="text-xs text-slate-500">{client.phone}</span>
                                                                )}
                                                                {client.segment && getSegmentBadge(client.segment)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right ml-4">
                                                        <p className="text-sm font-medium text-pink-600">
                                                            {client.birthday && format(new Date(client.birthday), 'dd/MM', { locale: ptBR })}
                                                        </p>
                                                    </div>
                                                </div>
                                            )) || []}
                                            {(!upcomingBirthdays || upcomingBirthdays.length === 0) && (
                                                <div className="text-center py-6">
                                                    <Heart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                                    <p className="text-sm text-slate-500">Nenhum aniversário próximo</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </main>
                </div>

                {/* Modal de Cliente */}
                {isModalOpen && (
                    <ClientModal
                        isOpen={isModalOpen}
                        onClose={() => {
                            setIsModalOpen(false)
                            setSelectedClient(undefined)
                        }}
                        client={selectedClient}
                        onSave={handleSaveClient}
                        onDelete={selectedClient ? () => handleDeleteClient(selectedClient.id) : undefined}
                    />
                )}
            </div>
        </TooltipProvider>
    )
}

export default ClientsPage