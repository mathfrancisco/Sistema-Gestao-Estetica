// src/components/providers/AuthProvider.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { supabase } from '@/lib/database/supabase/client'
import { Loader2 } from 'lucide-react'

interface AuthProviderProps {
    children: React.ReactNode
}

export default function AuthProvider({ children }: AuthProviderProps) {
    const [isInitializing, setIsInitializing] = useState(true)
    const { initialize, setUser, setSession, refreshProfile, isInitialized } = useAuthStore()

    useEffect(() => {
        let mounted = true

        const initializeAuth = async () => {
            try {
                console.log('🚀 Inicializando AuthProvider...')

                // Verificar sessão atual
                const { data: { session }, error } = await supabase.auth.getSession()

                if (error) {
                    console.error('❌ Erro ao obter sessão:', error)
                    throw error
                }

                if (session && mounted) {
                    console.log('✅ Sessão encontrada:', session.user.email)
                    setUser(session.user)
                    setSession(session)
                    await refreshProfile()
                } else {
                    console.log('ℹ️ Nenhuma sessão ativa encontrada')
                }

                // Configurar listener para mudanças de autenticação
                const { data: { subscription } } = supabase.auth.onAuthStateChange(
                    async (event, session) => {
                        if (!mounted) return

                        console.log('🔄 Auth state changed:', event, session?.user?.email || 'no user')

                        switch (event) {
                            case 'SIGNED_IN':
                                if (session) {
                                    setUser(session.user)
                                    setSession(session)
                                    await refreshProfile()
                                }
                                break
                            case 'SIGNED_OUT':
                                setUser(null)
                                setSession(null)
                                break
                            case 'TOKEN_REFRESHED':
                                if (session) {
                                    setUser(session.user)
                                    setSession(session)
                                }
                                break
                            case 'USER_UPDATED':
                                if (session) {
                                    setUser(session.user)
                                    setSession(session)
                                    await refreshProfile()
                                }
                                break
                        }
                    }
                )

                if (mounted) {
                    setIsInitializing(false)
                }

                // Cleanup subscription
                return () => {
                    subscription.unsubscribe()
                }
            } catch (error) {
                console.error('❌ Erro na inicialização do auth:', error)
                if (mounted) {
                    setIsInitializing(false)
                }
            }
        }

        initializeAuth()

        return () => {
            mounted = false
        }
    }, [])

    // Mostrar loading enquanto inicializa
    if (isInitializing || !isInitialized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        Carregando aplicação...
                    </h3>
                    <p className="text-slate-500">
                        Verificando autenticação
                    </p>
                </div>
            </div>
        )
    }

    return <>{children}</>
}