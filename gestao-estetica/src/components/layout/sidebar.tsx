import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Calendar,
    Users,
    Package,
    DollarSign,
    BarChart3,
    Settings,
    Home,
    Bell,
    LogOut,
    ClipboardList,
    Scissors,
    PieChart,
    ChevronDown,
    ChevronRight,
    ShoppingBag,
    UserPlus,
    BarChart,
    Target,
    TrendingUp,
    FileText,
    Tags,
    Briefcase,
    Wallet,
    Receipt,
    Database,
    LineChart,
    PlusCircle,
    History,
    Activity,
    Sparkles,
    Menu,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/useAuthStore';

interface SidebarProps {
    className?: string;
    onNavigate?: () => void;
}

interface MenuItem {
    title: string;
    href: string;
    icon: React.ElementType;
    badge?: string | null;
    submenu?: MenuItem[];
}

const menuItems: MenuItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: Home,
        badge: null
    },
    {
        title: 'Agendamentos',
        href: '/agendamentos',
        icon: Calendar,
        badge: '3',
        submenu: [
            { title: 'Calendário', href: '/agendamentos/calendario', icon: Calendar, badge: null },
            { title: 'Novo Agendamento', href: '/agendamentos/novo', icon: PlusCircle, badge: null },
            { title: 'Configurações', href: '/agendamentos/configuracao', icon: Settings, badge: null }
        ]
    },
    {
        title: 'Atendimentos',
        href: '/atendimentos',
        icon: ClipboardList,
        badge: null,
        submenu: [
            { title: 'Novo Atendimento', href: '/atendimentos/novo', icon: PlusCircle, badge: null },
            { title: 'Relatórios', href: '/atendimentos/relatorio', icon: FileText, badge: null }
        ]
    },
    {
        title: 'Clientes',
        href: '/clientes',
        icon: Users,
        badge: null,
        submenu: [
            { title: 'Novo Cliente', href: '/clientes/novo', icon: UserPlus, badge: null },
            { title: 'Segmentos', href: '/clientes/segmentos', icon: Target, badge: null },
            { title: 'Campanhas', href: '/clientes/campanhas', icon: BarChart, badge: null }
        ]
    },
    {
        title: 'Estoque',
        href: '/estoque',
        icon: Package,
        badge: null,
        submenu: [
            { title: 'Produtos', href: '/estoque/produtos', icon: ShoppingBag, badge: null },
            { title: 'Movimentações', href: '/estoque/movimentacoes', icon: Activity, badge: null },
            { title: 'Relatórios', href: '/estoque/relatorios', icon: FileText, badge: null }
        ]
    },
    {
        title: 'Procedimentos',
        href: '/procedimentos',
        icon: Scissors,
        badge: null,
        submenu: [
            { title: 'Categorias', href: '/procedimentos/categorias', icon: Tags, badge: null },
            { title: 'Rentabilidade', href: '/procedimentos/rentabilidade', icon: TrendingUp, badge: null },
            { title: 'Precificação', href: '/procedimentos/precificacao', icon: DollarSign, badge: null }
        ]
    },
    {
        title: 'Financeiro',
        href: '/financeiro',
        icon: DollarSign,
        badge: null,
        submenu: [
            { title: 'Fluxo de Caixa', href: '/financeiro/fluxo-caixa', icon: Wallet, badge: null },
            { title: 'Custos Fixos', href: '/financeiro/custos-fixos', icon: Receipt, badge: null },
            { title: 'Metas', href: '/financeiro/metas', icon: Target, badge: null },
            { title: 'Projeções', href: '/financeiro/projecoes', icon: LineChart, badge: null }
        ]
    },
    {
        title: 'Distribuição de Lucros',
        href: '/distribuicao-lucros',
        icon: PieChart,
        badge: null,
        submenu: [
            { title: 'Configuração', href: '/distribuicao-lucros/configuracao', icon: Settings, badge: null },
            { title: 'Histórico', href: '/distribuicao-lucros/historico', icon: History, badge: null },
            { title: 'Simulador', href: '/distribuicao-lucros/simulador', icon: BarChart, badge: null }
        ]
    },
    {
        title: 'Relatórios',
        href: '/relatorios',
        icon: BarChart3,
        badge: null,
        submenu: [
            { title: 'Executivo', href: '/relatorios/executivo', icon: Briefcase, badge: null },
            { title: 'Clientes', href: '/relatorios/clientes', icon: Users, badge: null },
            { title: 'Financeiro', href: '/relatorios/financeiro', icon: DollarSign, badge: null },
            { title: 'Operacional', href: '/relatorios/operacional', icon: Activity, badge: null }
        ]
    }
];

const bottomMenuItems: MenuItem[] = [
    {
        title: 'Notificações',
        href: '/notificacoes',
        icon: Bell,
        badge: '2'
    },
    {
        title: 'Configurações',
        href: '/configuracoes',
        icon: Settings,
        badge: null,
        submenu: [
            { title: 'Perfil', href: '/configuracoes/perfil', icon: Users, badge: null },
            { title: 'Calendário', href: '/configuracoes/calendar', icon: Calendar, badge: null },
            { title: 'Backup', href: '/configuracoes/backup', icon: Database, badge: null }
        ]
    }
];

export function Sidebar({ className, onNavigate }: SidebarProps) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const {
        user,
        userProfile,
        businessProfile,
        signOut,
        isLoading
    } = useAuthStore();
    const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

    const toggleSubmenu = (title: string) => {
        setOpenSubmenus(prev => ({
            ...prev,
            [title]: !prev[title]
        }));
    };

    const isActive = (href: string) => {
        return pathname === href || pathname.startsWith(`${href}/`);
    };

    const handleNavigation = () => {
        onNavigate?.();
        setIsMobileOpen(false);
    };

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    };

    const getUserInitials = () => {
        if (userProfile?.full_name && typeof userProfile.full_name === 'string') {
            return userProfile.full_name
                .split(' ')
                .map((name: string) => name.charAt(0))
                .join('')
                .toUpperCase()
                .slice(0, 2);
        }
        if (user?.email) {
            return user.email.charAt(0).toUpperCase();
        }
        return 'U';
    };

    const getDisplayName = () => {
        if (userProfile?.full_name && typeof userProfile.full_name === 'string') {
            return userProfile.full_name;
        }
        if (user?.email) {
            return user.email.split('@')[0];
        }
        return 'Usuário';
    };

    const getBusinessName = () => {
        if (businessProfile?.business_name) {
            return businessProfile.business_name;
        }
        return 'Estética Pro';
    };

    const renderMenuItem = (item: MenuItem, isBottomMenu: boolean = false) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        const hasSubmenu = item.submenu && item.submenu.length > 0;
        const isSubmenuOpen = openSubmenus[item.title] || false;

        return (
            <React.Fragment key={item.href}>
                {hasSubmenu ? (
                    <div className="space-y-1">
                        <button
                            onClick={() => toggleSubmenu(item.title)}
                            className={cn(
                                "w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 ease-out group relative overflow-hidden",
                                "hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:shadow-sm hover:scale-[1.02]",
                                "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 focus:ring-offset-white",
                                active ?
                                    "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]" :
                                    "text-slate-600 hover:text-slate-900",
                                isCollapsed && "justify-center px-2"
                            )}
                        >
                            {/* Animação de fundo para hover */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            <div className={cn(
                                "relative z-10 p-2 rounded-lg transition-all duration-300",
                                active ? "bg-white/20 backdrop-blur-sm" : "group-hover:bg-blue-100"
                            )}>
                                <Icon className={cn(
                                    "h-5 w-5 transition-all duration-300",
                                    active ? "text-white drop-shadow-sm" : "text-slate-500 group-hover:text-blue-600"
                                )} />
                            </div>
                            {!isCollapsed && (
                                <>
                                    <span className="relative z-10 flex-1 text-left font-medium">{item.title}</span>
                                    {item.badge && (
                                        <Badge
                                            variant={isBottomMenu ? "destructive" : "secondary"}
                                            className={cn(
                                                "relative z-10 ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs border-0 font-semibold transition-all duration-300",
                                                active ? "bg-white text-blue-600 shadow-sm" : "bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white"
                                            )}
                                        >
                                            {item.badge}
                                        </Badge>
                                    )}
                                    <div className="relative z-10">
                                        {isSubmenuOpen ?
                                            <ChevronDown className={cn("h-4 w-4 transition-all duration-300", active ? "text-white" : "text-slate-400 group-hover:text-blue-600")} /> :
                                            <ChevronRight className={cn("h-4 w-4 transition-all duration-300", active ? "text-white" : "text-slate-400 group-hover:text-blue-600")} />
                                        }
                                    </div>
                                </>
                            )}
                        </button>

                        <div className={cn(
                            "ml-3 pl-4 border-l-2 space-y-1 transition-all duration-300 overflow-hidden",
                            isSubmenuOpen && !isCollapsed ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
                            active ? "border-l-blue-200" : "border-l-slate-200"
                        )}>
                            {item.submenu?.map(subItem => {
                                const SubIcon = subItem.icon;
                                const isSubActive = pathname === subItem.href;

                                return (
                                    <Link
                                        key={subItem.href}
                                        href={subItem.href}
                                        onClick={handleNavigation}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 group relative overflow-hidden hover:scale-[1.02]",
                                            "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 focus:ring-offset-white",
                                            isSubActive ?
                                                "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 shadow-sm border border-blue-100" :
                                                "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                        )}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        <SubIcon className={cn(
                                            "relative z-10 h-4 w-4 transition-all duration-300",
                                            isSubActive ? "text-blue-600" : "text-slate-400 group-hover:text-blue-600"
                                        )} />
                                        <span className="relative z-10 flex-1">{subItem.title}</span>
                                        {subItem.badge && (
                                            <Badge
                                                variant="secondary"
                                                className="relative z-10 ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs"
                                            >
                                                {subItem.badge}
                                            </Badge>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <Link
                        href={item.href}
                        onClick={handleNavigation}
                        className={cn(
                            "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 ease-out group relative overflow-hidden",
                            "hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:shadow-sm hover:scale-[1.02]",
                            "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 focus:ring-offset-white",
                            active ?
                                "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]" :
                                "text-slate-600 hover:text-slate-900",
                            isCollapsed && "justify-center px-2"
                        )}
                    >
                        {/* Animação de fundo para hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        <div className={cn(
                            "relative z-10 p-2 rounded-lg transition-all duration-300",
                            active ? "bg-white/20 backdrop-blur-sm" : "group-hover:bg-blue-100"
                        )}>
                            <Icon className={cn(
                                "h-5 w-5 transition-all duration-300",
                                active ? "text-white drop-shadow-sm" : "text-slate-500 group-hover:text-blue-600"
                            )} />
                        </div>
                        {!isCollapsed && (
                            <>
                                <span className="relative z-10 flex-1 font-medium">{item.title}</span>
                                {item.badge && (
                                    <Badge
                                        variant={isBottomMenu ? "destructive" : "secondary"}
                                        className={cn(
                                            "relative z-10 ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs border-0 font-semibold transition-all duration-300",
                                            isBottomMenu ?
                                                (active ? "bg-white text-red-600" : "bg-red-100 text-red-700 group-hover:bg-red-600 group-hover:text-white") :
                                                (active ? "bg-white text-blue-600 shadow-sm" : "bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white")
                                        )}
                                    >
                                        {item.badge}
                                    </Badge>
                                )}
                            </>
                        )}
                    </Link>
                )}
            </React.Fragment>
        );
    };

    const sidebarContent = (
        <div className="flex h-full flex-col bg-white/95 backdrop-blur-lg border-r border-slate-200/80 shadow-2xl">
            {/* Header */}
            <div className={cn(
                "flex items-center border-b border-slate-200/80 bg-gradient-to-r from-slate-50/90 to-white/90 backdrop-blur-sm",
                isCollapsed ? "h-20 px-4 justify-center" : "h-20 px-6 justify-between"
            )}>
                <Link href="/dashboard" className="flex items-center gap-3 font-semibold group">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-600 to-blue-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                        <Sparkles className="h-5 w-5 text-white drop-shadow-sm" />
                    </div>
                    {!isCollapsed && (
                        <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                            {getBusinessName()}
                        </span>
                    )}
                </Link>
                {!isCollapsed && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsCollapsed(true)}
                        className="h-10 w-10 hover:bg-slate-100 lg:hidden rounded-xl transition-all duration-300 hover:scale-110"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                )}
            </div>

            {/* Collapse Button - Desktop */}
            <div className="hidden lg:flex items-center justify-end p-3 border-b border-slate-200/80">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="h-9 w-9 hover:bg-slate-100 rounded-xl transition-all duration-300 hover:scale-110 group"
                >
                    {isCollapsed ?
                        <ChevronRight className="h-4 w-4 group-hover:text-blue-600 transition-colors duration-300" /> :
                        <ChevronDown className="h-4 w-4 group-hover:text-blue-600 transition-colors duration-300" />
                    }
                </Button>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                <nav className={cn("space-y-2 p-4", isCollapsed && "px-3")}>
                    {/* Main Menu */}
                    <div className="space-y-2">
                        {menuItems.map(item => renderMenuItem(item))}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-slate-200/80 my-6" />

                    {/* Bottom Menu */}
                    <div className="space-y-2">
                        {bottomMenuItems.map(item => renderMenuItem(item, true))}
                    </div>
                </nav>
            </div>

            {/* User Profile */}
            <div className="border-t border-slate-200/80 bg-gradient-to-r from-slate-50/90 to-white/90 backdrop-blur-sm">
                {isLoading ? (
                    <div className={cn("p-4", isCollapsed && "px-3")}>
                        <div className="flex items-center gap-3 rounded-2xl p-3">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 animate-pulse" />
                            {!isCollapsed && (
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-slate-200 rounded-lg animate-pulse" />
                                    <div className="h-3 bg-slate-200 rounded-lg animate-pulse w-2/3" />
                                </div>
                            )}
                        </div>
                    </div>
                ) : user ? (
                    <div className={cn("p-4", isCollapsed && "px-3")}>
                        <div className={cn(
                            "flex items-center gap-3 rounded-2xl p-3 hover:bg-slate-100/80 transition-all duration-300 cursor-pointer group relative overflow-hidden",
                            isCollapsed && "justify-center"
                        )}>
                            {/* Background hover effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

                            <Avatar className="relative z-10 h-12 w-12 ring-2 ring-slate-200 shadow-lg group-hover:ring-blue-300 group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                                <AvatarImage
                                    src={userProfile?.avatar_url || "/placeholder-avatar.jpg"}
                                    alt={getDisplayName()}
                                />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-lg">
                                    {getUserInitials()}
                                </AvatarFallback>
                            </Avatar>
                            {!isCollapsed && (
                                <>
                                    <div className="relative z-10 flex-1 space-y-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-900 transition-colors duration-300">
                                            {getDisplayName()}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate group-hover:text-blue-600 transition-colors duration-300">
                                            {user.email}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="relative z-10 h-9 w-9 shrink-0 hover:bg-red-100 hover:text-red-600 transition-all duration-300 rounded-xl group/logout hover:scale-110"
                                        onClick={handleSignOut}
                                        title="Sair"
                                    >
                                        <LogOut className="h-4 w-4 group-hover/logout:rotate-12 transition-transform duration-300" />
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="p-4">
                        <div className="flex items-center justify-center p-3 rounded-2xl bg-red-50">
                            <p className="text-sm text-red-600 font-medium">Não autenticado</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Menu Button */}
            <Button
                variant="ghost"
                size="icon"
                className="lg:hidden fixed top-4 left-4 z-50 h-12 w-12 bg-white/95 backdrop-blur-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 rounded-2xl border border-slate-200/80"
                onClick={() => setIsMobileOpen(true)}
            >
                <Menu className="h-6 w-6" />
            </Button>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-all duration-300"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Desktop Sidebar */}
            <aside className={cn(
                "hidden lg:block fixed left-0 top-0 z-30 h-full transition-all duration-500 ease-in-out",
                isCollapsed ? "w-20" : "w-72",
                className
            )}>
                {sidebarContent}
            </aside>

            {/* Mobile Sidebar */}
            <aside className={cn(
                "lg:hidden fixed left-0 top-0 z-50 h-full w-72 transform transition-transform duration-500 ease-in-out",
                isMobileOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {sidebarContent}
            </aside>
        </>
    );
}