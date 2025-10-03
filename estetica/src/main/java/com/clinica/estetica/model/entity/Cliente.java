package com.clinica.estetica.model.entity;

import com.clinica.estetica.model.enums.StatusCliente;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "cliente", indexes = {
    @Index(name = "idx_cliente_cpf", columnList = "cpf"),
    @Index(name = "idx_cliente_status", columnList = "status")
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 200)
    @Column(nullable = false, length = 200)
    private String nome;

    @NotBlank(message = "CPF é obrigatório")
    @Pattern(regexp = "\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}", message = "CPF inválido")
    @Column(unique = true, nullable = false, length = 14)
    private String cpf;

    @Email(message = "Email inválido")
    @Column(length = 150)
    private String email;

    @Column(length = 20)
    private String telefone;

    @Column(length = 20)
    private String celular;

    @Column(name = "data_nascimento")
    private LocalDate dataNascimento;

    @Column(length = 1)
    private String sexo;

    @Column(length = 255)
    private String endereco;

    @Column(length = 100)
    private String cidade;

    @Column(length = 2)
    private String estado;

    @Column(length = 9)
    private String cep;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @Column(name = "restricoes_alergias", columnDefinition = "TEXT")
    private String restricoesAlergias;

    @Column(name = "foto_perfil_url", length = 500)
    private String fotoPerfilUrl;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Builder.Default
    private StatusCliente status = StatusCliente.ATIVO;

    @Column(name = "data_cadastro")
    @Builder.Default
    private LocalDate dataCadastro = LocalDate.now();

    @Column(name = "ultima_visita")
    private LocalDate ultimaVisita;

    @Column(name = "total_gasto", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal totalGasto = BigDecimal.ZERO;

    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Agendamento> agendamentos = new ArrayList<>();

    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ContaReceber> contasReceber = new ArrayList<>();

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
