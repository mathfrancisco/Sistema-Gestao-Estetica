// lib/hooks/useCampaigns.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
    campaignsService,
    campaignTemplatesService,
    campaignTargetingService,
    type Campaign,
    type CampaignInsert,
    type CampaignUpdate,
    type CampaignTemplate,
    type CampaignTemplateInsert,
    type CampaignTemplateUpdate,
    type CampaignFilters,
    type CampaignPaginationOptions,
    type TemplateFilters,
    type CampaignPerformanceReport
} from '@/lib/services/campaigns.service'
import type { Database } from '@/lib/database/supabase/types'
import { useCampaignStore } from '@/store/useCampaignStore'

type CampaignStatus = Database['public']['Enums']['campaign_status_enum']
type CampaignType = Database['public']['Enums']['campaign_type_enum']
type ClientSegment = Database['public']['Enums']['client_segment_enum']

// =================== CAMPANHAS ===================

// Hook para buscar campanhas com paginação
export const useCampaigns = (options: CampaignPaginationOptions) => {
    const setCampaigns = useCampaignStore(state => state.setCampaigns)

    return useQuery({
        queryKey: ['campaigns', options],
        queryFn: async () => {
            const result = await campaignsService.getCampaigns(options)
            setCampaigns(result.data)
            return result
        },
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // 5 minutos
    })
}

// Hook para buscar campanha específica por ID
export const useCampaign = (id: string) => {
    const setSelectedCampaign = useCampaignStore(state => state.setSelectedCampaign)

    return useQuery({
        queryKey: ['campaign', id],
        queryFn: async () => {
            const campaign = await campaignsService.getCampaignById(id)
            if (campaign) {
                setSelectedCampaign(campaign)
            }
            return campaign
        },
        enabled: !!id,
        refetchOnWindowFocus: false,
    })
}

// Hook para campanhas ativas
export const useActiveCampaigns = () => {
    return useQuery({
        queryKey: ['campaigns', 'active'],
        queryFn: () => campaignsService.getCampaigns({
            page: 1,
            limit: 100,
            filters: { status: 'active' }
        }),
        refetchOnWindowFocus: false,
        staleTime: 2 * 60 * 1000, // 2 minutos
    })
}

// Hook para campanhas por segmento
export const useCampaignsBySegment = (segment: ClientSegment) => {
    return useQuery({
        queryKey: ['campaigns', 'segment', segment],
        queryFn: () => campaignsService.getCampaignsBySegment(segment),
        enabled: !!segment,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000,
    })
}

// Hook para relatório de performance
export const useCampaignPerformanceReport = () => {
    const setPerformanceMetrics = useCampaignStore(state => state.setPerformanceMetrics)

    return useQuery({
        queryKey: ['campaigns', 'performance-report'],
        queryFn: async () => {
            const report = await campaignsService.getPerformanceReport()

            // Atualizar store com métricas
            setPerformanceMetrics({
                totalCampaigns: report.total_campaigns,
                activeCampaigns: report.active_campaigns,
                totalSent: report.total_sent,
                totalRevenue: report.total_revenue,
                avgOpenRate: report.avg_open_rate,
                avgClickRate: report.avg_click_rate,
                avgConversionRate: report.avg_conversion_rate,
                avgRoi: report.avg_roi,
            })

            return report
        },
        refetchOnWindowFocus: false,
        staleTime: 1 * 60 * 1000, // 1 minuto
    })
}

// Hook para criar campanha
export const useCreateCampaign = () => {
    const queryClient = useQueryClient()
    const { addCampaign, setCreating } = useCampaignStore()

    return useMutation({
        mutationFn: async (campaign: CampaignInsert) => {
            setCreating(true)
            return await campaignsService.createCampaign(campaign)
        },
        onSuccess: (newCampaign) => {
            addCampaign(newCampaign)
            queryClient.invalidateQueries({ queryKey: ['campaigns'] })
            toast.success('Campanha criada com sucesso!')
        },
        onError: (error: any) => {
            console.error('Erro ao criar campanha:', error)
            toast.error('Erro ao criar campanha. Tente novamente.')
        },
        onSettled: () => {
            setCreating(false)
        }
    })
}

// Hook para atualizar campanha
export const useUpdateCampaign = () => {
    const queryClient = useQueryClient()
    const updateCampaign = useCampaignStore(state => state.updateCampaign)

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: CampaignUpdate }) => {
            return await campaignsService.updateCampaign(id, updates)
        },
        onSuccess: (updatedCampaign) => {
            updateCampaign(updatedCampaign.id, updatedCampaign)
            queryClient.invalidateQueries({ queryKey: ['campaigns'] })
            queryClient.invalidateQueries({ queryKey: ['campaign', updatedCampaign.id] })
            toast.success('Campanha atualizada com sucesso!')
        },
        onError: (error: any) => {
            console.error('Erro ao atualizar campanha:', error)
            toast.error('Erro ao atualizar campanha. Tente novamente.')
        }
    })
}

// Hook para deletar campanha
export const useDeleteCampaign = () => {
    const queryClient = useQueryClient()
    const removeCampaign = useCampaignStore(state => state.removeCampaign)

    return useMutation({
        mutationFn: async (id: string) => {
            return await campaignsService.deleteCampaign(id)
        },
        onSuccess: (_, deletedId) => {
            removeCampaign(deletedId)
            queryClient.invalidateQueries({ queryKey: ['campaigns'] })
            toast.success('Campanha excluída com sucesso!')
        },
        onError: (error: any) => {
            console.error('Erro ao deletar campanha:', error)
            toast.error('Erro ao excluir campanha. Tente novamente.')
        }
    })
}

// Hook para alterar status da campanha
export const useToggleCampaignStatus = () => {
    const queryClient = useQueryClient()
    const updateCampaign = useCampaignStore(state => state.updateCampaign)
    const setSending = useCampaignStore(state => state.setSending)

    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: CampaignStatus }) => {
            setSending(true)
            return await campaignsService.toggleCampaignStatus(id, status)
        },
        onSuccess: (updatedCampaign) => {
            updateCampaign(updatedCampaign.id, updatedCampaign)
            queryClient.invalidateQueries({ queryKey: ['campaigns'] })

            const statusMessages = {
                'active': 'Campanha ativada com sucesso!',
                'paused': 'Campanha pausada com sucesso!',
                'completed': 'Campanha finalizada com sucesso!',
                'cancelled': 'Campanha cancelada com sucesso!',
                'draft': 'Campanha salva como rascunho!'
            }

            toast.success(statusMessages[updatedCampaign.status] || 'Status atualizado!')
        },
        onError: (error: any) => {
            console.error('Erro ao alterar status:', error)
            toast.error('Erro ao alterar status da campanha.')
        },
        onSettled: () => {
            setSending(false)
        }
    })
}

// Hook para duplicar campanha
export const useDuplicateCampaign = () => {
    const queryClient = useQueryClient()
    const addCampaign = useCampaignStore(state => state.addCampaign)

    return useMutation({
        mutationFn: async ({ id, newName }: { id: string; newName?: string }) => {
            return await campaignsService.duplicateCampaign(id, newName)
        },
        onSuccess: (duplicatedCampaign) => {
            addCampaign(duplicatedCampaign)
            queryClient.invalidateQueries({ queryKey: ['campaigns'] })
            toast.success('Campanha duplicada com sucesso!')
        },
        onError: (error: any) => {
            console.error('Erro ao duplicar campanha:', error)
            toast.error('Erro ao duplicar campanha.')
        }
    })
}

// =================== TEMPLATES ===================

// Hook para buscar templates
export const useCampaignTemplates = (filters?: TemplateFilters) => {
    const setTemplates = useCampaignStore(state => state.setTemplates)

    return useQuery({
        queryKey: ['campaign-templates', filters],
        queryFn: async () => {
            const templates = await campaignTemplatesService.getTemplates(filters)
            setTemplates(templates)
            return templates
        },
        refetchOnWindowFocus: false,
        staleTime: 10 * 60 * 1000, // 10 minutos
    })
}

// Hook para buscar templates por tipo
export const useCampaignTemplatesByType = (type: CampaignType) => {
    return useQuery({
        queryKey: ['campaign-templates', 'type', type],
        queryFn: () => campaignTemplatesService.getTemplates({ type, is_active: true }),
        enabled: !!type,
        refetchOnWindowFocus: false,
        staleTime: 10 * 60 * 1000,
    })
}

// Hook para buscar template específico
export const useCampaignTemplate = (id: string) => {
    const setSelectedTemplate = useCampaignStore(state => state.setSelectedTemplate)

    return useQuery({
        queryKey: ['campaign-template', id],
        queryFn: async () => {
            const template = await campaignTemplatesService.getTemplateById(id)
            if (template) {
                setSelectedTemplate(template)
            }
            return template
        },
        enabled: !!id,
        refetchOnWindowFocus: false,
    })
}

// Hook para criar template
export const useCreateCampaignTemplate = () => {
    const queryClient = useQueryClient()
    const addTemplate = useCampaignStore(state => state.addTemplate)

    return useMutation({
        mutationFn: async (template: CampaignTemplateInsert) => {
            return await campaignTemplatesService.createTemplate(template)
        },
        onSuccess: (newTemplate) => {
            addTemplate(newTemplate)
            queryClient.invalidateQueries({ queryKey: ['campaign-templates'] })
            toast.success('Template criado com sucesso!')
        },
        onError: (error: any) => {
            console.error('Erro ao criar template:', error)
            toast.error('Erro ao criar template.')
        }
    })
}

// Hook para atualizar template
export const useUpdateCampaignTemplate = () => {
    const queryClient = useQueryClient()
    const updateTemplate = useCampaignStore(state => state.updateTemplate)

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: CampaignTemplateUpdate }) => {
            return await campaignTemplatesService.updateTemplate(id, updates)
        },
        onSuccess: (updatedTemplate) => {
            updateTemplate(updatedTemplate.id, updatedTemplate)
            queryClient.invalidateQueries({ queryKey: ['campaign-templates'] })
            toast.success('Template atualizado com sucesso!')
        },
        onError: (error: any) => {
            console.error('Erro ao atualizar template:', error)
            toast.error('Erro ao atualizar template.')
        }
    })
}

// Hook para deletar template
export const useDeleteCampaignTemplate = () => {
    const queryClient = useQueryClient()
    const removeTemplate = useCampaignStore(state => state.removeTemplate)

    return useMutation({
        mutationFn: async (id: string) => {
            return await campaignTemplatesService.deleteTemplate(id)
        },
        onSuccess: (_, deletedId) => {
            removeTemplate(deletedId)
            queryClient.invalidateQueries({ queryKey: ['campaign-templates'] })
            toast.success('Template excluído com sucesso!')
        },
        onError: (error: any) => {
            console.error('Erro ao deletar template:', error)
            toast.error('Erro ao excluir template.')
        }
    })
}

// =================== TARGETING & SEGMENTAÇÃO ===================

// Hook para dados de segmentação
export const useSegmentTargeting = (segment: ClientSegment) => {
    return useQuery({
        queryKey: ['segment-targeting', segment],
        queryFn: () => campaignTargetingService.getSegmentTargetingData(segment),
        enabled: !!segment,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000,
    })
}

// Hook para aniversariantes
export const useBirthdayTargeting = (days: number = 30) => {
    return useQuery({
        queryKey: ['birthday-targeting', days],
        queryFn: () => campaignTargetingService.getBirthdayTargeting(days),
        refetchOnWindowFocus: false,
        staleTime: 1 * 60 * 60 * 1000, // 1 hora
    })
}

// Hook para todos os clientes ativos
export const useAllActiveClients = () => {
    return useQuery({
        queryKey: ['all-active-clients'],
        queryFn: () => campaignTargetingService.getAllActiveClients(),
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000,
    })
}

// =================== HOOKS AGREGADOS ===================

// Hook principal para página de campanhas
export const useCampaignsPage = (options: CampaignPaginationOptions) => {
    const campaignsQuery = useCampaigns(options)
    const performanceQuery = useCampaignPerformanceReport()
    const templatesQuery = useCampaignTemplates({ is_active: true })

    return {
        campaigns: campaignsQuery,
        performance: performanceQuery,
        templates: templatesQuery,
        isLoading: campaignsQuery.isLoading || performanceQuery.isLoading,
        error: campaignsQuery.error || performanceQuery.error
    }
}

// Hook para estatísticas rápidas do dashboard
export const useCampaignStats = () => {
    const activeCampaigns = useActiveCampaigns()
    const performance = useCampaignPerformanceReport()

    return {
        activeCampaignsCount: activeCampaigns.data?.data.length || 0,
        totalRevenue: performance.data?.total_revenue || 0,
        avgOpenRate: performance.data?.avg_open_rate || 0,
        avgConversionRate: performance.data?.avg_conversion_rate || 0,
        isLoading: activeCampaigns.isLoading || performance.isLoading,
    }
}

// Hook para dados de segmentação múltipla
export const useAllSegmentData = () => {
    const vipData = useSegmentTargeting('vip')
    const atRiskData = useSegmentTargeting('at_risk')
    const newData = useSegmentTargeting('new')
    const birthdayData = useBirthdayTargeting(30)

    return {
        vip: vipData.data,
        atRisk: atRiskData.data,
        new: newData.data,
        birthday: birthdayData.data,
        isLoading: vipData.isLoading || atRiskData.isLoading || newData.isLoading || birthdayData.isLoading,
        error: vipData.error || atRiskData.error || newData.error || birthdayData.error
    }
}