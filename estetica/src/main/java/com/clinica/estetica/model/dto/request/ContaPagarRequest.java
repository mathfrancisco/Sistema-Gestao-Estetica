package com.clinica.estetica.model.dto.request;

import com.clinica.estetica.model.enums.FormaPagamento;
import com.clinica.estetica.model.enums.StatusConta;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContaPagarRequest {

    @NotBlank(message = "Descrição é obrigatória")
    private String descricao;

    private String categoria;

    @NotNull(message = "Valor é obrigatório")
    @DecimalMin(value = "0.01", message = "Valor deve ser maior que zero")
    private BigDecimal valor;

    @NotNull(message = "Data de vencimento é obrigatória")
    private LocalDate dataVencimento;

    private LocalDate dataPagamento;
    private StatusConta status;
    private FormaPagamento formaPagamento;
    private String observacoes;
}
