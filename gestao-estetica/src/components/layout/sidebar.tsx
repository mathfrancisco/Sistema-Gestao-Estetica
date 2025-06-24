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
    FileHeart,
    Tags,
    Briefcase,
    Wallet,
    ReceiptText,
    Database,
    LineChart,
    PlusCircle,
    History,
    Activity,
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
            { title: 'Configuração', href: '/agendamentos/configuracao', icon: Settings, badge: null }
        ]
    },
    {
        title: 'Atendimentos',
        href: '/atendimentos',
        icon: ClipboardList,
        badge: null,
        submenu: [
            { title: 'Novo Atendimento', href: '/atendimentos/novo', icon: PlusCircle, badge: null },
            { title: 'Relatório', href: '/atendimentos/relatorio', icon: FileHeart, badge: null }
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
            { title: 'Relatórios', href: '/estoque/relatorios', icon: FileHeart, badge: null }
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
            { title: 'Custos Fixos', href: '/financeiro/custos-fixos', icon: ReceiptText, badge: null },
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
        else if (typeof userProfile?.full_name === 'boolean' && userProfile.full_name === true) {
            return "TB";
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

    const getEmail = () => {
        return user?.email || 'email@exemplo.com';
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
                                "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted",
                                active && "bg-muted text-primary font-medium"
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            <span className="flex-1 text-left">{item.title}</span>
                            {item.badge && (
                                <Badge
                                    variant={isBottomMenu ? "destructive" : "secondary"}
                                    className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                                >
                                    {item.badge}
                                </Badge>
                            )}
                            {isSubmenuOpen ?
                                <ChevronDown className="h-4 w-4" /> :
                                <ChevronRight className="h-4 w-4" />
                            }
                        </button>

                        {isSubmenuOpen && (
                            <div className="ml-6 pl-2 border-l space-y-1">
                                {item.submenu?.map(subItem => {
                                    const SubIcon = subItem.icon;
                                    const isSubActive = pathname === subItem.href;

                                    return (
                                        <Link
                                            key={subItem.href}
                                            href={subItem.href}
                                            onClick={handleNavigation}
                                            className={cn(
                                                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted",
                                                isSubActive && "bg-muted text-primary font-medium"
                                            )}
                                        >
                                            <SubIcon className="h-4 w-4" />
                                            <span className="flex-1">{subItem.title}</span>
                                            {subItem.badge && (
                                                <Badge
                                                    variant={isBottomMenu ? "destructive" : "secondary"}
                                                    className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
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
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted",
                            active && "bg-muted text-primary font-medium"
                        )}
                    >
                        <Icon className="h-4 w-4" />
                        <span className="flex-1">{item.title}</span>
                        {item.badge && (
                            <Badge
                                variant={isBottomMenu ? "destructive" : "secondary"}
                                className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                            >
                                {item.badge}
                            </Badge>
                        )}
                    </Link>
                )}
            </React.Fragment>
        );
    };

    return (
        <div className={cn("flex h-full max-h-screen flex-col gap-2 bg-background border-r", className)}>
            {/* Header */}
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    <div className="h-6 w-6 rounded bg-gradient-to-r from-pink-500 to-purple-600" />
                    <span className="text-sm font-bold">{getBusinessName()}</span>
                </Link>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-auto">
                <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                    {/* Main Menu */}
                    <div className="space-y-1 py-2">
                        {menuItems.map(item => renderMenuItem(item))}
                    </div>

                    {/* Divider */}
                    <div className="border-t my-2" />

                    {/* Bottom Menu */}
                    <div className="space-y-1 py-2">
                        {bottomMenuItems.map(item => renderMenuItem(item, true))}
                    </div>
                </nav>
            </div>

            {/* User Profile */}
            <div className="mt-auto p-4 border-t">
                {isLoading ? (
                    <div className="flex items-center gap-3 rounded-lg p-2">
                        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                        <div className="flex-1 space-y-2">
                            <div className="h-3 bg-muted rounded animate-pulse" />
                            <div className="h-2 bg-muted rounded animate-pulse w-2/3" />
                        </div>
                    </div>
                ) : user ? (
                    <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted transition-colors">
                        <Avatar className="h-8 w-8">
                            <AvatarImage
                                src={userProfile?.avatar_url || "/placeholder-avatar.jpg"}
                                alt={getDisplayName()}
                            />
                            <AvatarFallback>{getUserInitials()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1 min-w-0">
                            <p className="text-sm font-medium leading-none truncate">
                                {getDisplayName()}
                            </p>
                            <p className="text-xs leading-none text-muted-foreground truncate">
                                {getEmail()}
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={handleSignOut}
                            title="Sair"
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center justify-center p-2">
                        <p className="text-sm text-muted-foreground">Não autenticado</p>
                    </div>
                )}
            </div>
        </div>
    );
}