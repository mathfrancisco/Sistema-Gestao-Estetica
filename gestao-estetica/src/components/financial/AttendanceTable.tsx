// components/financial/AttendanceTable.tsx
'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    DollarSign,
    Calendar,
    User,
    Clock,
    CheckCircle,
    AlertCircle,
    XCircle,
    MoreHorizontal,
    Edit,
    Trash2,
    Receipt,
    Download,
    RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { AttendanceWithDetails } from '@/lib/services/financial.service'
import type { PaymentStatus, PaymentMethod } from '@/lib/database/supabase/types'

interface AttendanceTableProps {
    attendances: AttendanceWithDetails[]
    isLoading?: boolean
    onEdit?: (attendance: AttendanceWithDetails) => void
    onDelete?: (id: string) => void
    onUpdatePaymentStatus?: (id: string, status: PaymentStatus) => void
    onGenerateReceipt?: (id: string) => void
    className?: string
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
                                                                    attendances,
                                                                    isLoading = false,
                                                                    onEdit,
                                                                    onDelete,
                                                                    onUpdatePaymentStatus,
                                                                    onGenerateReceipt,
                                                                    className = ""
                                                                }) => {
    const getPaymentStatusBadge = (status: PaymentStatus) => {
        const statusConfig = {
            paid: { label: 'Pago', variant: 'default' as const, icon: CheckCircle, color: 'emerald' },
            pending: { label: 'Pendente', variant: 'secondary' as const, icon: Clock, color: 'orange' },
            cancelled: { label: 'Cancelado', variant: 'destructive' as const, icon: XCircle, color: 'red' },
            refunded: { label: 'Reembolsado', variant: 'outline' as const, icon: AlertCircle, color: 'purple' }
        }

        const config = statusConfig[status]
        const Icon = config.icon

        return (
            <Badge variant={config.variant} className="flex items-center gap-1">
                <Icon className="w-3 h-3" />
                {config.label}
            </Badge>
        )
    }

    const getPaymentMethodBadge = (method: PaymentMethod | null) => {
        if (!method) return <span className="text-slate-400 text-sm">-</span>

        const methodConfig = {
            cash: { label: 'Dinheiro', color: 'bg-green-100 text-green-700' },
            pix: { label: 'PIX', color: 'bg-blue-100 text-blue-700' },
            debit: { label: 'Débito', color: 'bg-purple-100 text-purple-700' },
            credit: { label: 'Crédito', color: 'bg-orange-100 text-orange-700' },
            installment: { label: 'Parcelado', color: 'bg-pink-100 text-pink-700' }
        }

        const config = methodConfig[method]

        return (
            <Badge variant="outline" className={`${config.color} border-0`}>
                {config.label}
            </Badge>
        )
    }

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        })
    }

    const formatDate = (dateString: string) => {
        return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR })
    }

    if (isLoading) {
        return (
            <Card className={`border-0 shadow-xl shadow-slate-200/60 ${className}`}>
                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-blue-500" />
                        Atendimentos Financeiros
                        <RefreshCw className="w-4 h-4 animate-spin ml-2 text-blue-500" />
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        {[...Array(5)].map((_, index) => (
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
        <Card className={`border-0 shadow-xl shadow-slate-200/60 overflow-hidden ${className}`}>
            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                        <DollarSign className="w-5 h-5 text-blue-500" />
                        Atendimentos Financeiros ({attendances.length})
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                            <Receipt className="w-3 h-3 mr-1" />
                            {attendances.length} registros
                        </Badge>
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-white border-slate-200 hover:bg-slate-50"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Exportar
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {attendances.length === 0 ? (
                    <div className="text-center py-12 px-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <DollarSign className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                            Nenhum atendimento encontrado
                        </h3>
                        <p className="text-slate-500 mb-6 max-w-md mx-auto">
                            Não há registros financeiros para exibir no período selecionado.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50 hover:bg-slate-50">
                                    <TableHead className="font-semibold text-slate-700">Cliente</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Procedimento</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Data</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Valor</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Pagamento</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                                    <TableHead className="text-right font-semibold text-slate-700">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attendances.map((attendance) => {
                                    const finalValue = attendance.value - attendance.discount
                                    const profit = finalValue - (attendance.product_cost || 0)

                                    return (
                                        <TableRow key={attendance.id} className="hover:bg-slate-50/50 transition-colors">
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                                        <User className="w-4 h-4 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900">{attendance.clients?.name}</p>
                                                        {attendance.clients?.email && (
                                                            <p className="text-sm text-slate-500">{attendance.clients.email}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div>
                                                    <p className="font-medium text-slate-900">{attendance.procedures?.name}</p>
                                                    <p className="text-sm text-slate-500">
                                                        Custo: {formatCurrency(attendance.product_cost || 0)}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-slate-400" />
                                                    <span className="text-sm font-medium">{formatDate(attendance.date)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-slate-900">
                                                            {formatCurrency(finalValue)}
                                                        </span>
                                                        {attendance.discount > 0 && (
                                                            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-600 border-orange-200">
                                                                -{formatCurrency(attendance.discount)}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className={`text-xs ${profit > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                        Lucro: {formatCurrency(profit)}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                {getPaymentMethodBadge(attendance.payment_method)}
                                            </TableCell>
                                            <TableCell className="py-4">
                                                {getPaymentStatusBadge(attendance.payment_status)}
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
                                                        {onEdit && (
                                                            <DropdownMenuItem
                                                                onClick={() => onEdit(attendance)}
                                                                className="cursor-pointer"
                                                            >
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Editar
                                                            </DropdownMenuItem>
                                                        )}
                                                        {onGenerateReceipt && (
                                                            <DropdownMenuItem
                                                                onClick={() => onGenerateReceipt(attendance.id)}
                                                                className="cursor-pointer"
                                                            >
                                                                <Receipt className="mr-2 h-4 w-4" />
                                                                Gerar Recibo
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        {onUpdatePaymentStatus && (
                                                            <>
                                                                <DropdownMenuItem
                                                                    onClick={() => onUpdatePaymentStatus(attendance.id, 'paid')}
                                                                    className="cursor-pointer text-emerald-600"
                                                                    disabled={attendance.payment_status === 'paid'}
                                                                >
                                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                                    Marcar como Pago
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => onUpdatePaymentStatus(attendance.id, 'pending')}
                                                                    className="cursor-pointer text-orange-600"
                                                                    disabled={attendance.payment_status === 'pending'}
                                                                >
                                                                    <Clock className="mr-2 h-4 w-4" />
                                                                    Marcar como Pendente
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => onUpdatePaymentStatus(attendance.id, 'cancelled')}
                                                                    className="cursor-pointer text-red-600"
                                                                    disabled={attendance.payment_status === 'cancelled'}
                                                                >
                                                                    <XCircle className="mr-2 h-4 w-4" />
                                                                    Cancelar Pagamento
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                            </>
                                                        )}
                                                        {onDelete && (
                                                            <DropdownMenuItem
                                                                onClick={() => onDelete(attendance.id)}
                                                                className="cursor-pointer text-red-600"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Excluir
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}