// app/(auth)/connect-calendar/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar, CheckCircle, AlertCircle, Loader2, ArrowRight, RefreshCw, Shield } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { toast } from 'sonner'
import { useGoogleCalendar } from "@/lib/hooks/useGoogleCalendar"

export default function ConnectCalendarPage() {
    const [isConnecting, setIsConnecting] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    const { user, initialize } = useAuthStore()
    const {
        isAuthenticated,
        loading,
        getAuthUrl,
        authenticateUser,
        checkAuthentication
    } = useGoogleCalendar()

    // Process Google authorization code
    useEffect(() => {
        const processGoogleAuth = async () => {
            if (code && !isConnecting && user) {
                setIsConnecting(true)

                try {
                    const success = await authenticateUser(code)

                    if (success) {
                        toast.success('Google Calendar conectado com sucesso!')
                        // Update auth store
                        await initialize()
                        router.push('/dashboard')
                    } else {
                        toast.error('Erro ao conectar Google Calendar')
                    }
                } catch (error) {
                    console.error('Erro ao processar código:', error)
                    toast.error('Erro ao conectar Google Calendar')
                } finally {
                    setIsConnecting(false)
                }
            }
        }

        processGoogleAuth()
    }, [code, authenticateUser, initialize, router, isConnecting, user])

    // Check for error in URL
    useEffect(() => {
        if (error) {
            toast.error('Erro na autorização do Google Calendar')
        }
    }, [error])

    const handleConnectCalendar = async () => {
        try {
            const authUrl = await getAuthUrl()
            if (authUrl) {
                window.location.href = authUrl
            } else {
                toast.error('Erro ao gerar URL de autenticação')
            }
        } catch (error) {
            console.error('Erro ao conectar calendário:', error)
            toast.error('Erro ao conectar calendário')
        }
    }

    const handleSkip = () => {
        router.push('/dashboard')
    }

    const handleRetry = async () => {
        await checkAuthentication()
    }

    // Loading state
    if (loading || isConnecting) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {isConnecting ? 'Conectando calendário...' : 'Verificando conexão...'}
                    </h3>
                    <p className="text-gray-600">
                        {isConnecting
                            ? 'Processando autorização do Google Calendar'
                            : 'Por favor, aguarde'
                        }
                    </p>
                </div>
            </div>
        )
    }

    // Already connected state
    if (isAuthenticated && !code) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
                <div className="max-w-md w-full mx-auto px-6">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900 mb-3">
                            Calendário Conectado!
                        </h1>

                        <p className="text-gray-600 mb-8">
                            Seu Google Calendar já está conectado e pronto para uso.
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                                Ir para Dashboard
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </button>

                            <button
                                onClick={handleRetry}
                                className="w-full inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                                <RefreshCw className="mr-2 w-5 h-5" />
                                Verificar Conexão
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Connect calendar flow
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <div className="max-w-2xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
                        <Calendar className="w-10 h-10 text-blue-600" />
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Conecte seu Google Calendar
                    </h1>

                    <p className="text-lg text-gray-600 max-w-lg mx-auto">
                        Sincronize seus horários e automatize o agendamento de consultas para uma gestão mais eficiente.
                    </p>
                </div>

                {/* Error state */}
                {error && (
                    <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center">
                            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                            <span className="text-red-700 font-medium">
                                Erro na autorização
                            </span>
                        </div>
                        <p className="text-red-600 text-sm mt-1">
                            Ocorreu um erro ao conectar com o Google Calendar. Tente novamente.
                        </p>
                    </div>
                )}

                {/* Benefits */}
                <div className="grid md:grid-cols-2 gap-6 mb-12">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                            <Calendar className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Sincronização Automática
                        </h3>
                        <p className="text-gray-600">
                            Seus agendamentos aparecerão automaticamente no Google Calendar, evitando conflitos de horário.
                        </p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Disponibilidade em Tempo Real
                        </h3>
                        <p className="text-gray-600">
                            Verifique automaticamente sua disponibilidade antes de confirmar novos agendamentos.
                        </p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                            <Shield className="w-6 h-6 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Seguro e Privado
                        </h3>
                        <p className="text-gray-600">
                            Seus dados são protegidos e você pode desconectar a qualquer momento.
                        </p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                            <ArrowRight className="w-6 h-6 text-orange-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Integração Simples
                        </h3>
                        <p className="text-gray-600">
                            Processo rápido e fácil de configuração em apenas alguns cliques.
                        </p>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="space-y-4">
                    <button
                        onClick={handleConnectCalendar}
                        disabled={loading}
                        className="w-full inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-3 w-5 h-5 animate-spin" />
                                Conectando...
                            </>
                        ) : (
                            <>
                                <Calendar className="mr-3 w-5 h-5" />
                                Conectar Google Calendar
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleSkip}
                        className="w-full inline-flex items-center justify-center px-8 py-3 border border-gray-300 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                        Pular por agora
                    </button>
                </div>

                {/* Privacy note */}
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start">
                        <Shield className="w-5 h-5 text-gray-500 mt-0.5 mr-3 flex-shrink-0" />
                        <div className="text-sm text-gray-600">
                            <p className="font-medium mb-1">Sua privacidade é importante</p>
                            <p>
                                Acessamos apenas as informações necessárias para sincronizar seus agendamentos.
                                Você pode revogar o acesso a qualquer momento nas configurações.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}