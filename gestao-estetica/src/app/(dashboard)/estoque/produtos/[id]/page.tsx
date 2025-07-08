// app/estoque/produtos/[id]/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Package,
    ArrowLeft,
    Edit,
    Trash2,
    AlertTriangle,
    Calendar,
    DollarSign,
    TrendingUp,
    TrendingDown,
    ArrowUp,
    ArrowDown,
    RotateCcw,
    RefreshCw,
    Activity,
    Archive,
    BarChart3,
    History,
    Plus,
    Minus,
    PackageX,
    Info,
    Hash,
    Tag,
    Ruler,
    FileText,
    ShoppingCart
} from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { format, isBefore, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { Sidebar } from '@/components/layout/sidebar'
import { useStock } from '@/lib/hooks/useStock'
import ProductModal from '@/components/stock/ProductModal'
import StockMovementModal from '@/components/stock/StockMovementModal'
import type { Database } from '@/lib/database/supabase/types'

type Product = Database['public']['Tables']['products']['Row']
type StockMovementType = Database['public']['Enums']['stock_movement_enum']

const ProductDetailsPage: React.FC = () => {
    const params = useParams()
    const router = useRouter()
    const productId = params.id as string

    const [isProductModalOpen, setIsProductModalOpen] = useState(false)
    const [isMovementModalOpen, setIsMovementModalOpen] = useState(false)
    const [selectedMovementType, setSelectedMovementType] = useState<StockMovementType>('in')
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    // Hook de estoque
    const {
        products,
        productsLoading,
        stockMovements,
        stockMovementsLoading,
        fetchStockMovements,
        updateProduct,
        deleteProduct,
        toggleProductStatus,
        createStockMovement,
        categories,
        refreshAll
    } = useStock()

    // Encontrar o produto atual
    const currentProduct = products.find(p => p.id === productId)

    // Movimentações do produto atual
    const productMovements = stockMovements.filter(m => m.product_id === productId)

    // Carregar movimentações específicas do produto
    useEffect(() => {
        if (productId) {
            fetchStockMovements({ filters: { productId } })
        }
    }, [productId, fetchStockMovements])

    // Redirect se produto não encontrado
    useEffect(() => {
        if (!productsLoading && !currentProduct) {
            toast.error('Produto não encontrado')
            router.push('/estoque/produtos')
        }
    }, [currentProduct, productsLoading, router])

    // Funções de manipulação
    const handleSaveProduct = async (data: any) => {
        if (!currentProduct) return

        try {
            await updateProduct(currentProduct.id, data)
            toast.success('Produto atualizado com sucesso!')
            setIsProductModalOpen(false)
        } catch (error) {
            toast.error('Erro ao salvar produto')
        }
    }

    const handleDeleteProduct = async () => {
        if (!currentProduct) return

        try {
            await deleteProduct(currentProduct.id)
            toast.success('Produto excluído com sucesso!')
            router.push('/estoque/produtos')
        } catch (error) {
            toast.error('Erro ao excluir produto')
        }
    }

    const handleToggleProductStatus = async () => {
        if (!currentProduct) return

        try {
            await toggleProductStatus(currentProduct.id)
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
            // Recarregar movimentações
            fetchStockMovements({ filters: { productId } })
        } catch (error) {
            toast.error('Erro ao registrar movimentação')
        }
    }

    const handleQuickMovement = async (type: StockMovementType) => {
        setSelectedMovementType(type)
        setIsMovementModalOpen(true)
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

    // Cálculos estatísticos
    const stockStats = currentProduct ? {
        totalValue: currentProduct.current_stock * currentProduct.cost_price,
        totalIn: productMovements.filter(m => m.movement_type === 'in').reduce((sum, m) => sum + m.quantity, 0),
        totalOut: productMovements.filter(m => ['out', 'expired', 'loss'].includes(m.movement_type)).reduce((sum, m) => sum + m.quantity, 0),
        lastMovement: productMovements.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    } : null

    const isLoading = productsLoading || stockMovementsLoading

    if (isLoading && !currentProduct) {
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

    if (!currentProduct) {
        return null // Redirect será chamado pelo useEffect
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
                                    <span>/</span>
                                    <Link href="/estoque/produtos" className="hover:text-slate-700 transition-colors">
                                        Produtos
                                    </Link>
                                    <span>/</span>
                                    <span className="text-slate-900 font-medium truncate max-w-[200px]">
                                        {currentProduct.name}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Link href="/estoque/produtos">
                                        <Button variant="ghost" size="sm" className="p-2">
                                            <ArrowLeft className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                        <Package className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                            {currentProduct.name}
                                        </h1>
                                        <p className="text-slate-600 text-xs sm:text-sm font-medium">
                                            {currentProduct.sku ? `SKU: ${currentProduct.sku}` : 'Detalhes do produto'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                {/* Status Badge */}
                                {getStatusBadge(currentProduct)}

                                {/* Botões de Ação */}
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <button
                                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                                        onClick={() => refreshAll()}
                                        disabled={isLoading}
                                    >
                                        <RefreshCw className={`w-4 h-4 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>

                                {/* Botões Principais */}
                                <div className="flex items-center gap-2 ml-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsProductModalOpen(true)}
                                        className="bg-white border-slate-200 hover:bg-slate-50 shadow-sm"
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Editar
                                    </Button>
                                    <Button
                                        onClick={() => handleQuickMovement('in')}
                                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25 border-0"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Movimentação
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Conteúdo */}
                <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">

                        {/* Informações Gerais do Produto */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Informações Básicas */}
                            <Card className="lg:col-span-2 border-0 shadow-xl shadow-slate-200/60">
                                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                    <CardTitle className="flex items-center gap-2">
                                        <Info className="w-5 h-5 text-blue-500" />
                                        Informações do Produto
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                                    <Package className="w-4 h-4" />
                                                    Nome
                                                </label>
                                                <p className="text-lg font-semibold text-slate-900 mt-1">
                                                    {currentProduct.name}
                                                </p>
                                            </div>

                                            {currentProduct.sku && (
                                                <div>
                                                    <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                                        <Hash className="w-4 h-4" />
                                                        SKU/Código
                                                    </label>
                                                    <p className="text-lg font-semibold text-slate-900 mt-1">
                                                        {currentProduct.sku}
                                                    </p>
                                                </div>
                                            )}

                                            {currentProduct.category && (
                                                <div>
                                                    <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                                        <Tag className="w-4 h-4" />
                                                        Categoria
                                                    </label>
                                                    <Badge variant="outline" className="mt-1">
                                                        {currentProduct.category}
                                                    </Badge>
                                                </div>
                                            )}

                                            <div>
                                                <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                                    <Ruler className="w-4 h-4" />
                                                    Unidade
                                                </label>
                                                <p className="text-lg font-semibold text-slate-900 mt-1">
                                                    {currentProduct.unit}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                                    <DollarSign className="w-4 h-4" />
                                                    Preço de Custo
                                                </label>
                                                <p className="text-lg font-semibold text-slate-900 mt-1">
                                                    R$ {currentProduct.cost_price.toFixed(2)}
                                                </p>
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                                    <Activity className="w-4 h-4" />
                                                    Status
                                                </label>
                                                <div className="mt-1">
                                                    {getStatusBadge(currentProduct)}
                                                </div>
                                            </div>

                                            {currentProduct.expiry_date && (
                                                <div>
                                                    <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                                        <Calendar className="w-4 h-4" />
                                                        Validade
                                                    </label>
                                                    <div className="mt-1 space-y-1">
                                                        <p className="text-lg font-semibold text-slate-900">
                                                            {format(new Date(currentProduct.expiry_date), 'dd/MM/yyyy', { locale: ptBR })}
                                                        </p>
                                                        {getExpiryBadge(currentProduct)}
                                                    </div>
                                                </div>
                                            )}

                                            <div>
                                                <label className="text-sm font-medium text-slate-600">
                                                    Criado em
                                                </label>
                                                <p className="text-sm text-slate-500 mt-1">
                                                    {format(new Date(currentProduct.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {currentProduct.description && (
                                        <div className="mt-6 pt-6 border-t border-slate-200">
                                            <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                                <FileText className="w-4 h-4" />
                                                Descrição
                                            </label>
                                            <p className="text-slate-700 mt-2 leading-relaxed">
                                                {currentProduct.description}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Estoque e Estatísticas */}
                            <div className="space-y-6">
                                {/* Card de Estoque */}
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                                        <CardTitle className="flex items-center gap-2 text-green-800">
                                            <ShoppingCart className="w-5 h-5 text-green-600" />
                                            Estoque Atual
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="space-y-4">
                                            <div className="text-center">
                                                <p className="text-3xl font-bold text-slate-900">
                                                    {currentProduct.current_stock}
                                                </p>
                                                <p className="text-sm text-slate-600 mt-1">
                                                    {currentProduct.unit}
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-slate-600">Estoque Mínimo:</span>
                                                    <span className="font-medium text-slate-900">
                                                        {currentProduct.min_stock} {currentProduct.unit}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-slate-600">Valor Total:</span>
                                                    <span className="font-bold text-green-600">
                                                        R$ {stockStats?.totalValue.toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Barra de Progresso do Estoque */}
                                            <div className="mt-4">
                                                <div className="flex justify-between text-xs text-slate-500 mb-1">
                                                    <span>0</span>
                                                    <span>Mín: {currentProduct.min_stock}</span>
                                                </div>
                                                <div className="w-full bg-slate-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full transition-all ${
                                                            currentProduct.current_stock === 0 ? 'bg-red-500' :
                                                                currentProduct.current_stock <= currentProduct.min_stock ? 'bg-orange-500' :
                                                                    'bg-green-500'
                                                        }`}
                                                        style={{
                                                            width: `${Math.min(100, (currentProduct.current_stock / (currentProduct.min_stock * 2)) * 100)}%`
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Ações Rápidas */}
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100">
                                        <CardTitle className="flex items-center gap-2 text-blue-800">
                                            <Activity className="w-5 h-5 text-blue-600" />
                                            Ações Rápidas
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button
                                                variant="outline"
                                                className="bg-green-50 border-green-200 hover:bg-green-100 text-green-700"
                                                onClick={() => handleQuickMovement('in')}
                                            >
                                                <ArrowUp className="w-4 h-4 mr-2" />
                                                Entrada
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700"
                                                onClick={() => handleQuickMovement('out')}
                                            >
                                                <ArrowDown className="w-4 h-4 mr-2" />
                                                Saída
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="bg-orange-50 border-orange-200 hover:bg-orange-100 text-orange-700"
                                                onClick={() => handleQuickMovement('adjustment')}
                                            >
                                                <RotateCcw className="w-4 h-4 mr-2" />
                                                Ajuste
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="bg-red-50 border-red-200 hover:bg-red-100 text-red-700"
                                                onClick={() => handleQuickMovement('expired')}
                                            >
                                                <AlertTriangle className="w-4 h-4 mr-2" />
                                                Vencido
                                            </Button>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
                                            <Button
                                                variant="outline"
                                                className="w-full"
                                                onClick={() => handleToggleProductStatus()}
                                            >
                                                <Archive className="w-4 h-4 mr-2" />
                                                {currentProduct.is_active ? 'Desativar' : 'Ativar'} Produto
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                className="w-full"
                                                onClick={() => setShowDeleteConfirm(true)}
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Excluir Produto
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Estatísticas */}
                                {stockStats && (
                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
                                            <CardTitle className="flex items-center gap-2 text-purple-800">
                                                <BarChart3 className="w-5 h-5 text-purple-600" />
                                                Estatísticas
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-slate-600 flex items-center gap-2">
                                                        <TrendingUp className="w-4 h-4 text-green-500" />
                                                        Total Entradas:
                                                    </span>
                                                    <span className="font-medium text-green-600">
                                                        {stockStats.totalIn} {currentProduct.unit}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-slate-600 flex items-center gap-2">
                                                        <TrendingDown className="w-4 h-4 text-red-500" />
                                                        Total Saídas:
                                                    </span>
                                                    <span className="font-medium text-red-600">
                                                        {stockStats.totalOut} {currentProduct.unit}
                                                    </span>
                                                </div>
                                                {stockStats.lastMovement && (
                                                    <div className="pt-3 border-t border-slate-200">
                                                        <span className="text-xs text-slate-500">Última movimentação:</span>
                                                        <p className="text-sm font-medium text-slate-700 mt-1">
                                                            {getMovementTypeLabel(stockStats.lastMovement.movement_type)} - {' '}
                                                            {format(new Date(stockStats.lastMovement.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>

                        {/* Histórico de Movimentações */}
                        <Card className="border-0 shadow-xl shadow-slate-200/60 overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                    <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                                        <History className="w-5 h-5 text-blue-500" />
                                        Histórico de Movimentações ({productMovements.length})
                                        {stockMovementsLoading && <RefreshCw className="w-4 h-4 animate-spin ml-2 text-blue-500" />}
                                    </CardTitle>
                                    <Link href={`/estoque/movimentacoes?productId=${productId}`}>
                                        <Button variant="outline" size="sm">
                                            Ver Todas
                                        </Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {productMovements.length === 0 ? (
                                    <div className="text-center py-12 px-6">
                                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <History className="w-8 h-8 text-white" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                            Nenhuma movimentação encontrada
                                        </h3>
                                        <p className="text-slate-500 mb-6 max-w-md mx-auto">
                                            Este produto ainda não possui movimentações registradas.
                                        </p>
                                        <Button
                                            onClick={() => handleQuickMovement('in')}
                                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25 border-0"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Primeira Movimentação
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-slate-50/50 hover:bg-slate-50">
                                                    <TableHead className="font-semibold text-slate-700">Tipo</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Quantidade</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Custo Unitário</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Data</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Observações</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Referência</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {productMovements
                                                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                                    .slice(0, 10)
                                                    .map((movement) => (
                                                        <TableRow key={movement.id} className="hover:bg-slate-50/50 transition-colors">
                                                            <TableCell className="py-4">
                                                                <div className="flex items-center gap-2">
                                                                    {getMovementTypeIcon(movement.movement_type)}
                                                                    <span className="font-medium">
                                                                    {getMovementTypeLabel(movement.movement_type)}
                                                                </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-4">
                                                            <span className="font-medium text-slate-900">
                                                                {movement.movement_type === 'adjustment' ? '' :
                                                                    ['out', 'expired', 'loss'].includes(movement.movement_type) ? '-' : '+'
                                                                }
                                                                {movement.quantity} {currentProduct.unit}
                                                            </span>
                                                            </TableCell>
                                                            <TableCell className="py-4">
                                                                {movement.unit_cost ? (
                                                                    <span className="text-slate-900">
                                                                    R$ {movement.unit_cost.toFixed(2)}
                                                                </span>
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
                                                        </TableRow>
                                                    ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>

            {/* Modal de Produto */}
            {isProductModalOpen && (
                <ProductModal
                    isOpen={isProductModalOpen}
                    onClose={() => setIsProductModalOpen(false)}
                    product={currentProduct}
                    categories={categories}
                    onSave={handleSaveProduct}
                    onDelete={() => handleDeleteProduct()}
                />
            )}

            {/* Modal de Movimentação */}
            {isMovementModalOpen && (
                <StockMovementModal
                    isOpen={isMovementModalOpen}
                    onClose={() => setIsMovementModalOpen(false)}
                    products={[currentProduct]}
                    selectedProduct={currentProduct}
                    defaultMovementType={selectedMovementType}
                    onSave={handleSaveMovement}
                />
            )}

            {/* Confirmação de Exclusão */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="max-w-md mx-4">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-600">
                                <AlertTriangle className="w-5 h-5" />
                                Confirmar Exclusão
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-600 mb-4">
                                Tem certeza que deseja excluir o produto <strong>{currentProduct.name}</strong>?
                            </p>
                            <p className="text-sm text-red-600 mb-6">
                                Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowDeleteConfirm(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="flex-1"
                                    onClick={() => {
                                        handleDeleteProduct()
                                        setShowDeleteConfirm(false)
                                    }}
                                >
                                    Excluir
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}

export default ProductDetailsPage