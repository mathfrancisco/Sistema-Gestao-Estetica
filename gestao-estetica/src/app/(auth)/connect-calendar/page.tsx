'use client'
import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useGoogleCalendar } from '@/lib/hooks/useGoogleCalendar'
import { useAuthStore } from '@/store/useAuthStore'
import { CheckCircle, XCircle, Loader2, Calendar, AlertCircle } from 'lucide-react'

export default function ConnectCalendarPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { processCallback, startAuthentication, isAuthenticated, loading, error, clearError } = useGoogleCalendar()
    const { user, session, isInitialized, initialize } = useAuthStore()

    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')

    // Garantir que o usuário está autenticado antes de processar
    useEffect(() => {
        if (!isInitialized) {
            initialize()
            return
        }

        if (isInitialized && !user) {
            // Se não há usuário autenticado, redirecionar para login
            router.push('/login')
            return
        }

        // Processar parâmetros da URL apenas se usuário estiver autenticado
        const code = searchParams.get('code')
        const success = searchParams.get('success')
        const errorParam = searchParams.get('error')

        if (success === 'true') {
            setStatus('success')
            setMessage('Google Calendar conectado com sucesso!')
        } else if (errorParam) {
            setStatus('error')
            setMessage('Erro ao conectar com Google Calendar')
        } else if (code && user) {
            handleCallback(code)
        }
    }, [searchParams, user, isInitialized, initialize, router])

    const handleCallback = async (code: string) => {
        if (!user) {
            setStatus('error')
            setMessage('Usuário não autenticado. Redirecionando para login...')
            setTimeout(() => router.push('/login'), 2000)
            return
        }

        setStatus('processing')
        setMessage('Processando autenticação...')

        try {
            const success = await processCallback(code)
            if (success) {
                setStatus('success')
                setMessage('Google Calendar conectado com sucesso!')

                // Redirect to dashboard after 3 seconds
                setTimeout(() => {
                    router.push('/dashboard')
                }, 3000)
            } else {
                setStatus('error')
                setMessage('Falha ao processar autenticação')
            }
        } catch (err) {
            console.error('Erro no callback:', err)
            setStatus('error')
            setMessage('Erro durante o processamento')
        }
    }

    const handleConnect = async () => {
        if (!user) {
            setStatus('error')
            setMessage('Usuário não autenticado. Redirecionando para login...')
            setTimeout(() => router.push('/login'), 2000)
            return
        }

        clearError()
        setStatus('processing')
        setMessage('Redirecionando para Google...')

        try {
            await startAuthentication()
        } catch (err) {
            console.error('Erro ao iniciar autenticação:', err)
            setStatus('error')
            setMessage('Erro ao iniciar autenticação')
        }
    }

    const handleRetry = () => {
        setStatus('idle')
        setMessage('')
        clearError()
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

    // Loading state enquanto inicializa
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

    if (isAuthenticated && status !== 'processing') {
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
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Ir para Dashboard
                    </button>
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
                        <button
                            onClick={handleRetry}
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Tentar Novamente
                        </button>
                    )}

                    {status === 'success' && (
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Continuar para Dashboard
                        </button>
                    )}

                    <button
                        onClick={() => router.push('/dashboard')}
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