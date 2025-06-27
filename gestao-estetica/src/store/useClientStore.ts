import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Database } from '@/lib/database/supabase/types'

type Client = Database['public']['Tables']['clients']['Row']
type ClientInsert = Database['public']['Tables']['clients']['Insert']
type ClientUpdate = Database['public']['Tables']['clients']['Update']

interface ClientState {
    clients: Client[]
    selectedClient: Client | null
    isLoading: boolean
    searchQuery: string
    filters: {
        status?: Database['public']['Enums']['client_status_enum']
        segment?: Database['public']['Enums']['client_segment_enum']
    }
    pagination: {
        page: number
        limit: number
        total: number
    }
}

interface ClientActions {
    setClients: (clients: Client[]) => void
    addClient: (client: Client) => void
    updateClient: (id: string, client: Partial<Client>) => void
    removeClient: (id: string) => void
    setSelectedClient: (client: Client | null) => void
    setLoading: (loading: boolean) => void
    setSearchQuery: (query: string) => void
    setFilters: (filters: Partial<ClientState['filters']>) => void
    setPagination: (pagination: Partial<ClientState['pagination']>) => void
    clearFilters: () => void
    getClientById: (id: string) => Client | undefined
    getVipClients: () => Client[]
    getAtRiskClients: () => Client[]
    getNewClients: () => Client[]
}

type ClientStore = ClientState & ClientActions

export const useClientStore = create<ClientStore>()(
    persist(
        (set, get) => ({
            // Estado inicial
            clients: [],
            selectedClient: null,
            isLoading: false,
            searchQuery: '',
            filters: {},
            pagination: {
                page: 1,
                limit: 20,
                total: 0,
            },

            // Actions
            setClients: (clients) => set({ clients }),

            addClient: (client) => set((state) => ({
                clients: [client, ...state.clients],
            })),

            updateClient: (id, updatedClient) => set((state) => ({
                clients: state.clients.map(client =>
                    client.id === id ? { ...client, ...updatedClient } : client
                ),
                selectedClient: state.selectedClient?.id === id
                    ? { ...state.selectedClient, ...updatedClient }
                    : state.selectedClient,
            })),

            removeClient: (id) => set((state) => ({
                clients: state.clients.filter(client => client.id !== id),
                selectedClient: state.selectedClient?.id === id ? null : state.selectedClient,
            })),

            setSelectedClient: (client) => set({ selectedClient: client }),

            setLoading: (isLoading) => set({ isLoading }),

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

            getClientById: (id) => {
                return get().clients.find(client => client.id === id)
            },

            getVipClients: () => {
                return get().clients.filter(client => client.segment === 'vip')
            },

            getAtRiskClients: () => {
                return get().clients.filter(client => client.segment === 'at_risk')
            },

            getNewClients: () => {
                return get().clients.filter(client => client.segment === 'new')
            },
        }),
        {
            name: 'client-storage',
            partialize: (state) => ({
                selectedClient: state.selectedClient,
                filters: state.filters,
                pagination: state.pagination,
            }),
        }
    )
)