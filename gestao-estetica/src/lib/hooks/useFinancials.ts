// hooks/useFinancials.ts
import { useState, useCallback} from 'react'
import {
    AttendanceWithDetails,
    FinancialPaginationOptions,
    FinancialService,
    FinancialSummary,
    MonthlyFinancialReport,
    ProfitDistributionWithConfig,
    Attendance,
    AttendanceInsert,
    AttendanceUpdate,
    ProfitDistributionConfigInsert,
    ProfitDistributionConfigUpdate, ProfitDistributionSummary, FinancialFilters,
    ProfitDistribution, ProfitDistributionConfig
} from '../services/financial.service'
import type {
    PaymentStatus,
} from '@/lib/supabase/types'

interface UseFinancialsState {
    // Attendances
    attendances: Attendance[]
    attendancesWithDetails: AttendanceWithDetails[]
    currentAttendance: AttendanceWithDetails | null
    attendancesPagination: {
        total: number
        page: number
        totalPages: number
    }

    // Financial Reports
    financialSummary: FinancialSummary | null
    monthlyReport: MonthlyFinancialReport | null
    revenueByPeriod: Array<{ date: string; revenue: number; transactions: number }>

    // Profit Distribution
    profitConfigs: ProfitDistributionConfig[]
    profitDistributions: ProfitDistributionWithConfig[]
    profitDistributionSummary: ProfitDistributionSummary | null

    // Loading states
    isLoading: boolean
    isLoadingAttendances: boolean
    isLoadingReports: boolean
    isLoadingProfitConfig: boolean
    isLoadingProfitDistributions: boolean

    // Error state
    error: string | null
}

interface UseFinancialsActions {
    // Attendance actions
    fetchAttendances: (options: FinancialPaginationOptions) => Promise<void>
    fetchAttendancesWithDetails: (options: FinancialPaginationOptions) => Promise<void>
    fetchAttendanceById: (id: string) => Promise<void>
    createAttendance: (data: AttendanceInsert) => Promise<Attendance | null>
    updateAttendance: (id: string, data: AttendanceUpdate) => Promise<Attendance | null>
    deleteAttendance: (id: string) => Promise<boolean>
    updatePaymentStatus: (id: string, status: PaymentStatus) => Promise<Attendance | null>

    // Report actions
    fetchFinancialSummary: (dateFrom?: string, dateTo?: string, userId?: string) => Promise<void>
    fetchMonthlyReport: (month: number, year: number, userId?: string) => Promise<void>
    fetchRevenueByPeriod: (
        startDate: string,
        endDate: string,
        groupBy?: 'day' | 'week' | 'month',
        userId?: string
    ) => Promise<void>

    // Profit distribution config actions
    fetchProfitConfigs: (userId: string) => Promise<void>
    createProfitConfig: (data: ProfitDistributionConfigInsert) => Promise<ProfitDistributionConfig | null>
    updateProfitConfig: (id: string, data: ProfitDistributionConfigUpdate) => Promise<ProfitDistributionConfig | null>
    deleteProfitConfig: (id: string) => Promise<boolean>

    // Profit distribution actions
    fetchProfitDistributions: (userId: string, dateFrom?: string, dateTo?: string) => Promise<void>
    calculateProfitDistribution: (userId: string, month: number, year: number) => Promise<void>
    executeProfitDistribution: (userId: string, month: number, year: number) => Promise<ProfitDistribution | null>
    fetchProfitDistributionSummary: (userId: string, dateFrom?: string, dateTo?: string) => Promise<void>

    // Utility actions
    clearError: () => void
    resetState: () => void
}

const initialState: UseFinancialsState = {
    attendances: [],
    attendancesWithDetails: [],
    currentAttendance: null,
    attendancesPagination: {
        total: 0,
        page: 1,
        totalPages: 0
    },
    financialSummary: null,
    monthlyReport: null,
    revenueByPeriod: [],
    profitConfigs: [],
    profitDistributions: [],
    profitDistributionSummary: null,
    isLoading: false,
    isLoadingAttendances: false,
    isLoadingReports: false,
    isLoadingProfitConfig: false,
    isLoadingProfitDistributions: false,
    error: null
}

export function useFinancials(): UseFinancialsState & UseFinancialsActions {
    const [state, setState] = useState<UseFinancialsState>(initialState)

    // Utility functions
    const setError = useCallback((error: string) => {
        setState(prev => ({ ...prev, error, isLoading: false }))
    }, [])

    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }))
    }, [])

    const resetState = useCallback(() => {
        setState(initialState)
    }, [])

    // Attendance actions
    const fetchAttendances = useCallback(async (options: FinancialPaginationOptions) => {
        try {
            setState(prev => ({ ...prev, isLoadingAttendances: true, error: null }))

            const response = await FinancialService.getAttendances(options)

            setState(prev => ({
                ...prev,
                attendances: response.data,
                attendancesPagination: {
                    total: response.total,
                    page: response.page,
                    totalPages: response.totalPages
                },
                isLoadingAttendances: false
            }))
        } catch (error) {
            setError(`Erro ao buscar atendimentos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
            setState(prev => ({ ...prev, isLoadingAttendances: false }))
        }
    }, [setError])

    const fetchAttendancesWithDetails = useCallback(async (options: FinancialPaginationOptions) => {
        try {
            setState(prev => ({ ...prev, isLoadingAttendances: true, error: null }))

            const response = await FinancialService.getAttendancesWithDetails(options)

            setState(prev => ({
                ...prev,
                attendancesWithDetails: response.data,
                attendancesPagination: {
                    total: response.total,
                    page: response.page,
                    totalPages: response.totalPages
                },
                isLoadingAttendances: false
            }))
        } catch (error) {
            setError(`Erro ao buscar atendimentos com detalhes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
            setState(prev => ({ ...prev, isLoadingAttendances: false }))
        }
    }, [setError])

    const fetchAttendanceById = useCallback(async (id: string) => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }))

            const attendance = await FinancialService.getAttendanceById(id)

            setState(prev => ({
                ...prev,
                currentAttendance: attendance,
                isLoading: false
            }))
        } catch (error) {
            setError(`Erro ao buscar atendimento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
        }
    }, [setError])

    const createAttendance = useCallback(async (data: AttendanceInsert): Promise<Attendance | null> => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }))

            const attendance = await FinancialService.createAttendance(data)

            setState(prev => ({
                ...prev,
                attendances: [attendance, ...prev.attendances],
                isLoading: false
            }))

            return attendance
        } catch (error) {
            setError(`Erro ao criar atendimento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
            return null
        }
    }, [setError])

    const updateAttendance = useCallback(async (id: string, data: AttendanceUpdate): Promise<Attendance | null> => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }))

            const attendance = await FinancialService.updateAttendance(id, data)

            setState(prev => ({
                ...prev,
                attendances: prev.attendances.map(a => a.id === id ? attendance : a),
                attendancesWithDetails: prev.attendancesWithDetails.map(a => a.id === id ? { ...a, ...attendance } : a),
                currentAttendance: prev.currentAttendance?.id === id ? { ...prev.currentAttendance, ...attendance } : prev.currentAttendance,
                isLoading: false
            }))

            return attendance
        } catch (error) {
            setError(`Erro ao atualizar atendimento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
            return null
        }
    }, [setError])

    const deleteAttendance = useCallback(async (id: string): Promise<boolean> => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }))

            await FinancialService.deleteAttendance(id)

            setState(prev => ({
                ...prev,
                attendances: prev.attendances.filter(a => a.id !== id),
                attendancesWithDetails: prev.attendancesWithDetails.filter(a => a.id !== id),
                currentAttendance: prev.currentAttendance?.id === id ? null : prev.currentAttendance,
                isLoading: false
            }))

            return true
        } catch (error) {
            setError(`Erro ao deletar atendimento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
            return false
        }
    }, [setError])

    const updatePaymentStatus = useCallback(async (id: string, status: PaymentStatus): Promise<Attendance | null> => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }))

            const attendance = await FinancialService.updatePaymentStatus(id, status)

            setState(prev => ({
                ...prev,
                attendances: prev.attendances.map(a => a.id === id ? attendance : a),
                attendancesWithDetails: prev.attendancesWithDetails.map(a => a.id === id ? { ...a, ...attendance } : a),
                currentAttendance: prev.currentAttendance?.id === id ? { ...prev.currentAttendance, ...attendance } : prev.currentAttendance,
                isLoading: false
            }))

            return attendance
        } catch (error) {
            setError(`Erro ao atualizar status de pagamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
            return null
        }
    }, [setError])

    // Report actions
    const fetchFinancialSummary = useCallback(async (dateFrom?: string, dateTo?: string, userId?: string) => {
        try {
            setState(prev => ({ ...prev, isLoadingReports: true, error: null }))

            const summary = await FinancialService.getFinancialSummary(dateFrom, dateTo, userId)

            setState(prev => ({
                ...prev,
                financialSummary: summary,
                isLoadingReports: false
            }))
        } catch (error) {
            setError(`Erro ao buscar resumo financeiro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
            setState(prev => ({ ...prev, isLoadingReports: false }))
        }
    }, [setError])

    const fetchMonthlyReport = useCallback(async (month: number, year: number, userId?: string) => {
        try {
            setState(prev => ({ ...prev, isLoadingReports: true, error: null }))

            const report = await FinancialService.getMonthlyReport(month, year, userId)

            setState(prev => ({
                ...prev,
                monthlyReport: report,
                isLoadingReports: false
            }))
        } catch (error) {
            setError(`Erro ao buscar relatório mensal: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
            setState(prev => ({ ...prev, isLoadingReports: false }))
        }
    }, [setError])

    const fetchRevenueByPeriod = useCallback(async (
        startDate: string,
        endDate: string,
        groupBy: 'day' | 'week' | 'month' = 'day',
        userId?: string
    ) => {
        try {
            setState(prev => ({ ...prev, isLoadingReports: true, error: null }))

            const revenue = await FinancialService.getRevenueByPeriod(startDate, endDate, groupBy, userId)

            setState(prev => ({
                ...prev,
                revenueByPeriod: revenue,
                isLoadingReports: false
            }))
        } catch (error) {
            setError(`Erro ao buscar receita por período: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
            setState(prev => ({ ...prev, isLoadingReports: false }))
        }
    }, [setError])

    // Profit distribution config actions
    const fetchProfitConfigs = useCallback(async (userId: string) => {
        try {
            setState(prev => ({ ...prev, isLoadingProfitConfig: true, error: null }))

            const configs = await FinancialService.getProfitDistributionConfigs(userId)

            setState(prev => ({
                ...prev,
                profitConfigs: configs,
                isLoadingProfitConfig: false
            }))
        } catch (error) {
            setError(`Erro ao buscar configurações de lucro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
            setState(prev => ({ ...prev, isLoadingProfitConfig: false }))
        }
    }, [setError])

    const createProfitConfig = useCallback(async (data: ProfitDistributionConfigInsert): Promise<ProfitDistributionConfig | null> => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }))

            const config = await FinancialService.createProfitDistributionConfig(data)

            setState(prev => ({
                ...prev,
                profitConfigs: [...prev.profitConfigs, config],
                isLoading: false
            }))

            return config
        } catch (error) {
            setError(`Erro ao criar configuração de lucro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
            return null
        }
    }, [setError])

    const updateProfitConfig = useCallback(async (id: string, data: ProfitDistributionConfigUpdate): Promise<ProfitDistributionConfig | null> => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }))

            const config = await FinancialService.updateProfitDistributionConfig(id, data)

            setState(prev => ({
                ...prev,
                profitConfigs: prev.profitConfigs.map(c => c.id === id ? config : c),
                isLoading: false
            }))

            return config
        } catch (error) {
            setError(`Erro ao atualizar configuração de lucro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
            return null
        }
    }, [setError])

    const deleteProfitConfig = useCallback(async (id: string): Promise<boolean> => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }))

            await FinancialService.deleteProfitDistributionConfig(id)

            setState(prev => ({
                ...prev,
                profitConfigs: prev.profitConfigs.filter(c => c.id !== id),
                isLoading: false
            }))

            return true
        } catch (error) {
            setError(`Erro ao deletar configuração de lucro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
            return false
        }
    }, [setError])

    // Profit distribution actions
    const fetchProfitDistributions = useCallback(async (userId: string, dateFrom?: string, dateTo?: string) => {
        try {
            setState(prev => ({ ...prev, isLoadingProfitDistributions: true, error: null }))

            const distributions = await FinancialService.getProfitDistributions(userId, dateFrom, dateTo)

            setState(prev => ({
                ...prev,
                profitDistributions: distributions,
                isLoadingProfitDistributions: false
            }))
        } catch (error) {
            setError(`Erro ao buscar distribuições de lucro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
            setState(prev => ({ ...prev, isLoadingProfitDistributions: false }))
        }
    }, [setError])

    const calculateProfitDistribution = useCallback(async (userId: string, month: number, year: number) => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }))

            const summary = await FinancialService.calculateProfitDistribution(userId, month, year)

            setState(prev => ({
                ...prev,
                profitDistributionSummary: summary,
                isLoading: false
            }))
        } catch (error) {
            setError(`Erro ao calcular distribuição de lucro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
        }
    }, [setError])

    const executeProfitDistribution = useCallback(async (userId: string, month: number, year: number): Promise<ProfitDistribution | null> => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }))

            const distribution = await FinancialService.executeProfitDistribution(userId, month, year)

            setState(prev => ({
                ...prev,
                isLoading: false
            }))

            return distribution
        } catch (error) {
            setError(`Erro ao executar distribuição de lucro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
            return null
        }
    }, [setError])

    const fetchProfitDistributionSummary = useCallback(async (userId: string, dateFrom?: string, dateTo?: string) => {
        try {
            setState(prev => ({ ...prev, isLoadingProfitDistributions: true, error: null }))

            const summary = await FinancialService.getProfitDistributionSummary(userId, dateFrom, dateTo)

            setState(prev => ({
                ...prev,
                profitDistributionSummary: {
                    totalProfit: summary.totalDistributed,
                    totalDistributed: summary.totalDistributed,
                    totalPending: summary.totalPending,
                    distributions: Object.entries(summary.distributionsByCategory).map(([category, amount]) => ({
                        category: category as any,
                        description: null,
                        amount: amount || 0,
                        percentage: 0
                    }))
                },
                isLoadingProfitDistributions: false
            }))
        } catch (error) {
            setError(`Erro ao buscar resumo de distribuições: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
            setState(prev => ({ ...prev, isLoadingProfitDistributions: false }))
        }
    }, [setError])

    return {
        // State
        ...state,

        // Actions
        fetchAttendances,
        fetchAttendancesWithDetails,
        fetchAttendanceById,
        createAttendance,
        updateAttendance,
        deleteAttendance,
        updatePaymentStatus,
        fetchFinancialSummary,
        fetchMonthlyReport,
        fetchRevenueByPeriod,
        fetchProfitConfigs,
        createProfitConfig,
        updateProfitConfig,
        deleteProfitConfig,
        fetchProfitDistributions,
        calculateProfitDistribution,
        executeProfitDistribution,
        fetchProfitDistributionSummary,
        clearError,
        resetState
    }
}

// Hook específico para filtros financeiros
export function useFinancialFilters() {
    const [filters, setFilters] = useState<FinancialFilters>({})

    const updateFilter = useCallback(<K extends keyof FinancialFilters>(
        key: K,
        value: FinancialFilters[K]
    ) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }))
    }, [])

    const clearFilters = useCallback(() => {
        setFilters({})
    }, [])

    const resetFilter = useCallback(<K extends keyof FinancialFilters>(key: K) => {
        setFilters(prev => {
            const newFilters = { ...prev }
            delete newFilters[key]
            return newFilters
        })
    }, [])

    return {
        filters,
        updateFilter,
        clearFilters,
        resetFilter,
        hasActiveFilters: Object.keys(filters).length > 0
    }
}