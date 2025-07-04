// lib/services/appointment.service.ts
import { supabase } from '@/lib/database/supabase/client'
import type { Database } from '@/lib/database/supabase/types'

type Appointment = Database['public']['Tables']['appointments']['Row']
type AppointmentInsert = Database['public']['Tables']['appointments']['Insert']
type AppointmentUpdate = Database['public']['Tables']['appointments']['Update']
type AppointmentStatus = Database['public']['Enums']['appointment_status_enum']

export interface AppointmentFilters {
    status?: AppointmentStatus
    clientId?: string
    procedureId?: string
    dateFrom?: string
    dateTo?: string
    calendarSynced?: boolean
}

export interface AppointmentsPaginationOptions {
    page: number
    limit: number
    filters?: AppointmentFilters
    sortBy?: keyof Appointment
    sortOrder?: 'asc' | 'desc'
}

export interface AppointmentsResponse {
    data: Appointment[]
    total: number
    page: number
    totalPages: number
}

export interface AppointmentWithDetails extends Appointment {
    clients?: {
        id: string
        name: string
        email: string | null
        phone: string | null
        address?: any
    }
    procedures?: {
        id: string
        name: string
        price: number
        duration_minutes: number
    }
}

export class AppointmentService {
    static async getAppointments(options: AppointmentsPaginationOptions): Promise<AppointmentsResponse> {
        const { page, limit, filters, sortBy = 'scheduled_datetime', sortOrder = 'asc' } = options
        const offset = (page - 1) * limit

        let query = supabase
            .from('appointments')
            .select('*', { count: 'exact' })

        // Aplicar filtros
        if (filters?.status) {
            query = query.eq('status', filters.status)
        }

        if (filters?.clientId) {
            query = query.eq('client_id', filters.clientId)
        }

        if (filters?.procedureId) {
            query = query.eq('procedure_id', filters.procedureId)
        }

        if (filters?.dateFrom) {
            query = query.gte('scheduled_datetime', filters.dateFrom)
        }

        if (filters?.dateTo) {
            query = query.lte('scheduled_datetime', filters.dateTo)
        }

        if (filters?.calendarSynced !== undefined) {
            query = query.eq('calendar_synced', filters.calendarSynced)
        }

        // Aplicar ordenação e paginação
        query = query
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range(offset, offset + limit - 1)

        const { data, error, count } = await query

        if (error) {
            throw new Error(`Erro ao buscar agendamentos: ${error.message}`)
        }

        return {
            data: data || [],
            total: count || 0,
            page,
            totalPages: Math.ceil((count || 0) / limit)
        }
    }

    static async getAppointmentsWithDetails(options: AppointmentsPaginationOptions): Promise<{
        data: AppointmentWithDetails[]
        total: number
        page: number
        totalPages: number
    }> {
        const { page, limit, filters, sortBy = 'scheduled_datetime', sortOrder = 'asc' } = options
        const offset = (page - 1) * limit

        let query = supabase
            .from('appointments')
            .select(`
                *,
                clients:client_id (
                    id,
                    name,
                    email,
                    phone,
                    address
                ),
                procedures:procedure_id (
                    id,
                    name,
                    price,
                    duration_minutes
                )
            `, { count: 'exact' })

        // Aplicar filtros
        if (filters?.status) {
            query = query.eq('status', filters.status)
        }

        if (filters?.clientId) {
            query = query.eq('client_id', filters.clientId)
        }

        if (filters?.procedureId) {
            query = query.eq('procedure_id', filters.procedureId)
        }

        if (filters?.dateFrom) {
            query = query.gte('scheduled_datetime', filters.dateFrom)
        }

        if (filters?.dateTo) {
            query = query.lte('scheduled_datetime', filters.dateTo)
        }

        if (filters?.calendarSynced !== undefined) {
            query = query.eq('calendar_synced', filters.calendarSynced)
        }

        // Aplicar ordenação e paginação
        query = query
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range(offset, offset + limit - 1)

        const { data, error, count } = await query

        if (error) {
            throw new Error(`Erro ao buscar agendamentos com detalhes: ${error.message}`)
        }

        return {
            data: data || [],
            total: count || 0,
            page,
            totalPages: Math.ceil((count || 0) / limit)
        }
    }

    static async getAppointmentById(id: string): Promise<AppointmentWithDetails> {
        const { data, error } = await supabase
            .from('appointments')
            .select(`
                *,
                clients:client_id (
                    id,
                    name,
                    email,
                    phone,
                    address
                ),
                procedures:procedure_id (
                    id,
                    name,
                    price,
                    duration_minutes
                )
            `)
            .eq('id', id)
            .single()

        if (error) {
            throw new Error(`Erro ao buscar agendamento: ${error.message}`)
        }

        return data
    }

    static async createAppointment(appointmentData: AppointmentInsert): Promise<Appointment> {
        const { data, error } = await supabase
            .from('appointments')
            .insert(appointmentData)
            .select()
            .single()

        if (error) {
            throw new Error(`Erro ao criar agendamento: ${error.message}`)
        }

        return data
    }

    static async updateAppointment(id: string, appointmentData: AppointmentUpdate): Promise<Appointment> {
        const { data, error } = await supabase
            .from('appointments')
            .update({
                ...appointmentData,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            throw new Error(`Erro ao atualizar agendamento: ${error.message}`)
        }

        return data
    }

    static async deleteAppointment(id: string): Promise<void> {
        const { error } = await supabase
            .from('appointments')
            .delete()
            .eq('id', id)

        if (error) {
            throw new Error(`Erro ao deletar agendamento: ${error.message}`)
        }
    }

    static async updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
        return this.updateAppointment(id, { status })
    }

    static async getAppointmentsByDate(date: string, userId?: string): Promise<AppointmentWithDetails[]> {
        const startDate = new Date(date)
        startDate.setHours(0, 0, 0, 0)

        const endDate = new Date(date)
        endDate.setHours(23, 59, 59, 999)

        let query = supabase
            .from('appointments')
            .select(`
                *,
                clients:client_id (
                    id,
                    name,
                    email,
                    phone,
                    address
                ),
                procedures:procedure_id (
                    id,
                    name,
                    price,
                    duration_minutes
                )
            `)
            .gte('scheduled_datetime', startDate.toISOString())
            .lte('scheduled_datetime', endDate.toISOString())
            .order('scheduled_datetime', { ascending: true })

        if (userId) {
            query = query.eq('user_id', userId)
        }

        const { data, error } = await query

        if (error) {
            throw new Error(`Erro ao buscar agendamentos por data: ${error.message}`)
        }

        return data || []
    }

    static async getAppointmentsByDateRange(startDate: string, endDate: string, userId?: string): Promise<AppointmentWithDetails[]> {
        let query = supabase
            .from('appointments')
            .select(`
                *,
                clients:client_id (
                    id,
                    name,
                    email,
                    phone,
                    address
                ),
                procedures:procedure_id (
                    id,
                    name,
                    price,
                    duration_minutes
                )
            `)
            .gte('scheduled_datetime', startDate)
            .lte('scheduled_datetime', endDate)
            .order('scheduled_datetime', { ascending: true })

        if (userId) {
            query = query.eq('user_id', userId)
        }

        const { data, error } = await query

        if (error) {
            throw new Error(`Erro ao buscar agendamentos por período: ${error.message}`)
        }

        return data || []
    }

    static async getTodayAppointments(userId?: string): Promise<AppointmentWithDetails[]> {
        const today = new Date().toISOString().split('T')[0]
        return this.getAppointmentsByDate(today, userId)
    }

    static async getUpcomingAppointments(userId?: string, days: number = 7): Promise<AppointmentWithDetails[]> {
        const now = new Date()
        const futureDate = new Date()
        futureDate.setDate(now.getDate() + days)

        let query = supabase
            .from('appointments')
            .select(`
                *,
                clients:client_id (
                    id,
                    name,
                    email,
                    phone,
                    address
                ),
                procedures:procedure_id (
                    id,
                    name,
                    price,
                    duration_minutes
                )
            `)
            .gte('scheduled_datetime', now.toISOString())
            .lte('scheduled_datetime', futureDate.toISOString())
            .in('status', ['scheduled', 'confirmed'])
            .order('scheduled_datetime', { ascending: true })

        if (userId) {
            query = query.eq('user_id', userId)
        }

        const { data, error } = await query

        if (error) {
            throw new Error(`Erro ao buscar próximos agendamentos: ${error.message}`)
        }

        return data || []
    }

    static async getAppointmentStats(userId?: string): Promise<{
        total: number
        scheduled: number
        confirmed: number
        completed: number
        cancelled: number
        noShow: number
        todayTotal: number
        weekTotal: number
        monthTotal: number
    }> {
        const now = new Date()
        const startOfDay = new Date(now)
        startOfDay.setHours(0, 0, 0, 0)

        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay())
        startOfWeek.setHours(0, 0, 0, 0)

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        let query = supabase
            .from('appointments')
            .select('status, scheduled_datetime')

        if (userId) {
            query = query.eq('user_id', userId)
        }

        const { data, error } = await query

        if (error) {
            throw new Error(`Erro ao buscar estatísticas de agendamentos: ${error.message}`)
        }

        const stats = data?.reduce((acc, appointment) => {
            const appointmentDate = new Date(appointment.scheduled_datetime)

            acc.total++

            switch (appointment.status) {
                case 'scheduled':
                    acc.scheduled++
                    break
                case 'confirmed':
                    acc.confirmed++
                    break
                case 'completed':
                    acc.completed++
                    break
                case 'cancelled':
                    acc.cancelled++
                    break
                case 'no_show':
                    acc.noShow++
                    break
            }

            if (appointmentDate >= startOfDay) {
                acc.todayTotal++
            }
            if (appointmentDate >= startOfWeek) {
                acc.weekTotal++
            }
            if (appointmentDate >= startOfMonth) {
                acc.monthTotal++
            }

            return acc
        }, {
            total: 0,
            scheduled: 0,
            confirmed: 0,
            completed: 0,
            cancelled: 0,
            noShow: 0,
            todayTotal: 0,
            weekTotal: 0,
            monthTotal: 0
        }) || {
            total: 0,
            scheduled: 0,
            confirmed: 0,
            completed: 0,
            cancelled: 0,
            noShow: 0,
            todayTotal: 0,
            weekTotal: 0,
            monthTotal: 0
        }

        return stats
    }

    static async getConflictingAppointments(
        scheduledDateTime: string,
        durationMinutes: number,
        userId?: string,
        excludeId?: string
    ): Promise<Appointment[]> {
        const startTime = new Date(scheduledDateTime)
        const endTime = new Date(startTime.getTime() + durationMinutes * 60000)

        let query = supabase
            .from('appointments')
            .select('*')
            .gte('scheduled_datetime', startTime.toISOString())
            .lt('scheduled_datetime', endTime.toISOString())
            .neq('status', 'cancelled')

        if (userId) {
            query = query.eq('user_id', userId)
        }

        if (excludeId) {
            query = query.neq('id', excludeId)
        }

        const { data, error } = await query

        if (error) {
            throw new Error(`Erro ao verificar conflitos de agendamento: ${error.message}`)
        }

        return data || []
    }

    static async bulkUpdateAppointmentStatus(
        appointmentIds: string[],
        status: AppointmentStatus
    ): Promise<void> {
        const { error } = await supabase
            .from('appointments')
            .update({
                status,
                updated_at: new Date().toISOString()
            })
            .in('id', appointmentIds)

        if (error) {
            throw new Error(`Erro ao atualizar agendamentos em lote: ${error.message}`)
        }
    }

    // ==================== MÉTODOS DE SINCRONIZAÇÃO ====================

    // Método para buscar agendamentos não sincronizados
    static async getUnsyncedAppointments(userId: string) {
        try {
            console.log('🔍 Buscando agendamentos não sincronizados para usuário:', userId)

            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    clients:client_id (
                        id,
                        name,
                        email,
                        phone,
                        address
                    ),
                    procedures:procedure_id (
                        id,
                        name,
                        duration_minutes,
                        price
                    )
                `)
                .eq('user_id', userId)
                .eq('calendar_synced', false)
                .neq('status', 'cancelled')
                .order('scheduled_datetime', { ascending: true })

            if (error) {
                console.error('❌ Erro ao buscar agendamentos:', error)
                throw error
            }

            console.log('✅ Agendamentos não sincronizados encontrados:', data?.length || 0)
            return data || []
        } catch (error) {
            console.error('💥 Erro ao buscar agendamentos não sincronizados:', error)
            throw error
        }
    }

    // Método para marcar agendamento como sincronizado
    static async syncWithGoogleCalendar(appointmentId: string, googleEventId: string) {
        try {
            console.log('🔄 Marcando agendamento como sincronizado:', { appointmentId, googleEventId })

            const { data, error } = await supabase
                .from('appointments')
                .update({
                    calendar_synced: true,
                    google_event_id: googleEventId,
                    updated_at: new Date().toISOString()
                })
                .eq('id', appointmentId)
                .select()
                .single()

            if (error) {
                console.error('❌ Erro ao atualizar agendamento:', error)
                throw error
            }

            console.log('✅ Agendamento marcado como sincronizado')
            return data
        } catch (error) {
            console.error('💥 Erro ao marcar agendamento como sincronizado:', error)
            throw error
        }
    }

    // Método para buscar todos os agendamentos de um usuário
    static async getAppointmentsByUser(userId: string) {
        try {
            console.log('🔍 Buscando todos os agendamentos do usuário:', userId)

            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    clients:client_id (
                        id,
                        name,
                        email,
                        phone,
                        address
                    ),
                    procedures:procedure_id (
                        id,
                        name,
                        duration_minutes,
                        price
                    )
                `)
                .eq('user_id', userId)
                .order('scheduled_datetime', { ascending: true })

            if (error) {
                console.error('❌ Erro ao buscar agendamentos:', error)
                throw error
            }

            console.log('✅ Agendamentos encontrados:', data?.length || 0)
            return data || []
        } catch (error) {
            console.error('💥 Erro ao buscar agendamentos do usuário:', error)
            throw error
        }
    }

    // Método para remover sincronização (se evento for deletado do Google)
    static async unsyncFromGoogleCalendar(appointmentId: string) {
        try {
            console.log('🔄 Removendo sincronização do agendamento:', appointmentId)

            const { data, error } = await supabase
                .from('appointments')
                .update({
                    calendar_synced: false,
                    google_event_id: null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', appointmentId)
                .select()
                .single()

            if (error) {
                console.error('❌ Erro ao remover sincronização:', error)
                throw error
            }

            console.log('✅ Sincronização removida')
            return data
        } catch (error) {
            console.error('💥 Erro ao remover sincronização do agendamento:', error)
            throw error
        }
    }

    // Método para verificar se um agendamento está sincronizado
    static async checkSyncStatus(appointmentId: string) {
        try {
            console.log('🔍 Verificando status de sincronização:', appointmentId)

            const { data, error } = await supabase
                .from('appointments')
                .select('calendar_synced, google_event_id')
                .eq('id', appointmentId)
                .single()

            if (error) {
                console.error('❌ Erro ao verificar status:', error)
                throw error
            }

            const result = {
                isSynced: data.calendar_synced || false,
                googleEventId: data.google_event_id
            }

            console.log('✅ Status verificado:', result)
            return result
        } catch (error) {
            console.error('💥 Erro ao verificar status de sincronização:', error)
            throw error
        }
    }
}