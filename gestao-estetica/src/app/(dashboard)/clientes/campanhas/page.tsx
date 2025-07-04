'use client'

import React, { useState} from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
    Megaphone,
    Crown,
    UserPlus,
    AlertTriangle,
    Calendar,
    Mail,
    MessageSquare,
    Bell,
    Target,
    TrendingUp,
    TrendingDown,
    Activity,
    DollarSign,
    Eye,
    Send,
    Pause,
    Play,
    Settings,
    BarChart3,
    ArrowRight,
    CheckCircle,
    Clock,
    Zap,
    Heart,
    Gift,
    Sparkles,
    Filter,
    Download,
    Plus,
    Edit,
    Trash2,
    Copy,
    MoreHorizontal
} from 'lucide-react'
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
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import type { Database } from '@/lib/database/supabase/types'
import {
    useClientsBySegment,
    useClientStats,
    useUpcomingBirthdays
} from "@/lib/hooks/useClients"
import { Sidebar } from '@/components/layout/sidebar'

type ClientSegment = Database['public']['Enums']['client_segment_enum']

interface Campaign {
    id: string
    name: string
    type: 'email' | 'sms' | 'whatsapp' | 'calendar' | 'birthday'
    status: 'draft' | 'active' | 'paused' | 'completed'
    targetSegment: ClientSegment | 'all' | 'birthday'
    targetCount: number
    sentCount: number
    openRate: number
    clickRate: number
    conversionRate: number
    revenue: number
    createdAt: string
    scheduledAt?: string
    description: string
}

const CampaignsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('overview')
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)

    // Hooks para dados
    const { data: clientStats } = useClientStats()
    const { data: upcomingBirthdays } = useUpcomingBirthdays(30)
    const { data: vipClients } = useClientsBySegment('vip')
    const { data: atRiskClients } = useClientsBySegment('at_risk')
    const { data: newClients } = useClientsBySegment('new')

    // Mock data para campanhas
    const [campaigns, setCampaigns] = useState<Campaign[]>([
        {
            id: '1',
            name: 'Promoção Dia das Mães - VIP',
            type: 'email',
            status: 'active',
            targetSegment: 'vip',
            targetCount: 45,
            sentCount: 45,
            openRate: 68.9,
            clickRate: 23.4,
            conversionRate: 12.8,
            revenue: 3450.00,
            createdAt: '2024-04-20',
            scheduledAt: '2024-05-01',
            description: 'Campanha especial para clientes VIP com desconto de 20% em todos os serviços'
        },
        {
            id: '2',
            name: 'Reativação - Clientes em Risco',
            type: 'whatsapp',
            status: 'active',
            targetSegment: 'at_risk',
            targetCount: 23,
            sentCount: 23,
            openRate: 91.3,
            clickRate: 34.8,
            conversionRate: 17.4,
            revenue: 1200.00,
            createdAt: '2024-04-18',
            description: 'Campanha de reativação com oferta especial para clientes que não retornam há mais de 60 dias'
        },
        {
            id: '3',
            name: 'Aniversariantes Maio',
            type: 'birthday',
            status: 'draft',
            targetSegment: 'birthday',
            targetCount: 12,
            sentCount: 0,
            openRate: 0,
            clickRate: 0,
            conversionRate: 0,
            revenue: 0,
            createdAt: '2024-04-25',
            scheduledAt: '2024-05-01',
            description: 'Campanhas personalizadas de aniversário com desconto especial'
        },
        {
            id: '4',
            name: 'Boas-vindas Novos Clientes',
            type: 'email',
            status: 'active',
            targetSegment: 'new',
            targetCount: 18,
            sentCount: 15,
            openRate: 83.3,
            clickRate: 41.7,
            conversionRate: 25.0,
            revenue: 890.00,
            createdAt: '2024-04-15',
            description: 'Sequência automatizada de boas-vindas para novos clientes'
        }
    ])

    const getCampaignTypeIcon = (type: Campaign['type']) => {
        const icons = {
            email: Mail,
            sms: MessageSquare,
            whatsapp: MessageSquare,
            calendar: Calendar,
            birthday: Heart
        }
        return icons[type] || Mail
    }

    const getCampaignTypeLabel = (type: Campaign['type']) => {
        const labels = {
            email: 'Email',
            sms: 'SMS',
            whatsapp: 'WhatsApp',
            calendar: 'Google Calendar',
            birthday: 'Aniversário'
        }
        return labels[type] || 'Email'
    }

    const getStatusBadge = (status: Campaign['status']) => {
        const statusConfig = {
            draft: { label: 'Rascunho', variant: 'secondary' as const, icon: Edit },
            active: { label: 'Ativa', variant: 'default' as const, icon: Play },
            paused: { label: 'Pausada', variant: 'secondary' as const, icon: Pause },
            completed: { label: 'Concluída', variant: 'default' as const, icon: CheckCircle }
        }

        const config = statusConfig[status]
        const Icon = config.icon

        return (
            <Badge variant={config.variant} className="flex items-center gap-1">
                <Icon className="w-3 h-3" />
                {config.label}
            </Badge>
        )
    }

    const getSegmentLabel = (segment: string) => {
        const labels = {
            vip: 'Clientes VIP',
            regular: 'Clientes Regulares',
            new: 'Novos Clientes',
            at_risk: 'Em Risco',
            lost: 'Perdidos',
            all: 'Todos os Clientes',
            birthday: 'Aniversariantes'
        }
        return labels[segment] || segment
    }

    const totalCampaigns = campaigns.length
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length
    const totalSent = campaigns.reduce((sum, c) => sum + c.sentCount, 0)
    const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0)
    const avgOpenRate = campaigns.length > 0
        ? campaigns.reduce((sum, c) => sum + c.openRate, 0) / campaigns.length
        : 0
    const avgConversionRate = campaigns.length > 0
        ? campaigns.reduce((sum, c) => sum + c.conversionRate, 0) / campaigns.length
        : 0

    const metricsData = [
        {
            title: 'Campanhas Ativas',
            value: activeCampaigns,
            total: totalCampaigns,
            icon: Megaphone,
            gradient: 'from-blue-500 to-blue-600',
            trend: { value: 12, isPositive: true }
        },
        {
            title: 'Mensagens Enviadas',
            value: totalSent,
            icon: Send,
            gradient: 'from-green-500 to-emerald-500',
            trend: { value: 25, isPositive: true }
        },
        {
            title: 'Taxa de Abertura Média',
            value: `${avgOpenRate.toFixed(1)}%`,
            icon: Eye,
            gradient: 'from-purple-500 to-purple-600',
            trend: { value: 8, isPositive: true }
        },
        {
            title: 'Receita Gerada',
            value: `R$ ${totalRevenue.toLocaleString('pt-BR')}`,
            icon: DollarSign,
            gradient: 'from-amber-500 to-orange-500',
            trend: { value: 15, isPositive: true }
        }
    ]

    // Templates de campanha
    const campaignTemplates = [
        {
            id: 'vip-promotion',
            name: 'Promoção VIP',
            description: 'Ofertas exclusivas para clientes VIP',
            icon: Crown,
            color: 'from-amber-500 to-orange-500',
            targetSegment: 'vip' as ClientSegment,
            estimatedReach: vipClients?.length || 0
        },
        {
            id: 'reactivation',
            name: 'Reativação',
            description: 'Campanhas para clientes em risco',
            icon: AlertTriangle,
            color: 'from-red-500 to-red-600',
            targetSegment: 'at_risk' as ClientSegment,
            estimatedReach: atRiskClients?.length || 0
        },
        {
            id: 'welcome',
            name: 'Boas-vindas',
            description: 'Sequência para novos clientes',
            icon: UserPlus,
            color: 'from-green-500 to-emerald-500',
            targetSegment: 'new' as ClientSegment,
            estimatedReach: newClients?.length || 0
        },
        {
            id: 'birthday',
            name: 'Aniversário',
            description: 'Campanhas personalizadas de aniversário',
            icon: Heart,
            color: 'from-pink-500 to-rose-500',
            targetSegment: 'birthday' as any,
            estimatedReach: upcomingBirthdays?.length || 0
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
                                    <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-600 rounded-lg flex items-center justify-center">
                                        <Megaphone className="w-4 h-4 text-white" />
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                        Campanhas de Marketing
                                    </h1>
                                </div>
                                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                                    Gerencie campanhas e automatizações de marketing
                                </p>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3">
                                <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-lg shadow-emerald-500/25 text-xs">
                                    <Activity className="w-3 h-3 mr-1" />
                                    Marketing Ativo
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
                                    className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-lg shadow-pink-500/25 border-0"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Nova Campanha
                                </Button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">

                        {/* Métricas Principais */}
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
                                            {metric.total && (
                                                <p className="text-xs text-slate-500">
                                                    de {metric.total} total
                                                </p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Tabs de Navegação */}
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                            <TabsList className="grid w-full grid-cols-4 bg-slate-100 p-1 rounded-xl">
                                <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
                                    Visão Geral
                                </TabsTrigger>
                                <TabsTrigger value="campaigns" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
                                    Campanhas
                                </TabsTrigger>
                                <TabsTrigger value="templates" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
                                    Templates
                                </TabsTrigger>
                                <TabsTrigger value="automation" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
                                    Automações
                                </TabsTrigger>
                            </TabsList>

                            {/* Tab: Visão Geral */}
                            <TabsContent value="overview" className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Performance das Campanhas */}
                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                            <CardTitle className="flex items-center gap-2">
                                                <BarChart3 className="w-5 h-5 text-blue-500" />
                                                Performance das Campanhas
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-4">
                                                {campaigns.filter(c => c.status === 'active').map((campaign) => (
                                                    <div key={campaign.id} className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm font-medium text-slate-700">{campaign.name}</span>
                                                            <span className="text-sm text-slate-500">{campaign.openRate.toFixed(1)}%</span>
                                                        </div>
                                                        <Progress value={campaign.openRate} className="h-2" />
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Próximas Campanhas */}
                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                            <CardTitle className="flex items-center gap-2">
                                                <Calendar className="w-5 h-5 text-green-500" />
                                                Próximas Campanhas
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-4">
                                                {campaigns.filter(c => c.scheduledAt).map((campaign) => (
                                                    <div key={campaign.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-lg bg-gradient-to-br ${
                                                                campaign.type === 'email' ? 'from-blue-500 to-blue-600' :
                                                                    campaign.type === 'whatsapp' ? 'from-green-500 to-green-600' :
                                                                        'from-pink-500 to-pink-600'
                                                            }`}>
                                                                {React.createElement(getCampaignTypeIcon(campaign.type), {
                                                                    className: "w-4 h-4 text-white"
                                                                })}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-slate-900">{campaign.name}</p>
                                                                <p className="text-sm text-slate-500">
                                                                    {campaign.scheduledAt && format(new Date(campaign.scheduledAt), 'dd/MM/yyyy', { locale: ptBR })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Badge variant="outline" className="text-xs">
                                                            {campaign.targetCount} clientes
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Oportunidades de Campanha */}
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                        <CardTitle className="flex items-center gap-2">
                                            <Target className="w-5 h-5 text-purple-500" />
                                            Oportunidades de Campanha
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Crown className="w-5 h-5 text-amber-600" />
                                                    <span className="font-semibold text-amber-800">Clientes VIP</span>
                                                </div>
                                                <p className="text-2xl font-bold text-amber-900">{vipClients?.length || 0}</p>
                                                <p className="text-sm text-amber-700">Prontos para ofertas exclusivas</p>
                                            </div>

                                            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                                    <span className="font-semibold text-red-800">Em Risco</span>
                                                </div>
                                                <p className="text-2xl font-bold text-red-900">{atRiskClients?.length || 0}</p>
                                                <p className="text-sm text-red-700">Precisam de reativação</p>
                                            </div>

                                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <UserPlus className="w-5 h-5 text-green-600" />
                                                    <span className="font-semibold text-green-800">Novos</span>
                                                </div>
                                                <p className="text-2xl font-bold text-green-900">{newClients?.length || 0}</p>
                                                <p className="text-sm text-green-700">Para sequência de boas-vindas</p>
                                            </div>

                                            <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Heart className="w-5 h-5 text-pink-600" />
                                                    <span className="font-semibold text-pink-800">Aniversariantes</span>
                                                </div>
                                                <p className="text-2xl font-bold text-pink-900">{upcomingBirthdays?.length || 0}</p>
                                                <p className="text-sm text-pink-700">Próximos 30 dias</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Tab: Campanhas */}
                            <TabsContent value="campaigns" className="space-y-6">
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="flex items-center gap-2">
                                                <Megaphone className="w-5 h-5 text-pink-500" />
                                                Todas as Campanhas
                                            </CardTitle>
                                            <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">
                                                {campaigns.length} campanhas
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-slate-50/50">
                                                        <TableHead>Campanha</TableHead>
                                                        <TableHead>Tipo</TableHead>
                                                        <TableHead>Segmento</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead>Enviadas</TableHead>
                                                        <TableHead>Taxa Abertura</TableHead>
                                                        <TableHead>Conversão</TableHead>
                                                        <TableHead>Receita</TableHead>
                                                        <TableHead className="text-right">Ações</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {campaigns.map((campaign) => (
                                                        <TableRow key={campaign.id} className="hover:bg-slate-50/50">
                                                            <TableCell>
                                                                <div>
                                                                    <p className="font-medium text-slate-900">{campaign.name}</p>
                                                                    <p className="text-sm text-slate-500">{campaign.description}</p>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    {React.createElement(getCampaignTypeIcon(campaign.type), {
                                                                        className: "w-4 h-4 text-slate-600"
                                                                    })}
                                                                    <span className="text-sm">{getCampaignTypeLabel(campaign.type)}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <span className="text-sm">{getSegmentLabel(campaign.targetSegment)}</span>
                                                            </TableCell>
                                                            <TableCell>
                                                                {getStatusBadge(campaign.status)}
                                                            </TableCell>
                                                            <TableCell>
                                                                <span className="font-medium">{campaign.sentCount}</span>
                                                                <span className="text-slate-500">/{campaign.targetCount}</span>
                                                            </TableCell>
                                                            <TableCell>
                                                                <span className="font-medium">{campaign.openRate.toFixed(1)}%</span>
                                                            </TableCell>
                                                            <TableCell>
                                                                <span className="font-medium">{campaign.conversionRate.toFixed(1)}%</span>
                                                            </TableCell>
                                                            <TableCell>
                                                                <span className="font-medium">
                                                                    R$ {campaign.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                                        <DropdownMenuItem>
                                                                            <Copy className="mr-2 h-4 w-4" />
                                                                            Duplicar
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                        {campaign.status === 'active' ? (
                                                                            <DropdownMenuItem>
                                                                                <Pause className="mr-2 h-4 w-4" />
                                                                                Pausar
                                                                            </DropdownMenuItem>
                                                                        ) : campaign.status === 'paused' ? (
                                                                            <DropdownMenuItem>
                                                                                <Play className="mr-2 h-4 w-4" />
                                                                                Retomar
                                                                            </DropdownMenuItem>
                                                                        ) : null}
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem className="text-red-600">
                                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                                            Excluir
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Tab: Templates */}
                            <TabsContent value="templates" className="space-y-6">
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                        <CardTitle className="flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-purple-500" />
                                            Templates de Campanha
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                            {campaignTemplates.map((template) => (
                                                <Card key={template.id} className="border border-slate-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                                                    <CardContent className="p-6">
                                                        <div className="space-y-4">
                                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center`}>
                                                                <template.icon className="w-6 h-6 text-white" />
                                                            </div>

                                                            <div>
                                                                <h3 className="font-semibold text-slate-900 mb-2">{template.name}</h3>
                                                                <p className="text-sm text-slate-600 mb-3">{template.description}</p>

                                                                <div className="flex items-center justify-between text-sm">
                                                                    <span className="text-slate-500">Alcance estimado:</span>
                                                                    <span className="font-semibold text-slate-900">{template.estimatedReach} clientes</span>
                                                                </div>
                                                            </div>

                                                            <Button
                                                                className="w-full"
                                                                onClick={() => {
                                                                    toast.success(`Template "${template.name}" selecionado!`)
                                                                }}
                                                            >
                                                                Usar Template
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Templates Personalizados */}
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                        <CardTitle className="flex items-center gap-2">
                                            <Settings className="w-5 h-5 text-indigo-500" />
                                            Templates Personalizados
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="text-center py-8">
                                            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Plus className="w-8 h-8 text-white" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                                Crie seus próprios templates
                                            </h3>
                                            <p className="text-slate-500 mb-6 max-w-md mx-auto">
                                                Personalize mensagens e automações de acordo com sua marca e estratégia.
                                            </p>
                                            <Button className="bg-gradient-to-r from-indigo-500 to-purple-600">
                                                <Plus className="w-4 h-4 mr-2" />
                                                Criar Template
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Tab: Automações */}
                            <TabsContent value="automation" className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Automações Ativas */}
                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100">
                                            <CardTitle className="flex items-center gap-2 text-emerald-800">
                                                <Zap className="w-5 h-5" />
                                                Automações Ativas
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-emerald-100 rounded-lg">
                                                            <Heart className="w-4 h-4 text-emerald-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-emerald-900">Aniversários</p>
                                                            <p className="text-sm text-emerald-700">Enviada automaticamente no aniversário</p>
                                                        </div>
                                                    </div>
                                                    <Badge className="bg-emerald-100 text-emerald-800">Ativa</Badge>
                                                </div>

                                                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-blue-100 rounded-lg">
                                                            <UserPlus className="w-4 h-4 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-blue-900">Boas-vindas</p>
                                                            <p className="text-sm text-blue-700">Sequência para novos clientes</p>
                                                        </div>
                                                    </div>
                                                    <Badge className="bg-blue-100 text-blue-800">Ativa</Badge>
                                                </div>

                                                <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-amber-100 rounded-lg">
                                                            <Clock className="w-4 h-4 text-amber-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-amber-900">Follow-up</p>
                                                            <p className="text-sm text-amber-700">7 dias após último atendimento</p>
                                                        </div>
                                                    </div>
                                                    <Badge className="bg-amber-100 text-amber-800">Ativa</Badge>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Configurar Nova Automação */}
                                    <Card className="border-0 shadow-xl shadow-slate-200/60">
                                        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100">
                                            <CardTitle className="flex items-center gap-2 text-purple-800">
                                                <Settings className="w-5 h-5" />
                                                Nova Automação
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-4">
                                                <Button
                                                    variant="outline"
                                                    className="w-full h-auto p-4 flex flex-col items-start text-left hover:bg-purple-50 border-purple-200"
                                                    onClick={() => toast.info('Configurando automação de reativação...')}
                                                >
                                                    <AlertTriangle className="w-5 h-5 text-red-600 mb-2" />
                                                    <span className="font-semibold">Reativação Automática</span>
                                                    <span className="text-xs text-slate-600">Para clientes sem retorno há 60+ dias</span>
                                                </Button>

                                                <Button
                                                    variant="outline"
                                                    className="w-full h-auto p-4 flex flex-col items-start text-left hover:bg-purple-50 border-purple-200"
                                                    onClick={() => toast.info('Configurando lembretes de retorno...')}
                                                >
                                                    <Bell className="w-5 h-5 text-blue-600 mb-2" />
                                                    <span className="font-semibold">Lembrete de Retorno</span>
                                                    <span className="text-xs text-slate-600">Baseado no ciclo do cliente</span>
                                                </Button>

                                                <Button
                                                    variant="outline"
                                                    className="w-full h-auto p-4 flex flex-col items-start text-left hover:bg-purple-50 border-purple-200"
                                                    onClick={() => toast.info('Configurando programa de indicação...')}
                                                >
                                                    <Gift className="w-5 h-5 text-green-600 mb-2" />
                                                    <span className="font-semibold">Programa de Indicação</span>
                                                    <span className="text-xs text-slate-600">Recompensas por indicações</span>
                                                </Button>

                                                <Button
                                                    variant="outline"
                                                    className="w-full h-auto p-4 flex flex-col items-start text-left hover:bg-purple-50 border-purple-200"
                                                    onClick={() => toast.info('Configurando campanhas sazonais...')}
                                                >
                                                    <Calendar className="w-5 h-5 text-purple-600 mb-2" />
                                                    <span className="font-semibold">Campanhas Sazonais</span>
                                                    <span className="text-xs text-slate-600">Datas comemorativas automáticas</span>
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Fluxo de Automação */}
                                <Card className="border-0 shadow-xl shadow-slate-200/60">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                                        <CardTitle className="flex items-center gap-2">
                                            <Activity className="w-5 h-5 text-indigo-500" />
                                            Fluxo de Automação Inteligente
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="space-y-6">
                                            <div className="text-center">
                                                <h3 className="font-semibold text-slate-900 mb-2">Jornada do Cliente Automatizada</h3>
                                                <p className="text-slate-600 mb-6">
                                                    Configure fluxos inteligentes baseados no comportamento e segmentação dos clientes
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                                                <div className="text-center">
                                                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
                                                        <UserPlus className="w-8 h-8 text-white" />
                                                    </div>
                                                    <p className="text-sm font-medium">Novo Cliente</p>
                                                </div>

                                                <ArrowRight className="w-6 h-6 text-slate-400 mx-auto" />

                                                <div className="text-center">
                                                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                                        <Mail className="w-8 h-8 text-white" />
                                                    </div>
                                                    <p className="text-sm font-medium">Boas-vindas</p>
                                                </div>

                                                <ArrowRight className="w-6 h-6 text-slate-400 mx-auto" />

                                                <div className="text-center">
                                                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                                        <Target className="w-8 h-8 text-white" />
                                                    </div>
                                                    <p className="text-sm font-medium">Segmentação</p>
                                                </div>
                                            </div>

                                            <div className="text-center pt-4">
                                                <Button className="bg-gradient-to-r from-indigo-500 to-purple-600">
                                                    <Settings className="w-4 h-4 mr-2" />
                                                    Configurar Fluxo Completo
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default CampaignsPage
