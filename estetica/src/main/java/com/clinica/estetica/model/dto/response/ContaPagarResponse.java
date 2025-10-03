package com.clinica.estetica.model.dto.response;

import com.clinica.estetica.model.enums.FormaPagamento;
import com.clinica.estetica.model.enums.StatusConta;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContaPagarResponse {
    private Long id;
    private String descricao;
    private String categoria;
    private BigDecimal valor;
    private LocalDate dataVencimento;
    private LocalDate dataPagamento;
    private StatusConta status;
    private FormaPagamento formaPagamento;
    private String observacoes;
    private Boolean vencida;
    private Integer diasAtraso;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
