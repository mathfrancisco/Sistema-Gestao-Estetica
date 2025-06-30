// store/useAuthStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/database/supabase/client'
import type { User, Session } from '@supabase/supabase-js'
import type { Database } from '@/lib/database/supabase/types'

type UserProfile = Database['public']['Tables']['users']['Row']
type BusinessProfile = Database['public']['Tables']['business_profile']['Row']

interface AuthState {
    user: User | null
    session: Session | null
    userProfile: UserProfile | null
    businessProfile: BusinessProfile | null
    isLoading: boolean
    isInitialized: boolean
    profilesLoaded: boolean // Novo flag para controlar se os perfis já foram carregados
}

interface AuthActions {
    setUser: (user: User | null) => void
    setSession: (session: Session | null) => void
    setUserProfile: (profile: UserProfile | null) => void
    setBusinessProfile: (profile: BusinessProfile | null) => void
    setLoading: (loading: boolean) => void
    setInitialized: (initialized: boolean) => void
    setProfilesLoaded: (loaded: boolean) => void
    signOut: () => Promise<void>
    initialize: () => Promise<void>
    refreshProfile: () => Promise<void>
    hasGoogleCalendar: () => boolean
    isBusinessSetup: () => boolean
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            // Estado inicial
            user: null,
            session: null,
            userProfile: null,
            businessProfile: null,
            isLoading: true,
            isInitialized: false,
            profilesLoaded: false,

            // Actions
            setUser: (user) => set({ user }),

            setSession: (session) => set({ session }),

            setUserProfile: (userProfile) => set({ userProfile }),

            setBusinessProfile: (businessProfile) => set({ businessProfile }),

            setLoading: (isLoading) => set({ isLoading }),

            setInitialized: (isInitialized) => set({ isInitialized }),

            setProfilesLoaded: (profilesLoaded) => set({ profilesLoaded }),

            signOut: async () => {
                set({ isLoading: true })
                try {
                    await supabase.auth.signOut()
                    set({
                        user: null,
                        session: null,
                        userProfile: null,
                        businessProfile: null,
                        profilesLoaded: false,
                    })
                } catch (error) {
                    console.error('Error signing out:', error)
                } finally {
                    set({ isLoading: false })
                }
            },

            initialize: async () => {
                const { isInitialized } = get()
                if (isInitialized) return // Evitar re-inicialização

                set({ isLoading: true })

                try {
                    // Verificar sessão atual
                    const { data: { session }, error } = await supabase.auth.getSession()

                    if (error) {
                        console.error('Error getting session:', error)
                        return
                    }

                    if (session?.user) {
                        set({
                            user: session.user,
                            session
                        })

                        // Carregar perfis apenas se ainda não foram carregados
                        const { profilesLoaded } = get()
                        if (!profilesLoaded) {
                            await get().refreshProfile()
                        }
                    }
                } catch (error) {
                    console.error('Error initializing auth:', error)
                } finally {
                    set({
                        isLoading: false,
                        isInitialized: true
                    })
                }
            },

            refreshProfile: async () => {
                const { user, profilesLoaded } = get()
                if (!user) return

                // Evitar múltiplas requisições simultâneas
                if (profilesLoaded) return

                try {
                    // Usar Promise.allSettled para não falhar se um perfil não existir
                    const [userProfileResult, businessProfileResult] = await Promise.allSettled([
                        supabase
                            .from('users')
                            .select('*')
                            .eq('id', user.id)
                            .single(),
                        supabase
                            .from('business_profile')
                            .select('*')
                            .eq('user_id', user.id)
                            .single()
                    ])

                    let userProfile = null
                    let businessProfile = null

                    // Processar resultado do user profile
                    if (userProfileResult.status === 'fulfilled' && userProfileResult.value.data) {
                        userProfile = userProfileResult.value.data
                    } else if (userProfileResult.status === 'rejected') {
                        console.warn('User profile not found:', userProfileResult.reason)
                    }

                    // Processar resultado do business profile
                    if (businessProfileResult.status === 'fulfilled' && businessProfileResult.value.data) {
                        businessProfile = businessProfileResult.value.data
                    } else if (businessProfileResult.status === 'rejected') {
                        console.warn('Business profile not found:', businessProfileResult.reason)
                    }

                    set({
                        userProfile,
                        businessProfile,
                        profilesLoaded: true
                    })
                } catch (error) {
                    console.error('Error refreshing profile:', error)
                    // Marcar como carregado mesmo com erro para evitar loops infinitos
                    set({ profilesLoaded: true })
                }
            },

            hasGoogleCalendar: () => {
                const { userProfile } = get()
                return !!(
                    userProfile?.google_access_token &&
                    userProfile?.google_refresh_token &&
                    userProfile?.google_calendar_id
                )
            },

            isBusinessSetup: () => {
                const { businessProfile } = get()
                return !!(businessProfile?.business_name && businessProfile.business_name.trim() !== '')
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                session: state.session,
                userProfile: state.userProfile,
                businessProfile: state.businessProfile,
                profilesLoaded: state.profilesLoaded,
            }),
        }
    )
)