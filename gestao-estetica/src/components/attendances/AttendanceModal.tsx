'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Heart,
    DollarSign,
    Star,
    User,
    Save,
    Trash2,
    AlertTriangle,
    Calculator
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import type { Database } from '@/lib/database/supabase/types'

type PaymentStatus = Database['public']['Enums']['payment_status_enum']
type PaymentMethod = Database['public']['Enums']['payment_method_enum']

interface AttendanceModalProps {
    isOpen: boolean
    onClose: () => void
    attendance?: any
    clients: any[]
    procedures: any[]
    onSave: (data: any) => Promise<void>
    onDelete?: () => Promise<void>
}

const AttendanceModal: React.FC<AttendanceModalProps> = ({
                                                             isOpen,
                                                             onClose,
                                                             attendance,
                                                             clients,
                                                             procedures,
                                                             onSave,
                                                             onDelete
                                                         }) => {
    const [formData, setFormData] = useState({
        client_id: '',
        procedure_id: '',
        date: '',
        value: '',
        discount: '0',
        product_cost: '0',
        payment_method: '' as PaymentMethod | '',
        payment_status: 'pending' as PaymentStatus,
        observations: '',
        rating: ''
    })

    const [loading, setLoading] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [selectedProcedure, setSelectedProcedure] = useState<any>(null)
    const [calculatedValues, setCalculatedValues] = useState({
        finalValue: 0,
        profit: 0,
        profitMargin: 0
    })

    // Preencher form quando editando
    useEffect(() => {
        if (attendance) {
            setFormData({
                client_id: attendance.client_id || '',
                procedure_id: attendance.procedure_id || '',
                date: attendance.date ? format(new Date(attendance.date), 'yyyy-MM-dd\'T\'HH:mm') : '',
                value: attendance.value?.toString() || '',
                discount: attendance.discount?.toString() || '0',
                product_cost: attendance.product_cost?.toString() || '0',
                payment_method: attendance.payment_method || '',
                payment_status: attendance.payment_status || 'pending',
                observations: attendance.observations || '',
                rating: attendance.rating?.toString() || ''
            })
        } else {
            // Reset para novo atendimento
            setFormData({
                client_id: '',
                procedure_id: '',
                date: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
                value: '',
                discount: '0',
                product_cost: '0',
                payment_method: '',
                payment_status: 'pending',
                observations: '',
                rating: ''
            })
        }
    }, [attendance])

    // Atualizar valores calculados
    useEffect(() => {
        const value = parseFloat(formData.value) || 0
        const discount = parseFloat(formData.discount) || 0
        const productCost = parseFloat(formData.product_cost) || 0

        const finalValue = value - discount
        const profit = finalValue - productCost
        const profitMargin = finalValue > 0 ? (profit / finalValue) * 100 : 0

        setCalculatedValues({
            finalValue,
            profit,
            profitMargin
        })
    }, [formData.value, formData.discount, formData.product_cost])

    // Buscar procedimento selecionado
    useEffect(() => {
        if (formData.procedure_id) {
            const procedure = procedures.find(p => p.id === formData.procedure_id)
            setSelectedProcedure(procedure)

            if (procedure && !formData.value) {
                setFormData(prev => ({
                    ...prev,
                    value: procedure.price?.toString() || '',
                    product_cost: procedure.cost?.toString() || '0'
                }))
            }
        } else {
            setSelectedProcedure(null)
        }
    }, [formData.procedure_id, procedures, formData.value])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.client_id || !formData.procedure_id || !formData.date || !formData.value) {
            toast.error('Preencha todos os campos obrigatórios')
            return
        }

        setLoading(true)
        try {
            const data = {
                client_id: formData.client_id,
                procedure_id: formData.procedure_id,
                date: new Date(formData.date).toISOString(),
                value: parseFloat(formData.value),
                discount: parseFloat(formData.discount) || 0,
                product_cost: parseFloat(formData.product_cost) || 0,
                payment_method: formData.payment_method || null,
                payment_status: formData.payment_status,
                observations: formData.observations || null,
                rating: formData.rating ? parseInt(formData.rating) : null
            }

            await onSave(data)
            onClose()
        } catch (error) {
            toast.error('Erro ao salvar atendimento')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!onDelete) return

        setLoading(true)
        try {
            await onDelete()
            onClose()
        } catch (error) {
            toast.error('Erro ao excluir atendimento')
        } finally {
            setLoading(false)
            setShowDeleteConfirm(false)
        }
    }

    const getPaymentStatusColor = (status: PaymentStatus) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            paid: 'bg-green-100 text-green-700 border-green-200',
            cancelled: 'bg-red-100 text-red-700 border-red-200',
            refunded: 'bg-gray-100 text-gray-700 border-gray-200'
        }
        return colors[status] || colors.pending
    }

    const getPaymentMethodLabel = (method: PaymentMethod) => {
        const labels = {
            cash: 'Dinheiro',
            pix: 'PIX',
            debit: 'Cartão de Débito',
            credit: 'Cartão de Crédito',
            installment: 'Parcelado'
        }
        return labels[method] || method
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-600 rounded-lg flex items-center justify-center">
                            <Heart className="w-4 h-4 text-white" />
                        </div>
                        {attendance ? 'Editar Atendimento' : 'Novo Atendimento'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Coluna Esquerda - Informações Básicas */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <User className="w-5 h-5 text-blue-500" />
                                        Informações do Atendimento
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="client_id">Cliente *</Label>
                                        <Select value={formData.client_id} onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione um cliente" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {clients.map((client) => (
                                                    <SelectItem key={client.id} value={client.id}>
                                                        <div>
                                                            <div className="font-medium">{client.name}</div>
                                                            <div className="text-sm text-gray-500">{client.email}</div>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="procedure_id">Procedimento *</Label>
                                        <Select value={formData.procedure_id} onValueChange={(value) => setFormData(prev => ({ ...prev, procedure_id: value }))}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione um procedimento" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {procedures.map((procedure) => (
                                                    <SelectItem key={procedure.id} value={procedure.id}>
                                                        <div>
                                                            <div className="font-medium">{procedure.name}</div>
                                                            <div className="text-sm text-gray-500">
                                                                R$ {procedure.price?.toFixed(2)} - {procedure.duration_minutes}min
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {selectedProcedure && (
                                            <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                                                <p className="text-sm text-blue-700">
                                                    <strong>{selectedProcedure.name}</strong>
                                                </p>
                                                <p className="text-sm text-blue-600">
                                                    Preço: R$ {selectedProcedure.price?.toFixed(2)} |
                                                    Duração: {selectedProcedure.duration_minutes}min
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="date">Data e Hora *</Label>
                                        <Input
                                            type="datetime-local"
                                            value={formData.date}
                                            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="observations">Observações</Label>
                                        <Textarea
                                            value={formData.observations}
                                            onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                                            placeholder="Observações sobre o atendimento..."
                                            rows={3}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="rating">Avaliação do Cliente</Label>
                                        <Select value={formData.rating} onValueChange={(value) => setFormData(prev => ({ ...prev, rating: value }))}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione uma avaliação" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">Sem avaliação</SelectItem>
                                                {[1, 2, 3, 4, 5].map((rating) => (
                                                    <SelectItem key={rating} value={rating.toString()}>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <Star
                                                                        key={i}
                                                                        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                                                    />
                                                                ))}
                                                            </div>
                                                            <span>{rating} estrela{rating > 1 ? 's' : ''}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Coluna Direita - Informações Financeiras */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <DollarSign className="w-5 h-5 text-green-500" />
                                        Informações Financeiras
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="value">Valor do Serviço *</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={formData.value}
                                                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                                                placeholder="0,00"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="discount">Desconto</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={formData.discount}
                                                onChange={(e) => setFormData(prev => ({ ...prev, discount: e.target.value }))}
                                                placeholder="0,00"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="product_cost">Custo dos Produtos</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.product_cost}
                                            onChange={(e) => setFormData(prev => ({ ...prev, product_cost: e.target.value }))}
                                            placeholder="0,00"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="payment_method">Método de Pagamento</Label>
                                        <Select value={formData.payment_method} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value as PaymentMethod }))}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o método" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="cash">💰 Dinheiro</SelectItem>
                                                <SelectItem value="pix">📱 PIX</SelectItem>
                                                <SelectItem value="debit">💳 Cartão de Débito</SelectItem>
                                                <SelectItem value="credit">💳 Cartão de Crédito</SelectItem>
                                                <SelectItem value="installment">📄 Parcelado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="payment_status">Status do Pagamento</Label>
                                        <Select value={formData.payment_status} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_status: value as PaymentStatus }))}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pending">⏳ Pendente</SelectItem>
                                                <SelectItem value="paid">✅ Pago</SelectItem>
                                                <SelectItem value="cancelled">❌ Cancelado</SelectItem>
                                                <SelectItem value="refunded">🔄 Reembolsado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Resumo Financeiro */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Calculator className="w-5 h-5 text-purple-500" />
                                        Resumo Financeiro
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center py-2 border-b">
                                            <span className="text-sm text-gray-600">Valor do Serviço:</span>
                                            <span className="font-medium">R$ {(parseFloat(formData.value) || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b">
                                            <span className="text-sm text-gray-600">Desconto:</span>
                                            <span className="font-medium text-red-600">- R$ {(parseFloat(formData.discount) || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b">
                                            <span className="text-sm font-medium text-gray-800">Valor Final:</span>
                                            <span className="font-bold text-green-600">R$ {calculatedValues.finalValue.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b">
                                            <span className="text-sm text-gray-600">Custo dos Produtos:</span>
                                            <span className="font-medium text-orange-600">R$ {(parseFloat(formData.product_cost) || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b">
                                            <span className="text-sm font-medium text-gray-800">Lucro:</span>
                                            <span className={`font-bold ${calculatedValues.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                R$ {calculatedValues.profit.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center py-2">
                                            <span className="text-sm font-medium text-gray-800">Margem de Lucro:</span>
                                            <Badge className={calculatedValues.profitMargin >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                                                {calculatedValues.profitMargin.toFixed(1)}%
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                        <div className="flex-1 flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="flex-1"
                                disabled={loading}
                            >
                                Cancelar
                            </Button>

                            {attendance && onDelete && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    disabled={loading}
                                    className="px-4"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 flex-1 sm:flex-none"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Salvando...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Save className="w-4 h-4" />
                                    {attendance ? 'Atualizar' : 'Salvar'} Atendimento
                                </div>
                            )}
                        </Button>
                    </div>
                </form>

                {/* Modal de Confirmação de Exclusão */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md mx-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Confirmar Exclusão</h3>
                                    <p className="text-sm text-gray-600">Esta ação não pode ser desfeita.</p>
                                </div>
                            </div>
                            <p className="text-gray-700 mb-6">
                                Tem certeza que deseja excluir este atendimento? Todos os dados relacionados serão removidos permanentemente.
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1"
                                    disabled={loading}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleDelete}
                                    className="flex-1"
                                    disabled={loading}
                                >
                                    {loading ? 'Excluindo...' : 'Excluir'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

export default AttendanceModal