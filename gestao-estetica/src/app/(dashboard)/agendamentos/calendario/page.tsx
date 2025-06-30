'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Calendar as CalendarIcon,
    Plus,
    RefreshCw,
    Settings,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Grid3X3,
    List,
    Clock,
    User,
    Phone
} from 'lucide-react'
import { format, addDays, startOfWeek, endOfWeek, startOfDay, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils/utils'
import Link from 'next/link'
import GoogleCalendarView from '@/components/calendar/GoogleCalendarView'
import TimeSlots from '@/components/calendar/TimeSlots'
import AppointmentModal from '@/components/calendar/AppointmentModal'

interface CalendarPageProps {}

const CalendarPage: React.FC<CalendarPageProps> = () => {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'agenda'>('month')
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedTime, setSelectedTime] = useState<string>('')
    const [isLoading, setIsLoading] = useState(false)

    // Mock data - substituir por dados reais da API
    const [appointments, setAppointments] = useState([
        {
            id: '1',
            clientName: 'Maria Silva',
            clientPhone: '(11) 99999-9999',
            procedureName: 'Limpeza de Pele',
            scheduledDateTime: new Date().toISOString(),
            durationMinutes: 60,
            status: 'confirmed'
        },
        {
            id: '2',
            clientName: 'João Santos',
            clientPhone: '(11) 88888-8888',
            procedureName: 'Massagem Relaxante',
            scheduledDateTime: addDays(new Date(), 1).toISOString(),
            durationMinutes: 90,
            status: 'scheduled'
        }
    ])

    const [clients] = useState([
        { id: '1', name: 'Maria Silva', email: 'maria@email.com', phone: '(11) 99999-9999' },
        { id: '2', name: 'João Santos', phone: '(11) 88888-8888' }
    ])

    const [procedures] = useState([
        { id: '1', name: 'Limpeza de Pele', durationMinutes: 60, price: 120.00 },
        { id: '2', name: 'Massagem Relaxante', durationMinutes: 90, price: 150.00 }
    ])

    const handleDateNavigation = (direction: 'prev' | 'next' | 'today') => {
        let newDate = currentDate

        switch (direction) {
            case 'prev':
                newDate = viewMode === 'month'
                    ? subMonths(currentDate, 1)
                    : addDays(currentDate, viewMode === 'week' ? -7 : -1)
                break
            case 'next':
                newDate = viewMode === 'month'
                    ? addMonths(currentDate, 1)
                    : addDays(currentDate, viewMode === 'week' ? 7 : 1)
                break
            case 'today':
                newDate = new Date()
                break
        }

        setCurrentDate(newDate)
        if (direction === 'today') {
            setSelectedDate(newDate)
        }
    }

    const handleTimeSelect = (date: Date, time: string) => {
        setSelectedDate(date)
        setSelectedTime(time)
        setIsModalOpen(true)
    }

    const handleSaveAppointment = async (data: any) => {
        try {
            setIsLoading(true)
            // Simular salvamento
            const newAppointment = {
                id: Date.now().toString(),
                clientName: clients.find(c => c.id === data.clientId)?.name || '',
                clientPhone: clients.find(c => c.id === data.clientId)?.phone || '',
                procedureName: procedures.find(p => p.id === data.procedureId)?.name || '',
                scheduledDateTime: new Date(data.date.setHours(
                    parseInt(data.time.split(':')[0]),
                    parseInt(data.time.split(':')[1])
                )).toISOString(),
                durationMinutes: data.durationMinutes,
                status: 'scheduled'
            }

            setAppointments(prev => [...prev, newAppointment])
        } catch (error) {
            console.error('Erro ao salvar agendamento:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const getViewTitle = () => {
        switch (viewMode) {
            case 'month':
                return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })
            case 'week':
                const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
                const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 })
                return `${format(weekStart, 'd MMM', { locale: ptBR })} - ${format(weekEnd, 'd MMM yyyy', { locale: ptBR })}`
            case 'day':
                return format(currentDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })
            case 'agenda':
                return 'Agenda'
            default:
                return ''
        }
    }

    const renderMonthView = () => (
        <div className="h-full">
            <GoogleCalendarView />
        </div>
    )

    const renderWeekView = () => (
        <div className="h-full">
            <TimeSlots
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                onTimeSelect={handleTimeSelect}
                appointments={appointments}
                showWeekView={true}
            />
        </div>
    )

    const renderDayView = () => (
        <div className="h-full">
            <TimeSlots
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                onTimeSelect={handleTimeSelect}
                appointments={appointments}
                showWeekView={false}
            />
        </div>
    )

    const renderAgendaView = () => {
        const upcomingAppointments = appointments
            .filter(apt => new Date(apt.scheduledDateTime) >= startOfDay(new Date()))
            .sort((a, b) => new Date(a.scheduledDateTime).getTime() - new Date(b.scheduledDateTime).getTime())
            .slice(0, 10)

        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <List className="w-5 h-5" />
                        Próximos Agendamentos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {upcomingAppointments.length === 0 ? (
                        <div className="text-center py-12">
                            <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Nenhum agendamento próximo
                            </h3>
                            <p className="text-gray-500 mb-4">
                                Não há agendamentos para os próximos dias.
                            </p>
                            <Button onClick={() => setIsModalOpen(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Novo Agendamento
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {upcomingAppointments.map((appointment) => (
                                <div
                                    key={appointment.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="text-center">
                                            <div className="text-sm font-medium text-gray-500">
                                                {format(new Date(appointment.scheduledDateTime), 'MMM', { locale: ptBR })}
                                            </div>
                                            <div className="text-2xl font-bold">
                                                {format(new Date(appointment.scheduledDateTime), 'd')}
                                            </div>
                                        </div>
                                        <div className="border-l pl-4">
                                            <h4 className="font-medium text-gray-900">{appointment.clientName}</h4>
                                            <p className="text-sm text-gray-600">{appointment.procedureName}</p>
                                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                            {format(new Date(appointment.scheduledDateTime), 'HH:mm')}
                        </span>
                                                <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                                                    {appointment.durationMinutes}min
                        </span>
                                                {appointment.clientPhone && (
                                                    <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                                                        {appointment.clientPhone}
                          </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}>
                                            {appointment.status === 'confirmed' ? 'Confirmado' : 'Agendado'}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        )
    }

    const renderCurrentView = () => {
        switch (viewMode) {
            case 'month':
                return renderMonthView()
            case 'week':
                return renderWeekView()
            case 'day':
                return renderDayView()
            case 'agenda':
                return renderAgendaView()
            default:
                return renderMonthView()
        }
    }

    return (
        <div className="h-full flex flex-col space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/agendamentos">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Voltar
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Calendário</h1>
                        <p className="text-gray-600 mt-1">
                            Visualize e gerencie seus agendamentos no calendário
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/agendamentos/configuracao">
                        <Button variant="outline">
                            <Settings className="w-4 h-4 mr-2" />
                            Configurações
                        </Button>
                    </Link>
                    <Button onClick={() => setIsModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Agendamento
                    </Button>
                </div>
            </div>

            {/* Controles do Calendário */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        {/* Navegação de Data */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDateNavigation('prev')}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDateNavigation('today')}
                                >
                                    Hoje
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDateNavigation('next')}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                            <h2 className="text-xl font-semibold">{getViewTitle()}</h2>
                        </div>

                        {/* Modos de Visualização */}
                        <div className="flex items-center gap-2">
                            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
                                <TabsList>
                                    <TabsTrigger value="month">Mês</TabsTrigger>
                                    <TabsTrigger value="week">Semana</TabsTrigger>
                                    <TabsTrigger value="day">Dia</TabsTrigger>
                                    <TabsTrigger value="agenda">Agenda</TabsTrigger>
                                </TabsList>
                            </Tabs>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.location.reload()}
                                disabled={isLoading}
                            >
                                <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                                Atualizar
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Área Principal do Calendário */}
            <div className="flex-1 min-h-0">
                {renderCurrentView()}
            </div>

            {/* Resumo Rápido */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                            {appointments.filter(apt =>
                                format(new Date(apt.scheduledDateTime), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                            ).length}
                        </div>
                        <div className="text-sm text-gray-600">Hoje</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {appointments.filter(apt =>
                                format(new Date(apt.scheduledDateTime), 'yyyy-MM-dd') === format(addDays(new Date(), 1), 'yyyy-MM-dd')
                            ).length}
                        </div>
                        <div className="text-sm text-gray-600">Amanhã</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">
                            {appointments.filter(apt => {
                                const aptDate = new Date(apt.scheduledDateTime)
                                const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 })
                                const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 })
                                return aptDate >= weekStart && aptDate <= weekEnd
                            }).length}
                        </div>
                        <div className="text-sm text-gray-600">Esta Semana</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-orange-600">
                            {appointments.filter(apt => apt.status === 'confirmed').length}
                        </div>
                        <div className="text-sm text-gray-600">Confirmados</div>
                    </CardContent>
                </Card>
            </div>

            {/* Modal de Agendamento */}
            <AppointmentModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                clients={clients}
                procedures={procedures}
                onSave={handleSaveAppointment}
                loading={isLoading}
            />
        </div>
    )
}

export default CalendarPage