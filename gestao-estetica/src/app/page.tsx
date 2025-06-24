import React from 'react';
import {
  BarChart3,
  Calendar,
  Package,
  Users,
  TrendingUp,
  DollarSign,
  Star,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

// Hero Section
const HeroSection = () => {
  return (
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 pt-16 pb-24">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='7'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full text-sm font-medium text-purple-800 mb-8">
              <Star className="w-4 h-4 mr-2" />
              Sistema completo para clínicas de estética
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Transforme sua
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"> clínica </span>
              com inteligência
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Dashboard financeiro inteligente, agendamento integrado ao Google Calendar,
              controle de estoque e CRM completo. Tudo em uma plataforma.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg">
                Começar Grátis por 30 dias
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
              <button className="inline-flex items-center px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all">
                Ver Demonstração
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">2.5k+</div>
                <div className="text-sm text-gray-600">Clínicas ativas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">98%</div>
                <div className="text-sm text-gray-600">Satisfação</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">45%</div>
                <div className="text-sm text-gray-600">↑ Receita média</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">24/7</div>
                <div className="text-sm text-gray-600">Suporte</div>
              </div>
            </div>
          </div>
        </div>
      </section>
  );
};

// Features Section
const FeaturesSection = () => {
  const features = [
    {
      icon: BarChart3,
      title: "Dashboard Financeiro Inteligente",
      description: "Métricas em tempo real, distribuição automática de lucros e projeções baseadas em histórico.",
      highlights: ["ROI por procedimento", "Gráficos interativos", "Fluxo de caixa projetado"]
    },
    {
      icon: Calendar,
      title: "Google Calendar Integrado",
      description: "Sincronização bidirecional com Google Calendar. Seus clientes recebem convites automaticamente.",
      highlights: ["Sincronização automática", "Confirmação via Google", "Reagendamento fácil"]
    },
    {
      icon: Package,
      title: "Controle de Estoque Simplificado",
      description: "Gestão completa de produtos com alertas automáticos e controle de custos por procedimento.",
      highlights: ["Alertas de estoque", "Controle de validade", "Custo por atendimento"]
    },
    {
      icon: Users,
      title: "CRM Inteligente",
      description: "Segmentação automática de clientes com campanhas personalizadas e score de propensão.",
      highlights: ["Clientes VIP", "Campanhas automáticas", "Lifetime value"]
    },
    {
      icon: DollarSign,
      title: "Gestão Financeira Completa",
      description: "Distribuição automática de 60% para pró-labore, 20% equipamentos, 10% emergência e 10% marketing.",
      highlights: ["Distribuição automática", "Precificação dinâmica", "Planejamento tributário"]
    },
    {
      icon: TrendingUp,
      title: "Análises Avançadas",
      description: "Relatórios executivos com KPIs, comparativos e benchmarks do setor de estética.",
      highlights: ["KPIs do negócio", "Análise de tendências", "Relatórios automáticos"]
    }
  ];

  return (
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Tudo que sua clínica precisa em um só lugar
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Funcionalidades desenvolvidas especificamente para clínicas de estética,
              baseadas em anos de experiência no setor.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
                <div key={index} className="group p-6 border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg mb-4 group-hover:from-purple-200 group-hover:to-pink-200 transition-all">
                    <feature.icon className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.highlights.map((highlight, idx) => (
                        <li key={idx} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          {highlight}
                        </li>
                    ))}
                  </ul>
                </div>
            ))}
          </div>
        </div>
      </section>
  );
};

// CTA Section
const CTASection = () => {
  return (
      <section className="py-24 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Pronto para transformar sua clínica?
            </h2>
            <p className="text-xl text-purple-100 mb-8">
              Junte-se a mais de 2.500 clínicas que já revolucionaram sua gestão com o EstéticaPro.
              Teste grátis por 30 dias, sem compromisso.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="inline-flex items-center px-8 py-4 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-50 transition-all transform hover:scale-105 shadow-lg">
                Começar Teste Grátis
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
              <button className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-purple-600 transition-all">
                Agendar Demonstração
              </button>
            </div>
          </div>
        </div>
      </section>
  );
};

// Main App Component
export default function Home() {
  return (
      <div className="min-h-screen bg-white">
        <Header />
        <main>
          <HeroSection />
          <FeaturesSection />
          <CTASection />
        </main>
        <Footer />
      </div>
  );
}