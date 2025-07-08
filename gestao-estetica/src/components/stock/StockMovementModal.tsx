// components/stock/StockMovementModal.tsx
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
import { Badge } from '@/components/ui/badge'
import {
    ArrowUp,
    ArrowDown,
    RefreshCw,
    AlertTriangle,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Minus,
    RotateCcw,
    Save,
    X,
    Info
} from 'lucide-react'
import { toast } from 'sonner'
import type { Database } from '@/lib/database/supabase/types'

type Product = Database['public']['Tables']['products']['Row']
type StockMovementType = Database['public']['Enums']['stock_movement_enum']
type StockMovementInsert = Database['public']['Tables']['stock_movements']['Insert']

interface StockMovementModalProps {
    isOpen: boolean
    onClose: () => void
    products: Product[]
    selectedProduct?: Product | null
    onSave: (data: Omit<StockMovementInsert, 'user_id'>) => Promise<void>
    defaultMovementType?: StockMovementType
}

const StockMovementModal: React.FC<StockMovementModalProps> = ({
                                                                   isOpen,
                                                                   onClose,
                                                                   products,
                                                                   selectedProduct,
                                                                   onSave,
                                                                   defaultMovementType = 'in'
                                                               }) => {
    const [formData, setFormData] = useState<{
        product_id: string
        movement_type: StockMovementType
        quantity: number
        unit_cost: number | null
        notes: string
        reference_id: string
        reference_type: string
    }>({
        product_id: '',
        movement_type: defaultMovementType,
        quantity: 0,
        unit_cost: null,
        notes: '',
        reference_id: '',
        reference_type: ''
    })

    const [loading, setLoading] = useState(false)
    const [selectedProductData, setSelectedProductData] = useState<Product | null>(null)

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setFormData({
                product_id: selectedProduct?.id || '',
                movement_type: defaultMovementType,
                quantity: 0,
                unit_cost: null,
                notes: '',
                reference_id: '',
                reference_type: ''
            })
            setSelectedProductData(selectedProduct || null)
        }
    }, [isOpen, selectedProduct, defaultMovementType])

    // Update selected product data when product_id changes
    useEffect(() => {
        if (formData.product_id) {
            const product = products.find(p => p.id === formData.product_id)
            setSelectedProductData(product || null)

            // Auto-fill unit cost for 'in' movements
            if (product && formData.movement_type === 'in' && !formData.unit_cost) {
                setFormData(prev => ({
                    ...prev,
                    unit_cost: product.cost_price
                }))
            }
        } else {
            setSelectedProductData(null)
        }
    }, [formData.product_id, products, formData.movement_type, formData.unit_cost])

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.product_id) {
            toast.error('Selecione um produto')
            return
        }

        if (!formData.movement_type) {
            toast.error('Selecione o tipo de movimentação')
            return
        }

        if (formData.quantity <= 0) {
            toast.error('Quantidade deve ser maior que zero')
            return
        }

        if (formData.unit_cost && formData.unit_cost < 0) {
            toast.error('Custo unitário não pode ser negativo')
            return
        }

        // Validate stock availability for outbound movements
        if (['out', 'expired', 'loss'].includes(formData.movement_type) && selectedProductData) {
            if (formData.quantity > selectedProductData.current_stock) {
                toast.error(`Estoque insuficiente. Disponível: ${selectedProductData.current_stock} ${selectedProductData.unit}`)
                return
            }
        }

        try {
            setLoading(true)
            await onSave(formData)
            onClose()
        } catch (error) {
            console.error('Erro ao salvar movimentação:', error)
        } finally {
            setLoading(false)
        }
    }

    const getMovementTypeConfig = (type: StockMovementType) => {
        const configs = {
            in: {
                label: 'Entrada',
                description: 'Adicionar produtos ao estoque',
                icon: ArrowUp,
                color: 'text-green-600',
                bgColor: 'bg-green-100',
                borderColor: 'border-green-200',
                showCost: true
            },
            out: {
                label: 'Saída',
                description: 'Retirar produtos do estoque',
                icon: ArrowDown,
                color: 'text-blue-600',
                bgColor: 'bg-blue-100',
                borderColor: 'border-blue-200',
                showCost: false
            },
            adjustment: {
                label: 'Ajuste',
                description: 'Corrigir quantidade em estoque',
                icon: RefreshCw,
                color: 'text-orange-600',
                bgColor: 'bg-orange-100',
                borderColor: 'border-orange-200',
                showCost: false
            },
            expired: {
                label: 'Vencido',
                description: 'Produtos que venceram',
                icon: AlertTriangle,
                color: 'text-red-600',
                bgColor: 'bg-red-100',
                borderColor: 'border-red-200',
                showCost: false
            },
            loss: {
                label: 'Perda',
                description: 'Produtos perdidos ou danificados',
                icon: Minus,
                color: 'text-red-600',
                bgColor: 'bg-red-100',
                borderColor: 'border-red-200',
                showCost: false
            }
        }
        return configs[type]
    }

    const currentConfig = getMovementTypeConfig(formData.movement_type)

    const calculateNewStock = () => {
        if (!selectedProductData) return null

        let newStock = selectedProductData.current_stock

        switch (formData.movement_type) {
            case 'in':
                newStock += formData.quantity
                break
            case 'out':
            case 'expired':
            case 'loss':
                newStock -= formData.quantity
                break
            case 'adjustment':
                newStock = formData.quantity // Para ajustes, a quantidade é absoluta
                break
        }

        return Math.max(0, newStock)
    }

    const getStockPreview = () => {
        if (!selectedProductData) return null

        const newStock = calculateNewStock()
        if (newStock === null) return null

        const isIncrease = newStock > selectedProductData.current_stock
        const isDecrease = newStock < selectedProductData.current_stock

        return (
            <div className={`p-4 rounded-lg border ${currentConfig.bgColor} ${currentConfig.borderColor}`}>
                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Prévia do Estoque
                </h4>
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Estoque Atual:</span>
                        <span className="font-medium">{selectedProductData.current_stock} {selectedProductData.unit}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Movimentação:</span>
                        <span className={`font-medium flex items-center gap-1 ${
                            isIncrease ? 'text-green-600' : isDecrease ? 'text-red-600' : 'text-orange-600'
                        }`}>
                            {isIncrease && <TrendingUp className="w-3 h-3" />}
                            {isDecrease && <TrendingDown className="w-3 h-3" />}
                            {!isIncrease && !isDecrease && <RotateCcw className="w-3 h-3" />}
                            {formData.movement_type === 'adjustment'
                                ? `Ajustar para ${formData.quantity}`
                                : `${isIncrease ? '+' : '-'}${Math.abs(newStock - selectedProductData.current_stock)}`
                            } {selectedProductData.unit}
                        </span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
                        <span className="text-slate-700 font-medium">Novo Estoque:</span>
                        <span className={`font-bold ${
                            newStock === 0 ? 'text-red-600' :
                                newStock <= selectedProductData.min_stock ? 'text-orange-600' :
                                    'text-green-600'
                        }`}>
                            {newStock} {selectedProductData.unit}
                        </span>
                    </div>

                    {/* Alertas */}
                    {newStock === 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-2 mt-2">
                            <p className="text-xs text-red-600 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Produto ficará sem estoque
                            </p>
                        </div>
                    )}
                    {newStock > 0 && newStock <= selectedProductData.min_stock && (
                        <div className="bg-orange-50 border border-orange-200 rounded-md p-2 mt-2">
                            <p className="text-xs text-orange-600 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Estoque ficará abaixo do mínimo ({selectedProductData.min_stock} {selectedProductData.unit})
                            </p>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader className="border-b border-slate-200 pb-4">
                    <DialogTitle className="flex items-center gap-3 text-xl">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${currentConfig.bgColor} ${currentConfig.borderColor} border`}>
                            <currentConfig.icon className={`w-4 h-4 ${currentConfig.color}`} />
                        </div>
                        Nova Movimentação
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Tipo de Movimentação */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">Tipo de Movimentação *</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {(['in', 'out', 'adjustment', 'expired', 'loss'] as StockMovementType[]).map((type) => {
                                const config = getMovementTypeConfig(type)
                                const Icon = config.icon
                                const isSelected = formData.movement_type === type

                                return (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => handleInputChange('movement_type', type)}
                                        className={`p-3 text-left border rounded-lg transition-all ${
                                            isSelected
                                                ? `${config.bgColor} ${config.borderColor} border-2`
                                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <Icon className={`w-4 h-4 ${isSelected ? config.color : 'text-slate-500'}`} />
                                            <span className={`text-sm font-medium ${isSelected ? config.color : 'text-slate-700'}`}>
                                                {config.label}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500">{config.description}</p>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Produto */}
                    <div className="space-y-2">
                        <Label htmlFor="product_id" className="text-sm font-medium">Produto *</Label>
                        <Select value={formData.product_id} onValueChange={(value) => handleInputChange('product_id', value)}>
                            <SelectTrigger className="border-slate-200 focus:border-blue-500">
                                <SelectValue placeholder="Selecione um produto" />
                            </SelectTrigger>
                            <SelectContent>
                                {products.map((product) => (
                                    <SelectItem key={product.id} value={product.id}>
                                        <div className="flex items-center justify-between w-full">
                                            <span>{product.name}</span>
                                            <Badge variant="outline" className="ml-2 text-xs">
                                                {product.current_stock} {product.unit}
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Quantidade e Custo */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="quantity" className="text-sm font-medium">
                                {formData.movement_type === 'adjustment' ? 'Nova Quantidade *' : 'Quantidade *'}
                            </Label>
                            <Input
                                id="quantity"
                                type="number"
                                min="0"
                                step="1"
                                placeholder="0"
                                value={formData.quantity}
                                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                                className="border-slate-200 focus:border-blue-500"
                                required
                            />
                            {selectedProductData && (
                                <p className="text-xs text-slate-500">
                                    Unidade: {selectedProductData.unit}
                                </p>
                            )}
                        </div>

                        {currentConfig.showCost && (
                            <div className="space-y-2">
                                <Label htmlFor="unit_cost" className="text-sm font-medium">Custo Unitário</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <Input
                                        id="unit_cost"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0,00"
                                        value={formData.unit_cost || ''}
                                        onChange={(e) => handleInputChange('unit_cost', parseFloat(e.target.value) || null)}
                                        className="pl-10 border-slate-200 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Referência */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="reference_type" className="text-sm font-medium">Tipo de Referência</Label>
                            <Select value={formData.reference_type} onValueChange={(value) => handleInputChange('reference_type', value)}>
                                <SelectTrigger className="border-slate-200 focus:border-blue-500">
                                    <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="purchase">Compra</SelectItem>
                                    <SelectItem value="sale">Venda</SelectItem>
                                    <SelectItem value="procedure">Procedimento</SelectItem>
                                    <SelectItem value="adjustment">Ajuste</SelectItem>
                                    <SelectItem value="inventory">Inventário</SelectItem>
                                    <SelectItem value="other">Outro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reference_id" className="text-sm font-medium">ID de Referência</Label>
                            <Input
                                id="reference_id"
                                type="text"
                                placeholder="Ex: PED-001"
                                value={formData.reference_id}
                                onChange={(e) => handleInputChange('reference_id', e.target.value)}
                                className="border-slate-200 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Observações */}
                    <div className="space-y-2">
                        <Label htmlFor="notes" className="text-sm font-medium">Observações</Label>
                        <Textarea
                            id="notes"
                            placeholder="Observações sobre esta movimentação..."
                            value={formData.notes}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                            className="border-slate-200 focus:border-blue-500 min-h-[80px]"
                            rows={3}
                        />
                    </div>

                    {/* Prévia do Estoque */}
                    {selectedProductData && formData.quantity > 0 && getStockPreview()}

                    {/* Cálculo de Valores */}
                    {currentConfig.showCost && formData.unit_cost && formData.quantity > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                                <DollarSign className="w-4 h-4" />
                                Cálculo de Valores
                            </h4>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-blue-600">Custo Unitário:</span>
                                    <span className="font-medium text-blue-800">R$ {formData.unit_cost.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-blue-600">Quantidade:</span>
                                    <span className="font-medium text-blue-800">{formData.quantity} {selectedProductData?.unit}</span>
                                </div>
                                <div className="flex justify-between border-t border-blue-200 pt-1">
                                    <span className="text-blue-700 font-semibold">Valor Total:</span>
                                    <span className="font-bold text-blue-800">R$ {(formData.unit_cost * formData.quantity).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </form>

                <DialogFooter className="border-t border-slate-200 pt-4 gap-2">
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
                        {loading ? 'Salvando...' : 'Salvar Movimentação'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default StockMovementModal