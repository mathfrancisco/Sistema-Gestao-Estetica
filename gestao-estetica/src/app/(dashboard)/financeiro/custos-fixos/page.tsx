// app/(dashboard)/financeiro/custos-fixos/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Home,
    TrendingUp,
    DollarSign,
    Calendar,
    AlertTriangle,
    CheckCircle,
    Activity,
    Bell,
    Download,
    RefreshCw,
    ChevronRight,
    Sparkles,
    BarChart3,
    Calculator,
    Target,
    Zap,
    Clock,
    Settings,
    Plus,
    Edit2,
    Trash2,
    MoreHorizontal
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { format, addMonths, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Hooks
import { useFinancials } from '@/lib/hooks/useFinancials'
import { useAuthStore } from '@/store/useAuthStore'

// Componentes
import { Sidebar } from '@/components/layout/sidebar'

interface FixedCost {
    id: string
    name: string
    category: string
    amount: number
    frequency: 'monthly' | 'quarterly' | 'yearly'
    description?: string
    dueDate: number
    isActive: boolean
    lastPaid?: string
    nextDue: string
}

const CustosFixosPage: React.FC = () => {
    const { user } = useAuthStore()
    const [activeTab, setActiveTab] = useState('costs')
    const [costs, setCosts] = useState<FixedCost[]>([])
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [editingCost, setEditingCost] = useState<FixedCost | null>(null)

    // Estado para novo custo
    const [newCost, setNewCost] = useState({
        name: '',
        category: '',
        amount: 0,
        frequency: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
        description: '',
        dueDate: 1,
        isActive: true
    })

    // Hooks financeiros
    const {
        financialSummary,
        isLoadingReports,
        error,
        fetchFinancialSummary,
        clearError
    } = useFinancials()

    // Carregar dados iniciais
    useEffect(() => {
        if (user?.id) {
            loadInitialData()
            loadCosts()
        }
    }, [user?.id])

    const loadInitialData = async () => {
        if (!user?.id) return

        try {
            const startDate = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')
            const endDate = format(new Date(), 'yyyy-MM-dd')
            await fetchFinancialSummary(startDate, endDate, user.id)
        } catch (error) {
            console.error('Erro ao carregar dados dos custos fixos:', error)
        }
    }

    const loadCosts = () => {
        // Simular carregamento de custos fixos
        const defaultCosts: FixedCost[] = [
            {
                id: '1',
                name: 'Aluguel do Salão',
                category: 'infrastructure',
                amount: 2500,
                frequency: 'monthly',
                description: 'Aluguel mensal do espaço comercial',
                dueDate: 5,
                isActive: true,
                lastPaid: format(new Date(), 'yyyy-MM-dd'),
                nextDue: format(addMonths(new Date(), 1), 'yyyy-MM-dd')
            },
            {
                id: '2',
                name: 'Energia Elétrica',
                category: 'utilities',
                amount: 450,
                frequency: 'monthly',
                description: 'Conta de luz',
                dueDate: 15,
                isActive: true,
                nextDue: format(addMonths(new Date(), 1), 'yyyy-MM-dd')
            },
            {
                id: '3',
                name: 'Internet',
                category: 'utilities',
                amount: 120,
                frequency: 'monthly',
                description: 'Plano de internet fibra',
                dueDate: 10,
                isActive: true,
                nextDue: format(addMonths(new Date(), 1), 'yyyy-MM-dd')
            },
            {
                id: '4',
                name: 'Seguro do Salão',
                category: 'insurance',
                amount: 800,
                frequency: 'yearly',
                description: 'Seguro contra incêndio e roubo',
                dueDate: 1,
                isActive: true,
                nextDue: format(addMonths(new Date(), 12), 'yyyy-MM-dd')
            },
            {
                id: '5',
                name: 'Sistema de Gestão',
                category: 'software',
                amount: 89,
                frequency: 'monthly',
                description: 'Software de agendamento e gestão',
                dueDate: 20,
                isActive: true,
                nextDue: format(addMonths(new Date(), 1), 'yyyy-MM-dd')
            },
            {
                id: '6',
                name: 'Contador',
                category: 'staff',
                amount: 300,
                frequency: 'monthly',
                description: 'Serviços contábeis',
                dueDate: 25,
                isActive: true,
                nextDue: format(addMonths(new Date(), 1), 'yyyy-MM-dd')
            }
        ]
        setCosts(defaultCosts)
    }

    // Calcular estatísticas dos custos
    const calculateCostStats = () => {
        const activeCosts = costs.filter(cost => cost.isActive)

        const monthlyTotal = activeCosts.reduce((sum, cost) => {
            if (cost.frequency === 'monthly') return sum + cost.amount
            if (cost.frequency === 'quarterly') return sum + (cost.amount / 3)
            if (cost.frequency === 'yearly') return sum + (cost.amount / 12)
            return sum
        }, 0)

        const yearlyTotal = activeCosts.reduce((sum, cost) => {
            if (cost.frequency === 'monthly') return sum + (cost.amount * 12)
            if (cost.frequency === 'quarterly') return sum + (cost.amount * 4)
            if (cost.frequency === 'yearly') return sum + cost.amount
            return sum
        }, 0)

        const upcomingDues = activeCosts.filter(cost => {
            const daysUntilDue = differenceInDays(new Date(cost.nextDue), new Date())
            return daysUntilDue <= 7 && daysUntilDue >= 0
        })

        const overdueCosts = activeCosts.filter(cost => {
            const daysUntilDue = differenceInDays(new Date(cost.nextDue), new Date())
            return daysUntilDue < 0
        })

        // Calcular eficiência (custos vs receita)
        const revenueEfficiency = financialSummary?.totalRevenue
            ? (monthlyTotal / financialSummary.totalRevenue) * 100
            : 0

        return {
            total: activeCosts.length,
            monthlyTotal,
            yearlyTotal,
            upcomingDues: upcomingDues.length,
            overdueCosts: overdueCosts.length,
            revenueEfficiency
        }
    }

    const costStats = calculateCostStats()

    // Handlers
    const handleRefresh = async () => {
        await loadInitialData()
        loadCosts()
        toast.success('Dados atualizados com sucesso!')
    }

    const handleAddCost = () => {
        const cost: FixedCost = {
            ...newCost,
            id: (costs.length + 1).toString(),
            nextDue: format(addMonths(new Date(), 1), 'yyyy-MM-dd')
        }
        setCosts(prev => [...prev, cost])
        setIsAddDialogOpen(false)
        setNewCost({
            name: '',
            category: '',
            amount: 0,
            frequency: 'monthly',
            description: '',
            dueDate: 1,
            isActive: true
        })
        toast.success('Custo fixo adicionado com sucesso!')
    }

    const handleEditCost = (cost: FixedCost) => {
        setEditingCost(cost)
        setIsEditDialogOpen(true)
    }

    const handleUpdateCost = () => {
        if (!editingCost) return

        setCosts(prev => prev.map(cost =>
            cost.id === editingCost.id ? editingCost : cost
        ))
        setIsEditDialogOpen(false)
        setEditingCost(null)
        toast.success('Custo fixo atualizado com sucesso!')
    }

    const handleDeleteCost = (id: string) => {
        setCosts(prev => prev.filter(cost => cost.id !== id))
        toast.success('Custo fixo excluído com sucesso!')
    }

    const handleExport = () => {
        toast.info('Funcionalidade de exportação em desenvolvimento')
    }

    // Limpar erros
    useEffect(() => {
        if (error) {
            toast.error(error)
            clearError()
        }
    }, [error, clearError])

    // Métricas do dashboard
    const dashboardMetrics = [
        {
            title: 'Custos Mensais',
            value: costStats.monthlyTotal,
            icon: DollarSign,
            description: 'Total de custos fixos mensais',
            gradient: 'from-red-500 to-red-600',
            trend: { value: `${costStats.total}`, label: 'custos ativos', isPositive: true }
        },
        {
            title: 'Custos Anuais',
            value: costStats.yearlyTotal,
            icon: Calendar,
            description: 'Projeção anual de custos',
            gradient: 'from-orange-500 to-orange-600',
            trend: { value: `${costStats.revenueEfficiency.toFixed(1)}%`, label: 'da receita', isPositive: costStats.revenueEfficiency <= 30 }
        },
        {
            title: 'Vencimentos Próximos',
            value: costStats.upcomingDues,
            icon: Clock,
            description: 'Custos vencendo em 7 dias',
            gradient: 'from-yellow-500 to-yellow-600',
            trend: { value: costStats.overdueCosts > 0 ? `${costStats.overdueCosts} atrasados` : 'em dia', label: 'status', isPositive: costStats.overdueCosts === 0 }
        },
        {
            title: 'Eficiência',
            value: 100 - costStats.revenueEfficiency,
            icon: Target,
            description: 'Percentual de eficiência',
            gradient: costStats.revenueEfficiency <= 30 ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600',
            trend: { value: costStats.revenueEfficiency <= 30 ? 'excelente' : costStats.revenueEfficiency <= 50 ? 'boa' : 'atenção', label: 'classificação', isPositive: costStats.revenueEfficiency <= 30 },
            suffix: '%'
        }
    ]

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        })
    }

    const getCategoryBadge = (category: string) => {
        const categoryConfig = {
            infrastructure: { label: 'Infraestrutura', color: 'bg-blue-100 text-blue-700' },
            utilities: { label: 'Utilidades', color: 'bg-green-100 text-green-700' },
            software: { label: 'Software', color: 'bg-purple-100 text-purple-700' },
            staff: { label: 'Pessoal', color: 'bg-orange-100 text-orange-700' },
            insurance: { label: 'Seguro', color: 'bg-red-100 text-red-700' },
            marketing: { label: 'Marketing', color: 'bg-pink-100 text-pink-700' }
        }

        const config = categoryConfig[category as keyof typeof categoryConfig] ||
            { label: category, color: 'bg-gray-100 text-gray-700' }

        return (
            <Badge className={`${config.color} border-0`}>
                {config.label}
            </Badge>
        )
    }

    const getFrequencyLabel = (frequency: string) => {
        const labels = {
            monthly: 'Mensal',
            quarterly: 'Trimestral',
            yearly: 'Anual'
        }
        return labels[frequency as keyof typeof labels] || frequency
    }

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
                                    <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-600 rounded-lg flex items-center justify-center">
                                        <Home className="w-4 h-4 text-white" />
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                        Custos Fixos
                                    </h1>
                                </div>
                                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                                    Gerencie e monitore todos os custos fixos do seu negócio
                                </p>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                {/* Status Badge */}
                                <Badge className={`border-0 shadow-lg text-xs ${
                                    costStats.revenueEfficiency <= 30
                                        ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-emerald-500/25'
                                        : costStats.revenueEfficiency <= 50
                                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-yellow-500/25'
                                            : 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-500/25'
                                }`}>
                                    {costStats.revenueEfficiency <= 30 ? (
                                        <>
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            <span className="hidden sm:inline">Custos Eficientes</span>
                                            <span className="sm:hidden">Eficiente</span>
                                        </>
                                    ) : costStats.revenueEfficiency <= 50 ? (
                                        <>
                                            <Zap className="w-3 h-3 mr-1" />
                                            <span className="hidden sm:inline">Custos Moderados</span>
                                            <span className="sm:hidden">Moderado</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertTriangle className="w-3 h-3 mr-1" />
                                            <span className="hidden sm:inline">Custos Elevados</span>
                                            <span className="sm:hidden">Elevado</span>
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
                                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 shadow-lg shadow-red-500/25 border-0">
                                                <Plus className="w-4 h-4 mr-2" />
                                                Novo Custo
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md">
                                            <DialogHeader>
                                                <DialogTitle>Adicionar Custo Fixo</DialogTitle>
                                                <DialogDescription>
                                                    Adicione um novo custo fixo ao seu controle financeiro.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="name">Nome do Custo</Label>
                                                    <Input
                                                        id="name"
                                                        value={newCost.name}
                                                        onChange={(e) => setNewCost(prev => ({ ...prev, name: e.target.value }))}
                                                        placeholder="Ex: Aluguel do salão"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Categoria</Label>
                                                        <Select value={newCost.category} onValueChange={(value) => setNewCost(prev => ({ ...prev, category: value }))}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Selecione" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="infrastructure">Infraestrutura</SelectItem>
                                                                <SelectItem value="utilities">Utilidades</SelectItem>
                                                                <SelectItem value="software">Software</SelectItem>
                                                                <SelectItem value="staff">Pessoal</SelectItem>
                                                                <SelectItem value="insurance">Seguro</SelectItem>
                                                                <SelectItem value="marketing">Marketing</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Frequência</Label>
                                                        <Select value={newCost.frequency} onValueChange={(value: 'monthly' | 'quarterly' | 'yearly') => setNewCost(prev => ({ ...prev, frequency: value }))}>
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="monthly">Mensal</SelectItem>
                                                                <SelectItem value="quarterly">Trimestral</SelectItem>
                                                                <SelectItem value="yearly">Anual</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="amount">Valor</Label>
                                                        <Input
                                                            id="amount"
                                                            type="number"
                                                            value={newCost.amount}
                                                            onChange={(e) => setNewCost(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                                                            placeholder="0,00"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="dueDate">Dia de Vencimento</Label>
                                                        <Input
                                                            id="dueDate"
                                                            type="number"
                                                            min="1"
                                                            max="31"
                                                            value={newCost.dueDate}
                                                            onChange={(e) => setNewCost(prev => ({ ...prev, dueDate: parseInt(e.target.value) || 1 }))}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="description">Descrição (opcional)</Label>
                                                    <Input
                                                        id="description"
                                                        value={newCost.description}
                                                        onChange={(e) => setNewCost(prev => ({ ...prev, description: e.target.value }))}
                                                        placeholder="Descrição adicional..."
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                                    Cancelar
                                                </Button>
                                                <Button onClick={handleAddCost}>
                                                    Adicionar
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
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

                        {/* Alertas de Vencimento */}
                        {costStats.upcomingDues > 0 && (
                            <Card className="border-0 shadow-xl shadow-orange-200/60 border-orange-200">
                                <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
                                    <CardTitle className="flex items-center gap-2 text-orange-700">
                                        <Clock className="w-5 h-5" />
                                        Vencimentos Próximos
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        <p className="text-slate-700">
                                            Você tem <strong>{costStats.upcomingDues} custos</strong> vencendo nos próximos 7 dias.
                                            {costStats.overdueCosts > 0 && (
                                                <span className="text-red-600 font-semibold">
                                                    {" "}E {costStats.overdueCosts} custos atrasados que precisam de atenção imediata.
                                                </span>
                                            )}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {costs
                                                .filter(cost => {
                                                    const daysUntilDue = differenceInDays(new Date(cost.nextDue), new Date())
                                                    return daysUntilDue <= 7
                                                })
                                                .slice(0, 5)
                                                .map((cost) => {
                                                    const daysUntilDue = differenceInDays(new Date(cost.nextDue), new Date())
                                                    const isOverdue = daysUntilDue < 0

                                                    return (
                                                        <Badge
                                                            key={cost.id}
                                                            variant={isOverdue ? "destructive" : "outline"}
                                                            className="text-xs"
                                                        >
                                                            {cost.name}: {isOverdue ? 'Atrasado' : `${daysUntilDue}d`}
                                                        </Badge>
                                                    )
                                                })}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Tabs de Conteúdo */}
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                            <TabsList className="bg-white border border-slate-200 shadow-sm p-1">
                                <TabsTrigger value="costs" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
                                    <Home className="w-4 h-4 mr-2" />
                                    Custos Fixos
                                </TabsTrigger>
                                <TabsTrigger value="analysis" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
                                    <Calculator className="w-4 h-4 mr-2" />
                                    Análise
                                </TabsTrigger>
                                <TabsTrigger value="projections" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
                                    <TrendingUp className="w-4 h-4 mr-2" />
                                    Projeções
                                </TabsTrigger>
                            </TabsList>

                            {/* Tab: Custos Fixos */}
                            <TabsContent value="costs" className="space-y-6">
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                        <CardTitle className="flex items-center gap-2">
                                            <Home className="w-5 h-5 text-red-500" />
                                            Lista de Custos Fixos
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-slate-50/50">
                                                    <TableHead>Nome</TableHead>
                                                    <TableHead>Categoria</TableHead>
                                                    <TableHead>Valor</TableHead>
                                                    <TableHead>Frequência</TableHead>
                                                    <TableHead>Próximo Vencimento</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="w-16">Ações</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {costs.map((cost) => {
                                                    const daysUntilDue = differenceInDays(new Date(cost.nextDue), new Date())
                                                    const isOverdue = daysUntilDue < 0
                                                    const isDueSoon = daysUntilDue <= 7 && daysUntilDue >= 0

                                                    return (
                                                        <TableRow key={cost.id} className="hover:bg-slate-50/50">
                                                            <TableCell>
                                                                <div>
                                                                    <p className="font-medium text-slate-900">{cost.name}</p>
                                                                    {cost.description && (
                                                                        <p className="text-xs text-slate-500">{cost.description}</p>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                {getCategoryBadge(cost.category)}
                                                            </TableCell>
                                                            <TableCell>
                                                                <span className="font-semibold text-red-600">
                                                                    {formatCurrency(cost.amount)}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline">
                                                                    {getFrequencyLabel(cost.frequency)}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <Calendar className="w-4 h-4 text-slate-400" />
                                                                    <span className={`text-sm ${
                                                                        isOverdue ? 'text-red-600 font-semibold' :
                                                                            isDueSoon ? 'text-orange-600 font-medium' :
                                                                                'text-slate-600'
                                                                    }`}>
                                                                        {format(new Date(cost.nextDue), "dd/MM/yyyy", { locale: ptBR })}
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge
                                                                    variant={
                                                                        isOverdue ? "destructive" :
                                                                            isDueSoon ? "outline" :
                                                                                cost.isActive ? "default" : "secondary"
                                                                    }
                                                                    className={
                                                                        isOverdue ? "" :
                                                                            isDueSoon ? "border-orange-300 text-orange-700 bg-orange-50" :
                                                                                cost.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                                                                    ""
                                                                    }
                                                                >
                                                                    {isOverdue ? 'Atrasado' :
                                                                        isDueSoon ? 'Vence em breve' :
                                                                            cost.isActive ? 'Ativo' : 'Inativo'}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleEditCost(cost)}
                                                                        className="h-8 w-8 p-0"
                                                                    >
                                                                        <Edit2 className="w-4 h-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleDeleteCost(cost.id)}
                                                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                })}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Tab: Análise */}
                            <TabsContent value="analysis" className="space-y-6">
                                {/* Análise de Custos por Categoria */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-b border-emerald-200">
                                            <CardTitle className="text-emerald-700 text-lg">Eficiência Geral</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="text-center space-y-3">
                                                <div className="text-3xl font-bold text-emerald-600">
                                                    {costStats.revenueEfficiency.toFixed(1)}%
                                                </div>
                                                <p className="text-sm text-slate-600">
                                                    Custos em relação à receita
                                                </p>
                                                <div className="w-full bg-slate-200 rounded-full h-2">
                                                    <div
                                                        className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${Math.min(costStats.revenueEfficiency, 100)}%` }}
                                                    />
                                                </div>
                                                <p className="text-xs text-slate-500">
                                                    Meta: Abaixo de 30%
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                                            <CardTitle className="text-blue-700 text-lg">Impacto no Lucro</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-sm text-slate-600">Redução no Lucro</p>
                                                    <p className="text-xl font-bold text-blue-600">
                                                        {formatCurrency(costStats.monthlyTotal)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-slate-600">Projeção Anual</p>
                                                    <p className="text-lg font-semibold text-slate-700">
                                                        {formatCurrency(costStats.yearlyTotal)}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
                                            <CardTitle className="text-purple-700 text-lg">Recomendações</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-3">
                                                {costStats.revenueEfficiency > 50 && (
                                                    <div className="flex items-start gap-2">
                                                        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                                                        <p className="text-sm text-slate-700">Revisar custos altos</p>
                                                    </div>
                                                )}
                                                {costStats.overdueCosts > 0 && (
                                                    <div className="flex items-start gap-2">
                                                        <Clock className="w-4 h-4 text-orange-500 mt-0.5" />
                                                        <p className="text-sm text-slate-700">Regularizar pendências</p>
                                                    </div>
                                                )}
                                                <div className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
                                                    <p className="text-sm text-slate-700">Automatizar pagamentos</p>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <Target className="w-4 h-4 text-blue-500 mt-0.5" />
                                                    <p className="text-sm text-slate-700">Negociar contratos</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            {/* Tab: Projeções */}
                            <TabsContent value="projections" className="space-y-6">
                                {/* Projeção de Custos */}
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                        <CardTitle className="flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5 text-red-500" />
                                            Projeção de Custos Fixos
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-4">
                                                <h4 className="font-semibold text-slate-900">Próximos 3 Meses</h4>
                                                <div className="space-y-3">
                                                    {[1, 2, 3].map((month) => (
                                                        <div key={month} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                                            <span className="text-sm font-medium text-slate-700">
                                                                {format(addMonths(new Date(), month), 'MMM yyyy', { locale: ptBR })}
                                                            </span>
                                                            <span className="font-semibold text-slate-900">
                                                                {formatCurrency(costStats.monthlyTotal)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <h4 className="font-semibold text-slate-900">Próximos 6 Meses</h4>
                                                <div className="text-center">
                                                    <div className="text-3xl font-bold text-red-600 mb-2">
                                                        {formatCurrency(costStats.monthlyTotal * 6)}
                                                    </div>
                                                    <p className="text-sm text-slate-600">Total estimado</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-600">Economia potencial:</span>
                                                        <span className="font-semibold text-emerald-600">
                                                            {formatCurrency(costStats.monthlyTotal * 0.1 * 6)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500">
                                                        *Estimativa com 10% de redução
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <h4 className="font-semibold text-slate-900">Próximo Ano</h4>
                                                <div className="text-center">
                                                    <div className="text-3xl font-bold text-orange-600 mb-2">
                                                        {formatCurrency(costStats.yearlyTotal)}
                                                    </div>
                                                    <p className="text-sm text-slate-600">Projeção anual</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-600">% da receita atual:</span>
                                                        <span className="font-semibold text-slate-900">
                                                            {costStats.revenueEfficiency.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-600">Meta ideal:</span>
                                                        <span className="font-semibold text-emerald-600">≤ 30%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Cenários de Otimização */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card className="border-0 shadow-xl shadow-emerald-200/60 border-emerald-200">
                                        <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-b border-emerald-200">
                                            <CardTitle className="text-emerald-700">Cenário Otimista</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-sm text-emerald-700 font-medium">Redução de 15%</p>
                                                    <p className="text-xl font-bold text-emerald-800">
                                                        {formatCurrency(costStats.monthlyTotal * 0.85)}
                                                    </p>
                                                    <p className="text-xs text-slate-500">Custos mensais</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-emerald-700 font-medium">Economia anual</p>
                                                    <p className="text-lg font-bold text-emerald-600">
                                                        {formatCurrency(costStats.yearlyTotal * 0.15)}
                                                    </p>
                                                </div>
                                                <div className="pt-2 border-t border-emerald-200">
                                                    <p className="text-xs text-emerald-600">
                                                        Renegociação de contratos e otimização de processos
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-0 shadow-xl shadow-blue-200/60 border-blue-200">
                                        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                                            <CardTitle className="text-blue-700">Cenário Realista</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-sm text-blue-700 font-medium">Redução de 5%</p>
                                                    <p className="text-xl font-bold text-blue-800">
                                                        {formatCurrency(costStats.monthlyTotal * 0.95)}
                                                    </p>
                                                    <p className="text-xs text-slate-500">Custos mensais</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-blue-700 font-medium">Economia anual</p>
                                                    <p className="text-lg font-bold text-blue-600">
                                                        {formatCurrency(costStats.yearlyTotal * 0.05)}
                                                    </p>
                                                </div>
                                                <div className="pt-2 border-t border-blue-200">
                                                    <p className="text-xs text-blue-600">
                                                        Pequenas otimizações e revisões pontuais
                                                    </p>
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

            {/* Dialog de Edição */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Editar Custo Fixo</DialogTitle>
                        <DialogDescription>
                            Atualize as informações do custo fixo.
                        </DialogDescription>
                    </DialogHeader>
                    {editingCost && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">Nome do Custo</Label>
                                <Input
                                    id="edit-name"
                                    value={editingCost.name}
                                    onChange={(e) => setEditingCost(prev => prev ? { ...prev, name: e.target.value } : null)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Categoria</Label>
                                    <Select value={editingCost.category} onValueChange={(value) => setEditingCost(prev => prev ? { ...prev, category: value } : null)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="infrastructure">Infraestrutura</SelectItem>
                                            <SelectItem value="utilities">Utilidades</SelectItem>
                                            <SelectItem value="software">Software</SelectItem>
                                            <SelectItem value="staff">Pessoal</SelectItem>
                                            <SelectItem value="insurance">Seguro</SelectItem>
                                            <SelectItem value="marketing">Marketing</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Frequência</Label>
                                    <Select value={editingCost.frequency} onValueChange={(value: 'monthly' | 'quarterly' | 'yearly') => setEditingCost(prev => prev ? { ...prev, frequency: value } : null)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="monthly">Mensal</SelectItem>
                                            <SelectItem value="quarterly">Trimestral</SelectItem>
                                            <SelectItem value="yearly">Anual</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-amount">Valor</Label>
                                    <Input
                                        id="edit-amount"
                                        type="number"
                                        value={editingCost.amount}
                                        onChange={(e) => setEditingCost(prev => prev ? { ...prev, amount: parseFloat(e.target.value) || 0 } : null)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-dueDate">Dia de Vencimento</Label>
                                    <Input
                                        id="edit-dueDate"
                                        type="number"
                                        min="1"
                                        max="31"
                                        value={editingCost.dueDate}
                                        onChange={(e) => setEditingCost(prev => prev ? { ...prev, dueDate: parseInt(e.target.value) || 1 } : null)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-description">Descrição</Label>
                                <Input
                                    id="edit-description"
                                    value={editingCost.description || ''}
                                    onChange={(e) => setEditingCost(prev => prev ? { ...prev, description: e.target.value } : null)}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleUpdateCost}>
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default CustosFixosPage