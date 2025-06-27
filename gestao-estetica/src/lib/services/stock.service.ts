// lib/services/stockService.ts
import { supabase } from '@/lib/database/supabase/client'
import type { Database } from '@/lib/database/supabase/types'

type Product = Database['public']['Tables']['products']['Row']
type ProductInsert = Database['public']['Tables']['products']['Insert']
type ProductUpdate = Database['public']['Tables']['products']['Update']
type StockMovement = Database['public']['Tables']['stock_movements']['Row']
type StockMovementInsert = Database['public']['Tables']['stock_movements']['Insert']
type StockMovementUpdate = Database['public']['Tables']['stock_movements']['Update']
type StockMovementType = Database['public']['Enums']['stock_movement_enum']

export interface StockFilters {
    category?: string
    isActive?: boolean
    lowStock?: boolean
    expiringSoon?: boolean
    expiryDays?: number
    searchTerm?: string
}

export interface StockMovementFilters {
    productId?: string
    movementType?: StockMovementType
    dateFrom?: string
    dateTo?: string
    referenceType?: string
    referenceId?: string
}

export interface StockPaginationOptions {
    page: number
    limit: number
    filters?: StockFilters
    sortBy?: keyof Product
    sortOrder?: 'asc' | 'desc'
}

export interface StockMovementPaginationOptions {
    page: number
    limit: number
    filters?: StockMovementFilters
    sortBy?: keyof StockMovement
    sortOrder?: 'asc' | 'desc'
}

export interface ProductsResponse {
    data: Product[]
    total: number
    page: number
    totalPages: number
}

export interface StockMovementsResponse {
    data: StockMovementWithProduct[]
    total: number
    page: number
    totalPages: number
}

export interface StockMovementWithProduct extends StockMovement {
    products?: { name: string; unit: string; sku: string | null }
}

export interface StockSummary {
    totalProducts: number
    totalValue: number
    lowStockCount: number
    expiredCount: number
    expiringSoonCount: number
    categories: string[]
}

export interface StockAlert {
    id: string
    productName: string
    type: 'low_stock' | 'expired' | 'expiring_soon'
    currentStock: number
    minStock?: number
    expiryDate?: string | null
    daysUntilExpiry?: number
    severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface StockValuation {
    totalValue: number
    totalQuantity: number
    averageCostPerUnit: number
    productsByCategory: Record<string, {
        totalValue: number
        totalQuantity: number
        productCount: number
    }>
}

export interface StockMovementSummary {
    totalIn: number
    totalOut: number
    totalAdjustments: number
    totalExpired: number
    totalLoss: number
    netMovement: number
    movementsByType: Partial<Record<StockMovementType, number>>
}

export class StockService {
    // PRODUCT METHODS
    static async getProducts(options: StockPaginationOptions): Promise<ProductsResponse> {
        const { page, limit, filters, sortBy = 'name', sortOrder = 'asc' } = options
        const offset = (page - 1) * limit

        let query = supabase
            .from('products')
            .select('*', { count: 'exact' })

        // Aplicar filtros
        if (filters?.category) {
            query = query.eq('category', filters.category)
        }

        if (filters?.isActive !== undefined) {
            query = query.eq('is_active', filters.isActive)
        }

        if (filters?.searchTerm) {
            query = query.or(`name.ilike.%${filters.searchTerm}%,sku.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`)
        }

        if (filters?.lowStock) {
            query = query.lt('current_stock', 'min_stock')
        }

        if (filters?.expiringSoon && filters?.expiryDays) {
            const futureDate = new Date()
            futureDate.setDate(futureDate.getDate() + filters.expiryDays)
            query = query
                .not('expiry_date', 'is', null)
                .lte('expiry_date', futureDate.toISOString().split('T')[0])
                .gte('expiry_date', new Date().toISOString().split('T')[0])
        }

        // Aplicar ordenação e paginação
        query = query
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range(offset, offset + limit - 1)

        const { data, error, count } = await query

        if (error) {
            throw new Error(`Erro ao buscar produtos: ${error.message}`)
        }

        return {
            data: data || [],
            total: count || 0,
            page,
            totalPages: Math.ceil((count || 0) / limit)
        }
    }

    static async getProductById(id: string): Promise<Product> {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            throw new Error(`Erro ao buscar produto: ${error.message}`)
        }

        return data
    }

    static async createProduct(productData: ProductInsert): Promise<Product> {
        const { data, error } = await supabase
            .from('products')
            .insert(productData)
            .select()
            .single()

        if (error) {
            throw new Error(`Erro ao criar produto: ${error.message}`)
        }

        return data
    }

    static async updateProduct(id: string, productData: ProductUpdate): Promise<Product> {
        const { data, error } = await supabase
            .from('products')
            .update(productData)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            throw new Error(`Erro ao atualizar produto: ${error.message}`)
        }

        return data
    }

    static async deleteProduct(id: string): Promise<void> {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id)

        if (error) {
            throw new Error(`Erro ao deletar produto: ${error.message}`)
        }
    }

    static async toggleProductStatus(id: string): Promise<Product> {
        const product = await this.getProductById(id)
        return this.updateProduct(id, { is_active: !product.is_active })
    }

    // STOCK MOVEMENT METHODS
    static async getStockMovements(options: StockMovementPaginationOptions): Promise<StockMovementsResponse> {
        const { page, limit, filters, sortBy = 'created_at', sortOrder = 'desc' } = options
        const offset = (page - 1) * limit

        let query = supabase
            .from('stock_movements')
            .select(`
                *,
                products (name, unit, sku)
            `, { count: 'exact' })

        // Aplicar filtros
        if (filters?.productId) {
            query = query.eq('product_id', filters.productId)
        }

        if (filters?.movementType) {
            query = query.eq('movement_type', filters.movementType)
        }

        if (filters?.referenceType) {
            query = query.eq('reference_type', filters.referenceType)
        }

        if (filters?.referenceId) {
            query = query.eq('reference_id', filters.referenceId)
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
            throw new Error(`Erro ao buscar movimentações de estoque: ${error.message}`)
        }

        return {
            data: data || [],
            total: count || 0,
            page,
            totalPages: Math.ceil((count || 0) / limit)
        }
    }

    static async createStockMovement(movementData: StockMovementInsert): Promise<StockMovement> {
        const { data, error } = await supabase
            .from('stock_movements')
            .insert(movementData)
            .select()
            .single()

        if (error) {
            throw new Error(`Erro ao criar movimentação de estoque: ${error.message}`)
        }

        // Atualizar estoque do produto
        await this.updateProductStock(movementData.product_id, movementData.movement_type, movementData.quantity)

        return data
    }

    static async updateStockMovement(id: string, movementData: StockMovementUpdate): Promise<StockMovement> {
        // Buscar movimentação original para reverter o estoque
        const originalMovement = await this.getStockMovementById(id)

        // Reverter movimentação original
        await this.updateProductStock(
            originalMovement.product_id,
            this.getOppositeMovementType(originalMovement.movement_type),
            originalMovement.quantity
        )

        // Atualizar movimentação
        const { data, error } = await supabase
            .from('stock_movements')
            .update(movementData)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            throw new Error(`Erro ao atualizar movimentação de estoque: ${error.message}`)
        }

        // Aplicar nova movimentação
        if (movementData.movement_type && movementData.quantity) {
            await this.updateProductStock(data.product_id, movementData.movement_type, movementData.quantity)
        }

        return data
    }

    static async deleteStockMovement(id: string): Promise<void> {
        // Buscar movimentação para reverter o estoque
        const movement = await this.getStockMovementById(id)

        // Reverter movimentação
        await this.updateProductStock(
            movement.product_id,
            this.getOppositeMovementType(movement.movement_type),
            movement.quantity
        )

        const { error } = await supabase
            .from('stock_movements')
            .delete()
            .eq('id', id)

        if (error) {
            throw new Error(`Erro ao deletar movimentação de estoque: ${error.message}`)
        }
    }

    static async getStockMovementById(id: string): Promise<StockMovementWithProduct> {
        const { data, error } = await supabase
            .from('stock_movements')
            .select(`
                *,
                products (name, unit, sku)
            `)
            .eq('id', id)
            .single()

        if (error) {
            throw new Error(`Erro ao buscar movimentação de estoque: ${error.message}`)
        }

        return data
    }

    // STOCK OPERATIONS
    static async addStock(
        productId: string,
        quantity: number,
        unitCost?: number,
        notes?: string,
        referenceId?: string,
        referenceType?: string
    ): Promise<StockMovement> {
        return this.createStockMovement({
            user_id: '', // Será preenchido pelo contexto da aplicação
            product_id: productId,
            movement_type: 'in',
            quantity,
            unit_cost: unitCost,
            notes,
            reference_id: referenceId,
            reference_type: referenceType
        })
    }

    static async removeStock(
        productId: string,
        quantity: number,
        notes?: string,
        referenceId?: string,
        referenceType?: string
    ): Promise<StockMovement> {
        return this.createStockMovement({
            user_id: '', // Será preenchido pelo contexto da aplicação
            product_id: productId,
            movement_type: 'out',
            quantity,
            notes,
            reference_id: referenceId,
            reference_type: referenceType
        })
    }

    static async adjustStock(
        productId: string,
        quantity: number,
        notes?: string
    ): Promise<StockMovement> {
        return this.createStockMovement({
            user_id: '', // Será preenchido pelo contexto da aplicação
            product_id: productId,
            movement_type: 'adjustment',
            quantity,
            notes
        })
    }

    static async markAsExpired(
        productId: string,
        quantity: number,
        notes?: string
    ): Promise<StockMovement> {
        return this.createStockMovement({
            user_id: '', // Será preenchido pelo contexto da aplicação
            product_id: productId,
            movement_type: 'expired',
            quantity,
            notes
        })
    }

    static async markAsLoss(
        productId: string,
        quantity: number,
        notes?: string
    ): Promise<StockMovement> {
        return this.createStockMovement({
            user_id: '', // Será preenchido pelo contexto da aplicação
            product_id: productId,
            movement_type: 'loss',
            quantity,
            notes
        })
    }

    // REPORTS AND ANALYTICS
    static async getStockSummary(userId: string): Promise<StockSummary> {
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)

        if (error) {
            throw new Error(`Erro ao buscar resumo do estoque: ${error.message}`)
        }

        const today = new Date().toISOString().split('T')[0]

        const summary = products?.reduce((acc, product) => {
            acc.totalProducts++
            acc.totalValue += product.current_stock * product.cost_price

            // Estoque baixo
            if (product.current_stock <= product.min_stock) {
                acc.lowStockCount++
            }

            // Produtos vencidos
            if (product.expiry_date && product.expiry_date < today) {
                acc.expiredCount++
            }

            // Produtos vencendo em 30 dias
            if (product.expiry_date) {
                const expiryDate = new Date(product.expiry_date)
                const thirtyDaysFromNow = new Date()
                thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

                if (expiryDate <= thirtyDaysFromNow && expiryDate >= new Date()) {
                    acc.expiringSoonCount++
                }
            }

            // Categorias
            if (product.category && !acc.categories.includes(product.category)) {
                acc.categories.push(product.category)
            }

            return acc
        }, {
            totalProducts: 0,
            totalValue: 0,
            lowStockCount: 0,
            expiredCount: 0,
            expiringSoonCount: 0,
            categories: [] as string[]
        }) || {
            totalProducts: 0,
            totalValue: 0,
            lowStockCount: 0,
            expiredCount: 0,
            expiringSoonCount: 0,
            categories: []
        }

        return summary
    }

    static async getStockAlerts(userId: string): Promise<StockAlert[]> {
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)

        if (error) {
            throw new Error(`Erro ao buscar alertas de estoque: ${error.message}`)
        }

        const alerts: StockAlert[] = []
        const today = new Date()

        products?.forEach(product => {
            // Alerta de estoque baixo
            if (product.current_stock <= product.min_stock) {
                alerts.push({
                    id: product.id,
                    productName: product.name,
                    type: 'low_stock',
                    currentStock: product.current_stock,
                    minStock: product.min_stock,
                    severity: product.current_stock === 0 ? 'critical' :
                        product.current_stock <= product.min_stock / 2 ? 'high' : 'medium'
                })
            }

            // Alertas de validade
            if (product.expiry_date) {
                const expiryDate = new Date(product.expiry_date)
                const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

                if (daysUntilExpiry < 0) {
                    // Produto vencido
                    alerts.push({
                        id: product.id,
                        productName: product.name,
                        type: 'expired',
                        currentStock: product.current_stock,
                        expiryDate: product.expiry_date,
                        daysUntilExpiry,
                        severity: 'critical'
                    })
                } else if (daysUntilExpiry <= 30) {
                    // Produto vencendo em breve
                    alerts.push({
                        id: product.id,
                        productName: product.name,
                        type: 'expiring_soon',
                        currentStock: product.current_stock,
                        expiryDate: product.expiry_date,
                        daysUntilExpiry,
                        severity: daysUntilExpiry <= 7 ? 'high' :
                            daysUntilExpiry <= 15 ? 'medium' : 'low'
                    })
                }
            }
        })

        // Ordenar por severidade
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
        return alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    }

    static async getStockValuation(userId: string): Promise<StockValuation> {
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)

        if (error) {
            throw new Error(`Erro ao calcular valorização do estoque: ${error.message}`)
        }

        const valuation = products?.reduce((acc, product) => {
            const productValue = product.current_stock * product.cost_price

            acc.totalValue += productValue
            acc.totalQuantity += product.current_stock

            // Agrupar por categoria
            const category = product.category || 'Sem categoria'
            if (!acc.productsByCategory[category]) {
                acc.productsByCategory[category] = {
                    totalValue: 0,
                    totalQuantity: 0,
                    productCount: 0
                }
            }

            acc.productsByCategory[category].totalValue += productValue
            acc.productsByCategory[category].totalQuantity += product.current_stock
            acc.productsByCategory[category].productCount++

            return acc
        }, {
            totalValue: 0,
            totalQuantity: 0,
            averageCostPerUnit: 0,
            productsByCategory: {} as Record<string, {
                totalValue: number
                totalQuantity: number
                productCount: number
            }>
        }) || {
            totalValue: 0,
            totalQuantity: 0,
            averageCostPerUnit: 0,
            productsByCategory: {}
        }

        valuation.averageCostPerUnit = valuation.totalQuantity > 0
            ? valuation.totalValue / valuation.totalQuantity
            : 0

        return valuation
    }

    static async getStockMovementSummary(
        userId: string,
        dateFrom?: string,
        dateTo?: string
    ): Promise<StockMovementSummary> {
        let query = supabase
            .from('stock_movements')
            .select('movement_type, quantity')
            .eq('user_id', userId);

        if (dateFrom) {
            query = query.gte('created_at', dateFrom);
        }

        if (dateTo) {
            query = query.lte('created_at', dateTo);
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(`Erro ao buscar resumo de movimentações: ${error.message}`);
        }

        // Define a interface para o acumulador do reduce para garantir a tipagem correta
        interface SummaryAccumulator {
            totalIn: number;
            totalOut: number;
            totalAdjustments: number;
            totalExpired: number;
            totalLoss: number;
            netMovement: number;
            movementsByType: Partial<Record<StockMovementType, number>>;
        }

        // Valor inicial com a tipagem explícita
        const initialSummary: SummaryAccumulator = {
            totalIn: 0,
            totalOut: 0,
            totalAdjustments: 0,
            totalExpired: 0,
            totalLoss: 0,
            netMovement: 0,
            movementsByType: {}
        };

        return data?.reduce((acc: SummaryAccumulator, movement: { movement_type: StockMovementType; quantity: number }) => {
            const quantity = movement.quantity;

            switch (movement.movement_type) {
                case 'in':
                    acc.totalIn += quantity;
                    acc.netMovement += quantity;
                    break;
                case 'out':
                    acc.totalOut += quantity;
                    acc.netMovement -= quantity;
                    break;
                case 'adjustment':
                    acc.totalAdjustments += Math.abs(quantity);
                    acc.netMovement += quantity;
                    break;
                case 'expired':
                    acc.totalExpired += quantity;
                    acc.netMovement -= quantity;
                    break;
                case 'loss':
                    acc.totalLoss += quantity;
                    acc.netMovement -= quantity;
                    break;
            }

            // Com a tipagem correta em 'movement', esta linha agora é segura
            acc.movementsByType[movement.movement_type] =
                (acc.movementsByType[movement.movement_type] || 0) + quantity;

            return acc;
        }, initialSummary) || initialSummary; // Retorna o valor inicial se 'data' for nulo
    }

    static async getProductCategories(userId: string): Promise<string[]> {
        const { data, error } = await supabase
            .from('products')
            .select('category')
            .eq('user_id', userId)
            .not('category', 'is', null)

        if (error) {
            throw new Error(`Erro ao buscar categorias: ${error.message}`)
        }

        const categories = [...new Set(data?.map(p => p.category).filter(Boolean) || [])]
        return categories.sort()
    }

    // UTILITY METHODS
    private static async updateProductStock(
        productId: string,
        movementType: StockMovementType,
        quantity: number
    ): Promise<void> {
        const product = await this.getProductById(productId)
        let newStock = product.current_stock

        switch (movementType) {
            case 'in':
                newStock += quantity
                break
            case 'out':
            case 'expired':
            case 'loss':
                newStock -= quantity
                break
            case 'adjustment':
                newStock = quantity // Para ajustes, a quantidade é absoluta
                break
        }

        // Garantir que o estoque não fique negativo
        newStock = Math.max(0, newStock)

        await this.updateProduct(productId, { current_stock: newStock })
    }

    private static getOppositeMovementType(movementType: StockMovementType): StockMovementType {
        switch (movementType) {
            case 'in':
                return 'out'
            case 'out':
                return 'in'
            case 'expired':
                return 'in'
            case 'loss':
                return 'in'
            case 'adjustment':
                return 'adjustment' // Para ajustes, precisamos tratar diferente
            default:
                return movementType
        }
    }

    // VALIDATION METHODS
    static validateProduct(product: ProductInsert): boolean {
        if (!product.name?.trim()) {
            throw new Error('Nome do produto é obrigatório')
        }

        if (!product.unit?.trim()) {
            throw new Error('Unidade é obrigatória')
        }

        if (product.cost_price < 0) {
            throw new Error('Preço de custo não pode ser negativo')
        }

        // Check if current_stock is defined and then validate
        if (product.current_stock !== undefined && product.current_stock < 0) {
            throw new Error('Estoque atual não pode ser negativo')
        }

        // Check if min_stock is defined and then validate
        if (product.min_stock !== undefined && product.min_stock < 0) {
            throw new Error('Estoque mínimo não pode ser negativo')
        }

        if (product.expiry_date) {
            const expiryDate = new Date(product.expiry_date)
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            if (expiryDate < today) {
                throw new Error('Data de validade não pode ser anterior a hoje')
            }
        }

        return true
    }

    static validateStockMovement(movement: StockMovementInsert): boolean {
        if (!movement.product_id) {
            throw new Error('Produto é obrigatório')
        }

        if (!movement.movement_type) {
            throw new Error('Tipo de movimentação é obrigatório')
        }

        if (movement.quantity <= 0) {
            throw new Error('Quantidade deve ser maior que zero')
        }

        if (movement.unit_cost && movement.unit_cost < 0) {
            throw new Error('Custo unitário não pode ser negativo')
        }

        return true
    }

    static async validateStockAvailability(
        productId: string,
        quantity: number
    ): Promise<{ isValid: boolean; availableStock: number; message?: string }> {
        const product = await this.getProductById(productId)

        if (quantity > product.current_stock) {
            return {
                isValid: false,
                availableStock: product.current_stock,
                message: `Estoque insuficiente. Disponível: ${product.current_stock} ${product.unit}`
            }
        }

        return {
            isValid: true,
            availableStock: product.current_stock
        }
    }
}