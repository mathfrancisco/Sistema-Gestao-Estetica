// lib/services/campaigns.service.ts
import { supabase } from '@/lib/database/supabase/client'
import type { Database } from '@/lib/database/supabase/types'

export type Campaign = Database['public']['Tables']['campaigns']['Row']
export type CampaignInsert = Database['public']['Tables']['campaigns']['Insert']
export type CampaignUpdate = Database['public']['Tables']['campaigns']['Update']
export type CampaignTemplate = Database['public']['Tables']['campaign_templates']['Row']
export type CampaignTemplateInsert = Database['public']['Tables']['campaign_templates']['Insert']
export type CampaignTemplateUpdate = Database['public']['Tables']['campaign_templates']['Update']
export type CampaignRecipient = Database['public']['Tables']['campaign_recipients']['Row']
export type CampaignRecipientInsert = Database['public']['Tables']['campaign_recipients']['Insert']
export type CampaignRecipientUpdate = Database['public']['Tables']['campaign_recipients']['Update']

type CampaignType = Database['public']['Enums']['campaign_type_enum']
type CampaignStatus = Database['public']['Enums']['campaign_status_enum']
type ClientSegment = Database['public']['Enums']['client_segment_enum']

export interface CampaignFilters {
    status?: CampaignStatus
    type?: CampaignType
    target_segment?: ClientSegment
    dateFrom?: string
    dateTo?: string
    searchQuery?: string
}

export interface CampaignPaginationOptions {
    page: number
    limit: number
    filters?: CampaignFilters
    sortBy?: keyof Campaign
    sortOrder?: 'asc' | 'desc'
}

export interface CampaignsResponse {
    data: Campaign[]
    total: number
    page: number
    totalPages: number
}

export interface CampaignWithDetails extends Campaign {
    template?: CampaignTemplate
    recipients_count?: number
    performance_metrics?: {
        open_rate: number
        click_rate: number
        conversion_rate: number
        roi: number
    }
}

export interface CampaignPerformanceReport {
    total_campaigns: number
    active_campaigns: number
    total_sent: number
    total_opened: number
    total_clicked: number
    total_converted: number
    total_revenue: number
    total_cost: number
    avg_open_rate: number
    avg_click_rate: number
    avg_conversion_rate: number
    avg_roi: number
}

export interface TemplateFilters {
    type?: CampaignType
    is_active?: boolean
    is_default?: boolean
}

export interface SegmentTargetingData {
    segment: ClientSegment
    client_count: number
    clients: Array<{
        id: string
        name: string
        email: string | null
        phone: string | null
    }>
}

// =================== CAMPAIGNS ===================

export const campaignsService = {
    // Buscar campanhas com paginação e filtros
    async getCampaigns(options: CampaignPaginationOptions): Promise<CampaignsResponse> {
        try {
            let query = supabase
                .from('campaigns')
                .select('*', { count: 'exact' })

            // Aplicar filtros
            if (options.filters) {
                const { status, type, target_segment, dateFrom, dateTo, searchQuery } = options.filters

                if (status) {
                    query = query.eq('status', status)
                }
                if (type) {
                    query = query.eq('type', type)
                }
                if (target_segment) {
                    query = query.eq('target_segment', target_segment)
                }
                if (dateFrom) {
                    query = query.gte('created_at', dateFrom)
                }
                if (dateTo) {
                    query = query.lte('created_at', dateTo)
                }
                if (searchQuery) {
                    query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
                }
            }

            // Aplicar ordenação
            const sortBy = options.sortBy || 'created_at'
            const sortOrder = options.sortOrder || 'desc'
            query = query.order(sortBy, { ascending: sortOrder === 'asc' })

            // Aplicar paginação
            const from = (options.page - 1) * options.limit
            const to = from + options.limit - 1
            query = query.range(from, to)

            const { data, error, count } = await query

            if (error) throw error

            return {
                data: data || [],
                total: count || 0,
                page: options.page,
                totalPages: Math.ceil((count || 0) / options.limit)
            }
        } catch (error) {
            console.error('Erro ao buscar campanhas:', error)
            throw error
        }
    },

    // Buscar campanha por ID com detalhes
    async getCampaignById(id: string): Promise<CampaignWithDetails | null> {
        try {
            const { data, error } = await supabase
                .from('campaigns')
                .select(`
                    *,
                    template:campaign_templates(*)
                `)
                .eq('id', id)
                .single()

            if (error) throw error

            // Buscar métricas de performance
            const performanceMetrics = await this.getCampaignPerformance(id)

            return {
                ...data,
                performance_metrics: performanceMetrics
            }
        } catch (error) {
            console.error('Erro ao buscar campanha:', error)
            return null
        }
    },

    // Criar nova campanha
    async createCampaign(campaign: CampaignInsert): Promise<Campaign> {
        try {
            const { data, error } = await supabase
                .from('campaigns')
                .insert(campaign)
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Erro ao criar campanha:', error)
            throw error
        }
    },

    // Atualizar campanha
    async updateCampaign(id: string, updates: CampaignUpdate): Promise<Campaign> {
        try {
            const { data, error } = await supabase
                .from('campaigns')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Erro ao atualizar campanha:', error)
            throw error
        }
    },

    // Deletar campanha
    async deleteCampaign(id: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('campaigns')
                .delete()
                .eq('id', id)

            if (error) throw error
        } catch (error) {
            console.error('Erro ao deletar campanha:', error)
            throw error
        }
    },

    // Ativar/pausar campanha
    async toggleCampaignStatus(id: string, status: CampaignStatus): Promise<Campaign> {
        try {
            const updateData: CampaignUpdate = { status }

            // Se ativando, definir started_at
            if (status === 'active') {
                updateData.started_at = new Date().toISOString()
            }

            // Se completando, definir completed_at
            if (status === 'completed') {
                updateData.completed_at = new Date().toISOString()
            }

            return await this.updateCampaign(id, updateData)
        } catch (error) {
            console.error('Erro ao alterar status da campanha:', error)
            throw error
        }
    },

    // Duplicar campanha
    async duplicateCampaign(id: string, newName?: string): Promise<Campaign> {
        try {
            const original = await this.getCampaignById(id)
            if (!original) throw new Error('Campanha não encontrada')

            const { id: _, created_at, updated_at, started_at, completed_at, ...campaignData } = original

            const duplicatedCampaign: CampaignInsert = {
                ...campaignData,
                name: newName || `${original.name} (Cópia)`,
                status: 'draft',
                sent_count: 0,
                delivered_count: 0,
                opened_count: 0,
                clicked_count: 0,
                converted_count: 0,
                revenue_generated: 0,
                started_at: null,
                completed_at: null
            }

            return await this.createCampaign(duplicatedCampaign)
        } catch (error) {
            console.error('Erro ao duplicar campanha:', error)
            throw error
        }
    },

    // Buscar campanhas por segmento
    async getCampaignsBySegment(segment: ClientSegment): Promise<Campaign[]> {
        try {
            const { data, error } = await supabase
                .from('campaigns')
                .select('*')
                .eq('target_segment', segment)
                .order('created_at', { ascending: false })

            if (error) throw error
            return data || []
        } catch (error) {
            console.error('Erro ao buscar campanhas por segmento:', error)
            throw error
        }
    },

    // Buscar performance de uma campanha
    async getCampaignPerformance(campaignId: string) {
        try {
            const campaign = await this.getCampaignById(campaignId)
            if (!campaign) return null

            const openRate = campaign.target_count > 0
                ? (campaign.opened_count / campaign.target_count) * 100
                : 0

            const clickRate = campaign.opened_count > 0
                ? (campaign.clicked_count / campaign.opened_count) * 100
                : 0

            const conversionRate = campaign.target_count > 0
                ? (campaign.converted_count / campaign.target_count) * 100
                : 0

            const roi = campaign.cost > 0
                ? campaign.revenue_generated / campaign.cost
                : 0

            return {
                open_rate: Number(openRate.toFixed(2)),
                click_rate: Number(clickRate.toFixed(2)),
                conversion_rate: Number(conversionRate.toFixed(2)),
                roi: Number(roi.toFixed(2))
            }
        } catch (error) {
            console.error('Erro ao calcular performance da campanha:', error)
            return null
        }
    },

    // Relatório geral de performance
    async getPerformanceReport(): Promise<CampaignPerformanceReport> {
        try {
            const { data, error } = await supabase
                .from('campaigns')
                .select('*')

            if (error) throw error

            const campaigns = data || []
            const activeCampaigns = campaigns.filter(c => c.status === 'active')

            const totalSent = campaigns.reduce((sum, c) => sum + c.sent_count, 0)
            const totalOpened = campaigns.reduce((sum, c) => sum + c.opened_count, 0)
            const totalClicked = campaigns.reduce((sum, c) => sum + c.clicked_count, 0)
            const totalConverted = campaigns.reduce((sum, c) => sum + c.converted_count, 0)
            const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue_generated, 0)
            const totalCost = campaigns.reduce((sum, c) => sum + c.cost, 0)

            const avgOpenRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0
            const avgClickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0
            const avgConversionRate = totalSent > 0 ? (totalConverted / totalSent) * 100 : 0
            const avgRoi = totalCost > 0 ? totalRevenue / totalCost : 0

            return {
                total_campaigns: campaigns.length,
                active_campaigns: activeCampaigns.length,
                total_sent: totalSent,
                total_opened: totalOpened,
                total_clicked: totalClicked,
                total_converted: totalConverted,
                total_revenue: totalRevenue,
                total_cost: totalCost,
                avg_open_rate: Number(avgOpenRate.toFixed(2)),
                avg_click_rate: Number(avgClickRate.toFixed(2)),
                avg_conversion_rate: Number(avgConversionRate.toFixed(2)),
                avg_roi: Number(avgRoi.toFixed(2))
            }
        } catch (error) {
            console.error('Erro ao gerar relatório de performance:', error)
            throw error
        }
    }
}

// =================== TEMPLATES ===================

export const campaignTemplatesService = {
    // Buscar templates
    async getTemplates(filters?: TemplateFilters): Promise<CampaignTemplate[]> {
        try {
            let query = supabase
                .from('campaign_templates')
                .select('*')
                .order('created_at', { ascending: false })

            if (filters) {
                if (filters.type) {
                    query = query.eq('type', filters.type)
                }
                if (filters.is_active !== undefined) {
                    query = query.eq('is_active', filters.is_active)
                }
                if (filters.is_default !== undefined) {
                    query = query.eq('is_default', filters.is_default)
                }
            }

            const { data, error } = await query

            if (error) throw error
            return data || []
        } catch (error) {
            console.error('Erro ao buscar templates:', error)
            throw error
        }
    },

    // Buscar template por ID
    async getTemplateById(id: string): Promise<CampaignTemplate | null> {
        try {
            const { data, error } = await supabase
                .from('campaign_templates')
                .select('*')
                .eq('id', id)
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Erro ao buscar template:', error)
            return null
        }
    },

    // Criar template
    async createTemplate(template: CampaignTemplateInsert): Promise<CampaignTemplate> {
        try {
            const { data, error } = await supabase
                .from('campaign_templates')
                .insert(template)
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Erro ao criar template:', error)
            throw error
        }
    },

    // Atualizar template
    async updateTemplate(id: string, updates: CampaignTemplateUpdate): Promise<CampaignTemplate> {
        try {
            const { data, error } = await supabase
                .from('campaign_templates')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Erro ao atualizar template:', error)
            throw error
        }
    },

    // Deletar template
    async deleteTemplate(id: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('campaign_templates')
                .delete()
                .eq('id', id)

            if (error) throw error
        } catch (error) {
            console.error('Erro ao deletar template:', error)
            throw error
        }
    }
}

// =================== TARGETING & SEGMENTAÇÃO ===================

export const campaignTargetingService = {
    // Buscar dados de clientes por segmento para targeting
    async getSegmentTargetingData(segment: ClientSegment): Promise<SegmentTargetingData> {
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('id, name, email, phone')
                .eq('segment', segment)
                .eq('status', 'active')

            if (error) throw error

            return {
                segment,
                client_count: data?.length || 0,
                clients: data || []
            }
        } catch (error) {
            console.error('Erro ao buscar dados de segmentação:', error)
            throw error
        }
    },

    // Buscar clientes para aniversários próximos
    async getBirthdayTargeting(days: number = 30): Promise<SegmentTargetingData> {
        try {
            const today = new Date()
            const endDate = new Date()
            endDate.setDate(today.getDate() + days)

            const { data, error } = await supabase
                .from('clients')
                .select('id, name, email, phone, birthday')
                .not('birthday', 'is', null)
                .eq('status', 'active')

            if (error) throw error

            // Filtrar clientes cujo aniversário está nos próximos X dias
            const birthdayClients = (data || []).filter(client => {
                if (!client.birthday) return false

                const birthday = new Date(client.birthday)
                const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate())

                return thisYearBirthday >= today && thisYearBirthday <= endDate
            })

            return {
                segment: 'birthday' as ClientSegment,
                client_count: birthdayClients.length,
                clients: birthdayClients.map(client => ({
                    id: client.id,
                    name: client.name,
                    email: client.email,
                    phone: client.phone
                }))
            }
        } catch (error) {
            console.error('Erro ao buscar aniversariantes:', error)
            throw error
        }
    },

    // Buscar todos os clientes ativos
    async getAllActiveClients(): Promise<SegmentTargetingData> {
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('id, name, email, phone')
                .eq('status', 'active')

            if (error) throw error

            return {
                segment: 'all_clients' as any,
                client_count: data?.length || 0,
                clients: data || []
            }
        } catch (error) {
            console.error('Erro ao buscar todos os clientes:', error)
            throw error
        }
    }
}