package com.clinica.estetica.model.dto.response;

import com.clinica.estetica.model.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioResponse {

    private Long id;
    private String nome;
    private String username;
    private String email;
    private UserRole role;
    private Boolean ativo;
    private LocalDateTime createdAt;
}