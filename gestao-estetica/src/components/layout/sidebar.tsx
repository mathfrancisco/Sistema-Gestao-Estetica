import React from 'react';
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
    FileText,
    Bell,
    LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface SidebarProps {
    className?: string;
    onNavigate?: () => void;
}

const menuItems = [
    {
        title: 'Dashboard',
        href: '/',
        icon: Home,
        badge: null
    },
    {
        title: 'Agendamentos',
        href: '/agendamentos',
        icon: Calendar,
        badge: '3'
    },
    {
        title: 'Clientes',
        href: '/clientes',
        icon: Users,
        badge: null
    },
    {
        title: 'Produtos',
        href: '/produtos',
        icon: Package,
        badge: null
    },
    {
        title: 'Financeiro',
        href: '/financeiro',
        icon: DollarSign,
        badge: null
    },
    {
        title: 'Relatórios',
        href: '/relatorios',
        icon: BarChart3,
        badge: null
    },
    {
        title: 'Documentos',
        href: '/documentos',
        icon: FileText,
        badge: null
    }
];

const bottomMenuItems = [
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
        badge: null
    }
];

export function Sidebar({ className, onNavigate }: SidebarProps) {
    const pathname = usePathname();

    const handleNavigation = () => {
        onNavigate?.();
    };

    return (
        <div className={cn("flex h-full max-h-screen flex-col gap-2 bg-background border-r", className)}>
            {/* Header */}
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    <div className="h-6 w-6 rounded bg-gradient-to-r from-pink-500 to-purple-600" />
                    <span className="text-sm font-bold">Estética Pro</span>
                </Link>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-auto">
                <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                    {/* Main Menu */}
                    <div className="space-y-1 py-2">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={handleNavigation}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted",
                                        isActive && "bg-muted text-primary font-medium"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span className="flex-1">{item.title}</span>
                                    {item.badge && (
                                        <Badge variant="secondary" className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                                            {item.badge}
                                        </Badge>
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Divider */}
                    <div className="border-t my-2" />

                    {/* Bottom Menu */}
                    <div className="space-y-1 py-2">
                        {bottomMenuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={handleNavigation}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted",
                                        isActive && "bg-muted text-primary font-medium"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span className="flex-1">{item.title}</span>
                                    {item.badge && (
                                        <Badge variant="destructive" className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                                            {item.badge}
                                        </Badge>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            </div>

            {/* User Profile */}
            <div className="mt-auto p-4 border-t">
                <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted transition-colors">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
                        <AvatarFallback>MA</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">Maria Silva</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            maria@estetica.com
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}