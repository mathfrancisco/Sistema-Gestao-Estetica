// components/stock/ProductModal.tsx
'use client'

import React, { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
    Package,
    Trash2,
    AlertTriangle,
    Calendar,
    DollarSign,
    Hash,
    Tag,
    FileText,
    Ruler,
    ShoppingCart,
    Settings,
    Save,
    X
} from 'lucide-react'
import { toast } from 'sonner'
import type { Database } from '@/lib/database/supabase/types'

type Product = Database['public']['Tables']['products']['Row']
type ProductInsert = Database['public']['Tables']['products']['Insert']

interface ProductModalProps {
    isOpen: boolean
    onClose: () => void
    product?: Product | null
    categories: string[]
    onSave: (data: ProductInsert) => Promise<void>
    onDelete?: () => Promise<void>
}

const ProductModal: React.FC<ProductModalProps> = ({
                                                       isOpen,
                                                       onClose,
                                                       product,
                                                       categories,
                                                       onSave,
                                                       onDelete
                                                   }) => {
    const [formData, setFormData] = useState<{
        name: string
        description: string
        sku: string
        category: string
        unit: string
        cost_price: number
        current_stock: number
        min_stock: number
        expiry_date: string
        is_active: boolean
    }>({
        name: '',
        description: '',
        sku: '',
        category: '',
        unit: '',
        cost_price: 0,
        current_stock: 0,
        min_stock: 0,
        expiry_date: '',
        is_active: true
    })

    const [loading, setLoading] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    // Popular dados quando produto for fornecido
    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || '',
                description: product.description || '',
                sku: product.sku || '',
                category: product.category || '',
                unit: product.unit || '',
                cost_price: product.cost_price || 0,
                current_stock: product.current_stock || 0,
                min_stock: product.min_stock || 0,
                expiry_date: product.expiry_date || '',
                is_active: product.is_active ?? true
            })
        } else {
            // Reset form for new product
            setFormData({
                name: '',
                description: '',
                sku: '',
                category: '',
                unit: 'un',
                cost_price: 0,
                current_stock: 0,
                min_stock: 0,
                expiry_date: '',
                is_active: true
            })
        }
    }, [product])

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name.trim()) {
            toast.error('Nome do produto é obrigatório')
            return
        }

        if (!formData.unit.trim()) {
            toast.error('Unidade é obrigatória')
            return
        }

        if (formData.cost_price < 0) {
            toast.error('Preço de custo não pode ser negativo')
            return
        }

        if (formData.current_stock < 0) {
            toast.error('Estoque atual não pode ser negativo')
            return
        }

        if (formData.min_stock < 0) {
            toast.error('Estoque mínimo não pode ser negativo')
            return
        }

        try {
            setLoading(true)
            await onSave(formData)
            onClose()
        } catch (error) {
            console.error('Erro ao salvar produto:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!onDelete) return

        try {
            setLoading(true)
            await onDelete()
            onClose()
            setShowDeleteConfirm(false)
        } catch (error) {
            console.error('Erro ao deletar produto:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStockStatusBadge = () => {
        if (formData.current_stock === 0) {
            return <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" />Sem Estoque</Badge>
        }
        if (formData.current_stock <= formData.min_stock) {
            return <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" />Estoque Baixo</Badge>
        }
        return <Badge variant="default" className="gap-1 bg-green-100 text-green-700 border-green-200">Estoque OK</Badge>
    }

    const isExpiringSoon = () => {
        if (!formData.expiry_date) return false
        const expiryDate = new Date(formData.expiry_date)
        const today = new Date()
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        return daysUntilExpiry <= 30 && daysUntilExpiry >= 0
    }

    const isExpired = () => {
        if (!formData.expiry_date) return false
        const expiryDate = new Date(formData.expiry_date)
        const today = new Date()
        return expiryDate < today
    }

    const getExpiryBadge = () => {
        if (!formData.expiry_date) return null

        if (isExpired()) {
            return <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" />Vencido</Badge>
        }

        if (isExpiringSoon()) {
            return <Badge variant="destructive" className="gap-1 bg-orange-100 text-orange-700 border-orange-200"><Calendar className="w-3 h-3" />Vence em Breve</Badge>
        }

        return <Badge variant="default" className="gap-1 bg-green-100 text-green-700 border-green-200"><Calendar className="w-3 h-3" />Válido</Badge>
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="border-b border-slate-200 pb-4">
                    <DialogTitle className="flex items-center gap-3 text-xl">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Package className="w-4 h-4 text-white" />
                        </div>
                        {product ? 'Editar Produto' : 'Novo Produto'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Informações Básicas */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 border-l-4 border-blue-500 pl-3">
                            <FileText className="w-4 h-4" />
                            Informações Básicas
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-medium">Nome do Produto *</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Ex: Creme Hidratante"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className="border-slate-200 focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="sku" className="text-sm font-medium">SKU/Código</Label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <Input
                                        id="sku"
                                        type="text"
                                        placeholder="Ex: CR001"
                                        value={formData.sku}
                                        onChange={(e) => handleInputChange('sku', e.target.value)}
                                        className="pl-10 border-slate-200 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm font-medium">Descrição</Label>
                            <Textarea
                                id="description"
                                placeholder="Descrição detalhada do produto..."
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                className="border-slate-200 focus:border-blue-500 min-h-[80px]"
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="category" className="text-sm font-medium">Categoria</Label>
                                <div className="relative">
                                    <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                                        <SelectTrigger className="pl-10 border-slate-200 focus:border-blue-500">
                                            <SelectValue placeholder="Selecione uma categoria" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem key={category} value={category}>
                                                    {category}
                                                </SelectItem>
                                            ))}
                                            <SelectItem value="Cosméticos">Cosméticos</SelectItem>
                                            <SelectItem value="Equipamentos">Equipamentos</SelectItem>
                                            <SelectItem value="Materiais">Materiais</SelectItem>
                                            <SelectItem value="Descartáveis">Descartáveis</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="unit" className="text-sm font-medium">Unidade *</Label>
                                <div className="relative">
                                    <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <Select value={formData.unit} onValueChange={(value) => handleInputChange('unit', value)}>
                                        <SelectTrigger className="pl-10 border-slate-200 focus:border-blue-500">
                                            <SelectValue placeholder="Selecione a unidade" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="un">Unidade</SelectItem>
                                            <SelectItem value="ml">Mililitros</SelectItem>
                                            <SelectItem value="g">Gramas</SelectItem>
                                            <SelectItem value="kg">Quilogramas</SelectItem>
                                            <SelectItem value="l">Litros</SelectItem>
                                            <SelectItem value="pct">Pacote</SelectItem>
                                            <SelectItem value="cx">Caixa</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preço e Estoque */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 border-l-4 border-green-500 pl-3">
                            <ShoppingCart className="w-4 h-4" />
                            Preço e Estoque
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="cost_price" className="text-sm font-medium">Preço de Custo *</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <Input
                                        id="cost_price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0,00"
                                        value={formData.cost_price}
                                        onChange={(e) => handleInputChange('cost_price', parseFloat(e.target.value) || 0)}
                                        className="pl-10 border-slate-200 focus:border-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="current_stock" className="text-sm font-medium">Estoque Atual</Label>
                                <Input
                                    id="current_stock"
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={formData.current_stock}
                                    onChange={(e) => handleInputChange('current_stock', parseInt(e.target.value) || 0)}
                                    className="border-slate-200 focus:border-blue-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="min_stock" className="text-sm font-medium">Estoque Mínimo</Label>
                                <Input
                                    id="min_stock"
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={formData.min_stock}
                                    onChange={(e) => handleInputChange('min_stock', parseInt(e.target.value) || 0)}
                                    className="border-slate-200 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Status do Estoque */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-700">Status do Estoque:</span>
                            {getStockStatusBadge()}
                        </div>
                    </div>

                    {/* Validade */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 border-l-4 border-orange-500 pl-3">
                            <Calendar className="w-4 h-4" />
                            Controle de Validade
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="expiry_date" className="text-sm font-medium">Data de Validade</Label>
                                <Input
                                    id="expiry_date"
                                    type="date"
                                    value={formData.expiry_date}
                                    onChange={(e) => handleInputChange('expiry_date', e.target.value)}
                                    className="border-slate-200 focus:border-blue-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Status de Validade</Label>
                                <div className="flex items-center h-10">
                                    {getExpiryBadge() || (
                                        <Badge variant="outline" className="gap-1">
                                            <Calendar className="w-3 h-3" />
                                            Sem data definida
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Configurações */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 border-l-4 border-purple-500 pl-3">
                            <Settings className="w-4 h-4" />
                            Configurações
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="space-y-1">
                                <Label htmlFor="is_active" className="text-sm font-medium">Produto Ativo</Label>
                                <p className="text-xs text-slate-500">
                                    {formData.is_active
                                        ? 'Produto disponível para uso nos procedimentos'
                                        : 'Produto inativo, não aparecerá nas listagens'
                                    }
                                </p>
                            </div>
                            <Switch
                                id="is_active"
                                checked={formData.is_active}
                                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                            />
                        </div>
                    </div>

                    {/* Cálculos Automáticos */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                        <h4 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Cálculos Automáticos
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-blue-600">Valor Total em Estoque:</span>
                                <p className="font-semibold text-blue-800">
                                    R$ {(formData.current_stock * formData.cost_price).toFixed(2)}
                                </p>
                            </div>
                            <div>
                                <span className="text-blue-600">Valor Estoque Mínimo:</span>
                                <p className="font-semibold text-blue-800">
                                    R$ {(formData.min_stock * formData.cost_price).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>
                </form>

                <DialogFooter className="border-t border-slate-200 pt-4 gap-2">
                    {product && onDelete && (
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="mr-auto"
                            disabled={loading}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                        </Button>
                    )}

                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                    >
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                    </Button>

                    <Button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? 'Salvando...' : 'Salvar'}
                    </Button>
                </DialogFooter>

                {/* Confirmação de Exclusão */}
                <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-red-600">
                                <AlertTriangle className="w-5 h-5" />
                                Confirmar Exclusão
                            </DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <p className="text-slate-600">
                                Tem certeza que deseja excluir o produto <strong>{formData.name}</strong>?
                            </p>
                            <p className="text-sm text-red-600 mt-2">
                                Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
                            </p>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={loading}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={loading}
                            >
                                {loading ? 'Excluindo...' : 'Excluir'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </DialogContent>
        </Dialog>
    )
}

export default ProductModal