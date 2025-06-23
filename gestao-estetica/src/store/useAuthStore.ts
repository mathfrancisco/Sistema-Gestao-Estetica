// store/useAuthStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type UserProfile = Database['public']['Tables']['users']['Row']
type BusinessProfile = Database['public']['Tables']['business_profile']['Row']

interface AuthState {
    user: User | null
    session: Session | null
    userProfile: UserProfile | null
    businessProfile: BusinessProfile | null
    isLoading: boolean
    isInitialized: boolean
}

interface AuthActions {
    setUser: (user: User | null) => void
    setSession: (session: Session | null) => void
    setUserProfile: (profile: UserProfile | null) => void
    setBusinessProfile: (profile: BusinessProfile | null) => void
    setLoading: (loading: boolean) => void
    setInitialized: (initialized: boolean) => void
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

            // Actions
            setUser: (user) => set({ user }),

            setSession: (session) => set({ session }),

            setUserProfile: (userProfile) => set({ userProfile }),

            setBusinessProfile: (businessProfile) => set({ businessProfile }),

            setLoading: (isLoading) => set({ isLoading }),

            setInitialized: (isInitialized) => set({ isInitialized }),

            signOut: async () => {
                set({ isLoading: true })
                try {
                    await supabase.auth.signOut()
                    set({
                        user: null,
                        session: null,
                        userProfile: null,
                        businessProfile: null,
                    })
                } catch (error) {
                    console.error('Error signing out:', error)
                } finally {
                    set({ isLoading: false })
                }
            },

            initialize: async () => {
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

                        // Carregar perfis
                        await get().refreshProfile()
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
                const { user } = get()
                if (!user) return

                try {
                    // Carregar perfil do usuário
                    const { data: userProfile } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', user.id)
                        .single()

                    // Carregar perfil do negócio
                    const { data: businessProfile } = await supabase
                        .from('business_profile')
                        .select('*')
                        .eq('user_id', user.id)
                        .single()

                    set({
                        userProfile,
                        businessProfile
                    })
                } catch (error) {
                    console.error('Error refreshing profile:', error)
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
                return !!(businessProfile?.business_name)
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                session: state.session,
                userProfile: state.userProfile,
                businessProfile: state.businessProfile,
            }),
        }
    )
)