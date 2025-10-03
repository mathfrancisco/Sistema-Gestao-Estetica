package com.clinica.estetica.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FinanceiroService {

    private final ContaReceberService contaReceberService;
    private final ContaPagarService contaPagarService;

    @Transactional(readOnly = true)
    public Map<String, Object> obterResumoFinanceiro(LocalDate dataInicio, LocalDate dataFim) {
        log.info("Gerando resumo financeiro do período: {} a {}", dataInicio, dataFim);

        BigDecimal totalRecebido = contaReceberService.somarRecebidoPorPeriodo(dataInicio, dataFim);
        BigDecimal totalPago = contaPagarService.somarPagoPorPeriodo(dataInicio, dataFim);
        BigDecimal saldo = totalRecebido.subtract(totalPago);

        Map<String, Object> resumo = new HashMap<>();
        resumo.put("dataInicio", dataInicio);
        resumo.put("dataFim", dataFim);
        resumo.put("totalRecebido", totalRecebido);
        resumo.put("totalPago", totalPago);
        resumo.put("saldo", saldo);
        resumo.put("percentualLucro", calcularPercentualLucro(totalRecebido, totalPago));

        log.debug("Resumo financeiro gerado: Recebido={}, Pago={}, Saldo={}",
                totalRecebido, totalPago, saldo);

        return resumo;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> obterFluxoCaixa(LocalDate dataInicio, LocalDate dataFim) {
        log.info("Gerando fluxo de caixa do período: {} a {}", dataInicio, dataFim);

        var contasReceber = contaReceberService.buscarPorPeriodo(dataInicio, dataFim);
        var contasPagar = contaPagarService.buscarPorPeriodo(dataInicio, dataFim);

        List<Map<String, Object>> entradas = contasReceber.stream()
                .map(conta -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("data", conta.getDataPagamento() != null ?
                            conta.getDataPagamento() : conta.getDataVencimento());
                    item.put("descricao", conta.getDescricao());
                    item.put("valor", conta.getValor());
                    item.put("tipo", "ENTRADA");
                    item.put("status", conta.getStatus());
                    item.put("formaPagamento", conta.getFormaPagamento());
                    return item;
                })
                .sorted(Comparator.comparing(m -> (LocalDate) m.get("data")))
                .collect(Collectors.toList());

        List<Map<String, Object>> saidas = contasPagar.stream()
                .map(conta -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("data", conta.getDataPagamento() != null ?
                            conta.getDataPagamento() : conta.getDataVencimento());
                    item.put("descricao", conta.getDescricao());
                    item.put("valor", conta.getValor());
                    item.put("tipo", "SAIDA");
                    item.put("status", conta.getStatus());
                    item.put("categoria", conta.getCategoria());
                    item.put("formaPagamento", conta.getFormaPagamento());
                    return item;
                })
                .sorted(Comparator.comparing(m -> (LocalDate) m.get("data")))
                .collect(Collectors.toList());

        BigDecimal totalEntradas = entradas.stream()
                .map(m -> (BigDecimal) m.get("valor"))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalSaidas = saidas.stream()
                .map(m -> (BigDecimal) m.get("valor"))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> fluxoCaixa = new HashMap<>();
        fluxoCaixa.put("dataInicio", dataInicio);
        fluxoCaixa.put("dataFim", dataFim);
        fluxoCaixa.put("entradas", entradas);
        fluxoCaixa.put("saidas", saidas);
        fluxoCaixa.put("totalEntradas", totalEntradas);
        fluxoCaixa.put("totalSaidas", totalSaidas);
        fluxoCaixa.put("saldoFinal", totalEntradas.subtract(totalSaidas));

        return fluxoCaixa;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> obterFaturamentoPorMes(int ano) {
        log.info("Gerando faturamento por mês do ano: {}", ano);

        Map<String, BigDecimal> faturamentoPorMes = new LinkedHashMap<>();

        for (int mes = 1; mes <= 12; mes++) {
            YearMonth anoMes = YearMonth.of(ano, mes);
            LocalDate inicio = anoMes.atDay(1);
            LocalDate fim = anoMes.atEndOfMonth();

            BigDecimal faturamento = contaReceberService.somarRecebidoPorPeriodo(inicio, fim);
            faturamentoPorMes.put(anoMes.getMonth().toString(), faturamento);
        }

        BigDecimal totalAno = faturamentoPorMes.values().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> resultado = new HashMap<>();
        resultado.put("ano", ano);
        resultado.put("faturamentoPorMes", faturamentoPorMes);
        resultado.put("totalAno", totalAno);

        return resultado;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> obterDespesasPorCategoria(LocalDate dataInicio, LocalDate dataFim) {
        log.info("Gerando despesas por categoria do período: {} a {}", dataInicio, dataFim);

        var contasPagar = contaPagarService.buscarPorPeriodo(dataInicio, dataFim);

        Map<String, BigDecimal> despesasPorCategoria = contasPagar.stream()
                .collect(Collectors.groupingBy(
                        conta -> conta.getCategoria() != null ? conta.getCategoria() : "SEM_CATEGORIA",
                        Collectors.reducing(BigDecimal.ZERO,
                                conta -> conta.getValor(),
                                BigDecimal::add)
                ));

        BigDecimal totalDespesas = despesasPorCategoria.values().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> resultado = new HashMap<>();
        resultado.put("dataInicio", dataInicio);
        resultado.put("dataFim", dataFim);
        resultado.put("despesasPorCategoria", despesasPorCategoria);
        resultado.put("totalDespesas", totalDespesas);

        return resultado;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> obterFaturamentoPorFormaPagamento(LocalDate dataInicio, LocalDate dataFim) {
        log.info("Gerando faturamento por forma de pagamento do período: {} a {}", dataInicio, dataFim);

        var contasReceber = contaReceberService.buscarPorPeriodo(dataInicio, dataFim);

        Map<String, BigDecimal> faturamentoPorFormaPagamento = contasReceber.stream()
                .filter(conta -> conta.getFormaPagamento() != null)
                .collect(Collectors.groupingBy(
                        conta -> conta.getFormaPagamento(),
                        Collectors.reducing(BigDecimal.ZERO,
                                conta -> conta.getValor(),
                                BigDecimal::add)
                ));

        BigDecimal totalFaturamento = faturamentoPorFormaPagamento.values().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> resultado = new HashMap<>();
        resultado.put("dataInicio", dataInicio);
        resultado.put("dataFim", dataFim);
        resultado.put("faturamentoPorFormaPagamento", faturamentoPorFormaPagamento);
        resultado.put("totalFaturamento", totalFaturamento);

        return resultado;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> obterLucroPorPeriodo(LocalDate dataInicio, LocalDate dataFim) {
        log.info("Calculando lucro do período: {} a {}", dataInicio, dataFim);

        BigDecimal receitas = contaReceberService.somarRecebidoPorPeriodo(dataInicio, dataFim);
        BigDecimal despesas = contaPagarService.somarPagoPorPeriodo(dataInicio, dataFim);
        BigDecimal lucro = receitas.subtract(despesas);
        BigDecimal percentualLucro = calcularPercentualLucro(receitas, despesas);

        Map<String, Object> resultado = new HashMap<>();
        resultado.put("dataInicio", dataInicio);
        resultado.put("dataFim", dataFim);
        resultado.put("receitas", receitas);
        resultado.put("despesas", despesas);
        resultado.put("lucro", lucro);
        resultado.put("percentualLucro", percentualLucro);
        resultado.put("margemLucro", receitas.compareTo(BigDecimal.ZERO) > 0 ?
                lucro.divide(receitas, 4, BigDecimal.ROUND_HALF_UP).multiply(BigDecimal.valueOf(100)) :
                BigDecimal.ZERO);

        return resultado;
    }

    private BigDecimal calcularPercentualLucro(BigDecimal receitas, BigDecimal despesas) {
        if (receitas.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal lucro = receitas.subtract(despesas);
        return lucro.divide(receitas, 4, BigDecimal.ROUND_HALF_UP)
                .multiply(BigDecimal.valueOf(100));
    }
}