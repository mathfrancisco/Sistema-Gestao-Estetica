'use client'

import React, { useState} from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Scissors,
    Plus,
    Search,
    Clock,
    DollarSign,
    MoreHorizontal,
    CheckCircle,
    XCircle,
    RefreshCw,
    Edit,
    Trash2,
    Filter,
    Download,
    ChevronRight,
    Sparkles,
    Activity,
    TrendingUp,
    Copy,
    Tag,
    BarChart3
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
import Link from 'next/link'

import { toast } from 'sonner'
import { Sidebar } from '@/components/layout/sidebar'
import {
    useProcedures,
    useCreateProcedure,
    useUpdateProcedure,
    useDeleteProcedure,
    useProcedureStats,
    useActiveProcedureCategories,
    useProcedureFilters,
    useProceduresPagination,
    useBulkUpdateProcedureStatus
} from '@/lib/hooks/useProcedures'
import type {
    ProcedureWithCategory,
    ProcedureInsert,
    ProcedureUpdate
} from '@/types/procedure.types'
import ProcedureChart from "@/components/charts/ProcedureChart";
import ProcedureForm from "@/components/forms/ProcedureForm";

const ProcedimentosPage: React.FC = () => {
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [selectedProcedure, setSelectedProcedure] = useState<ProcedureWithCategory | null>(null)
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    // Hooks para filtros e paginação
    const { filters, searchQuery, updateFilters, updateSearchQuery, resetFilters } = useProcedureFilters()
    const { pagination, goToPage, changeLimit } = useProceduresPagination()

    // Hooks para dados
    const {
        data: proceduresData,
        isLoading: proceduresLoading,
        refetch: refetchProcedures
    } = useProcedures({
        page: pagination.page,
        limit: pagination.limit,
        filters: { ...filters, search: searchQuery }
    })

    const {
        data: stats,
        isLoading: statsLoading
    } = useProcedureStats()

    const {
        data: categories = [],
        isLoading: categoriesLoading
    } = useActiveProcedureCategories()

    // Mutations
    const createProcedure = useCreateProcedure()
    const updateProcedure = useUpdateProcedure()
    const deleteProcedure = useDeleteProcedure()
    const bulkUpdateStatus = useBulkUpdateProcedureStatus()

    const procedures = proceduresData?.data || []
    const isLoading = proceduresLoading || categoriesLoading

    const handleSaveProcedure = async (data: ProcedureInsert | ProcedureUpdate) => {
        try {
            if (selectedProcedure) {
                await updateProcedure.mutateAsync({
                    id: selectedProcedure.id,
                    data: data as ProcedureUpdate
                })
            } else {
                await createProcedure.mutateAsync(data as ProcedureInsert)
            }
            setIsFormOpen(false)
            setSelectedProcedure(null)
        } catch (error) {
            console.error('Erro ao salvar procedimento:', error)
        }
    }

    const handleDeleteProcedure = async () => {
        if (!selectedProcedure) return

        try {
            await deleteProcedure.mutateAsync(selectedProcedure.id)
            setIsFormOpen(false)
            setSelectedProcedure(null)
        } catch (error) {
            console.error('Erro ao excluir procedimento:', error)
        }
    }

    const handleBulkStatusUpdate = async (isActive: boolean) => {
        if (selectedIds.length === 0) {
            toast.warning('Selecione pelo menos um procedimento')
            return
        }

        try {
            await bulkUpdateStatus.mutateAsync({ procedureIds: selectedIds, isActive })
            setSelectedIds([])
        } catch (error) {
            console.error('Erro ao atualizar status em massa:', error)
        }
    }

    const getStatusBadge = (isActive: boolean) => {
        return isActive ? (
            <Badge variant="default" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Ativo
            </Badge>
        ) : (
            <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">
                <XCircle className="w-3 h-3 mr-1" />
                Inativo
            </Badge>
        )
    }

    const getMarginBadge = (price: number, cost: number) => {
        if (!cost || cost === 0) return null

        const margin = ((price - cost) / price) * 100

        if (margin >= 50) {
            return <Badge className="bg-emerald-500 text-white text-xs">{margin.toFixed(0)}%</Badge>
        } else if (margin >= 30) {
            return <Badge className="bg-blue-500 text-white text-xs">{margin.toFixed(0)}%</Badge>
        } else if (margin >= 15) {
            return <Badge className="bg-orange-500 text-white text-xs">{margin.toFixed(0)}%</Badge>
        } else {
            return <Badge className="bg-red-500 text-white text-xs">{margin.toFixed(0)}%</Badge>
        }
    }

    // Dados das métricas principais
    const metricsData = stats ? [
        {
            title: 'Total de Procedimentos',
            value: stats.total,
            icon: Scissors,
            description: 'Todos os procedimentos',
            gradient: 'from-purple-500 to-purple-600',
            trend: { value: stats.total, label: 'total', isPositive: true }
        },
        {
            title: 'Procedimentos Ativos',
            value: stats.active,
            icon: CheckCircle,
            description: 'Disponíveis para agendamento',
            gradient: 'from-emerald-500 to-emerald-600',
            trend: { value: stats.active, label: 'ativos', isPositive: true }
        },
        {
            title: 'Receita Total',
            value: `R$ ${stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            icon: DollarSign,
            description: 'Receita gerada',
            gradient: 'from-green-500 to-green-600',
            trend: { value: stats.totalRevenue, label: 'receita', isPositive: true },
            format: 'currency'
        },
        {
            title: 'Preço Médio',
            value: `R$ ${stats.averagePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            icon: TrendingUp,
            description: 'Preço médio dos procedimentos',
            gradient: 'from-blue-500 to-blue-600',
            trend: { value: stats.averagePrice, label: 'média', isPositive: true },
            format: 'currency'
        }
    ] : []

    if (isLoading && procedures.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <Sidebar />
                <div className="lg:ml-64">
                    <div className="flex items-center justify-center h-64">
                        <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
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
                                        <Scissors className="w-4 h-4 text-white" />
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                        Procedimentos
                                    </h1>
                                </div>
                                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                                    Gerencie todos os seus procedimentos estéticos
                                </p>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                {/* Status Badge */}
                                <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-lg shadow-emerald-500/25 text-xs">
                                    <Activity className="w-3 h-3 mr-1" />
                                    <span className="hidden sm:inline">Sistema Online</span>
                                    <span className="sm:hidden">Online</span>
                                </Badge>

                                {/* Botões de Ação */}
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <button
                                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                                        onClick={() => refetchProcedures()}
                                        disabled={isLoading}
                                    >
                                        <RefreshCw className={`w-4 h-4 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
                                    </button>
                                    <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                                        <Filter className="w-4 h-4 text-slate-600" />
                                    </button>
                                    <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                                        <Download className="w-4 h-4 text-slate-600" />
                                    </button>
                                    <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                                        <BarChart3 className="w-4 h-4 text-slate-600" />
                                    </button>
                                </div>

                                {/* Links Rápidos */}
                                <div className="flex items-center gap-1 ml-2">
                                    <Link href="/procedimentos/categorias">
                                        <Button variant="outline" className="bg-white border-slate-200 hover:bg-slate-50 shadow-sm text-xs sm:text-sm">
                                            <Tag className="w-4 h-4 mr-2" />
                                            <span className="hidden sm:inline">Categorias</span>
                                        </Button>
                                    </Link>
                                    <Link href="/procedimentos/rentabilidade">
                                        <Button variant="outline" className="bg-white border-slate-200 hover:bg-slate-50 shadow-sm text-xs sm:text-sm">
                                            <TrendingUp className="w-4 h-4 mr-2" />
                                            <span className="hidden sm:inline">Rentabilidade</span>
                                        </Button>
                                    </Link>
                                    <Button
                                        onClick={() => {
                                            setSelectedProcedure(null)
                                            setIsFormOpen(true)
                                        }}
                                        className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg shadow-purple-500/25 border-0"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        <span className="hidden sm:inline">Novo Procedimento</span>
                                        <span className="sm:hidden">Novo</span>
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
                                                {typeof metric.value === 'string' ? metric.value : metric.value.toLocaleString()}
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

                        {/* Gráficos de Análise */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <ProcedureChart
                                type="overview"
                                stats={stats}
                                procedures={procedures}
                            />
                            <ProcedureChart
                                type="revenue"
                                stats={stats}
                                procedures={procedures}
                            />
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
                                                placeholder="Buscar por nome, descrição ou categoria..."
                                                value={searchQuery}
                                                onChange={(e) => updateSearchQuery(e.target.value)}
                                                className="pl-10 border-slate-200 focus:border-purple-500 focus:ring-purple-500/20"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Tabs
                                            value={filters.is_active?.toString() || 'all'}
                                            onValueChange={(value) => updateFilters({
                                                is_active: value === 'all' ? undefined : value === 'true'
                                            })}
                                        >
                                            <TabsList className="bg-slate-100 border-0">
                                                <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Todos</TabsTrigger>
                                                <TabsTrigger value="true" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Ativos</TabsTrigger>
                                                <TabsTrigger value="false" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Inativos</TabsTrigger>
                                            </TabsList>
                                        </Tabs>
                                        <Button
                                            variant="outline"
                                            onClick={resetFilters}
                                            className="bg-white border-slate-200 hover:bg-slate-50"
                                        >
                                            Limpar Filtros
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Lista de Procedimentos */}
                        <Card className="border-0 shadow-xl shadow-slate-200/60 overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                    <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                                        <Scissors className="w-5 h-5 text-purple-500" />
                                        Procedimentos ({procedures.length})
                                        {isLoading && <RefreshCw className="w-4 h-4 animate-spin ml-2 text-purple-500" />}
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                        {selectedIds.length > 0 && (
                                            <div className="flex items-center gap-1">
                                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                                    {selectedIds.length} selecionados
                                                </Badge>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleBulkStatusUpdate(true)}
                                                    className="text-xs"
                                                >
                                                    Ativar
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleBulkStatusUpdate(false)}
                                                    className="text-xs"
                                                >
                                                    Desativar
                                                </Button>
                                            </div>
                                        )}
                                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                                            <Activity className="w-3 h-3 mr-1" />
                                            {procedures.length} resultados
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {procedures.length === 0 ? (
                                    <div className="text-center py-12 px-6">
                                        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Scissors className="w-8 h-8 text-white" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                            Nenhum procedimento encontrado
                                        </h3>
                                        <p className="text-slate-500 mb-6 max-w-md mx-auto">
                                            {searchQuery || filters.is_active !== undefined
                                                ? 'Tente ajustar os filtros ou criar um novo procedimento.'
                                                : 'Comece criando seu primeiro procedimento.'
                                            }
                                        </p>
                                        <Button
                                            onClick={() => {
                                                setSelectedProcedure(null)
                                                setIsFormOpen(true)
                                            }}
                                            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg shadow-purple-500/25 border-0"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Novo Procedimento
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-slate-50/50 hover:bg-slate-50">
                                                    <TableHead className="w-12">
                                                        <input
                                                            type="checkbox"
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedIds(procedures.map(p => p.id))
                                                                } else {
                                                                    setSelectedIds([])
                                                                }
                                                            }}
                                                            checked={selectedIds.length === procedures.length && procedures.length > 0}
                                                            className="rounded border-slate-300"
                                                        />
                                                    </TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Procedimento</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Categoria</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Preço</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Duração</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Margem</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                                                    <TableHead className="text-right font-semibold text-slate-700">Ações</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {procedures.map((procedure) => (
                                                    <TableRow key={procedure.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <TableCell>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedIds.includes(procedure.id)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedIds([...selectedIds, procedure.id])
                                                                    } else {
                                                                        setSelectedIds(selectedIds.filter(id => id !== procedure.id))
                                                                    }
                                                                }}
                                                                className="rounded border-slate-300"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            <div>
                                                                <p className="font-medium text-slate-900">{procedure.name}</p>
                                                                {procedure.description && (
                                                                    <p className="text-sm text-slate-500 truncate max-w-xs">
                                                                        {procedure.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            {procedure.procedure_categories ? (
                                                                <div className="flex items-center gap-2">
                                                                    {procedure.procedure_categories.color && (
                                                                        <div
                                                                            className="w-3 h-3 rounded-full"
                                                                            style={{ backgroundColor: procedure.procedure_categories.color }}
                                                                        />
                                                                    )}
                                                                    <span className="text-sm font-medium text-slate-700">
                                                                        {procedure.procedure_categories.name}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-sm text-slate-400">Sem categoria</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            <div className="font-medium text-slate-900">
                                                                R$ {procedure.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                            </div>
                                                            {procedure.cost && procedure.cost > 0 && (
                                                                <div className="text-xs text-slate-500">
                                                                    Custo: R$ {procedure.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            <div className="flex items-center gap-1 text-sm text-slate-600">
                                                                <Clock className="w-3 h-3" />
                                                                {procedure.duration_minutes} min
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            {getMarginBadge(procedure.price, procedure.cost || 0)}
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            {getStatusBadge(procedure.is_active)}
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
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setSelectedProcedure(procedure)
                                                                            setIsFormOpen(true)
                                                                        }}
                                                                        className="cursor-pointer"
                                                                    >
                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                        Editar
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            navigator.clipboard.writeText(JSON.stringify(procedure, null, 2))
                                                                            toast.success('Dados copiados!')
                                                                        }}
                                                                        className="cursor-pointer"
                                                                    >
                                                                        <Copy className="mr-2 h-4 w-4" />
                                                                        Copiar dados
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            updateProcedure.mutate({
                                                                                id: procedure.id,
                                                                                data: { is_active: !procedure.is_active }
                                                                            })
                                                                        }}
                                                                        className="cursor-pointer"
                                                                    >
                                                                        {procedure.is_active ? <XCircle className="mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                                                        {procedure.is_active ? 'Desativar' : 'Ativar'}
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setSelectedProcedure(procedure)
                                                                            handleDeleteProcedure()
                                                                        }}
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

                        {/* Ações em Lote */}
                        {procedures.length > 0 && (
                            <Card className="border-0 shadow-xl shadow-slate-200/60">
                                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Sparkles className="w-5 h-5 text-purple-500" />
                                        Ações Rápidas
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 lg:p-6">
                                    <div className="flex flex-wrap gap-3">
                                        <Button
                                            variant="outline"
                                            className="bg-white border-slate-200 hover:bg-slate-50"
                                            onClick={() => {
                                                const csvData = procedures.map(p => ({
                                                    nome: p.name,
                                                    categoria: p.procedure_categories?.name || '',
                                                    preco: p.price,
                                                    custo: p.cost || 0,
                                                    duracao: p.duration_minutes,
                                                    ativo: p.is_active ? 'Sim' : 'Não'
                                                }))

                                                const csvContent = [
                                                    Object.keys(csvData[0]).join(','),
                                                    ...csvData.map(row => Object.values(row).join(','))
                                                ].join('\n')

                                                const blob = new Blob([csvContent], { type: 'text/csv' })
                                                const url = URL.createObjectURL(blob)
                                                const a = document.createElement('a')
                                                a.href = url
                                                a.download = 'procedimentos.csv'
                                                a.click()
                                                URL.revokeObjectURL(url)

                                                toast.success('Lista exportada com sucesso!')
                                            }}
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Exportar Lista
                                        </Button>
                                        <Link href="/procedimentos/categorias">
                                            <Button
                                                variant="outline"
                                                className="bg-white border-slate-200 hover:bg-slate-50"
                                            >
                                                <Tag className="w-4 h-4 mr-2" />
                                                Gerenciar Categorias
                                            </Button>
                                        </Link>
                                        <Link href="/procedimentos/rentabilidade">
                                            <Button
                                                variant="outline"
                                                className="bg-white border-slate-200 hover:bg-slate-50"
                                            >
                                                <TrendingUp className="w-4 h-4 mr-2" />
                                                Análise de Rentabilidade
                                            </Button>
                                        </Link>
                                        <Link href="/procedimentos/precificacao">
                                            <Button
                                                variant="outline"
                                                className="bg-white border-slate-200 hover:bg-slate-50"
                                            >
                                                <DollarSign className="w-4 h-4 mr-2" />
                                                Sugestões de Preço
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </main>
            </div>

            {/* Modal de Formulário */}
            {isFormOpen && (
                <ProcedureForm
                    isOpen={isFormOpen}
                    onClose={() => {
                        setIsFormOpen(false)
                        setSelectedProcedure(null)
                    }}
                    procedure={selectedProcedure}
                    categories={categories}
                    onSave={handleSaveProcedure}
                    onDelete={selectedProcedure ? handleDeleteProcedure : undefined}
                    loading={createProcedure.isPending || updateProcedure.isPending || deleteProcedure.isPending}
                />
            )}
        </div>
    )
}

export default ProcedimentosPage