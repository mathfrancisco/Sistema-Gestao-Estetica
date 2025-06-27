import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    ClipboardCheck
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
}

interface QuickActionsProps {
    actions?: QuickAction[];
    title?: string;
    description?: string;
    layout?: 'grid' | 'list';
    columns?: 2 | 3 | 4;
    showShortcuts?: boolean;
    className?: string;
}

const DEFAULT_ACTIONS: QuickAction[] = [
    {
        id: 'new-appointment',
        title: 'Novo Agendamento',
        description: 'Agendar nova consulta ou procedimento',
        icon: Calendar,
        action: () => console.log('Novo agendamento'),
        priority: 'high',
        shortcut: 'Ctrl + N',
        gradient: 'from-blue-500 to-indigo-600',
        badge: { text: 'Rápido', variant: 'default' }
    },
    {
        id: 'new-client',
        title: 'Cadastrar Cliente',
        description: 'Adicionar novo cliente ao sistema',
        icon: UserPlus,
        action: () => console.log('Novo cliente'),
        priority: 'high',
        shortcut: 'Ctrl + U',
        gradient: 'from-emerald-500 to-green-600'
    },
    {
        id: 'financial-report',
        title: 'Relatório Financeiro',
        description: 'Visualizar relatórios e métricas',
        icon: BarChart3,
        action: () => console.log('Relatório financeiro'),
        priority: 'medium',
        shortcut: 'Ctrl + R',
        gradient: 'from-purple-500 to-pink-600'
    },
    {
        id: 'payment-record',
        title: 'Registrar Pagamento',
        description: 'Lançar novo pagamento recebido',
        icon: DollarSign,
        action: () => console.log('Pagamento'),
        priority: 'medium',
        shortcut: 'Ctrl + P',
        gradient: 'from-amber-500 to-orange-600'
    },
    {
        id: 'checklist',
        title: 'Lista de Tarefas',
        description: 'Verificar tarefas pendentes',
        icon: ClipboardCheck,
        action: () => console.log('Checklist'),
        priority: 'low',
        gradient: 'from-teal-500 to-cyan-600'
    },
    {
        id: 'settings',
        title: 'Configurações',
        description: 'Ajustar configurações do sistema',
        icon: Settings,
        action: () => console.log('Configurações'),
        priority: 'low',
        shortcut: 'Ctrl + ,',
        gradient: 'from-slate-500 to-slate-600'
    }
];

export function QuickActions({
                                 actions = DEFAULT_ACTIONS,
                                 title = "Ações Rápidas",
                                 description = "Acesso rápido às funcionalidades mais usadas",
                                 layout = 'grid',
                                 columns = 3,
                                 showShortcuts = true,
                                 className
                             }: QuickActionsProps) {
    const sortedActions = [...actions].sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority || 'low'] - priorityOrder[b.priority || 'low'];
    });

    const handleAction = (action: QuickAction) => {
        if (!action.disabled && !action.loading) {
            action.action();
        }
    };

    const ActionButton = ({ action }: { action: QuickAction }) => (
        <div
            className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200/60 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
            onClick={() => handleAction(action)}
        >
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient || 'from-slate-500 to-slate-600'} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />

            <div className="relative p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${action.gradient || 'from-slate-500 to-slate-600'} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <action.icon className="w-6 h-6 text-white" />
                    </div>

                    <div className="flex items-center gap-2">
                        {action.badge && (
                            <Badge className={`
                                ${action.priority === 'high'
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 shadow-lg shadow-blue-500/25'
                                : action.priority === 'medium'
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-lg shadow-purple-500/25'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                            }
                                text-xs font-semibold px-2 py-1
                            `}>
                                {action.badge.text}
                            </Badge>
                        )}
                        <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-base font-semibold text-slate-900">
                        {action.title}
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed">
                        {action.description}
                    </p>

                    {showShortcuts && action.shortcut && (
                        <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-xs font-mono px-2 py-1">
                                    {action.shortcut}
                                </Badge>
                            </div>
                            {action.priority === 'high' && (
                                <div className="flex items-center gap-1">
                                    <Zap className="w-3 h-3 text-amber-500" />
                                    <span className="text-xs text-amber-600 font-medium">Alta</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {action.loading && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                        <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                )}

                {action.disabled && (
                    <div className="absolute inset-0 bg-slate-100/60 backdrop-blur-sm rounded-2xl" />
                )}
            </div>
        </div>
    );

    return (
        <Card className={cn("border-0 shadow-xl shadow-slate-200/60 overflow-hidden", className)}>
            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Zap className="w-5 h-5 text-amber-500" />
                            {title}
                        </CardTitle>
                        {description && (
                            <CardDescription className="mt-1">
                                {description}
                            </CardDescription>
                        )}
                    </div>
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg shadow-amber-500/25">
                        <Plus className="w-3 h-3 mr-1" />
                        {actions.length} ações
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="p-6">
                {layout === 'grid' ? (
                    <div className={cn(
                        "grid gap-6",
                        columns === 2 && "grid-cols-1 sm:grid-cols-2",
                        columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
                        columns === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                    )}>
                        {sortedActions.map((action) => (
                            <ActionButton key={action.id} action={action} />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sortedActions.map((action) => (
                            <ActionButton key={action.id} action={action} />
                        ))}
                    </div>
                )}

                {showShortcuts && (
                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <div className="flex items-center gap-2 mb-4">
                            <Bell className="w-4 h-4 text-slate-600" />
                            <span className="text-sm font-semibold text-slate-700">
                                Atalhos de Teclado
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {sortedActions
                                .filter(action => action.shortcut)
                                .slice(0, 4)
                                .map((action) => (
                                    <div
                                        key={action.id}
                                        className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg bg-gradient-to-br ${action.gradient || 'from-slate-500 to-slate-600'}`}>
                                                <action.icon className="w-3 h-3 text-white" />
                                            </div>
                                            <span className="text-sm text-slate-700 font-medium">
                                                {action.title}
                                            </span>
                                        </div>
                                        <Badge variant="outline" className="bg-white text-slate-600 border-slate-200 text-xs font-mono px-2 py-1">
                                            {action.shortcut}
                                        </Badge>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default QuickActions;