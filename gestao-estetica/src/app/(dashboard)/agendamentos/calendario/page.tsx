'use client'

import React, { useState} from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
    Phone,
    Activity,
    TrendingUp,
    ChevronRight as ChevronRightIcon,
    Bell,
    Filter,
    Download,
    CalendarDays,
    CheckCircle,
    Sparkles
} from 'lucide-react'
import { format, addDays, startOfWeek, endOfWeek, startOfDay, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils/utils'
import Link from 'next/link'
import GoogleCalendarView from '@/components/calendar/GoogleCalendarView'
import TimeSlots from '@/components/calendar/TimeSlots'
import AppointmentModal from '@/components/calendar/AppointmentModal'
import { Sidebar } from '@/components/layout/sidebar'

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
        },
        {
            id: '3',
            clientName: 'Ana Costa',
            clientPhone: '(11) 77777-7777',
            procedureName: 'Facial Hidratante',
            scheduledDateTime: addDays(new Date(), 2).toISOString(),
            durationMinutes: 75,
            status: 'confirmed'
        }
    ])

    const [clients] = useState([
        { id: '1', name: 'Maria Silva', email: 'maria@email.com', phone: '(11) 99999-9999' },
        { id: '2', name: 'João Santos', phone: '(11) 88888-8888' },
        { id: '3', name: 'Ana Costa', email: 'ana@email.com', phone: '(11) 77777-7777' }
    ])

    const [procedures] = useState([
        { id: '1', name: 'Limpeza de Pele', durationMinutes: 60, price: 120.00 },
        { id: '2', name: 'Massagem Relaxante', durationMinutes: 90, price: 150.00 },
        { id: '3', name: 'Facial Hidratante', durationMinutes: 75, price: 135.00 }
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

    // Calcular estatísticas
    const getCalendarStats = () => {
        const today = new Date()
        const tomorrow = addDays(today, 1)
        const weekStart = startOfWeek(today, { weekStartsOn: 0 })
        const weekEnd = endOfWeek(today, { weekStartsOn: 0 })

        return {
            total: appointments.length,
            today: appointments.filter(apt =>
                format(new Date(apt.scheduledDateTime), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
            ).length,
            tomorrow: appointments.filter(apt =>
                format(new Date(apt.scheduledDateTime), 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd')
            ).length,
            thisWeek: appointments.filter(apt => {
                const aptDate = new Date(apt.scheduledDateTime)
                return aptDate >= weekStart && aptDate <= weekEnd
            }).length,
            confirmed: appointments.filter(apt => apt.status === 'confirmed').length
        }
    }

    const statsData = getCalendarStats()

    // Dados das métricas principais
    const metricsData = [
        {
            title: 'Hoje',
            value: statsData.today,
            icon: CalendarIcon,
            description: 'Agendamentos para hoje',
            gradient: 'from-blue-500 to-blue-600',
            trend: { value: statsData.today, label: 'hoje', isPositive: true }
        },
        {
            title: 'Amanhã',
            value: statsData.tomorrow,
            icon: CalendarDays,
            description: 'Agendamentos para amanhã',
            gradient: 'from-emerald-500 to-emerald-600',
            trend: { value: statsData.tomorrow, label: 'amanhã', isPositive: true }
        },
        {
            title: 'Esta Semana',
            value: statsData.thisWeek,
            icon: Activity,
            description: 'Total da semana',
            gradient: 'from-purple-500 to-purple-600',
            trend: { value: statsData.thisWeek, label: 'semana', isPositive: true }
        },
        {
            title: 'Confirmados',
            value: statsData.confirmed,
            icon: CheckCircle,
            description: 'Status confirmado',
            gradient: 'from-orange-500 to-orange-600',
            trend: { value: statsData.confirmed, label: 'confirmados', isPositive: true }
        }
    ]

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
            <Card className="border-0 shadow-xl shadow-slate-200/60">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <List className="w-5 h-5 text-blue-500" />
                        Próximos Agendamentos
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    {upcomingAppointments.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CalendarIcon className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                Nenhum agendamento próximo
                            </h3>
                            <p className="text-slate-500 mb-6 max-w-md mx-auto">
                                Não há agendamentos para os próximos dias.
                            </p>
                            <Button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25 border-0"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Novo Agendamento
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {upcomingAppointments.map((appointment) => (
                                <div
                                    key={appointment.id}
                                    className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="text-center bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-3 min-w-[60px]">
                                            <div className="text-xs font-medium">
                                                {format(new Date(appointment.scheduledDateTime), 'MMM', { locale: ptBR })}
                                            </div>
                                            <div className="text-lg font-bold">
                                                {format(new Date(appointment.scheduledDateTime), 'd')}
                                            </div>
                                        </div>
                                        <div className="border-l border-slate-200 pl-4">
                                            <h4 className="font-semibold text-slate-900">{appointment.clientName}</h4>
                                            <p className="text-sm text-slate-600">{appointment.procedureName}</p>
                                            <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
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
                                        <Badge variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}
                                               className={appointment.status === 'confirmed'
                                                   ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                   : 'bg-blue-100 text-blue-700 border-blue-200'}>
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
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                {/* Sidebar */}
                <Sidebar />

                {/* Conteúdo Principal */}
                <div className="lg:ml-64">
                    {/* Header Moderno */}
                    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
                        <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                            <CalendarIcon className="w-4 h-4 text-white" />
                                        </div>
                                        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                            Calendário
                                        </h1>
                                    </div>
                                    <p className="text-slate-600 text-xs sm:text-sm font-medium">
                                        Visualize e gerencie seus agendamentos no calendário
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                    {/* Status Badge */}
                                    <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-lg shadow-emerald-500/25 text-xs">
                                        <Activity className="w-3 h-3 mr-1" />
                                        <span className="hidden sm:inline">Sistema Online</span>
                                        <span className="sm:hidden">Online</span>
                                    </Badge>

                                    {/* Botões de Ação */}
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                                            <RefreshCw className={cn("w-4 h-4 text-slate-600", isLoading && "animate-spin")} />
                                        </button>
                                        <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                                            <Filter className="w-4 h-4 text-slate-600" />
                                        </button>
                                        <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                                            <Download className="w-4 h-4 text-slate-600" />
                                        </button>
                                        <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                                            <Bell className="w-4 h-4 text-slate-600" />
                                        </button>
                                    </div>

                                    {/* Botões Principais */}
                                    <div className="flex items-center gap-2 ml-2">
                                        <Link href="/agendamentos">
                                            <Button variant="outline" className="bg-white border-slate-200 hover:bg-slate-50 shadow-sm">
                                                <ArrowLeft className="w-4 h-4 mr-2" />
                                                <span className="hidden sm:inline">Agendamentos</span>
                                                <span className="sm:hidden">Voltar</span>
                                            </Button>
                                        </Link>
                                        <Link href="/agendamentos/configuracao">
                                            <Button variant="outline" className="bg-white border-slate-200 hover:bg-slate-50 shadow-sm">
                                                <Settings className="w-4 h-4 mr-2" />
                                                <span className="hidden sm:inline">Configurações</span>
                                                <span className="sm:hidden">Config</span>
                                            </Button>
                                        </Link>
                                        <Button
                                            onClick={() => setIsModalOpen(true)}
                                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25 border-0"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            <span className="hidden sm:inline">Novo Agendamento</span>
                                            <span className="sm:hidden">Novo</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Conteúdo */}
                    <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                        <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">

                            {/* Métricas Principais com Design Moderno */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                                {metricsData.map((metric, index) => (
                                    <Card key={index} className="relative overflow-hidden border-0 shadow-xl shadow-slate-200/60 hover:shadow-2xl hover:shadow-slate-300/60 transition-all duration-300 hover:-translate-y-1">
                                        <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-5`} />
                                        <CardContent className="p-4 lg:p-6 relative">
                                            <div className="flex items-center justify-between mb-3 lg:mb-4">
                                                <div className={`p-2 lg:p-3 rounded-2xl bg-gradient-to-br ${metric.gradient} shadow-lg`}>
                                                    <metric.icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                                                </div>
                                                <ChevronRightIcon className="w-4 h-4 text-slate-400" />
                                            </div>

                                            <div className="space-y-1 lg:space-y-2">
                                                <p className="text-xs lg:text-sm font-medium text-slate-600">{metric.title}</p>
                                                <p className="text-xl lg:text-3xl font-bold text-slate-900 leading-tight">
                                                    {metric.value.toLocaleString()}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <TrendingUp className={`w-3 h-3 ${metric.trend.isPositive ? 'text-emerald-500' : 'text-orange-500'}`} />
                                                    <span className={`text-xs font-medium ${metric.trend.isPositive ? 'text-emerald-600' : 'text-orange-600'}`}>
                                                        {metric.trend.label}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* Controles do Calendário */}
                            <Card className="border-0 shadow-xl shadow-slate-200/60 overflow-hidden">
                                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Grid3X3 className="w-5 h-5 text-blue-500" />
                                        Controles de Visualização
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 lg:p-6">
                                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                                        {/* Navegação de Data */}
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDateNavigation('prev')}
                                                    className="bg-white border-slate-200 hover:bg-slate-50"
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDateNavigation('today')}
                                                    className="bg-white border-slate-200 hover:bg-slate-50"
                                                >
                                                    Hoje
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDateNavigation('next')}
                                                    className="bg-white border-slate-200 hover:bg-slate-50"
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            <h2 className="text-lg lg:text-xl font-semibold text-slate-900">{getViewTitle()}</h2>
                                        </div>

                                        {/* Modos de Visualização */}
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
                                                <TabsList className="bg-slate-100 border-0">
                                                    <TabsTrigger value="month" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Mês</TabsTrigger>
                                                    <TabsTrigger value="week" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Semana</TabsTrigger>
                                                    <TabsTrigger value="day" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Dia</TabsTrigger>
                                                    <TabsTrigger value="agenda" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Agenda</TabsTrigger>
                                                </TabsList>
                                            </Tabs>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => window.location.reload()}
                                                disabled={isLoading}
                                                className="bg-white border-slate-200 hover:bg-slate-50"
                                            >
                                                <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                                                Atualizar
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Área Principal do Calendário */}
                            <div className="min-h-[600px]">
                                {renderCurrentView()}
                            </div>

                            {/* Ações Rápidas */}
                            <Card className="border-0 shadow-xl shadow-slate-200/60">
                                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Sparkles className="w-5 h-5 text-purple-500" />
                                        Ações Rápidas
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 lg:p-6">
                                    <div className="flex flex-wrap gap-3">
                                        <Button
                                            variant="outline"
                                            className="bg-white border-slate-200 hover:bg-slate-50"
                                            onClick={() => setIsModalOpen(true)}
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Novo Agendamento
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="bg-white border-slate-200 hover:bg-slate-50"
                                            onClick={() => {
                                                // Lógica para sincronizar com Google Calendar
                                                console.log('Sincronizar calendário')
                                            }}
                                        >
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            Sincronizar Google Calendar
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="bg-white border-slate-200 hover:bg-slate-50"
                                            onClick={() => {
                                                // Lógica para exportar calendário
                                                console.log('Exportar calendário')
                                            }}
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Exportar Calendário
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="bg-white border-slate-200 hover:bg-slate-50"
                                            onClick={() => {
                                                // Lógica para configurações
                                                console.log('Abrir configurações')
                                            }}
                                        >
                                            <Settings className="w-4 h-4 mr-2" />
                                            Configurações
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Resumo Estatístico */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Próximos Agendamentos Resumo */}
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                        <CardTitle className="flex items-center gap-2">
                                            <Clock className="w-5 h-5 text-green-500" />
                                            Próximos 5 Agendamentos
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="space-y-4">
                                            {appointments
                                                .filter(apt => new Date(apt.scheduledDateTime) >= new Date())
                                                .sort((a, b) => new Date(a.scheduledDateTime).getTime() - new Date(b.scheduledDateTime).getTime())
                                                .slice(0, 5)
                                                .map((appointment, index) => (
                                                    <div key={appointment.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-slate-900 truncate">
                                                                {appointment.clientName}
                                                            </p>
                                                            <p className="text-xs text-slate-500 truncate">
                                                                {appointment.procedureName}
                                                            </p>
                                                        </div>
                                                        <div className="text-right ml-4">
                                                            <p className="text-xs font-medium text-slate-900">
                                                                {format(new Date(appointment.scheduledDateTime), 'dd/MM')}
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                {format(new Date(appointment.scheduledDateTime), 'HH:mm')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            {appointments.filter(apt => new Date(apt.scheduledDateTime) >= new Date()).length === 0 && (
                                                <div className="text-center py-6">
                                                    <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                                    <p className="text-sm text-slate-500">Nenhum agendamento futuro</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Distribuição por Status */}
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                        <CardTitle className="flex items-center gap-2">
                                            <Activity className="w-5 h-5 text-blue-500" />
                                            Status dos Agendamentos
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="space-y-4">
                                            {[
                                                { status: 'scheduled', label: 'Agendados', color: 'bg-blue-500' },
                                                { status: 'confirmed', label: 'Confirmados', color: 'bg-green-500' },
                                                { status: 'completed', label: 'Concluídos', color: 'bg-purple-500' },
                                                { status: 'cancelled', label: 'Cancelados', color: 'bg-red-500' }
                                            ].map(({ status, label, color }) => {
                                                const count = appointments.filter(apt => apt.status === status).length
                                                const percentage = appointments.length > 0
                                                    ? (count / appointments.length * 100).toFixed(1)
                                                    : '0'

                                                return (
                                                    <div key={status} className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-3 h-3 rounded-full ${color}`} />
                                                            <span className="text-sm font-medium text-slate-700">{label}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm text-slate-500">{percentage}%</span>
                                                            <span className="text-sm font-semibold text-slate-900">{count}</span>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </main>
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