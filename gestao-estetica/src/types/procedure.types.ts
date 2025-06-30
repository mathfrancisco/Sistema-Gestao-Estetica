// types/procedure.types.ts
import type { Database } from '@/lib/database/supabase/types'

export type Procedure = Database['public']['Tables']['procedures']['Row']
export type ProcedureInsert = Database['public']['Tables']['procedures']['Insert']
export type ProcedureUpdate = Database['public']['Tables']['procedures']['Update']

export type ProcedureCategory = Database['public']['Tables']['procedure_categories']['Row']
export type ProcedureCategoryInsert = Database['public']['Tables']['procedure_categories']['Insert']
export type ProcedureCategoryUpdate = Database['public']['Tables']['procedure_categories']['Update']

export interface ProcedureWithCategory extends Procedure {
    procedure_categories?: ProcedureCategory | null
}

export interface ProcedureFilters {
    category_id?: string
    is_active?: boolean
    min_price?: number
    max_price?: number
    min_duration?: number
    max_duration?: number
    search?: string
}

export interface ProceduresPaginationOptions {
    page: number
    limit: number
    filters?: ProcedureFilters
    sortBy?: keyof Procedure
    sortOrder?: 'asc' | 'desc'
}

export interface ProceduresResponse {
    data: ProcedureWithCategory[]
    total: number
    page: number
    totalPages: number
}

export interface ProcedureStats {
    total: number
    active: number
    inactive: number
    totalRevenue: number
    averagePrice: number
    mostPopular: {
        id: string
        name: string
        count: number
    } | null
    revenueByCategory: {
        category: string
        revenue: number
        count: number
    }[]
}

export interface CategoryFilters {
    is_active?: boolean
    search?: string
}

export interface CategoriesPaginationOptions {
    page: number
    limit: number
    filters?: CategoryFilters
    sortBy?: keyof ProcedureCategory
    sortOrder?: 'asc' | 'desc'
}

export interface CategoriesResponse {
    data: ProcedureCategory[]
    total: number
    page: number
    totalPages: number
}