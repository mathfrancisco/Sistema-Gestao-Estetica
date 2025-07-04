'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
    AlertTriangle
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
import { format} from 'date-fns'
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

type Client = Database['public']['Tables']['clients']['Row']
type ClientStatus = Database['public']['Enums']['client_status_enum']
type ClientSegment = Database['public']['Enums']['client_segment_enum']

const ClientsPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [segmentFilter, setSegmentFilter] = useState<string>('all')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedClient, setSelectedClient] = useState<Client | undefined>()

    // Hooks para gerenciar dados
    const {
        data: clientsData,
        isLoading: clientsLoading,
        error: clientsError
    } = useClients({
        page: 1,
        limit: 50,
        filters: {
            status: statusFilter !== 'all' ? statusFilter as ClientStatus : undefined,
            segment: segmentFilter !== 'all' ? segmentFilter as ClientSegment : undefined
        }
    })

    const {
        data: clientStats,
        isLoading: statsLoading
    } = useClientStats()

    const {
        data: upcomingBirthdays,
        isLoading: birthdaysLoading
    } = useUpcomingBirthdays(30)

    const { mutate: createClient } = useCreateClient()
    const { mutate: updateClient } = useUpdateClient()
    const { mutate: deleteClient } = useDeleteClient()
    const { mutate: bulkUpdateSegments } = useBulkUpdateClientSegments()

    const clients = clientsData?.data || []
    const isLoading = clientsLoading || statsLoading

    // Estado derivado para clientes filtrados
    const [filteredClients, setFilteredClients] = useState<Client[]>([])

    // Aplicar filtros locais
    useEffect(() => {
        let filtered = clients

        // Filtro por texto
        if (searchTerm) {
            filtered = filtered.filter(client =>
                client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.cpf?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        setFilteredClients(filtered)
    }, [clients, searchTerm])

    const getStatusBadge = (status: ClientStatus) => {
        const statusConfig = {
            active: { label: 'Ativo', variant: 'default' as const, icon: CheckCircle },
            inactive: { label: 'Inativo', variant: 'secondary' as const, icon: Clock },
            blocked: { label: 'Bloqueado', variant: 'destructive' as const, icon: XCircle }
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

    const getSegmentBadge = (segment: ClientSegment | null) => {
        if (!segment) return null

        const segmentConfig = {
            vip: { label: 'VIP', variant: 'default' as const, icon: Crown, color: 'bg-gradient-to-r from-amber-500 to-orange-500' },
            regular: { label: 'Regular', variant: 'secondary' as const, icon: Users, color: 'bg-gradient-to-r from-blue-500 to-blue-600' },
            new: { label: 'Novo', variant: 'default' as const, icon: UserPlus, color: 'bg-gradient-to-r from-green-500 to-emerald-500' },
            at_risk: { label: 'Em Risco', variant: 'destructive' as const, icon: AlertTriangle, color: 'bg-gradient-to-r from-red-500 to-red-600' },
            lost: { label: 'Perdido', variant: 'destructive' as const, icon: XCircle, color: 'bg-gradient-to-r from-gray-500 to-gray-600' }
        }

        const config = segmentConfig[segment]
        const Icon = config.icon

        return (
            <Badge variant={config.variant} className={`flex items-center gap-1 text-white border-0 ${config.color}`}>
                <Icon className="w-3 h-3" />
                {config.label}
            </Badge>
        )
    }

    const handleSaveClient = async (data: any) => {
        try {
            if (selectedClient) {
                updateClient({ id: selectedClient.id, data })
                toast.success('Cliente atualizado com sucesso!')
            } else {
                createClient(data)
                toast.success('Cliente criado com sucesso!')
            }
            setIsModalOpen(false)
            setSelectedClient(undefined)
        } catch (error) {
            toast.error('Erro ao salvar cliente')
        }
    }

    const handleDeleteClient = async (id: string) => {
        try {
            deleteClient(id)
            toast.success('Cliente excluído com sucesso!')
        } catch (error) {
            toast.error('Erro ao excluir cliente')
        }
    }

    const getClientStats = () => {
        if (!clientStats) {
            return {
                total: filteredClients.length,
                active: filteredClients.filter(client => client.status === 'active').length,
                vip: filteredClients.filter(client => client.segment === 'vip').length,
                atRisk: filteredClients.filter(client => client.segment === 'at_risk').length,
                new: filteredClients.filter(client => client.segment === 'new').length,
                birthdays: upcomingBirthdays?.length || 0
            }
        }

        return {
            total: clientStats.total || 0,
            active: clientStats.active || 0,
            vip: clientStats.vip || 0,
            atRisk: clientStats.atRisk || 0,
            new: clientStats.new || 0,
            birthdays: upcomingBirthdays?.length || 0
        }
    }

    const statsData = getClientStats()

    // Dados das métricas principais
    const metricsData = [
        {
            title: 'Total de Clientes',
            value: statsData.total,
            icon: Users,
            description: 'Todos os clientes cadastrados',
            gradient: 'from-blue-500 to-blue-600',
            trend: { value: statsData.total, label: 'total', isPositive: true }
        },
        {
            title: 'Clientes Ativos',
            value: statsData.active,
            icon: CheckCircle,
            description: 'Clientes com status ativo',
            gradient: 'from-emerald-500 to-emerald-600',
            trend: { value: statsData.active, label: 'ativos', isPositive: true }
        },
        {
            title: 'Clientes VIP',
            value: statsData.vip,
            icon: Crown,
            description: 'Clientes de alto valor',
            gradient: 'from-amber-500 to-orange-500',
            trend: { value: statsData.vip, label: 'VIP', isPositive: true }
        },
        {
            title: 'Aniversariantes',
            value: statsData.birthdays,
            icon: Heart,
            description: 'Próximos 30 dias',
            gradient: 'from-pink-500 to-rose-500',
            trend: { value: statsData.birthdays, label: 'aniversários', isPositive: true }
        }
    ]

    if (isLoading && filteredClients.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <Sidebar />
                <div className="lg:ml-64">
                    <div className="flex items-center justify-center h-64">
                        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
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
                <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
                    <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                                        <Users className="w-4 h-4 text-white" />
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                        Clientes
                                    </h1>
                                </div>
                                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                                    Gerencie seus clientes e relacionamentos
                                </p>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                {/* Status Badge */}
                                <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-lg shadow-emerald-500/25 text-xs">
                                    <Activity className="w-3 h-3 mr-1" />
                                    <span className="hidden sm:inline">CRM Online</span>
                                    <span className="sm:hidden">Online</span>
                                </Badge>

                                {/* Botões de Ação */}
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                                        <RefreshCw className="w-4 h-4 text-slate-600" />
                                    </button>
                                    <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                                        <Filter className="w-4 h-4 text-slate-600" />
                                    </button>
                                    <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                                        <Download className="w-4 h-4 text-slate-600" />
                                    </button>
                                    <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                                        <Bell className="w-4 h-4 text-slate-600" />
                                    </button>
                                </div>

                                {/* Botões Principais */}
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

                {/* Conteúdo */}
                <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">

                        {/* Métricas Principais */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                            {metricsData.map((metric, index) => (
                                <Card key={index} className="relative overflow-hidden border-0 shadow-xl shadow-slate-200/60 hover:shadow-2xl hover:shadow-slate-300/60 transition-all duration-300 hover:-translate-y-1">
                                    <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-5`} />
                                    <CardContent className="p-4 lg:p-6 relative">
                                        <div className="flex items-center justify-between mb-3 lg:mb-4">
                                            <div className={`p-2 lg:p-3 rounded-2xl bg-gradient-to-br ${metric.gradient} shadow-lg`}>
                                                <metric.icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-400" />
                                        </div>

                                        <div className="space-y-1 lg:space-y-2">
                                            <p className="text-xs lg:text-sm font-medium text-slate-600">{metric.title}</p>
                                            <p className="text-xl lg:text-3xl font-bold text-slate-900 leading-tight">
                                                {metric.value.toLocaleString()}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className={`w-3 h-3 ${metric.trend.isPositive ? 'text-emerald-500' : 'text-orange-500'}`} />
                                                <span className={`text-xs font-medium ${metric.trend.isPositive ? 'text-emerald-600' : 'text-orange-600'}`}>
                                                    {metric.trend.label}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Filtros e Busca */}
                        <Card className="border-0 shadow-xl shadow-slate-200/60 overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Search className="w-5 h-5 text-purple-500" />
                                    Filtros e Busca
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 lg:p-6">
                                <div className="flex flex-col lg:flex-row gap-4">
                                    <div className="flex-1">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                            <Input
                                                placeholder="Buscar por nome, email, telefone ou CPF..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10 border-slate-200 focus:border-purple-500 focus:ring-purple-500/20"
                                            />
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
                                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                                        <Users className="w-3 h-3 mr-1" />
                                        {filteredClients.length} resultados
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {filteredClients.length === 0 ? (
                                    <div className="text-center py-12 px-6">
                                        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Users className="w-8 h-8 text-white" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                            Nenhum cliente encontrado
                                        </h3>
                                        <p className="text-slate-500 mb-6 max-w-md mx-auto">
                                            {searchTerm || statusFilter !== 'all' || segmentFilter !== 'all'
                                                ? 'Tente ajustar os filtros ou cadastre um novo cliente.'
                                                : 'Comece cadastrando seu primeiro cliente.'
                                            }
                                        </p>
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
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
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
                                                {filteredClients.map((client) => (
                                                    <TableRow key={client.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <TableCell className="py-4">
                                                            <div>
                                                                <p className="font-medium text-slate-900">{client.name}</p>
                                                                {client.cpf && (
                                                                    <p className="text-sm text-slate-500">CPF: {client.cpf}</p>
                                                                )}
                                                                {client.birthday && (
                                                                    <p className="text-sm text-slate-500">
                                                                        Nascimento: {format(new Date(client.birthday), 'dd/MM/yyyy')}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            <div className="space-y-1">
                                                                {client.phone && (
                                                                    <div className="flex items-center gap-2 text-sm">
                                                                        <Phone className="w-3 h-3 text-slate-400" />
                                                                        <span>{client.phone}</span>
                                                                    </div>
                                                                )}
                                                                {client.email && (
                                                                    <div className="flex items-center gap-2 text-sm">
                                                                        <Mail className="w-3 h-3 text-slate-400" />
                                                                        <span>{client.email}</span>
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
                                                                <p className="text-sm text-slate-500">
                                                                    LTV Score: {client.ltv_score || 0}
                                                                </p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            <div>
                                                                <p className="font-medium text-slate-900">
                                                                    {client.total_visits} visitas
                                                                </p>
                                                                {client.last_visit && (
                                                                    <p className="text-sm text-slate-500">
                                                                        Última: {format(new Date(client.last_visit), 'dd/MM/yyyy')}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right py-4">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-56">
                                                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                                    <DropdownMenuItem asChild className="cursor-pointer">
                                                                        <Link href={`/clientes/${client.id}`}>
                                                                            <Eye className="mr-2 h-4 w-4" />
                                                                            Ver Perfil
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
                                                                        Editar
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
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleDeleteClient(client.id)}
                                                                        className="cursor-pointer text-red-600"
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

                        {/* Ações em Lote e Estatísticas Detalhadas */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Ações Rápidas */}
                            <Card className="border-0 shadow-xl shadow-slate-200/60">
                                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                    <CardTitle className="flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-purple-500" />
                                        Ações Rápidas
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-3">
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start bg-white border-slate-200 hover:bg-slate-50"
                                            onClick={() => {
                                                const atRiskClients = filteredClients.filter(client => client.segment === 'at_risk')
                                                toast.info(`${atRiskClients.length} clientes em risco encontrados`)
                                            }}
                                        >
                                            <AlertTriangle className="w-4 h-4 mr-2" />
                                            Campanhas de Reativação ({filteredClients.filter(c => c.segment === 'at_risk').length})
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start bg-white border-slate-200 hover:bg-slate-50"
                                            onClick={() => {
                                                toast.info(`${statsData.birthdays} aniversariantes nos próximos 30 dias`)
                                            }}
                                        >
                                            <Heart className="w-4 h-4 mr-2" />
                                            Lembretes de Aniversário ({statsData.birthdays})
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start bg-white border-slate-200 hover:bg-slate-50"
                                            onClick={() => {
                                                toast.info('Exportação de dados iniciada...')
                                            }}
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Exportar Lista de Clientes
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start bg-white border-slate-200 hover:bg-slate-50"
                                            onClick={() => {
                                                toast.info('Segmentação automática em andamento...')
                                            }}
                                        >
                                            <Target className="w-4 h-4 mr-2" />
                                            Atualizar Segmentação
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Distribuição por Segmento */}
                            <Card className="border-0 shadow-xl shadow-slate-200/60">
                                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                    <CardTitle className="flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-blue-500" />
                                        Distribuição por Segmento
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        {[
                                            { segment: 'vip', label: 'VIP', color: 'bg-amber-500', icon: Crown },
                                            { segment: 'regular', label: 'Regular', color: 'bg-blue-500', icon: Users },
                                            { segment: 'new', label: 'Novos', color: 'bg-green-500', icon: UserPlus },
                                            { segment: 'at_risk', label: 'Em Risco', color: 'bg-red-500', icon: AlertTriangle },
                                            { segment: 'lost', label: 'Perdidos', color: 'bg-gray-500', icon: XCircle }
                                        ].map(({ segment, label, color, icon: Icon }) => {
                                            const count = filteredClients.filter(client => client.segment === segment).length
                                            const percentage = filteredClients.length > 0
                                                ? (count / filteredClients.length * 100).toFixed(1)
                                                : '0'

                                            return (
                                                <div key={segment} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-3 h-3 rounded-full ${color}`} />
                                                        <div className="flex items-center gap-2">
                                                            <Icon className="w-4 h-4 text-slate-600" />
                                                            <span className="text-sm font-medium text-slate-700">{label}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-slate-500">{percentage}%</span>
                                                        <span className="text-sm font-semibold text-slate-900">{count}</span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Clientes em Destaque */}
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
                                                <div key={client.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
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
                                                            R$ {client.total_spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                                            <div key={client.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-900 truncate">
                                                        {client.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {client.phone && `${client.phone} • `}
                                                        {client.segment && getSegmentBadge(client.segment)}
                                                    </p>
                                                </div>
                                                <div className="text-right ml-4">
                                                    <p className="text-sm font-medium text-pink-600">
                                                        {client.birthday && format(new Date(client.birthday), 'dd/MM')}
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
    )
}

export default ClientsPage