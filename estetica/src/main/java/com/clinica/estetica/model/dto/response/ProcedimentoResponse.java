package com.clinica.estetica.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcedimentoResponse {
    private Long id;
    private Long categoriaId;
    private String categoriaNome;
    private String nome;
    private String descricao;
    private Integer duracaoMinutos;
    private BigDecimal preco;
    private Boolean ativo;
    private String preparoNecessario;
    private String cuidadosPos;
    private String contraindicacoes;
    private String imagemUrl;
    private List<ProdutoUtilizadoResponse> produtosUtilizados;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProdutoUtilizadoResponse {
        private Long produtoId;
        private String produtoNome;
        private BigDecimal quantidadeUtilizada;
    }
}
