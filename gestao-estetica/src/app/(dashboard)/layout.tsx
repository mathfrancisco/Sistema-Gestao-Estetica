'use client'

import { ReactNode } from 'react'

interface DashboardLayoutProps {
    children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    // Este layout NÃO deve ter tags HTML (<html>, <head>, <body>)
    // Apenas lógica de wrapper para o dashboard
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            {children}
        </div>
    )
}