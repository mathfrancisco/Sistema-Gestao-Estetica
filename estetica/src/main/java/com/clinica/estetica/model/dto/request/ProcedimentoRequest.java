package com.clinica.estetica.model.dto.request;

import jakarta.validation.constraints.*;
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
public class ProcedimentoRequest {

    private Long categoriaId;

    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 200)
    private String nome;

    private String descricao;

    @NotNull(message = "Duração é obrigatória")
    @Min(value = 1, message = "Duração mínima é 1 minuto")
    private Integer duracaoMinutos;

    @NotNull(message = "Preço é obrigatório")
    @DecimalMin(value = "0.01", message = "Preço deve ser maior que zero")
    private BigDecimal preco;

    private Boolean ativo;
    private String preparoNecessario;
    private String cuidadosPos;
    private String contraindicacoes;
    private String imagemUrl;
    private List<ProdutoUtilizadoRequest> produtosUtilizados;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProdutoUtilizadoRequest {
        @NotNull(message = "Produto é obrigatório")
        private Long produtoId;

        @NotNull(message = "Quantidade é obrigatória")
        @DecimalMin(value = "0.001", message = "Quantidade deve ser maior que zero")
        private BigDecimal quantidadeUtilizada;
    }
}
