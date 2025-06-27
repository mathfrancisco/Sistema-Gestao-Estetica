// store/useSettingsStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Database } from '@/lib/database/supabase/types'

type BusinessProfile = Database['public']['Tables']['business_profile']['Row']
type ProfitDistributionConfig = Database['public']['Tables']['profit_distribution_config']['Row']

interface BusinessHours {
    [key: string]: {
        isOpen: boolean
        openTime: string
        closeTime: string
        breaks?: Array<{
            start: string
            end: string
        }>
    }
}

interface NotificationSettings {
    email: {
        newAppointment: boolean
        appointmentReminder: boolean
        clientBirthday: boolean
        lowStock: boolean
        monthlyReport: boolean
    }
    push: {
        enabled: boolean
        appointmentReminder: boolean
        stockAlert: boolean
    }
    sms: {
        enabled: boolean
        appointmentConfirmation: boolean
        appointmentReminder: boolean
    }
}

interface SettingsState {
    businessProfile: BusinessProfile | null
    businessHours: BusinessHours
    profitDistribution: ProfitDistributionConfig[]
    notifications: NotificationSettings
    appearance: {
        theme: 'light' | 'dark' | 'system'
        primaryColor: string
        language: string
        currency: string
        timeFormat: '12h' | '24h'
        dateFormat: string
    }
    integrations: {
        googleCalendar: {
            enabled: boolean
            syncInterval: number // minutes
            createMeetLinks: boolean
        }
        whatsapp: {
            enabled: boolean
            apiKey?: string
            phoneNumber?: string
        }
        email: {
            provider: 'smtp' | 'sendgrid' | 'mailgun'
            settings: any
        }
    }
    backup: {
        autoBackup: boolean
        backupInterval: 'daily' | 'weekly' | 'monthly'
        lastBackup?: Date
    }
}

interface SettingsActions {
    setBusinessProfile: (profile: BusinessProfile | null) => void
    updateBusinessProfile: (profile: Partial<BusinessProfile>) => void
    setBusinessHours: (hours: BusinessHours) => void
    updateBusinessHours: (day: string, hours: Partial<BusinessHours[string]>) => void
    setProfitDistribution: (distribution: ProfitDistributionConfig[]) => void
    updateProfitDistribution: (category: string, percentage: number) => void
    updateNotifications: (notifications: Partial<NotificationSettings>) => void
    updateAppearance: (appearance: Partial<SettingsState['appearance']>) => void
    updateIntegrations: (integrations: Partial<SettingsState['integrations']>) => void
    updateBackupSettings: (backup: Partial<SettingsState['backup']>) => void
    resetToDefaults: () => void
    exportSettings: () => string
    importSettings: (settings: string) => void
}

type SettingsStore = SettingsState & SettingsActions

const defaultBusinessHours: BusinessHours = {
    monday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
    tuesday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
    wednesday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
    thursday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
    friday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
    saturday: { isOpen: true, openTime: '08:00', closeTime: '14:00' },
    sunday: { isOpen: false, openTime: '08:00', closeTime: '18:00' },
}

const defaultNotifications: NotificationSettings = {
    email: {
        newAppointment: true,
        appointmentReminder: true,
        clientBirthday: false,
        lowStock: true,
        monthlyReport: true,
    },
    push: {
        enabled: true,
        appointmentReminder: true,
        stockAlert: true,
    },
    sms: {
        enabled: false,
        appointmentConfirmation: false,
        appointmentReminder: false,
    },
}

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set, get) => ({
            // Estado inicial
            businessProfile: null,
            businessHours: defaultBusinessHours,
            profitDistribution: [
                { id: '1', user_id: '', category: 'pro_labore', percentage: 60, description: 'Pró-labore (Salário)', is_active: true, created_at: '', updated_at: '' },
                { id: '2', user_id: '', category: 'equipment_reserve', percentage: 20, description: 'Reserva para Equipamentos', is_active: true, created_at: '', updated_at: '' },
                { id: '3', user_id: '', category: 'emergency_reserve', percentage: 10, description: 'Reserva de Emergência', is_active: true, created_at: '', updated_at: '' },
                { id: '4', user_id: '', category: 'investment', percentage: 10, description: 'Investimento/Marketing', is_active: true, created_at: '', updated_at: '' },
            ],
            notifications: defaultNotifications,
            appearance: {
                theme: 'system',
                primaryColor: '#3B82F6',
                language: 'pt-BR',
                currency: 'BRL',
                timeFormat: '24h',
                dateFormat: 'DD/MM/YYYY',
            },
            integrations: {
                googleCalendar: {
                    enabled: false,
                    syncInterval: 15,
                    createMeetLinks: true,
                },
                whatsapp: {
                    enabled: false,
                },
                email: {
                    provider: 'smtp',
                    settings: {},
                },
            },
            backup: {
                autoBackup: true,
                backupInterval: 'weekly',
            },

            // Actions
            setBusinessProfile: (businessProfile) => set({ businessProfile }),

            updateBusinessProfile: (profile) => set((state) => ({
                businessProfile: state.businessProfile
                    ? { ...state.businessProfile, ...profile }
                    : null,
            })),

            setBusinessHours: (businessHours) => set({ businessHours }),

            updateBusinessHours: (day, hours) => set((state) => ({
                businessHours: {
                    ...state.businessHours,
                    [day]: { ...state.businessHours[day], ...hours },
                },
            })),

            setProfitDistribution: (profitDistribution) => set({ profitDistribution }),

            updateProfitDistribution: (category, percentage) => set((state) => ({
                profitDistribution: state.profitDistribution.map(item =>
                    item.category === category ? { ...item, percentage } : item
                ),
            })),

            updateNotifications: (notifications) => set((state) => ({
                notifications: {
                    ...state.notifications,
                    ...notifications,
                    email: { ...state.notifications.email, ...notifications.email },
                    push: { ...state.notifications.push, ...notifications.push },
                    sms: { ...state.notifications.sms, ...notifications.sms },
                },
            })),

            updateAppearance: (appearance) => set((state) => ({
                appearance: { ...state.appearance, ...appearance },
            })),

            updateIntegrations: (integrations) => set((state) => ({
                integrations: {
                    ...state.integrations,
                    ...integrations,
                    googleCalendar: { ...state.integrations.googleCalendar, ...integrations.googleCalendar },
                    whatsapp: { ...state.integrations.whatsapp, ...integrations.whatsapp },
                    email: { ...state.integrations.email, ...integrations.email },
                },
            })),

            updateBackupSettings: (backup) => set((state) => ({
                backup: { ...state.backup, ...backup },
            })),

            resetToDefaults: () => set({
                businessHours: defaultBusinessHours,
                notifications: defaultNotifications,
                appearance: {
                    theme: 'system',
                    primaryColor: '#3B82F6',
                    language: 'pt-BR',
                    currency: 'BRL',
                    timeFormat: '24h',
                    dateFormat: 'DD/MM/YYYY',
                },
                integrations: {
                    googleCalendar: {
                        enabled: false,
                        syncInterval: 15,
                        createMeetLinks: true,
                    },
                    whatsapp: {
                        enabled: false,
                    },
                    email: {
                        provider: 'smtp',
                        settings: {},
                    },
                },
                backup: {
                    autoBackup: true,
                    backupInterval: 'weekly',
                },
            }),

            exportSettings: () => {
                const state = get()
                const exportData = {
                    businessHours: state.businessHours,
                    profitDistribution: state.profitDistribution,
                    notifications: state.notifications,
                    appearance: state.appearance,
                    integrations: state.integrations,
                    backup: state.backup,
                }
                return JSON.stringify(exportData, null, 2)
            },

            importSettings: (settingsJson) => {
                try {
                    const settings = JSON.parse(settingsJson)
                    set((state) => ({
                        ...state,
                        ...settings,
                    }))
                } catch (error) {
                    console.error('Error importing settings:', error)
                }
            },
        }),
        {
            name: 'settings-storage',
            partialize: (state) => ({
                businessHours: state.businessHours,
                profitDistribution: state.profitDistribution,
                notifications: state.notifications,
                appearance: state.appearance,
                integrations: state.integrations,
                backup: state.backup,
            }),
        }
    )
)