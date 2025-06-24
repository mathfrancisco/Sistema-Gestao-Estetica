import React from 'react';
import { Sparkles } from 'lucide-react';
import { BarChart3, Calendar, Package, Users } from 'lucide-react';
import {
    NavigationMenu,
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuTrigger,
    NavigationMenuContent,
    NavigationMenuLink
} from '@/components/ui/navigation-menu';
import Link from 'next/link';

const Header = () => {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center space-x-2">
                        <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            "EstéticaPro
                        </span>
                    </div>

                    {/* Navigation Menu */}
                    <NavigationMenu className="hidden md:flex">
                        <NavigationMenuList>
                            <NavigationMenuItem>
                                <NavigationMenuTrigger>Recursos</NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <div className="grid gap-3 p-6 w-[500px] grid-cols-2">
                                        <NavigationMenuLink href="#dashboard" className="space-y-1">
                                            <BarChart3 className="w-4 h-4" />
                                            <div className="font-medium">Dashboard</div>
                                            <div className="text-xs text-muted-foreground">
                                                Métricas e análises em tempo real
                                            </div>
                                        </NavigationMenuLink>
                                        <NavigationMenuLink href="#agendamento" className="space-y-1">
                                            <Calendar className="w-4 h-4" />
                                            <div className="font-medium">Agendamento</div>
                                            <div className="text-xs text-muted-foreground">
                                                Integração com Google Calendar
                                            </div>
                                        </NavigationMenuLink>
                                        <NavigationMenuLink href="#estoque" className="space-y-1">
                                            <Package className="w-4 h-4" />
                                            <div className="font-medium">Estoque</div>
                                            <div className="text-xs text-muted-foreground">
                                                Controle completo de produtos
                                            </div>
                                        </NavigationMenuLink>
                                        <NavigationMenuLink href="#crm" className="space-y-1">
                                            <Users className="w-4 h-4" />
                                            <div className="font-medium">CRM</div>
                                            <div className="text-xs text-muted-foreground">
                                                Gestão de relacionamento
                                            </div>
                                        </NavigationMenuLink>
                                    </div>
                                </NavigationMenuContent>
                            </NavigationMenuItem>

                            <NavigationMenuItem>
                                <NavigationMenuLink href="#precos" className="px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded-md transition-colors">
                                    Preços
                                </NavigationMenuLink>
                            </NavigationMenuItem>

                            <NavigationMenuItem>
                                <NavigationMenuLink href="#sobre" className="px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded-md transition-colors">
                                    Sobre
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                        </NavigationMenuList>
                    </NavigationMenu>

                    {/* CTA Button */}
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/login"
                            className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                        >
                            Entrar
                        </Link>
                        <Link
                            href="/register"
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-md hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
                        >
                            Começar Grátis
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;