package com.clinica.estetica.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ClienteService clienteService;
    private final AgendamentoService agendamentoService;
    private final ContaReceberService contaReceberService;
    private final ContaPagarService contaPagarService;
    private final EstoqueService estoqueService;
    private final ProcedimentoService procedimentoService;

    @Transactional(readOnly = true)
    public Map<String, Object> obterDadosDashboard() {
        log.info("Gerando dados do dashboard");

        Map<String, Object> dashboard = new HashMap<>();

        // Estatísticas gerais
        dashboard.put("estatisticas", obterEstatisticas());

        // Agendamentos de hoje
        dashboard.put("agendamentosHoje", agendamentoService.buscarAgendamentosHoje());

        // Contas vencidas
        dashboard.put("contasVencidas", contaReceberService.buscarContasVencidas().size());
        dashboard.put("contasPagarVencidas", contaPagarService.buscarContasVencidas().size());

        // Produtos com estoque baixo
        dashboard.put("produtosEstoqueBaixo", estoqueService.contarProdutosEstoqueBaixo());

        // Top procedimentos
        dashboard.put("topProcedimentos", procedimentoService.buscarTopProcedimentos(5));

        // Resumo financeiro
        LocalDate hoje = LocalDate.now();
        LocalDate inicioMes = hoje.withDayOfMonth(1);
        dashboard.put("resumoFinanceiro", obterResumoFinanceiroMes(inicioMes, hoje));

        // Gráfico de faturamento dos últimos 6 meses
        dashboard.put("graficoFaturamento", obterFaturamentoUltimos6Meses());

        // Aniversariantes do dia
        dashboard.put("aniversariantesHoje", clienteService.listarAniversariantesdoDia());

        log.info("Dados do dashboard gerados com sucesso");
        return dashboard;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> obterEstatisticas() {
        log.debug("Obtendo estatísticas do dashboard");

        Map<String, Object> estatisticas = new HashMap<>();

        // Faturamento hoje
        estatisticas.put("faturamentoHoje", contaReceberService.somarReceberHoje());

        // Faturamento mês
        estatisticas.put("faturamentoMes", contaReceberService.somarReceberMes());

        // Agendamentos hoje
        estatisticas.put("agendamentosHoje", agendamentoService.contarAgendamentosHoje());

        // Agendamentos mês
        estatisticas.put("agendamentosMes", agendamentoService.contarAgendamentosMes());

        // Clientes ativos
        estatisticas.put("clientesAtivos", clienteService.contarClientesAtivos());

        // Clientes novos (últimos 30 dias)
        estatisticas.put("clientesNovos", clienteService.contarClientesNovos(30));

        // Produtos com estoque baixo
        estatisticas.put("produtosEstoqueBaixo", estoqueService.contarProdutosEstoqueBaixo());

        // Contas vencidas
        estatisticas.put("contasVencidas", contaReceberService.contarContasVencidas());

        return estatisticas;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> obterResumoFinanceiroMes(LocalDate inicio, LocalDate fim) {
        log.debug("Obtendo resumo financeiro do mês: {} a {}", inicio, fim);

        BigDecimal recebido = contaReceberService.somarRecebidoPorPeriodo(inicio, fim);
        BigDecimal pago = contaPagarService.somarPagoPorPeriodo(inicio, fim);
        BigDecimal saldo = recebido.subtract(pago);

        Map<String, Object> resumo = new HashMap<>();
        resumo.put("totalRecebido", recebido);
        resumo.put("totalPago", pago);
        resumo.put("saldo", saldo);

        return resumo;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> obterFaturamentoUltimos6Meses() {
        log.debug("Obtendo faturamento dos últimos 6 meses");

        LocalDate hoje = LocalDate.now();
        List<Map<String, Object>> dados = new java.util.ArrayList<>();

        for (int i = 5; i >= 0; i--) {
            LocalDate mes = hoje.minusMonths(i);
            LocalDate inicio = mes.withDayOfMonth(1);
            LocalDate fim = mes.withDayOfMonth(mes.lengthOfMonth());

            BigDecimal faturamento = contaReceberService.somarRecebidoPorPeriodo(inicio, fim);

            Map<String, Object> item = new HashMap<>();
            item.put("mes", mes.getMonth().toString());
            item.put("ano", mes.getYear());
            item.put("valor", faturamento);
            dados.add(item);
        }

        Map<String, Object> resultado = new HashMap<>();
        resultado.put("labels", dados.stream()
                .map(d -> d.get("mes") + "/" + d.get("ano"))
                .collect(Collectors.toList()));
        resultado.put("valores", dados.stream()
                .map(d -> d.get("valor"))
                .collect(Collectors.toList()));

        return resultado;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> obterResumoAgendamentos(LocalDate data) {
        log.debug("Obtendo resumo de agendamentos para a data: {}", data);

        var agendamentos = agendamentoService.buscarPorData(data);

        Map<String, Long> porStatus = agendamentos.stream()
                .collect(Collectors.groupingBy(
                        a -> a.getStatus().toString(),
                        Collectors.counting()
                ));

        Map<String, Long> porEsteticista = agendamentos.stream()
                .collect(Collectors.groupingBy(
                        a -> a.getEsteticista(),
                        Collectors.counting()
                ));

        Map<String, Object> resumo = new HashMap<>();
        resumo.put("total", agendamentos.size());
        resumo.put("porStatus", porStatus);
        resumo.put("porEsteticista", porEsteticista);

        return resumo;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> obterAtividadesRecentes(int limit) {
        log.debug("Obtendo {} atividades recentes", limit);

        // Aqui você pode implementar uma lógica para buscar as últimas atividades
        // Por exemplo: últimos agendamentos criados, últimos pagamentos, etc.
        // Para simplificar, vou retornar os últimos agendamentos

        var agendamentos = agendamentoService.buscarAgendamentosHoje();

        return agendamentos.stream()
                .limit(limit)
                .map(a -> {
                    Map<String, Object> atividade = new HashMap<>();
                    atividade.put("tipo", "AGENDAMENTO");
                    atividade.put("descricao", String.format("Agendamento de %s - %s",
                            a.getCliente().getNome(),
                            a.getProcedimento().getNome()));
                    atividade.put("data", a.getDataHora());
                    return atividade;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> obterAlertasGerais() {
        log.debug("Obtendo alertas gerais do sistema");

        Map<String, Object> alertas = new HashMap<>();

        // Alertas de estoque
        long produtosEstoqueBaixo = estoqueService.contarProdutosEstoqueBaixo();
        if (produtosEstoqueBaixo > 0) {
            alertas.put("estoqueBaixo", Map.of(
                    "tipo", "WARNING",
                    "mensagem", produtosEstoqueBaixo + " produto(s) com estoque baixo",
                    "quantidade", produtosEstoqueBaixo
            ));
        }

        // Alertas de contas vencidas
        long contasVencidas = contaReceberService.contarContasVencidas();
        if (contasVencidas > 0) {
            alertas.put("contasVencidas", Map.of(
                    "tipo", "ERROR",
                    "mensagem", contasVencidas + " conta(s) vencida(s)",
                    "quantidade", contasVencidas
            ));
        }

        // Alertas de agendamentos não confirmados
        var agendamentosSemLembrete = agendamentoService.buscarAgendamentosSemLembrete();
        if (!agendamentosSemLembrete.isEmpty()) {
            alertas.put("lembretes", Map.of(
                    "tipo", "INFO",
                    "mensagem", agendamentosSemLembrete.size() + " lembrete(s) pendente(s)",
                    "quantidade", agendamentosSemLembrete.size()
            ));
        }

        return alertas;
    }
}