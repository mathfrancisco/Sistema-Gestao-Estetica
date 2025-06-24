import React from 'react';
import { Sparkles, Instagram, Facebook, Phone, Mail, MapPin } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="lg:col-span-1">
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold">EstéticaPro</span>
                        </div>
                        <p className="text-gray-400 mb-6 max-w-sm">
                            Sistema completo de gestão para clínicas de estética.
                            Inteligência artificial aplicada ao seu negócio.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-purple-600 transition-colors">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-purple-600 transition-colors">
                                <Facebook className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Recursos */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Recursos</h3>
                        <ul className="space-y-3 text-gray-400">
                            <li><a href="#" className="hover:text-white transition-colors">Dashboard Financeiro</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Google Calendar</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Controle de Estoque</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">CRM Inteligente</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Relatórios Avançados</a></li>
                        </ul>
                    </div>

                    {/* Gestão */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Gestão</h3>
                        <ul className="space-y-3 text-gray-400">
                            <li><a href="#" className="hover:text-white transition-colors">Distribuição de Lucros</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Precificação Dinâmica</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Fluxo de Caixa</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Análise de Custos</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Benchmarks</a></li>
                        </ul>
                    </div>

                    {/* Contato */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Contato</h3>
                        <div className="space-y-3 text-gray-400">
                            <div className="flex items-center">
                                <Phone className="w-4 h-4 mr-3 text-purple-400" />
                                <span>(11) 9 9999-9999</span>
                            </div>
                            <div className="flex items-center">
                                <Mail className="w-4 h-4 mr-3 text-purple-400" />
                                <span>contato@esteticapro.com</span>
                            </div>
                            <div className="flex items-start">
                                <MapPin className="w-4 h-4 mr-3 text-purple-400 mt-0.5" />
                                <span>São Paulo, SP<br />Brasil</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom */}
                <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-gray-400 text-sm">
                        © 2025 EstéticaPro. Todos os direitos reservados.
                    </p>
                    <div className="flex space-x-6 mt-4 md:mt-0">
                        <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                            Política de Privacidade
                        </a>
                        <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                            Termos de Uso
                        </a>
                        <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                            Suporte
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;