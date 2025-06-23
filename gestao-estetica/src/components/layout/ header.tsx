import React from 'react';
import { Menu, Bell, Search, Sun, Moon, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';

interface HeaderProps {
    onMenuClick?: () => void;
    title?: string;
    showSearch?: boolean;
}

export function Header({ onMenuClick, title = "Dashboard", showSearch = true }: HeaderProps) {
    const { theme, setTheme } = useTheme();

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center justify-between">
                {/* Left side - Menu and Title */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={onMenuClick}
                    >
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle menu</span>
                    </Button>

                    <div className="hidden md:block">
                        <h1 className="text-lg font-semibold">{title}</h1>
                    </div>
                </div>

                {/* Center - Search (if enabled) */}
                {showSearch && (
                    <div className="flex-1 max-w-md mx-4">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Buscar clientes, agendamentos..."
                                className="pl-8 md:w-[300px] lg:w-[400px]"
                            />
                        </div>
                    </div>
                )}

                {/* Right side - Actions and User Menu */}
                <div className="flex items-center gap-2">
                    {/* Theme Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    >
                        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>

                    {/* Notifications */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative">
                                <Bell className="h-4 w-4" />
                                <Badge
                                    variant="destructive"
                                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
                                >
                                    3
                                </Badge>
                                <span className="sr-only">Notifications</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80">
                            <DropdownMenuLabel>Notificações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium">Agendamento hoje às 14h</p>
                                    <p className="text-xs text-muted-foreground">
                                        Maria Santos - Limpeza de Pele
                                    </p>
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium">Estoque baixo</p>
                                    <p className="text-xs text-muted-foreground">
                                        Sérum Vitamina C - 2 unidades restantes
                                    </p>
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium">Pagamento recebido</p>
                                    <p className="text-xs text-muted-foreground">
                                        Ana Silva - R$ 150,00
                                    </p>
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-center">
                                <span className="text-sm text-muted-foreground">Ver todas</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
                                    <AvatarFallback>MA</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">Maria Silva</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        maria@estetica.com
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <User className="mr-2 h-4 w-4" />
                                <span>Perfil</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <span>Configurações</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <span>Ajuda</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                                <span>Sair</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}