// hooks/useClients.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useClientStore } from '@/store/useClientStore'
import type { Database } from '@/lib/database/supabase/types'
import { toast } from 'sonner'
import {ClientFilters, ClientService, ClientsPaginationOptions} from "@/lib/services/client.service";

type Client = Database['public']['Tables']['clients']['Row']
type ClientInsert = Database['public']['Tables']['clients']['Insert']
type ClientUpdate = Database['public']['Tables']['clients']['Update']
type ClientSegment = Database['public']['Enums']['client_segment_enum']

// Hook para listar clientes com paginação
export function useClients(options: ClientsPaginationOptions) {
    const setClients = useClientStore(state => state.setClients)
    const setLoading = useClientStore(state => state.setLoading)
    const setPagination = useClientStore(state => state.setPagination)

    return useQuery({
        queryKey: ['clients', options],
        queryFn: async () => {
            setLoading(true)
            try {
                const response = await ClientService.getClients(options)
                setClients(response.data)
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

// Hook para buscar cliente específico
export function useClient(id: string) {
    const setSelectedClient = useClientStore(state => state.setSelectedClient)

    return useQuery({
        queryKey: ['client', id],
        queryFn: async () => {
            const client = await ClientService.getClientById(id)
            setSelectedClient(client)
            return client
        },
        enabled: !!id,
    })
}

// Hook para criar cliente
export function useCreateClient() {
    const queryClient = useQueryClient()
    const addClient = useClientStore(state => state.addClient)

    return useMutation({
        mutationFn: (clientData: ClientInsert) => ClientService.createClient(clientData),
        onSuccess: (newClient) => {
            addClient(newClient)
            queryClient.invalidateQueries({ queryKey: ['clients'] })
            queryClient.invalidateQueries({ queryKey: ['client-stats'] })
            toast.success('Cliente criado com sucesso!')
        },
        onError: (error: Error) => {
            toast.error(`Erro ao criar cliente: ${error.message}`)
        }
    })
}

// Hook para atualizar cliente
export function useUpdateClient() {
    const queryClient = useQueryClient()
    const updateClient = useClientStore(state => state.updateClient)

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: ClientUpdate }) =>
            ClientService.updateClient(id, data),
        onSuccess: (updatedClient) => {
            updateClient(updatedClient.id, updatedClient)
            queryClient.invalidateQueries({ queryKey: ['clients'] })
            queryClient.invalidateQueries({ queryKey: ['client', updatedClient.id] })
            queryClient.invalidateQueries({ queryKey: ['client-stats'] })
            toast.success('Cliente atualizado com sucesso!')
        },
        onError: (error: Error) => {
            toast.error(`Erro ao atualizar cliente: ${error.message}`)
        }
    })
}

// Hook para deletar cliente
export function useDeleteClient() {
    const queryClient = useQueryClient()
    const removeClient = useClientStore(state => state.removeClient)

    return useMutation({
        mutationFn: (id: string) => ClientService.deleteClient(id),
        onSuccess: (_, id) => {
            removeClient(id)
            queryClient.invalidateQueries({ queryKey: ['clients'] })
            queryClient.invalidateQueries({ queryKey: ['client-stats'] })
            toast.success('Cliente deletado com sucesso!')
        },
        onError: (error: Error) => {
            toast.error(`Erro ao deletar cliente: ${error.message}`)
        }
    })
}

// Hook para buscar clientes por segmento
export function useClientsBySegment(segment: ClientSegment) {
    return useQuery({
        queryKey: ['clients-by-segment', segment],
        queryFn: () => ClientService.getClientsBySegment(segment),
        staleTime: 10 * 60 * 1000, // 10 minutos
    })
}

// Hook para estatísticas de clientes
export function useClientStats(userId?: string) {
    return useQuery({
        queryKey: ['client-stats', userId],
        queryFn: () => ClientService.getClientStats(userId),
        staleTime: 15 * 60 * 1000, // 15 minutos
    })
}

// Hook para pesquisar clientes
export function useSearchClients(query: string, limit?: number) {
    return useQuery({
        queryKey: ['search-clients', query, limit],
        queryFn: () => ClientService.searchClients(query, limit),
        enabled: query.length >= 2,
        staleTime: 2 * 60 * 1000, // 2 minutos
    })
}

// Hook para histórico do cliente
export function useClientHistory(clientId: string) {
    return useQuery({
        queryKey: ['client-history', clientId],
        queryFn: () => ClientService.getClientHistory(clientId),
        enabled: !!clientId,
        staleTime: 5 * 60 * 1000, // 5 minutos
    })
}

// Hook para atualizar segmento de clientes em massa
export function useBulkUpdateClientSegments() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (updates: { id: string; segment: ClientSegment }[]) =>
            ClientService.bulkUpdateClientSegments(updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] })
            queryClient.invalidateQueries({ queryKey: ['client-stats'] })
            toast.success('Segmentos atualizados com sucesso!')
        },
        onError: (error: Error) => {
            toast.error(`Erro ao atualizar segmentos: ${error.message}`)
        }
    })
}

// Hook para aniversariantes próximos
export function useUpcomingBirthdays(days: number = 30) {
    return useQuery({
        queryKey: ['upcoming-birthdays', days],
        queryFn: () => ClientService.getUpcomingBirthdays(days),
        staleTime: 60 * 60 * 1000, // 1 hora
    })
}

// Hook personalizado para gerenciar filtros
export function useClientFilters() {
    const filters = useClientStore(state => state.filters)
    const searchQuery = useClientStore(state => state.searchQuery)
    const setFilters = useClientStore(state => state.setFilters)
    const setSearchQuery = useClientStore(state => state.setSearchQuery)
    const clearFilters = useClientStore(state => state.clearFilters)

    const updateFilters = (newFilters: Partial<ClientFilters>) => {
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

// Hook para paginação de clientes
export function useClientsPagination() {
    const pagination = useClientStore(state => state.pagination)
    const setPagination = useClientStore(state => state.setPagination)

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