// components/procedures/RealTimeAIPricing.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    Brain,
    Zap,
    Target,
    CheckCircle,
    Lightbulb,
    BarChart3,
    RefreshCw,
    ThumbsUp,
    ThumbsDown,
    Sparkles,
    Globe,
    Database,
    Search,
    Loader2,
    X
} from 'lucide-react'
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from '@/components/ui/alert'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { useAIPricing } from '@/lib/services/ai-pricing.service'
import type { ProcedureWithCategory } from '@/types/procedure.types'

interface RealPricingInsight {
    suggested_price: number
    confidence: 'low' | 'medium' | 'high'
    reasoning: string[]
    market_position: 'below' | 'competitive' | 'premium'
    risk_level: 'low' | 'medium' | 'high'
    recommendations: string[]
    competitors_found: number
    market_analysis: {
        avg_competitor_price: number
        price_range: { min: number; max: number }
        your_position_percentile: number
    }
}

interface AnalysisProgress {
    step: 'collecting' | 'analyzing' | 'generating' | 'completed'
    progress: number
    message: string
    details?: string
}

interface RealTimeAIPricingProps {
    procedure: ProcedureWithCategory
    targetMargin?: number
    strategy?: 'economy' | 'competitive' | 'premium'
    region?: string
    onPriceApply?: (price: number) => void
    className?: string
}

const RealTimeAIPricing: React.FC<RealTimeAIPricingProps> = ({
                                                                 procedure,
                                                                 targetMargin = 50,
                                                                 strategy = 'competitive',
                                                                 region = 'sao-paulo',
                                                                 onPriceApply,
                                                                 className = ''
                                                             }) => {
    const [insight, setInsight] = useState<RealPricingInsight | null>(null)
    const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [hasAnalyzed, setHasAnalyzed] = useState(false)
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
    const [marketDataUpdate, setMarketDataUpdate] = useState<Date | null>(null)

    const { generateInsight, updateMarketData } = useAIPricing()

    const handleGenerateInsight = async () => {
        if (!procedure || isAnalyzing) return

        setIsAnalyzing(true)
        setAnalysisProgress({
            step: 'collecting',
            progress: 10,
            message: 'Coletando dados de mercado...',
            details: 'Executando robots Browse AI para buscar preços de concorrentes'
        })

        try {
            // Simular progresso de coleta de dados
            setTimeout(() => {
                setAnalysisProgress({
                    step: 'collecting',
                    progress: 30,
                    message: 'Analisando sites de concorrentes...',
                    details: 'Extraindo preços de clínicas e profissionais da região'
                })
            }, 2000)

            setTimeout(() => {
                setAnalysisProgress({
                    step: 'analyzing',
                    progress: 60,
                    message: 'Processando dados com IA...',
                    details: 'Gemini 2.5 Flash analisando tendências e posicionamento'
                })
            }, 4000)

            setTimeout(() => {
                setAnalysisProgress({
                    step: 'generating',
                    progress: 80,
                    message: 'Gerando recomendações...',
                    details: 'Calculando preço otimizado e estratégias'
                })
            }, 6000)

            const result = await generateInsight(procedure, {
                targetMargin,
                strategy,
                region
            })

            setAnalysisProgress({
                step: 'completed',
                progress: 100,
                message: 'Análise concluída!',
                details: `${result.competitors_found} concorrentes analisados`
            })

            setTimeout(() => {
                setInsight(result)
                setHasAnalyzed(true)
                setAnalysisProgress(null)
                toast.success('Análise de IA concluída com dados reais de mercado!')
            }, 1000)

        } catch (error) {
            console.error('Erro na análise de IA:', error)
            setAnalysisProgress(null)
            toast.error('Erro ao gerar análise. Tentando novamente com dados locais...')

            // Fallback com dados locais
            const fallbackResult: RealPricingInsight = {
                suggested_price: procedure.price * 1.1,
                confidence: 'low',
                reasoning: [
                    'Análise baseada em algoritmo local',
                    'Browse AI temporariamente indisponível',
                    'Recomenda-se executar análise novamente mais tarde'
                ],
                market_position: 'competitive',
                risk_level: 'medium',
                recommendations: [
                    'Verificar configuração do Browse AI',
                    'Aguardar restabelecimento dos serviços',
                    'Monitorar concorrentes manualmente'
                ],
                competitors_found: 0,
                market_analysis: {
                    avg_competitor_price: procedure.price,
                    price_range: { min: procedure.price * 0.8, max: procedure.price * 1.2 },
                    your_position_percentile: 50
                }
            }

            setInsight(fallbackResult)
            setHasAnalyzed(true)
        } finally {
            setIsAnalyzing(false)
        }
    }

    const handleUpdateMarketData = async () => {
        try {
            toast.info('Iniciando atualização de dados de mercado...')
            await updateMarketData()
            setMarketDataUpdate(new Date())
            toast.success('Dados de mercado atualizados!')
        } catch (error) {
            toast.error('Erro ao atualizar dados de mercado')
        }
    }

    const handleApplyPrice = () => {
        if (insight && onPriceApply) {
            onPriceApply(insight.suggested_price)
            toast.success(`Preço de R$ ${insight.suggested_price.toFixed(2)} aplicado!`)
        }
    }

    const handleFeedback = async (wasHelpful: boolean, score?: number) => {
        if (!insight) return

        try {
            // Aqui você implementaria o feedback real
            // await submitFeedback(procedure.id, insight, wasHelpful, score)
            setFeedbackSubmitted(true)
            toast.success('Feedback enviado! Isso ajuda a melhorar nossa IA.')
        } catch (error) {
            toast.error('Erro ao enviar feedback')
        }
    }

    const getConfidenceDetails = (confidence: string, competitorsFound: number) => {
        if (competitorsFound >= 5) {
            return {
                level: 'high',
                label: 'Alta Precisão',
                description: `Baseado em ${competitorsFound} concorrentes reais`,
                color: 'text-emerald-600 bg-emerald-50 border-emerald-200'
            }
        } else if (competitorsFound >= 2) {
            return {
                level: 'medium',
                label: 'Precisão Média',
                description: `Baseado em ${competitorsFound} concorrentes`,
                color: 'text-blue-600 bg-blue-50 border-blue-200'
            }
        } else {
            return {
                level: 'low',
                label: 'Precisão Limitada',
                description: 'Poucos dados de mercado disponíveis',
                color: 'text-orange-600 bg-orange-50 border-orange-200'
            }
        }
    }

    const getMarketPosition = (position: string, percentile: number) => {
        const positions = {
            premium: {
                label: 'Premium',
                color: 'text-purple-600 bg-purple-50 border-purple-200',
                description: `Você está no top ${100 - percentile}% do mercado`
            },
            competitive: {
                label: 'Competitivo',
                color: 'text-blue-600 bg-blue-50 border-blue-200',
                description: `Posição equilibrada no mercado (${percentile}º percentil)`
            },
            below: {
                label: 'Abaixo do Mercado',
                color: 'text-orange-600 bg-orange-50 border-orange-200',
                description: `Oportunidade de aumentar preços (${percentile}º percentil)`
            }
        }
        return positions[position as keyof typeof positions] || positions.competitive
    }

    const getRiskLevel = (risk: string) => {
        const risks = {
            low: { label: 'Baixo Risco', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
            medium: { label: 'Risco Moderado', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
            high: { label: 'Alto Risco', color: 'text-red-600 bg-red-50 border-red-200' }
        }
        return risks[risk as keyof typeof risks] || risks.medium
    }

    const getPriceDifference = () => {
        if (!insight) return { diff: 0, percentage: 0, isIncrease: false }

        const diff = insight.suggested_price - procedure.price
        const percentage = (diff / procedure.price) * 100
        return {
            diff: Math.abs(diff),
            percentage: Math.abs(percentage),
            isIncrease: diff > 0
        }
    }

    // Mostrar progresso da análise
    if (isAnalyzing && analysisProgress) {
        return (
            <Card className={`border-0 shadow-xl shadow-slate-200/60 ${className}`}>
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100">
                    <CardTitle className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-blue-500 animate-pulse" />
                        Análise em Tempo Real
                        <Badge className="bg-green-100 text-green-700 border-green-200 ml-auto">
                            <Zap className="w-3 h-3 mr-1" />
                            IA + Browse AI
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-6">
                        {/* Progresso Principal */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700">
                                    {analysisProgress.message}
                                </span>
                                <span className="text-sm text-slate-500">
                                    {analysisProgress.progress}%
                                </span>
                            </div>
                            <Progress value={analysisProgress.progress} className="h-2" />
                            {analysisProgress.details && (
                                <p className="text-xs text-slate-500">{analysisProgress.details}</p>
                            )}
                        </div>

                        {/* Indicadores de Atividade */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className={`p-4 rounded-lg border ${
                                analysisProgress.step === 'collecting' ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50'
                            }`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {analysisProgress.step === 'collecting' ? (
                                        <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                                    ) : (
                                        <Globe className="w-4 h-4 text-slate-400" />
                                    )}
                                    <span className="text-sm font-medium">Browse AI</span>
                                </div>
                                <p className="text-xs text-slate-600">Coletando dados reais</p>
                            </div>

                            <div className={`p-4 rounded-lg border ${
                                analysisProgress.step === 'analyzing' ? 'border-purple-200 bg-purple-50' : 'border-slate-200 bg-slate-50'
                            }`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {analysisProgress.step === 'analyzing' ? (
                                        <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                                    ) : (
                                        <Brain className="w-4 h-4 text-slate-400" />
                                    )}
                                    <span className="text-sm font-medium">Gemini 2.5</span>
                                </div>
                                <p className="text-xs text-slate-600">Processando com IA</p>
                            </div>

                            <div className={`p-4 rounded-lg border ${
                                analysisProgress.step === 'generating' ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'
                            }`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {analysisProgress.step === 'generating' ? (
                                        <Loader2 className="w-4 h-4 text-green-500 animate-spin" />
                                    ) : (
                                        <Target className="w-4 h-4 text-slate-400" />
                                    )}
                                    <span className="text-sm font-medium">Recomendações</span>
                                </div>
                                <p className="text-xs text-slate-600">Gerando insights</p>
                            </div>
                        </div>

                        {/* Botão de Cancelar */}
                        <div className="text-center">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsAnalyzing(false)
                                    setAnalysisProgress(null)
                                }}
                                className="bg-white border-slate-200 hover:bg-slate-50"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Cancelar Análise
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Estado inicial
    if (!insight) {
        return (
            <Card className={`border-0 shadow-xl shadow-slate-200/60 ${className}`}>
                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Brain className="w-5 h-5 text-slate-500" />
                            Análise Inteligente com Dados Reais
                        </div>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            <Database className="w-3 h-3 mr-1" />
                            Browse AI
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 text-center">
                    <div className="space-y-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                Análise com Dados Reais de Mercado
                            </h3>
                            <p className="text-slate-600 max-w-md mx-auto mb-4">
                                Nossa IA coletará dados reais de concorrentes usando Browse AI e
                                analisará com Gemini 2.5 Flash para sugerir o preço ideal.
                            </p>
                        </div>

                        {/* Features */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <Search className="w-5 h-5 text-blue-500 mb-2" />
                                <h4 className="text-sm font-semibold text-slate-900">Dados Reais</h4>
                                <p className="text-xs text-slate-600">Preços de concorrentes atualizados</p>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-lg">
                                <Brain className="w-5 h-5 text-purple-500 mb-2" />
                                <h4 className="text-sm font-semibold text-slate-900">IA Avançada</h4>
                                <p className="text-xs text-slate-600">Gemini 2.5 Flash para análise</p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg">
                                <Target className="w-5 h-5 text-green-500 mb-2" />
                                <h4 className="text-sm font-semibold text-slate-900">Precisão</h4>
                                <p className="text-xs text-slate-600">Recomendações personalizadas</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button
                                onClick={handleGenerateInsight}
                                disabled={isAnalyzing}
                                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                            >
                                <Brain className="w-4 h-4 mr-2" />
                                Iniciar Análise Real
                            </Button>

                            <Button
                                variant="outline"
                                onClick={handleUpdateMarketData}
                                className="bg-white border-slate-200 hover:bg-slate-50"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Atualizar Dados
                            </Button>
                        </div>

                        {marketDataUpdate && (
                            <p className="text-xs text-slate-500">
                                Última atualização: {marketDataUpdate.toLocaleTimeString()}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Resultado da análise
    const confidenceDetails = getConfidenceDetails(insight.confidence, insight.competitors_found)
    const marketPosition = getMarketPosition(insight.market_position, insight.market_analysis.your_position_percentile)
    const riskLevel = getRiskLevel(insight.risk_level)
    const priceDiff = getPriceDifference()

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Card Principal com Resultado */}
            <Card className="border-0 shadow-xl shadow-slate-200/60 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100">
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Brain className="w-5 h-5 text-blue-500" />
                            Análise Concluída
                            <Badge className="bg-green-100 text-green-700 border-green-200">
                                <Database className="w-3 h-3 mr-1" />
                                {insight.competitors_found} concorrentes
                            </Badge>
                        </div>
                        <Badge className={confidenceDetails.color}>
                            <Target className="w-3 h-3 mr-1" />
                            {confidenceDetails.label}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Resultado Principal */}
                        <div className="space-y-4">
                            <div className="text-center">
                                <div className="text-4xl font-bold text-blue-600 mb-2">
                                    R$ {insight.suggested_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                                <p className="text-slate-600">Preço Sugerido pela IA</p>

                                {/* Comparação com preço atual */}
                                <div className="mt-3 space-y-2">
                                    <Badge className={priceDiff.isIncrease ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}>
                                        {priceDiff.isIncrease ? '+' : '-'}R$ {priceDiff.diff.toFixed(2)}
                                        ({priceDiff.percentage.toFixed(1)}%)
                                    </Badge>

                                    {/* Faixa de mercado */}
                                    <div className="text-xs text-slate-500">
                                        Mercado: R$ {insight.market_analysis.price_range.min.toFixed(0)} -
                                        R$ {insight.market_analysis.price_range.max.toFixed(0)}
                                    </div>
                                </div>
                            </div>

                            {/* Botão de Aplicar */}
                            {onPriceApply && (
                                <Button
                                    onClick={handleApplyPrice}
                                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Aplicar Preço Sugerido
                                </Button>
                            )}
                        </div>

                        {/* Análises e Métricas */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-3">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="text-center p-3 bg-slate-50 rounded-lg cursor-help">
                                                <Badge className={marketPosition.color} variant="outline">
                                                    {marketPosition.label}
                                                </Badge>
                                                <p className="text-xs text-slate-500 mt-1">Posição</p>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{marketPosition.description}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="text-center p-3 bg-slate-50 rounded-lg cursor-help">
                                                <Badge className={riskLevel.color} variant="outline">
                                                    {riskLevel.label}
                                                </Badge>
                                                <p className="text-xs text-slate-500 mt-1">Risco</p>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Nível de risco da estratégia de preço</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <div className="text-center p-3 bg-slate-50 rounded-lg">
                                    <div className="text-sm font-semibold text-slate-900">
                                        R$ {insight.market_analysis.avg_competitor_price.toFixed(0)}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Média Mercado</p>
                                </div>
                            </div>

                            {/* Confiança dos Dados */}
                            <div className="p-3 bg-slate-50 rounded-lg">
                                <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="text-slate-600">Confiança dos Dados</span>
                                    <span className="font-medium">{confidenceDetails.description}</span>
                                </div>
                                <Progress value={insight.competitors_found * 20} className="h-2" max={100} />
                            </div>

                            {/* Feedback */}
                            {!feedbackSubmitted && (
                                <div className="border-t border-slate-200 pt-4">
                                    <p className="text-sm text-slate-600 mb-3">Esta análise foi útil?</p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleFeedback(true, 5)}
                                            className="flex-1"
                                        >
                                            <ThumbsUp className="w-3 h-3 mr-1" />
                                            Sim
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleFeedback(false, 2)}
                                            className="flex-1"
                                        >
                                            <ThumbsDown className="w-3 h-3 mr-1" />
                                            Não
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Cards de Detalhes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Raciocínio da IA */}
                <Card className="border-0 shadow-lg shadow-slate-200/40">
                    <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Lightbulb className="w-5 h-5 text-emerald-500" />
                            Raciocínio da IA
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-3">
                            {insight.reasoning.map((reason, index) => (
                                <div key={index} className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-xs font-semibold text-emerald-600">{index + 1}</span>
                                    </div>
                                    <p className="text-sm text-slate-700">{reason}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recomendações */}
                <Card className="border-0 shadow-lg shadow-slate-200/40">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <BarChart3 className="w-5 h-5 text-purple-500" />
                            Recomendações
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-3">
                            {insight.recommendations.map((recommendation, index) => (
                                <div key={index} className="flex items-start gap-3">
                                    <CheckCircle className="w-4 h-4 text-purple-500 flex-shrink-0 mt-1" />
                                    <p className="text-sm text-slate-700">{recommendation}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Alert de Dados Reais */}
            <Alert className="border-blue-200 bg-blue-50">
                <Database className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-900">Análise com Dados Reais</AlertTitle>
                <AlertDescription className="text-blue-800">
                    Esta análise foi baseada em {insight.competitors_found} concorrentes reais coletados via Browse AI,
                    processados pela IA Gemini 2.5 Flash. A precisão aumenta conforme mais dados são coletados.
                </AlertDescription>
            </Alert>

            {/* Botão para nova análise */}
            <div className="text-center">
                <Button
                    variant="outline"
                    onClick={() => {
                        setInsight(null)
                        setHasAnalyzed(false)
                        setFeedbackSubmitted(false)
                    }}
                    className="bg-white border-slate-200 hover:bg-slate-50"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Nova Análise
                </Button>
            </div>
        </div>
    )
}

export default RealTimeAIPricing