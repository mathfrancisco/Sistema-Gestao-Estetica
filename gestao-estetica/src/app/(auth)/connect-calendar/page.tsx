'use client'
import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useGoogleCalendar } from '@/lib/hooks/useGoogleCalendar'
import { useAuthStore } from '@/store/useAuthStore'
import { CheckCircle, XCircle, Loader2, Calendar, AlertCircle, RefreshCw } from 'lucide-react'

export default function ConnectCalendarPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { processCallback, startAuthentication, isAuthenticated, loading, error, clearError } = useGoogleCalendar()
    const { user, userProfile, isInitialized, initialize, refreshProfile, hasGoogleCalendar } = useAuthStore()

    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')
    const [debugInfo, setDebugInfo] = useState<any>({})

    // ✅ CORRIGIDO: Better state management and callback handling
    useEffect(() => {
        console.log('🔄 ConnectCalendarPage useEffect triggered')

        if (!isInitialized) {
            console.log('⏳ Auth store not initialized, initializing...')
            initialize()
            return
        }

        if (isInitialized && !user) {
            console.log('❌ No authenticated user, redirecting to login...')
            router.push('/login')
            return
        }

        // Update debug info
        setDebugInfo({
            isInitialized,
            hasUser: !!user,
            hasUserProfile: !!userProfile,
            hasGoogleCalendar: hasGoogleCalendar(),
            isAuthenticated,
            loading
        })

        console.log('🔍 Debug info:', {
            isInitialized,
            hasUser: !!user,
            hasUserProfile: !!userProfile,
            hasGoogleCalendar: hasGoogleCalendar(),
            isAuthenticated,
            loading
        })

        // ✅ Handle URL parameters
        const code = searchParams.get('code')
        const success = searchParams.get('success')
        const errorParam = searchParams.get('error')
        const calendarId = searchParams.get('calendarId')

        console.log('🔍 URL parameters:', { code: !!code, success, errorParam, calendarId })

        if (success === 'true') {
            console.log('✅ Success callback received')
            setStatus('success')
            setMessage('Google Calendar conectado com sucesso!')

            // ✅ Refresh profile to get updated data
            refreshProfile().then(() => {
                console.log('🔄 Profile refreshed after success')
                setTimeout(() => {
                    router.push('/agendamentos/configuracao')
                }, 2000)
            })
        } else if (errorParam) {
            console.log('❌ Error callback received:', errorParam)
            setStatus('error')
            setMessage(getErrorMessage(errorParam))
        } else if (code && user) {
            console.log('🔑 Authorization code received, processing...')
            handleCallback(code)
        } else if (user && userProfile && hasGoogleCalendar() && isAuthenticated) {
            console.log('✅ Already connected, redirecting...')
            setStatus('success')
            setMessage('Já conectado ao Google Calendar')
            setTimeout(() => {
                router.push('/agendamentos/configuracao')
            }, 1000)
        }
    }, [searchParams, user, userProfile, isInitialized, initialize, router, hasGoogleCalendar, isAuthenticated, refreshProfile])

    const getErrorMessage = (errorCode: string) => {
        const errorMessages = {
            'access_denied': 'Acesso negado pelo usuário',
            'auth_failed': 'Falha na autenticação',
            'missing_params': 'Parâmetros de autenticação ausentes',
            'user_not_found': 'Usuário não encontrado',
            'config_error': 'Erro de configuração do sistema',
            'no_calendar': 'Calendário principal não encontrado',
            'save_failed': 'Falha ao salvar credenciais'
        }
        return errorMessages[errorCode] || 'Erro desconhecido na conexão'
    }

    const handleCallback = async (code: string) => {
        if (!user) {
            console.error('❌ No user for callback processing')
            setStatus('error')
            setMessage('Usuário não autenticado. Redirecionando para login...')
            setTimeout(() => router.push('/login'), 2000)
            return
        }

        try {
            console.log('🔄 Processing OAuth callback...')
            setStatus('processing')
            setMessage('Processando autenticação...')

            const success = await processCallback(code)

            if (success) {
                console.log('✅ Callback processed successfully')
                setStatus('success')
                setMessage('Google Calendar conectado com sucesso!')

                // ✅ Wait for profile refresh and redirect
                setTimeout(async () => {
                    await refreshProfile()
                    router.push('/agendamentos/configuracao')
                }, 3000)
            } else {
                console.error('❌ Callback processing failed')
                setStatus('error')
                setMessage('Falha ao processar autenticação')
            }
        } catch (err) {
            console.error('❌ Callback error:', err)
            setStatus('error')
            setMessage('Erro durante o processamento')
        }
    }

    const handleConnect = async () => {
        if (!user) {
            console.error('❌ No user for connection')
            setStatus('error')
            setMessage('Usuário não autenticado. Redirecionando para login...')
            setTimeout(() => router.push('/login'), 2000)
            return
        }

        try {
            console.log('🔗 Initiating Google Calendar connection...')
            clearError()
            setStatus('processing')
            setMessage('Redirecionando para Google...')

            const success = await startAuthentication()

            if (!success) {
                console.error('❌ Failed to start authentication')
                setStatus('error')
                setMessage('Erro ao iniciar autenticação')
            }
        } catch (err) {
            console.error('❌ Connect error:', err)
            setStatus('error')
            setMessage('Erro ao iniciar autenticação')
        }
    }

    const handleRetry = () => {
        console.log('🔄 Retrying connection...')
        setStatus('idle')
        setMessage('')
        clearError()
    }

    const handleRefreshProfile = async () => {
        console.log('🔄 Refreshing profile manually...')
        setStatus('processing')
        setMessage('Atualizando perfil...')

        try {
            await refreshProfile()

            // Check if now connected
            if (hasGoogleCalendar() && isAuthenticated) {
                setStatus('success')
                setMessage('Perfil atualizado - Google Calendar conectado!')
                setTimeout(() => {
                    router.push('/agendamentos/configuracao')
                }, 2000)
            } else {
                setStatus('idle')
                setMessage('')
            }
        } catch (error) {
            console.error('❌ Error refreshing profile:', error)
            setStatus('error')
            setMessage('Erro ao atualizar perfil')
        }
    }

    const getStatusIcon = () => {
        switch (status) {
            case 'processing':
                return <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
            case 'success':
                return <CheckCircle className="h-16 w-16 text-green-500" />
            case 'error':
                return <XCircle className="h-16 w-16 text-red-500" />
            default:
                return <Calendar className="h-16 w-16 text-gray-400" />
        }
    }

    const getStatusColor = () => {
        switch (status) {
            case 'processing':
                return 'border-blue-200 bg-blue-50'
            case 'success':
                return 'border-green-200 bg-green-50'
            case 'error':
                return 'border-red-200 bg-red-50'
            default:
                return 'border-gray-200 bg-gray-50'
        }
    }

    // ✅ Loading state while initializing
    if (!isInitialized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <Loader2 className="h-16 w-16 text-blue-500 animate-spin mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Carregando...
                    </h1>
                    <p className="text-gray-600">
                        Verificando autenticação
                    </p>
                </div>
            </div>
        )
    }

    // ✅ Already authenticated state
    if (isAuthenticated && hasGoogleCalendar() && status !== 'processing') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Já Conectado!
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Seu Google Calendar já está conectado e sincronizado.
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={() => router.push('/agendamentos/configuracao')}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Ir para Configurações
                        </button>
                        <button
                            onClick={() => router.push('/agendamentos')}
                            className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Ir para Agendamentos
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                <div className={`text-center p-6 rounded-lg mb-6 ${getStatusColor()}`}>
                    {getStatusIcon()}

                    <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-2">
                        {status === 'idle' && 'Conectar Google Calendar'}
                        {status === 'processing' && 'Conectando...'}
                        {status === 'success' && 'Conectado!'}
                        {status === 'error' && 'Erro na Conexão'}
                    </h1>

                    <p className="text-gray-600">
                        {status === 'idle' && 'Conecte seu Google Calendar para sincronizar seus eventos e compromissos.'}
                        {message}
                    </p>
                </div>

                {/* ✅ Debug info for development */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs">
                        <h3 className="font-semibold text-yellow-800 mb-2">🛠️ Debug Info:</h3>
                        <pre className="text-yellow-700 overflow-x-auto">
                            {JSON.stringify(debugInfo, null, 2)}
                        </pre>
                    </div>
                )}

                {error && status !== 'processing' && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center">
                            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                            <span className="text-red-700 text-sm">{error}</span>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {status === 'idle' && (
                        <button
                            onClick={handleConnect}
                            disabled={loading || !user}
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Conectando...
                                </>
                            ) : (
                                <>
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Conectar Google Calendar
                                </>
                            )}
                        </button>
                    )}

                    {status === 'error' && (
                        <div className="space-y-3">
                            <button
                                onClick={handleRetry}
                                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Tentar Novamente
                            </button>
                            <button
                                onClick={handleRefreshProfile}
                                className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Atualizar Perfil
                            </button>
                        </div>
                    )}

                    {status === 'success' && (
                        <button
                            onClick={() => router.push('/agendamentos/configuracao')}
                            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Continuar para Configurações
                        </button>
                    )}

                    <button
                        onClick={() => router.push('/agendamentos')}
                        className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Pular por Agora
                    </button>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500">
                        Ao conectar, você concorda com os termos de uso do Google Calendar
                    </p>
                </div>
            </div>
        </div>
    )
}