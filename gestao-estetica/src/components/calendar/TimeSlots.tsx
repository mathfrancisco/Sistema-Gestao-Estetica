import React, { useState, useEffect, useMemo } from 'react'
import { Clock, Calendar, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
}

const addMinutes = (date: Date, minutes: number) => {
    const result = new Date(date)
    result.setMinutes(result.getMinutes() + minutes)
    return result
}

const isAfter = (date1: Date, date2: Date) => date1.getTime() > date2.getTime()
const isBefore = (date1: Date, date2: Date) => date1.getTime() < date2.getTime()
import { useGoogleCalendar } from '@/lib/hooks/useGoogleCalendar'
import { useAppointments } from '@/lib/hooks/useAppointment'

interface TimeSlot {
    time: string
    datetime: string
    available: boolean
    reason?: string
}

interface TimeSlotsProps {
    selectedDate: Date
    duration: number // em minutos
    onTimeSlotSelect: (datetime: string) => void
    selectedTimeSlot?: string
    workingHours?: {
        start: string // formato "09:00"
        end: string   // formato "18:00"
    }
    excludedTimes?: string[] // horários específicos a excluir
    interval?: number // intervalo entre slots em minutos
    showUnavailableSlots?: boolean
}

export default function TimeSlots({
                                      selectedDate,
                                      duration = 60,
                                      onTimeSlotSelect,
                                      selectedTimeSlot,
                                      workingHours = { start: '09:00', end: '18:00' },
                                      excludedTimes = [],
                                      interval = 30,
                                      showUnavailableSlots = true
                                  }: TimeSlotsProps) {
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
    const [loading, setLoading] = useState(false)

    const { getEventsForDate, isTimeSlotAvailable } = useGoogleCalendar()
    const { getAppointmentsByDate } = useAppointments()

    // Gerar slots de tempo
    const generateTimeSlots = useMemo(() => {
        const slots: TimeSlot[] = []
        const startTime = new Date(selectedDate)
        const [startHour, startMinute] = workingHours.start.split(':').map(Number)
        startTime.setHours(startHour, startMinute, 0, 0)

        const endTime = new Date(selectedDate)
        const [endHour, endMinute] = workingHours.end.split(':').map(Number)
        endTime.setHours(endHour, endMinute, 0, 0)

        let currentTime = new Date(startTime)

        while (isBefore(currentTime, endTime)) {
            const timeString = formatTime(currentTime)
            const datetimeString = currentTime.toISOString()

            // Verificar se o horário está na lista de exclusões
            const isExcluded = excludedTimes.includes(timeString)

            // Verificar se ainda há tempo suficiente antes do fim do expediente
            const endSlotTime = addMinutes(currentTime, duration)
            const hasEnoughTime = isBefore(endSlotTime, endTime) || endSlotTime.getTime() === endTime.getTime()

            slots.push({
                time: timeString,
                datetime: datetimeString,
                available: !isExcluded && hasEnoughTime,
                reason: isExcluded ? 'Horário bloqueado' : !hasEnoughTime ? 'Duração insuficiente' : undefined
            })

            currentTime = addMinutes(currentTime, interval)
        }

        return slots
    }, [selectedDate, workingHours, duration, interval, excludedTimes])

    // Verificar disponibilidade considerando agendamentos existentes e eventos do Google Calendar
    const checkAvailability = async (slots: TimeSlot[]) => {
        setLoading(true)

        try {
            // Buscar agendamentos do dia
            const dateString = selectedDate.toISOString().split('T')[0]
            const appointments = await getAppointmentsByDate(dateString)

            // Buscar eventos do Google Calendar
            const calendarEvents = getEventsForDate(selectedDate)

            const updatedSlots = slots.map(slot => {
                if (!slot.available) return slot

                const slotStart = new Date(slot.datetime)
                const slotEnd = addMinutes(slotStart, duration)

                // Verificar conflito com agendamentos
                const hasAppointmentConflict = appointments.some(appointment => {
                    const appointmentStart = new Date(appointment.scheduled_datetime)
                    const appointmentEnd = addMinutes(appointmentStart, appointment.duration_minutes || duration)

                    return (
                        (slotStart < appointmentEnd && slotEnd > appointmentStart) &&
                        appointment.status !== 'cancelled'
                    )
                })

                // Verificar conflito com eventos do Google Calendar
                const hasCalendarConflict = calendarEvents.some(event => {
                    const eventStart = new Date(event.start.dateTime)
                    const eventEnd = new Date(event.end.dateTime)

                    return slotStart < eventEnd && slotEnd > eventStart
                })

                // Verificar se o slot está no passado
                const isPast = isAfter(new Date(), slotStart)

                let available = slot.available && !hasAppointmentConflict && !hasCalendarConflict && !isPast
                let reason = slot.reason

                if (isPast) {
                    available = false
                    reason = 'Horário já passou'
                } else if (hasAppointmentConflict) {
                    available = false
                    reason = 'Já existe agendamento'
                } else if (hasCalendarConflict) {
                    available = false
                    reason = 'Conflito no calendário'
                }

                return {
                    ...slot,
                    available,
                    reason
                }
            })

            setTimeSlots(updatedSlots)
        } catch (error) {
            console.error('Erro ao verificar disponibilidade:', error)
            setTimeSlots(slots)
        } finally {
            setLoading(false)
        }
    }

    // Atualizar slots quando a data ou duração mudar
    useEffect(() => {
        checkAvailability(generateTimeSlots)
    }, [generateTimeSlots, selectedDate, duration])

    const handleTimeSlotClick = (slot: TimeSlot) => {
        if (slot.available) {
            onTimeSlotSelect(slot.datetime)
        }
    }

    const availableSlots = timeSlots.filter(slot => slot.available)
    const unavailableSlots = timeSlots.filter(slot => !slot.available)

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Clock className="h-5 w-5" />
                        <span>Horários Disponíveis</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center p-8">
                        <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                            <span>Verificando disponibilidade...</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Clock className="h-5 w-5" />
                            <span>Horários Disponíveis</span>
                        </div>
                        <Badge variant="secondary">
                            {formatDate(selectedDate)}
                        </Badge>
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    {availableSlots.length === 0 ? (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Não há horários disponíveis para esta data. Tente selecionar outro dia.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <>
                            <div className="text-sm text-gray-600 mb-4">
                                <p>Duração: {duration} minutos</p>
                                <p>{availableSlots.length} horário(s) disponível(is)</p>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {availableSlots.map((slot) => (
                                    <Button
                                        key={slot.time}
                                        variant={selectedTimeSlot === slot.datetime ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handleTimeSlotClick(slot)}
                                        className="h-12 flex flex-col items-center justify-center"
                                    >
                                        <Clock className="h-3 w-3 mb-1" />
                                        <span className="text-xs">{slot.time}</span>
                                    </Button>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {showUnavailableSlots && unavailableSlots.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm text-gray-500">
                            Horários Indisponíveis
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {unavailableSlots.map((slot) => (
                                <div
                                    key={slot.time}
                                    className="h-12 flex flex-col items-center justify-center border border-gray-200 rounded-md bg-gray-50 text-gray-400"
                                    title={slot.reason}
                                >
                                    <Clock className="h-3 w-3 mb-1" />
                                    <span className="text-xs">{slot.time}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 space-y-1 text-xs text-gray-500">
                            <p>Legendas:</p>
                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center space-x-1">
                                    <div className="w-3 h-3 bg-gray-200 rounded"></div>
                                    <span>Indisponível</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                    <span>Disponível</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}