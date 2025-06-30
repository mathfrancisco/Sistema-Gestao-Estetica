'use client'

import { useState, useEffect } from 'react'
import { X} from 'lucide-react'

interface AppointmentModalProps {
    isOpen: boolean
    onCloseAction: () => void
    onSaveAction: (data: AppointmentFormData) => void
    appointment?: any
    clients: Array<{ id: string; name: string; email: string; phone: string }>
    procedures: Array<{ id: string; name: string; duration_minutes: number; price: number }>
}

interface AppointmentFormData {
    clientId: string
    procedureId: string
    scheduledDateTime: string
    notes: string
    location: string
    createGoogleEvent: boolean
}

export default function AppointmentModal({
                                             isOpen,
                                             onCloseAction,
                                             onSaveAction,
                                             appointment,
                                             clients,
                                             procedures
                                         }: AppointmentModalProps) {
    const [formData, setFormData] = useState<AppointmentFormData>({
        clientId: '',
        procedureId: '',
        scheduledDateTime: '',
        notes: '',
        location: '',
        createGoogleEvent: true
    })

    useEffect(() => {
        if (appointment) {
            setFormData({
                clientId: appointment.client_id || '',
                procedureId: appointment.procedure_id || '',
                scheduledDateTime: appointment.scheduled_datetime || '',
                notes: appointment.notes || '',
                location: appointment.location || '',
                createGoogleEvent: !appointment.google_event_id
            })
        } else {
            setFormData({
                clientId: '',
                procedureId: '',
                scheduledDateTime: '',
                notes: '',
                location: '',
                createGoogleEvent: true
            })
        }
    }, [appointment])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSaveAction(formData)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">
                        {appointment ? 'Editar Agendamento' : 'Novo Agendamento'}
                    </h2>
                    <button onClick={onCloseAction}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Cliente */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cliente
                        </label>
                        <select
                            value={formData.clientId}
                            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">Selecione um cliente</option>
                            {clients.map(client => (
                                <option key={client.id} value={client.id}>
                                    {client.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Procedimento */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Procedimento
                        </label>
                        <select
                            value={formData.procedureId}
                            onChange={(e) => setFormData({ ...formData, procedureId: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">Selecione um procedimento</option>
                            {procedures.map(procedure => (
                                <option key={procedure.id} value={procedure.id}>
                                    {procedure.name} - {procedure.duration_minutes}min - R$ {procedure.price}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Data e Hora */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Data e Hora
                        </label>
                        <input
                            type="datetime-local"
                            value={formData.scheduledDateTime}
                            onChange={(e) => setFormData({ ...formData, scheduledDateTime: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* Local */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Local
                        </label>
                        <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Endereço do atendimento"
                        />
                    </div>

                    {/* Observações */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Observações
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            placeholder="Observações sobre o agendamento"
                        />
                    </div>

                    {/* Google Calendar */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="createGoogleEvent"
                            checked={formData.createGoogleEvent}
                            onChange={(e) => setFormData({ ...formData, createGoogleEvent: e.target.checked })}
                            className="mr-2"
                        />
                        <label htmlFor="createGoogleEvent" className="text-sm text-gray-700">
                            Criar evento no Google Calendar
                        </label>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <button type="button" onClick={onCloseAction}
                            className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            {appointment ? 'Atualizar' : 'Criar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}