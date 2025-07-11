'use client'

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'
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
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from '@/components/ui/command'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import {
    Search,
    Filter,
    X,
    Crown,
    AlertTriangle,
    UserPlus,
    RefreshCw,
    Download,
    SlidersHorizontal,
    ChevronDown,
    MapPin,
    Heart,
    Save,
    History,
    Sparkles,
    Zap,
    TrendingUp,
    Target
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Database } from '@/lib/database/supabase/types'
import { cn } from '@/lib/utils/utils'

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
    ltv: {
        min: number | null
        max: number | null
    }
}

interface SavedFilter {
    id: string
    name: string
    filters: Partial<ClientFiltersData>
    isDefault?: boolean
    createdAt: Date
}

interface ClientFiltersProps {
    filters: Partial<ClientFiltersData>
    onFiltersChange: (filters: Partial<ClientFiltersData>) => void
    onClearFilters: () => void
    onExport?: () => void
    totalClients?: number
    filteredClients?: number
    loading?: boolean
    cities?: string[]
    savedFilters?: SavedFilter[]
    onSaveFilter?: (name: string, filters: Partial<ClientFiltersData>) => void
    onLoadFilter?: (filter: SavedFilter) => void
    onDeleteFilter?: (filterId: string) => void
}

const QuickFilterButton: React.FC<{
    icon: React.ElementType
    label: string
    count?: number
    active?: boolean
    onClick: () => void
    variant?: 'default' | 'success' | 'warning' | 'danger'
}> = ({ icon: Icon, label, count, active, onClick, variant = 'default' }) => {
    const variantClasses = {
        default: active
            ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
            : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50 hover:border-blue-300',
        success: active
            ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg'
            : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300',
        warning: active
            ? 'bg-amber-600 text-white border-amber-600 shadow-lg'
            : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50 hover:border-amber-300',
        danger: active
            ? 'bg-red-600 text-white border-red-600 shadow-lg'
            : 'bg-white text-red-700 border-red-200 hover:bg-red-50 hover:border-red-300'
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 transition-all duration-200 hover:scale-105",
                variantClasses[variant]
            )}
        >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
            {count !== undefined && (
                <Badge
                    variant="secondary"
                    className={cn(
                        "ml-1 text-xs",
                        active ? "bg-white/20 text-white" : "bg-slate-100"
                    )}
                >
                    {count}
                </Badge>
            )}
        </Button>
    )
}

const ClientFilters: React.FC<ClientFiltersProps> = ({
                                                         filters,
                                                         onFiltersChange,
                                                         onClearFilters,
                                                         onExport,
                                                         totalClients = 0,
                                                         filteredClients = 0,
                                                         loading = false,
                                                         cities = [],
                                                         savedFilters = [],
                                                         onSaveFilter,
                                                         onLoadFilter,
                                                         onDeleteFilter
                                                     }) => {
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [searchValue, setSearchValue] = useState(filters.search || '')
    const [showSaveDialog, setShowSaveDialog] = useState(false)
    const [filterName, setFilterName] = useState('')
    const [suggestions, setSuggestions] = useState<string[]>([])
    const searchRef = useRef<HTMLInputElement>(null)
    const debounceRef = useRef<NodeJS.Timeout>()

    // Debounced search
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current)
        }

        debounceRef.current = setTimeout(() => {
            if (searchValue !== filters.search) {
                updateFilter('search', searchValue)
            }
        }, 300)

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current)
            }
        }
    }, [searchValue, filters.search])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'k':
                        e.preventDefault()
                        searchRef.current?.focus()
                        break
                    case 'l':
                        e.preventDefault()
                        onClearFilters()
                        break
                    case 's':
                        e.preventDefault()
                        setShowSaveDialog(true)
                        break
                }
            }

            if (e.key === 'Escape') {
                searchRef.current?.blur()
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [onClearFilters])

    const updateFilter = useCallback((key: keyof ClientFiltersData, value: any) => {
        onFiltersChange({ [key]: value })
    }, [onFiltersChange])

    const getActiveFiltersCount = useCallback(() => {
        let count = 0
        if (filters.search) count++
        if (filters.status && filters.status !== 'all') count++
        if (filters.segment && filters.segment !== 'all') count++
        if (filters.dateRange?.from || filters.dateRange?.to) count++
        if (filters.spending?.min !== null || filters.spending?.max !== null) count++
        if (filters.visits?.min !== null || filters.visits?.max !== null) count++
        if (filters.city) count++
        if (filters.birthdayMonth) count++
        if (filters.ltv?.min !== null || filters.ltv?.max !== null) count++
        return count
    }, [filters])

    const activeFiltersCount = getActiveFiltersCount()

    const handleSaveFilter = useCallback(() => {
        if (filterName.trim() && onSaveFilter) {
            onSaveFilter(filterName.trim(), filters)
            setShowSaveDialog(false)
            setFilterName('')
        }
    }, [filterName, filters, onSaveFilter])

    const renderActiveFilters = useMemo(() => {
        const activeFilters: React.ReactNode[] = []

        if (filters.search) {
            activeFilters.push(
                <Badge key="search" variant="secondary" className="flex items-center gap-1 animate-in fade-in">
                    <Search className="w-3 h-3" />
                    Busca: "{filters.search}"
                    <X
                        className="w-3 h-3 cursor-pointer hover:text-red-600 transition-colors"
                        onClick={() => {
                            setSearchValue('')
                            updateFilter('search', '')
                        }}
                    />
                </Badge>
            )
        }

        if (filters.status && filters.status !== 'all') {
            const statusLabels = {
                active: 'Ativo',
                inactive: 'Inativo',
                blocked: 'Bloqueado'
            }
            activeFilters.push(
                <Badge key="status" variant="secondary" className="flex items-center gap-1 animate-in fade-in">
                    Status: {statusLabels[filters.status]}
                    <X
                        className="w-3 h-3 cursor-pointer hover:text-red-600 transition-colors"
                        onClick={() => updateFilter('status', 'all')}
                    />
                </Badge>
            )
        }

        if (filters.segment && filters.segment !== 'all') {
            const segmentLabels = {
                vip: 'VIP',
                regular: 'Regular',
                new: 'Novo',
                at_risk: 'Em Risco',
                lost: 'Perdido'
            }
            activeFilters.push(
                <Badge key="segment" variant="secondary" className="flex items-center gap-1 animate-in fade-in">
                    {segmentLabels[filters.segment]}
                    <X
                        className="w-3 h-3 cursor-pointer hover:text-red-600 transition-colors"
                        onClick={() => updateFilter('segment', 'all')}
                    />
                </Badge>
            )
        }

        if (filters.city) {
            activeFilters.push(
                <Badge key="city" variant="secondary" className="flex items-center gap-1 animate-in fade-in">
                    <MapPin className="w-3 h-3" />
                    {filters.city}
                    <X
                        className="w-3 h-3 cursor-pointer hover:text-red-600 transition-colors"
                        onClick={() => updateFilter('city', '')}
                    />
                </Badge>
            )
        }

        if (filters.birthdayMonth) {
            const months = [
                'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
            ]
            activeFilters.push(
                <Badge key="birthday" variant="secondary" className="flex items-center gap-1 animate-in fade-in">
                    <Heart className="w-3 h-3" />
                    {months[filters.birthdayMonth - 1]}
                    <X
                        className="w-3 h-3 cursor-pointer hover:text-red-600 transition-colors"
                        onClick={() => updateFilter('birthdayMonth', null)}
                    />
                </Badge>
            )
        }

        return activeFilters
    }, [filters, updateFilter])

    const quickStats = useMemo(() => ({
        efficiency: filteredClients / totalClients,
        hasFilters: activeFiltersCount > 0,
        isNarrowed: filteredClients < totalClients * 0.5
    }), [filteredClients, totalClients, activeFiltersCount])

    return (
        <TooltipProvider>
            <div className="space-y-4">
                {/* Header com estatísticas rápidas */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Filter className="w-5 h-5 text-purple-500" />
                            Filtros e Busca
                        </h2>
                        {quickStats.hasFilters && (
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                    {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''}
                                </Badge>
                                {quickStats.isNarrowed && (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                        <Target className="w-3 h-3 mr-1" />
                                        Busca focada
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className={cn(
                                        "transition-all duration-200",
                                        showAdvanced && "bg-blue-50 border-blue-200 text-blue-700"
                                    )}
                                >
                                    <SlidersHorizontal className="w-4 h-4 mr-1" />
                                    Avançado
                                    <ChevronDown className={cn(
                                        "w-4 h-4 ml-1 transition-transform duration-200",
                                        showAdvanced && "rotate-180"
                                    )} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Mostrar filtros avançados (Ctrl+A)</p>
                            </TooltipContent>
                        </Tooltip>

                        {savedFilters.length > 0 && (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <History className="w-4 h-4 mr-1" />
                                        Salvos
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                    <div className="space-y-2">
                                        <h4 className="font-medium">Filtros Salvos</h4>
                                        {savedFilters.map((savedFilter) => (
                                            <div key={savedFilter.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">{savedFilter.name}</p>
                                                    <p className="text-xs text-slate-500">
                                                        {format(savedFilter.createdAt, 'dd/MM/yyyy', { locale: ptBR })}
                                                    </p>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => onLoadFilter?.(savedFilter)}
                                                    >
                                                        Carregar
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => onDeleteFilter?.(savedFilter.id)}
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        )}
                    </div>
                </div>

                {/* Busca Principal */}
                <Card className="border-0 shadow-lg">
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            {/* Barra de busca inteligente */}
                            <div className="relative">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                    <Input
                                        ref={searchRef}
                                        placeholder="Buscar por nome, email, telefone ou CPF... (Ctrl+K)"
                                        value={searchValue}
                                        onChange={(e) => setSearchValue(e.target.value)}
                                        className="pl-12 pr-12 h-12 text-base border-slate-200 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200"
                                    />
                                    {searchValue && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                                            onClick={() => setSearchValue('')}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>

                                {loading && (
                                    <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                                        <RefreshCw className="w-4 h-4 animate-spin text-purple-500" />
                                    </div>
                                )}
                            </div>

                            {/* Filtros rápidos com tabs */}
                            <div className="flex flex-col lg:flex-row gap-4">
                                <div className="flex-1">
                                    <Tabs value={filters.status || 'all'} onValueChange={(value) => updateFilter('status', value)}>
                                        <TabsList className="bg-slate-100 border-0 h-10">
                                            <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4">
                                                Todos
                                            </TabsTrigger>
                                            <TabsTrigger value="active" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4">
                                                <div className="flex items-center gap-1">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                    Ativos
                                                </div>
                                            </TabsTrigger>
                                            <TabsTrigger value="inactive" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4">
                                                <div className="flex items-center gap-1">
                                                    <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                                                    Inativos
                                                </div>
                                            </TabsTrigger>
                                            <TabsTrigger value="blocked" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4">
                                                <div className="flex items-center gap-1">
                                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                    Bloqueados
                                                </div>
                                            </TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                </div>

                                <div className="flex-1">
                                    <Tabs value={filters.segment || 'all'} onValueChange={(value) => updateFilter('segment', value)}>
                                        <TabsList className="bg-slate-100 border-0 h-10">
                                            <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-3">
                                                Todos
                                            </TabsTrigger>
                                            <TabsTrigger value="vip" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-3">
                                                <Crown className="w-3 h-3 mr-1 text-amber-500" />
                                                VIP
                                            </TabsTrigger>
                                            <TabsTrigger value="new" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-3">
                                                <Sparkles className="w-3 h-3 mr-1 text-green-500" />
                                                Novos
                                            </TabsTrigger>
                                            <TabsTrigger value="at_risk" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-3">
                                                <AlertTriangle className="w-3 h-3 mr-1 text-red-500" />
                                                Risco
                                            </TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Filtros Quick Action */}
                <div className="flex flex-wrap gap-2">
                    <QuickFilterButton
                        icon={Crown}
                        label="Clientes VIP"
                        active={filters.segment === 'vip'}
                        onClick={() => updateFilter('segment', filters.segment === 'vip' ? 'all' : 'vip')}
                        variant="warning"
                    />
                    <QuickFilterButton
                        icon={UserPlus}
                        label="Novos Clientes"
                        active={filters.segment === 'new'}
                        onClick={() => updateFilter('segment', filters.segment === 'new' ? 'all' : 'new')}
                        variant="success"
                    />
                    <QuickFilterButton
                        icon={AlertTriangle}
                        label="Em Risco"
                        active={filters.segment === 'at_risk'}
                        onClick={() => updateFilter('segment', filters.segment === 'at_risk' ? 'all' : 'at_risk')}
                        variant="danger"
                    />
                    <QuickFilterButton
                        icon={Heart}
                        label="Aniversariantes"
                        active={filters.birthdayMonth === new Date().getMonth() + 1}
                        onClick={() => updateFilter('birthdayMonth', filters.birthdayMonth ? null : new Date().getMonth() + 1)}
                        variant="default"
                    />
                    <QuickFilterButton
                        icon={TrendingUp}
                        label="Alto LTV"
                        active={filters.ltv?.min !== null}
                        onClick={() => updateFilter('ltv', filters.ltv?.min ? { min: null, max: null } : { min: 1000, max: null })}
                        variant="default"
                    />
                </div>

                {/* Filtros Avançados */}
                {showAdvanced && (
                    <Card className="border-0 shadow-lg animate-in slide-in-from-top-2">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Zap className="w-5 h-5 text-indigo-500" />
                                Filtros Avançados
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Cidade com autocomplete */}
                                <div className="space-y-2">
                                    <Label htmlFor="city">Cidade</Label>
                                    <Command>
                                        <CommandInput
                                            placeholder="Buscar cidade..."
                                            value={filters.city || ''}
                                            onValueChange={(value) => updateFilter('city', value)}
                                        />
                                        <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
                                        <CommandGroup>
                                            {cities.slice(0, 5).map((city) => (
                                                <CommandItem
                                                    key={city}
                                                    onSelect={() => updateFilter('city', city)}
                                                >
                                                    <MapPin className="w-4 h-4 mr-2" />
                                                    {city}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </Command>
                                </div>

                                {/* Mês de aniversário */}
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
                                            {[
                                                'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                                                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
                                            ].map((month, index) => (
                                                <SelectItem key={index + 1} value={(index + 1).toString()}>
                                                    {month}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Valor gasto */}
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

                                {/* LTV Score */}
                                <div className="space-y-2">
                                    <Label>LTV Score</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="number"
                                            placeholder="Mín"
                                            value={filters.ltv?.min || ''}
                                            onChange={(e) => updateFilter('ltv', {
                                                ...filters.ltv,
                                                min: e.target.value ? parseFloat(e.target.value) : null
                                            })}
                                        />
                                        <Input
                                            type="number"
                                            placeholder="Máx"
                                            value={filters.ltv?.max || ''}
                                            onChange={(e) => updateFilter('ltv', {
                                                ...filters.ltv,
                                                max: e.target.value ? parseFloat(e.target.value) : null
                                            })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Filtros Ativos */}
                {activeFiltersCount > 0 && (
                    <Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
                        <CardContent className="p-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                    <Filter className="w-4 h-4" />
                                    Filtros ativos:
                                </span>
                                {renderActiveFilters}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onClearFilters}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto"
                                >
                                    <X className="w-3 h-3 mr-1" />
                                    Limpar todos (Ctrl+L)
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Resultados e Ações */}
                <Card className="border-0 shadow-lg">
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="text-sm text-slate-600">
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            Carregando...
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span>
                                                Mostrando <span className="font-semibold text-blue-600">{filteredClients}</span> de{' '}
                                                <span className="font-semibold">{totalClients}</span> clientes
                                            </span>
                                            {filteredClients !== totalClients && (
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                    {Math.round((filteredClients / totalClients) * 100)}% do total
                                                </Badge>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {activeFiltersCount > 0 && onSaveFilter && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowSaveDialog(true)}
                                                className="text-xs"
                                            >
                                                <Save className="w-4 h-4 mr-1" />
                                                Salvar (Ctrl+S)
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Salvar filtros atuais</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}

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

                {/* Dialog para salvar filtro */}
                {showSaveDialog && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <Card className="w-96">
                            <CardHeader>
                                <CardTitle>Salvar Filtros</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="filter-name">Nome do filtro</Label>
                                    <Input
                                        id="filter-name"
                                        value={filterName}
                                        onChange={(e) => setFilterName(e.target.value)}
                                        placeholder="Ex: Clientes VIP Ativos"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowSaveDialog(false)}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={handleSaveFilter}
                                        disabled={!filterName.trim()}
                                    >
                                        Salvar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </TooltipProvider>
    )
}

export default ClientFilters