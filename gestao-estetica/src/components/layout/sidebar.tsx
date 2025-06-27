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
                                "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-slate-100 group",
                                active ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100" : "text-slate-600 hover:text-slate-900",
                                isCollapsed && "justify-center px-2"
                            )}
                        >
                            <div className={cn(
                                "p-1.5 rounded-lg transition-colors duration-200",
                                active ? "bg-blue-100" : "group-hover:bg-slate-200"
                            )}>
                                <Icon className={cn(
                                    "h-4 w-4 transition-colors duration-200",
                                    active ? "text-blue-600" : "text-slate-500 group-hover:text-slate-700"
                                )} />
                            </div>
                            {!isCollapsed && (
                                <>
                                    <span className="flex-1 text-left">{item.title}</span>
                                    {item.badge && (
                                        <Badge
                                            variant={isBottomMenu ? "destructive" : "secondary"}
                                            className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs bg-blue-100 text-blue-700 border-0"
                                        >
                                            {item.badge}
                                        </Badge>
                                    )}
                                    {isSubmenuOpen ?
                                        <ChevronDown className="h-3 w-3 text-slate-400" /> :
                                        <ChevronRight className="h-3 w-3 text-slate-400" />
                                    }
                                </>
                            )}
                        </button>

                        {isSubmenuOpen && !isCollapsed && (
                            <div className="ml-3 pl-4 border-l border-slate-200 space-y-1">
                                {item.submenu?.map(subItem => {
                                    const SubIcon = subItem.icon;
                                    const isSubActive = pathname === subItem.href;

                                    return (
                                        <Link
                                            key={subItem.href}
                                            href={subItem.href}
                                            onClick={handleNavigation}
                                            className={cn(
                                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-slate-100 group",
                                                isSubActive ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                                            )}
                                        >
                                            <SubIcon className={cn(
                                                "h-3 w-3 transition-colors duration-200",
                                                isSubActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                                            )} />
                                            <span className="flex-1">{subItem.title}</span>
                                            {subItem.badge && (
                                                <Badge
                                                    variant="secondary"
                                                    className="ml-auto flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-xs"
                                                >
                                                    {subItem.badge}
                                                </Badge>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    <Link
                        href={item.href}
                        onClick={handleNavigation}
                        className={cn(
                            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-slate-100 group",
                            active ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100" : "text-slate-600 hover:text-slate-900",
                            isCollapsed && "justify-center px-2"
                        )}
                    >
                        <div className={cn(
                            "p-1.5 rounded-lg transition-colors duration-200",
                            active ? "bg-blue-100" : "group-hover:bg-slate-200"
                        )}>
                            <Icon className={cn(
                                "h-4 w-4 transition-colors duration-200",
                                active ? "text-blue-600" : "text-slate-500 group-hover:text-slate-700"
                            )} />
                        </div>
                        {!isCollapsed && (
                            <>
                                <span className="flex-1">{item.title}</span>
                                {item.badge && (
                                    <Badge
                                        variant={isBottomMenu ? "destructive" : "secondary"}
                                        className={cn(
                                            "ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs border-0",
                                            isBottomMenu ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
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
        <div className="flex h-full flex-col bg-white border-r border-slate-200 shadow-xl">
            {/* Header */}
            <div className={cn(
                "flex items-center border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white",
                isCollapsed ? "h-16 px-4 justify-center" : "h-16 px-6 justify-between"
            )}>
                <Link href="/dashboard" className="flex items-center gap-3 font-semibold">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    {!isCollapsed && (
                        <span className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                            {getBusinessName()}
                        </span>
                    )}
                </Link>
                {!isCollapsed && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsCollapsed(true)}
                        className="h-8 w-8 hover:bg-slate-100 lg:hidden"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Collapse Button - Desktop */}
            <div className="hidden lg:flex items-center justify-end p-2 border-b border-slate-200">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="h-8 w-8 hover:bg-slate-100"
                >
                    {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                <nav className={cn("space-y-2 p-4", isCollapsed && "px-2")}>
                    {/* Main Menu */}
                    <div className="space-y-1">
                        {menuItems.map(item => renderMenuItem(item))}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-slate-200 my-4" />

                    {/* Bottom Menu */}
                    <div className="space-y-1">
                        {bottomMenuItems.map(item => renderMenuItem(item, true))}
                    </div>
                </nav>
            </div>

            {/* User Profile */}
            <div className="border-t border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                {isLoading ? (
                    <div className={cn("p-4", isCollapsed && "px-2")}>
                        <div className="flex items-center gap-3 rounded-xl p-2">
                            <div className="h-10 w-10 rounded-full bg-slate-200 animate-pulse" />
                            {!isCollapsed && (
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 bg-slate-200 rounded animate-pulse" />
                                    <div className="h-2 bg-slate-200 rounded animate-pulse w-2/3" />
                                </div>
                            )}
                        </div>
                    </div>
                ) : user ? (
                    <div className={cn("p-4", isCollapsed && "px-2")}>
                        <div className={cn(
                            "flex items-center gap-3 rounded-xl p-3 hover:bg-slate-100 transition-all duration-200 cursor-pointer group",
                            isCollapsed && "justify-center"
                        )}>
                            <Avatar className="h-10 w-10 ring-2 ring-slate-200 shadow-md">
                                <AvatarImage
                                    src={userProfile?.avatar_url || "/placeholder-avatar.jpg"}
                                    alt={getDisplayName()}
                                />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                                    {getUserInitials()}
                                </AvatarFallback>
                            </Avatar>
                            {!isCollapsed && (
                                <>
                                    <div className="flex-1 space-y-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-900 truncate">
                                            {getDisplayName()}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate">
                                            {user.email}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 shrink-0 hover:bg-red-100 hover:text-red-600 transition-colors duration-200"
                                        onClick={handleSignOut}
                                        title="Sair"
                                    >
                                        <LogOut className="h-4 w-4" />
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="p-4">
                        <div className="flex items-center justify-center p-2">
                            <p className="text-sm text-slate-500">Não autenticado</p>
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
                className="lg:hidden fixed top-4 left-4 z-50 h-10 w-10 bg-white shadow-md hover:shadow-lg transition-shadow duration-200"
                onClick={() => setIsMobileOpen(true)}
            >
                <Menu className="h-5 w-5" />
            </Button>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-200"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Desktop Sidebar */}
            <aside className={cn(
                "hidden lg:block fixed left-0 top-0 z-30 h-full transition-all duration-300 ease-in-out",
                isCollapsed ? "w-16" : "w-64",
                className
            )}>
                {sidebarContent}
            </aside>

            {/* Mobile Sidebar */}
            <aside className={cn(
                "lg:hidden fixed left-0 top-0 z-50 h-full w-64 transform transition-transform duration-300 ease-in-out",
                isMobileOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {sidebarContent}
            </aside>
        </>
    );
}