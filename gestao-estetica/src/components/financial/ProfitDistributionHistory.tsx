// components/financial/ProfitDistributionHistory.tsx
'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    History,
    Calendar,
    DollarSign,
    TrendingUp,
    Settings,
    AlertTriangle,
    MoreHorizontal,
    Download,
    Eye,
    RefreshCw,
    PieChart,
    Calculator,
    Target
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { ProfitDistributionWithConfig } from '@/lib/services/financial.service'

interface ProfitDistributionHistoryProps {
    distributions: ProfitDistributionWithConfig[]
    isLoading?: boolean
    onViewDetails?: (distribution: ProfitDistributionWithConfig) => void
    onDownloadReport?: (distribution: ProfitDistributionWithConfig) => void
    className?: string
}

export const ProfitDistributionHistory: React.FC<ProfitDistributionHistoryProps> = ({
                                                                                        distributions,
                                                                                        isLoading = false,
                                                                                        onViewDetails,
                                                                                        onDownloadReport,
                                                                                        className = ""
                                                                                    }) => {
    const formatCurrency = (value: number | null) => {
        if (value === null) return 'N/A'
        return value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        })
    }

    const formatPeriod = (month: number, year: number) => {
        const date = new Date(year, month - 1)
        return format(date, "MMMM 'de' yyyy", { locale: ptBR })
    }

    const getCategoryIcon = (category: string) => {
        const icons = {
            pro_labore: DollarSign,
            equipment_reserve: Settings,
            emergency_reserve: AlertTriangle,
            investment: TrendingUp
        }
        return icons[category as keyof typeof icons] || Calculator
    }

    const getCategoryLabel = (category: string) => {
        const labels = {
            pro_labore: 'Pró-labore',
            equipment_reserve: 'Reserva Equipamentos',
            emergency_reserve: 'Reserva Emergência',
            investment: 'Investimento'
        }
        return labels[category as keyof typeof labels] || category
    }

    const getCategoryColor = (category: string) => {
        const colors = {
            pro_labore: 'emerald',
            equipment_reserve: 'blue',
            emergency_reserve: 'orange',
            investment: 'purple'
        }
        return colors[category as keyof typeof colors] || 'gray'
    }

    // Calcular estatísticas do histórico
    const totalDistributed = distributions.reduce((sum, dist) => {
        return sum +
            (dist.pro_labore_amount || 0) +
            (dist.equipment_reserve_amount || 0) +
            (dist.emergency_reserve_amount || 0) +
            (dist.investment_amount || 0)
    }, 0)

    const averageProfit = distributions.length > 0
        ? distributions.reduce((sum, dist) => sum + (dist.total_profit || 0), 0) / distributions.length
        : 0

    if (isLoading) {
        return (
            <Card className={`border-0 shadow-xl shadow-slate-200/60 ${className}`}>
                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                    <CardTitle className="flex items-center gap-2">
                        <History className="w-5 h-5 text-blue-500" />
                        Histórico de Distribuições
                        <RefreshCw className="w-4 h-4 animate-spin ml-2 text-blue-500" />
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        {[...Array(5)].map((_, index) => (
                            <div key={index} className="animate-pulse">
                                <div className="h-16 bg-slate-100 rounded-lg" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={`border-0 shadow-xl shadow-slate-200/60 overflow-hidden ${className}`}>
            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg lg:text-xl mb-2">
                            <History className="w-5 h-5 text-blue-500" />
                            Histórico de Distribuições ({distributions.length})
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-4">
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                                <Target className="w-3 h-3 mr-1" />
                                Total: {formatCurrency(totalDistributed)}
                            </Badge>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                <Calculator className="w-3 h-3 mr-1" />
                                Média: {formatCurrency(averageProfit)}
                            </Badge>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-white border-slate-200 hover:bg-slate-50"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Exportar Histórico
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {distributions.length === 0 ? (
                    <div className="text-center py-12 px-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <History className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                            Nenhuma distribuição encontrada
                        </h3>
                        <p className="text-slate-500 mb-6 max-w-md mx-auto">
                            Ainda não há histórico de distribuições de lucro. Execute sua primeira distribuição para visualizar os dados aqui.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50 hover:bg-slate-50">
                                    <TableHead className="font-semibold text-slate-700">Período</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Receita</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Lucro</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Pró-labore</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Equipamentos</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Emergência</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Investimento</TableHead>
                                    <TableHead className="text-right font-semibold text-slate-700">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {distributions.map((distribution) => {
                                    const totalDistributed =
                                        (distribution.pro_labore_amount || 0) +
                                        (distribution.equipment_reserve_amount || 0) +
                                        (distribution.emergency_reserve_amount || 0) +
                                        (distribution.investment_amount || 0)

                                    return (
                                        <TableRow key={distribution.id} className="hover:bg-slate-50/50 transition-colors">
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                                        <Calendar className="w-4 h-4 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900">
                                                            {formatPeriod(distribution.period_month, distribution.period_year)}
                                                        </p>
                                                        <p className="text-sm text-slate-500">
                                                            {format(new Date(distribution.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <p className="font-medium text-slate-900">
                                                    {formatCurrency(distribution.total_revenue)}
                                                </p>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <p className="font-semibold text-emerald-600">
                                                    {formatCurrency(distribution.total_profit)}
                                                </p>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                                    <span className="text-sm font-medium">
                                                        {formatCurrency(distribution.pro_labore_amount)}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                                                    <span className="text-sm font-medium">
                                                        {formatCurrency(distribution.equipment_reserve_amount)}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                                                    <span className="text-sm font-medium">
                                                        {formatCurrency(distribution.emergency_reserve_amount)}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                                                    <span className="text-sm font-medium">
                                                        {formatCurrency(distribution.investment_amount)}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right py-4">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                        {onViewDetails && (
                                                            <DropdownMenuItem
                                                                onClick={() => onViewDetails(distribution)}
                                                                className="cursor-pointer"
                                                            >
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                Ver Detalhes
                                                            </DropdownMenuItem>
                                                        )}
                                                        {onDownloadReport && (
                                                            <DropdownMenuItem
                                                                onClick={() => onDownloadReport(distribution)}
                                                                className="cursor-pointer"
                                                            >
                                                                <Download className="mr-2 h-4 w-4" />
                                                                Baixar Relatório
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="cursor-pointer">
                                                            <PieChart className="mr-2 h-4 w-4" />
                                                            Ver Gráfico
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>

            {/* Resumo do Período */}
            {distributions.length > 0 && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-4 lg:p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="text-center">
                            <p className="text-sm font-medium text-slate-600">Total de Períodos</p>
                            <p className="text-xl font-bold text-slate-900">{distributions.length}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-slate-600">Total Distribuído</p>
                            <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalDistributed)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-slate-600">Lucro Médio</p>
                            <p className="text-xl font-bold text-blue-600">{formatCurrency(averageProfit)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-slate-600">Último Período</p>
                            <p className="text-sm font-semibold text-slate-700">
                                {distributions.length > 0 && formatPeriod(
                                    distributions[0].period_month,
                                    distributions[0].period_year
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    )
}