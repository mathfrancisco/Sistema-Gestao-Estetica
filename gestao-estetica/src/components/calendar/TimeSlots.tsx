'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Clock,
    CalendarDays,
    User,
    CheckCircle,
    XCircle,
    AlertCircle,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'
import { format, addDays, startOfDay, addMinutes, isSameDay, isAfter, isBefore } from 'date-fns'
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
        onTimeSelect?.(currentDate, time)
    }

    const getSlotStatusColor = (slot: TimeSlot) => {
        if (!slot.available && slot.appointment) {
            switch (slot.appointment.status) {
                case 'confirmed':
                    return 'bg-green-100 text-green-800 border-green-200'
                case 'scheduled':
                    return 'bg-blue-100 text-blue-800 border-blue-200'
                case 'completed':
                    return 'bg-gray-100 text-gray-800 border-gray-200'
                case 'cancelled':
                    return 'bg-red-100 text-red-800 border-red-200'
                default:
                    return 'bg-gray-100 text-gray-800 border-gray-200'
            }
        }
        if (!slot.available) {
            return 'bg-gray-100 text-gray-500 border-gray-200'
        }
        return 'bg-white text-gray-900 border-gray-200 hover:bg-gray-50'
    }

    const getSlotIcon = (slot: TimeSlot) => {
        if (slot.appointment) {
            switch (slot.appointment.status) {
                case 'confirmed':
                    return <CheckCircle className="w-3 h-3" />
                case 'scheduled':
                    return <Clock className="w-3 h-3" />
                case 'cancelled':
                    return <XCircle className="w-3 h-3" />
                default:
                    return <AlertCircle className="w-3 h-3" />
            }
        }
        return null
    }

    const renderDayView = () => (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <CalendarDays className="w-5 h-5" />
                        {format(currentDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </CardTitle>
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
                            onClick={() => setCurrentDate(new Date())}
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
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {daySchedule.slots.map((slot) => (
                        <Button
                            key={slot.time}
                            variant="outline"
                            className={cn(
                                "h-auto p-3 flex flex-col items-start justify-start",
                                getSlotStatusColor(slot),
                                slot.available && "cursor-pointer hover:shadow-md transition-shadow"
                            )}
                            onClick={() => slot.available && handleTimeClick(slot.time)}
                            disabled={!slot.available}
                        >
                            <div className="flex items-center gap-2 w-full">
                                {getSlotIcon(slot)}
                                <span className="font-mono text-sm">{slot.time}</span>
                            </div>
                            {slot.appointment && (
                                <div className="text-xs mt-1 text-left">
                                    <p className="font-medium truncate w-full">
                                        {slot.appointment.clientName}
                                    </p>
                                    <p className="text-muted-foreground truncate w-full">
                                        {slot.appointment.procedureName}
                                    </p>
                                    <p className="text-muted-foreground">
                                        {slot.appointment.durationMinutes}min
                                    </p>
                                </div>
                            )}
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
    )

    const renderWeekView = () => (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5" />
                    Semana de {format(weekSchedule[0].date, "d 'de' MMMM", { locale: ptBR })}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-7 gap-2">
                    {weekSchedule.map((daySchedule) => (
                        <div key={daySchedule.date.toISOString()} className="space-y-2">
                            <div className="text-center p-2 bg-gray-50 rounded-lg">
                                <p className="text-xs font-medium text-gray-600">
                                    {format(daySchedule.date, 'EEE', { locale: ptBR })}
                                </p>
                                <p className="text-sm font-bold">
                                    {format(daySchedule.date, 'd')}
                                </p>
                            </div>
                            <div className="space-y-1 max-h-96 overflow-y-auto">
                                {daySchedule.slots.map((slot) => (
                                    <Button
                                        key={slot.time}
                                        variant="outline"
                                        size="sm"
                                        className={cn(
                                            "w-full h-auto p-2 flex flex-col text-xs",
                                            getSlotStatusColor(slot)
                                        )}
                                        onClick={() => {
                                            setCurrentDate(daySchedule.date)
                                            onDateChange?.(daySchedule.date)
                                            slot.available && handleTimeClick(slot.time)
                                        }}
                                        disabled={!slot.available}
                                    >
                                        <span className="font-mono">{slot.time}</span>
                                        {slot.appointment && (
                                            <span className="truncate w-full text-[10px]">
                        {slot.appointment.clientName}
                      </span>
                                        )}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )

    const renderLegend = () => (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm">Legenda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-white border border-gray-200 rounded"></div>
                    <span className="text-sm">Disponível</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
                    <span className="text-sm">Agendado</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
                    <span className="text-sm">Confirmado</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
                    <span className="text-sm">Indisponível</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
                    <span className="text-sm">Cancelado</span>
                </div>
            </CardContent>
        </Card>
    )

    return (
        <div className="space-y-6">
            {showWeekView && (
                <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'day' | 'week')}>
                    <TabsList>
                        <TabsTrigger value="day">Dia</TabsTrigger>
                        <TabsTrigger value="week">Semana</TabsTrigger>
                    </TabsList>
                    <TabsContent value="day" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            <div className="lg:col-span-3">
                                {renderDayView()}
                            </div>
                            <div>
                                {renderLegend()}
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="week" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            <div className="lg:col-span-3">
                                {renderWeekView()}
                            </div>
                            <div>
                                {renderLegend()}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            )}

            {!showWeekView && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3">
                        {renderDayView()}
                    </div>
                    <div>
                        {renderLegend()}
                    </div>
                </div>
            )}

            {/* Resumo do dia */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <User className="w-5 h-5" />
                        Resumo do Dia
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                                {daySchedule.slots.filter(s => s.appointment?.status === 'scheduled').length}
                            </div>
                            <div className="text-sm text-blue-700">Agendados</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                                {daySchedule.slots.filter(s => s.appointment?.status === 'confirmed').length}
                            </div>
                            <div className="text-sm text-green-700">Confirmados</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-600">
                                {daySchedule.slots.filter(s => s.available).length}
                            </div>
                            <div className="text-sm text-gray-700">Disponíveis</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">
                                {daySchedule.slots.filter(s => s.appointment).reduce((total, slot) =>
                                    total + (slot.appointment?.durationMinutes || 0), 0
                                )}min
                            </div>
                            <div className="text-sm text-purple-700">Total Agendado</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default TimeSlots