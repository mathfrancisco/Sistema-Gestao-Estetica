package com.clinica.estetica.model.dto.response;

import com.clinica.estetica.model.enums.FormaPagamento;
import com.clinica.estetica.model.enums.StatusAgendamento;
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
public class AgendamentoResponse {
    private Long id;
    private Long clienteId;
    private String clienteNome;
    private Long procedimentoId;
    private String procedimentoNome;
    private String esteticista;
    private LocalDateTime dataHora;
    private LocalDateTime dataHoraFim;
    private Integer duracaoMinutos;
    private StatusAgendamento status;
    private BigDecimal valorProcedimento;
    private BigDecimal valorDesconto;
    private BigDecimal valorTotal;
    private FormaPagamento formaPagamento;
    private Boolean pago;
    private String observacoes;
    private String motivoCancelamento;
    private Boolean confirmado;
    private Boolean lembreteEnviado;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
