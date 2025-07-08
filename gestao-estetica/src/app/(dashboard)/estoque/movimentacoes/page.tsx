'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Archive,
    Plus,
    Search,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    MoreHorizontal,
    RefreshCw,
    Trash2,
    Filter,
    Download,
    ChevronRight,
    Activity,
    DollarSign,
    ArrowUp,
    ArrowDown,
    RotateCcw,
    Minus,
    Package,
    History,
    Eye,
    ChevronLeft,
    ChevronFirst,
    ChevronLast, BarChart3
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Sidebar } from '@/components/layout/sidebar'
import { useStock } from '@/lib/hooks/useStock'
import StockMovementModal from '@/components/stock/StockMovementModal'
import type { Database } from '@/lib/database/supabase/types'

type StockMovementType = Database['public']['Enums']['stock_movement_enum']
type StockMovementWithProduct = Database['public']['Tables']['stock_movements']['Row'] & {
    products?: { name: string; unit: string; sku: string | null }
}

const MovimentacoesPage: React.FC = () => {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [searchTerm, setSearchTerm] = useState('')
    const [movementTypeFilter, setMovementTypeFilter] = useState<string>('all')
    const [dateFilter, setDateFilter] = useState<string>('all')
    const [customDateFrom, setCustomDateFrom] = useState('')
    const [customDateTo, setCustomDateTo] = useState('')
    const [selectedProduct, setSelectedProduct] = useState<string>('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(20)
    const [isMovementModalOpen, setIsMovementModalOpen] = useState(false)
    const [selectedMovementType, setSelectedMovementType] = useState<StockMovementType>('in')

    // Hook de estoque
    const {
        products,
        stockMovements,
        stockMovementsLoading,
        stockMovementsError,
        stockMovementSummary,
        fetchStockMovements,
        createStockMovement,
        updateStockMovement,
        deleteStockMovement,
        fetchStockMovementSummary,
        clearErrors,
        refreshAll
    } = useStock()

    // Estado derivado para movimentações filtradas
    const [filteredMovements, setFilteredMovements] = useState<StockMovementWithProduct[]>([])
    const [paginatedMovements, setPaginatedMovements] = useState<StockMovementWithProduct[]>([])

    // Parâmetros da URL
    const productIdFromUrl = searchParams.get('productId')

    // Inicializar filtros com parâmetros da URL
    useEffect(() => {
        if (productIdFromUrl) {
            setSelectedProduct(productIdFromUrl)
        }
    }, [productIdFromUrl])

    // Aplicar filtros
    useEffect(() => {
        let filtered = [...stockMovements]

        // Filtro por texto
        if (searchTerm) {
            filtered = filtered.filter(movement =>
                movement.products?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                movement.products?.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                movement.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                movement.reference_id?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        // Filtro por produto
        if (selectedProduct !== 'all') {
            filtered = filtered.filter(movement => movement.product_id === selectedProduct)
        }

        // Filtro por tipo de movimentação
        if (movementTypeFilter !== 'all') {
            filtered = filtered.filter(movement => movement.movement_type === movementTypeFilter)
        }

        // Filtro por data
        if (dateFilter !== 'all') {
            const now = new Date()
            let startDate: Date, endDate: Date

            switch (dateFilter) {
                case 'today':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
                    break
                case 'week':
                    startDate = startOfWeek(now, { weekStartsOn: 0 })
                    endDate = endOfWeek(now, { weekStartsOn: 0 })
                    break
                case 'month':
                    startDate = startOfMonth(now)
                    endDate = endOfMonth(now)
                    break
                case 'custom':
                    if (customDateFrom && customDateTo) {
                        startDate = new Date(customDateFrom)
                        endDate = new Date(customDateTo + 'T23:59:59')
                    } else {
                        startDate = new Date(0)
                        endDate = now
                    }
                    break
                default:
                    startDate = new Date(0)
                    endDate = now
            }

            filtered = filtered.filter(movement => {
                const movementDate = new Date(movement.created_at)
                return movementDate >= startDate && movementDate <= endDate
            })
        }

        // Ordenar por data (mais recente primeiro)
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        setFilteredMovements(filtered)
        setCurrentPage(1) // Reset para primeira página quando filtros mudarem
    }, [stockMovements, searchTerm, selectedProduct, movementTypeFilter, dateFilter, customDateFrom, customDateTo])

    // Paginação
    useEffect(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        setPaginatedMovements(filteredMovements.slice(startIndex, endIndex))
    }, [filteredMovements, currentPage, itemsPerPage])

    // Carregar resumo das movimentações
    useEffect(() => {
        const dateFrom = dateFilter === 'custom' && customDateFrom ? customDateFrom : undefined
        const dateTo = dateFilter === 'custom' && customDateTo ? customDateTo : undefined
        fetchStockMovementSummary(dateFrom, dateTo)
    }, [dateFilter, customDateFrom, customDateTo, fetchStockMovementSummary])

    // Limpar erros quando necessário
    useEffect(() => {
        if (stockMovementsError) {
            toast.error(stockMovementsError)
            clearErrors()
        }
    }, [stockMovementsError, clearErrors])

    // Carregar movimentações com filtros
    useEffect(() => {
        const filters: any = {}
        if (selectedProduct !== 'all') {
            filters.productId = selectedProduct
        }
        if (movementTypeFilter !== 'all') {
            filters.movementType = movementTypeFilter
        }
        if (dateFilter === 'custom' && customDateFrom) {
            filters.dateFrom = customDateFrom
        }
        if (dateFilter === 'custom' && customDateTo) {
            filters.dateTo = customDateTo + 'T23:59:59'
        }

        fetchStockMovements({ filters, limit: 500 }) // Carregar mais itens para filtros locais
    }, [selectedProduct, movementTypeFilter, dateFilter, customDateFrom, customDateTo, fetchStockMovements])

    // Funções de manipulação
    const handleSaveMovement = async (data: any) => {
        try {
            await createStockMovement(data)
            toast.success('Movimentação registrada com sucesso!')
            setIsMovementModalOpen(false)
        } catch (error) {
            toast.error('Erro ao registrar movimentação')
        }
    }

    const handleDeleteMovement = async (id: string) => {
        try {
            await deleteStockMovement(id)
            toast.success('Movimentação excluída com sucesso!')
        } catch (error) {
            toast.error('Erro ao excluir movimentação')
        }
    }

    const getMovementTypeIcon = (type: StockMovementType) => {
        switch (type) {
            case 'in': return <ArrowUp className="w-4 h-4 text-green-600" />
            case 'out': return <ArrowDown className="w-4 h-4 text-blue-600" />
            case 'adjustment': return <RotateCcw className="w-4 h-4 text-orange-600" />
            case 'expired': return <AlertTriangle className="w-4 h-4 text-red-600" />
            case 'loss': return <Minus className="w-4 h-4 text-red-600" />
            default: return <Package className="w-4 h-4" />
        }
    }

    const getMovementTypeLabel = (type: StockMovementType) => {
        switch (type) {
            case 'in': return 'Entrada'
            case 'out': return 'Saída'
            case 'adjustment': return 'Ajuste'
            case 'expired': return 'Vencido'
            case 'loss': return 'Perda'
            default: return type
        }
    }

    const getMovementTypeBadge = (type: StockMovementType) => {
        const configs = {
            in: { variant: 'default' as const, className: 'bg-green-100 text-green-700 border-green-200' },
            out: { variant: 'default' as const, className: 'bg-blue-100 text-blue-700 border-blue-200' },
            adjustment: { variant: 'default' as const, className: 'bg-orange-100 text-orange-700 border-orange-200' },
            expired: { variant: 'destructive' as const, className: '' },
            loss: { variant: 'destructive' as const, className: '' }
        }

        const config = configs[type]
        return (
            <Badge variant={config.variant} className={`flex items-center gap-1 ${config.className}`}>
                {getMovementTypeIcon(type)}
                {getMovementTypeLabel(type)}
            </Badge>
        )
    }

    // Cálculos de estatísticas
    const totalPages = Math.ceil(filteredMovements.length / itemsPerPage)
    const movementStats = {
        total: filteredMovements.length,
        totalIn: filteredMovements.filter(m => m.movement_type === 'in').length,
        totalOut: filteredMovements.filter(m => ['out', 'expired', 'loss'].includes(m.movement_type)).length,
        totalValue: filteredMovements.reduce((sum, m) => sum + ((m.unit_cost || 0) * m.quantity), 0)
    }

    const isLoading = stockMovementsLoading

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            {/* Sidebar */}
            <Sidebar />

            {/* Conteúdo Principal */}
            <div className="lg:ml-64">
                {/* Header com Breadcrumb */}
                <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
                    <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                                {/* Breadcrumb */}
                                <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                                    <Link href="/estoque" className="hover:text-slate-700 transition-colors">
                                        Estoque
                                    </Link>
                                    <ChevronRight className="w-4 h-4" />
                                    <span className="text-slate-900 font-medium">Movimentações</span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                        <Archive className="w-4 h-4 text-white" />
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                        Movimentações de Estoque
                                    </h1>
                                </div>
                                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                                    Histórico completo de entradas, saídas e ajustes
                                </p>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                {/* Status Badge */}
                                <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-lg shadow-emerald-500/25 text-xs">
                                    <Activity className="w-3 h-3 mr-1" />
                                    <span className="hidden sm:inline">{movementStats.total} registros</span>
                                    <span className="sm:hidden">{movementStats.total}</span>
                                </Badge>

                                {/* Botões de Ação */}
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <button
                                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                                        onClick={() => refreshAll()}
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
                                </div>

                                {/* Botão Principal */}
                                <Button
                                    onClick={() => {
                                        setSelectedMovementType('in')
                                        setIsMovementModalOpen(true)
                                    }}
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25 border-0"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Nova Movimentação
                                </Button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Conteúdo */}
                <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">

                        {/* Estatísticas Rápidas */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="border-0 shadow-lg">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-600">Total</p>
                                            <p className="text-2xl font-bold text-slate-900">{movementStats.total}</p>
                                        </div>
                                        <Archive className="w-8 h-8 text-blue-500" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-0 shadow-lg">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-600">Entradas</p>
                                            <p className="text-2xl font-bold text-green-600">{movementStats.totalIn}</p>
                                        </div>
                                        <ArrowUp className="w-8 h-8 text-green-500" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-0 shadow-lg">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-600">Saídas</p>
                                            <p className="text-2xl font-bold text-blue-600">{movementStats.totalOut}</p>
                                        </div>
                                        <ArrowDown className="w-8 h-8 text-blue-500" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-0 shadow-lg">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-600">Valor</p>
                                            <p className="text-lg font-bold text-purple-600">
                                                R$ {movementStats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        <DollarSign className="w-8 h-8 text-purple-500" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Filtros Avançados */}
                        <Card className="border-0 shadow-xl shadow-slate-200/60 overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Search className="w-5 h-5 text-blue-500" />
                                    Filtros Avançados
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 lg:p-6">
                                <div className="space-y-4">
                                    {/* Primeira linha - Busca e Produto */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-slate-700 mb-2 block">Buscar</label>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                                <Input
                                                    placeholder="Buscar por produto, observações ou referência..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="pl-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-slate-700 mb-2 block">Produto</label>
                                            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                                                <SelectTrigger className="border-slate-200 focus:border-blue-500">
                                                    <SelectValue placeholder="Todos os produtos" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Todos os produtos</SelectItem>
                                                    {products.map((product) => (
                                                        <SelectItem key={product.id} value={product.id}>
                                                            {product.name} {product.sku && `(${product.sku})`}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Segunda linha - Tipo e Período */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-slate-700 mb-2 block">Tipo de Movimentação</label>
                                            <Tabs value={movementTypeFilter} onValueChange={setMovementTypeFilter}>
                                                <TabsList className="bg-slate-100 border-0 w-full justify-start">
                                                    <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Todos</TabsTrigger>
                                                    <TabsTrigger value="in" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Entradas</TabsTrigger>
                                                    <TabsTrigger value="out" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Saídas</TabsTrigger>
                                                    <TabsTrigger value="adjustment" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Ajustes</TabsTrigger>
                                                </TabsList>
                                            </Tabs>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-slate-700 mb-2 block">Período</label>
                                            <Tabs value={dateFilter} onValueChange={setDateFilter}>
                                                <TabsList className="bg-slate-100 border-0 w-full justify-start">
                                                    <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Todos</TabsTrigger>
                                                    <TabsTrigger value="today" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Hoje</TabsTrigger>
                                                    <TabsTrigger value="week" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Semana</TabsTrigger>
                                                    <TabsTrigger value="month" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Mês</TabsTrigger>
                                                    <TabsTrigger value="custom" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Personalizado</TabsTrigger>
                                                </TabsList>
                                            </Tabs>
                                        </div>
                                    </div>

                                    {/* Filtro de Data Personalizado */}
                                    {dateFilter === 'custom' && (
                                        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                            <div>
                                                <label className="text-sm font-medium text-slate-700 mb-2 block">Data Inicial</label>
                                                <Input
                                                    type="date"
                                                    value={customDateFrom}
                                                    onChange={(e) => setCustomDateFrom(e.target.value)}
                                                    className="border-slate-200 focus:border-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-slate-700 mb-2 block">Data Final</label>
                                                <Input
                                                    type="date"
                                                    value={customDateTo}
                                                    onChange={(e) => setCustomDateTo(e.target.value)}
                                                    className="border-slate-200 focus:border-blue-500"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Lista de Movimentações */}
                        <Card className="border-0 shadow-xl shadow-slate-200/60 overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                    <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                                        <History className="w-5 h-5 text-blue-500" />
                                        Movimentações ({filteredMovements.length})
                                        {isLoading && <RefreshCw className="w-4 h-4 animate-spin ml-2 text-blue-500" />}
                                    </CardTitle>

                                    {/* Controles de Paginação Superior */}
                                    <div className="flex items-center gap-2">
                                        <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(parseInt(value))}>
                                            <SelectTrigger className="w-20">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="10">10</SelectItem>
                                                <SelectItem value="20">20</SelectItem>
                                                <SelectItem value="50">50</SelectItem>
                                                <SelectItem value="100">100</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <span className="text-sm text-slate-600">por página</span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {filteredMovements.length === 0 ? (
                                    <div className="text-center py-12 px-6">
                                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <History className="w-8 h-8 text-white" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                            Nenhuma movimentação encontrada
                                        </h3>
                                        <p className="text-slate-500 mb-6 max-w-md mx-auto">
                                            {searchTerm || selectedProduct !== 'all' || movementTypeFilter !== 'all' || dateFilter !== 'all'
                                                ? 'Tente ajustar os filtros ou registrar uma nova movimentação.'
                                                : 'Comece registrando sua primeira movimentação de estoque.'
                                            }
                                        </p>
                                        <Button
                                            onClick={() => {
                                                setSelectedMovementType('in')
                                                setIsMovementModalOpen(true)
                                            }}
                                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25 border-0"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Nova Movimentação
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-slate-50/50 hover:bg-slate-50">
                                                    <TableHead className="font-semibold text-slate-700">Produto</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Tipo</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Quantidade</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Custo</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Data</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Observações</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Referência</TableHead>
                                                    <TableHead className="text-right font-semibold text-slate-700">Ações</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {paginatedMovements.map((movement) => (
                                                    <TableRow key={movement.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <TableCell className="py-4">
                                                            <div>
                                                                <p className="font-medium text-slate-900">
                                                                    {movement.products?.name || 'Produto não encontrado'}
                                                                </p>
                                                                {movement.products?.sku && (
                                                                    <p className="text-sm text-slate-500">
                                                                        SKU: {movement.products.sku}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            {getMovementTypeBadge(movement.movement_type)}
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            <span className="font-medium text-slate-900">
                                                                {movement.movement_type === 'adjustment' ? '' :
                                                                    ['out', 'expired', 'loss'].includes(movement.movement_type) ? '-' : '+'
                                                                }
                                                                {movement.quantity} {movement.products?.unit || ''}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            {movement.unit_cost ? (
                                                                <div>
                                                                    <p className="font-medium text-slate-900">
                                                                        R$ {movement.unit_cost.toFixed(2)}
                                                                    </p>
                                                                    <p className="text-sm text-slate-500">
                                                                        Total: R$ {(movement.unit_cost * movement.quantity).toFixed(2)}
                                                                    </p>
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-400">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            <div>
                                                                <p className="font-medium text-slate-900">
                                                                    {format(new Date(movement.created_at), 'dd/MM/yyyy')}
                                                                </p>
                                                                <p className="text-sm text-slate-500">
                                                                    {format(new Date(movement.created_at), 'HH:mm')}
                                                                </p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            {movement.notes ? (
                                                                <span className="text-sm text-slate-600 truncate max-w-[200px] block">
                                                                    {movement.notes}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-400">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            {movement.reference_type && movement.reference_id ? (
                                                                <div>
                                                                    <p className="text-sm font-medium text-slate-700">
                                                                        {movement.reference_type}
                                                                    </p>
                                                                    <p className="text-xs text-slate-500">
                                                                        {movement.reference_id}
                                                                    </p>
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-400">-</span>
                                                            )}
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
                                                                    <DropdownMenuItem asChild>
                                                                        <Link href={`/estoque/produtos/${movement.product_id}`} className="cursor-pointer">
                                                                            <Eye className="mr-2 h-4 w-4" />
                                                                            Ver Produto
                                                                        </Link>
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleDeleteMovement(movement.id)}
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

                            {/* Paginação */}
                            {totalPages > 1 && (
                                <div className="border-t border-slate-200 p-4 lg:p-6 bg-slate-50/50">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-slate-600">
                                            Mostrando {(currentPage - 1) * itemsPerPage + 1} a{' '}
                                            {Math.min(currentPage * itemsPerPage, filteredMovements.length)} de{' '}
                                            {filteredMovements.length} registros
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(1)}
                                                disabled={currentPage === 1}
                                            >
                                                <ChevronFirst className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(currentPage - 1)}
                                                disabled={currentPage === 1}
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </Button>
                                            <span className="text-sm font-medium px-3">
                                                {currentPage} de {totalPages}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(totalPages)}
                                                disabled={currentPage === totalPages}
                                            >
                                                <ChevronLast className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Card>

                        {/* Resumo de Movimentações */}
                        {stockMovementSummary && (
                            <Card className="border-0 shadow-xl shadow-slate-200/60">
                                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <BarChart3 className="w-5 h-5 text-purple-500" />
                                        Resumo do Período
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                                        <div className="text-center">
                                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                                <TrendingUp className="w-6 h-6 text-green-600" />
                                            </div>
                                            <p className="text-sm text-slate-600">Entradas</p>
                                            <p className="text-lg font-bold text-green-600">{stockMovementSummary.totalIn}</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                                <TrendingDown className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <p className="text-sm text-slate-600">Saídas</p>
                                            <p className="text-lg font-bold text-blue-600">{stockMovementSummary.totalOut}</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                                <RotateCcw className="w-6 h-6 text-orange-600" />
                                            </div>
                                            <p className="text-sm text-slate-600">Ajustes</p>
                                            <p className="text-lg font-bold text-orange-600">{stockMovementSummary.totalAdjustments}</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                                <AlertTriangle className="w-6 h-6 text-red-600" />
                                            </div>
                                            <p className="text-sm text-slate-600">Vencidos</p>
                                            <p className="text-lg font-bold text-red-600">{stockMovementSummary.totalExpired}</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                                <Minus className="w-6 h-6 text-red-600" />
                                            </div>
                                            <p className="text-sm text-slate-600">Perdas</p>
                                            <p className="text-lg font-bold text-red-600">{stockMovementSummary.totalLoss}</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                                <Activity className="w-6 h-6 text-purple-600" />
                                            </div>
                                            <p className="text-sm text-slate-600">Saldo</p>
                                            <p className={`text-lg font-bold ${
                                                stockMovementSummary.netMovement >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {stockMovementSummary.netMovement >= 0 ? '+' : ''}{stockMovementSummary.netMovement}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </main>
            </div>

            {/* Modal de Movimentação */}
            {isMovementModalOpen && (
                <StockMovementModal
                    isOpen={isMovementModalOpen}
                    onClose={() => setIsMovementModalOpen(false)}
                    products={products}
                    selectedProduct={selectedProduct !== 'all' ? products.find(p => p.id === selectedProduct) : null}
                    defaultMovementType={selectedMovementType}
                    onSave={handleSaveMovement}
                />
            )}
        </div>
    )
}

export default MovimentacoesPage