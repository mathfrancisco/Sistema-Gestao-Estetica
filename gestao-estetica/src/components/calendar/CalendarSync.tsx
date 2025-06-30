import { useState } from 'react'
import { RefreshCcw, CheckCircle, Calendar } from 'lucide-react'
interface CalendarSyncProps {
    userId: string
    onSyncComplete?: (results: any) => void
}

export default function CalendarSync({ userId, onSyncComplete }: CalendarSyncProps) {
    const [syncing, setSyncing] = useState(false)
    const [lastSync, setLastSync] = useState<Date | null>(null)

    const handleSync = async () => {
        try {
            setSyncing(true)

            const response = await fetch('/api/calendar/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            })

            if (response.ok) {
                const results = await response.json()
                setLastSync(new Date())
                onSyncComplete?.(results)
            }
        } catch (error) {
            console.error('Erro na sincronização:', error)
        } finally {
            setSyncing(false)
        }
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-medium">Sincronização Google Calendar</h3>
                        <p className="text-sm text-gray-500">
                            {lastSync
                                ? `Última sincronização: ${lastSync.toLocaleString('pt-BR')}`
                                : 'Nunca sincronizado'
                            }
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    <RefreshCcw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'Sincronizando...' : 'Sincronizar'}
                </button>
            </div>

            {lastSync && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">Agendamentos sincronizados com sucesso</span>
                    </div>
                </div>
            )}
        </div>
    )
}