package com.clinica.estetica.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoriaRequest {

    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 100)
    private String nome;

    private String descricao;
    private String icone;
    private String cor;
    private Boolean ativo;
}
