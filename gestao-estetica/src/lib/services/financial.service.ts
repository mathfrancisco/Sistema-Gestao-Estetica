// lib/services/financialService.ts
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type Attendance = Database['public']['Tables']['attendances']['Row']
type AttendanceInsert = Database['public']['Tables']['attendances']['Insert']
type AttendanceUpdate = Database['public']['Tables']['attendances']['Update']
type PaymentMethod = Database['public']['Enums']['payment_method_enum']
type PaymentStatus = Database['public']['Enums']['payment_status_enum']
type ProfitDistribution = Database['public']['Tables']['profit_distributions']['Row']
type ProfitDistributionInsert = Database['public']['Tables']['profit_distributions']['Insert']
type ProfitDistributionUpdate = Database['public']['Tables']['profit_distributions']['Update']
type ProfitDistributionConfig = Database['public']['Tables']['profit_distribution_config']['Row']
type ProfitDistributionConfigInsert = Database['public']['Tables']['profit_distribution_config']['Insert']
type ProfitDistributionConfigUpdate = Database['public']['Tables']['profit_distribution_config']['Update']
type ProfitCategory = Database['public']['Enums']['profit_category_enum']

export interface FinancialFilters {
    paymentStatus?: PaymentStatus
    paymentMethod?: PaymentMethod
    dateFrom?: string
    dateTo?: string
    clientId?: string
    procedureId?: string
}

export interface FinancialPaginationOptions {
    page: number
    limit: number
    filters?: FinancialFilters
    sortBy?: keyof Attendance
    sortOrder?: 'asc' | 'desc'
}

export interface AttendancesResponse {
    data: Attendance[]
    total: number
    page: number
    totalPages: number
}

export interface AttendanceWithDetails extends Attendance {
    clients?: { name: string; email: string | null }
    procedures?: { name: string; price: number }
}

export interface FinancialSummary {
    totalRevenue: number
    totalCosts: number
    totalProfit: number
    totalPending: number
    totalPaid: number
    totalDiscounts: number
    averageTicket: number
    transactionCount: number
}

export interface MonthlyFinancialReport {
    month: number
    year: number
    revenue: number
    costs: number
    profit: number
    transactions: number
    averageTicket: number
    paymentMethods: Partial<Record<PaymentMethod, number>>
}

// Updated interface to match database schema
export interface ProfitDistributionWithConfig extends ProfitDistribution {
    profit_distribution_config?: {
        category: ProfitCategory
        percentage: number
        description: string | null
    }
}

export interface ProfitDistributionSummary {
    totalProfit: number
    totalDistributed: number
    totalPending: number
    distributions: Array<{
        category: ProfitCategory
        description: string | null
        amount: number
        percentage: number
    }>
}

// Extended interface for profit distributions with additional fields
export interface ExtendedProfitDistribution {
    id: string
    user_id: string
    config_id: string
    amount: number
    period_start: string
    period_end: string
    description: string | null
    status: 'pending' | 'executed' | 'cancelled'
    executed_at: string | null
    created_at: string
    updated_at: string | null
}

export interface ExtendedProfitDistributionWithConfig extends ExtendedProfitDistribution {
    profit_distribution_config?: {
        category: ProfitCategory
        percentage: number
        description: string | null
    }
}

export class FinancialService {
    // ATTENDANCE METHODS
    static async getAttendances(options: FinancialPaginationOptions): Promise<AttendancesResponse> {
        const { page, limit, filters, sortBy = 'date', sortOrder = 'desc' } = options
        const offset = (page - 1) * limit

        let query = supabase
            .from('attendances')
            .select('*', { count: 'exact' })

        // Aplicar filtros
        if (filters?.paymentStatus) {
            query = query.eq('payment_status', filters.paymentStatus)
        }

        if (filters?.paymentMethod) {
            query = query.eq('payment_method', filters.paymentMethod)
        }

        if (filters?.clientId) {
            query = query.eq('client_id', filters.clientId)
        }

        if (filters?.procedureId) {
            query = query.eq('procedure_id', filters.procedureId)
        }

        if (filters?.dateFrom) {
            query = query.gte('date', filters.dateFrom)
        }

        if (filters?.dateTo) {
            query = query.lte('date', filters.dateTo)
        }

        // Aplicar ordenação e paginação
        query = query
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range(offset, offset + limit - 1)

        const { data, error, count } = await query

        if (error) {
            throw new Error(`Erro ao buscar atendimentos: ${error.message}`)
        }

        return {
            data: data || [],
            total: count || 0,
            page,
            totalPages: Math.ceil((count || 0) / limit)
        }
    }

    static async getAttendancesWithDetails(options: FinancialPaginationOptions): Promise<{
        data: AttendanceWithDetails[]
        total: number
        page: number
        totalPages: number
    }> {
        const { page, limit, filters, sortBy = 'date', sortOrder = 'desc' } = options
        const offset = (page - 1) * limit

        let query = supabase
            .from('attendances')
            .select(`
                *,
                clients (name, email),
                procedures (name, price)
            `, { count: 'exact' })

        // Aplicar filtros
        if (filters?.paymentStatus) {
            query = query.eq('payment_status', filters.paymentStatus)
        }

        if (filters?.paymentMethod) {
            query = query.eq('payment_method', filters.paymentMethod)
        }

        if (filters?.clientId) {
            query = query.eq('client_id', filters.clientId)
        }

        if (filters?.procedureId) {
            query = query.eq('procedure_id', filters.procedureId)
        }

        if (filters?.dateFrom) {
            query = query.gte('date', filters.dateFrom)
        }

        if (filters?.dateTo) {
            query = query.lte('date', filters.dateTo)
        }

        // Aplicar ordenação e paginação
        query = query
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range(offset, offset + limit - 1)

        const { data, error, count } = await query

        if (error) {
            throw new Error(`Erro ao buscar atendimentos com detalhes: ${error.message}`)
        }

        return {
            data: data || [],
            total: count || 0,
            page,
            totalPages: Math.ceil((count || 0) / limit)
        }
    }

    static async getAttendanceById(id: string): Promise<AttendanceWithDetails> {
        const { data, error } = await supabase
            .from('attendances')
            .select(`
                *,
                clients (name, email),
                procedures (name, price)
            `)
            .eq('id', id)
            .single()

        if (error) {
            throw new Error(`Erro ao buscar atendimento: ${error.message}`)
        }

        return data
    }

    static async createAttendance(attendanceData: AttendanceInsert): Promise<Attendance> {
        const { data, error } = await supabase
            .from('attendances')
            .insert(attendanceData)
            .select()
            .single()

        if (error) {
            throw new Error(`Erro ao criar atendimento: ${error.message}`)
        }

        return data
    }

    static async updateAttendance(id: string, attendanceData: AttendanceUpdate): Promise<Attendance> {
        const { data, error } = await supabase
            .from('attendances')
            .update(attendanceData)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            throw new Error(`Erro ao atualizar atendimento: ${error.message}`)
        }

        return data
    }

    static async deleteAttendance(id: string): Promise<void> {
        const { error } = await supabase
            .from('attendances')
            .delete()
            .eq('id', id)

        if (error) {
            throw new Error(`Erro ao deletar atendimento: ${error.message}`)
        }
    }

    static async updatePaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<Attendance> {
        return this.updateAttendance(id, { payment_status: paymentStatus })
    }

    // FINANCIAL REPORTS
    static async getFinancialSummary(
        dateFrom?: string,
        dateTo?: string,
        userId?: string
    ): Promise<FinancialSummary> {
        let query = supabase
            .from('attendances')
            .select('value, discount, product_cost, payment_status')

        if (userId) {
            query = query.eq('user_id', userId)
        }

        if (dateFrom) {
            query = query.gte('date', dateFrom)
        }

        if (dateTo) {
            query = query.lte('date', dateTo)
        }

        const { data, error } = await query

        if (error) {
            throw new Error(`Erro ao buscar resumo financeiro: ${error.message}`)
        }

        const summary = data?.reduce((acc, attendance) => {
            const netValue = attendance.value - attendance.discount
            const cost = attendance.product_cost || 0

            acc.totalRevenue += netValue
            acc.totalCosts += cost
            acc.totalDiscounts += attendance.discount
            acc.transactionCount++

            if (attendance.payment_status === 'paid') {
                acc.totalPaid += netValue
            } else if (attendance.payment_status === 'pending') {
                acc.totalPending += netValue
            }

            return acc
        }, {
            totalRevenue: 0,
            totalCosts: 0,
            totalProfit: 0,
            totalPending: 0,
            totalPaid: 0,
            totalDiscounts: 0,
            averageTicket: 0,
            transactionCount: 0
        }) || {
            totalRevenue: 0,
            totalCosts: 0,
            totalProfit: 0,
            totalPending: 0,
            totalPaid: 0,
            totalDiscounts: 0,
            averageTicket: 0,
            transactionCount: 0
        }

        summary.totalProfit = summary.totalRevenue - summary.totalCosts
        summary.averageTicket = summary.transactionCount > 0
            ? summary.totalRevenue / summary.transactionCount
            : 0

        return summary
    }

    static async getMonthlyReport(
        month: number,
        year: number,
        userId?: string
    ): Promise<MonthlyFinancialReport> {
        const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
        const endDate = new Date(year, month, 0).toISOString().split('T')[0]

        let query = supabase
            .from('attendances')
            .select('value, discount, product_cost, payment_method, payment_status')
            .gte('date', startDate)
            .lte('date', endDate)

        if (userId) {
            query = query.eq('user_id', userId)
        }

        const { data, error } = await query

        if (error) {
            throw new Error(`Erro ao buscar relatório mensal: ${error.message}`)
        }

        const report = data?.reduce((acc, attendance) => {
            const netValue = attendance.value - attendance.discount
            const cost = attendance.product_cost || 0

            acc.revenue += netValue
            acc.costs += cost
            acc.transactions++

            if (attendance.payment_method) {
                acc.paymentMethods[attendance.payment_method as PaymentMethod] =
                    (acc.paymentMethods[attendance.payment_method as PaymentMethod] || 0) + netValue;
            }

            return acc
        }, {
            month,
            year,
            revenue: 0,
            costs: 0,
            profit: 0,
            transactions: 0,
            averageTicket: 0,
            paymentMethods: {} as Partial<Record<PaymentMethod, number>>
        }) || {
            month,
            year,
            revenue: 0,
            costs: 0,
            profit: 0,
            transactions: 0,
            averageTicket: 0,
            paymentMethods: {} as Partial<Record<PaymentMethod, number>>
        }

        report.profit = report.revenue - report.costs
        report.averageTicket = report.transactions > 0
            ? report.revenue / report.transactions
            : 0

        return report
    }

    static async getRevenueByPeriod(
        startDate: string,
        endDate: string,
        groupBy: 'day' | 'week' | 'month' = 'day',
        userId?: string
    ): Promise<Array<{ date: string; revenue: number; transactions: number }>> {
        let query = supabase
            .from('attendances')
            .select('date, value, discount')
            .gte('date', startDate)
            .lte('date', endDate)
            .eq('payment_status', 'paid')

        if (userId) {
            query = query.eq('user_id', userId)
        }

        const { data, error } = await query

        if (error) {
            throw new Error(`Erro ao buscar receita por período: ${error.message}`)
        }

        const grouped = data?.reduce((acc, attendance) => {
            const date = new Date(attendance.date)
            let key: string

            switch (groupBy) {
                case 'week':
                    const weekStart = new Date(date)
                    weekStart.setDate(date.getDate() - date.getDay())
                    key = weekStart.toISOString().split('T')[0]
                    break
                case 'month':
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
                    break
                default:
                    key = attendance.date
            }

            if (!acc[key]) {
                acc[key] = { date: key, revenue: 0, transactions: 0 }
            }

            acc[key].revenue += attendance.value - attendance.discount
            acc[key].transactions++

            return acc
        }, {} as Record<string, { date: string; revenue: number; transactions: number }>)

        return Object.values(grouped || {}).sort((a, b) => a.date.localeCompare(b.date))
    }

    // PROFIT DISTRIBUTION CONFIG METHODS
    static async getProfitDistributionConfigs(userId: string): Promise<ProfitDistributionConfig[]> {
        const { data, error } = await supabase
            .from('profit_distribution_config')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('created_at', { ascending: true })

        if (error) {
            throw new Error(`Erro ao buscar configurações de distribuição de lucro: ${error.message}`)
        }

        return data || []
    }

    static async createProfitDistributionConfig(
        configData: ProfitDistributionConfigInsert
    ): Promise<ProfitDistributionConfig> {
        const { data, error } = await supabase
            .from('profit_distribution_config')
            .insert(configData)
            .select()
            .single()

        if (error) {
            throw new Error(`Erro ao criar configuração de distribuição: ${error.message}`)
        }

        return data
    }

    static async updateProfitDistributionConfig(
        id: string,
        configData: ProfitDistributionConfigUpdate
    ): Promise<ProfitDistributionConfig> {
        const { data, error } = await supabase
            .from('profit_distribution_config')
            .update({
                ...configData,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            throw new Error(`Erro ao atualizar configuração de distribuição: ${error.message}`)
        }

        return data
    }

    static async deleteProfitDistributionConfig(id: string): Promise<void> {
        const { error } = await supabase
            .from('profit_distribution_config')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', id)

        if (error) {
            throw new Error(`Erro ao deletar configuração de distribuição: ${error.message}`)
        }
    }

    // PROFIT DISTRIBUTION METHODS (using current schema)
    static async getProfitDistributions(
        userId: string,
        dateFrom?: string,
        dateTo?: string
    ): Promise<ProfitDistributionWithConfig[]> {
        let query = supabase
            .from('profit_distributions')
            .select(`
                *,
                profit_distribution_config!inner (
                    category,
                    percentage,
                    description
                )
            `)
            .eq('user_id', userId)

        if (dateFrom) {
            query = query.gte('created_at', dateFrom)
        }

        if (dateTo) {
            query = query.lte('created_at', dateTo)
        }

        query = query.order('created_at', { ascending: false })

        const { data, error } = await query

        if (error) {
            throw new Error(`Erro ao buscar distribuições de lucro: ${error.message}`)
        }

        return data || []
    }

    static async createProfitDistribution(
        distributionData: ProfitDistributionInsert
    ): Promise<ProfitDistribution> {
        const { data, error } = await supabase
            .from('profit_distributions')
            .insert(distributionData)
            .select()
            .single()

        if (error) {
            throw new Error(`Erro ao criar distribuição de lucro: ${error.message}`)
        }

        return data
    }

    static async updateProfitDistribution(
        id: string,
        distributionData: ProfitDistributionUpdate
    ): Promise<ProfitDistribution> {
        const { data, error } = await supabase
            .from('profit_distributions')
            .update(distributionData)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            throw new Error(`Erro ao atualizar distribuição de lucro: ${error.message}`)
        }

        return data
    }

    static async deleteProfitDistribution(id: string): Promise<void> {
        const { error } = await supabase
            .from('profit_distributions')
            .delete()
            .eq('id', id)

        if (error) {
            throw new Error(`Erro ao deletar distribuição de lucro: ${error.message}`)
        }
    }

    static async calculateProfitDistribution(
        userId: string,
        periodMonth: number,
        periodYear: number
    ): Promise<ProfitDistributionSummary> {
        // Buscar configurações ativas
        const configs = await this.getProfitDistributionConfigs(userId)

        if (configs.length === 0) {
            throw new Error('Nenhuma configuração de distribuição de lucro encontrada')
        }

        // Validar se a soma das porcentagens é 100%
        const totalPercentage = configs.reduce((sum, config) => sum + config.percentage, 0)
        if (totalPercentage !== 100) {
            throw new Error(`A soma das porcentagens deve ser 100%. Atual: ${totalPercentage}%`)
        }

        // Calcular lucro do período
        const startDate = new Date(periodYear, periodMonth - 1, 1).toISOString().split('T')[0]
        const endDate = new Date(periodYear, periodMonth, 0).toISOString().split('T')[0]
        const financialSummary = await this.getFinancialSummary(startDate, endDate, userId)
        const totalProfit = financialSummary.totalProfit

        // Calcular distribuições
        const distributions = configs.map(config => ({
            category: config.category,
            description: config.description,
            amount: (totalProfit * config.percentage) / 100,
            percentage: config.percentage
        }))

        const totalDistributed = distributions.reduce((sum, dist) => sum + dist.amount, 0)

        return {
            totalProfit,
            totalDistributed,
            totalPending: totalProfit - totalDistributed,
            distributions
        }
    }

    static async executeProfitDistribution(
        userId: string,
        periodMonth: number,
        periodYear: number
    ): Promise<ProfitDistribution> {
        // Calcular distribuições
        const summary = await this.calculateProfitDistribution(userId, periodMonth, periodYear)

        // Calcular lucro do período
        const startDate = new Date(periodYear, periodMonth - 1, 1).toISOString().split('T')[0]
        const endDate = new Date(periodYear, periodMonth, 0).toISOString().split('T')[0]
        const financialSummary = await this.getFinancialSummary(startDate, endDate, userId)

        // Calcular distribuições por categoria
        const configs = await this.getProfitDistributionConfigs(userId)
        const proLaboreConfig = configs.find(c => c.category === 'pro_labore')
        const equipmentConfig = configs.find(c => c.category === 'equipment_reserve')
        const emergencyConfig = configs.find(c => c.category === 'emergency_reserve')
        const investmentConfig = configs.find(c => c.category === 'investment')

        // Criar distribuição no banco
        const distribution = await this.createProfitDistribution({
            user_id: userId,
            period_month: periodMonth,
            period_year: periodYear,
            total_revenue: financialSummary.totalRevenue,
            total_costs: financialSummary.totalCosts,
            total_profit: financialSummary.totalProfit,
            pro_labore_amount: proLaboreConfig ? (summary.totalProfit * proLaboreConfig.percentage) / 100 : null,
            equipment_reserve_amount: equipmentConfig ? (summary.totalProfit * equipmentConfig.percentage) / 100 : null,
            emergency_reserve_amount: emergencyConfig ? (summary.totalProfit * emergencyConfig.percentage) / 100 : null,
            investment_amount: investmentConfig ? (summary.totalProfit * investmentConfig.percentage) / 100 : null
        })

        return distribution
    }

    static async getProfitDistributionSummary(
        userId: string,
        dateFrom?: string,
        dateTo?: string
    ): Promise<{
        totalDistributed: number
        totalPending: number
        totalExecuted: number
        distributionsByCategory: Partial<Record<ProfitCategory, number>>
    }> {
        const distributions = await this.getProfitDistributions(userId, dateFrom, dateTo)

        const summary = distributions.reduce((acc, dist) => {
            const totalAmount = (dist.pro_labore_amount || 0) +
                (dist.equipment_reserve_amount || 0) +
                (dist.emergency_reserve_amount || 0) +
                (dist.investment_amount || 0)

            acc.totalDistributed += totalAmount

            // Para o schema atual, consideramos todas como executadas
            acc.totalExecuted += totalAmount

            // Somar por categoria
            if (dist.pro_labore_amount) {
                acc.distributionsByCategory.pro_labore =
                    (acc.distributionsByCategory.pro_labore || 0) + dist.pro_labore_amount
            }
            if (dist.equipment_reserve_amount) {
                acc.distributionsByCategory.equipment_reserve =
                    (acc.distributionsByCategory.equipment_reserve || 0) + dist.equipment_reserve_amount
            }
            if (dist.emergency_reserve_amount) {
                acc.distributionsByCategory.emergency_reserve =
                    (acc.distributionsByCategory.emergency_reserve || 0) + dist.emergency_reserve_amount
            }
            if (dist.investment_amount) {
                acc.distributionsByCategory.investment =
                    (acc.distributionsByCategory.investment || 0) + dist.investment_amount
            }

            return acc
        }, {
            totalDistributed: 0,
            totalPending: 0,
            totalExecuted: 0,
            distributionsByCategory: {} as Partial<Record<ProfitCategory, number>>
        })

        return summary
    }

    // VALIDATION METHODS
    static validateProfitDistributionConfig(config: ProfitDistributionConfigInsert): boolean {
        if (!config.category) {
            throw new Error('Categoria é obrigatória')
        }

        if (config.percentage <= 0 || config.percentage > 100) {
            throw new Error('Porcentagem deve ser entre 1 e 100')
        }

        return true
    }

    static async validateTotalPercentage(
        userId: string,
        excludeId?: string
    ): Promise<{ isValid: boolean; totalPercentage: number }> {
        const configs = await this.getProfitDistributionConfigs(userId)

        const filteredConfigs = excludeId
            ? configs.filter(config => config.id !== excludeId)
            : configs

        const totalPercentage = filteredConfigs.reduce((sum, config) => sum + config.percentage, 0)

        return {
            isValid: totalPercentage <= 100,
            totalPercentage
        }
    }
}