package com.clinica.estetica.model.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "procedimento")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class Procedimento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoria_id")
    private Categoria categoria;

    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 200)
    @Column(nullable = false, length = 200)
    private String nome;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @NotNull(message = "Duração é obrigatória")
    @Min(value = 1, message = "Duração mínima é 1 minuto")
    @Column(name = "duracao_minutos", nullable = false)
    private Integer duracaoMinutos;

    @NotNull(message = "Preço é obrigatório")
    @DecimalMin(value = "0.0", message = "Preço deve ser maior que zero")
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal preco;

    @Column(nullable = false)
    @Builder.Default
    private Boolean ativo = true;

    @Column(name = "preparo_necessario", columnDefinition = "TEXT")
    private String preparoNecessario;

    @Column(name = "cuidados_pos", columnDefinition = "TEXT")
    private String cuidadosPos;

    @Column(columnDefinition = "TEXT")
    private String contraindicacoes;

    @Column(name = "imagem_url", length = 500)
    private String imagemUrl;

    @OneToMany(mappedBy = "procedimento", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProcedimentoProduto> produtosUtilizados = new ArrayList<>();

    @OneToMany(mappedBy = "procedimento", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Agendamento> agendamentos = new ArrayList<>();

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
