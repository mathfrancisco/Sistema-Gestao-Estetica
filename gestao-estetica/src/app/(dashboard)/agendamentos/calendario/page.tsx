'use client'

import React, { useState} from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
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
    Sparkles,
    Search,
    Eye,
    Timer,
    Users,
    Zap,
    BarChart3,
    Target,
    AlertCircle, EyeOff
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
    const [searchTerm, setSearchTerm] = useState('')
    const [showQuickStats, setShowQuickStats] = useState(true)

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

    // Dados das métricas principais com melhor design
    const metricsData = [
        {
            title: 'Hoje',
            value: statsData.today,
            icon: CalendarIcon,
            description: 'Agendamentos para hoje',
            gradient: 'from-blue-500 via-blue-600 to-indigo-600',
            trend: { value: statsData.today, label: 'hoje', isPositive: true },
            bgPattern: 'bg-blue-50/80'
        },
        {
            title: 'Amanhã',
            value: statsData.tomorrow,
            icon: CalendarDays,
            description: 'Agendamentos para amanhã',
            gradient: 'from-emerald-500 via-emerald-600 to-green-600',
            trend: { value: statsData.tomorrow, label: 'amanhã', isPositive: true },
            bgPattern: 'bg-emerald-50/80'
        },
        {
            title: 'Esta Semana',
            value: statsData.thisWeek,
            icon: Activity,
            description: 'Total da semana',
            gradient: 'from-purple-500 via-purple-600 to-indigo-600',
            trend: { value: statsData.thisWeek, label: 'semana', isPositive: true },
            bgPattern: 'bg-purple-50/80'
        },
        {
            title: 'Confirmados',
            value: statsData.confirmed,
            icon: CheckCircle,
            description: 'Status confirmado',
            gradient: 'from-orange-500 via-orange-600 to-amber-600',
            trend: { value: statsData.confirmed, label: 'confirmados', isPositive: true },
            bgPattern: 'bg-orange-50/80'
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
            <Card className="border-0 shadow-2xl shadow-slate-200/60 bg-gradient-to-br from-white via-slate-50/30 to-white">
                <CardHeader className="bg-gradient-to-r from-slate-50/80 to-white/80 backdrop-blur-sm border-b border-slate-100">
                    <CardTitle className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                            <List className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Próximos Agendamentos</h3>
                            <p className="text-sm text-slate-600 font-normal">Agenda dos próximos dias</p>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    {upcomingAppointments.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                                <CalendarIcon className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">
                                Nenhum agendamento próximo
                            </h3>
                            <p className="text-slate-500 mb-8 max-w-md mx-auto leading-relaxed">
                                Não há agendamentos para os próximos dias. Que tal criar um novo agendamento?
                            </p>
                            <Button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-xl shadow-blue-500/25 border-0 hover:scale-105 transition-all duration-300"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Novo Agendamento
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {upcomingAppointments.map((appointment, index) => (
                                <div
                                    key={appointment.id}
                                    className="group flex items-center justify-between p-5 border-2 border-slate-100 rounded-2xl hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="text-center bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-2xl p-4 min-w-[80px] shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                                            <div className="text-xs font-bold opacity-90">
                                                {format(new Date(appointment.scheduledDateTime), 'MMM', { locale: ptBR }).toUpperCase()}
                                            </div>
                                            <div className="text-2xl font-bold">
                                                {format(new Date(appointment.scheduledDateTime), 'd')}
                                            </div>
                                        </div>
                                        <div className="border-l-2 border-slate-200 pl-4 space-y-1">
                                            <h4 className="font-bold text-slate-900 text-lg group-hover:text-blue-900 transition-colors duration-300">
                                                {appointment.clientName}
                                            </h4>
                                            <p className="text-sm text-slate-700 font-medium">{appointment.procedureName}</p>
                                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {format(new Date(appointment.scheduledDateTime), 'HH:mm')}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Timer className="w-3 h-3" />
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
                                    <div className="flex items-center gap-3">
                                        <Badge
                                            className={cn(
                                                "font-semibold px-3 py-1 shadow-lg",
                                                appointment.status === 'confirmed'
                                                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0'
                                                    : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0'
                                            )}
                                        >
                                            {appointment.status === 'confirmed' ? 'Confirmado' : 'Agendado'}
                                        </Badge>
                                        <ChevronRightIcon className="w-5 h-5 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
            {/* Sidebar */}
            <Sidebar />

            {/* Conteúdo Principal com layout correto para nova sidebar */}
            <div className="lg:ml-72 transition-all duration-300 ease-in-out">
                {/* Header Premium */}
                <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-2xl border-b border-slate-200/60 shadow-lg shadow-slate-200/60">
                    <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                            <div className="space-y-2">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                                        <CalendarIcon className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
                                            Calendário Inteligente
                                        </h1>
                                        <p className="text-slate-600 text-sm font-medium">
                                            Gerencie seus agendamentos com eficiência e estilo
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                {/* Status Badges */}
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-lg shadow-emerald-500/25">
                                        <Activity className="w-3 h-3 mr-1" />
                                        <span className="hidden sm:inline">Sistema Online</span>
                                        <span className="sm:hidden">Online</span>
                                    </Badge>
                                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg shadow-blue-500/25">
                                        <Users className="w-3 h-3 mr-1" />
                                        {statsData.total}
                                    </Badge>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="rounded-xl bg-white/50 hover:bg-white shadow-sm border border-slate-200/50"
                                    >
                                        <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="rounded-xl bg-white/50 hover:bg-white shadow-sm border border-slate-200/50"
                                    >
                                        <Filter className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="rounded-xl bg-white/50 hover:bg-white shadow-sm border border-slate-200/50"
                                    >
                                        <Download className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="rounded-xl bg-white/50 hover:bg-white shadow-sm border border-slate-200/50"
                                    >
                                        <Bell className="w-4 h-4" />
                                    </Button>
                                </div>

                                {/* Navigation Buttons */}
                                <div className="flex items-center gap-2 ml-2">
                                    <Link href="/agendamentos">
                                        <Button
                                            variant="outline"
                                            className="bg-white/80 border-slate-200 hover:bg-white shadow-sm rounded-xl backdrop-blur-sm"
                                        >
                                            <ArrowLeft className="w-4 h-4 mr-2" />
                                            <span className="hidden sm:inline">Agendamentos</span>
                                            <span className="sm:hidden">Voltar</span>
                                        </Button>
                                    </Link>
                                    <Link href="/agendamentos/configuracao">
                                        <Button
                                            variant="outline"
                                            className="bg-white/80 border-slate-200 hover:bg-white shadow-sm rounded-xl backdrop-blur-sm"
                                        >
                                            <Settings className="w-4 h-4 mr-2" />
                                            <span className="hidden sm:inline">Config</span>
                                        </Button>
                                    </Link>
                                    <Button
                                        onClick={() => setIsModalOpen(true)}
                                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-xl shadow-blue-500/25 border-0 rounded-xl hover:scale-105 transition-all duration-300"
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
                    <div className="max-w-7xl mx-auto space-y-8">

                        {/* Métricas Premium */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {metricsData.map((metric, index) => (
                                <Card key={index} className="group relative overflow-hidden border-0 shadow-2xl shadow-slate-200/60 hover:shadow-2xl hover:shadow-slate-300/60 transition-all duration-500 hover:-translate-y-2 bg-gradient-to-br from-white via-slate-50/30 to-white">
                                    {/* Background Pattern */}
                                    <div className={cn("absolute inset-0 opacity-30", metric.bgPattern)} />
                                    <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-all duration-500", metric.gradient)} />

                                    <CardContent className="p-6 relative z-10">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className={cn(
                                                "p-3 rounded-2xl bg-gradient-to-br shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500",
                                                metric.gradient
                                            )}>
                                                <metric.icon className="w-6 h-6 text-white drop-shadow-sm" />
                                            </div>
                                            <ChevronRightIcon className="w-5 h-5 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                                        </div>

                                        <div className="space-y-3">
                                            <p className="text-sm font-bold text-slate-600 uppercase tracking-wide">{metric.title}</p>
                                            <p className="text-3xl lg:text-4xl font-bold text-slate-900 leading-tight group-hover:text-slate-800 transition-colors duration-300">
                                                {metric.value.toLocaleString()}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className={cn("w-4 h-4", metric.trend.isPositive ? 'text-emerald-500' : 'text-orange-500')} />
                                                <span className={cn("text-sm font-bold", metric.trend.isPositive ? 'text-emerald-600' : 'text-orange-600')}>
                                                    {metric.trend.label}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>

                                    {/* Shine Effect */}
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {/* Controles Avançados do Calendário */}
                        <Card className="border-0 shadow-2xl shadow-slate-200/60 overflow-hidden bg-gradient-to-br from-white via-slate-50/30 to-white">
                            <CardHeader className="bg-gradient-to-r from-slate-50/80 to-white/80 backdrop-blur-sm border-b border-slate-100">
                                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                                    <CardTitle className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                                            <Grid3X3 className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold">Controles de Visualização</h2>
                                            <p className="text-sm text-slate-600 font-normal">Navegue pelo calendário com facilidade</p>
                                        </div>
                                    </CardTitle>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowQuickStats(!showQuickStats)}
                                        className="hover:bg-slate-100 rounded-xl"
                                    >
                                        {showQuickStats ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                                    {/* Navegação de Data */}
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDateNavigation('prev')}
                                                className="bg-white border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm hover:scale-105 transition-all duration-300"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDateNavigation('today')}
                                                className="bg-white border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm hover:scale-105 transition-all duration-300"
                                            >
                                                Hoje
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDateNavigation('next')}
                                                className="bg-white border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm hover:scale-105 transition-all duration-300"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <h2 className="text-xl font-bold text-slate-900">{getViewTitle()}</h2>
                                    </div>

                                    {/* Modos de Visualização e Ações */}
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
                                            <TabsList className="bg-slate-100/80 backdrop-blur-sm border-0 rounded-xl">
                                                <TabsTrigger value="month" className="data-[state=active]:bg-white data-[state=active]:shadow-lg rounded-lg">Mês</TabsTrigger>
                                                <TabsTrigger value="week" className="data-[state=active]:bg-white data-[state=active]:shadow-lg rounded-lg">Semana</TabsTrigger>
                                                <TabsTrigger value="day" className="data-[state=active]:bg-white data-[state=active]:shadow-lg rounded-lg">Dia</TabsTrigger>
                                                <TabsTrigger value="agenda" className="data-[state=active]:bg-white data-[state=active]:shadow-lg rounded-lg">Agenda</TabsTrigger>
                                            </TabsList>
                                        </Tabs>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.location.reload()}
                                            disabled={isLoading}
                                            className="bg-white border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm hover:scale-105 transition-all duration-300"
                                        >
                                            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                                            Atualizar
                                        </Button>
                                    </div>
                                </div>

                                {/* Search Bar */}
                                {showQuickStats && (
                                    <>
                                        <Separator className="my-6" />
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Buscar agendamentos, clientes ou procedimentos..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                                            />
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Área Principal do Calendário */}
                        <div className="min-h-[600px]">
                            {renderCurrentView()}
                        </div>

                        {/* Resumo Estatístico Avançado */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Próximos Agendamentos Resumo */}
                            <Card className="border-0 shadow-2xl shadow-slate-200/60 bg-gradient-to-br from-white via-slate-50/30 to-white">
                                <CardHeader className="bg-gradient-to-r from-slate-50/80 to-white/80 backdrop-blur-sm border-b border-slate-100">
                                    <CardTitle className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                                            <Clock className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold">Próximos 5 Agendamentos</h3>
                                            <p className="text-sm text-slate-600 font-normal">Agenda resumida</p>
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        {appointments
                                            .filter(apt => new Date(apt.scheduledDateTime) >= new Date())
                                            .sort((a, b) => new Date(a.scheduledDateTime).getTime() - new Date(b.scheduledDateTime).getTime())
                                            .slice(0, 5)
                                            .map((appointment, index) => (
                                                <div key={appointment.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 rounded-lg px-2 transition-colors duration-300">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-slate-900 truncate">
                                                            {appointment.clientName}
                                                        </p>
                                                        <p className="text-xs text-slate-600 truncate font-medium">
                                                            {appointment.procedureName}
                                                        </p>
                                                    </div>
                                                    <div className="text-right ml-4">
                                                        <p className="text-xs font-bold text-slate-900">
                                                            {format(new Date(appointment.scheduledDateTime), 'dd/MM')}
                                                        </p>
                                                        <p className="text-xs text-slate-500 font-medium">
                                                            {format(new Date(appointment.scheduledDateTime), 'HH:mm')}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        {appointments.filter(apt => new Date(apt.scheduledDateTime) >= new Date()).length === 0 && (
                                            <div className="text-center py-8">
                                                <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                                <p className="text-sm text-slate-500 font-medium">Nenhum agendamento futuro</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Distribuição por Status Avançada */}
                            <Card className="border-0 shadow-2xl shadow-slate-200/60 bg-gradient-to-br from-white via-slate-50/30 to-white">
                                <CardHeader className="bg-gradient-to-r from-slate-50/80 to-white/80 backdrop-blur-sm border-b border-slate-100">
                                    <CardTitle className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                                            <BarChart3 className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold">Status dos Agendamentos</h3>
                                            <p className="text-sm text-slate-600 font-normal">Distribuição por categoria</p>
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        {[
                                            { status: 'scheduled', label: 'Agendados', color: 'bg-blue-500', icon: CalendarIcon },
                                            { status: 'confirmed', label: 'Confirmados', color: 'bg-green-500', icon: CheckCircle },
                                            { status: 'completed', label: 'Concluídos', color: 'bg-purple-500', icon: Target },
                                            { status: 'cancelled', label: 'Cancelados', color: 'bg-red-500', icon: AlertCircle }
                                        ].map(({ status, label, color, icon: StatusIcon }) => {
                                            const count = appointments.filter(apt => apt.status === status).length
                                            const percentage = appointments.length > 0
                                                ? (count / appointments.length * 100).toFixed(1)
                                                : '0'

                                            return (
                                                <div key={status} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl hover:bg-slate-100/50 transition-colors duration-300">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-lg", color)}>
                                                            <StatusIcon className="w-4 h-4 text-white" />
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-bold text-slate-700">{label}</span>
                                                            <p className="text-xs text-slate-500">{percentage}% do total</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-xl font-bold text-slate-900">{count}</span>
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