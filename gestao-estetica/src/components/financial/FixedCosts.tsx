
// components/financial/FixedCosts.tsx
'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Home,
    Zap,
    Wifi,
    Phone,
    Car,
    CreditCard,
    ShoppingCart,
    Users,
    Plus,
    Edit,
    Trash2,
    MoreHorizontal,
    DollarSign,
    Calendar,
    AlertTriangle,
    CheckCircle,
    TrendingUp,
    BarChart3
} from 'lucide-react'
import { format, addMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

interface FixedCost {
    id: string
    name: string
    category: string
    amount: number
    frequency: 'monthly' | 'quarterly' | 'yearly'
    description?: string
    dueDate: number // Dia do mês
    isActive: boolean
    lastPaid?: string
    nextDue: string
}

interface FixedCostsProps {
    costs?: FixedCost[]
    onAddCost?: (cost: Omit<FixedCost, 'id'>) => void
    onUpdateCost?: (id: string, cost: Partial<FixedCost>) => void
    onDeleteCost?: (id: string) => void
    className?: string
}

export const FixedCosts: React.FC<FixedCostsProps> = ({
                                                          costs = [],
                                                          onAddCost,
                                                          onUpdateCost,
                                                          onDeleteCost,
                                                          className = ""
                                                      }) => {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [editingCost, setEditingCost] = useState<FixedCost | null>(null)
    const [newCost, setNewCost] = useState({
        name: '',
        category: 'infrastructure',
        amount: 0,
        frequency: 'monthly' as const,
        description: '',
        dueDate: 1,
        isActive: true
    })

    // Dados simulados se não fornecidos
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
        }
    ]

    const displayCosts = costs.length > 0 ? costs : defaultCosts

    // Configuração das categorias
    const categoryConfig = {
        infrastructure: {
            label: 'Infraestrutura',
            icon: Home,
            color: 'blue'
        },
        utilities: {
            label: 'Utilidades',
            icon: Zap,
            color: 'yellow'
        },
        insurance: {
            label: 'Seguros',
            icon: CheckCircle,
            color: 'green'
        },
        software: {
            label: 'Software',
            icon: Wifi,
            color: 'purple'
        },
        staff: {
            label: 'Pessoal',
            icon: Users,
            color: 'pink'
        },
        marketing: {
            label: 'Marketing',
            icon: TrendingUp,
            color: 'orange'
        },
        other: {
            label: 'Outros',
            icon: ShoppingCart,
            color: 'gray'
        }
    }

    // Calcular estatísticas
    const calculateStats = () => {
        const activeCosts = displayCosts.filter(cost => cost.isActive)

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

        // Agrupar por categoria
        const byCategory = activeCosts.reduce((acc, cost) => {
            const monthlyAmount = cost.frequency === 'monthly' ? cost.amount :
                cost.frequency === 'quarterly' ? cost.amount / 3 :
                    cost.amount / 12

            acc[cost.category] = (acc[cost.category] || 0) + monthlyAmount
            return acc
        }, {} as Record<string, number>)

        return {
            total: activeCosts.length,
            monthlyTotal,
            yearlyTotal,
            byCategory
        }
    }

    const stats = calculateStats()

    // Handlers
    const handleAddCost = () => {
        if (onAddCost) {
            onAddCost({
                ...newCost,
                nextDue: format(addMonths(new Date(), newCost.frequency === 'monthly' ? 1 : newCost.frequency === 'quarterly' ? 3 : 12), 'yyyy-MM-dd')
            })
        }
        setIsAddDialogOpen(false)
        resetForm()
    }

    const handleEditCost = (cost: FixedCost) => {
        setEditingCost(cost)
        setNewCost({
            name: cost.name,
            category: cost.category,
            amount: cost.amount,
            frequency: cost.frequency,
            description: cost.description || '',
            dueDate: cost.dueDate,
            isActive: cost.isActive
        })
        setIsAddDialogOpen(true)
    }

    const handleUpdateCost = () => {
        if (editingCost && onUpdateCost) {
            onUpdateCost(editingCost.id, newCost)
        }
        setIsAddDialogOpen(false)
        resetForm()
        setEditingCost(null)
    }

    const resetForm = () => {
        setNewCost({
            name: '',
            category: 'infrastructure',
            amount: 0,
            frequency: 'monthly',
            description: '',
            dueDate: 1,
            isActive: true
        })
    }

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        })
    }

    const getFrequencyLabel = (frequency: string) => {
        const labels = {
            monthly: 'Mensal',
            quarterly: 'Trimestral',
            yearly: 'Anual'
        }
        return labels[frequency as keyof typeof labels] || frequency
    }

    // Dados para gráficos
    const categoryData = Object.entries(stats.byCategory).map(([category, amount]) => ({
        name: categoryConfig[category as keyof typeof categoryConfig]?.label || category,
        value: amount,
        color: categoryConfig[category as keyof typeof categoryConfig]?.color || 'gray'
    }))

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#64748b']

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Métricas de Resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-0 shadow-lg shadow-slate-200/40">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-blue-100">
                                <DollarSign className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-600">Custos Mensais</p>
                                <p className="text-xl font-bold text-slate-900">{formatCurrency(stats.monthlyTotal)}</p>
                                <p className="text-xs text-slate-500">{stats.total} custos ativos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg shadow-slate-200/40">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-emerald-100">
                                <Calendar className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-600">Custos Anuais</p>
                                <p className="text-xl font-bold text-slate-900">{formatCurrency(stats.yearlyTotal)}</p>
                                <p className="text-xs text-slate-500">Projeção 12 meses</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg shadow-slate-200/40">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-purple-100">
                                <BarChart3 className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-600">Maior Categoria</p>
                                <p className="text-lg font-bold text-slate-900">
                                    {Object.entries(stats.byCategory).sort(([,a], [,b]) => b - a)[0]?.[0]
                                        ? categoryConfig[Object.entries(stats.byCategory).sort(([,a], [,b]) => b - a)[0][0] as keyof typeof categoryConfig]?.label
                                        : 'N/A'
                                    }
                                </p>
                                <p className="text-xs text-slate-500">
                                    {Object.entries(stats.byCategory).length > 0
                                        ? formatCurrency(Object.entries(stats.byCategory).sort(([,a], [,b]) => b - a)[0][1])
                                        : 'R$ 0,00'
                                    }
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lista de Custos */}
                <div className="lg:col-span-2">
                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-blue-500" />
                                    Custos Fixos ({displayCosts.length})
                                </CardTitle>
                                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Adicionar
                                        </Button>
                                    </DialogTrigger>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50">
                                        <TableHead>Custo</TableHead>
                                        <TableHead>Categoria</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead>Frequência</TableHead>
                                        <TableHead>Vencimento</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {displayCosts.map((cost) => {
                                        const categoryInfo = categoryConfig[cost.category as keyof typeof categoryConfig]
                                        const Icon = categoryInfo?.icon || ShoppingCart

                                        return (
                                            <TableRow key={cost.id} className="hover:bg-slate-50/50">
                                                <TableCell className="py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg bg-${categoryInfo?.color || 'gray'}-100`}>
                                                            <Icon className={`w-4 h-4 text-${categoryInfo?.color || 'gray'}-600`} />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-slate-900">{cost.name}</p>
                                                            {cost.description && (
                                                                <p className="text-sm text-slate-500">{cost.description}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={`bg-${categoryInfo?.color || 'gray'}-50 text-${categoryInfo?.color || 'gray'}-700 border-${categoryInfo?.color || 'gray'}-200`}>
                                                        {categoryInfo?.label || cost.category}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-semibold text-slate-900">
                                                        {formatCurrency(cost.amount)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">
                                                        {getFrequencyLabel(cost.frequency)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        <p className="font-medium text-slate-900">Dia {cost.dueDate}</p>
                                                        <p className="text-slate-500">
                                                            {format(new Date(cost.nextDue), "dd/MM/yyyy", { locale: ptBR })}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => handleEditCost(cost)}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Editar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => onDeleteCost?.(cost.id)}
                                                                className="text-red-600"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Excluir
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Gráfico de Distribuição */}
                <div className="space-y-6">
                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                            <CardTitle className="text-lg">Distribuição por Categoria</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {categoryData.length > 0 ? (
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={categoryData}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={60}
                                                fill="#8884d8"
                                                dataKey="value"
                                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                labelLine={false}
                                            >
                                                {categoryData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value: any) => [formatCurrency(value), 'Valor Mensal']}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-slate-500">Nenhum custo cadastrado</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Próximos Vencimentos */}
                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                            <CardTitle className="text-lg">Próximos Vencimentos</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="space-y-3">
                                {displayCosts
                                    .filter(cost => cost.isActive)
                                    .sort((a, b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime())
                                    .slice(0, 5)
                                    .map((cost) => {
                                        const daysUntilDue = Math.ceil((new Date(cost.nextDue).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                                        const isUrgent = daysUntilDue <= 7

                                        return (
                                            <div key={cost.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-900 truncate">{cost.name}</p>
                                                    <p className="text-xs text-slate-500">{formatCurrency(cost.amount)}</p>
                                                </div>
                                                <div className="text-right ml-3">
                                                    <Badge variant={isUrgent ? "destructive" : "outline"} className="text-xs">
                                                        {daysUntilDue > 0 ? `${daysUntilDue}d` : 'Vencido'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        )
                                    })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Dialog para Adicionar/Editar Custo */}
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{editingCost ? 'Editar' : 'Adicionar'} Custo Fixo</DialogTitle>
                    <DialogDescription>
                        {editingCost ? 'Edite as informações' : 'Adicione um novo custo fixo'} do seu negócio.
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
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(categoryConfig).map(([key, config]) => (
                                        <SelectItem key={key} value={key}>
                                            {config.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
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
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Frequência</Label>
                            <Select value={newCost.frequency} onValueChange={(value: any) => setNewCost(prev => ({ ...prev, frequency: value }))}>
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
                        <div className="space-y-2">
                            <Label htmlFor="dueDate">Dia do Vencimento</Label>
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
                        <Textarea
                            id="description"
                            value={newCost.description}
                            onChange={(e) => setNewCost(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Descrição do custo..."
                            rows={3}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => {
                        setIsAddDialogOpen(false)
                        resetForm()
                        setEditingCost(null)
                    }}>
                        Cancelar
                    </Button>
                    <Button onClick={editingCost ? handleUpdateCost : handleAddCost}>
                        {editingCost ? 'Atualizar' : 'Adicionar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </div>
    )
}

export default FixedCosts