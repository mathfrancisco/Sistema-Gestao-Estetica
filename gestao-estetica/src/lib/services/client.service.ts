// lib/services/client.service.ts
import { supabase } from '@/lib/database/supabase/client'
import type { Database } from '@/lib/database/supabase/types'

type Client = Database['public']['Tables']['clients']['Row']
type ClientInsert = Database['public']['Tables']['clients']['Insert']
type ClientUpdate = Database['public']['Tables']['clients']['Update']
type ClientStatus = Database['public']['Enums']['client_status_enum']
type ClientSegment = Database['public']['Enums']['client_segment_enum']

export interface ClientFilters {
    status?: ClientStatus
    segment?: ClientSegment
    search?: string
    dateFrom?: string
    dateTo?: string
}

export interface ClientsPaginationOptions {
    page: number
    limit: number
    filters?: ClientFilters
    sortBy?: keyof Client
    sortOrder?: 'asc' | 'desc'
}

export interface ClientsResponse {
    data: Client[]
    total: number
    page: number
    totalPages: number
}

export class ClientService {
    static async getClients(options: ClientsPaginationOptions): Promise<ClientsResponse> {
        const { page, limit, filters, sortBy = 'created_at', sortOrder = 'desc' } = options
        const offset = (page - 1) * limit

        let query = supabase
            .from('clients')
            .select('*', { count: 'exact' })

        // Aplicar filtros
        if (filters?.status) {
            query = query.eq('status', filters.status)
        }

        if (filters?.segment) {
            query = query.eq('segment', filters.segment)
        }

        if (filters?.search) {
            query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
        }

        if (filters?.dateFrom) {
            query = query.gte('created_at', filters.dateFrom)
        }

        if (filters?.dateTo) {
            query = query.lte('created_at', filters.dateTo)
        }

        // Aplicar ordenação e paginação
        query = query
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range(offset, offset + limit - 1)

        const { data, error, count } = await query

        if (error) {
            throw new Error(`Erro ao buscar clientes: ${error.message}`)
        }

        return {
            data: data || [],
            total: count || 0,
            page,
            totalPages: Math.ceil((count || 0) / limit)
        }
    }

    static async getClientById(id: string): Promise<Client> {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            throw new Error(`Erro ao buscar cliente: ${error.message}`)
        }

        return data
    }

    static async createClient(clientData: ClientInsert): Promise<Client> {
        const { data, error } = await supabase
            .from('clients')
            .insert(clientData)
            .select()
            .single()

        if (error) {
            throw new Error(`Erro ao criar cliente: ${error.message}`)
        }

        return data
    }

    static async updateClient(id: string, clientData: ClientUpdate): Promise<Client> {
        const { data, error } = await supabase
            .from('clients')
            .update({
                ...clientData,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            throw new Error(`Erro ao atualizar cliente: ${error.message}`)
        }

        return data
    }

    static async deleteClient(id: string): Promise<void> {
        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', id)

        if (error) {
            throw new Error(`Erro ao deletar cliente: ${error.message}`)
        }
    }

    static async getClientsBySegment(segment: ClientSegment): Promise<Client[]> {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('segment', segment)
            .eq('status', 'active')
            .order('last_visit', { ascending: false })

        if (error) {
            throw new Error(`Erro ao buscar clientes por segmento: ${error.message}`)
        }

        return data || []
    }

    static async updateClientSegment(id: string, segment: ClientSegment): Promise<Client> {
        return this.updateClient(id, { segment })
    }

    static async getClientStats(userId?: string): Promise<{
        clientsBySegment: { segment: string, count: number }[]
        total: number
        active: number
        inactive: number
        vip: number
        atRisk: number
        new: number
    }> {
        let query = supabase
            .from('clients')
            .select('status, segment')

        if (userId) {
            query = query.eq('user_id', userId)
        }

        const { data, error } = await query

        if (error) {
            throw new Error(`Erro ao buscar estatísticas de clientes: ${error.message}`)
        }

        // Contadores gerais
        let total = 0, active = 0, inactive = 0, vip = 0, atRisk = 0, novo = 0
        const segmentMap: Record<string, number> = {}

        data?.forEach(client => {
            total++
            if (client.status === 'active') active++
            if (client.status === 'inactive') inactive++
            if (client.segment === 'vip') vip++
            if (client.segment === 'at_risk') atRisk++
            if (client.segment === 'new') novo++
            if (client.segment) {
                segmentMap[client.segment] = (segmentMap[client.segment] || 0) + 1
            }
        })

        const clientsBySegment = Object.entries(segmentMap).map(([segment, count]) => ({
            segment,
            count
        }))

        return {
            clientsBySegment,
            total,
            active,
            inactive,
            vip,
            atRisk,
            new: novo
        }
    }

    static async searchClients(query: string, limit: number = 10): Promise<Client[]> {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
            .eq('status', 'active')
            .order('last_visit', { ascending: false })
            .limit(limit)

        if (error) {
            throw new Error(`Erro ao pesquisar clientes: ${error.message}`)
        }

        return data || []
    }

    static async getClientHistory(clientId: string): Promise<{
        appointments: any[]
        attendances: any[]
        totalSpent: number
        totalVisits: number
    }> {
        // Buscar agendamentos
        const { data: appointments, error: appointmentsError } = await supabase
            .from('appointments')
            .select(`
                *,
                procedures (name, price),
                attendances (value, date, payment_status)
            `)
            .eq('client_id', clientId)
            .order('scheduled_datetime', { ascending: false })

        if (appointmentsError) {
            throw new Error(`Erro ao buscar histórico de agendamentos: ${appointmentsError.message}`)
        }

        // Buscar atendimentos
        const { data: attendances, error: attendancesError } = await supabase
            .from('attendances')
            .select(`
                *,
                procedures (name, price)
            `)
            .eq('client_id', clientId)
            .order('date', { ascending: false })

        if (attendancesError) {
            throw new Error(`Erro ao buscar histórico de atendimentos: ${attendancesError.message}`)
        }

        // Calcular totais
        const totalSpent = attendances?.reduce((sum, attendance) =>
            sum + (attendance.value - attendance.discount || 0), 0
        ) || 0

        const totalVisits = attendances?.length || 0

        return {
            appointments: appointments || [],
            attendances: attendances || [],
            totalSpent,
            totalVisits
        }
    }

    static async bulkUpdateClientSegments(updates: { id: string; segment: ClientSegment }[]): Promise<void> {
        const promises = updates.map(update =>
            this.updateClient(update.id, { segment: update.segment })
        )

        await Promise.all(promises)
    }

    static async getUpcomingBirthdays(days: number = 30): Promise<Client[]> {
        const today = new Date()
        const futureDate = new Date()
        futureDate.setDate(today.getDate() + days)

        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .not('birthday', 'is', null)
            .eq('status', 'active')

        if (error) {
            throw new Error(`Erro ao buscar aniversariantes: ${error.message}`)
        }

        // Filtrar aniversários próximos (considerando apenas mês e dia)
        const upcoming = data?.filter(client => {
            if (!client.birthday) return false

            const birthday = new Date(client.birthday)
            const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate())

            // Se já passou este ano, considerar o próximo ano
            if (thisYearBirthday < today) {
                thisYearBirthday.setFullYear(today.getFullYear() + 1)
            }

            return thisYearBirthday <= futureDate
        }) || []

        return upcoming.sort((a, b) => {
            if (!a.birthday || !b.birthday) return 0
            const dateA = new Date(a.birthday)
            const dateB = new Date(b.birthday)
            return dateA.getTime() - dateB.getTime()
        })
    }
}