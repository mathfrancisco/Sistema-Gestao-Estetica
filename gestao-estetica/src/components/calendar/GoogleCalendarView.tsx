'use client'

import React, { useState, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Clock,
    Phone,
    Calendar as CalendarIcon,
    RefreshCw,
    Settings,
    Loader2,
    Search,
    Eye,
    ExternalLink,
    MapPin,
    Users,
    CheckCircle,
    AlertCircle,
    Wifi,
    WifiOff,
    Zap,
    Calendar as GoogleCalendarIcon, Cloud
} from 'lucide-react'
import { format, startOfDay, endOfDay, addDays, isSameDay, isToday, isTomorrow, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils/utils'
import { useGoogleCalendar, GoogleCalendarEvent } from '@/lib/hooks/useGoogleCalendar'

import { useAuthStore } from '@/store/useAuthStore'
import type { Database } from '@/lib/database/supabase/types'
import {useAppointments} from "@/lib/hooks/useAppointment";

type AppointmentWithDetails = Database['public']['Tables']['appointments']['Row'] & {
    client_name: string
    client_phone?: string
    procedure_name: string
}

const GoogleCalendarView: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'google' | 'system'>('all')

    const { user, hasGoogleCalendar } = useAuthStore()

    const {
        events,
        loading: calendarLoading,
        error: calendarError,
        getEvents,
        refreshEvents,
        getEventsForDate,
        clearError
    } = useGoogleCalendar()

    const {
        getAppointmentsByDate,
        loading: appointmentsLoading
    } = useAppointments({ userId: user?.id })

    const [dayAppointments, setDayAppointments] = useState<AppointmentWithDetails[]>([])

    // Buscar eventos do Google Calendar ao montar o componente
    useEffect(() => {
        if (hasGoogleCalendar()) {
            const today = new Date()
            const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())

            getEvents(
                today.toISOString(),
                nextMonth.toISOString(),
                100
            )
        }
    }, [hasGoogleCalendar, getEvents])

    // Buscar agendamentos do dia selecionado
    useEffect(() => {
        const fetchDayAppointments = async () => {
            if (user?.id) {
                const dateString = format(selectedDate, 'yyyy-MM-dd')
                const appointments = await getAppointmentsByDate(dateString)
                setDayAppointments(appointments as AppointmentWithDetails[])
            }
        }

        fetchDayAppointments()
    }, [selectedDate, getAppointmentsByDate, user?.id])

    // Filtrar eventos do dia selecionado
    const dayEvents = getEventsForDate(selectedDate)

    // Aplicar filtros de busca
    const filteredEvents = dayEvents.filter(event => {
        if (searchTerm && !event.summary.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false
        }
        return true
    })

    const filteredAppointments = dayAppointments.filter(appointment => {
        if (searchTerm && !appointment.client_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !appointment.procedure_name.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false
        }
        return true
    })

    // Sincronizar calendário
    const handleSync = async () => {
        try {
            await refreshEvents()
        } catch (error) {
            console.error('Erro ao sincronizar:', error)
        }
    }

    const getDateLabel = (date: Date) => {
        if (isToday(date)) return 'Hoje'
        if (isTomorrow(date)) return 'Amanhã'
        if (isYesterday(date)) return 'Ontem'
        return format(date, "d 'de' MMMM", { locale: ptBR })
    }

    const getEventsCount = (date: Date) => {
        const googleCount = events.filter(event => isSameDay(new Date(event.start.dateTime), date)).length
        const systemCount = dayAppointments.filter(apt => isSameDay(new Date(apt.scheduled_datetime), date)).length
        return googleCount + systemCount
    }

    // Renderizar visualização do mês
    const renderMonthView = () => (
        <Card className="h-fit">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <CalendarIcon className="w-5 h-5 text-blue-600" />
                    Calendário
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-xl border-0"
                    modifiers={{
                        hasEvents: (date) => getEventsCount(date) > 0,
                        today: (date) => isToday(date)
                    }}
                    modifiersClassNames={{
                        hasEvents: "bg-blue-100 text-blue-900 font-semibold hover:bg-blue-200 relative after:absolute after:bottom-1 after:left-1/2 after:transform after:-translate-x-1/2 after:w-1 after:h-1 after:bg-blue-600 after:rounded-full",
                        today: "bg-gradient-to-br from-purple-500 to-blue-600 text-white font-bold hover:from-purple-600 hover:to-blue-700"
                    }}
                />
            </CardContent>
        </Card>
    )

    // Renderizar eventos do dia
    const renderDayEvents = () => (
        <div className="space-y-6">
            {/* Header do dia */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                        {getDateLabel(selectedDate)}
                    </h2>
                    <p className="text-slate-600">
                        {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                        className="hover:scale-105 transition-transform duration-200"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDate(new Date())}
                        className="hover:scale-105 transition-transform duration-200"
                    >
                        Hoje
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                        className="hover:scale-105 transition-transform duration-200"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Filtros e busca */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Buscar eventos e agendamentos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-10 border-slate-300 focus:border-blue-500"
                    />
                </div>
                <Tabs value={selectedFilter} onValueChange={(value) => setSelectedFilter(value as any)} className="w-auto">
                    <TabsList className="bg-slate-100">
                        <TabsTrigger value="all" className="text-sm">Todos</TabsTrigger>
                        <TabsTrigger value="google" className="text-sm">Google</TabsTrigger>
                        <TabsTrigger value="system" className="text-sm">Sistema</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Estatísticas do dia */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/80 rounded-2xl border border-blue-200">
                    <div className="flex items-center gap-2 mb-1">
                        <GoogleCalendarIcon className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">Google</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{filteredEvents.length}</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100/80 rounded-2xl border border-green-200">
                    <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Sistema</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">{filteredAppointments.length}</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/80 rounded-2xl border border-purple-200">
                    <div className="flex items-center gap-2 mb-1">
                        <Cloud className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">Sincronizados</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">
                        {filteredAppointments.filter(apt => apt.calendar_synced).length}
                    </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100/80 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-slate-600" />
                        <span className="text-sm font-medium text-slate-700">Total</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-600">
                        {filteredEvents.length + filteredAppointments.length}
                    </div>
                </div>
            </div>

            {/* Eventos do Google Calendar */}
            {(selectedFilter === 'all' || selectedFilter === 'google') && filteredEvents.length > 0 && (
                <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-white">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                                <GoogleCalendarIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">Eventos do Google Calendar</h3>
                                <p className="text-sm text-blue-600 font-normal">{filteredEvents.length} evento(s)</p>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {filteredEvents.map((event) => (
                            <div
                                key={event.id}
                                className="group p-4 bg-white rounded-xl border border-blue-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 hover:scale-[1.02]"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="font-semibold text-blue-900">{event.summary}</h4>
                                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                                                Google
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-blue-700">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {format(new Date(event.start.dateTime), 'HH:mm')} -
                                                {format(new Date(event.end.dateTime), 'HH:mm')}
                                            </span>
                                            {event.attendees && event.attendees.length > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-4 h-4" />
                                                    {event.attendees.length} participante(s)
                                                </span>
                                            )}
                                            {event.location && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-4 h-4" />
                                                    {event.location}
                                                </span>
                                            )}
                                        </div>
                                        {event.description && (
                                            <p className="text-sm text-blue-600 mt-2 bg-blue-50 p-2 rounded-lg">{event.description}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => window.open(event.htmlLink, '_blank')}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-blue-100 hover:text-blue-600"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Agendamentos do Sistema */}
            {(selectedFilter === 'all' || selectedFilter === 'system') && filteredAppointments.length > 0 && (
                <Card className="border-green-200 bg-gradient-to-br from-green-50/50 to-white">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-green-100 text-green-600">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">Agendamentos do Sistema</h3>
                                <p className="text-sm text-green-600 font-normal">{filteredAppointments.length} agendamento(s)</p>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {filteredAppointments.map((appointment) => (
                            <div
                                key={appointment.id}
                                className="group p-4 bg-white rounded-xl border border-green-200 hover:border-green-300 hover:shadow-md transition-all duration-300 hover:scale-[1.02]"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="font-semibold text-green-900">{appointment.client_name}</h4>
                                            <Badge
                                                variant={appointment.calendar_synced ? "default" : "destructive"}
                                                className={appointment.calendar_synced
                                                    ? "bg-green-100 text-green-800 border-green-200"
                                                    : "bg-yellow-100 text-yellow-800 border-yellow-200"
                                                }
                                            >
                                                {appointment.calendar_synced ? (
                                                    <>
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        Sincronizado
                                                    </>
                                                ) : (
                                                    <>
                                                        <AlertCircle className="w-3 h-3 mr-1" />
                                                        Não Sincronizado
                                                    </>
                                                )}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-green-700 font-medium mb-2">{appointment.procedure_name}</p>
                                        <div className="flex items-center gap-4 text-sm text-green-600">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {format(new Date(appointment.scheduled_datetime), 'HH:mm')}
                                                <span className="text-slate-500">({appointment.duration_minutes}min)</span>
                                            </span>
                                            {appointment.client_phone && (
                                                <span className="flex items-center gap-1">
                                                    <Phone className="w-4 h-4" />
                                                    {appointment.client_phone}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-green-100 hover:text-green-600"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Estado vazio */}
            {filteredEvents.length === 0 && filteredAppointments.length === 0 && !appointmentsLoading && (
                <Card className="border-slate-200">
                    <CardContent className="py-16 text-center">
                        <div className="max-w-md mx-auto">
                            <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CalendarIcon className="w-10 h-10 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 mb-3">
                                {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum evento agendado'}
                            </h3>
                            <p className="text-slate-500 mb-6">
                                {searchTerm
                                    ? `Não encontramos eventos para "${searchTerm}"`
                                    : 'Não há eventos ou agendamentos para esta data.'
                                }
                            </p>
                            <div className="flex gap-3 justify-center">
                                {searchTerm && (
                                    <Button
                                        variant="outline"
                                        onClick={() => setSearchTerm('')}
                                        className="hover:scale-105 transition-transform duration-200"
                                    >
                                        Limpar Busca
                                    </Button>
                                )}
                                <Button className="hover:scale-105 transition-transform duration-200 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Novo Agendamento
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Loading */}
            {appointmentsLoading && (
                <Card className="border-slate-200">
                    <CardContent className="py-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-500">Carregando agendamentos...</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )

    // Verificar se o Google Calendar está conectado
    if (!hasGoogleCalendar()) {
        return (
            <Card className="border-red-200 bg-gradient-to-br from-red-50/50 to-white">
                <CardContent className="py-16 text-center">
                    <div className="max-w-md mx-auto">
                        <div className="w-20 h-20 bg-gradient-to-br from-red-200 to-red-300 rounded-full flex items-center justify-center mx-auto mb-6">
                            <WifiOff className="w-10 h-10 text-red-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-red-900 mb-3">
                            Google Calendar não conectado
                        </h3>
                        <p className="text-red-700 mb-6">
                            Conecte sua conta do Google Calendar para visualizar e sincronizar eventos.
                        </p>
                        <Button className="hover:scale-105 transition-transform duration-200 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700">
                            <Settings className="w-4 h-4 mr-2" />
                            Conectar Google Calendar
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Mostrar erro se houver
    if (calendarError) {
        return (
            <Card className="border-red-200 bg-gradient-to-br from-red-50/50 to-white">
                <CardContent className="py-16 text-center">
                    <div className="max-w-md mx-auto">
                        <div className="w-20 h-20 bg-gradient-to-br from-red-200 to-red-300 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-red-900 mb-3">
                            Erro ao carregar calendário
                        </h3>
                        <p className="text-red-700 mb-6">{calendarError}</p>
                        <div className="flex gap-3 justify-center">
                            <Button
                                variant="outline"
                                onClick={clearError}
                                className="hover:scale-105 transition-transform duration-200 border-red-300 text-red-700 hover:bg-red-50"
                            >
                                Limpar Erro
                            </Button>
                            <Button
                                onClick={handleSync}
                                className="hover:scale-105 transition-transform duration-200 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Tentar Novamente
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Calendário Integrado</h1>
                    <p className="text-slate-600">
                        Visualize e gerencie seus agendamentos integrados com Google Calendar
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "w-2 h-2 rounded-full",
                            hasGoogleCalendar() ? "bg-green-500" : "bg-red-500"
                        )} />
                        <span className="text-sm text-slate-600">
                            {hasGoogleCalendar() ? "Conectado" : "Desconectado"}
                        </span>
                    </div>
                    <Separator orientation="vertical" className="h-6" />
                    <Button
                        variant="outline"
                        onClick={handleSync}
                        disabled={calendarLoading}
                        className="hover:scale-105 transition-transform duration-200"
                    >
                        <RefreshCw className={cn("w-4 h-4 mr-2", calendarLoading && "animate-spin")} />
                        Sincronizar
                    </Button>
                    <Button className="hover:scale-105 transition-transform duration-200 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Agendamento
                    </Button>
                </div>
            </div>

            {/* Navegação de visualização */}
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)} className="w-auto">
                <TabsList className="bg-slate-100">
                    <TabsTrigger value="month" className="text-sm">Mês</TabsTrigger>
                    <TabsTrigger value="week" className="text-sm">Semana</TabsTrigger>
                    <TabsTrigger value="day" className="text-sm">Dia</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Conteúdo principal */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    {renderMonthView()}

                    {/* Status de sincronização */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Zap className="w-4 h-4 text-blue-600" />
                                Status da Sincronização
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600">Google Calendar</span>
                                <div className="flex items-center gap-1">
                                    <Wifi className="w-3 h-3 text-green-500" />
                                    <span className="text-green-600 font-medium">Conectado</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600">Última sincronização</span>
                                <span className="text-slate-500">Há 2 min</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600">Próxima sincronização</span>
                                <span className="text-slate-500">Em 13 min</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-3">
                    {renderDayEvents()}
                </div>
            </div>
        </div>
    )
}

export default GoogleCalendarView