'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import {
    DollarSign,
    Target,
    TrendingUp,
    ArrowLeft,
    Activity,
    RefreshCw,
    Zap,
    ChevronRight,
    Scissors,
    Download,
    Database,
    Brain,
    Globe,
    Eye,
    Settings,
    Clock,
    AlertCircle,
    CheckCircle,
    Info
} from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from '@/components/ui/alert'
import Link from 'next/link'
import { toast } from 'sonner'
import { Sidebar } from '@/components/layout/sidebar'
import RealTimeAIPricing from '@/components/procedures/RealTimeAIPricing'
import {
    useProcedures,
    useActiveProcedureCategories,
    useUpdateProcedure
} from '@/lib/hooks/useProcedures'
import { useAIPricing } from '@/lib/services/ai-pricing.service'
import type { ProcedureWithCategory } from '@/types/procedure.types'

interface APIStatus {
    browse_ai: 'connected' | 'error' | 'not_configured'
    gemini: 'connected' | 'error' | 'not_configured'
    supabase: 'connected' | 'error' | 'not_configured'
}

const PrecificacaoPage: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [targetMargin, setTargetMargin] = useState([50])
    const [priceStrategy, setPriceStrategy] = useState<'competitive' | 'premium' | 'economy'>('competitive')
    const [region, setRegion] = useState('sao-paulo')
    const [selectedProcedureForAI, setSelectedProcedureForAI] = useState<string>('')
    const [isUpdatingMarketData, setIsUpdatingMarketData] = useState(false)
    const [lastDataUpdate, setLastDataUpdate] = useState<Date | null>(null)
    const [apiStatus, setApiStatus] = useState<APIStatus>({
        browse_ai: 'not_configured',
        gemini: 'not_configured',
        supabase: 'connected'
    })

    // Hooks para dados
    const {
        data: proceduresData,
        isLoading: proceduresLoading,
        refetch: refetchProcedures
    } = useProcedures({
        page: 1,
        limit: 100,
        filters: { is_active: true }
    })

    const {
        data: categories = [],
        isLoading: categoriesLoading
    } = useActiveProcedureCategories()

    const updateProcedure = useUpdateProcedure()
    const { updateMarketData } = useAIPricing()

    const procedures = proceduresData?.data || []
    const isLoading = proceduresLoading || categoriesLoading

    // Filtrar procedimentos por categoria
    const filteredProcedures = useMemo(() => {
        if (selectedCategory === 'all') return procedures
        return procedures.filter(proc =>
            proc.procedure_categories?.name === selectedCategory
        )
    }, [procedures, selectedCategory])

    // Verificar status das APIs
    React.useEffect(() => {
        const checkAPIStatus = () => {
            const newStatus: APIStatus = {
                browse_ai: process.env.NEXT_PUBLIC_BROWSE_AI_API_KEY ? 'connected' : 'not_configured',
                gemini: process.env.NEXT_PUBLIC_GEMINI_API_KEY ? 'connected' : 'not_configured',
                supabase: 'connected' // Sempre conectado se chegou até aqui
            }
            setApiStatus(newStatus)
        }

        checkAPIStatus()
    }, [])

    // Atualizar dados de mercado em lote
    const handleUpdateMarketData = async () => {
        setIsUpdatingMarketData(true)
        try {
            await updateMarketData()
            setLastDataUpdate(new Date())
            toast.success('Dados de mercado atualizados com sucesso!')
            refetchProcedures() // Atualizar procedimentos para refletir novos dados
        } catch (error) {
            console.error('Erro ao atualizar dados:', error)
            toast.error('Erro ao atualizar dados de mercado')
        } finally {
            setIsUpdatingMarketData(false)
        }
    }

    // Métricas principais baseadas em dados reais
    const metricsData = useMemo(() => {
        const proceduresWithCost = filteredProcedures.filter(p => p.cost && p.cost > 0)
        const avgPrice = filteredProcedures.reduce((sum, p) => sum + p.price, 0) / filteredProcedures.length || 0
        const avgMargin = proceduresWithCost.reduce((sum, p) => {
            const margin = ((p.price - (p.cost || 0)) / p.price) * 100
            return sum + margin
        }, 0) / proceduresWithCost.length || 0

        // Procedimentos que podem ter preço otimizado (custo definido)
        const optimizableCount = proceduresWithCost.length

        return [
            {
                title: 'Procedimentos Analisáveis',
                value: optimizableCount,
                icon: Scissors,
                description: 'Com custos definidos',
                gradient: 'from-purple-500 to-purple-600',
                trend: { value: optimizableCount, label: 'prontos', isPositive: true }
            },
            {
                title: 'Preço Médio Atual',
                value: `R$ ${avgPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                icon: DollarSign,
                description: 'Média dos procedimentos',
                gradient: 'from-green-500 to-green-600',
                trend: { value: avgPrice, label: 'média', isPositive: true }
            },
            {
                title: 'Margem Média',
                value: `${avgMargin.toFixed(1)}%`,
                icon: TrendingUp,
                description: 'Margem atual',
                gradient: 'from-blue-500 to-blue-600',
                trend: { value: avgMargin, label: 'margem', isPositive: avgMargin > 40 }
            },
            {
                title: 'APIs Conectadas',
                value: Object.values(apiStatus).filter(status => status === 'connected').length,
                icon: Database,
                description: 'De 3 APIs disponíveis',
                gradient: 'from-emerald-500 to-emerald-600',
                trend: { value: 3, label: 'ativas', isPositive: true }
            }
        ]
    }, [filteredProcedures, apiStatus])

    const getAPIStatusBadge = (status: string) => {
        switch (status) {
            case 'connected':
                return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Conectada</Badge>
            case 'error':
                return <Badge className="bg-red-100 text-red-700 border-red-200">Erro</Badge>
            case 'not_configured':
                return <Badge className="bg-orange-100 text-orange-700 border-orange-200">Não Configurada</Badge>
            default:
                return <Badge variant="outline">Desconhecido</Badge>
        }
    }

    if (isLoading && procedures.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <Sidebar />
                <div className="lg:ml-64">
                    <div className="flex items-center justify-center h-64">
                        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            {/* Sidebar */}
            <Sidebar />

            {/* Conteúdo Principal */}
            <div className="lg:ml-64">
                {/* Header */}
                <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
                    <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <Link
                                        href="/procedimentos"
                                        className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4 text-slate-600" />
                                    </Link>
                                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                        <Brain className="w-4 h-4 text-white" />
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                        IA de Precificação
                                    </h1>
                                </div>
                                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                                    Análise inteligente com dados reais de mercado
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-lg shadow-emerald-500/25 text-xs">
                                    <Activity className="w-3 h-3 mr-1" />
                                    Sistema Online
                                </Badge>
                                <Button
                                    variant="outline"
                                    onClick={handleUpdateMarketData}
                                    disabled={isUpdatingMarketData}
                                    className="bg-white border-slate-200 hover:bg-slate-50 shadow-sm"
                                >
                                    {isUpdatingMarketData ? (
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Database className="w-4 h-4 mr-2" />
                                    )}
                                    Atualizar Dados
                                </Button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Conteúdo */}
                <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">

                        {/* Status das APIs */}
                        <Card className="border-0 shadow-xl shadow-slate-200/60 overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Settings className="w-5 h-5 text-blue-500" />
                                    Status das Integrações
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 lg:p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Globe className="w-5 h-5 text-blue-500" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">Browse AI</p>
                                                <p className="text-xs text-slate-500">Coleta de dados de mercado</p>
                                            </div>
                                        </div>
                                        {getAPIStatusBadge(apiStatus.browse_ai)}
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Brain className="w-5 h-5 text-purple-500" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">Gemini 2.5 Flash</p>
                                                <p className="text-xs text-slate-500">Análise inteligente</p>
                                            </div>
                                        </div>
                                        {getAPIStatusBadge(apiStatus.gemini)}
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Database className="w-5 h-5 text-green-500" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">Supabase Vector</p>
                                                <p className="text-xs text-slate-500">Armazenamento inteligente</p>
                                            </div>
                                        </div>
                                        {getAPIStatusBadge(apiStatus.supabase)}
                                    </div>
                                </div>

                                {lastDataUpdate && (
                                    <div className="mt-4 pt-4 border-t border-slate-200">
                                        <p className="text-xs text-slate-500 flex items-center gap-2">
                                            <Clock className="w-3 h-3" />
                                            Última atualização de dados: {lastDataUpdate.toLocaleString('pt-BR')}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Alerta de Configuração */}
                        {(apiStatus.browse_ai !== 'connected' || apiStatus.gemini !== 'connected') && (
                            <Alert className="border-orange-200 bg-orange-50">
                                <AlertCircle className="h-4 w-4 text-orange-600" />
                                <AlertTitle className="text-orange-900">Configuração Necessária</AlertTitle>
                                <AlertDescription className="text-orange-800">
                                    Para usar a análise completa com dados reais, configure as APIs:
                                    {apiStatus.browse_ai !== 'connected' && <><br />• Browse AI: Para coleta de dados de mercado</>}
                                    {apiStatus.gemini !== 'connected' && <><br />• Gemini API: Para análise inteligente</>}
                                    <br />O sistema funcionará com algoritmos locais enquanto isso.
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Métricas Principais */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                            {metricsData.map((metric, index) => (
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
                                                {typeof metric.value === 'string' ? metric.value : metric.value.toLocaleString()}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                {metric.trend.isPositive ?
                                                    <TrendingUp className="w-3 h-3 text-emerald-500" /> :
                                                    <AlertCircle className="w-3 h-3 text-orange-500" />
                                                }
                                                <span className={`text-xs font-medium ${metric.trend.isPositive ? 'text-emerald-600' : 'text-orange-600'}`}>
                                                    {metric.description}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Configurações de Análise */}
                        <Card className="border-0 shadow-xl shadow-slate-200/60 overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Target className="w-5 h-5 text-blue-500" />
                                    Parâmetros de Análise
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 lg:p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="space-y-3">
                                        <Label className="text-sm font-medium text-slate-700">Categoria</Label>
                                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todas as categorias</SelectItem>
                                                {categories.map(category => (
                                                    <SelectItem key={category.id} value={category.name}>
                                                        {category.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-sm font-medium text-slate-700">
                                            Margem Alvo: {targetMargin[0]}%
                                        </Label>
                                        <Slider
                                            value={targetMargin}
                                            onValueChange={setTargetMargin}
                                            max={80}
                                            min={10}
                                            step={5}
                                            className="w-full"
                                        />
                                        <div className="text-xs text-slate-500">
                                            Margem de lucro desejada
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-sm font-medium text-slate-700">Estratégia</Label>
                                        <Select value={priceStrategy} onValueChange={(value: any) => setPriceStrategy(value)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="economy">Econômica (-15%)</SelectItem>
                                                <SelectItem value="competitive">Competitiva</SelectItem>
                                                <SelectItem value="premium">Premium (+25%)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-sm font-medium text-slate-700">Região</Label>
                                        <Select value={region} onValueChange={setRegion}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="sao-paulo">São Paulo - SP</SelectItem>
                                                <SelectItem value="rio-janeiro">Rio de Janeiro - RJ</SelectItem>
                                                <SelectItem value="belo-horizonte">Belo Horizonte - MG</SelectItem>
                                                <SelectItem value="salvador">Salvador - BA</SelectItem>
                                                <SelectItem value="brasilia">Brasília - DF</SelectItem>
                                                <SelectItem value="interior">Interior</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Análise Individual com IA */}
                        <Card className="border-0 shadow-xl shadow-slate-200/60 overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100 p-4 lg:p-6">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Brain className="w-5 h-5 text-blue-500" />
                                    Análise Inteligente Individual
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 lg:p-6">
                                <div className="space-y-6">
                                    {/* Seletor de Procedimento */}
                                    <div className="space-y-3">
                                        <Label className="text-sm font-medium text-slate-700">
                                            Selecione um procedimento para análise detalhada:
                                        </Label>
                                        <Select
                                            value={selectedProcedureForAI}
                                            onValueChange={setSelectedProcedureForAI}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Escolha um procedimento para análise com IA" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {filteredProcedures.map((procedure) => (
                                                    <SelectItem key={procedure.id} value={procedure.id}>
                                                        <div className="flex items-center gap-2">
                                                            {procedure.procedure_categories?.color && (
                                                                <div
                                                                    className="w-3 h-3 rounded-full"
                                                                    style={{ backgroundColor: procedure.procedure_categories.color }}
                                                                />
                                                            )}
                                                            <span>{procedure.name}</span>
                                                            <span className="text-xs text-slate-500">
                                                                (R$ {procedure.price.toFixed(2)})
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Componente de Análise IA */}
                                    {selectedProcedureForAI && (
                                        <RealTimeAIPricing
                                            procedure={procedures.find(p => p.id === selectedProcedureForAI)!}
                                            targetMargin={targetMargin[0]}
                                            strategy={priceStrategy}
                                            region={region}
                                            onPriceApply={(price) => {
                                                const procedure = procedures.find(p => p.id === selectedProcedureForAI)
                                                if (procedure) {
                                                    updateProcedure.mutate({
                                                        id: procedure.id,
                                                        data: { price }
                                                    })
                                                }
                                            }}
                                            className="mt-4"
                                        />
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Lista de Procedimentos para Análise Rápida */}
                        <Card className="border-0 shadow-xl shadow-slate-200/60 overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                    <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                                        <Scissors className="w-5 h-5 text-purple-500" />
                                        Procedimentos ({filteredProcedures.length})
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                                            <Activity className="w-3 h-3 mr-1" />
                                            {filteredProcedures.filter(p => p.cost && p.cost > 0).length} com custos definidos
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {filteredProcedures.length === 0 ? (
                                    <div className="text-center py-12 px-6">
                                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Scissors className="w-8 h-8 text-white" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                            Nenhum procedimento encontrado
                                        </h3>
                                        <p className="text-slate-500 mb-6 max-w-md mx-auto">
                                            Adicione procedimentos ou ajuste os filtros para usar a análise de IA.
                                        </p>
                                        <Link href="/procedimentos">
                                            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                                                Gerenciar Procedimentos
                                            </Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-slate-50/50 hover:bg-slate-50">
                                                    <TableHead className="font-semibold text-slate-700">Procedimento</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Categoria</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Preço Atual</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Custo</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Margem</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Status IA</TableHead>
                                                    <TableHead className="text-right font-semibold text-slate-700">Ações</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredProcedures.map((procedure) => {
                                                    const margin = procedure.cost && procedure.cost > 0
                                                        ? ((procedure.price - procedure.cost) / procedure.price) * 100
                                                        : 0
                                                    const hasRequiredData = procedure.cost && procedure.cost > 0

                                                    return (
                                                        <TableRow key={procedure.id} className="hover:bg-slate-50/50 transition-colors">
                                                            <TableCell className="py-4">
                                                                <div className="flex items-center gap-3">
                                                                    {procedure.procedure_categories?.color && (
                                                                        <div
                                                                            className="w-3 h-3 rounded-full"
                                                                            style={{ backgroundColor: procedure.procedure_categories.color }}
                                                                        />
                                                                    )}
                                                                    <div>
                                                                        <p className="font-medium text-slate-900">{procedure.name}</p>
                                                                        <div className="flex items-center gap-1 text-xs text-slate-500">
                                                                            <Clock className="w-3 h-3" />
                                                                            {procedure.duration_minutes} min
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-4">
                                                                <span className="text-sm text-slate-600">
                                                                    {procedure.procedure_categories?.name || 'Sem categoria'}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="py-4">
                                                                <span className="font-medium text-slate-900">
                                                                    R$ {procedure.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="py-4">
                                                                {procedure.cost && procedure.cost > 0 ? (
                                                                    <span className="text-sm text-slate-600">
                                                                        R$ {procedure.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                    </span>
                                                                ) : (
                                                                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                                                        Não definido
                                                                    </Badge>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="py-4">
                                                                {hasRequiredData ? (
                                                                    <Badge className={
                                                                        margin >= 50 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                                            margin >= 30 ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                                                margin >= 15 ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                                                                    'bg-red-100 text-red-700 border-red-200'
                                                                    }>
                                                                        {margin.toFixed(1)}%
                                                                    </Badge>
                                                                ) : (
                                                                    <span className="text-xs text-slate-400">N/A</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="py-4">
                                                                {hasRequiredData ? (
                                                                    <Badge className="bg-green-100 text-green-700 border-green-200">
                                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                                        Pronto
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                                                                        <AlertCircle className="w-3 h-3 mr-1" />
                                                                        Falta custo
                                                                    </Badge>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-right py-4">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => setSelectedProcedureForAI(procedure.id)}
                                                                    className="bg-white border-slate-200 hover:bg-slate-50"
                                                                >
                                                                    <Brain className="w-3 h-3 mr-1" />
                                                                    Analisar
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Ações em Lote */}
                        {filteredProcedures.length > 0 && (
                            <Card className="border-0 shadow-xl shadow-slate-200/60">
                                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Zap className="w-5 h-5 text-purple-500" />
                                        Ações Inteligentes
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 lg:p-6">
                                    <div className="flex flex-wrap gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={handleUpdateMarketData}
                                            disabled={isUpdatingMarketData}
                                            className="bg-white border-slate-200 hover:bg-slate-50"
                                        >
                                            {isUpdatingMarketData ? (
                                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <Database className="w-4 h-4 mr-2" />
                                            )}
                                            Atualizar Dados de Mercado
                                        </Button>

                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                const proceduresWithoutCost = filteredProcedures.filter(p => !p.cost || p.cost === 0)
                                                if (proceduresWithoutCost.length > 0) {
                                                    toast.info(`${proceduresWithoutCost.length} procedimentos precisam de custos definidos para análise completa`)
                                                } else {
                                                    toast.success('Todos os procedimentos estão prontos para análise!')
                                                }
                                            }}
                                            className="bg-white border-slate-200 hover:bg-slate-50"
                                        >
                                            <Eye className="w-4 h-4 mr-2" />
                                            Verificar Completude
                                        </Button>

                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                const csvData = filteredProcedures.map(p => ({
                                                    procedimento: p.name,
                                                    categoria: p.procedure_categories?.name || '',
                                                    preco_atual: p.price,
                                                    custo: p.cost || 0,
                                                    margem: p.cost ? ((p.price - p.cost) / p.price * 100).toFixed(1) + '%' : 'N/A',
                                                    duracao_min: p.duration_minutes,
                                                    status_ia: p.cost ? 'Pronto' : 'Falta custo'
                                                }))

                                                const csvContent = [
                                                    Object.keys(csvData[0]).join(','),
                                                    ...csvData.map(row => Object.values(row).join(','))
                                                ].join('\n')

                                                const blob = new Blob([csvContent], { type: 'text/csv' })
                                                const url = URL.createObjectURL(blob)
                                                const a = document.createElement('a')
                                                a.href = url
                                                a.download = `analise-precificacao-${new Date().toISOString().split('T')[0]}.csv`
                                                a.click()
                                                URL.revokeObjectURL(url)

                                                toast.success('Relatório exportado!')
                                            }}
                                            className="bg-white border-slate-200 hover:bg-slate-50"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Exportar Análise
                                        </Button>

                                        <Link href="/procedimentos">
                                            <Button
                                                variant="outline"
                                                className="bg-white border-slate-200 hover:bg-slate-50"
                                            >
                                                <Scissors className="w-4 h-4 mr-2" />
                                                Gerenciar Procedimentos
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Informações do Sistema */}
                        <Alert className="border-blue-200 bg-blue-50">
                            <Info className="h-4 w-4 text-blue-600" />
                            <AlertTitle className="text-blue-900">Sistema de IA de Precificação</AlertTitle>
                            <AlertDescription className="text-blue-800">
                                Este sistema utiliza Browse AI para coletar dados reais de mercado, Gemini 2.5 Flash para análise inteligente
                                e Supabase Vector Store para armazenamento otimizado. A precisão das sugestões aumenta conforme mais dados são coletados.
                            </AlertDescription>
                        </Alert>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default PrecificacaoPage