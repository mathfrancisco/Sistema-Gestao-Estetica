package com.clinica.estetica.repository;

import com.clinica.estetica.model.entity.ProcedimentoProduto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProcedimentoProdutoRepository extends JpaRepository<ProcedimentoProduto, Long> {
    
    List<ProcedimentoProduto> findByProcedimentoId(Long procedimentoId);
    
    List<ProcedimentoProduto> findByProdutoId(Long produtoId);
    
    @Modifying
    @Query("DELETE FROM ProcedimentoProduto pp WHERE pp.procedimento.id = :procedimentoId")
    void deleteByProcedimentoId(@Param("procedimentoId") Long procedimentoId);
}
