package com.clinica.estetica.model.dto.response;

import com.clinica.estetica.model.enums.TipoMovimentacao;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MovimentacaoEstoqueResponse {
    private Long id;
    private Long produtoId;
    private String produtoNome;
    private Long agendamentoId;
    private TipoMovimentacao tipo;
    private BigDecimal quantidade;
    private BigDecimal quantidadeAnterior;
    private BigDecimal quantidadeNova;
    private BigDecimal valorUnitario;
    private String motivo;
    private LocalDateTime dataMovimentacao;
    private LocalDateTime createdAt;
}
