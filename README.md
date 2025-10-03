# 📋 Sistema de Gestão de Clínica de Estética - Documentação Completa

## 📑 Índice
1. [Visão Geral](#visao-geral)
2. [Landing Page e Agendamento Público](#landing-page)
3. [Arquitetura](#arquitetura)
4. [Diagramas](#diagramas)
5. [Estrutura COMPLETA Backend](#estrutura-backend)
6. [Estrutura COMPLETA Frontend](#estrutura-frontend)
7. [Modelos de Dados](#modelos-dados)
8. [Endpoints API](#endpoints-api)
9. [Docker e Configurações](#docker)
10. [Scripts SQL](#scripts-sql)
11. [Regras de Negócio](#regras-negocio)

---

## 🎯 1. Visão Geral {#visao-geral}

### 1.1 Descrição
Sistema **híbrido** de gestão para clínica de estética com 2 esteticistas (Ana Paula e Carla Santos), combinando:
- **Landing page pública** com agendamento online
- **Dashboard administrativo** para esteticistas
- **Área do cliente** (opcional) para acompanhamento

**Diferenciais:**
- Agendamento sem cadastro obrigatório (conversão facilitada)
- **10% de desconto** para clientes que criam conta
- Sistema inteligente de disponibilidade de horários
- Notificações automáticas via WhatsApp e Email

### 1.2 Stack Tecnológico

**Backend:**
```
├── Java 17
├── Spring Boot 3.5.6
│   ├── Spring Data JPA
│   ├── Spring Security + JWT
│   ├── Spring Validation
│   ├── Spring Cache
│   └── Spring Mail
├── PostgreSQL 15
├── Flyway (Migrations)
├── Lombok
├── ModelMapper
└── Maven
```

**Frontend:**
```
├── React 18.2
├── TypeScript 5.0
├── Vite
├── React Router DOM 6
├── TanStack Query (React Query)
├── Axios
├── Tailwind CSS 3.4
├── Shadcn/ui
├── React Hook Form + Zod
├── Date-fns
├── Recharts
└── React-Toastify
```

**Infraestrutura:**
```
├── Docker & Docker Compose
├── Nginx (Reverse Proxy)
└── GitHub Actions (CI/CD)
```

### 1.3 Módulos do Sistema

#### 🌐 Landing Page Pública
- Hero section com CTA para agendamento
- Catálogo de procedimentos (sem preços públicos)
- Apresentação dos pacotes promocionais
- Depoimentos de clientes
- Formulário de agendamento híbrido
- Sistema de cadastro rápido com incentivo

#### 👥 Gestão de Clientes
- Cadastro completo (CPF, contatos, histórico)
- Programa de desconto para novos cadastros (10% OFF)
- Histórico de procedimentos realizados
- Observações e restrições/alergias
- Controle de aniversariantes (descontos especiais)
- Busca avançada e filtros

#### 📅 Sistema de Agendamentos
- Agendamento público (com ou sem cadastro)
- Calendário visual por esteticista
- Verificação automática de disponibilidade
- Confirmação via WhatsApp e Email
- Lembretes 24h e 2h antes
- Reagendamento e cancelamento
- Lista de espera inteligente
- Controle de no-show

#### 💆 Procedimentos
- Catálogo organizado por categorias
- Descrições detalhadas (preparos, cuidados, contraindicações)
- Duração e preço por procedimento
- Produtos utilizados automaticamente
- Galeria de fotos antes/depois
- Gestão de procedimentos ativos/inativos

#### 📦 Controle de Estoque (Simplificado)
- Baixa automática ao realizar procedimento
- Alertas de estoque mínimo (WhatsApp)
- Controle de entrada/saída/ajuste
- Produtos vinculados a procedimentos
- Histórico de movimentações
- Links diretos para recompra

#### 💰 Gestão Financeira
- Contas a receber (vinculadas a agendamentos)
- Contas a pagar (despesas operacionais)
- Fluxo de caixa diário/mensal
- Formas de pagamento
- Relatórios de faturamento
- Análise de rentabilidade por procedimento

#### 📊 Dashboard e Relatórios
- Visão geral do dia (faturamento, agendamentos)
- Métricas de performance por esteticista
- Top procedimentos e clientes
- Alertas importantes (estoque, contas)
- Previsão de faturamento mensal
- Exportação em PDF e Excel

---

## 🌐 2. Landing Page e Agendamento Público {#landing-page}

### 2.1 Estrutura da Landing Page

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  HEADER                                              ┃
┃  [Logo]                                    [ENTRAR]  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  HERO SECTION                                        ┃
┃                                                      ┃
┃         "Sua Beleza, Nossa Paixão"                   ┃
┃                                                      ┃
┃    Cuidados estéticos com carinho e                  ┃
┃         profissionalismo                             ┃
┃                                                      ┃
┃        [🎁 AGENDAR E GANHAR 10% OFF]                ┃
┃                                                      ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  SOBRE NÓS                                           ┃
┃  • História da clínica                               ┃
┃  • Missão e valores                                  ┃
┃  • Fotos do espaço                                   ┃
┃  • Apresentação das esteticistas                     ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  PROCEDIMENTOS (Grid de Cards)                       ┃
┃  ┌──────────┐  ┌──────────┐  ┌──────────┐          ┃
┃  │ 🧖 FACIAL │  │ 💆 CORPO │  │ ✨ LASER │          ┃
┃  │          │  │          │  │          │          ┃
┃  │ Limpeza  │  │ Drenagem │  │ Depilação│          ┃
┃  │ Peeling  │  │ Massagem │  │ Definitiva│         ┃
┃  │          │  │          │  │          │          ┃
┃  │ [DETALHES]│ │ [DETALHES]│ │[DETALHES]│         ┃
┃  └──────────┘  └──────────┘  └──────────┘          ┃
┃                                                      ┃
┃  OBS: Preços não exibidos publicamente              ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  PACOTES PROMOCIONAIS                                ┃
┃  ┌────────────────────────────────────┐             ┃
┃  │  💎 PACOTE BRONZE - 4 Sessões     │             ┃
┃  │  ✓ Limpeza de Pele                │             ┃
┃  │  ✓ Validade: 3 meses              │             ┃
┃  │  ✓ Economia garantida             │             ┃
┃  │  [QUERO SABER MAIS]               │             ┃
┃  └────────────────────────────────────┘             ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  DEPOIMENTOS                                         ┃
┃  Avaliações e fotos de clientes satisfeitas         ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  LOCALIZAÇÃO + CONTATO                               ┃
┃  • Google Maps                                       ┃
┃  • WhatsApp, Instagram                               ┃
┃  • Horário de funcionamento                          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  FAQ (Perguntas Frequentes)                          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### 2.2 Fluxo de Agendamento Híbrido

#### **Opção A: Cliente Novo - Com Cadastro (10% OFF)**

```
VISITANTE clica em "AGENDAR"
    ↓
┌─────────────────────────────────────┐
│  Para agendar, escolha:             │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ✨ CRIAR CONTA               │   │
│  │ 🎁 GANHE 10% OFF             │   │
│  │                              │   │
│  │ • Agendar mais rápido        │   │
│  │ • Ver histórico              │   │
│  │ • Ganhar pontos              │   │
│  │                              │   │
│  │ [CADASTRAR E GANHAR DESCONTO]│   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ CONTINUAR SEM CADASTRO      │   │
│  │ (Preço normal)              │   │
│  │                              │   │
│  │ [AGENDAR SEM DESCONTO]      │   │
│  └─────────────────────────────┘   │
│                                     │
│  Já tem conta? [ENTRAR]             │
└─────────────────────────────────────┘
    ↓
ESCOLHE: Criar Conta
    ↓
FORMULÁRIO DE CADASTRO RÁPIDO:
    ├── Nome completo*
    ├── Celular (WhatsApp)*
    ├── Email*
    ├── Senha*
    └── ☑ Li e aceito os termos (LGPD)
    ↓
CONTA CRIADA + LOGADO AUTOMATICAMENTE
    ↓
CUPOM DE 10% OFF ATIVADO
    ↓
PASSO 1: Escolha do Procedimento
┌─────────────────────────────────────┐
│  Bem-vinda, Maria! 👋               │
│  Cupom de 10% OFF ativado ✅        │
├─────────────────────────────────────┤
│  [ ] Limpeza de Pele                │
│      De: R$ 150,00                  │
│      Por: R$ 135,00 (10% OFF)       │
│                                     │
│  [ ] Drenagem Linfática             │
│      De: R$ 120,00                  │
│      Por: R$ 108,00 (10% OFF)       │
└─────────────────────────────────────┘
    ↓
PASSO 2: Escolha Esteticista
    ( ) Ana Paula
    ( ) Carla Santos
    (•) Sem preferência
    ↓
PASSO 3: Data e Horário
┌─────────────────────────────────────┐
│  Outubro 2025                       │
│  [Calendário interativo]            │
│                                     │
│  Horários disponíveis em 15/10:     │
│  [ ] 09:00 - Ana Paula              │
│  [ ] 14:00 - Carla Santos           │
│  [ ] 16:30 - Ana Paula              │
└─────────────────────────────────────┘
    ↓
PASSO 4: Confirmação
┌─────────────────────────────────────┐
│  Resumo do Agendamento              │
├─────────────────────────────────────┤
│  Cliente: Maria Silva               │
│  Procedimento: Limpeza de Pele      │
│  Data: 15/10/2025 às 14h            │
│  Esteticista: Carla Santos          │
│                                     │
│  Valor: R$ 150,00                   │
│  Desconto 1ª compra: -R$ 15,00      │
│  ────────────────────────            │
│  TOTAL: R$ 135,00                   │
│                                     │
│  [CONFIRMAR AGENDAMENTO]            │
└─────────────────────────────────────┘
    ↓
✅ AGENDAMENTO CONFIRMADO
    ↓
Notificações enviadas:
    ├── WhatsApp: Confirmação + Preparos
    ├── Email: Confirmação + Instruções
    └── Sistema: Reserva de produtos
```

#### **Opção B: Cliente Novo - Sem Cadastro (Sem Desconto)**

```
VISITANTE clica em "AGENDAR"
    ↓
ESCOLHE: Continuar Sem Cadastro
    ↓
FORMULÁRIO SIMPLES:
    ├── Nome completo*
    ├── Celular*
    └── Email*
    ↓
PASSO 1: Escolha do Procedimento
┌─────────────────────────────────────┐
│  Escolha seu procedimento:          │
├─────────────────────────────────────┤
│  [ ] Limpeza de Pele                │
│      Consulte valor no local        │
│                                     │
│  💡 Quer 10% OFF? [CRIAR CONTA]    │
└─────────────────────────────────────┘
    ↓
PASSOS 2, 3 e 4 (iguais ao fluxo com cadastro)
    ↓
CONFIRMAÇÃO (Sem mostrar preço)
┌─────────────────────────────────────┐
│  Agendamento solicitado!            │
│  Código: #00234                     │
│                                     │
│  Valor será confirmado por WhatsApp │
│                                     │
│  💡 Crie conta para ganhar 10% OFF │
│  no próximo agendamento             │
│  [CRIAR CONTA AGORA]                │
└─────────────────────────────────────┘
```

#### **Opção C: Cliente Existente**

```
VISITANTE clica em "AGENDAR"
    ↓
Clica em "JÁ TEM CONTA? ENTRAR"
    ↓
LOGIN:
    ├── Email ou Celular
    ├── Senha
    └── ☑ Manter conectado
    ↓
ÁREA DO CLIENTE
┌─────────────────────────────────────┐
│  Olá, Maria! 👋                     │
├─────────────────────────────────────┤
│  🗓️ PRÓXIMO AGENDAMENTO             │
│  Limpeza de Pele                    │
│  15/10/2025 às 14h                  │
│  Com Ana Paula                      │
│                                     │
│  [CANCELAR] [REAGENDAR]             │
│                                     │
│  MENU:                              │
│  • Fazer novo agendamento           │
│  • Ver histórico                    │
│  • Meus dados                       │
└─────────────────────────────────────┘
    ↓
[Continua com fluxo normal de agendamento]
```

### 2.3 Sistema de Autenticação - Dois Níveis

#### **Nível 1: ESTETICISTA (Acesso Administrativo)**
```
LOGIN HEADER → Redireciona para /dashboard

Permissões:
✅ Dashboard completo
✅ Gerenciar todos os agendamentos
✅ Confirmar/cancelar agendamentos
✅ CRUD completo de clientes
✅ Gerenciar procedimentos e preços
✅ Controlar estoque
✅ Acessar relatórios financeiros
✅ Configurações do sistema
```

#### **Nível 2: CLIENTE (Acesso Limitado)**
```
LOGIN HEADER → Redireciona para /area-cliente

Permissões:
✅ Fazer novos agendamentos (com desconto se primeiro)
✅ Ver histórico de agendamentos
✅ Cancelar agendamento (até 24h antes)
✅ Atualizar dados cadastrais
❌ Acessar dados de outros clientes
❌ Ver preços de custo ou estoque
❌ Acessar dashboard administrativo
❌ Ver relatórios financeiros
```

### 2.4 Programa de Desconto 10% OFF

#### **Regras do Desconto:**
- ✅ Aplicado automaticamente no **primeiro agendamento**
- ✅ Válido por **30 dias** após o cadastro
- ✅ Desconto sobre o **valor do procedimento**
- ❌ **Não cumulativo** com outras promoções
- ❌ Não aplicável em **pacotes** (que já têm desconto próprio)

#### **Comunicação do Desconto:**

**Email de Boas-Vindas:**
```
Assunto: 🎉 Bem-vinda! Seu cupom de 10% OFF

Olá Maria!

Que alegria ter você conosco! ✨

Para começar bem, preparamos um presente:

🎁 10% DE DESCONTO
no seu primeiro agendamento

⏰ Válido até: 02/11/2025

[AGENDAR AGORA]

Beijos,
Equipe Clínica Estética
```

**WhatsApp Pós-Cadastro:**
```
Olá Maria! 👋

Sua conta foi criada com sucesso!

🎁 PRESENTE DE BOAS-VINDAS:
10% OFF no primeiro agendamento

Válido até 02/11/2025

Aproveite para conhecer nossos procedimentos:
[LINK DO SITE]

Qualquer dúvida, estamos aqui!
```

#### **Exemplo de Cálculo:**
```
Procedimento: Limpeza de Pele
Valor normal: R$ 150,00
Desconto 10%: -R$ 15,00
─────────────────────────
VOCÊ PAGA: R$ 135,00

Economia: R$ 15,00 ✅
```

---

## 🏗️ 3. Arquitetura {#arquitetura}

### 3.1 Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│              PRESENTATION LAYER - Public                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │     Landing Page (React) - Port 3000                  │  │
│  │  ┌──────────┐ ┌────────────┐ ┌─────────────────┐    │  │
│  │  │Hero+CTA  │ │Procedimentos│ │Agendamento      │    │  │
│  │  │          │ │(sem preços) │ │Híbrido          │    │  │
│  │  └──────────┘ └────────────┘ └─────────────────┘    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│           PRESENTATION LAYER - Authenticated                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │       Dashboard Esteticista + Área Cliente            │  │
│  │  ┌────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐  │  │
│  │  │Dashboard│ │Clientes  │ │Agenda   │ │Financeiro│  │  │
│  │  │Admin    │ │          │ │         │ │          │  │  │
│  │  └────────┘ └──────────┘ └─────────┘ └──────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/REST + JWT
┌─────────────────────────────────────────────────────────────┐
│                   API GATEWAY - Nginx (Port 80)              │
│      SSL, Rate Limiting, CORS, Compression, Routing          │
│        /api/* → Backend | /* → Frontend                      │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│           APPLICATION LAYER - Spring Boot (Port 8080)        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   CONTROLLERS                         │  │
│  │  Auth │ Cliente │ Agendamento │ Procedimento         │  │
│  │  Estoque │ Financeiro │ Dashboard │ Desconto         │  │
│  └───────────────────────────────────────────────────────┘  │
│                            ↕                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    SERVICES                           │  │
│  │  Business Logic │ Validations │ Transactions          │  │
│  │  DescontoService │ AgendamentoService │ WhatsApp      │  │
│  └───────────────────────────────────────────────────────┘  │
│                            ↕                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  REPOSITORIES                         │  │
│  │  Spring Data JPA │ Custom Queries │ Specifications    │  │
│  └───────────────────────────────────────────────────────┘  │
│                            ↕                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    ENTITIES                           │  │
│  │  Cliente │ Agendamento │ Procedimento │ Usuario       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│              PERSISTENCE - PostgreSQL (Port 5432)            │
│                   Database: clinica_db                       │
│         Tables: cliente, agendamento, procedimento...        │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│              EXTERNAL SERVICES                               │
│  WhatsApp API │ Email SMTP │ Storage (fotos)                │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 4. Diagramas {#diagramas}

### 4.1 Diagrama ER Completo

```
┌─────────────────────────────────────────────────────────────┐
│                        USUARIO                              │
├─────────────────────────────────────────────────────────────┤
│ PK │ id                    BIGSERIAL                        │
│    │ nome                  VARCHAR(200)    NOT NULL         │
│    │ username              VARCHAR(50)     UNIQUE NOT NULL  │
│    │ password_hash         VARCHAR(255)    NOT NULL         │
│    │ email                 VARCHAR(150)    UNIQUE NOT NULL  │
│    │ role                  VARCHAR(20)     NOT NULL         │
│    │                       (ADMIN, ESTETICISTA, CLIENTE)    │
│    │ ativo                 BOOLEAN         DEFAULT TRUE     │
│    │ created_at            TIMESTAMP       DEFAULT NOW()    │
└─────────────────────────────────────────────────────────────┘
        │ 1
        │
        │ 1
        ↓
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE                              │
├─────────────────────────────────────────────────────────────┤
│ PK │ id                    BIGSERIAL                        │
│ FK │ usuario_id            BIGINT          NULLABLE         │
│    │ nome                  VARCHAR(200)    NOT NULL         │
│    │ cpf                   VARCHAR(14)     UNIQUE           │
│    │ email                 VARCHAR(150)    NOT NULL         │
│    │ celular               VARCHAR(20)     NOT NULL         │
│    │ telefone              VARCHAR(20)                      │
│    │ data_nascimento       DATE                             │
│    │ sexo                  VARCHAR(1)                       │
│    │ endereco              VARCHAR(255)                     │
│    │ cidade                VARCHAR(100)                     │
│    │ estado                VARCHAR(2)                       │
│    │ cep                   VARCHAR(9)                       │
│    │ observacoes           TEXT                             │
│    │ restricoes_alergias   TEXT                             │
│    │ foto_perfil_url       VARCHAR(500)                     │
│    │ status                VARCHAR(20)     DEFAULT 'ATIVO'  │
│    │ data_cadastro         DATE            DEFAULT NOW()    │
│    │ ultima_visita         DATE                             │
│    │ total_gasto           DECIMAL(10,2)   DEFAULT 0        │
│    │ primeiro_agendamento  BOOLEAN         DEFAULT TRUE     │
│    │ desconto_utilizado    BOOLEAN         DEFAULT FALSE    │
│    │ created_at            TIMESTAMP       DEFAULT NOW()    │
│    │ updated_at            TIMESTAMP       DEFAULT NOW()    │
└─────────────────────────────────────────────────────────────┘
        │ 1
        │
        │ N
        ↓
┌─────────────────────────────────────────────────────────────┐
│                       AGENDAMENTO                           │
├─────────────────────────────────────────────────────────────┤
│ PK │ id                    BIGSERIAL                        │
│ FK │ cliente_id            BIGINT         NOT NULL          │
│ FK │ procedimento_id       BIGINT         NOT NULL          │
│    │ esteticista           VARCHAR(100)   NOT NULL          │
│    │                       (Ana Paula, Carla Santos)        │
│    │ data_hora             TIMESTAMP      NOT NULL          │
│    │ data_hora_fim         TIMESTAMP      NOT NULL          │
│    │ duracao_minutos       INTEGER        NOT NULL          │
│    │ status                VARCHAR(20)    DEFAULT 'AGENDADO'│
│    │                       (AGENDADO, CONFIRMADO,           │
│    │                        REALIZADO, CANCELADO)           │
│    │ valor_procedimento    DECIMAL(10,2)  NOT NULL          │
│    │ valor_desconto        DECIMAL(10,2)  DEFAULT 0         │
│    │ tipo_desconto         VARCHAR(50)                      │
│    │                       (PRIMEIRO_AGENDAMENTO, PACOTE)   │
│    │ valor_total           DECIMAL(10,2)  NOT NULL          │
│    │ forma_pagamento       VARCHAR(50)                      │
│    │ pago                  BOOLEAN        DEFAULT FALSE     │
│    │ observacoes           TEXT                             │
│    │ motivo_cancelamento   TEXT                             │
│    │ confirmado            BOOLEAN        DEFAULT FALSE     │
│    │ lembrete_enviado      BOOLEAN        DEFAULT FALSE     │
│    │ created_at            TIMESTAMP      DEFAULT NOW()     │
│    │ updated_at            TIMESTAMP      DEFAULT NOW()     │
└─────────────────────────────────────────────────────────────┘
        │ N                                   ↓ N
        │                              ┌──────────────┐
        │                              │ FK procedimento_id
        ↓                              │
┌─────────────────────────────────────────────────────────────┐
│                       PROCEDIMENTO                          │
├─────────────────────────────────────────────────────────────┤
│ PK │ id                    BIGSERIAL                        │
│ FK │ categoria_id          BIGINT                           │
│    │ nome                  VARCHAR(200)   NOT NULL          │
│    │ descricao             TEXT                             │
│    │ duracao_minutos       INTEGER        NOT NULL          │
│    │ preco                 DECIMAL(10,2)  NOT NULL          │
│    │ ativo                 BOOLEAN        DEFAULT TRUE      │
│    │ preparo_necessario    TEXT                             │
│    │ cuidados_pos          TEXT                             │
│    │ contraindicacoes      TEXT                             │
│    │ imagem_url            VARCHAR(500)                     │
│    │ exibir_landing_page   BOOLEAN        DEFAULT TRUE      │
│    │ created_at            TIMESTAMP      DEFAULT NOW()     │
│    │ updated_at            TIMESTAMP      DEFAULT NOW()     │
└─────────────────────────────────────────────────────────────┘
        │ N
        │
        │ M (Many-to-Many)
        ↓
┌─────────────────────────────────────────────────────────────┐
│                  PROCEDIMENTO_PRODUTO                       │
├─────────────────────────────────────────────────────────────┤
│ PK │ id                    BIGSERIAL                        │
│ FK │ procedimento_id       BIGINT         NOT NULL          │
│ FK │ produto_id            BIGINT         NOT NULL          │
│    │ quantidade_utilizada  DECIMAL(10,3)  NOT NULL          │
│    │ created_at            TIMESTAMP      DEFAULT NOW()     │
└─────────────────────────────────────────────────────────────┘
        │ M
        │
        │ N
        ↓
┌─────────────────────────────────────────────────────────────┐
│                         PRODUTO                             │
├─────────────────────────────────────────────────────────────┤
│ PK │ id                    BIGSERIAL                        │
│    │ nome                  VARCHAR(200)   NOT NULL          │
│    │ descricao             TEXT                             │
│    │ codigo_barras         VARCHAR(50)    UNIQUE            │
│    │ unidade_medida        VARCHAR(10)    NOT NULL          │
│    │                       (ML, GR, UN)                     │
│    │ estoque_minimo        DECIMAL(10,3)  DEFAULT 0         │
│    │ estoque_atual         DECIMAL(10,3)  DEFAULT 0         │
│    │ preco_custo           DECIMAL(10,2)  NOT NULL          │
│    │ preco_venda           DECIMAL(10,2)                    │
│    │ marca                 VARCHAR(100)                     │
│    │ link_compra           VARCHAR(500)                     │
│    │ ativo                 BOOLEAN        DEFAULT TRUE      │
│    │ created_at            TIMESTAMP      DEFAULT NOW()     │
│    │ updated_at            TIMESTAMP      DEFAULT NOW()     │
└─────────────────────────────────────────────────────────────┘
        │ 1
        │
        │ N
        ↓
┌─────────────────────────────────────────────────────────────┐
│                  MOVIMENTACAO_ESTOQUE                       │
├─────────────────────────────────────────────────────────────┤
│ PK │ id                    BIGSERIAL                        │
│ FK │ produto_id            BIGINT         NOT NULL          │
│ FK │ agendamento_id        BIGINT                           │
│    │ tipo                  VARCHAR(20)    NOT NULL          │
│    │                       (ENTRADA, SAIDA, AJUSTE)         │
│    │ quantidade            DECIMAL(10,3)  NOT NULL          │
│    │ quantidade_anterior   DECIMAL(10,3)  NOT NULL          │
│    │ quantidade_nova       DECIMAL(10,3)  NOT NULL          │
│    │ valor_unitario        DECIMAL(10,2)                    │
│    │ motivo                TEXT                             │
│    │ data_movimentacao     TIMESTAMP      DEFAULT NOW()     │
│    │ created_at            TIMESTAMP      DEFAULT NOW()     │
└─────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│                        CATEGORIA                            │
├─────────────────────────────────────────────────────────────┤
│ PK │ id                    BIGSERIAL                        │
│    │ nome                  VARCHAR(100)   NOT NULL          │
│    │ descricao             TEXT                             │
│    │ icone                 VARCHAR(50)                      │
│    │ cor                   VARCHAR(7)     (HEX)             │
│    │ ativo                 BOOLEAN        DEFAULT TRUE      │
│    │ ordem_exibicao        INTEGER        DEFAULT 0         │
│    │ created_at            TIMESTAMP      DEFAULT NOW()     │
└─────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│                      CONTA_RECEBER                          │
├─────────────────────────────────────────────────────────────┤
│ PK │ id                    BIGSERIAL                        │
│ FK │ cliente_id            BIGINT         NOT NULL          │
│ FK │ agendamento_id        BIGINT                           │
│    │ descricao             TEXT           NOT NULL          │
│    │ valor                 DECIMAL(10,2)  NOT NULL          │
│    │ data_vencimento       DATE           NOT NULL          │
│    │ data_pagamento        DATE                             │
│    │ status                VARCHAR(20)    DEFAULT 'PENDENTE'│
│    │                       (PENDENTE, PAGO, VENCIDO)        │
│    │ forma_pagamento       VARCHAR(50)                      │
│    │                       (DINHEIRO, PIX, CARTAO_DEBITO,   │
│    │                        CARTAO_CREDITO)                 │
│    │ observacoes           TEXT                             │
│    │ created_at            TIMESTAMP      DEFAULT NOW()     │
│    │ updated_at            TIMESTAMP      DEFAULT NOW()     │
└─────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│                        CONTA_PAGAR                          │
├─────────────────────────────────────────────────────────────┤
│ PK │ id                    BIGSERIAL                        │
│    │ descricao             TEXT           NOT NULL          │
│    │ categoria             VARCHAR(50)                      │
│    │                       (PRODUTOS, ALUGUEL, ENERGIA,     │
│    │                        INTERNET, OUTROS)               │
│    │ valor                 DECIMAL(10,2)  NOT NULL          │
│    │ data_vencimento       DATE           NOT NULL          │
│    │ data_pagamento        DATE                             │
│    │ status                VARCHAR(20)    DEFAULT 'PENDENTE'│
│    │ forma_pagamento       VARCHAR(50)                      │
│    │ observacoes           TEXT                             │
│    │ created_at            TIMESTAMP      DEFAULT NOW()     │
│    │ updated_at            TIMESTAMP      DEFAULT NOW()     │
└─────────────────────────────────────────────────────────────┘
```

## 📁 5. Estrutura COMPLETA do Frontend {#estrutura-frontend}

```
clinica-estetica-frontend/
│
├── public/
│   ├── index.html
│   ├── favicon.ico
│   ├── logo.png
│   ├── manifest.json
│   └── robots.txt
│
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── vite-env.d.ts
│   │
│   ├── assets/
│   │   ├── images/
│   │   │   ├── logo.svg
│   │   │   ├── logo-white.svg
│   │   │   ├── hero-background.jpg
│   │   │   ├── placeholder-user.png
│   │   │   ├── placeholder-procedimento.png
│   │   │   └── esteticistas/
│   │   │       ├── ana-paula.jpg
│   │   │       └── carla-santos.jpg
│   │   │
│   │   └── icons/
│   │       ├── calendar.svg
│   │       ├── client.svg
│   │       ├── finance.svg
│   │       ├── discount.svg
│   │       └── product.svg
│   │
│   ├── components/
│   │   │
│   │   ├── landing/                    ← NOVO: Componentes da Landing Page
│   │   │   ├── HeroSection.tsx
│   │   │   ├── SobreNos.tsx
│   │   │   ├── ProcedimentosGrid.tsx
│   │   │   ├── ProcedimentoCard.tsx
│   │   │   ├── PacotesSection.tsx
│   │   │   ├── DepoimentosCarousel.tsx
│   │   │   ├── LocalizacaoContato.tsx
│   │   │   ├── FAQSection.tsx
│   │   │   └── CTAAgendamento.tsx
│   │   │
│   │   ├── agendamento-publico/        ← NOVO: Agendamento híbrido
│   │   │   ├── EscolhaAgendamento.tsx  (Com/Sem cadastro)
│   │   │   ├── CadastroRapido.tsx      (10% OFF)
│   │   │   ├── DadosBasicos.tsx        (Sem cadastro)
│   │   │   ├── EscolhaProcedimento.tsx
│   │   │   ├── EscolhaEsteticista.tsx
│   │   │   ├── CalendarioDisponibilidade.tsx
│   │   │   ├── HorariosDisponiveis.tsx
│   │   │   ├── ResumoAgendamento.tsx
│   │   │   ├── ConfirmacaoSucesso.tsx
│   │   │   └── BadgeDesconto10.tsx     (Badge visual do desconto)
│   │   │
│   │   ├── layout/
│   │   │   ├── LandingLayout.tsx       ← NOVO: Layout público
│   │   │   ├── LandingHeader.tsx       (Logo + [ENTRAR])
│   │   │   ├── LandingFooter.tsx
│   │   │   ├── AdminLayout.tsx         (Dashboard esteticistas)
│   │   │   ├── ClienteLayout.tsx       (Área do cliente)
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Breadcrumb.tsx
│   │   │   └── MobileMenu.tsx
│   │   │
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── Checkbox.tsx
│   │   │   ├── Radio.tsx
│   │   │   ├── Switch.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Dialog.tsx
│   │   │   ├── Drawer.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   ├── Alert.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── DataTable.tsx
│   │   │   ├── Loading.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── DatePicker.tsx
│   │   │   ├── TimePicker.tsx
│   │   │   ├── DateRangePicker.tsx
│   │   │   ├── CurrencyInput.tsx
│   │   │   ├── PhoneInput.tsx
│   │   │   ├── CpfInput.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── Accordion.tsx
│   │   │   ├── Avatar.tsx
│   │   │   └── FileUpload.tsx
│   │   │
│   │   ├── clientes/
│   │   │   ├── ClienteList.tsx
│   │   │   ├── ClienteCard.tsx
│   │   │   ├── ClienteForm.tsx
│   │   │   ├── ClienteDetails.tsx
│   │   │   ├── ClienteFilter.tsx
│   │   │   ├── ClienteHistorico.tsx
│   │   │   ├── ClienteObservacoes.tsx
│   │   │   ├── ClienteStats.tsx
│   │   │   └── DescontoInfo.tsx        ← NOVO: Info sobre desconto
│   │   │
│   │   ├── agendamentos/
│   │   │   ├── AgendamentoList.tsx
│   │   │   ├── AgendamentoCard.tsx
│   │   │   ├── AgendamentoForm.tsx
│   │   │   ├── AgendamentoCalendar.tsx
│   │   │   ├── AgendamentoDia.tsx
│   │   │   ├── AgendamentoSemana.tsx
│   │   │   ├── AgendamentoMes.tsx
│   │   │   ├── AgendamentoDetails.tsx
│   │   │   ├── AgendamentoFilter.tsx
│   │   │   ├── ConfirmarAgendamento.tsx
│   │   │   ├── CancelarAgendamento.tsx
│   │   │   ├── ListaEspera.tsx
│   │   │   └── AgendaEsteticista.tsx   ← NOVO: Visualização por esteticista
│   │   │
│   │   ├── procedimentos/
│   │   │   ├── ProcedimentoList.tsx
│   │   │   ├── ProcedimentoCard.tsx
│   │   │   ├── ProcedimentoForm.tsx
│   │   │   ├── ProcedimentoDetails.tsx
│   │   │   ├── ProcedimentoCategoria.tsx
│   │   │   ├── ProcedimentoProdutos.tsx
│   │   │   ├── ProcedimentoGaleria.tsx
│   │   │   └── ProcedimentoPublico.tsx ← NOVO: Card sem preço
│   │   │
│   │   ├── produtos/
│   │   │   ├── ProdutoList.tsx
│   │   │   ├── ProdutoCard.tsx
│   │   │   ├── ProdutoForm.tsx
│   │   │   ├── ProdutoDetails.tsx
│   │   │   ├── ProdutoFilter.tsx
│   │   │   └── ProdutoAlerta.tsx
│   │   │
│   │   ├── estoque/
│   │   │   ├── EstoqueList.tsx
│   │   │   ├── EstoqueDashboard.tsx
│   │   │   ├── MovimentacaoList.tsx
│   │   │   ├── MovimentacaoForm.tsx
│   │   │   ├── EntradaEstoque.tsx
│   │   │   ├── SaidaEstoque.tsx
│   │   │   ├── AjusteEstoque.tsx
│   │   │   ├── AlertasEstoque.tsx
│   │   │   └── HistoricoMovimentacao.tsx
│   │   │
│   │   ├── financeiro/
│   │   │   ├── FinanceiroDashboard.tsx
│   │   │   ├── FluxoCaixa.tsx
│   │   │   ├── ResumoFinanceiro.tsx
│   │   │   │
│   │   │   ├── contas-receber/
│   │   │   │   ├── ContasReceberList.tsx
│   │   │   │   ├── ContaReceberCard.tsx
│   │   │   │   ├── ContaReceberForm.tsx
│   │   │   │   ├── RegistrarPagamento.tsx
│   │   │   │   └── ContasVencidas.tsx
│   │   │   │
│   │   │   └── contas-pagar/
│   │   │       ├── ContasPagarList.tsx
│   │   │       ├── ContaPagarCard.tsx
│   │   │       ├── ContaPagarForm.tsx
│   │   │       ├── RegistrarPagamento.tsx
│   │   │       └── ContasVencidas.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── DashboardCards.tsx
│   │   │   ├── CardFaturamento.tsx
│   │   │   ├── CardAgendamentos.tsx
│   │   │   ├── CardClientes.tsx
│   │   │   ├── CardEstoque.tsx
│   │   │   ├── GraficoFaturamento.tsx
│   │   │   ├── GraficoAgendamentos.tsx
│   │   │   ├── GraficoProcedimentos.tsx
│   │   │   ├── TopProcedimentos.tsx
│   │   │   ├── TopClientes.tsx
│   │   │   ├── AgendamentosHoje.tsx
│   │   │   ├── AtividadesRecentes.tsx
│   │   │   ├── AlertasGerais.tsx
│   │   │   └── PerformanceEsteticista.tsx ← NOVO
│   │   │
│   │   ├── relatorios/
│   │   │   ├── RelatorioFaturamento.tsx
│   │   │   ├── RelatorioAgendamentos.tsx
│   │   │   ├── RelatorioClientes.tsx
│   │   │   ├── RelatorioProcedimentos.tsx
│   │   │   ├── RelatorioEstoque.tsx
│   │   │   ├── RelatorioFinanceiro.tsx
│   │   │   ├── FiltrosRelatorio.tsx
│   │   │   └── ExportarRelatorio.tsx
│   │   │
│   │   └── auth/
│   │       ├── LoginForm.tsx
│   │       ├── LoginModal.tsx           ← NOVO: Modal de login
│   │       ├── CadastroForm.tsx
│   │       ├── ForgotPassword.tsx
│   │       ├── ResetPassword.tsx
│   │       └── ProtectedRoute.tsx
│   │
│   ├── pages/
│   │   ├── public/                      ← NOVO: Páginas públicas
│   │   │   ├── LandingPage.tsx
│   │   │   ├── AgendarPublico.tsx
│   │   │   ├── ProcedimentoDetalhePublico.tsx
│   │   │   └── SobrePage.tsx
│   │   │
│   │   ├── auth/
│   │   │   ├── Login.tsx
│   │   │   └── Cadastro.tsx
│   │   │
│   │   ├── admin/                       ← NOVO: Área administrativa
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Clientes.tsx
│   │   │   ├── ClienteDetalhes.tsx
│   │   │   ├── NovoCliente.tsx
│   │   │   ├── EditarCliente.tsx
│   │   │   ├── Agendamentos.tsx
│   │   │   ├── Calendario.tsx
│   │   │   ├── NovoAgendamento.tsx
│   │   │   ├── Procedimentos.tsx
│   │   │   ├── ProcedimentoDetalhes.tsx
│   │   │   ├── NovoProcedimento.tsx
│   │   │   ├── Produtos.tsx
│   │   │   ├── ProdutoDetalhes.tsx
│   │   │   ├── NovoProduto.tsx
│   │   │   ├── Estoque.tsx
│   │   │   ├── Movimentacoes.tsx
│   │   │   ├── Financeiro.tsx
│   │   │   ├── ContasReceber.tsx
│   │   │   ├── ContasPagar.tsx
│   │   │   ├── FluxoCaixa.tsx
│   │   │   ├── Relatorios.tsx
│   │   │   └── Configuracoes.tsx
│   │   │
│   │   ├── cliente/                     ← NOVO: Área do cliente
│   │   │   ├── MinhaArea.tsx
│   │   │   ├── MeusAgendamentos.tsx
│   │   │   ├── NovoAgendamento.tsx
│   │   │   ├── MeuHistorico.tsx
│   │   │   ├── MeusDados.tsx
│   │   │   └── MeuPerfil.tsx
│   │   │
│   │   ├── NotFound.tsx
│   │   └── Unauthorized.tsx
│   │
│   ├── services/
│   │   ├── api.ts
│   │   ├── authService.ts
│   │   ├── clienteService.ts
│   │   ├── agendamentoService.ts
│   │   ├── agendamentoPublicoService.ts ← NOVO
│   │   ├── descontoService.ts           ← NOVO
│   │   ├── procedimentoService.ts
│   │   ├── categoriaService.ts
│   │   ├── produtoService.ts
│   │   ├── estoqueService.ts
│   │   ├── movimentacaoService.ts
│   │   ├── contaReceberService.ts
│   │   ├── contaPagarService.ts
│   │   ├── financeiroService.ts
│   │   ├── dashboardService.ts
│   │   ├── relatorioService.ts
│   │   └── notificacaoService.ts
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useClientes.ts
│   │   ├── useAgendamentos.ts
│   │   ├── useAgendamentoPublico.ts     ← NOVO
│   │   ├── useDesconto.ts               ← NOVO
│   │   ├── useProcedimentos.ts
│   │   ├── useProdutos.ts
│   │   ├── useEstoque.ts
│   │   ├── useFinanceiro.ts
│   │   ├── useDashboard.ts
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useMediaQuery.ts
│   │   ├── useClickOutside.ts
│   │   └── useNotification.ts
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   ├── NotificationContext.tsx
│   │   ├── AgendamentoContext.tsx       ← NOVO
│   │   └── SidebarContext.tsx
│   │
│   ├── types/
│   │   ├── auth.types.ts
│   │   ├── cliente.types.ts
│   │   ├── agendamento.types.ts
│   │   ├── desconto.types.ts            ← NOVO
│   │   ├── procedimento.types.ts
│   │   ├── produto.types.ts
│   │   ├── estoque.types.ts
│   │   ├── financeiro.types.ts
│   │   ├── dashboard.types.ts
│   │   ├── relatorio.types.ts
│   │   ├── landing.types.ts             ← NOVO
│   │   ├── common.types.ts
│   │   └── api.types.ts
│   │
│   ├── utils/
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   ├── constants.ts
│   │   ├── helpers.ts
│   │   ├── date.utils.ts
│   │   ├── currency.utils.ts
│   │   ├── string.utils.ts
│   │   ├── array.utils.ts
│   │   ├── cpf.utils.ts
│   │   ├── phone.utils.ts
│   │   ├── desconto.utils.ts            ← NOVO
│   │   └── storage.utils.ts
│   │
│   ├── lib/
│   │   ├── axios.ts
│   │   ├── react-query.ts
│   │   └── zod-schemas.ts
│   │
│   ├── styles/
│   │   ├── globals.css
│   │   ├── variables.css
│   │   ├── landing.css                  ← NOVO
│   │   └── animations.css
│   │
│   └── routes/
│       ├── index.tsx
│       ├── PublicRoutes.tsx             ← NOVO
│       ├── AdminRoutes.tsx              ← NOVO
│       ├── ClienteRoutes.tsx            ← NOVO
│       ├── PrivateRoute.tsx
│       └── PublicRoute.tsx
│
├── docker/
│   ├── Dockerfile
│   └── nginx.conf
│
├── .env.example
├── .env.development
├── .env.production
├── .gitignore
├── .eslintrc.json
├── .prettierrc
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── README.md
└── LICENSE
```

---

## 💾 6. Modelos de Dados Completos {#modelos-dados}

### 6.1 Cliente (Com suporte a desconto)
```json
{
  "id": 1,
  "usuarioId": 45,
  "nome": "Maria Silva Santos",
  "cpf": "123.456.789-00",
  "email": "maria.silva@email.com",
  "telefone": "(11) 3456-7890",
  "celular": "(11) 98765-4321",
  "dataNascimento": "1990-05-15",
  "sexo": "F",
  "endereco": "Rua das Flores, 123",
  "cidade": "São Paulo",
  "estado": "SP",
  "cep": "01234-567",
  "observacoes": "Cliente VIP",
  "restricoesAlergias": "Alergia a produtos com fragrância forte",
  "fotoPerfilUrl": "https://storage.com/fotos/cliente-1.jpg",
  "status": "ATIVO",
  "dataCadastro": "2024-10-01",
  "ultimaVisita": "2025-09-28",
  "totalGasto": 2500.00,
  "primeiroAgendamento": false,
  "descontoUtilizado": true,
  "dataDescontoUtilizado": "2024-10-15",
  "createdAt": "2024-10-01T10:30:00",
  "updatedAt": "2025-09-28T14:20:00"
}
```

### 6.2 Agendamento (Com desconto aplicado)
```json
{
  "id": 1,
  "clienteId": 1,
  "clienteNome": "Maria Silva Santos",
  "clienteEmail": "maria.silva@email.com",
  "clienteCelular": "(11) 98765-4321",
  "procedimentoId": 5,
  "procedimentoNome": "Limpeza de Pele Profunda",
  "esteticista": "Ana Paula",
  "dataHora": "2025-10-15T14:00:00",
  "dataHoraFim": "2025-10-15T15:00:00",
  "duracaoMinutos": 60,
  "status": "CONFIRMADO",
  "valorProcedimento": 150.00,
  "valorDesconto": 15.00,
  "tipoDesconto": "PRIMEIRO_AGENDAMENTO",
  "valorTotal": 135.00,
  "formaPagamento": "PIX",
  "pago": true,
  "observacoes": "Primeira vez - Desconto de boas-vindas aplicado",
  "confirmado": true,
  "lembreteEnviado": true,
  "createdAt": "2025-10-01T09:15:00",
  "updatedAt": "2025-10-10T16:30:00"
}
```

### 6.3 Procedimento (Landing Page)
```json
{
  "id": 1,
  "categoriaId": 1,
  "categoriaNome": "Facial",
  "categoriaCor": "#FF6B9D",
  "categoriaIcone": "face",
  "nome": "Limpeza de Pele Profunda",
  "descricao": "Limpeza completa com extração de cravos, esfoliação e hidratação profunda. Ideal para renovação celular e pele radiante.",
  "duracaoMinutos": 60,
  "preco": 150.00,
  "ativo": true,
  "exibirLandingPage": true,
  "preparoNecessario": "Vir com rosto limpo, sem maquiagem",
  "cuidadosPos": "Evitar exposição solar por 24h, usar protetor solar FPS 50+",
  "contraindicacoes": "Pele com lesões ativas, acne inflamada severa, procedimentos a laser recentes",
  "imagemUrl": "https://storage.com/procedimentos/limpeza-pele.jpg",
  "produtosUtilizados": [
    {
      "produtoId": 3,
      "produtoNome": "Gel de Limpeza Facial",
      "quantidadeUtilizada": 50.0,
      "unidadeMedida": "ML"
    },
    {
      "produtoId": 5,
      "produtoNome": "Máscara Facial Argila",
      "quantidadeUtilizada": 1.0,
      "unidadeMedida": "UN"
    }
  ],
  "createdAt": "2024-01-01T00:00:00",
  "updatedAt": "2024-08-15T10:00:00"
}
```

### 6.4 Dashboard Response (Com métricas de desconto)
```json
{
  "faturamentoHoje": 450.00,
  "faturamentoMes": 12500.00,
  "descontosConced idosMes": 340.00,
  "faturamentoLiquido": 12160.00,
  
  "agendamentosHoje": 8,
  "agendamentosMes": 156,
  "taxaOcupacao": 78.5,
  
  "clientesAtivos": 234,
  "clientesNovos": 15,
  "clientesComDesconto": 12,
  "taxaConversaoCadastro": 80.0,
  
  "produtosEstoqueBaixo": 3,
  "contasVencidas": 2,
  
  "proximosAgendamentos": [
    {
      "id": 45,
      "clienteNome": "Maria Silva",
      "procedimentoNome": "Limpeza de Pele",
      "dataHora": "2025-10-02T15:00:00",
      "esteticista": "Ana Paula",
      "primeiraVez": true,
      "comDesconto": true
    }
  ],
  
  "performanceEsteticistas": [
    {
      "nome": "Ana Paula",
      "atendimentosMes": 82,
      "faturamento": 6850.00,
      "ticketMedio": 83.54,
      "procedimentoMaisRealizado": "Limpeza de Pele"
    },
    {
      "nome": "Carla Santos",
      "atendimentosMes": 74,
      "faturamento": 5650.00,
      "ticketMedio": 76.35,
      "procedimentoMaisRealizado": "Drenagem Linfática"
    }
  ],
  
  "topProcedimentos": [
    {
      "procedimentoNome": "Limpeza de Pele Profunda",
      "quantidade": 45,
      "faturamento": 6075.00,
      "descontosAplicados": 675.00
    }
  ],
  
  "graficoFaturamento": {
    "labels": ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
    "valores": [8500, 9200, 11000, 10500, 12000, 12500],
    "descontos": [250, 320, 380, 290, 310, 340]
  },
  
  "metricsDesconto": {
    "totalDescontosConced idos": 340.00,
    "numeroClientesComDesconto": 12,
    "ticketMedioComDesconto": 135.00,
    "ticketMedioSemDesconto": 150.00,
    "taxaRetornoClientesDesconto": 75.0,
    "roiProgramaDesconto": 850.0
  }
}
```

### 6.5 Disponibilidade Horários Response
```json
{
  "data": "2025-10-15",
  "procedimentoId": 1,
  "duracaoMinutos": 60,
  "horarios": [
    {
      "hora": "09:00",
      "disponivel": true,
      "esteticistas": [
        {
          "nome": "Ana Paula",
          "disponivel": true
        },
        {
          "nome": "Carla Santos",
          "disponivel": false,
          "motivoIndisponibilidade": "Horário ocupado"
        }
      ]
    },
    {
      "hora": "10:00",
      "disponivel": true,
      "esteticistas": [
        {
          "nome": "Ana Paula",
          "disponivel": false,
          "motivoIndisponibilidade": "Horário ocupado"
        },
        {
          "nome": "Carla Santos",
          "disponivel": true
        }
      ]
    },
    {
      "hora": "14:00",
      "disponivel": true,
      "esteticistas": [
        {
          "nome": "Ana Paula",
          "disponivel": true
        },
        {
          "nome": "Carla Santos",
          "disponivel": true
        }
      ]
    }
  ]
}
```

---

## 🔌 7. Endpoints da API Completos {#endpoints-api}

### 7.1 Autenticação

```
POST   /api/auth/register           - Cadastro público (novo)
POST   /api/auth/login              - Login (esteticista ou cliente)
POST   /api/auth/logout             - Logout
POST   /api/auth/refresh            - Refresh Token
POST   /api/auth/forgot-password    - Esqueci minha senha
POST   /api/auth/reset-password     - Resetar senha
GET    /api/auth/me                 - Dados do usuário logado
GET    /api/auth/validate-token     - Validar token JWT
```

### 7.2 Clientes

```
GET    /api/clientes                    - Lista todos (admin)
GET    /api/clientes/{id}               - Busca por ID
POST   /api/clientes                    - Cria novo
PUT    /api/clientes/{id}               - Atualiza
DELETE /api/clientes/{id}               - Remove
GET    /api/clientes/cpf/{cpf}          - Busca por CPF
POST   /api/clientes/buscar             - Busca com filtros
GET    /api/clientes/{id}/historico     - Histórico do cliente
GET    /api/clientes/{id}/desconto      - Info desconto disponível (novo)
GET    /api/clientes/aniversariantes    - Aniversariantes do mês
PUT    /api/clientes/{id}/inativar      - Inativa cliente
PUT    /api/clientes/{id}/ativar        - Ativa cliente
```

### 7.3 Agendamentos Públicos (Sem autenticação)

```
POST   /api/agendamentos/publico/disponibilidade    - Verifica horários disponíveis
POST   /api/agendamentos/publico/solicitar          - Cria agendamento sem login
GET    /api/agendamentos/publico/consultar/{codigo} - Consulta por código
```

### 7.4 Agendamentos (Autenticado)

```
GET    /api/agendamentos                       - Lista todos
GET    /api/agendamentos/{id}                  - Busca por ID
POST   /api/agendamentos                       - Cria novo (com desconto se aplicável)
PUT    /api/agendamentos/{id}                  - Atualiza
DELETE /api/agendamentos/{id}                  - Cancela
POST   /api/agendamentos/buscar                - Busca com filtros
GET    /api/agendamentos/data/{data}           - Por data
GET    /api/agendamentos/periodo               - Por período
GET    /api/agendamentos/cliente/{id}          - Por cliente
GET    /api/agendamentos/esteticista/{nome}    - Por esteticista
PUT    /api/agendamentos/{id}/confirmar        - Confirma
PUT    /api/agendamentos/{id}/cancelar         - Cancela com motivo
PUT    /api/agendamentos/{id}/reagendar        - Reagenda
GET    /api/agendamentos/disponibilidade       - Verifica disponibilidade
GET    /api/agendamentos/hoje                  - Agendamentos de hoje
POST   /api/agendamentos/{id}/aplicar-desconto - Aplica desconto manualmente (admin)
```

### 7.5 Procedimentos (Público para Landing Page)

```
GET    /api/procedimentos/publico          - Lista para landing page (sem preços)
GET    /api/procedimentos/publico/{id}     - Detalhes público (sem preço)
GET    /api/procedimentos/publico/categorias - Categorias com procedimentos
```

### 7.6 Procedimentos (Admin)

```
GET    /api/procedimentos                - Lista todos
GET    /api/procedimentos/{id}           - Busca por ID
POST   /api/procedimentos                - Cria novo
PUT    /api/procedimentos/{id}           - Atualiza
DELETE /api/procedimentos/{id}           - Remove
GET    /api/procedimentos/categoria/{id} - Por categoria
GET    /api/procedimentos/ativos         - Somente ativos
POST   /api/procedimentos/buscar         - Busca com filtros
```

### 7.7 Descontos (Novo)

```
GET    /api/descontos/cliente/{clienteId}           - Verifica elegibilidade
POST   /api/descontos/aplicar                       - Aplica desconto em agendamento
GET    /api/descontos/estatisticas                  - Estatísticas do programa
GET    /api/descontos/relatorio                     - Relatório de descontos concedidos
POST   /api/descontos/validar-cupom                 - Valida cupom de desconto
```

### 7.8 Dashboard

```
GET    /api/dashboard                        - Dashboard geral
GET    /api/dashboard/resumo                 - Resumo rápido
GET    /api/dashboard/faturamento            - Dados faturamento
GET    /api/dashboard/agendamentos           - Dados agendamentos
GET    /api/dashboard/metricas-desconto      - Métricas programa desconto (novo)
GET    /api/dashboard/top-procedimentos      - Top procedimentos
GET    /api/dashboard/top-clientes           - Top clientes
GET    /api/dashboard/performance-esteticistas - Performance por esteticista (novo)
```

### 7.9 Notificações (Novo)

```
POST   /api/notificacoes/whatsapp/confirmacao    - Envia confirmação WhatsApp
POST   /api/notificacoes/whatsapp/lembrete       - Envia lembrete WhatsApp
POST   /api/notificacoes/email/confirmacao       - Envia confirmação Email
POST   /api/notificacoes/email/lembrete          - Envia lembrete Email
POST   /api/notificacoes/email/boas-vindas       - Email boas-vindas com cupom
GET    /api/notificacoes/historico/{clienteId}   - Histórico de notificações
```

---

## 🐳 8. Docker e Configurações {#docker}

### 8.1 docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: clinica-postgres
    environment:
      POSTGRES_DB: clinica_db
      POSTGRES_USER: clinica_user
      POSTGRES_PASSWORD: clinica_pass_2024
      TZ: America/Sao_Paulo
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backup:/backup
    networks:
      - clinica-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U clinica_user -d clinica_db"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  backend:
    build:
      context: ./clinica-estetica-backend
      dockerfile: docker/Dockerfile
    container_name: clinica-backend
    environment:
      SPRING_PROFILES_ACTIVE: prod
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/clinica_db
      SPRING_DATASOURCE_USERNAME: clinica_user
      SPRING_DATASOURCE_PASSWORD: clinica_pass_2024
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRATION: 86400000
      SERVER_PORT: 8080
      TZ: America/Sao_Paulo
      # Configurações de desconto
      DESCONTO_PRIMEIRO_AGENDAMENTO_PERCENTUAL: 10
      DESCONTO_VALIDADE_DIAS: 30
      # WhatsApp API
      WHATSAPP_API_URL: ${WHATSAPP_API_URL}
      WHATSAPP_API_TOKEN: ${WHATSAPP_API_TOKEN}
    ports:
      - "8080:8080"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - clinica-network
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads
    restart: unless-stopped

  frontend:
    build:
      context: ./clinica-estetica-frontend
      dockerfile: docker/Dockerfile
      args:
        VITE_API_URL: http://localhost:8080/api
        VITE_DESCONTO_PERCENTUAL: 10
    container_name: clinica-frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - clinica-network
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: clinica-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - frontend
      - backend
    networks:
      - clinica-network
    restart: unless-stopped

volumes:
  postgres_data:
    driver: local

networks:
  clinica-network:
    driver: bridge
```

### 8.2 application.properties (Atualizado)

```properties
# Application
spring.application.name=clinica-estetica
server.port=8080
server.compression.enabled=true

# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/clinica_db
spring.datasource.username=clinica_user
spring.datasource.password=clinica_pass_2024
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.properties.hibernate.jdbc.time_zone=America/Sao_Paulo
spring.jpa.open-in-view=false

# Flyway
spring.flyway.enabled=true
spring.flyway.baseline-on-migrate=true
spring.flyway.locations=classpath:db/migration
spring.flyway.validate-on-migrate=true

# JWT
jwt.secret=${JWT_SECRET:chave-secreta-super-forte-minimo-256-bits-para-hs256-algorithm}
jwt.expiration=86400000

# Programa de Desconto
desconto.primeiro.agendamento.percentual=10
desconto.primeiro.agendamento.validade.dias=30
desconto.enabled=true

# Cache
spring.cache.type=simple

# File Upload
spring.servlet.multipart.enabled=true
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
spring.servlet.multipart.file-size-threshold=2MB

# Email
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=${EMAIL_USERNAME}
spring.mail.password=${EMAIL_PASSWORD}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true

# WhatsApp API (integração externa)
whatsapp.api.url=${WHATSAPP_API_URL}
whatsapp.api.token=${WHATSAPP_API_TOKEN}
whatsapp.enabled=true

# Logging
logging.level.root=INFO
logging.level.com.clinica.estetica=DEBUG
logging.level.org.springframework.web=INFO
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.type.descriptor.sql.BasicBinder=TRACE
logging.file.name=logs/application.log
logging.pattern.console=%d{yyyy-MM-dd HH:mm:ss} - %msg%n
logging.pattern.file=%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n

# Actuator
management.endpoints.web.exposure.include=health,info,metrics,prometheus
management.endpoint.health.show-details=always
management.metrics.export.prometheus.enabled=true

# Swagger/OpenAPI
springdoc.api-docs.path=/api-docs
springdoc.swagger-ui.path=/swagger-ui.html
springdoc.swagger-ui.operationsSorter=method

# Time Zone
spring.jackson.time-zone=America/Sao_Paulo

# CORS (permitir requisições da landing page)
cors.allowed-origins=http://localhost:3000,https://suaclinia.com.br
```

---

## 📊 9. Scripts SQL Completos {#scripts-sql}

### 9.1 V1__create_tables.sql (Atualizado)

```sql
-- TABELA: USUARIO
CREATE TABLE usuario (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'ESTETICISTA', 'CLIENTE')),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA: CATEGORIA
CREATE TABLE categoria (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    icone VARCHAR(50),
    cor VARCHAR(7),
    ativo BOOLEAN DEFAULT TRUE,
    ordem_exibicao INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA: CLIENTE (com campos de desconto)
CREATE TABLE cliente (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT REFERENCES usuario(id),
    nome VARCHAR(200) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    email VARCHAR(150) NOT NULL,
    telefone VARCHAR(20),
    celular VARCHAR(20) NOT NULL,
    data_nascimento DATE,
    sexo VARCHAR(1),
    endereco VARCHAR(255),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(9),
    observacoes TEXT,
    restricoes_alergias TEXT,
    foto_perfil_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO')),
    data_cadastro DATE DEFAULT CURRENT_DATE,
    ultima_visita DATE,
    total_gasto DECIMAL(10,2) DEFAULT 0,
    primeiro_agendamento BOOLEAN DEFAULT TRUE,
    desconto_utilizado BOOLEAN DEFAULT FALSE,
    data_desconto_utilizado DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA: PROCEDIMENTO (com flag para landing page)
CREATE TABLE procedimento (
    id BIGSERIAL PRIMARY KEY,
    categoria_id BIGINT REFERENCES categoria(id),
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    duracao_minutos INTEGER NOT NULL CHECK (duracao_minutos > 0),
    preco DECIMAL(10,2) NOT NULL CHECK (preco >= 0),
    ativo BOOLEAN DEFAULT TRUE,
    exibir_landing_page BOOLEAN DEFAULT TRUE,
    preparo_necessario TEXT,
    cuidados_pos TEXT,
    contraindicacoes TEXT,
    imagem_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA: PRODUTO
CREATE TABLE produto (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    codigo_barras VARCHAR(50) UNIQUE,
    unidade_medida VARCHAR(10) NOT NULL CHECK (unidade_medida IN ('ML', 'GR', 'UN', 'L', 'KG')),
    estoque_minimo DECIMAL(10,3) DEFAULT 0 CHECK (estoque_minimo >= 0),
    estoque_atual DECIMAL(10,3) DEFAULT 0 CHECK (estoque_atual >= 0),
    preco_custo DECIMAL(10,2) NOT NULL CHECK (preco_custo >= 0),
    preco_venda DECIMAL(10,2) CHECK (preco_venda >= 0),
    marca VARCHAR(100),
    link_compra VARCHAR(500),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA: AGENDAMENTO (com campos de desconto)
CREATE TABLE agendamento (
    id BIGSERIAL PRIMARY KEY,
    cliente_id BIGINT REFERENCES cliente(id) NOT NULL,
    procedimento_id BIGINT REFERENCES procedimento(id) NOT NULL,
    esteticista VARCHAR(100) NOT NULL CHECK (esteticista IN ('Ana Paula', 'Carla Santos')),
    data_hora TIMESTAMP NOT NULL,
    data_hora_fim TIMESTAMP NOT NULL,
    duracao_minutos INTEGER NOT NULL CHECK (duracao_minutos > 0),
    status VARCHAR(20) DEFAULT 'AGENDADO' CHECK (status IN ('AGENDADO', 'CONFIRMADO', 'REALIZADO', 'CANCELADO', 'NAO_COMPARECEU')),
    valor_procedimento DECIMAL(10,2) NOT NULL CHECK (valor_procedimento >= 0),
    valor_desconto DECIMAL(10,2) DEFAULT 0 CHECK (valor_desconto >= 0),
    tipo_desconto VARCHAR(50) CHECK (tipo_desconto IN ('PRIMEIRO_AGENDAMENTO', 'PACOTE', 'PROMOCIONAL', 'ANIVERSARIO')),
    valor_total DECIMAL(10,2) NOT NULL CHECK (valor_total >= 0),
    forma_pagamento VARCHAR(50) CHECK (forma_pagamento IN ('DINHEIRO', 'PIX', 'CARTAO_DEBITO', 'CARTAO_CREDITO')),
    pago BOOLEAN DEFAULT FALSE,
    observacoes TEXT,
    motivo_cancelamento TEXT,
    confirmado BOOLEAN DEFAULT FALSE,
    lembrete_enviado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_data_hora_fim CHECK (data_hora_fim > data_hora),
    CONSTRAINT chk_valor_desconto CHECK (valor_desconto <= valor_procedimento),
    CONSTRAINT chk_valor_total CHECK (valor_total = valor_procedimento - valor_desconto)
);

-- TABELA: PROCEDIMENTO_PRODUTO
CREATE TABLE procedimento_produto (
    id BIGSERIAL PRIMARY KEY,
    procedimento_id BIGINT REFERENCES procedimento(id) ON DELETE CASCADE NOT NULL,
    produto_id BIGINT REFERENCES produto(id) ON DELETE CASCADE NOT NULL,
    quantidade_utilizada DECIMAL(10,3) NOT NULL CHECK (quantidade_utilizada > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(procedimento_id, produto_id)
);

-- TABELA: MOVIMENTACAO_ESTOQUE
CREATE TABLE movimentacao_estoque (
    id BIGSERIAL PRIMARY KEY,
    produto_id BIGINT REFERENCES produto(id) NOT NULL,
    agendamento_id BIGINT REFERENCES agendamento(id),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ENTRADA', 'SAIDA', 'AJUSTE')),
    quantidade DECIMAL(10,3) NOT NULL CHECK (quantidade != 0),
    quantidade_anterior DECIMAL(10,3) NOT NULL CHECK (quantidade_anterior >= 0),
    quantidade_nova DECIMAL(10,3) NOT NULL CHECK (quantidade_nova >= 0),
    valor_unitario DECIMAL(10,2) CHECK (valor_unitario >= 0),
    motivo TEXT,
    data_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA: CONTA_RECEBER
CREATE TABLE conta_receber (
    id BIGSERIAL PRIMARY KEY,
    cliente_id BIGINT REFERENCES cliente(id) NOT NULL,
    agendamento_id BIGINT REFERENCES agendamento(id),
    descricao TEXT NOT NULL,
    valor DECIMAL(10,2) NOT NULL CHECK (valor >= 0),
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status VARCHAR(20) DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO')),
    forma_pagamento VARCHAR(50) CHECK (forma_pagamento IN ('DINHEIRO', 'PIX', 'CARTAO_DEBITO', 'CARTAO_CREDITO')),
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA: CONTA_PAGAR
CREATE TABLE conta_pagar (
    id BIGSERIAL PRIMARY KEY,
    descricao TEXT NOT NULL,
    categoria VARCHAR(50) CHECK (categoria IN ('PRODUTOS', 'ALUGUEL', 'ENERGIA', 'AGUA', 'INTERNET', 'TELEFONE', 'IMPOSTOS', 'SALARIOS', 'OUTROS')),
    valor DECIMAL(10,2) NOT NULL CHECK (valor >= 0),
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status VARCHAR(20) DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO')),
    forma_pagamento VARCHAR(50) CHECK (forma_pagamento IN ('DINHEIRO', 'PIX', 'CARTAO_DEBITO', 'CARTAO_CREDITO', 'BOLETO')),
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA: NOTIFICACAO (NOVA)
CREATE TABLE notificacao (
    id BIGSERIAL PRIMARY KEY,
    cliente_id BIGINT REFERENCES cliente(id) NOT NULL,
    agendamento_id BIGINT REFERENCES agendamento(id),
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('EMAIL', 'WHATSAPP', 'SMS')),
    assunto VARCHAR(255),
    mensagem TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'ENVIADO', 'ERRO', 'CANCELADO')),
    data_envio TIMESTAMP,
    erro_mensagem TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices adicionais
CREATE INDEX idx_notificacao_cliente ON notificacao(cliente_id);
CREATE INDEX idx_notificacao_status ON notificacao(status);
CREATE INDEX idx_notificacao_tipo ON notificacao(tipo);
```

### 9.2 V2__create_indexes.sql

```sql
-- Índices para melhor performance

-- Cliente
CREATE INDEX idx_cliente_cpf ON cliente(cpf);
CREATE INDEX idx_cliente_email ON cliente(email);
CREATE INDEX idx_cliente_nome ON cliente USING gin(to_tsvector('portuguese', nome));
CREATE INDEX idx_cliente_status ON cliente(status);
CREATE INDEX idx_cliente_data_cadastro ON cliente(data_cadastro);
CREATE INDEX idx_cliente_primeiro_agendamento ON cliente(primeiro_agendamento) WHERE primeiro_agendamento = TRUE;
CREATE INDEX idx_cliente_desconto_utilizado ON cliente(desconto_utilizado);

-- Usuário
CREATE INDEX idx_usuario_email ON usuario(email);
CREATE INDEX idx_usuario_username ON usuario(username);
CREATE INDEX idx_usuario_role ON usuario(role);

-- Agendamento
CREATE INDEX idx_agendamento_cliente ON agendamento(cliente_id);
CREATE INDEX idx_agendamento_procedimento ON agendamento(procedimento_id);
CREATE INDEX idx_agendamento_data ON agendamento(data_hora);
CREATE INDEX idx_agendamento_status ON agendamento(status);
CREATE INDEX idx_agendamento_esteticista ON agendamento(esteticista);
CREATE INDEX idx_agendamento_confirmado ON agendamento(confirmado);
CREATE INDEX idx_agendamento_pago ON agendamento(pago);
CREATE INDEX idx_agendamento_tipo_desconto ON agendamento(tipo_desconto) WHERE tipo_desconto IS NOT NULL;
CREATE INDEX idx_agendamento_data_status ON agendamento(data_hora, status);

-- Procedimento
CREATE INDEX idx_procedimento_categoria ON procedimento(categoria_id);
CREATE INDEX idx_procedimento_ativo ON procedimento(ativo);
CREATE INDEX idx_procedimento_landing ON procedimento(exibir_landing_page) WHERE exibir_landing_page = TRUE;
CREATE INDEX idx_procedimento_nome ON procedimento USING gin(to_tsvector('portuguese', nome));

-- Produto
CREATE INDEX idx_produto_codigo_barras ON produto(codigo_barras);
CREATE INDEX idx_produto_ativo ON produto(ativo);
CREATE INDEX idx_produto_estoque_minimo ON produto(estoque_minimo, estoque_atual) WHERE estoque_atual < estoque_minimo;

-- Movimentação Estoque
CREATE INDEX idx_movimentacao_produto ON movimentacao_estoque(produto_id);
CREATE INDEX idx_movimentacao_agendamento ON movimentacao_estoque(agendamento_id);
CREATE INDEX idx_movimentacao_data ON movimentacao_estoque(data_movimentacao);
CREATE INDEX idx_movimentacao_tipo ON movimentacao_estoque(tipo);

-- Conta Receber
CREATE INDEX idx_conta_receber_cliente ON conta_receber(cliente_id);
CREATE INDEX idx_conta_receber_agendamento ON conta_receber(agendamento_id);
CREATE INDEX idx_conta_receber_status ON conta_receber(status);
CREATE INDEX idx_conta_receber_vencimento ON conta_receber(data_vencimento);
CREATE INDEX idx_conta_receber_pagamento ON conta_receber(data_pagamento);
CREATE INDEX idx_conta_receber_vencidas ON conta_receber(status, data_vencimento) WHERE status = 'PENDENTE';

-- Conta Pagar
CREATE INDEX idx_conta_pagar_status ON conta_pagar(status);
CREATE INDEX idx_conta_pagar_vencimento ON conta_pagar(data_vencimento);
CREATE INDEX idx_conta_pagar_categoria ON conta_pagar(categoria);
CREATE INDEX idx_conta_pagar_vencidas ON conta_pagar(status, data_vencimento) WHERE status = 'PENDENTE';
```

### 9.3 V3__insert_initial_data.sql

```sql
-- Usuário Admin
INSERT INTO usuario (nome, username, password_hash, email, role, ativo) VALUES
('Administrador', 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin@clinica.com', 'ADMIN', true);
-- Senha: admin123

-- Usuários Esteticistas
INSERT INTO usuario (nome, username, password_hash, email, role, ativo) VALUES
('Ana Paula Silva', 'ana.paula', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ana.paula@clinica.com', 'ESTETICISTA', true),
('Carla Santos', 'carla.santos', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'carla.santos@clinica.com', 'ESTETICISTA', true);
-- Senha: admin123

-- Categorias
INSERT INTO categoria (nome, descricao, icone, cor, ordem_exibicao) VALUES
('Facial', 'Procedimentos faciais para limpeza, hidratação e rejuvenescimento', 'face', '#FF6B9D', 1),
('Corporal', 'Tratamentos corporais para modelagem e bem-estar', 'body', '#4ECDC4', 2),
('Depilação', 'Serviços de depilação tradicional e a laser', 'spa', '#FFE66D', 3),
('Massagem', 'Massagens terapêuticas e relaxantes', 'massage', '#95E1D3', 4);

-- Procedimentos (exibir_landing_page = true para aparecer no site público)
INSERT INTO procedimento (categoria_id, nome, descricao, duracao_minutos, preco, ativo, exibir_landing_page, preparo_necessario, cuidados_pos, contraindicacoes) VALUES
(1, 'Limpeza de Pele Profunda', 'Limpeza completa com extração de cravos, esfoliação e hidratação profunda', 60, 150.00, true, true, 'Vir sem maquiagem', 'Evitar sol por 24h, usar protetor solar FPS 50+', 'Pele com lesões ativas, acne inflamada'),
(1, 'Peeling Químico', 'Renovação celular profunda com ácidos específicos', 45, 200.00, true, true, 'Pele limpa e sem produtos', 'Usar protetor solar, evitar exposição solar por 7 dias', 'Gravidez, pele sensível'),
(1, 'Hidratação Facial', 'Hidratação profunda com ativos de alta performance', 45, 120.00, true, true, 'Vir sem maquiagem', 'Manter hidratação com produtos indicados', 'Nenhuma'),
(2, 'Drenagem Linfática', 'Redução de inchaço e retenção de líquidos', 60, 120.00, true, true, 'Beber bastante água antes', 'Manter hidratação, evitar sal', 'Trombose, problemas cardíacos'),
(2, 'Massagem Relaxante', 'Massagem corporal para relaxamento muscular', 60, 150.00, true, true, 'Nenhum preparo específico', 'Beber água, descansar', 'Processos inflamatórios agudos'),
(3, 'Depilação a Laser Facial', 'Remoção definitiva de pelos faciais', 30, 180.00, true, true, 'Pele depilada 24h antes', 'Não se expor ao sol por 15 dias', 'Bronzeado recente, tatuagens na área'),
(3, 'Depilação a Laser Axilas', 'Remoção definitiva de pelos das axilas', 20, 120.00, true, true, 'Pele depilada 24h antes', 'Não usar desodorante por 24h', 'Bronzeado recente'),
(4, 'Massagem Modeladora', 'Massagem com manobras específicas para modelagem corporal', 60, 180.00, true, true, 'Nenhum preparo específico', 'Manter atividade física regular', 'Gravidez');

-- Produtos
INSERT INTO produto (nome, descricao, unidade_medida, estoque_minimo, estoque_atual, preco_custo, preco_venda, marca, link_compra, ativo) VALUES
('Gel de Limpeza Facial', 'Gel de limpeza profunda com ácido salicílico', 'ML', 500, 2000, 25.00, 60.00, 'La Roche-Posay', 'https://amazon.com.br/gel-limpeza', true),
('Creme Hidratante Facial', 'Hidratante facial com ácido hialurônico', 'ML', 300, 1500, 35.00, 89.90, 'Neutrogena', 'https://amazon.com.br/hidratante', true),
('Máscara Facial Argila', 'Máscara purificante de argila verde', 'UN', 50, 200, 15.00, 45.00, 'L''Oréal', 'https://amazon.com.br/mascara', true),
('Óleo de Massagem', 'Óleo corporal relaxante de amêndoas', 'ML', 1000, 3000, 20.00, 55.00, 'Weleda', 'https://amazon.com.br/oleo', true),
('Esfoliante Corporal', 'Esfoliante com microesferas', 'ML', 500, 1200, 18.00, 42.00, 'Nivea', 'https://amazon.com.br/esfoliante', true),
('Sérum Anti-idade', 'Sérum com vitamina C e retinol', 'ML', 200, 800, 45.00, 120.00, 'Vichy', 'https://amazon.com.br/serum', true);

-- Associação Procedimento-Produto
INSERT INTO procedimento_produto (procedimento_id, produto_id, quantidade_utilizada) VALUES
-- Limpeza de Pele usa:
(1, 1, 50.0),  -- Gel de Limpeza
(1, 2, 30.0),  -- Hidratante
(1, 3, 1.0),   -- Máscara
-- Hidratação Facial usa:
(3, 2, 40.0),  -- Hidratante
(3, 6, 10.0),  -- Sérum
-- Drenagem usa:
(4, 4, 100.0), -- Óleo de Massagem
-- Massagem Relaxante usa:
(5, 4, 150.0), -- Óleo de Massagem
-- Massagem Modeladora usa:
(8, 4, 120.0), -- Óleo
(8, 5, 80.0);  -- Esfoliante
```

---

## ⚙️ 10. Regras de Negócio {#regras-negocio}

### 10.1 Clientes

**Cadastro:**
- CPF é opcional mas se informado deve ser único e válido
- Email e celular são obrigatórios
- Cadastro pode ser feito com ou sem senha (híbrido)
- Cliente sem senha pode agendar mas não tem acesso à área logada

**Desconto de Primeiro Agendamento:**
- Cliente ganha 10% OFF no primeiro agendamento
- Desconto válido por 30 dias após cadastro
- Aplicado automaticamente ao criar agendamento
- Após utilizar, flag `desconto_utilizado` = TRUE
- Não pode ser utilizado mais de uma vez

**Status:**
- Cliente inativo não pode fazer novos agendamentos
- Ao deletar cliente, verificar se tem agendamentos futuros
- Total gasto atualizado após cada pagamento confirmado
- Última visita atualizada quando agendamento é realizado

### 10.2 Agendamentos

**Criação:**
- Verificar disponibilidade antes de criar
- Não permitir agendamentos em horários já ocupados
- Duração mínima: 15 minutos
- Ao criar, reservar produtos automaticamente (baixa no estoque após realização)
- Calcular automaticamente `data_hora_fim` = `data_hora` + `duracao_minutos`

**Desconto:**
- Verificar se cliente é elegível (primeiro agendamento + dentro validade)
- Se elegível, aplicar 10% automaticamente
- Preencher campos: `valor_desconto`, `tipo_desconto = 'PRIMEIRO_AGENDAMENTO'`
- Calcular `valor_total` = `valor_procedimento` - `valor_desconto`
- Marcar cliente como `desconto_utilizado = TRUE`

**Ciclo de Vida:**
```
AGENDADO (inicial)
    ↓
CONFIRMADO (após confirmação por WhatsApp/Email)
    ↓
REALIZADO (após procedimento concluído)
    
OU

CANCELADO (se cliente cancelou)
NAO_COMPARECEU (se cliente não compareceu)
```

**Notificações:**
- Confirmação: Enviar imediatamente após criar agendamento
- Lembrete 24h antes: Agendar job para enviar
- Lembrete 2h antes: Agendar job para enviar
- Marcar `lembrete_enviado = TRUE` após envio

**Cancelamento:**
- Cliente pode cancelar até 24h antes
- Ao cancelar, liberar produtos reservados
- Registrar motivo no campo `motivo_cancelamento`
- Se foi agendamento com desconto, devolver elegibilidade ao cliente

**Realização:**
- Ao marcar como REALIZADO:
  - Dar baixa automática nos produtos do procedimento
  - Atualizar `ultima_visita` do cliente
  - Se pago, atualizar `total_gasto` do cliente
  - Criar `conta_receber` se não foi à vista

### 10.3 Procedimentos

**Visualização:**
- Públicos (landing page): Apenas procedimentos com `exibir_landing_page = TRUE`
- Preços NÃO são exibidos na landing page
- Admin vê todos os procedimentos com preços

**Gestão:**
- Preço não pode ser negativo
- Duração deve ser múltiplo de 15 minutos
- Procedimento inativo não aparece para agendamento
- Ao inativar, verificar se há agendamentos futuros
- Produtos associados são consumidos automaticamente ao realizar procedimento

### 10.4 Estoque

**Controle:**
- Estoque não pode ficar negativo
- Alerta automático quando `estoque_atual` < `estoque_minimo`
- Enviar notificação WhatsApp para admin quando alerta disparar

**Tipos de Movimentação:**
- **ENTRADA**: Aumenta estoque (compras, devoluções)
- **SAIDA**: Diminui estoque (procedimento realizado, quebra, vencimento)
- **AJUSTE**: Corrige divergências (inventário)

**Baixa Automática:**
- Ao marcar agendamento como REALIZADO
- Sistema busca produtos vinculados ao procedimento
- Para cada produto:
  - Registrar movimentação tipo SAIDA
  - Atualizar `estoque_atual`
  - Verificar se ficou abaixo do mínimo

### 10.5 Financeiro

**Contas a Receber:**
- Criada automaticamente ao confirmar agendamento (se não for à vista)
- Status inicial: PENDENTE
- Ao pagar: `status = PAGO`, `data_pagamento = hoje`
- Se `data_vencimento` < hoje e `status = PENDENTE`: `status = VENCIDO`
- Ao pagar, atualizar `total_gasto` do cliente

**Contas a Pagar:**
- Despesas gerais da clínica
- Categorias: PRODUTOS, ALUGUEL, ENERGIA, AGUA, INTERNET, TELEFONE, IMPOSTOS, SALARIOS, OUTROS
- Status: PENDENTE → PAGO
- Alertar quando próximo ao vencimento (3 dias antes)

**Fluxo de Caixa:**
- Entrada: Contas a receber pagas
- Saída: Contas a pagar pagas
- Saldo = Total Entradas - Total Saídas

### 10.6 Notificações

**WhatsApp:**
- Confirmação de agendamento: Imediato
- Lembrete 24h: Job agendado
- Lembrete 2h: Job agendado
- Alerta estoque baixo: Imediato ao detectar
- Aniversariante: Às 9h do dia do aniversário

**Email:**
- Boas-vindas + cupom 10% OFF: Imediato após cadastro
- Confirmação de agendamento: Imediato
- Lembrete 24h: Job agendado
- Relatórios mensais: Dia 1 de cada mês às 9h

**Regras:**
- Não enviar duplicados (verificar status antes)
- Registrar todas as tentativas na tabela `notificacao`
- Em caso de erro, registrar mensagem de erro
- Retry automático 3x em caso de falha temporária

### 10.7 Disponibilidade de Horários

**Cálculo:**
- Horário de funcionamento: 9h às 18h
- Intervalo de slots: 15 minutos
- Para cada esteticista separadamente
- Considerar duração do procedimento
- Excluir horários já ocupados
- Incluir buffer de 15min entre agendamentos

**Exemplo:**
```
Procedimento: Limpeza de Pele (60min)
Data: 15/10/2025

Ana Paula ocupada: 10h-11h, 14h-15h
Horários disponíveis Ana: 9h, 11h, 12h, 15h, 16h, 17h

Carla Santos ocupada: 9h-10h30, 13h-14h  
Horários disponíveis Carla: 11h, 14h30, 15h30, 16h30
```

### 10.8 Programa de Desconto - Validações

**Ao Criar Agendamento:**
```java
boolean elegivel = cliente.isPrimeiroAgendamento() 
    && !cliente.isDescontoUtilizado()
    && cliente.getDataCadastro().plusDays(30).isAfter(LocalDate.now());

if (elegivel) {
    BigDecimal valorDesconto = valorProcedimento.multiply(new BigDecimal("0.10"));
    agendamento.setValorDesconto(valorDesconto);
    agendamento.setTipoDesconto("PRIMEIRO_AGENDAMENTO");
    agendamento.setValorTotal(valorProcedimento.subtract(valorDesconto));
}
```

**Ao Realizar Agendamento:**
```java
if (agendamento.getTipoDesconto().equals("PRIMEIRO_AGENDAMENTO")) {
    cliente.setDescontoUtilizado(true);
    cliente.setDataDescontoUtilizado(LocalDate.now());
    cliente.setPrimeiroAgendamento(false);
    clienteRepository.save(cliente);
}
```

---

## 🎯 Portas do Sistema

- **Landing Page (Público)**: http://localhost:3000
- **Dashboard Admin**: http://localhost:3000/admin
- **Área Cliente**: http://localhost:3000/cliente
- **Backend API**: http://localhost:8080
- **PostgreSQL**: localhost:5432
- **Swagger UI**: http://localhost:8080/swagger-ui.html

---

## 📝 Comandos Úteis

### Docker
```bash
# Iniciar sistema
docker-compose up -d

# Ver logs
docker-compose logs -f backend

# Parar sistema
docker-compose down

# Rebuild completo
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d

# Backup banco
docker exec clinica-postgres pg_dump -U clinica_user clinica_db > backup.sql
```

### Desenvolvimento
```bash
# Backend (Maven)
cd clinica-estetica-backend
./mvnw spring-boot:run

# Frontend (npm)
cd clinica-estetica-frontend
npm install
npm run dev
```

---

## 🚀 Roadmap de Implementação

### Fase 1 - MVP (4 semanas)
- [ ] Landing page completa e responsiva
- [ ] Sistema de agendamento híbrido (com/sem cadastro)
- [ ] Cadastro rápido com desconto 10% OFF
- [ ] Calendário de disponibilidade
- [ ] Dashboard básico para esteticistas
- [ ] CRUD de clientes, procedimentos, agendamentos

### Fase 2 - Integrações (3 semanas)
- [ ] Integração WhatsApp (notificações)
- [ ] Sistema de emails automáticos
- [ ] Controle de estoque com baixa automática
- [ ] Relatórios financeiros básicos
- [ ] Área do cliente logado

### Fase 3 - Otimizações (3 semanas)
- [ ] Sistema de pacotes
- [ ] Análise de rentabilidade
- [ ] Previsão de faturamento
- [ ] Performance por esteticista
- [ ] Programa de fidelidade
- [ ] Testes automatizados


[Continuação nos próximos comentários devido ao limite de caracteres...]

Gostaria que eu continue com o resto do README atualizado (seções 5-11)?
