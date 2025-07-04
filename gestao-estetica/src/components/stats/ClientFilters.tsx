'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import {
    Search,
    Filter,
    X,
    Calendar,
    DollarSign,
    Users,
    Crown,
    AlertTriangle,
    UserPlus,
    RefreshCw,
    Download,
    SlidersHorizontal
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Database } from '@/lib/database/supabase/types'

type ClientStatus = Database['public']['Enums']['client_status_enum']
type ClientSegment = Database['public']['Enums']['client_segment_enum']

interface ClientFiltersData {
    search: string
    status: ClientStatus | 'all'
    segment: ClientSegment | 'all'
    dateRange: {
        from: Date | null
        to: Date | null
        type: 'created' | 'last_visit' | 'birthday'
    }
    spending: {
        min: number | null
        max: number | null
    }
    visits: {
        min: number | null
        max: number | null
    }
    city: string
    birthdayMonth: number | null
}

interface ClientFiltersProps {
    filters: Partial<ClientFiltersData>
    onFiltersChange: (filters: Partial<ClientFiltersData>) => void
    onClearFilters: () => void
    onExport?: () => void
    totalClients?: number
    filteredClients?: number
    loading?: boolean
}

const ClientFilters: React.FC<ClientFiltersProps> = ({
                                                         filters,
                                                         onFiltersChange,
                                                         onClearFilters,
                                                         onExport,
                                                         totalClients = 0,
                                                         filteredClients = 0,
                                                         loading = false
                                                     }) => {
    const [showAdvanced, setShowAdvanced] = useState(false)

    const updateFilter = (key: keyof ClientFiltersData, value: any) => {
        onFiltersChange({ [key]: value })
    }

    const getActiveFiltersCount = () => {
        let count = 0
        if (filters.search) count++
        if (filters.status && filters.status !== 'all') count++
        if (filters.segment && filters.segment !== 'all') count++
        if (filters.dateRange?.from || filters.dateRange?.to) count++
        if (filters.spending?.min !== null || filters.spending?.max !== null) count++
        if (filters.visits?.min !== null || filters.visits?.max !== null) count++
        if (filters.city) count++
        if (filters.birthdayMonth) count++
        return count
    }

    const activeFiltersCount = getActiveFiltersCount()

    const renderActiveFilters = () => {
        const activeFilters = []

        if (filters.search) {
            activeFilters.push(
                <Badge key="search" variant="secondary" className="flex items-center gap-1">
                    Busca: {filters.search}
                    <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => updateFilter('search', '')}
                    />
                </Badge>
            )
        }

        if (filters.status && filters.status !== 'all') {
            activeFilters.push(
                <Badge key="status" variant="secondary" className="flex items-center gap-1">
                    Status: {filters.status}
                    <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => updateFilter('status', 'all')}
                    />
                </Badge>
            )
        }

        if (filters.segment && filters.segment !== 'all') {
            activeFilters.push(
                <Badge key="segment" variant="secondary" className="flex items-center gap-1">
                    Segmento: {filters.segment}
                    <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => updateFilter('segment', 'all')}
                    />
                </Badge>
            )
        }

        if (filters.city) {
            activeFilters.push(
                <Badge key="city" variant="secondary" className="flex items-center gap-1">
                    Cidade: {filters.city}
                    <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => updateFilter('city', '')}
                    />
                </Badge>
            )
        }

        return activeFilters
    }

    return (
        <div className="space-y-4">
            {/* Filtros Principais */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Search className="w-5 h-5 text-purple-500" />
                            Filtros e Busca
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            {activeFiltersCount > 0 && (
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                    {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''}
                                </Badge>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="text-xs"
                            >
                                <SlidersHorizontal className="w-4 h-4 mr-1" />
                                Avançado
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Busca e Filtros Rápidos */}
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <Input
                                    placeholder="Buscar por nome, email, telefone ou CPF..."
                                    value={filters.search || ''}
                                    onChange={(e) => updateFilter('search', e.target.value)}
                                    className="pl-10 border-slate-200 focus:border-purple-500 focus:ring-purple-500/20"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Tabs value={filters.status || 'all'} onValueChange={(value) => updateFilter('status', value)}>
                                <TabsList className="bg-slate-100 border-0">
                                    <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Todos</TabsTrigger>
                                    <TabsTrigger value="active" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Ativos</TabsTrigger>
                                    <TabsTrigger value="inactive" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Inativos</TabsTrigger>
                                    <TabsTrigger value="blocked" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Bloqueados</TabsTrigger>
                                </TabsList>
                            </Tabs>
                            <Tabs value={filters.segment || 'all'} onValueChange={(value) => updateFilter('segment', value)}>
                                <TabsList className="bg-slate-100 border-0">
                                    <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Todos</TabsTrigger>
                                    <TabsTrigger value="vip" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">VIP</TabsTrigger>
                                    <TabsTrigger value="new" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Novos</TabsTrigger>
                                    <TabsTrigger value="at_risk" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Em Risco</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </div>

                    {/* Filtros Avançados */}
                    {showAdvanced && (
                        <div className="border-t pt-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Filtro de Cidade */}
                                <div className="space-y-2">
                                    <Label htmlFor="city">Cidade</Label>
                                    <Input
                                        id="city"
                                        placeholder="Filtrar por cidade"
                                        value={filters.city || ''}
                                        onChange={(e) => updateFilter('city', e.target.value)}
                                    />
                                </div>

                                {/* Filtro de Mês de Aniversário */}
                                <div className="space-y-2">
                                    <Label htmlFor="birthday-month">Mês de Aniversário</Label>
                                    <Select
                                        value={filters.birthdayMonth?.toString() || ''}
                                        onValueChange={(value) => updateFilter('birthdayMonth', value ? parseInt(value) : null)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecionar mês" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Todos os meses</SelectItem>
                                            <SelectItem value="1">Janeiro</SelectItem>
                                            <SelectItem value="2">Fevereiro</SelectItem>
                                            <SelectItem value="3">Março</SelectItem>
                                            <SelectItem value="4">Abril</SelectItem>
                                            <SelectItem value="5">Maio</SelectItem>
                                            <SelectItem value="6">Junho</SelectItem>
                                            <SelectItem value="7">Julho</SelectItem>
                                            <SelectItem value="8">Agosto</SelectItem>
                                            <SelectItem value="9">Setembro</SelectItem>
                                            <SelectItem value="10">Outubro</SelectItem>
                                            <SelectItem value="11">Novembro</SelectItem>
                                            <SelectItem value="12">Dezembro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Filtro de Valor Gasto */}
                                <div className="space-y-2">
                                    <Label>Valor Gasto (R$)</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="number"
                                            placeholder="Mín"
                                            value={filters.spending?.min || ''}
                                            onChange={(e) => updateFilter('spending', {
                                                ...filters.spending,
                                                min: e.target.value ? parseFloat(e.target.value) : null
                                            })}
                                        />
                                        <Input
                                            type="number"
                                            placeholder="Máx"
                                            value={filters.spending?.max || ''}
                                            onChange={(e) => updateFilter('spending', {
                                                ...filters.spending,
                                                max: e.target.value ? parseFloat(e.target.value) : null
                                            })}
                                        />
                                    </div>
                                </div>

                                {/* Filtro de Número de Visitas */}
                                <div className="space-y-2">
                                    <Label>Número de Visitas</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="number"
                                            placeholder="Mín"
                                            value={filters.visits?.min || ''}
                                            onChange={(e) => updateFilter('visits', {
                                                ...filters.visits,
                                                min: e.target.value ? parseInt(e.target.value) : null
                                            })}
                                        />
                                        <Input
                                            type="number"
                                            placeholder="Máx"
                                            value={filters.visits?.max || ''}
                                            onChange={(e) => updateFilter('visits', {
                                                ...filters.visits,
                                                max: e.target.value ? parseInt(e.target.value) : null
                                            })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Filtros Ativos */}
                    {activeFiltersCount > 0 && (
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                            <span className="text-sm font-medium text-slate-600">Filtros ativos:</span>
                            {renderActiveFilters()}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClearFilters}
                                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                                <X className="w-3 h-3 mr-1" />
                                Limpar todos
                            </Button>
                        </div>
                    )}

                    {/* Ações e Resultados */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t">
                        <div className="flex items-center gap-4">
                            <div className="text-sm text-slate-600">
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        Carregando...
                                    </div>
                                ) : (
                                    <>
                                        Mostrando <span className="font-semibold">{filteredClients}</span> de{' '}
                                        <span className="font-semibold">{totalClients}</span> clientes
                                    </>
                                )}
                            </div>
                            {filteredClients !== totalClients && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    Filtrados
                                </Badge>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {onExport && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onExport}
                                    disabled={loading || filteredClients === 0}
                                    className="text-xs"
                                >
                                    <Download className="w-4 h-4 mr-1" />
                                    Exportar ({filteredClients})
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Filtros Rápidos por Segmento */}
            <div className="flex flex-wrap gap-2">
                <Button
                    variant={filters.segment === 'vip' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('segment', filters.segment === 'vip' ? 'all' : 'vip')}
                    className="flex items-center gap-2"
                >
                    <Crown className="w-4 h-4" />
                    Clientes VIP
                </Button>
                <Button
                    variant={filters.segment === 'new' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('segment', filters.segment === 'new' ? 'all' : 'new')}
                    className="flex items-center gap-2"
                >
                    <UserPlus className="w-4 h-4" />
                    Novos Clientes
                </Button>
                <Button
                    variant={filters.segment === 'at_risk' ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('segment', filters.segment === 'at_risk' ? 'all' : 'at_risk')}
                    className="flex items-center gap-2"
                >
                    <AlertTriangle className="w-4 h-4" />
                    Em Risco
                </Button>
                <Button
                    variant={filters.birthdayMonth ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('birthdayMonth', filters.birthdayMonth ? null : new Date().getMonth() + 1)}
                    className="flex items-center gap-2"
                >
                    <Calendar className="w-4 h-4" />
                    Aniversariantes do Mês
                </Button>
            </div>
        </div>
    )
}

export default ClientFilters