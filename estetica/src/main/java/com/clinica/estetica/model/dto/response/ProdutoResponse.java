package com.clinica.estetica.model.dto.response;

import com.clinica.estetica.model.enums.UnidadeMedida;
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
public class ProdutoResponse {
    private Long id;
    private String nome;
    private String descricao;
    private String codigoBarras;
    private UnidadeMedida unidadeMedida;
    private BigDecimal estoqueMinimo;
    private BigDecimal estoqueAtual;
    private BigDecimal precoCusto;
    private BigDecimal precoVenda;
    private String marca;
    private String linkCompra;
    private Boolean ativo;
    private Boolean estoqueAbaixoMinimo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
