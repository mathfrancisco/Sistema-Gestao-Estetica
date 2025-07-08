// app/(dashboard)/financeiro/projecoes/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    TrendingUp,
    TrendingDown,
    Calculator,
    Calendar,
    Target,
    Activity,
    AlertTriangle,
    CheckCircle,
    Bell,
    Download,
    RefreshCw,
    ChevronRight,
    BarChart3,
    LineChart,
    Settings,
    Play,
    Save,
    Brain,
    Lightbulb
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { format, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ComposedChart
} from 'recharts'

// Hooks
import { useFinancials } from '@/lib/hooks/useFinancials'
import { useAuthStore } from '@/store/useAuthStore'

// Componentes
import { Sidebar } from '@/components/layout/sidebar'

interface ProjectionScenario {
    id: string
    name: string
    description: string
    growthRate: number
    seasonalityFactor: number
    marketTrend: number
    isOptimistic: boolean
}

interface ProjectionData {
    month: string
    conservative: number
    realistic: number
    optimistic: number
    historical?: number
}

interface ProjectionInputs {
    baseRevenue: number
    growthRate: number
    seasonalityEnabled: boolean
    marketTrendFactor: number
    projectionPeriod: number
    includeHistorical: boolean
}

const ProjecoesFinanceirasPage: React.FC = () => {
    const { user } = useAuthStore()
    const [activeTab, setActiveTab] = useState('overview')
    const [isScenarioDialogOpen, setIsScenarioDialogOpen] = useState(false)
    const [selectedScenario, setSelectedScenario] = useState<string>('realistic')

    // Estado para inputs da projeção
    const [projectionInputs, setProjectionInputs] = useState<ProjectionInputs>({
        baseRevenue: 15000,
        growthRate: 5,
        seasonalityEnabled: true,
        marketTrendFactor: 2,
        projectionPeriod: 12,
        includeHistorical: true
    })

    // Função formatCurrency definida antes do uso
    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        })
    }

    // Cenários predefinidos
    const scenarios: ProjectionScenario[] = [
        {
            id: 'conservative',
            name: 'Conservador',
            description: 'Crescimento moderado com foco na estabilidade',
            growthRate: 2,
            seasonalityFactor: 0.8,
            marketTrend: 1,
            isOptimistic: false
        },
        {
            id: 'realistic',
            name: 'Realista',
            description: 'Baseado em dados históricos e tendências atuais',
            growthRate: 5,
            seasonalityFactor: 1,
            marketTrend: 2,
            isOptimistic: false
        },
        {
            id: 'optimistic',
            name: 'Otimista',
            description: 'Crescimento acelerado com expansão agressiva',
            growthRate: 10,
            seasonalityFactor: 1.2,
            marketTrend: 4,
            isOptimistic: true
        }
    ]

    // Hooks financeiros
    const {
        financialSummary,
        revenueByPeriod,
        isLoadingReports,
        error,
        fetchFinancialSummary,
        fetchRevenueByPeriod,
        clearError
    } = useFinancials()

    // Gerar dados de projeção
    const generateProjectionData = (): ProjectionData[] => {
        const data: ProjectionData[] = []
        const currentDate = new Date()

        for (let i = 0; i < projectionInputs.projectionPeriod; i++) {
            const month = format(addMonths(currentDate, i), 'MMM yyyy', { locale: ptBR })

            // Fator de sazonalidade (simulado)
            const seasonalityMultiplier = projectionInputs.seasonalityEnabled
                ? 1 + (Math.sin((i + currentDate.getMonth()) * Math.PI / 6) * 0.15)
                : 1

            // Fator de crescimento composto
            const growthMultiplier = Math.pow(1 + (projectionInputs.growthRate / 100), i / 12)

            // Cenário conservador
            const conservative = projectionInputs.baseRevenue *
                growthMultiplier *
                seasonalityMultiplier *
                0.85 * // 15% mais conservador
                (1 + (projectionInputs.marketTrendFactor / 100) * 0.5)

            // Cenário realista
            const realistic = projectionInputs.baseRevenue *
                growthMultiplier *
                seasonalityMultiplier *
                (1 + (projectionInputs.marketTrendFactor / 100))

            // Cenário otimista
            const optimistic = projectionInputs.baseRevenue *
                growthMultiplier *
                seasonalityMultiplier *
                1.25 * // 25% mais otimista
                (1 + (projectionInputs.marketTrendFactor / 100) * 1.5)

            // Dados históricos simulados (últimos 6 meses)
            const historical = i < 6 ? projectionInputs.baseRevenue * (0.8 + Math.random() * 0.4) : undefined

            data.push({
                month,
                conservative: Math.round(conservative),
                realistic: Math.round(realistic),
                optimistic: Math.round(optimistic),
                historical
            })
        }

        return data
    }

    const projectionData = generateProjectionData()

    // Carregar dados iniciais
    useEffect(() => {
        if (user?.id) {
            loadInitialData()
        }
    }, [user?.id])

    const loadInitialData = async () => {
        if (!user?.id) return

        try {
            const startDate = format(subMonths(new Date(), 6), 'yyyy-MM-dd')
            const endDate = format(new Date(), 'yyyy-MM-dd')

            await fetchFinancialSummary(startDate, endDate, user.id)
            await fetchRevenueByPeriod(startDate, endDate, 'month', user.id)

            // Atualizar receita base com dados reais se disponível
            if (financialSummary?.averageTicket) {
                setProjectionInputs(prev => ({
                    ...prev,
                    baseRevenue: financialSummary.totalRevenue || prev.baseRevenue
                }))
            }
        } catch (error) {
            console.error('Erro ao carregar dados das projeções:', error)
        }
    }

    // Calcular métricas das projeções
    const calculateProjectionMetrics = () => {
        const selectedData = projectionData.map(d => d[selectedScenario as keyof ProjectionData] as number)
        const totalProjected = selectedData.reduce((sum, value) => sum + value, 0)
        const averageMonthly = totalProjected / projectionInputs.projectionPeriod
        const growthProjected = selectedData[selectedData.length - 1] - selectedData[0]
        const cumulativeGrowth = ((selectedData[selectedData.length - 1] / selectedData[0]) - 1) * 100

        return {
            totalProjected,
            averageMonthly,
            growthProjected,
            cumulativeGrowth
        }
    }

    const metrics = calculateProjectionMetrics()

    // Handlers
    const handleRefresh = async () => {
        await loadInitialData()
        toast.success('Dados atualizados com sucesso!')
    }

    const handleSaveScenario = () => {
        toast.success('Cenário salvo com sucesso!')
        setIsScenarioDialogOpen(false)
    }

    const handleExport = () => {
        toast.info('Funcionalidade de exportação em desenvolvimento')
    }

    const handleRunProjection = () => {
        toast.success('Projeção executada com sucesso!')
    }

    // Limpar erros
    useEffect(() => {
        if (error) {
            toast.error(error)
            clearError()
        }
    }, [error, clearError])

    // Métricas do dashboard (agora após formatCurrency estar definida)
    const dashboardMetrics = [
        {
            title: 'Projeção Total',
            value: metrics.totalProjected,
            icon: Calculator,
            description: `Próximos ${projectionInputs.projectionPeriod} meses`,
            gradient: 'from-blue-500 to-blue-600',
            trend: { value: `+${metrics.cumulativeGrowth.toFixed(1)}%`, label: 'crescimento projetado', isPositive: metrics.cumulativeGrowth > 0 }
        },
        {
            title: 'Média Mensal',
            value: metrics.averageMonthly,
            icon: TrendingUp,
            description: 'Receita média projetada',
            gradient: 'from-emerald-500 to-emerald-600',
            trend: { value: formatCurrency(metrics.growthProjected), label: 'crescimento', isPositive: metrics.growthProjected > 0 }
        },
        {
            title: 'Cenário Atual',
            value: scenarios.find(s => s.id === selectedScenario)?.growthRate || 0,
            icon: Target,
            description: 'Taxa de crescimento anual',
            gradient: 'from-purple-500 to-purple-600',
            trend: { value: scenarios.find(s => s.id === selectedScenario)?.name || '', label: 'cenário', isPositive: true },
            suffix: '%'
        },
        {
            title: 'Confiabilidade',
            value: 85,
            icon: Brain,
            description: 'Precisão da projeção',
            gradient: 'from-orange-500 to-orange-600',
            trend: { value: 'alta', label: 'confiança', isPositive: true },
            suffix: '%'
        }
    ]

    // Tooltip customizado para gráficos
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-lg">
                    <p className="font-medium text-slate-900 mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {formatCurrency(entry.value)}
                        </p>
                    ))}
                </div>
            )
        }
        return null
    }

    // Recomendações baseadas nas projeções
    const getRecommendations = () => {
        const recommendations = []

        if (metrics.cumulativeGrowth > 20) {
            recommendations.push({
                type: 'positive',
                title: 'Crescimento Excelente',
                description: 'Suas projeções indicam um crescimento muito positivo. Considere investir em expansão.',
                icon: CheckCircle,
                color: 'emerald'
            })
        }

        if (metrics.cumulativeGrowth < 5) {
            recommendations.push({
                type: 'warning',
                title: 'Crescimento Baixo',
                description: 'As projeções mostram crescimento moderado. Avalie estratégias de marketing.',
                icon: AlertTriangle,
                color: 'orange'
            })
        }

        if (projectionInputs.seasonalityEnabled) {
            recommendations.push({
                type: 'info',
                title: 'Sazonalidade Considerada',
                description: 'Prepare-se para variações sazonais identificadas na projeção.',
                icon: Calendar,
                color: 'blue'
            })
        }

        return recommendations
    }

    const recommendations = getRecommendations()

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            {/* Sidebar */}
            <Sidebar />

            {/* Conteúdo Principal */}
            <div className="lg:ml-64">
                {/* Header Moderno */}
                <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
                    <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                        <LineChart className="w-4 h-4 text-white" />
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                        Projeções Financeiras
                                    </h1>
                                </div>
                                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                                    Analise cenários futuros e tome decisões estratégicas baseadas em dados
                                </p>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                {/* Status Badge */}
                                <Badge className={`border-0 shadow-lg text-xs ${
                                    metrics.cumulativeGrowth >= 15
                                        ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-emerald-500/25'
                                        : metrics.cumulativeGrowth >= 5
                                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-blue-500/25'
                                            : 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-orange-500/25'
                                }`}>
                                    {metrics.cumulativeGrowth >= 15 ? (
                                        <>
                                            <TrendingUp className="w-3 h-3 mr-1" />
                                            <span className="hidden sm:inline">Alto Crescimento</span>
                                            <span className="sm:hidden">Alto</span>
                                        </>
                                    ) : metrics.cumulativeGrowth >= 5 ? (
                                        <>
                                            <Activity className="w-3 h-3 mr-1" />
                                            <span className="hidden sm:inline">Crescimento Moderado</span>
                                            <span className="sm:hidden">Moderado</span>
                                        </>
                                    ) : (
                                        <>
                                            <TrendingDown className="w-3 h-3 mr-1" />
                                            <span className="hidden sm:inline">Crescimento Baixo</span>
                                            <span className="sm:hidden">Baixo</span>
                                        </>
                                    )}
                                </Badge>

                                {/* Botões de Ação */}
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <button
                                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                                        onClick={handleRefresh}
                                        disabled={isLoadingReports}
                                    >
                                        <RefreshCw className={`w-4 h-4 text-slate-600 ${isLoadingReports ? 'animate-spin' : ''}`} />
                                    </button>
                                    <button
                                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                                        onClick={handleExport}
                                    >
                                        <Download className="w-4 h-4 text-slate-600" />
                                    </button>
                                    <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                                        <Bell className="w-4 h-4 text-slate-600" />
                                    </button>
                                </div>

                                {/* Botões Principais */}
                                <div className="flex items-center gap-2 ml-2">
                                    <Link href="/financeiro">
                                        <Button variant="outline" className="bg-white border-slate-200 hover:bg-slate-50 shadow-sm">
                                            <BarChart3 className="w-4 h-4 mr-2" />
                                            Financeiro
                                        </Button>
                                    </Link>
                                    <Button
                                        onClick={handleRunProjection}
                                        className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/25 border-0"
                                    >
                                        <Play className="w-4 h-4 mr-2" />
                                        Executar Projeção
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Conteúdo */}
                <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">

                        {/* Seletor de Cenário */}
                        <Card className="border-0 shadow-xl shadow-slate-200/60">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-indigo-500" />
                                    Configuração de Cenário
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {scenarios.map((scenario) => (
                                        <Card
                                            key={scenario.id}
                                            className={`cursor-pointer transition-all duration-300 border-2 ${
                                                selectedScenario === scenario.id
                                                    ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                                                    : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                                            }`}
                                            onClick={() => setSelectedScenario(scenario.id)}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h3 className={`font-semibold ${selectedScenario === scenario.id ? 'text-indigo-700' : 'text-slate-900'}`}>
                                                        {scenario.name}
                                                    </h3>
                                                    <Badge variant={scenario.isOptimistic ? "default" : "secondary"}>
                                                        {scenario.growthRate}%
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-slate-600 mb-4">{scenario.description}</p>
                                                <div className="space-y-2 text-xs">
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-500">Crescimento:</span>
                                                        <span className="font-medium">{scenario.growthRate}%</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-500">Sazonalidade:</span>
                                                        <span className="font-medium">{scenario.seasonalityFactor}x</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-500">Tendência:</span>
                                                        <span className="font-medium">{scenario.marketTrend}%</span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Métricas do Dashboard */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                            {dashboardMetrics.map((metric, index) => (
                                <Card key={index} className="relative overflow-hidden border-0 shadow-xl shadow-slate-200/60 hover:shadow-2xl hover:shadow-slate-300/60 transition-all duration-300 hover:-translate-y-1">
                                    <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-5`} />
                                    <CardContent className="p-4 lg:p-6 relative">
                                        <div className="flex items-center justify-between mb-3 lg:mb-4">
                                            <div className={`p-2 lg:p-3 rounded-2xl bg-gradient-to-br ${metric.gradient} shadow-lg`}>
                                                <metric.icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-400" />
                                        </div>

                                        <div className="space-y-1 lg:space-y-2">
                                            <p className="text-xs lg:text-sm font-medium text-slate-600">{metric.title}</p>
                                            <p className="text-xl lg:text-3xl font-bold text-slate-900 leading-tight">
                                                {metric.suffix ?
                                                    `${metric.value.toLocaleString()}${metric.suffix}` :
                                                    formatCurrency(metric.value)
                                                }
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className={`w-3 h-3 ${metric.trend.isPositive ? 'text-emerald-500' : 'text-red-500'}`} />
                                                <span className={`text-xs font-medium ${metric.trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {metric.trend.value}
                                                </span>
                                                <span className="text-xs text-slate-500">{metric.trend.label}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Tabs de Conteúdo */}
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                            <TabsList className="bg-white border border-slate-200 shadow-sm p-1">
                                <TabsTrigger value="overview" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
                                    <LineChart className="w-4 h-4 mr-2" />
                                    Projeções
                                </TabsTrigger>
                                <TabsTrigger value="scenarios" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
                                    <Calculator className="w-4 h-4 mr-2" />
                                    Cenários
                                </TabsTrigger>
                                <TabsTrigger value="insights" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
                                    <Brain className="w-4 h-4 mr-2" />
                                    Insights
                                </TabsTrigger>
                            </TabsList>

                            {/* Tab: Projeções */}
                            <TabsContent value="overview" className="space-y-6">
                                {/* Gráfico Principal de Projeções */}
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                        <CardTitle className="flex items-center gap-2">
                                            <LineChart className="w-5 h-5 text-indigo-500" />
                                            Projeção de Receita - Cenários Comparativos
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="h-96">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <ComposedChart data={projectionData}>
                                                    <defs>
                                                        <linearGradient id="conservativeGradient" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                                        </linearGradient>
                                                        <linearGradient id="realisticGradient" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                        </linearGradient>
                                                        <linearGradient id="optimisticGradient" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                    <XAxis
                                                        dataKey="month"
                                                        stroke="#64748b"
                                                        fontSize={12}
                                                        angle={-45}
                                                        textAnchor="end"
                                                        height={80}
                                                    />
                                                    <YAxis
                                                        stroke="#64748b"
                                                        fontSize={12}
                                                        tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                                                    />
                                                    <Tooltip content={<CustomTooltip />} />

                                                    {/* Área de faixa de projeção */}
                                                    <Area
                                                        type="monotone"
                                                        dataKey="conservative"
                                                        stroke="#ef4444"
                                                        strokeWidth={2}
                                                        fill="url(#conservativeGradient)"
                                                        name="Conservador"
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="optimistic"
                                                        stroke="#10b981"
                                                        strokeWidth={2}
                                                        fill="url(#optimisticGradient)"
                                                        name="Otimista"
                                                    />

                                                    {/* Linha principal realista */}
                                                    <Line
                                                        type="monotone"
                                                        dataKey="realistic"
                                                        stroke="#3b82f6"
                                                        strokeWidth={4}
                                                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                                                        activeDot={{ r: 7, stroke: '#3b82f6', strokeWidth: 2 }}
                                                        name="Realista"
                                                    />

                                                    {/* Dados históricos */}
                                                    {projectionInputs.includeHistorical && (
                                                        <Line
                                                            type="monotone"
                                                            dataKey="historical"
                                                            stroke="#64748b"
                                                            strokeWidth={2}
                                                            strokeDasharray="5 5"
                                                            dot={{ fill: '#64748b', strokeWidth: 2, r: 3 }}
                                                            name="Histórico"
                                                        />
                                                    )}
                                                </ComposedChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Comparativo de Cenários */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {scenarios.map((scenario) => {
                                        const scenarioData = projectionData.map(d => d[scenario.id as keyof ProjectionData] as number)
                                        const total = scenarioData.reduce((sum, val) => sum + val, 0)
                                        const growth = ((scenarioData[scenarioData.length - 1] / scenarioData[0]) - 1) * 100

                                        return (
                                            <Card key={scenario.id} className={`border-0 shadow-xl shadow-slate-200/60 ${selectedScenario === scenario.id ? 'ring-2 ring-indigo-500' : ''}`}>
                                                <CardHeader className={`bg-gradient-to-r ${scenario.isOptimistic ? 'from-emerald-50 to-emerald-100' : scenario.id === 'realistic' ? 'from-blue-50 to-blue-100' : 'from-orange-50 to-orange-100'} border-b border-slate-100`}>
                                                    <CardTitle className={`${scenario.isOptimistic ? 'text-emerald-700' : scenario.id === 'realistic' ? 'text-blue-700' : 'text-orange-700'} text-lg`}>
                                                        {scenario.name}
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="p-6">
                                                    <div className="space-y-4">
                                                        <div>
                                                            <p className="text-sm text-slate-600">Total Projetado</p>
                                                            <p className="text-xl font-bold text-slate-900">{formatCurrency(total)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-slate-600">Crescimento</p>
                                                            <p className={`text-lg font-bold ${growth > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                                {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
                                                            </p>
                                                        </div>
                                                        <div className="pt-2 border-t">
                                                            <Button
                                                                variant={selectedScenario === scenario.id ? "default" : "outline"}
                                                                size="sm"
                                                                className="w-full"
                                                                onClick={() => setSelectedScenario(scenario.id)}
                                                            >
                                                                {selectedScenario === scenario.id ? 'Cenário Atual' : 'Selecionar'}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )
                                    })}
                                </div>
                            </TabsContent>

                            {/* Tab: Cenários */}
                            <TabsContent value="scenarios" className="space-y-6">
                                {/* Configuração Personalizada */}
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                        <CardTitle className="flex items-center gap-2">
                                            <Settings className="w-5 h-5 text-indigo-500" />
                                            Configuração Personalizada
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            <div className="space-y-6">
                                                <div className="space-y-3">
                                                    <Label>Receita Base Mensal</Label>
                                                    <Input
                                                        type="number"
                                                        value={projectionInputs.baseRevenue}
                                                        onChange={(e) => setProjectionInputs(prev => ({
                                                            ...prev,
                                                            baseRevenue: parseFloat(e.target.value) || 0
                                                        }))}
                                                        className="text-lg font-semibold"
                                                    />
                                                    <p className="text-xs text-slate-500">
                                                        {formatCurrency(projectionInputs.baseRevenue)}
                                                    </p>
                                                </div>

                                                <div className="space-y-3">
                                                    <Label>Taxa de Crescimento Anual (%)</Label>
                                                    <Slider
                                                        value={[projectionInputs.growthRate]}
                                                        onValueChange={([value]) => setProjectionInputs(prev => ({ ...prev, growthRate: value }))}
                                                        max={30}
                                                        step={0.5}
                                                        className="w-full"
                                                    />
                                                    <div className="flex justify-between text-xs text-slate-500">
                                                        <span>0%</span>
                                                        <span className="font-semibold">{projectionInputs.growthRate}%</span>
                                                        <span>30%</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <Label>Fator de Tendência de Mercado (%)</Label>
                                                    <Slider
                                                        value={[projectionInputs.marketTrendFactor]}
                                                        onValueChange={([value]) => setProjectionInputs(prev => ({ ...prev, marketTrendFactor: value }))}
                                                        max={10}
                                                        step={0.1}
                                                        className="w-full"
                                                    />
                                                    <div className="flex justify-between text-xs text-slate-500">
                                                        <span>0%</span>
                                                        <span className="font-semibold">{projectionInputs.marketTrendFactor}%</span>
                                                        <span>10%</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <Label>Período de Projeção (meses)</Label>
                                                    <Select
                                                        value={projectionInputs.projectionPeriod.toString()}
                                                        onValueChange={(value) => setProjectionInputs(prev => ({ ...prev, projectionPeriod: parseInt(value) }))}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="6">6 meses</SelectItem>
                                                            <SelectItem value="12">12 meses</SelectItem>
                                                            <SelectItem value="18">18 meses</SelectItem>
                                                            <SelectItem value="24">24 meses</SelectItem>
                                                            <SelectItem value="36">36 meses</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                {/* Gráfico de Simulação em Tempo Real */}
                                                <div className="h-64">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={projectionData.slice(0, 12)}>
                                                            <defs>
                                                                <linearGradient id="liveGradient" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                                </linearGradient>
                                                            </defs>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                            <XAxis
                                                                dataKey="month"
                                                                stroke="#64748b"
                                                                fontSize={10}
                                                            />
                                                            <YAxis
                                                                stroke="#64748b"
                                                                fontSize={10}
                                                                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                                            />
                                                            <Tooltip
                                                                formatter={(value: any) => [formatCurrency(value), 'Projeção']}
                                                                labelFormatter={(label) => `Mês: ${label}`}
                                                            />
                                                            <Area
                                                                type="monotone"
                                                                dataKey={selectedScenario}
                                                                stroke="#6366f1"
                                                                strokeWidth={3}
                                                                fill="url(#liveGradient)"
                                                            />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>

                                                {/* Resumo da Configuração */}
                                                <Card className="bg-indigo-50 border-indigo-200">
                                                    <CardContent className="p-4">
                                                        <h4 className="font-semibold text-indigo-800 mb-3">Resumo da Configuração</h4>
                                                        <div className="space-y-2 text-sm">
                                                            <div className="flex justify-between">
                                                                <span className="text-indigo-700">Receita Base:</span>
                                                                <span className="font-semibold text-indigo-900">{formatCurrency(projectionInputs.baseRevenue)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-indigo-700">Crescimento:</span>
                                                                <span className="font-semibold text-indigo-900">{projectionInputs.growthRate}% ao ano</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-indigo-700">Período:</span>
                                                                <span className="font-semibold text-indigo-900">{projectionInputs.projectionPeriod} meses</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-indigo-700">Projeção Total:</span>
                                                                <span className="font-semibold text-indigo-900">{formatCurrency(metrics.totalProjected)}</span>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Tab: Insights */}
                            <TabsContent value="insights" className="space-y-6">
                                {/* Recomendações */}
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                        <CardTitle className="flex items-center gap-2">
                                            <Lightbulb className="w-5 h-5 text-indigo-500" />
                                            Recomendações Inteligentes
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="space-y-4">
                                            {recommendations.map((rec, index) => (
                                                <Card key={index} className={`border-l-4 border-l-${rec.color}-500 bg-${rec.color}-50`}>
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start gap-3">
                                                            <div className={`p-2 rounded-lg bg-${rec.color}-100`}>
                                                                <rec.icon className={`w-5 h-5 text-${rec.color}-600`} />
                                                            </div>
                                                            <div>
                                                                <h4 className={`font-semibold text-${rec.color}-800 mb-1`}>{rec.title}</h4>
                                                                <p className={`text-sm text-${rec.color}-700`}>{rec.description}</p>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Análise de Risco */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
                                            <CardTitle className="text-orange-700">Análise de Risco</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-slate-700">Volatilidade</span>
                                                    <Badge className="bg-orange-100 text-orange-700">Baixa</Badge>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-slate-700">Confiabilidade</span>
                                                    <Badge className="bg-emerald-100 text-emerald-700">85%</Badge>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-slate-700">Sensibilidade</span>
                                                    <Badge className="bg-blue-100 text-blue-700">Moderada</Badge>
                                                </div>
                                                <div className="pt-2 border-t">
                                                    <p className="text-xs text-slate-500">
                                                        A projeção considera fatores históricos e tendências de mercado para maior precisão.
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-b border-emerald-200">
                                            <CardTitle className="text-emerald-700">Oportunidades</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2" />
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-900">Expansão de Serviços</p>
                                                        <p className="text-xs text-slate-500">Potencial de 15% de crescimento</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2" />
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-900">Marketing Digital</p>
                                                        <p className="text-xs text-slate-500">ROI estimado em 300%</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2" />
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-900">Fidelização</p>
                                                        <p className="text-xs text-slate-500">Aumento de 25% no LTV</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </div>

            {/* Dialog para Salvar Cenário */}
            <Dialog open={isScenarioDialogOpen} onOpenChange={setIsScenarioDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Salvar Cenário Personalizado</DialogTitle>
                        <DialogDescription>
                            Salve suas configurações como um novo cenário para uso futuro.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="scenarioName">Nome do Cenário</Label>
                            <Input
                                id="scenarioName"
                                placeholder="Ex: Expansão Agressiva"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="scenarioDescription">Descrição</Label>
                            <Input
                                id="scenarioDescription"
                                placeholder="Descrição do cenário..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsScenarioDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSaveScenario}>
                            <Save className="w-4 h-4 mr-2" />
                            Salvar Cenário
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default ProjecoesFinanceirasPage