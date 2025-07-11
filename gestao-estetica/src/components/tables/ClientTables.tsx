'use client'

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
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
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
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
    Target,
    Copy,
    MessageCircle,
    Star,
    Loader2,
    ChevronDown,
    ChevronUp,
    ArrowUpDown
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import type { Database } from '@/lib/database/supabase/types'
import { cn } from '@/lib/utils/utils'

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
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    onSort?: (column: string) => void
    onBulkAction?: (action: string, clientIds: string[]) => void
}

interface SortableHeaderProps {
    children: React.ReactNode
    column: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    onSort?: (column: string) => void
    className?: string
}

const SortableHeader: React.FC<SortableHeaderProps> = ({
                                                           children,
                                                           column,
                                                           sortBy,
                                                           sortOrder,
                                                           onSort,
                                                           className
                                                       }) => {
    const isSorted = sortBy === column

    return (
        <TableHead
            className={cn(
                "cursor-pointer select-none hover:bg-slate-100/50 transition-colors font-semibold text-slate-700",
                className
            )}
            onClick={() => onSort?.(column)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSort?.(column)
                }
            }}
            tabIndex={0}
            role="button"
            aria-sort={
                isSorted
                    ? sortOrder === 'asc'
                        ? 'ascending'
                        : 'descending'
                    : 'none'
            }
        >
            <div className="flex items-center gap-2">
                {children}
                {isSorted ? (
                    sortOrder === 'asc' ? (
                        <ChevronUp className="w-4 h-4 text-blue-600" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-blue-600" />
                    )
                ) : (
                    <ArrowUpDown className="w-4 h-4 text-slate-400" />
                )}
            </div>
        </TableHead>
    )
}

const ClientTableSkeleton: React.FC<{ rows?: number; compactMode?: boolean }> = ({
                                                                                     rows = 5,
                                                                                     compactMode = false
                                                                                 }) => (
    <div className="space-y-3" role="status" aria-label="Carregando clientes">
        {[...Array(rows)].map((_, i) => (
            <div key={i} className="animate-pulse">
                <div className={cn(
                    "bg-slate-200 rounded-lg",
                    compactMode ? "h-12" : "h-16"
                )}>
                    <div className="flex items-center p-4 space-x-4">
                        <div className="w-4 h-4 bg-slate-300 rounded"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-slate-300 rounded w-1/4"></div>
                            {!compactMode && <div className="h-3 bg-slate-300 rounded w-1/6"></div>}
                        </div>
                        <div className="w-16 h-6 bg-slate-300 rounded"></div>
                        <div className="w-16 h-6 bg-slate-300 rounded"></div>
                        {!compactMode && (
                            <>
                                <div className="w-20 h-4 bg-slate-300 rounded"></div>
                                <div className="w-16 h-4 bg-slate-300 rounded"></div>
                            </>
                        )}
                        <div className="w-8 h-8 bg-slate-300 rounded"></div>
                    </div>
                </div>
            </div>
        ))}
    </div>
)

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
                                                     compactMode = false,
                                                     sortBy,
                                                     sortOrder,
                                                     onSort,
                                                     onBulkAction
                                                 }) => {
    const [selectAll, setSelectAll] = useState(false)
    const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1)
    const tableRef = useRef<HTMLTableElement>(null)

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!tableRef.current) return

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault()
                    setFocusedRowIndex(prev =>
                        prev < clients.length - 1 ? prev + 1 : prev
                    )
                    break
                case 'ArrowUp':
                    e.preventDefault()
                    setFocusedRowIndex(prev => prev > 0 ? prev - 1 : prev)
                    break
                case 'Enter':
                    if (focusedRowIndex >= 0) {
                        const client = clients[focusedRowIndex]
                        onViewProfile?.(client.id)
                    }
                    break
                case 'Escape':
                    setFocusedRowIndex(-1)
                    break
            }
        }

        if (focusedRowIndex >= 0) {
            document.addEventListener('keydown', handleKeyDown)
        }

        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [focusedRowIndex, clients, onViewProfile])

    const getStatusBadge = useCallback((status: ClientStatus) => {
        const statusConfig = {
            active: {
                label: 'Ativo',
                variant: 'default' as const,
                icon: CheckCircle,
                className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors'
            },
            inactive: {
                label: 'Inativo',
                variant: 'secondary' as const,
                icon: Clock,
                className: 'bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors'
            },
            blocked: {
                label: 'Bloqueado',
                variant: 'destructive' as const,
                icon: XCircle,
                className: 'bg-red-100 text-red-800 hover:bg-red-200 transition-colors'
            }
        }

        const config = statusConfig[status]
        const Icon = config.icon

        return (
            <Badge
                variant={config.variant}
                className={cn("flex items-center gap-1 transition-all duration-200", config.className)}
            >
                <Icon className="w-3 h-3" />
                {config.label}
            </Badge>
        )
    }, [])

    const getSegmentBadge = useCallback((segment: ClientSegment | null) => {
        if (!segment) return null

        const segmentConfig = {
            vip: {
                label: 'VIP',
                icon: Crown,
                className: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 hover:from-amber-600 hover:to-orange-600'
            },
            regular: {
                label: 'Regular',
                icon: Users,
                className: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 hover:from-blue-600 hover:to-blue-700'
            },
            new: {
                label: 'Novo',
                icon: UserPlus,
                className: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 hover:from-green-600 hover:to-emerald-600'
            },
            at_risk: {
                label: 'Em Risco',
                icon: AlertTriangle,
                className: 'bg-gradient-to-r from-red-500 to-red-600 text-white border-0 hover:from-red-600 hover:to-red-700'
            },
            lost: {
                label: 'Perdido',
                icon: XCircle,
                className: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0 hover:from-gray-600 hover:to-gray-700'
            }
        }

        const config = segmentConfig[segment]
        const Icon = config.icon

        return (
            <Badge className={cn("flex items-center gap-1 transition-all duration-200", config.className)}>
                <Icon className="w-3 h-3" />
                {config.label}
            </Badge>
        )
    }, [])

    const handleSelectAll = useCallback((checked: boolean) => {
        setSelectAll(checked)
        onSelectAll?.(checked)
    }, [onSelectAll])

    const isClientSelected = useCallback((clientId: string) => {
        return selectedClients.includes(clientId)
    }, [selectedClients])

    const copyToClipboard = useCallback(async (text: string, type: string) => {
        try {
            await navigator.clipboard.writeText(text)
            // Could show toast here
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }, [])

    const BulkActionsBar = useMemo(() => {
        if (!showSelection || selectedClients.length === 0) return null

        return (
            <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white border rounded-lg shadow-lg p-4 z-50 animate-in slide-in-from-bottom-2">
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">
                        {selectedClients.length} cliente(s) selecionado(s)
                    </span>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onBulkAction?.('export', selectedClients)}
                        >
                            Exportar
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onBulkAction?.('message', selectedClients)}
                        >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Mensagem
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onBulkAction?.('delete', selectedClients)}
                        >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Excluir
                        </Button>
                    </div>
                </div>
            </div>
        )
    }, [showSelection, selectedClients, onBulkAction])

    if (loading) {
        return (
            <>
                <ClientTableSkeleton rows={7} compactMode={compactMode} />
                <div className="sr-only" aria-live="polite">
                    Carregando lista de clientes...
                </div>
            </>
        )
    }

    if (clients.length === 0) {
        return (
            <div className="text-center py-12" role="status">
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
        <TooltipProvider>
            <div className="overflow-x-auto">
                <Table ref={tableRef} role="table" aria-label="Lista de clientes">
                    <TableHeader>
                        <TableRow className="bg-slate-50/50 hover:bg-slate-50">
                            {showSelection && (
                                <TableHead className="w-12">
                                    <Checkbox
                                        checked={selectAll}
                                        onCheckedChange={handleSelectAll}
                                        aria-label="Selecionar todos os clientes"
                                    />
                                </TableHead>
                            )}

                            <SortableHeader
                                column="name"
                                sortBy={sortBy}
                                sortOrder={sortOrder}
                                onSort={onSort}
                            >
                                Cliente
                            </SortableHeader>

                            {!compactMode && (
                                <TableHead className="font-semibold text-slate-700">
                                    Contato
                                </TableHead>
                            )}

                            <SortableHeader
                                column="segment"
                                sortBy={sortBy}
                                sortOrder={sortOrder}
                                onSort={onSort}
                            >
                                Segmento
                            </SortableHeader>

                            <SortableHeader
                                column="status"
                                sortBy={sortBy}
                                sortOrder={sortOrder}
                                onSort={onSort}
                            >
                                Status
                            </SortableHeader>

                            {!compactMode && (
                                <>
                                    <SortableHeader
                                        column="total_spent"
                                        sortBy={sortBy}
                                        sortOrder={sortOrder}
                                        onSort={onSort}
                                    >
                                        Valor Total
                                    </SortableHeader>

                                    <SortableHeader
                                        column="total_visits"
                                        sortBy={sortBy}
                                        sortOrder={sortOrder}
                                        onSort={onSort}
                                    >
                                        Visitas
                                    </SortableHeader>
                                </>
                            )}

                            {showActions && (
                                <TableHead className="text-right font-semibold text-slate-700">
                                    Ações
                                </TableHead>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clients.map((client, index) => (
                            <TableRow
                                key={client.id}
                                className={cn(
                                    "hover:bg-slate-50/50 transition-all duration-200 cursor-pointer group",
                                    isClientSelected(client.id) && "bg-blue-50 hover:bg-blue-100",
                                    focusedRowIndex === index && "ring-2 ring-blue-500 ring-offset-1"
                                )}
                                onClick={() => onViewProfile?.(client.id)}
                                onFocus={() => setFocusedRowIndex(index)}
                                tabIndex={0}
                                role="row"
                                aria-label={`Cliente ${client.name}`}
                            >
                                {showSelection && (
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            checked={isClientSelected(client.id)}
                                            onCheckedChange={() => onClientSelect?.(client.id)}
                                            aria-label={`Selecionar ${client.name}`}
                                        />
                                    </TableCell>
                                )}

                                <TableCell className="py-4">
                                    <div className="group-hover:translate-x-1 transition-transform duration-200">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                                {client.name.charAt(0).toUpperCase()}
                                            </div>
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
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <span className="text-xs text-slate-500 flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors">
                                                                        <Phone className="w-3 h-3" />
                                                                        {client.phone}
                                                                    </span>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Clique para copiar</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                        {client.email && (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <span className="text-xs text-slate-500 flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors">
                                                                        <Mail className="w-3 h-3" />
                                                                        {client.email}
                                                                    </span>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Clique para copiar</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>

                                {!compactMode && (
                                    <TableCell className="py-4">
                                        <div className="space-y-1">
                                            {client.phone && (
                                                <div className="flex items-center gap-2 text-sm group/contact">
                                                    <Phone className="w-3 h-3 text-slate-400" />
                                                    <span
                                                        className="cursor-pointer hover:text-blue-600 transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            copyToClipboard(client.phone!, 'telefone')
                                                        }}
                                                    >
                                                        {client.phone}
                                                    </span>
                                                    <Copy className="w-3 h-3 opacity-0 group-hover/contact:opacity-100 transition-opacity text-slate-400" />
                                                </div>
                                            )}
                                            {client.email && (
                                                <div className="flex items-center gap-2 text-sm group/contact">
                                                    <Mail className="w-3 h-3 text-slate-400" />
                                                    <span
                                                        className="truncate max-w-48 cursor-pointer hover:text-blue-600 transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            copyToClipboard(client.email!, 'email')
                                                        }}
                                                    >
                                                        {client.email}
                                                    </span>
                                                    <Copy className="w-3 h-3 opacity-0 group-hover/contact:opacity-100 transition-opacity text-slate-400" />
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
                                                <div className="flex items-center gap-1">
                                                    <Star className="w-3 h-3 text-amber-500" />
                                                    <p className="text-sm text-slate-500">
                                                        LTV: {client.ltv_score || 0}
                                                    </p>
                                                </div>
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
                                    <TableCell className="text-right py-4" onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            className="h-8 w-8 p-0 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all duration-200"
                                                            aria-label={`Ações para ${client.name}`}
                                                        >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Mais ações</p>
                                                </TooltipContent>
                                            </Tooltip>

                                            <DropdownMenuContent align="end" className="w-56">
                                                <DropdownMenuLabel>Ações do Cliente</DropdownMenuLabel>

                                                {onViewProfile && (
                                                    <DropdownMenuItem
                                                        onClick={() => onViewProfile(client.id)}
                                                        className="cursor-pointer"
                                                    >
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Ver Perfil Completo
                                                    </DropdownMenuItem>
                                                )}

                                                {onEdit && (
                                                    <DropdownMenuItem
                                                        onClick={() => onEdit(client)}
                                                        className="cursor-pointer"
                                                    >
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Editar Informações
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

                                                {client.phone && (
                                                    <DropdownMenuItem
                                                        onClick={() => window.open(`https://wa.me/${client.phone?.replace(/\D/g, '')}`)}
                                                        className="cursor-pointer"
                                                    >
                                                        <MessageCircle className="mr-2 h-4 w-4" />
                                                        WhatsApp
                                                    </DropdownMenuItem>
                                                )}

                                                <DropdownMenuSeparator />

                                                {onDelete && (
                                                    <DropdownMenuItem
                                                        onClick={() => onDelete(client.id)}
                                                        className="cursor-pointer text-red-600 focus:text-red-600"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Excluir Cliente
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
                {BulkActionsBar}
            </div>
        </TooltipProvider>
    )
}

export default ClientTable