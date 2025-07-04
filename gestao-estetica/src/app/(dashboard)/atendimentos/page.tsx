'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Heart,
    Plus,
    Search,
    DollarSign,
    Star,
    MoreHorizontal,
    CheckCircle,
    XCircle,
    Clock,
    RefreshCw,
    Edit,
    Trash2,
    Filter,
    Download,
    Bell,
    Sparkles,
    Users,
    Activity,
    TrendingUp,
    CreditCard,
    Receipt,
    Target,
    Banknote,
    Calendar,
    ArrowUp,
    Zap,
    Eye
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
import { format, isToday, isTomorrow, isYesterday, addDays, startOfDay, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { toast } from 'sonner'
import type { Database } from '@/lib/database/supabase/types'
import { useClients } from "@/lib/hooks/useClients"
import { useProcedures } from "@/lib/hooks/useProcedures"
import { useFinancials } from "@/lib/hooks/useFinancials"
import { Sidebar } from '@/components/layout/sidebar'
import AttendanceModal from '@/components/attendances/AttendanceModal'

type PaymentStatus = Database['public']['Enums']['payment_status_enum']
type PaymentMethod = Database['public']['Enums']['payment_method_enum']

const AtendimentosPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all')
    const [dateFilter, setDateFilter] = useState<string>('all')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedAttendance, setSelectedAttendance] = useState<any>()
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Hook de atendimentos
    const {
        attendancesWithDetails,
        isLoadingAttendances,
        attendancesPagination,
        financialSummary,
        createAttendance,
        updateAttendance,
        deleteAttendance,
        fetchAttendancesWithDetails,
        error: attendancesError,
        clearError
    } = useFinancials()

    const {
        data: clientsData,
        isLoading: clientsLoading
    } = useClients({
        page: 1,
        limit: 100,
        filters: {}
    })

    const {
        data: proceduresData,
        isLoading: proceduresLoading
    } = useProcedures({
        page: 1,
        limit: 100
    })

    const clients = clientsData?.data || []
    const procedures = proceduresData?.data || []

    // Estado derivado para atendimentos filtrados
    const [filteredAttendances, setFilteredAttendances] = useState(attendancesWithDetails)

    // Carregar dados iniciais
    useEffect(() => {
        fetchAttendancesWithDetails({
            page: 1,
            limit: 50,
            filters: {}
        })
    }, [fetchAttendancesWithDetails])

    // Aplicar filtros locais
    useEffect(() => {
        let filtered = attendancesWithDetails

        // Filtro por texto
        if (searchTerm) {
            filtered = filtered.filter(att =>
                att.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                att.procedures?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                att.observations?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        // Filtro por status de pagamento
        if (statusFilter !== 'all') {
            filtered = filtered.filter(att => att.payment_status === statusFilter)
        }

        // Filtro por método de pagamento
        if (paymentMethodFilter !== 'all') {
            filtered = filtered.filter(att => att.payment_method === paymentMethodFilter)
        }

        // Filtro por data
        if (dateFilter !== 'all') {
            const now = new Date()
            switch (dateFilter) {
                case 'today':
                    filtered = filtered.filter(att => isToday(new Date(att.date)))
                    break
                case 'yesterday':
                    filtered = filtered.filter(att => isYesterday(new Date(att.date)))
                    break
                case 'week':
                    const weekStart = startOfDay(addDays(now, -7))
                    const weekEnd = endOfDay(now)
                    filtered = filtered.filter(att => {
                        const attDate = new Date(att.date)
                        return attDate >= weekStart && attDate <= weekEnd
                    })
                    break
                case 'month':
                    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
                    const monthEnd = endOfDay(now)
                    filtered = filtered.filter(att => {
                        const attDate = new Date(att.date)
                        return attDate >= monthStart && attDate <= monthEnd
                    })
                    break
            }
        }

        setFilteredAttendances(filtered)
    }, [attendancesWithDetails, searchTerm, statusFilter, paymentMethodFilter, dateFilter])

    // Limpar erro quando necessário
    useEffect(() => {
        if (attendancesError) {
            toast.error(attendancesError)
            clearError()
        }
    }, [attendancesError, clearError])

    const getPaymentStatusBadge = (status: PaymentStatus) => {
        const statusConfig = {
            pending: {
                label: 'Pendente',
                variant: 'destructive' as const,
                icon: Clock,
                className: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg shadow-yellow-500/25 animate-pulse'
            },
            paid: {
                label: 'Pago',
                variant: 'default' as const,
                icon: CheckCircle,
                className: 'bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-lg shadow-emerald-500/25'
            },
            cancelled: {
                label: 'Cancelado',
                variant: 'secondary' as const,
                icon: XCircle,
                className: 'bg-gradient-to-r from-red-500 to-rose-500 text-white border-0 shadow-lg shadow-red-500/25'
            },
            refunded: {
                label: 'Reembolsado',
                variant: 'secondary' as const,
                icon: RefreshCw,
                className: 'bg-gradient-to-r from-slate-500 to-gray-500 text-white border-0 shadow-lg shadow-slate-500/25'
            }
        }

        const config = statusConfig[status] || statusConfig.pending
        const Icon = config.icon

        return (
            <Badge className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold transition-all duration-300 hover:scale-105 ${config.className}`}>
                <Icon className="w-3 h-3" />
                {config.label}
            </Badge>
        )
    }

    const getPaymentMethodBadge = (method: PaymentMethod | null) => {
        if (!method) return (
            <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-gray-200 transition-all duration-300 hover:scale-105">
                Não informado
            </Badge>
        )

        const methodConfig = {
            cash: {
                label: 'Dinheiro',
                icon: Banknote,
                className: 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-emerald-200 shadow-lg shadow-emerald-500/10'
            },
            pix: {
                label: 'PIX',
                icon: Zap,
                className: 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-200 shadow-lg shadow-blue-500/10'
            },
            debit: {
                label: 'Débito',
                icon: CreditCard,
                className: 'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700 border-purple-200 shadow-lg shadow-purple-500/10'
            },
            credit: {
                label: 'Crédito',
                icon: CreditCard,
                className: 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border-orange-200 shadow-lg shadow-orange-500/10'
            },
            installment: {
                label: 'Parcelado',
                icon: Receipt,
                className: 'bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 border-pink-200 shadow-lg shadow-pink-500/10'
            }
        }

        const config = methodConfig[method]
        const Icon = config.icon

        return (
            <Badge className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold transition-all duration-300 hover:scale-105 ${config.className}`}>
                <Icon className="w-3 h-3" />
                {config.label}
            </Badge>
        )
    }

    const getDateLabel = (date: string) => {
        const attendanceDate = new Date(date)

        if (isToday(attendanceDate)) return 'Hoje'
        if (isYesterday(attendanceDate)) return 'Ontem'
        if (isTomorrow(attendanceDate)) return 'Amanhã'

        return format(attendanceDate, "dd/MM/yyyy", { locale: ptBR })
    }

    const getRatingStars = (rating: number | null) => {
        if (!rating) return (
            <span className="text-slate-400 text-sm flex items-center gap-1">
                <Star className="w-3 h-3" />
                Sem avaliação
            </span>
        )

        return (
            <div className="flex items-center gap-1 group">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={`w-3 h-3 transition-all duration-200 group-hover:scale-110 ${
                            i < rating
                                ? 'text-yellow-400 fill-current drop-shadow-sm'
                                : 'text-slate-300'
                        }`}
                    />
                ))}
                <span className="text-sm text-slate-600 ml-1 font-medium">({rating}/5)</span>
            </div>
        )
    }

    const handleSaveAttendance = async (data: any) => {
        try {
            if (selectedAttendance) {
                await updateAttendance(selectedAttendance.id, data)
                toast.success('Atendimento atualizado com sucesso!', {
                    description: 'As alterações foram salvas.',
                })
            } else {
                await createAttendance(data)
                toast.success('Atendimento criado com sucesso!', {
                    description: 'O novo atendimento foi registrado.',
                })
            }
            setIsModalOpen(false)
            setSelectedAttendance(undefined)
            // Recarregar dados
            fetchAttendancesWithDetails({
                page: 1,
                limit: 50,
                filters: {}
            })
        } catch (error) {
            toast.error('Erro ao salvar atendimento')
        }
    }

    const handleDeleteAttendance = async (id: string) => {
        try {
            await deleteAttendance(id)
            toast.success('Atendimento excluído com sucesso!')
            setIsModalOpen(false)
            setSelectedAttendance(undefined)
            // Recarregar dados
            fetchAttendancesWithDetails({
                page: 1,
                limit: 50,
                filters: {}
            })
        } catch (error) {
            toast.error('Erro ao excluir atendimento')
        }
    }

    const handleRefresh = async () => {
        setIsRefreshing(true)
        try {
            await fetchAttendancesWithDetails({
                page: 1,
                limit: 50,
                filters: {}
            })
            toast.success('Dados atualizados!', {
                description: 'As informações foram recarregadas.'
            })
        } catch (error) {
            toast.error('Erro ao atualizar dados')
        } finally {
            setTimeout(() => setIsRefreshing(false), 500)
        }
    }

    // Calcular estatísticas dos atendimentos filtrados
    const getAttendanceStats = () => {
        const totalRevenue = filteredAttendances.reduce((sum, att) => sum + (att.value - att.discount), 0)
        const totalCosts = filteredAttendances.reduce((sum, att) => sum + att.product_cost, 0)
        const totalProfit = totalRevenue - totalCosts
        const averageTicket = filteredAttendances.length > 0 ? totalRevenue / filteredAttendances.length : 0
        const averageRating = filteredAttendances.filter(att => att.rating).length > 0
            ? filteredAttendances.filter(att => att.rating).reduce((sum, att) => sum + (att.rating || 0), 0) / filteredAttendances.filter(att => att.rating).length
            : 0

        return {
            total: filteredAttendances.length,
            today: filteredAttendances.filter(att => isToday(new Date(att.date))).length,
            paid: filteredAttendances.filter(att => att.payment_status === 'paid').length,
            pending: filteredAttendances.filter(att => att.payment_status === 'pending').length,
            totalRevenue,
            totalCosts,
            totalProfit,
            averageTicket,
            averageRating
        }
    }

    const statsData = getAttendanceStats()
    const isLoading = isLoadingAttendances || clientsLoading || proceduresLoading

    // Dados das métricas principais
    const metricsData = [
        {
            title: 'Total de Atendimentos',
            value: statsData.total,
            icon: Heart,
            description: 'Atendimentos realizados',
            gradient: 'from-pink-500 via-rose-500 to-red-500',
            trend: { value: statsData.total, label: 'total', isPositive: true, percentage: '+12%' }
        },
        {
            title: 'Receita Total',
            value: `R$ ${statsData.totalRevenue.toFixed(2)}`,
            icon: DollarSign,
            description: 'Faturamento dos atendimentos',
            gradient: 'from-emerald-500 via-green-500 to-teal-500',
            trend: { value: statsData.totalRevenue, label: 'em receita', isPositive: true, percentage: '+8%' }
        },
        {
            title: 'Ticket Médio',
            value: `R$ ${statsData.averageTicket.toFixed(2)}`,
            icon: Target,
            description: 'Valor médio por atendimento',
            gradient: 'from-blue-500 via-indigo-500 to-purple-500',
            trend: { value: statsData.averageTicket, label: 'média', isPositive: true, percentage: '+3%' }
        },
        {
            title: 'Avaliação Média',
            value: statsData.averageRating.toFixed(1),
            icon: Star,
            description: 'Satisfação dos clientes',
            gradient: 'from-yellow-500 via-amber-500 to-orange-500',
            trend: { value: statsData.averageRating, label: 'estrelas', isPositive: true, percentage: '+0.2' }
        }
    ]

    if (isLoading && filteredAttendances.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <Sidebar />
                <div className="lg:ml-64">
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                        <div className="relative">
                            <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-600 rounded-full animate-pulse"></div>
                            <RefreshCw className="w-8 h-8 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-spin" />
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-lg font-semibold text-slate-800">Carregando atendimentos...</p>
                            <p className="text-sm text-slate-500">Aguarde um momento</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            {/* Sidebar */}
            <Sidebar />

            {/* Conteúdo Principal */}
            <div className="lg:ml-64">
                {/* Header Moderno */}
                <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
                    <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/25 group-hover:shadow-pink-500/40 transition-all duration-300">
                                        <Heart className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
                                            Atendimentos
                                        </h1>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                            <p className="text-slate-600 text-xs sm:text-sm font-medium">
                                                {filteredAttendances.length} atendimentos • Sistema ativo
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                {/* Status Badge */}
                                <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-lg shadow-emerald-500/25 text-xs transition-all duration-300 hover:shadow-emerald-500/40 hover:scale-105">
                                    <Activity className="w-3 h-3 mr-1.5" />
                                    <span className="hidden sm:inline">Sistema Online</span>
                                    <span className="sm:hidden">Online</span>
                                </Badge>

                                {/* Botões de Ação */}
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <button
                                        className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all duration-300 hover:scale-105 group"
                                        onClick={handleRefresh}
                                        disabled={isRefreshing}
                                        title="Atualizar dados"
                                    >
                                        <RefreshCw className={`w-4 h-4 text-slate-600 transition-transform duration-300 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                                    </button>
                                    <button className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all duration-300 hover:scale-105 group" title="Filtros avançados">
                                        <Filter className="w-4 h-4 text-slate-600 group-hover:text-slate-800 transition-colors" />
                                    </button>
                                    <button className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all duration-300 hover:scale-105 group" title="Exportar dados">
                                        <Download className="w-4 h-4 text-slate-600 group-hover:text-slate-800 transition-colors" />
                                    </button>
                                    <button className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all duration-300 hover:scale-105 group relative" title="Notificações">
                                        <Bell className="w-4 h-4 text-slate-600 group-hover:text-slate-800 transition-colors" />
                                        {statsData.pending > 0 && (
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                                                <span className="text-[8px] text-white font-bold">{statsData.pending}</span>
                                            </div>
                                        )}
                                    </button>
                                </div>

                                {/* Botões Principais */}
                                <div className="flex items-center gap-2 ml-2 border-l border-slate-200 pl-3">
                                    <Link href="/atendimentos/relatorio">
                                        <Button variant="outline" className="bg-white border-slate-200 hover:bg-slate-50 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105">
                                            <Receipt className="w-4 h-4 mr-2" />
                                            Relatórios
                                        </Button>
                                    </Link>
                                    <Button
                                        onClick={() => {
                                            setSelectedAttendance(undefined)
                                            setIsModalOpen(true)
                                        }}
                                        className="bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 hover:from-pink-600 hover:via-rose-600 hover:to-red-600 shadow-lg shadow-pink-500/25 border-0 transition-all duration-300 hover:shadow-pink-500/40 hover:scale-105"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Novo Atendimento
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Conteúdo */}
                <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">

                        {/* Métricas Principais com Design Moderno */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                            {metricsData.map((metric, index) => (
                                <Card key={index} className="relative overflow-hidden border-0 shadow-xl shadow-slate-200/60 hover:shadow-2xl hover:shadow-slate-300/60 transition-all duration-500 hover:-translate-y-2 group cursor-pointer">
                                    <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-500`} />
                                    <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-16 -translate-y-16">
                                        <div className={`w-full h-full bg-gradient-to-br ${metric.gradient} opacity-5 rounded-full group-hover:opacity-10 transition-opacity duration-500`} />
                                    </div>
                                    <CardContent className="p-4 lg:p-6 relative">
                                        <div className="flex items-center justify-between mb-3 lg:mb-4">
                                            <div className={`p-3 lg:p-3.5 rounded-2xl bg-gradient-to-br ${metric.gradient} shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                                                <metric.icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                                            </div>
                                            <div className="flex items-center gap-1 text-xs font-semibold">
                                                <ArrowUp className="w-3 h-3 text-emerald-500" />
                                                <span className="text-emerald-600">{metric.trend.percentage}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-1 lg:space-y-2">
                                            <p className="text-xs lg:text-sm font-medium text-slate-600 group-hover:text-slate-700 transition-colors">
                                                {metric.title}
                                            </p>
                                            <p className="text-xl lg:text-3xl font-bold text-slate-900 leading-tight group-hover:scale-105 transition-transform duration-300">
                                                {typeof metric.value === 'string' ? metric.value : metric.value.toLocaleString()}
                                            </p>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
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

                        {/* Filtros com Design Moderno */}
                        <Card className="border-0 shadow-xl shadow-slate-200/60 overflow-hidden transition-all duration-300 hover:shadow-2xl">
                            <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-100 p-4 lg:p-6">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg">
                                        <Search className="w-5 h-5 text-white" />
                                    </div>
                                    Filtros e Busca
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 lg:p-6">
                                <div className="flex flex-col lg:flex-row gap-4">
                                    <div className="flex-1">
                                        <div className="relative group">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-pink-500 transition-colors" />
                                            <Input
                                                placeholder="Buscar por cliente, procedimento ou observações..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10 border-slate-200 focus:border-pink-500 focus:ring-pink-500/20 bg-white/50 hover:bg-white transition-all duration-300"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                                            <TabsList className="bg-slate-100/80 border-0 backdrop-blur-sm">
                                                <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300">Todos</TabsTrigger>
                                                <TabsTrigger value="paid" className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300">Pagos</TabsTrigger>
                                                <TabsTrigger value="pending" className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300">Pendentes</TabsTrigger>
                                                <TabsTrigger value="cancelled" className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300">Cancelados</TabsTrigger>
                                            </TabsList>
                                        </Tabs>
                                        <Tabs value={dateFilter} onValueChange={setDateFilter}>
                                            <TabsList className="bg-slate-100/80 border-0 backdrop-blur-sm">
                                                <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300">Todas</TabsTrigger>
                                                <TabsTrigger value="today" className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300">Hoje</TabsTrigger>
                                                <TabsTrigger value="week" className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300">Semana</TabsTrigger>
                                                <TabsTrigger value="month" className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300">Mês</TabsTrigger>
                                            </TabsList>
                                        </Tabs>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Lista de Atendimentos com Design Moderno */}
                        <Card className="border-0 shadow-xl shadow-slate-200/60 overflow-hidden transition-all duration-300 hover:shadow-2xl">
                            <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-100 p-4 lg:p-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                    <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                                        <div className="p-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg shadow-lg">
                                            <Heart className="w-5 h-5 text-white" />
                                        </div>
                                        Atendimentos ({filteredAttendances.length})
                                        {isLoading && <RefreshCw className="w-4 h-4 animate-spin ml-2 text-pink-500" />}
                                    </CardTitle>
                                    <Badge variant="outline" className="bg-gradient-to-r from-pink-50 to-rose-50 text-pink-700 border-pink-200 text-xs shadow-sm">
                                        <Users className="w-3 h-3 mr-1" />
                                        {filteredAttendances.length} resultados
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {filteredAttendances.length === 0 ? (
                                    <div className="text-center py-16 px-6">
                                        <div className="relative mx-auto mb-6 w-24 h-24">
                                            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-rose-600 rounded-full opacity-10 animate-pulse"></div>
                                            <div className="absolute inset-2 bg-gradient-to-r from-pink-500 to-rose-600 rounded-full flex items-center justify-center shadow-xl">
                                                <Heart className="w-10 h-10 text-white" />
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-3">
                                            {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                                                ? 'Nenhum resultado encontrado'
                                                : 'Nenhum atendimento registrado'
                                            }
                                        </h3>
                                        <p className="text-slate-500 mb-8 max-w-md mx-auto leading-relaxed">
                                            {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                                                ? 'Tente ajustar os filtros ou criar um novo atendimento para começar.'
                                                : 'Comece sua jornada registrando seu primeiro atendimento e acompanhe o crescimento do seu negócio.'
                                            }
                                        </p>
                                        <Button
                                            onClick={() => {
                                                setSelectedAttendance(undefined)
                                                setIsModalOpen(true)
                                            }}
                                            className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-lg shadow-pink-500/25 border-0 transition-all duration-300 hover:shadow-pink-500/40 hover:scale-105"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Novo Atendimento
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-slate-50/50 hover:bg-slate-50 border-b border-slate-100">
                                                    <TableHead className="font-semibold text-slate-700 py-4">Cliente</TableHead>
                                                    <TableHead className="font-semibold text-slate-700 py-4">Procedimento</TableHead>
                                                    <TableHead className="font-semibold text-slate-700 py-4">Data</TableHead>
                                                    <TableHead className="font-semibold text-slate-700 py-4">Valor</TableHead>
                                                    <TableHead className="font-semibold text-slate-700 py-4">Pagamento</TableHead>
                                                    <TableHead className="font-semibold text-slate-700 py-4">Avaliação</TableHead>
                                                    <TableHead className="text-right font-semibold text-slate-700 py-4">Ações</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredAttendances.map((attendance, index) => (
                                                    <TableRow key={attendance.id} className="hover:bg-slate-50/50 transition-all duration-300 border-b border-slate-100/50 group">
                                                        <TableCell className="py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                                                                    {attendance.clients?.name?.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-slate-900 group-hover:text-slate-700 transition-colors">{attendance.clients?.name}</p>
                                                                    <p className="text-sm text-slate-500">{attendance.clients?.email}</p>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            <div>
                                                                <p className="font-semibold text-slate-900 group-hover:text-slate-700 transition-colors">{attendance.procedures?.name}</p>
                                                                <p className="text-sm text-slate-500">
                                                                    Preço: R$ {attendance.procedures?.price?.toFixed(2)}
                                                                </p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                                <div>
                                                                    <p className="font-semibold text-slate-900">
                                                                        {getDateLabel(attendance.date)}
                                                                    </p>
                                                                    <p className="text-sm text-slate-500">
                                                                        {format(new Date(attendance.date), 'HH:mm')}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            <div>
                                                                <p className="font-bold text-emerald-600 text-lg">
                                                                    R$ {(attendance.value - attendance.discount).toFixed(2)}
                                                                </p>
                                                                {attendance.discount > 0 && (
                                                                    <p className="text-sm text-red-500 line-through">
                                                                        R$ {attendance.value.toFixed(2)}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            <div className="space-y-1.5">
                                                                {getPaymentStatusBadge(attendance.payment_status)}
                                                                {getPaymentMethodBadge(attendance.payment_method)}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            {getRatingStars(attendance.rating)}
                                                        </TableCell>
                                                        <TableCell className="text-right py-4">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" className="h-9 w-9 p-0 hover:bg-slate-100 transition-all duration-300 hover:scale-105 rounded-lg">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-56 shadow-xl border-0 bg-white/95 backdrop-blur-sm">
                                                                    <DropdownMenuLabel className="font-semibold text-slate-700">Ações</DropdownMenuLabel>
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setSelectedAttendance(attendance)
                                                                            setIsModalOpen(true)
                                                                        }}
                                                                        className="cursor-pointer hover:bg-blue-50 transition-all duration-200"
                                                                    >
                                                                        <Edit className="mr-2 h-4 w-4 text-blue-500" />
                                                                        <span className="text-blue-700">Editar</span>
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        className="cursor-pointer hover:bg-purple-50 transition-all duration-200"
                                                                    >
                                                                        <Eye className="mr-2 h-4 w-4 text-purple-500" />
                                                                        <span className="text-purple-700">Visualizar</span>
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleDeleteAttendance(attendance.id)}
                                                                        className="cursor-pointer text-red-600 hover:bg-red-50 transition-all duration-200"
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Excluir
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

                        {/* Ações em Lote */}
                        {filteredAttendances.length > 0 && (
                            <Card className="border-0 shadow-xl shadow-slate-200/60 transition-all duration-300 hover:shadow-2xl">
                                <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-100 p-4 lg:p-6">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg">
                                            <Sparkles className="w-5 h-5 text-white" />
                                        </div>
                                        Ações Rápidas
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 lg:p-6">
                                    <div className="flex flex-wrap gap-3">
                                        <Button
                                            variant="outline"
                                            className="bg-white border-slate-200 hover:bg-slate-50 transition-all duration-300 hover:scale-105 hover:shadow-md"
                                            onClick={() => {
                                                toast.success('Exportação iniciada...', {
                                                    description: 'O arquivo será baixado em instantes.'
                                                })
                                            }}
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Exportar Lista
                                        </Button>
                                        <Link href="/atendimentos/relatorio">
                                            <Button
                                                variant="outline"
                                                className="bg-white border-slate-200 hover:bg-slate-50 transition-all duration-300 hover:scale-105 hover:shadow-md"
                                            >
                                                <Receipt className="w-4 h-4 mr-2" />
                                                Gerar Relatório
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="outline"
                                            className="bg-white border-slate-200 hover:bg-slate-50 transition-all duration-300 hover:scale-105 hover:shadow-md"
                                            onClick={() => {
                                                const pendingCount = filteredAttendances.filter(att => att.payment_status === 'pending').length
                                                toast.info(`${pendingCount} lembretes de pagamento serão enviados`, {
                                                    description: 'Os clientes receberão uma notificação.'
                                                })
                                            }}
                                        >
                                            <Bell className="w-4 h-4 mr-2" />
                                            Lembrar Pagamentos
                                            {statsData.pending > 0 && (
                                                <Badge className="ml-2 bg-red-500 text-white border-0 text-xs">
                                                    {statsData.pending}
                                                </Badge>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Resumo de Estatísticas Detalhadas */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Gráfico de Status */}
                            <Card className="border-0 shadow-xl shadow-slate-200/60 transition-all duration-300 hover:shadow-2xl">
                                <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-100">
                                    <CardTitle className="flex items-center gap-2">
                                        <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg shadow-lg">
                                            <Activity className="w-5 h-5 text-white" />
                                        </div>
                                        Distribuição por Status
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        {[
                                            { status: 'paid', label: 'Pagos', color: 'bg-emerald-500', bgColor: 'bg-emerald-100' },
                                            { status: 'pending', label: 'Pendentes', color: 'bg-yellow-500', bgColor: 'bg-yellow-100' },
                                            { status: 'cancelled', label: 'Cancelados', color: 'bg-red-500', bgColor: 'bg-red-100' },
                                            { status: 'refunded', label: 'Reembolsados', color: 'bg-gray-500', bgColor: 'bg-gray-100' }
                                        ].map(({ status, label, color, bgColor }) => {
                                            const count = filteredAttendances.filter(att => att.payment_status === status).length
                                            const percentage = filteredAttendances.length > 0
                                                ? (count / filteredAttendances.length * 100).toFixed(1)
                                                : '0'

                                            return (
                                                <div key={status} className="group">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-4 h-4 rounded-full ${color} shadow-sm group-hover:scale-110 transition-transform duration-300`} />
                                                            <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">{label}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-sm text-slate-500 font-medium">{percentage}%</span>
                                                            <span className="text-sm font-bold text-slate-900 min-w-[3rem] text-right">{count}</span>
                                                        </div>
                                                    </div>
                                                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className={`h-2 ${color} rounded-full transition-all duration-700 ease-out group-hover:shadow-lg`}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Resumo Financeiro */}
                            <Card className="border-0 shadow-xl shadow-slate-200/60 transition-all duration-300 hover:shadow-2xl">
                                <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-100">
                                    <CardTitle className="flex items-center gap-2">
                                        <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg shadow-lg">
                                            <DollarSign className="w-5 h-5 text-white" />
                                        </div>
                                        Resumo Financeiro
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between py-3 border-b border-slate-100 group hover:bg-slate-50 px-3 -mx-3 rounded-lg transition-all duration-300">
                                            <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">Receita Bruta</span>
                                            <span className="text-base font-bold text-emerald-600 group-hover:scale-105 transition-transform duration-300">
                                                R$ {statsData.totalRevenue.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between py-3 border-b border-slate-100 group hover:bg-slate-50 px-3 -mx-3 rounded-lg transition-all duration-300">
                                            <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">Custos dos Produtos</span>
                                            <span className="text-base font-bold text-red-600 group-hover:scale-105 transition-transform duration-300">
                                                R$ {statsData.totalCosts.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between py-3 border-b border-slate-100 group hover:bg-slate-50 px-3 -mx-3 rounded-lg transition-all duration-300">
                                            <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">Lucro Líquido</span>
                                            <span className="text-base font-bold text-blue-600 group-hover:scale-105 transition-transform duration-300">
                                                R$ {statsData.totalProfit.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between py-3 bg-gradient-to-r from-purple-50 to-pink-50 px-3 -mx-3 rounded-lg">
                                            <span className="text-sm font-bold text-slate-800">Margem de Lucro</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-bold text-purple-600">
                                                    {statsData.totalRevenue > 0 ? ((statsData.totalProfit / statsData.totalRevenue) * 100).toFixed(1) : '0'}%
                                                </span>
                                                <TrendingUp className="w-4 h-4 text-purple-500" />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </main>
            </div>

            {/* Modal de Atendimento */}
            {isModalOpen && (
                <AttendanceModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false)
                        setSelectedAttendance(undefined)
                    }}
                    attendance={selectedAttendance}
                    clients={clients}
                    procedures={procedures}
                    onSave={handleSaveAttendance}
                    onDelete={selectedAttendance ? () => handleDeleteAttendance(selectedAttendance.id) : undefined}
                />
            )}
        </div>
    )
}

export default AtendimentosPage