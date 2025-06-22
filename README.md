# Sistema de Gestão Estética 

## 📋 Escopo do Projeto

### Funcionalidades Principais

- **Dashboard Financeiro**: Métricas em tempo real, gráficos interativos, indicadores de performance
- **Controle de Atendimentos**: Registro, edição e histórico completo de procedimentos
- **Análise de Rentabilidade**: Breakdown por procedimento, margens de lucro, rankings
- **Fluxo de Caixa**: Controle semanal/mensal de entradas e saídas
- **Gestão de Clientes**: Cadastro completo, histórico de atendimentos, aniversários
- **Metas e Projeções**: Definição de objetivos, acompanhamento trimestral
- **🎯 Distribuição de Lucros**: Sistema automático de divisão de lucros por categorias
- **Sistema de Comissões**: Cálculo automático baseado em metas

### Melhorias vs Google Sheets

- Interface moderna e responsiva
- Gráficos interativos avançados
- Notificações push para metas
- Backup automático em nuvem
- Acesso offline parcial
- Calendário integrado para agendamentos
- Relatórios PDF exportáveis
- **Distribuição automática de lucros**

## 🏗️ Arquitetura Técnica

### Stack Tecnológica

- **Frontend**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL gratuito)
- **Authentication**: Supabase Auth
- **Charts**: Recharts ou Chart.js
- **PDF Generation**: jsPDF ou React-PDF
- **State Management**: Zustand ou React Query
- **Deployment**: Vercel (gratuito)

### Banco de Dados Gratuito - Supabase

**Por que Supabase:**
- 500MB de armazenamento gratuito
- 2GB de bandwidth mensal
- Autenticação integrada
- Real-time subscriptions
- API REST automática
- Dashboard administrativo

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

```sql
-- Usuários (via Supabase Auth)
users (
  id: uuid PRIMARY KEY,
  email: varchar,
  created_at: timestamp
)

-- Perfil do negócio
business_profile (
  id: uuid PRIMARY KEY,
  user_id: uuid REFERENCES users(id),
  business_name: varchar,
  cnpj: varchar,
  monthly_goal: decimal,
  attendance_goal: integer
)

-- Procedimentos
procedures (
  id: uuid PRIMARY KEY,
  user_id: uuid REFERENCES users(id),
  name: varchar,
  price: decimal,
  cost: decimal,
  is_active: boolean
)

-- Clientes
clients (
  id: uuid PRIMARY KEY,
  user_id: uuid REFERENCES users(id),
  name: varchar,
  whatsapp: varchar,
  email: varchar,
  birthday: date,
  last_visit: date,
  total_spent: decimal,
  status: enum('active', 'inactive', 'blocked')
)

-- Atendimentos
attendances (
  id: uuid PRIMARY KEY,
  user_id: uuid REFERENCES users(id),
  client_id: uuid REFERENCES clients(id),
  procedure_id: uuid REFERENCES procedures(id),
  date: timestamp,
  value: decimal,
  product_cost: decimal,
  payment_method: enum('pix', 'cash', 'debit', 'credit'),
  status: enum('completed', 'scheduled', 'cancelled'),
  observations: text
)

-- Custos fixos
fixed_costs (
  id: uuid PRIMARY KEY,
  user_id: uuid REFERENCES users(id),
  name: varchar,
  value: decimal,
  category: varchar,
  due_date: integer -- dia do mês
)

-- Metas trimestrais
quarterly_goals (
  id: uuid PRIMARY KEY,
  user_id: uuid REFERENCES users(id),
  year: integer,
  quarter: integer,
  revenue_goal: decimal,
  attendance_goal: integer,
  growth_percentage: decimal
)

-- 🎯 Configuração de Distribuição de Lucros
profit_distribution_config (
  id: uuid PRIMARY KEY,
  user_id: uuid REFERENCES users(id),
  category: varchar, -- 'pro_labore', 'equipment_reserve', 'emergency_reserve', 'investment'
  percentage: decimal,
  description: varchar,
  is_active: boolean,
  created_at: timestamp,
  updated_at: timestamp
)

-- Histórico de Distribuição de Lucros
profit_distributions (
  id: uuid PRIMARY KEY,
  user_id: uuid REFERENCES users(id),
  period_month: integer,
  period_year: integer,
  total_profit: decimal,
  pro_labore_amount: decimal,
  equipment_reserve_amount: decimal,
  emergency_reserve_amount: decimal,
  investment_amount: decimal,
  created_at: timestamp
)
```

## 📱 Estrutura do Projeto Next.js

### Organização de Pastas

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/
│   │   ├── page.tsx
│   │   └── components/
│   ├── atendimentos/
│   │   ├── page.tsx
│   │   ├── novo/
│   │   └── [id]/
│   ├── clientes/
│   ├── financeiro/
│   ├── distribuicao-lucros/      # 🎯 Nova seção
│   │   ├── page.tsx
│   │   ├── configuracao/
│   │   └── historico/
│   ├── relatorios/
│   └── configuracoes/
├── components/
│   ├── ui/ (shadcn/ui)
│   ├── charts/
│   ├── forms/
│   ├── profit-distribution/      # 🎯 Componentes específicos
│   └── layout/
├── lib/
│   ├── supabase/
│   ├── utils/
│   └── validations/
├── hooks/
├── types/
└── store/
```

### Componentes Principais

- **DashboardCards**: Métricas principais (receita, lucro, atendimentos)
- **RevenueChart**: Gráfico de receitas por período
- **ProcedureRanking**: Ranking de procedimentos mais rentáveis
- **CashFlowChart**: Fluxo de caixa semanal/mensal
- **AttendanceForm**: Formulário de registro de atendimentos
- **ClientTable**: Tabela de clientes com filtros
- **GoalProgress**: Barras de progresso das metas
- **🎯 ProfitDistributionChart**: Gráfico de pizza da distribuição de lucros
- **🎯 ProfitDistributionConfig**: Configuração de percentuais
- **🎯 ProfitDistributionHistory**: Histórico mensal de distribuições

## 🎯 Módulo de Distribuição de Lucros

### Funcionalidades

#### Configuração Padrão
```
Destino                    | Valor    | % do Lucro
---------------------------|----------|------------
Pró-labore (Salário)      | R$ 2.839,80 | 60%
Reserva Equipamentos      | R$ 946,60   | 20%
Reserva Emergência        | R$ 473,30   | 10%
Investimento/Crescimento  | R$ 473,30   | 10%
```

#### Características Técnicas

- **Cálculo Automático**: Com base no lucro líquido mensal
- **Configuração Flexível**: Usuário pode ajustar percentuais
- **Histórico Completo**: Registro de todas as distribuições
- **Visualização Gráfica**: Gráficos de pizza e barras
- **Relatórios**: Exportação de relatórios de distribuição
- **Alertas**: Notificações quando lucro está baixo para distribuição

#### Interface do Usuário

1. **Dashboard Principal**
   - Card com resumo da última distribuição
   - Indicador visual dos valores por categoria

2. **Página de Configuração**
   - Sliders para ajustar percentuais
   - Preview em tempo real dos valores
   - Botão para salvar configuração

3. **Página de Histórico**
   - Tabela com distribuições mensais
   - Gráficos de evolução por categoria
   - Filtros por período

4. **Relatórios**
   - PDF com distribuição mensal
   - Comparativo anual
   - Projeções baseadas em metas

## 🚀 Plano de Implementação

### Fase 1: Setup Inicial (Semana 1)

**Configuração do Projeto**
- Criar projeto Next.js com TypeScript
- Configurar Tailwind CSS e shadcn/ui
- Setup do Supabase (database + auth)

**Autenticação**
- Páginas de login/registro
- Middleware de proteção de rotas
- Integração com Supabase Auth

**Layout Base**
- Sidebar responsiva
- Header com perfil do usuário
- Navegação principal

### Fase 2: Dashboard e Dados (Semana 2)

**Estrutura do Banco**
- Criar tabelas no Supabase
- Configurar políticas RLS (Row Level Security)
- Seeds de dados iniciais

**Dashboard Principal**
- Cards de métricas principais
- Gráficos básicos de receita
- Integração com dados reais

**Gerenciamento de Procedimentos**
- CRUD de procedimentos
- Cálculo automático de margens

### Fase 3: Atendimentos e Clientes (Semana 3)

**Sistema de Atendimentos**
- Formulário de novo atendimento
- Lista com filtros e busca
- Edição e cancelamento

**Gestão de Clientes**
- Cadastro completo de clientes
- Histórico de atendimentos
- Alertas de aniversário

**Validações e UX**
- Formulários com validação
- Loading states
- Mensagens de erro/sucesso

### Fase 4: Distribuição de Lucros e Análises (Semana 4)

**🎯 Sistema de Distribuição de Lucros**
- Configuração de percentuais
- Cálculo automático mensal
- Interface de visualização
- Histórico de distribuições

**Análise Financeira**
- Fluxo de caixa detalhado
- Rentabilidade por procedimento
- Comparativos mensais

**Sistema de Metas**
- Definição de objetivos
- Acompanhamento visual
- Projeções trimestrais

### Fase 5: Refinamentos (Semana 5)

**Otimizações**
- Performance e SEO
- Responsividade mobile
- Acessibilidade

**Funcionalidades Extras**
- Backup automático
- Notificações push
- Modo offline parcial

**Deploy e Testes**
- Deploy na Vercel
- Testes de integração
- Documentação

## 💰 Custos (Gratuitos)

### Serviços Utilizados

- **Supabase**: Tier gratuito (500MB, 2GB bandwidth)
- **Vercel**: Tier gratuito (deploy ilimitado)
- **Next.js**: Open source
- **Tailwind CSS**: Open source
- **shadcn/ui**: Open source

### Limites do Tier Gratuito

- **Supabase**: ~1000 usuários ativos
- **Vercel**: 100GB bandwidth mensal
- Sem limitações de funcionalidades principais

## 🔧 Configuração Step-by-Step

### 1. Preparação do Ambiente
```bash
npx create-next-app@latest gestao-estetica --typescript --tailwind --app
cd gestao-estetica
npm install @supabase/supabase-js zustand recharts lucide-react
npx shadcn-ui@latest init
```

### 2. Setup do Supabase
- Criar conta no Supabase
- Novo projeto "gestao-estetica"
- Copiar URL e anon key
- Configurar variáveis de ambiente

### 3. Configuração do Banco
- Executar SQL para criar tabelas
- Configurar RLS policies
- Inserir dados de exemplo

### 4. Desenvolvimento Iterativo
- Implementar feature por feature
- Testar constantemente
- Deploy contínuo na Vercel

## 📊 Benefícios da Migração

### Para o Usuário

- **Interface Moderna**: UX muito superior ao Google Sheets
- **Mobilidade**: Aplicação responsiva, funciona em qualquer dispositivo
- **Automação**: Menos trabalho manual, mais insights automáticos
- **Segurança**: Dados protegidos com autenticação moderna
- **Escalabilidade**: Suporta crescimento do negócio
- **🎯 Gestão Financeira**: Distribuição automática e inteligente dos lucros

### Para o Negócio

- **Profissionalização**: Sistema próprio vs planilha genérica
- **Insights Avançados**: Análises que não são possíveis no Sheets
- **Integração**: Possibilidade de conectar com outros sistemas
- **Backup Automático**: Dados sempre seguros
- **Customização**: Funcionalidades específicas para estética
- **🎯 Planejamento Financeiro**: Visão clara da distribuição de recursos
