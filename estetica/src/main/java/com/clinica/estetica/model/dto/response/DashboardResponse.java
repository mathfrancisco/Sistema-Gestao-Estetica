package com.clinica.estetica.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {
    private BigDecimal faturamentoHoje;
    private BigDecimal faturamentoMes;
    private Integer agendamentosHoje;
    private Integer agendamentosMes;
    private Integer clientesAtivos;
    private Integer clientesNovos;
    private Integer produtosEstoqueBaixo;
    private Integer contasVencidas;
    private List<AgendamentoResponse> proximosAgendamentos;
    private List<ProcedimentoRanking> topProcedimentos;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProcedimentoRanking {
        private String procedimentoNome;
        private Integer quantidade;
        private BigDecimal faturamento;
    }
}
