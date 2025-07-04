'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
    Checkbox
} from '@/components/ui/checkbox'
import {
    Users,
    Phone,
    Mail,
    MoreHorizontal,
    CheckCircle,
    XCircle,
    AlertCircle,
    Edit,
    Trash2,
    Eye,
    Calendar,
    Clock,
    Crown,
    UserPlus,
    AlertTriangle,
    Target
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import type { Database } from '@/lib/database/supabase/types'

type Client = Database['public']['Tables']['clients']['Row']
type ClientStatus = Database['public']['Enums']['client_status_enum']
type ClientSegment = Database['public']['Enums']['client_segment_enum']

interface ClientTableProps {
    clients: Client[]
    loading?: boolean
    showSelection?: boolean
    selectedClients?: string[]
    onClientSelect?: (clientId: string) => void
    onSelectAll?: (selected: boolean) => void
    onEdit?: (client: Client) => void
    onDelete?: (clientId: string) => void
    onViewProfile?: (clientId: string) => void
    showActions?: boolean
    compactMode?: boolean
}

const ClientTable: React.FC<ClientTableProps> = ({
                                                     clients,
                                                     loading = false,
                                                     showSelection = false,
                                                     selectedClients = [],
                                                     onClientSelect,
                                                     onSelectAll,
                                                     onEdit,
                                                     onDelete,
                                                     onViewProfile,
                                                     showActions = true,
                                                     compactMode = false
                                                 }) => {
    const [selectAll, setSelectAll] = useState(false)

    const getStatusBadge = (status: ClientStatus) => {
        const statusConfig = {
            active: { label: 'Ativo', variant: 'default' as const, icon: CheckCircle },
            inactive: { label: 'Inativo', variant: 'secondary' as const, icon: Clock },
            blocked: { label: 'Bloqueado', variant: 'destructive' as const, icon: XCircle }
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

    const getSegmentBadge = (segment: ClientSegment | null) => {
        if (!segment) return null

        const segmentConfig = {
            vip: { label: 'VIP', variant: 'default' as const, icon: Crown, color: 'bg-gradient-to-r from-amber-500 to-orange-500' },
            regular: { label: 'Regular', variant: 'secondary' as const, icon: Users, color: 'bg-gradient-to-r from-blue-500 to-blue-600' },
            new: { label: 'Novo', variant: 'default' as const, icon: UserPlus, color: 'bg-gradient-to-r from-green-500 to-emerald-500' },
            at_risk: { label: 'Em Risco', variant: 'destructive' as const, icon: AlertTriangle, color: 'bg-gradient-to-r from-red-500 to-red-600' },
            lost: { label: 'Perdido', variant: 'destructive' as const, icon: XCircle, color: 'bg-gradient-to-r from-gray-500 to-gray-600' }
        }

        const config = segmentConfig[segment]
        const Icon = config.icon

        return (
            <Badge variant={config.variant} className={`flex items-center gap-1 text-white border-0 ${config.color}`}>
                <Icon className="w-3 h-3" />
                {config.label}
            </Badge>
        )
    }

    const handleSelectAll = (checked: boolean) => {
        setSelectAll(checked)
        onSelectAll?.(checked)
    }

    const isClientSelected = (clientId: string) => {
        return selectedClients.includes(clientId)
    }

    if (loading) {
        return (
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                        <div className="h-16 bg-slate-200 rounded-lg"></div>
                    </div>
                ))}
            </div>
        )
    }

    if (clients.length === 0) {
        return (
            <div className="text-center py-12">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Nenhum cliente encontrado
                </h3>
                <p className="text-slate-500">
                    Não há clientes que correspondam aos filtros aplicados.
                </p>
            </div>
        )
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50">
                        {showSelection && (
                            <TableHead className="w-12">
                                <Checkbox
                                    checked={selectAll}
                                    onCheckedChange={handleSelectAll}
                                />
                            </TableHead>
                        )}
                        <TableHead className="font-semibold text-slate-700">Cliente</TableHead>
                        {!compactMode && (
                            <TableHead className="font-semibold text-slate-700">Contato</TableHead>
                        )}
                        <TableHead className="font-semibold text-slate-700">Segmento</TableHead>
                        <TableHead className="font-semibold text-slate-700">Status</TableHead>
                        {!compactMode && (
                            <>
                                <TableHead className="font-semibold text-slate-700">Valor Total</TableHead>
                                <TableHead className="font-semibold text-slate-700">Visitas</TableHead>
                            </>
                        )}
                        {showActions && (
                            <TableHead className="text-right font-semibold text-slate-700">Ações</TableHead>
                        )}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {clients.map((client) => (
                        <TableRow
                            key={client.id}
                            className={`hover:bg-slate-50/50 transition-colors ${isClientSelected(client.id) ? 'bg-blue-50' : ''}`}
                        >
                            {showSelection && (
                                <TableCell>
                                    <Checkbox
                                        checked={isClientSelected(client.id)}
                                        onCheckedChange={() => onClientSelect?.(client.id)}
                                    />
                                </TableCell>
                            )}

                            <TableCell className="py-4">
                                <div>
                                    <p className="font-medium text-slate-900">{client.name}</p>
                                    {!compactMode && client.cpf && (
                                        <p className="text-sm text-slate-500">CPF: {client.cpf}</p>
                                    )}
                                    {!compactMode && client.birthday && (
                                        <p className="text-sm text-slate-500">
                                            Nascimento: {format(new Date(client.birthday), 'dd/MM/yyyy')}
                                        </p>
                                    )}
                                    {compactMode && (
                                        <div className="flex items-center gap-2 mt-1">
                                            {client.phone && (
                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Phone className="w-3 h-3" />
                                                    {client.phone}
                                                </span>
                                            )}
                                            {client.email && (
                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Mail className="w-3 h-3" />
                                                    {client.email}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </TableCell>

                            {!compactMode && (
                                <TableCell className="py-4">
                                    <div className="space-y-1">
                                        {client.phone && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Phone className="w-3 h-3 text-slate-400" />
                                                <span>{client.phone}</span>
                                            </div>
                                        )}
                                        {client.email && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Mail className="w-3 h-3 text-slate-400" />
                                                <span className="truncate max-w-48">{client.email}</span>
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                            )}

                            <TableCell className="py-4">
                                {getSegmentBadge(client.segment)}
                            </TableCell>

                            <TableCell className="py-4">
                                {getStatusBadge(client.status)}
                            </TableCell>

                            {!compactMode && (
                                <>
                                    <TableCell className="py-4">
                                        <div>
                                            <p className="font-medium text-slate-900">
                                                R$ {client.total_spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                LTV Score: {client.ltv_score || 0}
                                            </p>
                                        </div>
                                    </TableCell>

                                    <TableCell className="py-4">
                                        <div>
                                            <p className="font-medium text-slate-900">
                                                {client.total_visits} visitas
                                            </p>
                                            {client.last_visit && (
                                                <p className="text-sm text-slate-500">
                                                    Última: {format(new Date(client.last_visit), 'dd/MM/yyyy')}
                                                </p>
                                            )}
                                        </div>
                                    </TableCell>
                                </>
                            )}

                            {showActions && (
                                <TableCell className="text-right py-4">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56">
                                            <DropdownMenuLabel>Ações</DropdownMenuLabel>

                                            {onViewProfile && (
                                                <DropdownMenuItem
                                                    onClick={() => onViewProfile(client.id)}
                                                    className="cursor-pointer"
                                                >
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    Ver Perfil
                                                </DropdownMenuItem>
                                            )}

                                            {onEdit && (
                                                <DropdownMenuItem
                                                    onClick={() => onEdit(client)}
                                                    className="cursor-pointer"
                                                >
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Editar
                                                </DropdownMenuItem>
                                            )}

                                            <DropdownMenuSeparator />

                                            <DropdownMenuItem asChild className="cursor-pointer">
                                                <Link href={`/agendamentos/novo?clientId=${client.id}`}>
                                                    <Calendar className="mr-2 h-4 w-4" />
                                                    Agendar Consulta
                                                </Link>
                                            </DropdownMenuItem>

                                            <DropdownMenuItem asChild className="cursor-pointer">
                                                <Link href={`/clientes/${client.id}/historico`}>
                                                    <Clock className="mr-2 h-4 w-4" />
                                                    Ver Histórico
                                                </Link>
                                            </DropdownMenuItem>

                                            <DropdownMenuSeparator />

                                            {onDelete && (
                                                <DropdownMenuItem
                                                    onClick={() => onDelete(client.id)}
                                                    className="cursor-pointer text-red-600"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Excluir
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

export default ClientTable