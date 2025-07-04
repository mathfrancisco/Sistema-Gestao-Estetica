'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
    Clock,
    CalendarDays,
    CheckCircle,
    XCircle,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Filter,
    Timer,
    TrendingUp,
    Eye,
    EyeOff, Badge
} from 'lucide-react'
import { format, addDays, startOfDay, addMinutes, isSameDay, isAfter, isBefore, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils/utils'

interface TimeSlot {
    time: string
    available: boolean
    appointment?: {
        id: string
        clientName: string
        procedureName: string
        durationMinutes: number
        status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
    }
}

interface DaySchedule {
    date: Date
    slots: TimeSlot[]
}

interface TimeSlotsProps {
    selectedDate?: Date
    onDateChange?: (date: Date) => void
    onTimeSelect?: (date: Date, time: string) => void
    workingHours?: {
        start: string
        end: string
        interval: number // em minutos
    }
    appointments?: Array<{
        id: string
        clientName: string
        procedureName: string
        scheduledDateTime: string
        durationMinutes: number
        status: string
    }>
    blockedTimes?: Array<{
        date: Date
        startTime: string
        endTime: string
        reason?: string
    }>
    showWeekView?: boolean
}

const TimeSlots: React.FC<TimeSlotsProps> = ({
                                                 selectedDate = new Date(),
                                                 onDateChange,
                                                 onTimeSelect,
                                                 workingHours = {
                                                     start: '08:00',
                                                     end: '18:00',
                                                     interval: 30
                                                 },
                                                 appointments = [],
                                                 blockedTimes = [],
                                                 showWeekView = false
                                             }) => {
    const [currentDate, setCurrentDate] = useState(selectedDate)
    const [viewMode, setViewMode] = useState<'day' | 'week'>(showWeekView ? 'week' : 'day')
    const [showLegend, setShowLegend] = useState(true)
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null)

    // Gerar slots de horário para um dia
    const generateTimeSlots = (date: Date): TimeSlot[] => {
        const slots: TimeSlot[] = []
        const [startHour, startMinute] = workingHours.start.split(':').map(Number)
        const [endHour, endMinute] = workingHours.end.split(':').map(Number)

        const startTime = new Date(date)
        startTime.setHours(startHour, startMinute, 0, 0)

        const endTime = new Date(date)
        endTime.setHours(endHour, endMinute, 0, 0)

        let currentTime = new Date(startTime)

        while (currentTime < endTime) {
            const timeString = format(currentTime, 'HH:mm')

            // Verificar se há agendamento neste horário
            const appointment = appointments.find(apt => {
                const aptDateTime = new Date(apt.scheduledDateTime)
                const aptEndTime = addMinutes(aptDateTime, apt.durationMinutes)
                return isSameDay(aptDateTime, date) &&
                    !isAfter(currentTime, aptEndTime) &&
                    !isBefore(addMinutes(currentTime, workingHours.interval), aptDateTime)
            })

            // Verificar se o horário está bloqueado
            const isBlocked = blockedTimes.some(blocked => {
                if (!isSameDay(blocked.date, date)) return false
                const [blockStartHour, blockStartMinute] = blocked.startTime.split(':').map(Number)
                const [blockEndHour, blockEndMinute] = blocked.endTime.split(':').map(Number)

                const blockStart = new Date(date)
                blockStart.setHours(blockStartHour, blockStartMinute, 0, 0)

                const blockEnd = new Date(date)
                blockEnd.setHours(blockEndHour, blockEndMinute, 0, 0)

                return currentTime >= blockStart && currentTime < blockEnd
            })

            // Verificar se o horário já passou (para o dia atual)
            const isPast = isSameDay(date, new Date()) && currentTime < new Date()

            slots.push({
                time: timeString,
                available: !appointment && !isBlocked && !isPast,
                appointment: appointment ? {
                    id: appointment.id,
                    clientName: appointment.clientName,
                    procedureName: appointment.procedureName,
                    durationMinutes: appointment.durationMinutes,
                    status: appointment.status as any
                } : undefined
            })

            currentTime = addMinutes(currentTime, workingHours.interval)
        }

        return slots
    }

    // Gerar horários para a semana
    const weekSchedule = useMemo(() => {
        const schedules: DaySchedule[] = []
        for (let i = 0; i < 7; i++) {
            const date = addDays(startOfDay(currentDate), i - currentDate.getDay())
            schedules.push({
                date,
                slots: generateTimeSlots(date)
            })
        }
        return schedules
    }, [currentDate, appointments, blockedTimes, workingHours])

    // Horários para o dia atual
    const daySchedule = useMemo(() => ({
        date: currentDate,
        slots: generateTimeSlots(currentDate)
    }), [currentDate, appointments, blockedTimes, workingHours])

    const handleDateNavigation = (direction: 'prev' | 'next') => {
        const newDate = addDays(currentDate, direction === 'next' ? 1 : -1)
        setCurrentDate(newDate)
        onDateChange?.(newDate)
    }

    const handleTimeClick = (time: string) => {
        setSelectedTimeSlot(time)
        onTimeSelect?.(currentDate, time)
    }

    const getSlotStatusColor = (slot: TimeSlot, isSelected: boolean = false) => {
        if (isSelected) {
            return 'bg-gradient-to-br from-blue-500 to-purple-600 text-white border-blue-500 shadow-lg scale-105'
        }

        if (!slot.available && slot.appointment) {
            switch (slot.appointment.status) {
                case 'confirmed':
                    return 'bg-gradient-to-br from-green-100 to-green-200 text-green-800 border-green-300 shadow-sm'
                case 'scheduled':
                    return 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-800 border-blue-300 shadow-sm'
                case 'completed':
                    return 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 border-gray-300'
                case 'cancelled':
                    return 'bg-gradient-to-br from-red-100 to-red-200 text-red-700 border-red-300'
                default:
                    return 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 border-gray-300'
            }
        }
        if (!slot.available) {
            return 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 border-slate-300 cursor-not-allowed'
        }
        return 'bg-white text-slate-900 border-slate-300 hover:border-blue-400 hover:bg-blue-50 hover:scale-105 hover:shadow-md cursor-pointer'
    }

    const getSlotIcon = (slot: TimeSlot) => {
        if (slot.appointment) {
            switch (slot.appointment.status) {
                case 'confirmed':
                    return <CheckCircle className="w-4 h-4" />
                case 'scheduled':
                    return <Clock className="w-4 h-4" />
                case 'cancelled':
                    return <XCircle className="w-4 h-4" />
                default:
                    return <AlertCircle className="w-4 h-4" />
            }
        }
        return <Timer className="w-4 h-4 text-slate-400" />
    }

    const getDayStats = (schedule: DaySchedule) => {
        const total = schedule.slots.length
        const available = schedule.slots.filter(s => s.available).length
        const scheduled = schedule.slots.filter(s => s.appointment?.status === 'scheduled').length
        const confirmed = schedule.slots.filter(s => s.appointment?.status === 'confirmed').length
        const totalMinutes = schedule.slots.filter(s => s.appointment).reduce((sum, slot) =>
            sum + (slot.appointment?.durationMinutes || 0), 0
        )

        return { total, available, scheduled, confirmed, totalMinutes }
    }

    const renderDayView = () => {
        const stats = getDayStats(daySchedule)

        return (
            <div className="space-y-6">
                <Card className="bg-gradient-to-br from-white via-slate-50/50 to-white border-slate-200 shadow-lg">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
                                    <CalendarDays className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">
                                        {format(currentDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                    </h2>
                                    <p className="text-sm text-slate-600 font-normal">
                                        {format(currentDate, "EEEE", { locale: ptBR })}
                                        {isToday(currentDate) && (
                                            <Badge className="ml-2 bg-blue-100 text-blue-700 border-blue-200">Hoje</Badge>
                                        )}
                                    </p>
                                </div>
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDateNavigation('prev')}
                                    className="hover:scale-105 transition-transform duration-200"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setCurrentDate(new Date())
                                        onDateChange?.(new Date())
                                    }}
                                    className="hover:scale-105 transition-transform duration-200"
                                >
                                    Hoje
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDateNavigation('next')}
                                    className="hover:scale-105 transition-transform duration-200"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Estatísticas rápidas */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100/80 rounded-2xl border border-green-200">
                                <div className="text-2xl font-bold text-green-600">{stats.available}</div>
                                <div className="text-sm text-green-700 font-medium">Disponíveis</div>
                            </div>
                            <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100/80 rounded-2xl border border-blue-200">
                                <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
                                <div className="text-sm text-blue-700 font-medium">Agendados</div>
                            </div>
                            <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100/80 rounded-2xl border border-purple-200">
                                <div className="text-2xl font-bold text-purple-600">{stats.confirmed}</div>
                                <div className="text-sm text-purple-700 font-medium">Confirmados</div>
                            </div>
                            <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-orange-100/80 rounded-2xl border border-orange-200">
                                <div className="text-2xl font-bold text-orange-600">{stats.totalMinutes}min</div>
                                <div className="text-sm text-orange-700 font-medium">Total Agendado</div>
                            </div>
                        </div>

                        {/* Slots de horário */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {daySchedule.slots.map((slot) => {
                                const isSelected = selectedTimeSlot === slot.time
                                return (
                                    <Button
                                        key={slot.time}
                                        variant="outline"
                                        className={cn(
                                            "h-auto p-4 flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden",
                                            getSlotStatusColor(slot, isSelected)
                                        )}
                                        onClick={() => slot.available && handleTimeClick(slot.time)}
                                        disabled={!slot.available}
                                    >
                                        {/* Efeito de brilho para horários disponíveis */}
                                        {slot.available && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                        )}

                                        <div className="flex items-center gap-2 mb-2 relative z-10">
                                            {getSlotIcon(slot)}
                                            <span className="font-mono text-sm font-semibold">{slot.time}</span>
                                        </div>

                                        {slot.appointment && (
                                            <div className="text-xs text-center relative z-10 space-y-1">
                                                <p className="font-semibold truncate w-full leading-tight">
                                                    {slot.appointment.clientName}
                                                </p>
                                                <p className="text-opacity-80 truncate w-full leading-tight">
                                                    {slot.appointment.procedureName}
                                                </p>
                                                <p className="text-opacity-70 font-medium">
                                                    {slot.appointment.durationMinutes}min
                                                </p>
                                            </div>
                                        )}

                                        {slot.available && (
                                            <div className="text-xs text-slate-500 mt-1 relative z-10">
                                                Livre
                                            </div>
                                        )}
                                    </Button>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const renderWeekView = () => (
        <Card className="bg-gradient-to-br from-white via-slate-50/50 to-white border-slate-200 shadow-lg">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
                        <CalendarDays className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">
                            Semana de {format(weekSchedule[0].date, "d 'de' MMMM", { locale: ptBR })}
                        </h2>
                        <p className="text-sm text-slate-600 font-normal">Visão semanal dos horários</p>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-7 gap-4">
                    {weekSchedule.map((daySchedule, index) => {
                        const stats = getDayStats(daySchedule)
                        const isToday = isSameDay(daySchedule.date, new Date())

                        return (
                            <div key={daySchedule.date.toISOString()} className="space-y-3">
                                {/* Header do dia */}
                                <div className={cn(
                                    "text-center p-3 rounded-xl border-2 transition-all duration-300",
                                    isToday
                                        ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white border-blue-500 shadow-lg"
                                        : "bg-slate-50 border-slate-200 hover:border-slate-300"
                                )}>
                                    <p className="text-xs font-semibold opacity-90">
                                        {format(daySchedule.date, 'EEE', { locale: ptBR })}
                                    </p>
                                    <p className="text-lg font-bold">
                                        {format(daySchedule.date, 'd')}
                                    </p>
                                    {isToday && (
                                        <Badge className="mt-1 bg-white/20 text-white border-white/30 text-xs">
                                            Hoje
                                        </Badge>
                                    )}
                                </div>

                                {/* Estatísticas do dia */}
                                <div className="space-y-1 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Livre:</span>
                                        <span className="font-semibold text-green-600">{stats.available}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Agendado:</span>
                                        <span className="font-semibold text-blue-600">{stats.scheduled + stats.confirmed}</span>
                                    </div>
                                </div>

                                {/* Mini horários */}
                                <div className="space-y-1 max-h-80 overflow-y-auto scrollbar-hide">
                                    {daySchedule.slots.slice(0, 8).map((slot) => (
                                        <Button
                                            key={slot.time}
                                            variant="outline"
                                            size="sm"
                                            className={cn(
                                                "w-full h-8 p-1 text-xs transition-all duration-300",
                                                getSlotStatusColor(slot)
                                            )}
                                            onClick={() => {
                                                setCurrentDate(daySchedule.date)
                                                onDateChange?.(daySchedule.date)
                                                slot.available && handleTimeClick(slot.time)
                                            }}
                                            disabled={!slot.available}
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                <span className="font-mono">{slot.time}</span>
                                                {slot.appointment && (
                                                    <div className="w-2 h-2 rounded-full bg-current opacity-60" />
                                                )}
                                            </div>
                                        </Button>
                                    ))}
                                    {daySchedule.slots.length > 8 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full h-6 text-xs text-slate-500 hover:text-slate-700"
                                            onClick={() => {
                                                setCurrentDate(daySchedule.date)
                                                onDateChange?.(daySchedule.date)
                                                setViewMode('day')
                                            }}
                                        >
                                            +{daySchedule.slots.length - 8} mais
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )

    const renderLegend = () => (
        <Card className="bg-gradient-to-br from-white via-slate-50/50 to-white border-slate-200 shadow-lg">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Filter className="w-5 h-5 text-slate-600" />
                        Legenda
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowLegend(!showLegend)}
                        className="hover:bg-slate-100"
                    >
                        {showLegend ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                </div>
            </CardHeader>
            {showLegend && (
                <CardContent className="space-y-3">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-white border-2 border-slate-300 rounded flex items-center justify-center">
                                <Timer className="w-3 h-3 text-slate-400" />
                            </div>
                            <span className="text-sm text-slate-700">Disponível</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-blue-300 rounded flex items-center justify-center">
                                <Clock className="w-3 h-3 text-blue-600" />
                            </div>
                            <span className="text-sm text-slate-700">Agendado</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-gradient-to-br from-green-100 to-green-200 border-2 border-green-300 rounded flex items-center justify-center">
                                <CheckCircle className="w-3 h-3 text-green-600" />
                            </div>
                            <span className="text-sm text-slate-700">Confirmado</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 rounded flex items-center justify-center">
                                <CheckCircle className="w-3 h-3 text-gray-600" />
                            </div>
                            <span className="text-sm text-slate-700">Concluído</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-gradient-to-br from-red-100 to-red-200 border-2 border-red-300 rounded flex items-center justify-center">
                                <XCircle className="w-3 h-3 text-red-600" />
                            </div>
                            <span className="text-sm text-slate-700">Cancelado</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-slate-300 rounded"></div>
                            <span className="text-sm text-slate-700">Indisponível</span>
                        </div>
                    </div>

                    <Separator />

                    <div className="text-xs text-slate-500 space-y-1">
                        <p><strong>Dica:</strong> Clique em um horário disponível para selecioná-lo</p>
                        <p>Horários em <strong>azul/roxo</strong> estão selecionados</p>
                    </div>
                </CardContent>
            )}
        </Card>
    )

    const getAllDaysStats = () => {
        if (viewMode === 'week') {
            return weekSchedule.reduce((acc, day) => {
                const stats = getDayStats(day)
                return {
                    total: acc.total + stats.total,
                    available: acc.available + stats.available,
                    scheduled: acc.scheduled + stats.scheduled,
                    confirmed: acc.confirmed + stats.confirmed,
                    totalMinutes: acc.totalMinutes + stats.totalMinutes
                }
            }, { total: 0, available: 0, scheduled: 0, confirmed: 0, totalMinutes: 0 })
        }
        return getDayStats(daySchedule)
    }

    return (
        <div className="space-y-6">
            {/* Header com navegação de visualização */}
            {showWeekView && (
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Horários Disponíveis</h1>
                        <p className="text-slate-600">Gerencie e visualize os slots de horário</p>
                    </div>
                    <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'day' | 'week')}>
                        <TabsList className="bg-slate-100">
                            <TabsTrigger value="day" className="text-sm">Dia</TabsTrigger>
                            <TabsTrigger value="week" className="text-sm">Semana</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            )}

            {showWeekView ? (
                <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'day' | 'week')}>
                    <TabsContent value="day" className="space-y-6">
                        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                            <div className="xl:col-span-3">
                                {renderDayView()}
                            </div>
                            <div className="space-y-6">
                                {renderLegend()}
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="week" className="space-y-6">
                        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                            <div className="xl:col-span-3">
                                {renderWeekView()}
                            </div>
                            <div className="space-y-6">
                                {renderLegend()}

                                {/* Resumo semanal */}
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5 text-blue-600" />
                                            Resumo da Semana
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {(() => {
                                            const stats = getAllDaysStats()
                                            return (
                                                <div className="space-y-3">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-600">Total de slots:</span>
                                                        <span className="font-semibold">{stats.total}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-600">Disponíveis:</span>
                                                        <span className="font-semibold text-green-600">{stats.available}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-600">Agendados:</span>
                                                        <span className="font-semibold text-blue-600">{stats.scheduled + stats.confirmed}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-600">Taxa de ocupação:</span>
                                                        <span className="font-semibold text-purple-600">
                                                            {stats.total > 0 ? Math.round(((stats.scheduled + stats.confirmed) / stats.total) * 100) : 0}%
                                                        </span>
                                                    </div>
                                                    <Separator />
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-600">Total agendado:</span>
                                                        <span className="font-semibold text-orange-600">{stats.totalMinutes}min</span>
                                                    </div>
                                                </div>
                                            )
                                        })()}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    <div className="xl:col-span-3">
                        {renderDayView()}
                    </div>
                    <div className="space-y-6">
                        {renderLegend()}
                    </div>
                </div>
            )}
        </div>
    )
}

export default TimeSlots