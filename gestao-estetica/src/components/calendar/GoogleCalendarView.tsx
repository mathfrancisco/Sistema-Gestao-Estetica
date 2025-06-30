'use client'

import React, { useState, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Clock,
    User,
    Phone,
    Calendar as CalendarIcon,
    RefreshCw,
    Settings,
    Loader2
} from 'lucide-react'
import { format, startOfDay, endOfDay, addDays, isSameDay } from 'date-fns'
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

    // Sincronizar calendário
    const handleSync = async () => {
        try {
            await refreshEvents()
        } catch (error) {
            console.error('Erro ao sincronizar:', error)
        }
    }

    // Renderizar visualização do mês
    const renderMonthView = () => (
        <div className="space-y-6">
            <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
                modifiers={{
                    hasEvents: (date) =>
                        events.some(event => isSameDay(new Date(event.start.dateTime), date)) ||
                        dayAppointments.some(apt => isSameDay(new Date(apt.scheduled_datetime), date))
                }}
                modifiersClassNames={{
                    hasEvents: "bg-blue-100 text-blue-900 font-medium"
                }}
            />
        </div>
    )

    // Renderizar eventos do dia
    const renderDayEvents = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                    {format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </h3>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDate(new Date())}
                    >
                        Hoje
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Eventos do Google Calendar */}
            {dayEvents.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <CalendarIcon className="w-4 h-4 text-blue-600" />
                            Eventos do Google Calendar ({dayEvents.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {dayEvents.map((event) => (
                            <div
                                key={event.id}
                                className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                            >
                                <div className="flex-1">
                                    <h4 className="font-medium text-blue-900">{event.summary}</h4>
                                    <div className="flex items-center gap-4 text-sm text-blue-700 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                        {format(new Date(event.start.dateTime), 'HH:mm')} -
                        {format(new Date(event.end.dateTime), 'HH:mm')}
                    </span>
                                        {event.attendees && event.attendees.length > 0 && (
                                            <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                                                {event.attendees.length} participante(s)
                      </span>
                                        )}
                                    </div>
                                    {event.description && (
                                        <p className="text-sm text-blue-600 mt-1">{event.description}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                        Google
                                    </Badge>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => window.open(event.htmlLink, '_blank')}
                                    >
                                        Abrir
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Agendamentos do Sistema */}
            {dayAppointments.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-green-600" />
                            Agendamentos do Sistema ({dayAppointments.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {dayAppointments.map((appointment) => (
                            <div
                                key={appointment.id}
                                className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                            >
                                <div className="flex-1">
                                    <h4 className="font-medium text-green-900">{appointment.client_name}</h4>
                                    <p className="text-sm text-green-700">{appointment.procedure_name}</p>
                                    <div className="flex items-center gap-4 text-sm text-green-600 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                        {format(new Date(appointment.scheduled_datetime), 'HH:mm')}
                        ({appointment.duration_minutes}min)
                    </span>
                                        {appointment.client_phone && (
                                            <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                                                {appointment.client_phone}
                      </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant={appointment.calendar_synced ? "default" : "destructive"}
                                        className={appointment.calendar_synced
                                            ? "bg-green-100 text-green-800"
                                            : "bg-yellow-100 text-yellow-800"
                                        }
                                    >
                                        {appointment.calendar_synced ? "Sincronizado" : "Não Sincronizado"}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Estado vazio */}
            {dayEvents.length === 0 && dayAppointments.length === 0 && !appointmentsLoading && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Nenhum evento agendado
                        </h3>
                        <p className="text-gray-500 mb-4">
                            Não há eventos ou agendamentos para esta data.
                        </p>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Novo Agendamento
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Loading */}
            {appointmentsLoading && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Carregando agendamentos...</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )

    // Verificar se o Google Calendar está conectado
    if (!hasGoogleCalendar()) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Google Calendar não conectado
                    </h3>
                    <p className="text-gray-500 mb-4">
                        Conecte sua conta do Google Calendar para visualizar e sincronizar eventos.
                    </p>
                    <Button>
                        <Settings className="w-4 h-4 mr-2" />
                        Conectar Google Calendar
                    </Button>
                </CardContent>
            </Card>
        )
    }

    // Mostrar erro se houver
    if (calendarError) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <CalendarIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Erro ao carregar calendário
                    </h3>
                    <p className="text-red-600 mb-4">{calendarError}</p>
                    <div className="flex gap-2 justify-center">
                        <Button variant="outline" onClick={clearError}>
                            Limpar Erro
                        </Button>
                        <Button onClick={handleSync}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Tentar Novamente
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Calendário</h1>
                    <p className="text-gray-600">
                        Visualize e gerencie seus agendamentos integrados com Google Calendar
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={handleSync}
                        disabled={calendarLoading}
                    >
                        <RefreshCw className={cn("w-4 h-4 mr-2", calendarLoading && "animate-spin")} />
                        Sincronizar
                    </Button>
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Agendamento
                    </Button>
                </div>
            </div>

            {/* Navegação de visualização */}
            <div className="flex items-center gap-2">
                <Button
                    variant={viewMode === 'month' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('month')}
                >
                    Mês
                </Button>
                <Button
                    variant={viewMode === 'week' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('week')}
                >
                    Semana
                </Button>
                <Button
                    variant={viewMode === 'day' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('day')}
                >
                    Dia
                </Button>
            </div>

            {/* Conteúdo principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    {renderMonthView()}
                </div>
                <div className="lg:col-span-2">
                    {renderDayEvents()}
                </div>
            </div>
        </div>
    )
}

export default GoogleCalendarView