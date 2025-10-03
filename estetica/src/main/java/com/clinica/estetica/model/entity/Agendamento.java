package com.clinica.estetica.model.entity;

import com.clinica.estetica.model.enums.FormaPagamento;
import com.clinica.estetica.model.enums.StatusAgendamento;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "agendamento", indexes = {
    @Index(name = "idx_agendamento_cliente", columnList = "cliente_id"),
    @Index(name = "idx_agendamento_data", columnList = "data_hora"),
    @Index(name = "idx_agendamento_status", columnList = "status")
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class Agendamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    @NotNull(message = "Cliente é obrigatório")
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "procedimento_id", nullable = false)
    @NotNull(message = "Procedimento é obrigatório")
    private Procedimento procedimento;

    @NotBlank(message = "Esteticista é obrigatória")
    @Column(nullable = false, length = 100)
    private String esteticista;

    @NotNull(message = "Data e hora são obrigatórias")
    @Column(name = "data_hora", nullable = false)
    private LocalDateTime dataHora;

    @Column(name = "data_hora_fim", nullable = false)
    private LocalDateTime dataHoraFim;

    @NotNull(message = "Duração é obrigatória")
    @Column(name = "duracao_minutos", nullable = false)
    private Integer duracaoMinutos;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Builder.Default
    private StatusAgendamento status = StatusAgendamento.AGENDADO;

    @NotNull(message = "Valor do procedimento é obrigatório")
    @Column(name = "valor_procedimento", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorProcedimento;

    @Column(name = "valor_desconto", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal valorDesconto = BigDecimal.ZERO;

    @NotNull(message = "Valor total é obrigatório")
    @Column(name = "valor_total", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorTotal;

    @Enumerated(EnumType.STRING)
    @Column(name = "forma_pagamento", length = 50)
    private FormaPagamento formaPagamento;

    @Column(nullable = false)
    @Builder.Default
    private Boolean pago = false;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @Column(name = "motivo_cancelamento", columnDefinition = "TEXT")
    private String motivoCancelamento;

    @Column(nullable = false)
    @Builder.Default
    private Boolean confirmado = false;

    @Column(name = "lembrete_enviado", nullable = false)
    @Builder.Default
    private Boolean lembreteEnviado = false;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (dataHoraFim == null && duracaoMinutos != null) {
            dataHoraFim = dataHora.plusMinutes(duracaoMinutos);
        }
        if (valorTotal == null) {
            valorTotal = valorProcedimento.subtract(valorDesconto);
        }
    }
}
