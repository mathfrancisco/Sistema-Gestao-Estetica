// app/(dashboard)/financeiro/metas/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Target,
    TrendingUp,
    DollarSign,
    Users,
    Calendar,
    Trophy,
    Plus,
    Edit,
    Trash2,
    MoreHorizontal,
    CheckCircle,
    AlertCircle,
    Clock,
    Activity,
    Bell,
    Download,
    RefreshCw,
    ChevronRight,
    Sparkles,
    BarChart3,
    Zap,
    Award,
    Star
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { format, addDays, addMonths, differenceInDays, isAfter, isBefore } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

// Hooks
import { useFinancials } from '@/lib/hooks/useFinancials'
import { useAuthStore } from '@/store/useAuthStore'

// Componentes
import { Sidebar } from '@/components/layout/sidebar'

interface FinancialGoal {
    id: string
    title: string
    description: string
    type: 'revenue' | 'profit' | 'clients' | 'appointments' | 'custom'
    targetValue: number
    currentValue: number
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
    deadline: string
    status: 'active' | 'completed' | 'paused' | 'overdue'
    priority: 'low' | 'medium' | 'high'
    createdAt: string
}

const MetasFinanceirasPage: React.FC = () => {
    const { user } = useAuthStore()
    const [activeTab, setActiveTab] = useState('overview')
    const [isCreateGoalDialogOpen, setIsCreateGoalDialogOpen] = useState(false)
    const [isEditGoalDialogOpen, setIsEditGoalDialogOpen] = useState(false)
    const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null)

    // Estado para nova meta
    const [newGoal, setNewGoal] = useState({
        title: '',
        description: '',
        type: 'revenue' as const,
        targetValue: 0,
        period: 'monthly' as const,
        deadline: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
        priority: 'medium' as const
    })

    // Dados simulados para demonstração
    const [goals] = useState<FinancialGoal[]>([
        {
            id: '1',
            title: 'Meta de Receita Mensal',
            description: 'Alcançar R$ 15.000 em receita mensal',
            type: 'revenue',
            targetValue: 15000,
            currentValue: 12500,
            period: 'monthly',
            deadline: format(addDays(new Date(), 15), 'yyyy-MM-dd'),
            status: 'active',
            priority: 'high',
            createdAt: format(new Date(), 'yyyy-MM-dd')
        },
        {
            id: '2',
            title: 'Aumentar Base de Clientes',
            description: 'Conquistar 50 novos clientes neste trimestre',
            type: 'clients',
            targetValue: 50,
            currentValue: 32,
            period: 'quarterly',
            deadline: format(addMonths(new Date(), 2), 'yyyy-MM-dd'),
            status: 'active',
            priority: 'medium',
            createdAt: format(new Date(), 'yyyy-MM-dd')
        },
        {
            id: '3',
            title: 'Margem de Lucro',
            description: 'Atingir 30% de margem de lucro',
            type: 'profit',
            targetValue: 4500,
            currentValue: 3800,
            period: 'monthly',
            deadline: format(addDays(new Date(), 20), 'yyyy-MM-dd'),
            status: 'active',
            priority: 'high',
            createdAt: format(new Date(), 'yyyy-MM-dd')
        },
        {
            id: '4',
            title: 'Meta de Atendimentos',
            description: 'Realizar 120 atendimentos por mês',
            type: 'appointments',
            targetValue: 120,
            currentValue: 150,
            period: 'monthly',
            deadline: format(addDays(new Date(), 5), 'yyyy-MM-dd'),
            status: 'completed',
            priority: 'medium',
            createdAt: format(new Date(), 'yyyy-MM-dd')
        }
    ])

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
        }
    }, [user?.id])

    const loadInitialData = async () => {
        if (!user?.id) return

        try {
            const startDate = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')
            const endDate = format(new Date(), 'yyyy-MM-dd')
            await fetchFinancialSummary(startDate, endDate, user.id)
        } catch (error) {
            console.error('Erro ao carregar dados das metas:', error)
        }
    }

    // Calcular estatísticas das metas
    const goalStats = {
        total: goals.length,
        active: goals.filter(g => g.status === 'active').length,
        completed: goals.filter(g => g.status === 'completed').length,
        overdue: goals.filter(g => g.status === 'overdue' || (g.status === 'active' && isAfter(new Date(), new Date(g.deadline)))).length,
        averageProgress: goals.reduce((acc, goal) => {
            const progress = Math.min((goal.currentValue / goal.targetValue) * 100, 100)
            return acc + progress
        }, 0) / goals.length
    }

    // Handlers
    const handleRefresh = async () => {
        await loadInitialData()
        toast.success('Dados atualizados com sucesso!')
    }

    const handleCreateGoal = () => {
        // Simular criação de meta
        toast.success('Meta criada com sucesso!')
        setIsCreateGoalDialogOpen(false)
        setNewGoal({
            title: '',
            description: '',
            type: 'revenue',
            targetValue: 0,
            period: 'monthly',
            deadline: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
            priority: 'medium'
        })
    }

    const handleEditGoal = (goal: FinancialGoal) => {
        setEditingGoal(goal)
        setIsEditGoalDialogOpen(true)
    }

    const handleUpdateGoal = () => {
        if (!editingGoal) return

        toast.success('Meta atualizada com sucesso!')
        setIsEditGoalDialogOpen(false)
        setEditingGoal(null)
    }

    const handleDeleteGoal = (goalId: string) => {
        toast.success('Meta excluída com sucesso!')
        // Aqui você implementaria a exclusão real
    }

    const handleCompleteGoal = (goalId: string) => {
        toast.success('Meta marcada como concluída!')
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

    // Calcular progresso de uma meta
    const calculateProgress = (goal: FinancialGoal) => {
        return Math.min((goal.currentValue / goal.targetValue) * 100, 100)
    }

    // Obter status visual da meta
    const getGoalStatusBadge = (goal: FinancialGoal) => {
        const progress = calculateProgress(goal)
        const daysRemaining = differenceInDays(new Date(goal.deadline), new Date())

        if (goal.status === 'completed') {
            return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200"><CheckCircle className="w-3 h-3 mr-1" />Concluída</Badge>
        }

        if (daysRemaining < 0) {
            return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Atrasada</Badge>
        }

        if (progress >= 90) {
            return <Badge className="bg-blue-100 text-blue-700 border-blue-200"><Zap className="w-3 h-3 mr-1" />Quase lá!</Badge>
        }

        if (daysRemaining <= 7) {
            return <Badge className="bg-orange-100 text-orange-700 border-orange-200"><Clock className="w-3 h-3 mr-1" />Urgente</Badge>
        }

        return <Badge variant="outline"><Activity className="w-3 h-3 mr-1" />Ativa</Badge>
    }

    // Obter ícone do tipo de meta
    const getGoalTypeIcon = (type: string) => {
        const icons = {
            revenue: DollarSign,
            profit: TrendingUp,
            clients: Users,
            appointments: Calendar,
            custom: Target
        }
        return icons[type as keyof typeof icons] || Target
    }

    // Obter cor da prioridade
    const getPriorityColor = (priority: string) => {
        const colors = {
            low: 'bg-slate-100 text-slate-700',
            medium: 'bg-blue-100 text-blue-700',
            high: 'bg-red-100 text-red-700'
        }
        return colors[priority as keyof typeof colors] || colors.medium
    }

    // Métricas do dashboard
    const dashboardMetrics = [
        {
            title: 'Metas Ativas',
            value: goalStats.active,
            icon: Target,
            description: 'Metas em andamento',
            gradient: 'from-blue-500 to-blue-600',
            trend: { value: `${goalStats.total}`, label: 'total', isPositive: true }
        },
        {
            title: 'Progresso Médio',
            value: goalStats.averageProgress,
            icon: Trophy,
            description: 'Progresso geral das metas',
            gradient: 'from-emerald-500 to-emerald-600',
            trend: { value: `${goalStats.completed}`, label: 'concluídas', isPositive: true },
            suffix: '%'
        },
        {
            title: 'Metas Concluídas',
            value: goalStats.completed,
            icon: CheckCircle,
            description: 'Metas finalizadas',
            gradient: 'from-green-500 to-green-600',
            trend: { value: `${((goalStats.completed / goalStats.total) * 100).toFixed(1)}%`, label: 'taxa de sucesso', isPositive: true }
        },
        {
            title: 'Alertas',
            value: goalStats.overdue,
            icon: AlertCircle,
            description: 'Metas atrasadas',
            gradient: goalStats.overdue > 0 ? 'from-red-500 to-red-600' : 'from-slate-500 to-slate-600',
            trend: { value: goalStats.overdue > 0 ? 'atenção' : 'ok', label: 'status', isPositive: goalStats.overdue === 0 }
        }
    ]

    const formatValue = (value: number, type: string, suffix?: string) => {
        if (type === 'revenue' || type === 'profit') {
            return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        }
        if (suffix) {
            return `${value.toLocaleString()}${suffix}`
        }
        return value.toLocaleString()
    }

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        })
    }

    // Dados para o gráfico de progresso
    const progressData = goals.map(goal => ({
        name: goal.title.substring(0, 20) + '...',
        progress: calculateProgress(goal),
        target: goal.targetValue,
        current: goal.currentValue
    }))

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
                                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                                        <Target className="w-4 h-4 text-white" />
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                        Metas Financeiras
                                    </h1>
                                </div>
                                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                                    Defina, acompanhe e alcance seus objetivos financeiros
                                </p>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                {/* Status Badge */}
                                <Badge className={`border-0 shadow-lg text-xs ${
                                    goalStats.averageProgress >= 80
                                        ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-emerald-500/25'
                                        : goalStats.averageProgress >= 50
                                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-blue-500/25'
                                            : 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-orange-500/25'
                                }`}>
                                    {goalStats.averageProgress >= 80 ? (
                                        <>
                                            <Trophy className="w-3 h-3 mr-1" />
                                            <span className="hidden sm:inline">Excelente Progresso</span>
                                            <span className="sm:hidden">Excelente</span>
                                        </>
                                    ) : goalStats.averageProgress >= 50 ? (
                                        <>
                                            <Star className="w-3 h-3 mr-1" />
                                            <span className="hidden sm:inline">Bom Progresso</span>
                                            <span className="sm:hidden">Bom</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className="w-3 h-3 mr-1" />
                                            <span className="hidden sm:inline">Precisa Atenção</span>
                                            <span className="sm:hidden">Atenção</span>
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
                                    <Dialog open={isCreateGoalDialogOpen} onOpenChange={setIsCreateGoalDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg shadow-purple-500/25 border-0">
                                                <Plus className="w-4 h-4 mr-2" />
                                                Nova Meta
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-lg">
                                            <DialogHeader>
                                                <DialogTitle>Nova Meta Financeira</DialogTitle>
                                                <DialogDescription>
                                                    Defina uma nova meta para acompanhar seu progresso financeiro.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="title">Título da Meta</Label>
                                                    <Input
                                                        id="title"
                                                        value={newGoal.title}
                                                        onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                                                        placeholder="Ex: Meta de Receita Mensal"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="description">Descrição</Label>
                                                    <Textarea
                                                        id="description"
                                                        value={newGoal.description}
                                                        onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                                                        placeholder="Descreva sua meta..."
                                                        rows={3}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Tipo de Meta</Label>
                                                        <Select value={newGoal.type} onValueChange={(value: any) => setNewGoal(prev => ({ ...prev, type: value }))}>
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="revenue">Receita</SelectItem>
                                                                <SelectItem value="profit">Lucro</SelectItem>
                                                                <SelectItem value="clients">Clientes</SelectItem>
                                                                <SelectItem value="appointments">Atendimentos</SelectItem>
                                                                <SelectItem value="custom">Personalizada</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="targetValue">Valor Alvo</Label>
                                                        <Input
                                                            id="targetValue"
                                                            type="number"
                                                            value={newGoal.targetValue}
                                                            onChange={(e) => setNewGoal(prev => ({ ...prev, targetValue: parseFloat(e.target.value) || 0 }))}
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Período</Label>
                                                        <Select value={newGoal.period} onValueChange={(value: any) => setNewGoal(prev => ({ ...prev, period: value }))}>
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="daily">Diário</SelectItem>
                                                                <SelectItem value="weekly">Semanal</SelectItem>
                                                                <SelectItem value="monthly">Mensal</SelectItem>
                                                                <SelectItem value="quarterly">Trimestral</SelectItem>
                                                                <SelectItem value="yearly">Anual</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Prioridade</Label>
                                                        <Select value={newGoal.priority} onValueChange={(value: any) => setNewGoal(prev => ({ ...prev, priority: value }))}>
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="low">Baixa</SelectItem>
                                                                <SelectItem value="medium">Média</SelectItem>
                                                                <SelectItem value="high">Alta</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="deadline">Prazo</Label>
                                                    <Input
                                                        id="deadline"
                                                        type="date"
                                                        value={newGoal.deadline}
                                                        onChange={(e) => setNewGoal(prev => ({ ...prev, deadline: e.target.value }))}
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setIsCreateGoalDialogOpen(false)}>
                                                    Cancelar
                                                </Button>
                                                <Button onClick={handleCreateGoal} className="bg-purple-600 hover:bg-purple-700">
                                                    Criar Meta
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
                                                    metric.value.toLocaleString()
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

                        {/* Tabs de Conteúdo */}
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                            <TabsList className="bg-white border border-slate-200 shadow-sm p-1">
                                <TabsTrigger value="overview" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                                    <Target className="w-4 h-4 mr-2" />
                                    Visão Geral
                                </TabsTrigger>
                                <TabsTrigger value="goals" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                                    <Trophy className="w-4 h-4 mr-2" />
                                    Metas
                                </TabsTrigger>
                                <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                                    <BarChart3 className="w-4 h-4 mr-2" />
                                    Analytics
                                </TabsTrigger>
                            </TabsList>

                            {/* Tab: Visão Geral */}
                            <TabsContent value="overview" className="space-y-6">
                                {/* Gráfico de Progresso das Metas */}
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                        <CardTitle className="flex items-center gap-2">
                                            <Trophy className="w-5 h-5 text-purple-500" />
                                            Progresso das Metas
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="space-y-6">
                                            {goals.slice(0, 4).map((goal) => {
                                                const progress = calculateProgress(goal)
                                                const TypeIcon = getGoalTypeIcon(goal.type)

                                                return (
                                                    <div key={goal.id} className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 rounded-lg bg-purple-100">
                                                                    <TypeIcon className="w-4 h-4 text-purple-600" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-medium text-slate-900">{goal.title}</h4>
                                                                    <p className="text-sm text-slate-500">
                                                                        {formatValue(goal.currentValue, goal.type)} de {formatValue(goal.targetValue, goal.type)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {getGoalStatusBadge(goal)}
                                                                <span className="text-sm font-bold text-slate-900">
                                                                    {progress.toFixed(1)}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <Progress value={progress} className="h-2" />
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Metas em Destaque */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Meta Próxima do Prazo */}
                                    <Card className="border-0 shadow-xl shadow-orange-200/60 border-orange-200">
                                        <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
                                            <CardTitle className="flex items-center gap-2 text-orange-700">
                                                <Clock className="w-5 h-5" />
                                                Prazo Próximo
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            {(() => {
                                                const urgentGoal = goals
                                                    .filter(g => g.status === 'active')
                                                    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())[0]

                                                if (!urgentGoal) {
                                                    return <p className="text-slate-500">Nenhuma meta urgente</p>
                                                }

                                                const daysLeft = differenceInDays(new Date(urgentGoal.deadline), new Date())
                                                const TypeIcon = getGoalTypeIcon(urgentGoal.type)

                                                return (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 rounded-lg bg-orange-100">
                                                                <TypeIcon className="w-5 h-5 text-orange-600" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-medium text-slate-900">{urgentGoal.title}</h4>
                                                                <p className="text-sm text-slate-500">
                                                                    {daysLeft > 0 ? `${daysLeft} dias restantes` : 'Prazo vencido'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Progress value={calculateProgress(urgentGoal)} className="h-2" />
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-slate-600">
                                                                {formatValue(urgentGoal.currentValue, urgentGoal.type)}
                                                            </span>
                                                            <span className="font-medium text-slate-900">
                                                                {formatValue(urgentGoal.targetValue, urgentGoal.type)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )
                                            })()}
                                        </CardContent>
                                    </Card>

                                    {/* Meta com Melhor Desempenho */}
                                    <Card className="border-0 shadow-xl shadow-emerald-200/60 border-emerald-200">
                                        <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-b border-emerald-200">
                                            <CardTitle className="flex items-center gap-2 text-emerald-700">
                                                <Award className="w-5 h-5" />
                                                Melhor Desempenho
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            {(() => {
                                                const bestGoal = goals
                                                    .filter(g => g.status === 'active')
                                                    .sort((a, b) => calculateProgress(b) - calculateProgress(a))[0]

                                                if (!bestGoal) {
                                                    return <p className="text-slate-500">Nenhuma meta ativa</p>
                                                }

                                                const progress = calculateProgress(bestGoal)
                                                const TypeIcon = getGoalTypeIcon(bestGoal.type)

                                                return (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 rounded-lg bg-emerald-100">
                                                                <TypeIcon className="w-5 h-5 text-emerald-600" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-medium text-slate-900">{bestGoal.title}</h4>
                                                                <p className="text-sm text-slate-500">
                                                                    {progress.toFixed(1)}% concluído
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Progress value={progress} className="h-2" />
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-slate-600">
                                                                {formatValue(bestGoal.currentValue, bestGoal.type)}
                                                            </span>
                                                            <span className="font-medium text-slate-900">
                                                                {formatValue(bestGoal.targetValue, bestGoal.type)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )
                                            })()}
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            {/* Tab: Metas */}
                            <TabsContent value="goals" className="space-y-6">
                                {/* Lista de Metas */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {goals.map((goal) => {
                                        const progress = calculateProgress(goal)
                                        const TypeIcon = getGoalTypeIcon(goal.type)
                                        const daysLeft = differenceInDays(new Date(goal.deadline), new Date())

                                        return (
                                            <Card key={goal.id} className="border-0 shadow-xl shadow-slate-200/60 hover:shadow-2xl hover:shadow-slate-300/60 transition-all duration-300">
                                                <CardHeader className="pb-3">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-lg ${getPriorityColor(goal.priority)}`}>
                                                                <TypeIcon className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-semibold text-slate-900">{goal.title}</h3>
                                                                <p className="text-sm text-slate-500">{goal.description}</p>
                                                            </div>
                                                        </div>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                                <DropdownMenuItem onClick={() => handleEditGoal(goal)}>
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    Editar
                                                                </DropdownMenuItem>
                                                                {goal.status === 'active' && progress >= 100 && (
                                                                    <DropdownMenuItem onClick={() => handleCompleteGoal(goal.id)}>
                                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                                        Marcar como Concluída
                                                                    </DropdownMenuItem>
                                                                )}
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onClick={() => handleDeleteGoal(goal.id)}
                                                                    className="text-red-600"
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Excluir
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-slate-600">Progresso</span>
                                                        <span className="font-semibold text-slate-900">{progress.toFixed(1)}%</span>
                                                    </div>
                                                    <Progress value={progress} className="h-3" />

                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-600">
                                                            Atual: {formatValue(goal.currentValue, goal.type)}
                                                        </span>
                                                        <span className="font-medium text-slate-900">
                                                            Meta: {formatValue(goal.targetValue, goal.type)}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                                        <div className="flex items-center gap-2">
                                                            {getGoalStatusBadge(goal)}
                                                            <Badge variant="outline" className={getPriorityColor(goal.priority)}>
                                                                {goal.priority === 'high' ? 'Alta' : goal.priority === 'medium' ? 'Média' : 'Baixa'}
                                                            </Badge>
                                                        </div>
                                                        <span className="text-sm text-slate-500">
                                                            {daysLeft > 0 ? `${daysLeft} dias` : daysLeft === 0 ? 'Hoje' : 'Atrasada'}
                                                        </span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )
                                    })}
                                </div>
                            </TabsContent>

                            {/* Tab: Analytics */}
                            <TabsContent value="analytics" className="space-y-6">
                                {/* Gráfico de Performance */}
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                        <CardTitle className="flex items-center gap-2">
                                            <BarChart3 className="w-5 h-5 text-purple-500" />
                                            Performance das Metas
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="h-80">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={progressData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                    <XAxis
                                                        dataKey="name"
                                                        stroke="#64748b"
                                                        fontSize={12}
                                                        angle={-45}
                                                        textAnchor="end"
                                                        height={80}
                                                    />
                                                    <YAxis
                                                        stroke="#64748b"
                                                        fontSize={12}
                                                        domain={[0, 100]}
                                                        tickFormatter={(value) => `${value}%`}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: 'white',
                                                            border: '1px solid #e2e8f0',
                                                            borderRadius: '8px',
                                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                        }}
                                                        formatter={(value: any) => [`${value.toFixed(1)}%`, 'Progresso']}
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="progress"
                                                        stroke="#8b5cf6"
                                                        strokeWidth={3}
                                                        dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 6 }}
                                                        activeDot={{ r: 8, stroke: '#8b5cf6', strokeWidth: 2 }}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Estatísticas Detalhadas */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
                                            <CardTitle className="text-purple-700 text-lg">Taxa de Sucesso</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="text-center space-y-2">
                                                <div className="text-3xl font-bold text-purple-600">
                                                    {((goalStats.completed / goalStats.total) * 100).toFixed(1)}%
                                                </div>
                                                <p className="text-sm text-slate-600">
                                                    {goalStats.completed} de {goalStats.total} metas concluídas
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                                            <CardTitle className="text-blue-700 text-lg">Tempo Médio</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="text-center space-y-2">
                                                <div className="text-3xl font-bold text-blue-600">28</div>
                                                <p className="text-sm text-slate-600">Dias para conclusão</p>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-b border-emerald-200">
                                            <CardTitle className="text-emerald-700 text-lg">Eficiência</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="text-center space-y-2">
                                                <div className="text-3xl font-bold text-emerald-600">92%</div>
                                                <p className="text-sm text-slate-600">Metas no prazo</p>
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
            <Dialog open={isEditGoalDialogOpen} onOpenChange={setIsEditGoalDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Editar Meta Financeira</DialogTitle>
                        <DialogDescription>
                            Atualize as informações da sua meta.
                        </DialogDescription>
                    </DialogHeader>
                    {editingGoal && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-title">Título da Meta</Label>
                                <Input
                                    id="edit-title"
                                    value={editingGoal.title}
                                    onChange={(e) => setEditingGoal(prev => prev ? { ...prev, title: e.target.value } : null)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-description">Descrição</Label>
                                <Textarea
                                    id="edit-description"
                                    value={editingGoal.description}
                                    onChange={(e) => setEditingGoal(prev => prev ? { ...prev, description: e.target.value } : null)}
                                    rows={3}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Tipo de Meta</Label>
                                    <Select value={editingGoal.type} onValueChange={(value: any) => setEditingGoal(prev => prev ? { ...prev, type: value } : null)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="revenue">Receita</SelectItem>
                                            <SelectItem value="profit">Lucro</SelectItem>
                                            <SelectItem value="clients">Clientes</SelectItem>
                                            <SelectItem value="appointments">Atendimentos</SelectItem>
                                            <SelectItem value="custom">Personalizada</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-targetValue">Valor Alvo</Label>
                                    <Input
                                        id="edit-targetValue"
                                        type="number"
                                        value={editingGoal.targetValue}
                                        onChange={(e) => setEditingGoal(prev => prev ? { ...prev, targetValue: parseFloat(e.target.value) || 0 } : null)}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Período</Label>
                                    <Select value={editingGoal.period} onValueChange={(value: any) => setEditingGoal(prev => prev ? { ...prev, period: value } : null)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="daily">Diário</SelectItem>
                                            <SelectItem value="weekly">Semanal</SelectItem>
                                            <SelectItem value="monthly">Mensal</SelectItem>
                                            <SelectItem value="quarterly">Trimestral</SelectItem>
                                            <SelectItem value="yearly">Anual</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Prioridade</Label>
                                    <Select value={editingGoal.priority} onValueChange={(value: any) => setEditingGoal(prev => prev ? { ...prev, priority: value } : null)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Baixa</SelectItem>
                                            <SelectItem value="medium">Média</SelectItem>
                                            <SelectItem value="high">Alta</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-deadline">Prazo</Label>
                                <Input
                                    id="edit-deadline"
                                    type="date"
                                    value={editingGoal.deadline}
                                    onChange={(e) => setEditingGoal(prev => prev ? { ...prev, deadline: e.target.value } : null)}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditGoalDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleUpdateGoal} className="bg-purple-600 hover:bg-purple-700">
                            Salvar Alterações
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default MetasFinanceirasPage