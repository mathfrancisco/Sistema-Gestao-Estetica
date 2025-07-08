'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Package,
    Plus,
    Search,
    AlertTriangle,
    TrendingUp,
    MoreHorizontal,
    RefreshCw,
    Edit,
    Trash2,
    Filter,
    Download,
    Bell,
    ChevronRight,
    Sparkles,
    Users,
    Activity,
    DollarSign,
    Calendar,
    ArrowUp,
    ArrowDown,
    MinusCircle,
    RotateCcw,
    PackageX,
    BarChart3,
    Archive
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
import { format, isAfter, isBefore, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { toast } from 'sonner'
import { Sidebar } from '@/components/layout/sidebar'
import { useStock } from '@/lib/hooks/useStock'
import ProductModal from '@/components/stock/ProductModal'
import StockMovementModal from '@/components/stock/StockMovementModal'
import type { Database } from '@/lib/database/supabase/types'

type Product = Database['public']['Tables']['products']['Row']
type StockMovementType = Database['public']['Enums']['stock_movement_enum']

const EstoquePage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [categoryFilter, setCategoryFilter] = useState<string>('all')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [isProductModalOpen, setIsProductModalOpen] = useState(false)
    const [isMovementModalOpen, setIsMovementModalOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [selectedMovementType, setSelectedMovementType] = useState<StockMovementType>('in')
    const [viewMode, setViewMode] = useState<'products' | 'movements'>('products')

    // Hook de estoque
    const {
        products,
        productsLoading,
        productsError,
        stockMovements,
        stockMovementsLoading,
        stockSummary,
        stockAlerts,
        stockValuation,
        categories,
        summaryLoading,
        alertsLoading,
        createProduct,
        updateProduct,
        deleteProduct,
        toggleProductStatus,
        createStockMovement,
        addStock,
        removeStock,
        adjustStock,
        markAsExpired,
        markAsLoss,
        clearErrors,
        refreshAll
    } = useStock()

    // Estado derivado para produtos filtrados
    const [filteredProducts, setFilteredProducts] = useState(products)

    // Aplicar filtros locais
    useEffect(() => {
        let filtered = products

        // Filtro por texto
        if (searchTerm) {
            filtered = filtered.filter(product =>
                product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.category?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        // Filtro por categoria
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(product => product.category === categoryFilter)
        }

        // Filtro por status
        if (statusFilter !== 'all') {
            switch (statusFilter) {
                case 'active':
                    filtered = filtered.filter(product => product.is_active)
                    break
                case 'inactive':
                    filtered = filtered.filter(product => !product.is_active)
                    break
                case 'low_stock':
                    filtered = filtered.filter(product => product.current_stock <= product.min_stock)
                    break
                case 'out_of_stock':
                    filtered = filtered.filter(product => product.current_stock === 0)
                    break
                case 'expiring':
                    const thirtyDaysFromNow = addDays(new Date(), 30)
                    filtered = filtered.filter(product => {
                        if (!product.expiry_date) return false
                        const expiryDate = new Date(product.expiry_date)
                        return isAfter(expiryDate, new Date()) && isBefore(expiryDate, thirtyDaysFromNow)
                    })
                    break
                case 'expired':
                    filtered = filtered.filter(product => {
                        if (!product.expiry_date) return false
                        return isBefore(new Date(product.expiry_date), new Date())
                    })
                    break
            }
        }

        setFilteredProducts(filtered)
    }, [products, searchTerm, categoryFilter, statusFilter])

    // Limpar erros quando necessário
    useEffect(() => {
        if (productsError) {
            toast.error(productsError)
            clearErrors()
        }
    }, [productsError, clearErrors])

    // Funções de manipulação
    const handleSaveProduct = async (data: any) => {
        try {
            if (selectedProduct) {
                await updateProduct(selectedProduct.id, data)
                toast.success('Produto atualizado com sucesso!')
            } else {
                await createProduct(data)
                toast.success('Produto criado com sucesso!')
            }
            setIsProductModalOpen(false)
            setSelectedProduct(null)
        } catch (error) {
            toast.error('Erro ao salvar produto')
        }
    }

    const handleDeleteProduct = async (id: string) => {
        try {
            await deleteProduct(id)
            toast.success('Produto excluído com sucesso!')
            setIsProductModalOpen(false)
            setSelectedProduct(null)
        } catch (error) {
            toast.error('Erro ao excluir produto')
        }
    }

    const handleToggleProductStatus = async (id: string) => {
        try {
            await toggleProductStatus(id)
            toast.success('Status do produto atualizado!')
        } catch (error) {
            toast.error('Erro ao atualizar status')
        }
    }

    const handleSaveMovement = async (data: any) => {
        try {
            await createStockMovement(data)
            toast.success('Movimentação registrada com sucesso!')
            setIsMovementModalOpen(false)
            setSelectedProduct(null)
        } catch (error) {
            toast.error('Erro ao registrar movimentação')
        }
    }

    const handleQuickMovement = async (product: Product, type: StockMovementType) => {
        setSelectedProduct(product)
        setSelectedMovementType(type)
        setIsMovementModalOpen(true)
    }

    const getStatusBadge = (product: Product) => {
        if (!product.is_active) {
            return <Badge variant="secondary" className="flex items-center gap-1"><MinusCircle className="w-3 h-3" />Inativo</Badge>
        }

        if (product.current_stock === 0) {
            return <Badge variant="destructive" className="flex items-center gap-1"><PackageX className="w-3 h-3" />Sem Estoque</Badge>
        }

        if (product.current_stock <= product.min_stock) {
            return <Badge variant="destructive" className="flex items-center gap-1 bg-orange-100 text-orange-700 border-orange-200"><AlertTriangle className="w-3 h-3" />Estoque Baixo</Badge>
        }

        return <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-700 border-green-200"><Package className="w-3 h-3" />OK</Badge>
    }

    const getExpiryBadge = (product: Product) => {
        if (!product.expiry_date) return null

        const expiryDate = new Date(product.expiry_date)
        const today = new Date()
        const thirtyDaysFromNow = addDays(today, 30)

        if (isBefore(expiryDate, today)) {
            return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Vencido</Badge>
        }

        if (isBefore(expiryDate, thirtyDaysFromNow)) {
            return <Badge variant="destructive" className="flex items-center gap-1 bg-orange-100 text-orange-700 border-orange-200"><Calendar className="w-3 h-3" />Vence em Breve</Badge>
        }

        return <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-700 border-green-200"><Calendar className="w-3 h-3" />Válido</Badge>
    }

    // Dados das métricas principais
    const metricsData = [
        {
            title: 'Total de Produtos',
            value: stockSummary?.totalProducts || 0,
            icon: Package,
            description: 'Produtos cadastrados',
            gradient: 'from-blue-500 to-blue-600',
            trend: { value: filteredProducts.length, label: 'filtrados', isPositive: true }
        },
        {
            title: 'Valor do Estoque',
            value: `R$ ${(stockValuation?.totalValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            icon: DollarSign,
            description: 'Valor total investido',
            gradient: 'from-emerald-500 to-emerald-600',
            trend: { value: stockValuation?.totalQuantity || 0, label: 'itens', isPositive: true }
        },
        {
            title: 'Alertas de Estoque',
            value: stockSummary?.lowStockCount || 0,
            icon: AlertTriangle,
            description: 'Produtos com estoque baixo',
            gradient: 'from-orange-500 to-orange-600',
            trend: { value: stockSummary?.expiredCount || 0, label: 'vencidos', isPositive: false }
        },
        {
            title: 'Produtos Ativos',
            value: filteredProducts.filter(p => p.is_active).length,
            icon: Activity,
            description: 'Produtos em uso',
            gradient: 'from-purple-500 to-purple-600',
            trend: { value: filteredProducts.filter(p => !p.is_active).length, label: 'inativos', isPositive: false }
        }
    ]

    const isLoading = productsLoading || summaryLoading

    if (isLoading && products.length === 0) {
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
                                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                        <Package className="w-4 h-4 text-white" />
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                        Controle de Estoque
                                    </h1>
                                </div>
                                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                                    Gerencie produtos, movimentações e controle de validade
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
                                    <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                                        <Bell className="w-4 h-4 text-slate-600" />
                                    </button>
                                </div>

                                {/* Botões Principais */}
                                <div className="flex items-center gap-2 ml-2">
                                    <Link href="/estoque/relatorios">
                                        <Button variant="outline" className="bg-white border-slate-200 hover:bg-slate-50 shadow-sm">
                                            <BarChart3 className="w-4 h-4 mr-2" />
                                            Relatórios
                                        </Button>
                                    </Link>
                                    <Button
                                        onClick={() => {
                                            setSelectedProduct(null)
                                            setIsProductModalOpen(true)
                                        }}
                                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25 border-0"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Novo Produto
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
                                                <TrendingUp className={`w-3 h-3 ${metric.trend.isPositive ? 'text-emerald-500' : 'text-orange-500'}`} />
                                                <span className={`text-xs font-medium ${metric.trend.isPositive ? 'text-emerald-600' : 'text-orange-600'}`}>
                                                    {metric.trend.value} {metric.trend.label}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Alertas de Estoque */}
                        {stockAlerts && stockAlerts.length > 0 && (
                            <Card className="border-0 shadow-xl shadow-slate-200/60 overflow-hidden">
                                <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100 p-4 lg:p-6">
                                    <CardTitle className="flex items-center gap-2 text-lg text-orange-800">
                                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                                        Alertas de Estoque ({stockAlerts.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 lg:p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {stockAlerts.slice(0, 6).map((alert) => (
                                            <div key={alert.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                                <div className="flex items-start justify-between mb-2">
                                                    <h4 className="font-medium text-slate-900 text-sm">{alert.productName}</h4>
                                                    <Badge
                                                        variant={alert.severity === 'critical' ? 'destructive' : 'destructive'}
                                                        className={
                                                            alert.severity === 'critical' ? '' :
                                                                alert.severity === 'high' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                                                    'bg-yellow-100 text-yellow-700 border-yellow-200'
                                                        }
                                                    >
                                                        {alert.type === 'low_stock' ? 'Estoque Baixo' :
                                                            alert.type === 'expired' ? 'Vencido' : 'Vencendo'}
                                                    </Badge>
                                                </div>
                                                <div className="space-y-1 text-xs text-slate-600">
                                                    <p>Estoque atual: {alert.currentStock}</p>
                                                    {alert.minStock && <p>Estoque mínimo: {alert.minStock}</p>}
                                                    {alert.expiryDate && (
                                                        <p>
                                                            {alert.type === 'expired' ? 'Vencido em:' : 'Vence em:'} {' '}
                                                            {format(new Date(alert.expiryDate), 'dd/MM/yyyy', { locale: ptBR })}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {stockAlerts.length > 6 && (
                                        <div className="mt-4 text-center">
                                            <Button variant="outline" size="sm">
                                                Ver todos os alertas ({stockAlerts.length})
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Navegação e Filtros */}
                        <Card className="border-0 shadow-xl shadow-slate-200/60 overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Search className="w-5 h-5 text-blue-500" />
                                        Filtros e Busca
                                    </CardTitle>

                                    {/* Navegação entre visualizações */}
                                    <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                                        <TabsList className="bg-slate-100 border-0">
                                            <TabsTrigger value="products" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                                <Package className="w-4 h-4 mr-2" />
                                                Produtos
                                            </TabsTrigger>
                                            <TabsTrigger value="movements" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                                <Archive className="w-4 h-4 mr-2" />
                                                Movimentações
                                            </TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 lg:p-6">
                                <div className="flex flex-col lg:flex-row gap-4">
                                    <div className="flex-1">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                            <Input
                                                placeholder="Buscar por nome, SKU, descrição ou categoria..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
                                            <TabsList className="bg-slate-100 border-0">
                                                <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Todas</TabsTrigger>
                                                {categories.map((category) => (
                                                    <TabsTrigger
                                                        key={category}
                                                        value={category}
                                                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                                                    >
                                                        {category}
                                                    </TabsTrigger>
                                                ))}
                                            </TabsList>
                                        </Tabs>
                                        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                                            <TabsList className="bg-slate-100 border-0">
                                                <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Todos</TabsTrigger>
                                                <TabsTrigger value="active" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Ativos</TabsTrigger>
                                                <TabsTrigger value="low_stock" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Estoque Baixo</TabsTrigger>
                                                <TabsTrigger value="expiring" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Vencendo</TabsTrigger>
                                            </TabsList>
                                        </Tabs>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Lista de Produtos */}
                        {viewMode === 'products' && (
                            <Card className="border-0 shadow-xl shadow-slate-200/60 overflow-hidden">
                                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                        <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                                            <Package className="w-5 h-5 text-blue-500" />
                                            Produtos ({filteredProducts.length})
                                            {isLoading && <RefreshCw className="w-4 h-4 animate-spin ml-2 text-blue-500" />}
                                        </CardTitle>
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                            <Users className="w-3 h-3 mr-1" />
                                            {filteredProducts.length} resultados
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {filteredProducts.length === 0 ? (
                                        <div className="text-center py-12 px-6">
                                            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Package className="w-8 h-8 text-white" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                                Nenhum produto encontrado
                                            </h3>
                                            <p className="text-slate-500 mb-6 max-w-md mx-auto">
                                                {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                                                    ? 'Tente ajustar os filtros ou criar um novo produto.'
                                                    : 'Comece criando seu primeiro produto.'
                                                }
                                            </p>
                                            <Button
                                                onClick={() => {
                                                    setSelectedProduct(null)
                                                    setIsProductModalOpen(true)
                                                }}
                                                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25 border-0"
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                Novo Produto
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-slate-50/50 hover:bg-slate-50">
                                                        <TableHead className="font-semibold text-slate-700">Produto</TableHead>
                                                        <TableHead className="font-semibold text-slate-700">Categoria</TableHead>
                                                        <TableHead className="font-semibold text-slate-700">Estoque</TableHead>
                                                        <TableHead className="font-semibold text-slate-700">Custo</TableHead>
                                                        <TableHead className="font-semibold text-slate-700">Validade</TableHead>
                                                        <TableHead className="font-semibold text-slate-700">Status</TableHead>
                                                        <TableHead className="text-right font-semibold text-slate-700">Ações</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredProducts.map((product) => (
                                                        <TableRow key={product.id} className="hover:bg-slate-50/50 transition-colors">
                                                            <TableCell className="py-4">
                                                                <div>
                                                                    <p className="font-medium text-slate-900">{product.name}</p>
                                                                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                                                                        {product.sku && (
                                                                            <span className="flex items-center gap-1">
                                                                                SKU: {product.sku}
                                                                            </span>
                                                                        )}
                                                                        {product.description && (
                                                                            <span className="truncate max-w-[200px]">
                                                                                {product.description}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-4">
                                                                {product.category ? (
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {product.category}
                                                                    </Badge>
                                                                ) : (
                                                                    <span className="text-slate-400 text-sm">-</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="py-4">
                                                                <div>
                                                                    <p className="font-medium text-slate-900">
                                                                        {product.current_stock} {product.unit}
                                                                    </p>
                                                                    <p className="text-sm text-slate-500">
                                                                        Mín: {product.min_stock} {product.unit}
                                                                    </p>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-4">
                                                                <div>
                                                                    <p className="font-medium text-slate-900">
                                                                        R$ {product.cost_price.toFixed(2)}
                                                                    </p>
                                                                    <p className="text-sm text-slate-500">
                                                                        Total: R$ {(product.current_stock * product.cost_price).toFixed(2)}
                                                                    </p>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-4">
                                                                {product.expiry_date ? (
                                                                    <div>
                                                                        <p className="text-sm font-medium text-slate-900">
                                                                            {format(new Date(product.expiry_date), 'dd/MM/yyyy')}
                                                                        </p>
                                                                        {getExpiryBadge(product)}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-slate-400 text-sm">-</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="py-4">
                                                                {getStatusBadge(product)}
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
                                                                                setSelectedProduct(product)
                                                                                setIsProductModalOpen(true)
                                                                            }}
                                                                            className="cursor-pointer"
                                                                        >
                                                                            <Edit className="mr-2 h-4 w-4" />
                                                                            Editar
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleQuickMovement(product, 'in')}
                                                                            className="cursor-pointer"
                                                                        >
                                                                            <ArrowUp className="mr-2 h-4 w-4 text-green-600" />
                                                                            Entrada
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleQuickMovement(product, 'out')}
                                                                            className="cursor-pointer"
                                                                        >
                                                                            <ArrowDown className="mr-2 h-4 w-4 text-blue-600" />
                                                                            Saída
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleQuickMovement(product, 'adjustment')}
                                                                            className="cursor-pointer"
                                                                        >
                                                                            <RotateCcw className="mr-2 h-4 w-4 text-orange-600" />
                                                                            Ajuste
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleToggleProductStatus(product.id)}
                                                                            className="cursor-pointer"
                                                                        >
                                                                            <MinusCircle className="mr-2 h-4 w-4" />
                                                                            {product.is_active ? 'Desativar' : 'Ativar'}
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleDeleteProduct(product.id)}
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
                        )}

                        {/* Ações em Lote */}
                        {filteredProducts.length > 0 && viewMode === 'products' && (
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
                                                setSelectedProduct(null)
                                                setSelectedMovementType('in')
                                                setIsMovementModalOpen(true)
                                            }}
                                        >
                                            <ArrowUp className="w-4 h-4 mr-2 text-green-600" />
                                            Nova Entrada
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="bg-white border-slate-200 hover:bg-slate-50"
                                            onClick={() => {
                                                setSelectedProduct(null)
                                                setSelectedMovementType('out')
                                                setIsMovementModalOpen(true)
                                            }}
                                        >
                                            <ArrowDown className="w-4 h-4 mr-2 text-blue-600" />
                                            Nova Saída
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="bg-white border-slate-200 hover:bg-slate-50"
                                            onClick={() => {
                                                // Lógica para exportar dados
                                                toast.info('Exportação iniciada...')
                                            }}
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Exportar Lista
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="bg-white border-slate-200 hover:bg-slate-50"
                                            onClick={() => {
                                                const lowStockCount = filteredProducts.filter(p => p.current_stock <= p.min_stock).length
                                                toast.info(`${lowStockCount} produtos com estoque baixo`)
                                            }}
                                        >
                                            <AlertTriangle className="w-4 h-4 mr-2" />
                                            Verificar Estoque Baixo
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </main>
            </div>

            {/* Modal de Produto */}
            {isProductModalOpen && (
                <ProductModal
                    isOpen={isProductModalOpen}
                    onClose={() => {
                        setIsProductModalOpen(false)
                        setSelectedProduct(null)
                    }}
                    product={selectedProduct}
                    categories={categories}
                    onSave={handleSaveProduct}
                    onDelete={selectedProduct ? () => handleDeleteProduct(selectedProduct.id) : undefined}
                />
            )}

            {/* Modal de Movimentação */}
            {isMovementModalOpen && (
                <StockMovementModal
                    isOpen={isMovementModalOpen}
                    onClose={() => {
                        setIsMovementModalOpen(false)
                        setSelectedProduct(null)
                    }}
                    products={products}
                    selectedProduct={selectedProduct}
                    defaultMovementType={selectedMovementType}
                    onSave={handleSaveMovement}
                />
            )}
        </div>
    )
}

export default EstoquePage