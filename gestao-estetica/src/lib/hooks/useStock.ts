'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'


import type { Database } from '@/lib/database/supabase/types'
import {StockAlert,
    StockMovementPaginationOptions, StockMovementSummary, StockPaginationOptions,
    StockService, StockSummary, StockValuation } from '../services/stock.service'

type Product = Database['public']['Tables']['products']['Row']
type ProductInsert = Database['public']['Tables']['products']['Insert']
type ProductUpdate = Database['public']['Tables']['products']['Update']
type StockMovement = Database['public']['Tables']['stock_movements']['Row']
type StockMovementInsert = Database['public']['Tables']['stock_movements']['Insert']
type StockMovementUpdate = Database['public']['Tables']['stock_movements']['Update']

interface UseStockOptions {
    autoFetch?: boolean
    initialLimit?: number
}

interface UseStockReturn {
    // Products
    products: Product[]
    productsTotal: number
    productsPage: number
    productsTotalPages: number
    productsLoading: boolean
    productsError: string | null

    // Stock Movements
    stockMovements: any[]
    stockMovementsTotal: number
    stockMovementsPage: number
    stockMovementsTotalPages: number
    stockMovementsLoading: boolean
    stockMovementsError: string | null

    // Summary Data
    stockSummary: StockSummary | null
    stockAlerts: StockAlert[]
    stockValuation: StockValuation | null
    stockMovementSummary: StockMovementSummary | null
    categories: string[]

    // Loading states
    summaryLoading: boolean
    alertsLoading: boolean
    valuationLoading: boolean
    categoriesLoading: boolean

    // Actions
    fetchProducts: (options?: Partial<StockPaginationOptions>) => Promise<void>
    fetchStockMovements: (options?: Partial<StockMovementPaginationOptions>) => Promise<void>
    fetchStockSummary: () => Promise<void>
    fetchStockAlerts: () => Promise<void>
    fetchStockValuation: () => Promise<void>
    fetchStockMovementSummary: (dateFrom?: string, dateTo?: string) => Promise<void>
    fetchCategories: () => Promise<void>

    createProduct: (productData: ProductInsert) => Promise<Product>
    updateProduct: (id: string, productData: ProductUpdate) => Promise<Product>
    deleteProduct: (id: string) => Promise<void>
    toggleProductStatus: (id: string) => Promise<Product>

    createStockMovement: (movementData: StockMovementInsert) => Promise<StockMovement>
    updateStockMovement: (id: string, movementData: StockMovementUpdate) => Promise<StockMovement>
    deleteStockMovement: (id: string) => Promise<void>

    addStock: (productId: string, quantity: number, unitCost?: number, notes?: string) => Promise<StockMovement>
    removeStock: (productId: string, quantity: number, notes?: string) => Promise<StockMovement>
    adjustStock: (productId: string, quantity: number, notes?: string) => Promise<StockMovement>
    markAsExpired: (productId: string, quantity: number, notes?: string) => Promise<StockMovement>
    markAsLoss: (productId: string, quantity: number, notes?: string) => Promise<StockMovement>

    validateProduct: (product: ProductInsert) => boolean
    validateStockMovement: (movement: StockMovementInsert) => boolean
    validateStockAvailability: (productId: string, quantity: number) => Promise<{ isValid: boolean; availableStock: number; message?: string }>

    clearErrors: () => void
    refreshAll: () => Promise<void>
}

export const useStock = (options: UseStockOptions = {}): UseStockReturn => {
    const { autoFetch = true, initialLimit = 20 } = options
    const { user } = useAuthStore()

    // Products state
    const [products, setProducts] = useState<Product[]>([])
    const [productsTotal, setProductsTotal] = useState(0)
    const [productsPage, setProductsPage] = useState(1)
    const [productsTotalPages, setProductsTotalPages] = useState(0)
    const [productsLoading, setProductsLoading] = useState(false)
    const [productsError, setProductsError] = useState<string | null>(null)

    // Stock movements state
    const [stockMovements, setStockMovements] = useState<any[]>([])
    const [stockMovementsTotal, setStockMovementsTotal] = useState(0)
    const [stockMovementsPage, setStockMovementsPage] = useState(1)
    const [stockMovementsTotalPages, setStockMovementsTotalPages] = useState(0)
    const [stockMovementsLoading, setStockMovementsLoading] = useState(false)
    const [stockMovementsError, setStockMovementsError] = useState<string | null>(null)

    // Summary states
    const [stockSummary, setStockSummary] = useState<StockSummary | null>(null)
    const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([])
    const [stockValuation, setStockValuation] = useState<StockValuation | null>(null)
    const [stockMovementSummary, setStockMovementSummary] = useState<StockMovementSummary | null>(null)
    const [categories, setCategories] = useState<string[]>([])

    // Loading states
    const [summaryLoading, setSummaryLoading] = useState(false)
    const [alertsLoading, setAlertsLoading] = useState(false)
    const [valuationLoading, setValuationLoading] = useState(false)
    const [categoriesLoading, setCategoriesLoading] = useState(false)

    // Fetch Products
    const fetchProducts = useCallback(async (options: Partial<StockPaginationOptions> = {}) => {
        if (!user?.id) return

        try {
            setProductsLoading(true)
            setProductsError(null)

            const paginationOptions: StockPaginationOptions = {
                page: productsPage,
                limit: initialLimit,
                filters: {},
                sortBy: 'name',
                sortOrder: 'asc',
                ...options
            }

            const response = await StockService.getProducts(paginationOptions)

            setProducts(response.data)
            setProductsTotal(response.total)
            setProductsPage(response.page)
            setProductsTotalPages(response.totalPages)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao carregar produtos'
            setProductsError(message)
            console.error('Erro ao buscar produtos:', error)
        } finally {
            setProductsLoading(false)
        }
    }, [user?.id, productsPage, initialLimit])

    // Fetch Stock Movements
    const fetchStockMovements = useCallback(async (options: Partial<StockMovementPaginationOptions> = {}) => {
        if (!user?.id) return

        try {
            setStockMovementsLoading(true)
            setStockMovementsError(null)

            const paginationOptions: StockMovementPaginationOptions = {
                page: stockMovementsPage,
                limit: initialLimit,
                filters: {},
                sortBy: 'created_at',
                sortOrder: 'desc',
                ...options
            }

            const response = await StockService.getStockMovements(paginationOptions)

            setStockMovements(response.data)
            setStockMovementsTotal(response.total)
            setStockMovementsPage(response.page)
            setStockMovementsTotalPages(response.totalPages)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao carregar movimentações'
            setStockMovementsError(message)
            console.error('Erro ao buscar movimentações:', error)
        } finally {
            setStockMovementsLoading(false)
        }
    }, [user?.id, stockMovementsPage, initialLimit])

    // Fetch Stock Summary
    const fetchStockSummary = useCallback(async () => {
        if (!user?.id) return

        try {
            setSummaryLoading(true)
            const summary = await StockService.getStockSummary(user.id)
            setStockSummary(summary)
        } catch (error) {
            console.error('Erro ao buscar resumo do estoque:', error)
        } finally {
            setSummaryLoading(false)
        }
    }, [user?.id])

    // Fetch Stock Alerts
    const fetchStockAlerts = useCallback(async () => {
        if (!user?.id) return

        try {
            setAlertsLoading(true)
            const alerts = await StockService.getStockAlerts(user.id)
            setStockAlerts(alerts)
        } catch (error) {
            console.error('Erro ao buscar alertas:', error)
        } finally {
            setAlertsLoading(false)
        }
    }, [user?.id])

    // Fetch Stock Valuation
    const fetchStockValuation = useCallback(async () => {
        if (!user?.id) return

        try {
            setValuationLoading(true)
            const valuation = await StockService.getStockValuation(user.id)
            setStockValuation(valuation)
        } catch (error) {
            console.error('Erro ao buscar valorização:', error)
        } finally {
            setValuationLoading(false)
        }
    }, [user?.id])

    // Fetch Stock Movement Summary
    const fetchStockMovementSummary = useCallback(async (dateFrom?: string, dateTo?: string) => {
        if (!user?.id) return

        try {
            const summary = await StockService.getStockMovementSummary(user.id, dateFrom, dateTo)
            setStockMovementSummary(summary)
        } catch (error) {
            console.error('Erro ao buscar resumo de movimentações:', error)
        }
    }, [user?.id])

    // Fetch Categories
    const fetchCategories = useCallback(async () => {
        if (!user?.id) return

        try {
            setCategoriesLoading(true)
            const cats = await StockService.getProductCategories(user.id)
            setCategories(cats)
        } catch (error) {
            console.error('Erro ao buscar categorias:', error)
        } finally {
            setCategoriesLoading(false)
        }
    }, [user?.id])

    // Product CRUD operations
    const createProduct = useCallback(async (productData: ProductInsert): Promise<Product> => {
        if (!user?.id) throw new Error('Usuário não autenticado')

        StockService.validateProduct(productData)

        const product = await StockService.createProduct({
            ...productData,
            user_id: user.id
        })

        // Refresh data
        fetchProducts()
        fetchStockSummary()
        fetchCategories()

        return product
    }, [user?.id, fetchProducts, fetchStockSummary, fetchCategories])

    const updateProduct = useCallback(async (id: string, productData: ProductUpdate): Promise<Product> => {
        const product = await StockService.updateProduct(id, productData)

        // Refresh data
        fetchProducts()
        fetchStockSummary()
        fetchStockValuation()

        return product
    }, [fetchProducts, fetchStockSummary, fetchStockValuation])

    const deleteProduct = useCallback(async (id: string): Promise<void> => {
        await StockService.deleteProduct(id)

        // Refresh data
        fetchProducts()
        fetchStockSummary()
        fetchStockValuation()
    }, [fetchProducts, fetchStockSummary, fetchStockValuation])

    const toggleProductStatus = useCallback(async (id: string): Promise<Product> => {
        const product = await StockService.toggleProductStatus(id)

        // Refresh data
        fetchProducts()
        fetchStockSummary()

        return product
    }, [fetchProducts, fetchStockSummary])

    // Stock Movement operations
    const createStockMovement = useCallback(async (movementData: StockMovementInsert): Promise<StockMovement> => {
        if (!user?.id) throw new Error('Usuário não autenticado')

        StockService.validateStockMovement(movementData)

        const movement = await StockService.createStockMovement({
            ...movementData,
            user_id: user.id
        })

        // Refresh data
        fetchProducts()
        fetchStockMovements()
        fetchStockSummary()
        fetchStockValuation()
        fetchStockAlerts()

        return movement
    }, [user?.id, fetchProducts, fetchStockMovements, fetchStockSummary, fetchStockValuation, fetchStockAlerts])

    const updateStockMovement = useCallback(async (id: string, movementData: StockMovementUpdate): Promise<StockMovement> => {
        const movement = await StockService.updateStockMovement(id, movementData)

        // Refresh data
        fetchProducts()
        fetchStockMovements()
        fetchStockSummary()
        fetchStockValuation()
        fetchStockAlerts()

        return movement
    }, [fetchProducts, fetchStockMovements, fetchStockSummary, fetchStockValuation, fetchStockAlerts])

    const deleteStockMovement = useCallback(async (id: string): Promise<void> => {
        await StockService.deleteStockMovement(id)

        // Refresh data
        fetchProducts()
        fetchStockMovements()
        fetchStockSummary()
        fetchStockValuation()
        fetchStockAlerts()
    }, [fetchProducts, fetchStockMovements, fetchStockSummary, fetchStockValuation, fetchStockAlerts])

    // Stock operations
    const addStock = useCallback(async (productId: string, quantity: number, unitCost?: number, notes?: string): Promise<StockMovement> => {
        if (!user?.id) throw new Error('Usuário não autenticado')

        const movement = await StockService.addStock(productId, quantity, unitCost, notes)

        // Refresh data
        fetchProducts()
        fetchStockMovements()
        fetchStockSummary()
        fetchStockValuation()
        fetchStockAlerts()

        return movement
    }, [user?.id, fetchProducts, fetchStockMovements, fetchStockSummary, fetchStockValuation, fetchStockAlerts])

    const removeStock = useCallback(async (productId: string, quantity: number, notes?: string): Promise<StockMovement> => {
        if (!user?.id) throw new Error('Usuário não autenticado')

        const movement = await StockService.removeStock(productId, quantity, notes)

        // Refresh data
        fetchProducts()
        fetchStockMovements()
        fetchStockSummary()
        fetchStockValuation()
        fetchStockAlerts()

        return movement
    }, [user?.id, fetchProducts, fetchStockMovements, fetchStockSummary, fetchStockValuation, fetchStockAlerts])

    const adjustStock = useCallback(async (productId: string, quantity: number, notes?: string): Promise<StockMovement> => {
        if (!user?.id) throw new Error('Usuário não autenticado')

        const movement = await StockService.adjustStock(productId, quantity, notes)

        // Refresh data
        fetchProducts()
        fetchStockMovements()
        fetchStockSummary()
        fetchStockValuation()
        fetchStockAlerts()

        return movement
    }, [user?.id, fetchProducts, fetchStockMovements, fetchStockSummary, fetchStockValuation, fetchStockAlerts])

    const markAsExpired = useCallback(async (productId: string, quantity: number, notes?: string): Promise<StockMovement> => {
        if (!user?.id) throw new Error('Usuário não autenticado')

        const movement = await StockService.markAsExpired(productId, quantity, notes)

        // Refresh data
        fetchProducts()
        fetchStockMovements()
        fetchStockSummary()
        fetchStockValuation()
        fetchStockAlerts()

        return movement
    }, [user?.id, fetchProducts, fetchStockMovements, fetchStockSummary, fetchStockValuation, fetchStockAlerts])

    const markAsLoss = useCallback(async (productId: string, quantity: number, notes?: string): Promise<StockMovement> => {
        if (!user?.id) throw new Error('Usuário não autenticado')

        const movement = await StockService.markAsLoss(productId, quantity, notes)

        // Refresh data
        fetchProducts()
        fetchStockMovements()
        fetchStockSummary()
        fetchStockValuation()
        fetchStockAlerts()

        return movement
    }, [user?.id, fetchProducts, fetchStockMovements, fetchStockSummary, fetchStockValuation, fetchStockAlerts])

    // Validation methods
    const validateProduct = useCallback((product: ProductInsert): boolean => {
        return StockService.validateProduct(product)
    }, [])

    const validateStockMovement = useCallback((movement: StockMovementInsert): boolean => {
        return StockService.validateStockMovement(movement)
    }, [])

    const validateStockAvailability = useCallback(async (productId: string, quantity: number) => {
        return StockService.validateStockAvailability(productId, quantity)
    }, [])

    // Utility methods
    const clearErrors = useCallback(() => {
        setProductsError(null)
        setStockMovementsError(null)
    }, [])

    const refreshAll = useCallback(async () => {
        await Promise.all([
            fetchProducts(),
            fetchStockMovements(),
            fetchStockSummary(),
            fetchStockAlerts(),
            fetchStockValuation(),
            fetchCategories()
        ])
    }, [fetchProducts, fetchStockMovements, fetchStockSummary, fetchStockAlerts, fetchStockValuation, fetchCategories])

    // Auto fetch on mount
    useEffect(() => {
        if (autoFetch && user?.id) {
            refreshAll()
        }
    }, [autoFetch, user?.id, refreshAll])

    return {
        // Products
        products,
        productsTotal,
        productsPage,
        productsTotalPages,
        productsLoading,
        productsError,

        // Stock Movements
        stockMovements,
        stockMovementsTotal,
        stockMovementsPage,
        stockMovementsTotalPages,
        stockMovementsLoading,
        stockMovementsError,

        // Summary Data
        stockSummary,
        stockAlerts,
        stockValuation,
        stockMovementSummary,
        categories,

        // Loading states
        summaryLoading,
        alertsLoading,
        valuationLoading,
        categoriesLoading,

        // Actions
        fetchProducts,
        fetchStockMovements,
        fetchStockSummary,
        fetchStockAlerts,
        fetchStockValuation,
        fetchStockMovementSummary,
        fetchCategories,

        createProduct,
        updateProduct,
        deleteProduct,
        toggleProductStatus,

        createStockMovement,
        updateStockMovement,
        deleteStockMovement,

        addStock,
        removeStock,
        adjustStock,
        markAsExpired,
        markAsLoss,

        validateProduct,
        validateStockMovement,
        validateStockAvailability,

        clearErrors,
        refreshAll
    }
}