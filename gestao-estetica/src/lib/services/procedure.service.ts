// lib/services/procedure.service.ts
import { supabase } from '@/lib/database/supabase/client'
import type {
    Procedure,
    ProcedureInsert,
    ProcedureUpdate,
    ProcedureWithCategory,
    ProcedureCategory,
    ProcedureCategoryInsert,
    ProcedureCategoryUpdate,
    ProcedureFilters,
    CategoryFilters,
    ProceduresPaginationOptions,
    CategoriesPaginationOptions,
    ProceduresResponse,
    CategoriesResponse,
    ProcedureStats
} from '@/types/procedure.types'

export class ProcedureService {
    // ========== PROCEDURES ==========

    static async getProcedures(options: ProceduresPaginationOptions): Promise<ProceduresResponse> {
        const { page, limit, filters = {}, sortBy = 'name', sortOrder = 'asc' } = options

        let query = supabase
            .from('procedures')
            .select(`
                *,
                procedure_categories (
                    id,
                    name,
                    description,
                    color,
                    is_active
                )
            `, { count: 'exact' })

        // Aplicar filtros
        if (filters.category_id) {
            query = query.eq('category_id', filters.category_id)
        }

        if (filters.is_active !== undefined) {
            query = query.eq('is_active', filters.is_active)
        }

        if (filters.min_price !== undefined) {
            query = query.gte('price', filters.min_price)
        }

        if (filters.max_price !== undefined) {
            query = query.lte('price', filters.max_price)
        }

        if (filters.min_duration !== undefined) {
            query = query.gte('duration_minutes', filters.min_duration)
        }

        if (filters.max_duration !== undefined) {
            query = query.lte('duration_minutes', filters.max_duration)
        }

        if (filters.search) {
            query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
        }

        // Ordenação
        query = query.order(sortBy, { ascending: sortOrder === 'asc' })

        // Paginação
        const from = (page - 1) * limit
        const to = from + limit - 1
        query = query.range(from, to)

        const { data, error, count } = await query

        if (error) {
            throw new Error(`Erro ao buscar procedimentos: ${error.message}`)
        }

        const totalPages = Math.ceil((count || 0) / limit)

        return {
            data: data || [],
            total: count || 0,
            page,
            totalPages
        }
    }

    static async getProcedureById(id: string): Promise<ProcedureWithCategory> {
        const { data, error } = await supabase
            .from('procedures')
            .select(`
                *,
                procedure_categories (
                    id,
                    name,
                    description,
                    color,
                    is_active
                )
            `)
            .eq('id', id)
            .single()

        if (error) {
            throw new Error(`Erro ao buscar procedimento: ${error.message}`)
        }

        if (!data) {
            throw new Error('Procedimento não encontrado')
        }

        return data
    }

    static async createProcedure(procedureData: ProcedureInsert): Promise<Procedure> {
        const { data, error } = await supabase
            .from('procedures')
            .insert(procedureData)
            .select()
            .single()

        if (error) {
            throw new Error(`Erro ao criar procedimento: ${error.message}`)
        }

        if (!data) {
            throw new Error('Erro ao criar procedimento')
        }

        return data
    }

    static async updateProcedure(id: string, procedureData: ProcedureUpdate): Promise<Procedure> {
        const { data, error } = await supabase
            .from('procedures')
            .update(procedureData)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            throw new Error(`Erro ao atualizar procedimento: ${error.message}`)
        }

        if (!data) {
            throw new Error('Procedimento não encontrado')
        }

        return data
    }

    static async deleteProcedure(id: string): Promise<void> {
        const { error } = await supabase
            .from('procedures')
            .delete()
            .eq('id', id)

        if (error) {
            throw new Error(`Erro ao deletar procedimento: ${error.message}`)
        }
    }

    static async searchProcedures(query: string, limit: number = 10): Promise<ProcedureWithCategory[]> {
        const { data, error } = await supabase
            .from('procedures')
            .select(`
                *,
                procedure_categories (
                    id,
                    name,
                    description,
                    color,
                    is_active
                )
            `)
            .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
            .eq('is_active', true)
            .order('name')
            .limit(limit)

        if (error) {
            throw new Error(`Erro ao buscar procedimentos: ${error.message}`)
        }

        return data || []
    }

    static async getProceduresByCategory(categoryId: string): Promise<ProcedureWithCategory[]> {
        const { data, error } = await supabase
            .from('procedures')
            .select(`
                *,
                procedure_categories (
                    id,
                    name,
                    description,
                    color,
                    is_active
                )
            `)
            .eq('category_id', categoryId)
            .eq('is_active', true)
            .order('name')

        if (error) {
            throw new Error(`Erro ao buscar procedimentos por categoria: ${error.message}`)
        }

        return data || []
    }

    static async getActiveProcedures(userId?: string): Promise<ProcedureWithCategory[]> {
        let query = supabase
            .from('procedures')
            .select(`
                *,
                procedure_categories (
                    id,
                    name,
                    description,
                    color,
                    is_active
                )
            `)
            .eq('is_active', true)
            .order('name')

        if (userId) {
            query = query.eq('user_id', userId)
        }

        const { data, error } = await query

        if (error) {
            throw new Error(`Erro ao buscar procedimentos ativos: ${error.message}`)
        }

        return data || []
    }

    static async getProcedureStats(userId?: string): Promise<ProcedureStats> {
        // Query base para procedures
        let proceduresQuery = supabase
            .from('procedures')
            .select('*')

        if (userId) {
            proceduresQuery = proceduresQuery.eq('user_id', userId)
        }

        const { data: procedures, error: proceduresError } = await proceduresQuery

        if (proceduresError) {
            throw new Error(`Erro ao buscar estatísticas: ${proceduresError.message}`)
        }

        // Query para attendances (estatísticas de uso)
        let attendancesQuery = supabase
            .from('attendances')
            .select(`
                procedure_id,
                value,
                procedures (
                    name,
                    category_id,
                    procedure_categories (
                        name
                    )
                )
            `)

        if (userId) {
            attendancesQuery = attendancesQuery.eq('user_id', userId)
        }

        const { data: attendances, error: attendancesError } = await attendancesQuery

        if (attendancesError) {
            throw new Error(`Erro ao buscar estatísticas de atendimentos: ${attendancesError.message}`)
        }

        const total = procedures?.length || 0
        const active = procedures?.filter(p => p.is_active).length || 0
        const inactive = total - active

        const totalRevenue = attendances?.reduce((sum, att) => sum + (att.value || 0), 0) || 0
        const averagePrice = procedures?.length
            ? procedures.reduce((sum, proc) => sum + proc.price, 0) / procedures.length
            : 0

        // Procedimento mais popular
        const procedureUsage = attendances?.reduce((acc, att) => {
            const procId = att.procedure_id
            if (!acc[procId]) {
                acc[procId] = {
                    id: procId,
                    name: att.procedures?.name || 'Desconhecido',
                    count: 0
                }
            }
            acc[procId].count++
            return acc
        }, {} as Record<string, { id: string; name: string; count: number }>) || {}

        const mostPopular = Object.values(procedureUsage)
            .sort((a, b) => b.count - a.count)[0] || null

        // Revenue por categoria
        const revenueByCategory = attendances?.reduce((acc, att) => {
            const categoryName = att.procedures?.procedure_categories?.name || 'Sem categoria'
            if (!acc[categoryName]) {
                acc[categoryName] = { category: categoryName, revenue: 0, count: 0 }
            }
            acc[categoryName].revenue += att.value || 0
            acc[categoryName].count++
            return acc
        }, {} as Record<string, { category: string; revenue: number; count: number }>) || {}

        return {
            total,
            active,
            inactive,
            totalRevenue,
            averagePrice,
            mostPopular,
            revenueByCategory: Object.values(revenueByCategory)
        }
    }

    static async bulkUpdateProcedureStatus(procedureIds: string[], isActive: boolean): Promise<void> {
        const { error } = await supabase
            .from('procedures')
            .update({ is_active: isActive })
            .in('id', procedureIds)

        if (error) {
            throw new Error(`Erro ao atualizar status dos procedimentos: ${error.message}`)
        }
    }

    // ========== CATEGORIES ==========

    static async getCategories(options: CategoriesPaginationOptions): Promise<CategoriesResponse> {
        const { page, limit, filters = {}, sortBy = 'name', sortOrder = 'asc' } = options

        let query = supabase
            .from('procedure_categories')
            .select('*', { count: 'exact' })

        // Aplicar filtros
        if (filters.is_active !== undefined) {
            query = query.eq('is_active', filters.is_active)
        }

        if (filters.search) {
            query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
        }

        // Ordenação
        query = query.order(sortBy, { ascending: sortOrder === 'asc' })

        // Paginação
        const from = (page - 1) * limit
        const to = from + limit - 1
        query = query.range(from, to)

        const { data, error, count } = await query

        if (error) {
            throw new Error(`Erro ao buscar categorias: ${error.message}`)
        }

        const totalPages = Math.ceil((count || 0) / limit)

        return {
            data: data || [],
            total: count || 0,
            page,
            totalPages
        }
    }

    static async getCategoryById(id: string): Promise<ProcedureCategory> {
        const { data, error } = await supabase
            .from('procedure_categories')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            throw new Error(`Erro ao buscar categoria: ${error.message}`)
        }

        if (!data) {
            throw new Error('Categoria não encontrada')
        }

        return data
    }

    static async createCategory(categoryData: ProcedureCategoryInsert): Promise<ProcedureCategory> {
        const { data, error } = await supabase
            .from('procedure_categories')
            .insert(categoryData)
            .select()
            .single()

        if (error) {
            throw new Error(`Erro ao criar categoria: ${error.message}`)
        }

        if (!data) {
            throw new Error('Erro ao criar categoria')
        }

        return data
    }

    static async updateCategory(id: string, categoryData: ProcedureCategoryUpdate): Promise<ProcedureCategory> {
        const { data, error } = await supabase
            .from('procedure_categories')
            .update(categoryData)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            throw new Error(`Erro ao atualizar categoria: ${error.message}`)
        }

        if (!data) {
            throw new Error('Categoria não encontrada')
        }

        return data
    }

    static async deleteCategory(id: string): Promise<void> {
        // Verificar se existem procedimentos usando esta categoria
        const { data: procedures, error: proceduresError } = await supabase
            .from('procedures')
            .select('id')
            .eq('category_id', id)
            .limit(1)

        if (proceduresError) {
            throw new Error(`Erro ao verificar procedimentos: ${proceduresError.message}`)
        }

        if (procedures && procedures.length > 0) {
            throw new Error('Não é possível excluir a categoria. Existem procedimentos associados a ela.')
        }

        const { error } = await supabase
            .from('procedure_categories')
            .delete()
            .eq('id', id)

        if (error) {
            throw new Error(`Erro ao deletar categoria: ${error.message}`)
        }
    }

    static async getActiveCategories(userId?: string): Promise<ProcedureCategory[]> {
        let query = supabase
            .from('procedure_categories')
            .select('*')
            .eq('is_active', true)
            .order('name')

        if (userId) {
            query = query.eq('user_id', userId)
        }

        const { data, error } = await query

        if (error) {
            throw new Error(`Erro ao buscar categorias ativas: ${error.message}`)
        }

        return data || []
    }

    static async searchCategories(query: string, limit: number = 10): Promise<ProcedureCategory[]> {
        const { data, error } = await supabase
            .from('procedure_categories')
            .select('*')
            .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
            .eq('is_active', true)
            .order('name')
            .limit(limit)

        if (error) {
            throw new Error(`Erro ao buscar categorias: ${error.message}`)
        }

        return data || []
    }
}