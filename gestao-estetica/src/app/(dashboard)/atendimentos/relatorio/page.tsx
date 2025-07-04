'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
    Heart,
    ArrowLeft,
    DollarSign,
    Star,
    TrendingUp,
    Calendar,
    BarChart3,
    PieChart,
    Download,
    Filter,
    RefreshCw,
    FileText,
    Target,
    Award,
    CheckCircle,
    ArrowUp,
    ArrowDown,
    Users,
} from 'lucide-react'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell, AreaChart, Area, Pie } from 'recharts'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import { useFinancials } from "@/lib/hooks/useFinancials"
import { useProcedures } from "@/lib/hooks/useProcedures"
import { Sidebar } from '@/components/layout/sidebar'

const COLORS = ['#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']
const ENHANCED_COLORS = [
    '#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
    '#6366f1', '#84cc16', '#f97316', '#8b5cf6', '#06b6d4', '#10b981'
]

const RelatorioAtendimentosPage: React.FC = () => {
    const router = useRouter()

    const [filters, setFilters] = useState({
        period: 'last30days',
        startDate: '',
        endDate: '',
        procedureId: 'all',
        paymentStatus: 'all'
    })

    const [loading, setLoading] = useState(false)
    const [exportLoading, setExportLoading] = useState('')

    const { financialSummary, isLoading: financialLoading } = useFinancials()
    const { data: proceduresData } = useProcedures({ page: 1, limit: 100 })

    const procedures = proceduresData?.data || []

    // Mock data para demonstração - substituir pela implementação real
    const [reportData, setReportData] = useState({
        summary: {
            totalAttendances: 156,
            totalRevenue: 23450.00,
            averageTicket: 150.32,
            averageRating: 4.7,
            completionRate: 94.2,
            profitMargin: 68.5
        },
        trends: {
            attendances: [
                { month: 'Jan', value: 45, growth: 12 },
                { month: 'Fev', value: 52, growth: 15 },
                { month: 'Mar', value: 48, growth: -8 },
                { month: 'Abr', value: 61, growth: 27 },
                { month: 'Mai', value: 55, growth: -10 },
                { month: 'Jun', value: 67, growth: 22 }
            ],
            revenue: [
                { month: 'Jan', value: 6750, growth: 8 },
                { month: 'Fev', value: 7800, growth: 15 },
                { month: 'Mar', value: 7200, growth: -8 },
                { month: 'Abr', value: 9150, growth: 27 },
                { month: 'Mai', value: 8250, growth: -10 },
                { month: 'Jun', value: 10050, growth: 22 }
            ]
        },
        procedures: [
            { name: 'Limpeza de Pele', attendances: 45, revenue: 6750, avgRating: 4.8, growth: 15 },
            { name: 'Peeling Químico', attendances: 32, revenue: 6400, avgRating: 4.7, growth: 8 },
            { name: 'Hidratação Facial', attendances: 28, revenue: 2800, avgRating: 4.6, growth: -5 },
            { name: 'Microagulhamento', attendances: 25, revenue: 5000, avgRating: 4.9, growth: 22 },
            { name: 'Massagem Relaxante', attendances: 26, revenue: 2600, avgRating: 4.5, growth: 3 }
        ],
        paymentStatus: [
            { name: 'Pago', value: 142, color: '#10b981', percentage: 91.0 },
            { name: 'Pendente', value: 12, color: '#f59e0b', percentage: 7.7 },
            { name: 'Cancelado', value: 2, color: '#ef4444', percentage: 1.3 }
        ],
        ratings: [
            { rating: '5 estrelas', count: 89, percentage: 57.1, color: '#10b981' },
            { rating: '4 estrelas', count: 45, percentage: 28.8, color: '#84cc16' },
            { rating: '3 estrelas', count: 15, percentage: 9.6, color: '#f59e0b' },
            { rating: '2 estrelas', count: 5, percentage: 3.2, color: '#f97316' },
            { rating: '1 estrela', count: 2, percentage: 1.3, color: '#ef4444' }
        ],
        dailyAttendances: [
            { day: 'Dom', count: 8, percentage: 5.1 },
            { day: 'Seg', count: 28, percentage: 17.9 },
            { day: 'Ter', count: 32, percentage: 20.5 },
            { day: 'Qua', count: 30, percentage: 19.2 },
            { day: 'Qui', count: 35, percentage: 22.4 },
            { day: 'Sex', count: 18, percentage: 11.5 },
            { day: 'Sáb', count: 5, percentage: 3.2 }
        ]
    })

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }))
    }

    const handleExport = async (format: string) => {
        setExportLoading(format)
        setLoading(true)

        // Simular delay de exportação
        await new Promise(resolve => setTimeout(resolve, 2000))

        toast.success(`Relatório exportado em ${format.toUpperCase()}`, {
            description: `O arquivo ${format.toUpperCase()} foi baixado com sucesso.`
        })

        setLoading(false)
        setExportLoading('')
    }

    const applyFilters = async () => {
        setLoading(true)

        // Simular aplicação de filtros
        await new Promise(resolve => setTimeout(resolve, 1000))

        toast.success('Filtros aplicados com sucesso', {
            description: 'Os dados foram atualizados conforme os filtros selecionados.'
        })

        setLoading(false)
    }

    const getPeriodDates = (period: string) => {
        const now = new Date()
        switch (period) {
            case 'today':
                return { start: now, end: now }
            case 'last7days':
                return { start: subDays(now, 7), end: now }
            case 'last30days':
                return { start: subDays(now, 30), end: now }
            case 'thisMonth':
                return { start: startOfMonth(now), end: endOfMonth(now) }
            case 'thisYear':
                return { start: startOfYear(now), end: endOfYear(now) }
            default:
                return { start: subDays(now, 30), end: now }
        }
    }

    const getComparisonData = (current: number, previous: number) => {
        const difference = current - previous
        const percentage = previous > 0 ? (difference / previous) * 100 : 0
        const isPositive = difference >= 0

        return {
            difference,
            percentage: Math.abs(percentage),
            isPositive,
            trend: isPositive ? 'up' : 'down'
        }
    }

    const renderCustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-slate-200">
                    <p className="font-semibold text-slate-800 mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            <span className="font-medium">{entry.name}:</span> {entry.value}
                        </p>
                    ))}
                </div>
            )
        }
        return null
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            <Sidebar />

            <div className="lg:ml-64">
                {/* Header */}
                <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
                    <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <Link href="/atendimentos">
                                    <Button variant="outline" size="sm" className="bg-white border-slate-200 hover:bg-slate-50 transition-all duration-300 hover:scale-105 hover:shadow-md">
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Voltar
                                    </Button>
                                </Link>

                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all duration-300">
                                            <BarChart3 className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
                                                Relatórios de Atendimentos
                                            </h1>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                                                    Análise detalhada dos atendimentos realizados
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={applyFilters}
                                    disabled={loading}
                                    className="bg-white border-slate-200 hover:bg-slate-50 transition-all duration-300 hover:scale-105 hover:shadow-md"
                                >
                                    {loading ? (
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Filter className="w-4 h-4 mr-2" />
                                    )}
                                    Aplicar Filtros
                                </Button>

                                <Button
                                    onClick={() => handleExport('pdf')}
                                    disabled={loading}
                                    className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 shadow-lg shadow-blue-500/25 border-0 transition-all duration-300 hover:shadow-blue-500/40 hover:scale-105"
                                >
                                    {exportLoading === 'pdf' ? (
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Download className="w-4 h-4 mr-2" />
                                    )}
                                    Exportar PDF
                                </Button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Conteúdo */}
                <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    <div className="max-w-7xl mx-auto space-y-6">

                        {/* Filtros */}
                        <Card className="border-0 shadow-xl shadow-slate-200/60 transition-all duration-300 hover:shadow-2xl">
                            <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-100">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg">
                                        <Filter className="w-5 h-5 text-white" />
                                    </div>
                                    Filtros de Análise
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-700">Período</Label>
                                        <Select value={filters.period} onValueChange={(value) => handleFilterChange('period', value)}>
                                            <SelectTrigger className="border-slate-200 hover:border-purple-300 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
                                                <SelectItem value="today">📅 Hoje</SelectItem>
                                                <SelectItem value="last7days">📊 Últimos 7 dias</SelectItem>
                                                <SelectItem value="last30days">📈 Últimos 30 dias</SelectItem>
                                                <SelectItem value="thisMonth">🗓️ Este mês</SelectItem>
                                                <SelectItem value="thisYear">📆 Este ano</SelectItem>
                                                <SelectItem value="custom">⚙️ Personalizado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-700">Procedimento</Label>
                                        <Select value={filters.procedureId} onValueChange={(value) => handleFilterChange('procedureId', value)}>
                                            <SelectTrigger className="border-slate-200 hover:border-purple-300 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
                                                <SelectItem value="all">✨ Todos os procedimentos</SelectItem>
                                                {procedures.map((procedure) => (
                                                    <SelectItem key={procedure.id} value={procedure.id}>
                                                        {procedure.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-700">Status do Pagamento</Label>
                                        <Select value={filters.paymentStatus} onValueChange={(value) => handleFilterChange('paymentStatus', value)}>
                                            <SelectTrigger className="border-slate-200 hover:border-purple-300 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
                                                <SelectItem value="all">🎯 Todos os status</SelectItem>
                                                <SelectItem value="paid">✅ Pago</SelectItem>
                                                <SelectItem value="pending">⏳ Pendente</SelectItem>
                                                <SelectItem value="cancelled">❌ Cancelado</SelectItem>
                                                <SelectItem value="refunded">🔄 Reembolsado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-700">Ações</Label>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => handleExport('excel')}
                                                className="flex-1 bg-white border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-300 hover:scale-105"
                                                disabled={loading}
                                            >
                                                {exportLoading === 'excel' ? (
                                                    <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                                                ) : (
                                                    <FileText className="w-4 h-4 mr-1 text-emerald-600" />
                                                )}
                                                Excel
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => handleExport('csv')}
                                                className="flex-1 bg-white border-slate-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 hover:scale-105"
                                                disabled={loading}
                                            >
                                                {exportLoading === 'csv' ? (
                                                    <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                                                ) : (
                                                    <Download className="w-4 h-4 mr-1 text-blue-600" />
                                                )}
                                                CSV
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Métricas Principais */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                            {[
                                {
                                    title: 'Total de Atendimentos',
                                    value: reportData.summary.totalAttendances,
                                    icon: Heart,
                                    color: 'from-pink-500 via-rose-500 to-red-500',
                                    comparison: getComparisonData(156, 142),
                                    change: '+14'
                                },
                                {
                                    title: 'Receita Total',
                                    value: `R$ ${reportData.summary.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                                    icon: DollarSign,
                                    color: 'from-emerald-500 via-green-500 to-teal-500',
                                    comparison: getComparisonData(23450, 21200),
                                    change: '+10.6%'
                                },
                                {
                                    title: 'Ticket Médio',
                                    value: `R$ ${reportData.summary.averageTicket.toFixed(2)}`,
                                    icon: Target,
                                    color: 'from-blue-500 via-indigo-500 to-purple-500',
                                    comparison: getComparisonData(150.32, 149.30),
                                    change: '+0.7%'
                                },
                                {
                                    title: 'Avaliação Média',
                                    value: reportData.summary.averageRating.toFixed(1),
                                    icon: Star,
                                    color: 'from-yellow-500 via-amber-500 to-orange-500',
                                    comparison: getComparisonData(4.7, 4.6),
                                    change: '+0.1'
                                },
                                {
                                    title: 'Taxa de Conclusão',
                                    value: `${reportData.summary.completionRate}%`,
                                    icon: CheckCircle,
                                    color: 'from-purple-500 via-violet-500 to-purple-600',
                                    comparison: getComparisonData(94.2, 92.1),
                                    change: '+2.3%'
                                },
                                {
                                    title: 'Margem de Lucro',
                                    value: `${reportData.summary.profitMargin}%`,
                                    icon: TrendingUp,
                                    color: 'from-indigo-500 via-blue-500 to-cyan-500',
                                    comparison: getComparisonData(68.5, 65.2),
                                    change: '+5.1%'
                                }
                            ].map((metric, index) => (
                                <Card key={index} className="border-0 shadow-xl shadow-slate-200/60 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group cursor-pointer">
                                    <CardContent className="p-4 relative overflow-hidden">
                                        {/* Background gradient */}
                                        <div className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-5 group-hover:opacity-10 transition-opacity duration-500`} />

                                        <div className="relative">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${metric.color} shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                                                    <metric.icon className="w-4 h-4 text-white" />
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {metric.comparison.isPositive ? (
                                                        <ArrowUp className="w-3 h-3 text-emerald-500" />
                                                    ) : (
                                                        <ArrowDown className="w-3 h-3 text-red-500" />
                                                    )}
                                                    <span className={`text-xs font-bold ${metric.comparison.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                                                        {metric.change}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-xs font-medium text-slate-600 group-hover:text-slate-700 transition-colors">
                                                    {metric.title}
                                                </p>
                                                <p className="text-lg font-bold text-slate-900 group-hover:scale-105 transition-transform duration-300">
                                                    {metric.value}
                                                </p>
                                                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
                                                    <p className={`text-xs font-medium ${metric.comparison.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                                                        {metric.comparison.isPositive ? '+' : '-'}{metric.comparison.percentage.toFixed(1)}% vs período anterior
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Gráficos */}
                        <Tabs defaultValue="trends" className="space-y-6">
                            <TabsList className="grid w-full grid-cols-4 bg-slate-100/80 backdrop-blur-sm border-0 p-1 rounded-xl">
                                <TabsTrigger value="trends" className="data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg">
                                    📈 Tendências
                                </TabsTrigger>
                                <TabsTrigger value="procedures" className="data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg">
                                    💅 Procedimentos
                                </TabsTrigger>
                                <TabsTrigger value="analysis" className="data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg">
                                    📊 Análise
                                </TabsTrigger>
                                <TabsTrigger value="satisfaction" className="data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg">
                                    ⭐ Satisfação
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="trends" className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Gráfico de Atendimentos */}
                                    <Card className="border-0 shadow-xl shadow-slate-200/60 transition-all duration-300 hover:shadow-2xl group">
                                        <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-100">
                                            <CardTitle className="flex items-center gap-2">
                                                <div className="p-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg shadow-lg group-hover:shadow-xl transition-all duration-300">
                                                    <BarChart3 className="w-5 h-5 text-white" />
                                                </div>
                                                Atendimentos por Mês
                                                <Badge className="bg-pink-100 text-pink-700 border-pink-200 ml-auto">
                                                    +22% este mês
                                                </Badge>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <ResponsiveContainer width="100%" height={300}>
                                                <AreaChart data={reportData.trends.attendances}>
                                                    <defs>
                                                        <linearGradient id="pinkGradient" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                                                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0.05}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                    <XAxis
                                                        dataKey="month"
                                                        stroke="#64748b"
                                                        fontSize={12}
                                                        tickLine={false}
                                                    />
                                                    <YAxis
                                                        stroke="#64748b"
                                                        fontSize={12}
                                                        tickLine={false}
                                                        axisLine={false}
                                                    />
                                                    <Tooltip content={renderCustomTooltip} />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="value"
                                                        stroke="#ec4899"
                                                        fill="url(#pinkGradient)"
                                                        strokeWidth={3}
                                                        dot={{ fill: '#ec4899', strokeWidth: 2, r: 4 }}
                                                        activeDot={{ r: 6, stroke: '#ec4899', strokeWidth: 2, fill: '#fff' }}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>

                                    {/* Gráfico de Receita */}
                                    <Card className="border-0 shadow-xl shadow-slate-200/60 transition-all duration-300 hover:shadow-2xl group">
                                        <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-100">
                                            <CardTitle className="flex items-center gap-2">
                                                <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg shadow-lg group-hover:shadow-xl transition-all duration-300">
                                                    <DollarSign className="w-5 h-5 text-white" />
                                                </div>
                                                Receita por Mês
                                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 ml-auto">
                                                    +22% este mês
                                                </Badge>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={reportData.trends.revenue}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                    <XAxis
                                                        dataKey="month"
                                                        stroke="#64748b"
                                                        fontSize={12}
                                                        tickLine={false}
                                                    />
                                                    <YAxis
                                                        stroke="#64748b"
                                                        fontSize={12}
                                                        tickLine={false}
                                                        axisLine={false}
                                                    />
                                                    <Tooltip
                                                        content={renderCustomTooltip}
                                                        formatter={(value) => [`R$ ${value}`, 'Receita']}
                                                    />
                                                    <Bar
                                                        dataKey="value"
                                                        radius={[8, 8, 0, 0]}
                                                        fill="url(#emeraldGradient)"
                                                    />
                                                    <defs>
                                                        <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.6}/>
                                                        </linearGradient>
                                                    </defs>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Gráfico de Atendimentos por Dia da Semana */}
                                <Card className="border-0 shadow-xl shadow-slate-200/60 transition-all duration-300 hover:shadow-2xl">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-100">
                                        <CardTitle className="flex items-center gap-2">
                                            <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg shadow-lg">
                                                <Calendar className="w-5 h-5 text-white" />
                                            </div>
                                            Distribuição por Dia da Semana
                                            <Badge className="bg-blue-100 text-blue-700 border-blue-200 ml-auto">
                                                Quinta-feira é o dia mais movimentado
                                            </Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={reportData.dailyAttendances}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                <XAxis
                                                    dataKey="day"
                                                    stroke="#64748b"
                                                    fontSize={12}
                                                    tickLine={false}
                                                />
                                                <YAxis
                                                    stroke="#64748b"
                                                    fontSize={12}
                                                    tickLine={false}
                                                    axisLine={false}
                                                />
                                                <Tooltip content={renderCustomTooltip} />
                                                <Bar
                                                    dataKey="count"
                                                    radius={[8, 8, 0, 0]}
                                                    fill="url(#blueGradient)"
                                                />
                                                <defs>
                                                    <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.6}/>
                                                    </linearGradient>
                                                </defs>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="procedures" className="space-y-6">
                                <Card className="border-0 shadow-xl shadow-slate-200/60 transition-all duration-300 hover:shadow-2xl">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-100">
                                        <CardTitle className="flex items-center gap-2">
                                            <div className="p-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg shadow-lg">
                                                <Heart className="w-5 h-5 text-white" />
                                            </div>
                                            Performance por Procedimento
                                            <Badge className="bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 border-pink-200 ml-auto">
                                                Top 5 procedimentos
                                            </Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="space-y-6">
                                            {reportData.procedures.map((procedure, index) => (
                                                <div key={index} className="group">
                                                    <div className="p-5 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-100 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${ENHANCED_COLORS[index] ? `from-${ENHANCED_COLORS[index]} to-${ENHANCED_COLORS[index]}` : 'from-pink-500 to-rose-500'} flex items-center justify-center shadow-lg`}>
                                                                    <span className="text-white font-bold text-lg">{index + 1}</span>
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-bold text-slate-900 text-lg group-hover:text-slate-700 transition-colors">{procedure.name}</h3>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        {procedure.growth > 0 ? (
                                                                            <ArrowUp className="w-3 h-3 text-emerald-500" />
                                                                        ) : (
                                                                            <ArrowDown className="w-3 h-3 text-red-500" />
                                                                        )}
                                                                        <span className={`text-sm font-medium ${procedure.growth > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                                            {procedure.growth > 0 ? '+' : ''}{procedure.growth}% vs mês anterior
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <Badge className="bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 border-pink-200 px-3 py-1">
                                                                {procedure.attendances} atendimentos
                                                            </Badge>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-slate-100 group-hover:shadow-md transition-all duration-300">
                                                                <div className="flex items-center justify-center gap-2 mb-2">
                                                                    <DollarSign className="w-4 h-4 text-emerald-500" />
                                                                    <p className="text-sm font-medium text-slate-600">Receita Total</p>
                                                                </div>
                                                                <p className="text-xl font-bold text-emerald-600">
                                                                    R$ {procedure.revenue.toLocaleString('pt-BR')}
                                                                </p>
                                                            </div>
                                                            <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-slate-100 group-hover:shadow-md transition-all duration-300">
                                                                <div className="flex items-center justify-center gap-2 mb-2">
                                                                    <Target className="w-4 h-4 text-blue-500" />
                                                                    <p className="text-sm font-medium text-slate-600">Receita por Atendimento</p>
                                                                </div>
                                                                <p className="text-xl font-bold text-blue-600">
                                                                    R$ {(procedure.revenue / procedure.attendances).toFixed(2)}
                                                                </p>
                                                            </div>
                                                            <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-slate-100 group-hover:shadow-md transition-all duration-300">
                                                                <div className="flex items-center justify-center gap-2 mb-2">
                                                                    <Star className="w-4 h-4 text-yellow-500" />
                                                                    <p className="text-sm font-medium text-slate-600">Avaliação Média</p>
                                                                </div>
                                                                <div className="flex items-center justify-center gap-1">
                                                                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                                                    <p className="text-xl font-bold text-yellow-600">
                                                                        {procedure.avgRating}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="analysis" className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Status de Pagamento */}
                                    <Card className="border-0 shadow-xl shadow-slate-200/60 transition-all duration-300 hover:shadow-2xl">
                                        <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-100">
                                            <CardTitle className="flex items-center gap-2">
                                                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg">
                                                    <PieChart className="w-5 h-5 text-white" />
                                                </div>
                                                Status de Pagamento
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-4 mb-6">
                                                {reportData.paymentStatus.map((status, index) => (
                                                    <div key={index} className="group">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-3">
                                                                <div
                                                                    className="w-4 h-4 rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300"
                                                                    style={{ backgroundColor: status.color }}
                                                                />
                                                                <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                                                                    {status.name}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-sm text-slate-500 font-medium">{status.percentage}%</span>
                                                                <span className="text-sm font-bold text-slate-900 min-w-[3rem] text-right">{status.value}</span>
                                                            </div>
                                                        </div>
                                                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                                            <div
                                                                className="h-2 rounded-full transition-all duration-700 ease-out group-hover:shadow-lg"
                                                                style={{
                                                                    width: `${status.percentage}%`,
                                                                    backgroundColor: status.color
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <ResponsiveContainer width="100%" height={250}>
                                                <RechartsPieChart>
                                                    <Pie
                                                        dataKey="value"
                                                        data={reportData.paymentStatus}
                                                        cx="50%"
                                                        cy="50%"
                                                        outerRadius={80}
                                                        innerRadius={40}
                                                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                                                        stroke="white"
                                                        strokeWidth={2}
                                                    >
                                                        {reportData.paymentStatus.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip content={renderCustomTooltip} />
                                                </RechartsPieChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>

                                    {/* Indicadores de Performance */}
                                    <Card className="border-0 shadow-xl shadow-slate-200/60 transition-all duration-300 hover:shadow-2xl">
                                        <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-100">
                                            <CardTitle className="flex items-center gap-2">
                                                <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg shadow-lg">
                                                    <Target className="w-5 h-5 text-white" />
                                                </div>
                                                Indicadores de Performance
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-6">
                                                {[
                                                    { label: 'Taxa de Conclusão', value: 94.2, color: 'emerald', icon: CheckCircle },
                                                    { label: 'Taxa de Satisfação', value: 85.9, color: 'yellow', icon: Star },
                                                    { label: 'Taxa de Pagamento', value: 91.0, color: 'blue', icon: DollarSign },
                                                    { label: 'Margem de Lucro', value: 68.5, color: 'purple', icon: TrendingUp }
                                                ].map((indicator, index) => (
                                                    <div key={index} className="group">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <div className="flex items-center gap-3">
                                                                <indicator.icon className={`w-4 h-4 text-${indicator.color}-500`} />
                                                                <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                                                                    {indicator.label}
                                                                </span>
                                                            </div>
                                                            <span className={`text-sm font-bold text-${indicator.color}-600 group-hover:scale-105 transition-transform duration-300`}>
                                                                {indicator.value}%
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                                                            <div
                                                                className={`bg-gradient-to-r from-${indicator.color}-400 to-${indicator.color}-500 h-3 rounded-full transition-all duration-700 ease-out group-hover:shadow-lg`}
                                                                style={{ width: `${indicator.value}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            <TabsContent value="satisfaction" className="space-y-6">
                                <Card className="border-0 shadow-xl shadow-slate-200/60 transition-all duration-300 hover:shadow-2xl">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-100">
                                        <CardTitle className="flex items-center gap-2">
                                            <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg shadow-lg">
                                                <Award className="w-5 h-5 text-white" />
                                            </div>
                                            Distribuição de Avaliações
                                            <Badge className="bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 border-yellow-200 ml-auto">
                                                85.9% satisfação (4+ estrelas)
                                            </Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="space-y-6">
                                            {reportData.ratings.map((rating, index) => (
                                                <div key={index} className="group">
                                                    <div className="flex items-center gap-4 mb-3">
                                                        <div className="w-24 flex items-center gap-1">
                                                            {[...Array(5)].map((_, starIndex) => (
                                                                <Star
                                                                    key={starIndex}
                                                                    className={`w-3 h-3 ${
                                                                        starIndex < (5 - index)
                                                                            ? 'text-yellow-400 fill-current'
                                                                            : 'text-slate-300'
                                                                    }`}
                                                                />
                                                            ))}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors min-w-[4rem]">
                                                                    {rating.rating}
                                                                </span>
                                                                <div className="flex-1 bg-slate-200 rounded-full h-3 overflow-hidden">
                                                                    <div
                                                                        className="h-3 rounded-full transition-all duration-700 ease-out group-hover:shadow-lg"
                                                                        style={{
                                                                            width: `${rating.percentage}%`,
                                                                            backgroundColor: rating.color
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="text-sm font-medium text-slate-700 w-12 text-center group-hover:scale-105 transition-transform duration-300">
                                                                    {rating.count}
                                                                </div>
                                                                <div className="text-sm text-slate-500 w-12 text-right">
                                                                    {rating.percentage}%
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-slate-100">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="text-center p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-100">
                                                    <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                                                        <Star className="w-6 h-6 text-white" />
                                                    </div>
                                                    <p className="text-3xl font-bold text-yellow-600 mb-1">4.7</p>
                                                    <p className="text-sm font-medium text-slate-600">Avaliação Média</p>
                                                </div>
                                                <div className="text-center p-6 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-100">
                                                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                                                        <TrendingUp className="w-6 h-6 text-white" />
                                                    </div>
                                                    <p className="text-3xl font-bold text-emerald-600 mb-1">85.9%</p>
                                                    <p className="text-sm font-medium text-slate-600">Satisfação (4+ estrelas)</p>
                                                </div>
                                                <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                                                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                                                        <Users className="w-6 h-6 text-white" />
                                                    </div>
                                                    <p className="text-3xl font-bold text-blue-600 mb-1">134</p>
                                                    <p className="text-sm font-medium text-slate-600">Clientes Avaliaram</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default RelatorioAtendimentosPage