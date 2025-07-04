'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Calendar,
    ArrowLeft,
    Clock,
    DollarSign,
    Star,
    CheckCircle,
    Filter,
    Download,
    Search,
    TrendingUp,
    Activity,
    MessageSquare,
    Mail,
    CalendarDays,
    CreditCard,
    FileText,
    User,
    BarChart3,
    PieChart,
    Target,
    Zap,
    Gift,
    RefreshCw
} from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { format, subDays, isBefore, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import type { Database } from '@/lib/database/supabase/types'
import { useClient } from "@/lib/hooks/useClients"
import { Sidebar } from '@/components/layout/sidebar'

type Client = Database['public']['Tables']['clients']['Row']

interface HistoryEvent {
    id: string
    type: 'appointment' | 'payment' | 'communication' | 'note' | 'campaign'
    date: string
    title: string
    description: string
    value?: number
    status?: 'completed' | 'cancelled' | 'no_show' | 'pending'
    rating?: number
    metadata?: Record<string, any>
}

const ClientHistoryPage: React.FC = () => {
    const params = useParams()
    const clientId = params.id as string

    const [activeTab, setActiveTab] = useState('timeline')
    const [filterType, setFilterType] = useState<string>('all')
    const [filterPeriod, setFilterPeriod] = useState<string>('all')
    const [searchTerm, setSearchTerm] = useState('')

    // Hooks
    const { data: client, isLoading, error } = useClient(clientId)

    // Mock data para histórico completo
    const [historyEvents] = useState<HistoryEvent[]>([
        {
            id: '1',
            type: 'appointment',
            date: '2024-04-25T14:00:00',
            title: 'Limpeza de Pele Profunda',
            description: 'Procedimento realizado com sucesso. Cliente muito satisfeita com o resultado.',
            value: 150.00,
            status: 'completed',
            rating: 5,
            metadata: { duration: 90, professional: 'Dra. Maria Silva' }
        },
        {
            id: '2',
            type: 'payment',
            date: '2024-04-25T14:30:00',
            title: 'Pagamento Recebido - PIX',
            description: 'Pagamento via PIX processado automaticamente.',
            value: 150.00,
            status: 'completed'
        },
        {
            id: '3',
            type: 'communication',
            date: '2024-04-24T10:00:00',
            title: 'WhatsApp - Lembrete de Consulta',
            description: 'Lembrete automático enviado 24h antes da consulta.',
            metadata: { channel: 'whatsapp', read: true }
        },
        {
            id: '4',
            type: 'appointment',
            date: '2024-03-20T15:30:00',
            title: 'Hidratação Facial',
            description: 'Primeira hidratação. Cliente relatou pele ressecada.',
            value: 120.00,
            status: 'completed',
            rating: 4,
            metadata: { duration: 60, professional: 'Dra. Ana Costa' }
        },
        {
            id: '5',
            type: 'campaign',
            date: '2024-03-15T09:00:00',
            title: 'Email - Promoção Março',
            description: 'Campanha promocional de março enviada. Taxa de abertura registrada.',
            metadata: { channel: 'email', opened: true, clicked: false }
        },
        {
            id: '6',
            type: 'note',
            date: '2024-03-20T16:00:00',
            title: 'Observação Adicionada',
            description: 'Cliente prefere horários vespertinos. Alérgica a produtos com álcool.',
            metadata: { author: 'Dra. Ana Costa' }
        },
        {
            id: '7',
            type: 'appointment',
            date: '2024-02-15T14:00:00',
            title: 'Peeling Químico',
            description: 'Primeira consulta da cliente. Avaliação inicial realizada.',
            value: 250.00,
            status: 'completed',
            rating: 5,
            metadata: { duration: 120, professional: 'Dra. Maria Silva', isFirstVisit: true }
        },
        {
            id: '8',
            type: 'communication',
            date: '2024-02-14T18:00:00',
            title: 'WhatsApp - Confirmação de Agendamento',
            description: 'Cliente confirmou presença para primeira consulta.',
            metadata: { channel: 'whatsapp', read: true }
        }
    ])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <Sidebar />
                <div className="lg:ml-64">
                    <div className="flex items-center justify-center h-64">
                        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                </div>
            </div>
        )
    }

    if (error || !client) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <Sidebar />
                <div className="lg:ml-64">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <h2 className="text-xl font-semibold text-slate-900 mb-2">Cliente não encontrado</h2>
                            <p className="text-slate-600 mb-4">Não foi possível carregar o histórico.</p>
                            <Link href="/clientes">
                                <Button>Voltar para Clientes</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Filtrar eventos
    const filteredEvents = historyEvents.filter(event => {
        // Filtro por tipo
        if (filterType !== 'all' && event.type !== filterType) return false

        // Filtro por período
        if (filterPeriod !== 'all') {
            const eventDate = parseISO(event.date)
            const now = new Date()
            switch (filterPeriod) {
                case '7days':
                    if (isBefore(eventDate, subDays(now, 7))) return false
                    break
                case '30days':
                    if (isBefore(eventDate, subDays(now, 30))) return false
                    break
                case '90days':
                    if (isBefore(eventDate, subDays(now, 90))) return false
                    break
            }
        }

        // Filtro por busca
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase()
            if (!event.title.toLowerCase().includes(searchLower) &&
                !event.description.toLowerCase().includes(searchLower)) {
                return false
            }
        }

        return true
    })

    const getEventIcon = (type: HistoryEvent['type']) => {
        const icons = {
            appointment: CalendarDays,
            payment: CreditCard,
            communication: MessageSquare,
            note: FileText,
            campaign: Mail
        }
        return icons[type] || Activity
    }

    const getEventColor = (type: HistoryEvent['type']) => {
        const colors = {
            appointment: 'from-blue-500 to-blue-600',
            payment: 'from-green-500 to-emerald-500',
            communication: 'from-purple-500 to-purple-600',
            note: 'from-amber-500 to-orange-500',
            campaign: 'from-pink-500 to-rose-500'
        }
        return colors[type] || 'from-slate-500 to-slate-600'
    }

    const getStatusBadge = (status?: string) => {
        if (!status) return null

        const statusConfig = {
            completed: { label: 'Concluído', variant: 'default' as const },
            cancelled: { label: 'Cancelado', variant: 'destructive' as const },
            no_show: { label: 'Não Compareceu', variant: 'destructive' as const },
            pending: { label: 'Pendente', variant: 'secondary' as const }
        }

        const config = statusConfig[status as keyof typeof statusConfig]
        return config ? <Badge variant={config.variant}>{config.label}</Badge> : null
    }

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }

    // Estatísticas do histórico
    const stats = {
        totalEvents: filteredEvents.length,
        appointments: filteredEvents.filter(e => e.type === 'appointment').length,
        payments: filteredEvents.filter(e => e.type === 'payment').length,
        communications: filteredEvents.filter(e => e.type === 'communication').length,
        totalValue: filteredEvents.filter(e => e.value).reduce((sum, e) => sum + (e.value || 0), 0),
        avgRating: filteredEvents.filter(e => e.rating).length > 0
            ? filteredEvents.filter(e => e.rating).reduce((sum, e) => sum + (e.rating || 0), 0) / filteredEvents.filter(e => e.rating).length
            : 0
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            <Sidebar />

            <div className="lg:ml-64">
                {/* Header */}
                <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
                    <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <Link href={`/clientes/${clientId}`}>
                                    <Button variant="ghost" size="sm" className="p-2">
                                        <ArrowLeft className="w-4 h-4" />
                                    </Button>
                                </Link>
                                <div className="flex items-center gap-4">
                                    <Avatar className="w-12 h-12">
                                        <AvatarImage src="" />
                                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold">
                                            {getInitials(client.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                            Histórico - {client.name}
                                        </h1>
                                        <p className="text-slate-600 text-xs sm:text-sm font-medium">
                                            Cronologia completa de interações e atividades
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        toast.info('Exportando histórico...')
                                    }}
                                    className="bg-white border-slate-200 hover:bg-slate-50"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Exportar
                                </Button>

                                <Link href={`/agendamentos/novo?clientId=${clientId}`}>
                                    <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25 border-0">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        Agendar
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">

                        {/* Estatísticas do Histórico */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                            <Card className="relative overflow-hidden border-0 shadow-xl shadow-slate-200/60">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-5" />
                                <CardContent className="p-4 lg:p-6 relative">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="p-2 lg:p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                                            <Activity className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                                        </div>
                                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs lg:text-sm font-medium text-slate-600">Total de Eventos</p>
                                        <p className="text-xl lg:text-3xl font-bold text-slate-900">{stats.totalEvents}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="relative overflow-hidden border-0 shadow-xl shadow-slate-200/60">
                                <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 opacity-5" />
                                <CardContent className="p-4 lg:p-6 relative">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="p-2 lg:p-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg">
                                            <DollarSign className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                                        </div>
                                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs lg:text-sm font-medium text-slate-600">Valor Total</p>
                                        <p className="text-xl lg:text-3xl font-bold text-slate-900">
                                            R$ {stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="relative overflow-hidden border-0 shadow-xl shadow-slate-200/60">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 opacity-5" />
                                <CardContent className="p-4 lg:p-6 relative">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="p-2 lg:p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                                            <CalendarDays className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                                        </div>
                                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs lg:text-sm font-medium text-slate-600">Agendamentos</p>
                                        <p className="text-xl lg:text-3xl font-bold text-slate-900">{stats.appointments}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="relative overflow-hidden border-0 shadow-xl shadow-slate-200/60">
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500 opacity-5" />
                                <CardContent className="p-4 lg:p-6 relative">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="p-2 lg:p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
                                            <Star className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                                        </div>
                                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs lg:text-sm font-medium text-slate-600">Avaliação Média</p>
                                        <p className="text-xl lg:text-3xl font-bold text-slate-900">
                                            {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : 'N/A'}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Filtros */}
                        <Card className="border-0 shadow-xl shadow-slate-200/60">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                <CardTitle className="flex items-center gap-2">
                                    <Filter className="w-5 h-5 text-indigo-500" />
                                    Filtros de Histórico
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="flex flex-col lg:flex-row gap-4">
                                    <div className="flex-1">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                            <Input
                                                placeholder="Buscar no histórico..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <Select value={filterType} onValueChange={setFilterType}>
                                            <SelectTrigger className="w-full sm:w-48">
                                                <SelectValue placeholder="Tipo de evento" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos os tipos</SelectItem>
                                                <SelectItem value="appointment">Agendamentos</SelectItem>
                                                <SelectItem value="payment">Pagamentos</SelectItem>
                                                <SelectItem value="communication">Comunicação</SelectItem>
                                                <SelectItem value="note">Observações</SelectItem>
                                                <SelectItem value="campaign">Campanhas</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                                            <SelectTrigger className="w-full sm:w-48">
                                                <SelectValue placeholder="Período" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos os períodos</SelectItem>
                                                <SelectItem value="7days">Últimos 7 dias</SelectItem>
                                                <SelectItem value="30days">Últimos 30 dias</SelectItem>
                                                <SelectItem value="90days">Últimos 90 dias</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tabs de Visualização */}
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                            <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 rounded-xl">
                                <TabsTrigger value="timeline" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
                                    Timeline
                                </TabsTrigger>
                                <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
                                    Analytics
                                </TabsTrigger>
                                <TabsTrigger value="summary" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
                                    Resumo
                                </TabsTrigger>
                            </TabsList>

                            {/* Tab: Timeline */}
                            <TabsContent value="timeline" className="space-y-6">
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="flex items-center gap-2">
                                                <Clock className="w-5 h-5 text-blue-500" />
                                                Timeline de Atividades
                                            </CardTitle>
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                {filteredEvents.length} eventos
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        {filteredEvents.length === 0 ? (
                                            <div className="text-center py-12">
                                                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                                    Nenhum evento encontrado
                                                </h3>
                                                <p className="text-slate-500">
                                                    Tente ajustar os filtros para ver mais eventos.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                {filteredEvents.map((event, index) => {
                                                    const Icon = getEventIcon(event.type)
                                                    const isLast = index === filteredEvents.length - 1

                                                    return (
                                                        <div key={event.id} className="relative">
                                                            {/* Timeline line */}
                                                            {!isLast && (
                                                                <div className="absolute left-6 top-12 w-0.5 h-16 bg-slate-200"></div>
                                                            )}

                                                            <div className="flex gap-4">
                                                                {/* Icon */}
                                                                <div className={`flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br ${getEventColor(event.type)} flex items-center justify-center shadow-lg`}>
                                                                    <Icon className="w-6 h-6 text-white" />
                                                                </div>

                                                                {/* Content */}
                                                                <div className="flex-1 min-w-0">
                                                                    <Card className="border border-slate-200 hover:shadow-md transition-shadow">
                                                                        <CardContent className="p-4">
                                                                            <div className="flex items-start justify-between mb-2">
                                                                                <div>
                                                                                    <h3 className="font-semibold text-slate-900">{event.title}</h3>
                                                                                    <p className="text-sm text-slate-500">
                                                                                        {format(parseISO(event.date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                                                                    </p>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    {event.value && (
                                                                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                                                            R$ {event.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                                        </Badge>
                                                                                    )}
                                                                                    {getStatusBadge(event.status)}
                                                                                </div>
                                                                            </div>

                                                                            <p className="text-sm text-slate-700 mb-3">{event.description}</p>

                                                                            {/* Rating */}
                                                                            {event.rating && (
                                                                                <div className="flex items-center gap-2 mb-3">
                                                                                    <span className="text-sm font-medium text-slate-600">Avaliação:</span>
                                                                                    <div className="flex items-center gap-1">
                                                                                        {[...Array(5)].map((_, i) => (
                                                                                            <Star
                                                                                                key={i}
                                                                                                className={`w-4 h-4 ${
                                                                                                    i < event.rating! ? 'text-yellow-400 fill-current' : 'text-slate-300'
                                                                                                }`}
                                                                                            />
                                                                                        ))}
                                                                                        <span className="text-sm text-slate-600 ml-1">
                                                                                            {event.rating}/5
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                            {/* Metadata */}
                                                                            {event.metadata && Object.keys(event.metadata).length > 0 && (
                                                                                <div className="border-t pt-3 mt-3">
                                                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                                                        {Object.entries(event.metadata).map(([key, value]) => (
                                                                                            <div key={key} className="flex justify-between">
                                                                                                <span className="text-slate-500 capitalize">{key}:</span>
                                                                                                <span className="text-slate-700 font-medium">
                                                                                                    {typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : String(value)}
                                                                                                </span>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </CardContent>
                                                                    </Card>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Tab: Analytics */}
                            <TabsContent value="analytics" className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Distribuição por Tipo */}
                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                            <CardTitle className="flex items-center gap-2">
                                                <PieChart className="w-5 h-5 text-purple-500" />
                                                Distribuição por Tipo
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-4">
                                                {[
                                                    { type: 'appointment', label: 'Agendamentos', count: stats.appointments, color: 'bg-blue-500' },
                                                    { type: 'payment', label: 'Pagamentos', count: stats.payments, color: 'bg-green-500' },
                                                    { type: 'communication', label: 'Comunicação', count: stats.communications, color: 'bg-purple-500' },
                                                    { type: 'note', label: 'Observações', count: filteredEvents.filter(e => e.type === 'note').length, color: 'bg-amber-500' },
                                                    { type: 'campaign', label: 'Campanhas', count: filteredEvents.filter(e => e.type === 'campaign').length, color: 'bg-pink-500' }
                                                ].map(({ type, label, count, color }) => {
                                                    const percentage = stats.totalEvents > 0 ? (count / stats.totalEvents * 100) : 0

                                                    return (
                                                        <div key={type} className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-3 h-3 rounded-full ${color}`} />
                                                                <span className="text-sm font-medium text-slate-700">{label}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm text-slate-500">{percentage.toFixed(1)}%</span>
                                                                <span className="text-sm font-semibold text-slate-900">{count}</span>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Atividade por Mês */}
                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                            <CardTitle className="flex items-center gap-2">
                                                <BarChart3 className="w-5 h-5 text-indigo-500" />
                                                Atividade por Mês
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-4">
                                                {[
                                                    { month: 'Abril 2024', events: 4, value: 150 },
                                                    { month: 'Março 2024', events: 3, value: 120 },
                                                    { month: 'Fevereiro 2024', events: 3, value: 250 }
                                                ].map((month, index) => (
                                                    <div key={index} className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm font-medium text-slate-700">{month.month}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm text-slate-500">{month.events} eventos</span>
                                                                <span className="text-sm font-semibold text-green-600">
                                                                    R$ {month.value.toFixed(0)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="w-full bg-slate-200 rounded-full h-2">
                                                            <div
                                                                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all"
                                                                style={{ width: `${(month.events / Math.max(...[4, 3, 3])) * 100}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Métricas de Engajamento */}
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                        <CardTitle className="flex items-center gap-2">
                                            <Target className="w-5 h-5 text-green-500" />
                                            Métricas de Engajamento
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                                                <div className="text-2xl font-bold text-blue-600 mb-1">100%</div>
                                                <div className="text-sm text-blue-800">Taxa de Comparecimento</div>
                                            </div>
                                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                                <div className="text-2xl font-bold text-green-600 mb-1">4.7</div>
                                                <div className="text-sm text-green-800">Avaliação Média</div>
                                            </div>
                                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                                                <div className="text-2xl font-bold text-purple-600 mb-1">95%</div>
                                                <div className="text-sm text-purple-800">Taxa de Resposta</div>
                                            </div>
                                            <div className="text-center p-4 bg-amber-50 rounded-lg">
                                                <div className="text-2xl font-bold text-amber-600 mb-1">3</div>
                                                <div className="text-sm text-amber-800">Meses de Relacionamento</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Tab: Resumo */}
                            <TabsContent value="summary" className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Jornada do Cliente */}
                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                                            <CardTitle className="flex items-center gap-2 text-blue-800">
                                                <User className="w-5 h-5" />
                                                Jornada do Cliente
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                                    <div>
                                                        <p className="font-medium text-green-800">Primeira Consulta</p>
                                                        <p className="text-sm text-green-600">15/02/2024 - Peeling Químico</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                                                    <CheckCircle className="w-5 h-5 text-blue-600" />
                                                    <div>
                                                        <p className="font-medium text-blue-800">Cliente Regular</p>
                                                        <p className="text-sm text-blue-600">Retornou após 33 dias</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                                                    <CheckCircle className="w-5 h-5 text-purple-600" />
                                                    <div>
                                                        <p className="font-medium text-purple-800">Cliente Fidelizado</p>
                                                        <p className="text-sm text-purple-600">3 consultas realizadas</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Próximas Ações Sugeridas */}
                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                                            <CardTitle className="flex items-center gap-2 text-amber-800">
                                                <Zap className="w-5 h-5" />
                                                Próximas Ações Sugeridas
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3 p-3 bg-white border border-amber-200 rounded-lg">
                                                    <Calendar className="w-5 h-5 text-amber-600" />
                                                    <div>
                                                        <p className="font-medium text-slate-900">Agendar Retorno</p>
                                                        <p className="text-sm text-slate-600">Sugerido para próxima semana</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 p-3 bg-white border border-green-200 rounded-lg">
                                                    <Gift className="w-5 h-5 text-green-600" />
                                                    <div>
                                                        <p className="font-medium text-slate-900">Programa de Fidelidade</p>
                                                        <p className="text-sm text-slate-600">Oferecer desconto por fidelidade</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 p-3 bg-white border border-blue-200 rounded-lg">
                                                    <MessageSquare className="w-5 h-5 text-blue-600" />
                                                    <div>
                                                        <p className="font-medium text-slate-900">Pesquisa de Satisfação</p>
                                                        <p className="text-sm text-slate-600">Enviar após última consulta</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Resumo Geral */}
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-indigo-500" />
                                            Resumo Executivo
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="prose prose-sm max-w-none">
                                            <p className="text-slate-700 leading-relaxed">
                                                <strong>{client.name}</strong> é uma cliente muito engajada que iniciou sua jornada conosco em
                                                fevereiro de 2024. Com um histórico de <strong>3 consultas realizadas</strong> e valor total
                                                investido de <strong>R$ {stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>,
                                                demonstra alta satisfação com nossos serviços (avaliação média de <strong>{stats.avgRating.toFixed(1)} estrelas</strong>).
                                            </p>
                                            <p className="text-slate-700 leading-relaxed mt-4">
                                                A cliente apresenta excelente taxa de comparecimento (100%) e responde positivamente às
                                                nossas comunicações. Recomendamos manter o relacionamento próximo e oferecer novos
                                                tratamentos baseados em suas preferências registradas.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </div>
        </div>
    )
}
export default ClientHistoryPage