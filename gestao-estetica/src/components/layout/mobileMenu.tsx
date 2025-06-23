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
    X
} from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface MobileMenuProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
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
    },
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

export function MobileMenu({ open, onOpenChange }: MobileMenuProps) {
    const pathname = usePathname();

    const handleNavigation = () => {
        onOpenChange(false);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="left" className="w-80 p-0">
                <div className="flex h-full flex-col">
                    {/* Header */}
                    <SheetHeader className="border-b p-4">
                        <div className="flex items-center justify-between">
                            <SheetTitle className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded bg-gradient-to-r from-pink-500 to-purple-600" />
                                <span className="font-bold">Estética Pro</span>
                            </SheetTitle>
                        </div>
                    </SheetHeader>

                    {/* Navigation */}
                    <div className="flex-1 overflow-auto">
                        <nav className="grid items-start p-4 text-sm font-medium">
                            <div className="space-y-2">
                                {menuItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.href;

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={handleNavigation}
                                            className={cn(
                                                "flex items-center gap-3 rounded-lg px-3 py-3 text-muted-foreground transition-all hover:text-primary hover:bg-muted",
                                                isActive && "bg-muted text-primary font-medium"
                                            )}
                                        >
                                            <Icon className="h-5 w-5" />
                                            <span className="flex-1">{item.title}</span>
                                            {item.badge && (
                                                <Badge
                                                    variant={item.title === 'Notificações' ? 'destructive' : 'secondary'}
                                                    className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                                                >
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
                    <div className="border-t p-4">
                        <div className="flex items-center gap-3 rounded-lg p-3 hover:bg-muted transition-colors">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
                                <AvatarFallback>MA</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                                <p className="text-sm font-medium leading-none">Maria Silva</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    maria@estetica.com
                                </p>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="mt-4 space-y-2">
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={handleNavigation}
                            >
                                Ver Perfil
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50"
                                onClick={handleNavigation}
                            >
                                Sair
                            </Button>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

// Alternative Bottom Navigation for Mobile
interface BottomNavigationProps {
    className?: string;
}

const bottomNavItems = [
    { title: 'Home', href: '/', icon: Home },
    { title: 'Agenda', href: '/agendamentos', icon: Calendar },
    { title: 'Clientes', href: '/clientes', icon: Users },
    { title: 'Produtos', href: '/produtos', icon: Package },
    { title: 'Mais', href: '/configuracoes', icon: Settings }
];

export function BottomNavigation({ className }: BottomNavigationProps) {
    const pathname = usePathname();

    return (
        <div className={cn(
            "fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden",
            className
        )}>
            <nav className="flex items-center justify-around h-16 px-2">
                {bottomNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || (
                        item.href !== '/' && pathname.startsWith(item.href)
                    );

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center flex-1 min-w-0 px-1 py-2 text-xs font-medium transition-colors",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-primary"
                            )}
                        >
                            <Icon className={cn(
                                "h-5 w-5 mb-1",
                                isActive && "text-primary"
                            )} />
                            <span className="truncate">{item.title}</span>
                            {/* Active indicator */}
                            {isActive && (
                                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
                            )}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}