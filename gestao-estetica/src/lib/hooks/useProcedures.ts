// hooks/useProcedures.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useProcedureStore } from '@/store/useProcedureStore'
import { ProcedureService } from '@/lib/services/procedure.service'
import { toast } from 'sonner'
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
    CategoriesPaginationOptions
} from '@/types/procedure.types'

// ========== PROCEDURES HOOKS ==========

// Hook para listar procedimentos com paginação
export function useProcedures(options: ProceduresPaginationOptions) {
    const setProcedures = useProcedureStore(state => state.setProcedures)
    const setLoading = useProcedureStore(state => state.setLoading)
    const setPagination = useProcedureStore(state => state.setPagination)

    return useQuery({
        queryKey: ['procedures', options],
        queryFn: async () => {
            setLoading(true)
            try {
                const response = await ProcedureService.getProcedures(options)
                setProcedures(response.data)
                setPagination({
                    page: response.page,
                    total: response.total,
                    limit: options.limit
                })
                return response
            } finally {
                setLoading(false)
            }
        },
        staleTime: 5 * 60 * 1000, // 5 minutos
    })
}

// Hook para buscar procedimento específico
export function useProcedure(id: string) {
    const setSelectedProcedure = useProcedureStore(state => state.setSelectedProcedure)

    return useQuery({
        queryKey: ['procedure', id],
        queryFn: async () => {
            const procedure = await ProcedureService.getProcedureById(id)
            setSelectedProcedure(procedure)
            return procedure
        },
        enabled: !!id,
    })
}

// Hook para criar procedimento
export function useCreateProcedure() {
    const queryClient = useQueryClient()
    const addProcedure = useProcedureStore(state => state.addProcedure)

    return useMutation({
        mutationFn: (procedureData: ProcedureInsert) => ProcedureService.createProcedure(procedureData),
        onSuccess: (newProcedure) => {
            addProcedure(newProcedure as ProcedureWithCategory)
            queryClient.invalidateQueries({ queryKey: ['procedures'] })
            queryClient.invalidateQueries({ queryKey: ['procedure-stats'] })
            toast.success('Procedimento criado com sucesso!')
        },
        onError: (error: Error) => {
            toast.error(`Erro ao criar procedimento: ${error.message}`)
        }
    })
}

// Hook para atualizar procedimento
export function useUpdateProcedure() {
    const queryClient = useQueryClient()
    const updateProcedure = useProcedureStore(state => state.updateProcedure)

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: ProcedureUpdate }) =>
            ProcedureService.updateProcedure(id, data),
        onSuccess: (updatedProcedure) => {
            updateProcedure(updatedProcedure.id, updatedProcedure)
            queryClient.invalidateQueries({ queryKey: ['procedures'] })
            queryClient.invalidateQueries({ queryKey: ['procedure', updatedProcedure.id] })
            queryClient.invalidateQueries({ queryKey: ['procedure-stats'] })
            toast.success('Procedimento atualizado com sucesso!')
        },
        onError: (error: Error) => {
            toast.error(`Erro ao atualizar procedimento: ${error.message}`)
        }
    })
}

// Hook para deletar procedimento
export function useDeleteProcedure() {
    const queryClient = useQueryClient()
    const removeProcedure = useProcedureStore(state => state.removeProcedure)

    return useMutation({
        mutationFn: (id: string) => ProcedureService.deleteProcedure(id),
        onSuccess: (_, id) => {
            removeProcedure(id)
            queryClient.invalidateQueries({ queryKey: ['procedures'] })
            queryClient.invalidateQueries({ queryKey: ['procedure-stats'] })
            toast.success('Procedimento deletado com sucesso!')
        },
        onError: (error: Error) => {
            toast.error(`Erro ao deletar procedimento: ${error.message}`)
        }
    })
}

// Hook para buscar procedimentos ativos
export function useActiveProcedures(userId?: string) {
    return useQuery({
        queryKey: ['active-procedures', userId],
        queryFn: () => ProcedureService.getActiveProcedures(userId),
        staleTime: 10 * 60 * 1000, // 10 minutos
    })
}

// Hook para procedimentos por categoria
export function useProceduresByCategory(categoryId: string) {
    return useQuery({
        queryKey: ['procedures-by-category', categoryId],
        queryFn: () => ProcedureService.getProceduresByCategory(categoryId),
        enabled: !!categoryId,
        staleTime: 5 * 60 * 1000, // 5 minutos
    })
}

// Hook para estatísticas de procedimentos
export function useProcedureStats(userId?: string) {
    return useQuery({
        queryKey: ['procedure-stats', userId],
        queryFn: () => ProcedureService.getProcedureStats(userId),
        staleTime: 15 * 60 * 1000, // 15 minutos
    })
}

// Hook para pesquisar procedimentos
export function useSearchProcedures(query: string, limit?: number) {
    return useQuery({
        queryKey: ['search-procedures', query, limit],
        queryFn: () => ProcedureService.searchProcedures(query, limit),
        enabled: query.length >= 2,
        staleTime: 2 * 60 * 1000, // 2 minutos
    })
}

// Hook para atualizar status em massa
export function useBulkUpdateProcedureStatus() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ procedureIds, isActive }: { procedureIds: string[]; isActive: boolean }) =>
            ProcedureService.bulkUpdateProcedureStatus(procedureIds, isActive),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['procedures'] })
            queryClient.invalidateQueries({ queryKey: ['procedure-stats'] })
            toast.success('Status dos procedimentos atualizados com sucesso!')
        },
        onError: (error: Error) => {
            toast.error(`Erro ao atualizar status: ${error.message}`)
        }
    })
}

// ========== CATEGORIES HOOKS ==========

// Hook para listar categorias com paginação
export function useProcedureCategories(options: CategoriesPaginationOptions) {
    const setCategories = useProcedureStore(state => state.setCategories)
    const setCategoriesLoading = useProcedureStore(state => state.setCategoriesLoading)
    const setCategoryPagination = useProcedureStore(state => state.setCategoryPagination)

    return useQuery({
        queryKey: ['procedure-categories', options],
        queryFn: async () => {
            setCategoriesLoading(true)
            try {
                const response = await ProcedureService.getCategories(options)
                setCategories(response.data)
                setCategoryPagination({
                    page: response.page,
                    total: response.total,
                    limit: options.limit
                })
                return response
            } finally {
                setCategoriesLoading(false)
            }
        },
        staleTime: 10 * 60 * 1000, // 10 minutos
    })
}

// Hook para buscar categoria específica
export function useProcedureCategory(id: string) {
    const setSelectedCategory = useProcedureStore(state => state.setSelectedCategory)

    return useQuery({
        queryKey: ['procedure-category', id],
        queryFn: async () => {
            const category = await ProcedureService.getCategoryById(id)
            setSelectedCategory(category)
            return category
        },
        enabled: !!id,
    })
}

// Hook para criar categoria
export function useCreateProcedureCategory() {
    const queryClient = useQueryClient()
    const addCategory = useProcedureStore(state => state.addCategory)

    return useMutation({
        mutationFn: (categoryData: ProcedureCategoryInsert) => ProcedureService.createCategory(categoryData),
        onSuccess: (newCategory) => {
            addCategory(newCategory)
            queryClient.invalidateQueries({ queryKey: ['procedure-categories'] })
            toast.success('Categoria criada com sucesso!')
        },
        onError: (error: Error) => {
            toast.error(`Erro ao criar categoria: ${error.message}`)
        }
    })
}

// Hook para atualizar categoria
export function useUpdateProcedureCategory() {
    const queryClient = useQueryClient()
    const updateCategory = useProcedureStore(state => state.updateCategory)

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: ProcedureCategoryUpdate }) =>
            ProcedureService.updateCategory(id, data),
        onSuccess: (updatedCategory) => {
            updateCategory(updatedCategory.id, updatedCategory)
            queryClient.invalidateQueries({ queryKey: ['procedure-categories'] })
            queryClient.invalidateQueries({ queryKey: ['procedure-category', updatedCategory.id] })
            queryClient.invalidateQueries({ queryKey: ['procedures'] })
            toast.success('Categoria atualizada com sucesso!')
        },
        onError: (error: Error) => {
            toast.error(`Erro ao atualizar categoria: ${error.message}`)
        }
    })
}

// Hook para deletar categoria
export function useDeleteProcedureCategory() {
    const queryClient = useQueryClient()
    const removeCategory = useProcedureStore(state => state.removeCategory)

    return useMutation({
        mutationFn: (id: string) => ProcedureService.deleteCategory(id),
        onSuccess: (_, id) => {
            removeCategory(id)
            queryClient.invalidateQueries({ queryKey: ['procedure-categories'] })
            queryClient.invalidateQueries({ queryKey: ['procedures'] })
            toast.success('Categoria deletada com sucesso!')
        },
        onError: (error: Error) => {
            toast.error(`Erro ao deletar categoria: ${error.message}`)
        }
    })
}

// Hook para categorias ativas
export function useActiveProcedureCategories(userId?: string) {
    return useQuery({
        queryKey: ['active-procedure-categories', userId],
        queryFn: () => ProcedureService.getActiveCategories(userId),
        staleTime: 15 * 60 * 1000, // 15 minutos
    })
}

// Hook para pesquisar categorias
export function useSearchProcedureCategories(query: string, limit?: number) {
    return useQuery({
        queryKey: ['search-procedure-categories', query, limit],
        queryFn: () => ProcedureService.searchCategories(query, limit),
        enabled: query.length >= 2,
        staleTime: 5 * 60 * 1000, // 5 minutos
    })
}

// ========== UTILITY HOOKS ==========

// Hook personalizado para gerenciar filtros de procedimentos
export function useProcedureFilters() {
    const filters = useProcedureStore(state => state.filters)
    const searchQuery = useProcedureStore(state => state.searchQuery)
    const setFilters = useProcedureStore(state => state.setFilters)
    const setSearchQuery = useProcedureStore(state => state.setSearchQuery)
    const clearFilters = useProcedureStore(state => state.clearFilters)

    const updateFilters = (newFilters: Partial<ProcedureFilters>) => {
        setFilters(newFilters)
    }

    const updateSearchQuery = (query: string) => {
        setSearchQuery(query)
    }

    const resetFilters = () => {
        clearFilters()
    }

    return {
        filters,
        searchQuery,
        updateFilters,
        updateSearchQuery,
        resetFilters
    }
}

// Hook personalizado para gerenciar filtros de categorias
export function useProcedureCategoryFilters() {
    const filters = useProcedureStore(state => state.categoryFilters)
    const searchQuery = useProcedureStore(state => state.categorySearchQuery)
    const setFilters = useProcedureStore(state => state.setCategoryFilters)
    const setSearchQuery = useProcedureStore(state => state.setCategorySearchQuery)
    const clearFilters = useProcedureStore(state => state.clearCategoryFilters)

    const updateFilters = (newFilters: Partial<CategoryFilters>) => {
        setFilters(newFilters)
    }

    const updateSearchQuery = (query: string) => {
        setSearchQuery(query)
    }

    const resetFilters = () => {
        clearFilters()
    }

    return {
        filters,
        searchQuery,
        updateFilters,
        updateSearchQuery,
        resetFilters
    }
}

// Hook para paginação de procedimentos
export function useProceduresPagination() {
    const pagination = useProcedureStore(state => state.pagination)
    const setPagination = useProcedureStore(state => state.setPagination)

    const goToPage = (page: number) => {
        setPagination({ page })
    }

    const changeLimit = (limit: number) => {
        setPagination({ limit, page: 1 })
    }

    const nextPage = () => {
        const totalPages = Math.ceil(pagination.total / pagination.limit)
        if (pagination.page < totalPages) {
            setPagination({ page: pagination.page + 1 })
        }
    }

    const previousPage = () => {
        if (pagination.page > 1) {
            setPagination({ page: pagination.page - 1 })
        }
    }

    return {
        pagination,
        goToPage,
        changeLimit,
        nextPage,
        previousPage
    }
}

// Hook para paginação de categorias
export function useProcedureCategoriesPagination() {
    const pagination = useProcedureStore(state => state.categoryPagination)
    const setPagination = useProcedureStore(state => state.setCategoryPagination)

    const goToPage = (page: number) => {
        setPagination({ page })
    }

    const changeLimit = (limit: number) => {
        setPagination({ limit, page: 1 })
    }

    const nextPage = () => {
        const totalPages = Math.ceil(pagination.total / pagination.limit)
        if (pagination.page < totalPages) {
            setPagination({ page: pagination.page + 1 })
        }
    }

    const previousPage = () => {
        if (pagination.page > 1) {
            setPagination({ page: pagination.page - 1 })
        }
    }

    return {
        pagination,
        goToPage,
        changeLimit,
        nextPage,
        previousPage
    }
}