package com.clinica.estetica.model.entity;

import com.clinica.estetica.model.enums.UnidadeMedida;
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
@Table(name = "produto", indexes = {
    @Index(name = "idx_produto_codigo_barras", columnList = "codigo_barras")
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class Produto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 200)
    @Column(nullable = false, length = 200)
    private String nome;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Column(name = "codigo_barras", unique = true, length = 50)
    private String codigoBarras;

    @NotNull(message = "Unidade de medida é obrigatória")
    @Enumerated(EnumType.STRING)
    @Column(name = "unidade_medida", nullable = false, length = 10)
    private UnidadeMedida unidadeMedida;

    @Column(name = "estoque_minimo", precision = 10, scale = 3)
    @Builder.Default
    private BigDecimal estoqueMinimo = BigDecimal.ZERO;

    @Column(name = "estoque_atual", precision = 10, scale = 3)
    @Builder.Default
    private BigDecimal estoqueAtual = BigDecimal.ZERO;

    @NotNull(message = "Preço de custo é obrigatório")
    @DecimalMin(value = "0.0", message = "Preço de custo deve ser maior ou igual a zero")
    @Column(name = "preco_custo", nullable = false, precision = 10, scale = 2)
    private BigDecimal precoCusto;

    @Column(name = "preco_venda", precision = 10, scale = 2)
    private BigDecimal precoVenda;

    @Column(length = 100)
    private String marca;

    @Column(name = "link_compra", length = 500)
    private String linkCompra;

    @Column(nullable = false)
    @Builder.Default
    private Boolean ativo = true;

    @OneToMany(mappedBy = "produto", cascade = CascadeType.ALL)
    @Builder.Default
    private List<MovimentacaoEstoque> movimentacoes = new ArrayList<>();

    @OneToMany(mappedBy = "produto", cascade = CascadeType.ALL)
    @Builder.Default
    private List<ProcedimentoProduto> procedimentos = new ArrayList<>();

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
