package com.clinica.estetica.model.dto.request;

import jakarta.validation.constraints.*;
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
public class AgendamentoRequest {

    @NotNull(message = "Cliente é obrigatório")
    private Long clienteId;

    @NotNull(message = "Procedimento é obrigatório")
    private Long procedimentoId;

    @NotBlank(message = "Esteticista é obrigatória")
    private String esteticista;

    @NotNull(message = "Data e hora são obrigatórios")
    @Future(message = "Data e hora devem ser no futuro")
    private LocalDateTime dataHora;

    @NotNull(message = "Duração é obrigatória")
    @Min(value = 15, message = "Duração mínima é 15 minutos")
    private Integer duracaoMinutos;

    @DecimalMin(value = "0.0", message = "Desconto não pode ser negativo")
    private BigDecimal valorDesconto;

    private String formaPagamento;

    private String observacoes;
}