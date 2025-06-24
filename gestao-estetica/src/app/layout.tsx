import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'EstéticaPro - Sistema de Gestão para Clínicas de Estética',
    description: 'Dashboard financeiro inteligente, agendamento integrado ao Google Calendar, controle de estoque e CRM completo. Tudo em uma plataforma.',
    keywords: 'gestão clínica estética, dashboard financeiro, google calendar, controle estoque, CRM',
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="pt-BR">
        <body className={inter.className}>
        {children}
        </body>
        </html>
    )
}