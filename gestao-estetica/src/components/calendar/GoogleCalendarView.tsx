// components/calendar/GoogleCalendarView.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Clock,
    User,
    Video,
    Plus,
    RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useGoogleCalendar, GoogleCalendarEvent } from '@/lib/hooks/useGoogleCalendar'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {useAppointments} from "@/lib/hooks/useAppointment";

type ViewType = 'month' | 'week' | 'day'

interface GoogleCalendarViewProps {
    onEventSelect?: (event: GoogleCalendarEvent) => void
    onDateSelect?: (date: Date) => void
    showCreateButton?: boolean
}

export default function GoogleCalendarView({
                                               onEventSelect,
                                               onDateSelect,
                                               showCreateButton = true
                                           }: GoogleCalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [viewType, setViewType] = useState<ViewType>('month')
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [showOnlyAppointments, setShowOnlyAppointments] = useState(false)

    const {
        events,
        loading,
        error,
        isAuthenticated,
        getEvents,
        refreshEvents,
        getEventsForDate,
        clearError
    } = useGoogleCalendar()

    const { appointmentsWithDetails } = useAppointments()

    // Carregar eventos do período atual
    useEffect(() => {
        if (isAuthenticated) {
            const timeMin = startOfMonth(startOfWeek(currentDate)).toISOString()
            const timeMax = endOfMonth(endOfWeek(currentDate)).toISOString()
            getEvents(timeMin, timeMax)
        }
    }, [currentDate, isAuthenticated, getEvents])

    // Filtrar eventos
    const filteredEvents = useMemo(() => {
        if (!showOnlyAppointments) return events

        return events.filter(event => {
            // Verificar se o evento está relacionado a um agendamento
            return appointmentsWithDetails.some(appointment =>
                appointment.google_event_id === event.id
            )
        })
    }, [events, showOnlyAppointments, appointmentsWithDetails])

    // Obter eventos do dia selecionado
    const selectedDateEvents = useMemo(() => {
        if (!selectedDate) return []
        return getEventsForDate(selectedDate)
    }, [selectedDate, getEventsForDate])

    // Gerar dias do calendário
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentDate)
        const monthEnd = endOfMonth(currentDate)
        const startDate = startOfWeek(monthStart)
        const endDate = endOfWeek(monthEnd)

        const days = []
        let day = startDate

        while (day <= endDate) {
            days.push(day)
            day = addDays(day, 1)
        }

        return days
    }, [currentDate])

    const handleDateClick = (date: Date) => {
        setSelectedDate(date)
        if (onDateSelect) {
            onDateSelect(date)
        }
    }

    const handleEventClick = (event: GoogleCalendarEvent) => {
        if (onEventSelect) {
            onEventSelect(event)
        }
    }

    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentDate(prev =>
            direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
        )
    }

    const formatEventTime = (event: GoogleCalendarEvent) => {
        const start = new Date(event.start.dateTime)
        const end = new Date(event.end.dateTime)
        return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`
    }

    const getEventsByDate = (date: Date) => {
        return filteredEvents.filter(event =>
            isSameDay(new Date(event.start.dateTime), date)
        )
    }

    const isAppointmentEvent = (event: GoogleCalendarEvent) => {
        return appointmentsWithDetails.some(appointment =>
            appointment.google_event_id === event.id
        )
    }

    if (!isAuthenticated) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5" />
                        <span>Google Calendar</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <Calendar className="h-4 w-4" />
                        <AlertDescription>
                            Conecte sua conta do Google Calendar para visualizar e gerenciar seus eventos.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header com controles */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
                        <div className="flex items-center space-x-2">
                            <Calendar className="h-5 w-5" />
                            <CardTitle>Google Calendar</CardTitle>
                            {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
                        </div>

                        <div className="flex items-center space-x-2">
                            <Select
                                value={showOnlyAppointments ? 'appointments' : 'all'}
                                onValueChange={(value) => setShowOnlyAppointments(value === 'appointments')}
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os eventos</SelectItem>
                                    <SelectItem value="appointments">Apenas agendamentos</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={viewType} onValueChange={(value) => setViewType(value as ViewType)}>
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="month">Mês</SelectItem>
                                    <SelectItem value="week">Semana</SelectItem>
                                    <SelectItem value="day">Dia</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={refreshEvents}
                                disabled={loading}
                            >
                                <RefreshCw className="h-4 w-4" />
                            </Button>

                            {showCreateButton && (
                                <Button size="sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Novo evento
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Erro */}
            {error && (
                <Alert variant="destructive">
                    <AlertDescription className="flex items-center justify-between">
                        {error}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearError}
                        >
                            Fechar
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            {/* Navegação do calendário */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigateMonth('prev')}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <h2 className="text-xl font-semibold">
                            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                        </h2>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigateMonth('next')}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>

                <CardContent>
                    {/* Cabeçalho dos dias da semana */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Grade do calendário */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, index) => {
                            const dayEvents = getEventsByDate(day)
                            const isCurrentMonth = isSameMonth(day, currentDate)
                            const isSelected = selectedDate && isSameDay(day, selectedDate)
                            const isToday = isSameDay(day, new Date())

                            return (
                                <div
                                    key={index}
                                    className={`
                    min-h-[100px] p-2 border cursor-pointer transition-colors
                    ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                    ${isSelected ? 'ring-2 ring-blue-500' : ''}
                    ${isToday ? 'bg-blue-50 border-blue-300' : 'border-gray-200'}
                    hover:bg-gray-50
                  `}
                                    onClick={() => handleDateClick(day)}
                                >
                                    <div className={`
                    text-sm font-medium mb-1
                    ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                    ${isToday ? 'text-blue-600' : ''}
                  `}>
                                        {format(day, 'd')}
                                    </div>

                                    {/* Eventos do dia */}
                                    <div className="space-y-1">
                                        {dayEvents.slice(0, 3).map((event) => (
                                            <div
                                                key={event.id}
                                                className={`
                          px-2 py-1 text-xs rounded cursor-pointer truncate
                          ${isAppointmentEvent(event)
                                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                                }
                        `}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleEventClick(event)
                                                }}
                                                title={event.summary}
                                            >
                                                {event.summary}
                                            </div>
                                        ))}

                                        {dayEvents.length > 3 && (
                                            <div className="text-xs text-gray-500 text-center">
                                                +{dayEvents.length - 3} mais
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Detalhes do dia selecionado */}
            {selectedDate && (
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Eventos de {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {selectedDateEvents.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">
                                Nenhum evento encontrado para esta data.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {selectedDateEvents.map((event) => (
                                    <div
                                        key={event.id}
                                        className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                        onClick={() => handleEventClick(event)}
                                    >
                                        <div className="flex-shrink-0">
                                            <Clock className="h-4 w-4 text-gray-500 mt-1" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2">
                                                <h4 className="font-medium text-gray-900 truncate">
                                                    {event.summary}
                                                </h4>
                                                {isAppointmentEvent(event) && (
                                                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                                                        Agendamento
                                                    </Badge>
                                                )}
                                            </div>

                                            <p className="text-sm text-gray-600 mt-1">
                                                {formatEventTime(event)}
                                            </p>

                                            {event.description && (
                                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                                    {event.description}
                                                </p>
                                            )}

                                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                                {event.attendees && event.attendees.length > 0 && (
                                                    <div className="flex items-center space-x-1">
                                                        <User className="h-3 w-3" />
                                                        <span>{event.attendees.length} participante(s)</span>
                                                    </div>
                                                )}

                                                {event.hangoutLink && (
                                                    <div className="flex items-center space-x-1">
                                                        <Video className="h-3 w-3" />
                                                        <span>Meet</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}