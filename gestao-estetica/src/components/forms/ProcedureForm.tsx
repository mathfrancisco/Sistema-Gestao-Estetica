'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import {
    Scissors,
    Clock,
    DollarSign,
    Calculator,
    Tag,
    Palette,
    Trash2,
    Save,
    X,
    AlertCircle,
    Info
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type {
    ProcedureWithCategory,
    ProcedureCategory,
    ProcedureInsert,
    ProcedureUpdate
} from '@/types/procedure.types'

const procedureSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    description: z.string().optional(),
    category_id: z.string().min(1, 'Selecione uma categoria'),
    price: z.number().min(0, 'Preço deve ser maior que zero'),
    cost: z.number().min(0, 'Custo deve ser positivo').optional(),
    duration_minutes: z.number().min(1, 'Duração deve ser pelo menos 1 minuto'),
    is_active: z.boolean().default(true)
})

type ProcedureFormData = z.infer<typeof procedureSchema>

interface ProcedureFormProps {
    isOpen: boolean
    onClose: () => void
    procedure?: ProcedureWithCategory | null
    categories: ProcedureCategory[]
    onSave: (data: ProcedureInsert | ProcedureUpdate) => Promise<void>
    onDelete?: () => Promise<void>
    loading?: boolean
}

const ProcedureForm: React.FC<ProcedureFormProps> = ({
                                                         isOpen,
                                                         onClose,
                                                         procedure,
                                                         categories,
                                                         onSave,
                                                         onDelete,
                                                         loading = false
                                                     }) => {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [marginPercentage, setMarginPercentage] = useState<number | null>(null)

    const isEditing = !!procedure

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors }
    } = useForm<ProcedureFormData>({
        resolver: zodResolver(procedureSchema),
        defaultValues: {
            name: '',
            description: '',
            category_id: '',
            price: 0,
            cost: 0,
            duration_minutes: 60,
            is_active: true
        }
    })

    const watchedPrice = watch('price')
    const watchedCost = watch('cost')

    // Calcular margem de lucro
    useEffect(() => {
        if (watchedPrice > 0 && (watchedCost || 0) > 0) {
            const margin = ((watchedPrice - (watchedCost || 0)) / watchedPrice) * 100
            setMarginPercentage(margin)
        } else {
            setMarginPercentage(null)
        }
    }, [watchedPrice, watchedCost])

    // Preencher formulário quando editando
    useEffect(() => {
        if (procedure && isOpen) {
            setValue('name', procedure.name)
            setValue('description', procedure.description || '')
            setValue('category_id', procedure.category_id || '')
            setValue('price', procedure.price)
            setValue('cost', procedure.cost || 0)
            setValue('duration_minutes', procedure.duration_minutes)
            setValue('is_active', procedure.is_active)
        } else if (!procedure && isOpen) {
            reset()
        }
    }, [procedure, isOpen, setValue, reset])

    const onSubmit = async (data: ProcedureFormData) => {
        try {
            setIsSubmitting(true)
            await onSave(data)
            onClose()
        } catch (error) {
            console.error('Erro ao salvar procedimento:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (onDelete && window.confirm('Tem certeza que deseja excluir este procedimento?')) {
            try {
                setIsSubmitting(true)
                await onDelete()
                onClose()
            } catch (error) {
                console.error('Erro ao excluir procedimento:', error)
            } finally {
                setIsSubmitting(false)
            }
        }
    }

    const getMarginColor = (margin: number) => {
        if (margin >= 50) return 'text-emerald-600'
        if (margin >= 30) return 'text-blue-600'
        if (margin >= 15) return 'text-orange-600'
        return 'text-red-600'
    }

    const getMarginLabel = (margin: number) => {
        if (margin >= 50) return 'Margem Excelente'
        if (margin >= 30) return 'Margem Boa'
        if (margin >= 15) return 'Margem Baixa'
        return 'Margem Crítica'
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                            <Scissors className="w-4 h-4 text-white" />
                        </div>
                        {isEditing ? 'Editar Procedimento' : 'Novo Procedimento'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Informações Básicas */}
                    <Card className="border-0 shadow-sm bg-slate-50/50">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Tag className="w-4 h-4 text-purple-500" />
                                Informações Básicas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome do Procedimento *</Label>
                                    <Input
                                        id="name"
                                        {...register('name')}
                                        placeholder="Ex: Limpeza de Pele"
                                        className={errors.name ? 'border-red-500' : ''}
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-500 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            {errors.name.message}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="category_id">Categoria *</Label>
                                    <Select
                                        value={watch('category_id')}
                                        onValueChange={(value) => setValue('category_id', value)}
                                    >
                                        <SelectTrigger className={errors.category_id ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Selecione uma categoria" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem key={category.id} value={category.id}>
                                                    <div className="flex items-center gap-2">
                                                        {category.color && (
                                                            <div
                                                                className="w-3 h-3 rounded-full"
                                                                style={{ backgroundColor: category.color }}
                                                            />
                                                        )}
                                                        {category.name}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.category_id && (
                                        <p className="text-sm text-red-500 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            {errors.category_id.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Descrição</Label>
                                <Textarea
                                    id="description"
                                    {...register('description')}
                                    placeholder="Descrição detalhada do procedimento..."
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Valores e Duração */}
                    <Card className="border-0 shadow-sm bg-slate-50/50">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <DollarSign className="w-4 h-4 text-green-500" />
                                Valores e Duração
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price" className="flex items-center gap-1">
                                        <DollarSign className="w-3 h-3" />
                                        Preço de Venda *
                                    </Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        {...register('price', { valueAsNumber: true })}
                                        placeholder="0.00"
                                        className={errors.price ? 'border-red-500' : ''}
                                    />
                                    {errors.price && (
                                        <p className="text-sm text-red-500 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            {errors.price.message}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="cost" className="flex items-center gap-1">
                                        <Calculator className="w-3 h-3" />
                                        Custo
                                    </Label>
                                    <Input
                                        id="cost"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        {...register('cost', { valueAsNumber: true })}
                                        placeholder="0.00"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="duration_minutes" className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        Duração (min) *
                                    </Label>
                                    <Input
                                        id="duration_minutes"
                                        type="number"
                                        min="1"
                                        {...register('duration_minutes', { valueAsNumber: true })}
                                        placeholder="60"
                                        className={errors.duration_minutes ? 'border-red-500' : ''}
                                    />
                                    {errors.duration_minutes && (
                                        <p className="text-sm text-red-500 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            {errors.duration_minutes.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Análise de Margem */}
                            {marginPercentage !== null && (
                                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Calculator className="w-4 h-4 text-blue-500" />
                                            <span className="text-sm font-medium text-slate-700">Análise de Margem</span>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={`${getMarginColor(marginPercentage)} border-current`}
                                        >
                                            {marginPercentage.toFixed(1)}% - {getMarginLabel(marginPercentage)}
                                        </Badge>
                                    </div>
                                    <div className="mt-2 text-xs text-slate-600">
                                        Lucro: R$ {(watchedPrice - (watchedCost || 0)).toFixed(2)}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Configurações */}
                    <Card className="border-0 shadow-sm bg-slate-50/50">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Palette className="w-4 h-4 text-orange-500" />
                                Configurações
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label className="text-sm font-medium">Procedimento Ativo</Label>
                                    <p className="text-xs text-slate-500">
                                        Procedimentos inativos não aparecerão nos agendamentos
                                    </p>
                                </div>
                                <Switch
                                    checked={watch('is_active')}
                                    onCheckedChange={(checked) => setValue('is_active', checked)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Informações de Contexto */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-blue-700">
                                <p className="font-medium mb-1">Dicas para preços competitivos:</p>
                                <ul className="space-y-1 text-xs">
                                    <li>• Margem de 50%+ é considerada excelente para procedimentos estéticos</li>
                                    <li>• Considere os custos de produtos, tempo e expertise</li>
                                    <li>• Analise a concorrência na sua região</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </form>

                <DialogFooter className="gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                    </Button>

                    {isEditing && onDelete && (
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isSubmitting}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                        </Button>
                    )}

                    <Button
                        type="submit"
                        onClick={handleSubmit(onSubmit)}
                        disabled={isSubmitting}
                        className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {isSubmitting ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar Procedimento')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default ProcedureForm