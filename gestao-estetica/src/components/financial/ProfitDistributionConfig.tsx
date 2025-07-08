// components/financial/ProfitDistributionConfig.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    PieChart as PieChartIcon,
    Plus,
    Edit,
    Trash2,
    Settings,
    Calculator,
    TrendingUp,
    DollarSign,
    AlertTriangle,
    CheckCircle,
    Sparkles
} from 'lucide-react'
import type { ProfitDistributionConfig, ProfitCategory } from '@/lib/services/financial.service'

interface ProfitDistributionConfigProps {
    configs: ProfitDistributionConfig[]
    isLoading?: boolean
    onSave?: (config: Omit<ProfitDistributionConfig, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void
    onUpdate?: (id: string, config: Partial<ProfitDistributionConfig>) => void
    onDelete?: (id: string) => void
    className?: string
}

interface ConfigFormData {
    category: ProfitCategory
    percentage: number
    description: string
}

// Custom Alert Dialog Component (simplified version)
const AlertDialog = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>
}

const AlertDialogTrigger = ({ asChild, children }: { asChild?: boolean; children: React.ReactNode }) => {
    return <>{children}</>
}

const AlertDialogContent = ({
                                children,
                                onConfirm,
                                onCancel
                            }: {
    children: React.ReactNode
    onConfirm?: () => void
    onCancel?: () => void
}) => {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <div onClick={() => setIsOpen(true)}>{children}</div>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirmar Exclusão</DialogTitle>
                    <DialogDescription>
                        Tem certeza que deseja excluir esta configuração? Esta ação não pode ser desfeita.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={() => {
                            onConfirm?.()
                            setIsOpen(false)
                        }}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        Excluir
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export const ProfitDistributionConfig: React.FC<ProfitDistributionConfigProps> = ({
                                                                                      configs,
                                                                                      isLoading = false,
                                                                                      onSave,
                                                                                      onUpdate,
                                                                                      onDelete,
                                                                                      className = ""
                                                                                  }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingConfig, setEditingConfig] = useState<ProfitDistributionConfig | null>(null)
    const [formData, setFormData] = useState<ConfigFormData>({
        category: 'pro_labore',
        percentage: 0,
        description: ''
    })

    // Configuração padrão das categorias
    const categoryDefaults = {
        pro_labore: {
            label: 'Pró-labore (Salário)',
            description: 'Remuneração do proprietário',
            defaultPercentage: 60,
            icon: DollarSign,
            color: 'emerald'
        },
        equipment_reserve: {
            label: 'Reserva Equipamentos',
            description: 'Fundo para compra e manutenção de equipamentos',
            defaultPercentage: 20,
            icon: Settings,
            color: 'blue'
        },
        emergency_reserve: {
            label: 'Reserva Emergência',
            description: 'Fundo de emergência para imprevistos',
            defaultPercentage: 10,
            icon: AlertTriangle,
            color: 'orange'
        },
        investment: {
            label: 'Investimento/Marketing',
            description: 'Verba para crescimento e marketing',
            defaultPercentage: 10,
            icon: TrendingUp,
            color: 'purple'
        }
    }

    // Calcular percentual total usado
    const totalPercentage = configs.reduce((sum, config) => sum + config.percentage, 0)
    const remainingPercentage = 100 - totalPercentage

    // Resetar formulário
    const resetForm = () => {
        setFormData({
            category: 'pro_labore',
            percentage: 0,
            description: ''
        })
        setEditingConfig(null)
    }

    // Abrir dialog para edição
    const handleEdit = (config: ProfitDistributionConfig) => {
        setEditingConfig(config)
        setFormData({
            category: config.category,
            percentage: config.percentage,
            description: config.description || ''
        })
        setIsDialogOpen(true)
    }

    // Submeter formulário
    const handleSubmit = () => {
        if (formData.percentage <= 0 || formData.percentage > 100) {
            return
        }

        if (editingConfig) {
            onUpdate?.(editingConfig.id, {
                category: formData.category,
                percentage: formData.percentage,
                description: formData.description,
                is_active: true
            })
        } else {
            onSave?.({
                category: formData.category,
                percentage: formData.percentage,
                description: formData.description,
                is_active: true
            })
        }

        setIsDialogOpen(false)
        resetForm()
    }

    // Aplicar configuração padrão inteligente
    const applyDefaultConfig = () => {
        // Remover todas as configurações existentes primeiro
        configs.forEach(config => {
            onDelete?.(config.id)
        })

        // Aplicar configuração padrão
        Object.entries(categoryDefaults).forEach(([category, config]) => {
            onSave?.({
                category: category as ProfitCategory,
                percentage: config.defaultPercentage,
                description: config.description,
                is_active: true
            })
        })
    }

    // Verificar se uma categoria já está configurada
    const isCategoryUsed = (category: ProfitCategory) => {
        return configs.some(config => config.category === category && config.id !== editingConfig?.id)
    }

    // Obter categorias disponíveis
    const availableCategories = Object.keys(categoryDefaults).filter(
        category => !isCategoryUsed(category as ProfitCategory)
    ) as ProfitCategory[]

    if (isLoading) {
        return (
            <Card className={`border-0 shadow-xl shadow-slate-200/60 ${className}`}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5" />
                        Configuração de Distribuição
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(4)].map((_, index) => (
                            <div key={index} className="animate-pulse">
                                <div className="h-16 bg-slate-100 rounded-lg" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={`border-0 shadow-xl shadow-slate-200/60 ${className}`}>
            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <PieChartIcon className="w-5 h-5 text-blue-500" />
                            Configuração de Distribuição
                        </CardTitle>
                        <p className="text-sm text-slate-600 mt-1">
                            Configure como o lucro será distribuído automaticamente
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge
                            variant={totalPercentage === 100 ? "default" : totalPercentage > 100 ? "destructive" : "secondary"}
                            className="text-xs"
                        >
                            {totalPercentage}% configurado
                        </Badge>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={applyDefaultConfig}
                            className="bg-white border-slate-200 hover:bg-slate-50"
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Config. Padrão
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                {/* Status da Configuração */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">Percentual Total</span>
                        <span className={`text-sm font-bold ${
                            totalPercentage === 100 ? 'text-emerald-600' :
                                totalPercentage > 100 ? 'text-red-600' : 'text-orange-600'
                        }`}>
                            {totalPercentage}%
                        </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                                totalPercentage === 100 ? 'bg-emerald-500' :
                                    totalPercentage > 100 ? 'bg-red-500' : 'bg-orange-500'
                            }`}
                            style={{ width: `${Math.min(totalPercentage, 100)}%` }}
                        />
                    </div>
                    {totalPercentage !== 100 && (
                        <p className={`text-xs mt-1 ${
                            totalPercentage > 100 ? 'text-red-600' : 'text-orange-600'
                        }`}>
                            {totalPercentage > 100
                                ? `Excesso de ${totalPercentage - 100}% - ajuste necessário`
                                : `Restam ${remainingPercentage}% para configurar`
                            }
                        </p>
                    )}
                </div>

                {/* Lista de Configurações */}
                <div className="space-y-4 mb-6">
                    {configs.map((config) => {
                        const categoryInfo = categoryDefaults[config.category]
                        const Icon = categoryInfo.icon

                        return (
                            <div key={config.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-lg ${
                                        categoryInfo.color === 'emerald' ? 'bg-emerald-100' :
                                            categoryInfo.color === 'blue' ? 'bg-blue-100' :
                                                categoryInfo.color === 'orange' ? 'bg-orange-100' :
                                                    categoryInfo.color === 'purple' ? 'bg-purple-100' : 'bg-gray-100'
                                    }`}>
                                        <Icon className={`w-5 h-5 ${
                                            categoryInfo.color === 'emerald' ? 'text-emerald-600' :
                                                categoryInfo.color === 'blue' ? 'text-blue-600' :
                                                    categoryInfo.color === 'orange' ? 'text-orange-600' :
                                                        categoryInfo.color === 'purple' ? 'text-purple-600' : 'text-gray-600'
                                        }`} />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-slate-900">{categoryInfo.label}</h4>
                                        <p className="text-sm text-slate-600">
                                            {config.description || categoryInfo.description}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="text-sm font-semibold">
                                        {config.percentage}%
                                    </Badge>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEdit(config)}
                                            className="h-8 w-8 p-0"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <AlertDialogContent onConfirm={() => onDelete?.(config.id)}>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </AlertDialogContent>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Botão Adicionar */}
                {availableCategories.length > 0 && (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-0 shadow-lg"
                                onClick={resetForm}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar Categoria
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingConfig ? 'Editar' : 'Adicionar'} Configuração
                                </DialogTitle>
                                <DialogDescription>
                                    Configure como uma parte do lucro será distribuída.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="category">Categoria</Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(value) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                category: value as ProfitCategory,
                                                percentage: categoryDefaults[value as ProfitCategory].defaultPercentage,
                                                description: categoryDefaults[value as ProfitCategory].description
                                            }))
                                        }}
                                        disabled={!!editingConfig}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione uma categoria" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(editingConfig ? [editingConfig.category] : availableCategories).map((category) => (
                                                <SelectItem key={category} value={category}>
                                                    {categoryDefaults[category].label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="percentage">Percentual (%)</Label>
                                    <Input
                                        id="percentage"
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={formData.percentage}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            percentage: parseFloat(e.target.value) || 0
                                        }))}
                                        placeholder="Ex: 60"
                                    />
                                    {remainingPercentage < formData.percentage && !editingConfig && (
                                        <p className="text-xs text-red-600">
                                            Atenção: Restam apenas {remainingPercentage}% disponíveis
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Descrição (opcional)</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            description: e.target.value
                                        }))}
                                        placeholder="Descrição personalizada..."
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsDialogOpen(false)
                                        resetForm()
                                    }}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={formData.percentage <= 0 || formData.percentage > 100}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    {editingConfig ? 'Atualizar' : 'Adicionar'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}

                {/* Status Final */}
                {totalPercentage === 100 && (
                    <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                            <span className="text-sm font-medium text-emerald-700">
                                Configuração completa! O lucro será distribuído automaticamente.
                            </span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}