package com.clinica.estetica.model.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum UserRole {

    ADMIN("Administrador", "Acesso total ao sistema"),
    ESTETICISTA("Esteticista", "Acesso aos módulos operacionais"),
    RECEPCIONISTA("Recepcionista", "Acesso a agendamentos e clientes");

    private final String descricao;
    private final String permissoes;
}