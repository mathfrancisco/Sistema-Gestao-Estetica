package com.clinica.estetica.mapper;

import com.clinica.estetica.model.dto.response.LoginResponse;
import com.clinica.estetica.model.dto.response.UsuarioResponse;
import com.clinica.estetica.model.entity.Usuario;
import org.springframework.stereotype.Component;

@Component
public class UsuarioMapper {

    /**
     * Converte Usuario para UsuarioResponse
     */
    public UsuarioResponse toResponse(Usuario usuario) {
        if (usuario == null) {
            return null;
        }

        return UsuarioResponse.builder()
                .id(usuario.getId())
                .nome(usuario.getNome())
                .username(usuario.getUsername())
                .email(usuario.getEmail())
                .role(usuario.getRole())
                .ativo(usuario.getAtivo())
                .createdAt(usuario.getCreatedAt())
                .build();
    }

    /**
     * Converte Usuario para LoginResponse.UsuarioResponse
     */
    public LoginResponse.UsuarioResponse toLoginUsuarioResponse(Usuario usuario) {
        if (usuario == null) {
            return null;
        }

        return LoginResponse.UsuarioResponse.builder()
                .id(usuario.getId())
                .nome(usuario.getNome())
                .username(usuario.getUsername())
                .email(usuario.getEmail())
                .role(usuario.getRole().name())
                .build();
    }

    /**
     * Cria LoginResponse completo
     */
    public LoginResponse toLoginResponse(String token, Usuario usuario) {
        return LoginResponse.builder()
                .token(token)
                .type("Bearer")
                .usuario(toLoginUsuarioResponse(usuario))
                .build();
    }
}