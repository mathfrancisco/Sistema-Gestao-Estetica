import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Database } from '@/lib/database/supabase/types'

type Campaign = Database['public']['Tables']['campaigns']['Row']
type CampaignInsert = Database['public']['Tables']['campaigns']['Insert']
type CampaignUpdate = Database['public']['Tables']['campaigns']['Update']
type CampaignTemplate = Database['public']['Tables']['campaign_templates']['Row']
type CampaignRecipient = Database['public']['Tables']['campaign_recipients']['Row']

// Tipos estendidos para campanhas com dados calculados
export interface CampaignWithStats extends Campaign {
    open_rate: number
    click_rate: number
    conversion_rate: number
    roi: number
}

export interface CampaignWithTemplate extends Campaign {
    template?: CampaignTemplate
}

export interface CampaignPerformanceMetrics {
    totalCampaigns: number
    activeCampaigns: number
    totalSent: number
    totalRevenue: number
    avgOpenRate: number
    avgClickRate: number
    avgConversionRate: number
    avgRoi: number
}

interface CampaignState {
    // Dados principais
    campaigns: Campaign[]
    templates: CampaignTemplate[]
    selectedCampaign: Campaign | null
    selectedTemplate: CampaignTemplate | null

    // Estados de carregamento
    isLoading: boolean
    isCreating: boolean
    isSending: boolean

    // Filtros e busca
    searchQuery: string
    filters: {
        status?: Database['public']['Enums']['campaign_status_enum']
        type?: Database['public']['Enums']['campaign_type_enum']
        target_segment?: Database['public']['Enums']['client_segment_enum']
        dateFrom?: string
        dateTo?: string
    }

    // Paginação
    pagination: {
        page: number
        limit: number
        total: number
    }

    // Métricas em tempo real
    performanceMetrics: CampaignPerformanceMetrics | null
}

interface CampaignActions {
    // Actions para campanhas
    setCampaigns: (campaigns: Campaign[]) => void
    addCampaign: (campaign: Campaign) => void
    updateCampaign: (id: string, campaign: Partial<Campaign>) => void
    removeCampaign: (id: string) => void
    setSelectedCampaign: (campaign: Campaign | null) => void

    // Actions para templates
    setTemplates: (templates: CampaignTemplate[]) => void
    addTemplate: (template: CampaignTemplate) => void
    updateTemplate: (id: string, template: Partial<CampaignTemplate>) => void
    removeTemplate: (id: string) => void
    setSelectedTemplate: (template: CampaignTemplate | null) => void

    // Estados de carregamento
    setLoading: (loading: boolean) => void
    setCreating: (creating: boolean) => void
    setSending: (sending: boolean) => void

    // Filtros e busca
    setSearchQuery: (query: string) => void
    setFilters: (filters: Partial<CampaignState['filters']>) => void
    setPagination: (pagination: Partial<CampaignState['pagination']>) => void
    clearFilters: () => void

    // Métricas
    setPerformanceMetrics: (metrics: CampaignPerformanceMetrics) => void

    // Getters úteis
    getCampaignById: (id: string) => Campaign | undefined
    getTemplateById: (id: string) => CampaignTemplate | undefined
    getActiveCampaigns: () => Campaign[]
    getDraftCampaigns: () => Campaign[]
    getCampaignsByType: (type: Database['public']['Enums']['campaign_type_enum']) => Campaign[]
    getCampaignsBySegment: (segment: Database['public']['Enums']['client_segment_enum']) => Campaign[]
    getTemplatesByType: (type: Database['public']['Enums']['campaign_type_enum']) => CampaignTemplate[]

    // Funções de análise
    calculateCampaignMetrics: () => CampaignPerformanceMetrics
    getCampaignStats: (campaignId: string) => {
        openRate: number
        clickRate: number
        conversionRate: number
        roi: number
    } | null
}

type CampaignStore = CampaignState & CampaignActions

export const useCampaignStore = create<CampaignStore>()(
    persist(
        (set, get) => ({
            // Estado inicial
            campaigns: [],
            templates: [],
            selectedCampaign: null,
            selectedTemplate: null,
            isLoading: false,
            isCreating: false,
            isSending: false,
            searchQuery: '',
            filters: {},
            pagination: {
                page: 1,
                limit: 20,
                total: 0,
            },
            performanceMetrics: null,

            // Actions para campanhas
            setCampaigns: (campaigns) => set({ campaigns }),

            addCampaign: (campaign) => set((state) => ({
                campaigns: [campaign, ...state.campaigns],
            })),

            updateCampaign: (id, updatedCampaign) => set((state) => ({
                campaigns: state.campaigns.map(campaign =>
                    campaign.id === id ? { ...campaign, ...updatedCampaign } : campaign
                ),
                selectedCampaign: state.selectedCampaign?.id === id
                    ? { ...state.selectedCampaign, ...updatedCampaign }
                    : state.selectedCampaign,
            })),

            removeCampaign: (id) => set((state) => ({
                campaigns: state.campaigns.filter(campaign => campaign.id !== id),
                selectedCampaign: state.selectedCampaign?.id === id ? null : state.selectedCampaign,
            })),

            setSelectedCampaign: (campaign) => set({ selectedCampaign: campaign }),

            // Actions para templates
            setTemplates: (templates) => set({ templates }),

            addTemplate: (template) => set((state) => ({
                templates: [template, ...state.templates],
            })),

            updateTemplate: (id, updatedTemplate) => set((state) => ({
                templates: state.templates.map(template =>
                    template.id === id ? { ...template, ...updatedTemplate } : template
                ),
                selectedTemplate: state.selectedTemplate?.id === id
                    ? { ...state.selectedTemplate, ...updatedTemplate }
                    : state.selectedTemplate,
            })),

            removeTemplate: (id) => set((state) => ({
                templates: state.templates.filter(template => template.id !== id),
                selectedTemplate: state.selectedTemplate?.id === id ? null : state.selectedTemplate,
            })),

            setSelectedTemplate: (template) => set({ selectedTemplate: template }),

            // Estados de carregamento
            setLoading: (isLoading) => set({ isLoading }),
            setCreating: (isCreating) => set({ isCreating }),
            setSending: (isSending) => set({ isSending }),

            // Filtros e busca
            setSearchQuery: (searchQuery) => set({ searchQuery }),

            setFilters: (filters) => set((state) => ({
                filters: { ...state.filters, ...filters },
            })),

            setPagination: (pagination) => set((state) => ({
                pagination: { ...state.pagination, ...pagination },
            })),

            clearFilters: () => set({
                filters: {},
                searchQuery: '',
            }),

            // Métricas
            setPerformanceMetrics: (performanceMetrics) => set({ performanceMetrics }),

            // Getters
            getCampaignById: (id) => {
                return get().campaigns.find(campaign => campaign.id === id)
            },

            getTemplateById: (id) => {
                return get().templates.find(template => template.id === id)
            },

            getActiveCampaigns: () => {
                return get().campaigns.filter(campaign => campaign.status === 'active')
            },

            getDraftCampaigns: () => {
                return get().campaigns.filter(campaign => campaign.status === 'draft')
            },

            getCampaignsByType: (type) => {
                return get().campaigns.filter(campaign => campaign.type === type)
            },

            getCampaignsBySegment: (segment) => {
                return get().campaigns.filter(campaign => campaign.target_segment === segment)
            },

            getTemplatesByType: (type) => {
                return get().templates.filter(template => template.type === type)
            },

            // Funções de análise
            calculateCampaignMetrics: () => {
                const campaigns = get().campaigns
                const activeCampaigns = campaigns.filter(c => c.status === 'active')

                const totalSent = campaigns.reduce((sum, c) => sum + c.sent_count, 0)
                const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue_generated, 0)
                const totalOpened = campaigns.reduce((sum, c) => sum + c.opened_count, 0)
                const totalClicked = campaigns.reduce((sum, c) => sum + c.clicked_count, 0)
                const totalConverted = campaigns.reduce((sum, c) => sum + c.converted_count, 0)
                const totalCost = campaigns.reduce((sum, c) => sum + c.cost, 0)

                const avgOpenRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0
                const avgClickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0
                const avgConversionRate = totalSent > 0 ? (totalConverted / totalSent) * 100 : 0
                const avgRoi = totalCost > 0 ? totalRevenue / totalCost : 0

                return {
                    totalCampaigns: campaigns.length,
                    activeCampaigns: activeCampaigns.length,
                    totalSent,
                    totalRevenue,
                    avgOpenRate,
                    avgClickRate,
                    avgConversionRate,
                    avgRoi,
                }
            },

            getCampaignStats: (campaignId) => {
                const campaign = get().getCampaignById(campaignId)
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
                    openRate,
                    clickRate,
                    conversionRate,
                    roi,
                }
            },
        }),
        {
            name: 'campaign-storage',
            partialize: (state) => ({
                selectedCampaign: state.selectedCampaign,
                selectedTemplate: state.selectedTemplate,
                filters: state.filters,
                pagination: state.pagination,
            }),
        }
    )
)

// Hook personalizado para métricas em tempo real
export const useCampaignMetrics = () => {
    const { campaigns, calculateCampaignMetrics, setPerformanceMetrics } = useCampaignStore()

    const updateMetrics = () => {
        const metrics = calculateCampaignMetrics()
        setPerformanceMetrics(metrics)
        return metrics
    }

    return {
        metrics: useCampaignStore(state => state.performanceMetrics),
        updateMetrics,
        refreshMetrics: updateMetrics,
    }
}

// Hook para estatísticas de uma campanha específica
export const useCampaignStats = (campaignId: string) => {
    const getCampaignStats = useCampaignStore(state => state.getCampaignStats)
    return getCampaignStats(campaignId)
}