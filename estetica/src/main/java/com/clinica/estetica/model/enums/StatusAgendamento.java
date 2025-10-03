package com.clinica.estetica.model.enums;

import lombok.Getter;

/**
 * Status do Agendamento
 *
 * FLUXO:
 * PENDENTE → AGENDADO → CONFIRMADO → REALIZADO
 *         ↓
 *      CANCELADO
 */
@Getter
public enum StatusAgendamento {

    /**
     * Aguardando aprovação da esteticista
     * - Cliente solicitou via app/site
     * - Esteticista ainda não validou
     */
    PENDENTE("Pendente", "Aguardando aprovação"),

    /**
     * Aprovado pela esteticista
     * - Horário confirmado pela esteticista
     * - Cliente foi notificado
     */
    AGENDADO("Agendado", "Aprovado pela esteticista"),

    /**
     * Cliente confirmou presença
     * - Cliente confirmou que comparecerá
     * - Lembrete já enviado
     */
    CONFIRMADO("Confirmado", "Cliente confirmou presença"),

    /**
     * Procedimento realizado
     * - Atendimento concluído
     * - Produtos baixados do estoque
     */
    REALIZADO("Realizado", "Procedimento concluído"),

    /**
     * Agendamento cancelado
     * - Pode ser cancelado em qualquer etapa
     * - Motivo deve ser informado
     */
    CANCELADO("Cancelado", "Agendamento cancelado");

    private final String nome;
    private final String descricao;

    StatusAgendamento(String nome, String descricao) {
        this.nome = nome;
        this.descricao = descricao;
    }

    /**
     * Verifica se o status permite edição
     */
    public boolean podeEditar() {
        return this == PENDENTE || this == AGENDADO;
    }

    /**
     * Verifica se o status permite cancelamento
     */
    public boolean podeCancelar() {
        return this != REALIZADO && this != CANCELADO;
    }

    /**
     * Verifica se o status permite confirmação
     */
    public boolean podeConfirmar() {
        return this == AGENDADO;
    }

    /**
     * Verifica se o status permite realização
     */
    public boolean podeRealizar() {
        return this == CONFIRMADO || this == AGENDADO;
    }

    /**
     * Verifica se o status permite aprovação
     */
    public boolean podeAprovar() {
        return this == PENDENTE;
    }

    /**
     * Verifica se é um status ativo (não cancelado/realizado)
     */
    public boolean isAtivo() {
        return this == PENDENTE || this == AGENDADO || this == CONFIRMADO;
    }
}