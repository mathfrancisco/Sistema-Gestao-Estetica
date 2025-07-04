'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Heart,
    ArrowLeft,
    DollarSign,
    Star,
    User,
    Calendar,
    CreditCard,
    Receipt,
    Edit,
    Trash2,
    Phone,
    Mail,
    MapPin,
    Clock,
    CheckCircle,
    AlertCircle,
    Banknote,
    Calculator,
    TrendingUp,
    FileText,
    Download,
    Share,
    MoreHorizontal
} from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Database } from '@/lib/database/supabase/types'
import { useFinancials } from "@/lib/hooks/useFinancials"
import { Sidebar } from '@/components/layout/sidebar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import AttendanceModal from '@/components/attendances/AttendanceModal'

type PaymentStatus = Database['public']['Enums']['payment_status_enum']
type PaymentMethod = Database['public']['Enums']['payment_method_enum']

const DetalhesAtendimentoPage: React.FC = () => {
    const router = useRouter()
    const params = useParams()
    const attendanceId = params.id as string

    const [attendance, setAttendance] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const {
        fetchAttendanceById,
        updateAttendance,
        deleteAttendance,
        isLoading: financialLoading
    } = useFinancials()

    // Simular busca de dados - substituir pela implementação real
    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                setLoading(true)
                // Mock data - substituir pela implementação real
                const mockAttendance = {
                    id: attendanceId,
                    user_id: 'user1',
                    appointment_id: 'apt1',
                    client_id: 'client1',
                    procedure_id: 'proc1',
                    date: '2025-01-15T14:00:00Z',
                    value: 150.00,
                    discount: 15.00,
                    product_cost: 30.00,
                    payment_method: 'pix' as PaymentMethod,
                    payment_status: 'paid' as PaymentStatus,
                    observations: 'Cliente muito satisfeita com o resultado. Procedimento realizado conforme esperado.',
                    rating: 5,
                    created_at: '2025-01-15T14:30:00Z',
                    clients: {
                        id: 'client1',
                        name: 'Maria Silva',
                        email: 'maria@email.com',
                        phone: '(11) 99999-9999',
                        address: {
                            street: 'Rua das Flores, 123',
                            city: 'São Paulo',
                            state: 'SP',
                            zipCode: '01234-567'
                        }
                    },
                    procedures: {
                        id: 'proc1',
                        name: 'Limpeza de Pele Profunda',
                        price: 150.00,
                        duration_minutes: 60,
                        description: 'Limpeza completa com extração e hidratação'
                    }
                }

                setAttendance(mockAttendance)
            } catch (error) {
                toast.error('Erro ao carregar detalhes do atendimento')
                router.push('/atendimentos')
            } finally {
                setLoading(false)
            }
        }

        if (attendanceId) {
            fetchAttendance()
        }
    }, [attendanceId, router])

    const handleUpdate = async (data: any) => {
        try {
            await updateAttendance(attendanceId, data)
            toast.success('Atendimento atualizado com sucesso!')
            setIsEditModalOpen(false)
            // Recarregar dados
            window.location.reload()
        } catch (error) {
            toast.error('Erro ao atualizar atendimento')
        }
    }

    const handleDelete = async () => {
        try {
            await deleteAttendance(attendanceId)
            toast.success('Atendimento excluído com sucesso!')
            router.push('/atendimentos')
        } catch (error) {
            toast.error('Erro ao excluir atendimento')
        }
    }

    const getPaymentStatusBadge = (status: PaymentStatus) => {
        const statusConfig = {
            pending: { label: 'Pendente', variant: 'destructive' as const, icon: Clock, color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
            paid: { label: 'Pago', variant: 'default' as const, icon: CheckCircle, color: 'bg-green-100 text-green-700 border-green-200' },
            cancelled: { label: 'Cancelado', variant: 'secondary' as const, icon: AlertCircle, color: 'bg-red-100 text-red-700 border-red-200' },
            refunded: { label: 'Reembolsado', variant: 'secondary' as const, icon: Receipt, color: 'bg-gray-100 text-gray-700 border-gray-200' }
        }

        const config = statusConfig[status] || statusConfig.pending
        const Icon = config.icon

        return (
            <Badge className={`flex items-center gap-1 ${config.color} text-sm font-semibold`}>
                <Icon className="w-4 h-4" />
                {config.label}
            </Badge>
        )
    }

    const getPaymentMethodBadge = (method: PaymentMethod | null) => {
        if (!method) return <Badge variant="secondary">Não informado</Badge>

        const methodConfig = {
            cash: { label: 'Dinheiro', icon: Banknote, color: 'bg-green-100 text-green-700 border-green-200' },
            pix: { label: 'PIX', icon: CreditCard, color: 'bg-blue-100 text-blue-700 border-blue-200' },
            debit: { label: 'Débito', icon: CreditCard, color: 'bg-purple-100 text-purple-700 border-purple-200' },
            credit: { label: 'Crédito', icon: CreditCard, color: 'bg-orange-100 text-orange-700 border-orange-200' },
            installment: { label: 'Parcelado', icon: Receipt, color: 'bg-pink-100 text-pink-700 border-pink-200' }
        }

        const config = methodConfig[method]
        const Icon = config.icon

        return (
            <Badge className={`flex items-center gap-1 ${config.color} text-sm font-semibold`}>
                <Icon className="w-4 h-4" />
                {config.label}
            </Badge>
        )
    }

    const getRatingStars = (rating: number | null) => {
        if (!rating) return <span className="text-slate-400 text-sm">Sem avaliação</span>

        return (
            <div className="flex items-center gap-2">
                <div className="flex">
                    {[...Array(5)].map((_, i) => (
                        <Star
                            key={i}
                            className={`w-5 h-5 ${i < rating ? 'text-yellow-400 fill-current' : 'text-slate-300'}`}
                        />
                    ))}
                </div>
                <span className="text-sm font-medium text-slate-700">({rating}/5)</span>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <Sidebar />
                <div className="lg:ml-64">
                    <div className="flex items-center justify-center h-64">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-slate-600">Carregando detalhes...</span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!attendance) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <Sidebar />
                <div className="lg:ml-64">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Atendimento não encontrado</h3>
                            <p className="text-slate-500 mb-4">O atendimento que você está procurando não existe.</p>
                            <Link href="/atendimentos">
                                <Button>Voltar para Atendimentos</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const finalValue = attendance.value - attendance.discount
    const profit = finalValue - attendance.product_cost
    const profitMargin = finalValue > 0 ? (profit / finalValue) * 100 : 0

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            <Sidebar />

            <div className="lg:ml-64">
                {/* Header */}
                <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
                    <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <Link href="/atendimentos">
                                    <Button variant="outline" size="sm" className="bg-white border-slate-200 hover:bg-slate-50">
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Voltar
                                    </Button>
                                </Link>

                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-600 rounded-lg flex items-center justify-center">
                                            <Heart className="w-4 h-4 text-white" />
                                        </div>
                                        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                            Detalhes do Atendimento
                                        </h1>
                                    </div>
                                    <p className="text-slate-600 text-xs sm:text-sm font-medium">
                                        {attendance.clients?.name} • {format(new Date(attendance.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="bg-white border-slate-200 hover:bg-slate-50"
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Editar
                                </Button>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="bg-white border-slate-200 hover:bg-slate-50">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                        <DropdownMenuItem className="cursor-pointer">
                                            <Download className="mr-2 h-4 w-4" />
                                            Exportar PDF
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="cursor-pointer">
                                            <Share className="mr-2 h-4 w-4" />
                                            Compartilhar
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => setShowDeleteConfirm(true)}
                                            className="cursor-pointer text-red-600"
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Excluir
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Conteúdo */}
                <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Coluna Principal */}
                            <div className="lg:col-span-2 space-y-6">

                                {/* Informações do Cliente */}
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <User className="w-5 h-5 text-blue-500" />
                                            Informações do Cliente
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <h3 className="font-semibold text-slate-900 text-lg mb-3">{attendance.clients?.name}</h3>
                                                <div className="space-y-3">
                                                    {attendance.clients?.email && (
                                                        <div className="flex items-center gap-3">
                                                            <Mail className="w-4 h-4 text-slate-500" />
                                                            <span className="text-slate-700">{attendance.clients.email}</span>
                                                        </div>
                                                    )}
                                                    {attendance.clients?.phone && (
                                                        <div className="flex items-center gap-3">
                                                            <Phone className="w-4 h-4 text-slate-500" />
                                                            <span className="text-slate-700">{attendance.clients.phone}</span>
                                                        </div>
                                                    )}
                                                    {attendance.clients?.address && (
                                                        <div className="flex items-start gap-3">
                                                            <MapPin className="w-4 h-4 text-slate-500 mt-0.5" />
                                                            <div className="text-slate-700">
                                                                <p>{attendance.clients.address.street}</p>
                                                                <p>{attendance.clients.address.city}, {attendance.clients.address.state}</p>
                                                                <p>{attendance.clients.address.zipCode}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex justify-center">
                                                <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                                    <span className="text-white text-2xl font-bold">
                                                        {attendance.clients?.name?.charAt(0)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Informações do Procedimento */}
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <Heart className="w-5 h-5 text-pink-500" />
                                            Procedimento Realizado
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="font-semibold text-slate-900 text-lg mb-2">{attendance.procedures?.name}</h3>
                                                {attendance.procedures?.description && (
                                                    <p className="text-slate-600 mb-4">{attendance.procedures.description}</p>
                                                )}
                                                <div className="flex items-center gap-6">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-slate-500" />
                                                        <span className="text-slate-700">{attendance.procedures?.duration_minutes} minutos</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <DollarSign className="w-4 h-4 text-slate-500" />
                                                        <span className="text-slate-700">R$ {attendance.procedures?.price?.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-slate-100">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-sm font-medium text-slate-700">Data e Hora:</span>
                                                    <span className="text-slate-900 font-semibold">
                                                        {format(new Date(attendance.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-slate-700">Avaliação:</span>
                                                    <div>{getRatingStars(attendance.rating)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Observações */}
                                {attendance.observations && (
                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <FileText className="w-5 h-5 text-purple-500" />
                                                Observações
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <p className="text-slate-700 leading-relaxed">{attendance.observations}</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>

                            {/* Sidebar Direita */}
                            <div className="space-y-6">

                                {/* Status do Pagamento */}
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <CreditCard className="w-5 h-5 text-green-500" />
                                            Status do Pagamento
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-slate-700">Status:</span>
                                                {getPaymentStatusBadge(attendance.payment_status)}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-slate-700">Método:</span>
                                                {getPaymentMethodBadge(attendance.payment_method)}
                                            </div>
                                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                                <span className="text-sm font-medium text-slate-700">Data do Atendimento:</span>
                                                <span className="text-slate-900 text-sm font-semibold">
                                                    {format(new Date(attendance.date), 'dd/MM/yyyy', { locale: ptBR })}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Resumo Financeiro */}
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <Calculator className="w-5 h-5 text-purple-500" />
                                            Resumo Financeiro
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                                <span className="text-sm text-slate-600">Valor do Serviço:</span>
                                                <span className="font-semibold text-slate-900">R$ {attendance.value.toFixed(2)}</span>
                                            </div>

                                            {attendance.discount > 0 && (
                                                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                                    <span className="text-sm text-slate-600">Desconto:</span>
                                                    <span className="font-semibold text-red-600">- R$ {attendance.discount.toFixed(2)}</span>
                                                </div>
                                            )}

                                            <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                                <span className="text-sm font-semibold text-slate-800">Valor Final:</span>
                                                <span className="font-bold text-green-600 text-lg">R$ {finalValue.toFixed(2)}</span>
                                            </div>

                                            <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                                <span className="text-sm text-slate-600">Custo dos Produtos:</span>
                                                <span className="font-semibold text-orange-600">R$ {attendance.product_cost.toFixed(2)}</span>
                                            </div>

                                            <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                                <span className="text-sm font-semibold text-slate-800">Lucro:</span>
                                                <span className={`font-bold text-lg ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    R$ {profit.toFixed(2)}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center py-2">
                                                <span className="text-sm font-semibold text-slate-800">Margem de Lucro:</span>
                                                <Badge className={`${profitMargin >= 0 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'} text-sm font-bold`}>
                                                    <TrendingUp className="w-3 h-3 mr-1" />
                                                    {profitMargin.toFixed(1)}%
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Ações Rápidas */}
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                        <CardTitle className="text-lg">Ações Rápidas</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="space-y-3">
                                            <Button
                                                variant="outline"
                                                className="w-full bg-white border-slate-200 hover:bg-slate-50"
                                                onClick={() => toast.info('Funcionalidade em desenvolvimento')}
                                            >
                                                <Download className="w-4 h-4 mr-2" />
                                                Gerar Recibo
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="w-full bg-white border-slate-200 hover:bg-slate-50"
                                                onClick={() => toast.info('Funcionalidade em desenvolvimento')}
                                            >
                                                <Share className="w-4 h-4 mr-2" />
                                                Enviar por Email
                                            </Button>
                                            <Link href={`/clientes/${attendance.client_id}`}>
                                                <Button
                                                    variant="outline"
                                                    className="w-full bg-white border-slate-200 hover:bg-slate-50"
                                                >
                                                    <User className="w-4 h-4 mr-2" />
                                                    Ver Perfil do Cliente
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Modal de Edição */}
            {isEditModalOpen && (
                <AttendanceModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    attendance={attendance}
                    clients={[attendance.clients]} // Em um caso real, carregar todos os clientes
                    procedures={[attendance.procedures]} // Em um caso real, carregar todos os procedimentos
                    onSave={handleUpdate}
                    onDelete={() => setShowDeleteConfirm(true)}
                />
            )}

            {/* Modal de Confirmação de Exclusão */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-red-600" />
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
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                className="flex-1"
                            >
                                Excluir
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default DetalhesAtendimentoPage