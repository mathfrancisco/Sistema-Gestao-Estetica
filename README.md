# 📋 Sistema de Gestão de Clínica de Estética - Documentação Completa

## 📑 Índice
1. [Visão Geral](#visao-geral)
2. [Arquitetura](#arquitetura)
3. [Diagramas](#diagramas)
4. [Estrutura COMPLETA Backend](#estrutura-backend)
5. [Estrutura COMPLETA Frontend](#estrutura-frontend)
6. [Modelos de Dados](#modelos-dados)
7. [Endpoints API](#endpoints-api)
8. [Docker e Configurações](#docker)
9. [Scripts SQL](#scripts-sql)
10. [Regras de Negócio](#regras-negocio)

---

## 🎯 1. Visão Geral

### 1.1 Descrição
Sistema simplificado para gestão de clínica de estética com 2 esteticistas, focado em: clientes, agendamentos, procedimentos, estoque básico e controle financeiro.

### 1.2 Stack Tecnológico

**Backend:**
```
├── Java 17
├── Spring Boot 3.2.5
│   ├── Spring Data JPA
│   ├── Spring Security
│   ├── Spring Validation
│   └── Spring Cache
├── PostgreSQL 15
├── Flyway
├── Lombok
├── MapStruct
└── Maven
```

**Frontend:**
```
├── React 18.2
├── TypeScript 5.0
├── Vite
├── React Router DOM 6
├── TanStack Query
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
├── Nginx
└── GitHub Actions
```

### 1.3 Módulos do Sistema

#### 📋 Clientes
- Cadastro completo com CPF
- Histórico de procedimentos
- Observações e alergias
- Controle de aniversariantes
- Busca avançada

#### 📅 Agendamentos
- Calendário visual
- Confirmação automática (SMS/Email)
- Reagendamento
- Lista de espera
- Controle de não comparecimento

#### 💆 Procedimentos
- Catálogo de serviços
- Categorias
- Produtos utilizados
- Fotos antes/depois
- Duração e preço

#### 📦 Estoque (Simplificado)
- Controle de entrada/saída
- Alertas de estoque mínimo
- Produtos utilizados por procedimento
- Sem controle de fornecedor complexo

#### 💰 Financeiro
- Contas a receber
- Contas a pagar
- Fluxo de caixa
- Formas de pagamento
- Relatórios de faturamento

---

## 🏗️ 2. Arquitetura

### 2.1 Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         React Application (Port 3000)                 │  │
│  │  ┌────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐  │  │
│  │  │Dashboard│ │Clientes  │ │Agenda   │ │Financeiro│  │  │
│  │  │         │ │          │ │         │ │          │  │  │
│  │  └────────┘ └──────────┘ └─────────┘ └──────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                   API GATEWAY - Nginx (Port 80)              │
│         SSL, Rate Limiting, CORS, Compression                │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│               APPLICATION LAYER - Spring Boot                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   CONTROLLERS                         │  │
│  │  Cliente │ Agendamento │ Procedimento │ Estoque      │  │
│  │  Produto │ ContaReceber │ ContaPagar │ Dashboard     │  │
│  └───────────────────────────────────────────────────────┘  │
│                            ↕                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    SERVICES                           │  │
│  │  Business Logic │ Validations │ Transactions          │  │
│  └───────────────────────────────────────────────────────┘  │
│                            ↕                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  REPOSITORIES                         │  │
│  │  Spring Data JPA │ Custom Queries │ Specifications    │  │
│  └───────────────────────────────────────────────────────┘  │
│                            ↕                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    ENTITIES                           │  │
│  │  Cliente │ Agendamento │ Procedimento │ Produto       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│              PERSISTENCE - PostgreSQL (Port 5432)            │
│                   Database: clinica_db                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 3. Diagramas

### 3.1 Diagrama ER Simplificado

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE                              │
├─────────────────────────────────────────────────────────────┤
│ PK │ id                    BIGSERIAL                        │
│    │ nome                  VARCHAR(200)    NOT NULL         │
│    │ cpf                   VARCHAR(14)     UNIQUE NOT NULL  │
│    │ email                 VARCHAR(150)                     │
│    │ telefone              VARCHAR(20)                      │
│    │ celular               VARCHAR(20)                      │
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
│    │ data_hora             TIMESTAMP      NOT NULL          │
│    │ data_hora_fim         TIMESTAMP      NOT NULL          │
│    │ duracao_minutos       INTEGER        NOT NULL          │
│    │ status                VARCHAR(20)    DEFAULT 'AGENDADO'│
│    │ valor_procedimento    DECIMAL(10,2)  NOT NULL          │
│    │ valor_desconto        DECIMAL(10,2)  DEFAULT 0         │
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
│    │ created_at            TIMESTAMP      DEFAULT NOW()     │
│    │ updated_at            TIMESTAMP      DEFAULT NOW()     │
└─────────────────────────────────────────────────────────────┘
        │ N
        │
        │ M
        ↓
┌─────────────────────────────────────────────────────────────┐
│                  PROCEDIMENTO_PRODUTO                       │
├─────────────────────────────────────────────────────────────┤
│ PK │ id                    BIGSERIAL                        │
│ FK │ procedimento_id       BIGINT         NOT NULL          │
│ FK │ produto_id            BIGINT         NOT NULL          │
│    │ quantidade_utilizada  DECIMAL(10,3)  NOT NULL          │
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
│    │ cor                   VARCHAR(7)                       │
│    │ ativo                 BOOLEAN        DEFAULT TRUE      │
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
│    │ forma_pagamento       VARCHAR(50)                      │
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
│    │ valor                 DECIMAL(10,2)  NOT NULL          │
│    │ data_vencimento       DATE           NOT NULL          │
│    │ data_pagamento        DATE                             │
│    │ status                VARCHAR(20)    DEFAULT 'PENDENTE'│
│    │ forma_pagamento       VARCHAR(50)                      │
│    │ observacoes           TEXT                             │
│    │ created_at            TIMESTAMP      DEFAULT NOW()     │
│    │ updated_at            TIMESTAMP      DEFAULT NOW()     │
└─────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│                        USUARIO                              │
├─────────────────────────────────────────────────────────────┤
│ PK │ id                    BIGSERIAL                        │
│    │ nome                  VARCHAR(200)   NOT NULL          │
│    │ username              VARCHAR(50)    UNIQUE NOT NULL   │
│    │ password_hash         VARCHAR(255)   NOT NULL          │
│    │ email                 VARCHAR(150)   UNIQUE NOT NULL   │
│    │ role                  VARCHAR(20)    NOT NULL          │
│    │ ativo                 BOOLEAN        DEFAULT TRUE      │
│    │ created_at            TIMESTAMP      DEFAULT NOW()     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 4. Estrutura COMPLETA do Backend

```
clinica-estetica-backend/
│
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── clinica/
│   │   │           └── estetica/
│   │   │               │
│   │   │               ├── ClinicaEsteticaApplication.java
│   │   │               │
│   │   │               ├── config/
│   │   │               │   ├── SecurityConfig.java
│   │   │               │   ├── JwtAuthenticationFilter.java
│   │   │               │   ├── JwtTokenProvider.java
│   │   │               │   ├── CorsConfig.java
│   │   │               │   ├── SwaggerConfig.java
│   │   │               │   ├── JpaConfig.java
│   │   │               │   ├── CacheConfig.java
│   │   │               │   ├── AsyncConfig.java
│   │   │               │   └── WebConfig.java
│   │   │               │
│   │   │               ├── controller/
│   │   │               │   ├── AuthController.java
│   │   │               │   ├── ClienteController.java
│   │   │               │   ├── AgendamentoController.java
│   │   │               │   ├── ProcedimentoController.java
│   │   │               │   ├── CategoriaController.java
│   │   │               │   ├── ProdutoController.java
│   │   │               │   ├── EstoqueController.java
│   │   │               │   ├── MovimentacaoEstoqueController.java
│   │   │               │   ├── ContaReceberController.java
│   │   │               │   ├── ContaPagarController.java
│   │   │               │   ├── FinanceiroController.java
│   │   │               │   ├── DashboardController.java
│   │   │               │   ├── RelatorioController.java
│   │   │               │   └── UsuarioController.java
│   │   │               │
│   │   │               ├── service/
│   │   │               │   ├── AuthService.java
│   │   │               │   ├── ClienteService.java
│   │   │               │   ├── AgendamentoService.java
│   │   │               │   ├── ProcedimentoService.java
│   │   │               │   ├── CategoriaService.java
│   │   │               │   ├── ProdutoService.java
│   │   │               │   ├── EstoqueService.java
│   │   │               │   ├── MovimentacaoEstoqueService.java
│   │   │               │   ├── ContaReceberService.java
│   │   │               │   ├── ContaPagarService.java
│   │   │               │   ├── FinanceiroService.java
│   │   │               │   ├── DashboardService.java
│   │   │               │   ├── RelatorioService.java
│   │   │               │   ├── NotificacaoService.java
│   │   │               │   ├── EmailService.java
│   │   │               │   ├── SmsService.java
│   │   │               │   └── UsuarioService.java
│   │   │               │
│   │   │               ├── repository/
│   │   │               │   ├── ClienteRepository.java
│   │   │               │   ├── AgendamentoRepository.java
│   │   │               │   ├── ProcedimentoRepository.java
│   │   │               │   ├── CategoriaRepository.java
│   │   │               │   ├── ProdutoRepository.java
│   │   │               │   ├── MovimentacaoEstoqueRepository.java
│   │   │               │   ├── ContaReceberRepository.java
│   │   │               │   ├── ContaPagarRepository.java
│   │   │               │   ├── ProcedimentoProdutoRepository.java
│   │   │               │   └── UsuarioRepository.java
│   │   │               │
│   │   │               ├── model/
│   │   │               │   │
│   │   │               │   ├── entity/
│   │   │               │   │   ├── Cliente.java
│   │   │               │   │   ├── Agendamento.java
│   │   │               │   │   ├── Procedimento.java
│   │   │               │   │   ├── Categoria.java
│   │   │               │   │   ├── Produto.java
│   │   │               │   │   ├── MovimentacaoEstoque.java
│   │   │               │   │   ├── ContaReceber.java
│   │   │               │   │   ├── ContaPagar.java
│   │   │               │   │   ├── ProcedimentoProduto.java
│   │   │               │   │   ├── Usuario.java
│   │   │               │   │   └── Endereco.java (Embeddable)
│   │   │               │   │
│   │   │               │   ├── dto/
│   │   │               │   │   ├── request/
│   │   │               │   │   │   ├── LoginRequest.java
│   │   │               │   │   │   ├── ClienteRequest.java
│   │   │               │   │   │   ├── AgendamentoRequest.java
│   │   │               │   │   │   ├── ProcedimentoRequest.java
│   │   │               │   │   │   ├── ProdutoRequest.java
│   │   │               │   │   │   ├── MovimentacaoEstoqueRequest.java
│   │   │               │   │   │   ├── ContaReceberRequest.java
│   │   │               │   │   │   └── ContaPagarRequest.java
│   │   │               │   │   │
│   │   │               │   │   ├── response/
│   │   │               │   │   │   ├── LoginResponse.java
│   │   │               │   │   │   ├── ClienteResponse.java
│   │   │               │   │   │   ├── AgendamentoResponse.java
│   │   │               │   │   │   ├── ProcedimentoResponse.java
│   │   │               │   │   │   ├── ProdutoResponse.java
│   │   │               │   │   │   ├── EstoqueResponse.java
│   │   │               │   │   │   ├── ContaReceberResponse.java
│   │   │               │   │   │   ├── ContaPagarResponse.java
│   │   │               │   │   │   ├── DashboardResponse.java
│   │   │               │   │   │   └── FluxoCaixaResponse.java
│   │   │               │   │   │
│   │   │               │   │   └── filter/
│   │   │               │   │       ├── ClienteFiltro.java
│   │   │               │   │       ├── AgendamentoFiltro.java
│   │   │               │   │       ├── ProcedimentoFiltro.java
│   │   │               │   │       ├── ProdutoFiltro.java
│   │   │               │   │       └── FinanceiroFiltro.java
│   │   │               │   │
│   │   │               │   └── enums/
│   │   │               │       ├── StatusCliente.java
│   │   │               │       ├── StatusAgendamento.java
│   │   │               │       ├── StatusConta.java
│   │   │               │       ├── TipoMovimentacao.java
│   │   │               │       ├── FormaPagamento.java
│   │   │               │       ├── UnidadeMedida.java
│   │   │               │       ├── TipoNotificacao.java
│   │   │               │       └── UserRole.java
│   │   │               │
│   │   │               ├── mapper/
│   │   │               │   ├── ClienteMapper.java
│   │   │               │   ├── AgendamentoMapper.java
│   │   │               │   ├── ProcedimentoMapper.java
│   │   │               │   ├── ProdutoMapper.java
│   │   │               │   ├── ContaReceberMapper.java
│   │   │               │   └── ContaPagarMapper.java
│   │   │               │
│   │   │               ├── exception/
│   │   │               │   ├── GlobalExceptionHandler.java
│   │   │               │   ├── ResourceNotFoundException.java
│   │   │               │   ├── BusinessException.java
│   │   │               │   ├── ValidationException.java
│   │   │               │   ├── UnauthorizedException.java
│   │   │               │   └── ErrorResponse.java
│   │   │               │
│   │   │               ├── security/
│   │   │               │   ├── UserDetailsServiceImpl.java
│   │   │               │   ├── JwtTokenProvider.java
│   │   │               │   ├── JwtAuthenticationFilter.java
│   │   │               │   └── SecurityUtils.java
│   │   │               │
│   │   │               ├── util/
│   │   │               │   ├── DateUtil.java
│   │   │               │   ├── ValidationUtil.java
│   │   │               │   ├── CpfValidator.java
│   │   │               │   ├── StringUtil.java
│   │   │               │   ├── NumberUtil.java
│   │   │               │   └── PdfGenerator.java
│   │   │               │
│   │   │               └── scheduler/
│   │   │                   ├── AgendamentoScheduler.java
│   │   │                   ├── NotificacaoScheduler.java
│   │   │                   └── BackupScheduler.java
│   │   │
│   │   └── resources/
│   │       ├── application.properties
│   │       ├── application-dev.properties
│   │       ├── application-prod.properties
│   │       │
│   │       ├── db/
│   │       │   └── migration/
│   │       │       ├── V1__create_tables.sql
│   │       │       ├── V2__create_indexes.sql
│   │       │       ├── V3__insert_initial_data.sql
│   │       │       └── V4__alter_tables.sql
│   │       │
│   │       ├── templates/
│   │       │   ├── email/
│   │       │   │   ├── confirmacao-agendamento.html
│   │       │   │   ├── lembrete-agendamento.html
│   │       │   │   └── aniversario.html
│   │       │   │
│   │       │   └── relatorio/
│   │       │       ├── agendamentos.jrxml
│   │       │       ├── faturamento.jrxml
│   │       │       └── clientes.jrxml
│   │       │
│   │       └── static/
│   │           └── logo.png
│   │
│   └── test/
│       └── java/
│           └── com/
│               └── clinica/
│                   └── estetica/
│                       ├── controller/
│                       │   ├── ClienteControllerTest.java
│                       │   ├── AgendamentoControllerTest.java
│                       │   ├── ProcedimentoControllerTest.java
│                       │   └── FinanceiroControllerTest.java
│                       │
│                       ├── service/
│                       │   ├── ClienteServiceTest.java
│                       │   ├── AgendamentoServiceTest.java
│                       │   ├── ProcedimentoServiceTest.java
│                       │   ├── EstoqueServiceTest.java
│                       │   └── FinanceiroServiceTest.java
│                       │
│                       ├── repository/
│                       │   ├── ClienteRepositoryTest.java
│                       │   ├── AgendamentoRepositoryTest.java
│                       │   └── ProdutoRepositoryTest.java
│                       │
│                       └── integration/
│                           ├── ClienteIntegrationTest.java
│                           ├── AgendamentoIntegrationTest.java
│                           └── FinanceiroIntegrationTest.java
│
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
├── pom.xml
├── .gitignore
├── README.md
└── LICENSE
```

---

## 📁 5. Estrutura COMPLETA do Frontend

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
│   │   │   ├── placeholder-user.png
│   │   │   ├── placeholder-procedimento.png
│   │   │   └── background-login.jpg
│   │   │
│   │   └── icons/
│   │       ├── calendar.svg
│   │       ├── client.svg
│   │       ├── finance.svg
│   │       └── product.svg
│   │
│   ├── components/
│   │   │
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
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
│   │   │   └── ClienteStats.tsx
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
│   │   │   └── ListaEspera.tsx
│   │   │
│   │   ├── procedimentos/
│   │   │   ├── ProcedimentoList.tsx
│   │   │   ├── ProcedimentoCard.tsx
│   │   │   ├── ProcedimentoForm.tsx
│   │   │   ├── ProcedimentoDetails.tsx
│   │   │   ├── ProcedimentoCategoria.tsx
│   │   │   ├── ProcedimentoProdutos.tsx
│   │   │   └── ProcedimentoGaleria.tsx
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
│   │   │   └── AlertasGerais.tsx
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
│   │       ├── ForgotPassword.tsx
│   │       ├── ResetPassword.tsx
│   │       └── ProtectedRoute.tsx
│   │
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Clientes.tsx
│   │   ├── ClienteDetalhes.tsx
│   │   ├── NovoCliente.tsx
│   │   ├── EditarCliente.tsx
│   │   ├── Agendamentos.tsx
│   │   ├── Calendario.tsx
│   │   ├── NovoAgendamento.tsx
│   │   ├── Procedimentos.tsx
│   │   ├── ProcedimentoDetalhes.tsx
│   │   ├── NovoProcedimento.tsx
│   │   ├── Produtos.tsx
│   │   ├── ProdutoDetalhes.tsx
│   │   ├── NovoProduto.tsx
│   │   ├── Estoque.tsx
│   │   ├── Movimentacoes.tsx
│   │   ├── Financeiro.tsx
│   │   ├── ContasReceber.tsx
│   │   ├── ContasPagar.tsx
│   │   ├── FluxoCaixa.tsx
│   │   ├── Relatorios.tsx
│   │   ├── Configuracoes.tsx
│   │   ├── Perfil.tsx
│   │   ├── NotFound.tsx
│   │   └── Unauthorized.tsx
│   │
│   ├── services/
│   │   ├── api.ts
│   │   ├── authService.ts
│   │   ├── clienteService.ts
│   │   ├── agendamentoService.ts
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
│   │   └── SidebarContext.tsx
│   │
│   ├── types/
│   │   ├── auth.types.ts
│   │   ├── cliente.types.ts
│   │   ├── agendamento.types.ts
│   │   ├── procedimento.types.ts
│   │   ├── produto.types.ts
│   │   ├── estoque.types.ts
│   │   ├── financeiro.types.ts
│   │   ├── dashboard.types.ts
│   │   ├── relatorio.types.ts
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
│   │   └── animations.css
│   │
│   └── routes/
│       ├── index.tsx
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

## 💾 6. Modelos de Dados Completos

### 6.1 Cliente
```json
{
  "id": 1,
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
  "dataCadastro": "2024-01-15",
  "ultimaVisita": "2025-09-28",
  "totalGasto": 2500.00,
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2025-09-28T14:20:00"
}
```

### 6.2 Agendamento
```json
{
  "id": 1,
  "clienteId": 1,
  "clienteNome": "Maria Silva Santos",
  "procedimentoId": 5,
  "procedimentoNome": "Limpeza de Pele Profunda",
  "esteticista": "Ana Paula",
  "dataHora": "2025-10-15T14:00:00",
  "dataHoraFim": "2025-10-15T15:00:00",
  "duracaoMinutos": 60,
  "status": "CONFIRMADO",
  "valorProcedimento": 150.00,
  "valorDesconto": 15.00,
  "valorTotal": 135.00,
  "formaPagamento": "PIX",
  "pago": true,
  "observacoes": "Cliente solicitou atendimento no período da tarde",
  "confirmado": true,
  "lembreteEnviado": true,
  "createdAt": "2025-10-01T09:15:00",
  "updatedAt": "2025-10-10T16:30:00"
}
```

### 6.3 Procedimento
```json
{
  "id": 1,
  "categoriaId": 1,
  "categoriaNome": "Facial",
  "nome": "Limpeza de Pele Profunda",
  "descricao": "Limpeza completa com extração de cravos e hidratação",
  "duracaoMinutos": 60,
  "preco": 150.00,
  "ativo": true,
  "preparoNecessario": "Vir com rosto limpo, sem maquiagem",
  "cuidadosPos": "Evitar exposição solar por 24h, usar protetor solar",
  "contraindicacoes": "Pele com lesões ativas, acne inflamada",
  "imagemUrl": "https://storage.com/procedimentos/limpeza-pele.jpg",
  "produtosUtilizados": [
    {
      "produtoId": 3,
      "produtoNome": "Gel de Limpeza",
      "quantidadeUtilizada": 50.0
    },
    {
      "produtoId": 5,
      "produtoNome": "Máscara Facial",
      "quantidadeUtilizada": 30.0
    }
  ],
  "createdAt": "2024-01-01T00:00:00",
  "updatedAt": "2024-08-15T10:00:00"
}
```

### 6.4 Produto
```json
{
  "id": 1,
  "nome": "Creme Hidratante Facial Premium",
  "descricao": "Hidratante com ácido hialurônico e vitamina E",
  "codigoBarras": "7891234567890",
  "unidadeMedida": "ML",
  "estoqueMinimo": 10,
  "estoqueAtual": 45,
  "precoCusto": 35.00,
  "precoVenda": 89.90,
  "marca": "La Roche-Posay",
  "linkCompra": "https://amazon.com.br/produto-xyz",
  "ativo": true,
  "createdAt": "2024-01-01T00:00:00",
  "updatedAt": "2025-09-20T15:30:00"
}
```

### 6.5 Movimentação Estoque
```json
{
  "id": 1,
  "produtoId": 1,
  "produtoNome": "Creme Hidratante Facial Premium",
  "agendamentoId": 45,
  "tipo": "SAIDA",
  "quantidade": 50.0,
  "quantidadeAnterior": 500.0,
  "quantidadeNova": 450.0,
  "valorUnitario": 35.00,
  "motivo": "Utilizado em procedimento - Hidratação Facial",
  "dataMovimentacao": "2025-10-02T14:30:00",
  "createdAt": "2025-10-02T14:30:00"
}
```

### 6.6 Conta a Receber
```json
{
  "id": 1,
  "clienteId": 1,
  "clienteNome": "Maria Silva Santos",
  "agendamentoId": 1,
  "descricao": "Limpeza de Pele - Maria Silva",
  "valor": 150.00,
  "dataVencimento": "2025-10-20",
  "dataPagamento": "2025-10-15",
  "status": "PAGO",
  "formaPagamento": "PIX",
  "observacoes": "Pagamento antecipado",
  "createdAt": "2025-10-01T14:30:00",
  "updatedAt": "2025-10-15T10:20:00"
}
```

### 6.7 Conta a Pagar
```json
{
  "id": 1,
  "descricao": "Compra de produtos - Amazon",
  "categoria": "PRODUTOS",
  "valor": 850.00,
  "dataVencimento": "2025-10-15",
  "dataPagamento": null,
  "status": "PENDENTE",
  "formaPagamento": "CARTAO_CREDITO",
  "observacoes": "Pedido #12345 - Produtos para o mês",
  "createdAt": "2025-10-01T11:00:00",
  "updatedAt": "2025-10-01T11:00:00"
}
```

### 6.8 Dashboard Response
```json
{
  "faturamentoHoje": 450.00,
  "faturamentoMes": 12500.00,
  "agendamentosHoje": 8,
  "agendamentosMes": 156,
  "clientesAtivos": 234,
  "clientesNovos": 15,
  "produtosEstoqueBaixo": 3,
  "contasVencidas": 2,
  "proximosAgendamentos": [
    {
      "id": 45,
      "clienteNome": "Maria Silva",
      "procedimentoNome": "Limpeza de Pele",
      "dataHora": "2025-10-02T15:00:00",
      "esteticista": "Ana Paula"
    }
  ],
  "topProcedimentos": [
    {
      "procedimentoNome": "Limpeza de Pele Profunda",
      "quantidade": 45,
      "faturamento": 6750.00
    }
  ],
  "graficoFaturamento": {
    "labels": ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
    "valores": [8500, 9200, 11000, 10500, 12000, 12500]
  }
}
```

---

## 🔌 7. Endpoints da API Completos

### 7.1 Autenticação

```
POST   /api/auth/login              - Login
POST   /api/auth/logout             - Logout
POST   /api/auth/refresh            - Refresh Token
POST   /api/auth/forgot-password    - Esqueci minha senha
POST   /api/auth/reset-password     - Resetar senha
GET    /api/auth/me                 - Dados do usuário logado
```

### 7.2 Clientes

```
GET    /api/clientes                    - Lista todos (paginado)
GET    /api/clientes/{id}               - Busca por ID
POST   /api/clientes                    - Cria novo
PUT    /api/clientes/{id}               - Atualiza
DELETE /api/clientes/{id}               - Remove
GET    /api/clientes/cpf/{cpf}          - Busca por CPF
POST   /api/clientes/buscar             - Busca com filtros
GET    /api/clientes/{id}/historico     - Histórico do cliente
GET    /api/clientes/aniversariantes    - Aniversariantes do mês
PUT    /api/clientes/{id}/inativar      - Inativa cliente
PUT    /api/clientes/{id}/ativar        - Ativa cliente
```

### 7.3 Agendamentos

```
GET    /api/agendamentos                       - Lista todos
GET    /api/agendamentos/{id}                  - Busca por ID
POST   /api/agendamentos                       - Cria novo
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
```

### 7.4 Procedimentos

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

### 7.5 Categorias

```
GET    /api/categorias                   - Lista todas
GET    /api/categorias/{id}              - Busca por ID
POST   /api/categorias                   - Cria nova
PUT    /api/categorias/{id}              - Atualiza
DELETE /api/categorias/{id}              - Remove
```

### 7.6 Produtos

```
GET    /api/produtos                    - Lista todos
GET    /api/produtos/{id}               - Busca por ID
POST   /api/produtos                    - Cria novo
PUT    /api/produtos/{id}               - Atualiza
DELETE /api/produtos/{id}               - Remove
POST   /api/produtos/buscar             - Busca com filtros
GET    /api/produtos/estoque-baixo      - Produtos com estoque baixo
GET    /api/produtos/ativos             - Somente ativos
```

### 7.7 Estoque

```
GET    /api/estoque                          - Dashboard estoque
GET    /api/estoque/movimentacoes            - Lista movimentações
POST   /api/estoque/entrada                  - Registra entrada
POST   /api/estoque/saida                    - Registra saída
POST   /api/estoque/ajuste                   - Ajuste manual
GET    /api/estoque/produto/{id}             - Por produto
GET    /api/estoque/alertas                  - Alertas de estoque
POST   /api/estoque/movimentacoes/buscar     - Busca com filtros
```

### 7.8 Contas a Receber

```
GET    /api/contas-receber                    - Lista todas
GET    /api/contas-receber/{id}               - Busca por ID
POST   /api/contas-receber                    - Cria nova
PUT    /api/contas-receber/{id}               - Atualiza
DELETE /api/contas-receber/{id}               - Remove
PUT    /api/contas-receber/{id}/pagar         - Registra pagamento
POST   /api/contas-receber/buscar             - Busca com filtros
GET    /api/contas-receber/pendentes          - Pendentes
GET    /api/contas-receber/vencidas           - Vencidas
GET    /api/contas-receber/pagas              - Pagas
```

### 7.9 Contas a Pagar

```
GET    /api/contas-pagar                      - Lista todas
GET    /api/contas-pagar/{id}                 - Busca por ID
POST   /api/contas-pagar                      - Cria nova
PUT    /api/contas-pagar/{id}                 - Atualiza
DELETE /api/contas-pagar/{id}                 - Remove
PUT    /api/contas-pagar/{id}/pagar           - Registra pagamento
POST   /api/contas-pagar/buscar               - Busca com filtros
GET    /api/contas-pagar/pendentes            - Pendentes
GET    /api/contas-pagar/vencidas             - Vencidas
GET    /api/contas-pagar/pagas                - Pagas
```

### 7.10 Financeiro

```
GET    /api/financeiro/fluxo-caixa           - Fluxo de caixa
GET    /api/financeiro/resumo                - Resumo financeiro
GET    /api/financeiro/faturamento           - Faturamento por período
GET    /api/financeiro/despesas              - Despesas por período
GET    /api/financeiro/lucro                 - Lucro por período
GET    /api/financeiro/formas-pagamento      - Por forma de pagamento
```

### 7.11 Dashboard

```
GET    /api/dashboard                        - Dashboard geral
GET    /api/dashboard/resumo                 - Resumo rápido
GET    /api/dashboard/faturamento            - Dados faturamento
GET    /api/dashboard/agendamentos           - Dados agendamentos
GET    /api/dashboard/top-procedimentos      - Top procedimentos
GET    /api/dashboard/top-clientes           - Top clientes
```

### 7.12 Relatórios

```
POST   /api/relatorios/faturamento           - Relatório faturamento
POST   /api/relatorios/agendamentos          - Relatório agendamentos
POST   /api/relatorios/clientes              - Relatório clientes
POST   /api/relatorios/procedimentos         - Relatório procedimentos
POST   /api/relatorios/estoque               - Relatório estoque
POST   /api/relatorios/financeiro            - Relatório financeiro
GET    /api/relatorios/{id}/pdf              - Download PDF
GET    /api/relatorios/{id}/excel            - Download Excel
```

---

## 🐳 8. Docker e Configurações

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

### 8.2 Backend Dockerfile

```dockerfile
# Build stage
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Run stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Criar diretórios necessários
RUN mkdir -p /app/logs /app/uploads

# Expor porta
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Executar aplicação
ENTRYPOINT ["java", "-jar", "-Xmx512m", "-Xms256m", "app.jar"]
```

### 8.3 Frontend Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Run stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 8.4 application.properties

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

# Flyway
spring.flyway.enabled=true
spring.flyway.baseline-on-migrate=true
spring.flyway.locations=classpath:db/migration

# JWT
jwt.secret=${JWT_SECRET:sua-chave-secreta-super-forte-aqui}
jwt.expiration=86400000

# Cache
spring.cache.type=simple

# File Upload
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB

# Logging
logging.level.root=INFO
logging.level.com.clinica.estetica=DEBUG
logging.file.name=logs/application.log
logging.pattern.console=%d{yyyy-MM-dd HH:mm:ss} - %msg%n

# Actuator
management.endpoints.web.exposure.include=health,info,metrics
management.endpoint.health.show-details=always

# Time Zone
spring.jackson.time-zone=America/Sao_Paulo
```

### 8.5 nginx.conf

```nginx
server {
    listen 80;
    server_name localhost;

    # Frontend
    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logs
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;
}
```

---

## 📊 9. Scripts SQL Completos

### 9.1 V1__create_tables.sql

```sql
-- TABELA: USUARIO
CREATE TABLE usuario (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA: CLIENTE
CREATE TABLE cliente (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    email VARCHAR(150),
    telefone VARCHAR(20),
    celular VARCHAR(20),
    data_nascimento DATE,
    sexo VARCHAR(1),
    endereco VARCHAR(255),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(9),
    observacoes TEXT,
    restricoes_alergias TEXT,
    foto_perfil_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'ATIVO',
    data_cadastro DATE DEFAULT CURRENT_DATE,
    ultima_visita DATE,
    total_gasto DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA: PROCEDIMENTO
CREATE TABLE procedimento (
    id BIGSERIAL PRIMARY KEY,
    categoria_id BIGINT REFERENCES categoria(id),
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    duracao_minutos INTEGER NOT NULL,
    preco DECIMAL(10,2) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
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
    unidade_medida VARCHAR(10) NOT NULL,
    estoque_minimo DECIMAL(10,3) DEFAULT 0,
    estoque_atual DECIMAL(10,3) DEFAULT 0,
    preco_custo DECIMAL(10,2) NOT NULL,
    preco_venda DECIMAL(10,2),
    marca VARCHAR(100),
    link_compra VARCHAR(500),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA: AGENDAMENTO
CREATE TABLE agendamento (
    id BIGSERIAL PRIMARY KEY,
    cliente_id BIGINT REFERENCES cliente(id),
    procedimento_id BIGINT REFERENCES procedimento(id),
    esteticista VARCHAR(100) NOT NULL,
    data_hora TIMESTAMP NOT NULL,
    data_hora_fim TIMESTAMP NOT NULL,
    duracao_minutos INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'AGENDADO',
    valor_procedimento DECIMAL(10,2) NOT NULL,
    valor_desconto DECIMAL(10,2) DEFAULT 0,
    valor_total DECIMAL(10,2) NOT NULL,
    forma_pagamento VARCHAR(50),
    pago BOOLEAN DEFAULT FALSE,
    observacoes TEXT,
    motivo_cancelamento TEXT,
    confirmado BOOLEAN DEFAULT FALSE,
    lembrete_enviado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA: PROCEDIMENTO_PRODUTO
CREATE TABLE procedimento_produto (
    id BIGSERIAL PRIMARY KEY,
    procedimento_id BIGINT REFERENCES procedimento(id) ON DELETE CASCADE,
    produto_id BIGINT REFERENCES produto(id) ON DELETE CASCADE,
    quantidade_utilizada DECIMAL(10,3) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA: MOVIMENTACAO_ESTOQUE
CREATE TABLE movimentacao_estoque (
    id BIGSERIAL PRIMARY KEY,
    produto_id BIGINT REFERENCES produto(id),
    agendamento_id BIGINT REFERENCES agendamento(id),
    tipo VARCHAR(20) NOT NULL,
    quantidade DECIMAL(10,3) NOT NULL,
    quantidade_anterior DECIMAL(10,3) NOT NULL,
    quantidade_nova DECIMAL(10,3) NOT NULL,
    valor_unitario DECIMAL(10,2),
    motivo TEXT,
    data_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA: CONTA_RECEBER
CREATE TABLE conta_receber (
    id BIGSERIAL PRIMARY KEY,
    cliente_id BIGINT REFERENCES cliente(id),
    agendamento_id BIGINT REFERENCES agendamento(id),
    descricao TEXT NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status VARCHAR(20) DEFAULT 'PENDENTE',
    forma_pagamento VARCHAR(50),
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA: CONTA_PAGAR
CREATE TABLE conta_pagar (
    id BIGSERIAL PRIMARY KEY,
    descricao TEXT NOT NULL,
    categoria VARCHAR(50),
    valor DECIMAL(10,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status VARCHAR(20) DEFAULT 'PENDENTE',
    forma_pagamento VARCHAR(50),
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 9.2 V2__create_indexes.sql

```sql
-- Índices para melhor performance

-- Cliente
CREATE INDEX idx_cliente_cpf ON cliente(cpf);
CREATE INDEX idx_cliente_nome ON cliente USING gin(to_tsvector('portuguese', nome));
CREATE INDEX idx_cliente_status ON cliente(status);
CREATE INDEX idx_cliente_data_cadastro ON cliente(data_cadastro);

-- Agendamento
CREATE INDEX idx_agendamento_cliente ON agendamento(cliente_id);
CREATE INDEX idx_agendamento_procedimento ON agendamento(procedimento_id);
CREATE INDEX idx_agendamento_data ON agendamento(data_hora);
CREATE INDEX idx_agendamento_status ON agendamento(status);
CREATE INDEX idx_agendamento_esteticista ON agendamento(esteticista);
CREATE INDEX idx_agendamento_confirmado ON agendamento(confirmado);

-- Procedimento
CREATE INDEX idx_procedimento_categoria ON procedimento(categoria_id);
CREATE INDEX idx_procedimento_ativo ON procedimento(ativo);
CREATE INDEX idx_procedimento_nome ON procedimento USING gin(to_tsvector('portuguese', nome));

-- Produto
CREATE INDEX idx_produto_codigo_barras ON produto(codigo_barras);
CREATE INDEX idx_produto_ativo ON produto(ativo);
CREATE INDEX idx_produto_estoque_minimo ON produto(estoque_minimo, estoque_atual);

-- Movimentacao Estoque
CREATE INDEX idx_movimentacao_produto ON movimentacao_estoque(produto_id);
CREATE INDEX idx_movimentacao_data ON movimentacao_estoque(data_movimentacao);
CREATE INDEX idx_movimentacao_tipo ON movimentacao_estoque(tipo);

-- Conta Receber
CREATE INDEX idx_conta_receber_cliente ON conta_receber(cliente_id);
CREATE INDEX idx_conta_receber_status ON conta_receber(status);
CREATE INDEX idx_conta_receber_vencimento ON conta_receber(data_vencimento);
CREATE INDEX idx_conta_receber_pagamento ON conta_receber(data_pagamento);

-- Conta Pagar
CREATE INDEX idx_conta_pagar_status ON conta_pagar(status);
CREATE INDEX idx_conta_pagar_vencimento ON conta_pagar(data_vencimento);
CREATE INDEX idx_conta_pagar_categoria ON conta_pagar(categoria);
```

### 9.3 V3__insert_initial_data.sql

```sql
-- Usuário Admin
INSERT INTO usuario (nome, username, password_hash, email, role, ativo) VALUES
('Administrador', 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin@clinica.com', 'ADMIN', true);
-- Senha: admin123

-- Categorias
INSERT INTO categoria (nome, descricao, icone, cor) VALUES
('Facial', 'Procedimentos faciais', 'face', '#FF6B9D'),
('Corporal', 'Procedimentos corporais', 'body', '#4ECDC4'),
('Depilação', 'Serviços de depilação', 'spa', '#FFE66D'),
('Massagem', 'Massagens terapêuticas', 'massage', '#95E1D3');

-- Procedimentos
INSERT INTO procedimento (categoria_id, nome, descricao, duracao_minutos, preco, preparo_necessario, cuidados_pos) VALUES
(1, 'Limpeza de Pele Profunda', 'Limpeza completa com extração de cravos', 60, 150.00, 'Vir sem maquiagem', 'Evitar sol por 24h'),
(1, 'Peeling Químico', 'Renovação celular profunda', 45, 200.00, 'Pele limpa', 'Usar protetor solar'),
(2, 'Drenagem Linfática', 'Redução de inchaço e retenção', 60, 120.00, 'Beber água', 'Manter hidratação'),
(3, 'Depilação a Laser Facial', 'Remoção definitiva de pelos', 30, 180.00, 'Pele depilada', 'Não se expor ao sol');

-- Produtos
INSERT INTO produto (nome, descricao, unidade_medida, estoque_minimo, estoque_atual, preco_custo, preco_venda, marca, link_compra) VALUES
('Gel de Limpeza Facial', 'Gel de limpeza profunda', 'ML', 500, 2000, 25.00, 60.00, 'La Roche-Posay', 'https://amazon.com.br/gel-limpeza'),
('Creme Hidratante', 'Hidratante facial ácido hialurônico', 'ML', 300, 1500, 35.00, 89.90, 'Neutrogena', 'https://amazon.com.br/hidratante'),
('Máscara Facial Argila', 'Máscara purificante', 'UN', 50, 200, 15.00, 45.00, 'L''Oréal', 'https://amazon.com.br/mascara'),
('Óleo de Massagem', 'Óleo corporal relaxante', 'ML', 1000, 3000, 20.00, 55.00, 'Weleda', 'https://amazon.com.br/oleo');

-- Procedimento-Produto (Associações)
INSERT INTO procedimento_produto (procedimento_id, produto_id, quantidade_utilizada) VALUES
(1, 1, 50.0),  -- Limpeza usa Gel de Limpeza
(1, 2, 30.0),  -- Limpeza usa Hidratante
(1, 3, 1.0),   -- Limpeza usa Máscara
(3, 4, 100.0); -- Drenagem usa Óleo
```

---

## ⚙️ 10. Regras de Negócio

### 10.1 Clientes
- CPF deve ser único e válido
- Cliente inativo não pode fazer novos agendamentos
- Ao deletar cliente, verificar se tem agendamentos futuros
- Total gasto é atualizado automaticamente após cada pagamento
- Última visita é atualizada quando agendamento é realizado

### 10.2 Agendamentos
- Não permitir agendamentos em horários já ocupados
- Duração mínima: 15 minutos
- Ao criar agendamento, reservar produtos automaticamente
- Ao cancelar, liberar produtos reservados
- Enviar lembrete 24h antes do agendamento
- Status: AGENDADO → CONFIRMADO → REALIZADO
- Ao realizar, dar baixa nos produtos do estoque

### 10.3 Procedimentos
- Preço não pode ser negativo
- Procedimento inativo não aparece para agendamento
- Ao inativar, verificar agendamentos futuros
- Produtos associados são consumidos automaticamente

### 10.4 Estoque
- Estoque não pode ficar negativo
- Alerta quando estoque < estoque_mínimo
- Movimentações: ENTRADA, SAIDA, AJUSTE
- Entrada aumenta estoque
- Saída diminui estoque (vinculada a agendamento)
- Ajuste corrige divergências

### 10.5 Financeiro
- Conta a receber criada automaticamente com agendamento
- Status: PENDENTE → PAGO ou VENCIDO
- Vencido quando data_vencimento < hoje e status = PENDENTE
- Ao pagar, atualizar total_gasto do cliente
- Contas a pagar: despesas gerais da clínica

---

## 📝 Comandos Docker

### Iniciar sistema
```bash
docker-compose up -d
```

### Ver logs
```bash
docker-compose logs -f
```

### Parar sistema
```bash
docker-compose down
```

### Rebuild completo
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Backup banco de dados
```bash
docker exec clinica-postgres pg_dump -U clinica_user clinica_db > backup.sql
```

---

## 🎯 Portas do Sistema

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **PostgreSQL**: localhost:5432
- **Nginx**: http://localhost:80
- **Swagger UI**: http://localhost:8080/swagger-ui.html

---

