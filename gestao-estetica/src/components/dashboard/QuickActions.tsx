import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Bell,
    Plus,
    ArrowRight,
    Zap,
    Calendar,
    DollarSign,
    Settings,
    BarChart3,
    UserPlus,
    ClipboardCheck,
    Star,
    Sparkles,
    Eye,
    EyeOff,
    Filter,
    Grid3X3,
    List,
    Search
} from 'lucide-react';
import { cn } from '@/lib/utils/utils';

interface QuickAction {
    id: string;
    title: string;
    description: string;
    icon: React.ElementType;
    action: () => void;
    variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost';
    size?: 'sm' | 'default' | 'lg';
    badge?: {
        text: string;
        variant?: 'default' | 'secondary' | 'destructive' | 'outline';
    };
    disabled?: boolean;
    loading?: boolean;
    shortcut?: string;
    priority?: 'high' | 'medium' | 'low';
    gradient?: string;
    category?: string;
}

interface QuickActionsProps {
    actions?: QuickAction[];
    title?: string;
    description?: string;
    layout?: 'grid' | 'list';
    columns?: 2 | 3 | 4;
    showShortcuts?: boolean;
    showCategories?: boolean;
    className?: string;
}

const DEFAULT_ACTIONS: QuickAction[] = [
    {
        id: 'new-appointment',
        title: 'Novo Agendamento',
        description: 'Agendar nova consulta ou procedimento rapidamente',
        icon: Calendar,
        action: () => console.log('Novo agendamento'),
        priority: 'high',
        shortcut: 'Ctrl + N',
        gradient: 'from-blue-500 to-indigo-600',
        badge: { text: 'Rápido', variant: 'default' },
        category: 'Agendamentos'
    },
    {
        id: 'new-client',
        title: 'Cadastrar Cliente',
        description: 'Adicionar novo cliente ao sistema com dados completos',
        icon: UserPlus,
        action: () => console.log('Novo cliente'),
        priority: 'high',
        shortcut: 'Ctrl + U',
        gradient: 'from-emerald-500 to-green-600',
        category: 'Clientes'
    },
    {
        id: 'financial-report',
        title: 'Relatório Financeiro',
        description: 'Visualizar relatórios e métricas de desempenho',
        icon: BarChart3,
        action: () => console.log('Relatório financeiro'),
        priority: 'medium',
        shortcut: 'Ctrl + R',
        gradient: 'from-purple-500 to-pink-600',
        category: 'Relatórios'
    },
    {
        id: 'payment-record',
        title: 'Registrar Pagamento',
        description: 'Lançar novo pagamento recebido no sistema',
        icon: DollarSign,
        action: () => console.log('Pagamento'),
        priority: 'medium',
        shortcut: 'Ctrl + P',
        gradient: 'from-amber-500 to-orange-600',
        category: 'Financeiro'
    },
    {
        id: 'checklist',
        title: 'Lista de Tarefas',
        description: 'Verificar e gerenciar tarefas pendentes',
        icon: ClipboardCheck,
        action: () => console.log('Checklist'),
        priority: 'low',
        gradient: 'from-teal-500 to-cyan-600',
        category: 'Gestão'
    },
    {
        id: 'settings',
        title: 'Configurações',
        description: 'Ajustar configurações e preferências do sistema',
        icon: Settings,
        action: () => console.log('Configurações'),
        priority: 'low',
        shortcut: 'Ctrl + ,',
        gradient: 'from-slate-500 to-slate-600',
        category: 'Sistema'
    }
];

export function QuickActions({
                                 actions = DEFAULT_ACTIONS,
                                 title = "Ações Rápidas",
                                 description = "Acesso rápido às funcionalidades mais usadas",
                                 layout = 'grid',
                                 columns = 3,
                                 showShortcuts = true,
                                 showCategories = false,
                                 className
                             }: QuickActionsProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [showDetails, setShowDetails] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const sortedActions = [...actions].sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority || 'low'] - priorityOrder[b.priority || 'low'];
    });

    // Filtrar ações por categoria e busca
    const filteredActions = sortedActions.filter(action => {
        const matchesCategory = selectedCategory === 'all' || action.category === selectedCategory;
        const matchesSearch = searchTerm === '' ||
            action.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            action.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // Obter categorias únicas
    const categories = ['all', ...Array.from(new Set(actions.map(action => action.category).filter(Boolean)))];

    const handleAction = (action: QuickAction) => {
        if (!action.disabled && !action.loading) {
            action.action();
        }
    };

    const getPriorityStyle = (priority?: string) => {
        switch (priority) {
            case 'high':
                return 'ring-2 ring-blue-200 ring-offset-2 ring-offset-white';
            case 'medium':
                return 'ring-1 ring-purple-200';
            default:
                return '';
        }
    };

    const ActionButton = ({ action }: { action: QuickAction }) => (
        <div
            className={cn(
                "group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border border-slate-200/60 hover:shadow-2xl hover:shadow-slate-300/60 transition-all duration-500 hover:-translate-y-2 cursor-pointer",
                getPriorityStyle(action.priority),
                action.disabled && "opacity-50 cursor-not-allowed",
                action.loading && "pointer-events-none"
            )}
            onClick={() => handleAction(action)}
        >
            {/* Gradient Background Effect */}
            <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-all duration-500",
                action.gradient || 'from-slate-500 to-slate-600'
            )} />

            {/* Animated Border Gradient */}
            <div className={cn(
                "absolute inset-0 rounded-2xl bg-gradient-to-r opacity-0 group-hover:opacity-20 transition-all duration-500 -z-10",
                action.gradient || 'from-slate-500 to-slate-600'
            )} />

            <div className="relative p-6 z-10">
                <div className="flex items-start justify-between mb-4">
                    <div className={cn(
                        "p-3 rounded-2xl bg-gradient-to-br shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500",
                        action.gradient || 'from-slate-500 to-slate-600'
                    )}>
                        <action.icon className="w-6 h-6 text-white drop-shadow-sm" />
                    </div>

                    <div className="flex items-center gap-2">
                        {action.priority === 'high' && (
                            <div className="flex items-center gap-1 bg-gradient-to-r from-amber-100 to-orange-100 px-2 py-1 rounded-lg border border-amber-200">
                                <Star className="w-3 h-3 text-amber-600 fill-amber-400" />
                                <span className="text-xs text-amber-700 font-medium">Alta</span>
                            </div>
                        )}
                        {action.badge && (
                            <Badge className={cn(
                                "text-xs font-semibold px-3 py-1 shadow-lg transition-all duration-300 group-hover:scale-105",
                                action.priority === 'high'
                                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 shadow-blue-500/25'
                                    : action.priority === 'medium'
                                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-purple-500/25'
                                        : 'bg-slate-100 text-slate-600 border-slate-200'
                            )}>
                                {action.badge.text}
                            </Badge>
                        )}
                        <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                </div>

                <div className="space-y-3">
                    <div>
                        <p className="text-base font-bold text-slate-900 group-hover:text-slate-800 transition-colors duration-300">
                            {action.title}
                        </p>
                        <p className="text-sm text-slate-600 leading-relaxed group-hover:text-slate-700 transition-colors duration-300 mt-1">
                            {action.description}
                        </p>
                    </div>

                    {showShortcuts && action.shortcut && (
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                            <Badge
                                variant="outline"
                                className="bg-slate-50/80 text-slate-600 border-slate-200 text-xs font-mono px-3 py-1 group-hover:bg-white group-hover:shadow-sm transition-all duration-300"
                            >
                                {action.shortcut}
                            </Badge>
                            {action.category && showCategories && (
                                <span className="text-xs text-slate-500 font-medium bg-slate-100/50 px-2 py-1 rounded-lg">
                                    {action.category}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Loading Overlay */}
                {action.loading && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center rounded-2xl z-20">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
                            <span className="text-sm text-slate-600 font-medium">Carregando...</span>
                        </div>
                    </div>
                )}

                {/* Disabled Overlay */}
                {action.disabled && (
                    <div className="absolute inset-0 bg-slate-100/60 backdrop-blur-sm rounded-2xl z-20" />
                )}

                {/* Hover Shine Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>
            </div>
        </div>
    );

    return (
        <Card className={cn("border-0 shadow-2xl shadow-slate-200/60 overflow-hidden bg-gradient-to-br from-white via-slate-50/30 to-white", className)}>
            <CardHeader className="bg-gradient-to-r from-slate-50/80 to-white/80 backdrop-blur-sm border-b border-slate-100">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-3 text-xl">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                                <Zap className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">{title}</h2>
                                {description && (
                                    <CardDescription className="mt-1 text-slate-600">
                                        {description}
                                    </CardDescription>
                                )}
                            </div>
                        </CardTitle>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg shadow-amber-500/25">
                            <Sparkles className="w-3 h-3 mr-1" />
                            {filteredActions.length} ações
                        </Badge>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDetails(!showDetails)}
                            className="hover:bg-slate-100 rounded-xl"
                        >
                            {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar ações..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                        />
                    </div>

                    {showCategories && categories.length > 1 && (
                        <div className="flex items-center gap-2 overflow-x-auto">
                            {categories.map((category) => (
                                <Button
                                    key={category}
                                    variant={selectedCategory === category ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSelectedCategory(category)}
                                    className={cn(
                                        "whitespace-nowrap rounded-xl transition-all duration-300",
                                        selectedCategory === category
                                            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                                            : "bg-white hover:bg-slate-50"
                                    )}
                                >
                                    {category === 'all' ? 'Todas' : category}
                                </Button>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-1">
                        <Button
                            variant={layout === 'grid' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setLayout('grid')}
                            className="rounded-xl"
                        >
                            <Grid3X3 className="w-4 h-4" />
                        </Button>
                        <Button
                            variant={layout === 'list' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setLayout('list')}
                            className="rounded-xl"
                        >
                            <List className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Actions Grid/List */}
                {layout === 'grid' ? (
                    <div className={cn(
                        "grid gap-6",
                        columns === 2 && "grid-cols-1 sm:grid-cols-2",
                        columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
                        columns === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                    )}>
                        {filteredActions.map((action) => (
                            <ActionButton key={action.id} action={action} />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredActions.map((action) => (
                            <ActionButton key={action.id} action={action} />
                        ))}
                    </div>
                )}

                {filteredActions.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-500 font-medium mb-2">Nenhuma ação encontrada</p>
                        <p className="text-sm text-slate-400">
                            {searchTerm ? `Nenhum resultado para "${searchTerm}"` : 'Ajuste os filtros para ver mais ações'}
                        </p>
                    </div>
                )}

                {/* Keyboard Shortcuts */}
                {showShortcuts && showDetails && (
                    <>
                        <Separator />
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Bell className="w-4 h-4 text-slate-600" />
                                <span className="text-sm font-semibold text-slate-700">
                                    Atalhos de Teclado
                                </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {filteredActions
                                    .filter(action => action.shortcut)
                                    .slice(0, 6)
                                    .map((action) => (
                                        <div
                                            key={action.id}
                                            className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-100 hover:bg-slate-100/80 transition-all duration-300 hover:scale-[1.02]"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "p-2 rounded-lg bg-gradient-to-br shadow-sm",
                                                    action.gradient || 'from-slate-500 to-slate-600'
                                                )}>
                                                    <action.icon className="w-3 h-3 text-white" />
                                                </div>
                                                <span className="text-sm text-slate-700 font-medium">
                                                    {action.title}
                                                </span>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className="bg-white text-slate-600 border-slate-200 text-xs font-mono px-3 py-1 shadow-sm"
                                            >
                                                {action.shortcut}
                                            </Badge>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

export default QuickActions;