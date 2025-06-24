// app/(auth)/connect-calendar/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar, CheckCircle, AlertCircle, Loader2, ArrowRight, RefreshCw, Shield } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { toast } from 'sonner'
import {useGoogleCalendar} from "@/lib/hooks/useGoogleCalendar";

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

    // Processar código de autorização do Google
    useEffect(() => {
        const processGoogleAuth = async () => {
            if (code && !isConnecting) {
                setIsConnecting(true)

                try {
                    const success = await authenticateUser(code)

                    if (success) {
                        toast.success('Google Calendar conectado com sucesso!')
                        // Atualizar o auth store
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
    }, [code, authenticateUser, initialize, router, isConnecting])

    // Verificar erro na URL
    useEffect(() => {
        if (error) {
            toast.error('Erro na autorização do Google Calendar')
        }
    }, [error])

    const handleConnectCalendar = () => {
        try {
            const authUrl = getAuthUrl()
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
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        {isConnecting ? 'Conectando calendário...' : 'Carregando...'}
                    </h2>
                    <p className="text-gray-600">
                        {isConnecting ? 'Processando autorização do Google' : 'Aguarde um momento'}
                    </p>
                </div>
            </div>
        )
    }

    // Already connected
    if (isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900 mb-4">
                            Calendário Conectado!
                        </h1>

                        <p className="text-gray-600 mb-8">
                            Seu Google Calendar já está sincronizado com o EstéticaPro.
                            Agora você pode gerenciar seus agendamentos em ambas as plataformas.
                        </p>

                        <div className="space-y-4">
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                            >
                                Ir para Dashboard
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </button>

                            <button
                                onClick={handleRetry}
                                className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
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

    // Not connected - show connection flow
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mb-6">
                            <Calendar className="w-8 h-8 text-white" />
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900 mb-4">
                            Conecte seu Google Calendar
                        </h1>

                        <p className="text-gray-600 mb-6">
                            Sincronize seus agendamentos automaticamente e nunca mais perca um compromisso.
                        </p>
                    </div>

                    {/* Benefits */}
                    <div className="space-y-4 mb-8">
                        <div className="flex items-start space-x-3">
                            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <h3 className="font-medium text-gray-900">Sincronização Automática</h3>
                                <p className="text-sm text-gray-600">
                                    Agendamentos criados no EstéticaPro aparecem no seu Google Calendar
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3">
                            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <h3 className="font-medium text-gray-900">Lembretes Automáticos</h3>
                                <p className="text-sm text-gray-600">
                                    Seus clientes recebem convites e lembretes pelo Google
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3">
                            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <h3 className="font-medium text-gray-900">Acesso Mobile</h3>
                                <p className="text-sm text-gray-600">
                                    Visualize seus agendamentos em qualquer dispositivo
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center">
                                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                                <p className="text-sm text-red-800">
                                    Erro na autorização. Tente novamente.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-4">
                        <button
                            onClick={handleConnectCalendar}
                            disabled={isConnecting}
                            className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isConnecting ? (
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            ) : (
                                <Calendar className="w-5 h-5 mr-2" />
                            )}
                            Conectar Google Calendar
                        </button>

                        <button
                            onClick={handleSkip}
                            className="w-full px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                        >
                            Pular por agora
                        </button>
                    </div>

                    {/* Security Note */}
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start space-x-3">
                            <Shield className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="text-sm font-medium text-blue-900 mb-1">
                                    Seus dados estão seguros
                                </h4>
                                <p className="text-xs text-blue-800">
                                    Utilizamos autenticação OAuth2 do Google. Não armazenamos
                                    suas credenciais e você pode revogar o acesso a qualquer momento.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Support Link */}
                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-500">
                            Precisa de ajuda?{' '}
                            <a
                                href="/suporte"
                                className="text-purple-600 hover:text-purple-700 underline"
                            >
                                Entre em contato conosco
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}