// app/estoque/produtos/page.tsx
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
    MoreHorizontal,
    RefreshCw,
    Edit,
    Trash2,
    Filter,
    Download,
    ChevronRight,
    Eye,
    Activity,
    DollarSign,
    Calendar,
    ArrowUp,
    ArrowDown,
    RotateCcw,
    PackageX,
    Grid3X3,
    List,
    SortAsc,
    SortDesc,
    Zap,
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
import Link from 'next/link'
import { toast } from 'sonner'
import { Sidebar } from '@/components/layout/sidebar'
import { useStock } from '@/lib/hooks/useStock'
import ProductModal from '@/components/stock/ProductModal'
import StockMovementModal from '@/components/stock/StockMovementModal'
import type { Database } from '@/lib/database/supabase/types'

type Product = Database['public']['Tables']['products']['Row']
type StockMovementType = Database['public']['Enums']['stock_movement_enum']

const ProdutosPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [categoryFilter, setCategoryFilter] = useState<string>('all')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [sortBy, setSortBy] = useState<'name' | 'category' | 'current_stock' | 'cost_price' | 'expiry_date'>('name')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
    const [isProductModalOpen, setIsProductModalOpen] = useState(false)
    const [isMovementModalOpen, setIsMovementModalOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [selectedMovementType, setSelectedMovementType] = useState<StockMovementType>('in')

    // Hook de estoque
    const {
        products,
        productsLoading,
        productsError,
        stockSummary,
        stockAlerts,
        stockValuation,
        categories,
        createProduct,
        updateProduct,
        deleteProduct,
        toggleProductStatus,
        createStockMovement,
        clearErrors,
        refreshAll
    } = useStock()

    // Estado derivado para produtos filtrados e ordenados
    const [filteredProducts, setFilteredProducts] = useState(products)

    // Aplicar filtros e ordenação
    useEffect(() => {
        let filtered = [...products]

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

        // Ordenação
        filtered.sort((a, b) => {
            let aValue: any = a[sortBy]
            let bValue: any = b[sortBy]

            // Tratamento especial para diferentes tipos
            if (sortBy === 'expiry_date') {
                if (!aValue && !bValue) return 0
                if (!aValue) return 1
                if (!bValue) return -1
                aValue = new Date(aValue)
                bValue = new Date(bValue)
            }

            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase()
                bValue = bValue?.toLowerCase() || ''
            }

            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
            return 0
        })

        setFilteredProducts(filtered)
    }, [products, searchTerm, categoryFilter, statusFilter, sortBy, sortOrder])

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

    const handleSort = (field: typeof sortBy) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortBy(field)
            setSortOrder('asc')
        }
    }

    const getStatusBadge = (product: Product) => {
        if (!product.is_active) {
            return <Badge variant="secondary" className="flex items-center gap-1"><Archive className="w-3 h-3" />Inativo</Badge>
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

    // Estatísticas dos produtos filtrados
    const filteredStats = {
        total: filteredProducts.length,
        active: filteredProducts.filter(p => p.is_active).length,
        lowStock: filteredProducts.filter(p => p.current_stock <= p.min_stock).length,
        totalValue: filteredProducts.reduce((sum, p) => sum + (p.current_stock * p.cost_price), 0)
    }

    const isLoading = productsLoading

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
                                    <span className="text-slate-900 font-medium">Produtos</span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                        <Package className="w-4 h-4 text-white" />
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                        Produtos
                                    </h1>
                                </div>
                                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                                    Gerencie seu catálogo de produtos e materiais
                                </p>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                {/* Status Badge */}
                                <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-lg shadow-emerald-500/25 text-xs">
                                    <Activity className="w-3 h-3 mr-1" />
                                    <span className="hidden sm:inline">{filteredStats.total} produtos</span>
                                    <span className="sm:hidden">{filteredStats.total}</span>
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

                                {/* Controles de Visualização */}
                                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                                    <button
                                        onClick={() => setViewMode('table')}
                                        className={`p-1 rounded-md transition-colors ${
                                            viewMode === 'table' ? 'bg-white shadow-sm' : 'hover:bg-slate-200'
                                        }`}
                                    >
                                        <List className="w-4 h-4 text-slate-600" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-1 rounded-md transition-colors ${
                                            viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-slate-200'
                                        }`}
                                    >
                                        <Grid3X3 className="w-4 h-4 text-slate-600" />
                                    </button>
                                </div>

                                {/* Botão Principal */}
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
                                            <p className="text-2xl font-bold text-slate-900">{filteredStats.total}</p>
                                        </div>
                                        <Package className="w-8 h-8 text-blue-500" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-0 shadow-lg">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-600">Ativos</p>
                                            <p className="text-2xl font-bold text-green-600">{filteredStats.active}</p>
                                        </div>
                                        <Activity className="w-8 h-8 text-green-500" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-0 shadow-lg">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-600">Estoque Baixo</p>
                                            <p className="text-2xl font-bold text-orange-600">{filteredStats.lowStock}</p>
                                        </div>
                                        <AlertTriangle className="w-8 h-8 text-orange-500" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-0 shadow-lg">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-600">Valor Total</p>
                                            <p className="text-lg font-bold text-purple-600">
                                                R$ {filteredStats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        <DollarSign className="w-8 h-8 text-purple-500" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Filtros e Busca */}
                        <Card className="border-0 shadow-xl shadow-slate-200/60 overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Search className="w-5 h-5 text-blue-500" />
                                    Filtros e Busca
                                </CardTitle>
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
                                                <TabsTrigger value="expired" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Vencidos</TabsTrigger>
                                            </TabsList>
                                        </Tabs>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Lista/Grid de Produtos */}
                        <Card className="border-0 shadow-xl shadow-slate-200/60 overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                    <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                                        <Package className="w-5 h-5 text-blue-500" />
                                        Produtos ({filteredProducts.length})
                                        {isLoading && <RefreshCw className="w-4 h-4 animate-spin ml-2 text-blue-500" />}
                                    </CardTitle>

                                    {/* Controles de Ordenação */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-slate-600">Ordenar por:</span>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="sm" className="gap-2">
                                                    {sortBy === 'name' && 'Nome'}
                                                    {sortBy === 'category' && 'Categoria'}
                                                    {sortBy === 'current_stock' && 'Estoque'}
                                                    {sortBy === 'cost_price' && 'Preço'}
                                                    {sortBy === 'expiry_date' && 'Validade'}
                                                    {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onClick={() => handleSort('name')}>
                                                    Nome
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleSort('category')}>
                                                    Categoria
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleSort('current_stock')}>
                                                    Estoque
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleSort('cost_price')}>
                                                    Preço
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleSort('expiry_date')}>
                                                    Validade
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
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
                                ) : viewMode === 'table' ? (
                                    // Visualização em Tabela
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
                                                                    <DropdownMenuItem asChild>
                                                                        <Link href={`/estoque/produtos/${product.id}`} className="cursor-pointer">
                                                                            <Eye className="mr-2 h-4 w-4" />
                                                                            Ver Detalhes
                                                                        </Link>
                                                                    </DropdownMenuItem>
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
                                                                        <Archive className="mr-2 h-4 w-4" />
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
                                ) : (
                                    // Visualização em Grid
                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {filteredProducts.map((product) => (
                                            <Card key={product.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                                <CardContent className="p-4">
                                                    <div className="space-y-3">
                                                        {/* Header do Card */}
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="font-semibold text-slate-900 truncate">{product.name}</h3>
                                                                {product.sku && (
                                                                    <p className="text-xs text-slate-500">SKU: {product.sku}</p>
                                                                )}
                                                            </div>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem asChild>
                                                                        <Link href={`/estoque/produtos/${product.id}`}>
                                                                            <Eye className="mr-2 h-4 w-4" />
                                                                            Ver Detalhes
                                                                        </Link>
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setSelectedProduct(product)
                                                                            setIsProductModalOpen(true)
                                                                        }}
                                                                    >
                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                        Editar
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>

                                                        {/* Categoria e Status */}
                                                        <div className="flex items-center justify-between">
                                                            {product.category ? (
                                                                <Badge variant="outline" className="text-xs">
                                                                    {product.category}
                                                                </Badge>
                                                            ) : (
                                                                <div />
                                                            )}
                                                            {getStatusBadge(product)}
                                                        </div>

                                                        {/* Estoque */}
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm text-slate-600">Estoque:</span>
                                                                <span className="font-medium text-slate-900">
                                                                    {product.current_stock} {product.unit}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-xs text-slate-500">Mínimo:</span>
                                                                <span className="text-xs text-slate-500">
                                                                    {product.min_stock} {product.unit}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Preço */}
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm text-slate-600">Custo:</span>
                                                                <span className="font-medium text-slate-900">
                                                                    R$ {product.cost_price.toFixed(2)}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-xs text-slate-500">Valor total:</span>
                                                                <span className="text-xs font-medium text-slate-600">
                                                                    R$ {(product.current_stock * product.cost_price).toFixed(2)}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Validade */}
                                                        {product.expiry_date && (
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs text-slate-500">Validade:</span>
                                                                <div className="text-right">
                                                                    <p className="text-xs text-slate-600">
                                                                        {format(new Date(product.expiry_date), 'dd/MM/yyyy')}
                                                                    </p>
                                                                    {getExpiryBadge(product)}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Ações Rápidas */}
                                                        <div className="flex items-center gap-1 pt-2 border-t border-slate-100">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleQuickMovement(product, 'in')}
                                                                className="flex-1 h-8 text-xs"
                                                            >
                                                                <ArrowUp className="w-3 h-3 mr-1 text-green-600" />
                                                                Entrada
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleQuickMovement(product, 'out')}
                                                                className="flex-1 h-8 text-xs"
                                                            >
                                                                <ArrowDown className="w-3 h-3 mr-1 text-blue-600" />
                                                                Saída
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Ações em Lote */}
                        {filteredProducts.length > 0 && (
                            <Card className="border-0 shadow-xl shadow-slate-200/60">
                                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Zap className="w-5 h-5 text-purple-500" />
                                        Ações em Lote
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 lg:p-6">
                                    <div className="flex flex-wrap gap-3">
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
                                            Verificar Estoque Baixo ({filteredStats.lowStock})
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="bg-white border-slate-200 hover:bg-slate-50"
                                            onClick={() => {
                                                // Lógica para verificar validade
                                                const expiring = filteredProducts.filter(p => {
                                                    if (!p.expiry_date) return false
                                                    const expiryDate = new Date(p.expiry_date)
                                                    const thirtyDaysFromNow = addDays(new Date(), 30)
                                                    return isBefore(expiryDate, thirtyDaysFromNow)
                                                }).length
                                                toast.info(`${expiring} produtos vencendo em 30 dias`)
                                            }}
                                        >
                                            <Calendar className="w-4 h-4 mr-2" />
                                            Verificar Validade
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

export default ProdutosPage