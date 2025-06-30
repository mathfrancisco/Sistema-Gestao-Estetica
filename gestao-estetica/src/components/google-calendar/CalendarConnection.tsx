// components/google-calendar/CalendarConnection.tsx
'use client'

import { useState, useEffect } from 'react'
import { Calendar, CheckCircle, AlertCircle, Settings, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useGoogleCalendar } from '@/lib/hooks/useGoogleCalendar'
import { useAuthStore } from '@/store/useAuthStore'

interface CalendarConnectionProps {
    onConnectionChange?: (isConnected: boolean) => void
}

export default function CalendarConnection({ onConnectionChange }: CalendarConnectionProps) {
    const [isConnecting, setIsConnecting] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)

    const { userProfile } = useAuthStore()
    const {
        isAuthenticated,
        loading,
        error,
        startAuthentication,
        disconnect,
        checkAuthentication,
        clearError
    } = useGoogleCalendar()

    useEffect(() => {
        if (onConnectionChange) {
            onConnectionChange(isAuthenticated)
        }
    }, [isAuthenticated, onConnectionChange])

    const handleConnect = async () => {
        setIsConnecting(true)
        clearError()

        try {
            const success = await startAuthentication()
            if (!success) {
                setIsConnecting(false)
            }
        } catch (error) {
            console.error('Erro ao conectar:', error)
            setIsConnecting(false)
        }
    }

    const handleDisconnect = async () => {
        const success = await disconnect()
        if (success) {
            setShowSuccess(true)
            setTimeout(() => setShowSuccess(false), 3000)
        }
    }

    const handleReconnect = async () => {
        await handleDisconnect()
        setTimeout(() => {
            handleConnect()
        }, 1000)
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center p-8">
                    <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                        <span>Verificando conexão...</span>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Calendar className="h-5 w-5" />
                            <CardTitle>Google Calendar</CardTitle>
                        </div>
                        {isAuthenticated ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Conectado
                            </Badge>
                        ) : (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Desconectado
                            </Badge>
                        )}
                    </div>
                    <CardDescription>
                        {isAuthenticated
                            ? 'Sua conta está conectada ao Google Calendar. Os agendamentos serão sincronizados automaticamente.'
                            : 'Conecte sua conta do Google para sincronizar agendamentos com o Google Calendar.'
                        }
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {showSuccess && (
                        <Alert className="bg-green-50 border-green-200">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-700">
                                Google Calendar desconectado com sucesso!
                            </AlertDescription>
                        </Alert>
                    )}

                    {isAuthenticated && userProfile && (
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-medium text-sm text-gray-900 mb-2">Informações da conta</h4>
                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex justify-between">
                                    <span>Email:</span>
                                    <span className="font-medium">{userProfile.email}</span>
                                </div>
                                {userProfile.google_calendar_id && (
                                    <div className="flex justify-between">
                                        <span>Calendar ID:</span>
                                        <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">
                      {userProfile.google_calendar_id.slice(0, 20)}...
                    </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Settings className="h-4 w-4" />
                        <span>Recursos disponíveis:</span>
                    </div>

                    <ul className="space-y-2 text-sm">
                        <li className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Sincronização automática de agendamentos</span>
                        </li>
                        <li className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Criação de eventos no Google Calendar</span>
                        </li>
                        <li className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Convites automáticos para clientes</span>
                        </li>
                        <li className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Links do Google Meet integrados</span>
                        </li>
                    </ul>
                </CardContent>

                <CardFooter className="flex flex-col sm:flex-row gap-2">
                    {!isAuthenticated ? (
                        <Button
                            onClick={handleConnect}
                            disabled={isConnecting}
                            className="w-full sm:w-auto"
                        >
                            {isConnecting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                    Conectando...
                                </>
                            ) : (
                                <>
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Conectar Google Calendar
                                </>
                            )}
                        </Button>
                    ) : (
                        <div className="flex flex-col sm:flex-row gap-2 w-full">
                            <Button
                                variant="outline"
                                onClick={() => checkAuthentication()}
                                disabled={loading}
                                className="flex-1"
                            >
                                <Settings className="h-4 w-4 mr-2" />
                                Verificar Conexão
                            </Button>

                            <Button
                                variant="outline"
                                onClick={handleReconnect}
                                disabled={loading}
                                className="flex-1"
                            >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Reconectar
                            </Button>

                            <Button
                                variant="destructive"
                                onClick={handleDisconnect}
                                disabled={loading}
                                className="flex-1"
                            >
                                Desconectar
                            </Button>
                        </div>
                    )}
                </CardFooter>
            </Card>

            {isAuthenticated && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Próximos passos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-start space-x-2">
                                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                                <div>
                                    <p className="font-medium">Sincronize agendamentos existentes</p>
                                    <p className="text-gray-600">Vá para a página de agendamentos e clique em "Sincronizar com Google Calendar"</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-2">
                                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                                <div>
                                    <p className="font-medium">Configure notificações</p>
                                    <p className="text-gray-600">Novos agendamentos serão automaticamente adicionados ao seu Google Calendar</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-2">
                                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                                <div>
                                    <p className="font-medium">Acesse de qualquer lugar</p>
                                    <p className="text-gray-600">Visualize seus agendamentos em qualquer dispositivo através do Google Calendar</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}