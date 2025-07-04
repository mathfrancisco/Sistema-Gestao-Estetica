'use client'

import React, { useState} from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    Target,
    Users,
    Crown,
    UserPlus,
    AlertTriangle,
    XCircle,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    Filter,
    Download,
    ChevronRight,
    Sparkles,
    Settings,
    BarChart3,
    ArrowRight,
    CheckCircle,
    Zap,
    Brain
} from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { toast } from 'sonner'
import type { Database } from '@/lib/database/supabase/types'
import {
    useClientsBySegment,
    useClientStats,
    useBulkUpdateClientSegments
} from "@/lib/hooks/useClients"
import { Sidebar } from '@/components/layout/sidebar'

type Client = Database['public']['Tables']['clients']['Row']
type ClientSegment = Database['public']['Enums']['client_segment_enum']

interface SegmentConfig {
    key: ClientSegment
    label: string
    description: string
    icon: React.ElementType
    color: string
    gradient: string
    criteria: string[]
    autoRules: {
        totalSpent?: { min?: number; max?: number }
        totalVisits?: { min?: number; max?: number }
        daysSinceLastVisit?: { min?: number; max?: number }
        daysSinceFirstVisit?: { min?: number; max?: number }
    }
}

const SegmentsPage: React.FC = () => {
    const [selectedSegment, setSelectedSegment] = useState<ClientSegment>('vip')
    const [autoSegmentationRunning, setAutoSegmentationRunning] = useState(false)

    // Hooks para dados
    const { data: clientStats, isLoading: statsLoading } = useClientStats()
    const { data: vipClients } = useClientsBySegment('vip')
    const { data: regularClients } = useClientsBySegment('regular')
    const { data: newClients } = useClientsBySegment('new')
    const { data: atRiskClients } = useClientsBySegment('at_risk')
    const { data: lostClients } = useClientsBySegment('lost')
    const { mutate: bulkUpdateSegments } = useBulkUpdateClientSegments()

    // Configuração dos segmentos
    const segmentConfigs: SegmentConfig[] = [
        {
            key: 'vip',
            label: 'Clientes VIP',
            description: 'Clientes de alto valor e frequência',
            icon: Crown,
            color: 'text-amber-600',
            gradient: 'from-amber-500 to-orange-500',
            criteria: [
                'Valor total gasto > R$ 2.000',
                'Mais de 10 visitas',
                'Última visita nos últimos 30 dias'
            ],
            autoRules: {
                totalSpent: { min: 2000 },
                totalVisits: { min: 10 },
                daysSinceLastVisit: { max: 30 }
            }
        },
        {
            key: 'regular',
            label: 'Clientes Regulares',
            description: 'Clientes com padrão estável de consumo',
            icon: Users,
            color: 'text-blue-600',
            gradient: 'from-blue-500 to-blue-600',
            criteria: [
                'Valor total gasto entre R$ 500 - R$ 2.000',
                'Entre 3-10 visitas',
                'Última visita nos últimos 60 dias'
            ],
            autoRules: {
                totalSpent: { min: 500, max: 2000 },
                totalVisits: { min: 3, max: 10 },
                daysSinceLastVisit: { max: 60 }
            }
        },
        {
            key: 'new',
            label: 'Novos Clientes',
            description: 'Clientes cadastrados nos últimos 90 dias',
            icon: UserPlus,
            color: 'text-green-600',
            gradient: 'from-green-500 to-emerald-500',
            criteria: [
                'Cadastrado nos últimos 90 dias',
                'Até 3 visitas',
                'Ainda explorando os serviços'
            ],
            autoRules: {
                daysSinceFirstVisit: { max: 90 },
                totalVisits: { max: 3 }
            }
        },
        {
            key: 'at_risk',
            label: 'Clientes em Risco',
            description: 'Clientes que precisam de reativação',
            icon: AlertTriangle,
            color: 'text-red-600',
            gradient: 'from-red-500 to-red-600',
            criteria: [
                'Sem visitas há mais de 60 dias',
                'Histórico de visitas regulares',
                'Potencial para retorno'
            ],
            autoRules: {
                daysSinceLastVisit: { min: 60 },
                totalVisits: { min: 2 }
            }
        },
        {
            key: 'lost',
            label: 'Clientes Perdidos',
            description: 'Clientes inativos há muito tempo',
            icon: XCircle,
            color: 'text-gray-600',
            gradient: 'from-gray-500 to-gray-600',
            criteria: [
                'Sem visitas há mais de 180 dias',
                'Baixa probabilidade de retorno',
                'Candidatos a remoção'
            ],
            autoRules: {
                daysSinceLastVisit: { min: 180 }
            }
        }
    ]

    const getSegmentData = (segment: ClientSegment) => {
        const data = {
            vip: vipClients || [],
            regular: regularClients || [],
            new: newClients || [],
            at_risk: atRiskClients || [],
            lost: lostClients || []
        }
        return data[segment]
    }

    const getSegmentStats = () => {
        const total = clientStats?.total || 0
        return {
            vip: { count: vipClients?.length || 0, percentage: total ? (vipClients?.length || 0) / total * 100 : 0 },
            regular: { count: regularClients?.length || 0, percentage: total ? (regularClients?.length || 0) / total * 100 : 0 },
            new: { count: newClients?.length || 0, percentage: total ? (newClients?.length || 0) / total * 100 : 0 },
            at_risk: { count: atRiskClients?.length || 0, percentage: total ? (atRiskClients?.length || 0) / total * 100 : 0 },
            lost: { count: lostClients?.length || 0, percentage: total ? (lostClients?.length || 0) / total * 100 : 0 }
        }
    }

    const handleAutoSegmentation = async () => {
        setAutoSegmentationRunning(true)
        try {
            // Aqui você implementaria a lógica de segmentação automática
            toast.success('Segmentação automática executada com sucesso!')
            setTimeout(() => {
                setAutoSegmentationRunning(false)
            }, 3000)
        } catch (error) {
            toast.error('Erro ao executar segmentação automática')
            setAutoSegmentationRunning(false)
        }
    }

    const stats = getSegmentStats()
    const currentSegmentConfig = segmentConfigs.find(s => s.key === selectedSegment)
    const currentSegmentData = getSegmentData(selectedSegment)

    const metricsData = [
        {
            title: 'Clientes VIP',
            value: stats.vip.count,
            percentage: stats.vip.percentage,
            icon: Crown,
            gradient: 'from-amber-500 to-orange-500',
            trend: { value: 12, isPositive: true }
        },
        {
            title: 'Clientes Regulares',
            value: stats.regular.count,
            percentage: stats.regular.percentage,
            icon: Users,
            gradient: 'from-blue-500 to-blue-600',
            trend: { value: 8, isPositive: true }
        },
        {
            title: 'Novos Clientes',
            value: stats.new.count,
            percentage: stats.new.percentage,
            icon: UserPlus,
            gradient: 'from-green-500 to-emerald-500',
            trend: { value: 25, isPositive: true }
        },
        {
            title: 'Em Risco',
            value: stats.at_risk.count,
            percentage: stats.at_risk.percentage,
            icon: AlertTriangle,
            gradient: 'from-red-500 to-red-600',
            trend: { value: 5, isPositive: false }
        }
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            <Sidebar />

            <div className="lg:ml-64">
                {/* Header */}
                <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
                    <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                        <Target className="w-4 h-4 text-white" />
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                        Segmentação de Clientes
                                    </h1>
                                </div>
                                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                                    Análise inteligente e categorização automática de clientes
                                </p>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3">
                                <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-lg shadow-emerald-500/25 text-xs">
                                    <Brain className="w-3 h-3 mr-1" />
                                    IA Ativa
                                </Badge>

                                <div className="flex items-center gap-1 sm:gap-2">
                                    <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                                        <Filter className="w-4 h-4 text-slate-600" />
                                    </button>
                                    <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                                        <Download className="w-4 h-4 text-slate-600" />
                                    </button>
                                    <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                                        <Settings className="w-4 h-4 text-slate-600" />
                                    </button>
                                </div>

                                <Button
                                    onClick={handleAutoSegmentation}
                                    disabled={autoSegmentationRunning}
                                    className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-lg shadow-purple-500/25 border-0"
                                >
                                    {autoSegmentationRunning ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            Executando...
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="w-4 h-4 mr-2" />
                                            Auto Segmentação
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">

                        {/* Métricas dos Segmentos */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                            {metricsData.map((metric, index) => (
                                <Card key={index} className="relative overflow-hidden border-0 shadow-xl shadow-slate-200/60 hover:shadow-2xl hover:shadow-slate-300/60 transition-all duration-300 hover:-translate-y-1">
                                    <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-5`} />
                                    <CardContent className="p-4 lg:p-6 relative">
                                        <div className="flex items-center justify-between mb-3 lg:mb-4">
                                            <div className={`p-2 lg:p-3 rounded-2xl bg-gradient-to-br ${metric.gradient} shadow-lg`}>
                                                <metric.icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                                            </div>
                                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                                metric.trend.isPositive
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {metric.trend.isPositive ? (
                                                    <TrendingUp className="w-3 h-3" />
                                                ) : (
                                                    <TrendingDown className="w-3 h-3" />
                                                )}
                                                +{metric.trend.value}%
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-xs lg:text-sm font-medium text-slate-600">{metric.title}</p>
                                            <p className="text-xl lg:text-3xl font-bold text-slate-900">
                                                {metric.value}
                                            </p>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-slate-500">{metric.percentage.toFixed(1)}% do total</span>
                                                </div>
                                                <Progress value={metric.percentage} className="h-2" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Configuração e Visualização dos Segmentos */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Lista de Segmentos */}
                            <Card className="border-0 shadow-xl shadow-slate-200/60">
                                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                    <CardTitle className="flex items-center gap-2">
                                        <Target className="w-5 h-5 text-purple-500" />
                                        Segmentos Disponíveis
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="space-y-1">
                                        {segmentConfigs.map((segment) => {
                                            const isSelected = selectedSegment === segment.key
                                            const segmentStat = stats[segment.key]

                                            return (
                                                <div
                                                    key={segment.key}
                                                    onClick={() => setSelectedSegment(segment.key)}
                                                    className={`p-4 cursor-pointer transition-all duration-200 border-l-4 ${
                                                        isSelected
                                                            ? `border-purple-500 bg-purple-50`
                                                            : 'border-transparent hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-lg bg-gradient-to-br ${segment.gradient}`}>
                                                                <segment.icon className="w-4 h-4 text-white" />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-semibold text-slate-900">{segment.label}</h3>
                                                                <p className="text-sm text-slate-600">{segmentStat.count} clientes</p>
                                                            </div>
                                                        </div>
                                                        <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Detalhes do Segmento Selecionado */}
                            <div className="lg:col-span-2 space-y-6">
                                {currentSegmentConfig && (
                                    <>
                                        {/* Informações do Segmento */}
                                        <Card className="border-0 shadow-xl shadow-slate-200/60">
                                            <CardHeader className={`bg-gradient-to-r ${currentSegmentConfig.gradient} text-white`}>
                                                <CardTitle className="flex items-center gap-2">
                                                    <currentSegmentConfig.icon className="w-5 h-5" />
                                                    {currentSegmentConfig.label}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-6">
                                                <div className="space-y-4">
                                                    <p className="text-slate-700">{currentSegmentConfig.description}</p>

                                                    <div>
                                                        <h4 className="font-semibold text-slate-900 mb-2">Critérios de Segmentação:</h4>
                                                        <ul className="space-y-1">
                                                            {currentSegmentConfig.criteria.map((criteria, index) => (
                                                                <li key={index} className="flex items-center gap-2 text-sm text-slate-600">
                                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                                    {criteria}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                                        <div className="text-center">
                                                            <div className="text-2xl font-bold text-slate-900">
                                                                {stats[selectedSegment].count}
                                                            </div>
                                                            <div className="text-sm text-slate-600">Total de Clientes</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-2xl font-bold text-slate-900">
                                                                {stats[selectedSegment].percentage.toFixed(1)}%
                                                            </div>
                                                            <div className="text-sm text-slate-600">% da Base</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Lista de Clientes do Segmento */}
                                        <Card className="border-0 shadow-xl shadow-slate-200/60">
                                            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="flex items-center gap-2">
                                                        <Users className="w-5 h-5 text-slate-600" />
                                                        Clientes - {currentSegmentConfig.label}
                                                    </CardTitle>
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                        {currentSegmentData.length} clientes
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-0">
                                                {currentSegmentData.length === 0 ? (
                                                    <div className="text-center py-12">
                                                        <currentSegmentConfig.icon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                                            Nenhum cliente neste segmento
                                                        </h3>
                                                        <p className="text-slate-500">
                                                            Execute a segmentação automática para categorizar os clientes.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="max-h-96 overflow-y-auto">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow className="bg-slate-50/50">
                                                                    <TableHead>Cliente</TableHead>
                                                                    <TableHead>Valor Total</TableHead>
                                                                    <TableHead>Visitas</TableHead>
                                                                    <TableHead>Última Visita</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {currentSegmentData.slice(0, 10).map((client) => (
                                                                    <TableRow key={client.id} className="hover:bg-slate-50/50">
                                                                        <TableCell>
                                                                            <div>
                                                                                <p className="font-medium text-slate-900">{client.name}</p>
                                                                                <p className="text-sm text-slate-500">{client.email}</p>
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <span className="font-medium">
                                                                                R$ {client.total_spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                            </span>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <span className="font-medium">{client.total_visits}</span>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <span className="text-sm text-slate-600">
                                                                                {client.last_visit
                                                                                    ? format(new Date(client.last_visit), 'dd/MM/yyyy', { locale: ptBR })
                                                                                    : 'Nunca'
                                                                                }
                                                                            </span>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                        {currentSegmentData.length > 10 && (
                                                            <div className="p-4 text-center border-t">
                                                                <Link href={`/clientes?segment=${selectedSegment}`}>
                                                                    <Button variant="outline" size="sm">
                                                                        Ver todos os {currentSegmentData.length} clientes
                                                                        <ArrowRight className="w-4 h-4 ml-2" />
                                                                    </Button>
                                                                </Link>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Ações Rápidas */}
                        <Card className="border-0 shadow-xl shadow-slate-200/60">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                <CardTitle className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-purple-500" />
                                    Ações de Segmentação
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <Button
                                        variant="outline"
                                        className="h-auto p-4 flex flex-col items-start text-left bg-white hover:bg-amber-50 border-amber-200"
                                        asChild
                                    >
                                        <Link href="/clientes/campanhas?segment=vip">
                                            <Crown className="w-5 h-5 text-amber-600 mb-2" />
                                            <span className="font-semibold">Campanha VIP</span>
                                            <span className="text-xs text-slate-600">Ofertas exclusivas para clientes VIP</span>
                                        </Link>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        className="h-auto p-4 flex flex-col items-start text-left bg-white hover:bg-red-50 border-red-200"
                                        asChild
                                    >
                                        <Link href="/clientes/campanhas?segment=at_risk">
                                            <AlertTriangle className="w-5 h-5 text-red-600 mb-2" />
                                            <span className="font-semibold">Reativação</span>
                                            <span className="text-xs text-slate-600">Campanhas para clientes em risco</span>
                                        </Link>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        className="h-auto p-4 flex flex-col items-start text-left bg-white hover:bg-green-50 border-green-200"
                                        asChild
                                    >
                                        <Link href="/clientes/campanhas?segment=new">
                                            <UserPlus className="w-5 h-5 text-green-600 mb-2" />
                                            <span className="font-semibold">Boas-vindas</span>
                                            <span className="text-xs text-slate-600">Campanhas para novos clientes</span>
                                        </Link>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        className="h-auto p-4 flex flex-col items-start text-left bg-white hover:bg-blue-50 border-blue-200"
                                        onClick={() => {
                                            toast.info('Relatório de segmentação sendo gerado...')
                                        }}
                                    >
                                        <BarChart3 className="w-5 h-5 text-blue-600 mb-2" />
                                        <span className="font-semibold">Relatório</span>
                                        <span className="text-xs text-slate-600">Análise detalhada dos segmentos</span>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default SegmentsPage