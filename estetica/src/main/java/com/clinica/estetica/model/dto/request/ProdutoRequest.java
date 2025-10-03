package com.clinica.estetica.model.dto.request;

import com.clinica.estetica.model.enums.UnidadeMedida;
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
public class ProdutoRequest {

    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 200)
    private String nome;

    private String descricao;
    private String codigoBarras;

    @NotNull(message = "Unidade de medida é obrigatória")
    private UnidadeMedida unidadeMedida;

    @DecimalMin(value = "0.0", message = "Estoque mínimo não pode ser negativo")
    private BigDecimal estoqueMinimo;

    @DecimalMin(value = "0.0", message = "Estoque atual não pode ser negativo")
    private BigDecimal estoqueAtual;

    @NotNull(message = "Preço de custo é obrigatório")
    @DecimalMin(value = "0.0", message = "Preço de custo não pode ser negativo")
    private BigDecimal precoCusto;

    @DecimalMin(value = "0.0", message = "Preço de venda não pode ser negativo")
    private BigDecimal precoVenda;

    private String marca;
    private String linkCompra;
    private Boolean ativo;
}
