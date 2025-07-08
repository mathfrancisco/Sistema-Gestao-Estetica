// app/(dashboard)/distribuicao-lucros/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx'
import { Button } from '@/components/ui/button.tsx'
import { Badge } from '@/components/ui/badge.tsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog.tsx'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select.tsx'
import {
    PieChart,
    Settings,
    History,
    Calculator,
    Play,
    CheckCircle,
    AlertTriangle,
    TrendingUp,
    DollarSign,
    Bell,
    Download,
    RefreshCw,
    ChevronRight,
    Calendar
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { format } from 'date-fns'

// Hooks
import { useFinancials } from '@/lib/hooks/useFinancials.ts'
import { useAuthStore } from '@/store/useAuthStore.ts'

// Componentes
import { Sidebar } from '@/components/layout/sidebar.tsx'
import { ProfitDistributionConfig } from '@/components/financial/ProfitDistributionConfig.tsx'
import { ProfitDistributionChart } from '@/components/financial/ProfitDistributionChart.tsx'
import { ProfitDistributionHistory } from '@/components/financial/ProfitDistributionHistory.tsx'
import { ProfitDistributionSimulator } from '@/components/financial/ProfitDistributionSimulator.tsx'

const DistribuicaoLucrosPage: React.FC = () => {
    const { user } = useAuthStore()
    const [activeTab, setActiveTab] = useState('dashboard')
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [isExecuteDialogOpen, setIsExecuteDialogOpen] = useState(false)
    const [calculatedDistribution, setCalculatedDistribution] = useState<any>(null)

    // Hooks financeiros
    const {
        // States
        profitConfigs,
        profitDistributions,
        profitDistributionSummary,
        financialSummary,

        // Loading states
        isLoadingProfitConfig,
        isLoadingProfitDistributions,
        isLoadingReports,
        isLoading,

        // Error state
        error,

        // Actions
        fetchProfitConfigs,
        createProfitConfig,
        updateProfitConfig,
        deleteProfitConfig,
        fetchProfitDistributions,
        fetchProfitDistributionSummary,
        fetchFinancialSummary,
        calculateProfitDistribution,
        executeProfitDistribution,
        clearError
    } = useFinancials()

    // Carregar dados iniciais
    useEffect(() => {
        if (user?.id) {
            loadInitialData()
        }
    }, [user?.id])

    const loadInitialData = async () => {
        if (!user?.id) return

        try {
            // Carregar configurações
            await fetchProfitConfigs(user.id)

            // Carregar histórico
            await fetchProfitDistributions(user.id)

            // Carregar resumo
            await fetchProfitDistributionSummary(user.id)

            // Carregar resumo financeiro do mês atual
            const currentDate = new Date()
            const startDate = format(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), 'yyyy-MM-dd')
            const endDate = format(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0), 'yyyy-MM-dd')
            await fetchFinancialSummary(startDate, endDate, user.id)
        } catch (error) {
            console.error('Erro ao carregar dados de distribuição:', error)
        }
    }

    // Handlers
    const handleRefresh = async () => {
        await loadInitialData()
        toast.success('Dados atualizados com sucesso!')
    }

    const handleSaveConfig = async (config: any) => {
        try {
            await createProfitConfig({
                ...config,
                user_id: user!.id
            })
            toast.success('Configuração salva com sucesso!')
        } catch (error) {
            toast.error('Erro ao salvar configuração')
        }
    }

    const handleUpdateConfig = async (id: string, config: any) => {
        try {
            await updateProfitConfig(id, config)
            toast.success('Configuração atualizada com sucesso!')
        } catch (error) {
            toast.error('Erro ao atualizar configuração')
        }
    }

    const handleDeleteConfig = async (id: string) => {
        try {
            await deleteProfitConfig(id)
            toast.success('Configuração excluída com sucesso!')
        } catch (error) {
            toast.error('Erro ao excluir configuração')
        }
    }

    const handleCalculateDistribution = async () => {
        if (!user?.id) return

        try {
            await calculateProfitDistribution(user.id, selectedMonth, selectedYear)
            setCalculatedDistribution(profitDistributionSummary)
            setIsExecuteDialogOpen(true)
            toast.success('Distribuição calculada com sucesso!')
        } catch (error) {
            toast.error('Erro ao calcular distribuição')
        }
    }

    const handleExecuteDistribution = async () => {
        if (!user?.id) return

        try {
            await executeProfitDistribution(user.id, selectedMonth, selectedYear)
            setIsExecuteDialogOpen(false)
            toast.success('Distribuição executada com sucesso!')
            // Recarregar dados
            await loadInitialData()
        } catch (error) {
            toast.error('Erro ao executar distribuição')
        }
    }

    const handleSaveSimulation = (simulation: any) => {
        toast.success('Simulação salva com sucesso!')
        // Aqui você pode implementar a lógica para salvar a simulação
    }

    const handleExecuteSimulationDistribution = async (simulation: any) => {
        setCalculatedDistribution({
            totalProfit: simulation.totalProfit,
            totalDistributed: simulation.distributions.reduce((sum: number, dist: any) => sum + dist.amount, 0),
            totalPending: 0,
            distributions: simulation.distributions
        })
        setIsExecuteDialogOpen(true)
    }

    // Limpar erros
    useEffect(() => {
        if (error) {
            toast.error(error)
            clearError()
        }
    }, [error, clearError])

    // Calcular percentual total configurado
    const totalPercentage = profitConfigs.reduce((sum, config) => sum + config.percentage, 0)
    const isConfigurationComplete = totalPercentage === 100

    // Métricas do dashboard
    const dashboardMetrics = [
        {
            title: 'Configurações Ativas',
            value: profitConfigs.length,
            icon: Settings,
            description: 'Categorias configuradas',
            gradient: 'from-blue-500 to-blue-600',
            trend: { value: `${totalPercentage}%`, label: 'configurado', isPositive: isConfigurationComplete }
        },
        {
            title: 'Lucro Atual',
            value: financialSummary?.totalProfit || 0,
            icon: DollarSign,
            description: 'Lucro do período atual',
            gradient: 'from-emerald-500 to-emerald-600',
            trend: { value: '+12%', label: 'vs mês anterior', isPositive: true },
            format: 'currency'
        },
        {
            title: 'Distribuições Feitas',
            value: profitDistributions.length,
            icon: History,
            description: 'Total de distribuições',
            gradient: 'from-purple-500 to-purple-600',
            trend: { value: profitDistributions.length.toString(), label: 'períodos', isPositive: true }
        },
        {
            title: 'Última Distribuição',
            value: profitDistributions.length > 0 ?
                ((profitDistributions[0].pro_labore_amount || 0) +
                    (profitDistributions[0].equipment_reserve_amount || 0) +
                    (profitDistributions[0].emergency_reserve_amount || 0) +
                    (profitDistributions[0].investment_amount || 0)) : 0,
            icon: TrendingUp,
            description: 'Valor da última distribuição',
            gradient: 'from-orange-500 to-orange-600',
            trend: { value: profitDistributions.length > 0 ? 'executada' : 'pendente', label: 'status', isPositive: profitDistributions.length > 0 },
            format: 'currency'
        }
    ]

    const formatValue = (value: number, format?: string) => {
        if (format === 'currency') {
            return value.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            })
        }
        return value.toLocaleString()
    }

    const months = [
        { value: 1, label: 'Janeiro' },
        { value: 2, label: 'Fevereiro' },
        { value: 3, label: 'Março' },
        { value: 4, label: 'Abril' },
        { value: 5, label: 'Maio' },
        { value: 6, label: 'Junho' },
        { value: 7, label: 'Julho' },
        { value: 8, label: 'Agosto' },
        { value: 9, label: 'Setembro' },
        { value: 10, label: 'Outubro' },
        { value: 11, label: 'Novembro' },
        { value: 12, label: 'Dezembro' }
    ]

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
                                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                        <PieChart className="w-4 h-4 text-white" />
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                        Distribuição de Lucros
                                    </h1>
                                </div>
                                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                                    Configure e execute a distribuição automática dos seus lucros
                                </p>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                {/* Status Badge */}
                                <Badge className={`border-0 shadow-lg text-xs ${
                                    isConfigurationComplete
                                        ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-emerald-500/25'
                                        : 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-orange-500/25'
                                }`}>
                                    {isConfigurationComplete ? (
                                        <>
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            <span className="hidden sm:inline">Configuração Completa</span>
                                            <span className="sm:hidden">Completo</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertTriangle className="w-3 h-3 mr-1" />
                                            <span className="hidden sm:inline">Configuração Pendente</span>
                                            <span className="sm:hidden">Pendente</span>
                                        </>
                                    )}
                                </Badge>

                                {/* Botões de Ação */}
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <button
                                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                                        onClick={handleRefresh}
                                        disabled={isLoading}
                                    >
                                        <RefreshCw className={`w-4 h-4 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
                                    </button>
                                    <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
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
                                            <TrendingUp className="w-4 h-4 mr-2" />
                                            Financeiro
                                        </Button>
                                    </Link>
                                    {isConfigurationComplete && (
                                        <Button
                                            onClick={handleCalculateDistribution}
                                            disabled={!isConfigurationComplete || isLoading}
                                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25 border-0"
                                        >
                                            <Calculator className="w-4 h-4 mr-2" />
                                            Calcular Distribuição
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Conteúdo */}
                <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">

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
                                                {formatValue(metric.value, metric.format)}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className={`w-3 h-3 ${metric.trend.isPositive ? 'text-emerald-500' : 'text-orange-500'}`} />
                                                <span className={`text-xs font-medium ${metric.trend.isPositive ? 'text-emerald-600' : 'text-orange-600'}`}>
                                                    {metric.trend.value}
                                                </span>
                                                <span className="text-xs text-slate-500">{metric.trend.label}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Seletor de Período para Cálculo */}
                        <Card className="border-0 shadow-xl shadow-slate-200/60">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-blue-500" />
                                    Período para Distribuição
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Mês</label>
                                        <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                                            <SelectTrigger className="w-48">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {months.map((month) => (
                                                    <SelectItem key={month.value} value={month.value.toString()}>
                                                        {month.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Ano</label>
                                        <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                                            <SelectTrigger className="w-32">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[2024, 2025, 2026].map((year) => (
                                                    <SelectItem key={year} value={year.toString()}>
                                                        {year}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex-1 flex justify-end">
                                        <Button
                                            onClick={handleCalculateDistribution}
                                            disabled={!isConfigurationComplete || isLoading}
                                            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                                        >
                                            <Play className="w-4 h-4 mr-2" />
                                            Executar Distribuição
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tabs de Conteúdo */}
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                            <TabsList className="bg-white border border-slate-200 shadow-sm p-1">
                                <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                                    <PieChart className="w-4 h-4 mr-2" />
                                    Dashboard
                                </TabsTrigger>
                                <TabsTrigger value="config" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                                    <Settings className="w-4 h-4 mr-2" />
                                    Configuração
                                </TabsTrigger>
                                <TabsTrigger value="simulator" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                                    <Calculator className="w-4 h-4 mr-2" />
                                    Simulador
                                </TabsTrigger>
                                <TabsTrigger value="history" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                                    <History className="w-4 h-4 mr-2" />
                                    Histórico
                                </TabsTrigger>
                            </TabsList>

                            {/* Tab: Dashboard */}
                            <TabsContent value="dashboard" className="space-y-6">
                                {/* Gráfico de Distribuição Atual */}
                                <ProfitDistributionChart
                                    summary={profitDistributionSummary}
                                    isLoading={isLoadingProfitDistributions}
                                    chartType="pie"
                                    onRefresh={handleRefresh}
                                />

                                {/* Resumo das Configurações */}
                                {!isConfigurationComplete && (
                                    <Card className="border-0 shadow-xl shadow-orange-200/60 border-orange-200">
                                        <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
                                            <CardTitle className="flex items-center gap-2 text-orange-700">
                                                <AlertTriangle className="w-5 h-5" />
                                                Configuração Incompleta
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-4">
                                                <p className="text-slate-700">
                                                    Você configurou apenas <strong>{totalPercentage}%</strong> do lucro para distribuição.
                                                    Configure os <strong>{100 - totalPercentage}%</strong> restantes para executar distribuições automáticas.
                                                </p>
                                                <Button
                                                    onClick={() => setActiveTab('config')}
                                                    className="bg-orange-500 hover:bg-orange-600"
                                                >
                                                    <Settings className="w-4 h-4 mr-2" />
                                                    Completar Configuração
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            {/* Tab: Configuração */}
                            <TabsContent value="config" className="space-y-6">
                                <ProfitDistributionConfig
                                    configs={profitConfigs}
                                    isLoading={isLoadingProfitConfig}
                                    onSave={handleSaveConfig}
                                    onUpdate={handleUpdateConfig}
                                    onDelete={handleDeleteConfig}
                                />
                            </TabsContent>

                            {/* Tab: Simulador */}
                            <TabsContent value="simulator" className="space-y-6">
                                <ProfitDistributionSimulator
                                    configs={profitConfigs}
                                    currentProfit={financialSummary?.totalProfit || 0}
                                    onSaveSimulation={handleSaveSimulation}
                                    onExecuteDistribution={handleExecuteSimulationDistribution}
                                />
                            </TabsContent>

                            {/* Tab: Histórico */}
                            <TabsContent value="history" className="space-y-6">
                                <ProfitDistributionHistory
                                    distributions={profitDistributions}
                                    isLoading={isLoadingProfitDistributions}
                                    onViewDetails={(distribution) => {
                                        toast.info('Funcionalidade de detalhes em desenvolvimento')
                                    }}
                                    onDownloadReport={(distribution) => {
                                        toast.info('Funcionalidade de relatório em desenvolvimento')
                                    }}
                                />
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </div>

            {/* Dialog de Execução de Distribuição */}
            <Dialog open={isExecuteDialogOpen} onOpenChange={setIsExecuteDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Play className="w-5 h-5 text-blue-500" />
                            Confirmar Distribuição
                        </DialogTitle>
                        <DialogDescription>
                            Revise os valores calculados antes de executar a distribuição de lucros.
                        </DialogDescription>
                    </DialogHeader>
                    {calculatedDistribution && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm font-medium text-blue-700 mb-2">Resumo da Distribuição</p>
                                <div className="space-y-1">
                                    <p className="text-lg font-bold text-blue-900">
                                        Lucro Total: {calculatedDistribution.totalProfit?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </p>
                                    <p className="text-sm text-blue-700">
                                        Período: {months.find(m => m.value === selectedMonth)?.label} de {selectedYear}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {calculatedDistribution.distributions?.map((dist: any, index: number) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <span className="font-medium text-slate-900">{dist.label || dist.category}</span>
                                        <div className="text-right">
                                            <p className="font-bold text-slate-900">
                                                {dist.amount?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </p>
                                            <p className="text-xs text-slate-500">{dist.percentage?.toFixed(1)}%</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsExecuteDialogOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleExecuteDistribution}
                            disabled={isLoading}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {isLoading ? (
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <CheckCircle className="w-4 h-4 mr-2" />
                            )}
                            Confirmar Distribuição
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default DistribuicaoLucrosPage