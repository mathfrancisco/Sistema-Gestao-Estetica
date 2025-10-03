package com.clinica.estetica.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoriaResponse {
    private Long id;
    private String nome;
    private String descricao;
    private String icone;
    private String cor;
    private Boolean ativo;
    private Integer totalProcedimentos;
    private LocalDateTime createdAt;
}
