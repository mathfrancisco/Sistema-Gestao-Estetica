package com.clinica.estetica.model.dto.request;

import com.clinica.estetica.model.enums.TipoMovimentacao;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MovimentacaoEstoqueRequest {

    @NotNull(message = "Produto é obrigatório")
    private Long produtoId;

    private Long agendamentoId;

    @NotNull(message = "Tipo de movimentação é obrigatório")
    private TipoMovimentacao tipo;

    @NotNull(message = "Quantidade é obrigatória")
    @DecimalMin(value = "0.001", message = "Quantidade deve ser maior que zero")
    private BigDecimal quantidade;

    @DecimalMin(value = "0.0", message = "Valor unitário não pode ser negativo")
    private BigDecimal valorUnitario;

    private String motivo;
}
