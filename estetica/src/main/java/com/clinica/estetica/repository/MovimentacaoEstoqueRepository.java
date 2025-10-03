package com.clinica.estetica.repository;

import com.clinica.estetica.model.entity.MovimentacaoEstoque;
import com.clinica.estetica.model.enums.TipoMovimentacao;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MovimentacaoEstoqueRepository extends JpaRepository<MovimentacaoEstoque, Long> {
    
    List<MovimentacaoEstoque> findByProdutoId(Long produtoId);
    
    Page<MovimentacaoEstoque> findByProdutoId(Long produtoId, Pageable pageable);
    
    List<MovimentacaoEstoque> findByTipo(TipoMovimentacao tipo);
    
    @Query("SELECT m FROM MovimentacaoEstoque m WHERE " +
           "m.dataMovimentacao >= :inicio AND m.dataMovimentacao < :fim " +
           "ORDER BY m.dataMovimentacao DESC")
    List<MovimentacaoEstoque> findByPeriodo(@Param("inicio") LocalDateTime inicio,
                                           @Param("fim") LocalDateTime fim);

    @Query("SELECT m FROM MovimentacaoEstoque m WHERE " +
           "m.produto.id = :produtoId AND " +
           "m.dataMovimentacao >= :inicio AND m.dataMovimentacao < :fim " +
           "ORDER BY m.dataMovimentacao DESC")
    List<MovimentacaoEstoque> findByProdutoIdAndPeriodo(@Param("produtoId") Long produtoId,
                                                        @Param("inicio") LocalDateTime inicio,
                                                        @Param("fim") LocalDateTime fim);
}
