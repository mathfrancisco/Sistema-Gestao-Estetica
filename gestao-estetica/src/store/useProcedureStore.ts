// store/useProcedureStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
    Procedure,
    ProcedureWithCategory,
    ProcedureCategory,
    ProcedureFilters,
    CategoryFilters
} from '@/types/procedure.types'

interface ProcedureState {
    // Procedures
    procedures: ProcedureWithCategory[]
    selectedProcedure: ProcedureWithCategory | null
    isLoading: boolean

    // Categories
    categories: ProcedureCategory[]
    selectedCategory: ProcedureCategory | null
    categoriesLoading: boolean

    // Pagination
    pagination: {
        page: number
        total: number
        limit: number
    }

    categoryPagination: {
        page: number
        total: number
        limit: number
    }

    // Filters
    filters: ProcedureFilters
    categoryFilters: CategoryFilters
    searchQuery: string
    categorySearchQuery: string
}

interface ProcedureActions {
    // Procedures actions
    setProcedures: (procedures: ProcedureWithCategory[]) => void
    addProcedure: (procedure: ProcedureWithCategory) => void
    updateProcedure: (id: string, procedure: Partial<ProcedureWithCategory>) => void
    removeProcedure: (id: string) => void
    setSelectedProcedure: (procedure: ProcedureWithCategory | null) => void
    setLoading: (loading: boolean) => void

    // Categories actions
    setCategories: (categories: ProcedureCategory[]) => void
    addCategory: (category: ProcedureCategory) => void
    updateCategory: (id: string, category: Partial<ProcedureCategory>) => void
    removeCategory: (id: string) => void
    setSelectedCategory: (category: ProcedureCategory | null) => void
    setCategoriesLoading: (loading: boolean) => void

    // Pagination actions
    setPagination: (pagination: Partial<ProcedureState['pagination']>) => void
    setCategoryPagination: (pagination: Partial<ProcedureState['categoryPagination']>) => void

    // Filter actions
    setFilters: (filters: Partial<ProcedureFilters>) => void
    setCategoryFilters: (filters: Partial<CategoryFilters>) => void
    setSearchQuery: (query: string) => void
    setCategorySearchQuery: (query: string) => void
    clearFilters: () => void
    clearCategoryFilters: () => void

    // Utility actions
    getProcedureById: (id: string) => ProcedureWithCategory | undefined
    getCategoryById: (id: string) => ProcedureCategory | undefined
    getProceduresByCategory: (categoryId: string) => ProcedureWithCategory[]
    getActiveProcedures: () => ProcedureWithCategory[]
    getActiveCategories: () => ProcedureCategory[]
}

type ProcedureStore = ProcedureState & ProcedureActions

export const useProcedureStore = create<ProcedureStore>()(
    persist(
        (set, get) => ({
            // Estado inicial
            procedures: [],
            selectedProcedure: null,
            isLoading: false,

            categories: [],
            selectedCategory: null,
            categoriesLoading: false,

            pagination: {
                page: 1,
                total: 0,
                limit: 10
            },

            categoryPagination: {
                page: 1,
                total: 0,
                limit: 10
            },

            filters: {},
            categoryFilters: {},
            searchQuery: '',
            categorySearchQuery: '',

            // Procedures actions
            setProcedures: (procedures) => set({ procedures }),

            addProcedure: (procedure) => set((state) => ({
                procedures: [...state.procedures, procedure]
            })),

            updateProcedure: (id, updatedProcedure) => set((state) => ({
                procedures: state.procedures.map(procedure =>
                    procedure.id === id ? { ...procedure, ...updatedProcedure } : procedure
                ),
                selectedProcedure: state.selectedProcedure?.id === id
                    ? { ...state.selectedProcedure, ...updatedProcedure }
                    : state.selectedProcedure
            })),

            removeProcedure: (id) => set((state) => ({
                procedures: state.procedures.filter(procedure => procedure.id !== id),
                selectedProcedure: state.selectedProcedure?.id === id ? null : state.selectedProcedure
            })),

            setSelectedProcedure: (selectedProcedure) => set({ selectedProcedure }),

            setLoading: (isLoading) => set({ isLoading }),

            // Categories actions
            setCategories: (categories) => set({ categories }),

            addCategory: (category) => set((state) => ({
                categories: [...state.categories, category]
            })),

            updateCategory: (id, updatedCategory) => set((state) => ({
                categories: state.categories.map(category =>
                    category.id === id ? { ...category, ...updatedCategory } : category
                ),
                selectedCategory: state.selectedCategory?.id === id
                    ? { ...state.selectedCategory, ...updatedCategory }
                    : state.selectedCategory
            })),

            removeCategory: (id) => set((state) => ({
                categories: state.categories.filter(category => category.id !== id),
                selectedCategory: state.selectedCategory?.id === id ? null : state.selectedCategory
            })),

            setSelectedCategory: (selectedCategory) => set({ selectedCategory }),

            setCategoriesLoading: (categoriesLoading) => set({ categoriesLoading }),

            // Pagination actions
            setPagination: (newPagination) => set((state) => ({
                pagination: { ...state.pagination, ...newPagination }
            })),

            setCategoryPagination: (newPagination) => set((state) => ({
                categoryPagination: { ...state.categoryPagination, ...newPagination }
            })),

            // Filter actions
            setFilters: (newFilters) => set((state) => ({
                filters: { ...state.filters, ...newFilters }
            })),

            setCategoryFilters: (newFilters) => set((state) => ({
                categoryFilters: { ...state.categoryFilters, ...newFilters }
            })),

            setSearchQuery: (searchQuery) => set({ searchQuery }),

            setCategorySearchQuery: (categorySearchQuery) => set({ categorySearchQuery }),

            clearFilters: () => set({
                filters: {},
                searchQuery: ''
            }),

            clearCategoryFilters: () => set({
                categoryFilters: {},
                categorySearchQuery: ''
            }),

            // Utility actions
            getProcedureById: (id) => {
                const { procedures } = get()
                return procedures.find(procedure => procedure.id === id)
            },

            getCategoryById: (id) => {
                const { categories } = get()
                return categories.find(category => category.id === id)
            },

            getProceduresByCategory: (categoryId) => {
                const { procedures } = get()
                return procedures.filter(procedure => procedure.category_id === categoryId)
            },

            getActiveProcedures: () => {
                const { procedures } = get()
                return procedures.filter(procedure => procedure.is_active)
            },

            getActiveCategories: () => {
                const { categories } = get()
                return categories.filter(category => category.is_active)
            },
        }),
        {
            name: 'procedure-storage',
            partialize: (state) => ({
                procedures: state.procedures,
                categories: state.categories,
                pagination: state.pagination,
                categoryPagination: state.categoryPagination,
                filters: state.filters,
                categoryFilters: state.categoryFilters,
                searchQuery: state.searchQuery,
                categorySearchQuery: state.categorySearchQuery,
            }),
        }
    )
)