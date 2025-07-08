// components/financial/FinancialFilters.tsx
'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
    Search,
    Filter,
    Calendar as CalendarIcon,
    X,
    RefreshCw,
    Download,
    Settings
} from 'lucide-react'
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { FinancialFilters } from '@/lib/services/financial.service'
import type { PaymentStatus, PaymentMethod } from '@/lib/database/supabase/types'

interface FinancialFiltersProps {
    filters: FinancialFilters
    onFiltersChange: (filters: FinancialFilters) => void
    onClearFilters: () => void
    hasActiveFilters: boolean
    isLoading?: boolean
    className?: string
    showDatePresets?: boolean
    showExportButton?: boolean
    onExport?: () => void
    onRefresh?: () => void
}

export const FinancialFilters: React.FC<FinancialFiltersProps> = ({
                                                                      filters,
                                                                      onFiltersChange,
                                                                      onClearFilters,
                                                                      hasActiveFilters,
                                                                      isLoading = false,
                                                                      className = "",
                                                                      showDatePresets = true,
                                                                      showExportButton = true,
                                                                      onExport,
                                                                      onRefresh
                                                                  }) => {
    const [dateFrom, setDateFrom] = useState<Date | undefined>(
        filters.dateFrom ? new Date(filters.dateFrom) : undefined
    )
    const [dateTo, setDateTo] = useState<Date | undefined>(
        filters.dateTo ? new Date(filters.dateTo) : undefined
    )

    // Opções de status de pagamento
    const paymentStatusOptions: { value: PaymentStatus; label: string }[] = [
        { value: 'paid', label: 'Pago' },
        { value: 'pending', label: 'Pendente' },
        { value: 'cancelled', label: 'Cancelado' },
        { value: 'refunded', label: 'Reembolsado' }
    ]

    // Opções de método de pagamento
    const paymentMethodOptions: { value: PaymentMethod; label: string }[] = [
        { value: 'cash', label: 'Dinheiro' },
        { value: 'pix', label: 'PIX' },
        { value: 'debit', label: 'Cartão de Débito' },
        { value: 'credit', label: 'Cartão de Crédito' },
        { value: 'installment', label: 'Parcelado' }
    ]

    // Presets de data
    const datePresets = [
        {
            label: 'Hoje',
            value: 'today',
            dates: {
                from: format(new Date(), 'yyyy-MM-dd'),
                to: format(new Date(), 'yyyy-MM-dd')
            }
        },
        {
            label: 'Últimos 7 dias',
            value: 'last7days',
            dates: {
                from: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
                to: format(new Date(), 'yyyy-MM-dd')
            }
        },
        {
            label: 'Últimos 30 dias',
            value: 'last30days',
            dates: {
                from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
                to: format(new Date(), 'yyyy-MM-dd')
            }
        },
        {
            label: 'Este mês',
            value: 'thismonth',
            dates: {
                from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
                to: format(endOfMonth(new Date()), 'yyyy-MM-dd')
            }
        },
        {
            label: 'Mês passado',
            value: 'lastmonth',
            dates: {
                from: format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
                to: format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd')
            }
        }
    ]

    // Aplicar preset de data
    const applyDatePreset = (preset: string) => {
        const presetData = datePresets.find(p => p.value === preset)
        if (presetData) {
            onFiltersChange({
                ...filters,
                dateFrom: presetData.dates.from,
                dateTo: presetData.dates.to
            })
            setDateFrom(new Date(presetData.dates.from))
            setDateTo(new Date(presetData.dates.to))
        }
    }

    // Aplicar datas customizadas
    const applyCustomDates = () => {
        onFiltersChange({
            ...filters,
            dateFrom: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined,
            dateTo: dateTo ? format(dateTo, 'yyyy-MM-dd') : undefined
        })
    }

    // Atualizar filtro específico
    const updateFilter = (key: keyof FinancialFilters, value: any) => {
        onFiltersChange({
            ...filters,
            [key]: value
        })
    }

    // Remover filtro específico
    const removeFilter = (key: keyof FinancialFilters) => {
        const newFilters = { ...filters }
        delete newFilters[key]
        onFiltersChange(newFilters)
    }

    // Contar filtros ativos
    const activeFiltersCount = Object.keys(filters).length

    return (
        <Card className={`border-0 shadow-xl shadow-slate-200/60 overflow-hidden ${className}`}>
            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Filter className="w-5 h-5 text-blue-500" />
                        Filtros Financeiros
                        {activeFiltersCount > 0 && (
                            <Badge variant="default" className="ml-2 bg-blue-500">
                                {activeFiltersCount}
                            </Badge>
                        )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {hasActiveFilters && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onClearFilters}
                                className="bg-white border-slate-200 hover:bg-slate-50"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Limpar
                            </Button>
                        )}
                        {onRefresh && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onRefresh}
                                disabled={isLoading}
                                className="bg-white border-slate-200 hover:bg-slate-50"
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                Atualizar
                            </Button>
                        )}
                        {showExportButton && onExport && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onExport}
                                className="bg-white border-slate-200 hover:bg-slate-50"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Exportar
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 lg:p-6">
                <div className="space-y-6">
                    {/* Filtros de Data */}
                    {showDatePresets && (
                        <div className="space-y-4">
                            <Label className="text-sm font-semibold text-slate-700">Período</Label>
                            <Tabs defaultValue="" className="w-full">
                                <TabsList className="bg-slate-100 border-0 flex-wrap h-auto p-1">
                                    {datePresets.map((preset) => (
                                        <TabsTrigger
                                            key={preset.value}
                                            value={preset.value}
                                            onClick={() => applyDatePreset(preset.value)}
                                            className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs"
                                        >
                                            {preset.label}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>
                        </div>
                    )}

                    {/* Datas Customizadas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="dateFrom" className="text-sm font-medium text-slate-700">
                                Data Inicial
                            </Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start text-left font-normal bg-white border-slate-200"
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateFrom ? format(dateFrom, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={dateFrom}
                                        onSelect={(date) => {
                                            setDateFrom(date)
                                            if (date) applyCustomDates()
                                        }}
                                        initialFocus
                                        locale={ptBR}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dateTo" className="text-sm font-medium text-slate-700">
                                Data Final
                            </Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start text-left font-normal bg-white border-slate-200"
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateTo ? format(dateTo, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={dateTo}
                                        onSelect={(date) => {
                                            setDateTo(date)
                                            if (date) applyCustomDates()
                                        }}
                                        initialFocus
                                        locale={ptBR}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Filtros de Status e Método */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">
                                Status do Pagamento
                            </Label>
                            <Select
                                value={filters.paymentStatus || ''}
                                onValueChange={(value) => updateFilter('paymentStatus', value as PaymentStatus)}
                            >
                                <SelectTrigger className="bg-white border-slate-200">
                                    <SelectValue placeholder="Todos os status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Todos os status</SelectItem>
                                    {paymentStatusOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">
                                Método de Pagamento
                            </Label>
                            <Select
                                value={filters.paymentMethod || ''}
                                onValueChange={(value) => updateFilter('paymentMethod', value as PaymentMethod)}
                            >
                                <SelectTrigger className="bg-white border-slate-200">
                                    <SelectValue placeholder="Todos os métodos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Todos os métodos</SelectItem>
                                    {paymentMethodOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Filtros Ativos */}
                    {hasActiveFilters && (
                        <div className="pt-4 border-t border-slate-200">
                            <Label className="text-sm font-semibold text-slate-700 mb-3 block">
                                Filtros Ativos
                            </Label>
                            <div className="flex flex-wrap gap-2">
                                {filters.dateFrom && (
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                        Início: {format(new Date(filters.dateFrom), "dd/MM/yyyy", { locale: ptBR })}
                                        <button
                                            onClick={() => removeFilter('dateFrom')}
                                            className="ml-1 hover:bg-slate-300 rounded-full p-0.5"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                )}
                                {filters.dateTo && (
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                        Fim: {format(new Date(filters.dateTo), "dd/MM/yyyy", { locale: ptBR })}
                                        <button
                                            onClick={() => removeFilter('dateTo')}
                                            className="ml-1 hover:bg-slate-300 rounded-full p-0.5"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                )}
                                {filters.paymentStatus && (
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                        Status: {paymentStatusOptions.find(o => o.value === filters.paymentStatus)?.label}
                                        <button
                                            onClick={() => removeFilter('paymentStatus')}
                                            className="ml-1 hover:bg-slate-300 rounded-full p-0.5"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                )}
                                {filters.paymentMethod && (
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                        Método: {paymentMethodOptions.find(o => o.value === filters.paymentMethod)?.label}
                                        <button
                                            onClick={() => removeFilter('paymentMethod')}
                                            className="ml-1 hover:bg-slate-300 rounded-full p-0.5"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}