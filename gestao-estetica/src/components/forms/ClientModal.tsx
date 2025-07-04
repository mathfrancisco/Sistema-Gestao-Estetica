'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Users,
    Mail,
    Phone,
    Calendar,
    MapPin,
    FileText,
    Save,
    Trash2,
    User,
    CreditCard,
    Heart,
    Target,
    AlertTriangle
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Database } from '@/lib/database/supabase/types'

type Client = Database['public']['Tables']['clients']['Row']
type ClientInsert = Database['public']['Tables']['clients']['Insert']
type ClientStatus = Database['public']['Enums']['client_status_enum']
type ClientSegment = Database['public']['Enums']['client_segment_enum']

interface ClientModalProps {
    isOpen: boolean
    onClose: () => void
    client?: Client
    onSave: (data: ClientInsert) => void
    onDelete?: () => void
}

interface FormData {
    name: string
    email: string
    phone: string
    cpf: string
    birthday: string
    status: ClientStatus
    segment: ClientSegment | null
    preferences: string
    observations: string
    address: {
        street: string
        number: string
        complement: string
        neighborhood: string
        city: string
        state: string
        zipCode: string
    }
}

const ClientModal: React.FC<ClientModalProps> = ({
                                                     isOpen,
                                                     onClose,
                                                     client,
                                                     onSave,
                                                     onDelete
                                                 }) => {
    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        phone: '',
        cpf: '',
        birthday: '',
        status: 'active',
        segment: null,
        preferences: '',
        observations: '',
        address: {
            street: '',
            number: '',
            complement: '',
            neighborhood: '',
            city: '',
            state: '',
            zipCode: ''
        }
    })

    const [errors, setErrors] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(false)

    // Carregar dados do cliente para edição
    useEffect(() => {
        if (client) {
            const address = client.address as any || {}
            setFormData({
                name: client.name || '',
                email: client.email || '',
                phone: client.phone || '',
                cpf: client.cpf || '',
                birthday: client.birthday ? format(new Date(client.birthday), 'yyyy-MM-dd') : '',
                status: client.status,
                segment: client.segment,
                preferences: client.preferences || '',
                observations: client.observations || '',
                address: {
                    street: address.street || '',
                    number: address.number || '',
                    complement: address.complement || '',
                    neighborhood: address.neighborhood || '',
                    city: address.city || '',
                    state: address.state || '',
                    zipCode: address.zipCode || ''
                }
            })
        } else {
            // Reset form for new client
            setFormData({
                name: '',
                email: '',
                phone: '',
                cpf: '',
                birthday: '',
                status: 'active',
                segment: 'new',
                preferences: '',
                observations: '',
                address: {
                    street: '',
                    number: '',
                    complement: '',
                    neighborhood: '',
                    city: '',
                    state: '',
                    zipCode: ''
                }
            })
        }
        setErrors({})
    }, [client, isOpen])

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {}

        if (!formData.name.trim()) {
            newErrors.name = 'Nome é obrigatório'
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email inválido'
        }

        if (formData.phone && !/^[\d\s\(\)\-\+]+$/.test(formData.phone)) {
            newErrors.phone = 'Telefone inválido'
        }

        if (formData.cpf && !/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/.test(formData.cpf.replace(/\D/g, ''))) {
            newErrors.cpf = 'CPF inválido'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        setLoading(true)

        try {
            const submitData: ClientInsert = {
                name: formData.name.trim(),
                email: formData.email.trim() || null,
                phone: formData.phone.trim() || null,
                cpf: formData.cpf.replace(/\D/g, '') || null,
                birthday: formData.birthday || null,
                status: formData.status,
                segment: formData.segment,
                preferences: formData.preferences.trim() || null,
                observations: formData.observations.trim() || null,
                address: formData.address.street ? formData.address : null,
                user_id: '', // Will be set by the service
                total_spent: 0,
                total_visits: 0
            }

            await onSave(submitData)
        } catch (error) {
            console.error('Error saving client:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (field: keyof FormData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }))
        }
    }

    const handleAddressChange = (field: keyof FormData['address'], value: string) => {
        setFormData(prev => ({
            ...prev,
            address: {
                ...prev.address,
                [field]: value
            }
        }))
    }

    const formatCPF = (value: string) => {
        const numbers = value.replace(/\D/g, '')
        return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }

    const formatPhone = (value: string) => {
        const numbers = value.replace(/\D/g, '')
        if (numbers.length <= 10) {
            return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
        }
        return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }

    const getSegmentInfo = (segment: ClientSegment | null) => {
        const segmentConfig = {
            vip: { label: 'VIP', color: 'bg-amber-100 text-amber-800', icon: Users },
            regular: { label: 'Regular', color: 'bg-blue-100 text-blue-800', icon: User },
            new: { label: 'Novo', color: 'bg-green-100 text-green-800', icon: Heart },
            at_risk: { label: 'Em Risco', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
            lost: { label: 'Perdido', color: 'bg-gray-100 text-gray-800', icon: Target }
        }

        return segment ? segmentConfig[segment] : null
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                            <Users className="w-4 h-4 text-white" />
                        </div>
                        {client ? 'Editar Cliente' : 'Novo Cliente'}
                    </DialogTitle>
                    <DialogDescription>
                        {client ? 'Atualize as informações do cliente' : 'Cadastre um novo cliente no sistema'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Informações Básicas */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <User className="w-5 h-5 text-purple-500" />
                                Informações Básicas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        placeholder="Nome completo do cliente"
                                        className={errors.name ? 'border-red-500' : ''}
                                    />
                                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="cpf">CPF</Label>
                                    <Input
                                        id="cpf"
                                        value={formData.cpf}
                                        onChange={(e) => handleInputChange('cpf', formatCPF(e.target.value))}
                                        placeholder="000.000.000-00"
                                        maxLength={14}
                                        className={errors.cpf ? 'border-red-500' : ''}
                                    />
                                    {errors.cpf && <p className="text-sm text-red-500">{errors.cpf}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            placeholder="email@exemplo.com"
                                            className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telefone</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        <Input
                                            id="phone"
                                            value={formData.phone}
                                            onChange={(e) => handleInputChange('phone', formatPhone(e.target.value))}
                                            placeholder="(00) 00000-0000"
                                            className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="birthday">Data de Nascimento</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        <Input
                                            id="birthday"
                                            type="date"
                                            value={formData.birthday}
                                            onChange={(e) => handleInputChange('birthday', e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={formData.status} onValueChange={(value: ClientStatus) => handleInputChange('status', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Ativo</SelectItem>
                                            <SelectItem value="inactive">Inativo</SelectItem>
                                            <SelectItem value="blocked">Bloqueado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="segment">Segmento</Label>
                                    <Select
                                        value={formData.segment || ''}
                                        onValueChange={(value: ClientSegment) => handleInputChange('segment', value || null)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o segmento" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="new">Novo Cliente</SelectItem>
                                            <SelectItem value="regular">Cliente Regular</SelectItem>
                                            <SelectItem value="vip">Cliente VIP</SelectItem>
                                            <SelectItem value="at_risk">Em Risco</SelectItem>
                                            <SelectItem value="lost">Cliente Perdido</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {formData.segment && (
                                        <Badge className={getSegmentInfo(formData.segment)?.color}>
                                            {getSegmentInfo(formData.segment)?.label}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Endereço */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <MapPin className="w-5 h-5 text-blue-500" />
                                Endereço
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2 space-y-2">
                                    <Label htmlFor="street">Rua</Label>
                                    <Input
                                        id="street"
                                        value={formData.address.street}
                                        onChange={(e) => handleAddressChange('street', e.target.value)}
                                        placeholder="Nome da rua"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="number">Número</Label>
                                    <Input
                                        id="number"
                                        value={formData.address.number}
                                        onChange={(e) => handleAddressChange('number', e.target.value)}
                                        placeholder="123"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="complement">Complemento</Label>
                                    <Input
                                        id="complement"
                                        value={formData.address.complement}
                                        onChange={(e) => handleAddressChange('complement', e.target.value)}
                                        placeholder="Apto, Bloco, etc."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="neighborhood">Bairro</Label>
                                    <Input
                                        id="neighborhood"
                                        value={formData.address.neighborhood}
                                        onChange={(e) => handleAddressChange('neighborhood', e.target.value)}
                                        placeholder="Nome do bairro"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city">Cidade</Label>
                                    <Input
                                        id="city"
                                        value={formData.address.city}
                                        onChange={(e) => handleAddressChange('city', e.target.value)}
                                        placeholder="Nome da cidade"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="state">Estado</Label>
                                    <Input
                                        id="state"
                                        value={formData.address.state}
                                        onChange={(e) => handleAddressChange('state', e.target.value)}
                                        placeholder="SP"
                                        maxLength={2}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="zipCode">CEP</Label>
                                    <Input
                                        id="zipCode"
                                        value={formData.address.zipCode}
                                        onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                                        placeholder="00000-000"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Observações e Preferências */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <FileText className="w-5 h-5 text-green-500" />
                                Observações e Preferências
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="preferences">Preferências</Label>
                                <Textarea
                                    id="preferences"
                                    value={formData.preferences}
                                    onChange={(e) => handleInputChange('preferences', e.target.value)}
                                    placeholder="Preferências do cliente (horários, procedimentos, etc.)"
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="observations">Observações</Label>
                                <Textarea
                                    id="observations"
                                    value={formData.observations}
                                    onChange={(e) => handleInputChange('observations', e.target.value)}
                                    placeholder="Observações importantes sobre o cliente"
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Estatísticas do Cliente (apenas para edição) */}
                    {client && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <CreditCard className="w-5 h-5 text-indigo-500" />
                                    Estatísticas
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CreditCard className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm font-medium text-blue-800">Valor Total</span>
                                        </div>
                                        <p className="text-xl font-bold text-blue-900">
                                            R$ {client.total_spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>

                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Users className="w-4 h-4 text-green-600" />
                                            <span className="text-sm font-medium text-green-800">Total de Visitas</span>
                                        </div>
                                        <p className="text-xl font-bold text-green-900">
                                            {client.total_visits}
                                        </p>
                                    </div>

                                    <div className="bg-purple-50 p-4 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Target className="w-4 h-4 text-purple-600" />
                                            <span className="text-sm font-medium text-purple-800">LTV Score</span>
                                        </div>
                                        <p className="text-xl font-bold text-purple-900">
                                            {client.ltv_score || 0}
                                        </p>
                                    </div>

                                    <div className="bg-amber-50 p-4 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="w-4 h-4 text-amber-600" />
                                            <span className="text-sm font-medium text-amber-800">Última Visita</span>
                                        </div>
                                        <p className="text-sm font-bold text-amber-900">
                                            {client.last_visit
                                                ? format(new Date(client.last_visit), 'dd/MM/yyyy', { locale: ptBR })
                                                : 'Nunca'
                                            }
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="font-medium text-slate-700">Cliente desde:</span>
                                            <span className="ml-2 text-slate-600">
                                                {format(new Date(client.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-slate-700">Primeira visita:</span>
                                            <span className="ml-2 text-slate-600">
                                                {client.first_visit
                                                    ? format(new Date(client.first_visit), 'dd/MM/yyyy', { locale: ptBR })
                                                    : 'Não registrada'
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <DialogFooter className="flex flex-col sm:flex-row gap-2">
                        <div className="flex flex-1 justify-start">
                            {client && onDelete && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={onDelete}
                                    disabled={loading}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Excluir Cliente
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Salvando...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Save className="w-4 h-4" />
                                        {client ? 'Atualizar' : 'Salvar'} Cliente
                                    </div>
                                )}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default ClientModal