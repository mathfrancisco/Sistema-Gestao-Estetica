// components/financial/ProfitDistributionSimulator.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Calculator,
    Play,
    RotateCcw,
    Save,
    TrendingUp,
    DollarSign,
    Settings,
    AlertTriangle,
    Target,
    Sparkles,
    PieChart as PieChartIcon,
    BarChart3
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import type { ProfitDistributionConfig, ProfitCategory } from '@/lib/services/financial.service'

interface SimulationData {
    totalProfit: number
    distributions: {
        category: ProfitCategory
        percentage: number
        amount: number
        label: string
        color: string
    }[]
}

interface ProfitDistributionSimulatorProps {
    configs: ProfitDistributionConfig[]
    currentProfit?: number
    onSaveSimulation?: (simulation: SimulationData) => void
    onExecuteDistribution?: (simulation: SimulationData) => void
    className?: string
}

export const ProfitDistributionSimulator: React.FC<ProfitDistributionSimulatorProps> = ({
                                                                                            configs,
                                                                                            currentProfit = 0,
                                                                                            onSaveSimulation,
                                                                                            onExecuteDistribution,
                                                                                            className = ""
                                                                                        }) => {
    const [simulatedProfit, setSimulatedProfit] = useState(currentProfit)
    const [customPercentages, setCustomPercentages] = useState<Record<ProfitCategory, number>>({})
    const [chartType, setChartType] = useState<'pie' | 'bar'>('pie')
    const [useCustomPercentages, setUseCustomPercentages] = useState(false)

    // Configuração das categorias
    const categoryConfig = {
        pro_labore: {
            label: 'Pró-labore',
            color: '#10b981',
            icon: DollarSign,
            description: 'Remuneração do proprietário'
        },
        equipment_reserve: {
            label: 'Reserva Equipamentos',
            color: '#3b82f6',
            icon: Settings,
            description: 'Fundo para equipamentos'
        },
        emergency_reserve: {
            label: 'Reserva Emergência',
            color: '#f59e0b',
            icon: AlertTriangle,
            description: 'Fundo de emergência'
        },
        investment: {
            label: 'Investimento',
            color: '#8b5cf6',
            icon: TrendingUp,
            description: 'Marketing e crescimento'
        }
    }

    // Inicializar percentuais customizados com base nas configurações
    useEffect(() => {
        const initialCustom: Record<ProfitCategory, number> = {} as any
        configs.forEach(config => {
            initialCustom[config.category] = config.percentage
        })
        setCustomPercentages(initialCustom)
    }, [configs])

    // Calcular simulação
    const calculateSimulation = (): SimulationData => {
        const percentages = useCustomPercentages ? customPercentages :
            configs.reduce((acc, config) => {
                acc[config.category] = config.percentage
                return acc
            }, {} as Record<ProfitCategory, number>)

        const distributions = Object.entries(percentages).map(([category, percentage]) => ({
            category: category as ProfitCategory,
            percentage,
            amount: (simulatedProfit * percentage) / 100,
            label: categoryConfig[category as ProfitCategory]?.label || category,
            color: categoryConfig[category as ProfitCategory]?.color || '#64748b'
        }))

        return {
            totalProfit: simulatedProfit,
            distributions
        }
    }

    const simulation = calculateSimulation()
    const totalPercentage = simulation.distributions.reduce((sum, dist) => sum + dist.percentage, 0)

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        })
    }

    // Cenários pré-definidos
    const predefinedScenarios = [
        {
            name: 'Conservador',
            profit: currentProfit * 0.8,
            description: 'Cenário com 20% menos lucro'
        },
        {
            name: 'Atual',
            profit: currentProfit,
            description: 'Baseado no lucro atual'
        },
        {
            name: 'Otimista',
            profit: currentProfit * 1.2,
            description: 'Cenário com 20% mais lucro'
        },
        {
            name: 'Crescimento',
            profit: currentProfit * 1.5,
            description: 'Cenário de alto crescimento'
        }
    ]

    // Reset para configuração padrão
    const resetToDefault = () => {
        setSimulatedProfit(currentProfit)
        setUseCustomPercentages(false)
        const defaultCustom: Record<ProfitCategory, number> = {} as any
        configs.forEach(config => {
            defaultCustom[config.category] = config.percentage
        })
        setCustomPercentages(defaultCustom)
    }

    // Atualizar percentual customizado
    const updateCustomPercentage = (category: ProfitCategory, percentage: number) => {
        setCustomPercentages(prev => ({
            ...prev,
            [category]: percentage
        }))
    }

    // Tooltip customizado
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload
            return (
                <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
                    <p className="font-medium text-slate-900">{data.label}</p>
                    <p className="text-sm text-slate-600">
                        Valor: <span className="font-semibold">{formatCurrency(data.amount)}</span>
                    </p>
                    <p className="text-sm text-slate-600">
                        Percentual: <span className="font-semibold">{data.percentage.toFixed(1)}%</span>
                    </p>
                </div>
            )
        }
        return null
    }

    return (
        <Card className={`border-0 shadow-xl shadow-slate-200/60 ${className}`}>
            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg lg:text-xl mb-2">
                            <Calculator className="w-5 h-5 text-blue-500" />
                            Simulador de Distribuição
                        </CardTitle>
                        <p className="text-sm text-slate-600">
                            Simule diferentes cenários antes de executar a distribuição
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge
                            variant={totalPercentage === 100 ? "default" : totalPercentage > 100 ? "destructive" : "secondary"}
                            className="text-xs"
                        >
                            {totalPercentage.toFixed(1)}% configurado
                        </Badge>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={resetToDefault}
                            className="bg-white border-slate-200 hover:bg-slate-50"
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Reset
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 lg:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Controles de Simulação */}
                    <div className="space-y-6">
                        {/* Valor do Lucro */}
                        <div className="space-y-4">
                            <Label className="text-sm font-semibold text-slate-700">Lucro para Simulação</Label>
                            <div className="space-y-3">
                                <Input
                                    type="number"
                                    value={simulatedProfit}
                                    onChange={(e) => setSimulatedProfit(parseFloat(e.target.value) || 0)}
                                    placeholder="Digite o valor do lucro"
                                    className="text-lg font-semibold"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    {predefinedScenarios.map((scenario) => (
                                        <Button
                                            key={scenario.name}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSimulatedProfit(scenario.profit)}
                                            className={`text-xs ${simulatedProfit === scenario.profit ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}
                                        >
                                            {scenario.name}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Configuração de Percentuais */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold text-slate-700">Distribuição</Label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setUseCustomPercentages(!useCustomPercentages)}
                                    className="text-xs"
                                >
                                    {useCustomPercentages ? 'Usar Padrão' : 'Personalizar'}
                                </Button>
                            </div>

                            {useCustomPercentages ? (
                                <div className="space-y-4">
                                    {configs.map((config) => {
                                        const categoryInfo = categoryConfig[config.category]
                                        const percentage = customPercentages[config.category] || 0

                                        return (
                                            <div key={config.category} className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-sm font-medium">{categoryInfo.label}</Label>
                                                    <span className="text-sm font-bold">{percentage.toFixed(1)}%</span>
                                                </div>
                                                <Slider
                                                    value={[percentage]}
                                                    onValueChange={([value]) => updateCustomPercentage(config.category, value)}
                                                    max={100}
                                                    step={0.1}
                                                    className="w-full"
                                                />
                                                <div className="flex justify-between text-xs text-slate-500">
                                                    <span>0%</span>
                                                    <span>Valor: {formatCurrency((simulatedProfit * percentage) / 100)}</span>
                                                    <span>100%</span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {configs.map((config) => {
                                        const categoryInfo = categoryConfig[config.category]
                                        const Icon = categoryInfo.icon

                                        return (
                                            <div key={config.category} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${categoryInfo.color}20` }}>
                                                        <Icon className="w-4 h-4" style={{ color: categoryInfo.color }} />
                                                    </div>
                                                    <span className="text-sm font-medium">{categoryInfo.label}</span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold">{config.percentage}%</p>
                                                    <p className="text-xs text-slate-500">
                                                        {formatCurrency((simulatedProfit * config.percentage) / 100)}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Ações */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            {onSaveSimulation && (
                                <Button
                                    variant="outline"
                                    onClick={() => onSaveSimulation(simulation)}
                                    className="flex-1"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    Salvar Simulação
                                </Button>
                            )}
                            {onExecuteDistribution && totalPercentage === 100 && (
                                <Button
                                    onClick={() => onExecuteDistribution(simulation)}
                                    className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                                >
                                    <Play className="w-4 h-4 mr-2" />
                                    Executar Distribuição
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Visualização */}
                    <div className="space-y-6">
                        {/* Seletor de Gráfico */}
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-semibold text-slate-700">Visualização</Label>
                            <Select value={chartType} onValueChange={(value: 'pie' | 'bar') => setChartType(value)}>
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pie">
                                        <div className="flex items-center gap-2">
                                            <PieChart className="w-4 h-4" />
                                            Pizza
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="bar">
                                        <div className="flex items-center gap-2">
                                            <BarChart3 className="w-4 h-4" />
                                            Barras
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Gráfico */}
                        <div className="h-64">
                            {simulation.distributions.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    {chartType === 'pie' ? (
                                        <PieChart>
                                            <Pie
                                                data={simulation.distributions}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="amount"
                                                label={({ percentage }) => `${percentage.toFixed(0)}%`}
                                            >
                                                {simulation.distributions.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    ) : (
                                        <BarChart data={simulation.distributions}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis
                                                dataKey="label"
                                                stroke="#64748b"
                                                fontSize={10}
                                                angle={-45}
                                                textAnchor="end"
                                                height={60}
                                            />
                                            <YAxis
                                                stroke="#64748b"
                                                fontSize={10}
                                                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                                            />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                                                {simulation.distributions.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    )}
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full bg-slate-50 rounded-lg">
                                    <div className="text-center">
                                        <Sparkles className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                        <p className="text-sm text-slate-500">Configure as categorias para ver a simulação</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Resumo da Simulação */}
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-blue-50 rounded-lg p-3">
                                    <p className="text-xs font-medium text-blue-700">Lucro Simulado</p>
                                    <p className="text-lg font-bold text-blue-900">{formatCurrency(simulatedProfit)}</p>
                                </div>
                                <div className="bg-emerald-50 rounded-lg p-3">
                                    <p className="text-xs font-medium text-emerald-700">Total Distribuído</p>
                                    <p className="text-lg font-bold text-emerald-900">
                                        {formatCurrency(simulation.distributions.reduce((sum, dist) => sum + dist.amount, 0))}
                                    </p>
                                </div>
                            </div>

                            {totalPercentage !== 100 && (
                                <div className={`p-3 rounded-lg ${totalPercentage > 100 ? 'bg-red-50 border border-red-200' : 'bg-orange-50 border border-orange-200'}`}>
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className={`w-4 h-4 ${totalPercentage > 100 ? 'text-red-600' : 'text-orange-600'}`} />
                                        <span className={`text-xs font-medium ${totalPercentage > 100 ? 'text-red-700' : 'text-orange-700'}`}>
                                            {totalPercentage > 100
                                                ? `Excesso de ${(totalPercentage - 100).toFixed(1)}% - ajuste necessário`
                                                : `Restam ${(100 - totalPercentage).toFixed(1)}% para distribuir`
                                            }
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}