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
    reset: () => void
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
            setUser: (user) => {
                console.log('👤 Setting user:', user?.email || 'null')
                set({ user })
            },

            setSession: (session) => {
                console.log('🔑 Setting session:', !!session)
                set({ session })
            },

            setUserProfile: (userProfile) => {
                console.log('👤 Setting user profile:', {
                    email: userProfile?.email,
                    hasGoogleTokens: !!(userProfile?.google_access_token && userProfile?.google_refresh_token),
                    hasCalendarId: !!userProfile?.google_calendar_id
                })
                set({ userProfile })
            },

            setBusinessProfile: (businessProfile) => {
                console.log('🏢 Setting business profile:', {
                    businessName: businessProfile?.business_name,
                    hasGoogleSettings: !!businessProfile?.google_calendar_settings
                })
                set({ businessProfile })
            },

            setLoading: (isLoading) => set({ isLoading }),

            setInitialized: (isInitialized) => {
                console.log('🚀 Auth store initialized:', isInitialized)
                set({ isInitialized })
            },

            // ✅ CORRIGIDO: Enhanced hasGoogleCalendar function
            hasGoogleCalendar: () => {
                const { userProfile } = get()

                if (!userProfile) {
                    console.log('🔍 hasGoogleCalendar: No user profile')
                    return false
                }

                const hasTokens = !!(userProfile.google_access_token && userProfile.google_refresh_token)
                const hasCalendarId = !!userProfile.google_calendar_id

                const result = hasTokens && hasCalendarId

                console.log('🔍 hasGoogleCalendar check:', {
                    hasTokens,
                    hasCalendarId,
                    result,
                    email: userProfile.email
                })

                return result
            },

            isBusinessSetup: () => {
                const { businessProfile } = get()
                return !!(businessProfile?.business_name)
            },

            // ✅ CORRIGIDO: Enhanced sign out
            signOut: async () => {
                try {
                    console.log('🚪 Signing out...')
                    set({ isLoading: true })

                    const { error } = await supabase.auth.signOut()
                    if (error) throw error

                    // Clear all state
                    get().reset()

                    console.log('✅ Signed out successfully')
                } catch (error) {
                    console.error('❌ Error signing out:', error)
                    set({ isLoading: false })
                    throw error
                }
            },

            // ✅ CORRIGIDO: Enhanced initialization
            initialize: async () => {
                try {
                    console.log('🚀 Initializing auth store...')
                    set({ isLoading: true })

                    // Get current session
                    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

                    if (sessionError) {
                        console.error('❌ Session error:', sessionError)
                        throw sessionError
                    }

                    if (session) {
                        console.log('✅ Active session found:', session.user.email)
                        set({
                            session,
                            user: session.user
                        })

                        // Load user profile
                        await get().refreshProfile()
                    } else {
                        console.log('ℹ️ No active session')
                        set({
                            user: null,
                            session: null,
                            userProfile: null,
                            businessProfile: null
                        })
                    }

                    set({
                        isLoading: false,
                        isInitialized: true
                    })

                    console.log('✅ Auth store initialized successfully')
                } catch (error) {
                    console.error('❌ Error initializing auth store:', error)
                    set({
                        isLoading: false,
                        isInitialized: true
                    })
                }
            },

            // ✅ CORRIGIDO: Enhanced refresh profile
            refreshProfile: async () => {
                try {
                    const { user } = get()

                    if (!user) {
                        console.log('⚠️ No user to refresh profile for')
                        set({
                            userProfile: null,
                            businessProfile: null
                        })
                        return
                    }

                    console.log('🔄 Refreshing profile for:', user.email)

                    // ✅ Load user profile with Google Calendar data
                    console.log('👤 Loading user profile...')
                    const { data: userProfile, error: userError } = await supabase
                        .from('users')
                        .select(`
                            id,
                            email,
                            full_name,
                            avatar_url,
                            google_access_token,
                            google_refresh_token,
                            google_calendar_id,
                            created_at,
                            updated_at
                        `)
                        .eq('id', user.id)
                        .single()

                    if (userError) {
                        console.error('❌ Error loading user profile:', userError)

                        // If user doesn't exist in our users table, create it
                        if (userError.code === 'PGRST116') {
                            console.log('👤 Creating user profile...')
                            const { data: newUserProfile, error: createError } = await supabase
                                .from('users')
                                .insert({
                                    id: user.id,
                                    email: user.email!,
                                    full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
                                    avatar_url: user.user_metadata?.avatar_url || null
                                })
                                .select()
                                .single()

                            if (createError) {
                                console.error('❌ Error creating user profile:', createError)
                            } else {
                                console.log('✅ User profile created')
                                set({ userProfile: newUserProfile })
                            }
                        }
                    } else {
                        console.log('✅ User profile loaded:', {
                            email: userProfile.email,
                            hasGoogleTokens: !!(userProfile.google_access_token && userProfile.google_refresh_token),
                            hasCalendarId: !!userProfile.google_calendar_id
                        })
                        set({ userProfile })
                    }

                    // ✅ Load business profile
                    console.log('🏢 Loading business profile...')
                    const { data: businessProfile, error: businessError } = await supabase
                        .from('business_profile')
                        .select(`
                            id,
                            user_id,
                            business_name,
                            cnpj,
                            phone,
                            address,
                            business_hours,
                            google_calendar_settings,
                            settings,
                            created_at
                        `)
                        .eq('user_id', user.id)
                        .single()

                    if (businessError) {
                        if (businessError.code === 'PGRST116') {
                            console.log('ℹ️ No business profile found')
                            set({ businessProfile: null })
                        } else {
                            console.error('❌ Error loading business profile:', businessError)
                        }
                    } else {
                        console.log('✅ Business profile loaded:', {
                            businessName: businessProfile.business_name,
                            hasGoogleSettings: !!businessProfile.google_calendar_settings
                        })
                        set({ businessProfile })
                    }

                    console.log('✅ Profile refresh completed')
                } catch (error) {
                    console.error('❌ Error refreshing profile:', error)
                }
            },

            // ✅ NOVO: Reset function for clean state
            reset: () => {
                set({
                    user: null,
                    session: null,
                    userProfile: null,
                    businessProfile: null,
                    isLoading: false,
                    isInitialized: true
                })
            }
        }),
        {
            name: 'auth-store',
            // ✅ CORRIGIDO: Não persistir dados sensíveis
            partialize: (state) => ({
                isInitialized: state.isInitialized,
                // Persistir apenas o que é necessário para UX, não dados sensíveis
            }),
            // ✅ NOVO: Configurações de persistência mais robustas
            version: 1,
            migrate: (persistedState: any, version: number) => {
                // Handle migration if needed
                return persistedState
            },
            onRehydrateStorage: () => {
                console.log('🔄 Rehydrating auth store...')
                return (state, error) => {
                    if (error) {
                        console.error('❌ Error rehydrating auth store:', error)
                    } else {
                        console.log('✅ Auth store rehydrated')
                        // Trigger initialization after rehydration
                        if (state) {
                            state.initialize()
                        }
                    }
                }
            }
        }
    )
)